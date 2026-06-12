import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import moment from 'moment';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getCategoryById,
  getProviderById,
} from '../../../data/mockHomeServices';
import {  DateSlots, SlotData, getProviderDetailsById, getProviderSlotsAvailability } from '../../../services/homeCareService';
import { HS_COLORS, hsStyles } from '../homeServiceTheme';
import { SPACING, moderateScale, LAYOUT, SAFE_AREA } from '../../../utils/responsive';
import { useSelector } from 'react-redux';

type Params = { providerId: string; role?: string; categoryId?: string,provider?: any };
type NavList = {
  HomeServiceSlotSelection: Params;
  HomeServiceReason: Params & { date: string; time: string };
};

type Route = RouteProp<NavList, 'HomeServiceSlotSelection'>;
type Nav = StackNavigationProp<NavList, 'HomeServiceSlotSelection'>;

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const HomeServiceSlotSelection: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { providerId, categoryId, role } = route.params;

  const category = categoryId ? getCategoryById(categoryId) : null;
  const [providerMock] = useState(getProviderById(providerId));

  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Calendar states
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);

  // API states
  const [loading, setLoading] = useState(true);
  const [allDateSlots, setAllDateSlots] = useState<DateSlots[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<any>([]);


  // Fetch provider availability on component mount
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      setError(null);
      try {
        const [slotsResult, providerResult] = await Promise.all([
          getProviderSlotsAvailability(providerId),
          getProviderDetailsById(providerId)
        ]);

        if (providerResult.provider) {
           setProvider(providerResult.provider);
        }

        if (slotsResult.error) {
           // We do not show full screen error for 'No availability found', just empty slots
           setAllDateSlots([]);
        } else if (slotsResult.data?.dates) {
          setAllDateSlots(slotsResult.data.dates);
          // Default to current day
          setSelectedDate(moment().format('YYYY-MM-DD'));
          if (!providerResult.provider && slotsResult.data.provider) {
             setProvider(slotsResult.data.provider);
          }
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Failed to fetch provider availability');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [providerId]);

  const quickDates = useMemo(() => {
    return [0, 1, 2].map(offset => {
      const d = moment().add(offset, 'days');
      return {
        date: d.format('YYYY-MM-DD'),
        label:
          offset === 0
            ? `Today, ${d.format('DD MMM')}`
            : offset === 1
            ? `Tomorrow, ${d.format('DD MMM')}`
            : d.format('ddd, DD MMM'),
      };
    });
  }, []);

  const currentDateSlots: DateSlots | undefined = useMemo(
    () => allDateSlots.find(d => d.date === selectedDate),
    [selectedDate, allDateSlots],
  );

  const slots: SlotData[] = useMemo(
    () => currentDateSlots?.slots || [],
    [currentDateSlots],
  );

  const handleContinue = () => {
    if (!selectedTime) return;
    navigation.navigate('HomeServiceReason', {
      providerId,
      provider,
      date: selectedDate,
      time: selectedTime,
    });
  };

  // ===== Custom Calendar =====
  const toggleCalendar = () => setIsCalendarVisible(!isCalendarVisible);

  const handlePrevMonth = () => {
    setCurrentMonth(moment(currentMonth).subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentMonth(moment(currentMonth).add(1, 'month'));
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
          isPastDate && day.isCurrentMonth && styles.pastDateDay,
        ]}
        onPress={() => {
          if (day.isCurrentMonth && !isPastDate) {
            setSelectedDate(day.date.format('YYYY-MM-DD'));
            setSelectedTime(null);
            setIsCalendarVisible(false);
          }
        }}
        disabled={!day.isCurrentMonth || isPastDate}
      >
        <View
          style={[
            styles.calendarDayInner,
            isSelected && styles.selectedCalendarDay,
            isToday && !isSelected && styles.todayCalendarDay,
          ]}
        >
          <Text
            style={[
              styles.calendarDayText,
              !day.isCurrentMonth && styles.otherMonthDayText,
              isSelected && styles.selectedCalendarDayText,
              isToday && !isSelected && styles.todayCalendarDayText,
              isPastDate && day.isCurrentMonth && styles.pastDateDayText,
            ]}
          >
            {day.date.format('D')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={hsStyles.screen}>
      <StatusBar barStyle="dark-content" />
      
      {loading && (
        <View style={[hsStyles.screen, styles.centerContent]}>
          <ActivityIndicator size="large" color={HS_COLORS.primary} />
          <Text style={styles.loadingText}>Loading availability...</Text>
        </View>
      )}

      {!loading && !provider && (
        <View style={[hsStyles.screen, styles.centerContent]}>
          <Text style={styles.errorText}>Provider not found</Text>
        </View>
      )}

      {!loading && provider && (
        <>
          {error && !allDateSlots.length ? (
            <View style={[hsStyles.screen, styles.centerContent]}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={[hsStyles.primaryBtn, { marginTop: SPACING.lg }]}
                onPress={() => navigation.goBack()}
              >
                <Text style={hsStyles.primaryBtnText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {provider.fullName ? (
                <View style={[styles.summaryCard, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', width: '100%' }}>
                    <View style={[hsStyles.avatar, { width: 50, height: 50 }]}>
                      <Text style={[hsStyles.avatarText, { fontSize: 20 }]}>{provider.fullName.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                      <Text style={styles.summaryName}>{provider.fullName}</Text>
                      {provider.specialization ? <Text style={hsStyles.muted}>{provider.specialization}</Text> : null}
                      {provider.profession ? <Text style={[hsStyles.muted, { marginTop: 4, fontSize: 12 }]}>Clinic Name: {provider.profession}</Text> : null}
                    </View>
                  </View>
                  {provider.homeAddress && (
                    <View style={{ marginTop: SPACING.sm, paddingLeft: 60, flexDirection: 'row' }}>
                      <Text style={{ color: '#E74C3C', marginRight: 4 }}>📍</Text>
                      <Text style={{ flex: 1, fontSize: 12, color: '#3b82f6' }}>{provider.homeAddress}</Text>
                    </View>
                  )}
                  <TouchableOpacity style={{ width: '100%', alignItems: 'flex-end', marginTop: 8 }} onPress={() => navigation.navigate('ProviderDetails' as any, { providerId, role, categoryId })}>
                     <Text style={{ color: '#3b82f6', fontSize: 12, fontWeight: '600' }}>👁 View Details</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.summaryCard}>
                  <View style={hsStyles.avatar}>
                    <Text style={hsStyles.avatarText}>{providerMock?.providerName || 'P'}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                    <Text style={styles.summaryName}>{providerMock?.providerName}</Text>
                  </View>
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryPillText}>{category?.emoji || '🏠'} Home</Text>
                  </View>
                </View>
              )}

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Select date header with calendar toggle */}
            <View style={styles.sectionHeader}>
              <Text style={hsStyles.sectionTitle}>Select date</Text>
              <TouchableOpacity style={styles.calendarButton} onPress={toggleCalendar}>
                <Text style={styles.calendarIcon}>🗓</Text>
                <Text style={styles.selectText}>Select</Text>
              </TouchableOpacity>
            </View>

            {/* Expandable Calendar */}
            {isCalendarVisible && (
              <View style={styles.calendarCard}>
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
                  {DAY_HEADERS.map(d => (
                    <Text key={d} style={styles.calendarHeaderText}>{d}</Text>
                  ))}
                </View>

                <View style={styles.calendarGrid}>
                  {generateCalendarDays().map(day => renderCalendarDay(day))}
                </View>
              </View>
            )}

            {/* Quick date chips with availability status */}
            <View style={styles.dateRow}>
              {quickDates.map(d => {
                const dateSlots = allDateSlots.find(ds => ds.date === d.date);
                const hasSlots = dateSlots && dateSlots.availableSlots > 0;
                const statusText = hasSlots ? 'Check availability' : 'No slots available';

                return (
                  <TouchableOpacity
                    key={d.date}
                    style={[
                      styles.dateChip,
                      selectedDate === d.date && styles.dateChipActive,
                    ]}
                    onPress={() => {
                      setSelectedDate(d.date);
                      setSelectedTime(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.dateChipText,
                        selectedDate === d.date && styles.dateChipTextActive,
                      ]}
                    >
                      {d.label}
                    </Text>
                    <Text
                      style={[
                        styles.dateChipStatus,
                        selectedDate === d.date && styles.dateChipStatusActive,
                        !hasSlots && styles.dateChipStatusUnavailable,
                      ]}
                    >
                      {statusText}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Selected date display */}
            <Text style={[hsStyles.sectionTitle, { marginTop: SPACING.lg }]}>
              {moment(selectedDate).format('dddd, DD MMM')}
            </Text>

            {/* Slots grid or no availability message */}
            <View style={styles.slotGrid}>
              {slots.length === 0 ? (
                <Text style={[styles.noSlotsText]}>No slots available</Text>
              ) : (
                slots.map(slot => (
                  <TouchableOpacity
                    key={slot.time}
                    style={[
                      styles.slotBtn,
                      slot.status === 'booked' && styles.slotBtnBooked,
                      selectedTime === slot.time && styles.slotBtnActive,
                    ]}
                    onPress={() => {
                      if (slot.status === 'available') {
                        setSelectedTime(slot.time);
                      }
                    }}
                    disabled={slot.status === 'booked'}
                  >
                    <Text
                      style={[
                        styles.slotText,
                        slot.status === 'booked' && styles.slotTextBooked,
                        selectedTime === slot.time && styles.slotTextActive,
                      ]}
                    >
                      {slot.time}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </ScrollView>

          <View
            style={[
              hsStyles.footer,
              {
                paddingBottom:
                  Platform.OS === 'android'
                    ? Math.max(insets.bottom, SAFE_AREA.safeBottom) + SPACING.xs
                    : insets.bottom,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                hsStyles.primaryBtn,
                !selectedTime && styles.btnDisabled,
              ]}
              disabled={!selectedTime}
              onPress={handleContinue}
            >
              <Text style={hsStyles.primaryBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
            </>
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  loadingText: {
    fontSize: moderateScale(14),
    color: HS_COLORS.text,
    marginTop: SPACING.md,
  },
  errorText: {
    fontSize: moderateScale(16),
    color: HS_COLORS.danger || '#E74C3C',
    marginTop: SPACING.md,
    fontWeight: '600',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: HS_COLORS.card,
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.lg,
    borderWidth: 1,
    borderColor: HS_COLORS.border,
    ...LAYOUT.shadow.sm,
  },
  summaryName: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: HS_COLORS.text,
  },
  categoryPill: {
    backgroundColor: HS_COLORS.accentSoft,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: LAYOUT.borderRadius.sm,
  },
  categoryPillText: { fontSize: moderateScale(11), fontWeight: '600', color: '#047857' },
  scroll: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },

  // Section header with calendar toggle
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: HS_COLORS.card,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: LAYOUT.borderRadius.md,
    borderWidth: 1,
    borderColor: HS_COLORS.border,
  },
  calendarIcon: {
    fontSize: moderateScale(14),
    marginRight: SPACING.xxs,
  },
  selectText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: HS_COLORS.primary,
  },

  // Calendar card wrapper
  calendarCard: {
    backgroundColor: HS_COLORS.card,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: HS_COLORS.border,
    ...LAYOUT.shadow.sm,
  },

  // Calendar month navigation
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  navButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#F0F9F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: HS_COLORS.border,
  },
  navButtonText: {
    fontSize: moderateScale(18),
    color: HS_COLORS.primary,
    fontWeight: '700',
  },
  currentMonth: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: HS_COLORS.text,
  },

  // Calendar day headers
  calendarHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: SPACING.xs,
  },
  calendarHeaderText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: HS_COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Calendar grid
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayInner: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  selectedCalendarDay: {
    backgroundColor: HS_COLORS.primary,
  },
  todayCalendarDay: {
    borderWidth: 2,
    borderColor: HS_COLORS.accent,
    backgroundColor: '#F0FDF4',
  },
  pastDateDay: {
    opacity: 0.35,
  },
  calendarDayText: {
    fontSize: moderateScale(13),
    fontWeight: '500',
    color: HS_COLORS.text,
  },
  otherMonthDayText: {
    color: '#CBD5E1',
  },
  selectedCalendarDayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  todayCalendarDayText: {
    color: HS_COLORS.accent,
    fontWeight: '700',
  },
  pastDateDayText: {
    color: '#94A3B8',
  },

  // Quick date chips
  dateRow: { flexDirection: 'row', gap: SPACING.sm },
  dateChip: {
    flex: 1,
    backgroundColor: HS_COLORS.card,
    padding: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    borderWidth: 1,
    borderColor: HS_COLORS.border,
    alignItems: 'center',
  },
  dateChipActive: {
    backgroundColor: HS_COLORS.primary,
    borderColor: HS_COLORS.primary,
  },
  dateChipText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: HS_COLORS.text,
    textAlign: 'center',
  },
  dateChipTextActive: { color: '#FFF' },
  dateChipStatus: {
    fontSize: moderateScale(10),
    color:  '#6B7280',
    textAlign: 'center',
    marginTop: SPACING.xxs,
  },
  dateChipStatusActive: { color: '#FFF' },
  dateChipStatusUnavailable: { color: '#EF4444' },
  noSlotsText: {
    fontSize: moderateScale(14),
    color: HS_COLORS.text,
    fontWeight: '500',
    textAlign: 'center',
    marginVertical: SPACING.lg,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  slotBtn: {
    minWidth: '30%',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#E0F2FE',
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  slotBtnActive: {
    backgroundColor: HS_COLORS.primary,
    borderColor: HS_COLORS.primary,
  },
  slotBtnBooked: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  slotText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: HS_COLORS.primary,
  },
  slotTextActive: { color: '#FFF' },
  slotTextBooked: { color: '#9CA3AF' },
  btnDisabled: { opacity: 0.5, backgroundColor: '#94A3B8' },
});

export default HomeServiceSlotSelection;
