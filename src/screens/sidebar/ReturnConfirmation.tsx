import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import moment from 'moment';
import { getOrderById } from '../../data/mockOrders';
import { HS_COLORS } from '../homeservices/homeServiceTheme';
import { LAYOUT, SPACING, moderateScale } from '../../utils/responsive';

type Params = { orderId: string };
type NavList = {
  ReturnConfirmation: Params;
  OrderTracking: { orderId: string };
  MyOrders: undefined;
};

type Route = RouteProp<NavList, 'ReturnConfirmation'>;
type Nav = StackNavigationProp<NavList, 'ReturnConfirmation'>;

const ReturnConfirmation: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const order = getOrderById(route.params.orderId);
  const pickup = order?.rental?.returnPickup;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + SPACING.lg }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F9F6" />
      <View style={styles.card}>
        <Text style={styles.icon}>✅</Text>
        <Text style={styles.title}>Return scheduled</Text>
        <Text style={styles.sub}>
          We will pick up your rented item from your address. Please keep it ready and
          sanitized.
        </Text>

        {pickup && (
          <View style={styles.pickupBox}>
            <Text style={styles.pickupLabel}>Pickup details</Text>
            <Text style={styles.pickupValue}>
              {moment(pickup.date).format('dddd, DD MMM YYYY')}
            </Text>
            <Text style={styles.pickupSlot}>{pickup.timeSlot}</Text>
            <Text style={styles.pickupAddr}>📍 {order?.addressShort}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.primary}
          onPress={() =>
            navigation.navigate('OrderTracking', { orderId: route.params.orderId })
          }
        >
          <Text style={styles.primaryText}>Track return pickup</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondary} onPress={() => navigation.navigate('MyOrders')}>
          <Text style={styles.secondaryText}>Back to My Orders</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F0F9F6',
    padding: SPACING.md,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: LAYOUT.borderRadius.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  icon: { fontSize: moderateScale(48) },
  title: {
    marginTop: SPACING.md,
    fontSize: moderateScale(20),
    fontWeight: '900',
    color: '#0F172A',
  },
  sub: {
    marginTop: SPACING.sm,
    fontSize: moderateScale(13),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: moderateScale(19),
    fontWeight: '600',
  },
  pickupBox: {
    marginTop: SPACING.lg,
    width: '100%',
    backgroundColor: '#EFF6FF',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  pickupLabel: {
    fontSize: moderateScale(10),
    fontWeight: '900',
    color: '#1E40AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickupValue: {
    marginTop: SPACING.xs,
    fontSize: moderateScale(16),
    fontWeight: '900',
    color: HS_COLORS.primary,
  },
  pickupSlot: { marginTop: 4, fontSize: moderateScale(14), fontWeight: '700', color: '#334155' },
  pickupAddr: { marginTop: SPACING.sm, fontSize: moderateScale(12), color: '#64748B' },
  primary: {
    marginTop: SPACING.lg,
    width: '100%',
    backgroundColor: HS_COLORS.primary,
    paddingVertical: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    minHeight: moderateScale(48),
    justifyContent: 'center',
  },
  primaryText: { color: '#FFF', fontWeight: '900', fontSize: moderateScale(14) },
  secondary: {
    marginTop: SPACING.sm,
    width: '100%',
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  secondaryText: { color: HS_COLORS.primary, fontWeight: '800', fontSize: moderateScale(14) },
});

export default ReturnConfirmation;
