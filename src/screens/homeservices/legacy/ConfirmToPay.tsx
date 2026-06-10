import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { AuthFetch, AuthPost, UploadFiles, ENDPOINTS } from '../../../services';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  TextInput,
} from 'react-native';
import {
  RouteProp,
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
;
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { CFEnvironment, CFSession } from 'cashfree-pg-api-contract';
import { CFPaymentGatewayService } from 'react-native-cashfree-pg-sdk';
import { useSelector } from 'react-redux';
import { WebView } from 'react-native-webview';
import { getAvatarInitial } from '../../../utils/util';
import { RootStackParamList as GlobalRootStackParamList } from '../../../navigation/navigationTypes';

// Import responsive utilities
import {
  isTablet,
  SPACING,
  LAYOUT,
  moderateScale,
  SAFE_AREA,
  PLATFORM,
  scale,
  verticalScale,
  responsiveText,
  FONT_SIZE,
} from '../../../utils/responsive';

// ---------- Types (mirror your HomeAddressScreen exports) ----------
export type AddressFormData = {
  building: string;
  floorFlat?: string;
  street: string;
  landmark?: string;
  pincode: string;
  cityState: string;
  saveAsDefault: boolean;
};

export type VisitContext = {
  doctor: any;
  mode: 'online' | 'clinic' | 'home' | string;
  date: string;
  time: string;
  reason?: string;
  reports?: any;
  patient?: {
    userId?: string | number;
    name?: string;
    firstname?: string;
    lastname?: string;
    age?: number | string;
    gender?: string;
    phone?: string;
    mobile?: string;
  };
};

export type RootStackParamList = {
  HomeAddress: VisitContext;
  ConfirmAddress: VisitContext & { formData: AddressFormData };
};

type Nav = NativeStackNavigationProp<GlobalRootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'ConfirmAddress'>;

// ---------- Translations ----------
const translations: any = {
  en: {
    doctorDetails: 'Doctor Details',
    appointmentSlot: 'Appointment Slot',
    reasonForConsultation: 'Reason for Consultation',
    patientDetails: 'Patient Details',
    homeAddress: 'Home Address',
    paymentSummary: 'Payment Summary',
    consultationFee: 'Consultation Fee',
    vydhyoAidUnits: 'Vydhyo Aid Units',
    amountPayable: 'Amount Payable',
    selectPaymentOption: 'Select Payment Option',
    payNow: 'Pay Now',
    completeKycToUseWallet: 'Complete KYC to Use Wallet',
    insufficientBalance: 'Insufficient Balance',
    cancel: 'Cancel',
    name: 'Name:',
    age: 'Age:',
    gender: 'Gender:',
    phone: 'Phone:',
    editAddress: 'Edit Address',
    upi: 'UPI',
    wallet: 'Wallet',
    referral: 'Referral',
    reminder: 'You will get a reminder 15 mins before your appointment.',
    bookingDetails: 'Booking details will be shared via SMS and in-app.',
    invalidAmount: 'Invalid Amount',
    invalidAmountMessage: 'Please provide a valid consultation fee.',
    paymentFailed: 'Payment Failed',
    paymentError: 'Payment Error',
    paymentErrorMessage: 'Something went wrong',
    paymentPageOpened: 'Payment page opened',
    error: 'Error',
    appointmentError: 'Failed to Create Appointment',
    appointmentErrorMessage: 'Failed to Create Appointment Please Retry',
    slotReleaseError: 'Failed to release slot',
    notLoggedIn: 'You are not logged in. Please log in to release the slot.',
    noAppointmentDetails: 'No latest appointment details found.',
    promoCode: 'Promo Code',
    enterPromoCode: 'Enter Promo Code',
    applyPromoCode: 'Apply',
    promoCodeApplied: 'Promo Code Applied',
    invalidPromoCode: 'Invalid Promo Code',
    discount: 'Discount',
    discountPrefix: 'Discount: ',
    discountAmount: 'Discount Amount',
    originalFee: 'Original Consultation Fee',
    finalAmount: 'Final Amount',
    ok: 'OK',
    somethingWentWrong: 'Something went wrong',
    referralDiscountApplied: 'Referral Discount Applied',
    applyDiscount: 'Apply Discount',
  },
  hi: {
    doctorDetails: 'डॉक्टर विवरण',
    appointmentSlot: 'नियुक्ति स्लॉट',
    reasonForConsultation: 'परामर्श का कारण',
    patientDetails: 'रोगी विवरण',
    homeAddress: 'घर का पता',
    paymentSummary: 'भुगतान सारांश',
    consultationFee: 'परामर्श शुल्क',
    vydhyoAidUnits: 'वैध्यो सहायता इकाइयाँ',
    amountPayable: 'देय राशि',
    selectPaymentOption: 'भुगतान विकल्प चुनें',
    payNow: 'अब भुगतान करें',
    completeKycToUseWallet: 'वॉलेट का उपयोग करने के लिए KYC पूरा करें',
    insufficientBalance: 'अपर्याप्त शेष',
    cancel: 'रद्द करें',
    name: 'नाम:',
    age: 'आयु:',
    gender: 'लिंग:',
    phone: 'फोन:',
    editAddress: 'पता संपादित करें',
    upi: 'UPI',
    wallet: 'वॉलेट',
    referral: 'रेफरल',
    reminder: 'आपको आपकी नियुक्ति से 15 मिनट पहले रिमाइंडर मिलेगा।',
    bookingDetails: 'बुकिंग विवरण SMS और ऐप के माध्यम से साझा किया जाएगा।',
    invalidAmount: 'अमान्य राशि',
    invalidAmountMessage: 'कृपया एक मान्य परामर्श शुल्क प्रदान करें।',
    paymentFailed: 'भुगतान विफल',
    paymentError: 'भुगतान त्रुटि',
    paymentErrorMessage: 'कुछ गलत हो गया',
    paymentPageOpened: 'भुगतान पृष्ठ खोला गया',
    error: 'त्रुटि',
    appointmentError: 'नियुक्ति बनाने में विफल',
    appointmentErrorMessage: 'नियुक्ति बनाने में विफल, कृपया पुनः प्रयास करें',
    slotReleaseError: 'स्लॉट रिलीज़ करने में विफल',
    notLoggedIn:
      'आप लॉग इन नहीं हैं। कृपया स्लॉट रिलीज़ करने के लिए लॉग इन करें।',
    noAppointmentDetails: 'कोई नवीनतम नियुक्ति विवरण नहीं मिला।',
    promoCode: 'प्रोमो कोड',
    enterPromoCode: 'प्रोमो कोड दर्ज करें',
    applyPromoCode: 'लागू करें',
    promoCodeApplied: 'प्रोमो कोड लागू',
    invalidPromoCode: 'अमान्य प्रोमो कोड',
    discount: 'छूट',
    discountPrefix: 'छूट: ',
    discountAmount: 'छूट की राशि',
    originalFee: 'मूल परामर्श शुल्क',
    finalAmount: 'अंतिम राशि',
    ok: 'ठीक है',
    somethingWentWrong: 'कुछ गलत हो गया',
    referralDiscountApplied: 'रेफरल छूट लागू',
    applyDiscount: 'छूट लागू करें',
  },
  tel: {
    doctorDetails: 'డాక్టర్ వివరాలు',
    appointmentSlot: 'అపాయింట్‌మెంట్ స్లాట్',
    reasonForConsultation: 'సంప్రదింపు కారణం',
    patientDetails: 'రోగి వివరాలు',
    homeAddress: 'ఇంటి చిరునామా',
    paymentSummary: 'చెల్లింపు సారాంశం',
    consultationFee: 'సంప్రదింపు రుసుము',
    vydhyoAidUnits: 'వైద్యో సహాయ యూనిట్లు',
    amountPayable: 'చెల్లించవలసిన మొత్తం',
    selectPaymentOption: 'చెల్లింపు ఎంపికను ఎంచుకోండి',
    payNow: 'ఇప్పుడు చెల్లించండి',
    completeKycToUseWallet: 'వాలెట్ ఉపయోగించడానికి KYC పూర్తి చేయండి',
    insufficientBalance: 'తగినంత బ్యాలెన్స్ లేదు',
    cancel: 'రద్దు చేయండి',
    name: 'పేరు:',
    age: 'వయస్సు:',
    gender: 'లింగం:',
    phone: 'ఫోన్:',
    editAddress: 'చిరునామాను సవరించండి',
    upi: 'UPI',
    wallet: 'వాలెట్',
    referral: 'రిఫెరల్',
    reminder: 'మీ అపాయింట్‌మెంట్‌కు 15 నిమిషాల ముందు రిమైండర్ వస్తుంది.',
    bookingDetails: 'బుకింగ్ వివరాలు SMS మరియు యాప్ ద్వారా షేర్ చేయబడతాయి.',
    invalidAmount: 'చెల్లని మొత్తం',
    invalidAmountMessage:
      'దయచేసి చెల్లుబాటు అయ్యే సంప్రదింపు రుసుమును అందించండి.',
    paymentFailed: 'చెల్లింపు విఫలమైంది',
    paymentError: 'చెల్లింపు లోపం',
    paymentErrorMessage: 'ఏదో తప్పు జరిగింది',
    paymentPageOpened: 'చెల్లింపు పేజీ తెరవబడింది',
    error: 'లోపం',
    appointmentError: 'అపాయింట్‌మెంట్ సృష్టించడంలో విఫలమైంది',
    appointmentErrorMessage:
      'అపాయింట్‌మెంట్ సృష్టించడంలో విఫలమైంది, దయచేసి మళ్లీ ప్రయత్నించండి',
    slotReleaseError: 'స్లాట్ విడుదల చేయడంలో విఫలమైంది',
    notLoggedIn:
      'మీరు లాగిన్ కాలేదు. స్లాట్ విడుదల చేయడానికి దయచేసి లాగిన్ చేయండి।',
    noAppointmentDetails: 'తాజా అపాయింట్‌మెంట్ వివరాలు ఏవీ కనుగొనబడలేదు.',
    promoCode: 'ప్రోమో కోడ్',
    enterPromoCode: 'ప్రోమో కోడ్ నమోదు చేయండి',
    applyPromoCode: 'వర్తించు',
    promoCodeApplied: 'ప్రోమో కోడ్ వర్తించబడింది',
    invalidPromoCode: 'చెల్లని ప్రోమో కోడ్',
    discount: 'ఛాయం',
    discountPrefix: 'ఛాయం: ',
    discountAmount: 'ఛాయం మొత్తం',
    originalFee: 'అసలు కన్సల్టేషన్ ఫీజు',
    finalAmount: 'తుది మొత్తం',
    ok: 'సరి',
    somethingWentWrong: 'ఏదో తప్పు జరిగింది',
    referralDiscountApplied: 'రెఫరల్ ఛాయం వర్తించబడింది',
    applyDiscount: 'ఛాయం వర్తించు',
  },
};

// ---------- Screen ----------
const ConfirmToPay: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const user = useSelector((state: any) => state.currentUser);
  const appLanguage = user?.appLanguage || 'en';
  const t = translations[appLanguage] || translations.en;
  const userWallet = useSelector((s: any) => s.userWallet);

  const { doctor, mode, date, time, formData, reason, reports, patient } =
    route.params;
  const homeaddress = formData;

  // Payment/Aid units
  const consultationFee = doctor?.consultationFee[2]?.fee || 700;
  const [useAidUnits, setUseAidUnits] = useState(false);
  const aidUnitsValue = 500;
  const [selectedOption, setSelectedOption] = useState<string>("upi");
  const [doctorProfilePic, setDoctorProfilePic] = useState<any>(null);

  // Wallet checkbox state
  const [useWallet, setUseWallet] = useState(false);
  const walletBalance = userWallet?.balance || 0
  const hasWalletBalance = walletBalance > 0;

  const options = [
    { id: 'upi', name: t.upi },
  ];

  // Referral states
  const [hasAppointments, setHasAppointments] = useState<boolean | null>(null);
  const [checkingAppointments, setCheckingAppointments] = useState(true);
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [referralFinalAmount, setReferralFinalAmount] = useState<number | null>(
    null,
  );
  const [selectedDiscount, setSelectedDiscount] = useState<'referral' | 'promo' | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [couponId, setCouponId] = useState<string | null>(null);

  /**
   * Compute amounts after discounts and wallet deduction.
   * Returns { afterDiscount, walletDeduction, upiAmount }
   */
  const computeAmounts = useCallback(() => {
    const base = consultationFee - (useAidUnits ? aidUnitsValue : 0);

    let afterDiscount = base;
    if (selectedDiscount === 'referral' && hasAppointments === false && user?.usedReferralCode) {
      afterDiscount = Math.max(base - (user?.referralDiscount ?? 0), 0);
    } else if (selectedDiscount === 'promo' && appliedPromoCode) {
      afterDiscount = Math.max(base - promoDiscount, 0);
    }

    let walletDeduction = 0;
    let upiAmount = afterDiscount;

    if (useWallet && walletBalance > 0) {
      walletDeduction = Math.min(walletBalance, afterDiscount);
      upiAmount = Math.max(afterDiscount - walletDeduction, 0);
    }

    return { afterDiscount, walletDeduction, upiAmount };
  }, [
    consultationFee,
    useAidUnits,
    aidUnitsValue,
    selectedDiscount,
    hasAppointments,
    user?.usedReferralCode,
    user?.referralDiscount,
    appliedPromoCode,
    promoDiscount,
    useWallet,
    walletBalance,
  ]);

  const payable = useMemo(() => {
    return computeAmounts().upiAmount;
  }, [computeAmounts]);

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

  // Fetch doctor profile picture
  const fetchDoctorProfilePic = async (doctorId: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!doctorId) return;
      const response: any = await AuthFetch(
        ENDPOINTS.GET_USER(doctorId),
        token,
      );
      const userData = response?.data?.data;
      if (userData?.profilepic) {
        setDoctorProfilePic(userData.profilepic);
      }
    } catch (error) {
      console.warn('Failed to fetch doctor profile picture:', error);
    }
  };

  // Check if user has previous appointments
  const checkAppointments = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userId = user?.userId;
      if (!token || !userId) {
        setCheckingAppointments(false);
        return;
      }
      const response: any = await AuthFetch(
        ENDPOINTS.GET_ALL_FAMILY_APPOINTMENTS(userId),
        token,
      );
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

  useEffect(() => {
    if (doctor?.doctorId) {
      fetchDoctorProfilePic(doctor.doctorId);
    }
  }, [doctor?.doctorId]);

  useEffect(() => {
    checkAppointments();
  }, [user?.userId]);

  useEffect(() => {
    if (selectedDiscount === 'referral' && hasAppointments === false && user?.usedReferralCode) {
      const discount = user?.referralDiscount;
      const baseAmount = consultationFee - (useAidUnits ? aidUnitsValue : 0);
      setReferralDiscount(discount);
      setReferralFinalAmount(Math.max(baseAmount - discount, 0));
      Toast.show({
        type: 'success',
        text1: t.referralDiscountApplied,
        text2: `₹ ${discount} discount applied`,
      });
    } else {
      setReferralDiscount(0);
      setReferralFinalAmount(null);
    }
  }, [selectedDiscount, hasAppointments, user?.usedReferralCode, user?.referralDiscount, consultationFee, useAidUnits, t]);

  // const [kycCompleted, setKycCompleted] = useState(false);
  const [payButtonText, setPayButtonText] = useState(t.payNow);
  const [payButtonDisabled, setPayButtonDisabled] = useState(true);
  const [platformFee, setPlatformFee] = useState(0);


  useEffect(() => {
    if (!selectedOption) {
      setPayButtonText(t.payNow);
      setPayButtonDisabled(true);
      return;
    }
    setPayButtonText(t.payNow);
    setPayButtonDisabled(false);
  }, [selectedOption, walletBalance, payable, t, useWallet]);

  const formatTimeForAPI = useCallback((timeSlot: string) => {
    if (!timeSlot) return '';
    const [time, period] = timeSlot.split(' ');
    const [hoursStr, minutes] = time.split(':');
    let hours = parseInt(hoursStr, 10);
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }, []);

  function formatDate(dateString: string): string {
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const months =
        appLanguage === 'hi'
          ? [
              'जनवरी',
              'फरवरी',
              'मार्च',
              'अप्रैल',
              'मई',
              'जून',
              'जुलाई',
              'अगस्त',
              'सितंबर',
              'अक्टूबर',
              'नवंबर',
              'दिसंबर',
            ]
          : appLanguage === 'tel'
          ? [
              'జనవరి',
              'ఫిబ్రవరి',
              'మార్చి',
              'ఏప్రిల్',
              'మే',
              'జూన్',
              'జులై',
              'ఆగస్టు',
              'సెప్టెంబర్',
              'అక్టోబర్',
              'నవంబర్',
              'డిసెంబర్',
            ]
          : [
              'Jan',
              'Feb',
              'Mar',
              'Apr',
              'May',
              'Jun',
              'Jul',
              'Aug',
              'Sep',
              'Oct',
              'Nov',
              'Dec',
            ];
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch (error) {
      Alert.alert(t.error, 'Date formatting error');
      return dateString;
    }
  }

  function formatAddressLines(a: AddressFormData): string[] {
    const lines: string[] = [];
    const first = [a.building, a.floorFlat].filter(Boolean).join(', ');
    if (first) lines.push(first);
    if (a.landmark) lines.push(a.landmark);
    if (a.street) lines.push(a.street);
    const last = [a.cityState, a.pincode].filter(Boolean).join(' - ');
    if (last) lines.push(last);
    return lines;
  }

  function capitalize(s: string) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  async function getToken() {
    const token = await AsyncStorage.getItem('authToken');
    return token;
  }

  const handleReleaseSlot = async (reason: string) => {
    try {
      const token = await getToken();
      const latestAppointmentDetails = await AsyncStorage.getItem(
        'latestAppointmentDetails',
      );
      const appointmentDetails = JSON.parse(latestAppointmentDetails || '{}');
      if (!appointmentDetails) {
        Alert.alert(t.error, t.noAppointmentDetails);
        return;
      }
      if (!token) {
        Alert.alert(t.error, t.notLoggedIn);
        return;
      }
      const response : any = await AuthPost(
        ENDPOINTS.RELEASE_DOCTOR_SLOT,
        { appointmentDetails, reason },
        token,
      );
      if (response.status === 'success') {
        await AsyncStorage.removeItem('latestAppointmentDetails');
      } else {
        Alert.alert(
          t.error,
          response?.message?.message ||
            response?.data?.message ||
            t.slotReleaseError,
        );
      }
    } catch (error) {
      Alert.alert(t.error, t.slotReleaseError);
    }
  };

  const handleViewDetails = () => {
    navigation.navigate('DoctorDetails', {
      doctorId: doctor?.doctorId?.toString(),
      selectedClinicId: null,
    });
  };

  const handleCashfreePayment2 = async (platformFee: number) => {
    const amount = doctor?.consultationFee[2].fee || 0;
    if (amount <= 0) {
      Toast.show({
        type: 'error',
        text1: t.invalidAmount,
        text2: t.invalidAmountMessage,
      });
      return;
    }

    try {
      const userData = {
        customer_id: user.userId,
        customer_email: user.email || 'demo@example.com',
        customer_phone: user.mobile,
        order_amount: parseFloat(amount.toString()),
      };

      const token = await getToken();
      const response : any = await AuthPost(
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
            if (
              paymentResponse?.data?.length > 0 &&
              paymentResponse.data[0].payment_status === 'SUCCESS'
            ) {
              Toast.show({
                type: 'success',
                text1: `${t.paymentVerifiedPrefix}${orderID}`,
              });
              navigation.replace('HomeServiceBookingConfirmation', {
                orderID: orderID,
                platformFee: platformFee,
                selectedOption: selectedOption,
              });
            } else {
              handleReleaseSlot(paymentResponse?.data?.[0]?.error_code);
              Toast.show({
                type: 'error',
                text1: t.paymentFailed,
                text2: `${t.orderIdPrefix}${orderID}`,
              });
            }
          } catch (err :any) {
            Toast.show({
              type: 'error',
              text1: t.paymentError,
              text2: err?.message || t.somethingWentWrong,
            });
          }
        },
        // onVerify: (orderID: string) => {
        //   Toast.show({
        //     type: 'success',
        //     text1: `${t.paymentPageOpened}: ${orderID}`,
        //   });
        //   navigation.replace('BookingConfirmation', {
        //     orderID,
        //     platformFee,
        //     selectedOption,
        //   });
        // },
        onError: (error: any, orderID: string) => {
          Toast.show({
            type: 'error',
            text1: t.paymentFailed,
            text2: `Order ID: ${orderID}`,
          });
          handleReleaseSlot(error.code);
        },
      });

      await CFPaymentGatewayService.doWebPayment(session);

      Toast.show({
        type: 'success',
        text1: t.paymentPageOpened,
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: t.paymentError,
        text2: error?.message || t.paymentErrorMessage,
      });
    }
  };

  // payment web view start
  const [paymentLink, setPaymentLink] = useState<string | null>(null);

  const handleCashfreePayment = async (fee: any, appointmentId: string) => {
    const consultationFeeAmount = doctor?.consultationFee[2]?.fee || 0;
    if (consultationFeeAmount <= 0) {
      Toast.show({
        type: 'error',
        text1: t.invalidAmount,
        text2: t.invalidAmountMessage,
      });
      return;
    }
    try {
      const mobileRegex = /^[6-9]\d{9}$/;
      if (!mobileRegex.test(user.mobile)) {
        Toast.show({
          type: 'error',
          text1: t.error,
          text2:
            'Please provide a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.',
        });
        return;
      }
      await AsyncStorage.removeItem('linkId');

      // Use computed upiAmount (post-discount, post-wallet)
      const { upiAmount } = computeAmounts();
      const finalAmount = upiAmount;

      const body = {
        mobile: user.mobile,
        amount: parseFloat(finalAmount.toString()),
        currency: 'INR',
      };
      const token = await getToken();
      const response: any = await AuthPost(ENDPOINTS.PLACE_ORDER(appointmentId), body, token);
      if (!response) {
        Toast.show({
          type: 'error',
          text1: t.paymentError,
          text2: t.somethingWentWrong,
        });
        return;
      }
      const link = response?.data?.link_url;
      const linkId = response?.data?.linkId;
      if (!link || !linkId) {
        Toast.show({
          type: 'error',
          text1: t.paymentError,
          text2: 'Payment link or ID not received from server',
        });
        return;
      }
      await AsyncStorage.setItem('linkId', linkId);
      setPaymentLink(link);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: t.paymentError,
        text2: error?.message || t.paymentErrorMessage,
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
      if (response && response.data && response?.data?.length > 0) {
        const status = response.data[0].order_status;
        if (status === 'PAID') {
          Toast.show({
            type: 'success',
            text1: `${t.paymentVerifiedPrefix}${linkId}`,
          });
          await AsyncStorage.removeItem('linkId');
          navigation.replace('HomeServiceBookingConfirmation', {
            orderID: linkId,
            platformFee: platformFee || 0,
            selectedOption: selectedOption,
          });
        } else {
          Toast.show({
            type: 'error',
            text1: t.paymentFailed,
            text2: `${t.orderIdPrefix}${linkId}`,
          });
          await AsyncStorage.removeItem('linkId');
          handleReleaseSlot('Payment failed');
        }
      } else {
        Toast.show({
          type: 'error',
          text1: t.paymentFailed,
          text2: `${t.orderIdPrefix}${linkId}`,
        });
        await AsyncStorage.removeItem('linkId');
        handleReleaseSlot('Payment failed');
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: t.paymentError,
        text2: error?.message || t.somethingWentWrong,
      });
    }
  };
  // Filter options based on first appointment logic
  const filteredOptions = useMemo(() => {
    if (hasAppointments === false) {
      return options.filter(opt => opt.id === 'upi');
    }
    // For returning users, show all options except referral if not used
    return options.filter(
      opt => opt.id !== 'referral' || user?.usedReferralCode,
    );
  }, [hasAppointments, user?.usedReferralCode, options]);
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
                text1: t.paymentOpened,
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
      if (!patient?.userId || !doctor?.doctorId) {
        Alert.alert(t.error, 'Patient or Doctor information is missing');
        return;
      }
      if (!selectedOption) {
        Alert.alert(t.error, 'Please select a payment method');
        return;
      }

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert(t.error, 'Authentication token not found. Please login again.');
        return;
      }

      const { walletDeduction, upiAmount } = computeAmounts();

      // Build form data
      const formData = new FormData();
      const homeAddressString = Object.entries(homeaddress || {})
        .map(([key, value]) => `${key}:${value || ''}`)
        .join(',');

      const appointmentStatus = 'pending' ;

      // Determine payment status and method
      let paymentStatus = 'unpaid';
      let actualPaymentMethod = selectedOption;

      if (useWallet && walletDeduction > 0) {
        if (upiAmount === 0) {
          // Fully covered by wallet
          paymentStatus = 'paid';
          actualPaymentMethod = 'wallet';
        } else {
          // Partial wallet + UPI
          actualPaymentMethod = 'wallet+upi';
        }
      }

      if (selectedOption === 'wallet') {
        paymentStatus = 'paid';
      }

      // For first appointment with referral, force UPI payment
      if (hasAppointments === false && user?.usedReferralCode) {
        actualPaymentMethod = useWallet && walletDeduction > 0
          ? (upiAmount === 0 ? 'wallet' : 'wallet+upi')
          : 'upi';
        paymentStatus = upiAmount === 0 && useWallet ? 'paid' : 'unpaid';
      }

      // Calculate discount
      let discountAmount = 0;
      let discountType = 'percentage';
      let couponIdValue = null;
      let referralCodeValue = null;

      if (selectedDiscount === 'promo' && appliedPromoCode && couponId) {
        discountAmount = promoDiscount;
        discountType = 'flat';
        couponIdValue = couponId;
      } else if (selectedDiscount === 'referral' && hasAppointments === false && user?.usedReferralCode) {
        discountAmount = user?.referralDiscount;
        discountType = 'flat';
        referralCodeValue = user.usedReferralCode;
      } else if (selectedOption === 'referral' && user?.usedReferralCode) {
        discountAmount = user?.referralDiscount;
        discountType = 'flat';
        referralCodeValue = user.usedReferralCode;
      }

      formData.append('userId', patient?.userId);
      formData.append('doctorId', doctor?.doctorId);
      formData.append(
        'patientName',
        patient?.name || `${patient?.firstname} ${patient?.lastname}`,
      );
      formData.append('doctorName', `${doctor?.name}`);
      formData.append('appointmentType', 'Home Visit');
      formData.append('appointmentDepartment', doctor?.specialty?.name);
      formData.append('addressId', doctor?.addresses[0]?.addressId);
      formData.append('appointmentDate', date);
      formData.append('appointmentTime', formatTimeForAPI(time));
      formData.append('appointmentStatus', appointmentStatus);
      formData.append('appointmentReason', reason);
      formData.append('amount', doctor?.consultationFee[2].fee);
      formData.append('discount', String(discountAmount));
      formData.append('discountType', discountType);
      formData.append('paymentStatus', paymentStatus);
      formData.append('appSource', 'patientApp');
      formData.append('homeAddress', homeAddressString);
      formData.append('paymentMethod', actualPaymentMethod || '');

  
      if (couponIdValue) {
        formData.append('couponId', couponIdValue);
      }
     

      if (reports && reports.length > 0) {
        formData.append('medicalReport', {
          uri: reports[0].uri,
          type: reports[0].type,
          name: reports[0].name,
        });
      }

      const response: any = await UploadFiles(
        ENDPOINTS.CREATE_APPOINTMENT,
        formData,
        token,
      );

      if (response?.data?.status === 'success') {
        const appointmentId = response?.data?.data?.appointmentId;
        const platformFeeValue = response?.data?.data?.platformfee || 0;
        const appointmentObjId = response?.data?.data?.appointmentObjId;

        setPlatformFee(platformFeeValue);

        const appointmentDetails: any = {
          userId: patient?.userId,
          doctorId: doctor?.doctorId,
          patientName:
            patient?.name || `${patient?.firstname} ${patient?.lastname}`,
          doctorName: `${doctor?.name}`,
          appointmentType: 'Home Visit',
          appointmentDepartment: doctor?.specialty?.name,
          addressId: doctor?.addresses[0]?.addressId,
          appointmentDate: date,
          appointmentTime: formatTimeForAPI(time),
          homeAddress: homeAddressString,
          appointmentStatus,
          appointmentReason: reason,
          amount: doctor?.consultationFee[2]?.fee,
          discount: discountAmount,
          discountType,
          paymentStatus: paymentStatus,
          appSource: 'patientApp',
          appointmentId,
          appointmentObjId,
          paymentMethod: actualPaymentMethod,
        };

        if (couponIdValue) {
          appointmentDetails.couponId = couponIdValue;
          appointmentDetails.appliedPromoCode = appliedPromoCode;
        }
        if (referralCodeValue) {
          appointmentDetails.referralCode = referralCodeValue;
        }
        if (useWallet && walletDeduction > 0) {
          appointmentDetails.walletAmount = walletDeduction;
        }

        const finalAmount = Math.max(
          (doctor?.consultationFee[2]?.fee || 0) - discountAmount,
          0,
        );
        appointmentDetails.finalAmount = finalAmount;

        try {
          await AsyncStorage.setItem(
            'latestAppointmentDetails',
            JSON.stringify(appointmentDetails),
          );
        } catch (storageError) {
          console.warn('Failed to save appointment details to AsyncStorage:', storageError);
        }

        if (upiAmount > 0) {
          await handleCashfreePayment(platformFeeValue, appointmentId);
        } else {
          // Fully paid via wallet or zero-amount
          const transactionId =
            response?.data?.data?.statusHistory?.[0]?.transactionID || appointmentId || '';
          navigation.replace('HomeServiceBookingConfirmation', {
            orderID: transactionId,
            platformFee: platformFeeValue,
            selectedOption: actualPaymentMethod,
          });
        }
      } else {
        const errorMessage =
          response?.data?.message ||
          response?.message?.message ||
          response?.message?.error ||
          t.appointmentError;

        console.error('Appointment creation failed:', {
          status: response?.status,
          data: response?.data,
          message: response?.message,
        });

        Alert.alert(t.error, errorMessage, [{ text: t.ok }]);

        Toast.show({
          type: 'error',
          text1: t.appointmentError,
          text2: errorMessage,
          position: 'top',
          visibilityTime: 4000,
        });
      }
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        error?.toString() ||
        t.appointmentErrorMessage;

      console.log('createAppointment error:', {
        message: error?.message,
        code: error?.code,
        response: error?.response?.data,
        stack: error?.stack,
      });

      Alert.alert(t.error, errorMessage, [{ text: t.ok }]);

      Toast.show({
        type: 'error',
        text1: t.appointmentError,
        text2: errorMessage,
        position: 'top',
        visibilityTime: 4000,
      });

      if (selectedOption === 'upi') {
        try {
          await handleReleaseSlot('Appointment creation failed');
        } catch (releaseError) {
          console.warn('Failed to release slot:', releaseError);
        }
      }
    }
  };

  const handlePay = () => {
    createAppointment();
  };

  const editAddress = () => {
    navigation.navigate('HomeAddress');
  };

  const addrLines = formatAddressLines(formData);

  const handleCancel = () => {
    navigation.navigate('CancelAppointment', {
      appointmentDetails: {
        patientName: patient?.name || `${patient?.firstname || ''} ${patient?.lastname || ''}`.trim(),
        doctor: `Dr. ${doctor?.name || ''}`,
        specialty: doctor?.specialty?.name || doctor?.speciality || doctor?.specialization || 'Cardiologist',
        mode: 'Home Visit',
        clinic: '',
        address: addrLines.join(', '),
        dateTime: `${formatDate(date)}, ${time}`,
        duration: '20 mins',
        consultationFee: doctor?.consultationFee[2]?.fee || 0,
      },
    });
  };

  const avatarSource = getAvatarSource(doctorProfilePic);
  const nameParts = (doctor?.name || 'D').split(' ');
  const firstName = nameParts[0] || 'D';
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
  const doctorInitial = getAvatarInitial(firstName, lastName);

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      Toast.show({
        type: 'error',
        text1: t.error,
        text2: 'Please enter a promo code',
      });
      return;
    }
    try {
      const token = await getToken();
      if (!token) {
        Toast.show({
          type: 'error',
          text1: t.error,
          text2: 'Authentication token not found',
        });
        return;
      }
      const patientUserId = patient?.userId || user?.userId;
      const consultationFeeAmount = Array.isArray(doctor.consultationFee)
        ? doctor.consultationFee[2].fee
        : doctor.consultationFee;
      const promoData = {
        userId: patientUserId,
        purchaseAmount: consultationFeeAmount,
        code: promoCode.trim().toUpperCase(),
      };
      console.log('Promo Data:', promoData);
      const response: any = await AuthPost(
        ENDPOINTS.VALIDATE_COUPON_CODE,
        promoData,
        token,
      );
      console.log('Promo Code Response:', response);
      if (response?.status === 'success') {
        const discount = response?.data?.discountAmount || 0;
        console.log('Discount Amount:', discount);
        setSelectedDiscount('promo');
        setAppliedPromoCode(promoCode.trim().toUpperCase());
        setPromoDiscount(discount);
        setCouponId(response?.data?.couponId || null);
        Toast.show({
          type: 'success',
          text1: t.promoCodeApplied,
          text2: `${t.discountPrefix} ₹ ${discount}`,
        });
        setPromoCode('');
      } else {
        const errorMessage = response?.message|| 'Invalid promo code';
        Alert.alert(
          t.invalidPromoCode,
          errorMessage,
          [{ text: t.ok, onPress: () => {} }],
          { cancelable: true },
        );
      }
    } catch (error: any) {
      const errorMessage =
        error?.message || error?.toString() || t.somethingWentWrong;
      Alert.alert(
        t.error,
        errorMessage,
        [{ text: t.ok, onPress: () => {} }],
        { cancelable: true },
      );
    }
  };

  // Derived amounts for display
  const { afterDiscount, walletDeduction, upiAmount } = computeAmounts();

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Doctor Details */}
        <Card>
          <CardHeader icon="👤" title={t.doctorDetails} />
          <TouchableOpacity onPress={handleViewDetails} activeOpacity={0.95}>
            <View style={styles.doctorRow}>
              <View style={styles.doctorImageContainer}>
                <View style={styles.avatar}>
                  {avatarSource ? (
                    <Image
                      source={avatarSource}
                      style={styles.avatarImage}
                      resizeMode="cover"
                      onError={e => {
                        console.log('Failed to load profile image');
                      }}
                    />
                  ) : (
                    <Text style={styles.avatarText}>{doctorInitial}</Text>
                  )}
                </View>
              </View>
              <View style={styles.doctorDetails}>
                <Text style={styles.doctorName}>
                  Dr. {doctor?.name || 'Dr. Sameer Verma'}
                </Text>
                <Text style={styles.muted}>
                  {doctor?.speciality ||
                    doctor?.specialization ||
                    'Physiotherapist'}
                </Text>
                <Text style={[styles.badge, styles.badgeBlue]}>Home-Visit</Text>
                <View style={styles.detailsContainer}>
                  <TouchableOpacity
                    onPress={e => {
                      e.stopPropagation();
                      handleViewDetails();
                    }}
                  >
                    <Text style={styles.detailsText}>👁️ Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Card>

        {/* Appointment Slot */}
        <Card>
          <CardHeader icon="📅" title={t.appointmentSlot} />
          <Row icon="📅">
            <Text style={styles.value}>{formatDate(date)}</Text>
          </Row>
          <Row icon="⏰" top={8}>
            <Text style={styles.value}>
              {time.replace(/am|pm/, match => match.toUpperCase())}
            </Text>
          </Row>
        </Card>

        {/* Reason for Consultation */}
        <Card>
          <CardHeader icon="📄" title={t.reasonForConsultation} />
          <Text style={styles.value}>
            {reason ? `"${reason}"` : `"Back pain and muscle stiffness"`}
          </Text>
        </Card>

        {/* Patient Details */}
        <Card>
          <CardHeader icon="👤" title={t.patientDetails} />
          <FieldLine
            label={t.name}
            value={`${patient?.firstname} ${patient?.lastname}` || 'N/A'}
          />
          <FieldLine label={t.age} value={String(patient?.age ?? 'N/A')} />
          <FieldLine label={t.gender} value={patient?.gender || 'N/A'} />
          <FieldLine label={t.phone} value={patient?.mobile || 'N/A'} />
        </Card>

        {/* Home Address */}
        <Card>
          <CardHeader icon="🏠" title={t.homeAddress} />
          <View style={{ marginTop: SPACING.xs }}>
            {addrLines.map((ln, i) => (
              <Text key={i} style={styles.value}>
                {ln}
              </Text>
            ))}
          </View>
        </Card>

        {/* Payment Summary */}
        <Card>
          <CardHeader icon="🧾" title={t.paymentSummary} />
          <View style={styles.hr} />
          <View style={styles.rowBetween}>
            <Text style={styles.label}>{t.consultationFee}</Text>
            <Text style={styles.value}>₹{doctor?.consultationFee[2].fee}</Text>
          </View>
          {useAidUnits && (
            <>
              <View style={[styles.rowBetween, { marginTop: SPACING.sm }]}>
                <Text style={styles.label}>{t.vydhyoAidUnits}</Text>
                <Text style={styles.value}>- ₹{aidUnitsValue}</Text>
              </View>
              <View
                style={[
                  styles.rowBetween,
                  styles.dividerTop,
                  { marginTop: SPACING.md, paddingTop: SPACING.sm },
                ]}
              >
                <Text style={[styles.label, { fontWeight: '700' }]}>
                  {t.amountPayable}
                </Text>
                <Text style={[styles.value, { fontWeight: '700' }]}>
                  ₹{payable}
                </Text>
              </View>
            </>
          )}
        </Card>

        {/* Discount Options for First Appointment */}
        {hasAppointments === false && (
          <View style={styles.discountOptionsSection}>
            <Text style={styles.discountOptionsTitle}>{t.applyDiscount}</Text>
            <View style={styles.discountOptionsRow}>
              {/* {!!user?.referralDiscount && (
                <TouchableOpacity
                  style={[
                    styles.discountOptionCard,
                    selectedDiscount === 'referral' &&
                      styles.selectedDiscountOptionCard,
                  ]}
                  onPress={() => {
                    setSelectedDiscount('referral');
                    setAppliedPromoCode(null);
                    setPromoDiscount(0);
                    setPromoCode('');
                    setCouponId(null);
                  }}
                >
                  <Text
                    style={[
                      styles.discountOptionText,
                      selectedDiscount === 'referral' &&
                        styles.selectedDiscountOptionText,
                    ]}
                  >
                    {t.referral}
                  </Text>
                </TouchableOpacity>
              )} */}
              <TouchableOpacity
                style={[
                  styles.discountOptionCard,
                  styles.promoOptionCard,
                  selectedDiscount === 'promo' && styles.selectedPromoOptionCard,
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
                  {t.promoCode}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* First Appointment Referral Discount */}
        {selectedDiscount === 'referral' && hasAppointments === false && user?.usedReferralCode && (
          <View style={styles.referralDiscountSection}>
            <Text style={styles.referralDiscountLabel}>
              First Appointment Discount
            </Text>
            <View style={styles.priceBreakdownContainer}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>{t.originalFee}</Text>
                <Text style={styles.breakdownValue}>
                  ₹{Array.isArray(doctor.consultationFee)
                    ? doctor.consultationFee[2].fee
                    : doctor.consultationFee}
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, styles.discountLabel]}>
                  - Referral Discount
                </Text>
                <Text style={[styles.breakdownValue, styles.discountValue]}>
                  ₹{referralDiscount}
                </Text>
              </View>
              <View style={[styles.breakdownRow, styles.finalBreakdownRow]}>
                <Text style={styles.finalBreakdownLabel}>
                  Final Amount After Referral Discount
                </Text>
                <Text style={styles.finalBreakdownValue}>
                  ₹{referralFinalAmount}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Promo Code Section */}
        {(selectedDiscount === 'promo' || appliedPromoCode) && (
          <View style={styles.promoCodeSection}>
            <View style={styles.promoCodeHeaderContainer}>
              <Text style={styles.promoCodeLabel}>{t.promoCode}</Text>
              {appliedPromoCode && (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedDiscount(null);
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
                      {` ( ₹${promoDiscount} ${t.discount})`}
                    </Text>
                  </Text>
                </View>
                <View style={styles.priceBreakdownContainer}>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>{t.originalFee}</Text>
                    <Text style={styles.breakdownValue}>
                      ₹{Array.isArray(doctor.consultationFee)
                        ? doctor.consultationFee[2].fee
                        : doctor.consultationFee}
                    </Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, styles.discountLabel]}>
                      {`- ${t.discountAmount}`}
                    </Text>
                    <Text style={[styles.breakdownValue, styles.discountValue]}>
                      - ₹{promoDiscount}
                    </Text>
                  </View>
                  <View style={[styles.breakdownRow, styles.finalBreakdownRow]}>
                    <Text style={styles.finalBreakdownLabel}>{t.finalAmount}</Text>
                    <Text style={styles.finalBreakdownValue}>
                      ₹{Math.max(
                        (Array.isArray(doctor.consultationFee)
                          ? doctor.consultationFee[2].fee
                          : doctor.consultationFee) - promoDiscount,
                        0
                      )}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.promoInputContainer}>
                <TextInput
                  style={styles.promoInput}
                  placeholder={t.enterPromoCode}
                  placeholderTextColor="#999999"
                  value={promoCode}
                  onChangeText={setPromoCode}
                  maxLength={20}
                />
                <TouchableOpacity
                  style={[
                    styles.applyPromoButton,
                    !promoCode.trim() ? styles.disabledApplyButton : styles.enabledApplyButton,
                  ]}
                  onPress={handleApplyPromoCode}
                  disabled={!promoCode.trim()}
                >
                  <Text style={styles.applyPromoButtonText}>
                    {t.applyPromoCode}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ─── Wallet Checkbox ─────────────────────────────────────────── */}
        <View style={styles.walletSection}>
          <TouchableOpacity
            style={styles.walletCheckboxRow}
            onPress={() => {
              if (hasWalletBalance) {
                setUseWallet(prev => !prev);
                setSelectedOption("wallet");
              }
            }}
            // disabled={!hasWalletBalance}
            activeOpacity={hasWalletBalance ? 0.7 : 1}
          >
            <View
              style={[
                styles.checkboxBox,
                useWallet && hasWalletBalance && styles.checkboxBoxChecked,
                !hasWalletBalance && styles.checkboxBoxDisabled,
              ]}
            >
              {useWallet && hasWalletBalance && (
                <Text style={styles.checkboxTick}>✓</Text>
              )}
            </View>
            <View style={styles.walletLabelContainer}>
              <Text
                style={[
                  styles.walletLabel,
                  !hasWalletBalance && styles.walletLabelDisabled,
                ]}
              >
                {t.wallet}
              </Text>
              <Text
                style={[
                  styles.walletBalanceText,
                  !hasWalletBalance && styles.walletLabelDisabled,
                ]}
              >
                {hasWalletBalance
                  ? `Balance: ₹ ${walletBalance}`
                  : 'No wallet balance available'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Wallet deduction breakdown shown when checked */}
          {useWallet && hasWalletBalance && (
            <View style={styles.priceBreakdownContainer}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Amount After Discount</Text>
                <Text style={styles.breakdownValue}>₹ {afterDiscount}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, styles.discountLabel]}>
                  - Wallet Deduction
                </Text>
                <Text style={[styles.breakdownValue, styles.discountValue]}>
                  ₹ {walletDeduction}
                </Text>
              </View>
              <View style={[styles.breakdownRow, styles.finalBreakdownRow]}>
                <Text style={styles.finalBreakdownLabel}>
                  {upiAmount > 0 ? 'Remaining to pay' : 'Total (Wallet Covers All)'}
                </Text>
                <Text style={styles.finalBreakdownValue}>₹ {upiAmount}</Text>
              </View>
            </View>
          )}
        </View>
        {/* ─────────────────────────────────────────────────────────────── */}


        {/* Row of cards — only UPI */}
        <View style={styles.paymentRow}>
         
            <TouchableOpacity
              style={[
                styles.paymentCard,
              ]}
               onPress={handlePay}
              // onPress={() => setSelectedOption(opt.id)}
            >
              <Text
                style={[
                   styles.selectedText,
                  styles.cardText,
                ]}
              >
                {t.payNow}

              </Text>
            </TouchableOpacity>
       
        </View>

        {/* Pay / Cancel */}
        {/* <TouchableOpacity
          style={[styles.payButton, payButtonDisabled && { opacity: 0.7 }]}
          onPress={handlePay}
          disabled={payButtonDisabled}
        >
          <Text style={styles.payText}>{payButtonText}</Text>
        </TouchableOpacity> */}

        {/* <TouchableOpacity
          style={styles.cancelBtn}
          activeOpacity={0.9}
          onPress={handleCancel}
        >
          <Text style={styles.cancelText}>✕ {t.cancel}</Text>
        </TouchableOpacity> */}

        {/* Info note */}
        <View style={styles.infoBox}>
          <View style={styles.infoIcon}>
            <Text style={styles.infoIconText}>ℹ️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLine}>{t.reminder}</Text>
            <Text style={styles.infoLine}>{t.bookingDetails}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// ---------- Small UI Parts ----------
