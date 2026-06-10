import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/navigationTypes';
import { useSelector } from 'react-redux';

// Define navigation prop type
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CancelAppointment'>;

interface AppointmentDetails {
  patientName: string;
  doctor: string;
  specialty: any;
  mode: string;
  clinic: string;
  address: string;
  dateTime: string;
  duration: string;
  consultationFee: any;
}

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
    hi: 'अपॉइंटमेंट रद्द',
    tel: 'అపాయింట్‌మెంట్ రద్దు',
  },
  errorTitleLine1: {
    en: 'Payment Not',
    hi: 'भुगतान',
    tel: 'చెల్లింపు',
  },
  errorTitleLine2: {
    en: 'Completed',
    hi: 'पूरा नहीं हुआ',
    tel: 'పూర్తి కాలేదు',
  },
  errorDesc1: {
    en: 'Your payment was not completed.',
    hi: 'आपका भुगतान पूरा नहीं हुआ।',
    tel: 'మీ చెల్లింపు పూర్తిగా కాలేదు.',
  },
  errorDesc2: {
    en: 'Appointment booking is cancelled.',
    hi: 'अपॉइंटमेंट बुकिंग रद्द कर दी गई है।',
    tel: 'అపాయింట్‌మెంట్ బుకింగ్ రద్దు చేయబడింది.',
  },
  summaryTitle: {
    en: 'Booking Summary',
    hi: 'बुकिंग सारांश',
    tel: 'బుకింగ్ సారాంశం',
  },
  labels: {
    patientName: { en: 'Patient Name:', hi: 'रोगी का नाम:', tel: 'రోగి పేరు:' },
    doctor: { en: 'Doctor:', hi: 'डॉक्टर:', tel: 'డాక్టర్:' },
    specialty: { en: 'Specialty:', hi: 'विशेषता:', tel: 'ప్రత్యేకత:' },
    mode: { en: 'Mode:', hi: 'मोड:', tel: 'రీతి:' },
    clinic: { en: 'Clinic:', hi: 'क्लिनिक:', tel: 'క్లినిక్:' },
    address: { en: 'Address:', hi: 'पता:', tel: 'చిరునామా:' },
    dateTime: { en: 'Date & Time:', hi: 'तारीख और समय:', tel: 'తేదీ & సమయం:' },
    duration: { en: 'Duration:', hi: 'अवधि:', tel: 'వ్యవధి:' },
    consultationFee: { en: 'Consultation Fee:', hi: 'परामर्श शुल्क:', tel: 'కన్సల్టేషన్ ఫీజు:' },
  },
  warningText: {
    en: 'You may rebook anytime before the appointment slot expires.',
    hi: 'आप स्लॉट समाप्त होने से पहले कभी भी दोबारा बुक कर सकते हैं।',
    tel: 'స్లాట్ గడువు ముగిసేలోపు ఎప్పుడైనా మళ్లీ బుక్ చేయవచ్చు.',
  },
  buttons: {
    rebook: { en: 'Rebook Appointment', hi: 'अपॉइंटमेंट फिर से बुक करें', tel: 'అపాయింట్‌మెంట్ మళ్లీ బుక్ చేయండి' },
    goHome: { en: 'Go to Home', hi: 'होम पर जाएँ', tel: 'హోమ్‌కు వెళ్ళండి' },
  },
};
/** ================================================================ */

