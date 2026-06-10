import React, { useEffect, useState } from 'react';
import { AuthFetch, ENDPOINTS } from '../../services';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import {
  RootStackParamList,
  UpcomingAppointment,
  CompletedAppointment,
  CancelledAppointment,
} from '../../navigation/navigationTypes';
import Toast from 'react-native-toast-message';
;
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';

// Import responsive utilities
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  isIOS,
  isAndroid,
  isTablet,
  isSmallDevice,
  isLargeDevice,
  isExtraSmallDevice,
  SPACING,
  FONT_SIZE,
  ICON_SIZE,
  LAYOUT,
  responsiveWidth,
  responsiveHeight,
  responsiveText,
  moderateScale,
  SAFE_AREA,
  PLATFORM,
} from '../../utils/responsive';

// Define the appointment type as a union of possible appointment types
type Appointment = UpcomingAppointment | CompletedAppointment | CancelledAppointment;

// Define route prop type
type ViewDetailsScreenRouteProp = RouteProp<RootStackParamList, 'ViewDetails'>;

/** ===================== i18n (EN / HI / TEL) ===================== */
type Lang = 'en' | 'hi' | 'tel';
const normalizeLang = (l?: string): Lang => {
  if (l === 'en' || l === 'hi' || l === 'tel') return l;
  if (l === 'te') return 'tel';
  return 'en';
};

const UI = {
  common: {
    error: { en: 'Error', hi: 'त्रुटि', tel: 'లోపం' },
    drPrefix: { en: 'Dr. ', hi: 'डॉ. ', tel: 'డా. ' },
    unknown: { en: 'Unknown', hi: 'अज्ञात', tel: 'తెలియదు' },
  },
  headerTitle: {
    en: 'Appointment Details',
    hi: 'नियुक्ति विवरण',
    tel: 'అపాయింట్‌మెంట్ వివరాలు',
  },
  errors: {
    notLoggedInReschedule: {
      en: 'You are not logged in. Please log in to reschedule your appointment.',
      hi: 'आप लॉग इन नहीं हैं। कृपया अपनी नियुक्ति को पुनर्निर्धारित करने के लिए लॉग इन करें।',
      tel: 'మీరు లాగిన్ కాలేదు. అపాయింట్‌మెంట్‌ను రీషెడ్యూల్ చేయడానికి లాగిన్ అవండి.',
    },
    fetchDoctor: {
      en: 'Failed to fetch doctor details',
      hi: 'डॉक्टर विवरण प्राप्त करने में विफल',
      tel: 'డాక్టర్ వివరాలు పొందడంలో విఫలమైంది',
    },
    fetchClinic: {
      en: 'Failed to fetch clinic details',
      hi: 'क्लिनिक विवरण प्राप्त करने में विफल',
      tel: 'క్లినిక్ వివరాలు తీసుకురావడంలో విఫలమైంది',
    },
  },
  labels: {
    patient: { en: 'Patient:', hi: 'रोगी:', tel: 'రోగి:' },
    bookingId: { en: 'Booking ID:', hi: 'बुकिंग आईडी:', tel: 'బుకింగ్ ఐడి:' },
    appointmentInfo: {
      en: 'Appointment Information',
      hi: 'नियुक्ति जानकारी',
      tel: 'అపాయింట్‌మెంట్ సమాచారం',
    },
    dateTime: { en: 'Date & Time', hi: 'तारीख और समय', tel: 'తేదీ & సమయం' },
    feePaid: { en: 'Fee Paid', hi: 'भुगतान की गई शुल्क', tel: 'చెల్లించిన ఫీజు' },
    clinicAddress: { en: 'Clinic Address', hi: 'क्लिनिक पता', tel: 'క్లినిక్ చిరునామా' },
    getDirections: { en: 'Get Directions', hi: 'दिशा-निर्देश प्राप्त करें', tel: 'దారులు పొందండి' },
    notesTitle: {
      en: 'Notes & Instructions',
      hi: 'टिप्पणियाँ एवं निर्देश',
      tel: 'గమనికలు & సూచనలు',
    },
    arriveNote: {
      en: 'Please arrive 10 minutes early. Bring previous reports if available.',
      hi: 'कृपया 10 मिनट पहले पहुंचें। उपलब्ध होने पर पिछले रिपोर्ट साथ लाएं।',
      tel: 'దయచేసి 10 నిమిషాల ముందే రండి. పాత నివేదికలు ఉంటే తీసుకురండి.',
    },
    cancellationReason: {
      en: 'Cancellation Reason:',
      hi: 'रद्द करने का कारण:',
      tel: 'రద్దు చేసిన కారణం:',
    },
    emailSentTo: {
      en: 'Booking confirmation sent to:',
      hi: 'बुकिंग की पुष्टि यहाँ भेजी गई है:',
      tel: 'బుకింగ్ నిర్ధారణ ఇక్కడికి పంపబడింది:',
    },
  },
  payment: {
    title:           { en: 'PAYMENT DETAILS',       hi: 'भुगतान विवरण',                         tel: 'చెల్లింపు వివరాలు'              },
    successfullyPaid:{ en: 'Successfully paid',      hi: 'सफलतापूर्वक भुगतान किया गया',          tel: 'విజయవంతంగా చెల్లించబడింది'      },
    paymentPending:  { en: 'Payment pending',        hi: 'भुगतान प्रतीक्षित है',                  tel: 'చెల్లింపు పెండింగ్‌లో ఉంది'     },
    actual:          { en: 'ACTUAL',                 hi: 'वास्तविक',                             tel: 'వాస్తవ మొత్తం'                  },
    discount:        { en: 'DISCOUNT',               hi: 'छूट',                                  tel: 'తగ్గింపు'                       },
    status:          { en: 'STATUS',                 hi: 'स्थिति',                               tel: 'స్థితి'                         },
    paid:            { en: 'Paid',                   hi: 'भुगतान किया',                          tel: 'చెల్లించారు'                    },
    pending:         { en: 'Pending',                hi: 'प्रतीक्षित',                            tel: 'పెండింగ్'                       },
    paymentMethod:   { en: 'Payment Method',         hi: 'भुगतान विधि',                          tel: 'చెల్లింపు పద్ధతి'               },
    paymentId:       { en: 'Payment ID',             hi: 'भुगतान आईडी',                          tel: 'చెల్లింపు ఐడి'                  },
    paidAt:          { en: 'Paid At',                hi: 'भुगतान का समय',                        tel: 'చెల్లించిన సమయం'                },
    na:              { en: 'N/A',                    hi: 'उपलब्ध नहीं',                          tel: 'వర్తించదు'                      },
    upi:             { en: 'UPI',                    hi: 'यूपीआई',                               tel: 'యూపీఐ'                          },
    cash:            { en: 'Cash',                   hi: 'नकद',                                  tel: 'నగదు'                           },
    card:            { en: 'Card',                   hi: 'कार्ड',                                tel: 'కార్డు'                         },
    online:          { en: 'Online',                 hi: 'ऑनलाइन',                              tel: 'ఆన్‌లైన్'                       },
    coupon:          { en: 'Coupon',                 hi: 'कूपन',                                 tel: 'కూపన్'                          },
    wallet:          { en: 'Wallet',                 hi: 'वॉलेट',                                tel: 'వాలెట్'                         },
    breakdown:       { en: 'Payment Breakdown',      hi: 'भुगतान विवरण',                         tel: 'చెల్లింపు వివరణ'                },
    total:           { en: 'Total',                  hi: 'कुल',                                  tel: 'మొత్తం'                         },
    free:            { en: 'FREE',                   hi: 'नि:शुल्क',                             tel: 'ఉచిత'                           },
  },
  buttons: {
    downloadReceipt: {
      en: 'Download Receipt',
      hi: 'रसीद डाउनलोड करें',
      tel: 'రశీదు డౌన్‌లోడ్ చేయండి',
    },
    reschedule: { en: 'Reschedule', hi: 'पुनर्निर्धारित करें', tel: 'రీషెడ్యూల్' },
    cancel: { en: 'Cancel', hi: 'रद्द करें', tel: 'రద్దు చేయండి' },
    backToHome: { en: 'Back to Home', hi: 'होम पर लौटें', tel: 'హోమ్‌కు తిరిగి వెళ్ళండి' },
  },
  status: {
    upcoming: { en: 'Upcoming', hi: 'आगामी', tel: 'రాబోయేవి' },
    confirmed: { en: 'Confirmed', hi: 'पुष्ट', tel: 'నిర్ధారించబడింది' },
    completed: { en: 'Completed', hi: 'पूर्ण', tel: 'పూర్తయింది' },
    cancelled: { en: 'Cancelled', hi: 'रद्द', tel: 'రద్దు' },
  },
};


