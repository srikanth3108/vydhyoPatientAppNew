import React, { useState, useEffect, useCallback } from 'react';
import { AuthFetch, AuthPost, ENDPOINTS } from '../../services';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/navigationTypes';
;
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import moment from 'moment';
import { CFEnvironment, CFSession } from 'cashfree-pg-api-contract';
import { CFPaymentGatewayService } from 'react-native-cashfree-pg-sdk';
import { useSelector } from 'react-redux';
import { WebView } from 'react-native-webview';

// Import responsive utilities
import {
  responsiveWidth,
  responsiveText,
  scale,
  verticalScale,
  moderateScale,
  SPACING,
  FONT_SIZE,
  LAYOUT,
  SAFE_AREA,
} from '../../utils/responsive';

type PaymentRouteProp = RouteProp<RootStackParamList, 'Payment'>;

interface PaymentProps {
  route: PaymentRouteProp;
}


/** ---------- i18n (EN / HI / TEL) ---------- */
type Lang = 'en' | 'hi' | 'tel';

const normalizeLang = (l?: string): Lang => {
  if (l === 'en' || l === 'hi' || l === 'tel') return l;
  if (l === 'te') return 'tel';
  return 'en';
};

const UI = {
  headerTitle: {
    en: 'Complete Your Payment',
    hi: 'अपना भुगतान पूरा करें',
    tel: 'మీ చెల్లింపును పూర్తి చేయండి',
  },
  reviewDetails: {
    en: 'Review Details',
    hi: 'विवरण की जाँच करें',
    tel: 'వివరాలను పరిశీలించండి',
  },
  labels: {
    patientName: { en: 'Patient Name', hi: 'रोगी का नाम', tel: 'రోగి పేరు' },
    doctor: { en: 'Doctor', hi: 'डॉक्टर', tel: 'డాక్టర్' },
    mode: { en: 'Mode', hi: 'मोड', tel: 'రీతి' },
    clinicName: {
      en: 'Clinic Name',
      hi: 'क्लिनिक का नाम',
      tel: 'క్లినిక్ పేరు',
    },
    clinicAddress: {
      en: 'Clinic Address',
      hi: 'क्लिनिक का पता',
      tel: 'క్లినిక్ చిరునామా',
    },
    dateTime: { en: 'Date & Time', hi: 'तारीख और समय', tel: 'తేదీ & సమయం' },
    consultationFee: {
      en: 'Consultation Fee',
      hi: 'परामर्श शुल्क',
      tel: 'కన్సల్టేషన్ ఫీజు',
    },
  },
  selectPaymentOption: {
    en: 'Select Payment Option',
    hi: 'भुगतान विकल्प चुनें',
    tel: 'చెల్లింపు ఎంపికను ఎంచుకోండి',
  },
  options: {
    payNow:{ en: 'Pay Now', hi: 'अभी भुगतान करें', tel: 'ఇప్పుడే చెల్లించండి' },
    upi: { en: 'UPI', hi: 'UPI', tel: 'UPI' },
    wallet: { en: 'Wallet', hi: 'वॉलेट', tel: 'వాలెట్' },
    referral: { en: 'Referral', hi: 'रेफरल', tel: 'రెఫరల్' },
  },
  payNow: { en: 'Pay Now', hi: 'अभी भुगतान करें', tel: 'ఇప్పుడే చెల్లించండి' },
  cancel: { en: 'Cancel', hi: 'रद्द करें', tel: 'రద్దు చేయండి' },
  autoCancelNotice: {
    en: 'Auto-Cancel Notice: If payment is not completed booking will be automatically cancelled.',
    hi: 'स्वतः रद्द सूचना: यदि भुगतान पूर्ण नहीं हुआ, तो बुकिंग अपने आप रद्द हो जाएगी।',
    tel: 'ఆటో-రద్దు గమనిక: చెల్లింపు పూర్తి కాకపోతే బుకింగ్ ఆటోమేటిక్‌గా రద్దు అవుతుంది.',
  },
  completeKycNow: {
    en: 'Complete KYC Now',
    hi: 'अभी KYC पूरी करें',
    tel: 'ఇప్పుడే KYC పూర్తి చేయండి',
  },
  promoCode: {
    en: 'Promo Code',
    hi: 'प्रमो कोड',
    tel: 'ప్రోమో కోడ్',
  },
  enterPromoCode: {
    en: 'Enter Promo Code',
    hi: 'प्रमो कोड दर्ज करें',
    tel: 'ప్రోమో కోడ్ నమోదు చేయండి',
  },
  applyPromoCode: {
    en: 'Apply',
    hi: 'लागू करें',
    tel: 'వర్తించు',
  },
  invalidPromoCode: {
    en: 'Invalid Promo Code',
    hi: 'अमान्य प्रमो कोड',
    tel: 'చెల్లని ప్రోమో కోడ్',
  },
  promoCodeApplied: {
    en: 'Promo Code Applied',
    hi: 'प्रमो कोड लागू',
    tel: 'ప్రోమో కోడ్ వర్తించబడింది',
  },
  discountPrefix: {
    en: 'Discount: ',
    hi: 'छूट: ',
    tel: 'ছাড়: ',
  },
  discount: {
    en: 'Discount',
    hi: 'छूट',
    tel: 'ఛాయం',
  },
  originalFee: {
    en: 'Original Consultation Fee',
    hi: 'मूल परामर्श शुल्क',
    tel: 'అసలు కన్సల్టేషన్ ఫీజు',
  },
  discountAmount: {
    en: 'Discount Amount',
    hi: 'छूट की राशि',
    tel: 'ఛాయం మొత్తం',
  },
  finalAmount: {
    en: 'Final Amount',
    hi: 'अंतिम राशि',
    tel: 'తుది మొత్తం',
  },
  walletBalance: {
    en: 'Wallet Balance',
    hi: 'वॉलेट बैलेंस',
    tel: 'వాలెట్ బ్యాలెన్స్',
  },
  useWallet: {
    en: 'Use Wallet Balance',
    hi: 'वॉलेट बैलेंस उपयोग करें',
    tel: 'వాలెట్ బ్యాలెన్స్ ఉపయోగించండి',
  },
  walletDeduction: {
    en: 'Wallet Deduction',
    hi: 'वॉलेट कटौती',
    tel: 'వాలెట్ తగ్గింపు',
  },
remainingViaUpi: {
  en: 'Remaining to pay',
  hi: 'बची राशि',
  tel: 'మిగిలిన మొత్తం',
},
  noWalletBalance: {
    en: 'No wallet balance available',
    hi: 'कोई वॉलेट बैलेंस उपलब्ध नहीं',
    tel: 'వాలెట్ బ్యాలెన్స్ అందుబాటులో లేదు',
  },
  // Alerts & Toasts
  error: { en: 'Error', hi: 'त्रुटि', tel: 'లోపం' },
  success: { en: 'Success', hi: 'सफलता', tel: 'విజయం' },
  ok: { en: 'OK', hi: 'ठीक', tel: 'సరే' },
  notLoggedInReschedule: {
    en: 'You are not logged in. Please log in to reschedule your appointment.',
    hi: 'आप लॉग इन नहीं हैं। कृपया अपॉइंटमेंट पुनर्निर्धारित करने के लिए लॉग इन करें।',
    tel: 'మీరు లాగిన్ కాలేదు. అపాయింట్‌మెంట్ రీషెడ్యూల్ చేయడానికి లాగిన్ అవండి.',
  },
  appointmentRescheduled: {
    en: 'Appointment rescheduled successfully',
    hi: 'अपॉइंटमेंट सफलतापूर्वक पुनर्निर्धारित',
    tel: 'అపాయింట్‌మెంట్ విజయవంతంగా రీషెడ్యూల్ అయింది',
  },
  rescheduleFailed: {
    en: 'Failed to reschedule appointment',
    hi: 'अपॉइंटमेंट पुनर्निर्धारित करने में विफल',
    tel: 'అపాయింట్‌మెంట్ రీషెడ్యూల్ విఫలమైంది',
  },
  notLoggedInRelease: {
    en: 'You are not logged in. Please log in to release the slot.',
    hi: 'आप लॉग इन नहीं हैं। कृपया स्लॉट रिलीज़ करने के लिए लॉग इन करें।',
    tel: 'మీరు లాగిన్ కాలేదు. స్లాట్ విడుదల చేయడానికి లాగిన్ అవండి.',
  },
  releaseFailed: {
    en: 'Failed to release slot',
    hi: 'स्लॉट रिलीज़ करने में विफल',
    tel: 'స్లాట్ విడుదల విఫలమైంది',
  },
  invalidAmount: {
    title: { en: 'Invalid Amount', hi: 'अमान्य राशि', tel: 'చెల్లని మొత్తం' },
    msg: {
      en: 'Please provide a valid consultation fee.',
      hi: 'कृपया मान्य परामर्श शुल्क दें।',
      tel: 'దయచేసి సరైన కన్సల్టేషన్ ఫీజు ఇవ్వండి.',
    },
  },
  paymentVerifiedPrefix: {
    en: 'Payment Verified: ',
    hi: 'भुगतान सत्यापित: ',
    tel: 'చెల్లింపు ధృవీకరించబడింది: ',
  },
  paymentFailed: {
    en: 'Payment Failed',
    hi: 'भुगतान विफल',
    tel: 'చెల్లింపు విఫలమైంది',
  },
  orderIdPrefix: { en: 'Order ID: ', hi: 'ऑर्डर आईडी: ', tel: 'ఆర్డర్ ఐడి: ' },
  paymentOpened: {
    en: 'Payment page opened',
    hi: 'भुगतान पृष्ठ खोला गया',
    tel: 'చెల్లింపు పేజీ తెరుచుకుంది',
  },
  paymentError: {
    en: 'Payment Error',
    hi: 'भुगतान त्रुटि',
    tel: 'చెల్లింపు లోపం',
  },
  somethingWentWrong: {
    en: 'Something went wrong',
    hi: 'कुछ गलत हो गया',
    tel: 'ఏదో తప్పు జరిగింది',
  },
  createApptFailedTitle: {
    en: 'Appointment Creation Failed',
    hi: 'अपॉइंटमेंट बनाना विफल हुआ',
    tel: 'అపాయింట్‌మెంట్ సృష్టి విఫలమైంది',
  },
  createApptFailedMsg: {
    en: 'Failed to Create Appointment',
    hi: 'अपॉइंटमेंट बनाना विफल',
    tel: 'అపాయింట్‌మెంట్ సృష్టి విఫలమైంది',
  },
  createApptRetry: {
    en: 'Failed to Create Appointment Please Retry',
    hi: 'अपॉइंटमेंट नहीं बन पाया, कृपया पुनः प्रयास करें',
    tel: 'అపాయింట్‌మెంట్ సృష్టి కాలేదు, దయచేసి మళ్ళీ ప్రయత్నించండి',
  },
  inPerson: { en: 'In-Person', hi: 'प्रत्यक्ष', tel: 'సాక్షాత్' },
  kycNotCompleted: {
    en: 'KYC Not Completed',
    hi: 'KYC पूरा नहीं हुआ',
    tel: 'KYC పూర్తి కాలేదు',
  },
  kycWarningSubtitle: {
    en: 'To use your wallet, please complete your KYC verification.',
    hi: 'अपने वॉलेट का उपयोग करने के लिए, कृपया अपनी KYC सत्यापन पूरी करें।',
    tel: 'మీ వాలెట్ ఉపయోగించడానికి, దయచేసి మీ KYC ధృవీకరణను పూర్తి చేయండి.',
  },
  referralDiscountApplied: {
    en: 'Referral Discount Applied',
    hi: 'रेफरल छूट लागू',
    tel: 'రెఫరల్ ఛాయం వర్తించబడింది',
  },
};

