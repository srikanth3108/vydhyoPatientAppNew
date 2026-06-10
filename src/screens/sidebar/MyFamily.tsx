import React, { useEffect, useState } from 'react';
import { AuthFetch, authDelete, ENDPOINTS } from '../../services';
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
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/navigationTypes';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
;
import Toast from 'react-native-toast-message';

// Import responsive utilities
import {
  responsiveWidth,
  responsiveHeight,
  responsiveSafeHeight,
  responsiveText,
  scale,
  verticalScale,
  moderateScale,
  SPACING,
  FONT_SIZE,
  ICON_SIZE,
  LAYOUT,
  isTablet,
  isIOS,
  isAndroid,
  PLATFORM,
  SAFE_AREA,
} from '../../utils/responsive';

// ---- i18n helpers ----
type Lang = 'en' | 'hi' | 'tel';
const normalizeLang = (l?: string): Lang => {
  if (l === 'en' || l === 'hi' || l === 'tel') return l;
  if (l === 'te') return 'tel';
  return 'en';
};

const TR = {
  loading: {
    en: 'Loading ...',
    hi: 'लोड हो रहा है ...',
    tel: 'లోడ్ అవుతోంది ...',
  },
  errorTitle: {
    en: 'Error',
    hi: 'त्रुटि',
    tel: 'లోపం',
  },
  errorFetchMembers: {
    en: 'Failed to fetch family members',
    hi: 'परिवार के सदस्यों को प्राप्त करने में विफल',
    tel: 'కుటుంబ సభ్యులను పొందడంలో విఫలమైంది',
  },
  errorDeleteMember: {
    en: 'Failed to delete family member',
    hi: 'परिवार के सदस्य को हटाने में विफल',
    tel: 'కుటుంబ సభ్యుడిని తొలగించడంలో విఫలమైంది',
  },
  successDeleteMember: {
    en: 'Family member deleted successfully',
    hi: 'परिवार का सदस्य सफलतापूर्वक हटाया गया',
    tel: 'కుటుంబ సభ్యుడు విజయవంతంగా తొలగించబడ్డారు',
  },
  deleteConfirmTitle: {
    en: 'Delete Member',
    hi: 'सदस्य हटाएं',
    tel: 'సభ్యుడిని తొలగించండి',
  },
  deleteConfirmMessage: {
    en: 'Are you sure you want to delete this family member?',
    hi: 'क्या आप वाकई इस परिवार के सदस्य को हटाना चाहते हैं?',
    tel: 'మీరు నిజంగా ఈ కుటుంబ సభ్యుడిని తొలగించాలనుకుంటున్నారా?',
  },
  deleteCancel: {
    en: 'Cancel',
    hi: 'रद्द करें',
    tel: 'రద్దు చేయండి',
  },
  deleteConfirm: {
    en: 'Delete',
    hi: 'हटाएं',
    tel: 'తొలగించు',
  },
  profile: {
    en: 'Profile',
    hi: 'प्रोफ़ाइल',
    tel: 'ప్రొఫైల్',
  },
  edit: {
    en: 'Edit',
    hi: 'संपादित करें',
    tel: 'సవరించు',
  },
  delete: {
    en: 'Delete',
    hi: 'हटाएं',
    tel: 'తొలగించు',
  },
  addFamily: {
    en: 'Add Family +',
    hi: 'परिवार जोड़ें +',
    tel: 'ఫ్యామిలీ జోడించండి +',
  },
  self: {
    en: 'Self',
    hi: 'स्वयं',
    tel: 'స్వయంగా',
  },
  // field labels
  name: { en: 'Name', hi: 'नाम', tel: 'పేరు' },
  contactNumber: { en: 'Contact Number', hi: 'संपर्क नंबर', tel: 'సంప్రదించు నంబర్' },
  emailId: { en: 'Email Id', hi: 'ईमेल आईडी', tel: 'ఈమెయిల్ ఐడి' },
  gender: { en: 'Gender', hi: 'लिंग', tel: 'లింగం' },
  dob: { en: 'Date of Birth', hi: 'जन्मतिथि', tel: 'పుట్టిన తేదీ' },
  // bloodGroup: { en: 'Blood Group', hi: 'ब्लड ग्रुप', tel: 'రక్త గ్రూప్' },
  // height: { en: 'Height', hi: 'ऊंचाई', tel: 'ఎత్తు' },
  // weight: { en: 'Weight', hi: 'वजन', tel: 'బరువు' },
  // emergencyContact: { en: 'Emergency Contact', hi: 'आपातकालीन संपर्क', tel: 'అత్యవసర సంప్రదింపు' },
  // location: { en: 'Location', hi: 'स्थान', tel: 'ప్రాంతం' },
  relation: { en: 'Relation', hi: 'संबंध', tel: 'సంబంధం' },
  // placeholders
  addEmail: { en: '+Add email', hi: '+ईमेल जोड़ें', tel: '+ఈమెయిల్ చేర్చండి' },
  addGender: { en: '+Add gender', hi: '+लिंग जोड़ें', tel: '+లింగం చేర్చండి' },
  // addBloodGroup: { en: '+Add blood group', hi: '+ब्लड ग्रुप जोड़ें', tel: '+రక్త గ్రూప్ చేర్చండి' },
  // addHeight: { en: '+Add height', hi: '+ऊंचाई जोड़ें', tel: '+ఎత్తు చేర్చండి' },
  // addWeight: { en: '+Add weight', hi: '+वजन जोड़ें', tel: '+బరువు చేర్చండి' },
  // addEmergency: { en: '+Add emergency details', hi: '+आपातकालीन विवरण जोड़ें', tel: '+అత్యవసర వివరాలు చేర్చండి' },
  // addLocation: { en: '+Add location details', hi: '+स्थान विवरण जोड़ें', tel: '+ప్రాంతం వివరాలు చేర్చండి' },
  dobPlaceholder: { en: 'dd/mm/yyyy', hi: 'दि/मही/वर्ष', tel: 'दि/నె/సం' },
  // delete error modal
  cannotDeleteTitle: {
    en: 'Cannot Delete Member',
    hi: 'सदस्य को नहीं हटाया जा सकता',
    tel: 'సభ్యుడిని తొలగించలేరు',
  },
  existingAppointments: {
    en: 'Please cancel all appointments before deleting this member:',
    hi: 'इस सदस्य को हटाने से पहले सभी नियुक्तियां रद्द करें:',
    tel: 'ఈ సభ్యుడిని తొలగించే ముందు అన్ని అపాయింట్‌మెంట్‌లను రద్దు చేయండి:',
  },
  apptId: { en: 'Booking ID', hi: 'बुकिंग आईडी', tel: 'బుకింగ్ ఐడి' },
  apptStatus: { en: 'Status', hi: 'स्थिति', tel: 'స్థితి' },
  apptDate: { en: 'Date', hi: 'तारीख', tel: 'తేదీ' },
  apptTime: { en: 'Time', hi: 'समय', tel: 'సమయం' },
  closeBtn: { en: 'Close', hi: 'बंद करें', tel: 'మూసివేయి' },
};

