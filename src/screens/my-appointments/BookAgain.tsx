import React, { useEffect, useState } from 'react';
import { AuthFetch, ENDPOINTS } from '../../services';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, CompletedAppointment, CancelledAppointment } from '../../navigation/navigationTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';
;
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

type BookAgainRouteProp = RouteProp<RootStackParamList, 'BookAgain'>;
type BookAgainNavigationProp = StackNavigationProp<RootStackParamList, 'BookAgain'>;

type AppointmentMode = 'In-Clinic Visit' | 'Video Call' | null;
interface Fee {
  type: string;
  fee: number;
  currency: string;
  _id: string;
}

// Translation objects
const translations = {
  en: {
    questionText: 'How would you like to consult the doctor?',
    subtitleText: 'Select a preferred consultation method below.',
    inClinicTitle: 'In-Clinic Visit',
    inClinicDescription: 'Visit the clinic for a face-to-face consultation.',
    videoCallTitle: 'Video Call',
    videoCallDescription: 'Consult online from your location.',
    doctorInfoTitle: 'Booking Again With:',
    continueButton: 'Continue',
    errorNotLoggedIn: 'You are not logged in. Please log in to reschedule your appointment.',
    errorFetchDoctor: 'Failed to fetch doctor details',
    errorFetchClinic: 'Failed to fetch clinic details',
    doctorNotFound: 'Doctor not found',
  },
  tel: {
    questionText: 'మీరు డాక్టర్‌ను ఎలా సంప్రదించాలనుకుంటున్నారు?',
    subtitleText: 'క్రింద మీకు ఇష్టమైన సంప్రదింపు పద్ధతిని ఎంచుకోండి.',
    inClinicTitle: 'క్లినిక్ సందర్శన',
    inClinicDescription: 'ముఖాముఖి సంప్రదింపు కోసం క్లినిక్‌ను సందర్శించండి.',
    videoCallTitle: 'వీడియో కాల్',
    videoCallDescription: 'మీ స్థానం నుండి ఆన్‌లైన్‌లో సంప్రదించండి.',
    doctorInfoTitle: 'మళ్లీ బుక్ చేస్తున్నారు:',
    continueButton: 'కొనసాగించు',
    errorNotLoggedIn: 'మీరు లాగిన్ కాలేదు. అపాయింట్‌మెంట్‌ను రీషెడ్యూల్ చేయడానికి దయచేసి లాగిన్ చేయండి.',
    errorFetchDoctor: 'డాక్టర్ వివరాలను పొందడంలో విఫలమైంది',
    errorFetchClinic: 'క్లినిక్ వివరాలను పొందడంలో విఫలమైంది',
    doctorNotFound: 'డాక్టర్ కనుగొనబడలేదు',
  },
  hi: {
    questionText: 'आप डॉक्टर से कैसे परामर्श करना चाहेंगे?',
    subtitleText: 'नीचे अपनी पसंदीदा परामर्श विधि चुनें।',
    inClinicTitle: 'क्लिनिक विजिट',
    inClinicDescription: 'आमने-सामने परामर्श के लिए क्लिनिक जाएँ।',
    videoCallTitle: 'वीडियो कॉल',
    videoCallDescription: 'अपने स्थान से ऑनलाइन परामर्श करें।',
    doctorInfoTitle: 'पुनः बुकिंग के साथ:',
    continueButton: 'जारी रखें',
    errorNotLoggedIn: 'आप लॉग इन नहीं हैं। अपनी नियुक्ति को पुनर्निर्धारित करने के लिए कृपया लॉग इन करें।',
    errorFetchDoctor: 'डॉक्टर विवरण प्राप्त करने में विफल',
    errorFetchClinic: 'क्लिनिक विवरण प्राप्त करने में विफल',
    doctorNotFound: 'डॉक्टर नहीं मिला',
  },
  te: {
    questionText: 'మీరు డాక్టర్‌ను ఎలా సంప్రదించాలనుకుంటున్నారు?',
    subtitleText: 'క్రింద మీకు ఇష్టమైన సంప్రదింపు పద్ధతిని ఎంచుకోండి.',
    inClinicTitle: 'క్లినిక్ సందర్శన',
    inClinicDescription: 'ముఖాముఖి సంప్రదింపు కోసం క్లినిక్‌ను సందర్శించండి.',
    videoCallTitle: 'వీడియో కాల్',
    videoCallDescription: 'మీ స్థానం నుండి ఆన్‌లైన్‌లో సంప్రదించండి.',
    doctorInfoTitle: 'మళ్లీ బుక్ చేస్తున్నారు:',
    continueButton: 'కొనసాగించు',
    errorNotLoggedIn: 'మీరు లాగిన్ కాలేదు. అపాయింట్‌మెంట్‌ను రీషెడ్యూల్ చేయడానికి దయచేసి లాగిన్ చేయండి.',
    errorFetchDoctor: 'డాక్టర్ వివరాలను పొందడంలో విఫలమైంది',
    errorFetchClinic: 'క్లినిక్ వివరాలను పొందడంలో విఫలమైంది',
    doctorNotFound: 'డాక్టర్ కనుగొనబడలేదు',
  },
};

