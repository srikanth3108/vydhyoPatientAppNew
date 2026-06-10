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
import {
  getOfferingById,
  getProviderById,
  MOCK_FAMILY_MEMBERS,
  MockFamilyMember,
} from '../../../data/mockHomeServices';
import { HS_COLORS, hsStyles } from '../homeServiceTheme';
import { SPACING, moderateScale, LAYOUT, SAFE_AREA } from '../../../utils/responsive';

type Params = {
  providerId: string;
  categoryId: string;
  serviceId: string;
  date: string;
  time: string;
  reason: string;
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

  const provider = getProviderById(route.params.providerId);
  const service = getOfferingById(route.params.serviceId);

  const [forSelf, setForSelf] = useState(true);
  const [familyMembers, setFamilyMembers] = useState<MockFamilyMember[]>(MOCK_FAMILY_MEMBERS);
  const [selectedMember, setSelectedMember] = useState<MockFamilyMember | null>(null);

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

  const handleAddMemberSubmit = () => {
    if (!validateForm()) return;

    const avatarColors = [
      { bg: '#E8F4FD', text: '#1E40AF' },
      { bg: '#FCE7F3', text: '#9D174D' },
      { bg: '#FEF3C7', text: '#92400E' },
      { bg: '#ECFDF5', text: '#065F46' },
      { bg: '#F5F3FF', text: '#5B21B6' },
    ];
    const randomColor = avatarColors[familyMembers.length % avatarColors.length];

    const newMember: MockFamilyMember = {
      id: `f${familyMembers.length + 1}`,
      firstname: firstName.trim(),
      lastname: lastName.trim(),
      relationship,
      mobile: mobile.trim(),
      age: parseInt(age),
      gender,
      bgColor: randomColor.bg,
      textColor: randomColor.text,
    };

    setFamilyMembers([...familyMembers, newMember]);
    setSelectedMember(newMember); // Auto-select newly added member

    // Reset Form Fields
    setFirstName('');
    setLastName('');
    setRelationship('Father');
    setMobile('');
    setAge('');
    setGender('Male');
    setErrors({});
    setIsModalOpen(false);
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
    return {
      userId: selectedMember!.id,
      firstname: selectedMember!.firstname,
      lastname: selectedMember!.lastname,
      name: `${selectedMember!.firstname} ${selectedMember!.lastname}`,
      relationship: selectedMember!.relationship,
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
      <View style={styles.bookingStrip}>
        <Text style={styles.stripText}>
          {service?.name} · {route.params.date} · {route.params.time}
        </Text>
        <Text style={hsStyles.muted}>{provider?.name}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
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
            {familyMembers.map(member => (
              <TouchableOpacity
                key={member.id}
                onPress={() => setSelectedMember(member)}
              >
                <View
                  style={[
                    hsStyles.card,
                    styles.memberCard,
                    selectedMember?.id === member.id && styles.memberSelected,
                  ]}
                >
                  <View
                    style={[
                      styles.initials,
                      { backgroundColor: member.bgColor },
                    ]}
                  >
                    <Text style={[styles.initialsText, { color: member.textColor }]}>
                      {member.firstname[0]}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>
                      {member.firstname} {member.lastname}
                    </Text>
                    <Text style={hsStyles.muted}>
                      {member.relationship} · {member.mobile}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radio,
                      selectedMember?.id === member.id && styles.radioOn,
                    ]}
                  >
                    {selectedMember?.id === member.id && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.addFamily} onPress={() => setIsModalOpen(true)}>
              <Text style={styles.addFamilyText}>+ Add family member</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

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
  bookingStrip: {
    backgroundColor: HS_COLORS.card,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: HS_COLORS.border,
  },
  stripText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
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
