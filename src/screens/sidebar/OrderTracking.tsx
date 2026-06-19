import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import moment from 'moment';
import { getRentalOrderTracking } from '../../services/rentalService';
import { ActivityIndicator } from 'react-native';
import { HS_COLORS } from '../homeservices/homeServiceTheme';
import { LAYOUT, SAFE_AREA, SPACING, moderateScale, isTablet } from '../../utils/responsive';

type NavList = {
  OrderTracking: { orderId: string };
  CancelOrder: { orderId: string };
  ScheduleReturn: { orderId: string };
  MyOrders: undefined;
};

type Rt = RouteProp<NavList, 'OrderTracking'>;
type Nav = StackNavigationProp<NavList, 'OrderTracking'>;

function formatTrackingTime(time: string): string {
  if (!time || time === 'ETA' || time === 'Pending') return 'Pending';
  const m = moment(time);
  if (!m.isValid()) return time;
  return m.format('DD MMM YYYY, hh:mm A');
}

const OrderTracking: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchTracking = async () => {
        try {
          const res = await getRentalOrderTracking(route.params.orderId);
          if (res?.data) {
            setOrder(res.data);
          }
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      fetchTracking();
    }, [route.params.orderId]),
  );

  const isReturnPhase = useMemo(
    () =>
      order
        ? ['Return Scheduled', 'Return picked', 'Returned', 'Return due'].includes(order.status)
        : false,
    [order],
  );

  const timelineEvents = useMemo(() => {
    if (!order || !order.updates) return [];
    return order.updates;
  }, [order]);

  const currentIndex = useMemo(() => {
    if (!timelineEvents.length) return 0;
    let idx = -1;
    timelineEvents.forEach((e: any, i: number) => {
      if (e.isCompleted) idx = i;
    });
    return Math.max(idx, 0);
  }, [timelineEvents]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={HS_COLORS.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text>Order not found</Text>
      </View>
    );
  }

  const showCancel = order.status === 'Order placed' || order.status === 'Confirmed' || order.status === 'Packed & Ready';
  const showScheduleReturn = order.status === 'Return due' || order.status === 'Delivered';
  const isReturnDue = order.status === 'Return due';

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={HS_COLORS.primary} />

      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            {isReturnPhase ? 'Return tracking' : 'Live tracking'}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {order.orderId} · {order.status}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom:
              Math.max(insets.bottom, SAFE_AREA.safeBottom) +
              SPACING.xl +
              (showCancel || showScheduleReturn ? 72 : 0),
          },
        ]}
      >
        {order.rentalPeriod && (
          <View
            style={[
              styles.rentalCard,
              isReturnDue && styles.rentalCardUrgent,
            ]}
          >
            <Text style={styles.rentalLabel}>Rental period</Text>
            <Text style={styles.rentalPeriod}>{order.rentalPeriod}</Text>
          </View>
        )}

        {!isReturnPhase && (
          <View style={styles.mapCard}>
            <View style={styles.mapTop}>
              <Text style={styles.mapTitle}>Delivery route</Text>
              <View style={styles.etaPill}>
                <Text style={styles.etaText} numberOfLines={1}>
                  {order.deliveryRoute?.eta || 'Updating ETA...'}
                </Text>
              </View>
            </View>
            <View style={styles.mapMock}>
              <Text style={styles.mapMockText}>🗺️ Map preview (mock)</Text>
              <Text style={styles.mapMockSub}>
                Replace with Google Maps + real-time driver location later.
              </Text>
            </View>

          </View>
        )}

        {isReturnPhase && (
          <View style={styles.mapCard}>
            <View style={styles.mapMock}>
              <Text style={styles.mapMockText}>📦 Return pickup</Text>
              <Text style={styles.mapMockSub}>
                Our agent will collect the rented equipment from your address.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.orderCard}>
          <View style={styles.orderRow}>
            <Image source={require('../../assets/HomeServices.png')} style={styles.thumb} />
            <View style={styles.orderInfo}>
              <Text style={styles.itemName} numberOfLines={2}>
                {order.item?.name}
              </Text>
              <Text style={styles.meta}>
                {order.item?.category || 'Homecare rental'}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                📍 {order.item?.location}
              </Text>
            </View>
            <Text style={styles.amount}>₹{order.item?.price}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          {isReturnPhase ? 'Return updates' : 'Delivery updates'}
        </Text>
        <View style={styles.timeline}>
          {timelineEvents.map((ev: any, idx: number) => {
            const active = idx === currentIndex;
            const done = ev.isCompleted;
            const isLast = idx === timelineEvents.length - 1;
            return (
              <View
                key={idx.toString()}
                style={[styles.eventRow, isLast && styles.eventRowLast]}
              >
                <View style={styles.dotCol}>
                  <View
                    style={[
                      styles.dot,
                      done && styles.dotDone,
                      active && styles.dotActive,
                    ]}
                  />
                  {!isLast && <View style={[styles.line, done && styles.lineDone]} />}
                </View>
                <View style={styles.eventContent}>
                  <Text style={[styles.evTitle, active && styles.evTitleActive]}>
                    {ev.status}
                  </Text>
                  {!!ev.description && (
                    <Text style={styles.evDesc}>{ev.description}</Text>
                  )}
                  {!!ev.timestamp && (
                    <Text style={styles.evTime}>{formatTrackingTime(ev.timestamp)}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {order.status === 'Cancelled' && (
          <View style={styles.cancelledBanner}>
            <Text style={styles.cancelledText}>This order was cancelled.</Text>
          </View>
        )}

        {order.status === 'Returned' && (
          <View style={styles.completedBanner}>
            <Text style={styles.completedText}>
              Return complete. Deposit refund in 3–5 business days.
            </Text>
          </View>
        )}
      </ScrollView>

      {(showCancel || showScheduleReturn) && (
        <View
          style={[
            styles.stickyFooter,
            {
              paddingBottom:
                Platform.OS === 'android'
                  ? Math.max(insets.bottom, SAFE_AREA.safeBottom) + SPACING.xs
                  : insets.bottom,
            },
          ]}
        >
          {showScheduleReturn && (
            <TouchableOpacity
              style={styles.scheduleBtn}
              onPress={() => navigation.navigate('ScheduleReturn', { orderId: order.orderId })}
            >
              <Text style={styles.scheduleBtnText}>
                {isReturnDue ? 'Schedule return pickup now' : 'Schedule return pickup'}
              </Text>
            </TouchableOpacity>
          )}
          {showCancel && (
            <TouchableOpacity
              style={styles.cancelOrderBtn}
              onPress={() => navigation.navigate('CancelOrder', { orderId: order.orderId })}
            >
              <Text style={styles.cancelOrderBtnText}>Cancel delivery</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
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
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomLeftRadius: LAYOUT.borderRadius.xl,
    borderBottomRightRadius: LAYOUT.borderRadius.xl,
  },
  backBtn: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  backText: { color: '#FFF', fontSize: moderateScale(20), fontWeight: '700' },
  headerText: { flex: 1, minWidth: 0 },
  title: { color: '#FFF', fontSize: moderateScale(18), fontWeight: '800' },
  sub: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: moderateScale(12),
    fontWeight: '600',
    marginTop: 2,
  },
  scroll: {
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    paddingTop: SPACING.md,
  },
  rentalCard: {
    backgroundColor: '#FFF',
    borderRadius: LAYOUT.borderRadius.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: SPACING.md,
  },
  rentalCardUrgent: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  rentalLabel: {
    fontSize: moderateScale(10),
    fontWeight: '900',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rentalPeriod: {
    marginTop: 4,
    fontSize: moderateScale(14),
    fontWeight: '800',
    color: '#0F172A',
  },
  rentalDays: {
    marginTop: SPACING.xs,
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: HS_COLORS.primary,
  },
  pickupScheduled: {
    marginTop: SPACING.sm,
    backgroundColor: '#EFF6FF',
    padding: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
  },
  pickupScheduledText: { fontSize: moderateScale(12), fontWeight: '800', color: '#1E40AF' },
  cancelReason: {
    marginTop: SPACING.sm,
    fontSize: moderateScale(11),
    color: '#991B1B',
    fontWeight: '700',
  },
  mapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...LAYOUT.shadow.sm,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  mapTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  mapTitle: {
    fontSize: moderateScale(13),
    fontWeight: '900',
    color: '#0F172A',
    flex: 1,
  },
  etaPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: 999,
    maxWidth: '50%',
  },
  etaText: { color: '#166534', fontSize: moderateScale(10), fontWeight: '900' },
  mapMock: {
    backgroundColor: '#E0F2FE',
    padding: SPACING.lg,
    alignItems: 'center',
  },
  mapMockText: { fontSize: moderateScale(14), fontWeight: '900', color: '#0A3D62' },
  mapMockSub: {
    marginTop: 6,
    fontSize: moderateScale(11),
    color: '#1D4ED8',
    fontWeight: '800',
    textAlign: 'center',
  },
  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: SPACING.sm,
  },
  riderAvatar: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderAvatarText: { fontSize: moderateScale(16), fontWeight: '900', color: '#1E40AF' },
  riderInfo: { flex: 1, minWidth: 0 },
  riderName: { fontSize: moderateScale(13), fontWeight: '900', color: '#0F172A' },
  riderMeta: { marginTop: 2, fontSize: moderateScale(11), color: '#64748B', fontWeight: '700' },
  riderPhone: { marginTop: 2, fontSize: moderateScale(11), color: '#64748B' },
  callBtn: {
    backgroundColor: HS_COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    flexShrink: 0,
  },
  callBtnText: { color: '#FFF', fontSize: moderateScale(12), fontWeight: '900' },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...LAYOUT.shadow.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  orderRow: { flexDirection: 'row', alignItems: 'center' },
  thumb: {
    width: moderateScale(54),
    height: moderateScale(54),
    borderRadius: LAYOUT.borderRadius.lg,
    backgroundColor: '#F1F5F9',
    flexShrink: 0,
  },
  orderInfo: { flex: 1, marginLeft: SPACING.md, minWidth: 0, marginRight: SPACING.xs },
  itemName: { fontSize: moderateScale(13), fontWeight: '900', color: '#0F172A' },
  meta: { marginTop: 2, fontSize: moderateScale(11), color: '#64748B', fontWeight: '700' },
  amount: {
    fontSize: moderateScale(14),
    fontWeight: '900',
    color: HS_COLORS.primary,
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: SPACING.sm,
  },
  timeline: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...LAYOUT.shadow.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  eventRow: { flexDirection: 'row', marginBottom: SPACING.md },
  eventRowLast: { marginBottom: 0 },
  dotCol: { width: moderateScale(24), alignItems: 'center' },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#CBD5E1',
    marginTop: 4,
  },
  dotDone: { backgroundColor: '#22C55E' },
  dotActive: {
    backgroundColor: '#0A3D62',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: moderateScale(24),
    backgroundColor: '#E2E8F0',
    marginTop: 4,
  },
  lineDone: { backgroundColor: '#BBF7D0' },
  eventContent: { flex: 1, paddingLeft: SPACING.sm, minWidth: 0 },
  evTitle: { fontSize: moderateScale(13), fontWeight: '800', color: '#0F172A' },
  evTitleActive: { color: '#0A3D62' },
  evDesc: {
    marginTop: 4,
    fontSize: moderateScale(12),
    color: '#64748B',
    fontWeight: '600',
    lineHeight: moderateScale(17),
  },
  evTime: { marginTop: 4, fontSize: moderateScale(11), color: '#94A3B8', fontWeight: '700' },
  cancelledBanner: {
    backgroundColor: '#FEE2E2',
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.lg,
    marginBottom: SPACING.md,
  },
  cancelledText: { color: '#991B1B', fontWeight: '800', textAlign: 'center' },
  completedBanner: {
    backgroundColor: '#DCFCE7',
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.lg,
    marginBottom: SPACING.md,
  },
  completedText: { color: '#166534', fontWeight: '800', textAlign: 'center' },
  stickyFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: SPACING.sm,
  },
  scheduleBtn: {
    backgroundColor: HS_COLORS.primary,
    paddingVertical: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    minHeight: moderateScale(48),
    justifyContent: 'center',
  },
  scheduleBtnText: { color: '#FFF', fontWeight: '900', fontSize: moderateScale(14) },
  cancelOrderBtn: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: LAYOUT.borderRadius.md,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    minHeight: moderateScale(44),
    justifyContent: 'center',
  },
  cancelOrderBtnText: { color: '#DC2626', fontWeight: '800', fontSize: moderateScale(14) },
});

export default OrderTracking;