const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.card}>{children}</View>
);

const CardHeader: React.FC<{
  icon: string;
  title: string;
  right?: React.ReactNode;
  style?: any;
}> = ({ icon, title, right, style }) => (
  <View style={[styles.cardHeader, style]}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={styles.headerIconWrap}>
        <Text style={styles.headerIconText}>{icon}</Text>
      </View>
      <Text style={styles.cardHeaderText}>{title}</Text>
    </View>
    {right ? right : null}
  </View>
);

const Row: React.FC<{
  icon?: string;
  top?: number;
  children: React.ReactNode;
}> = ({ icon, top = 6, children }) => (
  <View style={[styles.row, { marginTop: top }]}>
    {!!icon && (
      <Text
        style={{
          marginRight: SPACING.xs,
          marginTop: 1,
          fontSize: moderateScale(16),
        }}
      >
        {icon}
      </Text>
    )}
    {children}
  </View>
);

const FieldLine: React.FC<{ label: string; value?: string }> = ({
  label,
  value,
}) => (
  <View style={styles.rowBetween}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || '-'}</Text>
  </View>
);

// ---------- Styles ----------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EAF7F1',
  },
  scroll: {
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
  },
  scrollContent: {
    paddingBottom: SAFE_AREA.safeBottom + SPACING.lg,
  },
  hr: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#171f22ff',
    marginBottom: SPACING.xs,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  doctorDetails: {
    flex: 1,
    position: 'relative',
  },
  doctorName: {
    color: '#0C1B1F',
    fontWeight: '700',
    fontSize: moderateScale(14),
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: Platform.select({ ios: SPACING.xs, android: SPACING.xxs }),
    borderRadius: LAYOUT.borderRadius.sm,
    fontSize: moderateScale(11),
    overflow: 'hidden',
  },
  detailsContainer: {
    alignItems: 'flex-end',
    marginTop: SPACING.xs,
  },
  detailsText: {
    fontSize: moderateScale(11),
    color: '#1976d2',
    fontStyle: 'italic',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  doctorImageContainer: { marginRight: SPACING.md },
  avatar: {
    width: isTablet ? moderateScale(70) : moderateScale(60),
    height: isTablet ? moderateScale(70) : moderateScale(60),
    borderRadius: isTablet ? moderateScale(35) : moderateScale(30),
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: isTablet ? moderateScale(35) : moderateScale(30),
  },
  avatarText: {
    fontSize: moderateScale(isTablet ? 24 : 20),
    fontWeight: 'bold',
    color: '#1976d2',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: isTablet ? SPACING.lg : SPACING.md,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: '#CFEBDD',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    justifyContent: 'space-between',
  },
  headerIconWrap: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: LAYOUT.borderRadius.sm,
    backgroundColor: '#E5F6EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  headerIconText: {
    fontSize: moderateScale(12),
  },
  cardHeaderText: {
    color: '#4D6B75',
    fontSize: moderateScale(12),
    fontWeight: '700',
  },
  badgeBlue: { backgroundColor: '#E9F1FF', color: '#1977F3' },
  label: {
    color: '#506872',
    fontSize: moderateScale(13),
  },
  value: {
    color: '#0C1B1F',
    fontSize: moderateScale(13),
  },
  muted: {
    color: '#6D858F',
    fontSize: moderateScale(12),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    marginTop: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editRow: { flexDirection: 'row', alignItems: 'center' },
  editText: {
    color: '#0EA25A',
    fontSize: moderateScale(12),
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  aidRow: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: LAYOUT.borderRadius.sm,
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  checkboxBoxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkboxBoxDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  checkboxTick: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    lineHeight: moderateScale(14),
    fontWeight: '700',
  },
  payButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
  },
  payText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  cancelBtn: {
    height: LAYOUT.buttonHeight,
    borderRadius: LAYOUT.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDEFF2',
    marginTop: SPACING.sm,
  },
  cancelText: {
    color: '#6B7680',
    fontWeight: '700',
    fontSize: moderateScale(14),
  },
  infoBox: {
    marginTop: SPACING.md,
    backgroundColor: '#F2F7FF',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#DDE8FF',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: SPACING.sm,
    marginTop: moderateScale(2),
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: LAYOUT.borderRadius.sm,
    backgroundColor: '#E9F1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIconText: {
    fontSize: moderateScale(12),
  },
  infoLine: {
    color: '#3F5560',
    fontSize: moderateScale(12),
  },
  dividerTop: {
    borderTopWidth: 1,
    borderTopColor: '#EDF2F4',
  },
  paymentTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    marginBottom: SPACING.lg,
    marginTop: SPACING.lg,
    color: '#333',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  paymentCard: {
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
  cardText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#fff',
    fontWeight: '500',
  },
  selectedText: {
    fontWeight: 'bold',
    color: '#fff',
  },
  promoCodeSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.md,
    padding: moderateScale(SPACING.md),
    marginBottom: moderateScale(SPACING.lg),
    marginTop: moderateScale(SPACING.md),
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  promoCodeHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.md),
  },
  promoCodeLabel: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#333333',
    marginBottom: moderateScale(SPACING.md),
  },
  promoInputContainer: {
    flexDirection: 'row',
    gap: moderateScale(SPACING.sm),
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.md),
  },
  promoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: LAYOUT.borderRadius.sm,
    paddingHorizontal: moderateScale(SPACING.md),
    paddingVertical: moderateScale(SPACING.sm),
    fontSize: moderateScale(12),
    color: '#333333',
    backgroundColor: '#FAFAFA',
    minHeight: moderateScale(44),
  },
  applyPromoButton: {
    paddingHorizontal: moderateScale(SPACING.lg),
    paddingVertical: moderateScale(SPACING.sm),
    borderRadius: LAYOUT.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: moderateScale(44),
  },
  enabledApplyButton: {
    backgroundColor: '#4CAF50',
  },
  disabledApplyButton: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  applyPromoButtonText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  appliedPromoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: LAYOUT.borderRadius.sm,
    paddingHorizontal: moderateScale(SPACING.md),
    paddingVertical: moderateScale(SPACING.sm),
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    marginBottom: moderateScale(SPACING.md),
  },
  appliedPromoCode: {
    flex: 1,
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#2E7D32',
  },
  appliedPromoDiscount: {
    fontSize: moderateScale(12),
    color: '#4CAF50',
    fontWeight: '500',
  },
  removePromoButton: {
    paddingHorizontal: moderateScale(SPACING.sm),
    paddingVertical: moderateScale(SPACING.xs),
    marginLeft: moderateScale(SPACING.sm),
    minHeight: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePromoText: {
    fontSize: moderateScale(18),
    color: '#D32F2F',
    fontWeight: 'bold',
  },
  removePromoButtonHeader: {
    paddingHorizontal: moderateScale(SPACING.sm),
    paddingVertical: moderateScale(SPACING.xs),
    minHeight: moderateScale(32),
    minWidth: moderateScale(32),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: LAYOUT.borderRadius.sm,
    backgroundColor: '#FFE5E5',
  },
  removePromoTextHeader: {
    fontSize: moderateScale(18),
    color: '#D32F2F',
    fontWeight: 'bold',
  },
  priceBreakdownContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: LAYOUT.borderRadius.sm,
    padding: moderateScale(SPACING.md),
    marginTop: moderateScale(SPACING.md),
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.sm),
  },
  breakdownLabel: {
    fontSize: moderateScale(12),
    color: '#666666',
    flex: 1,
  },
  breakdownValue: {
    fontSize: moderateScale(12),
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
    marginTop: moderateScale(SPACING.sm),
    paddingTop: moderateScale(SPACING.sm),
  },
  finalBreakdownLabel: {
    fontSize: moderateScale(14),
    color: '#333333',
    fontWeight: '700',
    flex: 1,
  },
  finalBreakdownValue: {
    fontSize: moderateScale(14),
    color: '#2E7D32',
    fontWeight: '700',
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
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: SPACING.sm,
  },
  discountOptionsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.md,
    padding: moderateScale(SPACING.md),
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  discountOptionsTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#333333',
    marginBottom: SPACING.md,
  },
  discountOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: moderateScale(SPACING.sm),
  },
  discountOptionCard: {
    flex: 1,
    paddingVertical: moderateScale(SPACING.md),
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    minHeight: moderateScale(50),
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
    fontSize: moderateScale(12),
    color: '#333333',
    fontWeight: '500',
  },
  selectedDiscountOptionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // ─── Wallet styles ──────────────────────────────────────────────────────
  walletSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.md,
    padding: moderateScale(SPACING.md),
    marginBottom: moderateScale(SPACING.md),
    marginTop: moderateScale(SPACING.md),
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  walletCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletLabelContainer: {
    flex: 1,
  },
  walletLabel: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#333333',
  },
  walletLabelDisabled: {
    color: '#AAAAAA',
  },
  walletBalanceText: {
    fontSize: moderateScale(12),
    color: '#4CAF50',
    marginTop: moderateScale(2),
  },
});

export default ConfirmToPay;