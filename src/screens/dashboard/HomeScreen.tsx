import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AuthFetch, AuthPost, ENDPOINTS } from '../../services';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Animated,
  Modal,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import VideoAdPlayer from '../../components/VideoAdPlayer';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
;
import FloatingAd from './FloatingAd';
import { formatDoctorName } from '../../utils/util';
import { BackHandler } from 'react-native';

// Import responsive utilities
import {
  SCREEN_WIDTH,
  responsiveWidth,
  moderateScale,
} from '../../utils/responsive';

type RootStackParamList = {
  SelectIssue: undefined;
  MyAppointments: undefined;
  Bookings: undefined;
  MyDoctors: undefined;
  MyFamily: undefined;
  MedicalReports: undefined;
  Wallet: undefined;
  MyOrders: undefined;
  Home: undefined;
  Rewards: undefined;
  FeedbackRating: undefined;
  HelpCenter: undefined;
  Settings: undefined;
  Profile: undefined;
  ProfileView: undefined;
  BookAmbulanceScreen: undefined;
  BloodBankScreen: undefined;
  Login: undefined;
  HomeServices: undefined;
  RentalCategories: undefined;
  RentalAgents: { categoryId: string };
  RentalsCatalog: { categoryId?: string; agentId?: string } | undefined;
  ReferAndEarn: undefined;
  DoctorDetails: undefined;
  PinManagement: undefined;
  FindDoctor: { specialty: string };
};

type LangName = 'English' | 'Telugu' | 'Hindi';
type LangCode = 'en' | 'tel' | 'hi';

interface Doctor {
  profilepic?: any;
  _id: string;
  userId: string;
  firstname?: string;
  lastname?: string;
  specialization: {
    name: string;
    experience: number;
    degree: string;
    services: string;
    bio: string;
  };
  consultationModeFee: Array<{
    type: string;
    fee: number;
    currency: string;
    _id: string;
  }>;
  selectedClinicId?: string | null;
}

const codeToName = (code?: string): LangName => {
  if (code === 'en') return 'English';
  if (code === 'tel') return 'Telugu';
  if (code === 'hi') return 'Hindi';
  return 'English';
};

