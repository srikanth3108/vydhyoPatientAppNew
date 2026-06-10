import React, { useState, useEffect, use } from 'react';
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
  ActivityIndicator,
  Platform,
} from 'react-native';
import { formatDoctorName, getAvatarInitial } from '../../utils/util';

import RoundedButton from '../../components/RoundedButton';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/navigationTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import Toast from 'react-native-toast-message';
// import { Calendar } from 'react-native-calendars';
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
} from '../../utils/responsive';

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

/** ===== UI strings (EN / HI / TEL) ===== */
type Lang = 'en' | 'hi' | 'tel';

function normalizeLang(l?: string): Lang {
  if (l === 'en' || l === 'hi' || l === 'tel') return l;
  if (l === 'te') return 'tel';
  return 'en';
}

const UI = {
  headerTitle: {
    en: 'Select Time',
    hi: 'समय चुनें',
    tel: 'సమయాన్ని ఎంచుకోండి',
  },
  selectDate: {
    en: 'Select Date',
    hi: 'तारीख चुनें',
    tel: 'తేదీని ఎంచుకోండి',
  },
  daysShort: {
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    hi: ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'],
    tel: ['ఆది', 'సోమ', 'మంగళ', 'బుధ', 'గురు', 'శుక్ర', 'శని'],
  },
  today: {
    en: 'Today',
    hi: 'आज',
    tel: 'ఈ రోజు',
  },
  tomorrow: {
    en: 'Tomorrow',
    hi: 'कल',
    tel: 'రేపు',
  },
  checkAvailability: {
    en: 'Check availability',
    hi: 'उपलब्धता देखें',
    tel: 'లభ్యత తనిఖీ చేయండి',
  },
  slotsAvailableSuffix: {
    en: 'slots available',
    hi: 'स्लॉट उपलब्ध',
    tel: 'స్లాట్లు అందుబాటులో ఉన్నాయి',
  },
  noSlots: {
    en: 'No slots available',
    hi: 'कोई स्लॉट उपलब्ध नहीं',
    tel: 'స్లాట్లు లేవు',
  },
  availableSlotsTitle: {
    en: 'Available Slots',
    hi: 'उपलब्ध स्लॉट',
    tel: 'అందుబాటులో ఉన్న స్లాట్లు',
  },
  loadingSlots: {
    en: 'Loading time slots...',
    hi: 'समय स्लॉट लोड हो रहे हैं...',
    tel: 'టైమ్ స్లాట్లు లోడ్ అవుతున్నాయి...',
  },
  continue: {
    en: 'Continue',
    hi: 'जारी रखें',
    tel: 'కొనసాగించండి',
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
  warning: {
    en: 'Warning',
    hi: 'चेतावनी',
    tel: 'హెచ్చరిక',
  },
  error: {
    en: 'Error',
    hi: 'त्रुटि',
    tel: 'లోపం',
  },
  failedFetchSlots: {
    en: 'Failed to fetch slots',
    hi: 'स्लॉट प्राप्त करने में विफल',
    tel: 'స్లాట్లు పొందడంలో విఫలమైంది',
  },
  ok: {
    en: 'OK',
    hi: 'ठीक',
    tel: 'సరే',
  },
} as const;

const DateSelection: React.FC<DateSelectionProps> = ({ route, navigation }) => {
  const doctor = route.params?.doctor;
  const clinic = route.params?.clinic;
  const mode = route.params && 'mode' in route.params ? route.params.mode : undefined;
  const currentUserDetails = useSelector((state: any) => state.currentUser);
  const lang: Lang = normalizeLang(currentUserDetails?.appLanguage);
  const insets = useSafeAreaInsets();

  const [selectedDate, setSelectedDate] = useState<string>(moment().format('YYYY-MM-DD'));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [unAvailableSlots, setUnAvailableSlots] = useState<Slot[]>([]);
  const [doctorProfilePic, setDoctorProfilePic] = useState<any>(null);
  const [doctorUserData, setDoctorUserData] = useState<any>(null);

  // Custom calendar states
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [loader, setLoader] = useState(false);

  // Fetch doctor profile picture
  const fetchDoctorProfilePic = async (doctorId: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!doctorId) return;

      const response :any = await AuthFetch(ENDPOINTS.GET_USER(doctorId), token);
      const userData  = response?.data?.data;

      if (userData) {
        setDoctorUserData(userData);
        if (userData.profilepic) {
          setDoctorProfilePic(userData.profilepic);
        }
      }
    } catch (error) {
      console.warn('Failed to fetch doctor profile picture:', error);
    }
  };
  const handleViewDetails = () => {
  navigation.navigate('DoctorDetails', {
    doctorId: doctor?.doctorId?.toString(),
    selectedClinicId: clinic?.addressId?.toString() || null,
  });
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



  useEffect(() => {
   
    if(doctor.doctorId ==0 || !doctor.doctorId || doctor.doctorId == undefined){
      doctor.doctorId = clinic?.userId;
    }
    if (doctor?.doctorId) {
      fetchDoctorProfilePic(doctor.doctorId);
    }
  }, [doctor?.doctorId]);

  const fetchSlotsForDate = async (date: string) => {
    try {
      setLoader(true);
      const token = await AsyncStorage.getItem('authToken');
      const response : any = await AuthFetch(
        ENDPOINTS.GET_SLOTS(doctor.doctorId, date, clinic.addressId),
        token
      );

      if (response.status !== 'success') {
        setUnAvailableSlots([]);
        setAvailableSlots([]);
        Alert.alert(
          UI.warning[lang],
          response?.message?.message || response?.data?.message || UI.failedFetchSlots[lang],
          [{ text: UI.ok[lang] }]
        );
      } else {
        const slotsData = response.data.data;
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
      Toast.show({
        type: 'error',
        text1: UI.error[lang],
        text2: UI.failedFetchSlots[lang],
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
    if (selectedDate && selectedTimeSlot) {
      navigation.navigate('Appointment', {
        doctor,
        clinic,
        date: selectedDate,
        time: selectedTimeSlot,
        mode,
        doctorUserData
      });
    }
  };

  const handleTimeSlotSelect = (time: string) => {
    setSelectedTimeSlot(time);
  };

  const goBack = () => {
    navigation.goBack();
  };

  // ===== Custom Calendar =====
  const handlePrevMonth = () => setCurrentMonth(moment(currentMonth).subtract(1, 'month'));
  const handleNextMonth = () => setCurrentMonth(moment(currentMonth).add(1, 'month'));
  const toggleCalendar = () => setIsCalendarVisible(!isCalendarVisible);

  const generateCalendarDays = () => {
    const daysInMonth = currentMonth.daysInMonth();
    const firstDayOfMonth = moment(currentMonth).startOf('month');
    const firstDayWeekday = firstDayOfMonth.day(); // 0 = Sunday, 1 = Monday, etc.

   

    const days: Array<{ date: moment.Moment; isCurrentMonth: boolean }> = [];

    // Padding days from previous month
    // If first day is Sunday (0), we don't need any padding
    // If first day is Monday (1), we need 1 padding day (Sunday)
    // If first day is Thursday (4), we need 4 padding days (Sun, Mon, Tue, Wed)
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push({
        date: moment(firstDayOfMonth).subtract(firstDayWeekday - i, 'days'),
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

    // Padding days for next month to complete the grid
    const remainingDays = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: moment(currentMonth).endOf('month').add(i, 'days'),
        isCurrentMonth: false,
      });
    }

  

    return days;
  };

  const quickDates = [
    {
      label: `${UI.today[lang]}, ${moment().format('DD MMM')}`,
      subtitle:
        availableSlots.length > 0
          ? `${availableSlots.length} ${UI.slotsAvailableSuffix[lang]}`
          : UI.noSlots[lang],
      date: moment().format('YYYY-MM-DD'),
      available: true, // allow clicking; actual slots shown below
    },
    {
      label: `${UI.tomorrow[lang]}, ${moment().add(1, 'days').format('DD MMM')}`,
      subtitle: UI.checkAvailability[lang],
      date: moment().add(1, 'days').format('YYYY-MM-DD'),
      available: true,
    },
    {
      label: `${moment().add(2, 'days').format('ddd, DD MMM')}`,
      subtitle: UI.checkAvailability[lang],
      date: moment().add(2, 'days').format('YYYY-MM-DD'),
      available: true,
    },
  ];
  // ===== End Custom Calendar =====
  const renderTimeSlots = () => {
    if (availableSlots.length === 0) {
      return (
        <View style={styles.timeSlotSection}>
          <Text style={styles.timeSlotSectionTitle}>{UI.noSlots[lang]}</Text>
        </View>
      );
    }

    return (
      <View style={styles.timeSlotSection}>
        <Text style={styles.timeSlotSectionTitle}>
          {UI.availableSlotsTitle[lang]} ({availableSlots.length})
        </Text>
        <View style={styles.timeSlotGrid}>
          {availableSlots?.map((slot, index) => (
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
// Add this helper function in DateSelection component
const getSpecialtyDisplay = (specialty: any): string => {
  if (!specialty) return '';
  if (typeof specialty === 'string') return specialty;
  if (typeof specialty === 'object') {
    // Try to get the name property first
    return specialty.name || specialty.specialty || '';
  }
  return '';
};
  const expText =
    (doctor?.experience || UI.notSpecified[lang]) + UI.experienceSuffix[lang];

  const avatarSource = getAvatarSource(doctorProfilePic);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{UI.headerTitle[lang]}</Text>
      </View> */}

      {/* Doctor Card */}
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
                onError={(e) => {
                  console.log('Failed to load profile image');
                }}
              />
            ) : (
              <Text style={styles.avatarText}>{getAvatarInitial(doctorUserData?.firstname, doctorUserData?.lastname)}</Text>
            )}
          </View>
        </View>
        <View style={styles.doctorDetails}>
            <Text style={styles.doctorName}>{formatDoctorName(doctorUserData?.firstname, doctorUserData?.lastname)}</Text>
          <Text style={styles.doctorSpecialty}>
            {getSpecialtyDisplay(doctor?.specialty)}
          </Text>
         
          <Text style={styles.clinicName}>
            {UI.clinicNameLabel[lang]}
            {clinic?.clinicName}
          </Text>
          <View style={styles.locationContainer}>
                        <Text style={styles.locationIcon}>📍</Text>

            <Text style={styles.locationText}>{clinic?.address}</Text>
          </View>
      
      {/* Details link at bottom-right */}
      <View style={styles.detailsContainer}>
        <TouchableOpacity 
          onPress={(e) => {
            e.stopPropagation(); 
            handleViewDetails();
          }}
        >
          <Text style={styles.detailsText}>👁️View Details</Text>
        </TouchableOpacity>
        </View>
      </View>
  </View>
</TouchableOpacity>

      {/* Choose Date Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{UI.selectDate[lang]}</Text>
          <View style={styles.dateNavigation}>
            <RoundedButton
              onPress={toggleCalendar}
              style={{
                ...styles.calendarButton,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F9FAFB',
                borderRadius: LAYOUT.borderRadius.md,
              }}
              textStyle={styles.selectText}
              title={"🗓 Select ›"}
            />
          </View>
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
              {UI.daysShort[lang]?.map((d) => (
                <Text key={d} style={styles.calendarHeaderText}>
                  {d}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {generateCalendarDays().map((day, index) => {
                const isSelected = selectedDate === day.date.format('YYYY-MM-DD');
                const isToday = moment().isSame(day.date, 'day');
                const isPastDate = day.date.isBefore(moment(), 'day');
                
                return (
                  <TouchableOpacity
                    key={`calendar-day-${index}-${day.date.format('YYYY-MM-DD')}`}
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
              })}
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
              <Text style={styles.loaderText}>{UI.loadingSlots[lang]}</Text>
            </View>
          ) : (
            renderTimeSlots()
          )}
        </ScrollView>

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
          <RoundedButton
            onPress={handleConfirm}
            title={UI.continue[lang]}
            style={{
              backgroundColor: selectedTimeSlot ? '#00203F' : '#9CA3AF',
              borderRadius: LAYOUT.borderRadius.md,
              paddingVertical: SPACING.sm,
              alignItems: 'center',
              minHeight: LAYOUT.buttonHeight,
              justifyContent: 'center',
            }}
            textStyle={{
              color: selectedTimeSlot ? '#FFFFFF' : '#E5E7EB',
              fontSize: moderateScale(14),
              fontWeight: '600',
            }}
            disabled={!selectedTimeSlot}
          />
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
    pastDateDay: {
      backgroundColor: '#F3F4F6',
      opacity: 0.5,
    },
    pastDateDayText: {
      color: '#9CA3AF',
      textDecorationLine: 'line-through', 
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
    color: '#00203F', // Dark navy blue matching login button
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
    marginBottom: SPACING.md,
    width: '100%',
  },
  calendarDay: {
    width: `${100 / 7}%`, 
    aspectRatio: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: SPACING.xs, 
    borderRadius: LAYOUT.borderRadius.sm, 
    marginVertical: 1,
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
  paddingVertical: SPACING.sm,
  paddingHorizontal: SPACING.md,
  borderRadius: LAYOUT.borderRadius.md,
  backgroundColor: '#DAEDE8',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#E8F4FD',
  width: responsiveWidth(28), // Fixed width
  flexGrow: 0,
  flexShrink: 0,
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

export default DateSelection;