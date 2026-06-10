import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/navigationTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { AuthPost, ENDPOINTS } from '../../../services';
import Toast from 'react-native-toast-message';
import { HS_COLORS, hsStyles } from '../homeServiceTheme';
import { SPACING, LAYOUT, moderateScale, scale, verticalScale } from '../../../utils/responsive';

type CancelRouteProp = RouteProp<RootStackParamList, 'HomeServiceCancel'>;
type NavProp = StackNavigationProp<RootStackParamList>;

const CANCEL_REASONS = [
  { id: 'schedule', label: 'Schedule conflict / change of plans' },
  { id: 'pricing', label: 'Found another provider with better rates' },
  { id: 'symptom', label: 'Health condition improved / resolved' },
  { id: 'distance', label: 'Location change or provider is too far' },
  { id: 'other', label: 'Other reason (explain below)' },
];

const HomeServiceCancel: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<CancelRouteProp>();
  const { appointment } = route.params || {};

  const currentUser = useSelector((state: any) => state.currentUser);
  const lang = currentUser?.appLanguage || 'en';

  const [selectedReasonId, setSelectedReasonId] = useState<string>('schedule');
  const [customText, setCustomText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Translations
  const t = {
    en: {
      header: 'Cancel Booking',
      warningTitle: 'Cancel this home visit booking?',
      warningDesc: 'Once cancelled, this slot will be released back to the system. You will receive a refund to your Vydhyo Wallet according to our cancellation policy.',
      bookingDetails: 'Booking Details',
      provider: 'Care Provider',
      service: 'Service / Visit',
      slot: 'Scheduled Slot',
      bookingId: 'Booking ID',
      reasonTitle: 'Why do you want to cancel?',
      customPlaceholder: 'Write custom cancellation reason...',
      policyTitle: 'Home Visit Refund Policy',
      policyAlert: 'Free cancellation is allowed up to 2 hours before the session. Cancellations within 2 hours incur a 50% platform fee penalty.',
      confirmBtn: 'Confirm Cancellation',
      keepBtn: 'Keep Booking',
      successToast: 'Home visit booking cancelled.',
    },
    hi: {
      header: 'बुकिंग रद्द करें',
      warningTitle: 'यह होम विजिट बुकिंग रद्द करें?',
      warningDesc: 'एक बार रद्द होने पर, यह स्लॉट वापस सिस्टम में जारी कर दिया जाएगा। आपको हमारी रद्दीकरण नीति के अनुसार आपके वैध्यो वॉलेट में रिफंड प्राप्त होगा।',
      bookingDetails: 'बुकिंग विवरण',
      provider: 'प्रदाता',
      service: 'सेवा / यात्रा',
      slot: 'निर्धारित समय',
      bookingId: 'बुकिंग आईडी',
      reasonTitle: 'आप क्यों रद्द करना चाहते हैं?',
      customPlaceholder: 'वैकल्पिक कारण लिखें...',
      policyTitle: 'होम विजिट रिफंड नीति',
      policyAlert: 'सत्र से 2 घंटे पहले तक मुफ्त रद्दीकरण की अनुमति है। 2 घंटे के भीतर रद्द करने पर 50% प्लेटफॉर्म शुल्क जुर्माना लगेगा।',
      confirmBtn: 'रद्दीकरण की पुष्टि करें',
      keepBtn: 'बुकिंग जारी रखें',
      successToast: 'होम विजिट बुकिंग रद्द कर दी गई।',
    },
    tel: {
      header: 'బుకింగ్ రద్దు చేయండి',
      warningTitle: 'ఈ హోమ్ విజిట్ బుకింగ్ రద్దు చేయాలా?',
      warningDesc: 'రద్దు చేసిన తర్వాత, ఈ స్లాట్ సిస్టమ్‌కు విడుదల చేయబడుతుంది. రద్దు విధానం ప్రకారం మీ వైద్యో వాలెట్‌కు రీఫండ్ పంపబడుతుంది.',
      bookingDetails: 'బుకింగ్ వివరాలు',
      provider: 'సేవా ప్రదాత',
      service: 'సేవ / సందర్శన',
      slot: 'నిర్ధారించిన సమయం',
      bookingId: 'బుకింగ్ ఐడీ',
      reasonTitle: 'ఎందుకు రద్దు చేయాలనుకుంటున్నారు?',
      customPlaceholder: 'ఇతర కారణాలను రాయండి...',
      policyTitle: 'హోమ్ విజిట్ రీఫండ్ విధానం',
      policyAlert: 'సెషన్‌కు 2 గంటల ముందు వరకు ఉచిత రద్దు అనుమతించబడుతుంది. 2 గంటల లోపు రద్దు చేస్తే 50% ప్లాట్‌ఫారమ్ రుసుము జరిమానా విధించబడుతుంది.',
      confirmBtn: 'రద్దును నిర్ధారించండి',
      keepBtn: 'బుకింగ్ ఉంచండి',
      successToast: 'హోమ్ విజిట్ బుకింగ్ రద్దు చేయబడింది.',
    }
  }[lang === 'hi' || lang === 'tel' ? lang : 'en'];

  const handleConfirmCancel = async () => {
    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      const chosenReasonObj = CANCEL_REASONS.find(r => r.id === selectedReasonId);
      const finalReason = chosenReasonObj?.id === 'other' 
        ? `Other: ${customText}` 
        : (chosenReasonObj?.label || 'Not specified');

      const body = {
        appointmentId: appointment.appointmentId,
        reason: finalReason,
      };

      const response = await AuthPost(ENDPOINTS.CANCEL_APPOINTMENT, body, token);
      
      if (response?.data?.status === 'success') {
        Toast.show({
          type: 'success',
          text1: t.successToast,
          position: 'top',
        });
        navigation.navigate('HomeServiceCancelConfirmation', {
          appointment,
          reason: finalReason,
        });
      } else {
        Alert.alert('Cancel Failed', response?.message?.message || 'Could not cancel booking at this time.');
      }
    } catch (err) {
      console.error('Cancellation error:', err);
      Alert.alert('Cancellation Error', 'An error occurred while canceling the booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeepBooking = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={HS_COLORS.primary} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.header}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Warning card indicator */}
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>{t.warningTitle}</Text>
          <Text style={styles.warningDesc}>{t.warningDesc}</Text>
        </View>

        {/* Appointment Details card summary */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionHeader}>{t.bookingDetails}</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t.provider}</Text>
            <Text style={styles.detailValue}>{appointment.doctorName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t.service}</Text>
            <Text style={styles.detailValue}>{appointment.appointmentDepartment || 'Home Care Service'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t.slot}</Text>
            <Text style={styles.detailValue}>{appointment.date || appointment.appointmentDate} at {appointment.time || appointment.appointmentTime}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t.bookingId}</Text>
            <Text style={styles.detailValue}>#{appointment.appointmentId}</Text>
          </View>
        </View>

        {/* Cancel Reasons Selection */}
        <Text style={styles.fieldLabel}>{t.reasonTitle}</Text>
        <View style={styles.reasonsCard}>
          {CANCEL_REASONS.map(reason => {
            const isSelected = selectedReasonId === reason.id;
            return (
              <TouchableOpacity
                key={reason.id}
                style={[styles.reasonItem, isSelected && styles.reasonItemActive]}
                onPress={() => setSelectedReasonId(reason.id)}
              >
                <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.reasonLabel, isSelected && styles.reasonLabelActive]}>{reason.label}</Text>
              </TouchableOpacity>
            );
          })}

          {selectedReasonId === 'other' && (
            <TextInput
              style={styles.textInput}
              placeholder={t.customPlaceholder}
              placeholderTextColor={HS_COLORS.textMuted}
              value={customText}
              onChangeText={setCustomText}
              multiline
              numberOfLines={3}
            />
          )}
        </View>

        {/* Policy block card */}
        <View style={styles.policyCard}>
          <Text style={styles.policyTitle}>⚠️ {t.policyTitle}</Text>
          <Text style={styles.policyText}>{t.policyAlert}</Text>
        </View>

        {/* Action button triggers */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.confirmBtn, isSubmitting && styles.btnDisabled]} 
            onPress={handleConfirmCancel}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.confirmBtnText}>{t.confirmBtn}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.keepBtn} onPress={handleKeepBooking}>
            <Text style={styles.keepBtnText}>{t.keepBtn}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HS_COLORS.bg,
  },
  header: {
    height: verticalScale(50),
    backgroundColor: HS_COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  backBtn: {
    padding: SPACING.xs,
  },
  backArrow: {
    color: '#FFF',
    fontSize: moderateScale(20),
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
  scroll: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },
  warningCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  warningTitle: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: SPACING.xxs,
  },
  warningDesc: {
    fontSize: moderateScale(12),
    color: '#7F1D1D',
    lineHeight: moderateScale(17),
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: HS_COLORS.border,
  },
  sectionHeader: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: HS_COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xxs,
  },
  detailLabel: {
    fontSize: moderateScale(12),
    color: HS_COLORS.textMuted,
  },
  detailValue: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: HS_COLORS.text,
  },
  fieldLabel: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: HS_COLORS.text,
    marginBottom: SPACING.xs,
  },
  reasonsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: HS_COLORS.border,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  reasonItemActive: {
    backgroundColor: 'rgba(10, 61, 98, 0.03)',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: HS_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  radioOuterActive: {
    borderColor: HS_COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: HS_COLORS.primary,
  },
  reasonLabel: {
    fontSize: moderateScale(13),
    color: HS_COLORS.text,
  },
  reasonLabelActive: {
    fontWeight: '600',
    color: HS_COLORS.primary,
  },
  textInput: {
    borderWidth: 1,
    borderColor: HS_COLORS.border,
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.sm,
    fontSize: moderateScale(12),
    color: HS_COLORS.text,
    marginTop: SPACING.xs,
    textAlignVertical: 'top',
    minHeight: moderateScale(60),
  },
  policyCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  policyTitle: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  policyText: {
    fontSize: moderateScale(11),
    color: '#78350F',
    lineHeight: moderateScale(15),
  },
  actions: {
    marginTop: SPACING.xs,
  },
  confirmBtn: {
    backgroundColor: HS_COLORS.danger,
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
    minHeight: moderateScale(44),
  },
  confirmBtnText: {
    color: '#FFF',
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
  keepBtn: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: HS_COLORS.border,
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: moderateScale(44),
  },
  keepBtnText: {
    color: HS_COLORS.text,
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.7,
  },
});

export default HomeServiceCancel;
