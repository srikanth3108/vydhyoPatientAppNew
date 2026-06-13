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
  Alert,
} from 'react-native';
import { RouteProp, useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { AuthFetch, authDelete, ENDPOINTS } from '../../../services';
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
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const currentUser = useSelector((state: any) => state.currentUser);

  const [provider, setProvider] = useState<any>(route.params.provider);

  const [forSelf, setForSelf] = useState(true);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFamily = React.useCallback(async () => {
    try {
      if (familyMembers.length === 0) {
        setLoading(true);
      }
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const response = await AuthFetch(
        `${ENDPOINTS.GET_ALL_FAMILY_MEMBERS(currentUser.userId)}&t=${Date.now()}`,
        token
      );

      if (response?.status === 'success') {
        const membersList = response?.data?.data || [];
        const family = membersList.filter(
          (user: any) => (user.relationship || '').toLowerCase() !== 'self'
        );
        setFamilyMembers(family);
      }
    } catch (e) {
      console.error('Failed to fetch family members', e);
    } finally {
      setLoading(false);
    }
  }, [currentUser.userId, familyMembers.length]);

  useFocusEffect(
    React.useCallback(() => {
      fetchFamily();
    }, [fetchFamily])
  );

  const canProceed = forSelf || selectedMember !== null;

  const handleEditMember = (member: any) => {
    navigation.navigate('AddFamily', { from: 'edit', member });
  };

  const handleDeleteMember = (member: any) => {
    Alert.alert(
      'Delete Member',
      'Are you sure you want to delete this family member?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const token = await AsyncStorage.getItem('authToken');
              if (!token) return;

              const memberUserId = member.userId;
              const response = await authDelete(
                ENDPOINTS.DELETE_FAMILY_MEMBER(memberUserId),
                { userId: currentUser.userId },
                token
              );

              if (response?.status === 'success') {
                Toast.show({
                  type: 'success',
                  text1: 'Family member deleted successfully',
                  position: 'top',
                });
                if (selectedMember?._id === member._id || selectedMember?.familyMemberId === member.familyMemberId) {
                  setSelectedMember(null);
                }
                fetchFamily();
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Failed to delete family member',
                  text2: response?.message?.message || 'Please cancel existing appointments first.',
                  position: 'top',
                });
              }
            } catch (err) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete family member',
                position: 'top',
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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
      userId: selectedMember!.userId || '',
      familyMemberId: selectedMember!.familyMemberId || selectedMember!._id,
      firstname: selectedMember!.firstname || '',
      lastname: selectedMember!.lastname || '',
      name: `${selectedMember!.firstname || ''} ${selectedMember!.lastname || ''}`.trim() || selectedMember!.name,
      relationship: selectedMember!.relationship || selectedMember!.relation,
      mobile: selectedMember!.mobile,
      age: selectedMember!.age,
      gender: selectedMember!.gender,
    };
  };

  const getInitials = (name?: string) => {
    if (!name) return 'M';
    return name.charAt(0).toUpperCase();
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
            <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center' }}>
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
                  <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center' }}>
                    <View
                      style={[
                        styles.initials,
                        { backgroundColor: randomColor.bg },
                      ]}
                    >
                      <Text style={[styles.initialsText, { color: randomColor.text }]}>
                        {getInitials(member.firstname || member.name)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName}>
                        {member.firstname} {member.lastname}
                      </Text>
                      <Text style={hsStyles.muted}>
                        {member.relationship || member.relation}
                      </Text>
                      <Text style={hsStyles.muted}>
                        {member.mobile}
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

                  {/* Buttons Row */}
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', width: '100%', marginTop: SPACING.sm }}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => handleEditMember(member)}>
                      <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteMember(member)}>
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            )})}
            <TouchableOpacity style={styles.addFamily} onPress={() => navigation.navigate('AddFamily', { from: 'appointment' })}>
              <Text style={styles.addFamilyText}>+ Add family member</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
      )}



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
    flexDirection: 'column',
    alignItems: 'stretch',
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
  editBtn: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  editBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteBtn: {
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default HomeServiceSelectPatient;
