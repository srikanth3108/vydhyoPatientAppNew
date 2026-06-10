import React, { useEffect, useState } from 'react';
import { AuthFetch, ENDPOINTS } from '../../services';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, CancelledAppointment } from '../../navigation/navigationTypes';
;
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';

// Import responsive utilities
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
  isTablet,
  isIOS,
  isAndroid,
  PLATFORM,
  SAFE_AREA,
} from '../../utils/responsive';

type CancelledAppointmentDetailsNavigationProp = StackNavigationProp<RootStackParamList, 'CancelledAppointmentDetails'>;

interface RouteParams {
  appointment: CancelledAppointment;
}

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
  },
  headerTitle: {
    en: 'Appointment Details',
    hi: 'नियुक्ति विवरण',
    tel: 'అపాయింట్‌మెంట్ వివరాలు',
  },
  errors: {
    notLoggedIn: {
      en: 'You are not logged in. Please log in to continue.',
      hi: 'आप लॉग इन नहीं हैं। कृपया जारी रखने के लिए लॉग इन करें।',
      tel: 'మీరు లాగిన్ కాలేదు. కొనసాగేందుకు దయచేసి లాగిన్ అవండి.',
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
  cancelled: {
    title: { en: 'Cancelled', hi: 'रद्द', tel: 'రద్దు' },
    description: (date: string, time: string) => ({
      en: `This appointment was cancelled on ${date} at ${time}.`,
      hi: `यह नियुक्ति ${date} को ${time} बजे रद्द कर दी गई थी।`,
      tel: `ఈ అపాయింట్‌మెంట్ ${date} తేదీన ${time}కి రద్దు చేయబడింది.`,
    }),
    byPatient: { en: 'Cancelled by patient', hi: 'रोगी द्वारा रद्द', tel: 'రోగి ద్వారా రద్దు' },
    badge: { en: 'Cancelled', hi: 'रद्द', tel: 'రద్దు' },
  },
  booking: {
    id: { en: 'Booking ID', hi: 'बुकिंग आईडी', tel: 'బుకింగ్ ఐడి' },
    patient: { en: 'Patient', hi: 'रोगी', tel: 'రోగి' },
  },
  details: {
    visitTypeIcon: '🏥',
    locationIcon: '🏢',
    dateIcon: '📅',
    priceIcon: '₹',
    refund: { en: 'Refund Initiated', hi: 'रिफंड शुरू', tel: 'రీఫండ్ ప్రారంభించబడింది' },
  },
  additional: {
    title: { en: 'Additional Information', hi: 'अतिरिक्त जानकारी', tel: 'అదనపు సమాచారం' },
    emailSentTo: { en: 'Email confirmation sent to:', hi: 'ईमेल पुष्टि भेजी गई:', tel: 'ఈమెయిల్ ధృవీకరణ పంపబడింది:' },
    contactClinic: { en: 'Contact clinic:', hi: 'क्लिनिक से संपर्क करें:', tel: 'క్లినిక్‌ను సంప్రదించండి:' },
    getDirections: { en: 'Get Directions', hi: 'दिशा-निर्देश प्राप्त करें', tel: 'దారులు పొందండి' },
  },
  buttons: {
    rebook: { en: 'Rebook Appointment', hi: 'नियुक्ति फिर से बुक करें', tel: 'అపాయింట్‌మెంట్ మళ్లీ బుక్ చేయండి' },
    backToHome: {
      en: 'Back to Appointments Home',
      hi: 'अपॉइंटमेंट्स होम पर वापस जाएं',
      tel: 'అపాయింట్‌మెంట్‌ల హోమ్‌కి తిరిగి వెళ్లండి',
    },
  },
  payment: {
    title:            { en: 'PAYMENT DETAILS',       hi: 'भुगतान विवरण',                        tel: 'చెల్లింపు వివరాలు'             },
    successfullyPaid: { en: 'Successfully paid',      hi: 'सफलतापूर्वक भुगतान किया गया',         tel: 'విజయవంతంగా చెల్లించబడింది'     },
    paymentPending:   { en: 'Payment pending',        hi: 'भुगतान प्रतीक्षित है',                 tel: 'చెల్లింపు పెండింగ్‌లో ఉంది'    },
    actual:           { en: 'ACTUAL',                 hi: 'वास्तविक',                            tel: 'వాస్తవ మొత్తం'                 },
    discount:         { en: 'DISCOUNT',               hi: 'छूट',                                 tel: 'తగ్గింపు'                      },
    status:           { en: 'STATUS',                 hi: 'स्थिति',                              tel: 'స్థితి'                        },
    paid:             { en: 'Paid',                   hi: 'भुगतान किया',                         tel: 'చెల్లించారు'                   },
    pending:          { en: 'Pending',                hi: 'प्रतीक्षित',                           tel: 'పెండింగ్'                      },
    paymentMethod:    { en: 'Payment Method',         hi: 'भुगतान विधि',                         tel: 'చెల్లింపు పద్ధతి'              },
    paymentId:        { en: 'Payment ID',             hi: 'भुगतान आईडी',                         tel: 'చెల్లింపు ఐడి'                 },
    paidAt:           { en: 'Paid At',                hi: 'भुगतान का समय',                       tel: 'చెల్లించిన సమయం'               },
    na:               { en: 'N/A',                    hi: 'उपलब्ध नहीं',                         tel: 'వర్తించదు'                     },
    upi:              { en: 'Upi',                    hi: 'यूपीआई',                              tel: 'యూపీఐ'                         },
    cash:             { en: 'Cash',                   hi: 'नकद',                                 tel: 'నగదు'                          },
    card:             { en: 'Card',                   hi: 'कार्ड',                               tel: 'కార్డు'                        },
    online:           { en: 'Online',                 hi: 'ऑनलाइन',                             tel: 'ఆన్‌లైన్'                      },
  },
};
/** ================================================================ */

type Fee = { type: string; fee: number };

const CancelledAppointmentDetails: React.FC = () => {
  const navigation = useNavigation<CancelledAppointmentDetailsNavigationProp>();
  const route = useRoute();
  const { appointment } = route.params as RouteParams;
  const currentUser = useSelector((state: any) => state.currentUser);
  const lang: Lang = normalizeLang(currentUser?.appLanguage);

  const [selectedClinic, setSelectedClinic] = useState<any>({});
  const [consultationFees, setConsultationFees] = useState<any>();
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
const fetchDoctorDetails = async () => {
  const token = await AsyncStorage.getItem('authToken');
  if (!token) {
    Alert.alert(UI.common.error[lang], UI.errors.notLoggedIn[lang]);
    return;
  }
  const response = await AuthFetch(ENDPOINTS.GET_USER(appointment?.doctorId), token);
  console.log(response)
  if (response.status === 'success') {
    const doctor = response.data.data;
    const walkingTypes ='new-walkin'
    const targetFeeType = walkingTypes.includes(appointment?.appointmentType?.toLowerCase()) 
      ? 'In-Person' 
      : appointment?.appointmentType;
    const fees = (doctor?.consultationModeFee || []).filter(
      (fee: Fee) => fee.type === targetFeeType
    );
    setConsultationFees(fees?.[0]?.fee);
  } else {
    Alert.alert(UI.common.error[lang], response?.message?.message || response?.data?.message || UI.errors.fetchDoctor[lang]);
  }
};

    const getClinicDetails = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert(UI.common.error[lang], UI.errors.notLoggedIn[lang]);
        return;
      }
      const response = await AuthFetch(ENDPOINTS.GET_CLINIC_ADDRESS(appointment?.doctorId), token);
      if (response.status === 'success') {
        const clinic = response?.data?.data || [];
        const chosen = clinic.find((item: any) => item.addressId === appointment?.clinicId);
        setSelectedClinic(chosen);
      } else {
        Alert.alert(UI.common.error[lang], response?.message?.message || response?.data?.message || UI.errors.fetchClinic[lang]);
      }
    };

    const fetchPaymentDetails = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      if (!appointment?.appointmentId) return;
      try {
        const response = await AuthFetch(
          ENDPOINTS.GET_APPOINTMENT_PAYMENT(appointment.appointmentId),
          token,
        );
        console.log("payment response:", response);
        if (response.status === 'success') {
          setPaymentDetails(response?.data?.data || null);
        }
      } catch (error) {
        console.error("Failed to fetch payment details:", error);
      }
    };

    getClinicDetails();
    fetchDoctorDetails();
    fetchPaymentDetails();
  }, [appointment?.doctorId, appointment?.appointmentType, appointment?.clinicId, appointment?.appointmentId, lang]);

  const handleBackPress = () => navigation.goBack();
  const handleRebook = () => {
    if (appointment?.appointmentType === 'Home Visit') {
      navigation.navigate('HomeServiceReBook', { appointment });
    } else {
      navigation.navigate('ReBook', { appointment });
    }
  };
  const handleBackToHome = () => navigation.navigate('Home');

  const translatePaymentMethod = (method?: string) => {
    if (!method) return UI.payment.na[lang];
    const m = method.toLowerCase();
    if (m === 'upi') return UI.payment.upi[lang];
    if (m === 'cash') return UI.payment.cash[lang];
    if (m === 'card') return UI.payment.card[lang];
    if (m === 'online') return UI.payment.online[lang];
    return method.charAt(0).toUpperCase() + method.slice(1);
  };

  const translatePaymentStatus = (status?: string) => {
    if (!status) return UI.payment.na[lang];
    const s = status.toLowerCase();
    if (s === 'paid') return UI.payment.paid[lang];
    if (s === 'pending') return UI.payment.pending[lang];
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

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
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    const options = { day: 'numeric', month: 'short', year: 'numeric' } as const;
    const locale = lang === 'en' ? 'en-GB' : lang === 'tel' ? 'te-IN' : 'hi-IN';
    return dateObj.toLocaleDateString(locale, options);
  } catch (error) {
    return 'Date error';
  }
  };

  const isPaid = paymentDetails?.paymentStatus === 'paid';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{UI.headerTitle[lang]}</Text>
        <View style={styles.headerPlaceholder} />
      </View> */}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cancelled Status Section */}
        <View style={styles.cancelledSection}>
          <View style={styles.cancelledHeader}>
            <View style={styles.cancelledIcon}>
              <Text style={styles.cancelledIconText}>⚠</Text>
            </View>
            <Text style={styles.cancelledTitle}>{UI.cancelled.title[lang]}</Text>
          </View>
