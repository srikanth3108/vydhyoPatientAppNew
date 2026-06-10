import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/navigationTypes';
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

// Fallback icons using text (replace with react-native-vector-icons if preferred)
const ArrowLeftIcon = () => <Text style={styles.iconText}>←</Text>;
const CancelIcon = () => <Text style={styles.cancelIconText}>✕</Text>;
const UserIcon = () => <Text style={styles.userIconText}>👤</Text>;
const CalendarIcon = () => <Text style={styles.buttonIconText}>📅</Text>;
const HomeIcon = () => <Text style={styles.buttonIconText}>🏠</Text>;

type CancelConfirmationRouteProp = RouteProp<RootStackParamList, 'CancelConfirmation'>;

/** ===================== i18n (EN / HI / TEL) ===================== */
type Lang = 'en' | 'hi' | 'tel';
const normalizeLang = (l?: string): Lang => {
  if (l === 'en' || l === 'hi' || l === 'tel') return l;
  if (l === 'te') return 'tel';
  return 'en';
};

const UI = {
  headerTitle: {
    en: 'Appointment Cancelled',
    hi: 'नियुक्ति रद्द की गई',
    tel: 'అపాయింట్‌మెంట్ రద్దయింది',
  },
  mainTitle: (name: string) => ({
    en: `Your appointment with Dr. ${name} has been cancelled.`,
    hi: `डॉ. ${name} के साथ आपकी नियुक्ति रद्द कर दी गई है।`,
    tel: `డా. ${name}తో మీ అపాయింట్‌మెంట్ రద్దు చేయబడింది.`,
  }),
  subtitle: {
    en: 'You can book a new appointment anytime from your dashboard.',
    hi: 'आप अपने डैशबोर्ड से कभी भी नई नियुक्ति बुक कर सकते हैं।',
    tel: 'మీరు డ్యాష్‌బోర్డ్ నుండి ఎప్పుడైనా కొత్త అపాయింట్‌మెంట్ బుక్ చేసుకోవచ్చు.',
  },
  cardHeaderTitle: {
    en: 'Appointment Details',
    hi: 'नियुक्ति विवरण',
    tel: 'అపాయింట్‌మెంట్ వివరాలు',
  },
  cancelledBadge: {
    en: 'Cancelled',
    hi: 'रद्द',
    tel: 'రద్దు',
  },
  labels: {
    mode: { en: 'Mode', hi: 'मोड', tel: 'రీతి' },
    dateTime: { en: 'Date & Time', hi: 'तारीख और समय', tel: 'తేదీ & సమయం' },
    bookingId: { en: 'Booking ID', hi: 'बुकिंग आईडी', tel: 'బుకింగ్ ఐడి' },
    feePaid: { en: 'Fee Paid', hi: 'भुगतान किया गया शुल्क', tel: 'చెల్లించిన ఫీజు' },
  },
  refundText: (amount: string | number) => ({
    en: `Your refund will be processed within 24 hours to your wallet.`,
    hi: `रिफंड 24 घंटों के भीतर आपके वॉलेट में प्रोसेस कर दिया जाएगा।`,
    tel: ` రీఫండ్ 24 గంటల్లో మీ వాలెట్‌కి ప్రాసెస్ చేయబడుతుంది.`,
  }),
  buttons: {
    bookAnother: {
      en: 'Book Another Appointment',
      hi: 'एक और नियुक्ति बुक करें',
      tel: 'మరొక అపాయింట్‌మెంట్ బుక్ చేయండి',
    },
    goToDashboard: {
      en: 'Go to Dashboard',
      hi: 'डैशबोर्ड पर जाएँ',
      tel: 'డ్యాష్‌బోర్డ్‌కి వెళ్లండి',
    },
  },
};
/** ================================================================ */

const CancelConfirmation: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<CancelConfirmationRouteProp>();
  const { appointment } = route.params;

  const currentUser = useSelector((state: any) => state.currentUser);
  const lang: Lang = normalizeLang(currentUser?.appLanguage);

  const handleGoBack = () => navigation.goBack();
  const handleBookAnother = () => navigation.navigate('SelectIssue');
  const handleGoToDashboard = () => navigation.navigate('Home');