const nameToCode = (name: LangName): LangCode => {
  if (name === 'English') return 'en';
  if (name === 'Telugu') return 'tel';
  return 'hi';
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Home'>>();
  const dispatch = useDispatch();
  const userWallet = useSelector((s: any) => s.userWallet);

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<string | null>(null);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [doctorProfilePics, setDoctorProfilePics] = useState<{
    [key: string]: any;
  }>({});
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(responsiveWidth(80))).current;
  const specialtiesScrollViewRef = useRef<ScrollView>(null);
  const [token, setToken] = useState<string | null>(null);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const currentUserDetails = useSelector((state: any) => state.currentUser);
  const language =
    currentUserDetails?.appLanguage === 'en'
      ? 'English'
      : currentUserDetails?.appLanguage === 'tel'
        ? 'Telugu'
        : 'Hindi';

  const [selectedLanguage, setSelectedLanguage] = useState<LangName>(() =>
    codeToName(currentUserDetails?.appLanguage),
  );
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

  const fetchDoctorProfilePic = async (doctorId: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!doctorId) return;

      const response: any = await AuthFetch(
        ENDPOINTS.GET_USER(doctorId),
        token,
      );
      const userData = response?.data?.data;
      console.log('====', userData);
      if (userData?.profilepic) {
        setDoctorProfilePics(prev => ({
          ...prev,
          [doctorId]: userData.profilepic,
        }));
      }
    } catch (error) {
      console.warn('Failed to fetch doctor profile picture:', error);
    }
  };

  // Keep selectedLanguage in sync if Redux appLanguage changes externally
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (navigation.isFocused()) {
          BackHandler.exitApp();
          return true;
        }
        return false;
      },
    );

    return () => backHandler.remove();
  }, [navigation]);
  useEffect(() => {
    const next = codeToName(currentUserDetails?.appLanguage);
    if (next !== selectedLanguage) setSelectedLanguage(next);
  }, [currentUserDetails?.appLanguage]);

  // Fetch doctors for the user
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        console.log('Fetching doctors for user ID:', currentUserDetails);
        const storedToken = await AsyncStorage.getItem('authToken');
        const userId = currentUserDetails?.userId;

        if (!storedToken || !userId) return;
        setToken(storedToken)

        if (!userId) {
          Alert.alert('Error', 'User ID not found. Please log in again.');
          return;
        }
        const response: any = await AuthFetch(
          ENDPOINTS.GET_DOCTORS_LIST_BY_FAMILY(userId),
          storedToken,
        );

        if (response?.status === 'success' && response?.data?.data) {
          const doctorsData = response?.data?.data;
          setDoctorsList(doctorsData);
          doctorsData.forEach((doctor: Doctor) => {
            const doctorId = String(doctor.userId || doctor._id);
            if (doctorId) {
              fetchDoctorProfilePic(doctorId);
            }
          });
        } else {
          Alert.alert(
            'Error',
            response?.message || 'Failed to fetch doctors list',
          );
        }
      } catch (error: any) {
        Alert.alert(
          'Error',
          'Something went wrong while fetching doctors list',
        );
      }
    };

    fetchDoctors();
  }, [currentUserDetails]);

  // Fetch specialties from API
  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const res: any = await AuthFetch(
          ENDPOINTS.GET_SPECIALIZATIONS,
          null,
        );

        if (res?.status === 'success' && res?.data?.data) {
          const specializationsData = res.data.data;

          // Map the API data to the format needed for the UI
          const formattedSpecialties = specializationsData.map(
            (spec: any, index: number) => ({
              id: spec.specializationsId || index + 1,
              name: spec.name || spec.aliasName || 'Specialization',
              image: spec.imageUrl
                ? { uri: spec.imageUrl }
                : require('../../assets/GeneralPhysician.png'),
            }),
          );

          setSpecialties(formattedSpecialties);
        }
      } catch (error) {
        console.warn('Failed to fetch specialties:', error);
        // Keep the empty array if API fails
      }
    };

    fetchSpecialties();
  }, []);

  const fetchWalletData = useCallback(async () => {
    const token = await AsyncStorage.getItem('authToken');
    const userId = await AsyncStorage.getItem('userId');
    if (!token || !userId) return;

    try {
      const response = await AuthFetch(ENDPOINTS.GET_AVAILABLE_BALANCE(userId), token);
      if (response.status === 'success') {
        const walletData = response.data.data;
        console.log("walletDatahome=====>", walletData)
        if (!walletData) return;
        dispatch({ type: 'userWallet', payload: walletData });
      }
    } catch (error: any) {
      console.log('Error fetching wallet data:', error.message);
    }
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      fetchWalletData();
    }, [fetchWalletData])
  );

  // Re-fetch user profile when language selection changes (and we have token & userId)
  useEffect(() => {
    let isMounted = true;
    const languageSelection = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        const userId = currentUserDetails?.userId;
        if (!storedToken || !userId) return;
        const code = nameToCode(selectedLanguage);
        const languageResponse = await AuthFetch(
          ENDPOINTS.UPDATE_LANGUAGE(userId, code),
          storedToken,
        );

        if (
          languageResponse?.status === 'success' &&
          'data' in languageResponse &&
          languageResponse?.data
        ) {
          const userData = languageResponse.data.data;
          const id = userData?.UserId;
          if (isMounted) {
            dispatch({ type: 'currentUser', payload: userData });
            dispatch({ type: 'currentUserID', payload: id });
          }
        } else {
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('userId');
        }
      } catch (error) {
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userId');
      }
    };

    languageSelection();
    return () => {
      isMounted = false;
    };
  }, [selectedLanguage, currentUserDetails?.userId, dispatch]);

  const languages = [
    { id: 1, name: 'English' as LangName },
    { id: 2, name: 'Telugu' as LangName },
    { id: 3, name: 'Hindi' as LangName },
  ];

  const handleProfilePress = () => {
    navigation.navigate('ProfileView');
    closeSidebar();
  };

  const handleHamburgerPress = () => {
    if (sidebarVisible) closeSidebar();
    else openSidebar();
  };

  const handleLanguagePress = () => {
    setLanguageModalVisible(true);
  };

  const handleLanguageSelect = (language: LangName) => {
    if (language !== selectedLanguage) setSelectedLanguage(language);
    setLanguageModalVisible(false);
  };

  const services = [
    {
      id: 1,
      title:
        selectedLanguage === 'English'
          ? 'Book Doctor Appointment'
          : selectedLanguage === 'Telugu'
            ? 'డాక్టర్ అపాయింట్మెంట్ బుక్ చేయండి'
            : 'डॉक्टर अपॉइंटमेंट बुक करें',
      image: require('../../assets/BookDoctor.png'),
    },
    {
      id: 2,
      title:
        selectedLanguage === 'English'
          ? 'Home Services'
          : selectedLanguage === 'Telugu'
            ? 'హోమ్ సర్వీసెస్'
            : 'होम सर्विसेज',
      image: require('../../assets/HomeServices.png'),
    },
    {
      id: 3,
      title:
        selectedLanguage === 'English'
          ? 'Rent Homecare Products'
          : selectedLanguage === 'Telugu'
            ? 'హోమ్‌కేర్ ప్రొడక్ట్స్ అద్దెకు'
            : 'होमकेयर उत्पाद किराए पर',
      image: require('../../assets/HomeServices.png'),
    },
    // {
    //   id: 3,
    //   title:
    //     selectedLanguage === 'English'
    //       ? 'Book Ambulance'
    //       : selectedLanguage === 'Telugu'
    //         ? 'అంబులెన్స్ బుక్ చేయండి'
    //         : 'एंबुलेंस बुक करें',
    //   image: require('../../assets/BookAmbulance.png'),
    // },
    // {
    //   id: 4,
    //   title:
    //     selectedLanguage === 'English'
    //       ? 'Blood Bank'
    //       : selectedLanguage === 'Telugu'
    //         ? 'బ్లడ్ బ్యాంక్'
    //         : 'ब्लड बैंक',
    //   image: require('../../assets/bloodbank.png'),
    // },
  ];

  const openSidebar = () => {
    setSidebarVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeSidebar = () => {
    Animated.timing(slideAnim, {
      toValue: responsiveWidth(80),
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSidebarVisible(false);
      setSelectedMenuItem(null);
    });
  };

  const handleServicePress = (title: string) => {
    if (
      title.includes('Doctor Appointment') ||
      title.includes('డాక్టర్ అపాయింట్మెంట్') ||
      title.includes('डॉक्टर अपॉइंटमेंट')
    ) {
      navigation.navigate('SelectIssue');
    }
    if (
      title.includes('Home Services') ||
      title.includes('హోమ్ సర్వీసెస్') ||
      title.includes('होम सर्विसेज')
    ) {
      navigation.navigate('HomeServices');
    }
    if (
      title.includes('Rent Homecare Products') ||
      title.includes('హోమ్‌కేర్ ప్రొడక్ట్స్') ||
      title.includes('होमकेयर उत्पाद')
    ) {
      navigation.navigate('RentalCategories');
    }
    if (
      title.includes('Book Ambulance') ||
      title.includes('అంబులెన్స్') ||
      title.includes('एंबुलेंस')
    ) {
      navigation.navigate('BookAmbulanceScreen');
    }
    if (
      title.includes('Blood Bank') ||
      title.includes('బ్లడ్ బ్యాంక్') ||
      title.includes('ब्लड बैंक')
    ) {
      navigation.navigate('BloodBankScreen');
    }
  };

  const handleSidebarItemPress = (route: keyof RootStackParamList) => {
    setSelectedMenuItem(route);
    navigation.navigate(route);
    closeSidebar();
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: confirmLogout },
    ]);
    // setLogoutModalVisible(true);
  };

  const handleLogin = () => {
    // setLogoutModalVisible(true);
    closeSidebar();
    navigation.navigate('Login');
  };

  const confirmLogout = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      const response = await AuthPost(ENDPOINTS.LOGOUT, {}, storedToken);
      console.log('Logout response:', response);
      if (response?.status === 'success') {
        closeSidebar();

        await AsyncStorage.multiRemove(['authToken', 'userId']);
        navigation.navigate('Login');
      } else {
        await AsyncStorage.multiRemove(['authToken', 'userId']);
        navigation.navigate('Login');

        // Alert.alert('Error', response?.message || 'Logout failed');
      }
    } catch (error: any) {
      await AsyncStorage.multiRemove(['authToken', 'userId']);
      navigation.navigate('Login');
      // Alert.alert('Error', error?.message || 'Something went wrong');
    }
    setLogoutModalVisible(false);
  };

  const cancelLogout = () => {
    setLogoutModalVisible(false);
  };

  const handleSpecialtyPress = (specialtyName: string) => {
    navigation.navigate('FindDoctor', { specialty: specialtyName });
  };

  const handleReferAndEarnPress = () => {
    navigation.navigate('ReferAndEarn');
  };

  const handleNotificationPress = () => {
    navigation.navigate('Notifications');
  };

  const handleWalletPress = () => {
    navigation.navigate('Wallet');
  };

  const scrollPositionRef = useRef(0);
  const SCROLL_STEP = SCREEN_WIDTH * 0.18 * 4 + moderateScale(10) * 4; // 4 items width

  const handleScrollRight = () => {
    const newPosition = scrollPositionRef.current + SCROLL_STEP;
    specialtiesScrollViewRef.current?.scrollTo({
      x: newPosition,
      animated: true,
    });
    scrollPositionRef.current = newPosition;
  };

  const handleScrollLeft = () => {
    const newPosition = Math.max(0, scrollPositionRef.current - SCROLL_STEP);
    specialtiesScrollViewRef.current?.scrollTo({
      x: newPosition,
      animated: true,
    });
    scrollPositionRef.current = newPosition;
  };

  interface Transaction {
    _id: string;
    transactionID: string;
    isExpired: boolean;
    amount: number;
    transactionType: 'credit' | 'debit';
    purpose: string;
    description: string;
    currency: string;
    status: string;
    createdAt: number;
  }

  interface WalletData {
    customerID: string;
    balance: number;
    currency: string;
    transactions?: Transaction[];
  }

  const [walletData, setWalletData] = useState<WalletData | null>(null);

  const totalUsableAmt = userWallet?.balance || 0;

  console.log('totalUsableAmt====', totalUsableAmt);
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1E40AF" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>
              {selectedLanguage === 'English'
                ? `Hi ${currentUserDetails?.firstname || ''} ${currentUserDetails?.lastname || ''
                }`
                : selectedLanguage === 'Telugu'
                  ? `హాయ్ ${currentUserDetails?.firstname || ''} ${currentUserDetails?.lastname || ''
                  }`
                  : `हाय ${currentUserDetails?.firstname || ''} ${currentUserDetails?.lastname || ''
                  }`}
            </Text>

            <Text style={styles.headerTitle}>
              {selectedLanguage === 'English'
                ? 'Find Your Doctor'
                : selectedLanguage === 'Telugu'
                  ? 'మీ డాక్టర్‌ని కనుగొనండి'
                  : 'अपना डॉक्टर खोजें'}
            </Text>
          </View>
          <View style={styles.headerIcons}>
            {/* <TouchableOpacity style={styles.iconButton} onPress={handleNotificationPress}>
              <Image source={require('../../assets/bell.png')} style={styles.iconImage} resizeMode="contain" />
            </TouchableOpacity> */}
            {/* <TouchableOpacity
              style={styles.iconButton}
              onPress={handleWalletPress}
            >
              <Image
                source={require('../../assets/wallet.png')}
                style={styles.iconImage}
                resizeMode="contain"
              />
            </TouchableOpacity> */}

            <TouchableOpacity
              style={styles.iconwalletButton}
              onPress={handleWalletPress}
            >
              <View style={styles.iconWrapper}>
                <Image
                  source={require('../../assets/wallet.png')}
                  style={styles.iconwalletImage}
                  resizeMode="contain"
                />

                {/* Badge */}
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{totalUsableAmt}</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileButton}
              onPress={handleHamburgerPress}
            >
              <Image
                source={require('../../assets/user.png')}
                style={styles.profileImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Video Advertisement Section */}
        
        {/* Location and Language Dropdowns */}
        <View style={styles.dropdownContainer}>
          <TouchableOpacity style={styles.dropdown}>
            <Text style={styles.dropdownText}>
              {selectedLanguage === 'English'
                ? 'NIZAMABAD'
                : selectedLanguage === 'Telugu'
                  ? 'నిజామాబాద్'
                  : 'निजामाबाद'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={handleLanguagePress}
          >
            <Text style={styles.dropdownText}>{selectedLanguage} ▼</Text>
          </TouchableOpacity>
        </View>

        {/* Language Selection Modal */}
        <Modal
          visible={languageModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setLanguageModalVisible(false)}
        >
          <View style={styles.languageModalOverlay}>
            <View style={styles.languageModalContainer}>
              <Text style={styles.languageModalTitle}>
                {selectedLanguage === 'English'
                  ? 'Select Language'
                  : selectedLanguage === 'Telugu'
                    ? 'భాషను ఎంచుకోండి'
                    : 'भाषा चुनें'}
              </Text>
              {languages?.map(lang => (
                <TouchableOpacity
                  key={lang.id}
                  style={[
                    styles.languageOption,
                    selectedLanguage === lang.name &&
                    styles.selectedLanguageOption,
                  ]}
                  onPress={() => handleLanguageSelect(lang.name)}
                >
                  <Text
                    style={[
                      styles.languageOptionText,
                      selectedLanguage === lang.name &&
                      styles.selectedLanguageOptionText,
                    ]}
                  >
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.languageModalButton}
                onPress={() => setLanguageModalVisible(false)}
              >
                <Text style={styles.languageModalButtonText}>
                  {selectedLanguage === 'English'
                    ? 'Cancel'
                    : selectedLanguage === 'Telugu'
                      ? 'రద్దు'
                      : 'रद्द करें'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Service Cards */}
        <View style={styles.servicesGrid}>
          {services?.map(service => (
            <View key={service.id} style={styles.serviceWrapper}>
              <TouchableOpacity
                style={styles.serviceCard}
                onPress={() => handleServicePress(service.title)}
              >
                <View style={styles.serviceImageContainer}>
                  <Image
                    source={service.image}
                    style={styles.serviceImage}
                    resizeMode="cover"
                  />
                </View>
              </TouchableOpacity>
              <View style={styles.serviceTextContainer}>
                <Text style={styles.serviceText}>{service.title}</Text>
              </View>
            </View>
          ))}
        </View>



        {/* Refer & Earn Banner */}
        <View style={styles.referBannerContainer}>
          <View style={styles.referBannerGradient}>
            <View style={styles.referBannerContent}>
              <Text style={styles.referBannerTitle}>
                {selectedLanguage === 'English'
                  ? '🎉 Refer & Earn'
                  : selectedLanguage === 'Telugu'
                    ? '🎉 రెఫర్ & సంపాదించండి'
                    : '🎉 रेफर और कमाएं'}
              </Text>
              <Text style={styles.referBannerSubtitle}>
                {selectedLanguage === 'English'
                  ? 'Invite friends & family to Vydhyo and earn rewards!'
                  : selectedLanguage === 'Telugu'
                    ? 'స్నేహితులు & కుటుంబాన్ని Vydhyo కి ఆహ్వానించి రివార్డ్‌లు సంపాదించండి!'
                    : 'दोस्तों और परिवार को Vydhyo में आमंत्रित करें और पुरस्कार कमाएं!'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.referBannerButton}
              onPress={handleReferAndEarnPress}
            >
              <Text style={styles.referBannerButtonText}>
                {selectedLanguage === 'English'
                  ? 'Refer Now →'
                  : selectedLanguage === 'Telugu'
                    ? 'ఇప్పుడు రెఫర్ చేయండి →'
                    : 'अभी रेफर करें →'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Consulted Doctors Section */}
        <View style={styles.consultedSection}>
          <Text style={styles.sectionTitle}>
            {selectedLanguage === 'English'
              ? 'Doctors you have consulted'
              : selectedLanguage === 'Telugu'
                ? 'మీరు సంప్రదించిన డాక్టర్లు'
                : 'आपने जिन डॉक्टरों से परामर्श किया'}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.consultedScrollView}
          >
            {doctorsList?.length > 0 ? (
              doctorsList?.map(doctor => {
                const doctorId = String(doctor?.userId || doctor?._id || '');
                const profilepic = doctorProfilePics[doctorId];
                const avatarSource = getAvatarSource(profilepic);

                return (
                  <TouchableOpacity
                    key={doctor._id}
                    style={styles.doctorCard}
                    onPress={() => {
                      const selectedClinicId = doctor?.selectedClinicId || null;

                      if (doctorId) {
                        navigation.navigate('DoctorDetails', {
                          doctorId,
                          selectedClinicId,
                        });
                      } else {
                        Alert.alert(
                          selectedLanguage === 'English'
                            ? 'Error'
                            : selectedLanguage === 'Telugu'
                              ? 'లోపం'
                              : 'त्रुटि',
                          selectedLanguage === 'English'
                            ? 'Doctor not found'
                            : selectedLanguage === 'Telugu'
                              ? 'డాక్టర్ ఐడి కనబడలేదు'
                              : 'डॉक्टर आईडी नहीं मिली',
                        );
                      }
                    }}
                  >
                    <View style={styles.avatarContainer}>
                      <View style={styles.avatar}>
                        {avatarSource ? (
                          <Image
                            source={avatarSource}
                            style={styles.avatarImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <Text style={styles.avatarText}>
                            {getAvatarInitial(doctor)}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.doctorInfo}>
                      <Text style={styles.doctorName}>
                        {formatDoctorName(doctor.firstname || '').trim()}{' '}
                        {(doctor.lastname || '').trim()}
                      </Text>
                      <Text style={styles.doctorSpecialty}>
                        {doctor?.specialization?.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={styles.noDoctorsText}>
                {selectedLanguage === 'English'
                  ? 'No previously consulted doctors'
                  : selectedLanguage === 'Telugu'
                    ? 'గతంలో సంప్రదించిన డాక్టర్లు లేరు'
                    : 'पहले से परामर्श किए गए डॉक्टर नहीं हैं'}
              </Text>
            )}
          </ScrollView>
        </View>

        {/* Specialties Section */}
        <View style={styles.specialtiesSection}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity
              style={styles.arrowButton}
              onPress={handleScrollLeft}
            >
              <Text style={styles.arrowButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>
              {selectedLanguage === 'English'
                ? 'Specialities'
                : selectedLanguage === 'Telugu'
                  ? 'స్పెషాలిటీలు'
                  : 'विशेषताएँ'}
            </Text>
            <TouchableOpacity
              style={styles.arrowButton}
              onPress={handleScrollRight}
            >
              <Text style={styles.arrowButtonText}>›</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={specialtiesScrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.specialtiesScrollContainer}
            onScroll={e => {
              scrollPositionRef.current = e.nativeEvent.contentOffset.x;
            }}
            scrollEventThrottle={16}
          >
            <View style={styles.specialtiesGrid}>
              {specialties?.map(specialty => (
                <View key={specialty.id} style={styles.specialtyWrapper}>
                  <TouchableOpacity
                    style={styles.specialtyCard}
                    onPress={() => handleSpecialtyPress(specialty.name)}
                  >
                    <View style={styles.specialtyImageContainer}>
                      <Image
                        source={specialty.image}
                        style={styles.specialtyImage}
                        resizeMode="cover"
                      />
                    </View>
                  </TouchableOpacity>
                  <View style={styles.specialtyTextContainer}>
                    <Text style={styles.specialtyText}>{specialty.name}</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Refer & Earn Section */}
        {/* <TouchableOpacity style={styles.referAndEarnButton} onPress={handleReferAndEarnPress}>
          <Text style={styles.referAndEarnText}>
            {selectedLanguage === 'English'
              ? 'Refer & Earn Vydhyo Units'
              : selectedLanguage === 'Telugu'
                ? 'రెఫర్ & విధ్యో యూనిట్లు సంపాదించండి'
                : 'रेफर & वीध्यो यूनिट्स कमाएं'}
          </Text>
        </TouchableOpacity> */}

        {/* Company Info */}
        {/* <View style={styles.companySection}>
          <Text style={styles.companyName}>VYDHYO</Text>
          <View style={styles.missionSection}>
            <Text style={styles.missionTitle}>
              {selectedLanguage === 'English'
                ? 'Vision'
                : selectedLanguage === 'Telugu'
                ? 'విజన్'
                : 'दृष्टि'}
            </Text>
            <Text style={styles.missionText}>
              {selectedLanguage === 'English'
                ? 'To bridge the healthcare access gap for every family in Tier 2 India.'
                : selectedLanguage === 'Telugu'
                ? 'టైర్ 2 భారతదేశంలో ప్రతి కుటుంబానికి ఆరోగ్య సంరక్షణ యాక్సెస్ గ్యాప్‌ను తగ్గించడం.'
                : 'टियर 2 भारत में प्रत्येक परिवार के लिए स्वास्थ्य सेवा पहुंच के अंतर को पाटना।'}
            </Text>
          </View>
          <View style={styles.missionSection}>
            <Text style={styles.missionTitle}>
              {selectedLanguage === 'English'
                ? 'Mission'
                : selectedLanguage === 'Telugu'
                ? 'మిషన్'
                : 'मिशन'}
            </Text>
            <Text style={styles.missionText}>
              {selectedLanguage === 'English'
                ? 'To bring a seamless, Digital-first, affordable healthcare experience from booking to recovery.'
                : selectedLanguage === 'Telugu'
                ? 'బుకింగ్ నుండి రికవరీ వరకు సీమ్‌లెస్, డిజిటల్-ఫస్ట్, సరసమైన ఆరోగ్య సంరక్షణ అనుభవాన్ని అందించడం.'
                : 'बुकिंग से रिकवरी तक एक सहज, डिजिटल-प्रथम, किफायती स्वास्थ्य सेवा अनुभव लाना।'}
            </Text>
          </View>
        </View> */}
      </ScrollView>

      {/* Sidebar Modal */}
      <Modal
        visible={sidebarVisible}
        transparent
        animationType="none"
        onRequestClose={closeSidebar}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={closeSidebar}
          />
          <Animated.View
            style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}
          >
            <View style={styles.sidebarHeader}>
              <TouchableOpacity
                style={styles.profileSection}
                onPress={handleProfilePress}
              >
                <View style={styles.profileImageContainer}>
                  <Image
                    source={require('../../assets/user.png')}
                    style={styles.sidebarProfileImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.profileDetails}>
                  <Text style={styles.profileName}>
                    {currentUserDetails?.firstname || ''}{' '}
                    {currentUserDetails?.lastname || ''}
                  </Text>
                  {/* <Text style={styles.profileEmail}>{currentUserDetails?.email || ''}</Text> */}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeSidebar}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.sidebarContent}
              showsVerticalScrollIndicator={false}
            >
              {[
                {
                  id: 1,
                  title:
                    selectedLanguage === 'English'
                      ? 'Appointments'
                      : selectedLanguage === 'Telugu'
                        ? 'అపాయింట్మెంట్లు'
                        : 'अपॉइंटमेंट्स',
                  route: 'MyAppointments' as const,
                },
                // {
                //   id: 2,
                //   title:
                //     selectedLanguage === 'English'
                //       ? 'Bookings'
                //       : selectedLanguage === 'Telugu'
                //       ? 'బుకింగ్స్'
                //       : 'बुकिंग्स',
                //   route: 'Bookings' as const,
                // },
                {
                  id: 3,
                  title:
                    selectedLanguage === 'English'
                      ? 'My Doctors'
                      : selectedLanguage === 'Telugu'
                        ? 'నా డాక్టర్లు'
                        : 'मेरे डॉक्टर्स',
                  route: 'MyDoctors' as const,
                },
                {
                  id: 4,
                  title:
                    selectedLanguage === 'English'
                      ? 'My Family'
                      : selectedLanguage === 'Telugu'
                        ? 'నా కుటుంబం'
                        : 'मेरा परिवार',
                  route: 'MyFamily' as const,
                },
                {
                  id: 5,
                  title:
                    selectedLanguage === 'English'
                      ? 'Medical Reports'
                      : selectedLanguage === 'Telugu'
                        ? 'మెడికల్ రిపోర్ట్స్'
                        : 'मेडिकल रिपोर्ट्स',
                  route: 'MedicalReports' as const,
                },
                {
                  id: 6,
                  title:
                    selectedLanguage === 'English'
                      ? 'Wallet'
                      : selectedLanguage === 'Telugu'
                        ? 'వాలెట్'
                        : 'वॉलेट',
                  route: 'Wallet' as const,
                },
                {
                  id: 6.5,
                  title:
                    selectedLanguage === 'English'
                      ? 'My Orders'
                      : selectedLanguage === 'Telugu'
                        ? 'నా ఆర్డర్స్'
                        : 'मेरे ऑर्डर',
                  route: 'MyOrders' as const,
                },
                // { id: 7, title: selectedLanguage === 'English' ? 'Notifications' : selectedLanguage === 'Telugu' ? 'నోటిఫికేషన్స్' : 'नोटिफिकेशन्स', route: 'Notifications' as const },
                {
                  id: 8,
                  title:
                    selectedLanguage === 'English'
                      ? 'Rewards'
                      : selectedLanguage === 'Telugu'
                        ? 'రివార్డ్స్'
                        : 'रिवॉर्ड्स',
                  route: 'Rewards' as const,
                },
                {
                  id: 9,
                  title:
                    selectedLanguage === 'English'
                      ? 'Feedback/ Rating'
                      : selectedLanguage === 'Telugu'
                        ? 'ఫీడ్‌బ్యాక్/ రేటింగ్'
                        : 'फीडबैक/ रेटिंग',
                  route: 'FeedbackRating' as const,
                },
                {
                  id: 10,
                  title:
                    selectedLanguage === 'English'
                      ? 'Help Center'
                      : selectedLanguage === 'Telugu'
                        ? 'హెల్ప్ సెంటర్'
                        : 'हेल्प सेंटर',
                  route: 'HelpCenter' as const,
                },
                {
                  id: 12,
                  title:
                    selectedLanguage === 'English'
                      ? 'Refer and Earn'
                      : selectedLanguage === 'Telugu'
                        ? 'రెఫర్ మరియు సంపాదించండి'
                        : 'रेफर और कमाएं',
                  route: 'ReferAndEarn' as const,
                },
                {
                  id: 13,
                  title:
                    selectedLanguage === 'English'
                      ? 'PIN Management'
                      : selectedLanguage === 'Telugu'
                        ? 'PIN నిర్వహణ'
                        : 'PIN प्रबंधन',
                  route: 'PinManagement' as const,
                },
                {
                  id: 11,
                  title:
                    selectedLanguage === 'English'
                      ? 'Settings'
                      : selectedLanguage === 'Telugu'
                        ? 'సెట్టింగ్స్'
                        : 'सेटिंग्स',
                  route: 'Settings' as const,
                },
              ].map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.sidebarMenuItem,
                    selectedMenuItem === item.route &&
                    styles.selectedSidebarMenuItem,
                  ]}
                  onPress={() => handleSidebarItemPress(item.route)}
                >
                  <Text
                    style={[
                      styles.menuItemTitle,
                      selectedMenuItem === item.route &&
                      styles.selectedMenuItemTitle,
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      styles.menuItemArrow,
                      selectedMenuItem === item.route &&
                      styles.selectedMenuItemArrow,
                    ]}
                  >
                    ›
                  </Text>
                </TouchableOpacity>
              ))}
              {/* //if token exists show logout else Login */}
              {token ? (
                <TouchableOpacity
                  style={[styles.sidebarMenuItem, styles.logoutMenuItem]}
                  onPress={handleLogout}
                >
                  <Text style={styles.logoutText}>
                    {selectedLanguage === 'English'
                      ? 'Logout'
                      : selectedLanguage === 'Telugu'
                        ? 'లాగౌట్'
                        : 'लॉगआउट'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.sidebarMenuItem, styles.loginMenuItem]}
                  onPress={handleLogin}
                >
                  <Text style={styles.loginText}>
                    {selectedLanguage === 'English'
                      ? 'Login'
                      : selectedLanguage === 'Telugu'
                        ? 'లాగిన్'
                        : 'लॉगिन'}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelLogout}
      >
        <View style={styles.logoutModalOverlay}>
          <View style={styles.logoutModalContainer}>
            <Text style={styles.logoutModalTitle}>
              {selectedLanguage === 'English'
                ? 'Are you sure?'
                : selectedLanguage === 'Telugu'
                  ? 'మీరు ఖచ్చితంగా ఉన్నారా?'
                  : 'क्या आप निश्चित हैं?'}
            </Text>
            <Text style={styles.logoutModalMessage}>
              {selectedLanguage === 'English'
                ? 'Do you want to log out of your account?'
                : selectedLanguage === 'Telugu'
                  ? 'మీరు మీ ఖాతా నుండి లాగౌట్ చేయాలనుకుంటున్నారా?'
                  : 'क्या आप अपने खाते से लॉग आउट करना चाहते हैं?'}
            </Text>
            <View style={styles.logoutModalButtons}>
              <TouchableOpacity
                style={[styles.logoutModalButton, styles.cancelButton]}
                onPress={cancelLogout}
              >
                <Text style={styles.logoutModalButtonText}>
                  {selectedLanguage === 'English'
                    ? 'Cancel'
                    : selectedLanguage === 'Telugu'
                      ? 'రద్దు'
                      : 'रद्द करें'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.logoutModalButton, styles.confirmButton]}
                onPress={confirmLogout}
              >
                <Text style={[styles.logoutModalButtonText, { color: '#FFF' }]}>
                  {selectedLanguage === 'English'
                    ? 'Confirm'
                    : selectedLanguage === 'Telugu'
                      ? 'నిర్ధారించండి'
                      : 'पुष्टि करें'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* <FloatingAd /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
  header: {
    backgroundColor: '#00203F',
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(16),
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  headerTextContainer: {
    flex: 1,
    marginRight: moderateScale(8),
  },
  greeting: {
    color: '#AEEED3',
    fontSize: moderateScale(12),
    opacity: 0.9,
    marginBottom: moderateScale(2),
  },
  headerTitle: {
    color: '#AEEED3',
    fontSize: moderateScale(18),
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: moderateScale(8),
    padding: moderateScale(4),
  },

  iconImage: {
    width: moderateScale(25),
    height: moderateScale(25),
    tintColor: 'white',
  },
  profileButton: {
    marginLeft: moderateScale(8),
    width: moderateScale(36),
    height: moderateScale(36),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: moderateScale(18),
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    backgroundColor: '#EDFFF7',
  },
  contentContainer: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(16),
    paddingBottom: (Platform.OS === 'ios' ? 34 : 0) + moderateScale(24),
  },
  dropdownContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(16),
    marginTop: moderateScale(8),
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  dropdownText: {
    color: '#000',
    fontSize: moderateScale(12),
    flex: 1,
    textAlign: 'center',
    fontWeight: '500',
  },
  servicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // marginBottom: moderateScale(14),
    flexWrap: 'wrap',
  },
  serviceWrapper: {
    width: '48%',
    marginBottom: moderateScale(12),
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
    height: SCREEN_WIDTH * 0.25,
    minHeight: 80,
  },
  serviceImageContainer: {
    position: 'relative',
    height: '100%',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  serviceTextContainer: {
    padding: moderateScale(6),
    alignItems: 'center',
    backgroundColor: '#EDFFF7',
    marginTop: moderateScale(4),
  },
  serviceText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    textAlign: 'center',
    color: '#1E40AF',
    lineHeight: moderateScale(14),
  },
  referBannerContainer: {
    marginBottom: moderateScale(24),
  },
  referBannerGradient: {
    backgroundColor: '#00203F',
    borderRadius: 16,
    padding: moderateScale(16),
    shadowColor: '#00203F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  referBannerContent: {
    alignItems: 'center',
    marginBottom: moderateScale(14),
  },
  referBannerTitle: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: '#AEEED3',
    marginBottom: moderateScale(6),
    textAlign: 'center',
  },
  referBannerSubtitle: {
    fontSize: moderateScale(12),
    color: '#FFFFFF',
    opacity: 0.85,
    textAlign: 'center',
    lineHeight: moderateScale(17),
    paddingHorizontal: moderateScale(8),
  },
  referBannerDesc: {
    fontSize: moderateScale(11),
    color: '#FFFFFF',
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: moderateScale(16),
    paddingHorizontal: moderateScale(12),
    marginTop: moderateScale(8),
  },
  referBannerButton: {
    backgroundColor: '#AEEED3',
    borderRadius: 25,
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(24),
    alignItems: 'center',
    alignSelf: 'center',
    minWidth: '60%',
    shadowColor: '#AEEED3',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  referBannerButtonText: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    color: '#00203F',
  },
  consultedSection: {
    marginBottom: moderateScale(24),
  },
  consultedScrollView: {
    paddingVertical: moderateScale(8),
  },
  doctorCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: moderateScale(12),
    marginRight: moderateScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
    width: SCREEN_WIDTH * 0.7,
    minWidth: 200,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: moderateScale(8),
  },
  avatar: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(22),
  },
  avatarText: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#1976d2',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: moderateScale(2),
  },
  doctorSpecialty: {
    fontSize: moderateScale(12),
    color: '#666',
  },
  noDoctorsText: {
    fontSize: moderateScale(13),
    color: '#666',
    padding: moderateScale(12),
    textAlign: 'center',
  },
  specialtiesSection: {
    marginBottom: moderateScale(24),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(12),
    paddingHorizontal: moderateScale(8),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#1E40AF',
    textAlign: 'center',
    flex: 1,
  },
  arrowButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 8,
    width: moderateScale(28),
    height: moderateScale(28),
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowButtonText: {
    fontSize: moderateScale(20),
    color: '#FFF',
    fontWeight: 'bold',
  },
  specialtiesScrollContainer: {
    paddingHorizontal: moderateScale(4),
  },
  specialtiesGrid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  specialtyWrapper: {
    width: SCREEN_WIDTH * 0.18,
    marginRight: moderateScale(10),
    marginBottom: moderateScale(10),
  },
  specialtyCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    height: SCREEN_WIDTH * 0.14,
    minHeight: 45,
  },
  specialtyImageContainer: {
    height: '100%',
  },
  specialtyImage: {
    width: '100%',
    height: '100%',
  },
  specialtyTextContainer: {
    padding: moderateScale(4),
    alignItems: 'center',
    backgroundColor: '#EDFFF7',
  },
  specialtyText: {
    fontSize: moderateScale(8),
    fontWeight: '500',
    textAlign: 'center',
    color: '#1E40AF',
    lineHeight: moderateScale(11),
  },
  referAndEarnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#00203F',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    borderRadius: 12,
    marginBottom: moderateScale(24),
    marginHorizontal: moderateScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  referAndEarnText: {
    color: '#AEEED3',
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  companySection: {
    backgroundColor: '#00203F',
    marginHorizontal: moderateScale(-16),
    padding: moderateScale(16),
    marginBottom: moderateScale(24),
  },
  companyName: {
    color: '#AEEED3',
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    marginBottom: moderateScale(16),
    textAlign: 'center',
  },
  missionSection: {
    marginBottom: moderateScale(12),
  },
  missionTitle: {
    color: '#AEEED3',
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    marginBottom: moderateScale(4),
  },
  missionText: {
    color: '#fff',
    fontSize: moderateScale(12),
    lineHeight: moderateScale(18),
    opacity: 0.9,
  },
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackground: {
    flex: 1,
  },
  sidebar: {
    width: SCREEN_WIDTH * 0.75,
    backgroundColor: '#FFFFFF',
    height: '100%',
    position: 'absolute',
    right: 0,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 20,
  },
  sidebarHeader: {
    backgroundColor: '#00203F',
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImageContainer: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    overflow: 'hidden',
    marginRight: moderateScale(8),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarProfileImage: {
    width: moderateScale(24),
    height: moderateScale(24),
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: moderateScale(2),
  },
  closeButton: {
    padding: moderateScale(4),
    marginLeft: moderateScale(4),
  },
  closeButtonText: {
    fontSize: moderateScale(28),
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  sidebarContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: moderateScale(8),
  },
  sidebarMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedSidebarMenuItem: {
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 4,
    borderLeftColor: '#1E40AF',
  },
  menuItemTitle: {
    fontSize: moderateScale(13),
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
  },
  selectedMenuItemTitle: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  menuItemArrow: {
    fontSize: moderateScale(18),
    color: '#9CA3AF',
    fontWeight: 'bold',
  },
  selectedMenuItemArrow: {
    color: '#1E40AF',
  },
  logoutMenuItem: {
    marginTop: moderateScale(16),
    marginBottom: (Platform.OS === 'ios' ? 34 : 0) + moderateScale(16),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderBottomWidth: 0,
  },
  loginMenuItem: {
    marginTop: moderateScale(16),
    marginBottom: (Platform.OS === 'ios' ? 34 : 0) + moderateScale(16),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderBottomWidth: 0,
  },
  loginText: {
    fontSize: moderateScale(13),
    color: '#10B981',
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  logoutText: {
    fontSize: moderateScale(13),
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  logoutModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutModalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: moderateScale(16),
    width: SCREEN_WIDTH * 0.8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  logoutModalTitle: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: moderateScale(8),
  },
  logoutModalMessage: {
    fontSize: moderateScale(13),
    color: '#333',
    textAlign: 'center',
    marginBottom: moderateScale(16),
    lineHeight: moderateScale(18),
  },
  logoutModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  logoutModalButton: {
    flex: 1,
    paddingVertical: moderateScale(10),
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: moderateScale(4),
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
  },
  confirmButton: {
    backgroundColor: '#DC2626',
  },
  logoutModalButtonText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#1F2937',
  },
  languageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageModalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: moderateScale(16),
    width: SCREEN_WIDTH * 0.8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  languageModalTitle: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: moderateScale(12),
  },
  languageOption: {
    width: '100%',
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(16),
    borderRadius: 8,
    marginBottom: moderateScale(8),
    backgroundColor: '#F8FAFC',
  },
  selectedLanguageOption: {
    backgroundColor: '#1E40AF',
  },
  languageOptionText: {
    fontSize: moderateScale(13),
    color: '#1F2937',
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedLanguageOptionText: {
    color: '#FFF',
  },
  languageModalButton: {
    marginTop: moderateScale(8),
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(16),
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  languageModalButtonText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#1F2937',
  },

  iconwalletButton: {
    padding: 8,
  },

  iconWrapper: {
    position: 'relative',
  },

  iconwalletImage: {
    width: 28,
    height: 28,
    // width: moderateScale(25),
    // height: moderateScale(25),
    tintColor: 'white',
  },

  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },

  badgeText: {
    color: '#fff',
    fontSize: 7.5,
    fontWeight: 'bold',
  },
});

export default HomeScreen;