const translations = {
  en: {
    common: { error: 'Error' },
    drPrefix: 'Dr. ',
    headerTitle: 'Appointment Details',
    successTitle: 'Consultation Completed',
    successSubtitle: (doctorName: string) =>
      `Your consultation with ${doctorName} has been successfully completed.`,
    successNote: 'We hope your visit went well.',
    summaryTitle: 'Consultation Summary',
    patientName: 'Patient Name',
    doctor: 'Doctor',
    mode: 'Mode',
    clinic: 'Clinic',
    dateTime: 'Date & Time',
    bookingId: 'Booking ID',
    ratingTitle: 'Rate Your Experience',
    feedbackPlaceholder: 'Share your feedback (optional)',
    submitFeedback: 'Submit Feedback',
    bookAppointment: 'Book Appointment',
    home: 'Home',
    errorNotLoggedIn:
      'You are not logged in. Please log in to reschedule your appointment.',
    errorFetchDoctor: 'Failed to fetch doctor details',
    errorFetchClinic: 'Failed to fetch clinic details',
    payment: {
      title: 'PAYMENT DETAILS',
      successfullyPaid: 'Successfully paid',
      paymentPending: 'Payment pending',
      actual: 'ACTUAL',
      discount: 'DISCOUNT',
      status: 'STATUS',
      paid: 'Paid',
      pending: 'Pending',
      paymentMethod: 'Payment Method',
      paymentId: 'Payment ID',
      paidAt: 'Paid At',
      na: 'N/A',
      upi: 'UPI',
      cash: 'Cash',
      card: 'Card',
      online: 'Online',
      coupon: 'Coupon',
      wallet: 'Wallet',
      breakdown: 'Payment Breakdown',
      total: 'Total',
      free: 'FREE',
    },
  },
  tel: {
    common: { error: 'లోపం' },
    drPrefix: 'డా. ',
    headerTitle: 'అపాయింట్‌మెంట్ వివరాలు',
    successTitle: 'సంప్రదింపు పూర్తయింది',
    successSubtitle: (doctorName: string) =>
      `డాక్టర్ ${doctorName} తో మీ సంప్రదింపు విజయవంతంగా పూర్తయింది.`,
    successNote: 'మీ సందర్శన బాగా జరిగిందని ఆశిస్తున్నాము.',
    summaryTitle: 'సంప్రదింపు సారాంశం',
    patientName: 'రోగి పేరు',
    doctor: 'డాక్టర్',
    mode: 'రీతి',
    clinic: 'క్లినిక్',
    dateTime: 'తేదీ & సమయం',
    bookingId: 'బుకింగ్ ID',
    ratingTitle: 'మీ అనుభవాన్ని రేట్ చేయండి',
    feedbackPlaceholder: 'మీ అభిప్రాయాన్ని పంచుకోండి (ఐచ్ఛికం)',
    submitFeedback: 'అభిప్రాయం సమర్పించండి',
    bookAppointment: 'అపాయింట్‌మెంట్ బుక్ చేయండి',
    home: 'హోమ్',
    errorNotLoggedIn:
      'మీరు లాగిన్ కాలేదు. అపాయింట్‌మెంట్‌ను రీషెడ్యూల్ చేయడానికి దయచేసి లాగిన్ చేయండి.',
    errorFetchDoctor: 'డాక్టర్ వివరాలను పొందడంలో విఫలమైంది',
    errorFetchClinic: 'క్లినిక్ వివరాలను పొందడంలో విఫలమైంది',
    payment: {
      title: 'చెల్లింపు వివరాలు',
      successfullyPaid: 'విజయవంతంగా చెల్లించబడింది',
      paymentPending: 'చెల్లింపు పెండింగ్‌లో ఉంది',
      actual: 'వాస్తవ మొత్తం',
      discount: 'తగ్గింపు',
      status: 'స్థితి',
      paid: 'చెల్లించారు',
      pending: 'పెండింగ్',
      paymentMethod: 'చెల్లింపు పద్ధతి',
      paymentId: 'చెల్లింపు ఐడి',
      paidAt: 'చెల్లించిన సమయం',
      na: 'వర్తించదు',
      upi: 'యూపీఐ',
      cash: 'నగదు',
      card: 'కార్డు',
      online: 'ఆన్‌లైన్',
      coupon: 'కూపన్',
      wallet: 'వాలెట్',
      breakdown: 'చెల్లింపు వివరణ',
      total: 'మొత్తం',
      free: 'ఉచిత',
    },
  },
  hi: {
    common: { error: 'त्रुटि' },
    drPrefix: 'डॉ. ',
    headerTitle: 'नियुक्ति विवरण',
    successTitle: 'परामर्श पूर्ण हुआ',
    successSubtitle: (doctorName: string) =>
      `डॉ. ${doctorName} के साथ आपका परामर्श सफलतापूर्वक पूरा हो गया है।`,
    successNote: 'हमें आशा है कि आपकी यात्रा अच्छी रही।',
    summaryTitle: 'परामर्श सारांश',
    patientName: 'रोगी का नाम',
    doctor: 'डॉक्टर',
    mode: 'मोड',
    clinic: 'क्लिनिक',
    dateTime: 'तारीख और समय',
    bookingId: 'बुकिंग आईडी',
    ratingTitle: 'अपने अनुभव को रेट करें',
    feedbackPlaceholder: 'अपनी प्रतिक्रिया साझा करें (वैकल्पिक)',
    submitFeedback: 'प्रतिक्रिया सबमिट करें',
    bookAppointment: 'नियुक्ति बुक करें',
    home: 'होम',
    errorNotLoggedIn:
      'आप लॉग इन नहीं हैं। अपनी नियुक्ति को पुनर्निर्धारित करने के लिए कृपया लॉग इन करें।',
    errorFetchDoctor: 'डॉक्टर विवरण प्राप्त करने में विफल',
    errorFetchClinic: 'क्लिनिक विवरण प्राप्त करने में विफल',
    payment: {
      title: 'भुगतान विवरण',
      successfullyPaid: 'सफलतापूर्वक भुगतान किया गया',
      paymentPending: 'भुगतान प्रतीक्षित है',
      actual: 'वास्तविक',
      discount: 'छूट',
      status: 'स्थिति',
      paid: 'भुगतान किया',
      pending: 'प्रतीक्षित',
      paymentMethod: 'भुगतान विधि',
      paymentId: 'भुगतान आईडी',
      paidAt: 'भुगतान का समय',
      na: 'उपलब्ध नहीं',
      upi: 'यूपीआई',
      cash: 'नकद',
      card: 'कार्ड',
      online: 'ऑनलाइन',
      coupon: 'कूपन',
      wallet: 'वॉलेट',
      breakdown: 'भुगतान विवरण',
      total: 'कुल',
      free: 'नि:शुल्क',
    },
  },
};
/** ================================================================ */

type Fee = { type: string; fee: number };

