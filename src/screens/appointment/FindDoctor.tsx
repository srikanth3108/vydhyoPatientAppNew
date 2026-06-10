import React, { useEffect, useState } from 'react';
import { UsePost, ENDPOINTS } from '../../services';
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
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/navigationTypes';
;
import { useSelector } from 'react-redux';
import { formatDoctorName, getAvatarInitial } from '../../utils/util';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import responsive utilities
import {
  isTablet,
  isSmallDevice,
  SPACING,
  LAYOUT,
  moderateScale,
  SAFE_AREA,
} from '../../utils/responsive';
import RoundedButton from '../../components/RoundedButton';
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

// Get screen dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type Lang = 'en' | 'hi' | 'tel';

type FindDoctorRouteProp = RouteProp<RootStackParamList, 'FindDoctor'>;

interface FindDoctorProps {
  route: FindDoctorRouteProp;
  navigation: StackNavigationProp<RootStackParamList, 'FindDoctor'>;
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
  consultationModeFee?: any; // keep as-is to not change functionality
  image: string;
  isFavorite: boolean;
  addresses?: any;
  profilepic?: any;
}

/** UI strings (EN / HI / TEL) */
const UI = {
  title: {
    en: 'Find Doctors',
    hi: 'डॉक्टर खोजें',
    tel: 'డాక్టర్లను కనుగొనండి',
  },
  searchPlaceholder: {
    en: 'Search Doctor by Name...',
    hi: 'खोजें...',
    tel: 'వెతకండి...',
  },
  loadingDoctors: {
    en: 'Loading doctors...',
    hi: 'डॉक्टर लोड हो रहे हैं...',
    tel: 'డాక్టర్లు లోడ్ అవుతున్నారు...',
  },
  noDoctors: {
    en: 'No doctors found',
    hi: 'कोई डॉक्टर नहीं मिले',
    tel: 'డాక్టర్లు కనిపించలేదు',
  },
  experienceLabel: {
    en: 'Experience: ',
    hi: 'अनुभव: ',
    tel: 'అనుభవం: ',
  },
  bookNow: {
    en: 'Book Now',
    hi: 'अभी बुक करें',
    tel: 'ఇప్పుడే బుక్ చేయండి',
  },
  consultationFees: {
    // keep the colon since original UI had "Consultation Fees: ..."
    en: 'Consultation Fees: ',
    hi: 'परामर्श शुल्क: ',
    tel: 'కన్సల్టేషన్ ఫీజు: ',
  },
} as const;

function normalizeLang(l?: string): Lang {
  if (l === 'en' || l === 'hi' || l === 'tel') return l;
  if (l === 'te') return 'tel';
  return 'en';
}

