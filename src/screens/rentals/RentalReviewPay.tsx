import React, { useMemo, useState } from 'react';
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
import { addRentalOrderFromBooking } from '../../data/mockOrders';
import { getRentalProductById } from '../../data/mockRentals';
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
};

type NavList = {
  RentalReviewPay: Params;
  RentalOrderConfirmation: { orderId: string };
};

type RouteT = RouteProp<NavList, 'RentalReviewPay'>;
type Nav = StackNavigationProp<NavList, 'RentalReviewPay'>;

const PAYMENT_OPTIONS = [
  { id: 'upi', label: 'UPI', icon: '📱' },
  { id: 'card', label: 'Card', icon: '💳' },
  { id: 'wallet', label: 'Wallet', icon: '👛' },
] as const;

const RentalReviewPay: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();
  const insets = useSafeAreaInsets();

  const { productId, billingUnit, quantity, baseAmount, address } = route.params;
  const product = getRentalProductById(productId);

  const [method, setMethod] = useState<(typeof PAYMENT_OPTIONS)[number]['id']>('upi');
  const [paying, setPaying] = useState(false);

  const deposit = product?.deposit ?? 0;
  const delivery = product?.deliveryFee ?? 0;
  const platformFee = Math.max(19, Math.round(baseAmount * 0.02));
  const total = useMemo(() => baseAmount + deposit + delivery + platformFee, [baseAmount, deposit, delivery, platformFee]);

  if (!product) {
    return (
      <View style={styles.center}>
        <Text>Product not found</Text>
      </View>
    );
  }

  const addressLines = [
    address.fullName,
    address.phone,
    address.building,
    address.street,
    address.landmark,
    `${address.cityState} - ${address.pincode}`,
  ].filter(Boolean);

  const handlePay = () => {
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      const orderId = `ORD-RNT-${Date.now().toString().slice(-6)}`;
      const addressShort = `${address.cityState}`.split(',')[0] || address.pincode;
      addRentalOrderFromBooking({
        orderId,
        productId,
        productName: product!.name,
        thumbnail: product!.thumbnail,
        billingUnit,
        duration: quantity,
        totalAmount: total,
        deposit,
        addressShort,
      });
      navigation.replace('RentalOrderConfirmation', { orderId });
    }, 1600);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Review your rental</Text>
          <Text style={styles.bannerSub}>Mock checkout — no real payment will be processed.</Text>
        </View>

        <Section title="Product" icon="🧰">
          <Text style={styles.bold}>{product.name}</Text>
          <Text style={styles.muted}>★ {product.rating} ({product.reviewCount} reviews)</Text>
          <View style={styles.pillsRow}>
            <View style={styles.pillSoft}>
              <Text style={styles.pillSoftText}>
                {quantity} {billingUnit}
              </Text>
            </View>
            <View style={styles.pillSoft}>
              <Text style={styles.pillSoftText}>
                Delivery {product.availableNow ? `ETA ${product.etaMinutes}m` : 'Scheduled'}
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
          <Row label={`Deposit ${product.refundableDeposit ? '(refundable)' : ''}`} value={`₹${deposit}`} />
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
        <View style={styles.payRow}>
          {PAYMENT_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.id}
              style={[styles.payCard, method === opt.id && styles.payCardActive]}
              onPress={() => setMethod(opt.id)}
            >
              <Text style={styles.payIcon}>{opt.icon}</Text>
              <Text style={[styles.payLabel, method === opt.id && styles.payLabelActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
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
          {paying ? <ActivityIndicator color="#FFF" /> : <Text style={styles.ctaText}>Pay ₹{total}</Text>}
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
  payRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  payCard: { flex: 1, backgroundColor: '#FFF', borderRadius: LAYOUT.borderRadius.md, borderWidth: 1, borderColor: '#E2E8F0', padding: SPACING.md, alignItems: 'center' },
  payCardActive: { borderColor: HS_COLORS.primary, backgroundColor: '#EFF6FF' },
  payIcon: { fontSize: moderateScale(24), marginBottom: 6 },
  payLabel: { fontSize: moderateScale(12), fontWeight: '900', color: '#64748B' },
  payLabelActive: { color: HS_COLORS.primary },
  infoBox: { backgroundColor: '#FEF9C3', borderWidth: 1, borderColor: '#FDE047', borderRadius: LAYOUT.borderRadius.md, padding: SPACING.md },
  infoText: { fontSize: moderateScale(12), color: '#854D0E', fontWeight: '800' },
  footer: { paddingHorizontal: isTablet ? SPACING.lg : SPACING.md, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#F0F9F6' },
  cta: { backgroundColor: HS_COLORS.primary, borderRadius: LAYOUT.borderRadius.md, minHeight: moderateScale(44), alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#FFF', fontSize: moderateScale(14), fontWeight: '900' },
  cancel: { marginTop: SPACING.sm, alignItems: 'center' },
  cancelText: { color: '#64748B', fontSize: moderateScale(13), fontWeight: '800' },
});

export default RentalReviewPay;

