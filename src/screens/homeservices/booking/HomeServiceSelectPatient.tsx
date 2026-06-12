import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFamilyMembers, addFamilyMember, FamilyMember, getProviderDetailsById } from '../../../services/homeCareService';
import { HS_COLORS, hsStyles } from '../homeServiceTheme';
import { SPACING, moderateScale, LAYOUT, SAFE_AREA } from '../../../utils/responsive';

type Params = {
  providerId: string;
  categoryId: string;
  date: string;
  time: string;
  reason: string;
  provider:any
};

type NavList = {
  HomeServiceSelectPatient: Params;
  HomeServiceAddress: Params & { patient: object };
};

type Route = RouteProp<NavList, 'HomeServiceSelectPatient'>;
type Nav = StackNavigationProp<NavList, 'HomeServiceSelectPatient'>;

const HomeServiceSelectPatient: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const currentUser = useSelector((state: any) => state.currentUser);

  const [provider, setProvider] = useState<any>(route.params.provider);

  const [forSelf, setForSelf] = useState(true);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchFamily = async () => {
      setLoading(true);
      const res = await getFamilyMembers();
      if (res.familyMembers) {
        setFamilyMembers(res.familyMembers);
      }
      setLoading(false);
    };
    fetchFamily(
    );
  }, []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Fields State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [relationship, setRelationship] = useState('Father');
  const [mobile, setMobile] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const canProceed = forSelf || selectedMember !== null;

  const validateForm = () => {
    const tempErrors: { [key: string]: string } = {};
    if (!firstName.trim()) {
      tempErrors.firstName = 'First name is required';
    }
    if (!mobile.trim()) {
      tempErrors.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(mobile.replace(/\D/g, ''))) {
      tempErrors.mobile = 'Enter a valid 10-digit mobile number';
    }
    if (!age.trim()) {
      tempErrors.age = 'Age is required';
    } else {
      const parsedAge = parseInt(age);
      if (isNaN(parsedAge) || parsedAge <= 0 || parsedAge > 120) {
        tempErrors.age = 'Enter a valid age (1-120)';
      }
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleAddMemberSubmit = async () => {
    if (!validateForm()) return;

    try {
      await addFamilyMember({
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        relation: relationship,
        gender: gender,
        age: parseInt(age),
        mobile: mobile.trim()
      });
      
      const res = await getFamilyMembers();
      if (res.familyMembers) {
        setFamilyMembers(res.familyMembers);
      }

      // Reset Form Fields
      setFirstName('');
      setLastName('');
      setRelationship('Father');
      setMobile('');
      setAge('');
      setGender('Male');
      setErrors({});
      setIsModalOpen(false);
    } catch (e) {
      console.error('Failed to add member', e);
    }
  };

  const buildPatient = () => {
    if (forSelf) {
      return {
        userId: currentUser?.userId || 'self',
        firstname: currentUser?.firstname || 'You',
        lastname: currentUser?.lastname || '',
        name: `${currentUser?.firstname || ''} ${currentUser?.lastname || ''}`.trim(),
        relationship: 'Self',
        mobile: currentUser?.mobile || '+91 98765 43210',
        age: currentUser?.age || 32,
        gender: currentUser?.gender || 'Male',
      };
    }
    const names = selectedMember!.name.split(' ');
    const firstname = names[0];
    const lastname = names.slice(1).join(' ');
    return {
      userId: selectedMember!.userId || '',
      familyMemberId: selectedMember!.familyMemberId || selectedMember!._id,
      firstname,
      lastname,
      name: selectedMember!.name,
      relationship: selectedMember!.relation,
      mobile: selectedMember!.mobile,
      age: selectedMember!.age,
      gender: selectedMember!.gender,
    };
  };

  const handleContinue = () => {
    navigation.navigate('HomeServiceAddress', {
      ...route.params,
      patient: buildPatient(),
    });
  };

  return (
    <SafeAreaView style={hsStyles.screen}>
      <StatusBar barStyle="dark-content" />

      {loading ? (
        <View style={[hsStyles.screen, styles.centered]}>
          <Text>Loading...</Text>
        </View>
      ) : (

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
        <Text style={hsStyles.sectionTitle}>Who is this booking for?</Text>
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, forSelf && styles.toggleActive]}
            onPress={() => {
              setForSelf(true);
              setSelectedMember(null);
            }}
          >
            <Text style={[styles.toggleText, forSelf && styles.toggleTextActive]}>
              Myself
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, !forSelf && styles.toggleActive]}
            onPress={() => setForSelf(false)}
          >
            <Text style={[styles.toggleText, !forSelf && styles.toggleTextActive]}>
              Family member
            </Text>
          </TouchableOpacity>
        </View>

        {forSelf ? (
          <View style={[hsStyles.card, styles.memberCard]}>
            <View
              style={[styles.initials, { backgroundColor: '#D1FAE5' }]}
            >
              <Text style={[styles.initialsText, { color: '#047857' }]}>ME</Text>
            </View>
            <View>
              <Text style={styles.memberName}>
                {currentUser?.firstname || 'You'} {currentUser?.lastname || ''}
              </Text>
              <Text style={hsStyles.muted}>Self · {currentUser?.mobile || '+91 98765 43210'}</Text>
            </View>
          </View>
        ) : (
          <>
            {familyMembers.map((member, index) => {
              const avatarColors = [
                { bg: '#E8F4FD', text: '#1E40AF' },
                { bg: '#FCE7F3', text: '#9D174D' },
                { bg: '#FEF3C7', text: '#92400E' },
                { bg: '#ECFDF5', text: '#065F46' },
                { bg: '#F5F3FF', text: '#5B21B6' },
              ];
              const randomColor = avatarColors[index % avatarColors.length];
              return (
              <TouchableOpacity
                key={member.familyMemberId || member._id}
                onPress={() => setSelectedMember(member)}
              >
                <View
                  style={[
                    hsStyles.card,
                    styles.memberCard,
                    (selectedMember?.familyMemberId === member.familyMemberId || selectedMember?._id === member._id) && styles.memberSelected,
                  ]}
                >
                  <View
                    style={[
                      styles.initials,
                      { backgroundColor: randomColor.bg },
                    ]}
                  >
                    <Text style={[styles.initialsText, { color: randomColor.text }]}>
                      {(member.name || 'M')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>
                      {member.name}
                    </Text>
                    <Text style={hsStyles.muted}>
                      {member.relation} · {member.mobile}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radio,
                      (selectedMember?.familyMemberId === member.familyMemberId || selectedMember?._id === member._id) && styles.radioOn,
                    ]}
                  >
                    {(selectedMember?.familyMemberId === member.familyMemberId || selectedMember?._id === member._id) && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            )})}
            <TouchableOpacity style={styles.addFamily} onPress={() => setIsModalOpen(true)}>
              <Text style={styles.addFamilyText}>+ Add family member</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
      )}

      {/* Add Family Member Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Family Member</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScroll}
            >
              {/* First Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput
                  style={[styles.textInput, !!errors.firstName && styles.textInputError]}
                  placeholder="Enter first name"
                  placeholderTextColor="#94A3B8"
                  value={firstName}
                  onChangeText={(val) => {
                    setFirstName(val);
                    if (errors.firstName) setErrors({ ...errors, firstName: '' });
                  }}
                />
                {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
              </View>

              {/* Last Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter last name"
                  placeholderTextColor="#94A3B8"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>

              {/* Relation Chips */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Relationship *</Text>
                <View style={styles.chipsContainer}>
                  {['Father', 'Mother', 'Spouse', 'Child', 'Sibling', 'Other'].map((rel) => (
                    <TouchableOpacity
                      key={rel}
                      style={[
                        styles.chip,
                        relationship === rel && styles.chipActive,
                      ]}
                      onPress={() => setRelationship(rel)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          relationship === rel && styles.chipTextActive,
                        ]}
                      >
                        {rel}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Mobile Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Mobile Number *</Text>
                <TextInput
                  style={[styles.textInput, !!errors.mobile && styles.textInputError]}
                  placeholder="Enter 10-digit number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  maxLength={10}
                  value={mobile}
                  onChangeText={(val) => {
                    setMobile(val);
                    if (errors.mobile) setErrors({ ...errors, mobile: '' });
                  }}
                />
                {errors.mobile && <Text style={styles.errorText}>{errors.mobile}</Text>}
              </View>

              {/* Age Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Age *</Text>
                <TextInput
                  style={[styles.textInput, !!errors.age && styles.textInputError]}
                    placeholder="Enter age"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  maxLength={3}
                  value={age}
                  onChangeText={(val) => {
                    setAge(val);
                    if (errors.age) setErrors({ ...errors, age: '' });
                  }}
                />
                {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
              </View>

              {/* Gender Chips */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Gender *</Text>
                <View style={styles.chipsContainer}>
                  {['Male', 'Female', 'Other'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.chip,
                        gender === g && styles.chipActive,
                      ]}
                      onPress={() => setGender(g)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          gender === g && styles.chipTextActive,
                        ]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleAddMemberSubmit}>
                <Text style={styles.modalSubmitBtnText}>Add Family Member</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <View
        style={[
          hsStyles.footer,
          {
            paddingBottom:
              Platform.OS === 'android'
                ? Math.max(insets.bottom, SAFE_AREA.safeBottom) + SPACING.xs
                : insets.bottom,
          },
        ]}
      >
        <TouchableOpacity
          style={[hsStyles.primaryBtn, !canProceed && styles.disabled]}
          disabled={!canProceed}
          onPress={handleContinue}
        >
          <Text style={hsStyles.primaryBtnText}>Continue to address</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xl * 2 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: LAYOUT.borderRadius.md,
    padding: 4,
    marginBottom: SPACING.md,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: LAYOUT.borderRadius.sm,
  },
  toggleActive: { backgroundColor: HS_COLORS.primary },
  toggleText: { fontSize: moderateScale(14), fontWeight: '600', color: HS_COLORS.textMuted },
  toggleTextActive: { color: '#FFF' },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  memberSelected: {
    borderColor: HS_COLORS.primary,
    borderWidth: 2,
  },
  initials: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  initialsText: { fontSize: moderateScale(16), fontWeight: '700' },
  memberName: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: HS_COLORS.text,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: HS_COLORS.primary },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: HS_COLORS.primary,
  },
  addFamily: { alignItems: 'center', padding: SPACING.md },
  addFamilyText: { color: HS_COLORS.primaryLight, fontWeight: '600' },
  disabled: { opacity: 0.5, backgroundColor: '#94A3B8' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)', // Sleek dark blur background
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: LAYOUT.borderRadius.xl,
    borderTopRightRadius: LAYOUT.borderRadius.xl,
    maxHeight: '90%',
    minHeight: '60%',
    ...LAYOUT.shadow.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: moderateScale(17),
    fontWeight: '700',
    color: HS_COLORS.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: moderateScale(13),
    color: '#64748B',
    fontWeight: '700',
  },
  modalScroll: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: HS_COLORS.text,
    marginBottom: SPACING.xs,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: LAYOUT.borderRadius.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: Platform.OS === 'ios' ? SPACING.sm : SPACING.xs,
    fontSize: moderateScale(14),
    color: HS_COLORS.text,
  },
  textInputError: {
    borderColor: HS_COLORS.danger,
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    fontSize: moderateScale(11),
    color: HS_COLORS.danger,
    marginTop: SPACING.xxs,
    fontWeight: '500',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xxs,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: LAYOUT.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  chipActive: {
    backgroundColor: HS_COLORS.primary,
    borderColor: HS_COLORS.primary,
  },
  chipText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  modalSubmitBtn: {
    backgroundColor: HS_COLORS.primary,
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    ...LAYOUT.shadow.md,
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
});

export default HomeServiceSelectPatient;
