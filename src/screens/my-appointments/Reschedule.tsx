import React, { useCallback, useEffect, useState } from 'react';
import { AuthFetch, AuthPost, ENDPOINTS } from '../../services';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/navigationTypes';
import Toast from 'react-native-toast-message';
;
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

type RescheduleScreenRouteProp = RouteProp<RootStackParamList, 'Reschedule'>;

interface Slot {
  time: string;
  available: boolean;
  id: string;
  originalTime: string;
}

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Reschedule'>;
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
    success: { en: 'Success', hi: 'सफल', tel: 'విజయం' },
    dr: { en: 'Dr. ', hi: 'डॉ. ', tel: 'డా. ' },
    slots: { en: 'slots', hi: 'स्लॉट्स', tel: 'స్లాట్లు' },
    noSlots: { en: 'No slots available', hi: 'कोई स्लॉट उपलब्ध नहीं', tel: 'స్లాట్లు లభ్యం కావు' },
    checkAvailability: { en: 'Check availability', hi: 'उपलब्धता देखें', tel: 'అందుబాటు చూడండి' },
  },
  headerTitle: {
    en: 'Reschedule Appointment',
    hi: 'नियुक्ति पुनर्निर्धारित करें',
    tel: 'అపాయింట్‌మెంట్‌ని రీషెడ్యూల్ చేయండి',
  },
  doctorCard: {
    visitType: { en: 'In-Clinic Visit', hi: 'क्लिनिक में विज़िट', tel: 'క్లినిక్ సందర్శన' },
    hospital: { en: 'MedCare Health Centre', hi: 'मेडकेयर हेल्थ सेंटर', tel: 'మెడ్‌కేర్ హెల్త్ సెంటర్' },
  },
  sectionTitles: {
    selectNewDate: { en: 'Select New Date', hi: 'नई तारीख चुनें', tel: 'కొత్త తేదీని ఎంచుకోండి' },
  },
  calendar: {
    daysShort: {
      en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      hi: ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'],
      tel: ['ఆది', 'సోమ', 'మంగళ', 'బుధ', 'గురు', 'శుక్ర', 'శని'],
    },
    today: { en: 'Today', hi: 'आज', tel: 'ఈ రోజు' },
    tomorrow: { en: 'Tomorrow', hi: 'कल', tel: 'రేపు' },
  },
  time: {
    title: (count: number, lang: Lang) =>
      lang === 'hi'
        ? `कुल ${count} ${UI.common.slots.hi}`
        : lang === 'tel'
        ? `మొత్తం ${count} ${UI.common.slots.tel}`
        : `${count} ${UI.common.slots.en}`,
  },
  buttons: {
    confirm: { en: '✓ Confirm Reschedule', hi: '✓ पुनर्निर्धारण की पुष्टि करें', tel: '✓ రీషెడ్యూల్ నిర్ధారించండి' },
    cancel: { en: 'Cancel', hi: 'रद्द करें', tel: 'రద్దు చేయండి' },
  },
  alerts: {
    notLoggedIn: {
      en: 'You are not logged in. Please log in to reschedule your appointment.',
      hi: 'आप लॉग इन नहीं हैं। कृपया अपनी नियुक्ति को पुनर्निर्धारित करने के लिए लॉग इन करें।',
      tel: 'మీరు లాగిన్ కాలేదు. అపాయింట్‌మెంట్‌ను రీషెడ్యూల్ చేయడానికి లాగిన్ అవండి.',
    },
    fetchDoctorFailed: {
      en: 'Failed to fetch doctor details',
      hi: 'डॉक्टर विवरण प्राप्त करने में विफल',
      tel: 'డాక్టర్ వివరాలు పొందడంలో విఫలమైంది',
    },
    fetchClinicFailed: {
      en: 'Failed to fetch clinic details',
      hi: 'क्लिनिक विवरण प्राप्त करने में विफल',
      tel: 'క్లినిక్ వివరాలు పొందడంలో విఫలమైంది',
    },
    fetchSlotsFailed: {
      en: 'Failed to fetch slots',
      hi: 'स्लॉट प्राप्त करने में विफल',
      tel: 'స్లాట్లు పొందడంలో విఫలమైంది',
    },
    rescheduleSuccess: {
      en: 'Appointment rescheduled successfully',
      hi: 'नियुक्ति सफलतापूर्वक पुनर्निर्धारित की गई',
      tel: 'అపాయింట్‌మెంట్ విజయవంతంగా రీషెడ్యూల్ చేయబడింది',
    },
  },
  loadingSlots: {
    en: 'Loading time slots...',
    hi: 'समय स्लॉट लोड हो रहे हैं...',
    tel: 'టైమ్ స్లాట్లు లోడ్ అవుతున్నాయి...',
  },
  ok: {
    en: 'OK',
    hi: 'ठीक',
    tel: 'సరే',
  },
  experienceSuffix: {
    en: ' Years experience',
    hi: ' वर्ष का अनुभव',
    tel: ' సంవత్సరాల అనుభవం',
  },
  notSpecified: {
    en: 'Not specified',
    hi: 'निर्दिष्ट नहीं',
    tel: 'స్పష్టీకరించలేదు',
  },
  clinicNameLabel: {
    en: 'Clinic Name: ',
    hi: 'क्लिनिक का नाम: ',
    tel: 'క్లినిక్ పేరు: ',
  },
  rescheduleWarningTitle: {
    en: 'Please note',
    hi: 'कृपया ध्यान दें',
    tel: 'దయచేసి గమనించండి',
  },
  rescheduleWarningBody: {
    en: 'Rescheduling is not allowed within 2 hours of your appointment time .',
    hi: 'नियुक्ति के समय से 2 घंटे पहले पुनर्निर्धारण की अनुमति नहीं है।',
    tel: 'అపాయింట్‌మెంట్ సమయానికి 2 గంటల లోపు రీషెడ్యూల్ చేయడానికి అనుమతి లేదు.',
  },
};
/** ================================================================ */

