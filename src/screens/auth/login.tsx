import React, { useState, useRef, useEffect } from 'react';
import { AuthFetch, AuthPost, UsePost, ENDPOINTS } from '../../services';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Animated,
  Dimensions,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import ThemedText from '../../components/ThemedText';
import messaging from '@react-native-firebase/messaging';

function capitalizeWords(text: string) {
  return text.replace(/\b\w/g, char => char.toUpperCase());
}
import RoundedButton from '../../components/RoundedButton';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
;
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  responsiveHeight,
  responsiveText,
  verticalScale,
  moderateScale,
  SPACING,
  LAYOUT,
  SAFE_AREA,
  isTablet,
} from '../../utils/responsive';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  Profile: undefined;
  PinManagement: { action?: 'set' | 'change' | 'forgot'; phoneNumber?: string };
};

type Lang = 'en' | 'hi' | 'te';

// ---------------- select ----------------
const select = {
  en: {
    welcomeBack: 'Welcome Back',
    subtitle: 'Sign in to continue your journey',
    mobileNumber: 'Mobile Number',
    enterMobile: 'Enter mobile number',
    referralQuestion: 'Do you have a referral code?',
    yes: 'Yes',
    no: 'No',
    referralCode: 'Referral Code',
    enterReferral: 'Enter referral code',
    sendOtp: 'Send OTP',
    enterVerificationCode: 'Enter Verification Code',
    otpSentTo: 'We sent a 6-digit code to +91 {{phone}}',
    verifyContinue: 'Verify & Continue',
    sending: 'Sending...',
    verifying: 'Verifying...',
    resendPrompt: "Didn't receive the code? ",
    resend: 'Resend',
    error: 'Error',
    success: 'Success',
    errEnterMobile: 'Please enter your mobile number',
    errInvalidMobile: 'Please enter a valid 10-digit Indian mobile number',
    errEnterReferral: 'Please enter a referral code',
    errOtpIncomplete: 'Please enter complete 6-digit OTP',
    networkError: 'Network error. Please try again.',
    loginSuccessful: 'Login successful',
    sendOtpFailed: 'Failed to send OTP',
    newUser: 'New user? ',
    registerNow: 'Register Now',
    // PIN related translations
    loginWithPin: 'Login with PIN',
    enterPin: 'Enter 4-digit PIN',
    pinPlaceholder: 'Enter PIN',
    forgotPin: 'Forgot PIN?',
    createPin: 'Create PIN',
    changePin: 'Change PIN',
    pinNotCreated: 'PIN not created yet',
    loginMethod: 'Login Method',
    useOtp: 'Use OTP',
    usePin: 'Use PIN',
    invalidPin: 'Invalid PIN',
    pinRequired: 'PIN is required',
    switchToOtp: 'Switch to OTP',
    switchToPin: 'Switch to PIN',
  },
  hi: {
    welcomeBack: ' स्वागत ',
    subtitle: 'जारी रखने के लिए साइन इन करें',
    mobileNumber: 'मोबाइल नंबर',
    enterMobile: 'मोबाइल नंबर दर्ज करें',
    referralQuestion: 'क्या आपके पास रेफ़रल कोड है?',
    yes: 'हाँ',
    no: 'नहीं',
    referralCode: 'रेफ़रल कोड',
    enterReferral: 'रेफ़रल कोड दर्ज करें',
    sendOtp: 'ओटीपी भेजें',
    enterVerificationCode: 'सत्यापन कोड दर्ज करें',
    otpSentTo: 'हमने 6-अंकों का कोड +91 {{phone}} पर भेजा है',
    verifyContinue: 'सत्यापित करें और आगे बढ़ें',
    sending: 'भेजा जा रहा है...',
    verifying: 'सत्यापित किया जा रहा है...',
    resendPrompt: 'कोड नहीं मिला? ',
    resend: 'फिर से भेजें',
    error: 'त्रुटि',
    success: 'सफल',
    errEnterMobile: 'कृपया अपना मोबाइल नंबर दर्ज करें',
    errInvalidMobile: 'कृपया मान्य 10-अंकों का भारतीय मोबाइल नंबर दर्ज करें',
    errEnterReferral: 'कृपया रेफ़रल कोड दर्ज करें',
    errOtpIncomplete: 'कृपया पूरा 6-अंकों का ओटीपी दर्ज करें',
    networkError: 'नेटवर्क त्रुटि। कृपया पुनः प्रयास करें।',
    loginSuccessful: 'लॉगिन सफल',
    sendOtpFailed: 'ओटीपी भेजने में विफल',
    newUser: 'नए उपयोगकर्ता? ',
    registerNow: 'अभी पंजीकरण करें',
    // PIN related translations
    loginWithPin: 'PIN के साथ लॉगिन करें',
    enterPin: '4-अंकों का PIN दर्ज करें',
    pinPlaceholder: 'PIN दर्ज करें',
    forgotPin: 'PIN भूल गए?',
    createPin: 'PIN बनाएं',
    changePin: 'PIN बदलें',
    pinNotCreated: 'PIN अभी तक नहीं बनाया गया',
    loginMethod: 'लॉगिन विधि',
    useOtp: 'OTP का उपयोग करें',
    usePin: 'PIN का उपयोग करें',
    invalidPin: 'अमान्य PIN',
    pinRequired: 'PIN आवश्यक है',
    switchToOtp: 'OTP पर स्विच करें',
    switchToPin: 'PIN पर स्विच करें',
  },
  te: {
    welcomeBack: 'స్వాగతం',
    subtitle: 'కొనసాగేందుకు సైన్–ఇన్ చేయండి',
    mobileNumber: 'మొబైల్ నంబర్',
    enterMobile: 'మొబైల్ నంబర్',
    referralQuestion: 'మీ దగ్గర రిఫరల్ కోడ్ ఉందా?',
    yes: 'అవును',
    no: 'లేదు',
    referralCode: 'రిఫరల్ కోడ్',
    enterReferral: 'రిఫరల్ కోడ్ నమోదు చేయండి',
    sendOtp: 'OTP పంపండి',
    enterVerificationCode: 'సరిచూసే కోడ్ నమోదు చేయండి',
    otpSentTo: '+91 {{phone}} కు 6 అంకెల కోడ్ పంపాం',
    verifyContinue: 'తనిఖీ చేసి కొనసాగండి',
    sending: 'పంపుతున్నాం...',
    verifying: 'తనిఖీ చేస్తున్నాం...',
    resendPrompt: 'కోడ్ రాలేదా? ',
    resend: 'మళ్లీ పంపండి',
    error: 'లోపం',
    success: 'విజయం',
    errEnterMobile: 'దయచేసి మీ మొబైల్ నంబర్ నమోదు చేయండి',
    errInvalidMobile: 'చెల్లుబాటు అయ్యే 10 అంకెల భారతీయ మొబైల్ నంబర్ ఇవ్వండి',
    errEnterReferral: 'దయచేసి రిఫరల్ కోడ్ నమోదు చేయండి',
    errOtpIncomplete: 'దయచేసి పూర్తి 6 అంకెల OTP నమోదు చేయండి',
    networkError: 'నెట్‌వర్క్ లోపం. దయచేసి మళ్లీ ప్రయత్నించండి.',
    loginSuccessful: 'లాగిన్ విజయవంతమైంది',
    sendOtpFailed: 'OTP పంపడం విఫలమైంది',
    newUser: 'కొత్త వినియోగదారు? ',
    registerNow: 'ఇప్పుడే నమోదు చేయండి',
    // PIN related translations
    loginWithPin: 'PIN తో లాగిన్ అవ్వండి',
    enterPin: '4-అంకెల PIN నమోదు చేయండి',
    pinPlaceholder: 'PIN నమోదు చేయండి',
    forgotPin: 'PIN మర్చిపోయారా?',
    createPin: 'PIN సృష్టించండి',
    changePin: 'PIN మార్చండి',
    pinNotCreated: 'PIN ఇంకా సృష్టించబడలేదు',
    loginMethod: 'లాగిన్ పద్ధతి',
    useOtp: 'OTP ఉపయోగించండి',
    usePin: 'PIN ఉపయోగించండి',
    invalidPin: 'చెల్లని PIN',
    pinRequired: 'PIN అవసరం',
    switchToOtp: 'OTPకి మారండి',
    switchToPin: 'PINకి మారండి',
  },
} as const;

