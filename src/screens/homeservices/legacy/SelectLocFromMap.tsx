import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  PermissionsAndroid,
  Platform,
  FlatList,
  ActivityIndicator,
  Linking,
} from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import Geocoder from 'react-native-geocoding';
import NetInfo from '@react-native-community/netinfo';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp, RouteProp } from '@react-navigation/stack';

// Import responsive utilities
import {
  responsiveWidth,
  responsiveText,
  verticalScale,
  moderateScale,
  SAFE_AREA,
  isTablet,
  PLATFORM,
} from '../../../utils/responsive';

// Initialize Geocoder with your Google Maps API key
Geocoder.init('AIzaSyCrmF3351j82RVuTZbVBJ-X3ufndylJsvo');

// Custom Icons
const BackIcon = () => <Text style={styles.iconText}>←</Text>;
const SearchIcon = () => <Text style={styles.searchIcon}>🔍</Text>;
const CloseIcon = () => <Text style={styles.closeIcon}>×</Text>;
const LocationIcon = () => <Text style={styles.locationIconText}>📍</Text>;
const MyLocationIcon = () => <Text style={styles.myLocationText}>📍</Text>;

// Define navigation and route types
type RootStackParamList = {
  SelectLocFromMap: {
    doctor: any;
    date: string;
    time: string;
    mode: string;
    reason: string;
    reports: any;
    patient: any;
  };
  HomeAddress: {
    doctor: any;
    date: string;
    time: string;
    mode: string;
    reason: string;
    reports: any;
    patient: any;
    selectedAddress?: AddressFormData;
  };
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'SelectLocFromMap'>;
type RoutePropType = RouteProp<RootStackParamList, 'SelectLocFromMap'>;

type AddressFormData = {
  building: string;
  floorFlat?: string;
  street: string;
  landmark?: string;
  pincode: string;
  cityState: string;
};

type SearchResult = {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
};

const SelectLocFromMap: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { doctor, date, time, mode, reason, reports, patient } = route.params;

  // State management
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [region, setRegion] = useState<Region>({
    latitude: 17.385044, // Default to Hyderabad
    longitude: 78.486671,
    latitudeDelta: isTablet ? 0.02 : 0.01,
    longitudeDelta: isTablet ? 0.02 : 0.01,
  });
  const [selectedLocation, setSelectedLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [selectedAddressData, setSelectedAddressData] = useState<AddressFormData | null>(null);
  const mapRef = useRef<MapView>(null);
  const searchInputRef = useRef<TextInput>(null);
  const [, setIsMapReady] = useState(false);
  const [isMapMoving, setIsMapMoving] = useState(false);
  const [locationRetryCount, setLocationRetryCount] = useState(0);
  const locationRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check network connectivity
  const checkNetwork = async () => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      Alert.alert('Network Error', 'No internet connection. Please check your network and try again.');
      return false;
    }
    return true;
  };


  // Check location permission (permission is already requested in HomeServices)
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return granted;
      } catch (err) {
        return false;
      }
    }
    // On iOS, permission was already requested via Geolocation.requestAuthorization() in HomeServices
    return true;
  };

  // Fetch address from coordinates
  const fetchAddress = async (latitude: number, longitude: number) => {
    setIsFetching(true);
    try {
      const response = await Geocoder.from(latitude, longitude);

      if (response.results && response.results.length > 0) {
        const result = response.results[0];
        const formattedAddress = result.formatted_address;

        setAddress(formattedAddress);
        setSearchQuery(formattedAddress);

        // Parse address components into AddressFormData
        const addressComponents = result.address_components;
        let building = '';
        let street = '';
        let cityState = '';
        let pincode = '';

        addressComponents.forEach((component) => {
          const types = component.types;
          if (types.includes('premise') || types.includes('establishment')) {
            building = component.long_name;
          } else if (types.includes('route')) {
            street = component.long_name;
          } else if (types.includes('locality') && types.includes('political')) {
            cityState = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            cityState = cityState ? `${cityState}, ${component.long_name}` : component.long_name;
          } else if (types.includes('postal_code')) {
            pincode = component.long_name;
          }
        });

        // Fallback if specific components are missing
        if (!building && !street) {
          building = formattedAddress.split(',')[0]?.trim() || formattedAddress;
          street = formattedAddress;
        }

        const addressData: AddressFormData = {
          building: building || formattedAddress,
          street: street || formattedAddress,
          cityState: cityState || 'Unknown',
          pincode: pincode || '000000',
        };

        setSelectedAddressData(addressData);
      } else {
        setAddress('No address available');
        setSelectedAddressData(null);
        Alert.alert('Error', 'No address found for the selected location.');
      }
    } catch (error) {
      setAddress('Failed to fetch address');
      setSelectedAddressData(null);
      Alert.alert('Error', 'Unable to fetch address. Please try again.');
    } finally {
      setIsFetching(false);
    }
  };

  // Alternative method for getting location with different settings
  const initLocationWithRetry = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    // Use different settings for retry
    const retryOptions = {
      enableHighAccuracy: locationRetryCount > 1, // Try high accuracy on second retry
      timeout: 20000, // Longer timeout
      maximumAge: 30000, // Accept older locations
    };

    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: isTablet ? 0.02 : 0.01,
          longitudeDelta: isTablet ? 0.02 : 0.01,
        };
        setRegion(newRegion);
        setSelectedLocation({ latitude, longitude });
        mapRef.current?.animateToRegion(newRegion, 1000);
        fetchAddress(latitude, longitude);
        
        // Reset retry count on success
        setLocationRetryCount(0);
      },
      () => {
        setIsFetching(false);

        // If this retry also failed, try the original method again
        if (locationRetryCount < 3) {
          setLocationRetryCount(prev => prev + 1);
          setTimeout(() => initLocation(), 2000);
        }
      },
      retryOptions
    );
  };

  // Initialize map with current location
  const initLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Denied',
        'Location permission is required to show your current location.',
        [
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
          { text: 'OK', style: 'cancel' },
        ]
      );
      return;
    }

    const hasNetwork = await checkNetwork();
    if (!hasNetwork) return;

    setIsFetching(true);

    // Configure high accuracy for better indoor positioning
    const locationOptions = {
      enableHighAccuracy: true,
      timeout: 15000, // 15 seconds timeout
      maximumAge: 10000, // Accept cached location up to 10 seconds old
    };

    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: isTablet ? 0.02 : 0.01,
          longitudeDelta: isTablet ? 0.02 : 0.01,
        };
        setRegion(newRegion);
        setSelectedLocation({ latitude, longitude });
        mapRef.current?.animateToRegion(newRegion, 1000);
        fetchAddress(latitude, longitude);
        
        // Reset retry count on success
        setLocationRetryCount(0);
      },
      (error) => {
        // Handle different error codes
        let errorMessage = 'Unable to fetch current location.';

        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'Location permission denied. Please enable location permissions in settings.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = 'Location information is unavailable. This might be due to being indoors or poor signal.';
        } else if (error.code === error.TIMEOUT) {
          errorMessage = 'Location request timed out. Please try again.';
        }

        // If we're indoors or have poor GPS, try again with a different approach
        if (locationRetryCount < 3) {
          setLocationRetryCount(prev => prev + 1);

          // Retry after a delay with different settings
          locationRetryTimeoutRef.current = setTimeout(() => {
            initLocationWithRetry();
          }, 2000);
        } else {
          Alert.alert(
            'Location Error',
            `${errorMessage} Please ensure location services are enabled and try again, or select a location manually.`,
            [
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
              {
                text: 'Try Again', onPress: () => {
                  setLocationRetryCount(0);
                  initLocation();
                }
              },
              { text: 'Select Manually', style: 'cancel' },
            ]
          );
        }

        setIsFetching(false);
      },
      locationOptions
    );
  };

  useEffect(() => {
    initLocation();

    // Clean up any pending timeouts when component unmounts
    return () => {
      if (locationRetryTimeoutRef.current) {
        clearTimeout(locationRetryTimeoutRef.current);
      }
    };
  }, []);

  // Handle search input
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const hasNetwork = await checkNetwork();
      if (!hasNetwork) {
        setIsSearching(false);
        return;
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query
        )}&key=AIzaSyCrmF3351j82RVuTZbVBJ-X3ufndylJsvo&components=country:in`
      );

      const data = await response.json();
      if (data.status === 'OK') {
        setSearchResults(data.predictions);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        Alert.alert('Error', 'No search results found.');
      }
    } catch (error) {
      setSearchResults([]);
      Alert.alert('Error', 'Unable to perform search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle selecting a search result
  const handleSelectSearchResult = async (result: SearchResult) => {
    setSearchQuery(result.description);
    setShowSearchResults(false);
    setIsFetching(true);

    try {
      const hasNetwork = await checkNetwork();
      if (!hasNetwork) {
        setIsFetching(false);
        return;
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${result.place_id}&key=AIzaSyCrmF3351j82RVuTZbVBJ-X3ufndylJsvo`
      );

      const data = await response.json();
      if (data.status === 'OK') {
        const place = data.result;
        const location = place.geometry.location;
        const latitude = location.lat;
        const longitude = location.lng;

        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: isTablet ? 0.02 : 0.01,
          longitudeDelta: isTablet ? 0.02 : 0.01,
        };
        setRegion(newRegion);
        setSelectedLocation({ latitude, longitude });
        mapRef.current?.animateToRegion(newRegion, 500);
        fetchAddress(latitude, longitude);
      } else {
        Alert.alert('Error', 'Unable to fetch place details.');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to fetch place details. Please try again.');
    } finally {
      setIsFetching(false);
    }
  };

  // Handle map press to select a location
  const handleMapPress = (e: any) => {
    const { coordinate } = e.nativeEvent;
    setSelectedLocation(coordinate);

    const newRegion = {
      ...region,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 500);
    fetchAddress(coordinate.latitude, coordinate.longitude);
    setShowSearchResults(false);
    searchInputRef.current?.blur();
  };

  // Handle map drag end to update location
  const handleMapDragEnd = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    fetchAddress(latitude, longitude);
  };

  // Handle region change complete (when map stops moving)
  const handleRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
    
    // Only update address if the map was moving (not just initial load)
    if (isMapMoving && selectedLocation) {
      // Update the selected location to the center of the map
      const centerLocation = {
        latitude: newRegion.latitude,
        longitude: newRegion.longitude
      };
      setSelectedLocation(centerLocation);
      fetchAddress(newRegion.latitude, newRegion.longitude);
    }
    
    setIsMapMoving(false);
  };

  // Handle region change start (when map starts moving)
  const handleRegionChangeStart = () => {
    setIsMapMoving(true);
  };

  // Move to current location
  const handleMyLocation = async () => {
    setLocationRetryCount(0);
    await initLocation();
  };

  // Confirm location and navigate
  const handleUseLocation = () => {
    if (address && !isFetching && selectedAddressData) {
      navigation.navigate('HomeAddress', {
        doctor,
        date,
        time,
        mode,
        reason,
        reports,
        patient,
        selectedAddress: selectedAddressData,
      });
    } else {
      Alert.alert('Error', 'Please wait for the address to load or select a valid location.');
    }
  };

  // Clear search input
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Render search result item
  const renderSearchItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.searchItem}
      onPress={() => handleSelectSearchResult(item)}
    >
      <Text style={styles.searchItemMainText}>
        {item.structured_formatting.main_text}
      </Text>
      <Text style={styles.searchItemSecondaryText}>
        {item.structured_formatting.secondary_text}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Search Container */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <SearchIcon />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search for an address or location"
            placeholderTextColor="#A0AEC0"
            value={searchQuery}
            onChangeText={handleSearch}
            onFocus={() => searchQuery.length >= 3 && setShowSearchResults(true)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <CloseIcon />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results */}
        {showSearchResults && (
          <View style={styles.searchResultsContainer}>
            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#3182CE" />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                renderItem={renderSearchItem}
                keyExtractor={(item) => item.place_id}
                style={styles.searchResultsList}
                keyboardShouldPersistTaps="handled"
              />
            ) : (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>No results found</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Map Container */}
      <View style={[styles.mapContainer, { zIndex: 0 }]}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          onPress={handleMapPress}
          onMapReady={() => setIsMapReady(true)}
          onRegionChangeComplete={handleRegionChangeComplete}
          onRegionChangeStart={handleRegionChangeStart}
          showsUserLocation={true}
          showsMyLocationButton={false}
          mapType={Platform.OS === 'ios' ? 'standard' : undefined}
          pointerEvents="auto"
        >
          {selectedLocation && (
            <Marker
              coordinate={selectedLocation}
              title="Selected Location"
              description={address || 'Fetching address...'}
              draggable
              onDragEnd={handleMapDragEnd}
            />
          )}
        </MapView>
        
        {/* Custom marker in center of map */}
        <View style={styles.markerFixed}>
          <View style={styles.marker}>
            <View style={styles.markerInner} />
          </View>
        </View>
        
        <View style={styles.zoomControls}>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() =>
              mapRef.current?.animateToRegion({
                ...region,
                latitudeDelta: Math.max(region.latitudeDelta * 0.5, 0.0001),
                longitudeDelta: Math.max(region.longitudeDelta * 0.5, 0.0001),
              })
            }
          >
            <Text style={styles.zoomText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() =>
              mapRef.current?.animateToRegion({
                ...region,
                latitudeDelta: region.latitudeDelta * 2,
                longitudeDelta: region.longitudeDelta * 2,
              })
            }
          >
            <Text style={styles.zoomText}>−</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.myLocationButton} onPress={handleMyLocation}>
          <MyLocationIcon />
        </TouchableOpacity>
      </View>

      {/* Location status indicator */}
      {isFetching && (
        <View style={styles.locationStatus}>
          <ActivityIndicator size="small" color="#3182CE" />
          <Text style={styles.locationStatusText}>
            {locationRetryCount > 0
              ? `Getting location (attempt ${locationRetryCount + 1})...`
              : 'Getting your location...'
            }
          </Text>
        </View>
      )}

      {/* Location Info */}
      <View style={styles.locationInfo}>
        <View style={styles.locationRow}>
          <LocationIcon />
          <View style={styles.locationText}>
            <Text style={styles.locationTitle}>Selected Location</Text>
            <Text style={styles.locationAddress}>
              {isFetching ? 'Fetching address...' : address || 'No address available'}
            </Text>
            <Text style={styles.locationNote}>Tap on the map to select a location</Text>
          </View>
        </View>
      </View>

      {/* Use Location Button */}
      <TouchableOpacity
        style={[styles.useLocationButton, (!selectedAddressData || isFetching) && styles.useLocationButtonDisabled]}
        onPress={handleUseLocation}
        disabled={!address || isFetching}
      >
        <Text style={styles.useLocationText}>Use This Location</Text>
      </TouchableOpacity>

      {/* Bottom Note */}
      <Text style={styles.bottomText}>
        Make sure the pin is placed at your exact location for accurate services
      </Text>
    </View>
  );
};

