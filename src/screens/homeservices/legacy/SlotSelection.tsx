import React, { useState, useEffect, useMemo } from 'react';
import { AuthFetch, ENDPOINTS } from '../../../services';
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
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/navigationTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import Toast from 'react-native-toast-message';
;
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import responsive utilities
import {
  isTablet,
  SPACING,
  LAYOUT,
  responsiveWidth,
  responsiveHeight,
  moderateScale,
  SAFE_AREA,
} from '../../../utils/responsive';

type SlotSelectionRouteProp = RouteProp<RootStackParamList, 'DateSelection'>;

interface Slot {
  time: string;
  available: boolean;
  id: string;
  originalTime?: string;
  reason?: string;
}

interface SlotSelectionProps {
  navigation: StackNavigationProp<RootStackParamList, 'SlotSelection'>;
  route: SlotSelectionRouteProp;
}

// Translations for multiple languages
const translations: any = {
  en: {
    selectTime: 'Select Time',
    selectDate: 'Select Date',
    certified: 'Certified',
    yearsExperience: 'Years experience',
    consultationFee: 'Consultation Fee',
    availableSlots: 'Available Slots',
    noSlotsAvailable: 'No slots available',
    loadingSlots: 'Loading time slots...',
    continue: 'Continue',
    today: 'Today',
    tomorrow: 'Tomorrow',
    warning: 'Warning',
    error: 'Error',
    failedToFetchSlots: 'Failed to fetch slots',
    days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    checkAvailability: 'Check availability',
    slotsAvailable: 'slots available',
  },
  hi: {
    selectTime: 'समय चुनें',
    selectDate: 'तारीख चुनें',
    certified: 'प्रमाणित',
    yearsExperience: 'वर्षों का अनुभव',
    consultationFee: 'परामर्श शुल्क',
    availableSlots: 'उपलब्ध स्लॉट',
    noSlotsAvailable: 'कोई स्लॉट उपलब्ध नहीं',
    loadingSlots: 'समय स्लॉट लोड हो रहे हैं...',
    continue: 'जारी रखें',
    today: 'आज',
    tomorrow: 'कल',
    warning: 'चेतावनी',
    error: 'त्रुटि',
    failedToFetchSlots: 'स्लॉट प्राप्त करने में विफल',
    days: ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'],
    checkAvailability: 'उपलब्धता जांचें',
    slotsAvailable: 'स्लॉट उपलब्ध',
  },
  tel: {
    selectTime: 'సమయాన్ని ఎంచుకోండి',
    selectDate: 'తేదీని ఎంచుకోండి',
    certified: 'ధృవీకరించబడిన',
    yearsExperience: 'సంవత్సరాల అనుభవం',
    consultationFee: 'సంప్రదింపు రుసుము',
    availableSlots: 'అందుబాటులో ఉన్న స్లాట్లు',
    noSlotsAvailable: 'స్లాట్లు లేవు',
    loadingSlots: 'టైమ్ స్లాట్లు లోడ్ అవుతున్నాయి...',
    continue: 'కొనసాగించు',
    today: 'ఈరోజు',
    tomorrow: 'రేపు',
    warning: 'హెచ్చరిక',
    error: 'లోపం',
    failedToFetchSlots: 'స్లాట్లను పొందడంలో వైఫల్యం',
    days: ['ఆది', 'సోమ', 'మంగళ', 'బుధ', 'గురు', 'శుక్ర', 'శని'],
    checkAvailability: 'లభ్యతను తనిఖీ చేయండి',
    slotsAvailable: 'స్లాట్లు అందుబాటులో ఉన్నాయి',
  },
};