const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  
  try {
    let dateObj: Date;
    
    if (dateStr.includes('T')) {
      dateObj = new Date(dateStr);
    } else if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/').map(Number);
      dateObj = new Date(year, month - 1, day);
    } else if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-').map(Number);
      dateObj = new Date(year, month - 1, day);
    } else {
      return 'Invalid date';
    }
      if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    const options = { day: '2-digit', month: 'short', year: 'numeric' } as const;
    const locale = lang === 'en' ? 'en-GB' : lang === 'tel' ? 'te-IN' : 'hi-IN';
    return dateObj.toLocaleDateString(locale, options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date error';
  }
};
  const amount = 499; // keep existing logic/amount from current screen

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <ArrowLeftIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{UI.headerTitle[lang]}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cancellation Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.cancelIcon}>
            <CancelIcon />
          </View>
        </View>

        {/* Main Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.mainTitle}>
            {UI.mainTitle(appointment?.doctorName || '')[lang]}
          </Text>
          <Text style={styles.subtitle}>{UI.subtitle[lang]}</Text>
        </View>

        {/* Appointment Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderTitle}>{UI.cardHeaderTitle[lang]}</Text>
            <View style={styles.cancelledBadge}>
              <Text style={styles.cancelledBadgeText}>{UI.cancelledBadge[lang]}</Text>
            </View>
          </View>

          <View style={styles.cardContent}>
            {/* Doctor Info */}
            <View style={styles.doctorInfo}>
              <View style={styles.doctorAvatar}>
                <UserIcon />
              </View>
              <View style={styles.doctorDetails}>
                <Text style={styles.doctorName}>{appointment?.doctorName}</Text>
                <Text style={styles.doctorSpecialty}>{appointment?.doctor?.specialty}</Text>
              </View>
            </View>

            {/* Appointment Details Grid */}
            <View style={styles.detailsGrid}>
              {/* <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{UI.labels.mode[lang]}</Text>
                <Text style={styles.detailValue}>{appointment?.mode}</Text>
              </View> */}

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{UI.labels.dateTime[lang]}</Text>
  <Text style={styles.detailValue}>{formatDate(appointment?.date)}</Text>
                <Text style={styles.detailValue}>{appointment?.time}</Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{UI.labels.bookingId[lang]}</Text>
                <Text style={styles.detailValue}>{appointment?.appointmentId}</Text>
              </View>

              {/* <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{UI.labels.feePaid[lang]}</Text>
                <Text style={styles.detailValue}>₹{amount}</Text>
              </View> */}
            </View>
          </View>
        </View>

        {/* Refund Notice */}
        <View style={styles.refundNotice}>
          <View style={styles.refundIcon}>
            <View style={styles.refundDot} />
          </View>
          <Text style={styles.refundText}>
            {UI.refundText(amount)[lang]}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleBookAnother}>
            <CalendarIcon />
            <Text style={styles.primaryButtonText}>{UI.buttons.bookAnother[lang]}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleGoToDashboard}>
            <HomeIcon />
            <Text style={styles.secondaryButtonText}>{UI.buttons.goToDashboard[lang]}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#EDFFF7' 
  },
  header: {
    backgroundColor: '#EDFFF7',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: PLATFORM.STATUS_BAR_HEIGHT + SPACING.sm,
  },
  backButton: { 
    marginRight: SPACING.md, 
    padding: SPACING.xxs 
  },
  headerTitle: { 
    fontSize: responsiveText(FONT_SIZE.md), 
    fontWeight: '500', 
    color: '#111827' 
  },
  content: { 
    flex: 1, 
    paddingHorizontal: SPACING.md,
    paddingBottom: SAFE_AREA.safeBottom + SPACING.md,
  },
  iconContainer: { 
    alignItems: 'center', 
    marginTop: SPACING.xl, 
    marginBottom: SPACING.xl 
  },
  cancelIcon: {
    width: ICON_SIZE.xxl,
    height: ICON_SIZE.xxl,
    backgroundColor: '#FFA4A4',
    borderRadius: ICON_SIZE.xxl / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: { 
    alignItems: 'center', 
    marginBottom: SPACING.xl 
  },
  mainTitle: {
    fontSize: responsiveText(FONT_SIZE.lg),
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: SPACING.xs,
    lineHeight: moderateScale(24),
    paddingHorizontal: SPACING.md,
  },
  subtitle: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    color: '#6B7280', 
    textAlign: 'center', 
    lineHeight: moderateScale(18),
    paddingHorizontal: SPACING.lg,
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: LAYOUT.borderRadius.md,
    ...LAYOUT.shadow.sm,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderTitle: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    fontWeight: '500', 
    color: '#111827' 
  },
  cancelledBadge: { 
    backgroundColor: '#FEF2F2', 
    paddingHorizontal: SPACING.xs, 
    paddingVertical: SPACING.xxs, 
    borderRadius: LAYOUT.borderRadius.sm 
  },
  cancelledBadgeText: { 
    fontSize: responsiveText(FONT_SIZE.xxs), 
    fontWeight: '500', 
    color: '#EF4444' 
  },
  cardContent: { 
    padding: SPACING.md 
  },
  doctorInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: SPACING.md 
  },
  doctorAvatar: {
    width: ICON_SIZE.lg,
    height: ICON_SIZE.lg,
    backgroundColor: '#DBEAFE',
    borderRadius: ICON_SIZE.lg / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  doctorDetails: { 
    flex: 1 
  },
  doctorName: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    fontWeight: '500', 
    color: '#111827', 
    marginBottom: SPACING.xxs 
  },
  doctorSpecialty: { 
    fontSize: responsiveText(FONT_SIZE.xs), 
    color: '#6B7280' 
  },
  detailsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  detailItem: { 
    width: '48%', 
    marginBottom: SPACING.md 
  },
  detailLabel: { 
    fontSize: responsiveText(FONT_SIZE.xs), 
    color: '#6B7280', 
    marginBottom: SPACING.xxs 
  },
  detailValue: { 
    fontSize: responsiveText(FONT_SIZE.xs), 
    fontWeight: '500', 
    color: '#111827' 
  },
  refundNotice: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  refundIcon: {
    width: ICON_SIZE.xs,
    height: ICON_SIZE.xs,
    backgroundColor: '#22C55E',
    borderRadius: ICON_SIZE.xs / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    marginTop: scale(2),
  },
  refundDot: { 
    width: scale(4), 
    height: scale(4), 
    backgroundColor: 'white', 
    borderRadius: scale(2) 
  },
  refundText: { 
    fontSize: responsiveText(FONT_SIZE.xs), 
    color: '#166534', 
    flex: 1, 
    lineHeight: moderateScale(16) 
  },
  buttonContainer: { 
    paddingBottom: SPACING.xl 
  },
  primaryButton: {
    backgroundColor: '#00203F',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    height: verticalScale(44),
  },
  primaryButtonText: { 
    color: 'white', 
    fontSize: responsiveText(FONT_SIZE.sm), 
    fontWeight: '500', 
    marginLeft: SPACING.xs 
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: verticalScale(44),
  },
  secondaryButtonText: { 
    color: '#374151', 
    fontSize: responsiveText(FONT_SIZE.sm), 
    fontWeight: '500', 
    marginLeft: SPACING.xs 
  },
  iconText: { 
    fontSize: responsiveText(FONT_SIZE.md), 
    color: '#6B7280' 
  },
  cancelIconText: { 
    fontSize: responsiveText(FONT_SIZE.lg), 
    color: '#EF4444' 
  },
  userIconText: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    color: '#2563EB' 
  },
  buttonIconText: { 
    fontSize: responsiveText(FONT_SIZE.sm) 
  },
});

export default CancelConfirmation;