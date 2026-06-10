import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { AuthFetch, ENDPOINTS } from '../../services';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/navigationTypes';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
;
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDoctorName,getAvatarInitial } from '../../utils/util';

// Import responsive utilities
import {
  isTablet,
  SPACING,
  LAYOUT,
  moderateScale,
  SAFE_AREA,
} from '../../utils/responsive';

type AppointmentBookingRouteProp = RouteProp<RootStackParamList, 'Appointment'>;

interface AppointmentBookingProps {
  route: AppointmentBookingRouteProp;
}

type FamilyMember = {
  id?: string;
  _id?: string;
  firstname?: string;
  relationship?: string;
  mobile?: string;
  // optional UI helpers (fallbacks handled if absent)
  bgColor?: string;
  textColor?: string;
};

const Appointment: React.FC<AppointmentBookingProps> = ({ route }) => {
  const currentUserDetails = useSelector((state: any) => state.currentUser);
  const languageCodeFromUser: string | undefined = currentUserDetails?.appLanguage;
  const insets = useSafeAreaInsets();

  // route params
  const { doctor, date, time, clinic, mode } = route.params;

  // ---- i18n -----------------------------------------------------------------
  // Allow both "tel" and "te" for Telugu.
  const lang = useMemo(() => {
    if (!languageCodeFromUser) return 'en';
    if (languageCodeFromUser === 'te') return 'tel';
    return ['en', 'hi', 'tel'].includes(languageCodeFromUser) ? languageCodeFromUser : 'en';
  }, [languageCodeFromUser]);

  const STRINGS: Record<string, Record<string, string>> = {
    en: {
      appointment: 'Appointment',
      appointmentFor: 'Appointment For',
      myself: 'Myself',
      myFamily: 'My Family',
      loadingFamily: 'Loading family...',
      addNewMember: '+ Add New Member',
      bookAppointment: 'Book Appointment',
      clinicName: 'Clinic Name',
      healthCenter: 'Health Center',
      yearsExperience: 'Years experience',
      self: 'Self',
      selectFamilyToast: 'Please select a family member.',
      fetchErrorTitle: 'Error',
      fetchErrorText: 'Failed to fetch family members',
    },
    hi: {
      appointment: 'अपॉइंटमेंट',
      appointmentFor: 'किसके लिए अपॉइंटमेंट',
      myself: 'मैं स्वयं',
      myFamily: 'मेरा परिवार',
      loadingFamily: 'परिवार लोड हो रहा है...',
      addNewMember: '+ नया सदस्य जोड़ें',
      bookAppointment: 'अपॉइंटमेंट बुक करें',
      clinicName: 'क्लिनिक का नाम',
      healthCenter: 'हेल्थ सेंटर',
      yearsExperience: 'वर्ष का अनुभव',
      self: 'स्वयं',
      selectFamilyToast: 'कृपया एक परिवार सदस्य चुनें।',
      fetchErrorTitle: 'त्रुटि',
      fetchErrorText: 'परिवार के सदस्य नहीं लाए जा सके',
    },
    tel: {
      appointment: 'అపాయింట్మెంట్',
      appointmentFor: 'ఎవరికి అపాయింట్మెంట్',
      myself: 'నేనే',
      myFamily: 'నా కుటుంబం',
      loadingFamily: 'కుటుంబ సభ్యులను లోడ్ చేస్తున్నాం...',
      addNewMember: '+ కొత్త సభ్యుడిని జోడించండి',
      bookAppointment: 'అపాయింట్మెంట్ బుక్ చేయండి',
      clinicName: 'క్లినిక్ పేరు',
      healthCenter: 'హెల్త్ సెంటర్',
      yearsExperience: 'సంవత్సరాల అనుభవం',
      self: 'స్వయం',
      selectFamilyToast: 'దయచేసి ఒక కుటుంబ సభ్యుడిని ఎంచుకోండి.',
      fetchErrorTitle: 'లోపం',
      fetchErrorText: 'కుటుంబ సభ్యులను తెచ్చే ప్రక్రియ విఫలమైంది',
    },
  };

  const t = (key: keyof typeof STRINGS['en']) => STRINGS[lang][key] ?? STRINGS.en[key];

  // ---- state ----------------------------------------------------------------
  const [myFamily, setMyFamily] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [appointmentFor, setAppointmentFor] = useState<'Myself' | 'My Family'>('Myself');
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [loader, setLoader] = useState(false);
  const [doctorProfilePic, setDoctorProfilePic] = useState<any>(null);
  const [doctorUserData, setDoctorUserData] = useState<any>(null);

const getAvatarSource = (profilepic: any) => {
  if (!profilepic) return null;

  try {
    if (typeof profilepic === 'string' && profilepic.startsWith('http')) {
      return { uri: profilepic };
    }
    return null;
  } catch (error) {
    return null;
  }
};



  // Fetch doctor profile picture
  const fetchDoctorProfilePic = async (doctorId: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!doctorId) return;

      const response :any = await AuthFetch(ENDPOINTS.GET_USER(doctorId), token);
      const userData = response?.data?.data;

      if (userData) {
        setDoctorUserData(userData);
        if (userData.profilepic) {
          setDoctorProfilePic(userData.profilepic);
        }
      }
    } catch (error) {
      console.warn('Failed to fetch doctor profile picture:', error);
    }
  };

  useEffect(() => {
    if (doctor?.doctorId) {
      fetchDoctorProfilePic(doctor.doctorId);
    }
  }, [doctor?.doctorId]);

  // ---- data fetch ------------------------------------------------------------
  const fetchFamilyMembers = async () => {
    try {
      setLoader(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const response: any = await AuthFetch(
        ENDPOINTS.GET_ALL_FAMILY_MEMBERS(currentUserDetails?.userId),
        token
      );

      if (response?.data?.status === 'success') {
        const membersList: FamilyMember[] = response?.data?.data || [];
        const family = membersList.filter(
          (user) => (user?.relationship || '').toLowerCase() !== 'self'
        );
        setMyFamily(family);
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: t('fetchErrorTitle'),
        text2: t('fetchErrorText'),
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setLoader(false);
    }
  };
useFocusEffect(
    useCallback(() => {
      fetchFamilyMembers();
    }, [])
  );
 
  useEffect(() => {
    if (
      appointmentFor === 'Myself' &&
      (!currentUserDetails?.firstname || currentUserDetails?.firstname?.trim() === '')
    ) {
      navigation.navigate('AddFamily', { from: 'myself' as any });
    }
  }, [appointmentFor, currentUserDetails, navigation]);

  const userInitial = getAvatarInitial(currentUserDetails?.firstname , currentUserDetails?.lastname);
  const doctorInitial = getAvatarInitial(doctorUserData?.firstname , doctorUserData?.lastname);

  const handleViewDetails = () => {
  navigation.navigate('DoctorDetails', {
    doctorId: doctor?.doctorId?.toString(),
    selectedClinicId: clinic?.addressId?.toString() || null,
  });
  };

const handleBookAppointment = () => {
  if (appointmentFor === 'My Family' && !selectedMember) {
    Toast.show({
      type: 'info',
      text1: t('selectFamilyToast'),
      position: 'top',
    });
    return;
  }

  const selectedPatient = appointmentFor === 'Myself' ? currentUserDetails : selectedMember;
  const patientUserId = selectedPatient?.userId || selectedPatient?.id || selectedPatient?._id;

  const patientWithName = {
    ...selectedPatient,
    userId: patientUserId,
    name: selectedPatient?.firstname || selectedPatient?.name || currentUserDetails?.firstname
  };
  
  navigation.navigate('Payment', {
    doctor,
    clinic,
    date,
    time,
    patient: patientWithName,
    mode,
  });
};

const handleAddNewMember = () => {
  navigation.navigate('AddFamily', { from: 'appointment' }); // Use 'appointment' not 'myself'
};
  const canProceed = appointmentFor === 'Myself' || 
                    (appointmentFor === 'My Family' && selectedMember);

  const avatarSource = getAvatarSource(doctorProfilePic);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('appointment')}</Text>
      </View> */}

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
      {/* Doctor Card - Entire card is clickable */}
      <TouchableOpacity 
        onPress={handleViewDetails}
        activeOpacity={0.95}
      >
        <View style={styles.doctorCard}>
          <View style={styles.avatar}>
            {avatarSource ? (
              <Image
                source={avatarSource}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarText}>{doctorInitial}</Text>
            )}
          </View>

          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{formatDoctorName(doctorUserData?.firstname, doctorUserData?.lastname)}</Text>
            {!!doctorUserData?.specialty && (
              <Text style={styles.doctorSpecialty}>{doctorUserData?.specialty}</Text>
            )}
            {!!doctorUserData?.experience && (
              <Text style={styles.doctorExperience}>
                {doctorUserData?.experience} {t('yearsExperience')}
              </Text>
            )}
            {!!clinic?.clinicName && (
              <Text style={styles.clinicName}>
                {t('clinicName')}- {clinic?.clinicName}
              </Text>
            )}
            <View style={styles.locationContainer}>
              <Text style={styles.locationText}>{clinic?.address}</Text>
              <View style={styles.locationIcon}>
                <Text style={styles.locationArrow}>📍</Text>
              </View>
            </View>
          
          {/* Details link at bottom-right */}
          <View style={styles.detailsContainer}>
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation(); // Prevent card click from firing
                handleViewDetails();
              }}
            >
              <Text style={styles.detailsText}>👁️ Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('appointmentFor')}</Text>

          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                appointmentFor === 'Myself' && styles.toggleButtonActive,
              ]}
              onPress={() => setAppointmentFor('Myself')}
            >
              <Text
                style={[styles.toggleText, appointmentFor === 'Myself' && styles.toggleTextActive]}
              >
                {t('myself')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                appointmentFor === 'My Family' && styles.toggleButtonActive,
              ]}
              onPress={() => setAppointmentFor('My Family')}
            >
              <Text
                style={[
                  styles.toggleText,
                  appointmentFor === 'My Family' && styles.toggleTextActive,
                ]}
              >
                {t('myFamily')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.familyMembersContainer}>
            {loader ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="small" color="#1F2937" />
                <Text style={styles.loaderText}>{t('loadingFamily')}</Text>
              </View>
            ) : appointmentFor === 'Myself' ? (
              <View style={styles.memberCard}>
                <View style={styles.memberLeft}>
                  <View
                    style={[
                      styles.initialsContainer,
                      { backgroundColor: '#E5FFE5' },
                    ]}
                  >
                    <Text style={[styles.initials, { color: '#2ECC71' }]}>{userInitial}</Text>
                  </View>
                  <View style={styles.memberDetails}>
                    <Text style={styles.memberName}>
                      {currentUserDetails?.firstname || t('myself')} {currentUserDetails?.lastname || t('myself')}

                    </Text>
                    <Text style={styles.memberRelation}>{t('self')}</Text>
                    {!!currentUserDetails?.mobile && (
                      <Text style={styles.memberPhone}>{currentUserDetails?.mobile}</Text>
                    )}
                  </View>
                </View>
              </View>
            ) : (
              <>
                {myFamily?.map((member, index) => {
                  const key = member.id || member._id || String(index);
                  const initials = getAvatarInitial(member?.firstname || '');
                  const isSelected =
                    !!selectedMember &&
                    (selectedMember.id || selectedMember._id) === (member.id || member._id);

                  return (
                    <TouchableOpacity
                      key={key}
                      style={styles.memberCard}
                      onPress={() => setSelectedMember(member)}
                    >
                      <View style={styles.memberLeft}>
                        <View
                          style={[
                            styles.initialsContainer,
                            { backgroundColor: member.bgColor || '#E6F2FF' },
                          ]}
                        >
                          <Text style={[styles.initials, { color: member.textColor || '#1E3A8A' }]}>
                            {initials}
                          </Text>
                        </View>
                        <View style={styles.memberDetails}>
                          <Text style={styles.memberName}>{member?.firstname || ''} {member?.lastname || ''}</Text>
                          <Text style={styles.memberRelation}>{member?.relationship || ''}</Text>
                          {!!member?.mobile && (
                            <Text style={styles.memberPhone}>{member.mobile}</Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.radioButton}>
                        <View
                          style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}
                        >
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity style={styles.addMemberButton} onPress={handleAddNewMember}>
                  <Text style={styles.addMemberText}>{t('addNewMember')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {canProceed && (
        <View
          style={[
            styles.footer,
            {
              paddingBottom: Platform.OS === 'android' ? 
                Math.max(insets.bottom, SAFE_AREA.safeBottom) + SPACING.xs : 
                insets.bottom,
            },
          ]}
        >
          <TouchableOpacity style={styles.bookButton} onPress={handleBookAppointment}>
            <Text style={styles.bookButtonText}>{t('bookAppointment')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#EDFFF7',
  },
  loaderContainer: { 
    paddingVertical: SPACING.lg, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loaderText: { 
    marginTop: SPACING.sm, 
    fontSize: moderateScale(14), 
    color: '#1F2937' 
  },
  content: { 
    flex: 1 
  },
  scrollContent: {
    paddingBottom: SAFE_AREA.safeBottom + (isTablet ? SPACING.xl : SPACING.lg),
  },
  doctorCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: isTablet ? SPACING.lg : SPACING.md,
    marginTop: SPACING.md,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: isTablet ? SPACING.lg : SPACING.md,
    ...LAYOUT.shadow.sm,
  },

  doctorInfo: { 
    flex: 1,
    position: 'relative', // Add this for positioning
  },

  // Add these new styles:
  detailsContainer: {
    alignItems: 'flex-end',
    marginTop: SPACING.xs,
  },
  detailsText: {
    fontSize: moderateScale(11),
    color: '#1976d2',
    fontStyle: 'italic',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },

  avatar: {
    width: isTablet ? moderateScale(70) : moderateScale(60),
    height: isTablet ? moderateScale(70) : moderateScale(60),
    borderRadius: isTablet ? moderateScale(35) : moderateScale(30),
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: isTablet ? moderateScale(35) : moderateScale(30),
  },
  avatarText: {
    fontSize: moderateScale(isTablet ? 24 : 20),
    fontWeight: 'bold',
    color: '#1976d2',
  },
  doctorInfo: { 
    flex: 1 
  },
  doctorName: { 
    fontSize: moderateScale(16),
    fontWeight: '600', 
    color: '#333333', 
    marginBottom: SPACING.xxs 
  },
  doctorSpecialty: { 
    fontSize: moderateScale(14), 
    color: '#666666', 
    marginBottom: SPACING.xs 
  },
  doctorExperience: { 
    fontSize: moderateScale(12), 
    color: '#888888', 
    marginBottom: SPACING.xxs 
  },
  clinicName: { 
    fontSize: moderateScale(12), 
    color: '#888888', 
    lineHeight: moderateScale(16) 
  },
  locationContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: SPACING.xs 
  },
  locationText: { 
    fontSize: moderateScale(12), 
    color: '#007AFF', 
    marginRight: SPACING.xs 
  },
  locationIcon: { 
    width: moderateScale(12), 
    height: moderateScale(12) 
  },
  locationArrow: { 
    fontSize: moderateScale(10) 
  },
  sectionContainer: { 
    marginTop: SPACING.lg, 
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md 
  },
  sectionTitle: { 
    fontSize: moderateScale(16),
    fontWeight: '600', 
    color: '#333333', 
    marginBottom: SPACING.md 
  },
  toggleContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#F0F0F0', 
    borderRadius: LAYOUT.borderRadius.md, 
    padding: SPACING.xs, 
    marginBottom: SPACING.lg 
  },
  toggleButton: { 
    flex: 1, 
    paddingVertical: isTablet ? SPACING.md : SPACING.sm, 
    alignItems: 'center', 
    borderRadius: LAYOUT.borderRadius.sm 
  },
  toggleButtonActive: { 
    backgroundColor: '#00203F' 
  },
  toggleText: { 
    fontSize: moderateScale(14), 
    fontWeight: '500', 
    color: '#666666' 
  },
  toggleTextActive: { 
    color: '#FFFFFF' 
  },
  familyMembersContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.lg,
    overflow: 'hidden',
    ...LAYOUT.shadow.sm,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    paddingVertical: isTablet ? SPACING.md : SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  memberLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1 
  },
  initialsContainer: { 
    width: isTablet ? moderateScale(50) : moderateScale(40),
    height: isTablet ? moderateScale(50) : moderateScale(40),
    borderRadius: isTablet ? moderateScale(25) : moderateScale(20),
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: SPACING.sm 
  },
  initials: { 
    fontSize: moderateScale(isTablet ? 16 : 14), 
    fontWeight: '600' 
  },
  memberDetails: { 
    flex: 1 
  },
  memberName: { 
    fontSize: moderateScale(14),
    fontWeight: '500', 
    color: '#333333', 
    marginBottom: SPACING.xxs 
  },
  memberRelation: { 
    fontSize: moderateScale(12), 
    color: '#666666', 
    marginBottom: SPACING.xxs 
  },
  memberPhone: { 
    fontSize: moderateScale(11), 
    color: '#888888' 
  },
  radioButton: { 
    padding: SPACING.xs 
  },
  radioCircle: { 
    width: moderateScale(20), 
    height: moderateScale(20), 
    borderRadius: moderateScale(10), 
    borderWidth: 2, 
    borderColor: '#D1D5DB', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  radioCircleSelected: { 
    borderColor: '#007AFF' 
  },
  radioInner: { 
    width: moderateScale(10), 
    height: moderateScale(10), 
    borderRadius: moderateScale(5), 
    backgroundColor: '#007AFF' 
  },
  addMemberButton: { 
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md, 
    paddingVertical: isTablet ? SPACING.md : SPACING.sm, 
    alignItems: 'center', 
    borderTopWidth: 1, 
    borderTopColor: '#F0F0F0' 
  },
  addMemberText: { 
    fontSize: moderateScale(14), 
    fontWeight: '500', 
    color: '#007AFF' 
  },
  bottomSpacing: { 
    height: SPACING.lg 
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: isTablet ? SPACING.lg : SPACING.md,
    right: isTablet ? SPACING.lg : SPACING.md,
    backgroundColor: 'transparent',
    paddingTop: SPACING.sm,
  },
  bookButton: {
    backgroundColor: '#00203F',
    borderRadius: LAYOUT.borderRadius.lg,
    paddingVertical: isTablet ? SPACING.md : SPACING.sm,
    alignItems: 'center',
    ...LAYOUT.shadow.md,
    minHeight: LAYOUT.buttonHeight,
    justifyContent: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(15),
    fontWeight: '600',
  },
});

export default Appointment;