const Payment: React.FC<PaymentProps> = ({ route }) => {
  const { doctor, date, time, patient, clinic, type, appointmentId, mode } =
    route.params;
  const user: any = useSelector((state: any) => state.currentUser);
  const lang: Lang = normalizeLang(user?.appLanguage);
  const userWallet = useSelector((s: any) => s.userWallet);

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600);
  const [timerStarted, setTimerStarted] = useState(false);
  const [useVydhyaAid, setUseVydhyaAid] = useState(false);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [kycCompleted, setKycCompleted] = useState(false);
  const [platformFee, setPlatformFee] = useState(0);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [couponId, setCouponId] = useState<string | null>(null);
  const [hasAppointments, setHasAppointments] = useState<boolean | null>(null);
  const [checkingAppointments, setCheckingAppointments] = useState(true);
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [referralFinalAmount, setReferralFinalAmount] = useState<number | null>(null);
  const [selectedDiscount, setSelectedDiscount] = useState<'referral' | 'promo' | null>(null);

  // Wallet states
 
  const [useWalletBalance, setUseWalletBalance] = useState(false);

  const options = [
    { id: 'upi', name: 'UPI' },
  ];

  async function getToken() {
    const token = await AsyncStorage.getItem('authToken');
    return token;
  }



  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timerStarted) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 0) {
            clearInterval(timer);
            navigation.goBack();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timerStarted, navigation]);

  useEffect(() => {
    const checkAppointments = async () => {
      try {
        const token = await getToken();
        const userId = user?.userId;

        if (!token || !userId) {
          setCheckingAppointments(false);
          return;
        }

        const response: any = await AuthFetch(
          ENDPOINTS.GET_ALL_FAMILY_APPOINTMENTS(userId, 'scheduled'),
          token
        );
        console.log("res12345",response)

        if (response?.data?.data?.length > 0) {
          setHasAppointments(true);
        } else {
          setHasAppointments(false);
        }
      } catch (error) {
        setHasAppointments(false);
      } finally {
        setCheckingAppointments(false);
      }
    };

    checkAppointments();
  }, [user?.userId, lang]);

  useEffect(() => {
    if (selectedDiscount === 'referral' && hasAppointments === false && user?.usedReferralCode) {
      const discount = user?.referralDiscount;
      const consultationFee = Array.isArray(doctor.consultationFee)
        ? doctor.consultationFee[0].fee
        : doctor.consultationFee;

      setReferralDiscount(discount);
      setReferralFinalAmount(Math.max(consultationFee - discount, 0));
      Toast.show({
        type: 'success',
        text1: UI.referralDiscountApplied[lang],
        text2: `₹ ${discount} discount applied`,
      });
    } else {
      setReferralDiscount(0);
      setReferralFinalAmount(null);
    }
  }, [selectedDiscount, hasAppointments, user?.usedReferralCode, user?.referralDiscount, doctor.consultationFee, lang]);

  useEffect(() => {
    if (
      hasAppointments === false &&
      user?.usedReferralCode &&
      user?.referralDiscount > 0
    ) {
      setSelectedDiscount('referral');
      setAppliedPromoCode(null);
      setPromoDiscount(0);
      setPromoCode('');
      setCouponId(null);
    }
  }, [
    hasAppointments,
    user?.usedReferralCode,
    user?.referralDiscount,
  ]);

  const getConsultationFee = () => {
    return Array.isArray(doctor.consultationFee)
      ? doctor.consultationFee[0].fee
      : doctor.consultationFee;
  };

  // Compute the fee after promo/referral discounts (before wallet)
  const getDiscountedFee = () => {
    const consultationFee = getConsultationFee();
    if (appliedPromoCode && promoDiscount > 0) {
      return Math.max(consultationFee - promoDiscount, 0);
    }
    if (selectedDiscount === 'referral' && referralFinalAmount !== null) {
      return referralFinalAmount;
    }
    return consultationFee;
  };

  // Wallet deduction amount (capped at discounted fee)
  const getWalletDeduction = () => {
    if (!useWalletBalance || !userWallet || userWallet.balance <= 0) return 0;
    const discountedFee = getDiscountedFee();
    return Math.min(userWallet.balance, discountedFee);
  };

  // Amount remaining to pay via UPI after wallet deduction
  const getUpiAmount = () => {
    const discountedFee = getDiscountedFee();
    const walletDeduction = getWalletDeduction();
    return Math.max(discountedFee - walletDeduction, 0);
  };

  const walletBalance = userWallet?.balance || 0;
  const hasWalletBalance = userWallet?.balance && userWallet?.balance > 0;

  const formatTimeForAPI = useCallback((timeSlot: string) => {
    if (!timeSlot) return '';
    const [t, period] = timeSlot.split(' ');
    let [hours, minutes] = t.split(':');
    let h = parseInt(hours, 10);

    if (period === 'PM' && h !== 12) {
      h += 12;
    } else if (period === 'AM' && h === 12) {
      h = 0;
    }
    return `${h.toString().padStart(2, '0')}:${minutes}`;
  }, []);

  const rescheduleAppointment = async () => {
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert(UI.error[lang], UI.notLoggedInReschedule[lang]);
        return;
      }
      const selectedDateMoment = moment(date, [
        'DD-MM-YYYY',
        'YYYY-MM-DD',
      ]).format('YYYY-MM-DD');

      const rescheduleData = {
        appointmentId: appointmentId,
        newDate: selectedDateMoment,
        newTime: formatTimeForAPI(time),
        reason: '',
      };

      const response: any = await AuthPost(
        ENDPOINTS.RESCHEDULE_APPOINTMENT,
        rescheduleData,
        token,
      );

      if (response.status === 'success') {
        const appointment: any = response?.data?.appointmentDetails;
        Alert.alert(
          UI.success[lang],
          response?.data?.message || UI.appointmentRescheduled[lang],
          [{ text: UI.ok[lang] }],
        );
        navigation.navigate('BookingConfirmation', {
          appointmentDetails: appointment,
          paymentDetails: response?.data?.paymentDetails || {},
        });
      } else {
        Toast.show({
          type: 'error',
          text1: UI.error[lang],
          text2:
            response?.message?.message ||
            response?.data?.message ||
            UI.rescheduleFailed[lang],
          position: 'top',
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      Alert.alert(UI.error[lang], UI.somethingWentWrong[lang]);
    }
  };

  const handleReleaseSlot = async (reason: any) => {
    try {
      const token = await getToken();
      const latestAppointmentDetails = await AsyncStorage.getItem(
        'latestAppointmentDetails',
      );
      const appointmentDetails = latestAppointmentDetails
        ? JSON.parse(latestAppointmentDetails)
        : null;

      if (!appointmentDetails) return;

      if (!token) {
        Alert.alert(UI.error[lang], UI.notLoggedInRelease[lang]);
        return;
      }

      const response: any = await AuthPost(
        ENDPOINTS.RELEASE_DOCTOR_SLOT,
        { appointmentDetails, reason },
        token,
      );

      if (response.status === 'success') {
        await AsyncStorage.removeItem('latestAppointmentDetails');
      } else {
        Alert.alert(
          UI.error[lang],
          response?.message?.message ||
          response?.data?.message ||
          UI.releaseFailed[lang],
        );
      }
    } catch (error) {
      Alert.alert(UI.error[lang], UI.somethingWentWrong[lang]);
    }
  };

  // ===============payment sdk start====================
  const handleCashfreePayment2 = async (platformFee: any) => {
    const amount = doctor?.consultationFee[0].fee || 0;
    if (amount <= 0) {
      Toast.show({
        type: 'error',
        text1: UI.invalidAmount.title[lang],
        text2: UI.invalidAmount.msg[lang],
      });
      return;
    }

    try {
      const userData = {
        customer_id: user.userId,
        customer_email: user.email || 'demo@example.com',
        customer_phone: user.mobile,
        order_amount: parseFloat(amount),
      };

      const token = await getToken();
      const response: any = await AuthPost(
        ENDPOINTS.CREATE_PAYMENT_ORDER,
        userData,
        token,
      );
      const { payment_session_id, order_id } = response?.data;

      if (!payment_session_id || !order_id) {
        throw new Error('Missing payment_session_id or order_id');
      }

      const session = new CFSession(
        payment_session_id,
        order_id,
        CFEnvironment.PRODUCTION,
      );
      CFPaymentGatewayService.setCallback({
        onVerify: async orderID => {
          try {
            const token = await getToken();
            const paymentResponse: any = await AuthFetch(
              ENDPOINTS.GET_PAYMENTS_BY_ORDER_ID(orderID),
              token,
            );
            console.log("222",paymentResponse)

            if (
              paymentResponse?.data?.length > 0 &&
              paymentResponse.data[0].payment_status === 'SUCCESS'
            ) {
              Toast.show({
                type: 'success',
                text1: `${UI.paymentVerifiedPrefix[lang]}${orderID}`,
              });

              navigation.replace('BookingConfirmation', {
                orderID: orderID,
                platformFee: platformFee,
                selectedOption: selectedOption,
              });
            } else {
              handleReleaseSlot(paymentResponse?.data?.[0]?.error_code);

              Toast.show({
                type: 'error',
                text1: UI.paymentFailed[lang],
                text2: `${UI.orderIdPrefix[lang]}${orderID}`,
              });
            }
          } catch (err: any) {
            Toast.show({
              type: 'error',
              text1: UI.paymentError[lang],
              text2: err?.message || UI.somethingWentWrong[lang],
            });
          }
        },
        onError: (error: any, orderID) => {
          Toast.show({
            type: 'error',
            text1: UI.paymentFailed[lang],
            text2: `${UI.orderIdPrefix[lang]}${orderID}`,
          });
          handleReleaseSlot(error.code);
        },
      });

      await CFPaymentGatewayService.doWebPayment(session);
      Toast.show({
        type: 'success',
        text1: UI.paymentOpened[lang],
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: UI.paymentError[lang],
        text2: error?.message || UI.somethingWentWrong[lang],
      });
    }
  };
  // ===============payment sdk END====================

  // payment web view start

  const [paymentLink, setPaymentLink] = useState<string | null>(null);

  const handleCashfreePayment = async (platformFee: any, referFinalAmount: any, appointmentId: string) => {
    const consultationFee = getConsultationFee();
    if (consultationFee <= 0) {
      Toast.show({
        type: 'error',
        text1: UI.invalidAmount.title[lang],
        text2: UI.invalidAmount.msg[lang],
      });
      return;
    }

    try {
      const mobileRegex = /^[6-9]\d{9}$/;
      if (!mobileRegex.test(user.mobile)) {
        Toast.show({
          type: 'error',
          text1: UI.error[lang],
          text2:
            'Please provide a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.',
        });
        return;
      }

      await AsyncStorage.removeItem('linkId');

      // Amount to charge via UPI: discounted fee minus any wallet deduction
      let finalAmount = getUpiAmount();

      const body = {
        mobile: user.mobile,
        amount: finalAmount,
        currency: 'INR',
        paymentMethod: useWalletBalance && getWalletDeduction() > 0 ? 'wallet' : 'upi',
      };
      const token = await getToken();
      console.log(appointmentId,"appointmentId++++api before")
      const response: any = await AuthPost(ENDPOINTS.PLACE_ORDER(appointmentId), body, token);
      if (!response) {
        Toast.show({
          type: 'error',
          text1: UI.paymentError[lang],
          text2: UI.somethingWentWrong[lang],
        });
        return;
      }

      const link = response?.data?.link_url;
      const linkId = response?.data?.linkId;

      if (!link || !linkId) {
        Toast.show({
          type: 'error',
          text1: UI.paymentError[lang],
          text2: 'Payment link or ID not received from server',
        });
        return;
      }

      await AsyncStorage.setItem('linkId', linkId);
      setPaymentLink(link);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: UI.paymentError[lang],
        text2: error?.message || UI.somethingWentWrong[lang],
      });
    }
  };

  const checkPaymentStatus = async () => {
    try {
      const linkId = await AsyncStorage.getItem('linkId');
      if (!linkId) return;

      const token = await getToken();
      const response: any = await AuthFetch(
        ENDPOINTS.GET_STATUS_BY_LINK_ID(linkId),
        token,
      );
      console.log("11111",response)
      if (response && response.data && response?.data?.length > 0) {
        const status = response.data[0]?.order_status;
        const orderId = response.data[0]?.order_id;
        if (status === 'PAID') {
          Toast.show({
            type: 'success',
            text1: `${UI.paymentVerifiedPrefix[lang]}${linkId}`,
          });
          await AsyncStorage.removeItem('linkId');
          navigation.replace('BookingConfirmation', {
            linkId: linkId,
            orderID: orderId,
            platformFee: platformFee || 0,
            selectedOption: selectedOption,
          });
        } else {
          Toast.show({
            type: 'error',
            text1: UI.paymentFailed[lang],
            text2: `${UI.orderIdPrefix[lang]}${linkId}`,
          });
          await AsyncStorage.removeItem('linkId');
          handleReleaseSlot('Payment failed');
        }
      } else {
        Toast.show({
          type: 'error',
          text1: UI.paymentFailed[lang],
          text2: `${UI.orderIdPrefix[lang]}${linkId}`,
        });
        await AsyncStorage.removeItem('linkId');
        handleReleaseSlot('Payment failed');
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: UI.paymentError[lang],
        text2: error?.message || UI.somethingWentWrong[lang],
      });
    }
  };

  if (paymentLink) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <WebView
          source={{ uri: paymentLink }}
          startInLoadingState={true}
          onNavigationStateChange={navState => {
            if (navState.url.includes('paymentResponse')) {
              Toast.show({
                type: 'success',
                text1: UI.paymentOpened[lang],
              });
              checkPaymentStatus();
              setPaymentLink(null);
            }
          }}
        />
      </SafeAreaView>
    );
  }

  // payment web view END

  const createAppointment = async () => {
    try {
      console.log("selectedDiscount",selectedDiscount)
      console.log("couponId",couponId)
      console.log("useWalletBalance",useWalletBalance)
      if(useWalletBalance && couponId){
        Alert.alert("Wallet balance cannot be used with promo code", "Please deselect wallet or remove promo code.")
            return
      }
      const patientUserId = patient?.userId || user?.userId;
      const consultationFee = getConsultationFee();
      const walletDeduction = getWalletDeduction();
      const upiAmount = getUpiAmount();
      const walletFullyCovered = useWalletBalance && walletDeduction > 0 && upiAmount === 0;
      const walletPartial = useWalletBalance && walletDeduction > 0 && upiAmount > 0;

      // paymentMethod: 'wallet' whenever wallet checkbox is checked, else 'upi'
      const resolvedPaymentMethod = useWalletBalance && walletDeduction > 0 ? 'wallet' : 'upi';
      // paymentStatus: 'paid' when wallet fully covers or referral, else 'unpaid'
      let paymentStatus = 'unpaid';
      if (walletFullyCovered || selectedOption === 'referral') {
        paymentStatus = 'paid';
      }

      const appointmentRequest: any = {
        userId: patientUserId,
        doctorId: doctor.doctorId,
        patientName: patient?.name || `${patient?.firstname || ''} ${patient?.lastname || ''}`.trim() || 'Unknown Patient',
        doctorName: `Dr. ${doctor?.name || 'Unknown Doctor'}`,
        appointmentType: 'In-Person',
        appointmentDepartment: doctor?.specialty || 'Physiotherapist',
        addressId: clinic.addressId,
        appointmentDate: date,
        appointmentTime: formatTimeForAPI(time),
        appointmentStatus: 'pending',
        appointmentReason: 'Consultation',
        amount: consultationFee,
        discount: 0,
        discountType: 'percentage',
        paymentStatus: paymentStatus,
        appSource: 'patientApp',
        paymentMethod: resolvedPaymentMethod,
      };

      if (selectedDiscount === 'referral' && hasAppointments === false && user?.usedReferralCode) {
        appointmentRequest.referralCode = user.usedReferralCode;
        appointmentRequest.discount = user?.referralDiscount;
        appointmentRequest.discountType = 'flat';
      } else if (selectedOption === 'referral' && user?.usedReferralCode) {
        appointmentRequest.referralCode = user.usedReferralCode;
      }
      //if promo code applied
      if (couponId) {
        appointmentRequest.couponId = couponId;
        appointmentRequest.discount = promoDiscount;
      }

      const token = await getToken();
      if (!token) {
        Toast.show({
          type: 'error',
          text1: UI.error[lang],
          text2: 'Authentication token not found',
        });
        return;
      }

      setLoading(true);
      console.log("111111111",appointmentRequest)
      const response: any = await AuthPost(
        ENDPOINTS.CREATE_APPOINTMENT,
        appointmentRequest,
        token,
      );
      console.log("123",response)

      if (response?.data?.status === 'success') {
        let appointmentDetails = appointmentRequest;
        const appointmentId = response?.data?.data?.appointmentId;
        console.log("appointmentIdboom",appointmentId)
        const appointmentObjId = response?.data?.data?.appointmentObjId;
        setPlatformFee(response?.data?.data?.platformfee || 0);
        appointmentDetails.appointmentId = appointmentId;
        appointmentDetails.appointmentObjId = appointmentObjId;
        const discount = response?.data?.data?.discount;
        const finalAmount = response?.data?.data?.finalAmount;
        //if we have promo code then amount should be reduced by promoDiscount
        if (promoDiscount > 0) {
          let finalAmount = consultationFee - promoDiscount;
          if (finalAmount < 0) finalAmount = 0;
          appointmentDetails.couponId = couponId;
          appointmentDetails.discount = promoDiscount;
          appointmentDetails.finalAmount = finalAmount;
          appointmentDetails.discountType = 'flat';
        }

        if (selectedDiscount === 'referral' && hasAppointments === false && user?.usedReferralCode) {
          appointmentDetails.discount = user?.referralDiscount;
          appointmentDetails.finalAmount = Math.max(consultationFee - (user?.referralDiscount), 0);
          appointmentDetails.discountType = 'flat';
        }

        await AsyncStorage.setItem(
          'latestAppointmentDetails',
          JSON.stringify(appointmentDetails),
        );

        if (walletFullyCovered) {
          // Wallet covers everything — no UPI gateway needed
          navigation.replace('BookingConfirmation', {
            platformFee: platformFee || response?.data?.data?.platformfee,
            selectedOption: 'wallet',
          });
        } else if (upiAmount > 0) {
          // UPI needed — either pure UPI or wallet partial + UPI remainder
          await handleCashfreePayment(platformFee, finalAmount, appointmentId);
        } else {
          navigation.replace('BookingConfirmation', {
            platformFee: platformFee || response?.data?.data?.platformfee,
            selectedOption: selectedOption,
          });
        }
        setLoading(false);
      } else {
        const errorMessage = response?.data?.message || response?.message?.message || UI.createApptFailedMsg[lang];

        Alert.alert(
          UI.error[lang],
          errorMessage,
        );
        setLoading(false);
        Toast.show({
          type: 'error',
          text1: UI.error[lang],
          text2: errorMessage,
          position: 'top',
          visibilityTime: 3000,
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: UI.createApptFailedTitle[lang],
        text2: error?.response?.data?.message || error?.message || UI.somethingWentWrong[lang],
      });
      setLoading(false);
    }
  };

  const handlePayNow = () => {
    if (type === 'reschedule') {
      rescheduleAppointment();
      return;
    }
    createAppointment();
  };

  const handleCancel = () => {
    const consultationFee = getConsultationFee();
    navigation.navigate('CancelAppointment', {
      appointmentDetails: {
        patientDetails: patient,
        doctor: `Dr. ${doctor.name}`,
        specialty: doctor.specialty || 'Cardiologist',
        mode: 'In-Clinic',
        clinic: clinic?.clinicName,
        address:
          clinic?.address ||
          '3rd Floor, Ayyappa Society Road, Madhapur, Hyderabad',
        dateTime: `${date}, ${time}`,
        duration: '20 mins',
        consultationFee: consultationFee,
      },
    });
  };

  const toggleVydhyaAid = () => {
    setUseVydhyaAid(!useVydhyaAid);
  };

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      Toast.show({
        type: 'error',
        text1: UI.error[lang],
        text2: 'Please enter a promo code',
      });
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        Toast.show({
          type: 'error',
          text1: UI.error[lang],
          text2: 'Authentication token not found',
        });
        return;
      }

      const patientUserId = patient?.userId || user?.userId;
      const consultationFee = getConsultationFee();
      //make promo block letters
      const promoData = {
        userId: patientUserId,
        purchaseAmount: consultationFee,
        code: promoCode.trim().toUpperCase(),
      };
      console.log("handleApplyPromoCode", handleApplyPromoCode);
      const response: any = await AuthPost(
        ENDPOINTS.VALIDATE_COUPON_CODE,
        promoData,
        token,
      );
      if (response?.status === 'success') {
        const discount = response?.data?.discountAmount || 0;
        setAppliedPromoCode(promoCode.trim());
        setPromoDiscount(discount);
        setCouponId(response?.data?.couponId || null);
        Toast.show({
          type: 'success',
          text1: UI.promoCodeApplied[lang],
          text2: `${UI.discountPrefix[lang]} ₹ ${discount}`,
        });
        setPromoCode('');
      } else {
        const errorMessage = response?.message?.message || 'Invalid promo code';
        Alert.alert(
          UI.invalidPromoCode[lang],
          errorMessage,
          [{ text: UI.ok[lang], onPress: () => {} }],
          { cancelable: true }
        );
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || UI.somethingWentWrong[lang];
      Alert.alert(
        UI.error[lang],
        errorMessage,
        [{ text: UI.ok[lang], onPress: () => {} }],
        { cancelable: true }
      );
    }
  };

  const filteredOptions = options.filter(opt => {
    if (hasAppointments === false) {
      return opt.id === 'upi';
    }
    return opt.id !== 'referral' || user?.usedReferralCode;
  });

  const walletDeduction = getWalletDeduction();
  const upiAmount = getUpiAmount();
  const discountedFee = getDiscountedFee();

  // Pay button is enabled if UPI is selected, or if wallet fully covers the amount
  const isPayEnabled = !loading && selectedOption && (
    selectedOption === 'upi' || (useWalletBalance && walletDeduction >= discountedFee)
  );

  console.log("hasWalletBalance",hasWalletBalance)
  console.log("userWalletpay",userWallet)

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00203F" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
          scrollEnabled={true}
          nestedScrollEnabled={true}
        >
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>{UI.reviewDetails[lang]}</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {UI.labels.patientName[lang]}
              </Text>
              <Text style={styles.detailValue}>{patient.firstname}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{UI.labels.doctor[lang]}</Text>
              <View style={styles.doctorContainer}>
                <Text style={styles.detailValue}>Dr. {doctor.name}</Text>
                <Text style={styles.doctorSpecialty}>
                  {doctor.specialty || 'Cardiologist'}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{UI.labels.mode[lang]}</Text>
              <View style={styles.typeContainer}>
                <Text style={styles.typeIcon}>🏥</Text>
                <Text style={styles.detailValue}>
                  {mode || UI.inPerson[lang]}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{UI.labels.clinicName[lang]}</Text>
              <Text style={styles.detailValue}>{clinic.clinicName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {UI.labels.clinicAddress[lang]}
              </Text>
              <Text style={styles.detailValue}>
                {clinic.address}
                {'\n'}
                Hyderabad
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{UI.labels.dateTime[lang]}</Text>
              <Text style={styles.detailValue}>
                {moment(date, ['YYYY-MM-DD', 'DD-MM-YYYY']).format('DD MMM YYYY')}
                {'\n'}
                {time}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {UI.labels.consultationFee[lang]}
              </Text>
              <View style={styles.feeContainer}>
                <Text style={styles.feeAmount}>
                  ₹ {getConsultationFee()}
                </Text>
              </View>
            </View>
          </View>

          {/* Discount Options for First Appointment */}
          {userWallet?.isFirstAppointment && (
            <View style={styles.discountOptionsSection}>
              <Text style={styles.discountOptionsTitle}>Apply Discount</Text>

              <View style={styles.discountOptionsRow}>
                <TouchableOpacity
                  style={[
                    styles.discountOptionCard,
                    styles.promoOptionCard,
                    selectedDiscount === 'promo' &&
                      styles.selectedPromoOptionCard,
                  ]}
                  onPress={() => {
                    setSelectedDiscount('promo');
                    setReferralDiscount(0);
                    setReferralFinalAmount(null);
                  }}
                >
                  <Text
                    style={[
                      styles.discountOptionText,
                      selectedDiscount === 'promo' &&
                        styles.selectedDiscountOptionText,
                    ]}
                  >
                    Promo Code
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}


          {/* Promo Code Section */}
          {(selectedDiscount === 'promo' || appliedPromoCode) && (
            <View style={styles.promoCodeSection}>
              <View style={styles.promoCodeHeaderContainer}>
                <Text style={styles.promoCodeLabel}>{UI.promoCode[lang]}</Text>
                {appliedPromoCode && (
                  <TouchableOpacity
                    onPress={() => {
                      setAppliedPromoCode(null);
                      setPromoDiscount(0);
                      setPromoCode('');
                      setCouponId(null);
                    }}
                    style={styles.removePromoButtonHeader}
                  >
                    <Text style={styles.removePromoTextHeader}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {appliedPromoCode ? (
                <View>
                  <View style={styles.appliedPromoContainer}>
                    <Text style={styles.appliedPromoCode}>
                      {appliedPromoCode}
                      <Text style={styles.appliedPromoDiscount}>
                        {` ( ₹ ${promoDiscount} ${UI.discount[lang]})`}
                      </Text>
                    </Text>
                  </View>

                  {/* Price Breakdown Section */}
                  <View style={styles.priceBreakdownContainer}>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>
                        {UI.originalFee[lang]}
                      </Text>
                      <Text style={styles.breakdownValue}>
                        ₹ {getConsultationFee()}
                      </Text>
                    </View>

                    <View style={styles.breakdownRow}>
                      <Text style={[styles.breakdownLabel, styles.discountLabel]}>
                        {`- ${UI.discountAmount[lang]}`}
                      </Text>
                      <Text style={[styles.breakdownValue, styles.discountValue]}>
                        - ₹ {promoDiscount}
                      </Text>
                    </View>

                    <View style={[styles.breakdownRow, styles.finalBreakdownRow]}>
                      <Text style={styles.finalBreakdownLabel}>
                        {UI.finalAmount[lang]}
                      </Text>
                      <Text style={styles.finalBreakdownValue}>
                        ₹ {Math.max(getConsultationFee() - promoDiscount, 0)}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.promoInputContainer}>
                  <TextInput
                    style={styles.promoInput}
                    placeholder={UI.enterPromoCode[lang]}
                    placeholderTextColor="#999999"
                    value={promoCode}
                    onChangeText={setPromoCode}
                    maxLength={20}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={[
                      styles.applyPromoButton,
                      !promoCode.trim() || loading ? styles.disabledApplyButton : styles.enabledApplyButton,
                    ]}
                    onPress={handleApplyPromoCode}
                    disabled={!promoCode.trim() || loading}
                  >
                    <Text style={styles.applyPromoButtonText}>
                      {UI.applyPromoCode[lang]}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Wallet Checkbox Section */}
          <View style={styles.walletSection}>
            <TouchableOpacity
              style={[
                styles.walletCheckboxRow,
                !hasWalletBalance && styles.walletDisabled,
              ]}
              onPress={() => {
                if (hasWalletBalance) {
                  setUseWalletBalance(prev => !prev);
                }
              }}
              activeOpacity={hasWalletBalance ? 0.7 : 1}
            >
              <View style={[
                styles.checkbox,
                useWalletBalance && hasWalletBalance && styles.checkboxChecked,
                !hasWalletBalance && styles.checkboxDisabled,
              ]}>
                {useWalletBalance && hasWalletBalance && (
                  <Text style={styles.checkboxTick}>✓</Text>
                )}
              </View>
              <View style={styles.walletInfo}>
                <Text style={[
                  styles.walletLabel,
                  !hasWalletBalance && styles.walletLabelDisabled,
                ]}>
                  {UI.useWallet[lang]}
                </Text>
                  <Text style={[
                    styles.walletBalanceText,
                    !hasWalletBalance && styles.walletBalanceTextDisabled,
                  ]}>
                    {hasWalletBalance
                      ? `${UI.walletBalance[lang]}: ₹ ${userWallet?.balance} ${userWallet?.currency || 'INR'}`
                      : UI.noWalletBalance[lang]}
                  </Text>
              </View>
            </TouchableOpacity>

            {/* Wallet breakdown if active and partial */}
            {useWalletBalance && hasWalletBalance && walletDeduction > 0 && (
              <View style={styles.walletBreakdownContainer}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{UI.walletDeduction[lang]}</Text>
                  <Text style={[styles.breakdownValue, styles.discountValue]}> ₹ {walletDeduction}</Text>
                </View>
                {upiAmount > 0 && (
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>{UI.remainingViaUpi[lang]}</Text>
                    <Text style={[styles.breakdownValue, { color: '#1E40AF', fontWeight: '700' }]}>₹ {upiAmount}</Text>
                  </View>
                )}
                {upiAmount === 0 && (
                  <View style={[styles.breakdownRow, styles.finalBreakdownRow]}>
                    <Text style={styles.finalBreakdownLabel}>Wallet Covers Full Amount</Text>
                    <Text style={[styles.finalBreakdownValue, { color: '#4CAF50' }]}>✓ Fully Paid</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* <Text style={styles.title}>{UI.selectPaymentOption[lang]}</Text> */}

          {/* Row of cards — only UPI */}
          <View style={styles.row}>
              <TouchableOpacity
                style={[
                  styles.card,
                  // If wallet fully covers amount, dim UPI card but still selectable for method tracking
                  // useWalletBalance && walletDeduction >= discountedFee && opt.id === 'upi' && styles.cardDimmed,
                ]}
                 onPress={handlePayNow}
                // onPress={() => setSelectedOption(opt.id)}
              >
                <Text
                  style={[
                    styles.cardText,
                    styles.selectedText,
                  ]}
                >
                  {UI.options.payNow[lang]}
                </Text>
                {/* {useWalletBalance && walletDeduction >= discountedFee && opt.id === 'upi' && (
                  <Text style={styles.cardSubText}>Covered by Wallet</Text>
                )} */}
                {/* {useWalletBalance && upiAmount > 0 && opt.id === 'payNow' && (
                  <Text style={styles.cardSubText}>Pay ₹ {upiAmount}</Text>
                )} */}
              </TouchableOpacity>
          </View>

          <View style={styles.bottomContainer}>
            {/* <TouchableOpacity
              style={[
                styles.payButton,
                (!selectedOption || loading)
                  ? styles.disabledPayButton
                  : styles.enabledPayButton,
              ]}
              onPress={handlePayNow}
              disabled={loading || !selectedOption}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[
                  styles.payButtonText,
                  (!selectedOption || loading) && {
                    color: '#999999'
                  }
                ]}>
                  {UI.payNow[lang]}
                  {selectedOption === 'upi' && upiAmount > 0 && useWalletBalance
                    ? ` ₹ ${upiAmount}`
                    : selectedOption === 'upi' && !useWalletBalance
                    ? ` ₹ ${discountedFee}`
                    : ''}
                </Text>
              )}
            </TouchableOpacity> */}

            {/* <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>✕ {UI.cancel[lang]}</Text>
            </TouchableOpacity> */}

            <View style={styles.warningContainer}>
              <Text style={styles.warningIcon}>⚠</Text>
              <Text style={styles.warningText}>{UI.autoCancelNotice[lang]}</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDFFF7',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  contentContainer: {
    paddingBottom: SAFE_AREA.safeBottom + SPACING.xl + verticalScale(100),
    minHeight: '100%',
  },
  detailsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    ...LAYOUT.shadow.sm,
  },
  sectionTitle: {
    fontSize: responsiveText(FONT_SIZE.md),
    fontWeight: '600',
    color: '#333333',
    marginBottom: SPACING.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  detailLabel: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#666666',
    flex: 1,
  },
  detailValue: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#333333',
    flex: 1,
    textAlign: 'right',
    fontWeight: '500',
  },
  doctorContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  doctorSpecialty: {
    fontSize: responsiveText(FONT_SIZE.xxs),
    color: '#666666',
    textAlign: 'right',
    marginTop: SPACING.xxs,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  typeIcon: {
    fontSize: responsiveText(FONT_SIZE.sm),
    marginRight: SPACING.xxs,
  },
  feeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  feeAmount: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#16A34A',
    fontWeight: '600',
    marginRight: SPACING.xs,
  },
  discountAmount: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#EF4444',
    fontWeight: '600',
    marginRight: SPACING.xs,
  },
  finalFeeAmount: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#1E40AF',
    fontWeight: '700',
    marginRight: SPACING.xs,
  },
  bottomContainer: {
    paddingVertical: verticalScale(SPACING.md),
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  payButton: {
    paddingVertical: verticalScale(12),
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    marginBottom: verticalScale(12),
    height: verticalScale(48),
    justifyContent: 'center',
  },
  enabledPayButton: {
    backgroundColor: '#4CAF50',
  },
  disabledPayButton: {
    backgroundColor: '#CCCCCC',
    opacity: 0.7,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    paddingVertical: verticalScale(SPACING.sm),
    marginBottom: verticalScale(SPACING.md),
    borderRadius: LAYOUT.borderRadius.md,
    height: verticalScale(44),
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: responsiveText(FONT_SIZE.xs),
  },
  warningContainer: {
    flexDirection: 'row',
    backgroundColor: '#FECACA',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.sm,
    alignItems: 'flex-start',
  },
  warningIcon: {
    color: '#FF9800',
    fontSize: responsiveText(FONT_SIZE.sm),
    marginRight: SPACING.xs,
    marginTop: scale(1),
  },
  warningText: {
    flex: 1,
    fontSize: responsiveText(FONT_SIZE.xxs),
    color: '#B91C1C',
    lineHeight: moderateScale(14),
  },
  title: {
    fontSize: responsiveText(FONT_SIZE.lg),
    fontWeight: '600',
    marginBottom: verticalScale(SPACING.lg),
    marginTop: verticalScale(SPACING.md),
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: scale(SPACING.xs),
    marginBottom: verticalScale(SPACING.lg),
  },
  card: {
    flex: 1,
    marginHorizontal: scale(SPACING.xxs),
    paddingVertical: verticalScale(SPACING.md),
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: '#000',
    alignItems: 'center',
    minHeight: verticalScale(60),
    justifyContent: 'center',
  },
  selectedCard: {
    backgroundColor: '#007bff',
  },
  cardDimmed: {
    backgroundColor: '#444',
    opacity: 0.85,
  },
  cardText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#fff',
    fontWeight: '500',
  },
  selectedText: {
    fontWeight: 'bold',
  },
  cardSubText: {
    fontSize: responsiveText(FONT_SIZE.xxs),
    color: '#C8E6C9',
    marginTop: verticalScale(2),
    fontWeight: '400',
  },
  kycWarning: {
    flexDirection: 'row',
    backgroundColor: '#FFF2F2',
    padding: scale(SPACING.md),
    borderRadius: LAYOUT.borderRadius.md,
    marginBottom: verticalScale(SPACING.lg),
    marginTop: verticalScale(SPACING.md),
    borderWidth: 1,
    borderColor: '#FFE5E5',
    alignItems: 'flex-start',
  },
  lockIcon: {
    fontSize: responsiveText(FONT_SIZE.md),
    marginRight: scale(SPACING.sm),
    marginTop: verticalScale(2),
  },
  kycWarningText: {
    flex: 1,
  },
  kycWarningTitle: {
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
    color: '#D32F2F',
    marginBottom: SPACING.xxs,
  },
  kycWarningSubtitle: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#666666',
    lineHeight: moderateScale(16),
  },
  kycButton: {
    backgroundColor: '#00203F',
    borderRadius: LAYOUT.borderRadius.md,
    paddingHorizontal: scale(SPACING.sm),
    paddingVertical: verticalScale(SPACING.sm),
    alignItems: 'center',
    minWidth: responsiveWidth(25),
    minHeight: verticalScale(40),
    justifyContent: 'center',
  },
  kycButtonText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  promoCodeSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.md,
    padding: scale(SPACING.md),
    marginBottom: verticalScale(SPACING.lg),
    marginTop: verticalScale(SPACING.md),
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  promoCodeHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(SPACING.md),
  },
  promoCodeLabel: {
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
    color: '#333333',
    marginBottom: verticalScale(SPACING.md),
  },
  promoInputContainer: {
    flexDirection: 'row',
    gap: scale(SPACING.sm),
    alignItems: 'center',
    marginBottom: verticalScale(SPACING.md),
  },
  promoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: LAYOUT.borderRadius.sm,
    paddingHorizontal: scale(SPACING.md),
    paddingVertical: verticalScale(SPACING.sm),
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#333333',
    backgroundColor: '#FAFAFA',
    minHeight: verticalScale(44),
  },
  applyPromoButton: {
    paddingHorizontal: scale(SPACING.lg),
    paddingVertical: verticalScale(SPACING.sm),
    borderRadius: LAYOUT.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: verticalScale(44),
  },
  referralDiscountSection: {
    backgroundColor: '#E8F5E9',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  referralDiscountLabel: {
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: SPACING.sm,
  },
  discountOptionsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.md,
    padding: scale(SPACING.md),
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  discountOptionsTitle: {
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
    color: '#333333',
    marginBottom: SPACING.md,
  },
  discountOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(SPACING.sm),
  },
  discountOptionCard: {
    flex: 1,
    paddingVertical: verticalScale(SPACING.md),
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    minHeight: verticalScale(50),
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedDiscountOptionCard: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  promoOptionCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FBBF24',
  },
  selectedPromoOptionCard: {
    backgroundColor: '#FBBF24',
    borderColor: '#F59E0B',
  },
  discountOptionText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#333333',
    fontWeight: '500',
  },
  selectedDiscountOptionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  enabledApplyButton: {
    backgroundColor: '#4CAF50',
  },
  disabledApplyButton: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  applyPromoButtonText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  appliedPromoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: LAYOUT.borderRadius.sm,
    paddingHorizontal: scale(SPACING.md),
    paddingVertical: verticalScale(SPACING.sm),
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    marginBottom: verticalScale(SPACING.md),
  },
  appliedPromoCode: {
    flex: 1,
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
    color: '#2E7D32',
  },
  appliedPromoDiscount: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#4CAF50',
    fontWeight: '500',
  },
  removePromoButton: {
    paddingHorizontal: scale(SPACING.sm),
    paddingVertical: verticalScale(SPACING.xs),
    marginLeft: scale(SPACING.sm),
    minHeight: verticalScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePromoText: {
    fontSize: responsiveText(FONT_SIZE.lg),
    color: '#D32F2F',
    fontWeight: 'bold',
  },
  removePromoButtonHeader: {
    paddingHorizontal: scale(SPACING.sm),
    paddingVertical: verticalScale(SPACING.xs),
    minHeight: verticalScale(32),
    minWidth: verticalScale(32),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: LAYOUT.borderRadius.sm,
    backgroundColor: '#FFE5E5',
  },
  removePromoTextHeader: {
    fontSize: responsiveText(FONT_SIZE.lg),
    color: '#D32F2F',
    fontWeight: 'bold',
  },
  priceBreakdownContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: LAYOUT.borderRadius.sm,
    padding: scale(SPACING.md),
    marginTop: verticalScale(SPACING.md),
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(SPACING.sm),
  },
  breakdownLabel: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#666666',
    flex: 1,
  },
  breakdownValue: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#333333',
    fontWeight: '500',
  },
  discountLabel: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  discountValue: {
    color: '#4CAF50',
  },
  finalBreakdownRow: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: verticalScale(SPACING.sm),
    paddingTop: verticalScale(SPACING.sm),
  },
  finalBreakdownLabel: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#333333',
    fontWeight: '700',
    flex: 1,
  },
  finalBreakdownValue: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#2E7D32',
    fontWeight: '700',
  },
  // Wallet styles
  walletSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.md,
    padding: scale(SPACING.md),
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    ...LAYOUT.shadow.sm,
  },
  walletCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(SPACING.sm),
  },
  walletDisabled: {
    opacity: 0.5,
  },
  checkbox: {
    width: scale(22),
    height: scale(22),
    borderRadius: scale(4),
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkboxDisabled: {
    borderColor: '#CCCCCC',
    backgroundColor: '#F5F5F5',
  },
  checkboxTick: {
    color: '#FFFFFF',
    fontSize: responsiveText(FONT_SIZE.xs),
    fontWeight: '700',
    lineHeight: responsiveText(FONT_SIZE.sm),
  },
  walletInfo: {
    flex: 1,
  },
  walletLabel: {
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
    color: '#333333',
    marginBottom: verticalScale(2),
  },
  walletLabelDisabled: {
    color: '#999999',
  },
  walletBalanceText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#4CAF50',
    fontWeight: '500',
  },
  walletBalanceTextDisabled: {
    color: '#999999',
  },
  walletBreakdownContainer: {
    backgroundColor: '#F0FFF4',
    borderRadius: LAYOUT.borderRadius.sm,
    padding: scale(SPACING.sm),
    marginTop: verticalScale(SPACING.sm),
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
});

export default Payment;