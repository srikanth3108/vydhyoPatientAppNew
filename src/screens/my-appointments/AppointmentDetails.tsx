import React, { useEffect, useState } from 'react';
import { AuthFetch, AuthPost, ENDPOINTS } from '../../services';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  RootStackParamList,
  UpcomingAppointment,
  CompletedAppointment,
  CancelledAppointment,
} from '../../navigation/navigationTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { LAYOUT, moderateScale, SPACING } from '../../utils/responsive';

type AppointmentDetailsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'AppointmentDetails'
>;

interface AppointmentDetailsProps {
  route: {
    params: {
      appointment:
        | UpcomingAppointment
        | CompletedAppointment
        | CancelledAppointment;
      language?: 'en' | 'tel' | 'hi'; // optional override
    };
  };
}

/** ===================== i18n (EN / HI / TEL) ===================== */
type Lang = 'en' | 'hi' | 'tel';
const normalizeLang = (l?: string): Lang => {
  if (l === 'en' || l === 'hi' || l === 'tel') return l;
  if (l === 'te') return 'tel';
  return 'en';
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

const AppointmentDetails: React.FC<AppointmentDetailsProps> = ({ route }) => {
  const { appointment, language: languageParam } = route.params;
  const currentUser = useSelector((state: any) => state.currentUser);
  const lang: Lang = normalizeLang(languageParam || currentUser?.appLanguage);
  const t = translations[lang];

  console.log('appointmentroute', appointment);

  const navigation = useNavigation<AppointmentDetailsScreenNavigationProp>();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [selectedClinic, setSelectedClinic] = useState<any>({});
  const [consultationFees, setConsultationFees] = useState<any>();
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

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

  useEffect(() => {
    const fetchDoctorDetails = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert(t.common.error, t.errorNotLoggedIn);
        return;
      }
      const response = await AuthFetch(
        ENDPOINTS.GET_USER(appointment?.doctorId),
        token,
      );
      if (response.status === 'success') {
        const doctor = response.data.data;
        const fees = (doctor?.consultationModeFee || []).filter(
          (fee: any) => fee.type === appointment.appointmentType,
        );
        setConsultationFees(fees[0]?.fee);
      } else {
        Alert.alert(
          t.common.error,
          response?.message?.message ||
            response?.data?.message ||
            t.errorFetchDoctor,
        );
      }
    };

    const getClinicDetails = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert(t.common.error, t.errorNotLoggedIn);
        return;
      }
      const response = await AuthFetch(
        ENDPOINTS.GET_CLINIC_ADDRESS(appointment?.doctorId),
        token,
      );
      if (response.status === 'success') {
        const clinic = response?.data?.data || [];
        const found = clinic.find(
          (item: any) => item.addressId === appointment?.clinicId,
        );
        setSelectedClinic(found);
      } else {
        Alert.alert(
          t.common.error,
          response?.message?.message ||
            response?.data?.message ||
            t.errorFetchClinic,
        );
      }
    };

    getClinicDetails();
    fetchDoctorDetails();
    // fetchPaymentDetails();
  }, [
    appointment?.doctorId,
    appointment?.appointmentType,
    appointment?.clinicId,
    appointment?.appointmentId,
    t,
  ]);

  useEffect(() => {
    if (appointment?.paymentDetails) {
      setPaymentDetails(appointment?.paymentDetails || null);
    }
  }, [appointment?.paymentDetails]);

  const handleBackPress = () => navigation.goBack();
  const handleStarPress = (starIndex: number) => setRating(starIndex + 1);

  /**
   * Translates a payment method string into a human-readable, localised label.
   * Handles: upi, cash, card, online, coupon, wallet.
   */
  const translatePaymentMethod = (method?: string): string => {
    if (!method) return t.payment.na;
    const m = method.toLowerCase();
    if (m === 'upi')    return t.payment.upi;
    if (m === 'cash')   return t.payment.cash;
    if (m === 'card')   return t.payment.card;
    if (m === 'online') return t.payment.online;
    if (m === 'coupon') return t.payment.coupon;
    if (m === 'wallet') return t.payment.wallet;
    // Fallback: capitalise first letter
    return method.charAt(0).toUpperCase() + method.slice(1);
  };

  const translatePaymentStatus = (status?: string) => {
    if (!status) return t.payment.na;
    const s = status.toLowerCase();
    if (s === 'paid')    return t.payment.paid;
    if (s === 'pending') return t.payment.pending;
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

  const handleSubmitFeedback = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert(t.common.error, t.errorNotLoggedIn);
        return;
      }
      const body = {
        doctorId: appointment?.doctorId,
        rating: rating,
        comment: feedback,
        appointmentId: appointment?.appointmentId,
      };
      const response = await AuthPost(ENDPOINTS.ADD_FEEDBACK, body, token);
      if (response?.status === 'success') {
        console.log(response, 'feedback response');
        setFeedback('');
        setRating(0);
        Alert.alert(
          'Feedback Submited Successfully',
          'Thank you for providing your feedback',
        );
      } else {
        Alert.alert(
          t.common.error,
          response?.message?.message ||
            response?.data?.message ||
            t.errorFetchDoctor,
        );
      }
    } catch (error) {
      console.log(error, 'feedback error');
      Alert.alert('error');
    }
  };

  const handleBookAppointment = () => navigation.navigate('SelectIssue');
  const handleGoToHome = () => navigation.navigate('Home');

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

  // ─── Payment section ────────────────────────────────────────────────────────

  /**
   * Renders the Payment Details card with the same logic as ViewDetails:
   *  1. actualAmount  → appointment.amount  (NOT paymentDetails)
   *  2. discount      → appointment.discount (NOT paymentDetails)
   *  3. Breakdown     → coupon/wallet = green discount rows; upi/card/cash = blue payment rows
   *  4. Total         → appointment.amount − appointment.discount
   *  5. Paid At       → 12-hour AM/PM format
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

    // ── Values sourced from appointment (requirements 1 & 2) ──────────────────
    const actualAmount: number   = appointment?.amount   ?? 0;
    const discountAmount: number = appointment?.discount ?? 0;
    const finalAmount: number    = actualAmount - discountAmount;

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

        {/* Discount entries (coupon / wallet) — green, negative sign */}
        {discountEntries.map((p, index) => (
          <View key={p.paymentId || `disc-${index}`}>
            <View style={styles.paymentBreakdownRow}>
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
              <Text style={[styles.paymentBreakdownAmount, { color: '#16A34A' }]}>
                {p.discount > 0
                  ? `-₹${p.discount}`
                  : p.finalAmount === 0
                  ? `-₹${p.actualAmount}`
                  : `-₹${p.finalAmount}`}
              </Text>
            </View>
            {index < discountEntries.length - 1 && (
              <View style={styles.paymentRowSep} />
            )}
          </View>
        ))}

        {/* Cash/UPI/Card entries — blue badge, normal amount */}
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
            {index < cashEntries.length - 1 && (
              <View style={styles.paymentRowSep} />
            )}
          </View>
        ))}

        {/* Total row */}
        <View style={styles.paymentDividerLine} />
        <View style={styles.paymentTotalRow}>
          <Text style={styles.paymentTotalLabel}>{t.payment.total}</Text>
          <Text style={styles.paymentTotalValue}>
            {finalAmount === 0
              ? <Text style={{ color: '#16A34A' }}>{t.payment.free}</Text>
              : `₹${finalAmount}`}
          </Text>
        </View>

        {/* Paid At — 12-hour format */}
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EDFFF7" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.successSection}>
          <View style={styles.successIcon}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
          <Text style={styles.successTitle}>{t.successTitle}</Text>
          <Text style={styles.successSubtitle}>
            {t.successSubtitle(appointment?.doctorName)}
          </Text>
          <Text style={styles.successNote}>{t.successNote}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t.summaryTitle}</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t.patientName}</Text>
            <Text style={styles.summaryValue}>{appointment?.patientName}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t.doctor}</Text>
            <View style={styles.doctorInfo}>
              <Text style={styles.summaryValue}>{appointment?.doctorName}</Text>
              <Text style={styles.doctorSpecialty}>
                {appointment?.appointmentDepartment}
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t.mode}</Text>
            <Text style={styles.summaryValue}>
              {appointment?.appointmentType}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t.clinic}</Text>
            <Text style={styles.summaryValue}>
              {selectedClinic?.clinicName}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t.dateTime}</Text>
            <View style={styles.dateTimeInfo}>
              <Text style={styles.summaryValue}>
                {formatDate(appointment?.date || appointment?.appointmentDate)}
              </Text>
              <Text style={styles.timeValue}>
                {appointment?.time.replace(/am|pm/, match =>
                  match.toUpperCase(),
                )}
              </Text>
            </View>
          </View>

          <View style={[styles.summaryRow, styles.lastRow]}>
            <Text style={styles.summaryLabel}>{t.bookingId}</Text>
            <Text style={styles.summaryValue}>
              #{appointment?.appointmentId}
            </Text>
          </View>
        </View>

        {/* ── PAYMENT DETAILS CARD ── */}
        {renderPaymentCard()}

        {/* ── CLINICAL DELIVERABLES: PRESCRIPTIONS & REPORTS ── */}
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

        {/* ── POST-SERVICE FOLLOW-UP / VIDEO CONSULTATION CARD ── */}
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
                  <Text style={styles.feedLabel}>{appointment?.doctorName || 'Doctor'} (Provider)</Text>
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

        <View style={styles.ratingCard}>
          <Text style={styles.ratingTitle}>{t.ratingTitle}</Text>
          <View style={styles.starsContainer}>
            {[0, 1, 2, 3, 4].map(index => (
              <TouchableOpacity
                key={index}
                onPress={() => handleStarPress(index)}
                style={styles.starButton}
              >
                <Text
                  style={[
                    styles.star,
                    index < rating ? styles.filledStar : styles.emptyStar,
                  ]}
                >
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.feedbackInput}
            placeholder={t.feedbackPlaceholder}
            value={feedback}
            onChangeText={setFeedback}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={styles.homeButton}
            onPress={handleSubmitFeedback}
          >
            <Text style={styles.homeText}>{t.submitFeedback}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.bookAppointmentButton}
            onPress={handleBookAppointment}
          >
            <Text style={styles.bookAppointmentText}>{t.bookAppointment}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.homeButton} onPress={handleGoToHome}>
            <Text style={styles.homeIcon}>🏠</Text>
            <Text style={styles.homeText}>{t.home}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDFFF7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#EDFFF7',
  },
  backButton: { padding: 8 },
  backArrow: { fontSize: 20, color: '#333333' },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: { width: 36 },
  content: { flex: 1, paddingHorizontal: 16 },
  successSection: { alignItems: 'center', paddingVertical: 32 },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  checkmark: { fontSize: 24, color: '#10B981', fontWeight: 'bold' },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  successNote: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastRow: { borderBottomWidth: 0 },
  summaryLabel: { fontSize: 14, color: '#6B7280', flex: 1 },
  summaryValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  doctorInfo: { alignItems: 'flex-end', flex: 1 },
  doctorSpecialty: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  dateTimeInfo: { alignItems: 'flex-end', flex: 1 },
  timeValue: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  ratingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  starButton: { padding: 4 },
  star: { fontSize: 24 },
  filledStar: { color: '#FCD34D' },
  emptyStar: { color: '#D1D5DB' },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 80,
    marginBottom: 10,
  },
  bottomSpacing: { height: 20 },
  bottomNav: { marginBottom: 16 },
  bookAppointmentButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  bookAppointmentText: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  homeButton: {
    backgroundColor: '#374151',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  homeIcon: { fontSize: 18, color: '#FFFFFF', marginRight: 8 },
  homeText: { fontSize: 16, color: '#FFFFFF', fontWeight: '500' },

  // ── Payment card ─────────────────────────────────────────────────────────────
  paymentCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  paymentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  paymentTitleText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  paymentBigAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  paymentSubLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 8,
  },
  paymentDividerLine: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  paymentChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  paymentChip: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paymentChipMid: {
    marginHorizontal: 2,
  },
  paymentChipLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  paymentChipValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },

  // ── Breakdown rows ────────────────────────────────────────────────────────────
  paymentBreakdownTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  paymentBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  paymentBreakdownLeft: {
    flex: 1,
    marginRight: 8,
  },
  paymentBreakdownAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  // Green pill — discount methods (coupon / wallet)
  paymentMethodBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 2,
  },
  paymentMethodBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  // Blue pill — cash methods (upi / card / cash / online)
  paymentMethodBadgePrimary: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  paymentMethodBadgeTextPrimary: {
    color: '#2563EB',
  },
  paymentIdText: {
    fontSize: 10,
    color: '#94A3B8',
    letterSpacing: 0.3,
    marginTop: 1,
  },

  // ── Total row ────────────────────────────────────────────────────────────────
  paymentTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  paymentTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  paymentTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },

  // ── Misc rows ────────────────────────────────────────────────────────────────
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  paymentRowSep: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  paymentRowLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  paymentRowValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '700',
  },
  paymentRowValueMono: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  // ── Clinical Deliverables: Reports card ──────────────────────────────────────
  medicalReportsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...LAYOUT.shadow.sm,
  },
  medicalReportsTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#0A3D62',
    marginBottom: 2,
  },
  medicalReportsSubtitle: {
    fontSize: moderateScale(11),
    color: '#64748B',
    marginBottom: SPACING.md,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  reportIconBg: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: '#F0F9F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportName: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  reportMeta: {
    fontSize: moderateScale(11),
    color: '#64748B',
  },
  reportDownloadBtn: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadBtnIcon: {
    fontSize: moderateScale(12),
  },
  downloadProgressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: moderateScale(32),
  },
  progressText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#0A3D62',
    marginTop: 2,
  },
  reportDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: SPACING.xs,
  },

  // ── Post-visit Follow-up Card ────────────────────────────────────────────────
  followUpCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    ...LAYOUT.shadow.sm,
  },
  followUpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  followUpBadge: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    fontSize: moderateScale(9),
    fontWeight: '800',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: LAYOUT.borderRadius.sm,
  },
  followUpTitle: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#065F46',
  },
  followUpText: {
    fontSize: moderateScale(11),
    color: '#047857',
    lineHeight: moderateScale(15),
    marginBottom: SPACING.md,
  },
  videoCallBtn: {
    backgroundColor: '#10B981',
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...LAYOUT.shadow.sm,
  },
  videoCallBtnIcon: {
    fontSize: moderateScale(15),
    marginRight: SPACING.xs,
  },
  videoCallBtnText: {
    color: '#FFFFFF',
    fontSize: moderateScale(13),
    fontWeight: '700',
  },

  // ── Simulated Video Calling Screens ──────────────────────────────────────────
  videoCallOverlay: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  connectingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  doctorPulseAvatarContainer: {
    width: moderateScale(120),
    height: moderateScale(120),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  pulseCircle: {
    position: 'absolute',
    width: moderateScale(140),
    height: moderateScale(140),
    borderRadius: moderateScale(70),
    borderWidth: 2,
    borderColor: '#10B981',
    opacity: 0.4,
  },
  avatarLarge: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#0A3D62',
  },
  avatarLargeText: {
    fontSize: moderateScale(38),
    fontWeight: '800',
    color: '#0A3D62',
  },
  connectingTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  connectingSubtitle: {
    fontSize: moderateScale(13),
    color: '#94A3B8',
    textAlign: 'center',
  },
  endCallBtnConnecting: {
    position: 'absolute',
    bottom: SPACING.xl * 2,
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endCallIcon: {
    fontSize: moderateScale(22),
    color: '#FFFFFF',
  },
  activeCallContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  doctorVideoFeed: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
  },
  doctorCallAvatar: {
    width: moderateScale(140),
    height: moderateScale(140),
    borderRadius: moderateScale(70),
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#10B981',
  },
  feedLabel: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    color: '#FFFFFF',
    fontSize: moderateScale(12),
    fontWeight: '700',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: LAYOUT.borderRadius.sm,
  },
  patientVideoPip: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: moderateScale(90),
    height: moderateScale(130),
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: '#334155',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    ...LAYOUT.shadow.md,
    zIndex: 10,
  },
  pipInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipLabel: {
    position: 'absolute',
    bottom: 4,
    color: '#FFFFFF',
    fontSize: moderateScale(9),
    fontWeight: '700',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 1,
    borderRadius: LAYOUT.borderRadius.sm,
  },
  cameraOffOverlay: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  HUDOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: SPACING.md,
    zIndex: 5,
  },
  HUDTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 44 : 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: LAYOUT.borderRadius.sm,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: moderateScale(10),
    fontWeight: '800',
  },
  durationHUD: {
    color: '#FFFFFF',
    fontSize: moderateScale(13),
    fontWeight: '700',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: LAYOUT.borderRadius.sm,
  },
  HUDBottomBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  HUDControlBtn: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(26),
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  HUDControlBtnActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  endCallBtnActive: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  HUDIcon: {
    fontSize: moderateScale(18),
    color: '#FFFFFF',
  },
  endedCallContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  endedText: {
    fontSize: moderateScale(20),
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
  },
  endedSubtitle: {
    fontSize: moderateScale(13),
    color: '#94A3B8',
  },
});

export default AppointmentDetails;