// PinManagement.tsx
import React, { useState, useEffect, useRef } from 'react';
import { AuthPost, UsePost, ENDPOINTS } from '../../services';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  LayoutAnimation,
  UIManager,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
;
import messaging from '@react-native-firebase/messaging';
import {
  responsiveWidth,
  responsiveHeight,
  responsiveSafeHeight,
  responsiveText,
  SPACING,
  FONT_SIZE,
  ICON_SIZE,
  LAYOUT,
  isTablet,
  isSmallDevice,
  scale,
  moderateScale,
  verticalScale,
  SAFE_AREA,
} from '../../utils/responsive';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Profile: undefined;
  PinManagement: { action?: 'set' | 'change' | 'forgot'; phoneNumber?: string };
};

type Lang = 'en' | 'hi' | 'te' | 'tel';
type PinAction = 'set' | 'change' | 'forgot';

const translations = {
  en: {
    pinManagement: 'PIN Management',
    setPin: 'Set PIN',
    changePin: 'Change PIN',
    forgotPin: 'Forgot PIN',
    currentPin: 'Current PIN',
    newPin: 'New PIN',
    confirmNewPin: 'Confirm New PIN',
    enterCurrentPin: 'Enter current PIN',
    enterNewPin: 'Enter new PIN',
    confirmPin: 'Confirm PIN',
    pinPlaceholder: 'Enter 4-digit PIN',
    pinsNotMatching: 'PINs do not match',
    pinSetSuccess: 'PIN set successfully',
    pinChangedSuccess: 'PIN changed successfully',
    pinResetSuccess: 'PIN reset successfully',
    error: 'Error',
    success: 'Success',
    submit: 'Submit',
    cancel: 'Cancel',
    back: 'Back',
    // OTP related
    enterVerificationCode: 'Enter Verification Code',
    otpSentTo: 'We sent a 6-digit code to +91 {{phone}}',
    verifyContinue: 'Verify & Continue',
    sending: 'Sending...',
    verifying: 'Verifying...',
    resendPrompt: "Didn't receive the code? ",
    resend: 'Resend',
    enterMobile: 'Enter mobile number',
    sendOtp: 'Send OTP',
    errOtpIncomplete: 'Please enter complete 6-digit OTP',
    mobileNumber: 'Mobile Number',
    errEnterMobile: 'Please enter your mobile number',
    errInvalidMobile: 'Please enter a valid 10-digit Indian mobile number',
    // New messages
    pinAlreadySet: 'PIN already set',
    useChangePin: 'Try to change it instead',
    noPinSet: 'No PIN set',
    setPinNow: 'Set your PIN now',
    show: 'Show',
    hide: 'Hide',
  },
  hi: {
    pinManagement: 'PIN प्रबंधन',
    setPin: 'PIN सेट करें',
    changePin: 'PIN बदलें',
    forgotPin: 'PIN भूल गए',
    currentPin: 'वर्तमान PIN',
    newPin: 'नया PIN',
    confirmNewPin: 'नए PIN की पुष्टि करें',
    enterCurrentPin: 'वर्तमान PIN दर्ज करें',
    enterNewPin: 'नया PIN दर्ज करें',
    confirmPin: 'PIN की पुष्टि करें',
    pinPlaceholder: '4-अंकों का PIN दर्ज करें',
    pinsNotMatching: 'PIN मेल नहीं खा रहे',
    pinSetSuccess: 'PIN सफलतापूर्वक सेट हो गया',
    pinChangedSuccess: 'PIN सफलतापूर्वक बदल गया',
    pinResetSuccess: 'PIN सफलतापूर्वक रीसेट हो गया',
    error: 'त्रुटि',
    success: 'सफल',
    submit: 'जमा करें',
    cancel: 'रद्द करें',
    back: 'वापस',
    // OTP related
    enterVerificationCode: 'सत्यापन कोड दर्ज करें',
    otpSentTo: 'हमने 6-अंकों का कोड +91 {{phone}} पर भेजा है',
    verifyContinue: 'सत्यापित करें और आगे बढ़ें',
    sending: 'भेजा जा रहा है...',
    verifying: 'सत्यापित किया जा रहा है...',
    resendPrompt: 'कोड नहीं मिला? ',
    resend: 'फिर से भेजें',
    enterMobile: 'मोबाइल नंबर दर्ज करें',
    sendOtp: 'ओटीपी भेजें',
    errOtpIncomplete: 'कृपया पूरा 6-अंकों का ओटीपी दर्ज करें',
    mobileNumber: 'मोबाइल नंबर',
    errEnterMobile: 'कृपया अपना मोबाइल नंबर दर्ज करें',
    errInvalidMobile: 'कृपया मान्य 10-अंकों का भारतीय मोबाइल नंबर दर्ज करें',
    // New messages
    pinAlreadySet: 'PIN पहले से सेट है',
    useChangePin: 'इसे बदलने का प्रयास करें',
    noPinSet: 'कोई PIN सेट नहीं है',
    setPinNow: 'अपना PIN अभी सेट करें',
    show: 'दिखाएँ',
    hide: 'छिपाएँ',
  },
  te: {
    pinManagement: 'PIN నిర్వహణ',
    setPin: 'PIN సెట్ చేయండి',
    changePin: 'PIN మార్చండి',
    forgotPin: 'PIN మర్చిపోయారా',
    currentPin: 'ప్రస్తుత PIN',
    newPin: 'కొత్త PIN',
    confirmNewPin: 'కొత్త PIN ని నిర్ధారించండి',
    enterCurrentPin: 'ప్రస్తుత PIN నమోదు చేయండి',
    enterNewPin: 'కొత్త PIN నమోదు చేయండి',
    confirmPin: 'PIN నిర్ధారించండి',
    pinPlaceholder: '4-అంకెల PIN నమోదు చేయండి',
    pinsNotMatching: 'PINలు సరిపోలడం లేదు',
    pinSetSuccess: 'PIN విజయవంతంగా సెట్ చేయబడింది',
    pinChangedSuccess: 'PIN విజయవంతంగా మార్చబడింది',
    pinResetSuccess: 'PIN విజయవంతంగా రీసెట్ చేయబడింది',
    error: 'లోపం',
    success: 'విజయం',
    submit: 'సమర్పించండి',
    cancel: 'రద్దు చేయండి',
    back: 'వెనుకకు',
    // OTP related
    enterVerificationCode: 'సరిచూసే కోడ్ నమోదు చేయండి',
    otpSentTo: '+91 {{phone}} కు 6 అంకెల కోడ్ పంపాం',
    verifyContinue: 'తనిఖీ చేసి కొనసాగండి',
    sending: 'పంపుతున్నాం...',
    verifying: 'తనిఖీ చేస్తున్నాం...',
    resendPrompt: 'కోడ్ రాలేదా? ',
    resend: 'మళ్లీ పంపండి',
    enterMobile: 'మొబైల్ నంబర్',
    sendOtp: 'OTP పంపండి',
    errOtpIncomplete: 'దయచేసి పూర్తి 6 అంకెల OTP నమోదు చేయండి',
    mobileNumber: 'మొబైల్ నంబర్',
    errEnterMobile: 'దయచేసి మీ మొబైల్ నంబర్ నమోదు చేయండి',
    errInvalidMobile: 'చెల్లుబాటు అయ్యే 10 అంకెల భారతీయ మొబైల్ నంబర్ ఇవ్వండి',
    // New messages
    pinAlreadySet: 'PIN ఇప్పటికే సెట్ చేయబడింది',
    useChangePin: 'దాన్ని మార్చడానికి ప్రయత్నించండి',
    noPinSet: 'PIN సెట్ చేయబడలేదు',
    setPinNow: 'మీ PINను ఇప్పుడే సెట్ చేయండి',
    show: 'చూపించు',
    hide: 'దాచు',
  },
  tel: {
    pinManagement: 'PIN నిర్వహణ',
    setPin: 'PIN సెట్ చేయండి',
    changePin: 'PIN మార్చండి',
    forgotPin: 'PIN మర్చిపోయారా',
    currentPin: 'ప్రస్తుత PIN',
    newPin: 'కొత్త PIN',
    confirmNewPin: 'కొత్త PIN ని నిర్ధారించండి',
    enterCurrentPin: 'ప్రస్తుత PIN నమోదు చేయండి',
    enterNewPin: 'కొత్త PIN నమోదు చేయండి',
    confirmPin: 'PIN నిర్ధారించండి',
    pinPlaceholder: '4-అంకెల PIN నమోదు చేయండి',
    pinsNotMatching: 'PINలు సరిపోలడం లేదు',
    pinSetSuccess: 'PIN విజయవంతంగా సెట్ చేయబడింది',
    pinChangedSuccess: 'PIN విజయవంతంగా మార్చబడింది',
    pinResetSuccess: 'PIN విజయవంతంగా రీసెట్ చేయబడింది',
    error: 'లోపం',
    success: 'విజయం',
    submit: 'సమర్పించండి',
    cancel: 'రద్దు చేయండి',
    back: 'వెనుకకు',
    // OTP related
    enterVerificationCode: 'సరిచూసే కోడ్ నమోదు చేయండి',
    otpSentTo: '+91 {{phone}} కు 6 అంకెల కోడ్ పంపాం',
    verifyContinue: 'తనిఖీ చేసి కొనసాగండి',
    sending: 'పంపుతున్నాం...',
    verifying: 'తనిఖీ చేస్తున్నాం...',
    resendPrompt: 'కోడ్ రాలేదా? ',
    resend: 'మళ్లీ పంపండి',
    enterMobile: 'మొబైల్ నంబర్',
    sendOtp: 'OTP పంపండి',
    errOtpIncomplete: 'దయచేసి పూర్తి 6 అంకెల OTP నమోదు చేయండి',
    mobileNumber: 'మొబైల్ నంబర్',
    errEnterMobile: 'దయచేసి మీ మొబైల్ నంబర్ నమోదు చేయండి',
    errInvalidMobile: 'చెల్లుబాటు అయ్యే 10 అంకెల భారతీయ మొబైల్ నంబర్ ఇవ్వండి',
    // New messages
    pinAlreadySet: 'PIN ఇప్పటికే సెట్ చేయబడింది',
    useChangePin: 'దాన్ని మార్చడానికి ప్రయత్నించండి',
    noPinSet: 'PIN సెట్ చేయబడలేదు',
    setPinNow: 'మీ PINను ఇప్పుడే సెట్ చేయండి',
    show: 'చూపించు',
    hide: 'దాచు',
  },
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_SMALL_DEVICE = SCREEN_WIDTH < 375;

const PinManagement = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'PinManagement'>>();
  const currentUserDetails = useSelector((state: any) => state.currentUser);

  const userIdFromStore = currentUserDetails?.userId;

  const hasExistingPin = currentUserDetails?.loginPin &&
    currentUserDetails.loginPin !== null &&
    currentUserDetails.loginPin !== '' &&
    currentUserDetails.loginPin !== 'null';

  const initialAction = route.params?.action? route.params.action : (hasExistingPin ? 'change' : 'set');
  const initialPhoneNumber = route.params?.phoneNumber || '';

  // state
  const [language, setLanguage] = useState<Lang>('en');
  const [action, setAction] = useState<PinAction>(initialAction);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  // show/hide toggles for the pin fields
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  // forgot OTP state
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpUserId, setOtpUserId] = useState<string | null>(null);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);

  // Get translations based on current language
  const t = (key: keyof typeof translations.en, vars?: Record<string, string>) => {
    const langTranslations = translations[language] || translations.en;
    let str = langTranslations[key] as string;
    if (!str) str = translations.en[key];
    if (vars) str = str.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');
    return str;
  };

  // Refs for OTP inputs
  const otpRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    const fetchLanguage = async () => {
      try {
      const stored = await AsyncStorage.getItem('language');
      if (stored === 'hi' || stored === 'te' || stored === 'tel' || stored === 'en') {
        setLanguage(stored as Lang);
      } else if (currentUserDetails?.appLanguage) {
          // Handle both 'te' and 'tel' formats
          const appLang = currentUserDetails.appLanguage;
          if (appLang === 'tel') {
            setLanguage('tel');
          } else if (appLang === 'te' || appLang === 'hi' || appLang === 'en') {
            setLanguage(appLang as Lang);
          }
        }
      } catch (error) {
        console.error('Error fetching language:', error);
      }
    };

    fetchLanguage();

    // if opened specifically for forgot flow, ensure action is correct and phone is prefilled
    if (route.params?.action === 'forgot') {
      setAction('forgot');
      if (route.params?.phoneNumber) setPhoneNumber(route.params.phoneNumber);
    } else if (route.params?.action) {
      setAction(route.params.action);
    } else {
      setAction(hasExistingPin ? 'change' : 'set');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params, hasExistingPin, currentUserDetails]);
  useEffect(() => {
    if (!route.params?.action) {
    const correctAction = hasExistingPin ? 'change' : 'set';
    if (action !== correctAction) {
      setAction(correctAction);
    }
  }
}, [hasExistingPin, route.params?.action, action]);

  const showToast = (type: 'success' | 'error', text1: string, text2?: string) => {
    Toast.show({ type, text1, text2, position: 'top', topOffset: 50, visibilityTime: 3000, autoHide: true });
  };

  const validatePin = (pin: string) => /^\d{4}$/.test(pin);

  // OTP helpers
  const handleOtpChange = (value: string, index: number) => {
    const v = value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = v.slice(0, 1);
    setOtp(newOtp);
    if (v && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleSendOtp = async () => {
    if (phoneNumber.trim() === '') {
      showToast('error', t('error'), t('errEnterMobile'));
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      showToast('error', t('error'), t('errInvalidMobile'));
      return;
    }

    setIsLoading(true);
    try {
      const apiLanguage = language === 'tel' ? 'tel' : language;
      const payload = { mobile: phoneNumber,  userType: 'patient', language: apiLanguage, status: 'active' };
      const response = await UsePost(ENDPOINTS.LOGIN, payload);
      if (response?.data?.userId) {
        setOtpUserId(response.data.userId);
        setIsOtpSent(true);
        showToast('success', t('success'), response?.data?.message || 'OTP sent successfully');
        setTimeout(() => otpRefs.current[0]?.focus(), 150);
      } else {
        showToast('error', t('error'), response?.message || 'Failed to send OTP');
      }
    } catch (err) {
      showToast('error', t('error'), 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      showToast('error', t('error'), t('errOtpIncomplete'));
      return;
    }
    if (!otpUserId) {
      showToast('error', t('error'), 'Missing user info. Send OTP first.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await UsePost(ENDPOINTS.VALIDATE_OTP, { 
        userId: otpUserId, 
        OTP: otpString, 
        mobile: phoneNumber 
      });
      if (response?.status === 'success') {
        const { accessToken, userData } = response.data || {};
        if (accessToken) {
          await AsyncStorage.setItem('authToken', accessToken);
          setVerifiedToken(accessToken);

          // Sync FCM token to backend after OTP verification
          try {
            const fcmToken = await messaging().getToken();
            if (fcmToken) {
              await AuthPost(ENDPOINTS.UPDATE_FCM_TOKEN, { fcmToken }, accessToken);
              console.log('✅ FCM token synced after PinManagement OTP verification');
            }
          } catch (fcmErr) {
            console.log('⚠️ FCM token sync failed after PinManagement OTP:', fcmErr);
          }
        }
        if (userData?.userId) {
          await AsyncStorage.setItem('userId', userData.userId);
          dispatch({ type: 'currentUser', payload: userData });
          dispatch({ type: 'currentUserID', payload: userData.userId });
        } else if (otpUserId) {
          await AsyncStorage.setItem('userId', otpUserId);
          dispatch({ type: 'currentUserID', payload: otpUserId });
        }
        setIsOtpVerified(true);
        showToast('success', t('success'), 'OTP verified successfully');
      } else {
        showToast('error', t('error'), response?.message || 'OTP verification failed');
      }
    } catch (err) {
      showToast('error', t('error'), 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const validateBeforeSubmit = (): boolean => {
    setInlineError(null);

    if (action === 'forgot' && !isOtpVerified) {
      setInlineError('Please verify OTP first');
      return false;
    }
    if (action === 'change' && !validatePin(currentPin)) {
      setInlineError(t('enterCurrentPin'));
      return false;
    }
    if (!validatePin(newPin)) {
      setInlineError(t('enterNewPin'));
      return false;
    }
    if (!validatePin(confirmPin)) {
      setInlineError(t('confirmPin'));
      return false;
    }
    if (newPin !== confirmPin) {
      setInlineError(t('pinsNotMatching'));
      return false;
    }
    return true;
  };

  const handleSetPin = async () => {
    if (!validateBeforeSubmit()) return;
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const uid = userIdFromStore;
      const response = await AuthPost(ENDPOINTS.SET_PIN, { userId: uid, pin: newPin }, token);
      if (response?.status === 'success') {
        const updatedUserDetails = {
          ...currentUserDetails,
          loginPin: newPin
        };
        dispatch({ type: 'currentUser', payload: updatedUserDetails });
        
        showToast('success', t('success'), t('pinSetSuccess'));
        navigation.goBack();
      } else {
        showToast('error', t('error'), response?.message?.message || 'Failed to set PIN');
      }
    } catch (err) {
      showToast('error', t('error'), 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePin = async () => {
    if (!validateBeforeSubmit()) return;
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const uid = userIdFromStore;
      const response = await AuthPost(ENDPOINTS.CHANGE_PIN, { userId: uid, oldPin: currentPin, newPin }, token);
      if (response?.status === 'success') {
      const updatedUserDetails = {
        ...currentUserDetails,
        loginPin: newPin
      };
      dispatch({ type: 'currentUser', payload: updatedUserDetails });
      
        showToast('success', t('success'), t('pinChangedSuccess'));
        navigation.goBack();
      } else {
        showToast('error', t('error'), response?.message?.message || 'Failed to change PIN');
      }
    } catch (err) {
      showToast('error', t('error'), 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPin = async () => {
    if (!validateBeforeSubmit()) return;
    setIsLoading(true);
    try {
      let token = verifiedToken;
      if (!token) token = await AsyncStorage.getItem('authToken');

      const uid = (await AsyncStorage.getItem('userId')) || userIdFromStore || otpUserId;
      if (!uid) {
        showToast('error', t('error'), 'Missing user id. Please re-run OTP flow.');
        setIsLoading(false);
        return;
      }

      const response = await AuthPost(ENDPOINTS.FORGOT_PIN, { userId: uid, newPin }, token);
      if (response?.status === 'success') {
        showToast('success', t('success'), t('pinResetSuccess'));
        navigation.navigate('Login');
      } else {
        showToast('error', t('error'), response?.message || 'Failed to reset PIN');
      }
    } catch (err) {
      showToast('error', t('error'), 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    switch (action) {
      case 'set': return handleSetPin();
      case 'change': return handleChangePin();
      case 'forgot': return handleForgotPin();
    }
  };

  const resetForm = () => {
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setInlineError(null);
    setOtp(['', '', '', '', '', '']);
    setIsOtpSent(false);
    setIsOtpVerified(false);
    setOtpUserId(null);
    setVerifiedToken(null);
    setShowCurrentPin(false);
    setShowNewPin(false);
    setShowConfirmPin(false);
  };

  const handleActionChange = (newAction: PinAction) => {
    if (route.params?.action === 'forgot') return;
    if (newAction === 'set' && hasExistingPin) return;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAction(newAction);
    resetForm();
  };

  const canSubmit = () => {
    if (isLoading) return false;
    if (action === 'forgot' && !isOtpVerified) return false;

    switch (action) {
      case 'set': return !hasExistingPin && validatePin(newPin) && validatePin(confirmPin);
      case 'change': return validatePin(currentPin) && validatePin(newPin) && validatePin(confirmPin);
      case 'forgot': return validatePin(newPin) && validatePin(confirmPin);
      default: return false;
    }
  };

  const sharedInput = {
    keyboardType: Platform.select({ ios: 'number-pad', android: 'numeric' }) as any,
    maxLength: 4,
    placeholderTextColor: '#999',
    contextMenuHidden: true,
  };

  const onlyDigits = (txt: string) => txt.replace(/\D/g, '').slice(0, 4);

  // Tabs / segmented control
  const renderTabs = () => {
    if (route.params?.action === 'forgot') {
      return (
        <View style={styles.segmentRow}>
          <TouchableOpacity style={[styles.segmentItem, styles.segmentItemActive]}>
            <Text style={[styles.segmentText, styles.segmentTextActive]}>{t('forgotPin')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.segmentRow}>
        <TouchableOpacity
          style={[
            styles.segmentItem,
            action === 'set' && styles.segmentItemActive,
            hasExistingPin && styles.segmentItemDisabled
          ]}
          onPress={() => handleActionChange('set')}
          disabled={hasExistingPin}
        >
          <Text style={[
            styles.segmentText,
            action === 'set' && styles.segmentTextActive,
            hasExistingPin && styles.segmentTextDisabled
          ]}>
            {t('setPin')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentItem, action === 'change' && styles.segmentItemActive]}
          onPress={() => handleActionChange('change')}
        >
          <Text style={[styles.segmentText, action === 'change' && styles.segmentTextActive]}>{t('changePin')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderPinStatus = () => {
    if (action === 'set') {
      return (
        <View style={styles.statusContainer}>
          <Text style={[
            styles.statusText,
            hasExistingPin ? styles.statusWarning : styles.statusInfo
          ]}>
            {hasExistingPin ? t('pinAlreadySet') : t('noPinSet')}
          </Text>
          {hasExistingPin && (
            <Text style={styles.statusSubText}>{t('useChangePin')}</Text>
          )}
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled"showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            {renderTabs()}
            {renderPinStatus()}

            {/* Forgot OTP flow */}
            {action === 'forgot' && !isOtpVerified && (
              <View style={styles.otpSection}>
                <Text style={styles.label}>{t('mobileNumber')}</Text>
                <Text style={styles.subLabel}>{t('enterVerificationCode')}</Text>

                <TextInput
                  style={styles.input}
                  value={phoneNumber}
                  onChangeText={(text) => setPhoneNumber(text.replace(/\D/g, '').slice(0, 10))}
                  placeholder={t('enterMobile')}
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  maxLength={10}
                  editable={!isOtpSent && !isLoading}
                />

                {!isOtpSent ? (
                  <TouchableOpacity
                    style={[styles.otpButton, isLoading && styles.buttonDisabled]}
                    onPress={handleSendOtp}
                    disabled={isLoading}
                  >
                    {isLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.otpButtonText}>{t('sendOtp')}</Text>}
                  </TouchableOpacity>
                ) : (
                  <>
                    <Text style={styles.otpSubLabel}>{t('otpSentTo', { phone: phoneNumber })}</Text>
                    <Text style={styles.label}>{t('enterVerificationCode')}</Text>

                    <View style={styles.otpInputContainer}>
                      {otp.map((d, i) => (
                        <View key={i} style={styles.otpInputWrapper}>
                          <TextInput
                            value={d}
                            onChangeText={(val) => handleOtpChange(val, i)}
                            onKeyPress={(e) => handleOtpKeyPress(e, i)}
                            keyboardType="numeric"
                            maxLength={1}
                            style={[styles.otpInput, d ? styles.otpInputFilled : null]}
                            textAlign="center"
                            editable={!isLoading}
                            ref={(ref) => (otpRefs.current[i] = ref)}
                          />
                        </View>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={[styles.otpButton, (isLoading || otp.join('').length !== 6) && styles.buttonDisabled]}
                      onPress={handleVerifyOtp}
                      disabled={isLoading || otp.join('').length !== 6}
                    >
                      {isLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.otpButtonText}>{t('verifyContinue')}</Text>}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {/* PIN inputs */}
            {(action !== 'forgot' || isOtpVerified) && (
              <>
                {action === 'change' && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>{t('currentPin')}</Text>
                    <View style={styles.rowInput}>
                      <TextInput
                        value={currentPin}
                        onChangeText={(v) => setCurrentPin(onlyDigits(v))}
                        placeholder={t('enterCurrentPin')}
                        style={[styles.input, styles.flexInput]}
                        keyboardType={Platform.select({ ios: 'number-pad', android: 'numeric' }) as any}
                        maxLength={4}
                        placeholderTextColor="#999"
                        secureTextEntry={!showCurrentPin}
                      />
                      <TouchableOpacity onPress={() => setShowCurrentPin((s) => !s)} style={styles.showHideBtn}>
                        <Text style={styles.showHideText}>{showCurrentPin ? t('hide') : t('show')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>{t('newPin')}</Text>
                  <View style={styles.rowInput}>
                    <TextInput
                      value={newPin}
                      onChangeText={(v) => setNewPin(onlyDigits(v))}
                      placeholder={t('enterNewPin')}
                      style={[styles.input, styles.flexInput]}
                      keyboardType={Platform.select({ ios: 'number-pad', android: 'numeric' }) as any}
                      maxLength={4}
                      placeholderTextColor="#999"
                      secureTextEntry={!showNewPin}
                      editable={!hasExistingPin || action !== 'set'}
                    />
                    <TouchableOpacity onPress={() => setShowNewPin((s) => !s)} style={styles.showHideBtn}>
                      <Text style={styles.showHideText}>{showNewPin ? t('hide') : t('show')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>{t('confirmNewPin')}</Text>
                  <View style={styles.rowInput}>
                    <TextInput
                      value={confirmPin}
                      onChangeText={(v) => setConfirmPin(onlyDigits(v))}
                      placeholder={t('confirmPin')}
                      style={[styles.input, styles.flexInput]}
                      keyboardType={Platform.select({ ios: 'number-pad', android: 'numeric' }) as any}
                      maxLength={4}
                      placeholderTextColor="#999"
                      secureTextEntry={!showConfirmPin}
                      editable={!hasExistingPin || action !== 'set'}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPin((s) => !s)} style={styles.showHideBtn}>
                      <Text style={styles.showHideText}>{showConfirmPin ? t('hide') : t('show')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {inlineError ? <Text style={styles.inlineError}>{inlineError}</Text> : null}

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (!canSubmit() || isLoading || (action === 'set' && hasExistingPin)) && styles.submitButtonDisabled
                  ]}
                  onPress={handleSubmit}
                  disabled={!canSubmit() || isLoading || (action === 'set' && hasExistingPin)}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {action === 'set' ? t('setPin') : action === 'change' ? t('changePin') : t('forgotPin')}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#DCFCE7',
    paddingTop: SAFE_AREA.safeTop,
  },
  scrollContainer: { 
    flexGrow: 1, 
    paddingHorizontal: IS_SMALL_DEVICE ? SPACING.sm : SPACING.md,
    paddingVertical: SPACING.md,
    paddingBottom: SAFE_AREA.safeBottom + SPACING.md,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(12),
    padding: IS_SMALL_DEVICE ? SPACING.md : SPACING.lg,
    ...LAYOUT.shadow.sm,
    marginHorizontal: IS_SMALL_DEVICE ? SPACING.xs : 0,
  },
  statusContainer: {
    backgroundColor: '#FFF3CD',
    padding: SPACING.sm,
    borderRadius: moderateScale(8),
    marginBottom: SPACING.md,
    borderLeftWidth: moderateScale(3),
    borderLeftColor: '#FFC107',
  },
  statusText: { 
    fontSize: responsiveText(FONT_SIZE.xs), 
    fontWeight: '500',
    lineHeight: moderateScale(16),
  },
  statusWarning: { color: '#856404' },
  statusInfo: { color: '#0C5460' },
  statusSubText: { 
    fontSize: responsiveText(FONT_SIZE.xxs), 
    color: '#856404', 
    marginTop: SPACING.xxs,
    lineHeight: moderateScale(14),
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: '#FAFFFE',
    borderRadius: moderateScale(8),
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: verticalScale(40),
  },
  segmentItem: { 
    flex: 1, 
    paddingVertical: IS_SMALL_DEVICE ? SPACING.sm : SPACING.md, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#FAFFFE' 
  },
  segmentItemActive: { backgroundColor: '#00203F' },
  segmentItemDisabled: { backgroundColor: '#F5F5F5' },
  segmentText: { 
    fontSize: responsiveText(FONT_SIZE.xs), 
    fontWeight: '500', 
    color: '#00203F',
    textAlign: 'center',
  },
  segmentTextActive: { color: '#FFFFFF' },
  segmentTextDisabled: { color: '#9E9E9E' },

  otpSection: { marginBottom: SPACING.md },
  label: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    color: '#333', 
    marginBottom: SPACING.xs, 
    fontWeight: '600' 
  },
  subLabel: { 
    color: '#666', 
    marginBottom: SPACING.sm, 
    fontSize: responsiveText(FONT_SIZE.xs),
    lineHeight: moderateScale(16),
  },
  otpSubLabel: { 
    fontSize: responsiveText(FONT_SIZE.xs), 
    color: '#666', 
    marginBottom: SPACING.md, 
    textAlign: 'center',
    lineHeight: moderateScale(16),
  },
  otpInputContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: SPACING.md, 
    gap: SPACING.xs,
    paddingHorizontal: IS_SMALL_DEVICE ? SPACING.xs : 0,
  },
  otpInputWrapper: { 
    flex: 1, 
    marginHorizontal: IS_SMALL_DEVICE ? SPACING.xxs : SPACING.xs 
  },
  otpInput: {
    height: IS_SMALL_DEVICE ? verticalScale(44) : verticalScale(48),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: moderateScale(8),
    fontSize: responsiveText(FONT_SIZE.md),
    fontWeight: '600',
    backgroundColor: '#fff',
    color: '#00203F',
    textAlign: 'center',
    ...LAYOUT.shadow.xs,
  },
  otpInputFilled: { backgroundColor: '#F0F8FF', borderColor: '#00203F' },
  otpButton: {
    backgroundColor: '#00203F',
    paddingVertical: IS_SMALL_DEVICE ? SPACING.sm : SPACING.md,
    borderRadius: moderateScale(8),
    alignItems: 'center',
    marginTop: SPACING.sm,
    minHeight: verticalScale(44),
    justifyContent: 'center',
    ...LAYOUT.shadow.sm,
  },
  otpButtonText: { 
    color: '#fff', 
    fontSize: responsiveText(FONT_SIZE.sm), 
    fontWeight: '600' 
  },
  buttonDisabled: { opacity: 0.6 },

  inputContainer: { marginBottom: SPACING.md },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: moderateScale(8),
    backgroundColor: '#fff',
    paddingHorizontal: SPACING.sm,
    paddingVertical: IS_SMALL_DEVICE ? SPACING.xs : SPACING.sm,
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#333',
    height: IS_SMALL_DEVICE ? verticalScale(42) : verticalScale(46),
    ...LAYOUT.shadow.xs,
  },
  rowInput: { 
    flexDirection: 'row', 
    alignItems: 'center',
    height: IS_SMALL_DEVICE ? verticalScale(42) : verticalScale(46),
  },
  flexInput: { flex: 1 },
  showHideBtn: { 
    paddingHorizontal: SPACING.sm, 
    paddingVertical: SPACING.xs, 
    marginLeft: SPACING.xs,
    height: '100%',
    justifyContent: 'center',
  },
  showHideText: { 
    color: '#00203F', 
    fontWeight: '600',
    fontSize: responsiveText(FONT_SIZE.xs)
  },

  inlineError: { 
    color: '#D32F2F', 
    marginBottom: SPACING.xs, 
    fontSize: responsiveText(FONT_SIZE.xs), 
    textAlign: 'center',
    lineHeight: moderateScale(16),
  },

  submitButton: {
    backgroundColor: '#00203F',
    paddingVertical: IS_SMALL_DEVICE ? SPACING.sm : SPACING.md,
    borderRadius: moderateScale(8),
    alignItems: 'center',
    marginTop: SPACING.xs,
    minHeight: verticalScale(44),
    justifyContent: 'center',
    ...LAYOUT.shadow.sm,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { 
    color: '#fff', 
    fontSize: responsiveText(FONT_SIZE.sm), 
    fontWeight: '600' 
  },
});

export default PinManagement;