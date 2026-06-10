import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/navigationTypes';
import { useSelector } from 'react-redux';
import { HS_COLORS, hsStyles } from '../homeServiceTheme';
import { SPACING, LAYOUT, moderateScale, scale, verticalScale } from '../../../utils/responsive';

type ConfirmationRouteProp = RouteProp<RootStackParamList, 'HomeServiceCancelConfirmation'>;
type NavProp = StackNavigationProp<RootStackParamList>;

const HomeServiceCancelConfirmation: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ConfirmationRouteProp>();
  const { appointment, reason } = route.params || {};

  const currentUser = useSelector((state: any) => state.currentUser);
  const lang = currentUser?.appLanguage || 'en';

  // Translations
  const t = {
    en: {
      header: 'Booking Cancelled',
      mainTitle: 'Your booking has been cancelled successfully.',
      subtitle: 'The slot is released and you will not be charged.',
      refundNotice: 'Refund Information',
      refundDetails: 'A refund of the consultation fee has been credited back to your Vydhyo Wallet. It will reflect in your balance within 24 hours.',
      detailsTitle: 'Cancelled Booking Details',
      provider: 'Provider',
      service: 'Service',
      bookingId: 'Booking ID',
      cancelReason: 'Reason for Cancellation',
      rebookBtn: 'Rebook Visit / Slot',
      homeBtn: 'Go to Dashboard',
    },
    hi: {
      header: 'बुकिंग रद्द कर दी गई',
      mainTitle: 'आपकी बुकिंग सफलतापूर्वक रद्द कर दी गई है।',
      subtitle: 'स्लॉट जारी कर दिया गया है और आपसे कोई शुल्क नहीं लिया जाएगा।',
      refundNotice: 'रिफंड सूचना',
      refundDetails: 'परामर्श शुल्क का रिफंड आपके वैध्यो वॉलेट में वापस जमा कर दिया गया है। यह 24 घंटे के भीतर आपके बैलेंस में दिखाई देगा।',
      detailsTitle: 'रद्द बुकिंग विवरण',
      provider: 'प्रदाता',
      service: 'सेवा',
      bookingId: 'बुकिंग आईडी',
      cancelReason: 'रद्द करने का कारण',
      rebookBtn: 'पुनः बुक करें',
      homeBtn: 'डैशबोर्ड पर जाएं',
    },
    tel: {
      header: 'బుకింగ్ రద్దయింది',
      mainTitle: 'మీ బుకింగ్ విజయవంతంగా రద్దు చేయబడింది.',
      subtitle: 'స్లాట్ విడుదల చేయబడింది మరియు మీకు ఎటువంటి ఛార్జీలు పడవు.',
      refundNotice: 'రీఫండ్ సమాచారం',
      refundDetails: 'కన్సల్టేషన్ ఫీజు రీఫండ్ మీ వైద్యో వాలెట్‌కు తిరిగి జమ చేయబడింది. ఇది 24 గంటల్లో మీ బ్యాలెన్స్‌లో కనిపిస్తుంది.',
      detailsTitle: 'రద్దు చేసిన బుకింగ్ వివరాలు',
      provider: 'సేవా ప్రదాత',
      service: 'సేవ',
      bookingId: 'బుకింగ్ ఐడీ',
      cancelReason: 'రద్దు చేయడానికి కారణం',
      rebookBtn: 'మళ్లీ బుక్ చేయండి',
      homeBtn: 'డ్యాష్‌బోర్డ్‌కి వెళ్లండి',
    }
  }[lang === 'hi' || lang === 'tel' ? lang : 'en'];

  const handleRebook = () => {
    navigation.navigate('HomeServiceReBook', { appointment });
  };

  const handleGoHome = () => {
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={HS_COLORS.primary} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.header}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Animated warning check icon */}
        <View style={styles.iconSection}>
          <View style={styles.cancelCircle}>
            <Text style={styles.cancelX}>✕</Text>
          </View>
          <Text style={styles.titleText}>{t.mainTitle}</Text>
          <Text style={styles.subtitleText}>{t.subtitle}</Text>
        </View>

        {/* Refund credit notification card */}
        <View style={styles.refundCard}>
          <Text style={styles.refundTitle}>💳 {t.refundNotice}</Text>
          <Text style={styles.refundText}>{t.refundDetails}</Text>
        </View>

        {/* Canceled booking details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionHeader}>{t.detailsTitle}</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t.provider}</Text>
            <Text style={styles.detailValue}>{appointment?.doctorName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t.service}</Text>
            <Text style={styles.detailValue}>{appointment?.appointmentDepartment || 'Home Care Service'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t.bookingId}</Text>
            <Text style={styles.detailValue}>#{appointment?.appointmentId}</Text>
          </View>

          {reason ? (
            <View style={styles.reasonBlock}>
              <Text style={styles.reasonLabel}>{t.cancelReason}</Text>
              <Text style={styles.reasonText}>"{reason}"</Text>
            </View>
          ) : null}
        </View>

        {/* Actions Button Bar */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleRebook}>
            <Text style={styles.primaryBtnText}>🔄 {t.rebookBtn}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleGoHome}>
            <Text style={styles.secondaryBtnText}>🏠 {t.homeBtn}</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
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
  iconSection: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  cancelCircle: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FCA5A5',
    marginBottom: SPACING.sm,
  },
  cancelX: {
    color: HS_COLORS.danger,
    fontSize: moderateScale(30),
    fontWeight: 'bold',
  },
  titleText: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: HS_COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.xxs,
  },
  subtitleText: {
    fontSize: moderateScale(12),
    color: HS_COLORS.textMuted,
    textAlign: 'center',
  },
  refundCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  refundTitle: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#047857',
    marginBottom: 4,
  },
  refundText: {
    fontSize: moderateScale(12),
    color: '#065F46',
    lineHeight: moderateScale(16),
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
    marginBottom: SPACING.xs,
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
  reasonBlock: {
    marginTop: SPACING.xs,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: HS_COLORS.border,
  },
  reasonLabel: {
    fontSize: moderateScale(11),
    color: HS_COLORS.textMuted,
    marginBottom: 2,
  },
  reasonText: {
    fontSize: moderateScale(12),
    color: HS_COLORS.text,
    fontStyle: 'italic',
  },
  actions: {
    marginTop: SPACING.xs,
  },
  primaryBtn: {
    backgroundColor: HS_COLORS.primary,
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
    minHeight: moderateScale(44),
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: HS_COLORS.border,
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: moderateScale(44),
  },
  secondaryBtnText: {
    color: HS_COLORS.text,
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
});

export default HomeServiceCancelConfirmation;
