import React, { useState } from 'react';
import { AuthPost, ENDPOINTS } from '../../services';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/navigationTypes';
;
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
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

type CancelScreenRouteProp = RouteProp<RootStackParamList, 'Cancel'>;

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
    success: { en: 'Success', hi: 'सफल', tel: 'విజయం' },
    dr: { en: 'Dr. ', hi: 'डॉ. ', tel: 'డా. ' },
    noAppt: { en: 'No appointment data available', hi: 'कोई अपॉइंटमेंट डेटा उपलब्ध नहीं', tel: 'అపాయింట్‌మెంట్ డేటా అందుబాటులో లేదు' },
  },
  headerTitle: {
    en: 'Cancel Appointment',
    hi: 'नियुक्ति रद्द करें',
    tel: 'అపాయింట్‌మెంట్ రద్దు చేయండి',
  },
  warning: {
    title: (name: string) => ({
      en: `Are you sure you want to cancel your appointment with ${name}?`,
      hi: `क्या आप वाकई डॉ. ${name} के साथ अपनी नियुक्ति रद्द करना चाहते हैं?`,
      tel: `మీరు డా. ${name} తో మీ అపాయింట్‌మెంట్‌ను రద్దు చేయాలనుకుంటున్నారా?`,
    }),
    subtitle: {
      en: 'This action cannot be undone. You may need to rebook a new slot if you change your mind.',
      hi: 'यह क्रिया वापस नहीं ली जा सकती। अपना विचार बदलने पर आपको नया स्लॉट बुक करना पड़ सकता है।',
      tel: 'ఈ చర్యను తిరిగి మార్చడం సాధ్యం కాదు. మీరు నిర్ణయం మార్చుకుంటే కొత్త స్లాట్ బుక్ చేయవలసి రావచ్చు.',
    },
  },
  card: {
    title: { en: 'Appointment Details', hi: 'नियुक्ति विवरण', tel: 'అపాయింట్‌మెంట్ వివరాలు' },
    inClinic: { en: 'In-Clinic Visit', hi: 'क्लिनिक में विज़िट', tel: 'క్లినిక్ సందర్శన' },
    feePaid: { en: 'Fee Paid', hi: 'शुल्क भुगतान', tel: 'చెల్లించిన ఫీజు' },
    apptId: { en: 'Appointment ID', hi: 'अपॉइंटमेंट आईडी', tel: 'అపాయింట్‌మెంట్ ఐడీ' },
  },
  reason: {
    title: { en: 'Reason for Cancellation', hi: 'रद्द करने का कारण', tel: 'రద్దు చేసే కారణం' },
    placeholder: {
      en: 'Please share your reason for cancellation...',
      hi: 'कृपया रद्द करने का कारण साझा करें...',
      tel: 'దయచేసి రద్దు చేసే కారణాన్ని పంచుకోండి...',
    },
  },
  policy: {
    title: { en: 'Refund & Reschedule Policy', hi: 'रिफंड और पुनर्निर्धारण नीति', tel: 'రిఫండ్ & రీషెడ్యూల్ పాలసీ' },
    moreThan4h: {
      head: { en: 'More than 4 hours before appointment', hi: 'अपॉइंटमेंट से 4 घंटे से अधिक पहले', tel: 'అపాయింట్‌మెంట్‌కు 4 గంటల కంటే ఎక్కువ ముందు' },
      p1: { en: '• You can cancel', hi: '• आप पुनर्निर्धारित या रद्द कर सकते हैं', tel: '• మీరు రీషెడ్యూల్ లేదా రద్దు చేయవచ్చు' },
      p2: { en: '• Refund to wallet: within 24 hours', hi: '• वॉलेट में रिफंड: 24 घंटों के भीतर', tel: '• వాలెట్‌కు రిఫండ్: 24 గంటల్లో' },
    },
    within4h: {
      head: { en: 'Within 4 hours of appointment', hi: 'अपॉइंटमेंट के 4 घंटे के भीतर', tel: 'అపాయింట్‌మెంట్‌కు 4 గంటల లోపు' },
      p1: { en: '• Only rescheduling allowed', hi: '• केवल पुनर्निर्धारण की अनुमति', tel: '• రీషెడ్యూల్ మాత్రమే అనుమతి' },
      p2: { en: '• No cancellation permitted', hi: '• रद्द करना अनुमति नहीं', tel: '• రద్దు అనుమతించబడదు' },
      p3: { en: '• No refund available', hi: '• कोई रिफंड उपलब्ध नहीं', tel: '• రిఫండ్ లభ్యం కాదు' },
    },
  },
  status: {
    msg: {
      en: 'As your appointment is more than 4 hours away, you can either reschedule or cancel. Refunds will be issued to your wallet within 24 Hours.',
      hi: 'चूँकि आपकी नियुक्ति 4 घंटे से अधिक दूर है, आप पुनर्निर्धारित या रद्द कर सकते हैं। रिफंड 24 घंटों के भीतर आपके वॉलेट में जारी कर दिया जाएगा।',
      tel: 'మీ అపాయింట్‌మెంట్‌కు 4 గంటల కంటే ఎక్కువ సమయం ఉన్నందున, మీరు రీషెడ్యూల్ లేదా రద్దు చేయవచ్చు. రిఫండ్లు 24 గంటల్లో మీ వాలెట్‌కి జారీ చేయబడతాయి.',
    },
  },
  buttons: {
    confirm: { en: '✓ Confirm Cancellation', hi: '✓ रद्द करने की पुष्टि करें', tel: '✓ రద్దు నిర్ధారించండి' },
    cancel: { en: '✕ Cancel', hi: '✕ रद्द करें', tel: '✕ రద్దు' },
  },
  toasts: {
    cancelled: { en: 'Appointment cancelled successfully', hi: 'नियुक्ति सफलतापूर्वक रद्द की गई', tel: 'అపాయింట్‌మెంట్ విజయవంతంగా రద్దు చేయబడింది' },
    failCancel: { en: 'Failed to cancel appointment', hi: 'नियुक्ति रद्द करने में विफल', tel: 'అపాయింట్‌మెంట్ రద్దు విఫలమైంది' },
    genericError: { en: 'An error occurred while processing the request', hi: 'अनुरोध संसाधित करते समय त्रुटि हुई', tel: 'అభ్యర్థన ప్రాసెస్ చేసే సమయంలో లోపం జరిగింది' },
  },
};
/** ================================================================ */

