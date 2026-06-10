import React, { useState, useEffect, useCallback } from 'react';
import { AuthFetch, ENDPOINTS } from '../../services';
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
  Dimensions,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/navigationTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import Toast from 'react-native-toast-message';
;
import { useSelector } from 'react-redux';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallScreen = SCREEN_HEIGHT < 700;

type DateSelectionRouteProp = RouteProp<RootStackParamList, 'DateSelection'>;

interface Slot {
  time: string;
  available: boolean;
  id: string;
  originalTime?: string;
  reason?: string;
}

interface DateSelectionProps {
  navigation: StackNavigationProp<RootStackParamList, 'DateSelection'>;
  route: DateSelectionRouteProp;
}

type Lang = 'en' | 'hi' | 'tel';
const normalizeLang = (l?: string): Lang => {
  if (l === 'en' || l === 'hi' || l === 'tel') return l;
  if (l === 'te') return 'tel';
  return 'en';
};

const TR = {
  headerTitle: { en: 'Select Time', hi: 'समय चुनें', tel: 'సమయాన్ని ఎంచుకోండి' },
  doctor: {
    yearsExperience: { en: 'Years experience', hi: 'वर्षों का अनुभव', tel: 'సంవత్సరాల అనుభవం' },
    clinicName: { en: 'Clinic Name', hi: 'क्लिनिक का नाम', tel: 'క్లినిక్ పేరు' },
    healthCenter: { en: 'Health Center', hi: 'हेल्थ सेंटर', tel: 'హెల్త్ సెంటర్' },
  },
  currentAppointment: {
    title: { en: 'Current Appointment', hi: 'वर्तमान नियुक्ति', tel: 'ప్రస్తుతం అపాయింట్‌మెంట్' },
    bookingId: { en: 'Booking ID', hi: 'बुकिंग आईडी', tel: 'బుకింగ్ ఐడి' },
  },
  dateSection: {
    selectNewDate: { en: 'Select New Date', hi: 'नई तारीख चुनें', tel: 'కొత్త తేదీని ఎంచుకోండి' },
    weekdays: {
      en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      hi: ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'],
      tel: ['ఆది', 'సోమ', 'మంగళ', 'బుధ', 'గురు', 'శుక్ర', 'శని'],
    },
    today: { en: 'Today', hi: 'आज', tel: 'ఈరోజు' },
    tomorrow: { en: 'Tomorrow', hi: 'कल', tel: 'రేపు' },
    slotsAvailable: (n: number) => ({
      en: `${n} slots`,
      hi: `${n} स्लॉट`,
      tel: `${n} స్లాట్లు`,
    }),
    checkAvailability: { en: 'Check', hi: 'जाँचें', tel: 'చూడండి' },
  },
  slots: {
    availableTitle: (n: number) => ({
      en: `Available Slots (${n})`,
      hi: `उपलब्ध स्लॉट (${n})`,
      tel: `లభ్యమైన స్లాట్లు (${n})`,
    }),
    none: { en: 'No slots available', hi: 'कोई स्लॉट उपलब्ध नहीं', tel: 'స్లాట్లు లభ్యం కావు' },
  },
  continue: { en: 'Continue', hi: 'जारी रखें', tel: 'కొనసాగించండి' },
  errors: {
    generic: { en: 'Error', hi: 'त्रुटि', tel: 'లోపం' },
    loginNeeded: {
      en: 'You are not logged in. Please log in to continue.',
      hi: 'आप लॉग इन नहीं हैं। जारी रखने के लिए कृपया लॉग इन करें।',
      tel: 'మీరు లాగిన్ కాలేదు. కొనసాగడానికి దయచేసి లాగిన్ అవ్వండి.',
    },
    fetchSlotsFailed: {
      en: 'Failed to fetch slots',
      hi: 'स्लॉट प्राप्त करने में विफल',
      tel: 'స్లాట్లను పొందడంలో విఫలమైంది',
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
  },
};

const DateSelection: React.FC<DateSelectionProps> = ({ route, navigation }) => {
  const { appointment } = route.params;
  const { appLanguage } = useSelector((s: any) => s.currentUser || {});
  const lang: Lang = normalizeLang(appLanguage);

  const [selectedDate, setSelectedDate] = useState<string>(moment().format('YYYY-MM-DD'));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [unAvailableSlots, setUnAvailableSlots] = useState<Slot[]>([]);
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [consultationFee, setConsultationFee] = useState(0);
  const [clinicDetails, setClinicDetails] = useState<any>({});
  const [doctordetails, setDoctordetails] = useState<any>({});

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
      return 'Date error';
    }
  };

  const renderCalendarDay = (day: { date: moment.Moment; isCurrentMonth: boolean }) => {
    const isSelected = selectedDate === day.date.format('YYYY-MM-DD');
    const isToday = moment().isSame(day.date, 'day');
    return (
      <TouchableOpacity
        key={day.date.format('YYYY-MM-DD')}
        style={[
          styles.calendarDay,
          !day.isCurrentMonth && styles.otherMonthDay,
          isSelected && styles.selectedCalendarDay,
          isToday && styles.todayCalendarDay,
        ]}
        onPress={() => {
          if (day.isCurrentMonth) {
            setSelectedDate(day.date.format('YYYY-MM-DD'));
            setIsCalendarVisible(false);
          }
        }}
        disabled={!day.isCurrentMonth}
      >
        <Text
          style={[
            styles.calendarDayText,
            !day.isCurrentMonth && styles.otherMonthDayText,
            isSelected && styles.selectedCalendarDayText,
            isToday && styles.todayCalendarDayText,
          ]}
        >
          {day.date.format('D')}
        </Text>
      </TouchableOpacity>
    );
  };

  const handlePrevMonth = () => setCurrentMonth(moment(currentMonth).subtract(1, 'month'));
  const handleNextMonth = () => setCurrentMonth(moment(currentMonth).add(1, 'month'));
  const toggleCalendar = () => setIsCalendarVisible(!isCalendarVisible);

  const generateCalendarDays = () => {
    const daysInMonth = currentMonth.daysInMonth();
    const firstDayOfMonth = moment(currentMonth).startOf('month');
    const firstDayWeekday = firstDayOfMonth.day();
    const days: Array<{ date: moment.Moment; isCurrentMonth: boolean }> = [];
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      days.push({ date: moment(firstDayOfMonth).subtract(i + 1, 'days'), isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: moment(currentMonth).date(i), isCurrentMonth: true });
    }
    const remainingDays = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: moment(currentMonth).endOf('month').add(i, 'days'), isCurrentMonth: false });
    }
    return days;
  };

  const fetchSlotsForDate = async (date: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await AuthFetch(
        ENDPOINTS.GET_SLOTS(appointment?.doctorId, date, appointment?.clinicId),
        token
      );
      if (response.status !== 'success') {
        setUnAvailableSlots([]);
        setAvailableSlots([]);
        Toast.show({
          type: 'error',
          text1: TR.errors.generic[lang],
          text2: response?.message?.message || response?.data?.message || TR.errors.fetchSlotsFailed[lang],
          position: 'top',
          visibilityTime: 3000,
        });
      } else {
        const slotsData = response?.data?.data;
        const available: Slot[] = [];
        const unavailable: Slot[] = [];
        const isToday = moment().isSame(date, 'day');
        const currentTime = moment();
        if (slotsData?.slots && Array.isArray(slotsData.slots)) {
          slotsData.slots.forEach((slot: any) => {
            const slotTime = moment(slot.time, 'HH:mm');
            const timeStr = slotTime.format('hh:mm A');
            if (isToday && slotTime.isBefore(currentTime)) return;
            if (slot.status === 'available') {
              available.push({ time: timeStr, available: true, id: slot._id, originalTime: slot.time });
            } else {
              unavailable.push({ time: timeStr, available: false, id: slot._id, reason: slot.reason || 'Not available', originalTime: slot.time });
            }
          });
        }
        setAvailableSlots(available);
        setUnAvailableSlots(unavailable);
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: TR.errors.generic[lang], text2: TR.errors.fetchSlotsFailed[lang], position: 'top', visibilityTime: 3000 });
    }
  };

  useEffect(() => {
    const doctorDetails = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) { Alert.alert(TR.errors.generic[lang], TR.errors.loginNeeded[lang]); return; }
      const response = await AuthFetch(ENDPOINTS.GET_USER(appointment?.doctorId), token);
      if (response.status === 'success') {
        const doctor = response.data.data;
        setDoctordetails(doctor);
        const fee = doctor?.consultationModeFee?.filter((f: any) => f.type === appointment?.appointmentType);
        setConsultationFee(fee);
      } else {
        Alert.alert(TR.errors.generic[lang], response?.message?.message || response?.data?.message || TR.errors.fetchDoctorFailed[lang]);
      }
    };
    const getClinicDetails = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) { Alert.alert(TR.errors.generic[lang], TR.errors.loginNeeded[lang]); return; }
      const response = await AuthFetch(ENDPOINTS.GET_CLINIC_ADDRESS(appointment?.doctorId), token);
      if (response.status === 'success') {
        const clinic = response?.data?.data;
        const selectedClinic = clinic.find((item: any) => item.addressId === appointment?.clinicId);
        setClinicDetails(selectedClinic);
      } else {
        Alert.alert(TR.errors.generic[lang], response?.message?.message || response?.data?.message || TR.errors.fetchClinicFailed[lang]);
      }
    };
    getClinicDetails();
    doctorDetails();
  }, [lang]);

  useEffect(() => {
    fetchSlotsForDate(selectedDate);
  }, [selectedDate]);

  const handleConfirm = () => {
    if (selectedDate && selectedTimeSlot) {
      const getSpecialtyString = (specialty: any): string => {
        if (!specialty) return '';
        if (typeof specialty === 'string') return specialty;
        if (typeof specialty === 'object') return specialty.name || specialty.specialty || '';
        return '';
      };
      navigation.navigate('Payment', {
        doctor: {
          id: doctordetails.id,
          doctorId: doctordetails.userId,
          name: doctordetails.firstname,
          specialty: getSpecialtyString(doctordetails.specialization),
          consultationFee: doctordetails.consultationModeFee,
          addresses: doctordetails?.addresses,
        },
        date: selectedDate,
        time: selectedTimeSlot,
        patient: { name: appointment.patientName, userId: appointment.userId },
        clinic: clinicDetails,
        appointmentId: appointment.appointmentId,
        mode: appointment.appointmentType,
      });
    }
  };

  const getSpecialtyDisplay = (specialty: any): string => {
    if (!specialty) return '';
    if (typeof specialty === 'string') return specialty;
    if (typeof specialty === 'object') return specialty.name || specialty.specialty || '';
    return '';
  };

  const handleTimeSlotSelect = (time: string) => setSelectedTimeSlot(time);
  const goBack = () => navigation.goBack();

  const quickDates = [
    {
      label: `${TR.dateSection.today[lang]}, ${moment().format('DD MMM')}`,
      subtitle: availableSlots.length > 0 ? TR.dateSection.slotsAvailable(availableSlots.length)[lang] : TR.slots.none[lang],
      date: moment().format('YYYY-MM-DD'),
      available: availableSlots.length > 0,
    },
    {
      label: `${TR.dateSection.tomorrow[lang]}, ${moment().add(1, 'days').format('DD MMM')}`,
      subtitle: TR.dateSection.checkAvailability[lang],
      date: moment().add(1, 'days').format('YYYY-MM-DD'),
      available: true,
    },
    {
      label: `${moment().add(2, 'days').format('ddd, DD MMM')}`,
      subtitle: TR.dateSection.checkAvailability[lang],
      date: moment().add(2, 'days').format('YYYY-MM-DD'),
      available: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Compact Doctor Card */}
      <View style={styles.doctorCard}>
        <View style={styles.doctorAvatar}>
          <Text style={styles.doctorAvatarText}>
            {appointment.doctorName
              ? appointment.doctorName.split(' ').map((n: string) => n[0]).join('').toUpperCase()
              : 'DK'}
          </Text>
        </View>
        <View style={styles.doctorDetails}>
          <Text style={styles.doctorName} numberOfLines={1}>{appointment.doctorName || 'Dr. Karthik'}</Text>
          <Text style={styles.doctorSpecialty} numberOfLines={1}>
            {getSpecialtyDisplay(appointment?.appointmentDepartment || doctordetails?.specialization)}
          </Text>
          <Text style={styles.doctorExperience} numberOfLines={1}>
            Type: {appointment?.appointmentType || 'Not Specified'}
          </Text>
        </View>
      </View>

      {/* Compact Current Appointment */}
      <View style={styles.currentAppointment}>
        <Text style={styles.currentAppointmentTitle}>{TR.currentAppointment.title[lang]}</Text>
        <View style={styles.appointmentRow}>
          <Text style={styles.appointmentDate}>
            📅 {formatDate(appointment?.date || appointment?.appointmentDate)}
          </Text>
          <Text style={styles.appointmentTime}>🕒 {appointment.time}</Text>
          <Text style={styles.bookingId} numberOfLines={1}>
            #{appointment.appointmentId}
          </Text>
        </View>
      </View>

      {/* Date Picker — compact */}
      <View style={styles.dateSection}>
        <View style={styles.dateSectionHeader}>
          <Text style={styles.sectionTitle}>{TR.dateSection.selectNewDate[lang]}</Text>
          <TouchableOpacity style={styles.calendarButton} onPress={toggleCalendar}>
            <Text style={styles.calendarIcon}>📅</Text>
          </TouchableOpacity>
        </View>

        {isCalendarVisible && (
          <View style={styles.calendarWrapper}>
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
              {TR.dateSection.weekdays[lang].map((d) => (
                <Text key={d} style={styles.calendarHeaderText}>{d}</Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {generateCalendarDays().map((day) => renderCalendarDay(day))}
            </View>
          </View>
        )}

        <View style={styles.dateOptions}>
          {quickDates.map((date, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateOption,
                selectedDate === date.date && styles.selectedDateOption,
                !date.available && styles.disabledDateOption,
              ]}
              onPress={() => date.available && setSelectedDate(date.date)}
              disabled={!date.available}
            >
              <Text
                style={[
                  styles.dateOptionText,
                  selectedDate === date.date && styles.selectedDateOptionText,
                  !date.available && styles.disabledDateOptionText,
                ]}
                numberOfLines={2}
              >
                {date.label}
              </Text>
              <Text
                style={[
                  styles.dateOptionSubtitle,
                  selectedDate === date.date && styles.selectedDateOptionSubtitle,
                  !date.available && styles.disabledDateOptionSubtitle,
                ]}
                numberOfLines={1}
              >
                {date.subtitle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Time Slots — scrollable, fills remaining space */}
      <ScrollView
        style={styles.timeSlotsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.timeSlotsContent}
      >
        {availableSlots.length > 0 ? (
          <View style={styles.timeSlotSection}>
            <Text style={styles.timeSlotSectionTitle}>
              {TR.slots.availableTitle(availableSlots.length)[lang]}
            </Text>
            <View style={styles.timeSlotGrid}>
              {availableSlots.map((slot, index) => (
                <TouchableOpacity
                  key={`available-${index}`}
                  style={[
                    styles.timeSlotButton,
                    selectedTimeSlot === slot.time && styles.selectedTimeSlot,
                  ]}
                  onPress={() => handleTimeSlotSelect(slot.time)}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      selectedTimeSlot === slot.time && styles.selectedTimeSlotText,
                    ]}
                  >
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.noSlotsContainer}>
            <Text style={styles.noSlotsText}>{TR.slots.none[lang]}</Text>
          </View>
        )}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.continueButtonContainer}>
        <TouchableOpacity
          style={[styles.continueButton, !selectedTimeSlot && styles.continueButtonDisabled]}
          onPress={handleConfirm}
          disabled={!selectedTimeSlot}
        >
          <Text style={[styles.continueButtonText, !selectedTimeSlot && styles.continueButtonTextDisabled]}>
            {TR.continue[lang]}
          </Text>
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

  /* ── Doctor Card: horizontal, compact ── */
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 6,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00203F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  doctorAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 2,
  },
  doctorSpecialty: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 1,
  },
  doctorExperience: {
    fontSize: 11,
    color: '#888888',
  },

  /* ── Current Appointment: single row ── */
  currentAppointment: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  currentAppointmentTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  appointmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  appointmentDate: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
  },
  appointmentTime: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
  },
  bookingId: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 'auto',
  },

  /* ── Date Section ── */
  dateSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  calendarButton: {
    padding: 4,
  },
  calendarIcon: {
    fontSize: 18,
  },

  /* Calendar (shown on toggle) */
  calendarWrapper: {
    marginBottom: 8,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  navButton: { padding: 4 },
  navButtonText: { fontSize: 18, color: '#6B7280' },
  currentMonth: { fontSize: 13, fontWeight: '500', color: '#111827', marginHorizontal: 12 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  calendarHeaderText: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: '#6B7280' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  otherMonthDay: { opacity: 0.3 },
  selectedCalendarDay: { backgroundColor: '#00203F' },
  todayCalendarDay: { borderWidth: 1.5, borderColor: '#1E40AF' },
  calendarDayText: { fontSize: 12, fontWeight: '500', color: '#111827' },
  otherMonthDayText: { color: '#9CA3AF' },
  selectedCalendarDayText: { color: '#FFFFFF' },
  todayCalendarDayText: { color: '#111827' },

  /* Quick date chips */
  dateOptions: {
    flexDirection: 'row',
    gap: 6,
  },
  dateOption: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedDateOption: { backgroundColor: '#00203F' },
  disabledDateOption: { opacity: 0.5 },
  dateOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
    textAlign: 'center',
  },
  selectedDateOptionText: { color: '#FFFFFF' },
  disabledDateOptionText: { color: '#9CA3AF' },
  dateOptionSubtitle: { fontSize: 10, color: '#6B7280', textAlign: 'center' },
  selectedDateOptionSubtitle: { color: '#E5E7EB' },
  disabledDateOptionSubtitle: { color: '#9CA3AF' },

  /* ── Time Slots (fills remaining height) ── */
  timeSlotsContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  timeSlotsContent: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  timeSlotSection: {
    marginBottom: 8,
  },
  timeSlotSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 10,
  },
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlotButton: {
    width: '30%',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#DAEDE8',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C3DDD7',
  },
  selectedTimeSlot: { backgroundColor: '#00203F', borderColor: '#00203F' },
  timeSlotText: { fontSize: 13, fontWeight: '600', color: '#1E40AF' },
  selectedTimeSlotText: { color: '#FFFFFF' },
  noSlotsContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  noSlotsText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  bottomSpacing: { height: 8 },

  /* ── Continue Button ── */
  continueButtonContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#EDFFF7',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  continueButton: {
    backgroundColor: '#00203F',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonDisabled: { backgroundColor: '#E5E7EB' },
  continueButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  continueButtonTextDisabled: { color: '#999999' },
});

export default DateSelection;