import React, { useState, useRef, useEffect } from 'react';
import { AuthPost, UsePost, ENDPOINTS } from '../../services';
import {
  View,
  Text,
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
} from 'react-native';
import RoundedButton from '../../components/RoundedButton';
import ThemedText from '../../components/ThemedText';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
;
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import {
  responsiveText,
  SPACING,
  LAYOUT,
  SAFE_AREA,
  isTablet,
  verticalScale,
} from '../../utils/responsive';
import { useDispatch } from 'react-redux';

type Lang = 'en' | 'hi' | 'te';

// Translations
const translations = {
  en: {
    success: 'Success',
    error: 'Error',
    loginSuccessful: 'OTP verified successfully!',
    otpVerificationFailed: 'Invalid OTP. Please try again.',
  },
  hi: {
    success: 'सफल',
    error: 'त्रुटि',
    loginSuccessful: 'OTP सत्यापित सफलतापूर्वक!',
    otpVerificationFailed: 'अमान्य OTP। कृपया पुनः प्रयास करें।',
  },
  te: {
    success: 'విజయం',
    error: 'లోపం',
    loginSuccessful: 'OTP విజయవంతంగా ధృవీకరించబడింది!',
    otpVerificationFailed: 'చెల్లని OTP. దయచేసి మళ్లీ ప్రయత్నించండి.',
  },
} as const;

type LocaleKey = keyof typeof translations.en;

const normalizeLang = (val?: string | null): Lang => {
  const s = (val || '').toLowerCase();
  if (['hi', 'hindi', 'hin'].includes(s)) return 'hi';
  if (['te', 'telugu', 'tel'].includes(s)) return 'te';
  return 'en';
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  OtpVerification: { mobile: string; userId: string };
  Profile: undefined;
};

type OtpVerificationRouteProp = RouteProp<RootStackParamList, 'OtpVerification'>;

const OtpVerification = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<OtpVerificationRouteProp>();
  const { mobile, userId } = route.params;

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

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Refs for OTP inputs
  const otpRefs = useRef<Array<TextInput | null>>([]);

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

  // Timer for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

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

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      showToast('error', 'Error', 'Please enter complete OTP');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        userId,
        OTP: otpCode,
        mobile,
      };

      const response: any = await UsePost(ENDPOINTS.VALIDATE_OTP, payload);

      if (response?.status === 'success') {
        let { accessToken, userData } = response.data || {};
        const id = userData?.userId;
        await AsyncStorage.setItem('authToken', accessToken);
        await AsyncStorage.setItem('userId', id);
        // Get FCM token & update backend
        try {
          const fcmToken = await messaging().getToken();
          if (fcmToken) {
            const updateResponse = await AuthPost(
              ENDPOINTS.UPDATE_FCM_TOKEN,
              { fcmToken },
              accessToken,
            );
            if (updateResponse?.status === 'success') {
              // Merge FCM token into userData
              userData = { ...userData, fcmToken };
              console.log('✅ FCM token synced after OTP verification');
            }
          }
        } catch (fcmErr) {
          console.log('⚠️ FCM token sync failed after OTP verification:', fcmErr);
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
        const errorMessage = ('message' in response ? response.message : null) || 'Invalid OTP. Please try again.';
        showToast('error', 'Error', errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Network error. Please try again.';
      showToast('error', 'Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    setIsLoading(true);

    try {
      const payload = { mobile };
      const response = await UsePost(ENDPOINTS.RESEND_OTP, payload);

      if (response?.status === 'success') {
        showToast('success', 'Success', 'OTP sent successfully!');
        setResendTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
      } else {
        const errorMessage = ('message' in response ? response.message : null) || 'Failed to resend OTP';
        showToast('error', 'Error', errorMessage);
      }
    } catch (error: any) {
      showToast('error', 'Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View style={[styles.headerContainer, { opacity: fadeAnim }]}>
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
              <ThemedText style={styles.title}>Verify OTP</ThemedText>
              <ThemedText style={styles.subtitle}>
                Enter the 6-digit code sent to
              </ThemedText>
              <ThemedText style={styles.mobileNumber}>+91 {mobile}</ThemedText>

              {/* OTP Input */}
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { otpRefs.current[index] = ref; }}
                    style={styles.otpInput}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="numeric"
                    maxLength={1}
                    editable={!isLoading}
                    selectTextOnFocus
                  />
                ))}
              </View>

              {/* Verify Button */}
              <RoundedButton
                title={isLoading ? 'Verifying...' : 'Verify OTP'}
                onPress={handleVerifyOtp}
                disabled={isLoading}
                style={{
                  marginTop: SPACING.lg,
                  marginBottom: SPACING.md,
                  opacity: isLoading ? 0.7 : 1,
                }}
                textStyle={{ fontSize: responsiveText(isTablet ? 18 : 16), fontWeight: '700' }}
              />

              {/* Resend OTP */}
              <View style={styles.resendContainer}>
                {canResend ? (
                  <TouchableOpacity onPress={handleResendOtp} disabled={isLoading}>
                    <ThemedText style={styles.resendLink}>Resend OTP</ThemedText>
                  </TouchableOpacity>
                ) : (
                  <ThemedText style={styles.resendText}>
                    Resend OTP in {resendTimer}s
                  </ThemedText>
                )}
              </View>

              {/* Back to Login */}
              <View style={styles.loginLinkContainer}>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <ThemedText style={styles.loginLink}>Back to Login</ThemedText>
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
    height: isTablet ? 200 : 220,
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
    marginBottom: SPACING.xs,
    fontWeight: '400',
  },
  mobileNumber: {
    fontSize: responsiveText(isTablet ? 17 : 15),
    color: '#00203F',
    textAlign: 'center',
    marginBottom: SPACING.lg,
    fontWeight: '700',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  otpInput: {
    width: isTablet ? 60 : 50,
    height: isTablet ? 60 : 50,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: LAYOUT.borderRadius.md,
    textAlign: 'center',
    fontSize: responsiveText(isTablet ? 24 : 20),
    fontWeight: '700',
    color: '#00203F',
    backgroundColor: '#fff',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  resendText: {
    fontSize: responsiveText(14),
    color: '#666',
  },
  resendLink: {
    fontSize: responsiveText(14),
    color: '#007bff',
    fontWeight: '700',
  },
  loginLinkContainer: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  loginLink: {
    fontSize: responsiveText(14),
    color: '#007bff',
    fontWeight: '700',
  },
});

export default OtpVerification;