const ViewDetails: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<ViewDetailsScreenRouteProp>();
  const { appointment, language: languageParam } = route.params;
  console.log("appointmentboom:", appointment);
  const [doctorDetails, setDoctorDetails] = useState<any>({});
  const [selectedClinic, setSelectedClinic] = useState<any>({});
  const [consultationFees, setConsultationFees] = useState<any>();
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const currentUser = useSelector((state: any) => state.currentUser);

  // Premium Features: Downloading progress
  const [downloadProgress1, setDownloadProgress1] = useState<number | null>(null);
  const [downloadProgress2, setDownloadProgress2] = useState<number | null>(null);
  
  // Premium Features: Video Calling
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [videoCallStatus, setVideoCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    let timer: any;
    if (isVideoModalVisible && videoCallStatus === 'connected') {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [isVideoModalVisible, videoCallStatus]);

  const startFakeDownload = (reportNum: number) => {
    const setProgress = reportNum === 1 ? setDownloadProgress1 : setDownloadProgress2;
    setProgress(0);
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 20) + 15;
      if (current >= 100) {
        setProgress(100);
        clearInterval(interval);
        setTimeout(() => {
          setProgress(null);
          Alert.alert(
            "Download Successful",
            `${reportNum === 1 ? "Prescription & Plan.pdf" : "Visit Summary & Vitals.pdf"} has been saved to your local storage.`
          );
        }, 500);
      } else {
        setProgress(current);
      }
    }, 200);
  };

  const handleStartVideoCall = () => {
    setIsVideoModalVisible(true);
    setVideoCallStatus('connecting');
    setTimeout(() => {
      setVideoCallStatus('connected');
    }, 2500);
  };

  const handleEndVideoCall = () => {
    setVideoCallStatus('ended');
    setTimeout(() => {
      setIsVideoModalVisible(false);
    }, 500);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };
  const lang: Lang = normalizeLang(languageParam || currentUser?.appLanguage);

  const t = translations[lang];

  const translateStatus = (s?: string) => {
    const t = (s || '').toLowerCase();
    if (t.includes('upcoming') || t.includes('schedule')) return UI.status.upcoming[lang];
    if (t.includes('confirm')) return UI.status.confirmed[lang];
    if (t.includes('complete')) return UI.status.completed[lang];
    if (t.includes('cancel')) return UI.status.cancelled[lang];
    return s || UI.common.unknown[lang];
  };

  /**
   * Translates a payment method string into a human-readable, localised label.
   * Handles: upi, cash, card, online, coupon, wallet.
   */
  const translatePaymentMethod = (method?: string): string => {
    if (!method) return UI.payment.na[lang];
    const m = method.toLowerCase();
    if (m === 'upi')    return UI.payment.upi[lang];
    if (m === 'cash')   return UI.payment.cash[lang];
    if (m === 'card')   return UI.payment.card[lang];
    if (m === 'online') return UI.payment.online[lang];
    if (m === 'coupon') return UI.payment.coupon[lang];
    if (m === 'wallet') return UI.payment.wallet[lang];
    // Fallback: capitalise first letter
    return method.charAt(0).toUpperCase() + method.slice(1);
  };

  const translatePaymentStatus = (status?: string) => {
    if (!status) return UI.payment.na[lang];
    const s = status.toLowerCase();
    if (s === 'paid')    return UI.payment.paid[lang];
    if (s === 'pending') return UI.payment.pending[lang];
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  /**
   * Formats a Date object (or ISO string) into 12-hour time with AM/PM.
   * e.g. "06:48 AM"
   */
  const format12HrTime = (dateInput: string | Date): string => {
    try {
      const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  useEffect(() => {
    const fetchDoctorDetails = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert(UI.common.error[lang], UI.errors.notLoggedInReschedule[lang]);
        return;
      }
      const response = await AuthFetch(ENDPOINTS.GET_USER(appointment?.doctorId), token);
      console.log("doctor response:", response);
      if (response.status === 'success') {
        const doctor = response.data.data;
        setDoctorDetails(doctor);

        const targetFeeType = appointment?.appointmentType === 'new-walkin'
          ? 'In-Person'
          : appointment?.appointmentType;

        const fees = doctor?.consultationModeFee?.filter(
          (fee: Fee) => fee.type === targetFeeType,
        );

        console.log("fees:", fees);
        setConsultationFees(fees?.[0]?.fee);
      } else {
        Alert.alert(
          UI.common.error[lang],
          response?.message?.message || response?.data?.message || UI.errors.fetchDoctor[lang],
        );
      }
    };

    const getClinicDetails = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert(UI.common.error[lang], UI.errors.notLoggedInReschedule[lang]);
        return;
      }
      const response = await AuthFetch(ENDPOINTS.GET_CLINIC_ADDRESS(appointment?.doctorId), token);
      if (response.status === 'success') {
        const clinic = response?.data?.data;
        const chosen = clinic.find((item: any) => item.addressId === appointment?.clinicId);
        setSelectedClinic(chosen);
      } else {
        Alert.alert(
          UI.common.error[lang],
          response?.message?.message || response?.data?.message || UI.errors.fetchClinic[lang],
        );
      }
    };

    getClinicDetails();
    fetchDoctorDetails();
  }, [appointment?.doctorId, appointment?.appointmentType, appointment?.clinicId, appointment?.appointmentId, lang]);

  useEffect(() => {
    if (appointment?.paymentDetails) {
      setPaymentDetails(appointment?.paymentDetails || null);
    }
  }, [appointment?.paymentDetails]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Date not available';
    try {
      let dateObj: Date;
      if (dateStr.includes('T')) {
        dateObj = new Date(dateStr);
      } else if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/').map(Number);
        dateObj = new Date(year, month - 1, day);
      } else {
        return 'Invalid date';
      }
      if (isNaN(dateObj.getTime())) return 'Invalid date';
      const options = { day: 'numeric', month: 'short', year: 'numeric' } as const;
      const locale = lang === 'en' ? 'en-GB' : lang === 'tel' ? 'te-IN' : 'hi-IN';
      return dateObj.toLocaleDateString(locale, options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date error';
    }
  };

  const handleBackPress = () => navigation.goBack();
  const handleGetDirections = () => { console.log('Get directions pressed'); };
  const handleDownloadReceipt = () => { console.log('Download receipt pressed'); };

  const handleReschedule = () => {
    if (appointment.status === 'Upcoming' || appointment.status === 'Confirmed') {
      navigation.navigate('Reschedule', { appointment: appointment as UpcomingAppointment });
    }
  };

  const handleCancel = () => {
    if (appointment.status === 'Upcoming' || appointment.status === 'Confirmed') {
      if (appointment.appointmentType === 'Home Visit') {
        navigation.navigate('HomeServiceCancel', { appointment: appointment as UpcomingAppointment });
      } else {
        navigation.navigate('Cancel', { appointment: appointment as UpcomingAppointment });
      }
    }
  };

  const handleBackToHome = () => navigation.navigate('Home');

  // ─── Payment section helpers ────────────────────────────────────────────────

  /**
   * Renders the Payment Details card.
   *
   * Rules:
   *  1. `actualAmount`  → taken from appointment.amount  (NOT paymentDetails)
   *  2. `discount`      → taken from appointment.discount (NOT paymentDetails)
   *  3. Breakdown rows  → one row per paymentDetails entry, showing method + finalAmount.
   *     Coupon / wallet rows appear as "Discount" rows (green, negative sign).
   *     UPI / card / cash / online rows appear as normal payment rows.
   *  4. Total row       → appointment.amount (the original fee before any discount)
   *  5. Paid At         → 12-hour AM/PM format
   */
  const renderPaymentCard = () => {
    if (!paymentDetails || (Array.isArray(paymentDetails) && paymentDetails.length === 0)) {
      return null;
    }

    const paymentList: any[] = Array.isArray(paymentDetails)
      ? [...paymentDetails].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
      : [paymentDetails];
console.log("appointmentlok",appointment)
    // ── Values sourced from appointment (requirements 1 & 2) ──────────────────
    const actualAmount: number  = appointment?.amount   ?? 0;
    const discountAmount: number = appointment?.discount ?? 0;
    const finalAmount: number   = actualAmount - discountAmount;

    // Overall payment status: paid if at least one record is "paid"
    const isFullyPaid = paymentList.some(p => p.paymentStatus === 'paid');

    // Latest record for "Paid At" timestamp
    const latestPayment = paymentList[0];

    // ── Separate breakdown entries into discount-type vs cash-type ────────────
    const discountMethods = ['coupon', 'wallet'];
    const discountEntries = paymentList.filter(p =>
      discountMethods.includes((p.paymentMethod ?? '').toLowerCase()),
    );
    const cashEntries = paymentList.filter(
      p => !discountMethods.includes((p.paymentMethod ?? '').toLowerCase()),
    );

    return (
      <View style={styles.paymentCard}>
        {/* ── Title ── */}
        <View style={styles.paymentTitleRow}>
          <View
            style={[
              styles.paymentDot,
              { backgroundColor: isFullyPaid ? '#16A34A' : '#DC2626' },
            ]}
          />
          <Text
            style={[
              styles.paymentTitleText,
              { color: isFullyPaid ? '#16A34A' : '#DC2626' },
            ]}
          >
            {t.payment.title}
          </Text>
        </View>

        <View style={styles.paymentDividerLine} />

        {/* ── Summary chips: Actual | Discount | Status ── */}
        <View style={styles.paymentChipsRow}>
          {/* ACTUAL — from appointment.amount */}
          <View style={styles.paymentChip}>
            <Text style={styles.paymentChipLabel}>{t.payment.actual}</Text>
            <Text style={styles.paymentChipValue}>₹{actualAmount}</Text>
          </View>

          {/* DISCOUNT — from appointment.discount */}
          <View style={[styles.paymentChip, styles.paymentChipMid]}>
            <Text style={styles.paymentChipLabel}>{t.payment.discount}</Text>
            <Text
              style={[
                styles.paymentChipValue,
                { color: discountAmount > 0 ? '#16A34A' : '#94A3B8' },
              ]}
            >
              {discountAmount > 0 ? `₹${discountAmount}` : '—'}
            </Text>
          </View>

          {/* STATUS */}
          <View style={styles.paymentChip}>
            <Text style={styles.paymentChipLabel}>{t.payment.status}</Text>
            <Text
              style={[
                styles.paymentChipValue,
                { color: isFullyPaid ? '#16A34A' : '#DC2626' },
              ]}
            >
              {translatePaymentStatus(latestPayment?.paymentStatus)}
            </Text>
          </View>
        </View>

        <View style={styles.paymentDividerLine} />

        {/* ── Payment Breakdown ── */}
        <Text style={styles.paymentBreakdownTitle}>{t.payment.breakdown}</Text>

        {/* Discount entries (coupon / wallet) */}
        {discountEntries.map((p, index) => (
          <View key={p.paymentId || `disc-${index}`}>
            <View style={styles.paymentBreakdownRow}>
              {/* Method label with discount badge */}
              <View style={styles.paymentBreakdownLeft}>
                <View style={styles.paymentMethodBadge}>
                  <Text style={styles.paymentMethodBadgeText}>
                    {translatePaymentMethod(p.paymentMethod)}
                  </Text>
                </View>
                {p.paymentId ? (
                  <Text style={styles.paymentIdText}>{p.paymentId}</Text>
                ) : null}
              </View>
              {/* Discount amount in green with minus sign */}
              <Text style={[styles.paymentBreakdownAmount, { color: '#16A34A' }]}>
                {p.discount > 0
                  ? `-₹${p.discount}`
                  : p.finalAmount === 0
                  ? `-₹${p.actualAmount}`
                  : `-₹${p.finalAmount}`}
              </Text>
            </View>
            {index < discountEntries.length - 1 && <View style={styles.paymentRowSep} />}
          </View>
        ))}

        {/* Cash/UPI/Card entries */}
        {cashEntries.length > 0 && discountEntries.length > 0 && (
          <View style={styles.paymentRowSep} />
        )}
        {cashEntries.map((p, index) => (
          <View key={p.paymentId || `cash-${index}`}>
            <View style={styles.paymentBreakdownRow}>
              <View style={styles.paymentBreakdownLeft}>
                <View style={[styles.paymentMethodBadge, styles.paymentMethodBadgePrimary]}>
                  <Text style={[styles.paymentMethodBadgeText, styles.paymentMethodBadgeTextPrimary]}>
                    {translatePaymentMethod(p.paymentMethod)}
                  </Text>
                </View>
                {p.paymentId ? (
                  <Text style={styles.paymentIdText}>{p.paymentId}</Text>
                ) : null}
              </View>
              <Text style={styles.paymentBreakdownAmount}>₹{p.finalAmount}</Text>
            </View>
            {index < cashEntries.length - 1 && <View style={styles.paymentRowSep} />}
          </View>
        ))}

        {/* Total row */}
        <View style={styles.paymentDividerLine} />
        <View style={styles.paymentTotalRow}>
          <Text style={styles.paymentTotalLabel}>{t.payment.total}</Text>
          <Text style={styles.paymentTotalValue}>
            {finalAmount === 0 ? (
              <Text style={{ color: '#16A34A' }}>{t.payment.free}</Text>
            ) : (
              `₹${finalAmount}`
            )}
          </Text>
        </View>

        {/* Paid At */}
        {latestPayment?.paidAt && (
          <>
            <View style={styles.paymentRowSep} />
            <View style={styles.paymentRow}>
              <Text style={styles.paymentRowLabel}>{t.payment.paidAt}</Text>
              <Text style={styles.paymentRowValue}>
                {new Date(latestPayment.paidAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
                {' · '}
                {format12HrTime(latestPayment.paidAt)}
              </Text>
            </View>
          </>
        )}
      </View>
    );
  };

  // ────────────────────────────────────────────────────────────────────────────

  console.log("appointment:boom", appointment);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Doctor Details Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName} numberOfLines={1}>
              {appointment.doctorName || UI.common.unknown[lang]}
            </Text>
            <Text style={styles.doctorSpecialty} numberOfLines={1}>
              {appointment.appointmentDepartment || UI.common.unknown[lang]}
            </Text>
          </View>
          <Image
            source={{ uri: (appointment as any).doctor?.image || 'https://via.placeholder.com/60' }}
            style={styles.doctorImage}
            defaultSource={{ uri: 'https://via.placeholder.com/60' }}
          />
        </View>

        <View style={styles.patientRow}>
          <Text style={styles.patientLabel}>{UI.labels.patient[lang]}</Text>
          <Text style={styles.patientName} numberOfLines={1}>{appointment.patientName || UI.common.unknown[lang]}</Text>
        </View>

        <View style={styles.bookingRow}>
          <Text style={styles.bookingLabel}>{UI.labels.bookingId[lang]}</Text>
          <Text style={styles.bookingId} numberOfLines={1}>{appointment.appointmentId || 'N/A'}</Text>
        </View>

        <View style={styles.statusRow}>
          <View style={styles.modeContainer}>
            <View style={styles.modeIcon}>
              <Text style={styles.modeIconText}>👤</Text>
            </View>
            <Text style={styles.modeText} numberOfLines={1}>{appointment.appointmentType || 'In-Person'}</Text>
          </View>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    appointment.status === 'Upcoming' || appointment.status === 'Confirmed'
                      ? '#10B981'
                      : appointment.status === 'Completed'
                      ? '#3B82F6'
                      : '#EF4444',
                },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    appointment.status === 'Upcoming' || appointment.status === 'Confirmed'
                      ? '#10B981'
                      : appointment.status === 'Completed'
                      ? '#3B82F6'
                      : '#EF4444',
                },
              ]}
              numberOfLines={1}
            >
              {translateStatus(appointment?.status)}
            </Text>
          </View>
        </View>
      </View>

      {/* Appointment Information Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{UI.labels.appointmentInfo[lang]}</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Text style={styles.iconText}>📅</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{UI.labels.dateTime[lang]}</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {formatDate(appointment.date || appointment.appointmentDate)},{' '}
              {appointment.time?.replace(/am|pm/, match => match.toUpperCase()) || 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Text style={styles.iconText}>📍</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{UI.labels.clinicAddress[lang]}</Text>
            <Text style={styles.clinicName} numberOfLines={1}>{selectedClinic?.clinicName || UI.common.unknown[lang]}</Text>
            <Text style={styles.addressText} numberOfLines={2}>
              {selectedClinic?.address || '3rd Floor, Ayyappa Society Road, Madhapur, Hyderabad'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── PAYMENT DETAILS CARD ── */}
      {renderPaymentCard()}

      {/* ── CLINICAL DELIVERABLES: PRESCRIPTIONS & REPORTS ── */}
      {appointment.status === 'Completed' && (
        <View style={styles.medicalReportsCard}>
          <Text style={styles.medicalReportsTitle}>📄 Prescription & Medical Reports</Text>
          <Text style={styles.medicalReportsSubtitle}>Uploaded by the care provider for this visit</Text>
          
          {/* Report 1: Prescription & Care Plan */}
          <View style={styles.reportRow}>
            <View style={styles.reportIconBg}>
              <Text style={{ fontSize: 22 }}>💊</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.reportName}>Prescription & Treatment Plan</Text>
              <Text style={styles.reportMeta}>PDF · 1.2 MB · Signed by {appointment?.doctorName || 'Doctor'}</Text>
            </View>
            {downloadProgress1 !== null ? (
              <View style={styles.downloadProgressContainer}>
                <ActivityIndicator size="small" color="#0A3D62" />
                <Text style={styles.progressText}>{downloadProgress1}%</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.reportDownloadBtn} onPress={() => startFakeDownload(1)}>
                <Text style={styles.downloadBtnIcon}>⬇️</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.reportDivider} />

          {/* Report 2: Visit Summary & Vital Readings */}
          <View style={styles.reportRow}>
            <View style={styles.reportIconBg}>
              <Text style={{ fontSize: 22 }}>🩺</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.reportName}>Visit Summary & Vital Records</Text>
              <Text style={styles.reportMeta}>PDF · 450 KB · Temp: 98.6°F · BP: 120/80</Text>
            </View>
            {downloadProgress2 !== null ? (
              <View style={styles.downloadProgressContainer}>
                <ActivityIndicator size="small" color="#0A3D62" />
                <Text style={styles.progressText}>{downloadProgress2}%</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.reportDownloadBtn} onPress={() => startFakeDownload(2)}>
                <Text style={styles.downloadBtnIcon}>⬇️</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* ── POST-SERVICE FOLLOW-UP / VIDEO CONSULTATION CARD ── */}
      {appointment.status === 'Completed' && (
        <View style={styles.followUpCard}>
          <View style={styles.followUpHeader}>
            <Text style={styles.followUpBadge}>FREE FOLLOW-UP</Text>
            <Text style={styles.followUpTitle}>Need Post-Service Assistance?</Text>
          </View>
          <Text style={styles.followUpText}>
            Speak directly with {appointment?.doctorName || 'the provider'} via video call to clarify any questions regarding your recovery program, prescribed medication, or report summary.
          </Text>
          <TouchableOpacity style={styles.videoCallBtn} onPress={handleStartVideoCall}>
            <Text style={styles.videoCallBtnIcon}>📹</Text>
            <Text style={styles.videoCallBtnText}>Start Follow-up Video Call</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── HIGH FIDELITY SIMULATED VIDEO CALL OVERLAY ── */}
      <Modal
        visible={isVideoModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={handleEndVideoCall}
      >
        <SafeAreaView style={styles.videoCallOverlay}>
          <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
          
          {videoCallStatus === 'connecting' ? (
            <View style={styles.connectingContainer}>
              <View style={styles.doctorPulseAvatarContainer}>
                <View style={styles.pulseCircle} />
                <View style={styles.avatarLarge}>
                  <Text style={styles.avatarLargeText}>
                    {(appointment?.doctorName?.[0] || 'D').toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.connectingTitle}>Connecting with {appointment?.doctorName || 'Doctor'}...</Text>
              <Text style={styles.connectingSubtitle}>Securing p2p encrypted tele-health link</Text>
              <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 24 }} />
              
              <TouchableOpacity style={styles.endCallBtnConnecting} onPress={handleEndVideoCall}>
                <Text style={styles.endCallIcon}>📞</Text>
              </TouchableOpacity>
            </View>
          ) : videoCallStatus === 'connected' ? (
            <View style={styles.activeCallContainer}>
              {/* Doctor's Video Screen (Large background) */}
              <View style={styles.doctorVideoFeed}>
                <View style={styles.doctorCallAvatar}>
                  <Text style={styles.avatarLargeText}>
                    {(appointment?.doctorName?.[0] || 'D').toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.feedLabel}>{appointment?.doctorName || 'Doctor'}</Text>
              </View>

              {/* Patient's Video Screen (Small Floating PIP in corner) */}
              <View style={styles.patientVideoPip}>
                {isCameraOff ? (
                  <View style={styles.cameraOffOverlay}>
                    <Text style={{ fontSize: 16 }}>🚫</Text>
                  </View>
                ) : (
                  <View style={styles.pipInner}>
                    <Text style={{ fontSize: 24 }}>👤</Text>
                    <Text style={styles.pipLabel}>You</Text>
                  </View>
                )}
              </View>

              {/* Call HUD Overlay (Top & Bottom controls) */}
              <View style={styles.HUDOverlay}>
                {/* Top bar */}
                <View style={styles.HUDTopBar}>
                  <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                  <Text style={styles.durationHUD}>{formatDuration(callDuration)}</Text>
                </View>

                {/* Bottom Call HUD controls */}
                <View style={styles.HUDBottomBar}>
                  <TouchableOpacity 
                    style={[styles.HUDControlBtn, isMuted && styles.HUDControlBtnActive]} 
                    onPress={() => setIsMuted(!isMuted)}
                  >
                    <Text style={styles.HUDIcon}>{isMuted ? '🎙️❌' : '🎙️'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.HUDControlBtn, styles.endCallBtnActive]} onPress={handleEndVideoCall}>
                    <Text style={[styles.HUDIcon, { transform: [{ rotate: '135deg' }] }]}>📞</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.HUDControlBtn, isCameraOff && styles.HUDControlBtnActive]} 
                    onPress={() => setIsCameraOff(!isCameraOff)}
                  >
                    <Text style={styles.HUDIcon}>{isCameraOff ? '📹❌' : '📹'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.endedCallContainer}>
              <Text style={styles.endedText}>Call Ended</Text>
              <Text style={styles.endedSubtitle}>Duration: {formatDuration(callDuration)}</Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Notes & Instructions Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{UI.labels.notesTitle[lang]}</Text>

        <View style={styles.noteContainer}>
          <Text style={styles.noteIcon}>⚠️</Text>
          <Text style={styles.noteText}>{UI.labels.arriveNote[lang]}</Text>
        </View>

        {appointment.status === 'Cancelled' && 'cancellationReason' in appointment && (
          <View style={styles.noteContainer}>
            <Text style={styles.noteIcon}>❌</Text>
            <Text style={styles.noteText} numberOfLines={2}>
              {UI.labels.cancellationReason[lang]} {appointment.cancellationReason || UI.common.unknown[lang]}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      {(appointment.status === 'Upcoming' || appointment.status === 'Confirmed') && (
        <View style={styles.actionButtons}>
          <View style={styles.topButtons}>
            <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadReceipt}>
              <Text style={styles.downloadIcon}>⬇️</Text>
              <Text style={styles.downloadText}>{UI.buttons.downloadReceipt[lang]}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.rescheduleButton} onPress={handleReschedule}>
              <Text style={styles.rescheduleIcon}>📅</Text>
              <Text style={styles.rescheduleText}>{UI.buttons.reschedule[lang]}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelText}>✕ {UI.buttons.cancel[lang]}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.homeButton} onPress={handleBackToHome}>
              <Text style={styles.homeText}>🏠 {UI.buttons.backToHome[lang]}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {(appointment.status === 'Completed' || appointment.status === 'Cancelled') && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadReceipt}>
            <Text style={styles.downloadIcon}>⬇️</Text>
            <Text style={styles.downloadText}>{UI.buttons.downloadReceipt[lang]}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.homeButton} onPress={handleBackToHome}>
            <Text style={styles.homeText}>🏠 {UI.buttons.backToHome[lang]}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDFFF7',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: isTablet ? SPACING.lg : SPACING.md,
    margin: isTablet ? SPACING.lg : SPACING.md,
    marginBottom: SPACING.sm,
    ...LAYOUT.shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: SPACING.xxs,
  },
  doctorSpecialty: {
    fontSize: moderateScale(12),
    color: '#6B7280',
  },
  doctorImage: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
  },
  patientRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  patientLabel: {
    fontSize: moderateScale(12),
    color: '#6B7280',
    width: moderateScale(80),
  },
  patientName: {
    fontSize: moderateScale(12),
    color: '#1F2937',
    fontWeight: '500',
    flexShrink: 1,
  },
  bookingRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  bookingLabel: {
    fontSize: moderateScale(12),
    color: '#6B7280',
    width: moderateScale(80),
  },
  bookingId: {
    fontSize: moderateScale(12),
    color: '#1F2937',
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  modeIconText: {
    fontSize: moderateScale(10),
  },
  modeText: {
    fontSize: moderateScale(12),
    color: '#1F2937',
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    marginRight: SPACING.xs,
  },
  statusText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  infoIcon: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: LAYOUT.borderRadius.sm,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  iconText: {
    fontSize: moderateScale(12),
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: moderateScale(12),
    color: '#6B7280',
    marginBottom: SPACING.xxs,
  },
  infoValue: {
    fontSize: moderateScale(12),
    color: '#1F2937',
    fontWeight: '500',
  },
  clinicName: {
    fontSize: moderateScale(12),
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: SPACING.xxs,
  },
  addressText: {
    fontSize: moderateScale(12),
    color: '#6B7280',
    lineHeight: moderateScale(16),
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.sm,
    marginBottom: SPACING.md,
  },
  noteIcon: {
    fontSize: moderateScale(12),
    marginRight: SPACING.sm,
  },
  noteText: {
    fontSize: moderateScale(12),
    color: '#92400E',
    flex: 1,
    fontStyle: 'italic',
  },
  actionButtons: {
    margin: isTablet ? SPACING.lg : SPACING.md,
    marginTop: SPACING.xs,
  },
  topButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  downloadButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: isTablet ? SPACING.md : SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    marginRight: SPACING.xs,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: moderateScale(40),
  },
  downloadIcon: {
    fontSize: moderateScale(12),
    marginRight: SPACING.xs,
  },
  downloadText: {
    fontSize: moderateScale(12),
    color: '#374151',
    fontWeight: '600',
  },
  rescheduleButton: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    paddingVertical: isTablet ? SPACING.md : SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    marginLeft: SPACING.xs,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: moderateScale(40),
  },
  rescheduleIcon: {
    fontSize: moderateScale(12),
    marginRight: SPACING.xs,
  },
  rescheduleText: {
    fontSize: moderateScale(12),
    color: '#3B82F6',
    fontWeight: '600',
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: isTablet ? SPACING.md : SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    marginRight: SPACING.xs,
    borderWidth: 1,
    borderColor: '#EF4444',
    minHeight: moderateScale(40),
  },
  cancelText: {
    fontSize: moderateScale(12),
    color: '#EF4444',
    fontWeight: '600',
  },
  homeButton: {
    flex: 1,
    backgroundColor: '#1F2937',
    paddingVertical: isTablet ? SPACING.md : SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    marginLeft: SPACING.xs,
    minHeight: moderateScale(40),
  },
  homeText: {
    fontSize: moderateScale(12),
    color: '#ffffff',
    fontWeight: '600',
  },

  // ── Payment card ─────────────────────────────────────────────────────────────
  paymentCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: isTablet ? SPACING.lg : SPACING.md,
    margin: isTablet ? SPACING.lg : SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...LAYOUT.shadow.sm,
  },
  paymentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  paymentDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    marginRight: SPACING.xs,
  },
  paymentTitleText: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  paymentBigAmount: {
    fontSize: moderateScale(36),
    fontWeight: '800',
    color: '#1E293B',
    marginTop: SPACING.xxs,
    letterSpacing: -0.5,
  },
  paymentSubLabel: {
    fontSize: moderateScale(12),
    color: '#64748B',
    marginTop: SPACING.xxs,
    marginBottom: SPACING.sm,
  },
  paymentDividerLine: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: SPACING.sm,
  },
  paymentChipsRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  paymentChip: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paymentChipMid: {
    marginHorizontal: SPACING.xxs,
  },
  paymentChipLabel: {
    fontSize: moderateScale(9),
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: moderateScale(3),
    textTransform: 'uppercase',
  },
  paymentChipValue: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#1E293B',
  },

  // ── Breakdown rows ────────────────────────────────────────────────────────────
  paymentBreakdownTitle: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#64748B',
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  paymentBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  paymentBreakdownLeft: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  paymentBreakdownAmount: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#1E293B',
  },
  // Small pill badge for method name (Coupon / UPI / etc.)
  paymentMethodBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: moderateScale(10),
    paddingHorizontal: SPACING.sm,
    paddingVertical: moderateScale(2),
    marginBottom: moderateScale(2),
  },
  paymentMethodBadgeText: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#16A34A',
  },
  paymentMethodBadgePrimary: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  paymentMethodBadgeTextPrimary: {
    color: '#2563EB',
  },
  paymentIdText: {
    fontSize: moderateScale(10),
    color: '#94A3B8',
    letterSpacing: 0.3,
    marginTop: moderateScale(1),
  },

  // ── Total row ────────────────────────────────────────────────────────────────
  paymentTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  paymentTotalLabel: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#1E293B',
  },
  paymentTotalValue: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: '#1E293B',
  },

  // ── Misc rows ────────────────────────────────────────────────────────────────
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  paymentRowSep: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  paymentRowLabel: {
    fontSize: moderateScale(13),
    color: '#475569',
    fontWeight: '500',
  },
  paymentRowValue: {
    fontSize: moderateScale(13),
    color: '#1E293B',
    fontWeight: '700',
  },
  paymentRowValueMono: {
    fontSize: moderateScale(12),
    color: '#1E293B',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});

