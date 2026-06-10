import React, { useEffect, useState } from 'react';
import { AuthFetch, ENDPOINTS } from '../../../services';
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
  Platform
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/navigationTypes';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
;
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDoctorName } from '../../../utils/util';

// Import responsive utilities
import {
  isTablet,
  SPACING,
  LAYOUT,
  moderateScale,
  SAFE_AREA,
} from '../../../utils/responsive';

type AppointmentBookingRouteProp = RouteProp<RootStackParamList, 'Appointment'>;

interface AppointmentBookingProps {
  route: AppointmentBookingRouteProp;
}

// Translations for multiple languages
const translations: any = {
  en: {
    appointmentFor: 'Appointment For',
    myself: 'Myself',
    myFamily: 'My Family',
    self: 'Self',
    addNewMember: '+ Add New Member',
    bookAppointment: 'Book Appointment',
    loadingSlots: 'Loading time slots...',
    consultationFee: 'Consultation Fee:',
    yearsExperience: 'Years experience',
    error: 'Error',
    failedToFetchSlots: 'Failed to fetch slots',
  },
  hi: {
    appointmentFor: 'अपॉइंटमेंट किसके लिए',
    myself: 'अपने लिए',
    myFamily: 'मेरे परिवार के लिए',
    self: 'स्वयं',
    addNewMember: '+ नया सदस्य जोड़ें',
    bookAppointment: 'अपॉइंटमेंट बुक करें',
    loadingSlots: 'समय स्लॉट लोड हो रहे हैं...',
    consultationFee: 'परामर्श शुल्क:',
    yearsExperience: 'वर्षों का अनुभव',
    error: 'त्रुटि',
    failedToFetchSlots: 'स्लॉट प्राप्त करने में विफल',
  },
  tel: {
    appointmentFor: 'ఎపాయింట్మెంట్ ఎవరికోసం',
    myself: 'నాకోసం',
    myFamily: 'నా కుటుంబం కోసం',
    self: 'స్వయంగా',
    addNewMember: '+ కొత్త సభ్యుని జోడించండి',
    bookAppointment: 'ఎపాయింట్మెంట్ బుక్ చేయండి',
    loadingSlots: 'టైమ్ స్లాట్స్ లోడ్ అవుతున్నాయి...',
    consultationFee: 'కన్సల్టేషన్ ఫీ:',
    yearsExperience: 'సంవత్సరాల అనుభవం',
    error: 'లోపం',
    failedToFetchSlots: 'స్లాట్లను పొందడంలో విఫలమైంది',
  },
};