const MyFamily = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const currentuserDetails = useSelector((state: any) => state.currentUser);
  const lang: Lang = normalizeLang(currentuserDetails?.appLanguage);
  const t = {
    loading: TR.loading[lang],
    errorTitle: TR.errorTitle[lang],
    errorFetchMembers: TR.errorFetchMembers[lang],
    errorDeleteMember: TR.errorDeleteMember[lang],
    successDeleteMember: TR.successDeleteMember[lang],
    deleteConfirmTitle: TR.deleteConfirmTitle[lang],
    deleteConfirmMessage: TR.deleteConfirmMessage[lang],
    deleteCancel: TR.deleteCancel[lang],
    deleteConfirm: TR.deleteConfirm[lang],
    profile: TR.profile[lang],
    edit: TR.edit[lang],
    delete: TR.delete[lang],
    addFamily: TR.addFamily[lang],
    self: TR.self[lang],
    name: TR.name[lang],
    contactNumber: TR.contactNumber[lang],
    emailId: TR.emailId[lang],
    gender: TR.gender[lang],
    dob: TR.dob[lang],
    // bloodGroup: TR.bloodGroup[lang],
    // height: TR.height[lang],
    // weight: TR.weight[lang],
    // emergencyContact: TR.emergencyContact[lang],
    // location: TR.location[lang],
    relation: TR.relation[lang],
    addEmail: TR.addEmail[lang],
    addGender: TR.addGender[lang],
    // addBloodGroup: TR.addBloodGroup[lang],
    // addHeight: TR.addHeight[lang],
    // addWeight: TR.addWeight[lang],
    // addEmergency: TR.addEmergency[lang],
    // addLocation: TR.addLocation[lang],
    dobPlaceholder: TR.dobPlaceholder[lang],
    cannotDeleteTitle: TR.cannotDeleteTitle[lang],
    existingAppointments: TR.existingAppointments[lang],
    apptId: TR.apptId[lang],
    apptStatus: TR.apptStatus[lang],
    apptDate: TR.apptDate[lang],
    apptTime: TR.apptTime[lang],
    closeBtn: TR.closeBtn[lang],
  };

  const [currentScreen, setCurrentScreen] = useState<'family' | 'profile'>('family');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [myselfData, setMyselfData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [deleteErrorData, setDeleteErrorData] = useState<{
    message: string;
    appointments: any[];
  } | null>(null);

  const Loader = ({ visible }: { visible: boolean }) =>
    !visible ? null : (
      <View style={styles.loaderOverlay}>
        <ActivityIndicator size="small" color="#1F2937" />
        <Text style={styles.loaderText}>{t.loading}</Text>
      </View>
    );

  /* ── Delete Error Modal ── */
  const DeleteErrorModal = () => {
    if (!deleteErrorData) return null;

    const formatDate = (dateStr: string) => {
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      } catch {
        return dateStr;
      }
    };

    const formatTime = (timeStr: string) => {
      try {
        const [h, m] = timeStr.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour = h % 12 || 12;
        return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
      } catch {
        return timeStr;
      }
    };

    const statusColor = (status: string) => {
      switch (status?.toLowerCase()) {
        case 'scheduled':
        case 'confirmed': return { bg: '#e8f5e9', text: '#2e7d32' };
        case 'completed':  return { bg: '#e3f2fd', text: '#1565c0' };
        case 'cancelled':  return { bg: '#fce4ec', text: '#c62828' };
        default:           return { bg: '#f5f5f5', text: '#555' };
      }
    };

    return (
      <Modal
        visible
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteErrorData(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <Text style={styles.modalIcon}>⚠️</Text>
              </View>
              <Text style={styles.modalTitle}>{t.cannotDeleteTitle}</Text>
              <Text style={styles.modalSubtitle}>{deleteErrorData.message}</Text>
            </View>

            <Text style={styles.modalListLabel}>{t.existingAppointments}</Text>

            {/* Appointments list */}
            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              {deleteErrorData.appointments.map((appt, i) => {
                const sc = statusColor(appt.status);
                return (
                  <View key={appt.appointmentId || i} style={styles.apptRow}>
                    {/* Left: ID + date/time */}
                    <View style={styles.apptLeft}>
                      <Text style={styles.apptId}>#{appt.appointmentId}</Text>
                      <Text style={styles.apptDateTime}>
                        {formatDate(appt.date)}  ·  {formatTime(appt.time)}
                      </Text>
                    </View>
                    {/* Right: status badge */}
                    <View style={[styles.apptStatusBadge, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.apptStatusText, { color: sc.text }]}>
                        {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Close button */}
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setDeleteErrorData(null)}
            >
              <Text style={styles.modalCloseBtnText}>{t.closeBtn}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const fetchFamilyMembers = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const response = await AuthFetch(
        ENDPOINTS.GET_ALL_FAMILY_MEMBERS(currentuserDetails.userId),
        token
      );

      if (response?.status === 'success') {
        const membersList = response?.data?.data || [];
        const family = membersList.filter(
          (user: any) => (user.relationship || '').toLowerCase() !== 'self'
        );
        const self = membersList.find(
          (user: any) => (user.relationship || '').toLowerCase() === 'self'
        );
        setFamilyMembers(family);
        setMyselfData(self);
      } else {
        throw new Error(response?.message || t.errorFetchMembers);
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: t.errorTitle,
        text2: t.errorFetchMembers,
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (member: any) => {
    Alert.alert(
      t.deleteConfirmTitle,
      t.deleteConfirmMessage,
      [
        { text: t.deleteCancel, style: 'cancel' },
        {
          text: t.deleteConfirm,
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const token = await AsyncStorage.getItem('authToken');
              if (!token) return;

              const memberUserId = member.userId;
              const response = await authDelete(
                ENDPOINTS.DELETE_FAMILY_MEMBER(memberUserId),
                { userId: currentuserDetails.userId },
                token
              );

              if (response?.status === 'success') {
                Toast.show({
                  type: 'success',
                  text1: t.successDeleteMember,
                  position: 'top',
                  visibilityTime: 3000,
                });
                if (currentScreen === 'profile' && selectedMember?._id === member?._id) {
                  setCurrentScreen('family');
                  setSelectedMember(null);
                }
                await fetchFamilyMembers();
              } else {
                const errMsg = response?.message?.message || t.errorDeleteMember;
                const appts: any[] = response?.message?.appointments || [];
                if (appts.length > 0) {
                  setDeleteErrorData({ message: errMsg, appointments: appts });
                } else {
                  Toast.show({
                    type: 'error',
                    text1: t.errorTitle,
                    text2: errMsg,
                    position: 'top',
                    visibilityTime: 3000,
                  });
                }
              }
            } catch (err) {
              Toast.show({
                type: 'error',
                text1: t.errorTitle,
                text2: t.errorDeleteMember,
                position: 'top',
                visibilityTime: 3000,
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    fetchFamilyMembers();
    // re-run text if language changes (no net call unless you want)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentuserDetails, lang]);

  const handleMemberPress = (member: any) => {
    setSelectedMember(member);
    setCurrentScreen('profile');
  };

  const handleEditPress = (member: any) => {
    navigation.navigate('AddFamily', { from: 'edit', member });
  };

  const handleBackPress = () => {
    if (currentScreen === 'profile') {
      setCurrentScreen('family');
      setSelectedMember(null);
    } else {
      navigation.goBack();
    }
  };

  const handleAddFamily = () => {
    navigation.navigate('AddFamily', { from: 'myFamily' });
  };

  const getInitials = (name?: string) => {
    if (!name) return 'ME';
    const parts = name.trim().split(/\s+/);
    return parts.map((p) => p[0]).join('').toUpperCase();
  };

  const getRandomColor = () => {
    const colors = [
      { bg: '#fce4ec', text: '#e91e63' },
      { bg: '#e3f2fd', text: '#2196f3' },
      { bg: '#f3e5f5', text: '#9c27b0' },
      { bg: '#e8f5e9', text: '#4caf50' },
      { bg: '#fff3e0', text: '#ff9800' },
      { bg: '#fbe9e7', text: '#ff5722' },
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const FamilyMemberCard = ({ member }: { member: any }) => {
    const color = getRandomColor();
    const isSelf = (member.relationship || '').toLowerCase() === 'self';
    return (
      <View style={styles.memberCard}>
        <TouchableOpacity style={styles.memberContent} onPress={() => handleMemberPress(member)}>
          <View style={[styles.avatar, { backgroundColor: color.bg }]}>
            <Text style={[styles.avatarText, { color: color.text }]}>
              {getInitials(member.firstname)}
            </Text>
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>
              {member.firstname} {member.lastname}
            </Text>
            <Text style={styles.memberRelationship}>{member.relationship}</Text>
            <Text style={styles.memberPhone}>{member.mobile}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.cardActions}>
        <TouchableOpacity style={styles.editButton} onPress={() => handleEditPress(member)}>
          <Text style={styles.editButtonText}>{t.edit}</Text>
        </TouchableOpacity>
          {!isSelf && (
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteMember(member)}>
              <Text style={styles.deleteButtonText}>{t.delete}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const ProfileScreen = () => {
    const color = getRandomColor();
    const m = selectedMember || {};
    const isSelf = (m.relationship || '').toLowerCase() === 'self';
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f0f8f0" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.profile}</Text>
          <View style={styles.profileHeaderActions}>
            <TouchableOpacity style={styles.editButton} onPress={() => handleEditPress(m)}>
              <Text style={styles.editButtonText}>{t.edit}</Text>
            </TouchableOpacity>
            {!isSelf && (
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteMember(m)}>
                <Text style={styles.deleteButtonText}>{t.delete}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView style={styles.profileContent} showsVerticalScrollIndicator={false}>
          <View style={styles.profileAvatarContainer}>
            <View style={[styles.profileAvatar, { backgroundColor: color.bg }]}>
              <Text style={[styles.profileAvatarText, { color: color.text }]}>
                {getInitials(m?.firstname)}
              </Text>
            </View>
          </View>

          <View style={styles.profileFields}>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>{t.name}</Text>
              <View style={styles.fieldInputContainer}>
                <Text style={styles.fieldValue}>{m?.firstname}</Text>
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>{t.contactNumber}</Text>
              <View style={styles.fieldInputContainer}>
                <Text style={styles.fieldValue}>{m?.mobile}</Text>
              </View>
            </View>

            {/* <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>{t.emailId}</Text>
              <View style={styles.fieldInputContainer}>
                <Text style={m?.email ? styles.fieldValue : styles.fieldPlaceholder}>
                  {m?.email || t.addEmail}
                </Text>
              </View>
            </View> */}

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>{t.gender}</Text>
              <View style={styles.fieldInputContainer}>
                <Text style={m?.gender ? styles.fieldValue : styles.fieldPlaceholder}>
                  {m?.gender || t.addGender}
                </Text>
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>{t.dob}</Text>
              <View style={styles.fieldInputContainer}>
                <Text
                  style={m?.DOB || m?.dob ? styles.fieldValue : styles.fieldPlaceholder}
                >
                  {m?.DOB || m?.dob || t.dobPlaceholder}
                </Text>
              </View>
            </View>

            {/* <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>{t.bloodGroup}</Text>
              <View style={styles.fieldInputContainer}>
                <Text style={m?.bloodGroup ? styles.fieldValue : styles.fieldPlaceholder}>
                  {m?.bloodGroup || t.addBloodGroup}
                </Text>
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>{t.height}</Text>
              <View style={styles.fieldInputContainer}>
                <Text style={m?.height ? styles.fieldValue : styles.fieldPlaceholder}>
                  {m?.height || t.addHeight}
                </Text>
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>{t.weight}</Text>
              <View style={styles.fieldInputContainer}>
                <Text style={m?.weight ? styles.fieldValue : styles.fieldPlaceholder}>
                  {m?.weight || t.addWeight}
                </Text>
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>{t.emergencyContact}</Text>
              <View style={styles.fieldInputContainer}>
                <Text style={m?.emergencyContact ? styles.fieldValue : styles.fieldPlaceholder}>
                  {m?.emergencyContact || t.addEmergency}
                </Text>
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>{t.location}</Text>
              <View style={styles.fieldInputContainer}>
                <Text style={m?.location ? styles.fieldValue : styles.fieldPlaceholder}>
                  {m?.location || t.addLocation}
                </Text>
              </View>
            </View> */}

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>{t.relation}</Text>
              <View style={styles.fieldInputContainer}>
                <Text style={styles.fieldValue}>{m?.relationship}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
        <Loader visible={loading} />
      </SafeAreaView>
    );
  };

  if (currentScreen === 'profile') {
    return (
      <>
        <ProfileScreen />
        <DeleteErrorModal />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f8f0" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} />
        <TouchableOpacity style={styles.addButton} onPress={handleAddFamily}>
          <Text style={styles.addButtonText}>{t.addFamily}</Text>
        </TouchableOpacity>
      </View>

      {/* Family Members List */}
      <ScrollView style={styles.membersList} showsVerticalScrollIndicator={false}>
        <View style={styles.membersContainer}>
          {myselfData && (
            <View style={styles.memberCard}>
              <TouchableOpacity
                style={styles.memberContent}
                onPress={() => handleMemberPress(myselfData)}
              >
                <View style={[styles.avatar, { backgroundColor: '#e8f5e9' }]}>
                  <Text style={[styles.avatarText, { color: '#4caf50' }]}>
                    {getInitials(myselfData.firstname)}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {myselfData?.firstname} {myselfData?.lastname}
                  </Text>
                  <Text style={styles.memberRelationship}>{t.self}</Text>
                  <Text style={styles.memberPhone}>{myselfData?.mobile}</Text>
                </View>
              </TouchableOpacity>
              {/* No delete for self */}
              <View style={styles.cardActions}>
              <TouchableOpacity style={styles.editButton} onPress={() => handleEditPress(myselfData)}>
                <Text style={styles.editButtonText}>{t.edit}</Text>
              </TouchableOpacity>
              </View>
            </View>
          )}

          {familyMembers.map((member: any, index: number) => (
            <FamilyMemberCard key={`${member.id || member._id || index}-${index}`} member={member} />
          ))}
        </View>
      </ScrollView>

      <DeleteErrorModal />
      <Loader visible={loading} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f0f8f0',
    paddingTop: PLATFORM.STATUS_BAR_HEIGHT,
  },
  header: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#f0f8f0',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loaderText: { 
    marginTop: SPACING.xs, 
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600', 
    color: '#4caf50',
  },
  backButton: {
    padding: SPACING.xxs, 
    minWidth: isTablet ? ICON_SIZE.lg : ICON_SIZE.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { 
    fontSize: responsiveText(isTablet ? FONT_SIZE.xxl : FONT_SIZE.xl), 
    color: '#333',  
  },
  headerTitle: { 
    fontSize: responsiveText(isTablet ? FONT_SIZE.lg : FONT_SIZE.md), 
    fontWeight: '600', 
    color: '#333', 
    flex: 1, 
    marginLeft: SPACING.xs,
    textAlign: 'center',
  },
  addButton: { 
    backgroundColor: 'transparent', 
    paddingVertical: SPACING.xs, 
    paddingHorizontal: SPACING.xxs,
  },
  addButtonText: {
    fontSize: responsiveText(FONT_SIZE.sm), 
    color: '#4caf50', 
    fontWeight: '500',
  },

  membersList: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  membersContainer: {
    paddingBottom: SPACING.lg,
  },

  memberCard: {
    backgroundColor: '#ffffff',
    borderRadius: LAYOUT.borderRadius.lg,
    marginBottom: SPACING.md,
    ...LAYOUT.shadow.sm,
  },
  memberContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  avatar: { 
    width: isTablet ? ICON_SIZE.xxl : ICON_SIZE.xl, 
    height: isTablet ? ICON_SIZE.xxl : ICON_SIZE.xl, 
    borderRadius: isTablet ? 30 : 25, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: SPACING.md,
  },
  avatarText: { 
    fontSize: responsiveText(isTablet ? FONT_SIZE.lg : FONT_SIZE.md), 
    fontWeight: '600',
  },
  memberInfo: { 
    flex: 1, 
  },
  memberName: { 
    fontSize: responsiveText(FONT_SIZE.md), 
    fontWeight: '600', 
    color: '#333', 
    marginBottom: SPACING.xxs,
  },
  memberRelationship: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    color: '#666', 
    marginBottom: SPACING.xs,
  },
  memberPhone: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    color: '#999', 
    fontFamily: 'monospace',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  editButton: {
    paddingVertical: SPACING.xs, 
    paddingHorizontal: SPACING.sm, 
    backgroundColor: '#4caf50', 
    borderRadius: LAYOUT.borderRadius.md,
  },
  editButtonText: { 
    fontSize: responsiveText(FONT_SIZE.xs), 
    color: '#fff', 
    fontWeight: '500', 
  },
  deleteButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: '#ef5350',
    borderRadius: LAYOUT.borderRadius.md,
  },
  deleteButtonText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#fff',
    fontWeight: '500',
  },
  profileHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },

  // Profile view
  profileContent: { 
    flex: 1, 
    paddingHorizontal: SPACING.md,
  },
  profileAvatarContainer: { 
    alignItems: 'center', 
    paddingVertical: SPACING.lg,
  },
  profileAvatar: { 
    width: isTablet ? ICON_SIZE.xxxl : ICON_SIZE.xxl, 
    height: isTablet ? ICON_SIZE.xxxl : ICON_SIZE.xxl, 
    borderRadius: isTablet ? 50 : 40, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  profileAvatarText: { 
    fontSize: responsiveText(isTablet ? FONT_SIZE.xxl : FONT_SIZE.xl), 
    fontWeight: '600',
  },
  profileFields: { 
    paddingBottom: SPACING.lg,
  },
  fieldContainer: { 
    marginBottom: SPACING.md, 
  },
  fieldLabel: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    color: '#666', 
    marginBottom: SPACING.xs,
  },
  fieldInputContainer: {
    backgroundColor: '#ffffff', 
    borderRadius: LAYOUT.borderRadius.md, 
    paddingHorizontal: SPACING.md, 
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1, 
    borderBottomColor: '#e0e0e0',
  },
  fieldValue: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    color: '#333', 
    fontWeight: '500',
  },
  fieldPlaceholder: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#4caf50',
    fontWeight: '500',
  },

  // ── Delete Error Modal ──────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: LAYOUT.borderRadius.lg,
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
    ...LAYOUT.shadow.sm,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff8f8',
  },
  modalIconWrap: {
    marginBottom: SPACING.xs,
  },
  modalIcon: {
    fontSize: responsiveText(32),
  },
  modalTitle: {
    fontSize: responsiveText(FONT_SIZE.md),
    fontWeight: '700',
    color: '#c62828',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#555',
    textAlign: 'center',
    lineHeight: moderateScale(18),
  },
  modalListLabel: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#888',
    fontWeight: '600',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalScroll: {
    maxHeight: moderateScale(280),
    paddingHorizontal: SPACING.md,
  },
  apptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  apptLeft: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  apptId: {
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
    color: '#222',
    marginBottom: 2,
  },
  apptDateTime: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#888',
  },
  apptStatusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: LAYOUT.borderRadius.sm,
  },
  apptStatusText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    fontWeight: '600',
  },
  modalCloseBtn: {
    margin: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#1F2937',
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#fff',
    fontWeight: '600',
  },
});

export default MyFamily;