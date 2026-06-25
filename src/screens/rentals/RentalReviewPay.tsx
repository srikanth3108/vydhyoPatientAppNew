import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { placeRentalOrder, getRentalProductById } from '../../services/rentalService';
import { extractPaymentSessionFromResponse } from '../../services/homeCareService';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { HS_COLORS } from '../homeservices/homeServiceTheme';
import { LAYOUT, SPACING, moderateScale, SAFE_AREA, isTablet } from '../../utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type AddressForm = {
  fullName: string;
  phone: string;
  building: string;
  street: string;
  landmark?: string;
  pincode: string;
  cityState: string;
};

type Params = {
  productId: string;
  billingUnit: 'hours' | 'days' | 'months';
  quantity: number;
  baseAmount: number;
  address: AddressForm;
  productInfo: {
    name: string;
    rating: number;
    reviewCount: number;
    availableNow: boolean;
    etaMinutes: number;
    deposit: number;
    deliveryFee: number;
  };
};

type NavList = {
  RentalReviewPay: Params;
  RentalOrderConfirmation: { orderId: string };
  HomeServicePaymentGateway: {
    payment_session_id: string;
    order_id: string;
    productId: string;
    billingUnit: string;
    quantity: number;
    baseAmount: number;
    address: AddressForm;
  };
};

type RouteT = RouteProp<NavList, 'RentalReviewPay'>;
type Nav = StackNavigationProp<NavList, 'RentalReviewPay'>;