type LocaleKey = keyof typeof select.en;
const normalizeLang = (val?: string | null): Lang => {
  const s = (val || '').toLowerCase();
  if (['hi', 'hindi', 'hin'].includes(s)) return 'hi';
  if (['te', 'telugu', 'tel'].includes(s)) return 'te';
  return 'en';
};
// --------------------------------------

const Login = () => {
  const dispatch = useDispatch();
  // const route = useRoute<RouteProp<RootStackParamList, 'Login'>>();

  // Language
  const [language, setLanguage] = useState<Lang>('en');
  const ui = select[language];
  const t = (key: LocaleKey, vars?: Record<string, string>) => {
    let str = (ui[key] ?? select.en[key]) as string;
    if (vars) str = str.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');
    return str;
  };

  useEffect(() => {
    const fetchLanguage = async () => {
      const stored = await AsyncStorage.getItem('language');
      setLanguage(normalizeLang(stored));
    };
    fetchLanguage();
  }, []);

  // State management
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [pin, setPin] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showReferralPrompt, setShowReferralPrompt] = useState(false);
  const [hasReferralCode, setHasReferralCode] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [loginMethod, setLoginMethod] = useState<'otp' | 'pin'>('otp');
  const [mobileError, setMobileError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [pinError, setPinError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerFadeAnim = useRef(new Animated.Value(1)).current;

  // Refs
  const otpRefs = useRef<Array<TextInput | null>>([]);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const referralInputRef = useRef<TextInput | null>(null);
  const pinInputRef = useRef<TextInput | null>(null);

  // Navigation
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

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

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isOtpSent && resendTimer > 0) {
      interval = setInterval(() => setResendTimer((p) => p - 1), 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isOtpSent, resendTimer]);

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
  const handlePhoneNumberChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    setPhoneNumber(numericText);
    setMobileError('');
  };

  // const handleReferralCodeChange = (text: string) => {
  //   setReferralCode(text.toUpperCase());
  // };

  const handlePinChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 4) {
      setPin(numericText);
      setPinError('');
    }
  };

  const handleMobileFocus = () => {
    if (!isOtpSent && !showReferralPrompt) {
      setShowReferralPrompt(true);
      scrollViewRef.current?.scrollTo({ y: responsiveHeight(20), animated: true });
    }
  };

  // const handleReferralResponse = (response: boolean) => {
  //   setHasReferralCode(response);
  //   setShowReferralPrompt(false);
  //   if (response) {
  //     setTimeout(() => {
  //       referralInputRef.current?.focus();
  //       scrollViewRef.current?.scrollTo({ y: responsiveHeight(25), animated: true });
  //     }, 100);
  //   } else {
  //     setReferralCode('');
  //   }
  // };

  // OTP handlers
  const handleOtpChange = (value: string, index: number) => {
    const cleaned = value.replace(/\D/g, '');

    // If user pasted / autofilled full OTP
    if (cleaned.length > 1) {
      const digits = cleaned.slice(0, 6).split('');
      const newOtp = ['', '', '', '', '', ''];

      digits.forEach((digit, i) => {
        newOtp[i] = digit;
      });

      setOtp(newOtp);
      setOtpError('');

      otpRefs.current[Math.min(digits.length, 5)]?.focus();
      return;
    }

    // Normal typing
    const newOtp = [...otp];
    newOtp[index] = cleaned;

    setOtp(newOtp);
    setOtpError('');

    if (cleaned && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };
  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Toggle login method
  const toggleLoginMethod = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLoginMethod(prev => prev === 'otp' ? 'pin' : 'otp');
    setOtp(['', '', '', '', '', '']);
    setPin('');
    setIsOtpSent(false);
    setOtpError('');
    setPinError('');
    setMobileError('');
  };

  const handleLoginWithPin = async () => {
    if (phoneNumber.trim() === '') {
      setMobileError(t('errEnterMobile'));
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      setMobileError(t('errInvalidMobile'));
      return;
    }
    if (pin.length !== 4) {
      setPinError(t('pinRequired'));
      return;
    }
    if (hasReferralCode && referralCode.trim() === '') {
      showToast('error', t('error'), t('errEnterReferral'));
      return;
    }

    setIsLoading(true);
    Animated.timing(headerFadeAnim, { toValue: 0.3, duration: 300, useNativeDriver: true }).start();

    try {
      const payload = {
        mobile: phoneNumber,
        pin: pin,
        role: 'patient',
        ...(hasReferralCode && referralCode && { referralCode }),
      };
      const response: any = await UsePost(ENDPOINTS.LOGIN_WITH_PIN, payload);
      console.log('PIN login response:', response);
      if (response?.status === 'success') {
        const { accessToken, userData } = response.data;
        const id = userData?.userId;
        console.log('PIN login successful, authToken:', accessToken);
        await AsyncStorage.setItem('authToken', accessToken);
        await AsyncStorage.setItem('userId', id);

        // Sync FCM token to backend after PIN login
        try {
          const fcmToken = await messaging().getToken();
          if (fcmToken) {
            await AuthPost(ENDPOINTS.UPDATE_FCM_TOKEN, { fcmToken }, accessToken);
            console.log('✅ FCM token synced after PIN login');
          }
        } catch (fcmErr) {
          console.log('⚠️ FCM token sync failed after PIN login:', fcmErr);
        }

        dispatch({ type: 'currentUser', payload: userData });
        dispatch({ type: 'currentUserID', payload: id });
        showToast('success', t('success'), t('loginSuccessful'));

        setTimeout(() => {
          if (!userData?.firstname) {
            navigation.navigate('Profile');
          } else {
            navigation.navigate('Home');
          }
        }, 1500);
      } else {
        const errorMessage = response?.message || t('invalidPin');
        setPinError(errorMessage);

        if (errorMessage.includes('not created') || errorMessage.includes('not found')) {
          showToast('error', t('error'), t('pinNotCreated'));
        } else {
          showToast('error', t('error'), errorMessage);
        }
      }
    } catch (error: any) {
      let errorMessage = t('networkError');

      if (error?.response?.status === 500) {
        errorMessage = 'Server error. Please try OTP login instead.';
      }

      setPinError(errorMessage);
      showToast('error', t('error'), errorMessage);
    } finally {
      setIsLoading(false);
      Animated.timing(headerFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  };

  const fetchWalletData = async (token: string, userId: string) => {
    if ((!token || !userId)) {
      return;
    }
    try {
      const response = await AuthFetch(ENDPOINTS.GET_AVAILABLE_BALANCE(userId), token);
      console.log('finance/available', response);
      if (response.status === 'success') {
        const walletData = response.data.data
        console.log("walletData90", walletData)
        if (!walletData) return
        dispatch({ type: 'userWallet', payload: walletData });
      } else {
        console.error('Failed to fetch wallet data:', response);
      }
    } catch (error: any) {
      console.log('Error fetching wallet data:', error.message);
    }
  };


  // API: send OTP
  const handleSendOtp = async () => {
    if (phoneNumber.trim() === '') {
      setMobileError(t('errEnterMobile'));
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      setMobileError(t('errInvalidMobile'));
      return;
    }
    if (hasReferralCode && referralCode.trim() === '') {
      showToast('error', t('error'), t('errEnterReferral'));
      return;
    }

    setIsLoading(true);
    setMobileError('');
    Animated.timing(headerFadeAnim, { toValue: 0.3, duration: 300, useNativeDriver: true }).start();
    const selectedLanguage = language === 'te' ? "tel" : language

    try {
      const payload = {
        mobile: phoneNumber,
        userType: 'patient',
        language: selectedLanguage, // pass normalized code
        status: 'active',
        ...(hasReferralCode && referralCode && { referralCode }),
      };

      const response: any = await UsePost(ENDPOINTS.LOGIN, payload);

      if (response?.data?.userId) {
        setUserId(response.data?.userId);
        setIsOtpSent(true);
        setResendTimer(60);
        setCanResend(false);
        showToast('success', t('success'), response?.data?.message || t('sendOtp'));
        setTimeout(() => {
          otpRefs.current[0]?.focus();
          scrollViewRef.current?.scrollTo({ y: responsiveHeight(30), animated: true });
        }, 100);
      } else {
        setMobileError(response?.message || t('sendOtpFailed'));
        Animated.timing(headerFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      }
    } catch (e) {
      setMobileError(t('networkError'));
      Animated.timing(headerFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;
    setCanResend(false);
    setResendTimer(60);
    setOtp(['', '', '', '', '', '']);
    setOtpError('');
    await handleSendOtp();
  };

  // API: validate OTP / submit
  const handleSubmit = async () => {
    console.log('Submit clicked with state:', { phoneNumber, otp, pin, loginMethod, isOtpSent });
    if (loginMethod === 'pin') {
      await handleLoginWithPin();
      return;
    }

    if (!isOtpSent) {
      handleSendOtp();
      return;
    }

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setOtpError(t('errOtpIncomplete'));
      return;
    }

    setIsLoading(true);
    try {
      console.log('Validating OTP with payload:', { userId, OTP: otpString, mobile: phoneNumber });
      const response: any = await UsePost(ENDPOINTS.VALIDATE_OTP, {
        userId,
        OTP: otpString,
        mobile: phoneNumber,
      });
      console.log('OTP validation response:', response);

      if (response?.status === 'success') {
        let { accessToken, userData } = response.data || {};
        const id = userData?.userId;
        console.log('bomUser ID:', id);
        console.log('accessToken boom:', accessToken);
        await AsyncStorage.setItem('authToken', accessToken);
        await AsyncStorage.setItem('userId', id);
        await fetchWalletData(accessToken, id)
        // Get FCM token & update backend
        const fcmToken = await messaging().getToken();
        console.log('FCM Token:', fcmToken);
        if (fcmToken) {
          const updateResponse = await AuthPost(
            ENDPOINTS.UPDATE_FCM_TOKEN,
            { fcmToken },
            accessToken,
          );
          if (updateResponse?.status === 'success') {
            // Merge FCM token into userData
            userData = { ...userData, fcmToken };
          }
        }

        dispatch({ type: 'currentUser', payload: userData });
        dispatch({ type: 'currentUserID', payload: id });
        showToast('success', t('success'), t('loginSuccessful'));

        setTimeout(() => {
          if (!userData?.firstname) {
            navigation.navigate('Profile');
          } else {
            navigation.navigate('Home');
          }
        }, 1500);
      } else {
        setOtpError('message' in (response || {}) ? response.message : t('errOtpIncomplete'));
      }
    } catch (e) {
      setOtpError(t('networkError'));
    } finally {
      setIsLoading(false);
    }
  };



  const handleForgotPin = () => {
    navigation.navigate('PinManagement', {
      action: 'forgot',
      phoneNumber: phoneNumber
    });
  };

  const getButtonText = () => {
    if (loginMethod === 'pin') return t('loginWithPin');
    if (isOtpSent) return t('verifyContinue');
    return t('sendOtp');
  };

  const getLoadingText = () => {
    if (loginMethod === 'pin') return t('verifying');
    if (isOtpSent) return t('verifying');
    return t('sending');
  };

  // Check if PIN error indicates PIN doesn't exist
  // const shouldShowForgotPin = () => {India@1947
  //   if (pinError && (pinError.includes('PIN not set'))) {
  //     return false;
  //   }
  //   return true;
  // };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 20}      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with login image */}
          <Animated.View
            style={[styles.headerContainer, { opacity: headerFadeAnim }]}
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
              <ThemedText style={styles.title}>{t('welcomeBack')}</ThemedText>
              <ThemedText style={styles.subtitle}>{t('subtitle')}</ThemedText>

              {/* Mobile number */}
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>{t('mobileNumber')}</ThemedText>
                <View style={[styles.inputWrapper, mobileError ? styles.inputError : null]}>
                  <ThemedText style={styles.countryCode}>+91</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={phoneNumber}
                    onChangeText={handlePhoneNumberChange}
                    placeholder={capitalizeWords(t('enterMobile'))}
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    maxLength={10}
                    editable={!isOtpSent && !isLoading}
                    onFocus={handleMobileFocus}
                  />
                </View>
                {mobileError ? <ThemedText style={styles.errorText}>{mobileError}</ThemedText> : null}

                {/* Login Method Toggle */}
                <View style={styles.methodToggleContainer}>
                  <TouchableOpacity onPress={toggleLoginMethod}>
                    <ThemedText style={styles.methodToggleText}>
                      {loginMethod === 'otp' ? t('switchToPin') : t('switchToOtp')}
                    </ThemedText>
                  </TouchableOpacity>
                </View>

                {/* PIN Input */}
                {loginMethod === 'pin' && !isOtpSent && (
                  <View style={styles.pinContainer}>
                    <ThemedText style={styles.label}>{t('enterPin')}</ThemedText>
                    <View style={[styles.inputWrapper, pinError ? styles.inputError : null]}>
                      <TextInput
                        ref={pinInputRef}
                        style={[styles.input, { flex: 1 }]}
                        value={pin}
                        onChangeText={handlePinChange}
                        placeholder={capitalizeWords(t('pinPlaceholder'))}
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        maxLength={4}
                        secureTextEntry={!showPin}
                        editable={!isLoading}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPin((s) => !s)}
                        style={{ paddingHorizontal: SPACING.md, justifyContent: 'center' }}
                      >
                        <ThemedText style={{ color: '#007bff', fontWeight: '700', fontSize: responsiveText(14) }}>
                          {showPin ? (language === 'hi' ? 'छिपाएँ' : language === 'te' ? 'దాచు' : 'Hide') : (language === 'hi' ? 'दिखाएँ' : language === 'te' ? 'చూపించు' : 'Show')}
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                    {pinError ? <ThemedText style={styles.errorText}>{pinError}</ThemedText> : null}

                    {pinError &&
                      !pinError.includes('PIN not set') &&
                      !pinError.toLowerCase().includes('no user found') && (
                        <TouchableOpacity style={styles.forgotPinButton} onPress={handleForgotPin}>
                          <ThemedText style={styles.forgotPinText}>{t('forgotPin')}</ThemedText>
                        </TouchableOpacity>
                      )}
                  </View>
                )}

                {/* Referral prompt */}
                {/* {showReferralPrompt && (
                  <View style={styles.referralPromptContainer}>
                    <View style={styles.referralPromptCard}>
                      <ThemedText style={styles.referralPromptText}>
                        {t('referralQuestion')}
                      </ThemedText>
                      <View style={styles.referralButtonContainer}>
                        <TouchableOpacity
                          style={[
                            styles.referralButton,
                            styles.yesButton,
                            hasReferralCode && styles.selectedButton,
                          ]}
                          onPress={() => handleReferralResponse(true)}
                        >
                          <ThemedText
                            style={[
                              styles.referralButtonText,
                              hasReferralCode
                                ? styles.selectedButtonText
                                : styles.unselectedButtonText,
                            ]}
                          >
                            {t('yes')}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.referralButton,
                            styles.noButton,
                            !hasReferralCode && styles.selectedButton,
                          ]}
                          onPress={() => handleReferralResponse(false)}
                        >
                          <ThemedText
                            style={[
                              styles.referralButtonText,
                              !hasReferralCode
                                ? styles.selectedButtonText
                                : styles.unselectedButtonText,
                            ]}
                          >
                            {t('no')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )} */}

                {/* Referral input */}
                {/* {hasReferralCode && !showReferralPrompt && !isOtpSent && (
                  <View style={styles.referralInputContainer}>
                    <ThemedText style={styles.label}>{t('referralCode')}</ThemedText>
                    <TextInput
                      ref={referralInputRef}
                      style={styles.input}
                      value={referralCode}
                      onChangeText={handleReferralCodeChange}
                      placeholder={capitalizeWords(t('enterReferral'))}
                      placeholderTextColor="#999"
                      maxLength={10}
                      autoCapitalize="characters"   
                      editable={!isLoading}
                    />
                  </View>
                )} */}
              </View>

              {/* OTP section */}
              {isOtpSent && loginMethod === 'otp' && (
                <View style={styles.otpContainer}>
                  <ThemedText style={styles.otpLabel}>
                    {t('enterVerificationCode')}
                  </ThemedText>
                  <ThemedText style={styles.otpSubLabel}>
                    {t('otpSentTo', { phone: phoneNumber })}
                  </ThemedText>
                  <View style={styles.otpInputContainer}>
                    {otp.map((digit, index) => (
                      <View key={index} style={styles.otpInputWrapper}>
                        <TextInput
                          ref={ref => { otpRefs.current[index] = ref; }}
                          style={[
                            styles.otpInput,
                            digit ? styles.otpInputFilled : null,
                          ]}
                          value={digit}
                          onChangeText={value => handleOtpChange(value, index)}
                          onKeyPress={e => handleOtpKeyPress(e, index)}
                          keyboardType="numeric"
                          maxLength={index === 0 ? 6 : 1}
                          textAlign="center"
                          textContentType="oneTimeCode"
                          autoComplete="sms-otp"
                          editable={!isLoading}
                        />
                      </View>
                    ))}
                  </View>
                  {otpError ? <ThemedText style={styles.errorText}>{otpError}</ThemedText> : null}

                  <View style={styles.resendContainer}>
                    <ThemedText style={styles.resendText}>{t('resendPrompt')}</ThemedText>
                    {canResend ? (
                      <TouchableOpacity onPress={handleResendOtp} disabled={isLoading}>
                        <ThemedText style={[styles.resendLink, isLoading && styles.resendLinkDisabled]}>{t('resend')}</ThemedText>
                      </TouchableOpacity>
                    ) : (
                      <ThemedText style={styles.resendTimerText}>Resend OTP in {resendTimer} seconds</ThemedText>
                    )}
                  </View>
                </View>
              )}

              {/* Submit button */}
              <Animated.View
                style={[
                  styles.submitButtonContainer,
                  { transform: [{ scale: scaleAnim }] },
                ]}
              >
                <RoundedButton
                  title={isLoading ? getLoadingText() : getButtonText()}
                  onPress={handleSubmit}
                  disabled={isLoading}
                  style={{
                    marginTop: 0,
                    marginBottom: 0,
                    opacity: isLoading ? 0.7 : 1,
                  }}
                  textStyle={{ fontSize: responsiveText(isTablet ? 18 : 16), fontWeight: '700' }}
                />
              </Animated.View>

              {/* New User Register Link */}
              <View style={styles.registerLinkContainer}>
                <ThemedText style={styles.registerLinkText}>{t('newUser')}</ThemedText>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <ThemedText style={styles.registerLink}>{t('registerNow')}</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toast component */}
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DCFCE7'
  },
  keyboardAvoidingContainer: {
    flex: 1
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between'
  },
  headerContainer: {
    height: isTablet ? responsiveHeight(35) : responsiveHeight(40),
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
    width: SCREEN_WIDTH, // Full screen width
    height: '100%',
    zIndex: 1,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: isTablet ? SPACING.xxl : SPACING.xl,
    paddingBottom: SAFE_AREA.safeBottom + SPACING.lg,
    marginTop: isTablet ? verticalScale(-40) : verticalScale(-30),
    zIndex: 2,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: LAYOUT.borderRadius.lg,
    paddingHorizontal: isTablet ? SPACING.xxl : SPACING.lg,
    paddingVertical: isTablet ? SPACING.xxl : SPACING.xl,
    ...LAYOUT.shadow.lg,
  },
  title: {
    fontSize: responsiveText(isTablet ? 32 : 28),
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.xs,
    color: '#00203F',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: responsiveText(isTablet ? 18 : 16),
    color: '#666',
    textAlign: 'center',
    marginBottom: isTablet ? SPACING.xxl : SPACING.xl,
    fontWeight: '400',
  },
  inputContainer: {
    marginBottom: SPACING.xl
  },
  label: {
    fontSize: responsiveText(isTablet ? 17 : 15),
    color: '#333',
    marginBottom: SPACING.sm,
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
    fontWeight: '500'
  },
  errorText: {
    color: '#D32F2F',
    fontSize: responsiveText(14),
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  // Method Toggle Styles
  methodToggleContainer: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  methodToggleText: {
    color: '#007bff',
    fontSize: responsiveText(14),
    fontWeight: '600',
    fontStyle: 'italic',
  },
  // PIN Styles
  pinContainer: {
    marginTop: SPACING.lg
  },
  forgotPinButton: {
    alignSelf: 'flex-end',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md
  },
  forgotPinText: {
    color: '#007bff',
    fontSize: responsiveText(14),
    fontWeight: '600'
  },
  // Referral Styles
  referralPromptContainer: {
    marginTop: SPACING.lg,
    alignItems: 'center'
  },
  referralPromptCard: {
    backgroundColor: '#F8FFFE',
    borderRadius: LAYOUT.borderRadius.md,
    padding: isTablet ? SPACING.xl : SPACING.lg,
    borderWidth: 1,
    borderColor: '#E0F7E0',
    width: '100%',
    alignItems: 'center',
  },
  referralPromptText: {
    fontSize: responsiveText(isTablet ? 18 : 16),
    color: '#333',
    marginBottom: SPACING.lg,
    fontWeight: '600',
    textAlign: 'center'
  },
  referralButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: SPACING.md
  },
  referralButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center'
  },
  yesButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#00203F'
  },
  noButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#00203F'
  },
  selectedButton: {
    backgroundColor: '#00203F',
    borderColor: '#00203F',
  },
  referralButtonText: {
    fontSize: responsiveText(isTablet ? 16 : 14),
    fontWeight: '700',
    textAlign: 'center'
  },
  selectedButtonText: {
    color: '#fff',
  },
  unselectedButtonText: {
    color: '#00203F',
  },
  referralInputContainer: {
    marginTop: SPACING.lg
  },
  // OTP Styles
  otpContainer: {
    marginBottom: SPACING.xl,
    alignItems: 'center'
  },
  otpLabel: {
    fontSize: responsiveText(isTablet ? 18 : 16),
    color: '#333',
    marginBottom: SPACING.sm,
    fontWeight: '700',
    textAlign: 'center'
  },
  otpSubLabel: {
    fontSize: responsiveText(isTablet ? 16 : 14),
    color: '#666',
    marginBottom: isTablet ? SPACING.xl : SPACING.lg,
    textAlign: 'center',
    lineHeight: moderateScale(20)
  },
  otpInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    width: '100%'
  },
  otpInputWrapper: {
    flex: 1,
    marginHorizontal: SPACING.xs
  },
  otpInput: {
    width: '100%',
    height: isTablet ? verticalScale(60) : verticalScale(52),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: LAYOUT.borderRadius.md,
    fontSize: responsiveText(isTablet ? 20 : 18),
    fontWeight: '700',
    backgroundColor: '#fff',
    color: '#00203F',
    textAlign: 'center',
    ...LAYOUT.shadow.sm,
  },
  otpInputFilled: {
    backgroundColor: '#F0F8FF',
    ...LAYOUT.shadow.md,
  },
  submitButtonContainer: {
    marginTop: isTablet ? SPACING.xxl : SPACING.xl,
    alignItems: 'center'
  },
  submitButton: {
    backgroundColor: '#00203F',
    paddingVertical: SPACING.lg,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    width: '100%',
    ...LAYOUT.shadow.lg,
  },
  submitButtonDisabled: {
    opacity: 0.7
  },
  submitButtonText: {
    color: '#fff',
    fontSize: responsiveText(isTablet ? 18 : 16),
    fontWeight: '700'
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm
  },
  loadingText: {
    marginLeft: 0
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  resendText: {
    fontSize: responsiveText(14),
    color: '#666'
  },
  resendLink: {
    fontSize: responsiveText(14),
    color: '#007bff',
    fontWeight: '700'
  },
  resendLinkDisabled: {
    opacity: 0.5
  },
  resendTimerText: {
    color: '#666',
    fontSize: responsiveText(14),
  },
  registerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
    gap: SPACING.sm,
  },
  registerLinkText: {
    fontSize: responsiveText(14),
    color: '#666',
  },
  registerLink: {
    fontSize: responsiveText(16),
    color: '#007bff',
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});

export default Login;