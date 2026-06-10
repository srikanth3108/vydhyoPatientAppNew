import React, { useState, useRef, useEffect } from 'react';
import { UsePost, ENDPOINTS } from '../../services';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {
  View,
  Text,
  // Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Animated,
  Dimensions,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import RoundedButton from '../../components/RoundedButton';

import ThemedText from '../../components/ThemedText';
function capitalizeWords(text: string) {
  return text.replace(/\b\w/g, char => char.toUpperCase());
}
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
;
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  responsiveWidth,
  responsiveHeight,
  responsiveText,
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
import { getStoredReferralCode, clearStoredReferralCode } from '../../utils/useReferralCode';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  OtpVerification: { mobile: string; userId: string };
  Profile: undefined;
};

type Lang = 'en' | 'hi' | 'te';

// Translations
const translations = {
  en: {
    createAccount: 'Create Account',
    subtitle: 'Sign up to get started',
    firstName: 'First Name *',
    lastName: 'Last Name *',
    mobileNumber: 'Mobile Number *',
    referralCode: 'Referral Code (Optional)',
    enterFirstName: 'Enter first name',
    enterLastName: 'Enter last name',
    enterMobile: 'Enter mobile number',
    enterReferral: 'Enter referral code',
    register: 'Register',
    registering: 'Registering...',
    alreadyHaveAccount: 'Already have an account? ',
    login: 'Login',
    error: 'Error',
    success: 'Success',
    errEnterFirstName: 'Please enter your first name',
    errEnterLastName: 'Please enter your last name',
    errEnterMobile: 'Please enter your mobile number',
    errInvalidMobile: 'Please enter a valid 10-digit Indian mobile number',
    networkError: 'Network error. Please try again.',
    registrationSuccessful: 'Registration successful! Please login.',
    registrationFailed: 'Registration failed. Please try again.',
  },
  hi: {
    createAccount: 'खाता बनाएं',
    subtitle: 'शुरू करने के लिए साइन अप करें',
    firstName: 'प्रथम नाम *',
    lastName: 'अंतिम नाम *',
    mobileNumber: 'मोबाइल नंबर *',
    referralCode: 'रेफ़रल कोड (वैकल्पिक)',
    enterFirstName: 'प्रथम नाम दर्ज करें',
    enterLastName: 'अंतिम नाम दर्ज करें',
    enterMobile: 'मोबाइल नंबर दर्ज करें',
    enterReferral: 'रेफ़रल कोड दर्ज करें',
    register: 'पंजीकरण करें',
    registering: 'पंजीकरण हो रहा है...',
    alreadyHaveAccount: 'पहले से खाता है? ',
    login: 'लॉगिन',
    error: 'त्रुटि',
    success: 'सफल',
    errEnterFirstName: 'कृपया अपना प्रथम नाम दर्ज करें',
    errEnterLastName: 'कृपया अपना अंतिम नाम दर्ज करें',
    errEnterMobile: 'कृपया अपना मोबाइल नंबर दर्ज करें',
    errInvalidMobile: 'कृपया मान्य 10-अंकों का भारतीय मोबाइल नंबर दर्ज करें',
    networkError: 'नेटवर्क त्रुटि। कृपया पुनः प्रयास करें।',
    registrationSuccessful: 'पंजीकरण सफल! कृपया लॉगिन करें।',
    registrationFailed: 'पंजीकरण विफल। कृपया पुनः प्रयास करें।',
  },
  te: {
    createAccount: 'ఖాతా సృష్టించండి',
    subtitle: 'ప్రారంభించడానికి సైన్ అప్ చేయండి',
    firstName: 'మొదటి పేరు *',
    lastName: 'చివరి పేరు *',
    mobileNumber: 'మొబైల్ నంబర్ *',
    referralCode: 'రిఫరల్ కోడ్ (ఐచ్ఛికం)',
    enterFirstName: 'మొదటి పేరు నమోదు చేయండి',
    enterLastName: 'చివరి పేరు నమోదు చేయండి',
    enterMobile: 'మొబైల్ నంబర్ నమోదు చేయండి',
    enterReferral: 'రిఫరల్ కోడ్ నమోదు చేయండి',
    register: 'నమోదు చేయండి',
    registering: 'నమోదు చేస్తున్నాము...',
    alreadyHaveAccount: 'ఇప్పటికే ఖాతా ఉందా? ',
    login: 'లాగిన్',
    error: 'లోపం',
    success: 'విజయం',
    errEnterFirstName: 'దయచేసి మీ మొదటి పేరు నమోదు చేయండి',
    errEnterLastName: 'దయచేసి మీ చివరి పేరు నమోదు చేయండి',
    errEnterMobile: 'దయచేసి మీ మొబైల్ నంబర్ నమోదు చేయండి',
    errInvalidMobile: 'చెల్లుబాటు అయ్యే 10 అంకెల భారతీయ మొబైల్ నంబర్ ఇవ్వండి',
    networkError: 'నెట్‌వర్క్ లోపం. దయచేసి మళ్లీ ప్రయత్నించండి.',
    registrationSuccessful: 'నమోదు విజయవంతమైంది! దయచేసి లాగిన్ అవ్వండి.',
    registrationFailed: 'నమోదు విఫలమైంది. దయచేసి మళ్లీ ప్రయత్నించండి.',
  },
} as const;