const RentalReviewPay: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();
  const insets = useSafeAreaInsets();

  const { productId, billingUnit, quantity, baseAmount, address, productInfo } = route.params;
  const user: any = useSelector((state: any) => state.currentUser);

  const deposit = productInfo.deposit ?? 0;
  const delivery = productInfo.deliveryFee ?? 0;
  const platformFee = Math.max(19, Math.round(baseAmount * 0.02));
  const total = useMemo(() => baseAmount + deposit + delivery + platformFee, [baseAmount, deposit, delivery, platformFee]);

  const userWallet = useSelector((s: any) => s.userWallet);
  const [useWallet, setUseWallet] = useState(false);
  const walletBalance = userWallet?.balance || 0;
  const hasWalletBalance = walletBalance > 0;

  const { walletDeduction, upiAmount } = useMemo(() => {
    let walletDeduction = 0;
    let upiAmount = total;

    if (useWallet && walletBalance > 0) {
      walletDeduction = Math.min(walletBalance, total);
      upiAmount = Math.max(total - walletDeduction, 0);
    }

    return { walletDeduction, upiAmount };
  }, [total, useWallet, walletBalance]);

  const [paying, setPaying] = useState(false);

  const addressLines = [
    address.fullName,
    address.phone,
    address.building,
    address.street,
    address.landmark,
    `${address.cityState} - ${address.pincode}`,
  ].filter(Boolean);

  const handlePay = async () => {
    setPaying(true);
    try {
      const orderData = {
        patientId: user?.userId,
        productId,
        duration: {
          type: billingUnit,
          value: quantity
        },
        shippingAddress: {
          fullName: address.fullName,
          phone: address.phone.replace(/[^0-9]/g, '').slice(-10),
          building: address.building,
          street: address.street,
          landmark: address.landmark || '',
          pincode: address.pincode,
          city: address.cityState.split(',')[0]?.trim() || '',
          state: address.cityState.split(',')[1]?.trim() || ''
        },
        pricing: {
          rentalAmount: baseAmount,
          depositAmount: deposit,
          deliveryFee: delivery,
          platformFee: platformFee,
          totalPayable: total,
          currency: 'INR'
        }
      };

      console.log(',,,mmmmmm',orderData)
      const response = await placeRentalOrder(orderData);
      
      const paymentSessionData = extractPaymentSessionFromResponse(response);
      if (paymentSessionData && upiAmount > 0) {
        navigation.replace('HomeServicePaymentGateway', {
          payment_session_id: paymentSessionData.payment_session_id,
          order_id: paymentSessionData.order_id,
          productId,
          billingUnit,
          quantity,
          baseAmount,
          address,
        });
      } else {
        // Fallback or full discount
        const orderId = response?.data?.orderId || `ORD-RNT-${Date.now().toString().slice(-6)}`;
        navigation.replace('RentalOrderConfirmation', { orderId });
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to place rental order.';
      
      Alert.alert('Payment Error', msg);
      console.error(error);
    } finally {
      setPaying(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Review your rental</Text>
          <Text style={styles.bannerSub}>Review your order details below.</Text>
        </View>

        <Section title="Product" icon="🧰">
          <Text style={styles.bold}>{productInfo.name}</Text>
          <Text style={styles.muted}>★ {productInfo.rating} ({productInfo.reviewCount} reviews)</Text>
          <View style={styles.pillsRow}>
            <View style={styles.pillSoft}>
              <Text style={styles.pillSoftText}>
                {quantity} {billingUnit}
              </Text>
            </View>
            <View style={styles.pillSoft}>
              <Text style={styles.pillSoftText}>
                Delivery {productInfo.availableNow ? `ETA ${productInfo.etaMinutes}m` : 'Scheduled'}
              </Text>
            </View>
          </View>
        </Section>

        <Section title="Delivery address" icon="📍">
          {addressLines.map((ln, idx) => (
            <Text key={idx} style={styles.line}>
              {ln}
            </Text>
          ))}
        </Section>

        <Section title="Price summary" icon="🧾">
          <Row label="Rental amount" value={`₹${baseAmount}`} />
          <Row label={`Deposit ${productInfo.deposit ? '(refundable)' : ''}`} value={`₹${deposit}`} />
          <Row label="Delivery fee" value={`₹${delivery}`} />
          <Row label="Platform fee" value={`₹${platformFee}`} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total payable</Text>
            <Text style={styles.totalValue}>₹{total}</Text>
          </View>
          <Text style={styles.disclaimer}>
            Deposit is refundable after pickup and quality check.
          </Text>
        </Section>

        <Text style={styles.sectionTitle}>Pay with</Text>
        <View style={styles.walletSection}>
          <TouchableOpacity
            style={styles.walletRow}
            onPress={() => {
              if (hasWalletBalance) setUseWallet(prev => !prev);
            }}
            activeOpacity={hasWalletBalance ? 0.7 : 1}
          >
            <View
              style={[
                styles.checkbox,
                useWallet && hasWalletBalance && styles.checkboxChecked,
                !hasWalletBalance && styles.checkboxDisabled,
              ]}
            >
              {useWallet && hasWalletBalance && (
                <Text style={styles.checkboxTick}>✓</Text>
              )}
            </View>
            <View style={styles.walletInfo}>
              <Text style={[styles.walletLabel, !hasWalletBalance && styles.walletLabelDisabled]}>
                Use Wallet Balance
              </Text>
              <Text style={[styles.walletBalanceText, !hasWalletBalance && styles.walletLabelDisabled]}>
                {hasWalletBalance ? `Balance: ₹${walletBalance}` : 'No wallet balance available'}
              </Text>
            </View>
          </TouchableOpacity>

          {useWallet && hasWalletBalance && walletDeduction > 0 && (
            <View style={styles.walletBreakdown}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Wallet deduction</Text>
                <Text style={[styles.breakdownValue, { color: '#EF4444' }]}>
                  - ₹{walletDeduction}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ℹ️ Real flow: provider uploads inventory → patient rents → delivery + pickup scheduled → deposit refunded.
          </Text>
        </View>

        <View style={{ height: moderateScale(110) }} />
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
        <TouchableOpacity style={styles.cta} onPress={handlePay} disabled={paying}>
          {paying ? <ActivityIndicator color="#FFF" /> : <Text style={styles.ctaText}>{upiAmount > 0 ? `Pay ₹${upiAmount}` : 'Pay from Wallet'}</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancel}
          onPress={() =>
            Alert.alert('Cancel checkout?', 'Your rental won’t be placed.', [
              { text: 'Stay', style: 'cancel' },
              { text: 'Leave', style: 'destructive', onPress: () => navigation.goBack() },
            ])
          }
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const Section: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({
  title,
  icon,
  children,
}) => (
  <View style={styles.card}>
    <View style={styles.cardHead}>
      <Text style={styles.cardIcon}>{icon}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.muted}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F0F9F6' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: isTablet ? SPACING.lg : SPACING.md, paddingTop: SPACING.md },
  banner: { backgroundColor: HS_COLORS.primary, borderRadius: LAYOUT.borderRadius.lg, padding: SPACING.md, marginBottom: SPACING.md },
  bannerTitle: { color: '#FFF', fontSize: moderateScale(16), fontWeight: '900' },
  bannerSub: { color: 'rgba(255,255,255,0.85)', fontSize: moderateScale(12), marginTop: 4, fontWeight: '700' },
  card: { backgroundColor: '#FFF', borderRadius: LAYOUT.borderRadius.lg, borderWidth: 1, borderColor: '#E2E8F0', padding: SPACING.md, marginBottom: SPACING.md },
  cardHead: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  cardIcon: { fontSize: moderateScale(16), marginRight: SPACING.xs },
  cardTitle: { fontSize: moderateScale(12), fontWeight: '900', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.6 },
  bold: { fontSize: moderateScale(15), fontWeight: '900', color: '#0F172A' },
  muted: { fontSize: moderateScale(12), color: '#64748B', fontWeight: '700' },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginTop: SPACING.sm },
  pillSoft: { backgroundColor: '#E2E8F0', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  pillSoftText: { fontSize: moderateScale(11), fontWeight: '800', color: '#0F172A' },
  line: { fontSize: moderateScale(12), color: '#0F172A', fontWeight: '700', marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xs },
  rowValue: { fontSize: moderateScale(13), fontWeight: '900', color: '#0F172A' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  totalLabel: { fontSize: moderateScale(14), fontWeight: '900', color: '#0F172A' },
  totalValue: { fontSize: moderateScale(18), fontWeight: '900', color: HS_COLORS.primary },
  disclaimer: { marginTop: SPACING.sm, fontSize: moderateScale(11), color: '#475569', fontWeight: '700' },
  sectionTitle: { marginTop: SPACING.xs, marginBottom: SPACING.sm, fontSize: moderateScale(14), fontWeight: '900', color: '#0F172A' },
  walletSection: { backgroundColor: '#FFF', borderRadius: LAYOUT.borderRadius.lg, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: HS_COLORS.border },
  walletRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 22, height: 22, borderWidth: 2, borderColor: HS_COLORS.border, borderRadius: 4, marginRight: SPACING.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  checkboxChecked: { backgroundColor: HS_COLORS.primary, borderColor: HS_COLORS.primary },
  checkboxDisabled: { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' },
  checkboxTick: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  walletInfo: { flex: 1 },
  walletLabel: { fontSize: moderateScale(14), fontWeight: '600', color: HS_COLORS.text },
  walletLabelDisabled: { color: '#94A3B8' },
  walletBalanceText: { fontSize: moderateScale(11), color: HS_COLORS.textMuted, marginTop: 2 },
  walletBreakdown: { marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs },
  breakdownLabel: { fontSize: moderateScale(12), color: HS_COLORS.textMuted },
  breakdownValue: { fontSize: moderateScale(12), fontWeight: '500', color: HS_COLORS.text },
  infoBox: { backgroundColor: '#FEF9C3', borderWidth: 1, borderColor: '#FDE047', borderRadius: LAYOUT.borderRadius.md, padding: SPACING.md },
  infoText: { fontSize: moderateScale(12), color: '#854D0E', fontWeight: '800' },
  footer: { paddingHorizontal: isTablet ? SPACING.lg : SPACING.md, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#F0F9F6' },
  cta: { backgroundColor: HS_COLORS.primary, borderRadius: LAYOUT.borderRadius.md, minHeight: moderateScale(44), alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#FFF', fontSize: moderateScale(14), fontWeight: '900' },
  cancel: { marginTop: SPACING.sm, alignItems: 'center' },
  cancelText: { color: '#64748B', fontSize: moderateScale(13), fontWeight: '800' },
});

export default RentalReviewPay;