const Reschedule: React.FC<Props> = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RescheduleScreenRouteProp>();
  const { appointment } = route.params;

  const currentUser = useSelector((state: any) => state.currentUser);
  const lang: Lang = normalizeLang(currentUser?.appLanguage);
  const insets = useSafeAreaInsets();

  const today = moment().format('DD-MM-YYYY');

  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedTime, setSelectedTime] = useState(appointment.time);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [consultationFee, setConsultationFee] = useState(0);
  const [clinicDetails, setClinicDetails] = useState<any>(null);
  const [loader, setLoader] = useState(false);
  const [doctorProfilePic, setDoctorProfilePic] = useState<any>(null);
  const [doctorDetails, setDoctorDetails] = useState<any>(null);

  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    const daysInMonth = currentMonth.daysInMonth();
    const firstDayOfMonth = moment(currentMonth).startOf('month');
    const firstDayWeekday = firstDayOfMonth.day();

    const days: Array<{ date: moment.Moment; isCurrentMonth: boolean }> = [];

    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      days.push({
        date: moment(firstDayOfMonth).subtract(i + 1, 'days'),
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: moment(currentMonth).date(i),
        isCurrentMonth: true,
      });
    }

    const remainingDays = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: moment(currentMonth).endOf('month').add(i, 'days'),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const fetchSlotsForDate = async (dateStr: string) => {
    const selectedDateMoment = moment(dateStr, ['DD-MM-YYYY', 'YYYY-MM-DD']).format('YYYY-MM-DD');

    try {
      setLoader(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await AuthFetch(
        ENDPOINTS.GET_SLOTS(appointment?.doctorId, selectedDateMoment, appointment?.clinicId),
        token
      );

      if (response.status !== 'success') {
        setAvailableSlots([]);
        Alert.alert(UI.common.error[lang], response?.message?.message || response?.data?.message || UI.alerts.fetchSlotsFailed[lang], [{ text: UI.ok[lang] }]);
        return;
      }

      const slotsData = response?.data?.data;
      const available: Slot[] = [];

      const selectedDay = moment(selectedDateMoment, 'YYYY-MM-DD');
      const isToday = moment().isSame(selectedDay, 'day');
      const now = moment();

      if (Array.isArray(slotsData?.slots)) {
        slotsData.slots.forEach((slot: any) => {
          const slotDateTime = moment(`${selectedDateMoment} ${slot.time}`, 'YYYY-MM-DD HH:mm');

          if (isToday && slotDateTime.isBefore(now)) return;

          if (slot.status === 'available') {
            available.push({
              time: slotDateTime.format('hh:mm A'),
              available: true,
              id: slot._id,
              originalTime: slot.time,
            });
          }
        });
      }

      setAvailableSlots(available);
    } catch (err) {
      console.error('Error fetching slots:', err);
      Toast.show({
        type: 'error',
        text1: UI.common.error[lang],
        text2: UI.alerts.fetchSlotsFailed[lang],
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    fetchSlotsForDate(selectedDate);
  }, [selectedDate]);

  // Fetch doctor profile picture and details
  const fetchDoctorProfilePic = async (doctorId: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!doctorId) return;
      
      const response = await AuthFetch(ENDPOINTS.GET_USER(doctorId), token);
      const userData = response?.data?.data;
      
      if (userData?.profilepic) {
        setDoctorProfilePic(userData.profilepic);
      }
      if (userData) {
        setDoctorDetails(userData);
      }
    } catch (error) {
      console.warn('Failed to fetch doctor profile picture:', error);
    }
  };

  useEffect(() => {
    const doctorDetails = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert(UI.common.error[lang], UI.alerts.notLoggedIn[lang]);
        return;
      }
      const response = await AuthFetch(ENDPOINTS.GET_USER(appointment.doctorId), token);
      if (response.status === 'success') {
        const doctor = response.data.data;
        setDoctorDetails(doctor);
        const fee = doctor.consultationModeFee.filter((f: any) => f.type === appointment.appointmentType);
        setConsultationFee(fee?.[0]?.fee ?? 0);
      } else {
        Alert.alert(UI.common.error[lang], response?.message?.message || response?.data?.message || UI.alerts.fetchDoctorFailed[lang]);
      }
    };

    const getClinicDetails = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert(UI.common.error[lang], UI.alerts.notLoggedIn[lang]);
        return;
      }
      const response = await AuthFetch(ENDPOINTS.GET_CLINIC_ADDRESS(appointment.doctorId), token);
      if (response.status === 'success') {
        const clinic = response.data.data;
        const selectedClinic = clinic.find((item: any) => item.addressId === appointment.addressId);
        setClinicDetails(selectedClinic);
      } else {
        Alert.alert(UI.common.error[lang], response?.message?.message || response?.data?.message || UI.alerts.fetchClinicFailed[lang]);
      }
    };

    getClinicDetails();
    doctorDetails();
    if (appointment?.doctorId) {
      fetchDoctorProfilePic(appointment.doctorId);
    }
  }, [appointment.addressId, appointment.appointmentType, appointment.doctorId, lang]);

  const formatTimeForAPI = useCallback((timeSlot) => {
    if (!timeSlot) return '';
    const [time, period] = timeSlot.split(' ');
    let [hours, minutes] = time.split(':');
    let h = parseInt(hours, 10);

    if (period === 'PM' && h !== 12) h += 12;
    else if (period === 'AM' && h === 12) h = 0;

    return `${h.toString().padStart(2, '0')}:${minutes}`;
  }, []);

  const rescheduleAppointment = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert(UI.common.error[lang], UI.alerts.notLoggedIn[lang]);
        return;
      }
      const selectedDateMoment = moment(selectedDate, ['DD-MM-YYYY', 'YYYY-MM-DD']).format('YYYY-MM-DD');

      const rescheduleData = {
        appointmentId: appointment.appointmentId,
        newDate: selectedDateMoment,
        newTime: formatTimeForAPI(selectedTime),
        reason: '',
      };

      const response = await AuthPost(ENDPOINTS.RESCHEDULE_APPOINTMENT, rescheduleData, token);

      if (response.status === 'success') {
        const appt = response?.data?.appointmentDetails;
        Alert.alert(UI.common.success[lang], response?.data?.message || UI.alerts.rescheduleSuccess[lang], [{ text: 'OK' }]);
        navigation.navigate('BookingConfirmation', {
          appointmentDetails: appt,
          paymentDetails: response?.data?.paymentDetails || {},
        });
      } else {
        Toast.show({
          type: 'error',
          text1: UI.common.error[lang],
          text2: response?.message?.message || response?.data?.message || UI.alerts.fetchSlotsFailed[lang],
          position: 'top',
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
    }
  };

  const handleConfirmReschedule = () => {
    rescheduleAppointment();
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  // Quick dates (localized labels)
  const quickDates = [
    {
      label: `${UI.calendar.today[lang]}, ${moment().format('DD MMM')}`,
      subtitle:
        availableSlots.length > 0
          ? `${availableSlots.length} ${UI.common.slots[lang]}`
          : UI.common.noSlots[lang],
      date: moment().format('DD-MM-YYYY'),
      available: true,
    },
    {
      label: `${UI.calendar.tomorrow[lang]}, ${moment().add(1, 'days').format('DD MMM')}`,
      subtitle: UI.common.checkAvailability[lang],
      date: moment().add(1, 'days').format('DD-MM-YYYY'),
      available: true,
    },
    {
      label: `${moment().add(2, 'days').format('ddd, DD MMM')}`,
      subtitle: UI.common.checkAvailability[lang],
      date: moment().add(2, 'days').format('DD-MM-YYYY'),
      available: true,
    },
  ];

  const renderTimeSlot = (time: Slot, isSelected: boolean = false) => (
    <TouchableOpacity
      key={time.id}
      style={[
        styles.timeSlotButton,
        isSelected && styles.selectedTimeSlot,
      ]}
      onPress={() => setSelectedTime(time.time)}
    >
      <Text style={[
        styles.timeSlotText,
        isSelected && styles.selectedTimeSlotText
      ]}>
        {time.time}
      </Text>
    </TouchableOpacity>
  );

  const renderCalendarDay = (day: { date: moment.Moment; isCurrentMonth: boolean }) => {
    const isSelected = selectedDate === day.date.format('DD-MM-YYYY');
    const isToday = moment().isSame(day.date, 'day');
    const isPastDate = day.date.isBefore(moment(), 'day');

    return (
      <TouchableOpacity
        key={day.date.format('YYYY-MM-DD')}
        style={[
          styles.calendarDay,
          !day.isCurrentMonth && styles.otherMonthDay,
          isSelected && styles.selectedCalendarDay,
          isToday && styles.todayCalendarDay,
          isPastDate && styles.pastDateDay, 
        ]}
        onPress={() => {
          if (day.isCurrentMonth && !isPastDate) {
            setSelectedDate(day.date.format('DD-MM-YYYY'));
            setIsCalendarVisible(false);
          }
        }}
        disabled={!day.isCurrentMonth || isPastDate} 
      >
        <Text
          style={[
            styles.calendarDayText,
            !day.isCurrentMonth && styles.otherMonthDayText,
            isSelected && styles.selectedCalendarDayText,
            isToday && styles.todayCalendarDayText,
            isPastDate && styles.pastDateDayText,
          ]}
        >
          {day.date.format('D')}
        </Text>
      </TouchableOpacity>
    );
  };

  const getAvatarSource = (profilepic: any) => {
    if (!profilepic) return null;

    try {
      if (typeof profilepic === 'string' && profilepic.startsWith('http')) {
        return { uri: profilepic };
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const getAvatarInitial = () => {
    return (appointment?.doctorName?.[0] || '').toUpperCase();
  };

  const handlePrevMonth = () => setCurrentMonth(moment(currentMonth).subtract(1, 'month'));
  const handleNextMonth = () => setCurrentMonth(moment(currentMonth).add(1, 'month'));
  const toggleCalendar = () => setIsCalendarVisible(!isCalendarVisible);

  const avatarSource = getAvatarSource(doctorProfilePic);
  
  // Experience text like in reference code
  const expText = 
    (doctorDetails?.specialty?.experience || UI.notSpecified[lang]) + UI.experienceSuffix[lang];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Doctor Card */}
        <View style={styles.doctorCard}>
          <View style={styles.doctorImageContainer}>
            <View style={styles.avatar}>
              {avatarSource ? (
                <Image
                  source={avatarSource}
                  style={styles.avatarImage}
                  resizeMode="cover"
                  onError={() => console.log('Failed to load profile image')}
                />
              ) : (
                <Text style={styles.avatarText}>{getAvatarInitial()}</Text>
              )}
            </View>
          </View>
          <View style={styles.doctorDetails}>
            <Text style={styles.doctorName}>
              {appointment.doctorName?.startsWith('Dr. ') || appointment.doctorName?.startsWith('डॉ. ') || appointment.doctorName?.startsWith('డా. ') 
                ? appointment.doctorName 
                : `${UI.common.dr[lang]}${appointment.doctorName}`
              }
            </Text>
            <Text style={styles.doctorSpecialty}>
              {appointment.appointmentDepartment || 'Cardio thoracic surgeon'}
            </Text>
            <Text style={styles.doctorExperience}>{expText}</Text>
            <Text style={styles.clinicName}>
              {UI.clinicNameLabel[lang]}
              {clinicDetails?.clinicName || UI.doctorCard.hospital[lang]}
            </Text>
            <View style={styles.locationContainer}>
              <Text style={styles.locationText}>{clinicDetails?.address || ''}</Text>
              <Text style={styles.locationIcon}>📍</Text>
            </View>
          </View>
        </View>

        {/* Polished warning banner */}
        <View style={styles.warningBanner}>
          <View style={styles.warningIconBox}>
            <Text style={styles.warningIconText}>!!!</Text>
          </View>
          <View style={styles.warningTextBox}>
            <Text style={styles.warningTitle}>{UI.rescheduleWarningTitle[lang]}</Text>
            <Text style={styles.warningBody}>{UI.rescheduleWarningBody[lang]}</Text>
          </View>
        </View>

        {/* Date Selection Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{UI.sectionTitles.selectNewDate[lang]}</Text>
            <TouchableOpacity style={styles.calendarButton} onPress={toggleCalendar}>
              <Text style={styles.calendarIcon}>🗓</Text>
              <Text style={styles.selectText}>Select</Text>
            </TouchableOpacity>
          </View>

          {isCalendarVisible && (
            <>
              <View style={styles.dateNavigation}>
                <TouchableOpacity style={styles.navButton} onPress={handlePrevMonth}>
                  <Text style={styles.navButtonText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.currentMonth}>{currentMonth.format('MMMM YYYY')}</Text>
                <TouchableOpacity style={styles.navButton} onPress={handleNextMonth}>
                  <Text style={styles.navButtonText}>›</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.calendarHeader}>
                {UI.calendar.daysShort[lang].map((day) => (
                  <Text key={day} style={styles.calendarHeaderText}>{day}</Text>
                ))}
              </View>

              <View style={styles.calendarGrid}>
                {generateCalendarDays().map((day) => renderCalendarDay(day))}
              </View>
            </>
          )}

          <View style={styles.dateOptions}>
            {quickDates.map((date, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dateOption,
                  selectedDate === date.date && styles.selectedDateOption,
                ]}
                onPress={() => setSelectedDate(date.date)}
              >
                <Text
                  style={[
                    styles.dateOptionText,
                    selectedDate === date.date && styles.selectedDateOptionText,
                  ]}
                >
                  {date.label}
                </Text>
                <Text
                  style={[
                    styles.dateOptionSubtitle,
                    selectedDate === date.date && styles.selectedDateOptionSubtitle,
                  ]}
                >
                  {date.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Selected Date Display */}
        <View style={styles.selectedDateDisplay}>
          <Text style={styles.selectedDateText}>
            {moment(selectedDate, 'DD-MM-YYYY').format('dddd, DD MMM')}
          </Text>
        </View>

        {/* Time Slots Section */}
        <View style={styles.timeSlotsContainer}>
          {loader ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color="#1F2937" />
              <Text style={styles.loaderText}>{UI.loadingSlots[lang]}</Text>
            </View>
          ) : (
            <View style={styles.timeSlotSection}>
              <Text style={styles.timeSlotSectionTitle}>
                {UI.time.title(availableSlots.length, lang)}
              </Text>
              <View style={styles.timeSlotGrid}>
                {availableSlots.map((t) => renderTimeSlot(t, t.time === selectedTime))}
              </View>
            </View>
          )}
        </View>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Footer Buttons */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: Platform.OS === 'android' ? 
              Math.max(insets.bottom, SAFE_AREA.safeBottom) + SPACING.xs : 
              insets.bottom,
          },
        ]}
      >
        <TouchableOpacity 
          style={styles.confirmButton} 
          onPress={handleConfirmReschedule}
        >
          <Text style={styles.confirmButtonText}>{UI.buttons.confirm[lang]}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>{UI.buttons.cancel[lang]}</Text>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SAFE_AREA.safeBottom + SPACING.xl,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: responsiveHeight(20),
  },
  loaderText: {
    marginTop: SPACING.sm,
    fontSize: moderateScale(14),
    color: '#6B7280',
  },
  pastDateDay: {
    backgroundColor: '#F3F4F6',
    opacity: 0.5,
  },
  pastDateDayText: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through', 
  },

  // ── Polished warning banner ─────────────────────────────────────────────
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    // borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    borderRadius: LAYOUT.borderRadius.md,
    marginHorizontal: isTablet ? SPACING.lg : SPACING.md,
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  warningIconBox: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(8),
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  warningIconText: {
    fontSize: moderateScale(16),
    lineHeight: moderateScale(20),
    fontStyle:"italic"
  },
  warningTextBox: {
    flex: 1,
  },
  warningTitle: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#92400E',
    marginBottom: moderateScale(2),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  warningBody: {
    fontSize: moderateScale(12),
    color: '#78350F',
    lineHeight: moderateScale(17),
    fontWeight: '400',
    fontStyle:"italic"
  },
  // ────────────────────────────────────────────────────────────────────────

  // Doctor Card Styles - EXACT SAME as reference
  doctorCard: {
    flexDirection: 'row', 
    backgroundColor: '#FFFFFF', 
    marginHorizontal: isTablet ? SPACING.lg : SPACING.md, 
    marginVertical: SPACING.md,
    borderRadius: LAYOUT.borderRadius.lg, 
    padding: isTablet ? SPACING.lg : SPACING.md, 
    ...LAYOUT.shadow.md,
  },
  doctorImageContainer: { 
    marginRight: SPACING.md 
  },
  doctorDetails: { 
    flex: 1, 
    justifyContent: 'flex-start' 
  },
  doctorName: { 
    fontSize: moderateScale(16),
    fontWeight: '600', 
    color: '#1F2937', 
    marginBottom: SPACING.xs 
  },
  doctorSpecialty: { 
    fontSize: moderateScale(14), 
    color: '#6B7280', 
    marginBottom: SPACING.xs 
  },
  doctorExperience: { 
    fontSize: moderateScale(12), 
    color: '#6B7280', 
    marginBottom: SPACING.xs 
  },
  clinicName: { 
    fontSize: moderateScale(12), 
    color: '#6B7280', 
    marginBottom: SPACING.xxs 
  },
  locationContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: SPACING.xs 
  },
  locationText: { 
    fontSize: moderateScale(12), 
    color: '#2563EB', 
    marginRight: SPACING.xs,
    flex: 1,
  },
  locationIcon: { 
    fontSize: moderateScale(12) 
  },
  avatar: {
    width: isTablet ? moderateScale(50) : moderateScale(44),
    height: isTablet ? moderateScale(50) : moderateScale(44),
    borderRadius: isTablet ? moderateScale(25) : moderateScale(22),
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: isTablet ? moderateScale(25) : moderateScale(22),
  },
  avatarText: {
    fontSize: moderateScale(isTablet ? 16 : 14),
    fontWeight: '600',
    color: '#1976d2',
  },

  // Section wrapper for calendar & quick dates
  section: {
    backgroundColor: '#EDFFF7', 
    marginHorizontal: isTablet ? SPACING.lg : SPACING.md, 
    marginTop: SPACING.sm, 
    borderRadius: LAYOUT.borderRadius.lg, 
    padding: isTablet ? SPACING.lg : SPACING.md,
    ...LAYOUT.shadow.sm,
  },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: SPACING.md 
  },
  sectionTitle: { 
    fontSize: moderateScale(16), 
    fontWeight: '600', 
    color: '#1F2937' 
  },

  calendarButton: { 
    marginLeft: SPACING.sm, 
    padding: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: LAYOUT.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  calendarIcon: { 
    fontSize: moderateScale(16), 
    color: '#374151',
    marginRight: SPACING.xs,
  },
  selectText: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    color: '#374151',
  },

  dateNavigation: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  navButton: { 
    padding: SPACING.xs 
  },
  navButtonText: { 
    fontSize: moderateScale(18), 
    color: '#6B7280' 
  },
  currentMonth: { 
    fontSize: moderateScale(14), 
    fontWeight: '500', 
    color: '#1F2937', 
    marginHorizontal: SPACING.md 
  },

  calendarHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: SPACING.sm 
  },
  calendarHeaderText: { 
    flex: 1, 
    textAlign: 'center', 
    fontSize: moderateScale(12), 
    fontWeight: '600', 
    color: '#6B7280' 
  },

  calendarGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginBottom: SPACING.md 
  },
  calendarDay: {
    width: `${100 / 7}%`, 
    aspectRatio: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: SPACING.xs, 
    borderRadius: LAYOUT.borderRadius.sm, 
    margin: 1, 
    backgroundColor: '#F9FAFB',
  },
  otherMonthDay: { 
    backgroundColor: '#E5E7EB', 
    opacity: 0.5 
  },
  selectedCalendarDay: { 
    backgroundColor: '#00203F' 
  },
  todayCalendarDay: { 
    borderWidth: 2, 
    borderColor: '#1E40AF' 
  },
  calendarDayText: { 
    fontSize: moderateScale(12), 
    fontWeight: '500', 
    color: '#1F2937' 
  },
  otherMonthDayText: { 
    color: '#9CA3AF' 
  },
  selectedCalendarDayText: { 
    color: '#FFFFFF' 
  },
  todayCalendarDayText: { 
    color: '#1F2937' 
  },

  dateOptions: { 
    flexDirection: 'row', 
    gap: SPACING.sm 
  },
  dateOption: { 
    flex: 1, 
    backgroundColor: '#F9FAFB', 
    padding: SPACING.sm, 
    borderRadius: LAYOUT.borderRadius.md, 
    alignItems: 'center' 
  },
  selectedDateOption: { 
    backgroundColor: '#00203F' 
  },
  dateOptionText: { 
    fontSize: moderateScale(12), 
    fontWeight: '500', 
    color: '#1F2937', 
    marginBottom: SPACING.xxs,
    textAlign: 'center',
  },
  selectedDateOptionText: { 
    color: '#FFFFFF' 
  },
  dateOptionSubtitle: { 
    fontSize: moderateScale(10), 
    color: '#6B7280',
    textAlign: 'center',
  },
  selectedDateOptionSubtitle: { 
    color: '#E5E7EB' 
  },

  // Selected Date Display
  selectedDateDisplay: { 
    alignItems: 'center', 
    paddingVertical: SPACING.md 
  },
  selectedDateText: { 
    fontSize: moderateScale(16), 
    fontWeight: '600', 
    color: '#1F2937' 
  },

  // Time Slots
  timeSlotsContainer: { 
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md, 
    backgroundColor: '#EDFFF7' 
  },
  timeSlotSection: { 
    marginBottom: SPACING.lg 
  },
  timeSlotSectionTitle: { 
    fontSize: moderateScale(16), 
    fontWeight: '600', 
    color: '#1F2937', 
    marginBottom: SPACING.md 
  },
  timeSlotGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: SPACING.sm,
  },
  timeSlotButton: {
    minWidth: responsiveWidth(28),
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: '#DAEDE8',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8F4FD',
    flexGrow: 1,
    flexBasis: '30%',
  },
  selectedTimeSlot: { 
    backgroundColor: '#00203F', 
    borderColor: '#00203F' 
  },
  timeSlotText: { 
    fontSize: moderateScale(12), 
    fontWeight: '600', 
    color: '#1E40AF' 
  },
  selectedTimeSlotText: { 
    color: '#FFFFFF' 
  },

  // Footer with Buttons
  footer: {
    position: 'absolute',
    bottom: 0,
    left: isTablet ? SPACING.lg : SPACING.md,
    right: isTablet ? SPACING.lg : SPACING.md,
    backgroundColor: 'transparent',
    paddingTop: SPACING.sm,
  },
  confirmButton: {
    backgroundColor: '#00203F',
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: isTablet ? SPACING.md : SPACING.sm,
    alignItems: 'center',
    ...LAYOUT.shadow.md,
    minHeight: LAYOUT.buttonHeight,
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: isTablet ? SPACING.md : SPACING.sm,
    alignItems: 'center',
    ...LAYOUT.shadow.sm,
    minHeight: LAYOUT.buttonHeight,
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
  bottomSpacing: { 
    height: SPACING.xl 
  },
});

export default Reschedule;