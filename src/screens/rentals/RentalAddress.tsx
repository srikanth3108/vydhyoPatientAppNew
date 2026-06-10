import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { getRentalProductById } from '../../data/mockRentals';
import { HS_COLORS, hsStyles } from '../homeservices/homeServiceTheme';
import { LAYOUT, SPACING, moderateScale, SAFE_AREA, isTablet } from '../../utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Location, { PatientLocation } from '../../components/Location';

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
};

type NavList = {
  RentalAddress: Params;
  RentalReviewPay: Params & { address: AddressForm };
};

type RouteT = RouteProp<NavList, 'RentalAddress'>;
type Nav = StackNavigationProp<NavList, 'RentalAddress'>;

const RentalAddress: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();
  const insets = useSafeAreaInsets();
  const product = getRentalProductById(route.params.productId);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const [useSaved, setUseSaved] = useState(true);
  const saved = useMemo<AddressForm>(
    () => ({
      fullName: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      building: 'Green Valley Apartments',
      street: 'Road No. 12, Banjara Hills',
      landmark: 'Near City Mall',
      pincode: '500034',
      cityState: 'Hyderabad, Telangana',
    }),
    [],
  );

  const [form, setForm] = useState<AddressForm>(saved);
  const handleLocationSelected = (loc: PatientLocation) => {
    setForm(prev => ({
      ...prev,
      building: loc.building || '',
      street: loc.address || '',
      landmark: loc.landmark || '',
      pincode: loc.pincode || '',
      cityState: loc.city && loc.state ? `${loc.city}, ${loc.state}` : (loc.city || loc.state || ''),
    }));
    setUseSaved(false);
    setShowLocationModal(false);
  };

  if (!product) {
    return (
      <View style={styles.center}>
        <Text>Product not found</Text>
      </View>
    );
  }

  const update = (k: keyof AddressForm, v: string) => {
    setUseSaved(false);
    setForm(prev => ({ ...prev, [k]: v }));
  };

  const validate = () => {
    if (!form.fullName.trim() || !form.phone.trim()) {
      Alert.alert('Missing details', 'Name and phone are required.');
      return false;
    }
    if (!form.building.trim() || !form.street.trim() || !form.cityState.trim()) {
      Alert.alert('Missing details', 'Please enter complete address.');
      return false;
    }
    if (!/^\d{6}$/.test(form.pincode.trim())) {
      Alert.alert('Invalid pincode', 'Enter a valid 6-digit pincode.');
      return false;
    }
    return true;
  };

  const handleContinue = () => {
    if (!validate()) return;
    navigation.navigate('RentalReviewPay', { ...route.params, address: form });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <TouchableOpacity
            style={styles.mapPreview}
            onPress={() => setShowLocationModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.mapEmoji}>📍</Text>
            <Text style={styles.mapTitle}>Locate on Map / Use GPS</Text>
            <Text style={hsStyles.muted}>
              Tap to auto-detect or select exact location
            </Text>
          </TouchableOpacity>
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>Delivery & setup</Text>
            <Text style={styles.bannerSub}>
              We’ll deliver {product.name} to your location. Setup help is included where available.
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              setUseSaved(true);
              setForm(saved);
            }}
            style={[styles.savedCard, useSaved && styles.savedCardActive]}
          >
            <Text style={styles.savedTitle}>Use saved address</Text>
            <Text style={styles.savedLine} numberOfLines={2}>
              {saved.building}, {saved.street}
            </Text>
            <Text style={styles.savedSmall}>{saved.cityState} - {saved.pincode}</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Contact</Text>
          <Field label="Full name *" value={form.fullName} onChange={v => update('fullName', v)} />
          <Field label="Phone *" value={form.phone} onChange={v => update('phone', v)} />

          <Text style={styles.sectionTitle}>Address</Text>
          <Field label="Building / Apartment *" value={form.building} onChange={v => update('building', v)} />
          <Field label="Street / Locality *" value={form.street} onChange={v => update('street', v)} />
          <Field label="Landmark" value={form.landmark || ''} onChange={v => update('landmark', v)} />
          <Field
            label="Pincode *"
            value={form.pincode}
            onChange={v => update('pincode', v)}
            keyboard="number-pad"
            maxLength={6}
          />
          <Field label="City & State *" value={form.cityState} onChange={v => update('cityState', v)} />

          <View style={styles.note}>
            <Text style={styles.noteText}>ℹ️ Please ensure your phone is reachable for delivery coordination.</Text>
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
          <TouchableOpacity style={styles.cta} onPress={handleContinue}>
            <Text style={styles.ctaText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <Modal
        visible={showLocationModal}
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <Location
          onLocationSelected={handleLocationSelected}
          initialLocation={{
            address: form.street,
            pincode: form.pincode,
            city: form.cityState.split(',')[0]?.trim() || '',
            state: form.cityState.split(',')[1]?.trim() || '',
          }}
          confirmLabel="Confirm Address Details"
        />
      </Modal>
    </SafeAreaView>
  );
};

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboard?: 'default' | 'number-pad';
  maxLength?: number;
}> = ({ label, value, onChange, keyboard, maxLength }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      keyboardType={keyboard}
      maxLength={maxLength}
      placeholderTextColor="#94A3B8"
    />
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F0F9F6' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: isTablet ? SPACING.lg : SPACING.md, paddingTop: SPACING.md },
  banner: {
    backgroundColor: HS_COLORS.primary,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  bannerTitle: { color: '#FFF', fontSize: moderateScale(15), fontWeight: '900' },
  bannerSub: { color: 'rgba(255,255,255,0.85)', fontSize: moderateScale(12), marginTop: 4, lineHeight: moderateScale(16) },
  savedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  savedCardActive: { borderColor: HS_COLORS.accent, borderWidth: 2, backgroundColor: '#F0FDF4' },
  savedTitle: { fontSize: moderateScale(13), fontWeight: '900', color: '#0F172A' },
  savedLine: { marginTop: 4, fontSize: moderateScale(12), color: '#334155', fontWeight: '700' },
  savedSmall: { marginTop: 2, fontSize: moderateScale(11), color: '#64748B', fontWeight: '700' },
  sectionTitle: { marginTop: SPACING.xs, marginBottom: SPACING.sm, fontSize: moderateScale(14), fontWeight: '900', color: '#0F172A' },
  field: { marginBottom: SPACING.sm },
  label: { fontSize: moderateScale(11), fontWeight: '900', color: '#64748B', marginBottom: 6 },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: moderateScale(14),
    color: '#0F172A',
  },
  note: { backgroundColor: '#FEF9C3', borderWidth: 1, borderColor: '#FDE047', borderRadius: LAYOUT.borderRadius.md, padding: SPACING.md, marginTop: SPACING.sm },
  noteText: { fontSize: moderateScale(12), color: '#854D0E', fontWeight: '700' },
  footer: {
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F0F9F6',
  },
  cta: {
    backgroundColor: HS_COLORS.primary,
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: moderateScale(44),
  },
  ctaText: { color: '#FFF', fontSize: moderateScale(14), fontWeight: '900' },
  mapPreview: {
    backgroundColor: '#DBEAFE',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  mapEmoji: { fontSize: moderateScale(36) },
  mapTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: HS_COLORS.primary,
    marginTop: SPACING.xs,
  },
});

export default RentalAddress;

