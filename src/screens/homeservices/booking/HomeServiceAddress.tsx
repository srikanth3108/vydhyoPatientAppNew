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
import { getProviderDetailsById } from '../../../services/homeCareService';
import { AuthPost, ENDPOINTS } from '../../../services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
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
  patientAddressId?: string;
};

type Params = {
  providerId: string;
  categoryId: string;
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

const HomeServiceAddress: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const user: any = useSelector((state: any) => state.currentUser);
  const route = useRoute<Route>();
  const [provider, setProvider] = useState<any>(null);

  const [form, setForm] = useState<AddressFormData>({ building: '', street: '', pincode: '', cityState: '' });
  const [useSaved, setUseSaved] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchProvider = async () => {
      const res = await getProviderDetailsById(route.params.providerId);
      if (res.provider) setProvider(res.provider);
    };
    fetchProvider();
  }, [route.params.providerId]);

  React.useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const res: any = await AuthPost(ENDPOINTS.GET_ADDRESSES, { userId: user?.userId }, token);
        if (res?.data && Array.isArray(res.data)) {
          setAddresses(res.data);
          if (res.data.length > 0) {
            const first = res.data[0];
            setForm({
              building: first.address || '',
              floorFlat: '',
              street: first.address || '',
              landmark: '',
              pincode: first.pincode || '',
              cityState: first.city && first.state ? `${first.city}, ${first.state}` : (first.city || first.state || ''),
            });
            setUseSaved(true);
            setSelectedAddressId(first.addressId);
          }
        }
      } catch (e) {
        console.log(e);
      }
    };
    fetchAddresses();
  }, [user?.userId]);

  const update = (key: keyof AddressFormData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setUseSaved(false);
    setSelectedAddressId(null);
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

  const handleConfirm = async () => {
    if (!validate()) return;

    let currentAddressId = selectedAddressId;
    if (!useSaved) {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const payload = {
          type: "Home",
          address: `${form.building} ${form.floorFlat ? form.floorFlat : ''} ${form.street} ${form.landmark ? form.landmark : ''}`.trim(),
          city: form.cityState.split(',')[0]?.trim() || '',
          state: form.cityState.split(',')[1]?.trim() || form.cityState.split(',')[0]?.trim() || '',
          country: "India",
          pincode: form.pincode,
          latitude: 0,
          longitude: 0,
        };
        const res: any = await AuthPost(ENDPOINTS.ADD_ADDRESS, payload, token);
        if (res?.status === 200 && res?.data?.addressId) {
           currentAddressId = res.data.addressId;
        }
      } catch (e) {
        console.log("Failed to add address", e);
      }
    }

    navigation.navigate('HomeServiceReviewPay', {
      ...route.params,
      formData: { ...form, patientAddressId: currentAddressId || '' },
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
          {provider?.fullName && (
            <View style={[styles.summaryCard, { flexDirection: 'column', alignItems: 'flex-start' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', width: '100%' }}>
                <View style={[hsStyles.avatar, { width: 50, height: 50 }]}>
                  <Text style={[hsStyles.avatarText, { fontSize: 20 }]}>{provider.fullName.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                  <Text style={styles.summaryName}>{provider.fullName}</Text>
                  {provider.specialization ? <Text style={hsStyles.muted}>{provider.specialization}</Text> : null}
                  {provider.profession ? <Text style={[hsStyles.muted, { marginTop: 4, fontSize: 12 }]}>Clinic Name: {provider.profession}</Text> : null}
                </View>
              </View>
              {provider.homeAddress && (
                <View style={{ marginTop: SPACING.sm, paddingLeft: 60, flexDirection: 'row' }}>
                  <Text style={{ color: '#E74C3C', marginRight: 4 }}>📍</Text>
                  <Text style={{ flex: 1, fontSize: 12, color: '#3b82f6' }}>{provider.homeAddress}</Text>
                </View>
              )}
              <TouchableOpacity style={{ width: '100%', alignItems: 'flex-end', marginTop: 8 }} onPress={() => navigation.navigate('ProviderDetails' as any, { providerId: route.params.providerId, categoryId: route.params.categoryId })}>
                 <Text style={{ color: '#3b82f6', fontSize: 12, fontWeight: '600' }}>👁 View Details</Text>
              </TouchableOpacity>
            </View>
          )}

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

          {addresses.length > 0 && (
            <View style={{ marginBottom: SPACING.md }}>
              <Text style={[hsStyles.sectionTitle, { marginBottom: SPACING.xs }]}>Saved addresses</Text>
              {addresses.map(addr => (
                <TouchableOpacity
                  key={addr.addressId}
                  style={[styles.savedCard, selectedAddressId === addr.addressId && styles.savedCardActive]}
                  onPress={() => {
                    setForm({
                      building: addr.address,
                      floorFlat: '',
                      street: addr.address,
                      landmark: '',
                      pincode: addr.pincode,
                      cityState: addr.city && addr.state ? `${addr.city}, ${addr.state}` : (addr.city || addr.state || ''),
                    });
                    setUseSaved(true);
                    setSelectedAddressId(addr.addressId);
                  }}
                >
                  <Text style={styles.savedLabel}>{addr.type || 'Home'}</Text>
                  <Text style={hsStyles.muted} numberOfLines={2}>
                    {addr.address}, {addr.city} - {addr.pincode}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={hsStyles.sectionTitle}>Address details</Text>

          <Field label="Building / Apartment *" value={form.building} onChange={v => update('building', v)} />
          <Field label="Floor & Flat" value={form.floorFlat || ''} onChange={v => update('floorFlat', v)} optional />
          <Field label="Street / Locality *" value={form.street} onChange={v => update('street', v)} />
          <Field label="Landmark" value={form.landmark || ''} onChange={v => update('landmark', v)} optional />
          <Field label="Pincode *" value={form.pincode} onChange={v => update('pincode', v)} keyboard="number-pad" maxLength={6} />
          <Field label="City & State *" value={form.cityState} onChange={v => update('cityState', v)} />

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
  summaryCard: {
    backgroundColor: HS_COLORS.card,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: HS_COLORS.border,
  },
  summaryName: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: HS_COLORS.text,
  },
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
  footer: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: HS_COLORS.border,
    backgroundColor: HS_COLORS.bg,
  },
});

export default HomeServiceAddress;
