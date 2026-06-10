import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { getOfferingById, getProviderById } from '../../../data/mockHomeServices';
import { HS_COLORS, hsStyles } from '../homeServiceTheme';
import { SPACING, moderateScale, LAYOUT } from '../../../utils/responsive';
import Location, { PatientLocation } from '../../../components/Location';

export type AddressFormData = {
  building: string;
  floorFlat?: string;
  street: string;
  landmark?: string;
  pincode: string;
  cityState: string;
};

type Params = {
  providerId: string;
  categoryId: string;
  serviceId: string;
  date: string;
  time: string;
  reason: string;
  patient: object;
};

type NavList = {
  HomeServiceAddress: Params;
  HomeServiceReviewPay: Params & { formData: AddressFormData };
};

type Route = RouteProp<NavList, 'HomeServiceAddress'>;
type Nav = StackNavigationProp<NavList, 'HomeServiceAddress'>;

const MOCK_SAVED = {
  building: 'Green Valley Apartments',
  floorFlat: 'Block B, Flat 402',
  street: 'Road No. 12, Banjara Hills',
  landmark: 'Near City Mall',
  pincode: '500034',
  cityState: 'Hyderabad, Telangana',
};

const HomeServiceAddress: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const provider = getProviderById(route.params.providerId);
  const service = getOfferingById(route.params.serviceId);

  const [form, setForm] = useState<AddressFormData>(MOCK_SAVED);
  const [useSaved, setUseSaved] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const update = (key: keyof AddressFormData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setUseSaved(false);
  };

  const handleLocationSelected = (loc: PatientLocation) => {
    setForm({
      building: form.building || '',
      floorFlat: form.floorFlat || '',
      street: loc.address || '',
      landmark: form.landmark || '',
      pincode: loc.pincode || '',
      cityState: loc.city && loc.state ? `${loc.city}, ${loc.state}` : (loc.city || loc.state || ''),
    });
    setUseSaved(false);
    setShowLocationModal(false);
  };

  const validate = (): boolean => {
    if (!form.building.trim() || !form.street.trim() || !form.pincode.trim()) {
      Alert.alert('Missing details', 'Building, street, and pincode are required.');
      return false;
    }
    if (!/^\d{6}$/.test(form.pincode.trim())) {
      Alert.alert('Invalid pincode', 'Enter a valid 6-digit pincode.');
      return false;
    }
    if (!form.cityState.trim()) {
      Alert.alert('Missing details', 'City & state is required.');
      return false;
    }
    return true;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    navigation.navigate('HomeServiceReviewPay', {
      ...route.params,
      formData: form,
    });
  };

  return (
    <SafeAreaView style={hsStyles.screen}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
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

          <TouchableOpacity
            style={[styles.savedCard, useSaved && styles.savedCardActive]}
            onPress={() => {
              setForm(MOCK_SAVED);
              setUseSaved(true);
            }}
          >
            <Text style={styles.savedLabel}>Use saved address</Text>
            <Text style={hsStyles.muted} numberOfLines={2}>
              {MOCK_SAVED.building}, {MOCK_SAVED.street}
            </Text>
          </TouchableOpacity>

          <Text style={hsStyles.sectionTitle}>Address details</Text>

          <Field label="Building / Apartment *" value={form.building} onChange={v => update('building', v)} />
          <Field label="Floor & Flat" value={form.floorFlat || ''} onChange={v => update('floorFlat', v)} optional />
          <Field label="Street / Locality *" value={form.street} onChange={v => update('street', v)} />
          <Field label="Landmark" value={form.landmark || ''} onChange={v => update('landmark', v)} optional />
          <Field label="Pincode *" value={form.pincode} onChange={v => update('pincode', v)} keyboard="number-pad" maxLength={6} />
          <Field label="City & State *" value={form.cityState} onChange={v => update('cityState', v)} />

          <View style={styles.feeNote}>
            <Text style={styles.feeNoteText}>
              Visit fee for {service?.name}: ₹{service?.price}
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={hsStyles.primaryBtn} onPress={handleConfirm}>
            <Text style={hsStyles.primaryBtnText}>Review & pay</Text>
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
  optional?: boolean;
  keyboard?: 'default' | 'number-pad';
  maxLength?: number;
}> = ({ label, value, onChange, optional, keyboard, maxLength }) => (
  <View style={styles.field}>
    <Text style={styles.label}>
      {label}
      {optional ? ' (optional)' : ''}
    </Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      placeholderTextColor={HS_COLORS.textMuted}
      keyboardType={keyboard}
      maxLength={maxLength}
    />
  </View>
);

const styles = StyleSheet.create({
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xl },
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
  savedCard: {
    backgroundColor: HS_COLORS.card,
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: HS_COLORS.border,
    marginBottom: SPACING.md,
  },
  savedCardActive: {
    borderColor: HS_COLORS.accent,
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
  },
  savedLabel: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: HS_COLORS.text,
    marginBottom: SPACING.xxs,
  },
  field: { marginBottom: SPACING.sm },
  label: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: HS_COLORS.textMuted,
    marginBottom: SPACING.xxs,
  },
  input: {
    backgroundColor: HS_COLORS.card,
    borderWidth: 1,
    borderColor: HS_COLORS.border,
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.sm,
    fontSize: moderateScale(14),
    color: HS_COLORS.text,
  },
  feeNote: {
    backgroundColor: HS_COLORS.accentSoft,
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    marginTop: SPACING.sm,
  },
  feeNoteText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#047857',
    textAlign: 'center',
  },
  footer: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: HS_COLORS.border,
    backgroundColor: HS_COLORS.bg,
  },
});

export default HomeServiceAddress;