export default ViewDetails;



// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   Image,
//   ScrollView,
//   TouchableOpacity,
//   Alert,
// } from 'react-native';
// import { StackNavigationProp } from '@react-navigation/stack';
// import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
// import {
//   RootStackParamList,
//   UpcomingAppointment,
//   CompletedAppointment,
//   CancelledAppointment,
// } from '../../navigation/navigationTypes';
// import Toast from 'react-native-toast-message';
// ;
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useSelector } from 'react-redux';

// // Import responsive utilities
// import {
//   SCREEN_WIDTH,
//   SCREEN_HEIGHT,
//   isIOS,
//   isAndroid,
//   isTablet,
//   isSmallDevice,
//   isLargeDevice,
//   isExtraSmallDevice,
//   SPACING,
//   FONT_SIZE,
//   ICON_SIZE,
//   LAYOUT,
//   responsiveWidth,
//   responsiveHeight,
//   responsiveText,
//   moderateScale,
//   SAFE_AREA,
//   PLATFORM,
// } from '../../utils/responsive';

// // Define the appointment type as a union of possible appointment types
// type Appointment = UpcomingAppointment | CompletedAppointment | CancelledAppointment;

// // Define route prop type
// type ViewDetailsScreenRouteProp = RouteProp<RootStackParamList, 'ViewDetails'>;