const CancelAppointment: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const currentUserDetails = useSelector((state: any) => state.currentUser);
  const lang: Lang = normalizeLang(currentUserDetails?.appLanguage);

  const { appointmentDetails } = (route.params as { appointmentDetails: AppointmentDetails }) || {
    appointmentDetails: {
      patientName: 'Krishna Lalitha',
      doctor: 'Dr. Anitha Reddy',
      specialty: 'Cardiologist',
      mode: 'In-Clinic',
      clinic: 'MedCare Health Centre',
      address: '3rd Floor, Ayyappa Society Road, Madhapur, Hyderabad',
      dateTime: '24 July 2025, 3:30 PM',
      duration: '20 mins',
      consultationFee: 499,
    },
  };

  // Extract parameters for Payment screen (kept as-is; not used further here)
  const { doctor, dateTime, consultationFee } = appointmentDetails;
  const [date, time] = dateTime.split(', ');
  const patient = appointmentDetails.patientName;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{UI.headerTitle[lang]}</Text>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Error Icon and Message */}
        <View style={styles.errorSection}>
          <View style={styles.errorIconContainer}>
            <Text style={styles.errorIcon}>×</Text>
          </View>
          <Text style={styles.errorTitle}>{UI.errorTitleLine1[lang]}</Text>
          <Text style={styles.errorTitle}>{UI.errorTitleLine2[lang]}</Text>
          <Text style={styles.errorDescription}>
            {UI.errorDesc1[lang]}
          </Text>
          <Text style={styles.errorDescription}>
            {UI.errorDesc2[lang]}
          </Text>
        </View>

        {/* Booking Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>{UI.summaryTitle[lang]}</Text>
          
          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{UI.labels.patientName[lang]}</Text>
              <Text style={styles.summaryValue}>
                {appointmentDetails?.patientDetails?.firstname} {appointmentDetails?.patientDetails?.lastname}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{UI.labels.doctor[lang]}</Text>
              <Text style={styles.summaryValue}>{appointmentDetails?.doctor}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{UI.labels.specialty[lang]}</Text>
              <Text style={styles.summaryValue}>
                {appointmentDetails?.specialty?.name || appointmentDetails?.specialty}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{UI.labels.mode[lang]}</Text>
              <Text style={styles.summaryValue}>{appointmentDetails.mode}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{UI.labels.clinic[lang]}</Text>
              <Text style={styles.summaryValue}>{appointmentDetails.clinic}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{UI.labels.address[lang]}</Text>
              <Text style={styles.summaryValue}>{appointmentDetails.address}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{UI.labels.dateTime[lang]}</Text>
              <Text style={styles.summaryValue}>{appointmentDetails.dateTime}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{UI.labels.duration[lang]}</Text>
              <Text style={styles.summaryValue}>{appointmentDetails.duration}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{UI.labels.consultationFee[lang]}</Text>
              <Text style={styles.feeValue}>
                ₹{appointmentDetails?.consultationFee?.[0]?.fee || appointmentDetails?.consultationFee}
              </Text>
            </View>
          </View>
        </View>

        {/* Warning Message */}
        <View style={styles.warningContainer}>
          <View style={styles.warningIconContainer}>
            <Text style={styles.warningIcon}>⚠</Text>
          </View>
          <Text style={styles.warningText}>
            {UI.warningText[lang]}
          </Text>
        </View>
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.rebookButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.refreshIcon}>↻</Text>
          <Text style={styles.rebookButtonText}>{UI.buttons.rebook[lang]}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.homeIcon}>🏠</Text>
          <Text style={styles.homeButtonText}>{UI.buttons.goHome[lang]}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDFFF7',
  },
  mainContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#E8F5E8',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  backArrow: {
    fontSize: 20,
    color: '#333',
    fontWeight: '400',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  errorSection: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#E8F5E8',
  },
  errorIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFB3BA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 28,
    color: '#E53E3E',
    fontWeight: '300',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E53E3E',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  summaryContent: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666',
    flex: 1,
    lineHeight: 16,
  },
  summaryValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    flex: 1.2,
    textAlign: 'right',
    lineHeight: 16,
  },
  feeValue: {
    fontSize: 13,
    color: '#E53E3E',
    fontWeight: '600',
    flex: 1.2,
    textAlign: 'right',
    lineHeight: 16,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFD6D6',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  warningIconContainer: {
    marginRight: 8,
    marginTop: 1,
  },
  warningIcon: {
    fontSize: 16,
    color: '#E53E3E',
  },
  warningText: {
    fontSize: 13,
    color: '#E53E3E',
    flex: 1,
    lineHeight: 18,
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#EDFFF7',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  rebookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00203F',
    borderRadius: 8,
    paddingVertical: 14,
    marginBottom: 10,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    marginRight: 8,
    fontWeight: '600',
  },
  rebookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  homeIcon: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
});

export default CancelAppointment;