const FindDoctor: React.FC<FindDoctorProps> = ({ route, navigation }) => {
  const { specialty } = route.params || {};
  const [token,setToken] = useState<string | null | undefined>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const currentUserDetails = useSelector((state: any) => state.currentUser);
  const language = currentUserDetails?.appLanguage;
  const lang: Lang = normalizeLang(language);
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

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      const res: any = await UsePost(ENDPOINTS.GET_DOCTORS_BY_SPECIALIZATION, {
        specialization: specialty,
      });
      if (res?.status === 'success' && res?.data?.success) {
        const doctorsList = res?.data?.data || [];
        const transformedDoctors: Doctor[] = doctorsList?.map(
          (doctor: any) => ({
            id: doctor?._id || doctor?.userId,
            userId: doctor?.userId,
            firstname: doctor?.firstname || '',
            lastname: doctor?.lastname || '',
            specialization: {
              name: doctor?.specialization?.name || '',
              experience: doctor?.specialization?.experience?.toString() || '0',
            },
            experience: doctor?.specialization?.experience?.toString() || '0',
            location:
              doctor?.addresses?.[0]?.city ||
              doctor?.addresses?.[0]?.state ||
              'Location not available',
            consultationFee: doctor?.consultationModeFee?.[0]?.fee || 0,
            consultationModeFee: doctor?.consultationModeFee || [],
            image: '',
            isFavorite: false,
            addresses: doctor?.addresses || [],
            profilepic: doctor?.profilepic,
          }),
        );

        setDoctors(transformedDoctors);
      } else {
        throw new Error('Failed to fetch doctors data');
      }
    } catch (error) {
      setDoctors([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredDoctors = doctors.filter(doctor => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const firstLetterFirstName = doctor?.firstname?.charAt(0)?.toLowerCase();

    // Check first letter of last name
    const firstLetterLastName = doctor?.lastname?.charAt(0)?.toLowerCase();

    // Check full first name
    const fullFirstName = doctor?.firstname?.toLowerCase();

    // Check full last name
    const fullLastName = doctor?.lastname?.toLowerCase();

    // Check full name (first + last)
    const fullName = `${doctor?.firstname || ''} ${doctor?.lastname || ''}`
      .toLowerCase()
      .trim();

    return (
      firstLetterFirstName === query ||
      firstLetterLastName === query ||
      fullFirstName?.includes(query) ||
      fullLastName?.includes(query) ||
      fullName.includes(query) ||
      doctor?.specialization?.name?.toLowerCase().includes(query) ||
      doctor?.location?.toLowerCase().includes(query)
    );
  });

  const toggleFavorite = (doctorId: number) => {
    setDoctors(prevDoctors =>
      prevDoctors?.map(doctor =>
        doctor?.id === doctorId
          ? { ...doctor, isFavorite: !doctor?.isFavorite }
          : doctor,
      ),
    );
  };

  const handleBookNow = (doctor: Doctor) => {
    //if there is no token, do not navigate and show alert please login
    if(!token){
      Alert.alert('Please login to Book Appointment');
      //navigate to login screen
      navigation.navigate('Login');
      return;
    }

    navigation.navigate('SelectClinic', {
      doctor: {
        id: doctor?.id,
        doctorId: doctor?.userId,
        name: `${doctor?.firstname} ${doctor?.lastname}`,
        specialty: doctor?.specialization?.name,
        consultationFee: doctor?.consultationModeFee,
        addresses: doctor?.addresses,
      },
    });
  };

  const clearSearch = () => setSearchQuery('');
  const goBack = () => navigation.goBack();

  // Helper (UNCHANGED)
  const isPaidDoctor = (doctor: any) => {
    const base = doctor?.consultationModeFee?.[0]?.fee;
    if (base !== undefined && base !== null) {
      return Number(base) > 0;
    }
    const modeFees = Array.isArray(doctor?.consultationModeFee)
      ? doctor.consultationModeFee
      : [];
    return modeFees.some((m: any) => Number(m?.fee) > 0);
  };
  const handleViewDetails = (doctor: Doctor) => {
    //if there is no token, do not navigate and show alert please login
    if(!token){
      Alert.alert('Please login to view details');
      //navigate to login screen
      navigation.navigate('Login');
      return;
    }
    navigation.navigate('DoctorDetails', {
      doctorId: doctor?.userId?.toString() || doctor?.id?.toString(),
      selectedClinicId: doctor?.addresses?.[0]?.addressId?.toString() || null,
    });
  };

  const handleImagePress = (profilepic: any) => {
    const avatarSource = getAvatarSource(profilepic);
    if (avatarSource?.uri) {
      setSelectedImage(avatarSource.uri);
      setModalVisible(true);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedImage(null);
  };

  const visibleDoctors = filteredDoctors.filter(isPaidDoctor);

  const getToken = async () => {
    const token = await AsyncStorage.getItem('authToken');
    setToken(token);
  };

  useEffect(() => {
    getToken();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{UI.title[lang]}</Text>
      </View> */}

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={UI.searchPlaceholder[lang]}
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
          <Text style={styles.loaderText}>{UI.loadingDoctors[lang]}</Text>
        </View>
      ) : visibleDoctors.length === 0 ? (
        <View style={styles.loaderContainer}>
          <Text style={styles.noDoctorsText}>{UI.noDoctors[lang]}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.doctorList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.doctorListContent}
        >
          {visibleDoctors.map(doctor => {
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
                    onPress={e => {
                      e.stopPropagation();
                      handleViewDetails(doctor);
                    }}
                  >
                    <Text style={styles.detailsText}>👁️ Details</Text>
                  </TouchableOpacity>

                  <View style={styles.cardContent}>
                    <View style={styles.doctorInfo}>
                      <TouchableOpacity 
                        style={styles.avatar}
                        onPress={() => handleImagePress(doctor.profilepic)}
                        activeOpacity={avatarSource ? 0.7 : 1}
                      >
                        {avatarSource ? (
                          <Image
                            source={avatarSource}
                            style={styles.avatarImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <Text style={styles.avatarText}>
                            {getAvatarInitial(doctor?.firstname, doctor?.lastname)}
                          </Text>
                        )}
                      </TouchableOpacity>
                      <View style={styles.doctorDetails}>
                        <Text style={styles.doctorName} numberOfLines={1}>
                          {formatDoctorName(doctor?.firstname, doctor?.lastname)}
                        </Text>
                        <Text style={styles.doctorSpecialty} numberOfLines={1}>
                          {doctor?.specialization?.name}
                        </Text>
                        <Text style={styles.doctorExperience}>
                          {UI.experienceLabel[lang]}
                          {doctor?.specialization?.experience} years
                        </Text>
                        <View style={styles.locationContainer}>
                          <Text style={styles.pinIcon}>📍</Text>
                          <Text style={styles.locationText} numberOfLines={1}>
                            {doctor?.location}
                          </Text>
                        </View>
                        <Text style={styles.feeText} numberOfLines={1}>
                          {UI.consultationFees[lang]} ₹{doctor?.consultationModeFee?.[0]?.fee}
                        </Text>
                      </View>
                    </View>

                    <RoundedButton
                      title={UI.bookNow[lang]}
                      onPress={() => handleBookNow(doctor)}
                      style={{
                        minWidth: moderateScale(90),
                        minHeight: moderateScale(34),
                        paddingHorizontal: isTablet ? SPACING.md : SPACING.sm,
                        paddingVertical: SPACING.sm,
                        borderRadius: 999,
                        backgroundColor: '#00203F',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: 0,
                        marginBottom: 0,
                      }}
                      textStyle={{
                        color: '#FFFFFF',
                        fontSize: moderateScale(12),
                        fontWeight: '600',
                        textAlign: 'center',
                      }}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Image Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableOpacity 
          style={styles.modalContainer}
          onPress={closeModal}
          activeOpacity={1}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={closeModal}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.enlargedImage}
                resizeMode="contain"
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
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

  // Wrap the card in a TouchableOpacity
  doctorCardContainer: {
    marginVertical: SPACING.xs,
  },

  doctorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: isTablet ? SPACING.md : SPACING.sm,
    ...LAYOUT.shadow.sm,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    position: 'relative',
  },

  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  detailsLink: {
    position: 'absolute',
    top: isTablet ? SPACING.sm : SPACING.xs,
    right: isTablet ? SPACING.sm : SPACING.xs,
    zIndex: 2, // Increase zIndex to be above card
    padding: SPACING.xs, // Add padding for better touch area
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Slight background for better visibility
    borderRadius: LAYOUT.borderRadius.sm,
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
    flex: 1,
    marginRight: SPACING.sm,
  },
  avatar: {
    width: isTablet ? moderateScale(50) : moderateScale(44),
    height: isTablet ? moderateScale(50) : moderateScale(44),
    borderRadius: isTablet ? moderateScale(25) : moderateScale(22),
    backgroundColor: '#E0E7F1', // Light blue-grey matching #00203F
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
    fontWeight: '700',
    color: '#00203F', // Dark navy blue matching login button
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
    fontWeight: '300',
    fontSize: moderateScale(12),
    color: '#000000',
    marginBottom: SPACING.xxs,
  },
  doctorExperience: {
    fontWeight: '300',
    fontSize: moderateScale(12),
    color: '#000000',
    marginBottom: SPACING.xxs,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xxs,
  },
  pinIcon: {
    fontSize: moderateScale(12),
    color: '#16A34A',
    marginRight: SPACING.xxs,
  },
  locationText: {
    fontSize: moderateScale(12),
    fontWeight: '300',
    color: '#1F2937',
    flex: 1,
  },
  feeText: {
    fontSize: moderateScale(12),
    color: '#000000',
    fontWeight: '300',
  },

  appointmentInfo: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  locationFeeContainer: {
    flex: 1,
    marginRight: isSmallDevice ? 0 : SPACING.sm,
    marginBottom: isSmallDevice ? SPACING.xs : 0,
  },

  bookButton: {
    backgroundColor: '#00203F',
    paddingHorizontal: isTablet ? SPACING.md : SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    minHeight: moderateScale(36),
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: moderateScale(90),
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
  noDoctorsText: {
    fontSize: moderateScale(14),
    color: '#6B7280',
    textAlign: 'center',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: screenWidth,
    height: screenHeight,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: SAFE_AREA.safeTop + SPACING.md,
    right: SPACING.md,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(18),
    fontWeight: 'bold',
  },
  enlargedImage: {
    width: screenWidth,
    height: screenHeight,
  },
});

export default FindDoctor;
