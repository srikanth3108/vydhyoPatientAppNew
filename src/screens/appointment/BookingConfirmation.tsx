import React, { useEffect, useState, useRef } from 'react';
import { AuthFetch, AuthPost, ENDPOINTS } from '../../services';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import {
  RouteProp,
  useNavigation,
  useFocusEffect,
  useRoute,
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/navigationTypes';
;
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { formatDoctorName } from '../../utils/util';

const { width, height } = Dimensions.get('window');

type BookingConfirmationRouteProp = RouteProp<
  RootStackParamList,
  'BookingConfirmation'
>;

interface BookingConfirmationProps {
  route: BookingConfirmationRouteProp;
}

// ---- Language helpers ----
type Lang = 'en' | 'hi' | 'tel';
const normalizeLang = (l?: string): Lang =>
  l === 'en' || l === 'hi' || l === 'tel' ? l : 'en';

// ---- UI strings (3 languages), matching all UI.* usages below ----
const UI = {
  common: {
    error: { en: 'Error', hi: 'त्रुटि', tel: 'లోపం' },
  },
  loaderText: {
    en: 'Loading appointment details...',
    hi: 'नियुक्ति विवरण लोड हो रहा है...',
    tel: 'అపాయింట్‌మెంట్ వివరాలను లోడ్ చేస్తోంది...',
  },
  headerTitle: {
    en: 'Booking Confirmation',
    hi: 'बुकिंग पुष्टिकरण',
    tel: 'బుకింగ్ నిర్ధారణ',
  },
  consultationBooked: {
    en: 'Consultation Booked',
    hi: 'परामर्श बुक किया गया',
    tel: 'సంప్రదింపు బుక్ చేయబడింది',
  },
  successfully: {
    en: 'Successfully',
    hi: 'सफलतापूर्वक',
    tel: 'విజయవంతంగా',
  },
  confirmedMsg: {
    en: 'Your consultation has been confirmed.',
    hi: 'आपका परामर्श पुष्टि हो गया है।',
    tel: 'మీ సంప్రదింపు నిర్ధారించబడింది.',
  },
  thanksMsg: {
    en: "Thank you! You'll receive a notification before your appointment.",
    hi: 'धन्यवाद! आपको आपकी नियुक्ति से पहले एक अधिसूचना प्राप्त होगी।',
    tel: 'ధన్యవాదాలు! మీ అపాయింట్‌మెంట్‌కు ముందు మీకు ఒక నోటిఫికేషన్ వస్తుంది.',
  },
  paymentSuccessful: {
    en: 'Payment Successful',
    hi: 'भुगतान सफल',
    tel: 'చెల్లింపు విజయవంతం',
  },
  bookingSummary: {
    en: 'Booking Summary',
    hi: 'बुकिंग सारांश',
    tel: 'బుకింగ్ సారాంశం',
  },
  labels: {
    bookingId: { en: 'Booking ID', hi: 'बुकिंग आईडी', tel: 'బుకింగ్ ఐడీ' },
    patientName: { en: 'Patient Name', hi: 'रोगी का नाम', tel: 'రోగి పేరు' },
    doctor: { en: 'Doctor', hi: 'डॉक्टर', tel: 'డాక్టర్' },
    mode: { en: 'Mode', hi: 'मोड', tel: 'మోడ్' },
    clinicName: {
      en: 'Clinic Name',
      hi: 'क्लिनिक का नाम',
      tel: 'క్లినిక్ పేరు',
    },
    clinicAddress: {
      en: 'Clinic Address',
      hi: 'क्लिनिक का पता',
      tel: 'క్లినిక్ చిరునామా',
    },
    dateTime: { en: 'Date & Time', hi: 'तारीख और समय', tel: 'తేదీ & సమయం' },
    consultationFee: {
      en: 'Consultation Fee',
      hi: 'परामर्श शुल्क',
      tel: 'సంప్రదింపు రుసుము',
    },
discount: {
  en: 'Discount',
  hi: 'छूट',
  tel: 'డిస్కౌంట్',
},

AmountPaid: {
  en: 'Amount Paid',
  hi: 'भुगतान की गई राशि',
  tel: 'చెల్లించిన మొత్తం',
},

    paid: { en: 'Paid', hi: 'भुगतान किया गया', tel: 'చెల్లించబడింది' },
  },
  whatsNext: {
    en: "What's Next?",
    hi: 'आगे क्या है?',
    tel: 'తదుపరి ఏమిటి?',
  },
  nextSteps: {
    reminder: {
      en: 'You will receive a reminder 1 Hour before the appointment.',
      hi: 'आपको नियुक्ति से 15 मिनट पहले एक रिमाइंडर प्राप्त होगा।',
      tel: 'మీ అపాయింట్‌మెంట్‌కు 15 నిమిషాల ముందు రిమైండర్ అందుతుంది.',
    },
    email: {
      en: 'Confirmation sent to your email: xyz@example.com',
      hi: 'पुष्टिकरण आपके ईमेल पर भेजा गया है: xyz@example.com',
      tel: 'మీ ఇమెయిల్‌కు నిర్ధారణ పంపబడింది: xyz@example.com',
    },
  },
  buttons: {
    goToMyAppointments: {
      en: 'Go to My Appointments',
      hi: 'मेरी नियुक्तियों पर जाएं',
      tel: 'నా అపాయింట్‌మెంట్లకు వెళ్ళండి',
    },
    downloadReceipt: {
      en: 'Download Receipt',
      hi: 'रसीद डाउनलोड करें',
      tel: 'రసీదు డౌన్‌లోడ్ చేయండి',
    },
    backToHome: {
      en: 'Back to Home',
      hi: 'होम पर वापस जाएं',
      tel: 'హోమ్‌కు తిరిగి వెళ్ళండి',
    },
  },
  errors: {
    loadApptDetailsFailed: {
      en: 'Failed to load appointment details',
      hi: 'नियुक्ति विवरण लोड करने में विफल',
      tel: 'అపాయింట్‌మెంట్ వివరాలను లోడ్ చేయడంలో విఫలమైంది',
    },
    notLoggedInUpdate: {
      en: 'You are not logged in. Please log in to update your appointment.',
      hi: 'आप लॉग इन नहीं हैं। कृपया अपनी नियुक्ति अपडेट करने के लिए लॉग इन करें।',
      tel: 'మీరు లాగిన్ కాలేదు. దయచేసి మీ అపాయింట్‌మెంట్‌ను అప్‌డేట్ చేయడానికి లాగిన్ చేయండి.',
    },
    noApptDetails: {
      en: 'Appointment details not available',
      hi: 'नियुक्ति विवरण उपलब्ध नहीं है',
      tel: 'అపాయింట్‌మెంట్ వివరాలు అందుబాటులో లేవు',
    },
    updateFailed: {
      en: 'Failed to update appointment',
      hi: 'नियुक्ति अपडेट करने में विफल',
      tel: 'అపాయింట్‌మెంట్ అప్‌డేట్ చేయడంలో విఫలమైంది',
    },
    pleaseLoginToContinue: {
      en: 'Please log in to continue',
      hi: 'कृपया जारी रखने के लिए लॉग इन करें',
      tel: 'దయచేసి కొనసాగడానికి లాగిన్ అవ్వండి',
    },
    paymentProcessFailed: {
      en: 'Payment processing failed',
      hi: 'भुगतान प्रक्रिया विफल',
      tel: 'చెల్లింపు ప్రాసెసింగ్ విఫలమైంది',
    },
    notLoggedInViewClinic: {
      en: 'You are not logged in. Please log in to view clinic details.',
      hi: 'आप लॉग इन नहीं हैं। कृपया क्लिनिक विवरण देखने के लिए लॉग इन करें।',
      tel: 'మీరు లాగిన్ కాలేదు. క్లినిక్ వివరాలను చూడటానికి లాగిన్ అవ్వండి.',
    },
    clinicFetchFailed: {
      en: 'Failed to fetch clinic details',
      hi: 'क्लिनिक विवरण प्राप्त करने में विफल',
      tel: 'క్లినిక్ వివరాలను పొందడంలో విఫలమైంది',
    },
  },
};

const BookingConfirmation: React.FC<BookingConfirmationProps> = () => {
  const route = useRoute<BookingConfirmationRouteProp>();
  const { linkId, orderID, platformFee, selectedOption } = route.params;
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const user = useSelector((state: any) => state.currentUser);
  const currentUserDetails = useSelector((state: any) => state.currentUser);

  const lang: Lang = normalizeLang(currentUserDetails?.appLanguage);

  const [clinicDetails, setClinicDetails] = useState<any>(null);
  const [appointmentDetails, setAppointmentDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
// console.log(appointmentDetails,"appointmentDetailsbbom")
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false); // Add this state
  async function getAppointmentDetails() {
    try {
      setIsLoading(true);
      const latestAppointmentDetailsStr = await AsyncStorage.getItem(
        'latestAppointmentDetails',
      );
      if (!latestAppointmentDetailsStr) {
        navigation.navigate('MyAppointments');
        return null;
      }
      const details = JSON.parse(latestAppointmentDetailsStr);
      setAppointmentDetails(details);
      return details;
    } catch (error) {
      Alert.alert(UI.common.error[lang], UI.errors.loadApptDetailsFailed[lang]);
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    getAppointmentDetails().then(() => {
      startAnimations();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const dateObj = new Date(dateStr);
    const options = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    } as const;
    const locale = lang === 'en' ? 'en-GB' : lang === 'tel' ? 'te-IN' : 'hi-IN';
    return dateObj.toLocaleDateString(locale, options);
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return 'N/A';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const twelveHour = hour % 12 || 12;
    return `${twelveHour}:${minutes} ${ampm}`;
  };

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.spring(bounceAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      delay: 400,
      useNativeDriver: true,
    }).start();
  };

  async function updateAppointment() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert(UI.common.error[lang], UI.errors.notLoggedInUpdate[lang]);
        return;
      }

      // if (!appointmentDetails?.appointmentId) {
      //   Alert.alert(UI.common.error[lang], UI.errors.noApptDetails[lang]);
      //   return;
      // }

      const response = await AuthPost(
        ENDPOINTS.UPDATE_APPOINTMENT_STATUS,
        { appointmentId: appointmentDetails.appointmentId },
        token,
      );

      if (response.status !== 'success') {
        // Alert.alert(
        //   UI.common.error[lang],
        //   response?.message?.message ||
        //     response?.data?.message ||
        //     UI.errors.updateFailed[lang],
        // );
      }
    } catch (error) {
      // Alert.alert(UI.common.error[lang], UI.errors.updateFailed[lang]);
    }
  }

  useFocusEffect(
    React.useCallback(() => {
      const updatePayment = async () => {
        if (paymentProcessed || isProcessingPayment || !orderID) {
          return;
        }

        try {
          setIsProcessingPayment(true);
          const token = await AsyncStorage.getItem('authToken');
          if (!token) {
            Alert.alert(
              UI.common.error[lang],
              UI.errors.pleaseLoginToContinue[lang],
            );
            return;
          }

          // if (!orderID || !appointmentDetails?.appointmentId) {
          //   Alert.alert(UI.common.error[lang], UI.errors.noApptDetails[lang]);
          //   return;
          // }
          if (
            !appointmentDetails?.appointmentId ||
            !appointmentDetails?.userId
          ) {
            return;
          }

          const body = {
            userId: appointmentDetails.userId,
            doctorId: appointmentDetails.doctorId,
            addressId: appointmentDetails.addressId,
            appointmentId: appointmentDetails.appointmentId,
            actualAmount: appointmentDetails.amount,
            discountType: appointmentDetails.discountType,
            discount: appointmentDetails.discount || 0,
            currency: 'INR',
            paymentFrom: 'appointment',
            paymentMethod:
              selectedOption || appointmentDetails.paymentMethod || 'referral',
            paymentStatus: 'paid',
            finalAmount: appointmentDetails.finalAmount,
            appSource: 'patientApp',
            transactionId: orderID,
            paymentGateway: selectedOption === 'upi' ? 'phonepe' : 'referral',
            platformFee: platformFee || 0,
            couponId: appointmentDetails.couponId || null,
          };

          const response = await AuthPost(ENDPOINTS.CREATE_PAYMENT, body, token);

          if (response?.data?.status === 'success') {
            setPaymentProcessed(true);
            await updateAppointment();
            await getClinicDetails();
          }
        } catch (err) {
          Alert.alert(
            UI.common.error[lang],
            UI.errors.paymentProcessFailed[lang],
          );
        } finally {
          setIsProcessingPayment(false);
        }
      };

      if (
        appointmentDetails?.paymentMethod === 'upi' &&
        orderID &&
        !paymentProcessed
      ) {
        updatePayment();
      }
    }, [
      orderID,
      appointmentDetails,
      paymentProcessed,
      isProcessingPayment,
      lang,
    ]),
  );

  const getClinicDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert(
          UI.common.error[lang],
          UI.errors.notLoggedInViewClinic[lang],
        );
        return;
      }
      const response = await AuthFetch(
        ENDPOINTS.GET_CLINIC_ADDRESS(appointmentDetails.doctorId),
        token,
      );

      if (response.status === 'success') {
        const clinic = response.data.data;
        const selectedClinic = clinic.find(
          (item: any) => item.addressId === appointmentDetails.addressId,
        );
        setClinicDetails(selectedClinic);
      } else {
        Alert.alert(
          UI.common.error[lang],
          response?.message?.message ||
            response?.data?.message ||
            UI.errors.clinicFetchFailed[lang],
        );
      }
    } catch (error) {
      Alert.alert(UI.common.error[lang], UI.errors.clinicFetchFailed[lang]);
    }
  };

  const handleGoToAppointments = async () => {
    await AsyncStorage.removeItem('latestAppointmentDetails');
    navigation.navigate('MyAppointments');
  };

  // const handleDownloadReceipt = () => {
  //   console.log('Download receipt');
  // };

  const handleBackToHome = async () => {
    await AsyncStorage.removeItem('latestAppointmentDetails');
    navigation.navigate('Home');
  };

  if (isLoading || !appointmentDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loaderText}>{UI.loaderText[lang]}</Text>
        </View>
      </SafeAreaView>
    );
  }
  // console.log("appointmentDetails", appointmentDetails);
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      {/* <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackToHome}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{UI.headerTitle[lang]}</Text>

        <View style={styles.headerSpacer} />
      </View> */}

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          style={[
            styles.contentContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Animated.View
            style={[
              styles.successIconContainer,
              { transform: [{ scale: scaleAnim }, { scale: pulseAnim }] },
            ]}
          >
            <Text style={styles.successIcon}>✓</Text>
            <View style={styles.successRing} />
          </Animated.View>

          <Text style={styles.mainTitle}>{UI.consultationBooked[lang]}</Text>
          <Text style={styles.mainTitle}>{UI.successfully[lang]}</Text>

          <Text style={styles.confirmationMessage}>
            {UI.confirmedMsg[lang]}
          </Text>
          <Text style={styles.subMessage}>{UI.thanksMsg[lang]}</Text>

          {/* Payment Success Indicator */}
          <Animated.View
            style={[
              styles.paymentSuccessContainer,
              { transform: [{ scale: bounceAnim }] },
            ]}
          >
            <View style={styles.paymentSuccessIcon}>
              <Text style={styles.paymentSuccessText}></Text>
            </View>
            <Text style={styles.paymentSuccessLabel}>
              {UI.paymentSuccessful[lang]}
            </Text>

            <Text style={styles.paymentSuccessAmount}>
              ₹
              {appointmentDetails?.discount > 0 
                ? appointmentDetails?.finalAmount 
                : appointmentDetails?.amount || 'N/A'}
            </Text>
          </Animated.View>

          {/* Booking Summary Card */}
          <Animated.View
            style={[
              styles.summaryContainer,
              { transform: [{ scale: bounceAnim }] },
            ]}
          >
            <Text style={styles.sectionTitle}>{UI.bookingSummary[lang]}</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {UI.labels.bookingId[lang]}
              </Text>
              <Text style={styles.detailValue}>#CONS18273645</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {UI.labels.patientName[lang]}
              </Text>
              <Text style={styles.detailValue}>
                {appointmentDetails?.patientName || 'N/A'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{UI.labels.doctor[lang]}</Text>
              <View style={styles.doctorInfo}>
                <Text style={styles.detailValue}>
                  {formatDoctorName(appointmentDetails?.doctorName || 'N/A')}
                </Text>
                <Text style={styles.specialty}>
                  {appointmentDetails?.appointmentDepartment?.name || 'N/A'}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{UI.labels.mode[lang]}</Text>
              <View style={styles.modeContainer}>
                <Text style={styles.modeIcon}>🏥</Text>
                <Text style={styles.detailValue}>
                  {appointmentDetails?.appointmentType || 'N/A'}
                </Text>
              </View>
            </View>

            {/* <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{UI.labels.clinicName[lang]}</Text>
              <Text style={styles.detailValue}>
                {clinicDetails?.clinicName || 'N/A'}
              </Text>
            </View> */}

            {/* <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{UI.labels.clinicAddress[lang]}</Text>
              <Text style={styles.detailValue}>
                {clinicDetails?.address || 'N/A'}
              </Text>
            </View> */}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{UI.labels.dateTime[lang]}</Text>
              <View style={styles.dateTimeContainer}>
                <Text style={styles.detailValue}>
                  {formatDate(appointmentDetails?.appointmentDate)}
                </Text>
                <Text style={styles.timeValue}>
                  {formatTime(appointmentDetails?.appointmentTime)}
                </Text>
              </View>
            </View>

            <View className="feeRow" style={[styles.detailRow, styles.feeRow]}>
              <Text style={styles.detailLabel}>
                {UI.labels.consultationFee[lang]}
              </Text>
              <View style={styles.feeContainer}>
                <Text style={styles.feeAmount}>
                  ₹{appointmentDetails?.amount }
                </Text>
                  </View>
                </View>

    {appointmentDetails?.discount > 0 && (
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>
          {UI.labels.discount[lang]}
        </Text>
        <View style={styles.feeContainer}>
          <Text style={[styles.feeAmount, styles.discountText]}>
            - ₹{appointmentDetails?.discount || 0}
          </Text>
        </View>
      </View>
    )}

    <View className="feeRow" style={[styles.detailRow, styles.feeRow]}>
      <Text style={styles.detailLabel}>
        {UI.labels.AmountPaid[lang]}
      </Text>
      <View style={styles.feeContainer}>
        <Text style={styles.feeAmount}>
          ₹{appointmentDetails?.discount > 0 
            ? appointmentDetails?.finalAmount 
            : appointmentDetails?.amount || 'N/A'}
        </Text>
        {appointmentDetails?.discount > 0 && appointmentDetails?.finalAmount === 0 ? (
          <View style={[styles.paidBadge, styles.freeBadge]}>
            <Text style={styles.paidLabel}>FREE</Text>
          </View>
        ) : (
                <View style={styles.paidBadge}>
                  <Text style={styles.paidLabel}>{UI.labels.paid[lang]}</Text>
                </View>
              )}
              </View>
            </View>
          </Animated.View>

          {/* What's Next Card */}
          <Animated.View
            style={[
              styles.whatsNextContainer,
              { transform: [{ scale: bounceAnim }] },
            ]}
          >
            <Text style={styles.whatsNextTitle}>{UI.whatsNext[lang]}</Text>

            <View style={styles.nextStepRow}>
              <View style={styles.stepIcon}>
                <Text style={styles.stepIconText}>🔔</Text>
              </View>
              <Text style={styles.stepText}>{UI.nextSteps.reminder[lang]}</Text>
            </View>

            {/* <View style={styles.nextStepRow}>
              <View style={styles.stepIcon}>
                <Text style={styles.stepIconText}>✉️</Text>
              </View>
              <Text style={styles.stepText}>{UI.nextSteps.email[lang]}</Text>
            </View> */}
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View
            style={[
              styles.buttonContainer,
              { transform: [{ scale: bounceAnim }] },
            ]}
          >
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleGoToAppointments}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>
                {UI.buttons.goToMyAppointments[lang]}
              </Text>
            </TouchableOpacity>

            {/* <TouchableOpacity
              style={styles.secondaryButton}
              // onPress={handleDownloadReceipt}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>⬇ {UI.buttons.downloadReceipt[lang]}</Text>
            </TouchableOpacity> */}

            <TouchableOpacity
              style={styles.textButton}
              onPress={handleBackToHome}
              activeOpacity={0.8}
            >
              <Text style={styles.textButtonText}>
                {UI.buttons.backToHome[lang]}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loaderText: {
    marginTop: height * 0.02,
    fontSize: width * 0.04,
    color: '#64748B',
    fontWeight: '500',
    },
  discountText: {
    color: '#10B981',
    fontWeight: '600',
  },
  freeBadge: {
    backgroundColor: '#F59E0B', 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.015,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: width * 0.02,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  backArrow: { fontSize: width * 0.05, color: '#475569', fontWeight: '600' },
  headerTitle: {
    fontSize: width * 0.045,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
    textAlign: 'center',
    marginRight: width * 0.09,
  },
  headerSpacer: { width: width * 0.09 },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingBottom: height * 0.03 },
  contentContainer: {
    paddingHorizontal: width * 0.04,
    paddingTop: height * 0.02,
  },
  successIconContainer: {
    width: width * 0.2,
    height: width * 0.2,
    borderRadius: width * 0.1,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: height * 0.03,
    elevation: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    position: 'relative',
  },
  successIcon: { fontSize: width * 0.08, color: '#FFFFFF', fontWeight: 'bold' },
  successRing: {
    position: 'absolute',
    width: width * 0.24,
    height: width * 0.24,
    borderRadius: width * 0.12,
    borderWidth: 2,
    borderColor: '#10B981',
    opacity: 0.3,
  },
  mainTitle: {
    fontSize: width * 0.055,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: width * 0.07,
  },
  confirmationMessage: {
    fontSize: width * 0.04,
    color: '#64748B',
    textAlign: 'center',
    marginTop: height * 0.02,
    lineHeight: width * 0.055,
    fontWeight: '500',
  },
  subMessage: {
    fontSize: width * 0.035,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: height * 0.01,
    marginBottom: height * 0.03,
    lineHeight: width * 0.05,
  },
  paymentSuccessContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: width * 0.05,
    marginBottom: height * 0.025,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  paymentSuccessIcon: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: width * 0.06,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: height * 0.01,
  },
  paymentSuccessText: { fontSize: width * 0.06 },
  paymentSuccessLabel: {
    fontSize: width * 0.04,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 4,
  },
  paymentSuccessAmount: {
    fontSize: width * 0.045,
    fontWeight: '700',
    color: '#1E293B',
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: width * 0.05,
    marginBottom: height * 0.025,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: width * 0.045,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: height * 0.025,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: height * 0.02,
    paddingVertical: height * 0.005,
  },
  feeRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: height * 0.02,
    marginTop: height * 0.01,
  },
  detailLabel: {
    fontSize: width * 0.035,
    color: '#64748B',
    flex: 1,
    lineHeight: width * 0.05,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: width * 0.035,
    color: '#1E293B',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    lineHeight: width * 0.05,
  },
  doctorInfo: { flex: 1, alignItems: 'flex-end' },
  specialty: {
    fontSize: width * 0.03,
    color: '#64748B',
    marginTop: 2,
    fontStyle: 'italic',
  },
  modeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modeIcon: { fontSize: width * 0.035, marginRight: 4 },
  dateTimeContainer: { flex: 1, alignItems: 'flex-end' },
  timeValue: {
    fontSize: width * 0.035,
    color: '#1E293B',
    fontWeight: '600',
    marginTop: 2,
  },
  feeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  feeAmount: {
    fontSize: width * 0.04,
    color: '#1E293B',
    fontWeight: '700',
    marginRight: width * 0.02,
  },
  paidBadge: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: width * 0.025,
    paddingVertical: height * 0.005,
  },
  paidLabel: { fontSize: width * 0.03, color: '#FFFFFF', fontWeight: '600' },
  whatsNextContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: width * 0.05,
    marginBottom: height * 0.025,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  whatsNextTitle: {
    fontSize: width * 0.045,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: height * 0.02,
    textAlign: 'center',
  },
  nextStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: height * 0.015,
    paddingVertical: height * 0.01,
  },
  stepIcon: {
    width: width * 0.08,
    height: width * 0.08,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: width * 0.03,
    backgroundColor: '#FFFFFF',
    borderRadius: width * 0.04,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stepIconText: { fontSize: width * 0.04 },
  stepText: {
    fontSize: width * 0.035,
    color: '#475569',
    flex: 1,
    lineHeight: width * 0.05,
    fontWeight: '500',
  },
  buttonContainer: { gap: height * 0.015, marginTop: height * 0.01 },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: height * 0.018,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: width * 0.04,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: height * 0.018,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  secondaryButtonText: {
    color: '#475569',
    fontSize: width * 0.04,
    fontWeight: '600',
  },
  textButton: {
    backgroundColor: 'transparent',
    paddingVertical: height * 0.018,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textButtonText: {
    color: '#64748B',
    fontSize: width * 0.04,
    fontWeight: '600',
  },
});

export default BookingConfirmation;