// Responsive Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: PLATFORM.STATUS_BAR_HEIGHT,
  },
  searchContainer: {
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: verticalScale(12),
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: verticalScale(48),
  },
  searchInput: {
    flex: 1,
    paddingVertical: verticalScale(12),
    fontSize: responsiveText(16),
    color: '#2D3748',
    marginLeft: moderateScale(8),
  },
  searchIcon: {
    fontSize: responsiveText(16),
    color: '#A0AEC0',
  },
  closeIcon: {
    fontSize: responsiveText(20),
    color: '#A0AEC0',
    padding: moderateScale(4),
  },
  searchResultsContainer: {
    position: 'absolute',
    top: '100%',
    left: responsiveWidth(4),
    right: responsiveWidth(4),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: verticalScale(4),
    maxHeight: verticalScale(200),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 20,
  },
  searchResultsList: {
    flex: 1,
  },
  searchItem: {
    padding: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchItemMainText: {
    fontSize: responsiveText(14),
    fontWeight: '500',
    color: '#2D3748',
  },
  searchItemSecondaryText: {
    fontSize: responsiveText(12),
    color: '#718096',
    marginTop: verticalScale(2),
  },
  loadingContainer: {
    padding: moderateScale(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: moderateScale(8),
    color: '#718096',
    fontSize: responsiveText(14),
  },
  noResultsContainer: {
    padding: moderateScale(16),
    alignItems: 'center',
  },
  noResultsText: {
    color: '#718096',
    fontSize: responsiveText(14),
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    marginTop: verticalScale(8),
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  // Custom marker styles
  markerFixed: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: moderateScale(-24),
    marginTop: moderateScale(-48),
    zIndex: 15,
  },
  marker: {
    height: moderateScale(48),
    width: moderateScale(48),
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerInner: {
    height: moderateScale(24),
    width: moderateScale(24),
    backgroundColor: '#3182CE',
    borderWidth: moderateScale(3),
    borderColor: 'white',
    borderRadius: moderateScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
  zoomControls: {
    position: 'absolute',
    right: responsiveWidth(4),
    top: '30%',
    zIndex: 15,
  },
  zoomButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(4),
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: verticalScale(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  zoomText: {
    fontSize: responsiveText(18),
    color: '#4A5568',
    fontWeight: 'bold',
  },
  myLocationButton: {
    position: 'absolute',
    bottom: verticalScale(20),
    right: responsiveWidth(4),
    width: moderateScale(50),
    height: moderateScale(50),
    backgroundColor: '#3182CE',
    borderRadius: moderateScale(25),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 15,
  },
  myLocationText: {
    fontSize: responsiveText(20),
    color: '#FFFFFF',
  },
  // Location status indicator
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(12),
    backgroundColor: '#EBF8FF',
    marginHorizontal: responsiveWidth(4),
    marginTop: verticalScale(8),
    borderRadius: moderateScale(4),
  },
  locationStatusText: {
    marginLeft: moderateScale(8),
    fontSize: responsiveText(12),
    color: '#3182CE',
  },
  locationInfo: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: verticalScale(16),
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIconText: {
    fontSize: responsiveText(20),
    color: '#3182CE',
    marginRight: moderateScale(12),
    marginTop: verticalScale(2),
  },
  locationText: {
    flex: 1,
  },
  locationTitle: {
    fontSize: responsiveText(16),
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: verticalScale(4),
  },
  locationAddress: {
    fontSize: responsiveText(14),
    color: '#4A5568',
    marginBottom: verticalScale(4),
    lineHeight: verticalScale(20),
  },
  locationNote: {
    fontSize: responsiveText(12),
    color: '#718096',
  },
  useLocationButton: {
    backgroundColor: '#00203F',
    marginHorizontal: responsiveWidth(4),
    marginVertical: verticalScale(16),
    paddingVertical: verticalScale(16),
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: verticalScale(56),
  },
  useLocationButtonDisabled: {
    backgroundColor: '#CBD5E0',
  },
  useLocationText: {
    color: '#FFFFFF',
    fontSize: responsiveText(16),
    fontWeight: '600',
  },
  bottomText: {
    textAlign: 'center',
    fontSize: responsiveText(12),
    color: '#718096',
    paddingHorizontal: responsiveWidth(4),
    paddingBottom: verticalScale(16) + SAFE_AREA.safeBottom,
    marginBottom: SAFE_AREA.safeBottom,
  },
  iconText: {
    fontSize: responsiveText(20),
    color: '#4A5568',
  },
});

export default SelectLocFromMap;