<Text style={styles.dateTimeText}>
  {formatDate(appointment?.date)}, {appointment?.time.replace(/am|pm/, (m) => m.toUpperCase())}
</Text>
          <Text style={styles.cancelledBy}>{UI.cancelled.byPatient[lang]}</Text>
          <View style={styles.cancelledBadge}>
            <Text style={styles.cancelledBadgeText}>{UI.cancelled.badge[lang]}</Text>
          </View>
        </View>

        {/* Main Appointment Card */}
        <View style={styles.appointmentCard}>
          {/* Booking ID */}
          <View style={styles.bookingIdSection}>
            <Text style={styles.bookingIdLabel}>{UI.booking.id[lang]}</Text>
            <Text style={styles.bookingId}>#{appointment?.appointmentId}</Text>
          </View>

          {/* Patient */}
          <View style={styles.section}>
            <Text style={styles.patientName}>{appointment?.patientName}</Text>
            <Text style={styles.patientLabel}>{UI.booking.patient[lang]}</Text>
          </View>

          {/* Doctor */}
          <View style={styles.doctorSection}>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>
                 {appointment?.doctorName}
              </Text>
              <Text style={styles.doctorSpecialty}>{appointment?.appointmentDepartment}</Text>
            </View>
          </View>

          {/* Visit Type */}
          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Text style={styles.detailIcon}>{UI.details.visitTypeIcon}</Text>
            </View>
            <Text style={styles.detailText}>{appointment?.appointmentType}</Text>
          </View>

          {/* Location */}
          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Text style={styles.detailIcon}>{UI.details.locationIcon}</Text>
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.clinicName}>{selectedClinic?.clinicName}</Text>
              <Text style={styles.clinicAddress}>{selectedClinic?.address}</Text>
            </View>
          </View>

          {/* Date and Time */}
          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Text style={styles.detailIcon}>{UI.details.dateIcon}</Text>
            </View>
            <View style={styles.dateTimeInfo}>
              <Text style={styles.dateTimeText}>
                {formatDate(appointment?.date)}, {appointment?.time.replace(/am|pm/, (m) => m.toUpperCase())}
              </Text>
            </View>
          </View>

          {/* Price */}
          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Text style={styles.detailIcon}>{UI.details.priceIcon}</Text>
            </View>
            <View style={styles.priceInfo}>
              <Text style={styles.originalPrice}>₹{consultationFees}</Text>
              <Text style={styles.refundText}>{UI.details.refund[lang]}</Text>
            </View>
          </View>
        </View>

        {/* ── PAYMENT DETAILS CARD — screenshot-inspired ── */}
        {paymentDetails && (
          <View style={styles.paymentCard}>

            {/* Section label row — colored dot + uppercase title like screenshot */}
            <View style={styles.paymentTitleRow}>
              <View style={[styles.paymentDot, { backgroundColor: isPaid ? '#16A34A' : '#DC2626' }]} />
              <Text style={[styles.paymentTitleText, { color: isPaid ? '#16A34A' : '#DC2626' }]}>
                {UI.payment.title[lang]}
              </Text>
            </View>

            {/* Big bold amount — like "Delete Your Account" heading */}
            <Text style={styles.paymentBigAmount}>₹{paymentDetails.finalAmount ?? 0}</Text>

            {/* Subtle sub-label */}
            <Text style={styles.paymentSubLabel}>
              {isPaid ? UI.payment.successfullyPaid[lang] : UI.payment.paymentPending[lang]}
            </Text>

            <View style={styles.paymentDividerLine} />

            {/* Two-column stat chips */}
            <View style={styles.paymentChipsRow}>
              <View style={styles.paymentChip}>
                <Text style={styles.paymentChipLabel}>{UI.payment.actual[lang]}</Text>
                <Text style={styles.paymentChipValue}>₹{paymentDetails.actualAmount ?? 0}</Text>
              </View>
              <View style={[styles.paymentChip, styles.paymentChipMid]}>
                <Text style={styles.paymentChipLabel}>{UI.payment.discount[lang]}</Text>
                <Text style={[styles.paymentChipValue, { color: paymentDetails.discount > 0 ? '#16A34A' : '#94A3B8' }]}>
                  {paymentDetails.discount > 0
                    ? (paymentDetails.discountType === 'percentage'
                      ? `-${paymentDetails.discount}%`
                      : `-₹${paymentDetails.discount}`)
                    : '—'}
                </Text>
              </View>
              <View style={styles.paymentChip}>
                <Text style={styles.paymentChipLabel}>{UI.payment.status[lang]}</Text>
                <Text style={[styles.paymentChipValue, { color: isPaid ? '#16A34A' : '#DC2626' }]}>
                  {translatePaymentStatus(paymentDetails.paymentStatus)}
                </Text>
              </View>
            </View>

            <View style={styles.paymentDividerLine} />

            {/* Detail rows — clean label / value pairs like screenshot list items */}
            <View style={styles.paymentRow}>
              <Text style={styles.paymentRowLabel}>{UI.payment.paymentMethod[lang]}</Text>
              <Text style={styles.paymentRowValue}>
                {translatePaymentMethod(paymentDetails.paymentMethod)}
              </Text>
            </View>

            <View style={styles.paymentRowSep} />

            <View style={styles.paymentRow}>
              <Text style={styles.paymentRowLabel}>{UI.payment.paymentId[lang]}</Text>
              <Text style={styles.paymentRowValueMono}>{paymentDetails.paymentId || UI.payment.na[lang]}</Text>
            </View>

            {paymentDetails.paidAt && (
              <>
                <View style={styles.paymentRowSep} />
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentRowLabel}>{UI.payment.paidAt[lang]}</Text>
                  <Text style={styles.paymentRowValue}>
                    {new Date(paymentDetails.paidAt).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })} · {new Date(paymentDetails.paidAt).toLocaleTimeString('en-GB', {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                </View>
              </>
            )}

          </View>
        )}

        {/* Additional Information */}
        <View style={styles.additionalInfoCard}>
          <Text style={styles.additionalInfoTitle}>{UI.additional.title[lang]}</Text>

          {/* <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Text style={styles.infoIcon}>✉</Text>
            </View> */}
            {/* <View style={styles.infoContent}> */}
              {/* <Text style={styles.infoLabel}>{UI.additional.emailSentTo[lang]}</Text> */}
              {/* <Text style={styles.infoValue}>xyz@example.com</Text> */}
            {/* </View> */}
          {/* </View> */}

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Text style={styles.infoIcon}>📞</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{UI.additional.contactClinic[lang]}</Text>
              <Text style={styles.infoValueLink}>{selectedClinic?.mobile}</Text>
            </View>
          </View>

          {/* <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Text style={styles.infoIcon}>📍</Text>
            </View> */}
            {/* <View style={styles.infoContent}>
              <Text style={styles.infoValueLink}>{UI.additional.getDirections[lang]}</Text>
            </View> */}
          {/* </View> */}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.rebookButton} onPress={handleRebook}>
            <Text style={styles.rebookButtonText}>🔄 {UI.buttons.rebook[lang]}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backToHomeButton} onPress={handleBackToHome}>
            <Text style={styles.backToHomeText}>{UI.buttons.backToHome[lang]}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#EDFFF7' 
  },
  content: { 
    flex: 1, 
    paddingHorizontal: SPACING.md,
    paddingBottom: SAFE_AREA.safeBottom + SPACING.md,
  },
  cancelledSection: {
    backgroundColor: '#FEF2F2', 
    borderRadius: LAYOUT.borderRadius.md, 
    padding: SPACING.md, 
    marginTop: SPACING.md, 
    marginBottom: SPACING.md,
    borderLeftWidth: moderateScale(4), 
    borderLeftColor: '#EF4444',
  },
  cancelledHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: SPACING.xs 
  },
  cancelledIcon: {
    width: ICON_SIZE.sm,
    height: ICON_SIZE.sm,
    borderRadius: ICON_SIZE.sm / 2,
    backgroundColor: '#EF4444',
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: SPACING.xs,
  },
  cancelledIconText: { 
    color: '#FFFFFF', 
    fontSize: responsiveText(FONT_SIZE.xs), 
    fontWeight: 'bold' 
  },
  cancelledTitle: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    fontWeight: '600', 
    color: '#DC2626' 
  },
  cancelledDescription: { 
    fontSize: responsiveText(FONT_SIZE.xs), 
    color: '#6B7280', 
    marginBottom: SPACING.xxs, 
    lineHeight: moderateScale(16) 
  },
  cancelledBy: { 
    fontSize: responsiveText(FONT_SIZE.xs), 
    color: '#DC2626', 
    marginBottom: SPACING.sm 
  },
  cancelledBadge: { 
    alignSelf: 'flex-end', 
    backgroundColor: '#FEE2E2', 
    paddingHorizontal: SPACING.sm, 
    paddingVertical: SPACING.xxs, 
    borderRadius: LAYOUT.borderRadius.sm 
  },
  cancelledBadgeText: { 
    color: '#DC2626', 
    fontSize: responsiveText(FONT_SIZE.xxs), 
    fontWeight: '500' 
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF', 
    borderRadius: LAYOUT.borderRadius.md, 
    padding: SPACING.md, 
    marginBottom: SPACING.md,
    ...LAYOUT.shadow.sm,
  },
  bookingIdSection: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingBottom: SPACING.sm, 
    marginBottom: SPACING.sm, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6',
  },
  bookingIdLabel: { 
    fontSize: responsiveText(FONT_SIZE.xs), 
    color: '#6B7280' 
  },
  bookingId: { 
    fontSize: responsiveText(FONT_SIZE.xs), 
    fontWeight: '600', 
    color: '#111827' 
  },
  section: { 
    marginBottom: SPACING.md 
  },
  patientName: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    fontWeight: '600', 
    color: '#111827', 
    marginBottom: SPACING.xxs 
  },
  patientLabel: { 
    fontSize: responsiveText(FONT_SIZE.xs), 
    color: '#6B7280' 
  },
  doctorSection: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: SPACING.md 
  },
  doctorImage: { 
    width: ICON_SIZE.md, 
    height: ICON_SIZE.md, 
    borderRadius: ICON_SIZE.md / 2, 
    marginRight: SPACING.sm 
  },
  doctorInfo: { 
    flex: 1 
  },
  doctorName: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    fontWeight: '600', 
    color: '#111827', 
    marginBottom: SPACING.xxs 
  },
  doctorSpecialty: { 
    fontSize: responsiveText(FONT_SIZE.xs), 
    color: '#6B7280' 
  },
  detailRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginBottom: SPACING.md 
  },
  iconContainer: { 
    width: ICON_SIZE.sm, 
    alignItems: 'center', 
    marginRight: SPACING.sm 
  },
  detailIcon: { 
    fontSize: responsiveText(FONT_SIZE.sm) 
  },
  detailText: { 
    fontSize: responsiveText(FONT_SIZE.xs), 
    color: '#374151', 
    flex: 1 
  },
  locationInfo: { 
    flex: 1 
  },
  clinicName: { 
    fontSize: responsiveText(FONT_SIZE.xs), 
    fontWeight: '500', 
    color: '#111827', 
    marginBottom: SPACING.xxs 
  },
  clinicAddress: { 
    fontSize: responsiveText(FONT_SIZE.xxs), 
    color: '#6B7280', 
    lineHeight: moderateScale(14) 
  },
  dateTimeInfo: { 
    flex: 1 
  },
  dateTimeText: { 
    fontSize: responsiveText(FONT_SIZE.xs), 
    color: '#374151', 
    marginBottom: SPACING.xxs 
  },
  durationText: { 
    fontSize: responsiveText(FONT_SIZE.xxs), 
    color: '#6B7280' 
  },
  priceInfo: { 
    flex: 1 
  },
  originalPrice: { 
    fontSize: responsiveText(FONT_SIZE.xs), 
    color: '#374151', 
    textDecorationLine: 'line-through', 
    marginBottom: SPACING.xxs 
  },
  refundText: { 
    fontSize: responsiveText(FONT_SIZE.xxs), 
    color: '#059669', 
    fontWeight: '500' 
  },
  additionalInfoCard: {
    backgroundColor: '#FFFFFF', 
    borderRadius: LAYOUT.borderRadius.md, 
    padding: SPACING.md, 
    marginBottom: SPACING.lg,
    ...LAYOUT.shadow.sm,
  },
  additionalInfoTitle: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    fontWeight: '600', 
    color: '#111827', 
    marginBottom: SPACING.md 
  },
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginBottom: SPACING.md 
  },
  infoIconContainer: { 
    width: ICON_SIZE.sm, 
    alignItems: 'center', 
    marginRight: SPACING.sm 
  },
  infoIcon: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    color: '#6B7280' 
  },
  infoContent: { 
    flex: 1 
  },
  infoLabel: { 
    fontSize: responsiveText(FONT_SIZE.xxs), 
    color: '#6B7280', 
    marginBottom: SPACING.xxs 
  },
  infoValue: { 
    fontSize: responsiveText(FONT_SIZE.xs), 
    color: '#374151' 
  },
  infoValueLink: { 
    fontSize: responsiveText(FONT_SIZE.xs), 
    color: '#2563EB' 
  },
  buttonsContainer: { 
    marginBottom: SPACING.xl 
  },
  rebookButton: {
    backgroundColor: '#1E293B', 
    paddingVertical: SPACING.sm, 
    paddingHorizontal: SPACING.md,
    borderRadius: LAYOUT.borderRadius.sm, 
    alignItems: 'center', 
    marginBottom: SPACING.sm,
  },
  rebookButtonText: { 
    color: '#FFFFFF', 
    fontSize: responsiveText(FONT_SIZE.sm), 
    fontWeight: '600' 
  },
  backToHomeButton: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: SPACING.sm, 
    paddingHorizontal: SPACING.md, 
    backgroundColor: '#E5E7EB',
    borderRadius: LAYOUT.borderRadius.sm,
  },
  backToHomeIcon: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    marginRight: SPACING.xs 
  },
  backToHomeText: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    color: '#374151', 
    fontWeight: '500' 
  },

  // ── Payment card — screenshot-inspired ──────────────────────────────────
  paymentCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: isTablet ? SPACING.lg : SPACING.md,
    marginBottom: SPACING.md,
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

export default CancelledAppointmentDetails;