const SelectPatient: React.FC<AppointmentBookingProps> = ({ route }) => {
  const currentuserDetails = useSelector((state: any) => state.currentUser);
  const appLanguage = currentuserDetails?.appLanguage || 'en';
  const t = translations[appLanguage] || translations.en;
  const insets = useSafeAreaInsets();
  
  const { doctor, date, time, mode, reason, reports } = route.params;
  
  const [mySelf, setMyself] = useState();
  const [myFamily, setMyFamily] = useState([]);
  const [selectedMember, setSelectedMember] = useState({});
  const [appointmentFor, setAppointmentFor] = useState(t.myself);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [loader, setLoader] = useState(false);
  const [doctorProfilePic, setDoctorProfilePic] = useState<any>(null);

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

  const getAvatarInitial = (name: string) => {
    return (name?.[0] || 'D').toUpperCase();
  };

  const fetchDoctorProfilePic = async (doctorId: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!doctorId) return;
      
      const response = await AuthFetch(ENDPOINTS.GET_USER(doctorId), token);
      const userData = response?.data?.data;
      
      if (userData?.profilepic) {
        setDoctorProfilePic(userData.profilepic);
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

  const fetchFamilyMembers = async () => {
    try {
      setLoader(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await AuthFetch(
        ENDPOINTS.GET_ALL_FAMILY_MEMBERS(currentuserDetails.userId),
        token
      );

      if (response?.data?.status === 'success') {
        const membersList = response?.data?.data;
        const family = membersList.filter(
          (user) => user.relationship?.toLowerCase() !== 'self'
        );
        setMyFamily(family);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
      Toast.show({
        type: 'error',
        text1: t.error,
        text2: t.failedToFetchSlots,
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    fetchFamilyMembers();
  }, []);

  const myselfData = {
    name: t.myself,
    relation: t.self,
    phone: currentuserDetails?.mobile || '+91 98765 43213',
    initials: 'ME',
    bgColor: '#E5FFE5',
    textColor: '#2ECC71',
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleBookAppointment = () => {
    const selectedPatient = appointmentFor === t.myself ? currentuserDetails : selectedMember;
    
    const patientUserId = selectedPatient?.userId || currentuserDetails?.userId;
    
    const patientWithCorrectId = {
      ...selectedPatient,
      userId: patientUserId 
    };

    navigation.navigate('SelectLocFromMap', {
      doctor,
      date,
      time,
      patient: patientWithCorrectId,
      mode,
      reason,
      reports
    });
  };
  const handleViewDetails = () => {
  navigation.navigate('DoctorDetails', {
    doctorId: doctor?.doctorId?.toString(),
    selectedClinicId: null, // Since this is for physio home visits, clinic might not be applicable
    });
  };

  const handleAddNewMember = () => {
    navigation.navigate('AddFamily', { from: 'appointment' });
  };

  if (
    appointmentFor === t.myself &&
    (!currentuserDetails?.firstname || currentuserDetails.firstname.trim() === '')
  ) {
    navigation.navigate('AddFamily', { from: 'myself' });
    return null;
  }
  const canProceed = appointmentFor === t.myself || (appointmentFor === t.myFamily && Object.keys(selectedMember).length > 0);

  const avatarSource = getAvatarSource(doctorProfilePic);
  const doctorInitial = getAvatarInitial(doctor?.name || 'D');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
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
            <Text style={styles.doctorName}>{formatDoctorName(doctor.name)}</Text>
            <Text style={styles.doctorSpecialty}>{doctor?.specialty?.name}</Text>
            <Text style={styles.doctorExperience}>
              {doctor?.specialty?.experience} {t.yearsExperience}
            </Text>
            <Text style={styles.locationText}>
              {t.consultationFee} ₹{doctor?.consultationFee[2]?.fee}
            </Text>
          <View style={styles.detailsContainer}>
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation(); // Prevent card click from firing
                handleViewDetails();
              }}
            >
              <Text style={styles.detailsText}>👁️ View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t.appointmentFor}</Text>
          
          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[styles.toggleButton, appointmentFor === t.myself && styles.toggleButtonActive]}
              onPress={() => setAppointmentFor(t.myself)}
            >
              <Text style={[styles.toggleText, appointmentFor === t.myself && styles.toggleTextActive]}>
                {t.myself}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleButton, appointmentFor === t.myFamily && styles.toggleButtonActive]}
              onPress={() => setAppointmentFor(t.myFamily)}
            >
              <Text style={[styles.toggleText, appointmentFor === t.myFamily && styles.toggleTextActive]}>
                {t.myFamily}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.familyMembersContainer}>
            {loader ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="small" color="#1F2937" />
                <Text style={styles.loaderText}>{t.loadingSlots}</Text>
              </View>
            ) : (
              <>
                {appointmentFor === t.myself ? (
                  <View style={styles.memberCard}>
                    <View style={styles.memberLeft}>
                      <View style={[styles.initialsContainer, { backgroundColor: myselfData.bgColor }]}>
                        <Text style={[styles.initials, { color: myselfData.textColor }]}>
                          {myselfData.initials}
                        </Text>
                      </View>
                      <View style={styles.memberDetails}>
                        <Text style={styles.memberName}>{currentuserDetails.firstname} {currentuserDetails.lastname}</Text>
                        <Text style={styles.memberRelation}>{t.self}</Text>
                        <Text style={styles.memberPhone}>{currentuserDetails.mobile}</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <>
                    {myFamily.map((member) => (
                      <TouchableOpacity
                        key={member.id}
                        style={styles.memberCard}
                        onPress={() => setSelectedMember(member)}
                      >
                        <View style={styles.memberLeft}>
                          <View style={[styles.initialsContainer, { backgroundColor: member.bgColor || '#E6F2FF' }]}>
                            <Text style={[styles.initials, { color: member.textColor || '#1E3A8A' }]}>
                              {member?.firstname?.[0] || ''}
                            </Text>
                          </View>
                          <View style={styles.memberDetails}>
                            <Text style={styles.memberName}>{member?.firstname} {member?.lastname || ''}</Text>
                            <Text style={styles.memberRelation}>{member.relationship}</Text>
                            <Text style={styles.memberPhone}>{member.mobile}</Text>
                          </View>
                        </View>
                        <View style={styles.radioButton}>
                          <View style={[
                            styles.radioCircle,
                            selectedMember === member && styles.radioCircleSelected,
                          ]}>
                            {selectedMember === member && <View style={styles.radioInner} />}
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={styles.addMemberButton} onPress={handleAddNewMember}>
                      <Text style={styles.addMemberText}>{t.addNewMember}</Text>
                    </TouchableOpacity>
                  </>
                )}
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
            <Text style={styles.bookButtonText}>{t.bookAppointment}</Text>
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
    alignItems: 'center',
  },
  loaderText: {
    marginTop: SPACING.sm,
    fontSize: moderateScale(14),
    color: '#1F2937',
  },
  content: {
    flex: 1,
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

  locationText: {
    fontSize: moderateScale(12),
    color: '#007AFF',
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
    flex: 1,
  },
  doctorName: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#333333',
    marginBottom: SPACING.xxs,
  },
  doctorSpecialty: {
    fontSize: moderateScale(14),
    color: '#666666',
    marginBottom: SPACING.xs,
  },
  doctorExperience: {
    fontSize: moderateScale(12),
    color: '#888888',
    marginBottom: SPACING.xxs,
  },
  locationText: {
    fontSize: moderateScale(12),
    color: '#007AFF',
  },
  sectionContainer: {
    marginTop: SPACING.lg,
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#333333',
    marginBottom: SPACING.md,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: isTablet ? SPACING.md : SPACING.sm,
    alignItems: 'center',
    borderRadius: LAYOUT.borderRadius.sm,
  },
  toggleButtonActive: {
    backgroundColor: '#00203F',
  },
  toggleText: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: '#666666',
  },
  toggleTextActive: {
    color: '#FFFFFF',
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
    flex: 1,
  },
  initialsContainer: {
    width: isTablet ? moderateScale(50) : moderateScale(40),
    height: isTablet ? moderateScale(50) : moderateScale(40),
    borderRadius: isTablet ? moderateScale(25) : moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  initials: {
    fontSize: moderateScale(isTablet ? 16 : 14),
    fontWeight: '600',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: '#333333',
    marginBottom: SPACING.xxs,
  },
  memberRelation: {
    fontSize: moderateScale(12),
    color: '#666666',
    marginBottom: SPACING.xxs,
  },
  memberPhone: {
    fontSize: moderateScale(11),
    color: '#888888',
  },
  radioButton: {
    padding: SPACING.xs,
  },
  radioCircle: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#007AFF',
  },
  radioInner: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    backgroundColor: '#007AFF',
  },
  addMemberButton: {
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    paddingVertical: isTablet ? SPACING.md : SPACING.sm,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  addMemberText: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: '#007AFF',
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
  bottomSpacing: {
    height: SPACING.lg,
  },
});

export default SelectPatient;