const SlotSelection: React.FC<SlotSelectionProps> = ({ route, navigation }) => {
  const doctor   = route?.params?.doctor;
  const mode   = route?.params?.mode;
  console.log(doctor, "1234")

  const [selectedDate, setSelectedDate] = useState<string>(moment().format('YYYY-MM-DD'));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [unAvailableSlots, setUnAvailableSlots] = useState<Slot[]>([]);
  const [doctorProfilePic, setDoctorProfilePic] = useState<any>(null);

  // Custom calendar states
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [loader, setLoader] = useState(false);

  // Get user details from Redux for language preference
  const user = useSelector((state: any) => state.currentUser);
  const appLanguage = user?.appLanguage || 'en';
  const insets = useSafeAreaInsets();
  
  // Pick translation set
  const t = translations[appLanguage] || translations.en;

  // Profile picture handling function
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
  const getAvatarInitial = (name: string) => {
    return (name?.[0] || 'D').toUpperCase();
  };

  // Fetch doctor profile picture
  const fetchDoctorProfilePic = async (doctorId: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!doctorId) return;
      
      const response = await AuthFetch(ENDPOINTS.GET_USER(doctorId), token);
      const userData = response?.data?.data;
      
      if (userData?.profilepic) {
        setDoctorProfilePic(userData.profilepic);
      }
    } catch (error) {
      console.warn('Failed to fetch doctor profile picture:', error);
    }
  };

  useEffect(() => {
    if (doctor?.doctorId) {
      fetchDoctorProfilePic(doctor?.doctorId);
    }
  }, [doctor?.doctorId]);

  const fetchSlotsForDate = async (date: string) => {
    try {
      setLoader(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await AuthFetch(
        ENDPOINTS.GET_SLOTS(doctor?.doctorId, date, doctor?.addresses[0]?.addressId),
        token
      );
      console.log(response, "doctor details123")

      if (response.status !== 'success') {
        setUnAvailableSlots([]);
        setAvailableSlots([]);
        Alert.alert(
          t.warning, response?.message?.message || response?.data?.message || t.failedToFetchSlots,
          [{ text: 'OK' }]
        );
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

            // Skip past slots if today
            if (isToday && slotTime.isBefore(currentTime)) {
              return;
            }

            if (slot.status === 'available') {
              available.push({
                time: timeStr,
                available: true,
                id: slot._id,
                originalTime: slot.time,
              });
            } else {
              unavailable.push({
                time: timeStr,
                available: false,
                id: slot._id,
                reason: slot.reason || 'Not available',
                originalTime: slot.time,
              });
            }
          });
        }

        setAvailableSlots(available);
        setUnAvailableSlots(unavailable);
      }
    } catch (err) {
      console.log('Error fetching slots:', err);
      Toast.show({
        type: 'error',
        text1: t.error,
        text2: t.failedToFetchSlots,
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

  const handleConfirm = () => {
    navigation.navigate('ReasonForConsultation', {
      doctor,
      date: selectedDate,
      time: selectedTimeSlot,
      mode,
    });
  };

  const handleTimeSlotSelect = (time: string) => {
    setSelectedTimeSlot(time);
  };

  const handleViewDetails = () => {
  navigation.navigate('DoctorDetails', {
    doctorId: doctor?.doctorId?.toString(),
    selectedClinicId: doctor?.addresses?.[0]?.addressId?.toString() || null,
  });
};

  // ===== Custom Calendar =====
const renderCalendarDay = (day: { date: moment.Moment; isCurrentMonth: boolean }) => {
  const isSelected = selectedDate === day.date.format('YYYY-MM-DD');
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
          setSelectedDate(day.date.format('YYYY-MM-DD'));
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

  const handlePrevMonth = () => {
    setCurrentMonth(moment(currentMonth).subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentMonth(moment(currentMonth).add(1, 'month'));
  };

  const toggleCalendar = () => {
    setIsCalendarVisible(!isCalendarVisible);
  };

  const generateCalendarDays = () => {
    const daysInMonth = currentMonth.daysInMonth();
    const firstDayOfMonth = moment(currentMonth).startOf('month');
    const firstDayWeekday = firstDayOfMonth.day();

    const days: Array<{ date: moment.Moment; isCurrentMonth: boolean }> = [];

    // Padding days from previous month
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      days.push({
        date: moment(firstDayOfMonth).subtract(i + 1, 'days'),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: moment(currentMonth).date(i),
        isCurrentMonth: true,
      });
    }

    // Padding days for next month
    const remainingDays = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: moment(currentMonth).endOf('month').add(i, 'days'),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const quickDates = useMemo(() => {
    const today = moment().format('YYYY-MM-DD');
    const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
    const dayAfterTomorrow = moment().add(2, 'days').format('YYYY-MM-DD');
    
    return [
      {
        label: `${t.today}, ${moment().format('DD MMM')}`,
        subtitle: selectedDate === today ? 
          `${availableSlots.length} ${t.slotsAvailable}` : 
          t.checkAvailability,
        date: today,
        available: selectedDate === today ? availableSlots.length > 0 : true,
      },
      {
        label: `${t.tomorrow}, ${moment().add(1, 'days').format('DD MMM')}`,
        subtitle: t.checkAvailability,
        date: tomorrow,
        available: true,
      },
      {
        label: `${moment().add(2, 'days').format('ddd, DD MMM')}`,
        subtitle: t.checkAvailability,
        date: dayAfterTomorrow,
        available: true,
      },
    ];
  }, [availableSlots, selectedDate, t]);

  // Function to render slots with proper alignment
  const renderTimeSlots = () => {
    if (availableSlots.length === 0) {
      return (
        <View style={styles.timeSlotSection}>
          <Text style={styles.timeSlotSectionTitle}>{t.noSlotsAvailable}</Text>
        </View>
      );
    }

    return (
      <View style={styles.timeSlotSection}>
        <Text style={styles.timeSlotSectionTitle}>
          {t.availableSlots} ({availableSlots.length})
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
    );
  };

  const avatarSource = getAvatarSource(doctorProfilePic);
  const doctorInitial = getAvatarInitial(doctor?.name || 'D');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Doctor Card - Entire card is clickable */}
      <TouchableOpacity 
        onPress={handleViewDetails}
        activeOpacity={0.95}
      >
      <View style={styles.doctorCard}>
        <View style={styles.doctorImageContainer}>
          <View style={styles.avatar}>
            {avatarSource ? (
              <Image
                source={avatarSource}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarText}>{doctorInitial}</Text>
            )}
          </View>
        </View>
        <View style={styles.doctorDetails}>
          <Text style={styles.doctorName}>Dr. {doctor?.name || 'N/A'}</Text>
          <Text style={styles.doctorSpecialty}>{t.certified} {doctor?.specialty?.name || 'N/A'}</Text>
          <Text style={styles.doctorExperience}>{doctor?.specialty?.experience || 'N/A'} {t.yearsExperience}</Text>
          <View style={styles.locationContainer}>
            <Text style={styles.locationText}>{t.consultationFee}: ₹{doctor?.consultationFee[2]?.fee}</Text>
          </View>
      
      {/* Details link at bottom-right */}
      <View style={styles.detailsContainer}>
        <TouchableOpacity 
          onPress={(e) => {
            e.stopPropagation(); // Prevent card click from firing
            handleViewDetails();
          }}
        >
          <Text style={styles.detailsText}>👁️ View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</TouchableOpacity>

      {/* Choose Date Section (Custom calendar + quick chips) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.selectDate}</Text>
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
              {t.days.map((d) => (
                <Text key={d} style={styles.calendarHeaderText}>{d}</Text>
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
              >
                {date.label}
              </Text>
              <Text
                style={[
                  styles.dateOptionSubtitle,
                  selectedDate === date.date && styles.selectedDateOptionSubtitle,
                  !date.available && styles.disabledDateOptionSubtitle,
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
        <Text style={styles.selectedDateText}>{moment(selectedDate).format('dddd, DD MMM')}</Text>
      </View>

      {/* Time Slots + Footer wrapped in flex:1 so footer stays below scroll */}
      <View style={{ flex: 1 }}>
        <ScrollView 
          style={styles.timeSlotsContainer} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.timeSlotsContent}
        >
          {loader ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color="#1F2937" />
              <Text style={styles.loaderText}>{t.loadingSlots}</Text>
            </View>
          ) : (
            renderTimeSlots()
          )}
        </ScrollView>

        {/* Continue Button - Always visible but disabled when no time slot selected */}
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
          style={[
            styles.continueButton,
            !selectedTimeSlot && styles.continueButtonDisabled
          ]} 
          onPress={handleConfirm}
          disabled={!selectedTimeSlot}
        >
          <Text style={[
            styles.continueButtonText,
            !selectedTimeSlot && styles.continueButtonTextDisabled
          ]}>
            {t.continue}
          </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#EDFFF7',
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

  doctorCard: {
    flexDirection: 'row', 
    backgroundColor: '#FFFFFF', 
    marginHorizontal: isTablet ? SPACING.lg : SPACING.md, 
    marginVertical: SPACING.md,
    borderRadius: LAYOUT.borderRadius.lg, 
    padding: isTablet ? SPACING.lg : SPACING.md, 
    ...LAYOUT.shadow.md,
  },

  doctorDetails: { 
    flex: 1, 
    justifyContent: 'flex-start',
    position: 'relative', // Add this for positioning
  },

  locationContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: SPACING.xs 
  },

  // Add these new styles:
  detailsContainer: {
    alignItems: 'flex-end',
    marginTop: SPACING.xs,
  },
  
  detailsText: {
    fontSize: moderateScale(11),
    color: '#1976d2',
    fontStyle: 'italic',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },

  doctorImageContainer: { 
    marginRight: SPACING.md 
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
  locationText: { 
    fontSize: moderateScale(12), 
    color: '#2563EB', 
    marginRight: SPACING.xs 
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
  pastDateDay: {
    backgroundColor: '#F3F4F6',
    opacity: 0.5,
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
  pastDateDayText: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through', 
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
  disabledDateOption: { 
    opacity: 0.5 
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
  disabledDateOptionText: { 
    color: '#9CA3AF' 
  },
  dateOptionSubtitle: { 
    fontSize: moderateScale(10), 
    color: '#6B7280',
    textAlign: 'center',
  },
  selectedDateOptionSubtitle: { 
    color: '#E5E7EB' 
  },
  disabledDateOptionSubtitle: { 
    color: '#9CA3AF' 
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
    flex: 1, 
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md, 
    backgroundColor: '#EDFFF7' 
  },
  timeSlotsContent: {
    paddingBottom: SPACING.md,
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
  flexGrow: 0, // Change this from 1 to 0
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

  // Footer with Continue Button
  footer: {
    backgroundColor: '#EDFFF7',
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    paddingTop: SPACING.sm,
  },
  continueButton: {
    backgroundColor: '#00203F',
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: isTablet ? SPACING.md : SPACING.sm,
    alignItems: 'center',
    ...LAYOUT.shadow.md,
    minHeight: LAYOUT.buttonHeight,
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  continueButtonTextDisabled: {
    color: '#E5E7EB',
  },
});

export default SlotSelection;