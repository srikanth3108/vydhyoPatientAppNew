import React, { useEffect, useState } from 'react';
import { AuthFetch, ENDPOINTS } from '../../services';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
;
import { useDispatch } from 'react-redux';
import {
  responsiveWidth,
  responsiveHeight,
  responsiveSafeHeight,
  responsiveText,
  scale,
  verticalScale,
  moderateScale,
  SPACING,
  FONT_SIZE,
  ICON_SIZE,
  LAYOUT,
  SAFE_AREA,
  isTablet,
  isIOS,
  isSmallDevice,
  DYNAMIC_DIMENSIONS,
} from '../../utils/responsive';

type RootStackParamList = {
  Home: undefined;
  Login: undefined;
};

const LanguageSelection = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Track loading state

  const languages = ['English', 'Telugu', 'Hindi'];

  useEffect(() => {
    const checkAuthToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        const storedUserId = await AsyncStorage.getItem('userId');

        if (storedToken && storedUserId) {
          const profileResponse = await AuthFetch(ENDPOINTS.GET_USER(), storedToken);
          console.log('Profile response:', profileResponse);

          if (
            profileResponse.status === 'success' &&
            'data' in profileResponse &&
            profileResponse.data
          ) {
            const userData = profileResponse.data.data;
            const id = userData.UserId;
            dispatch({ type: 'currentUser', payload: userData });
            dispatch({ type: 'currentUserID', payload: id });
            // Navigate to Home immediately for logged-in user
            navigation.replace('Home');
          } else {
            // Clear invalid token/userId and stay on LanguageSelection
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('userId');
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error checking auth token:', error);
        // Clear invalid token/userId and stay on LanguageSelection
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userId');
        setIsLoading(false);
      }
    };

    checkAuthToken();
  }, [dispatch, navigation]);

  //   useEffect(()=>{
  //       const languageSelection = async () => {
  //       try {
  //         const storedToken = await AsyncStorage.getItem('authToken');

  //         if (storedToken ) {
  //           const languageResponse = await AuthFetch(ENDPOINTS.VYDUSER396_LANGUAGE(selectedLanguage), storedToken);
  //           console.log('Profile response:', languageResponse);

  //           if (
  //             languageResponse.status === 'success' &&
  //             'data' in languageResponse &&
  //             languageResponse.data
  //           ) {
  //             const userData = languageResponse.data.data;
  //             const id = userData.UserId;
  //             dispatch({ type: 'currentUser', payload: userData });
  //             dispatch({ type: 'currentUserID', payload: id });
  //             // Navigate to Home immediately for logged-in user
  //             navigation.replace('Home');
  //           } else {
  //             // Clear invalid token/userId and stay on LanguageSelection
  //             await AsyncStorage.removeItem('authToken');
  //             await AsyncStorage.removeItem('userId');
  //             setIsLoading(false);
  //           }
  //         } else {
  //           setIsLoading(false);
  //         }
  //       } catch (error) {
  //         console.error('Error checking auth token:', error);
  //         // Clear invalid token/userId and stay on LanguageSelection
  //         await AsyncStorage.removeItem('authToken');
  //         await AsyncStorage.removeItem('userId');
  //         setIsLoading(false);
  //       }
  //     };

  // languageSelection()
  //   }, [selectedLanguage])

  const handleContinue = async () => {
    // Store selected language (optional, depending on your backend requirements)
    const storedToken = await AsyncStorage.getItem('authToken');
    const storedUserId = await AsyncStorage.getItem('userId');
    await AsyncStorage.setItem('language', selectedLanguage);
    if (!storedToken && !storedUserId && Platform.OS !== 'ios') {
      navigation.navigate('Login');
    } else {
  if (Platform.OS === 'ios') {
        navigation.navigate('Home' as never);
        return;
      }
    }
  };

  const handleLanguageSelect = (language: string) => {
    const selected =
      language === 'English' ? 'en' : language === 'Telugu' ? 'tel' : 'hi';
    setSelectedLanguage(selected);
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
      </View>

      {/* Language Selection */}
      <View style={styles.selectionContainer}>
        <Text style={styles.label}>Select Your Language</Text>

        <TouchableOpacity style={styles.dropdown} onPress={toggleDropdown}>
          <View style={styles.dropdownContent}>
            <View style={styles.globeIcon}>
              <Text style={styles.globeText}>🌐</Text>
            </View>
            <Text style={styles.dropdownText}>{selectedLanguage}</Text>
            <Text style={[styles.arrow, isDropdownOpen && styles.arrowUp]}>
              ▼
            </Text>
          </View>
        </TouchableOpacity>

        {/* Language Selection Modal */}
        <Modal
          visible={isDropdownOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsDropdownOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsDropdownOpen(false)}
          >
            <View style={styles.modalContent}>
              <FlatList
                data={languages}
                keyExtractor={item => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.languageItem,
                      selectedLanguage === item && styles.selectedLanguageItem,
                    ]}
                    onPress={() => handleLanguageSelect(item)}
                  >
                    <Text
                      style={[
                        styles.languageText,
                        selectedLanguage === item &&
                          styles.selectedLanguageText,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDFFF7',
    paddingHorizontal: responsiveWidth(6),
    paddingTop: SAFE_AREA.safeTop + verticalScale(20),
    paddingBottom: SAFE_AREA.safeBottom,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#EDFFF7',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SAFE_AREA.safeTop,
    paddingBottom: SAFE_AREA.safeBottom,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: isTablet ? verticalScale(40) : verticalScale(20),
    marginBottom: isTablet ? verticalScale(60) : verticalScale(40),
  },
  logo: {
    width: isTablet ? responsiveWidth(60) : responsiveWidth(80),
    height: isTablet ? responsiveHeight(40) : responsiveHeight(35),
    resizeMode: 'contain',
    maxWidth: scale(320),
    maxHeight: scale(320),
  },
  selectionContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: isTablet ? verticalScale(80) : verticalScale(60),
  },
  label: {
    fontSize: responsiveText(isTablet ? 18 : 16),
    color: '#00203F',
    marginBottom: SPACING.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  dropdown: {
    width: '100%',
    height: LAYOUT.inputHeight,
    backgroundColor: '#00203F',
    borderRadius: LAYOUT.borderRadius.md,
    marginBottom: SPACING.lg,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    ...LAYOUT.shadow.md,
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  globeIcon: {
    width: ICON_SIZE.md,
    height: ICON_SIZE.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  globeText: {
    fontSize: responsiveText(isTablet ? 20 : 18),
    color: '#FFFFFF',
  },
  dropdownText: {
    color: '#FFFFFF',
    fontSize: responsiveText(isTablet ? 18 : 16),
    fontWeight: '500',
    flex: 1,
    marginLeft: SPACING.sm,
  },
  arrow: {
    color: '#FFFFFF',
    fontSize: responsiveText(isTablet ? 14 : 12),
    transform: [{ rotate: '0deg' }],
  },
  arrowUp: {
    transform: [{ rotate: '180deg' }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.lg,
    width: isTablet ? responsiveWidth(60) : responsiveWidth(80),
    maxHeight: responsiveSafeHeight(50),
    elevation: 5,
    ...LAYOUT.shadow.lg,
  },
  languageItem: {
    paddingVertical: isTablet ? SPACING.lg : SPACING.md,
    paddingHorizontal: isTablet ? SPACING.xl : SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedLanguageItem: {
    backgroundColor: '#E8F4F8',
  },
  languageText: {
    fontSize: responsiveText(isTablet ? 18 : 16),
    color: '#2C5F5D',
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedLanguageText: {
    color: '#2C5F5D',
    fontWeight: '600',
  },
  continueButton: {
    width: '100%',
    height: LAYOUT.buttonHeight,
    backgroundColor: '#00203F',
    borderRadius: LAYOUT.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...LAYOUT.shadow.md,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: responsiveText(isTablet ? 18 : 16),
    fontWeight: '600',
  },
});

export default LanguageSelection;