// /** ===================== i18n (EN / HI / TEL) ===================== */
// type Lang = 'en' | 'hi' | 'tel';
// const normalizeLang = (l?: string): Lang => {
//   if (l === 'en' || l === 'hi' || l === 'tel') return l;
//   if (l === 'te') return 'tel';
//   return 'en';
// };

// const UI = {
//   common: {
//     error: { en: 'Error', hi: 'त्रुटि', tel: 'లోపం' },
//     drPrefix: { en: 'Dr. ', hi: 'डॉ. ', tel: 'డా. ' },
//     unknown: { en: 'Unknown', hi: 'अज्ञात', tel: 'తెలియదు' },
//   },
//   headerTitle: {
//     en: 'Appointment Details',
//     hi: 'नियुक्ति विवरण',
//     tel: 'అపాయింట్‌మెంట్ వివరాలు',
//   },
//   errors: {
//     notLoggedInReschedule: {
//       en: 'You are not logged in. Please log in to reschedule your appointment.',
//       hi: 'आप लॉग इन नहीं हैं। कृपया अपनी नियुक्ति को पुनर्निर्धारित करने के लिए लॉग इन करें।',
//       tel: 'మీరు లాగిన్ కాలేదు. అపాయింట్‌మెంట్‌ను రీషెడ్యూల్ చేయడానికి లాగిన్ అవండి.',
//     },
//     fetchDoctor: {
//       en: 'Failed to fetch doctor details',
//       hi: 'डॉक्टर विवरण प्राप्त करने में विफल',
//       tel: 'డాక్టర్ వివరాలు పొందడంలో విఫలమైంది',
//     },
//     fetchClinic: {
//       en: 'Failed to fetch clinic details',
//       hi: 'क्लिनिक विवरण प्राप्त करने में विफल',
//       tel: 'క్లినిక్ వివరాలు తీసుకురావడంలో విఫలమైంది',
//     },
//   },
//   labels: {
//     patient: { en: 'Patient:', hi: 'रोगी:', tel: 'రోగి:' },
//     bookingId: { en: 'Booking ID:', hi: 'बुकिंग आईडी:', tel: 'బుకింగ్ ఐడి:' },
//     appointmentInfo: {
//       en: 'Appointment Information',
//       hi: 'नियुक्ति जानकारी',
//       tel: 'అపాయింట్‌మెంట్ సమాచారం',
//     },
//     dateTime: { en: 'Date & Time', hi: 'तारीख और समय', tel: 'తేదీ & సమయం' },
//     feePaid: { en: 'Fee Paid', hi: 'भुगतान की गई शुल्क', tel: 'చెల్లించిన ఫీజు' },
//     clinicAddress: { en: 'Clinic Address', hi: 'क्लिनिक पता', tel: 'క్లినిక్ చిరునామా' },
//     getDirections: { en: 'Get Directions', hi: 'दिशा-निर्देश प्राप्त करें', tel: 'దారులు పొందండి' },
//     notesTitle: {
//       en: 'Notes & Instructions',
//       hi: 'टिप्पणियाँ एवं निर्देश',
//       tel: 'గమనికలు & సూచనలు',
//     },
//     arriveNote: {
//       en: 'Please arrive 10 minutes early. Bring previous reports if available.',
//       hi: 'कृपया 10 मिनट पहले पहुंचें। उपलब्ध होने पर पिछले रिपोर्ट साथ लाएं।',
//       tel: 'దయచేసి 10 నిమిషాల ముందే రండి. పాత నివేదికలు ఉంటే తీసుకురండి.',
//     },
//     cancellationReason: {
//       en: 'Cancellation Reason:',
//       hi: 'रद्द करने का कारण:',
//       tel: 'రద్దు చేసిన కారణం:',
//     },
//     emailSentTo: {
//       en: 'Booking confirmation sent to:',
//       hi: 'बुकिंग की पुष्टि यहाँ भेजी गई है:',
//       tel: 'బుకింగ్ నిర్ధారణ ఇక్కడికి పంపబడింది:',
//     },
//   },
//   payment: {
//     title:           { en: 'PAYMENT DETAILS',       hi: 'भुगतान विवरण',                         tel: 'చెల్లింపు వివరాలు'              },
//     successfullyPaid:{ en: 'Successfully paid',      hi: 'सफलतापूर्वक भुगतान किया गया',          tel: 'విజయవంతంగా చెల్లించబడింది'      },
//     paymentPending:  { en: 'Payment pending',        hi: 'भुगतान प्रतीक्षित है',                  tel: 'చెల్లింపు పెండింగ్‌లో ఉంది'     },
//     actual:          { en: 'ACTUAL',                 hi: 'वास्तविक',                             tel: 'వాస్తవ మొత్తం'                  },
//     discount:        { en: 'DISCOUNT',               hi: 'छूट',                                  tel: 'తగ్గింపు'                       },
//     status:          { en: 'STATUS',                 hi: 'स्थिति',                               tel: 'స్థితి'                         },
//     paid:            { en: 'Paid',                   hi: 'भुगतान किया',                          tel: 'చెల్లించారు'                    },
//     pending:         { en: 'Pending',                hi: 'प्रतीक्षित',                            tel: 'పెండింగ్'                       },
//     paymentMethod:   { en: 'Payment Method',         hi: 'भुगतान विधि',                          tel: 'చెల్లింపు పద్ధతి'               },
//     paymentId:       { en: 'Payment ID',             hi: 'भुगतान आईडी',                          tel: 'చెల్లింపు ఐడి'                  },
//     paidAt:          { en: 'Paid At',                hi: 'भुगतान का समय',                        tel: 'చెల్లించిన సమయం'                },
//     na:              { en: 'N/A',                    hi: 'उपलब्ध नहीं',                          tel: 'వర్తించదు'                      },
//     upi:             { en: 'Upi',                    hi: 'यूपीआई',                               tel: 'యూపీఐ'                          },
//     cash:            { en: 'Cash',                   hi: 'नकद',                                  tel: 'నగదు'                           },
//     card:            { en: 'Card',                   hi: 'कार्ड',                                tel: 'కార్డు'                         },
//     online:          { en: 'Online',                 hi: 'ऑनलाइन',                              tel: 'ఆన్‌లైన్'                       },
//   },
//   buttons: {
//     downloadReceipt: {
//       en: 'Download Receipt',
//       hi: 'रसीद डाउनलोड करें',
//       tel: 'రశీదు డౌన్‌లోడ్ చేయండి',
//     },
//     reschedule: { en: 'Reschedule', hi: 'पुनर्निर्धारित करें', tel: 'రీషెడ్యూల్' },
//     cancel: { en: 'Cancel', hi: 'रद्द करें', tel: 'రద్దు చేయండి' },
//     backToHome: { en: 'Back to Home', hi: 'होम पर लौटें', tel: 'హోమ్‌కు తిరిగి వెళ్ళండి' },
//   },
//   status: {
//     upcoming: { en: 'Upcoming', hi: 'आगामी', tel: 'రాబోయేవి' },
//     confirmed: { en: 'Confirmed', hi: 'पुष्ट', tel: 'నిర్ధారించబడింది' },
//     completed: { en: 'Completed', hi: 'पूर्ण', tel: 'పూర్తయింది' },
//     cancelled: { en: 'Cancelled', hi: 'रद्द', tel: 'రద్దు' },
//   },
// };


// const translations = {
//   en: {
//     common: { error: 'Error' },
//     drPrefix: 'Dr. ',
//     headerTitle: 'Appointment Details',
//     successTitle: 'Consultation Completed',
//     successSubtitle: (doctorName: string) =>
//       `Your consultation with ${doctorName} has been successfully completed.`,
//     successNote: 'We hope your visit went well.',
//     summaryTitle: 'Consultation Summary',
//     patientName: 'Patient Name',
//     doctor: 'Doctor',
//     mode: 'Mode',
//     clinic: 'Clinic',
//     dateTime: 'Date & Time',
//     bookingId: 'Booking ID',
//     ratingTitle: 'Rate Your Experience',
//     feedbackPlaceholder: 'Share your feedback (optional)',
//     submitFeedback: 'Submit Feedback',
//     bookAppointment: 'Book Appointment',
//     home: 'Home',
//     errorNotLoggedIn:
//       'You are not logged in. Please log in to reschedule your appointment.',
//     errorFetchDoctor: 'Failed to fetch doctor details',
//     errorFetchClinic: 'Failed to fetch clinic details',
//     payment: {
//       title: 'PAYMENT DETAILS',
//       successfullyPaid: 'Successfully paid',
//       paymentPending: 'Payment pending',
//       actual: 'ACTUAL',
//       discount: 'DISCOUNT',
//       status: 'STATUS',
//       paid: 'Paid',
//       pending: 'Pending',
//       paymentMethod: 'Payment Method',
//       paymentId: 'Payment ID',
//       paidAt: 'Paid At',
//       na: 'N/A',
//       upi: 'Upi',
//       cash: 'Cash',
//       card: 'Card',
//       online: 'Online',
//     },
//   },
//   tel: {
//     common: { error: 'లోపం' },
//     drPrefix: 'డా. ',
//     headerTitle: 'అపాయింట్‌మెంట్ వివరాలు',
//     successTitle: 'సంప్రదింపు పూర్తయింది',
//     successSubtitle: (doctorName: string) =>
//       `డాక్టర్ ${doctorName} తో మీ సంప్రదింపు విజయవంతంగా పూర్తయింది.`,
//     successNote: 'మీ సందర్శన బాగా జరిగిందని ఆశిస్తున్నాము.',
//     summaryTitle: 'సంప్రదింపు సారాంశం',
//     patientName: 'రోగి పేరు',
//     doctor: 'డాక్టర్',
//     mode: 'రీతి',
//     clinic: 'క్లినిక్',
//     dateTime: 'తేదీ & సమయం',
//     bookingId: 'బుకింగ్ ID',
//     ratingTitle: 'మీ అనుభవాన్ని రేట్ చేయండి',
//     feedbackPlaceholder: 'మీ అభిప్రాయాన్ని పంచుకోండి (ఐచ్ఛికం)',
//     submitFeedback: 'అభిప్రాయం సమర్పించండి',
//     bookAppointment: 'అపాయింట్‌మెంట్ బుక్ చేయండి',
//     home: 'హోమ్',
//     errorNotLoggedIn:
//       'మీరు లాగిన్ కాలేదు. అపాయింట్‌మెంట్‌ను రీషెడ్యూల్ చేయడానికి దయచేసి లాగిన్ చేయండి.',
//     errorFetchDoctor: 'డాక్టర్ వివరాలను పొందడంలో విఫలమైంది',
//     errorFetchClinic: 'క్లినిక్ వివరాలను పొందడంలో విఫలమైంది',
//     payment: {
//       title: 'చెల్లింపు వివరాలు',
//       successfullyPaid: 'విజయవంతంగా చెల్లించబడింది',
//       paymentPending: 'చెల్లింపు పెండింగ్‌లో ఉంది',
//       actual: 'వాస్తవ మొత్తం',
//       discount: 'తగ్గింపు',
//       status: 'స్థితి',
//       paid: 'చెల్లించారు',
//       pending: 'పెండింగ్',
//       paymentMethod: 'చెల్లింపు పద్ధతి',
//       paymentId: 'చెల్లింపు ఐడి',
//       paidAt: 'చెల్లించిన సమయం',
//       na: 'వర్తించదు',
//       upi: 'యూపీఐ',
//       cash: 'నగదు',
//       card: 'కార్డు',
//       online: 'ఆన్‌లైన్',
//     },
//   },
//   hi: {
//     common: { error: 'त्रुटि' },
//     drPrefix: 'डॉ. ',
//     headerTitle: 'नियुक्ति विवरण',
//     successTitle: 'परामर्श पूर्ण हुआ',
//     successSubtitle: (doctorName: string) =>
//       `डॉ. ${doctorName} के साथ आपका परामर्श सफलतापूर्वक पूरा हो गया है।`,
//     successNote: 'हमें आशा है कि आपकी यात्रा अच्छी रही।',
//     summaryTitle: 'परामर्श सारांश',
//     patientName: 'रोगी का नाम',
//     doctor: 'डॉक्टर',
//     mode: 'मोड',
//     clinic: 'क्लिनिक',
//     dateTime: 'तारीख और समय',
//     bookingId: 'बुकिंग आईडी',
//     ratingTitle: 'अपने अनुभव को रेट करें',
//     feedbackPlaceholder: 'अपनी प्रतिक्रिया साझा करें (वैकल्पिक)',
//     submitFeedback: 'प्रतिक्रिया सबमिट करें',
//     bookAppointment: 'नियुक्ति बुक करें',
//     home: 'होम',
//     errorNotLoggedIn:
//       'आप लॉग इन नहीं हैं। अपनी नियुक्ति को पुनर्निर्धारित करने के लिए कृपया लॉग इन करें।',
//     errorFetchDoctor: 'डॉक्टर विवरण प्राप्त करने में विफल',
//     errorFetchClinic: 'क्लिनिक विवरण प्राप्त करने में विफल',
//     payment: {
//       title: 'भुगतान विवरण',
//       successfullyPaid: 'सफलतापूर्वक भुगतान किया गया',
//       paymentPending: 'भुगतान प्रतीक्षित है',
//       actual: 'वास्तविक',
//       discount: 'छूट',
//       status: 'स्थिति',
//       paid: 'भुगतान किया',
//       pending: 'प्रतीक्षित',
//       paymentMethod: 'भुगतान विधि',
//       paymentId: 'भुगतान आईडी',
//       paidAt: 'भुगतान का समय',
//       na: 'उपलब्ध नहीं',
//       upi: 'यूपीआई',
//       cash: 'नकद',
//       card: 'कार्ड',
//       online: 'ऑनलाइन',
//     },
//   },
// };
// /** ================================================================ */

