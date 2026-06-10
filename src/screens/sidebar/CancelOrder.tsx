import React, { useState } from 'react';
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
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  cancelOrder,
  canCancelOrder,
  getOrderById,
} from '../../data/mockOrders';
import { HS_COLORS } from '../homeservices/homeServiceTheme';
import { LAYOUT, SAFE_AREA, SPACING, moderateScale, isTablet } from '../../utils/responsive';

type Params = { orderId: string };
type NavList = {
  CancelOrder: Params;
  MyOrders: undefined;
};

type Route = RouteProp<NavList, 'CancelOrder'>;
type Nav = StackNavigationProp<NavList, 'CancelOrder'>;

const REASONS = [
  'Ordered by mistake',
  'Found a better price elsewhere',
  'Delivery taking too long',
  'Changed my mind',
  'Wrong address / product',
  'Other',
];

const CancelOrder: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const order = getOrderById(route.params.orderId);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!order) {
    return (
      <View style={styles.center}>
        <Text>Order not found</Text>
      </View>
    );
  }

  const handleConfirm = () => {
    if (!selected) {
      Alert.alert('Select a reason', 'Please tell us why you want to cancel.');
      return;
    }
    if (!canCancelOrder(order)) {
      Alert.alert('Cannot cancel', 'This order can no longer be cancelled.');
      return;
    }

    Alert.alert(
      'Cancel this order?',
      'Your delivery will be stopped. Refund (if any) will be processed in 3–5 business days.',
      [
        { text: 'Keep order', style: 'cancel' },
        {
          text: 'Yes, cancel',
          style: 'destructive',
          onPress: () => {
            setSubmitting(true);
            setTimeout(() => {
              cancelOrder(order.id, selected);
              setSubmitting(false);
              navigation.navigate('MyOrders');
            }, 800);
          },
        },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={HS_COLORS.primary} />

      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cancel order</Text>
        <View style={styles.backPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, SAFE_AREA.safeBottom) + 100 },
        ]}
      >
        <View style={styles.warnCard}>
          <Text style={styles.warnIcon}>⚠️</Text>
          <Text style={styles.warnTitle}>Cancel before delivery</Text>
          <Text style={styles.warnSub}>
            Order {order.id} · {order.items[0]?.name}
          </Text>
          <Text style={styles.warnHint}>
            You can only cancel while the item has not been delivered yet.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Why are you cancelling?</Text>
        {REASONS.map(reason => (
          <TouchableOpacity
            key={reason}
            style={[styles.reasonRow, selected === reason && styles.reasonRowActive]}
            onPress={() => setSelected(reason)}
          >
            <View style={[styles.radio, selected === reason && styles.radioOn]}>
              {selected === reason && <View style={styles.radioInner} />}
            </View>
            <Text style={[styles.reasonText, selected === reason && styles.reasonTextActive]}>
              {reason}
            </Text>
          </TouchableOpacity>
        ))}
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
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtnText}>Keep my order</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.confirmBtn, (!selected || submitting) && styles.confirmDisabled]}
          onPress={handleConfirm}
          disabled={!selected || submitting}
        >
          <Text style={styles.confirmBtnText}>
            {submitting ? 'Cancelling...' : 'Confirm cancellation'}
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
  backText: { color: '#FFF', fontSize: moderateScale(20), fontWeight: '700' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#FFF',
    fontSize: moderateScale(17),
    fontWeight: '800',
  },
  scroll: { padding: SPACING.md },
  warnCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: LAYOUT.borderRadius.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  warnIcon: { fontSize: moderateScale(32) },
  warnTitle: {
    marginTop: SPACING.xs,
    fontSize: moderateScale(16),
    fontWeight: '900',
    color: '#991B1B',
  },
  warnSub: { marginTop: 4, fontSize: moderateScale(12), color: '#B91C1C', fontWeight: '700' },
  warnHint: {
    marginTop: SPACING.sm,
    fontSize: moderateScale(11),
    color: '#7F1D1D',
    textAlign: 'center',
    lineHeight: moderateScale(16),
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: SPACING.sm,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reasonRowActive: { borderColor: HS_COLORS.primary, backgroundColor: '#EFF6FF' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  radioOn: { borderColor: HS_COLORS.primary },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: HS_COLORS.primary,
  },
  reasonText: { flex: 1, fontSize: moderateScale(14), color: '#334155', fontWeight: '600' },
  reasonTextActive: { color: HS_COLORS.primary, fontWeight: '800' },
  footer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFF',
    gap: SPACING.sm,
  },
  cancelBtn: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: LAYOUT.borderRadius.md,
    borderWidth: 1.5,
    borderColor: HS_COLORS.primary,
    minHeight: moderateScale(44),
    justifyContent: 'center',
  },
  cancelBtnText: { color: HS_COLORS.primary, fontWeight: '800', fontSize: moderateScale(14) },
  confirmBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: LAYOUT.borderRadius.md,
    minHeight: moderateScale(44),
    justifyContent: 'center',
  },
  confirmDisabled: { opacity: 0.5 },
  confirmBtnText: { color: '#FFF', fontWeight: '800', fontSize: moderateScale(14) },
});

export default CancelOrder;
