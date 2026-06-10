// Location.tsx — Patient Location Picker Component
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    PermissionsAndroid,
    Linking,
    Alert,
    Keyboard,
    KeyboardEvent,
    SafeAreaView,
    Dimensions,
} from 'react-native';
import Toast from 'react-native-toast-message';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import Geocoder from 'react-native-geocoding';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    isTablet,
    SPACING,
    FONT_SIZE,
    LAYOUT,
    moderateScale,
    isIOS,
    SCREEN_WIDTH,
} from '../utils/responsive';

// ─── Config ──────────────────────────────────────────────────────────────────
const GOOGLE_API_KEY = 'AIzaSyCrmF3351j82RVuTZbVBJ-X3ufndylJsvo';
Geocoder.init(GOOGLE_API_KEY);

// ─── Types ───────────────────────────────────────────────────────────────────
export interface PatientLocation {
    address: string;
    pincode: string;
    city: string;
    state: string;
    country: string;
    latitude: string;
    longitude: string;
    floorFlat?: string;
    building: string;
    landmark:string
}

interface Errors {
    address?: string;
    pincode?: string;
    city?: string;
    state?: string;
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface LocationProps {
    /** Called when user confirms a location */
    onLocationSelected?: (location: PatientLocation) => void;
    /** Initial location to prefill (e.g. from saved profile) */
    initialLocation?: Partial<PatientLocation>;
    /** If true, shows a "Save & Continue" button at bottom */
    showConfirmButton?: boolean;
    /** Label for the confirm button */
    confirmLabel?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const DEFAULT_LAT = 20.5937;
const DEFAULT_LNG = 78.9629;
const MAP_DELTA = isTablet ? 0.03 : 0.02;
const DEBOUNCE_MS = 600;
const MAX_RETRIES = 3;

const isInIndia = (latitude: number, longitude: number) =>
    latitude >= 6.554607 && latitude <= 35.674545 && longitude >= 68.111378 && longitude <= 97.395561;

const isBlankCoord = (v?: string) =>
    !v || v.trim() === '' || Number.isNaN(Number(v));

const isDefaultIndia = (lat?: string, lng?: string) =>
    lat === String(DEFAULT_LAT) && lng === String(DEFAULT_LNG);

const hasValidCoords = (loc?: Partial<PatientLocation>) => {
    if (!loc) return false;
    if (isBlankCoord(loc.latitude) || isBlankCoord(loc.longitude)) return false;
    if (isDefaultIndia(loc.latitude, loc.longitude)) return false;
    return true;
};

let markerImage: number | null = null;
try {
    markerImage = require('../../assets/marker.png');
} catch {
    markerImage = null;
}

// ─── Component ───────────────────────────────────────────────────────────────
const Location: React.FC<LocationProps> = ({
    onLocationSelected,
    initialLocation,
    showConfirmButton = true,
    confirmLabel = 'Confirm Location',
}) => {
    // ── State ────────────────────────────────────────────────────────────────
    const [location, setLocation] = useState<PatientLocation>({
        address: initialLocation?.address || '',
        pincode: initialLocation?.pincode || '',
        city: initialLocation?.city || '',
        state: initialLocation?.state || '',
        country: initialLocation?.country || 'India',
        latitude: initialLocation?.latitude || String(DEFAULT_LAT),
        longitude: initialLocation?.longitude || String(DEFAULT_LNG),
    });

    const [errors, setErrors] = useState<Errors>({});
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [loading, setLoading] = useState(false);

    // Search
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);

    // Map
    const mapRef = useRef<MapView>(null);
    const [pointerCoords, setPointerCoords] = useState<{ latitude: number; longitude: number } | null>(null);

    // Debounce / retry refs (avoid stale closures)
    const reverseGeoDebounceRef = useRef<NodeJS.Timeout | null>(null);
    const retryCountRef = useRef(0);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastAutoSelectedRef = useRef('');

    // Keyboard
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    // ── Cleanup ──────────────────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
            if (reverseGeoDebounceRef.current) clearTimeout(reverseGeoDebounceRef.current);
        };
    }, []);

    // ── Keyboard listeners ───────────────────────────────────────────────────
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
        const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    // ── Auto-detect on mount (only when no valid initial coords) ─────────
    useEffect(() => {
        if (!hasValidCoords(initialLocation)) {
            detectCurrentLocation();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Permission ───────────────────────────────────────────────────────────
    const requestLocationPermission = async (): Promise<boolean> => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: 'Location Permission',
                        message: 'We need your location to show nearby services and accurate address.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch {
                return false;
            }
        }
        return true; // iOS asks automatically
    };

    // ── Reverse Geocode ──────────────────────────────────────────────────────
    const fetchAddressFromCoords = useCallback(
        async (latitude: number, longitude: number, updateState = true) => {
            setIsFetchingLocation(true);
            try {
                const response = await Geocoder.from(latitude, longitude);
                if (response.results && response.results.length > 0) {
                    const result = response.results[0];
                    const components = result.address_components;

                    let address = '';
                    let city = '';
                    let state = '';
                    let pincode = '';
                    let country = 'India';

                    components.forEach((c: any) => {
                        if (c.types.includes('street_number') || c.types.includes('route')) {
                            address += c.long_name + ' ';
                        }
                        if (c.types.includes('locality')) city = c.long_name;
                        if (c.types.includes('administrative_area_level_1')) state = c.long_name;
                        if (c.types.includes('postal_code')) pincode = c.long_name;
                        if (c.types.includes('country')) country = c.long_name;
                    });

                    address = address.trim() || result.formatted_address;

                    if (updateState) {
                        const key = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
                        if (lastAutoSelectedRef.current !== key) {
                            lastAutoSelectedRef.current = key;

                            setLocation(prev => ({
                                ...prev,
                                address,
                                pincode,
                                city,
                                state,
                                country,
                                latitude: latitude.toString(),
                                longitude: longitude.toString(),
                            }));
                            setSearchQuery(address);
                            retryCountRef.current = 0;
                        }
                    }
                } else {
                    Toast.show({ type: 'error', text1: 'Error', text2: 'Could not determine address', position: 'top', visibilityTime: 3000 });
                }
            } catch {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch address details', position: 'top', visibilityTime: 3000 });
            } finally {
                setIsFetchingLocation(false);
            }
        },
        []
    );

    // ── Detect GPS ───────────────────────────────────────────────────────────
    const detectCurrentLocation = useCallback(async () => {
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
            Alert.alert(
                'Permission Denied',
                'Location permission is required to detect your current location.',
                [
                    { text: 'Open Settings', onPress: () => Linking.openSettings() },
                    { text: 'OK', style: 'cancel' },
                ]
            );
            return;
        }

        setIsFetchingLocation(true);

        Geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;

                if (!isInIndia(latitude, longitude)) {
                    Alert.alert(
                        'Location Outside India',
                        'Your location appears to be outside India (commonly occurs on emulators/simulators). Would you like to use a mock location in India (Hyderabad) for testing?',
                        [
                            {
                                text: 'Use Mock Location',
                                onPress: () => {
                                    const mockLat = 17.4156;
                                    const mockLng = 78.4347;
                                    const mockRegion: Region = {
                                        latitude: mockLat,
                                        longitude: mockLng,
                                        latitudeDelta: MAP_DELTA,
                                        longitudeDelta: MAP_DELTA,
                                    };
                                    setLocation(prev => ({
                                        ...prev,
                                        latitude: mockLat.toString(),
                                        longitude: mockLng.toString(),
                                    }));
                                    setPointerCoords({ latitude: mockLat, longitude: mockLng });
                                    if (mapRef.current) {
                                        requestAnimationFrame(() => {
                                            mapRef.current?.animateToRegion(mockRegion, 800);
                                        });
                                    }
                                    fetchAddressFromCoords(mockLat, mockLng);
                                }
                            },
                            {
                                text: 'Select Manually',
                                style: 'cancel',
                                onPress: () => setIsFetchingLocation(false)
                            }
                        ]
                    );
                    return;
                }

                const newRegion: Region = {
                    latitude,
                    longitude,
                    latitudeDelta: MAP_DELTA,
                    longitudeDelta: MAP_DELTA,
                };

                setLocation(prev => ({
                    ...prev,
                    latitude: latitude.toString(),
                    longitude: longitude.toString(),
                }));

                setPointerCoords({ latitude, longitude });

                if (mapRef.current) {
                    requestAnimationFrame(() => {
                        mapRef.current?.animateToRegion(newRegion, 800);
                    });
                }

                fetchAddressFromCoords(latitude, longitude);
            },
            (error) => {
                setIsFetchingLocation(false);

                let errorMessage = 'Unable to fetch current location.';
                if (error.code === error.PERMISSION_DENIED) {
                    errorMessage = 'Location permission denied.';
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    errorMessage = 'Location information is unavailable.';
                } else if (error.code === error.TIMEOUT) {
                    errorMessage = 'Location request timed out.';
                }

                if (retryCountRef.current < MAX_RETRIES) {
                    retryCountRef.current += 1;
                    Toast.show({
                        type: 'info',
                        text1: 'Getting Location',
                        text2: `Trying again… Attempt ${retryCountRef.current} of ${MAX_RETRIES}`,
                        position: 'top',
                        visibilityTime: 2000,
                    });
                    retryTimeoutRef.current = setTimeout(() => detectCurrentLocation(), 2000);
                } else {
                    Alert.alert(
                        'Location Error',
                        `${errorMessage} Please enable location services or select manually.`,
                        [
                            { text: 'Open Settings', onPress: () => Linking.openSettings() },
                            {
                                text: 'Try Again', onPress: () => {
                                    retryCountRef.current = 0;
                                    detectCurrentLocation();
                                }
                            },
                            { text: 'Select Manually', style: 'cancel' },
                        ]
                    );
                }
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    }, [fetchAddressFromCoords]);

    // ── Search Places ────────────────────────────────────────────────────────
    const handleSearch = useCallback(async (query: string) => {
        setSearchQuery(query);

        if (query.length < 3) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        try {
            const res = await fetch(
                `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
                    query
                )}&key=${GOOGLE_API_KEY}&components=country:in`
            );
            const data = await res.json();
            if (data.status === 'OK') {
                setSearchResults(data.predictions);
                setShowSearchResults(true);
            } else {
                setSearchResults([]);
            }
        } catch {
            setSearchResults([]);
        }
    }, []);

    // ── Select search result ─────────────────────────────────────────────────
    const handleSelectSearchResult = useCallback(
        async (result: any) => {
            setSearchQuery(result.description);
            setShowSearchResults(false);
            setIsFetchingLocation(true);

            try {
                const res = await fetch(
                    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${result.place_id}&key=${GOOGLE_API_KEY}`
                );
                const data = await res.json();

                if (data.status === 'OK') {
                    const place = data.result;
                    const { lat: latitude, lng: longitude } = place.geometry.location;

                    // Ensure it's in India
                    const countryComp = (place.address_components || []).find((c: any) =>
                        (c.types || []).includes('country')
                    );
                    if (!countryComp || countryComp.short_name !== 'IN') {
                        Alert.alert('Invalid Location', 'Please select a location within India.');
                        setIsFetchingLocation(false);
                        return;
                    }

                    const newRegion: Region = {
                        latitude,
                        longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    };

                    setLocation(prev => ({
                        ...prev,
                        latitude: latitude.toString(),
                        longitude: longitude.toString(),
                    }));

                    setPointerCoords({ latitude, longitude });

                    if (mapRef.current) {
                        mapRef.current.animateToRegion(newRegion, 500);
                    }

                    fetchAddressFromCoords(latitude, longitude);
                }
            } catch {
                Alert.alert('Error', 'Unable to fetch place details. Please try again.');
            } finally {
                setIsFetchingLocation(false);
            }
        },
        [fetchAddressFromCoords]
    );

    // ── Map interactions ─────────────────────────────────────────────────────
    const handleRegionChangeComplete = useCallback(
        (r: Region) => {
            setPointerCoords({ latitude: r.latitude, longitude: r.longitude });

            setLocation(prev => ({
                ...prev,
                latitude: String(Number(r.latitude.toFixed(6))),
                longitude: String(Number(r.longitude.toFixed(6))),
            }));

            setErrors(prev => {
                const next = { ...prev };
                delete next.address;
                return next;
            });

            setShowSearchResults(false);

            // Debounced reverse-geocode
            if (reverseGeoDebounceRef.current) clearTimeout(reverseGeoDebounceRef.current);
            reverseGeoDebounceRef.current = setTimeout(() => {
                const key = `${r.latitude.toFixed(6)},${r.longitude.toFixed(6)}`;
                if (lastAutoSelectedRef.current !== key) {
                    fetchAddressFromCoords(r.latitude, r.longitude);
                }
            }, DEBOUNCE_MS);
        },
        [fetchAddressFromCoords]
    );

    const handleMapPress = useCallback(
        (event: any) => {
            const { coordinate } = event.nativeEvent;
            const { latitude, longitude } = coordinate;

            if (!isInIndia(latitude, longitude)) {
                Alert.alert('Invalid Location', 'Please select a location within India.');
                return;
            }

            setLocation(prev => ({
                ...prev,
                latitude: latitude.toString(),
                longitude: longitude.toString(),
            }));

            setPointerCoords({ latitude, longitude });

            const newRegion: Region = {
                latitude,
                longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };

            if (mapRef.current) {
                mapRef.current.animateToRegion(newRegion, 500);
            }

            fetchAddressFromCoords(latitude, longitude);
        },
        [fetchAddressFromCoords]
    );

    const handleMyLocation = useCallback(async () => {
        retryCountRef.current = 0;
        await detectCurrentLocation();
    }, [detectCurrentLocation]);

    // ── Input change ─────────────────────────────────────────────────────────
    const handleInputChange = (field: keyof PatientLocation, value: string) => {
        setLocation(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: undefined }));
    };

    // ── Validation ───────────────────────────────────────────────────────────
    const validate = (): boolean => {
        const newErrors: Errors = {};
        if (!location.address.trim()) newErrors.address = 'Address is required';
        if (!location.pincode.trim()) newErrors.pincode = 'Pincode is required';
        else if (!/^\d{6}$/.test(location.pincode)) newErrors.pincode = 'Enter a valid 6-digit pincode';
        if (!location.city.trim()) newErrors.city = 'City is required';
        if (!location.state.trim()) newErrors.state = 'State is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ── Confirm ──────────────────────────────────────────────────────────────
    const handleConfirm = async () => {
        if (!validate()) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please fill all required fields', position: 'top', visibilityTime: 3000 });
            return;
        }

        setLoading(true);
        try {
            // Save location locally
            await AsyncStorage.setItem('patientLocation', JSON.stringify(location));

            if (onLocationSelected) {
                onLocationSelected(location);
            }

            Toast.show({ type: 'success', text1: 'Location Saved', text2: 'Your location has been updated', position: 'top', visibilityTime: 2000 });
        } catch {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to save location', position: 'top', visibilityTime: 3000 });
        } finally {
            setLoading(false);
        }
    };

    // ── Derived values ───────────────────────────────────────────────────────
    const mapLat = parseFloat(location.latitude) || DEFAULT_LAT;
    const mapLng = parseFloat(location.longitude) || DEFAULT_LNG;

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={styles.flex}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Header ─────────────────────────── */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>📍 Set Your Location</Text>
                        <Text style={styles.headerSubtitle}>
                            We use your location to show nearby doctors and services
                        </Text>
                    </View>

                    {/* ── Search Bar ─────────────────────── */}
                    <View style={styles.searchContainer}>
                        <View style={styles.searchRow}>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search for area, street, landmark…"
                                placeholderTextColor="#999"
                                value={searchQuery}
                                onChangeText={handleSearch}
                                returnKeyType="search"
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity
                                    style={styles.clearBtn}
                                    onPress={() => {
                                        setSearchQuery('');
                                        setSearchResults([]);
                                        setShowSearchResults(false);
                                    }}
                                >
                                    <Text style={styles.clearBtnText}>✕</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Search results dropdown */}
                        {showSearchResults && searchResults.length > 0 && (
                            <View style={styles.searchResults}>
                                <ScrollView
                                    style={styles.searchResultsScroll}
                                    keyboardShouldPersistTaps="handled"
                                    nestedScrollEnabled
                                >
                                    {searchResults.map((result, idx) => (
                                        <TouchableOpacity
                                            key={result.place_id || idx}
                                            style={styles.searchResultItem}
                                            onPress={() => handleSelectSearchResult(result)}
                                        >
                                            <Text style={styles.searchResultIcon}>📍</Text>
                                            <View style={styles.searchResultTextWrap}>
                                                <Text style={styles.searchResultMain} numberOfLines={1}>
                                                    {result.structured_formatting?.main_text || result.description}
                                                </Text>
                                                <Text style={styles.searchResultSecondary} numberOfLines={1}>
                                                    {result.structured_formatting?.secondary_text || ''}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>

                    {/* ── Map ────────────────────────────── */}
                    <View style={styles.mapContainer}>
                        <MapView
                            ref={mapRef}
                            style={styles.map}
                            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                            initialRegion={{
                                latitude: mapLat,
                                longitude: mapLng,
                                latitudeDelta: MAP_DELTA,
                                longitudeDelta: MAP_DELTA,
                            }}
                            onRegionChangeComplete={handleRegionChangeComplete}
                            onPress={handleMapPress}
                            showsUserLocation
                            showsMyLocationButton={false}
                            loadingEnabled
                            mapPadding={{ top: 0, right: 0, bottom: 0, left: 0 }}
                        >
                            {pointerCoords && (
                                <Marker
                                    coordinate={pointerCoords}
                                    title="Selected Location"
                                    description={location.address || 'Drag map to adjust'}
                                    image={markerImage ?? undefined}
                                />
                            )}
                        </MapView>

                        {/* My Location button */}
                        <TouchableOpacity
                            style={styles.myLocationBtn}
                            onPress={handleMyLocation}
                            disabled={isFetchingLocation}
                        >
                            {isFetchingLocation ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.myLocationIcon}>◎</Text>
                            )}
                        </TouchableOpacity>

                        {/* Loading overlay */}
                        {isFetchingLocation && (
                            <View style={styles.mapOverlay}>
                                <ActivityIndicator size="large" color="#0066FF" />
                                <Text style={styles.mapOverlayText}>Detecting location…</Text>
                            </View>
                        )}
                    </View>

                    {/* ── Address Details ─────────────────── */}
                    <View style={styles.formContainer}>
                        <Text style={styles.sectionTitle}>Address Details</Text>

                        {/* Address */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Address *</Text>
                            <TextInput
                                style={[styles.input, errors.address && styles.inputError]}
                                value={location.address}
                                onChangeText={v => handleInputChange('address', v)}
                                placeholder="Full address"
                                placeholderTextColor="#999"
                                multiline
                            />
                            {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
                        </View>

                        {/* Pincode & City row */}
                        <View style={styles.row}>
                            <View style={[styles.fieldGroup, styles.halfField]}>
                                <Text style={styles.label}>Pincode *</Text>
                                <TextInput
                                    style={[styles.input, errors.pincode && styles.inputError]}
                                    value={location.pincode}
                                    onChangeText={v => handleInputChange('pincode', v)}
                                    placeholder="6-digit"
                                    placeholderTextColor="#999"
                                    keyboardType="number-pad"
                                    maxLength={6}
                                />
                                {errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}
                            </View>

                            <View style={[styles.fieldGroup, styles.halfField]}>
                                <Text style={styles.label}>City *</Text>
                                <TextInput
                                    style={[styles.input, errors.city && styles.inputError]}
                                    value={location.city}
                                    onChangeText={v => handleInputChange('city', v)}
                                    placeholder="City"
                                    placeholderTextColor="#999"
                                />
                                {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
                            </View>
                        </View>

                        {/* State & Country row */}
                        <View style={styles.row}>
                            <View style={[styles.fieldGroup, styles.halfField]}>
                                <Text style={styles.label}>State *</Text>
                                <TextInput
                                    style={[styles.input, errors.state && styles.inputError]}
                                    value={location.state}
                                    onChangeText={v => handleInputChange('state', v)}
                                    placeholder="State"
                                    placeholderTextColor="#999"
                                />
                                {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
                            </View>

                            <View style={[styles.fieldGroup, styles.halfField]}>
                                <Text style={styles.label}>Country</Text>
                                <TextInput
                                    style={[styles.input, styles.inputDisabled]}
                                    value={location.country}
                                    editable={false}
                                />
                            </View>
                        </View>

                        {/* Coordinates info */}
                        {hasValidCoords(location) && (
                            <View style={styles.coordsCard}>
                                <Text style={styles.coordsLabel}>📌 Selected Coordinates</Text>
                                <Text style={styles.coordsValue}>
                                    {parseFloat(location.latitude).toFixed(6)}, {parseFloat(location.longitude).toFixed(6)}
                                </Text>
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* ── Bottom Button ───────────────────── */}
                {showConfirmButton && !keyboardVisible && (
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
                            onPress={handleConfirm}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.confirmBtnText}>{confirmLabel}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    flex: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: SPACING.xxl,
    },

    // Header
    header: {
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.sm,
    },
    headerTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: SPACING.xxs,
    },
    headerSubtitle: {
        fontSize: FONT_SIZE.sm,
        color: '#64748B',
        lineHeight: moderateScale(20),
    },

    // Search
    searchContainer: {
        paddingHorizontal: SPACING.md,
        marginBottom: SPACING.sm,
        zIndex: 10,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: LAYOUT.borderRadius.lg,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: SPACING.sm,
        ...LAYOUT.shadow.sm,
    },
    searchInput: {
        flex: 1,
        height: moderateScale(44),
        fontSize: FONT_SIZE.sm,
        color: '#1E293B',
    },
    clearBtn: {
        padding: SPACING.xs,
    },
    clearBtnText: {
        fontSize: FONT_SIZE.md,
        color: '#94A3B8',
        fontWeight: '600',
    },
    searchResults: {
        position: 'absolute',
        top: moderateScale(50),
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: LAYOUT.borderRadius.md,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        maxHeight: moderateScale(200),
        ...LAYOUT.shadow.md,
        zIndex: 20,
    },
    searchResultsScroll: {
        maxHeight: moderateScale(200),
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    searchResultIcon: {
        fontSize: moderateScale(16),
        marginRight: SPACING.sm,
    },
    searchResultTextWrap: {
        flex: 1,
    },
    searchResultMain: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: '#1E293B',
    },
    searchResultSecondary: {
        fontSize: FONT_SIZE.xs,
        color: '#94A3B8',
        marginTop: 2,
    },

    // Map
    mapContainer: {
        marginHorizontal: SPACING.md,
        height: isTablet ? moderateScale(300) : moderateScale(220),
        borderRadius: LAYOUT.borderRadius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: SPACING.md,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    myLocationBtn: {
        position: 'absolute',
        bottom: SPACING.md,
        right: SPACING.md,
        width: moderateScale(44),
        height: moderateScale(44),
        borderRadius: moderateScale(22),
        backgroundColor: '#0066FF',
        justifyContent: 'center',
        alignItems: 'center',
        ...LAYOUT.shadow.md,
    },
    myLocationIcon: {
        fontSize: moderateScale(20),
        color: '#fff',
    },
    mapOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapOverlayText: {
        marginTop: SPACING.xs,
        fontSize: FONT_SIZE.sm,
        color: '#0066FF',
        fontWeight: '500',
    },

    // Form
    formContainer: {
        paddingHorizontal: SPACING.md,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: SPACING.md,
    },
    fieldGroup: {
        marginBottom: SPACING.sm,
    },
    label: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: SPACING.xxs,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: LAYOUT.borderRadius.md,
        paddingHorizontal: SPACING.sm,
        paddingVertical: Platform.OS === 'ios' ? SPACING.sm : SPACING.xs,
        fontSize: FONT_SIZE.sm,
        color: '#1E293B',
        minHeight: moderateScale(44),
    },
    inputError: {
        borderColor: '#EF4444',
        borderWidth: 1.5,
    },
    inputDisabled: {
        backgroundColor: '#F1F5F9',
        color: '#94A3B8',
    },
    errorText: {
        fontSize: FONT_SIZE.xxs,
        color: '#EF4444',
        marginTop: 2,
    },
    row: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    halfField: {
        flex: 1,
    },

    // Coords card
    coordsCard: {
        backgroundColor: '#EFF6FF',
        borderRadius: LAYOUT.borderRadius.md,
        padding: SPACING.sm,
        marginTop: SPACING.xs,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    coordsLabel: {
        fontSize: FONT_SIZE.xs,
        color: '#3B82F6',
        fontWeight: '600',
    },
    coordsValue: {
        fontSize: FONT_SIZE.xs,
        color: '#1E40AF',
        fontWeight: '500',
    },

    // Footer
    footer: {
        padding: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
    },
    confirmBtn: {
        backgroundColor: '#0066FF',
        borderRadius: LAYOUT.borderRadius.lg,
        paddingVertical: SPACING.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: moderateScale(50),
        ...LAYOUT.shadow.sm,
    },
    confirmBtnDisabled: {
        opacity: 0.6,
    },
    confirmBtnText: {
        color: '#fff',
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
    },
});

export default Location;