// type Fee = { type: string; fee: number };

// const ViewDetails: React.FC = () => {
//   const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
//   const route = useRoute<ViewDetailsScreenRouteProp>();
//   const { appointment ,language: languageParam  } = route.params;
//   console.log("appointmentboom:", appointment);
//   const [doctorDetails, setDoctorDetails] = useState<any>({});
//   const [selectedClinic, setSelectedClinic] = useState<any>({});
//   const [consultationFees, setConsultationFees] = useState<any>();
//   const [paymentDetails, setPaymentDetails] = useState<any>(null);
//   const currentUser = useSelector((state: any) => state.currentUser);
//   const lang: Lang = normalizeLang(languageParam || currentUser?.appLanguage);

//   const t = translations[lang];
// // appointment.amount

//   const translateStatus = (s?: string) => {
//     const t = (s || '').toLowerCase();
//     if (t.includes('upcoming') || t.includes('schedule')) return UI.status.upcoming[lang];
//     if (t.includes('confirm')) return UI.status.confirmed[lang];
//     if (t.includes('complete')) return UI.status.completed[lang];
//     if (t.includes('cancel')) return UI.status.cancelled[lang];
//     return s || UI.common.unknown[lang];
//   };

//   const translatePaymentMethod = (method?: string) => {
//     if (!method) return UI.payment.na[lang];
//     const m = method.toLowerCase();
//     if (m === 'upi') return UI.payment.upi[lang];
//     if (m === 'cash') return UI.payment.cash[lang];
//     if (m === 'card') return UI.payment.card[lang];
//     if (m === 'online') return UI.payment.online[lang];
//     return method.charAt(0).toUpperCase() + method.slice(1);
//   };

//   const translatePaymentStatus = (status?: string) => {
//     if (!status) return UI.payment.na[lang];
//     const s = status.toLowerCase();
//     if (s === 'paid') return UI.payment.paid[lang];
//     if (s === 'pending') return UI.payment.pending[lang];
//     return status.charAt(0).toUpperCase() + status.slice(1);
//   };

//   useEffect(() => {
//     const fetchDoctorDetails = async () => {
//       const token = await AsyncStorage.getItem('authToken');
//       if (!token) {
//         Alert.alert(UI.common.error[lang], UI.errors.notLoggedInReschedule[lang]);
//         return;
//       }
//       const response = await AuthFetch(ENDPOINTS.GET_USER(appointment?.doctorId), token);
//       console.log("doctor response:", response);
//       if (response.status === 'success') {
//         const doctor = response.data.data;
//         setDoctorDetails(doctor);

//   const targetFeeType = appointment?.appointmentType === 'new-walkin' 
//     ? 'In-Person' 
//     : appointment?.appointmentType;

//         const fees = doctor?.consultationModeFee?.filter(
//           (fee: Fee) => fee.type === targetFeeType,
//         );

//   console.log("fees:", fees);

//         setConsultationFees(fees?.[0]?.fee);
//       } else {
//         Alert.alert(
//           UI.common.error[lang],
//           response?.message?.message || response?.data?.message || UI.errors.fetchDoctor[lang],
//         );
//       }
//     };

//     const getClinicDetails = async () => {
//       const token = await AsyncStorage.getItem('authToken');
//       if (!token) {
//         Alert.alert(UI.common.error[lang], UI.errors.notLoggedInReschedule[lang]);
//         return;
//       }
//       const response = await AuthFetch(ENDPOINTS.GET_CLINIC_ADDRESS(appointment?.doctorId), token);
//       if (response.status === 'success') {
//         const clinic = response?.data?.data;
//         const chosen = clinic.find((item: any) => item.addressId === appointment?.clinicId);
//         setSelectedClinic(chosen);
//       } else {
//         Alert.alert(
//           UI.common.error[lang],
//           response?.message?.message || response?.data?.message || UI.errors.fetchClinic[lang],
//         );
//       }
//     };

//     const fetchPaymentDetails = async () => {
//       const token = await AsyncStorage.getItem('authToken');
//       if (!token) return;
//       if (!appointment?.appointmentId) return;
//       try {
//         const response = await AuthFetch(
//           ENDPOINTS.GET_APPOINTMENT_PAYMENT(appointment.appointmentId),
//           token,
//         );
//         console.log("payment response:", response);
//         if (response.status === 'success') {
//           setPaymentDetails(response?.data?.data || null);
//         }
//       } catch (error) {
//         console.error("Failed to fetch payment details:", error);
//       }
//     };

//     getClinicDetails();
//     fetchDoctorDetails();
//     // fetchPaymentDetails();
//   }, [appointment?.doctorId, appointment?.appointmentType, appointment?.clinicId, appointment?.appointmentId, lang]);

//     useEffect(() => {
//       if (appointment?.paymentDetails) {
//         setPaymentDetails(appointment?.paymentDetails || null);
//       }
//     }, [appointment?.paymentDetails]);
    
// const formatDate = (dateStr: string) => {
//   if (!dateStr) return 'Date not available';
  
//   try {
//     let dateObj: Date;
    
//     if (dateStr.includes('T')) {
//       dateObj = new Date(dateStr);
//     } else if (dateStr.includes('/')) {
//       const [day, month, year] = dateStr.split('/').map(Number);
//       dateObj = new Date(year, month - 1, day);
//     } else {
//       return 'Invalid date';
//     }
//     if (isNaN(dateObj.getTime())) {
//       return 'Invalid date';
//     }
    
//     const options = { day: 'numeric', month: 'short', year: 'numeric' } as const;
//     const locale = lang === 'en' ? 'en-GB' : lang === 'tel' ? 'te-IN' : 'hi-IN';
//     return dateObj.toLocaleDateString(locale, options);
//   } catch (error) {
//     console.error('Error formatting date:', error);
//     return 'Date error';
//   }
// };

//   const handleBackPress = () => navigation.goBack();

//   const handleGetDirections = () => {
//     console.log('Get directions pressed');
//   };

//   const handleDownloadReceipt = () => {
//     console.log('Download receipt pressed');
//   };

//   const handleReschedule = () => {
//     if (appointment.status === 'Upcoming' || appointment.status === 'Confirmed') {
//       navigation.navigate('Reschedule', { appointment: appointment as UpcomingAppointment });
//     }
//   };

//   const handleCancel = () => {
//     if (appointment.status === 'Upcoming' || appointment.status === 'Confirmed') {
//       navigation.navigate('Cancel', { appointment: appointment as UpcomingAppointment });
//     }
//   };

//   const handleBackToHome = () => navigation.navigate('Home');

//   const isPaid = paymentDetails?.paymentStatus === 'paid';

//   console.log("appointment:boom", appointment);
//                   // console.log("paymentDetailslol",paymentDetails)

//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//       {/* Doctor Details Card */}
//       <View style={styles.card}>
//         <View style={styles.cardHeader}>
//           <View style={styles.doctorInfo}>
//             <Text style={styles.doctorName} numberOfLines={1}>
//   {appointment.doctorName || UI.common.unknown[lang]}
// </Text>
//             <Text style={styles.doctorSpecialty} numberOfLines={1}>
//               {appointment.appointmentDepartment || UI.common.unknown[lang]}
//             </Text>
//           </View>
//           <Image
//             source={{ uri: (appointment as any).doctor?.image || 'https://via.placeholder.com/60' }}
//             style={styles.doctorImage}
//             defaultSource={{ uri: 'https://via.placeholder.com/60' }}
//           />
//         </View>

//         <View style={styles.patientRow}>
//           <Text style={styles.patientLabel}>{UI.labels.patient[lang]}</Text>
//           <Text style={styles.patientName} numberOfLines={1}>{appointment.patientName || UI.common.unknown[lang]}</Text>
//         </View>

//         <View style={styles.bookingRow}>
//           <Text style={styles.bookingLabel}>{UI.labels.bookingId[lang]}</Text>
//           <Text style={styles.bookingId} numberOfLines={1}>{appointment.appointmentId || 'N/A'}</Text>
//         </View>

//         <View style={styles.statusRow}>
//           <View style={styles.modeContainer}>
//             <View style={styles.modeIcon}>
//               <Text style={styles.modeIconText}>👤</Text>
//             </View>
//             <Text style={styles.modeText} numberOfLines={1}>{appointment.appointmentType || 'In-Person'}</Text>
//           </View>
//           <View style={styles.statusContainer}>
//             <View
//               style={[
//                 styles.statusDot,
//                 {
//                   backgroundColor:
//                     appointment.status === 'Upcoming' || appointment.status === 'Confirmed'
//                       ? '#10B981'
//                       : appointment.status === 'Completed'
//                       ? '#3B82F6'
//                       : '#EF4444',
//                 },
//               ]}
//             />
//             <Text
//               style={[
//                 styles.statusText,
//                 {
//                   color:
//                     appointment.status === 'Upcoming' || appointment.status === 'Confirmed'
//                       ? '#10B981'
//                       : appointment.status === 'Completed'
//                       ? '#3B82F6'
//                       : '#EF4444',
//                 },
//               ]}
//               numberOfLines={1}
//             >
//               {translateStatus(appointment?.status)}
//             </Text>
//           </View>
//         </View>
//       </View>