const BookAgain: React.FC = () => {
  const navigation = useNavigation<BookAgainNavigationProp>();
  const route = useRoute<BookAgainRouteProp>();
  const { appointment } = route.params;
  const currentuserDetails = useSelector((state: any) => state.currentUser);
  
  const getLanguage = () => {
    const appLanguage = currentuserDetails?.appLanguage;
    if (appLanguage === 'tel' || appLanguage === 'te' || appLanguage === 'hi' || appLanguage === 'en') {
      return appLanguage;
    }
    return 'en'; // Default to English
  };
  
  const language = getLanguage();
  const t = translations[language] || translations.en; // Get translations for current language
  const insets = useSafeAreaInsets();
  
  const [selectedMode, setSelectedMode] = useState<AppointmentMode>(null);
  const [doctorDetails, setDoctorDetails] = useState<any>(null);
  const [clinicDetails, setClinicDetails] = useState<any>(null);
  const [inpersonFee, setInpersonFee] = useState<number>(0);
  const [videoCallFee, setVideoCallFee] = useState<number>(0);
  const [doctorNotFound, setDoctorNotFound] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showComingSoon, setShowComingSoon] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert(t.errorNotLoggedIn);
        setIsLoading(false);
        return;
      }

      try {
        // Fetch doctor details
        const doctorResponse = await AuthFetch(ENDPOINTS.GET_USER(appointment?.doctorId), token);
        if (doctorResponse?.status === 'success') {
          const doctor = doctorResponse?.data?.data;
          setDoctorDetails(doctor);
          const inPerson = doctor?.consultationModeFee?.find((fee: Fee) => fee.type === 'In-Person')?.fee || 0;
          const videoCall = doctor?.consultationModeFee?.find((fee: Fee) => fee.type === 'Video')?.fee || 0;
          setInpersonFee(inPerson);
          setVideoCallFee(videoCall);
          setDoctorNotFound(false);
        } else {
          setDoctorNotFound(true);
          Alert.alert('Error', doctorResponse?.message?.message || doctorResponse?.data?.message || t.errorFetchDoctor);
        }

        // Fetch clinic details
        const clinicResponse = await AuthFetch(ENDPOINTS.GET_CLINIC_ADDRESS(appointment.doctorId), token);
        if (clinicResponse.status === 'success') {
          const clinic = clinicResponse?.data?.data;
          const selectedClinic = clinic.find((item: any) => item.addressId === appointment.addressId);
          setClinicDetails(selectedClinic);
        } else {
          console.warn('Clinic details not found:', clinicResponse?.message?.message || clinicResponse?.data?.message);
        }
      } catch (error) {
        setDoctorNotFound(true);
        Alert.alert('Error', t.errorFetchDoctor);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [appointment, t]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleModeSelection = (mode: AppointmentMode) => {
    if (doctorNotFound || isLoading) return;
    if (mode === 'Video Call') {
      setShowComingSoon(true);
      return;
    }
    setSelectedMode(mode);
  };

// In BookAgain.tsx, update the handleContinue function:

  const handleContinue = () => {
    if (doctorNotFound || !selectedMode || !doctorDetails) return; 
    
    if (selectedMode === 'In-Clinic Visit') {
      navigation.navigate('SelectClinic', { 
        appointment,
        mode: 'Home Visit',
        doctor: { 
          id: doctorDetails.id,
          doctorId: doctorDetails.userId,
          name: doctorDetails.firstname,
          // Fix specialty - ensure it's a string
          specialty: typeof doctorDetails.specialization === 'object' 
            ? doctorDetails.specialization?.name || '' 
            : doctorDetails.specialization || '',
          addresses: doctorDetails?.addresses,
          consultationFee: inpersonFee,
        },
      });
    } else if (selectedMode === 'Video Call') {
      navigation.navigate('DateSelection', { 
        appointment,
        mode: 'Video',
        clinic: clinicDetails,
        doctor: { 
          id: doctorDetails.id,
          doctorId: doctorDetails.userId,
          name: doctorDetails.firstname,
          // Fix specialty - ensure it's a string
          specialty: typeof doctorDetails.specialization === 'object' 
            ? doctorDetails.specialization?.name || '' 
            : doctorDetails.specialization || '',
          addresses: doctorDetails?.addresses,
          consultationFee: videoCallFee,
        },
      });
    }
  };

  const renderModeOption = (
    mode: AppointmentMode,
    icon: string,
    title: string,
    description: string,
    iconBg: string
  ) => (
    <TouchableOpacity
      style={[
        styles.modeOption,
        selectedMode === mode && styles.selectedModeOption,
        (doctorNotFound || isLoading) && styles.disabledModeOption
      ]}
      onPress={() => handleModeSelection(mode)}
      activeOpacity={(doctorNotFound || isLoading) ? 1 : 0.7}
      disabled={doctorNotFound || isLoading}
    >
      <View style={styles.modeContent}>
        <View style={[styles.modeIcon, { backgroundColor: iconBg }, (doctorNotFound || isLoading) && styles.disabledIcon]}>
          <Text style={[styles.modeIconText, (doctorNotFound || isLoading) && styles.disabledText]}>{icon}</Text>
        </View>
        
        <View style={styles.modeTextContainer}>
          <Text style={[styles.modeTitle, (doctorNotFound || isLoading) && styles.disabledText]}>{title}</Text>
          <Text style={[styles.modeDescription, (doctorNotFound || isLoading) && styles.disabledText]}>{description}</Text>
        </View>
      </View>
      
      <View style={[
        styles.radioButton,
        selectedMode === mode && styles.selectedRadioButton,
        (doctorNotFound || isLoading) && styles.disabledRadioButton
      ]}>
        {selectedMode === mode && <View style={styles.radioButtonInner} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0FDF4" />

      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        <View style={styles.content}>
          {doctorNotFound && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{t.doctorNotFound}</Text>
            </View>
          )}

          {isLoading && !doctorNotFound && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading doctor details...</Text>
            </View>
          )}

          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>{t.questionText}</Text>
            <Text style={styles.subtitleText}>{t.subtitleText}</Text>
          </View>

          <View style={styles.optionsContainer}>
            {renderModeOption(
              'In-Clinic Visit',
              '🏥',
              t.inClinicTitle,
              t.inClinicDescription,
              '#3B82F6'
            )}

            {renderModeOption(
              'Video Call',
              '📹',
              t.videoCallTitle,
              t.videoCallDescription,
              '#10B981'
            )}
          </View>

          {!isLoading && !doctorNotFound && (
            <View style={styles.doctorInfoContainer}>
              <Text style={styles.doctorInfoTitle}>{t.doctorInfoTitle}</Text>
              <View style={styles.doctorCard}>
                <View style={styles.doctorDetails}>
                  <Text style={styles.doctorName}>{appointment.doctorName}</Text>
                  <Text style={styles.doctorSpecialty}>{appointment.appointmentDepartment}</Text>
                </View>
              </View>
            </View>
          )}
          
          {/* Bottom spacing for footer */}
          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>

      {/* Dynamic Footer */}
      {selectedMode && (
        <View style={[styles.footer, { bottom: SAFE_AREA.safeBottom + SPACING.sm }]}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!selectedMode || doctorNotFound || isLoading) && styles.disabledContinueButton
            ]}
            onPress={handleContinue}
            disabled={!selectedMode || doctorNotFound || isLoading}
            activeOpacity={(!selectedMode || doctorNotFound || isLoading) ? 1 : 0.7}
          >
            <Text style={[
              styles.continueButtonText,
              (!selectedMode || doctorNotFound || isLoading) && styles.disabledContinueButtonText
            ]}>
              {t.continueButton}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Elegant Coming Soon Modal */}
      <Modal
        transparent
        visible={showComingSoon}
        animationType="fade"
        onRequestClose={() => setShowComingSoon(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowComingSoon(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalBox}>
            {/* Top accent bar */}
            <View style={styles.modalAccentBar} />

            {/* Icon pill */}
            <View style={styles.modalIconPill}>
              <Text style={styles.modalIconText}>📹</Text>
            </View>

            {/* Tag */}
            <View style={styles.modalTag}>
              <Text style={styles.modalTagText}>COMING SOON</Text>
            </View>

            <Text style={styles.modalTitle}>Video Consultation</Text>
            <Text style={styles.modalMessage}>
              We're working on bringing you seamless online consultations. This feature will be available shortly.
            </Text>

            {/* Divider */}
            <View style={styles.modalDivider} />

            <TouchableOpacity style={styles.modalButton} onPress={() => setShowComingSoon(false)} activeOpacity={0.8}>
              <Text style={styles.modalButtonText}>Got it</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#F0FDF4',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: PLATFORM.STATUS_BAR_HEIGHT + SPACING.sm,
  },
  backButton: {
    padding: SPACING.xs,
    width: ICON_SIZE.sm,
    height: ICON_SIZE.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: responsiveText(FONT_SIZE.lg),
    color: '#333333',
    fontWeight: isIOS ? '300' : '400',
  },
  headerTitle: {
    fontSize: responsiveText(FONT_SIZE.md),
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
  placeholder: {
    width: ICON_SIZE.sm,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SAFE_AREA.safeBottom + verticalScale(80),
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: '#DC2626',
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '500',
  },
  questionContainer: {
    marginBottom: SPACING.lg,
  },
  questionText: {
    fontSize: responsiveText(FONT_SIZE.lg),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: SPACING.xs,
    lineHeight: moderateScale(24),
  },
  subtitleText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#6B7280',
    lineHeight: moderateScale(20),
  },
  optionsContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  modeOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...LAYOUT.shadow.xs,
    minHeight: verticalScale(80),
  },
  selectedModeOption: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  disabledModeOption: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  modeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modeIcon: {
    width: ICON_SIZE.lg,
    height: ICON_SIZE.lg,
    borderRadius: LAYOUT.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  disabledIcon: {
    backgroundColor: '#D1D5DB',
  },
  modeIconText: {
    fontSize: responsiveText(FONT_SIZE.md),
  },
  modeTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  modeTitle: {
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: SPACING.xxs,
  },
  modeDescription: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#6B7280',
    lineHeight: moderateScale(16),
  },
  radioButton: {
    width: ICON_SIZE.sm,
    height: ICON_SIZE.sm,
    borderRadius: ICON_SIZE.sm / 2,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  selectedRadioButton: {
    borderColor: '#22C55E',
  },
  disabledRadioButton: {
    borderColor: '#9CA3AF',
    backgroundColor: '#F3F4F6',
  },
  radioButtonInner: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: '#22C55E',
  },
  doctorInfoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    ...LAYOUT.shadow.xs,
  },
  doctorInfoTitle: {
    fontSize: responsiveText(FONT_SIZE.xs),
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: SPACING.sm,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: SPACING.xxs,
  },
  doctorSpecialty: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#6B7280',
  },
  
  // Footer styles
  footer: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: 'transparent',
  },
  continueButton: {
    backgroundColor: '#22C55E',
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...LAYOUT.shadow.sm,
    height: verticalScale(48),
  },
  continueButtonText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledContinueButton: {
    backgroundColor: '#9CA3AF',
  },
  disabledContinueButtonText: {
    color: '#FFFFFF',
  },
  
  bottomSpacing: {
    height: verticalScale(80),
  },
  disabledText: {
    color: '#9CA3AF',
  },

  // ── Elegant Coming Soon Modal ──────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    width: '100%',
    alignItems: 'center',
    overflow: 'hidden',
    paddingBottom: SPACING.lg,
    ...LAYOUT.shadow.md,
  },
  // Thin teal accent bar at the very top
  modalAccentBar: {
    width: '100%',
    height: moderateScale(4),
    backgroundColor: '#10B981',
    marginBottom: SPACING.lg,
  },
  // Circular icon container
  modalIconPill: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(32),
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  modalIconText: {
    fontSize: moderateScale(28),
    lineHeight: moderateScale(34),
  },
  // Small pill tag
  modalTag: {
    backgroundColor: '#ECFDF5',
    borderRadius: moderateScale(20),
    paddingHorizontal: SPACING.sm,
    paddingVertical: moderateScale(3),
    marginBottom: SPACING.sm,
  },
  modalTagText: {
    fontSize: moderateScale(9),
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 1.2,
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: SPACING.xs,
    letterSpacing: -0.3,
  },
  modalMessage: {
    fontSize: moderateScale(13),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: moderateScale(20),
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  modalDivider: {
    width: '85%',
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: SPACING.md,
  },
  modalButton: {
    backgroundColor: '#0F172A',
    borderRadius: moderateScale(10),
    paddingVertical: moderateScale(11),
    paddingHorizontal: moderateScale(48),
  },
  modalButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  // ────────────────────────────────────────────────────────────────────────
});

export default BookAgain;