type LocaleKey = keyof typeof translations.en;
const normalizeLang = (val?: string | null): Lang => {
  const s = (val || '').toLowerCase();
  if (['hi', 'hindi', 'hin'].includes(s)) return 'hi';
  if (['te', 'telugu', 'tel'].includes(s)) return 'te';
  return 'en';
};

const Register = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();

  // Language
  const [language, setLanguage] = useState<Lang>('en');
  const ui = translations[language];
  const t = (key: LocaleKey) => ui[key] ?? translations.en[key];

  useEffect(() => {
    const fetchLanguage = async () => {
      const stored = await AsyncStorage.getItem('language');
      setLanguage(normalizeLang(stored));
    };
    fetchLanguage();
  }, []);

  // State declarations
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [dobPickerVisible, setDobPickerVisible] = useState(false);
  const [genderError, setGenderError] = useState('');
  const [dobError, setDobError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Error states
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [mobileError, setMobileError] = useState('');

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Refs
  const scrollViewRef = useRef<ScrollView | null>(null);
  const lastNameRef = useRef<TextInput | null>(null);
  const phoneRef = useRef<TextInput | null>(null);
  const referralRef = useRef<TextInput | null>(null);

  // Load referral code from deep link storage (if user came via a referral link)
  useEffect(() => {
    const loadReferralCode = async () => {
      try {
        console.log('[Register] 🔍 Checking for stored referral code...');

        // 1. Check route params first (React Navigation deep link: /ref/CODE)
        const routeCode = (route.params as any)?.code;
        if (routeCode) {
          console.log('[Register] 🔗 Found code in route.params:', routeCode);
          setReferralCode(routeCode.toUpperCase());
          return;
        }

        // 2. Fallback: check AsyncStorage (from useReferralCode hook)
        const storedCode = await getStoredReferralCode();
        console.log('[Register] 🔍 Storage result:', storedCode);
        
        if (storedCode) {
          console.log('[Register] ✅ AUTO-FILLING REFERRAL CODE:', storedCode);
          setReferralCode(storedCode);
        } else {
          console.log('[Register] ℹ️ No referral code in storage');
        }
      } catch (error) {
        console.log('[Register] ❌ Error loading referral code:', error);
      }
    };

    loadReferralCode();

    // Re-check when screen gets focus (in case deep link arrives while on another screen)
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('[Register] 👁️ Screen focused - rechecking referral code...');
      loadReferralCode();
    });

    return () => {
      unsubscribe();
    };
  }, [navigation, route.params]);

  // Initialize animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Helper: toast
  const showToast = (
    type: 'success' | 'error',
    text1: string,
    text2?: string,
  ) => {
    Toast.show({
      type,
      text1,
      text2,
      position: 'top',
      topOffset: 50,
      visibilityTime: 3000,
      autoHide: true,
    });
  };

  // Input handlers
  const handleFirstNameChange = (text: string) => {
    setFirstName(text);
    setFirstNameError('');
  };

  const handleLastNameChange = (text: string) => {
    setLastName(text);
    setLastNameError('');
  };

  const handlePhoneNumberChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    setPhoneNumber(numericText);
    setMobileError('');
  };

  const handleReferralCodeChange = (text: string) => {
    setReferralCode(text.toUpperCase());
  };

  // Validation
  const validateForm = () => {
    let isValid = true;

    if (firstName.trim() === '') {
      setFirstNameError(t('errEnterFirstName'));
      isValid = false;
    }

    if (lastName.trim() === '') {
      setLastNameError(t('errEnterLastName'));
      isValid = false;
    }

    if (phoneNumber.trim() === '') {
      setMobileError(t('errEnterMobile'));
      isValid = false;
    } else if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      setMobileError(t('errInvalidMobile'));
      isValid = false;
    }

    if (!gender) {
      setGenderError('Please select your gender');
      isValid = false;
    } else {
      setGenderError('');
    }

    if (!dob) {
      setDobError('Please select your date of birth');
      isValid = false;
    } else {
      setDobError('');
    }

    return isValid;
  };

  // API: Register
  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    const selectedLanguage = language === 'te' ? 'tel' : language;

    try {
      const payload: any = {
        firstname: firstName.trim(),
        lastname: lastName.trim(),
        mobile: phoneNumber,
        userType: 'patient',
        language: selectedLanguage,
        status: 'active',
        gender,
        dob,
      };

      // Add referral code if present
      if (referralCode) {
        payload.referralCode = referralCode.trim();
      }

      const response: any = await UsePost(ENDPOINTS.REGISTER_PATIENT, payload);
      if (response?.status === 'success') {
        showToast('success', t('success'), t('registrationSuccessful'));

        // Clear the stored referral code after successful registration
        await clearStoredReferralCode();

        setTimeout(() => {
          navigation.navigate('OtpVerification', {
            mobile: phoneNumber,
            userId: response.data.userId,
          });
        }, 1500);
      } else {
        const errorMessage =
          ('message' in response ? response.message : null) ||
          t('registrationFailed');
        showToast('error', t('error'), errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || t('networkError');
      showToast('error', t('error'), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit button animation
  const handlePressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();

  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View
            style={[styles.headerContainer, { opacity: fadeAnim }]}
          >
            <View style={styles.headerGradient}>
              <Image
                source={require('../../assets/login.png')}
                style={styles.loginImage}
                resizeMode="cover"
              />
              <View style={styles.headerOverlay} />
            </View>
          </Animated.View>

          {/* Form */}
          <Animated.View
            style={[
              styles.formContainer,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.formCard}>
              <ThemedText style={styles.title}>
                {capitalizeWords(t('createAccount'))}
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                {capitalizeWords(t('subtitle'))}
              </ThemedText>

              {/* First Name */}
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>
                  {capitalizeWords(t('firstName'))}
                </ThemedText>
                <View
                  style={[
                    styles.inputWrapper,
                    firstNameError ? styles.inputError : null,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    value={firstName}
                    onChangeText={handleFirstNameChange}
                    placeholder={capitalizeWords(t('enterFirstName'))}
                    placeholderTextColor="#999"
                    editable={!isLoading}
                    returnKeyType="next"
                    onSubmitEditing={() => lastNameRef.current?.focus()}
                  />
                </View>
                {firstNameError ? (
                  <Text style={styles.errorText}>{firstNameError}</Text>
                ) : null}
              </View>

              {/* Last Name */}
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>
                  {capitalizeWords(t('lastName'))}
                </ThemedText>
                <View
                  style={[
                    styles.inputWrapper,
                    lastNameError ? styles.inputError : null,
                  ]}
                >
                  <TextInput
                    ref={lastNameRef}
                    style={styles.input}
                    value={lastName}
                    onChangeText={handleLastNameChange}
                    placeholder={capitalizeWords(t('enterLastName'))}
                    placeholderTextColor="#999"
                    editable={!isLoading}
                    returnKeyType="next"
                    onSubmitEditing={() => phoneRef.current?.focus()}
                  />
                </View>
                {lastNameError ? (
                  <Text style={styles.errorText}>{lastNameError}</Text>
                ) : null}
              </View>

              {/* Gender */}
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Gender *</ThemedText>
                <View
                  style={[
                    styles.inputWrapper,
                    genderError ? styles.inputError : null,
                  ]}
                >
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      height: '100%',
                      justifyContent: 'center',
                    }}
                    onPress={() => setGender(gender === 'male' ? '' : 'male')}
                  >
                    <Text
                      style={{
                        color: gender === 'male' ? '#00203F' : '#999',
                        fontWeight: '500',
                      }}
                    >
                      {gender === 'male' ? '● ' : '○ '}Male
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      height: '100%',
                      justifyContent: 'center',
                    }}
                    onPress={() =>
                      setGender(gender === 'female' ? '' : 'female')
                    }
                  >
                    <Text
                      style={{
                        color: gender === 'female' ? '#00203F' : '#999',
                        fontWeight: '500',
                      }}
                    >
                      {gender === 'female' ? '● ' : '○ '}Female
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      height: '100%',
                      justifyContent: 'center',
                    }}
                    onPress={() => setGender(gender === 'other' ? '' : 'other')}
                  >
                    <Text
                      style={{
                        color: gender === 'other' ? '#00203F' : '#999',
                        fontWeight: '500',
                      }}
                    >
                      {gender === 'other' ? '● ' : '○ '}Other
                    </Text>
                  </TouchableOpacity>
                </View>
                {genderError ? (
                  <Text style={styles.errorText}>{genderError}</Text>
                ) : null}
              </View>

              {/* Date of Birth */}
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Date of Birth *</ThemedText>
                <TouchableOpacity
                  style={[
                    styles.inputWrapper,
                    dobError ? styles.inputError : null,
                    { minHeight: 48 },
                  ]}
                  onPress={() => setDobPickerVisible(true)}
                  disabled={isLoading}
                >
                  <Text style={{ color: dob ? '#333' : '#999', fontSize: 16 }}>
                    {dob ? dob : 'Select date of birth'}
                  </Text>
                </TouchableOpacity>
                {dobError ? (
                  <Text style={styles.errorText}>{dobError}</Text>
                ) : null}
              </View>

              {/* Mobile Number */}
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>
                  {capitalizeWords(t('mobileNumber'))}
                </ThemedText>
                <View
                  style={[
                    styles.inputWrapper,
                    mobileError ? styles.inputError : null,
                  ]}
                >
                  <Text style={styles.countryCode}>+91</Text>
                  <TextInput
                    ref={phoneRef}
                    style={styles.input}
                    value={phoneNumber}
                    onChangeText={handlePhoneNumberChange}
                    placeholder={capitalizeWords(t('enterMobile'))}
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    maxLength={10}
                    editable={!isLoading}
                    returnKeyType="next"
                    onSubmitEditing={() => referralRef.current?.focus()}
                  />
                </View>
                {mobileError ? (
                  <Text style={styles.errorText}>{mobileError}</Text>
                ) : null}
              </View>

              {/* Referral Code (Optional) */}
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>
                  {capitalizeWords(t('referralCode'))}
                </ThemedText>
                <View style={[styles.inputWrapper, { flexDirection: 'row', alignItems: 'center' }]}>
                  <TextInput
                    ref={referralRef}
                    style={[styles.input, { flex: 1 }]}
                    value={referralCode}
                    onChangeText={handleReferralCodeChange}
                    placeholder={capitalizeWords(t('enterReferral'))}
                    placeholderTextColor="#999"
                    maxLength={10}
                    autoCapitalize="characters"
                    editable={!isLoading}
                    returnKeyType="done"
                    onSubmitEditing={handleRegister}
                  />
                  {!referralCode && (
                    <TouchableOpacity
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        backgroundColor: '#0A8F8F',
                        borderRadius: 6,
                        marginLeft: 8,
                      }}
                      onPress={async () => {
                        try {
                          let ClipboardModule: any;
                          try {
                            ClipboardModule = require('@react-native-clipboard/clipboard').default;
                          } catch {
                            console.log('[Register] Clipboard module not available');
                            return;
                          }
                          const text = await ClipboardModule.getString();
                          if (text) {
                            // Handle REF: prefix from web landing page
                            const code = text.startsWith('REF:')
                              ? text.replace('REF:', '').trim()
                              : text.trim();
                            if (code.length > 0 && code.length <= 10) {
                              handleReferralCodeChange(code.toUpperCase());
                              // Also save to storage
                              await AsyncStorage.setItem('referralCode', code.toUpperCase());
                              ClipboardModule.setString('');
                            }
                          }
                        } catch (err) {
                          console.log('[Register] Paste error:', err);
                        }
                      }}
                    >
                      <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600' }}>
                        📋 Paste
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Register Button */}
              <Animated.View
                style={[
                  styles.submitButtonContainer,
                  { transform: [{ scale: scaleAnim }] },
                ]}
              >
                <RoundedButton
                  title={isLoading ? t('registering') : t('register')}
                  onPress={handleRegister}
                  disabled={isLoading}
                  style={{
                    marginTop: 0,
                    marginBottom: 0,
                    opacity: isLoading ? 0.7 : 1,
                  }}
                  textStyle={{
                    fontSize: responsiveText(isTablet ? 18 : 16),
                    fontWeight: '700',
                  }}
                />
              </Animated.View>

              {/* Already have account link */}
              <View style={styles.loginLinkContainer}>
                <ThemedText style={styles.loginLinkText}>
                  {capitalizeWords(t('alreadyHaveAccount'))}
                </ThemedText>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <ThemedText style={styles.loginLink}>
                    {capitalizeWords(t('login'))}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      {dobPickerVisible && (
        <View style={styles.datePickerContainer}>
          <View
            style={[
              styles.datePickerContent,
              isTablet && styles.datePickerContentTablet,
            ]}
          >
            <Text style={styles.datePickerTitle}>Select Date of Birth</Text>
            <DateTimePicker
              value={dob ? new Date(dob) : new Date(2000, 0, 1)}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)} // add this line
              themeVariant="light"
              textColor="#000"
              style={[
                isTablet && styles.datePickerTablet,
                Platform.OS === 'ios' && styles.datePickerIOS,
              ]}
              onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                setDobPickerVisible(false);
                if (selectedDate) {
                  const yyyy = selectedDate.getFullYear();
                  const mm = String(selectedDate.getMonth() + 1).padStart(
                    2,
                    '0',
                  );
                  const dd = String(selectedDate.getDate()).padStart(2, '0');
                  setDob(`${yyyy}-${mm}-${dd}`);
                  setDobError('');
                }
              }}
            />
            <View style={styles.datePickerButtons}>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setDobPickerVisible(false)}
              >
                <Text style={styles.datePickerCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Toast component */}
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DCFCE7',
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  headerContainer: {
    height: isTablet ? responsiveHeight(22) : responsiveHeight(25),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00203F',
    position: 'relative',
    overflow: 'hidden',
  },
  headerGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 32, 63, 0.1)',
  },
  loginImage: {
    width: SCREEN_WIDTH,
    height: '100%',
    zIndex: 1,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: isTablet ? SPACING.md : SPACING.sm,
    paddingBottom: SAFE_AREA.safeBottom + SPACING.sm,
    marginTop: isTablet ? verticalScale(-25) : verticalScale(-20),
    zIndex: 2,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: LAYOUT.borderRadius.lg,
    paddingHorizontal: isTablet ? SPACING.xl : SPACING.md,
    paddingVertical: isTablet ? SPACING.lg : SPACING.md,
    ...LAYOUT.shadow.lg,
  },
  title: {
    fontSize: responsiveText(isTablet ? 26 : 22),
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.xs,
    color: '#00203F',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: responsiveText(isTablet ? 15 : 13),
    color: '#666',
    textAlign: 'center',
    marginBottom: isTablet ? SPACING.lg : SPACING.md,
    fontWeight: '400',
  },
  inputContainer: {
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: responsiveText(isTablet ? 15 : 14),
    color: '#333',
    marginBottom: SPACING.xs,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: '#fff',
    paddingHorizontal: SPACING.md,
    height: LAYOUT.inputHeight,
    ...LAYOUT.shadow.sm,
  },
  inputError: {
    borderColor: '#D32F2F',
    borderWidth: 1,
  },
  countryCode: {
    fontSize: responsiveText(isTablet ? 17 : 16),
    color: '#00203F',
    fontWeight: '600',
    marginRight: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    paddingRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: responsiveText(isTablet ? 17 : 16),
    color: '#333',
    paddingVertical: SPACING.sm,
    paddingLeft: SPACING.xs,
    fontWeight: '500',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: responsiveText(14),
    marginTop: SPACING.xs,
  },
  submitButtonContainer: {
    marginTop: isTablet ? SPACING.md : SPACING.sm,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#00203F',
    paddingVertical: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    width: '100%',
    ...LAYOUT.shadow.lg,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: responsiveText(isTablet ? 18 : 16),
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    marginLeft: 0,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  loginLinkText: {
    fontSize: responsiveText(14),
    color: '#666',
  },
  loginLink: {
    fontSize: responsiveText(16),
    color: '#007bff',
    fontWeight: '900',
     textDecorationLine: 'underline',
  },
  datePickerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  datePickerContent: {
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    width: responsiveWidth(85),
    maxWidth: moderateScale(400),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: moderateScale(2) },
        shadowOpacity: 0.25,
        shadowRadius: moderateScale(4),
      },
      android: {
        elevation: moderateScale(5),
      },
    }),
  },
  datePickerContentTablet: {
    width: responsiveWidth(60),
    padding: moderateScale(30),
  },
  datePickerTitle: {
    fontSize: responsiveText(isTablet ? 20 : 18),
    fontWeight: '600',
    marginBottom: moderateScale(10),
    color: '#000',
    textAlign: 'center',
  },
  datePickerIOS: {
    height: verticalScale(180),
    backgroundColor: '#fff',
    width: '100%',
  },
  datePickerTablet: {
    height: verticalScale(220),
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: moderateScale(15),
  },
  datePickerButton: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    marginLeft: moderateScale(12),
  },
  datePickerCancel: {
    fontSize: responsiveText(isTablet ? 16 : 15),
    color: '#6c757d',
    fontWeight: '600',
  },
  datePickerConfirm: {
    fontSize: responsiveText(isTablet ? 16 : 15),
    color: '#007bff',
    fontWeight: '700',
  },
});

export default Register;