//       {/* Appointment Information Card */}
//       <View style={styles.card}>
//         <Text style={styles.sectionTitle}>{UI.labels.appointmentInfo[lang]}</Text>

//         <View style={styles.infoRow}>
//           <View style={styles.infoIcon}>
//             <Text style={styles.iconText}>📅</Text>
//           </View>
//           <View style={styles.infoContent}>
//             <Text style={styles.infoLabel}>{UI.labels.dateTime[lang]}</Text>
// <Text style={styles.infoValue} numberOfLines={1}>
//   {formatDate(appointment.date || appointment.appointmentDate)},{' '}
//   {appointment.time?.replace(/am|pm/, match => match.toUpperCase()) || 'N/A'}
// </Text>
//           </View>
//         </View>

//         {/* <View style={styles.infoRow}>
//           <View style={styles.infoIcon}>
//             <Text style={styles.iconText}>₹</Text>
//           </View>
//           <View style={styles.infoContent}>
//             <Text style={styles.infoLabel}>{UI.labels.feePaid[lang]}</Text>
//            <Text style={styles.infoValue}>
//           ₹{
//             appointment.amount ? appointment.amount : 0
//           }
// </Text>
//           </View>
//         </View> */}

//         <View style={styles.infoRow}>
//           <View style={styles.infoIcon}>
//             <Text style={styles.iconText}>📍</Text>
//           </View>
//           <View  style={styles.infoContent}>
//             <Text style={styles.infoLabel}>{UI.labels.clinicAddress[lang]}</Text>
//             <Text style={styles.clinicName} numberOfLines={1}>{selectedClinic?.clinicName || UI.common.unknown[lang]}</Text>
//             <Text style={styles.addressText} numberOfLines={2}>
//               {selectedClinic?.address || '3rd Floor, Ayyappa Society Road, Madhapur, Hyderabad'}
//             </Text>
//           </View>
//         </View>
//       </View>

//       {/* ── PAYMENT DETAILS CARD — screenshot-inspired ── */}
//       {/* {paymentDetails && (
//         <View style={styles.paymentCard}>

   
//           <View style={styles.paymentTitleRow}>
//             <View style={[styles.paymentDot, { backgroundColor: isPaid ? '#16A34A' : '#DC2626' }]} />
//             <Text style={[styles.paymentTitleText, { color: isPaid ? '#16A34A' : '#DC2626' }]}>
//               {UI.payment.title[lang]}
//             </Text>
//           </View>


//           <Text style={styles.paymentBigAmount}>₹{paymentDetails.finalAmount ?? 0}</Text>

 
//           <Text style={styles.paymentSubLabel}>
//             {isPaid ? UI.payment.successfullyPaid[lang] : UI.payment.paymentPending[lang]}
//           </Text>

//           <View style={styles.paymentDividerLine} />

      
//           <View style={styles.paymentChipsRow}>
//             <View style={styles.paymentChip}>
//               <Text style={styles.paymentChipLabel}>{UI.payment.actual[lang]}</Text>
//               <Text style={styles.paymentChipValue}>₹{paymentDetails.actualAmount ?? 0}</Text>
//             </View>
//             <View style={[styles.paymentChip, styles.paymentChipMid]}>
//               <Text style={styles.paymentChipLabel}>{UI.payment.discount[lang]}</Text>
//               <Text style={[styles.paymentChipValue, { color: paymentDetails.discount > 0 ? '#16A34A' : '#94A3B8' }]}>
//                 {paymentDetails.discount > 0
//                   ? (paymentDetails.discountType === 'percentage'
//                     ? `-${paymentDetails.discount}%`
//                     : `-₹${paymentDetails.discount}`)
//                   : '—'}
//               </Text>
//             </View>
//             <View style={styles.paymentChip}>
//               <Text style={styles.paymentChipLabel}>{UI.payment.status[lang]}</Text>
//               <Text style={[styles.paymentChipValue, { color: isPaid ? '#16A34A' : '#DC2626' }]}>
//                 {translatePaymentStatus(paymentDetails.paymentStatus)}
//               </Text>
//             </View>
//           </View>

//           <View style={styles.paymentDividerLine} />

    
//           <View style={styles.paymentRow}>
//             <Text style={styles.paymentRowLabel}>{UI.payment.paymentMethod[lang]}</Text>
//             <Text style={styles.paymentRowValue}>
//               {translatePaymentMethod(paymentDetails.paymentMethod)}
//             </Text>
//           </View>

//           <View style={styles.paymentRowSep} />

//           <View style={styles.paymentRow}>
//             <Text style={styles.paymentRowLabel}>{UI.payment.paymentId[lang]}</Text>
//             <Text style={styles.paymentRowValueMono}>{paymentDetails.paymentId || UI.payment.na[lang]}</Text>
//           </View>

//           {paymentDetails.paidAt && (
//             <>
//               <View style={styles.paymentRowSep} />
//               <View style={styles.paymentRow}>
//                 <Text style={styles.paymentRowLabel}>{UI.payment.paidAt[lang]}</Text>
//                 <Text style={styles.paymentRowValue}>
//                   {new Date(paymentDetails.paidAt).toLocaleDateString('en-GB', {
//                     day: 'numeric', month: 'short', year: 'numeric',
//                   })} · {new Date(paymentDetails.paidAt).toLocaleTimeString('en-GB', {
//                     hour: '2-digit', minute: '2-digit',
//                   })}
//                 </Text>
//               </View>
//             </>
//           )}

//         </View>
//       )} */}

//               {/* ── PAYMENT DETAILS CARD ── */}
//               {paymentDetails &&
//                 paymentDetails.length > 0 &&
//                 (() => {
//                   console.log("paymentDetailslol",paymentDetails)
//                   const paymentList = [...paymentDetails].sort(
//                     (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
//                   );
      
//             // totals
//             const totalActual = paymentList.reduce(
//               (sum, p) => sum + (p.actualAmount || 0),
//               0,
//             );
//             const totalDiscount = paymentList.reduce(
//               (sum, p) => sum + (p.discount || 0),
//               0,
//             );
//             const totalFinal = paymentList.reduce(
//               (sum, p) => sum + (p.finalAmount || 0),
//               0,
//             );
      
//                   // status
//                   const isPaid = paymentList.some(p => p.paymentStatus === 'paid');
      
//                   const latestPayment = paymentList[0];
      
//                   return (
//                     <View style={styles.paymentCard}>
//                       {/* Title */}
//                       <View style={styles.paymentTitleRow}>
//                         <View
//                           style={[
//                             styles.paymentDot,
//                             { backgroundColor: isPaid ? '#16A34A' : '#DC2626' },
//                           ]}
//                         />
//                         <Text
//                           style={[
//                             styles.paymentTitleText,
//                             { color: isPaid ? '#16A34A' : '#DC2626' },
//                           ]}
//                         >
//                           {t.payment.title}
//                         </Text>
//                       </View>
      
//                       {/* Total */}
//                       {/* <Text style={styles.paymentBigAmount}>₹{appointment.amount ? appointment.amount : 0}</Text> */}
      
//                       {/* <Text style={styles.paymentSubLabel}>
//                         {isPaid
//                           ? t.payment.successfullyPaid
//                           : t.payment.paymentPending}
//                       </Text> */}
      
//                       <View style={styles.paymentDividerLine} />
      
//                       {/* Stats */}
//                       <View style={styles.paymentChipsRow}>
//                         <View style={styles.paymentChip}>
//                           <Text style={styles.paymentChipLabel}>
//                             {t.payment.actual}
//                           </Text>
//                           <Text style={styles.paymentChipValue}>₹{totalActual}</Text>
//                         </View>
      
//                         <View style={[styles.paymentChip, styles.paymentChipMid]}>
//                           <Text style={styles.paymentChipLabel}>
//                             {t.payment.discount}
//                           </Text>
//                           <Text
//                             style={[
//                               styles.paymentChipValue,
//                               { color: totalDiscount > 0 ? '#16A34A' : '#94A3B8' },
//                             ]}
//                           >
//                             {totalDiscount > 0 ? `₹${totalDiscount}` : '—'}
//                           </Text>
//                         </View>
      
//                         <View style={styles.paymentChip}>
//                           <Text style={styles.paymentChipLabel}>
//                             {t.payment.status}
//                           </Text>
//                           <Text
//                             style={[
//                               styles.paymentChipValue,
//                               { color: isPaid ? '#16A34A' : '#DC2626' },
//                             ]}
//                           >
//                             {translatePaymentStatus(latestPayment?.paymentStatus)}
//                           </Text>
//                         </View>
//                       </View>
      
//                       <View style={styles.paymentDividerLine} />
      
                      
      
//                       <Text
//                         style={{
//                           fontSize: 13,
//                           fontWeight: '600',
//                           color: '#64748B',
//                           marginBottom: 8,
//                         }}
//                       >
//                         Payment Breakdown
//                       </Text>
      
//                       {paymentList.map((p, index) => (
//                         <View key={p.paymentId || index} style={{ marginBottom: 12 }}>
//                           {/* Method + Amount */}
//                           <View style={styles.paymentRow}>
//                             <Text style={styles.paymentRowLabel}>
//                               {translatePaymentMethod(p.paymentMethod)}
//                             </Text>
//                             <Text style={styles.paymentRowValue}>
//                               ₹{p.finalAmount}
//                             </Text>
//                           </View>
      
//                           {/* Payment ID */}
//                           <View style={styles.paymentRow}>
//                             <Text
//                               style={[
//                                 styles.paymentRowLabel,
//                                 { fontSize: 12, color: '#94A3B8' },
//                               ]}
//                             >
//                               {t.payment.paymentId}
//                             </Text>
//                             <Text
//                               style={[styles.paymentRowValueMono, { fontSize: 12 }]}
//                             >
//                               {p.paymentId}
//                             </Text>
//                           </View>
//                         </View>
//                       ))}
      
//                       {latestPayment?.paidAt && (
//                         <>
//                           <View style={styles.paymentRowSep} />
//                           <View style={styles.paymentRow}>
//                             <Text style={styles.paymentRowLabel}>
//                               {t.payment.paidAt}
//                             </Text>
//                             <Text style={styles.paymentRowValue}>
//                               {new Date(latestPayment.paidAt).toLocaleDateString(
//                                 'en-GB',
//                                 {
//                                   day: 'numeric',
//                                   month: 'short',
//                                   year: 'numeric',
//                                 },
//                               )}{' '}
//                               ·{' '}
//                               {new Date(latestPayment.paidAt).toLocaleTimeString(
//                                 'en-GB',
//                                 {
//                                   hour: '2-digit',
//                                   minute: '2-digit',
//                                 },
//                               )}
//                             </Text>
//                           </View>
//                         </>
//                       )}
//                     </View>
//                   );
//                 })()}

//       {/* Notes & Instructions Card */}
//       <View style={styles.card}>
//         <Text style={styles.sectionTitle}>{UI.labels.notesTitle[lang]}</Text>

//         <View style={styles.noteContainer}>
//           <Text style={styles.noteIcon}>⚠️</Text>
//           <Text style={styles.noteText}>{UI.labels.arriveNote[lang]}</Text>
//         </View>

//         {appointment.status === 'Cancelled' && 'cancellationReason' in appointment && (
//           <View style={styles.noteContainer}>
//             <Text style={styles.noteIcon}>❌</Text>
//             <Text style={styles.noteText} numberOfLines={2}>
//               {UI.labels.cancellationReason[lang]} {appointment.cancellationReason || UI.common.unknown[lang]}
//             </Text>
//           </View>
//         )}
//       </View>

