import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MockOrder,
  canScheduleReturn,
  getAllOrders,
  isOrderActive,
  isOrderCancelled,
  isOrderCompleted,
} from '../../data/mockOrders';
import { HS_COLORS } from '../homeservices/homeServiceTheme';
import { LAYOUT, SAFE_AREA, SPACING, moderateScale, isTablet } from '../../utils/responsive';

type NavList = {
  MyOrders: undefined;
  OrderTracking: { orderId: string };
  ScheduleReturn: { orderId: string };
};

type Nav = StackNavigationProp<NavList, 'MyOrders'>;

type Filter = 'ACTIVE' | 'DELIVERED' | 'CANCELLED';

const statusColor = (status: MockOrder['status']) => {
  if (status === 'RETURNED') return { bg: '#DCFCE7', fg: '#166534' };
  if (status === 'CANCELLED') return { bg: '#FEE2E2', fg: '#991B1B' };
  if (status === 'RETURN_DUE') return { bg: '#FEF3C7', fg: '#B45309' };
  if (['RETURN_SCHEDULED', 'RETURN_PICKED'].includes(status))
    return { bg: '#E0E7FF', fg: '#3730A3' };
  if (status === 'IN_USE') return { bg: '#D1FAE5', fg: '#047857' };
  return { bg: '#DBEAFE', fg: '#1E40AF' };
};

const OrderCard: React.FC<{
  order: MockOrder;
  onPress: () => void;
  onScheduleReturn?: () => void;
}> = ({ order, onPress, onScheduleReturn }) => {
  const pill = statusColor(order.status);
  const first = order.items[0];
  const showReturnCta = canScheduleReturn(order);
  return (
    <View style={styles.card}>
      <TouchableOpacity activeOpacity={0.92} onPress={onPress}>
        <View style={styles.row}>
          <Image source={first.thumbnail} style={styles.thumb} />
          <View style={styles.cardBody}>
            <View style={styles.topRow}>
              <Text style={styles.orderId} numberOfLines={1}>
                {order.id}
              </Text>
              <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
                <Text style={[styles.statusText, { color: pill.fg }]}>{order.statusLabel}</Text>
              </View>
            </View>

            <Text style={styles.itemName} numberOfLines={1}>
              {first.name}
              {order.items.length > 1 ? ` +${order.items.length - 1} more` : ''}
            </Text>

            <Text style={styles.meta} numberOfLines={1}>
              📍 {order.addressShort}
            </Text>

            <View style={styles.bottomRow}>
              <Text style={styles.total}>₹{order.totalAmount}</Text>
              <Text style={styles.eta} numberOfLines={1}>
                {order.etaText || '—'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {showReturnCta && onScheduleReturn && (
        <TouchableOpacity style={styles.returnCta} onPress={onScheduleReturn}>
          <Text style={styles.returnCtaText}>
            {order.status === 'RETURN_DUE' ? 'Schedule return pickup' : 'Plan return pickup'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const MyOrders: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('ACTIVE');
  const [orders, setOrders] = useState(getAllOrders);

  useFocusEffect(
    useCallback(() => {
      setOrders(getAllOrders());
    }, []),
  );

  const list = useMemo(() => {
    if (filter === 'DELIVERED') return orders.filter(isOrderCompleted);
    if (filter === 'CANCELLED') return orders.filter(isOrderCancelled);
    return orders.filter(o => isOrderActive(o) && !isOrderCancelled(o));
  }, [filter, orders]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={HS_COLORS.primary} />

      {/* Hero — single title, no overlap with tabs */}
      <View style={[styles.hero, { paddingTop: insets.top + SPACING.sm }]}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.heroTitle}>My Orders</Text>
          <View style={styles.backPlaceholder} />
        </View>

        <Text style={styles.heroSub}>
          Track rentals and home-service bookings in one place.
        </Text>

        {/* Filters sit inside hero with clear spacing — no negative margin */}
        <View style={styles.filters}>
          {([
            { id: 'ACTIVE', label: 'Active' },
            { id: 'DELIVERED', label: 'Completed' },
            { id: 'CANCELLED', label: 'Cancelled' },
          ] as const).map(f => (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterBtn, filter === f.id && styles.filterBtnActive]}
              onPress={() => setFilter(f.id)}
            >
              <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, SAFE_AREA.safeBottom) + SPACING.xl },
        ]}
      >
        {list.map(order => (
          <OrderCard
            key={order.id}
            order={order}
            onPress={() => navigation.navigate('OrderTracking', { orderId: order.id })}
            onScheduleReturn={() =>
              navigation.navigate('ScheduleReturn', { orderId: order.id })
            }
          />
        ))}

        {list.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No orders</Text>
            <Text style={styles.emptySub}>Your orders will appear here once you place one.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F0F9F6' },
  hero: {
    backgroundColor: HS_COLORS.primary,
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomLeftRadius: LAYOUT.borderRadius.xl,
    borderBottomRightRadius: LAYOUT.borderRadius.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  backBtn: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: { width: moderateScale(40) },
  backText: { color: '#FFF', fontSize: moderateScale(20), fontWeight: '700' },
  heroTitle: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: moderateScale(12),
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: moderateScale(17),
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  filters: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  filterBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: LAYOUT.borderRadius.lg,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    minHeight: moderateScale(40),
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
    ...LAYOUT.shadow.sm,
  },
  filterText: { fontSize: moderateScale(12), fontWeight: '800', color: '#64748B' },
  filterTextActive: { color: HS_COLORS.primary },
  scrollContent: {
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    paddingTop: SPACING.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: SPACING.sm,
    ...LAYOUT.shadow.sm,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  cardBody: { flex: 1, marginLeft: SPACING.md, minWidth: 0 },
  thumb: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: LAYOUT.borderRadius.lg,
    backgroundColor: '#F1F5F9',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.xs,
  },
  orderId: {
    fontSize: moderateScale(12),
    fontWeight: '900',
    color: '#0F172A',
    flex: 1,
    flexShrink: 1,
  },
  statusPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 999,
    flexShrink: 0,
  },
  statusText: { fontSize: moderateScale(10), fontWeight: '900' },
  itemName: {
    marginTop: 6,
    fontSize: moderateScale(13),
    fontWeight: '800',
    color: '#0F172A',
  },
  meta: { marginTop: 2, fontSize: moderateScale(11), color: '#64748B', fontWeight: '700' },
  bottomRow: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  total: { fontSize: moderateScale(14), fontWeight: '900', color: HS_COLORS.primary },
  eta: {
    fontSize: moderateScale(11),
    color: '#64748B',
    fontWeight: '800',
    flex: 1,
    textAlign: 'right',
  },
  returnCta: {
    marginTop: SPACING.sm,
    backgroundColor: HS_COLORS.primary,
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: SPACING.xs,
    alignItems: 'center',
  },
  returnCtaText: {
    color: '#FFF',
    fontSize: moderateScale(11),
    fontWeight: '900',
  },
  empty: { padding: SPACING.xl, alignItems: 'center' },
  emptyTitle: { fontSize: moderateScale(16), fontWeight: '900', color: '#0F172A' },
  emptySub: {
    marginTop: SPACING.xs,
    fontSize: moderateScale(12),
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '700',
  },
});

export default MyOrders;
