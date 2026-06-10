import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { HS_COLORS } from '../homeservices/homeServiceTheme';
import { LAYOUT, SPACING, moderateScale } from '../../utils/responsive';

type NavList = {
  RentalOrderConfirmation: { orderId: string };
  Home: undefined;
  RentalsCatalog: { categoryId?: string; agentId?: string } | undefined;
  MyOrders: undefined;
  OrderTracking: { orderId: string };
};

type RouteT = RouteProp<NavList, 'RentalOrderConfirmation'>;
type Nav = StackNavigationProp<NavList, 'RentalOrderConfirmation'>;

const RentalOrderConfirmation: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={HS_COLORS.primary} />
      <View style={styles.card}>
        <Text style={styles.icon}>✅</Text>
        <Text style={styles.title}>Rental placed</Text>
        <Text style={styles.sub}>
          Your request has been created successfully. Our team will call you to confirm delivery & pickup.
        </Text>

        <View style={styles.orderBox}>
          <Text style={styles.orderLabel}>Order ID</Text>
          <Text style={styles.orderValue}>{route.params.orderId}</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>ℹ️ This is mock checkout. Replace with your real payment/order API later.</Text>
        </View>

        <TouchableOpacity
          style={styles.primary}
          onPress={() => navigation.navigate('OrderTracking', { orderId: route.params.orderId })}
        >
          <Text style={styles.primaryText}>Track delivery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondary} onPress={() => navigation.navigate('MyOrders')}>
          <Text style={styles.secondaryText}>View all orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tertiary} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.tertiaryText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: HS_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  icon: { fontSize: moderateScale(42), textAlign: 'center' },
  title: { marginTop: SPACING.sm, fontSize: moderateScale(18), fontWeight: '900', color: '#0F172A', textAlign: 'center' },
  sub: { marginTop: SPACING.xs, fontSize: moderateScale(12), color: '#475569', textAlign: 'center', lineHeight: moderateScale(17), fontWeight: '700' },
  orderBox: { marginTop: SPACING.md, backgroundColor: '#EFF6FF', borderRadius: LAYOUT.borderRadius.lg, padding: SPACING.md, borderWidth: 1, borderColor: '#DBEAFE' },
  orderLabel: { fontSize: moderateScale(11), color: '#1E40AF', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.6 },
  orderValue: { marginTop: 4, fontSize: moderateScale(16), color: HS_COLORS.primary, fontWeight: '900' },
  infoBox: { marginTop: SPACING.md, backgroundColor: '#FEF9C3', borderRadius: LAYOUT.borderRadius.lg, padding: SPACING.md, borderWidth: 1, borderColor: '#FDE047' },
  infoText: { fontSize: moderateScale(12), color: '#854D0E', fontWeight: '800', textAlign: 'center' },
  primary: { marginTop: SPACING.md, backgroundColor: HS_COLORS.primary, borderRadius: LAYOUT.borderRadius.md, paddingVertical: SPACING.sm, alignItems: 'center', minHeight: moderateScale(44), justifyContent: 'center' },
  primaryText: { color: '#FFF', fontSize: moderateScale(14), fontWeight: '900' },
  secondary: { marginTop: SPACING.sm, borderRadius: LAYOUT.borderRadius.md, paddingVertical: SPACING.sm, alignItems: 'center', minHeight: moderateScale(44), justifyContent: 'center', borderWidth: 2, borderColor: '#E2E8F0' },
  secondaryText: { color: '#0F172A', fontSize: moderateScale(14), fontWeight: '900' },
  tertiary: { marginTop: SPACING.sm, paddingVertical: SPACING.xs, alignItems: 'center' },
  tertiaryText: { color: '#64748B', fontSize: moderateScale(13), fontWeight: '800' },
});

export default RentalOrderConfirmation;

