import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import moment from 'moment';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  canScheduleReturn,
  formatRentalPeriod,
  getOrderById,
  scheduleReturn,
} from '../../data/mockOrders';
import { HS_COLORS } from '../homeservices/homeServiceTheme';
import { LAYOUT, SAFE_AREA, SPACING, moderateScale } from '../../utils/responsive';

type Params = { orderId: string };
type NavList = {
  ScheduleReturn: Params;
  ReturnConfirmation: { orderId: string };
};

type Route = RouteProp<NavList, 'ScheduleReturn'>;
type Nav = StackNavigationProp<NavList, 'ScheduleReturn'>;

const TIME_SLOTS = [
  '09:00 AM – 11:00 AM',
  '11:00 AM – 01:00 PM',
  '02:00 PM – 04:00 PM',
  '04:00 PM – 06:00 PM',
  '06:00 PM – 08:00 PM',
];

const ScheduleReturn: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const order = getOrderById(route.params.orderId);

  const quickDates = useMemo(() => {
    return [0, 1, 2].map(offset => {
      const d = moment().add(offset, 'days');
      return { date: d.format('YYYY-MM-DD'), label: d.format('ddd, DD MMM') };
    });
  }, []);

  const [selectedDate, setSelectedDate] = useState(quickDates[0].date);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!order || !order.rental) {
    return (
      <View style={styles.center}>
        <Text>Order not found</Text>
      </View>
    );
  }

  const handleSchedule = () => {
    if (!selectedSlot) {
      Alert.alert('Select a time slot', 'Choose when we should pick up the rented item.');
      return;
    }
    if (!canScheduleReturn(order)) {
      Alert.alert('Already scheduled', 'Return pickup is already booked for this order.');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      scheduleReturn(order.id, { date: selectedDate, timeSlot: selectedSlot });
      setSubmitting(false);
      navigation.replace('ReturnConfirmation', { orderId: order.id });
    }, 900);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={HS_COLORS.primary} />

      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule return</Text>
        <View style={styles.backPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, SAFE_AREA.safeBottom) + 100 },
        ]}
      >
        <View style={styles.infoCard}>
          <Text style={styles.infoEmoji}>📦</Text>
          <Text style={styles.infoTitle}>Send item back after rental</Text>
          <Text style={styles.infoProduct}>{order.items[0]?.name}</Text>
          <Text style={styles.infoPeriod}>{formatRentalPeriod(order)}</Text>
          <Text style={styles.infoAddr}>Pickup from: {order.addressShort}</Text>
          <View style={styles.depositBox}>
            <Text style={styles.depositText}>
              Refundable deposit: ₹{order.rental.deposit} (after quality check)
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Pickup date</Text>
        <View style={styles.dateRow}>
          {quickDates.map(d => (
            <TouchableOpacity
              key={d.date}
              style={[styles.dateChip, selectedDate === d.date && styles.dateChipActive]}
              onPress={() => setSelectedDate(d.date)}
            >
              <Text
                style={[
                  styles.dateChipText,
                  selectedDate === d.date && styles.dateChipTextActive,
                ]}
              >
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>
          Pickup time slot
        </Text>
        {TIME_SLOTS.map(slot => (
          <TouchableOpacity
            key={slot}
            style={[styles.slotRow, selectedSlot === slot && styles.slotRowActive]}
            onPress={() => setSelectedSlot(slot)}
          >
            <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextActive]}>
              {slot}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            Keep the product ready at your door. Our agent will verify condition before
            pickup. Late returns may incur extra charges.
          </Text>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom:
              Platform.OS === 'android'
                ? Math.max(insets.bottom, SAFE_AREA.safeBottom) + SPACING.xs
                : insets.bottom,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.primaryBtn, (!selectedSlot || submitting) && styles.btnDisabled]}
          onPress={handleSchedule}
          disabled={!selectedSlot || submitting}
        >
          <Text style={styles.primaryBtnText}>
            {submitting ? 'Scheduling...' : 'Confirm return pickup'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F0F9F6' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: HS_COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  backBtn: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: { width: moderateScale(40) },
  backText: { color: '#FFF', fontSize: moderateScale(20) },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#FFF',
    fontSize: moderateScale(17),
    fontWeight: '800',
  },
  scroll: { padding: SPACING.md },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: LAYOUT.borderRadius.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  infoEmoji: { fontSize: moderateScale(36) },
  infoTitle: {
    marginTop: SPACING.sm,
    fontSize: moderateScale(16),
    fontWeight: '900',
    color: '#0F172A',
  },
  infoProduct: { marginTop: 4, fontSize: moderateScale(14), fontWeight: '800', color: HS_COLORS.primary },
  infoPeriod: { marginTop: SPACING.xs, fontSize: moderateScale(12), color: '#64748B', fontWeight: '700' },
  infoAddr: { marginTop: 4, fontSize: moderateScale(12), color: '#64748B' },
  depositBox: {
    marginTop: SPACING.md,
    backgroundColor: '#ECFDF5',
    padding: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    width: '100%',
  },
  depositText: {
    fontSize: moderateScale(12),
    color: '#047857',
    fontWeight: '800',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: SPACING.sm,
  },
  dateRow: { flexDirection: 'row', gap: SPACING.sm },
  dateChip: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  dateChipActive: { backgroundColor: HS_COLORS.primary, borderColor: HS_COLORS.primary },
  dateChipText: { fontSize: moderateScale(11), fontWeight: '800', color: '#334155' },
  dateChipTextActive: { color: '#FFF' },
  slotRow: {
    backgroundColor: '#FFF',
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotRowActive: { borderColor: HS_COLORS.primary, backgroundColor: '#EFF6FF' },
  slotText: { fontSize: moderateScale(14), fontWeight: '700', color: '#334155' },
  slotTextActive: { color: HS_COLORS.primary },
  tipCard: {
    marginTop: SPACING.md,
    backgroundColor: '#FFFBEB',
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tipText: { fontSize: moderateScale(12), color: '#92400E', lineHeight: moderateScale(17) },
  footer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFF',
  },
  primaryBtn: {
    backgroundColor: HS_COLORS.primary,
    paddingVertical: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    minHeight: moderateScale(48),
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#FFF', fontWeight: '900', fontSize: moderateScale(14) },
});

export default ScheduleReturn;