const Cancel: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<CancelScreenRouteProp>();
  const { appointment } = route.params || {};

  const currentUser = useSelector((state: any) => state.currentUser);
  const lang: Lang = normalizeLang(currentUser?.appLanguage);

  const [reason, setReason] = useState('');

  const handleBackPress = () => {
    if (navigation.canGoBack()) navigation.goBack();
  };

  const handleCancelConfirm = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const body = { appointmentId: appointment.appointmentId, reason };
      const response = await AuthPost(ENDPOINTS.CANCEL_APPOINTMENT, body, token);
      if (response?.data?.status === 'success') {
        Toast.show({
          type: 'success',
          text1: UI.common.success[lang],
          text2: UI.toasts.cancelled[lang],
          position: 'top',
          visibilityTime: 3000,
        });
        navigation.navigate('CancelConfirmation', { appointment, reason });
      } else {
        Alert.alert(UI.common.error[lang], response?.message?.message || UI.toasts.failCancel[lang]);
      }
    } catch (err) {
      console.error('Update Failed:', err);
      Alert.alert(UI.common.error[lang], UI.toasts.genericError[lang]);
    }
  };

  const handleConfirmCancel = () => {
    handleCancelConfirm();
  };

  const handleCancel = () => {
    if (navigation.canGoBack()) navigation.goBack();
  };

  if (!appointment) {
    return (
      <View style={styles.container}>
        <Text>{UI.common.noAppt[lang]}</Text>
      </View>
    );
  }

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
      if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    const options = { day: 'numeric', month: 'short', year: 'numeric' } as const;
    const locale = lang === 'en' ? 'en-GB' : lang === 'tel' ? 'te-IN' : 'hi-IN';
    return dateObj.toLocaleDateString(locale, options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date error';
  }
};

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{UI.headerTitle[lang]}</Text>
      </View> */}

      <View style={styles.content}>
        {/* Warning Icon */}
        <View style={styles.warningContainer}>
          <View style={styles.warningIcon}>
            <Text style={styles.warningText}>⚠️</Text>
          </View>
        </View>

        {/* Confirmation Message */}
        <Text style={styles.confirmationTitle}>
          {UI.warning.title(appointment.doctorName)[lang]}
        </Text>
        <Text style={styles.confirmationSubtitle}>{UI.warning.subtitle[lang]}</Text>

        {/* Appointment Details Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{UI.card.title[lang]}</Text>

          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Text style={styles.detailIcon}>👤</Text>
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailTitle} numberOfLines={1}>{appointment.doctorName}</Text>
              <Text style={styles.detailSubtitle} numberOfLines={1}>{appointment.appointmentDepartment}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Text style={styles.detailIcon}>🏥</Text>
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailTitle} numberOfLines={1}>
                {appointment.appointmentType || UI.card.inClinic[lang]}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Text style={styles.detailIcon}>🕐</Text>
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailTitle} numberOfLines={1}>
                {formatDate(appointment?.date)}, {appointment?.time?.replace(/am|pm/, match => match.toUpperCase())}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Text style={styles.detailIcon}>🏷️</Text>
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailTitle} numberOfLines={1}>#{appointment.appointmentId}</Text>
              <Text style={styles.detailSubtitle}>{UI.card.apptId[lang]}</Text>
            </View>
          </View>
        </View>

        {/* Reason Input */}
        <Text style={styles.reasonTitle}>{UI.reason.title[lang]}</Text>
        <TextInput
          style={styles.input}
          placeholder={UI.reason.placeholder[lang]}
          value={reason}
          onChangeText={setReason}
          multiline
          placeholderTextColor="#9CA3AF"
        />

        {/* Policy Information */}
        <View style={styles.policyCard}>
          <View style={styles.policyHeader}>
            <Text style={styles.policyIcon}>ℹ️</Text>
            <Text style={styles.policyTitle}>{UI.policy.title[lang]}</Text>
          </View>

          <View style={styles.policySection}>
            <View style={styles.policyIndicator}>
              <Text style={styles.greenDot}>●</Text>
            </View>
            <View style={styles.policyContent}>
              <Text style={styles.policyMainText}>{UI.policy.moreThan4h.head[lang]}</Text>
              <Text style={styles.policySubText}>{UI.policy.moreThan4h.p1[lang]}</Text>
              <Text style={styles.policySubText}>{UI.policy.moreThan4h.p2[lang]}</Text>
            </View>
          </View>

          <View style={styles.policySection}>
            <View style={styles.policyIndicator}>
              <Text style={styles.redDot}>●</Text>
            </View>
            <View style={styles.policyContent2}>
              <Text style={styles.policyMainText}>{UI.policy.within4h.head[lang]}</Text>
              <Text style={styles.policySubText}>{UI.policy.within4h.p1[lang]}</Text>
              <Text style={styles.policySubText}>{UI.policy.within4h.p2[lang]}</Text>
              <Text style={styles.policySubText}>{UI.policy.within4h.p3[lang]}</Text>
            </View>
          </View>
        </View>

        {/* Current Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusIndicator}>
            <Text style={styles.greenDot}>●</Text>
          </View>
          <Text style={styles.statusText}>{UI.status.msg[lang]}</Text>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmCancel}>
          <Text style={styles.confirmButtonText}>{UI.buttons.confirm[lang]}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>{UI.buttons.cancel[lang]}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDFFF7' },
  content: { padding: isTablet ? SPACING.lg : SPACING.md },
  warningContainer: { alignItems: 'center', marginBottom: SPACING.md },
  warningIcon: {
    width: moderateScale(50),
    height: moderateScale(50),
    backgroundColor: '#FEF2F2',
    borderRadius: moderateScale(25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningText: { fontSize: moderateScale(20), color: '#DC2626' },
  confirmationTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: SPACING.xs,
    lineHeight: moderateScale(20),
  },
  confirmationSubtitle: {
    fontSize: moderateScale(12),
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: moderateScale(16),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: isTablet ? SPACING.lg : SPACING.md,
    marginBottom: SPACING.md,
    ...LAYOUT.shadow.sm,
  },
  sectionTitle: { fontSize: moderateScale(14), fontWeight: '600', color: '#1F2937', marginBottom: SPACING.md },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.md },
  iconContainer: {
    width: moderateScale(28),
    height: moderateScale(28),
    backgroundColor: '#F3F4F6',
    borderRadius: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  detailIcon: { fontSize: moderateScale(12) },
  detailContent: { flex: 1 },
  detailTitle: { fontSize: moderateScale(12), fontWeight: '500', color: '#1F2937', marginBottom: SPACING.xxs },
  detailSubtitle: { fontSize: moderateScale(10), color: '#6B7280' },
  reasonTitle: { fontSize: moderateScale(12), fontWeight: '500', color: '#1F2937', marginBottom: SPACING.xs },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.sm,
    fontSize: moderateScale(12),
    color: '#374151',
    backgroundColor: '#FFFFFF',
    marginBottom: SPACING.md,
    textAlignVertical: 'top',
    minHeight: moderateScale(80),
  },
  policyCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: LAYOUT.borderRadius.md,
    padding: isTablet ? SPACING.lg : SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  policyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  policyIcon: { fontSize: moderateScale(12), marginRight: SPACING.xs },
  policyTitle: { fontSize: moderateScale(12), fontWeight: '600', color: '#1E3A8A' },
  policySection: { flexDirection: 'row', marginBottom: SPACING.sm },
  policyIndicator: { marginRight: SPACING.xs, marginTop: moderateScale(2) },
  greenDot: { fontSize: moderateScale(10), color: '#10B981' },
  redDot: { fontSize: moderateScale(10), color: '#EF4444' },
  policyContent: { flex: 1, backgroundColor: '#F0FDF4', padding: SPACING.xs, borderRadius: LAYOUT.borderRadius.sm },
  policyContent2: { flex: 1, backgroundColor: '#FEF2F2', padding: SPACING.xs, borderRadius: LAYOUT.borderRadius.sm },
  policyMainText: { fontSize: moderateScale(11), fontWeight: '500', color: '#1F2937', marginBottom: SPACING.xxs },
  policySubText: { fontSize: moderateScale(10), color: '#6B7280', marginBottom: SPACING.xxs },
  statusCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderLeftWidth: 3,
    borderLeftColor: '#059669',
  },
  statusIndicator: { marginRight: SPACING.xs, marginTop: moderateScale(1) },
  statusText: { fontSize: moderateScale(10), color: '#059669', flex: 1, lineHeight: moderateScale(14) },
  confirmButton: { 
    backgroundColor: '#DC2626', 
    paddingVertical: isTablet ? SPACING.md : SPACING.sm, 
    borderRadius: LAYOUT.borderRadius.md, 
    alignItems: 'center', 
    marginBottom: SPACING.sm,
    minHeight: moderateScale(44),
  },
  confirmButtonText: { color: '#FFFFFF', fontSize: moderateScale(14), fontWeight: '600' },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: isTablet ? SPACING.md : SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    minHeight: moderateScale(44),
  },
  cancelButtonText: { color: '#374151', fontSize: moderateScale(14), fontWeight: '600' },
});

export default Cancel;