//       {/* Action Buttons */}
//       {(appointment.status === 'Upcoming' || appointment.status === 'Confirmed') && (
//         <View style={styles.actionButtons}>
//           <View style={styles.topButtons}>
//             <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadReceipt}>
//               <Text style={styles.downloadIcon}>⬇️</Text>
//               <Text style={styles.downloadText}>{UI.buttons.downloadReceipt[lang]}</Text>
//             </TouchableOpacity>

//             <TouchableOpacity style={styles.rescheduleButton} onPress={handleReschedule}>
//               <Text style={styles.rescheduleIcon}>📅</Text>
//               <Text style={styles.rescheduleText}>{UI.buttons.reschedule[lang]}</Text>
//             </TouchableOpacity>
//           </View>

//           <View style={styles.bottomButtons}>
//             <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
//               <Text style={styles.cancelText}>✕ {UI.buttons.cancel[lang]}</Text>
//             </TouchableOpacity>

//             <TouchableOpacity style={styles.homeButton} onPress={handleBackToHome}>
//               <Text style={styles.homeText}>🏠 {UI.buttons.backToHome[lang]}</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       )}

//       {(appointment.status === 'Completed' || appointment.status === 'Cancelled') && (
//         <View style={styles.actionButtons}>
//           <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadReceipt}>
//             <Text style={styles.downloadIcon}>⬇️</Text>
//             <Text style={styles.downloadText}>{UI.buttons.downloadReceipt[lang]}</Text>
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.homeButton} onPress={handleBackToHome}>
//             <Text style={styles.homeText}>🏠 {UI.buttons.backToHome[lang]}</Text>
//           </TouchableOpacity>
//         </View>
//       )}
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#EDFFF7',
//   },
//   card: {
//     backgroundColor: '#ffffff',
//     borderRadius: LAYOUT.borderRadius.lg,
//     padding: isTablet ? SPACING.lg : SPACING.md,
//     margin: isTablet ? SPACING.lg : SPACING.md,
//     marginBottom: SPACING.sm,
//     ...LAYOUT.shadow.sm,
//   },
//   cardHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginBottom: SPACING.md,
//   },
//   doctorInfo: {
//     flex: 1,
//   },
//   doctorName: {
//     fontSize: moderateScale(16),
//     fontWeight: '700',
//     color: '#1F2937',
//     marginBottom: SPACING.xxs,
//   },
//   doctorSpecialty: {
//     fontSize: moderateScale(12),
//     color: '#6B7280',
//   },
//   doctorImage: {
//     width: moderateScale(50),
//     height: moderateScale(50),
//     borderRadius: moderateScale(25),
//   },
//   patientRow: {
//     flexDirection: 'row',
//     marginBottom: SPACING.xs,
//   },
//   patientLabel: {
//     fontSize: moderateScale(12),
//     color: '#6B7280',
//     width: moderateScale(80),
//   },
//   patientName: {
//     fontSize: moderateScale(12),
//     color: '#1F2937',
//     fontWeight: '500',
//     flexShrink: 1,
//   },
//   bookingRow: {
//     flexDirection: 'row',
//     marginBottom: SPACING.md,
//   },
//   bookingLabel: {
//     fontSize: moderateScale(12),
//     color: '#6B7280',
//     width: moderateScale(80),
//   },
//   bookingId: {
//     fontSize: moderateScale(12),
//     color: '#1F2937',
//     fontWeight: '500',
//   },
//   statusRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   modeContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   modeIcon: {
//     width: moderateScale(20),
//     height: moderateScale(20),
//     borderRadius: moderateScale(10),
//     backgroundColor: '#EEF2FF',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: SPACING.xs,
//   },
//   modeIconText: {
//     fontSize: moderateScale(10),
//   },
//   modeText: {
//     fontSize: moderateScale(12),
//     color: '#1F2937',
//     fontWeight: '500',
//   },
//   statusContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   statusDot: {
//     width: moderateScale(6),
//     height: moderateScale(6),
//     borderRadius: moderateScale(3),
//     marginRight: SPACING.xs,
//   },
//   statusText: {
//     fontSize: moderateScale(12),
//     fontWeight: '600',
//   },
//   sectionTitle: {
//     fontSize: moderateScale(14),
//     fontWeight: '600',
//     color: '#1F2937',
//     marginBottom: SPACING.md,
//   },
//   infoRow: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginBottom: SPACING.md,
//   },
//   infoIcon: {
//     width: moderateScale(28),
//     height: moderateScale(28),
//     borderRadius: LAYOUT.borderRadius.sm,
//     backgroundColor: '#F3F4F6',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: SPACING.sm,
//   },
//   iconText: {
//     fontSize: moderateScale(12),
//   },
//   infoContent: {
//     flex: 1,
//   },
//   infoLabel: {
//     fontSize: moderateScale(12),
//     color: '#6B7280',
//     marginBottom: SPACING.xxs,
//   },
//   infoValue: {
//     fontSize: moderateScale(12),
//     color: '#1F2937',
//     fontWeight: '500',
//   },
//   clinicName: {
//     fontSize: moderateScale(12),
//     color: '#1F2937',
//     fontWeight: '600',
//     marginBottom: SPACING.xxs,
//   },
//   addressText: {
//     fontSize: moderateScale(12),
//     color: '#6B7280',
//     lineHeight: moderateScale(16),
//   },
//   noteContainer: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     backgroundColor: '#FEF3C7',
//     padding: SPACING.sm,
//     borderRadius: LAYOUT.borderRadius.sm,
//     marginBottom: SPACING.md,
//   },
//   noteIcon: {
//     fontSize: moderateScale(12),
//     marginRight: SPACING.sm,
//   },
//   noteText: {
//     fontSize: moderateScale(12),
//     color: '#92400E',
//     flex: 1,
//     fontStyle: 'italic',
//   },
//   actionButtons: {
//     margin: isTablet ? SPACING.lg : SPACING.md,
//     marginTop: SPACING.xs,
//   },
//   topButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: SPACING.md,
//   },
//   downloadButton: {
//     flex: 1,
//     backgroundColor: '#F3F4F6',
//     paddingVertical: isTablet ? SPACING.md : SPACING.sm,
//     paddingHorizontal: SPACING.md,
//     borderRadius: LAYOUT.borderRadius.md,
//     alignItems: 'center',
//     marginRight: SPACING.xs,
//     flexDirection: 'row',
//     justifyContent: 'center',
//     minHeight: moderateScale(40),
//   },
//   downloadIcon: {
//     fontSize: moderateScale(12),
//     marginRight: SPACING.xs,
//   },
//   downloadText: {
//     fontSize: moderateScale(12),
//     color: '#374151',
//     fontWeight: '600',
//   },
//   rescheduleButton: {
//     flex: 1,
//     backgroundColor: '#EEF2FF',
//     paddingVertical: isTablet ? SPACING.md : SPACING.sm,
//     paddingHorizontal: SPACING.md,
//     borderRadius: LAYOUT.borderRadius.md,
//     alignItems: 'center',
//     marginLeft: SPACING.xs,
//     flexDirection: 'row',
//     justifyContent: 'center',
//     minHeight: moderateScale(40),
//   },
//   rescheduleIcon: {
//     fontSize: moderateScale(12),
//     marginRight: SPACING.xs,
//   },
//   rescheduleText: {
//     fontSize: moderateScale(12),
//     color: '#3B82F6',
//     fontWeight: '600',
//   },
//   bottomButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   cancelButton: {
//     flex: 1,
//     backgroundColor: '#ffffff',
//     paddingVertical: isTablet ? SPACING.md : SPACING.sm,
//     paddingHorizontal: SPACING.md,
//     borderRadius: LAYOUT.borderRadius.md,
//     alignItems: 'center',
//     marginRight: SPACING.xs,
//     borderWidth: 1,
//     borderColor: '#EF4444',
//     minHeight: moderateScale(40),
//   },
//   cancelText: {
//     fontSize: moderateScale(12),
//     color: '#EF4444',
//     fontWeight: '600',
//   },
//   homeButton: {
//     flex: 1,
//     backgroundColor: '#1F2937',
//     paddingVertical: isTablet ? SPACING.md : SPACING.sm,
//     paddingHorizontal: SPACING.md,
//     borderRadius: LAYOUT.borderRadius.md,
//     alignItems: 'center',
//     marginLeft: SPACING.xs,
//     minHeight: moderateScale(40),
//   },
//   homeText: {
//     fontSize: moderateScale(12),
//     color: '#ffffff',
//     fontWeight: '600',
//   },

//   // ── Payment card — screenshot-inspired ──────────────────────────────────
//   paymentCard: {
//     backgroundColor: '#F8FAFC',
//     borderRadius: LAYOUT.borderRadius.lg,
//     padding: isTablet ? SPACING.lg : SPACING.md,
//     margin: isTablet ? SPACING.lg : SPACING.md,
//     marginBottom: SPACING.sm,
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//     ...LAYOUT.shadow.sm,
//   },
//   // Colored dot + uppercase label — matches "● PERMANENTLY DELETED" style
//   paymentTitleRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: SPACING.xs,
//   },
//   paymentDot: {
//     width: moderateScale(8),
//     height: moderateScale(8),
//     borderRadius: moderateScale(4),
//     marginRight: SPACING.xs,
//   },
//   paymentTitleText: {
//     fontSize: moderateScale(11),
//     fontWeight: '700',
//     letterSpacing: 1.2,
//   },
//   // Big bold amount — matches the giant heading style in screenshot
//   paymentBigAmount: {
//     fontSize: moderateScale(36),
//     fontWeight: '800',
//     color: '#1E293B',
//     marginTop: SPACING.xxs,
//     letterSpacing: -0.5,
//   },
//   paymentSubLabel: {
//     fontSize: moderateScale(12),
//     color: '#64748B',
//     marginTop: SPACING.xxs,
//     marginBottom: SPACING.sm,
//   },
//   paymentDividerLine: {
//     height: 1,
//     backgroundColor: '#E2E8F0',
//     marginVertical: SPACING.sm,
//   },
//   // 3-col stat chips — matches the card grid in screenshot
//   paymentChipsRow: {
//     flexDirection: 'row',
//     gap: SPACING.xs,
//   },
//   paymentChip: {
//     flex: 1,
//     backgroundColor: '#ffffff',
//     borderRadius: LAYOUT.borderRadius.md,
//     padding: SPACING.sm,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//   },
//   paymentChipMid: {
//     marginHorizontal: SPACING.xxs,
//   },
//   paymentChipLabel: {
//     fontSize: moderateScale(9),
//     fontWeight: '700',
//     color: '#94A3B8',
//     letterSpacing: 0.8,
//     marginBottom: moderateScale(3),
//     textTransform: 'uppercase',
//   },
//   paymentChipValue: {
//     fontSize: moderateScale(14),
//     fontWeight: '700',
//     color: '#1E293B',
//   },
//   // Detail rows — matches the list items in screenshot
//   paymentRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: SPACING.xs,
//   },
//   paymentRowSep: {
//     height: 1,
//     backgroundColor: '#E2E8F0',
//   },
//   paymentRowLabel: {
//     fontSize: moderateScale(13),
//     color: '#475569',
//     fontWeight: '500',
//   },
//   paymentRowValue: {
//     fontSize: moderateScale(13),
//     color: '#1E293B',
//     fontWeight: '700',
//   },
//   paymentRowValueMono: {
//     fontSize: moderateScale(12),
//     color: '#1E293B',
//     fontWeight: '700',
//     letterSpacing: 0.4,
//   },
// });

// export default ViewDetails;