import React, { useMemo, useState } from 'react';
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
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRentalProductById } from '../../data/mockRentals';
import { HS_COLORS } from '../homeservices/homeServiceTheme';
import { LAYOUT, SAFE_AREA, SPACING, moderateScale, isTablet } from '../../utils/responsive';

type Params = { productId: string };
type NavList = {
  RentalProductDetails: Params;
  RentalAddress: {
    productId: string;
    billingUnit: 'hours' | 'days' | 'months';
    quantity: number;
    baseAmount: number;
  };
};

type RouteT = RouteProp<NavList, 'RentalProductDetails'>;
type Nav = StackNavigationProp<NavList, 'RentalProductDetails'>;

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const RentalProductDetails: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();
  const insets = useSafeAreaInsets();
  const product = getRentalProductById(route.params.productId);

  type BillingUnit = 'hours' | 'days' | 'months';
  const [billingUnit, setBillingUnit] = useState<BillingUnit>('hours');
  const [qty, setQty] = useState(4);

  const rate =
    billingUnit === 'hours'
      ? product?.hourlyRate ?? 0
      : billingUnit === 'days'
        ? product?.dailyRate ?? 0
        : (product?.dailyRate ?? 0) * 30;
  const baseAmount = useMemo(() => rate * qty, [rate, qty]);
  const maxQty = billingUnit === 'hours' ? 12 : billingUnit === 'days' ? 14 : 12;

  if (!product) {
    return (
      <View style={styles.center}>
        <Text>Product not found</Text>
      </View>
    );
  }

  const canProceed = qty > 0;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.heroCard}>
          <Image source={product.thumbnail} style={styles.heroImage} />
          <View style={styles.heroRight}>
            <Text style={styles.name}>{product.name}</Text>
            <Text style={styles.short}>{product.shortDescription}</Text>
            <View style={styles.badgesRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>★ {product.rating}</Text>
              </View>
              <View style={styles.badgeSoft}>
                <Text style={styles.badgeSoftText}>{product.reviewCount} reviews</Text>
              </View>
              <View
                style={[
                  styles.badgeSoft,
                  { backgroundColor: product.availableNow ? '#DCFCE7' : '#FEF3C7' },
                ]}
              >
                <Text style={[styles.badgeSoftText, { color: product.availableNow ? '#166534' : '#92400E' }]}>
                  {product.availableNow ? `ETA ${product.etaMinutes}m` : 'Pre-book'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Select duration</Text>
          <View style={styles.segment}>
            <TouchableOpacity
              style={[styles.segmentBtn, billingUnit === 'hours' && styles.segmentBtnActive]}
              onPress={() => {
                setBillingUnit('hours');
                setQty(q => clamp(q, 1, 12));
              }}
            >
              <Text style={[styles.segmentText, billingUnit === 'hours' && styles.segmentTextActive]}>
                Hours
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentBtn, billingUnit === 'days' && styles.segmentBtnActive]}
              onPress={() => {
                setBillingUnit('days');
                setQty(q => clamp(q, 1, 14));
              }}
            >
              <Text style={[styles.segmentText, billingUnit === 'days' && styles.segmentTextActive]}>
                Days
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentBtn, billingUnit === 'months' && styles.segmentBtnActive]}
              onPress={() => {
                setBillingUnit('months');
                setQty(q => clamp(q, 1, 12));
              }}
            >
              <Text style={[styles.segmentText, billingUnit === 'months' && styles.segmentTextActive]}>
                Months
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.qtyRow}>
            <Text style={styles.qtyLabel}>
              {billingUnit === 'hours'
                ? 'How many hours?'
                : billingUnit === 'days'
                  ? 'How many days?'
                  : 'How many months?'}
            </Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setQty(q => clamp(q - 1, 1, maxQty))}
              >
                <Text style={styles.stepText}>−</Text>
              </TouchableOpacity>
              <View style={styles.stepValue}>
                <Text style={styles.stepValueText}>{qty}</Text>
                <Text style={styles.stepValueSub}>{billingUnit}</Text>
              </View>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setQty(q => clamp(q + 1, 1, maxQty))}
              >
                <Text style={styles.stepText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.muted}>
              Rate: ₹{rate}/
              {billingUnit === 'hours'
                ? 'hr'
                : billingUnit === 'days'
                  ? 'day'
                  : 'month'}
            </Text>
            <Text style={styles.price}>₹{baseAmount}</Text>
          </View>

          <View style={styles.finePrint}>
            <Text style={styles.finePrintText}>
              Deposit ₹{product.deposit} {product.refundableDeposit ? '(refundable)' : ''} · Delivery ₹{product.deliveryFee}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.body}>{product.description}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Highlights</Text>
          <View style={styles.chipsRow}>
            {product.highlights.map(h => (
              <View key={h} style={styles.chip}>
                <Text style={styles.chipText}>✓ {h}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Specifications</Text>
          <View style={styles.specGrid}>
            {product.specs.map(s => (
              <View key={s.label} style={styles.specCard}>
                <Text style={styles.specLabel}>{s.label}</Text>
                <Text style={styles.specValue}>{s.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>What’s included</Text>
          {product.included.map(it => (
            <Text key={it} style={styles.listItem}>
              • {it}
            </Text>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Safety & hygiene</Text>
          {product.safety.map(it => (
            <Text key={it} style={styles.listItem}>
              • {it}
            </Text>
          ))}
        </View>

        <View style={{ height: moderateScale(96) }} />
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
        <View style={styles.footerLeft}>
          <Text style={styles.footerPrice}>₹{baseAmount}</Text>
          <Text style={styles.footerSub}>
            {qty} {billingUnit} · + deposit & delivery
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.cta, !canProceed && { opacity: 0.5 }]}
          disabled={!canProceed}
          onPress={() =>
            navigation.navigate('RentalAddress', {
              productId: product.id,
              billingUnit,
              quantity: qty,
              baseAmount,
            })
          }
        >
          <Text style={styles.ctaText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F0F9F6' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: isTablet ? SPACING.lg : SPACING.md, paddingTop: SPACING.md },
  heroCard: {
    backgroundColor: '#FFF',
    borderRadius: LAYOUT.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  heroImage: { width: moderateScale(92), height: moderateScale(92) },
  heroRight: { flex: 1, padding: SPACING.md },
  name: { fontSize: moderateScale(16), fontWeight: '900', color: '#0F172A' },
  short: { marginTop: 4, fontSize: moderateScale(12), color: '#475569', lineHeight: moderateScale(16) },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginTop: SPACING.sm },
  badge: {
    backgroundColor: HS_COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { color: '#FFF', fontSize: moderateScale(11), fontWeight: '800' },
  badgeSoft: { backgroundColor: '#E2E8F0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeSoftText: { color: '#0F172A', fontSize: moderateScale(11), fontWeight: '700' },
  card: {
    backgroundColor: '#FFF',
    borderRadius: LAYOUT.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: { fontSize: moderateScale(14), fontWeight: '900', color: '#0F172A', marginBottom: SPACING.sm },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: LAYOUT.borderRadius.md,
    padding: 4,
    marginBottom: SPACING.md,
  },
  segmentBtn: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: LAYOUT.borderRadius.sm },
  segmentBtnActive: { backgroundColor: HS_COLORS.primary },
  segmentText: { fontSize: moderateScale(13), fontWeight: '800', color: '#334155' },
  segmentTextActive: { color: '#FFF' },
  qtyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyLabel: { fontSize: moderateScale(12), fontWeight: '700', color: '#475569' },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: LAYOUT.borderRadius.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  stepText: { fontSize: moderateScale(22), color: '#0F172A', fontWeight: '900' },
  stepValue: { minWidth: moderateScale(64), alignItems: 'center', marginHorizontal: SPACING.sm },
  stepValueText: { fontSize: moderateScale(18), fontWeight: '900', color: HS_COLORS.primary },
  stepValueSub: { fontSize: moderateScale(10), fontWeight: '800', color: '#64748B', marginTop: 2 },
  priceRow: { marginTop: SPACING.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  muted: { fontSize: moderateScale(12), color: '#64748B', fontWeight: '700' },
  price: { fontSize: moderateScale(18), color: HS_COLORS.primary, fontWeight: '900' },
  finePrint: {
    marginTop: SPACING.sm,
    backgroundColor: '#F8FAFC',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  finePrintText: { fontSize: moderateScale(11), color: '#475569', fontWeight: '700' },
  body: { fontSize: moderateScale(13), color: '#334155', lineHeight: moderateScale(18) },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  chip: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#BBF7D0', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { fontSize: moderateScale(12), color: '#14532D', fontWeight: '800' },
  specGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  specCard: {
    width: '47%',
    backgroundColor: '#F8FAFC',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  specLabel: { fontSize: moderateScale(11), color: '#64748B', fontWeight: '800' },
  specValue: { marginTop: 4, fontSize: moderateScale(13), color: '#0F172A', fontWeight: '900' },
  listItem: { fontSize: moderateScale(12), color: '#334155', marginBottom: 6, fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F0F9F6',
  },
  footerLeft: { flex: 1, marginRight: SPACING.md },
  footerPrice: { fontSize: moderateScale(18), fontWeight: '900', color: HS_COLORS.primary },
  footerSub: { marginTop: 2, fontSize: moderateScale(11), color: '#64748B', fontWeight: '700' },
  cta: {
    backgroundColor: HS_COLORS.primary,
    borderRadius: LAYOUT.borderRadius.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    minHeight: moderateScale(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { color: '#FFF', fontSize: moderateScale(14), fontWeight: '900' },
});

export default RentalProductDetails;

