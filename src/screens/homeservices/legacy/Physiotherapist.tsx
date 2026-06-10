import React, { useEffect, useState } from 'react';
import { UsePost, ENDPOINTS } from '../../../services';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/navigationTypes';
;
import { useSelector } from 'react-redux';
import { formatDoctorName } from '../../../utils/util';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import responsive utilities
import {
  isTablet,
  isSmallDevice,
  SPACING,
  LAYOUT,
  moderateScale,
  SAFE_AREA,
} from '../../../utils/responsive';

type PhysiotherapistRouteProp = RouteProp<RootStackParamList, 'Physiotherapist'>;

interface PhysiotherapistProps {
  route: PhysiotherapistRouteProp;
  navigation: StackNavigationProp<RootStackParamList, 'Physiotherapist'>;
}

interface Doctor {
  id: number;
  userId?: number;
  firstname: string;
  lastname?: string;
  specialization: {
    name: string;
    experience: string;
  };
  experience?: string;
  location: string;
  consultationFee: number;
  consultationModeFee?: any;
  image: string;
  isFavorite: boolean;
  addresses?: any;
  profilepic?: any;
}

// Translations for multiple languages
const translations: any = {
  en: {
    searchPlaceholder: 'Search...',
    loadingText: 'Loading experts...',
    experience: 'Experience',
    consultationFees: 'Consultation Fees',
    bookNow: 'Book Now',
    noDoctorsFound: 'No doctors found for this specialty.',
    errorFetchingDoctors: 'An error occurred while fetching doctors.',
  },
  hi: {
    searchPlaceholder: 'खोजें...',
    loadingText: 'विशेषज्ञ लोड हो रहे हैं...',
    experience: 'अनुभव',
    consultationFees: 'परामर्श शुल्क',
    bookNow: 'बुक करें',
    noDoctorsFound: 'इस विशेषता के लिए कोई डॉक्टर नहीं मिले।',
    errorFetchingDoctors: 'डॉक्टरों को प्राप्त करने में एक त्रुटि हुई।',
  },
  tel: {
    searchPlaceholder: 'వెతకండి...',
    loadingText: 'నిపుణులను లోడ్ చేయడం...',
    experience: 'అనుభవం',
    consultationFees: 'సంప్రదింపు రుసుము',
    bookNow: 'ఇప్పుడే బుక్ చేయండి',
    noDoctorsFound: 'ఈ స్పెషాలిటీ కోసం డాక్టర్లు ఎవరూ కనుగొనబడలేదు.',
    errorFetchingDoctors: 'డాక్టర్లను పొందడంలో లోపం సంభవించింది.',
  },
};

