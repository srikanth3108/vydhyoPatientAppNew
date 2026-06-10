import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/navigationTypes';
import { useSelector } from 'react-redux';
import moment from 'moment';
import { getMockSlotsForDate } from '../../../data/mockHomeServices';
import { HS_COLORS, hsStyles } from '../homeServiceTheme';
import { SPACING, LAYOUT, moderateScale, scale, verticalScale } from '../../../utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthFetch, ENDPOINTS } from '../../../services';

type ReBookRouteProp = RouteProp<RootStackParamList, 'HomeServiceReBook'>;
type NavProp = StackNavigationProp<RootStackParamList>;

interface Slot {
  time: string;
  available: boolean;
}

const HomeServiceReBook: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ReBookRouteProp>();
  const { appointment } = route.params || {};

  const currentUser = useSelector((state: any) => state.currentUser);
  const lang = currentUser?.appLanguage || 'en';

  const [selectedDate, setSelectedDate] = useState<string>(moment().format('YYYY-MM-DD'));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [doctorDetails, setDoctorDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Translations
  const t = {
    en: {
      header: 'Rebook Visit',
      cancelledTitle: 'Rebooking Cancelled Visit',
      cancelledDesc: 'Choose a new date and time slot to book your home visit again.',
      dateTitle: 'Select Date',
      slotsTitle: 'Available Time Slots',
      noSlots: 'No slots available for this date.',
      continueBtn: 'Continue to Pay',
      today: 'Today',
      tomorrow: 'Tomorrow',
    },
    hi: {
      header: 'यात्रा पुनः बुक करें',
      cancelledTitle: 'रद्द की गई यात्रा पुनः बुक कर रहे हैं',
      cancelledDesc: 'अपनी होम विजिट दोबारा बुक करने के लिए एक नई तारीख और समय स्लॉट चुनें।',
      dateTitle: 'तारीख चुनें',
      slotsTitle: 'उपलब्ध समय स्लॉट',
      noSlots: 'इस तारीख के लिए कोई स्लॉट उपलब्ध नहीं है।',
      continueBtn: 'भुगतान के लिए आगे बढ़ें',
      today: 'आज',
      tomorrow: 'कल',
    },
    tel: {
      header: 'సందర్శన మళ్లీ బుక్ చేయండి',
      cancelledTitle: 'రద్దు చేసిన సందర్శన మళ్లీ బుక్ చేయండి',
      cancelledDesc: 'మీ హోమ్ విజిట్‌ను మళ్లీ బుక్ చేసుకోవడానికి కొత్త తేదీ మరియు సమయాన్ని ఎంచుకోండి.',
      dateTitle: 'తేదీని ఎంచుకోండి',
      slotsTitle: 'లభ్యత సమయాలు',
      noSlots: 'ఈ తేదీకి స్లాట్లు అందుబాటులో లేవు.',
      continueBtn: 'చెల్లింపుకు కొనసాగండి',
      today: 'ఈరోజు',
      tomorrow: 'రేపు',
    }
  }[lang === 'hi' || lang === 'tel' ? lang : 'en'];

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        setIsLoading(true);
        const token = await AsyncStorage.getItem('authToken');
        if (!token) return;

        // Fetch full provider/doctor details
        const response = await AuthFetch(ENDPOINTS.GET_USER(appointment.doctorId), token);
        if (response.status === 'success') {
          setDoctorDetails(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching doctor:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoctor();
  }, [appointment]);

  useEffect(() => {
    // Fetch slots mock/API based on selectedDate
    const slots = getMockSlotsForDate(selectedDate);
    setAvailableSlots(slots);
    setSelectedTimeSlot(null);
  }, [selectedDate]);

  const parseHomeAddress = (addressStr: string) => {
    if (!addressStr) return { building: '', street: '', cityState: '', pincode: '', saveAsDefault: false };
    const parts = addressStr.split(',');
    const obj: any = {};
    parts.forEach((part: string) => {
      const idx = part.indexOf(':');
      if (idx !== -1) {
        const key = part.slice(0, idx).trim();
        const val = part.slice(idx + 1).trim();
        obj[key] = val;
      }
    });
    return {
      building: obj.building || '',
      floorFlat: obj.floorFlat || '',
      street: obj.street || '',
      landmark: obj.landmark || '',
      pincode: obj.pincode || '',
      cityState: obj.cityState || '',
      saveAsDefault: false,
    };
  };

  const handleContinue = () => {
    if (!selectedDate || !selectedTimeSlot) return;

    const parsedAddr = parseHomeAddress(appointment.homeAddress);

    // Create doctor object structure expected by ConfirmToPay
    const finalDoctor = {
      id: doctorDetails?.id || appointment.doctorId,
      doctorId: doctorDetails?.userId || appointment.doctorId,
      name: doctorDetails?.firstname || appointment.doctorName?.replace('Dr. ', ''),
      specialty: doctorDetails?.specialization || { name: appointment.appointmentDepartment || 'Physiotherapist' },
      speciality: appointment.appointmentDepartment || 'Physiotherapist',
      consultationFee: doctorDetails?.consultationModeFee || [
        { type: 'Online Consultation', fee: appointment.amount },
        { type: 'In-Clinic Consultation', fee: appointment.amount },
        { type: 'Home Visit', fee: appointment.amount }
      ],
      addresses: doctorDetails?.addresses || [{ addressId: appointment.addressId || 'addr1' }],
    };

    navigation.navigate('ConfirmToPay', {
      doctor: finalDoctor,
      mode: 'Home Visit',
      date: selectedDate,
      time: selectedTimeSlot,
      formData: parsedAddr,
      reason: appointment.appointmentReason || 'Regular home care visit rebook',
      reports: null,
      patient: {
        userId: appointment.userId,
        firstname: appointment.patientName?.split(' ')[0] || 'Patient',
        lastname: appointment.patientName?.split(' ').slice(1).join(' ') || '',
        name: appointment.patientName,
        age: 'N/A',
        gender: 'N/A',
        mobile: currentUser?.mobile || '',
        phone: currentUser?.mobile || '',
      },
    });
  };

  const quickDates = [
    {
      label: `${t.today}, ${moment().format('DD MMM')}`,
      date: moment().format('YYYY-MM-DD'),
    },
    {
      label: `${t.tomorrow}, ${moment().add(1, 'days').format('DD MMM')}`,
      date: moment().add(1, 'days').format('YYYY-MM-DD'),
    },
    {
      label: `${moment().add(2, 'days').format('ddd, DD MMM')}`,
      date: moment().add(2, 'days').format('YYYY-MM-DD'),
    },
    {
      label: `${moment().add(3, 'days').format('ddd, DD MMM')}`,
      date: moment().add(3, 'days').format('YYYY-MM-DD'),
    },
  ];

  const generateCalendarDays = () => {
    const daysInMonth = currentMonth.daysInMonth();
    const firstDayOfMonth = moment(currentMonth).startOf('month');
    const firstDayWeekday = firstDayOfMonth.day();
    const days = [];
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

  const toggleCalendar = () => setIsCalendarVisible(!isCalendarVisible);
  const handlePrevMonth = () => setCurrentMonth(moment(currentMonth).subtract(1, 'month'));
  const handleNextMonth = () => setCurrentMonth(moment(currentMonth).add(1, 'month'));

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={HS_COLORS.primary} />
        <Text style={styles.loadingText}>Fetching slot details...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={HS_COLORS.primary} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Warning rebook context card */}
        <View style={styles.contextCard}>
          <Text style={styles.contextTitle}>🔄 {t.cancelledTitle}</Text>
          <Text style={styles.contextDesc}>{t.cancelledDesc}</Text>
          <Text style={styles.bookingId}>Original ID: #{appointment.appointmentId}</Text>
        </View>

        {/* Selected date header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t.dateTitle}</Text>
          <TouchableOpacity style={styles.calendarToggleBtn} onPress={toggleCalendar}>
            <Text style={styles.calendarIcon}>📅 Custom Date</Text>
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
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <Text key={d} style={styles.calendarHeaderText}>{d}</Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {generateCalendarDays().map((day, idx) => {
                const isSelected = selectedDate === day.date.format('YYYY-MM-DD');
                const isToday = moment().isSame(day.date, 'day');
                return (
                  <TouchableOpacity
                    key={idx}
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
                      ]}
                    >
                      {day.date.format('D')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Quick Date selections */}
        <View style={styles.dateChipsRow}>
          {quickDates.map((d, index) => {
            const isSelected = selectedDate === d.date;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.dateChip, isSelected && styles.dateChipActive]}
                onPress={() => setSelectedDate(d.date)}
              >
                <Text style={[styles.dateChipText, isSelected && styles.dateChipTextActive]}>{d.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Available slots grid section */}
        <Text style={styles.sectionTitle}>{t.slotsTitle}</Text>
        <View style={styles.slotsCard}>
          {availableSlots.length > 0 ? (
            <View style={styles.slotsGrid}>
              {availableSlots.map((slot, index) => {
                const isSelected = selectedTimeSlot === slot.time;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.slotItem, isSelected && styles.slotItemActive]}
                    onPress={() => setSelectedTimeSlot(slot.time)}
                  >
                    <Text style={[styles.slotItemText, isSelected && styles.slotItemTextActive]}>{slot.time}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.noSlotsText}>{t.noSlots}</Text>
          )}
        </View>

      </ScrollView>

      {/* Booking CTA control */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, (!selectedDate || !selectedTimeSlot) && styles.btnDisabled]}
          disabled={!selectedDate || !selectedTimeSlot}
          onPress={handleContinue}
        >
          <Text style={styles.continueBtnText}>{t.continueBtn}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HS_COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: HS_COLORS.bg,
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: moderateScale(13),
    color: HS_COLORS.primary,
    fontWeight: '600',
  },
  scroll: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },
  contextCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  contextTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 4,
  },
  contextDesc: {
    fontSize: moderateScale(12),
    color: '#1E3A8A',
    lineHeight: moderateScale(16),
    marginBottom: 8,
  },
  bookingId: {
    fontSize: moderateScale(11),
    color: '#2563EB',
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: HS_COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginVertical: SPACING.xs,
  },
  calendarToggleBtn: {
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: HS_COLORS.border,
    borderRadius: 6,
  },
  calendarIcon: {
    fontSize: moderateScale(11),
    color: HS_COLORS.primary,
    fontWeight: '600',
  },
  dateChipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  dateChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: HS_COLORS.border,
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    width: '23%',
    alignItems: 'center',
    elevation: 1,
  },
  dateChipActive: {
    backgroundColor: HS_COLORS.primary,
    borderColor: HS_COLORS.primary,
  },
  dateChipText: {
    fontSize: moderateScale(10),
    color: HS_COLORS.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  dateChipTextActive: {
    color: '#FFFFFF',
  },
  slotsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: HS_COLORS.border,
    minHeight: moderateScale(120),
    justifyContent: 'center',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  slotItem: {
    width: '30%',
    paddingVertical: SPACING.sm,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: HS_COLORS.border,
    alignItems: 'center',
  },
  slotItemActive: {
    backgroundColor: HS_COLORS.accentSoft,
    borderColor: HS_COLORS.accent,
  },
  slotItemText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: HS_COLORS.text,
  },
  slotItemTextActive: {
    color: '#065F46',
    fontWeight: '700',
  },
  noSlotsText: {
    textAlign: 'center',
    color: HS_COLORS.textMuted,
    fontSize: moderateScale(13),
  },
  footer: {
    padding: SPACING.md,
    backgroundColor: HS_COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: HS_COLORS.border,
  },
  continueBtn: {
    backgroundColor: HS_COLORS.primary,
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: moderateScale(44),
  },
  continueBtnText: {
    color: '#FFF',
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  calendarWrapper: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: HS_COLORS.border,
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
  selectedCalendarDay: { backgroundColor: HS_COLORS.primary },
  todayCalendarDay: { borderWidth: 1.5, borderColor: HS_COLORS.accent },
  calendarDayText: { fontSize: 12, fontWeight: '500', color: '#111827' },
  otherMonthDayText: { color: '#9CA3AF' },
  selectedCalendarDayText: { color: '#FFFFFF' },
});

export default HomeServiceReBook;