const Physiotherapist: React.FC<PhysiotherapistProps> = ({ route, navigation }) => {
  const { serviceType } = route.params;
  const [searchQuery, setSearchQuery] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Get user details from Redux for language preference
  const user = useSelector((state: any) => state.currentUser);
  const appLanguage = user?.appLanguage || 'en';
  
  // Pick translation set
  const t = translations[appLanguage] || translations.en;

const getAvatarSource = (profilepic: any) => {
  if (!profilepic) return null;

  try {
    if (typeof profilepic === 'string' && profilepic.startsWith('http')) {
      return { uri: profilepic };
    }
    return null;
  } catch (error) {
    return null;
  }
};

  const getAvatarInitial = (doctor: Doctor) => {
    return (doctor?.firstname?.[0] || '').toUpperCase();
  };

  // Fetch doctors using UsePost
  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return ;
      const specialty = serviceType === 'Physiotherapist' ? 'Physiotherapist' : serviceType;
      const res = await UsePost(ENDPOINTS.GET_DOCTORS_BY_SPECIALIZATION, { specialization: specialty });      
      if (res?.status === 'success' && res?.data?.success) {
        const doctorsList = res?.data?.data || [];        
        const transformedDoctors: Doctor[] = doctorsList.map((doctor: any) => ({
          id: doctor._id || doctor.userId,
          userId: doctor.userId,
          firstname: doctor.firstname || '',
          lastname: doctor.lastname || '',
          specialization: {
            name: doctor.specialization?.name || '',
            experience: doctor.specialization?.experience?.toString() || '0'
          },
          experience: doctor.specialization?.experience?.toString() || '0',
          location: doctor.addresses?.[0]?.city || doctor.addresses?.[0]?.state || 'Location not available',
          consultationFee: doctor.consultationModeFee?.[0]?.fee || 0,
          consultationModeFee: doctor.consultationModeFee || [],
          image: '',
          isFavorite: false,
          addresses: doctor.addresses || [],
          profilepic: doctor.profilepic // Add profilepic directly from API response
        }));

        setDoctors(transformedDoctors);

        if (transformedDoctors.length === 0) {
          setErrorMessage(t.noDoctorsFound);
        }
      } else {
        throw new Error(res?.message?.message || t.errorFetchingDoctors);
      }
    } catch (error) {
      setDoctors([]);
      setErrorMessage(error instanceof Error ? error.message : t.errorFetchingDoctors);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const toggleFavorite = (doctorId: number) => {
    setDoctors((prevDoctors) =>
      prevDoctors.map((doctor) =>
        doctor?.id === doctorId ? { ...doctor, isFavorite: !doctor?.isFavorite } : doctor
      )
    );
  };

  const handleBookNow = (doctor: Doctor) => {
    navigation.navigate('SlotSelection', {
      doctor: {
        id: doctor?.id,
        doctorId: doctor?.userId,
        name: `${doctor?.firstname || ''} ${doctor?.lastname || ''}`.trim(),
        specialty: doctor?.specialization,
        consultationFee: doctor?.consultationModeFee,
        addresses: doctor?.addresses
      },
      mode: 'home'
      });
    };
    const handleViewDetails = (doctor: Doctor) => {
    navigation.navigate('DoctorDetails', {
      doctorId: doctor?.userId?.toString() || doctor?.id?.toString(),
      selectedClinicId: doctor?.addresses?.[0]?.addressId?.toString() || null,
    });
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const goBack = () => {
    navigation.goBack();
  };

  const isPaidDoctor = (doctor: any) => {
    const base = doctor?.consultationModeFee[2]?.fee;
    if (base !== undefined && base !== null) {
      return Number(base) > 0;
    }
    const modeFees = Array.isArray(doctor?.consultationModeFee) ? doctor?.consultationModeFee : [];
    return modeFees.some((m: any) => Number(m?.fee) > 0);
  };

const visibleDoctors = doctors?.filter(doctor => {
  const query = searchQuery.toLowerCase().trim();
  
  // If search query is empty, show all paid doctors
  if (!query) return isPaidDoctor(doctor);
  
  // Check first name
  const firstName = doctor?.firstname?.toLowerCase() || '';
  
  // Check last name
  const lastName = doctor?.lastname?.toLowerCase() || '';
  
  // Check full name (first + last)
  const fullName = `${firstName} ${lastName}`.trim();
  
  const matchesSearch = 
    firstName.includes(query) ||
    lastName.includes(query) ||
    fullName.includes(query) ||
    doctor?.specialization?.name?.toLowerCase().includes(query) ||
    doctor?.location?.toLowerCase().includes(query);

  return matchesSearch && isPaidDoctor(doctor);
});

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{serviceType}</Text>
      </View> */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color="#1F2937" />
          <Text style={styles.loaderText}>{t.loadingText}</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.doctorList} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.doctorListContent}
        >
          {visibleDoctors?.map((doctor) => {
            const avatarSource = getAvatarSource(doctor.profilepic);

            return (
    <TouchableOpacity 
      key={doctor?.id} 
      style={styles.doctorCardContainer}
      onPress={() => handleViewDetails(doctor)}
      activeOpacity={0.95}
    >
      <View style={styles.doctorCard}>
        <TouchableOpacity 
          style={styles.detailsLink}
          onPress={(e) => {
            e.stopPropagation(); 
            handleViewDetails(doctor);
          }}
        >
          <Text style={styles.detailsText}>👁️ Details</Text>
        </TouchableOpacity>

                <View style={styles.doctorInfo}>
                  <View style={styles.avatar}>
                    {avatarSource ? (
                      <Image
                        source={avatarSource}
                        style={styles.avatarImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.avatarText}>{getAvatarInitial(doctor)}</Text>
                    )}
                  </View>
                  <View style={styles.doctorDetails}>
                    <Text style={styles.doctorName} numberOfLines={1}>
                      {formatDoctorName(doctor?.firstname)} {doctor?.lastname}
                    </Text>
                    <Text style={styles.doctorSpecialty} numberOfLines={1}>
              {doctor?.specialization?.name}
            </Text>
            <Text style={styles.doctorExperience}>
              {t.experience}: {doctor?.specialization?.experience} years
            </Text>
                  </View>
                </View>
                <View style={styles.appointmentInfo}>
                  <View style={styles.locationFeeContainer}>
                    <Text style={styles.locationText} numberOfLines={1}>
              {doctor?.location}
            </Text>
            <Text style={styles.feeText} numberOfLines={1}>
              {t.consultationFees}: ₹{doctor?.consultationModeFee[2] ? doctor?.consultationModeFee[2].fee : doctor?.consultationFee}
            </Text>
                  </View>
          
          {/* Remove the detailsContainer from here since we moved it to top-right */}
          
                  <TouchableOpacity
                    style={styles.bookButton}
                    onPress={(e) => {
              e.stopPropagation(); // Prevent card click from firing
              handleBookNow(doctor);
            }}
                  >
                    <Text style={styles.bookButtonText}>{t.bookNow}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDFFF7',
  },
  searchContainer: {
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#EDFFF7',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: isTablet ? SPACING.sm : SPACING.xs,
    minHeight: moderateScale(44),
    ...LAYOUT.shadow.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    fontSize: moderateScale(14),
    color: '#9CA3AF',
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(14),
    color: '#1F2937',
    paddingVertical: SPACING.xs,
    includeFontPadding: false,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  clearIcon: {
    fontSize: moderateScale(14),
    color: '#9CA3AF',
  },
  doctorList: {
    flex: 1,
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
  },
  doctorListContent: {
    paddingBottom: SAFE_AREA.safeBottom + SPACING.md,
    paddingTop: SPACING.xs,
  },

  doctorCardContainer: {
    marginVertical: SPACING.xs,
  },

  doctorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.md,
    padding: isTablet ? SPACING.md : SPACING.sm,
    ...LAYOUT.shadow.sm,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    position: 'relative', 
  },
  detailsLink: {
    position: 'absolute',
    top: isTablet ? SPACING.sm : SPACING.xs,
    right: isTablet ? SPACING.sm : SPACING.xs,
    zIndex: 2,
    paddingVertical: SPACING.xxs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: LAYOUT.borderRadius.xs,
  },
  
  detailsText: {
    fontSize: moderateScale(11),
    color: '#1976d2',
    fontStyle: 'italic',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  doctorInfo: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: isTablet ? moderateScale(50) : moderateScale(44),
    height: isTablet ? moderateScale(50) : moderateScale(44),
    borderRadius: isTablet ? moderateScale(25) : moderateScale(22),
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: isTablet ? moderateScale(25) : moderateScale(22),
  },
  avatarText: {
    fontSize: moderateScale(isTablet ? 16 : 14),
    fontWeight: '600',
    color: '#1976d2',
  },
  doctorDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  doctorName: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: SPACING.xxs,
  },
  doctorSpecialty: {
    fontSize: moderateScale(12),
    color: '#6B7280',
    marginBottom: SPACING.xxs,
  },
  doctorExperience: {
    fontSize: moderateScale(12),
    color: '#6B7280',
  },
  appointmentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: isSmallDevice ? 'wrap' : 'nowrap',
  },
  locationFeeContainer: {
    flex: 1,
    marginRight: isSmallDevice ? 0 : SPACING.sm,
    marginBottom: isSmallDevice ? SPACING.xs : 0,
  },
  locationText: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: SPACING.xxs,
  },
  feeText: {
    fontSize: moderateScale(12),
    color: '#6B7280',
    fontWeight: '500',
  },
  bookButton: {
    backgroundColor: '#1F2937',
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: LAYOUT.borderRadius.md,
    minHeight: moderateScale(32),
    justifyContent: 'center',
    alignSelf: isSmallDevice ? 'stretch' : 'flex-start',
    marginLeft: isSmallDevice ? 0 : SPACING.sm,
    minWidth: moderateScale(80),
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(12),
    fontWeight: '600',
    textAlign: 'center',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: SAFE_AREA.safeBottom,
  },
  loaderText: {
    marginTop: SPACING.sm,
    fontSize: moderateScale(14),
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    paddingBottom: SAFE_AREA.safeBottom,
  },
  errorText: {
    fontSize: moderateScale(14),
    color: '#B91C1C',
    textAlign: 'center',
  },
});

export default Physiotherapist;