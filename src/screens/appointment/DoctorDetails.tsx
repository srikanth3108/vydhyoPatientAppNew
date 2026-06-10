// DoctorDetails.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthFetch, ENDPOINTS } from '../../services';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, ScrollView, Alert, Linking, Image, Modal, TouchableOpacity, Dimensions } from 'react-native';
import ThemedText from '../../components/ThemedText';
import RoundedButton from '../../components/RoundedButton';
import { useRoute, useNavigation } from '@react-navigation/native';
;
import Toast from 'react-native-toast-message';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/navigationTypes';
import { useSelector } from 'react-redux';
import { formatDoctorName, formatAppointmentTime, capitalizeWords } from '../../utils/util';

// Import responsive utilities

import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  isIOS,
  isAndroid,
  isTablet,
  isSmallDevice,
  isLargeDevice,
  isExtraSmallDevice,
  SPACING,
  FONT_SIZE,
  ICON_SIZE,
  LAYOUT,
  responsiveWidth,
  responsiveHeight,
  responsiveText,
  moderateScale,
  SAFE_AREA,
  PLATFORM,
} from '../../utils/responsive';

// Get screen dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type RouteParams = {
  doctorId: string;
  selectedClinicId?: string | null;
};

type Lang = 'en' | 'hi' | 'tel';
const normalizeLang = (l?: string): Lang => {
  if (l === 'en' || l === 'hi' || l === 'tel') return l;
  if (l === 'te') return 'tel';
  return 'en';
};

const TR = {
  loading: {
    en: 'Loading...',
    hi: 'लोड हो रहा है...',
    tel: 'లోడ్ అవుతున్నది...',
  },
  errorTitle: { en: 'Error', hi: 'त्रुटि', tel: 'లోపం' },
  errorFetch: {
    en: 'Failed to fetch doctor details',
    hi: 'डॉक्टर विवरण लाने में विफल',
    tel: 'డాక్టర్ వివరాలు పొందడంలో విఫలమైంది',
  },
  noDetails: {
    en: 'No details available',
    hi: 'कोई विवरण उपलब्ध नहीं',
    tel: 'వివరాలు లేవు',
  },
  clinicFetchFailed: {
    en: 'Failed to fetch clinic details',
    hi: 'क्लिनिक विवरण प्राप्त करने में विफल',
    tel: 'క్లినిక్ వివరాలను పొందడంలో విఫలమైంది',
  },
  headerTitle: {
    en: 'Appointments',
    hi: 'अपॉइंटमेंट्स',
    tel: 'అపాయింట్‌మెంట్‌లు',
  },
  drPrefix: { en: 'Dr. ', hi: 'डा. ', tel: 'డా. ' },
  common: {
    info: { en: 'Info', hi: 'जानकारी', tel: 'సమాచారం' },
    error: { en: 'Error', hi: 'त्रुटि', tel: 'లోపం' },
  },
  consultations: {
    en: '📅 Your Completed Consultations',
    hi: '📅 आपकी पूर्ण सलाह',
    tel: '📅 మీ పూర్తయిన సంప్రదింపులు',
  },
  recentWith: {
    en: 'Completed consultations with',
    hi: 'के साथ पूर्ण सलाह',
    tel: 'తో పూర్తయిన సంప్రదింపులు',
  },
  noConsultations: {
    en: 'No completed consultations',
    hi: 'कोई पूर्ण सलाह नहीं',
    tel: 'పూర్తయిన సంప్রదింপులు లేవు',
  },
  bio: {
    en: '📋 Professional Summary',
    hi: '📋 पेशेवर सारांश',
    tel: '📋 ప్రొఫెషనల్ సారాంశం',
  },
  qualifications: {
    en: '🎓 Qualifications',
    hi: '🎓 योग्यता',
    tel: '🎓 అర్హతలు',
  },
  about: {
    en: '👤 About',
    hi: '👤 के बारे में',
    tel: '👤 గురించి',
  },
  clinicNameAddress: {
    en: '🏥 Clinic Name & Address',
    hi: '🏥 क्लिनिक का नाम और पता',
    tel: '🏥 క్లినిక్ పేరు & చిరునామా',
  },
  servicesCredentials: {
    en: '⚕️ Services / Credentials',
    hi: '⚕️ सेवाएं / प्रमाणपत्र',
    tel: '⚕️ సేవలు / ఆధారాలు',
  },
  awardsAndRecognitions: {
    en: '🏆 Awards & Recognitions',
    hi: '🏆 पुरस्कार और मान्यताएं',
    tel: '🏆 అవార్డులు & గుర్తింపులు',
  },
  degrees: {
    en: '📜 Degrees',
    hi: '📜 डिग्री',
    tel: '📜 డిగ్రీలు',
  },
  professionalExperience: {
    en: '💼 Professional Experience',
    hi: '💼 व्यावसायिक अनुभव',
    tel: '💼 వృత్తిపరమైన అనుభవం',
  },
  professionalMemberships: {
    en: '👥 Professional Memberships',
    hi: '👥 व्यावसायिक सदस्यता',
    tel: '👥 వృత్తిపరమైన సభ్యత్వాలు',
  },
  treatmentsAndProcedures: {
    en: '🩺 Treatments & Procedures',
    hi: '🩺 उपचार और प्रक्रियाएं',
    tel: '🩺 చికిత్సలు & ప్రక్రియలు',
  },
  bookAppointment: {
    en: 'Book Appointment',
    hi: 'अपॉइंटमेंट बुक करें',
    tel: 'అపాయింట్‌మెంట్ బుక్ చేయండి',
  },
  loadingConsultations: {
    en: 'Loading consultations...',
    hi: 'सलाह लोड हो रही है...',
    tel: 'సంప్రదింపులు లోడ్ అవుతున్నాయి...',
  },
};

const DoctorDetails: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const params = (route.params || {}) as RouteParams;
  const doctorId = params.doctorId;
  const selectedClinicId = params.selectedClinicId || null;

  const [doctor, setDoctor] = useState<any>(null);
  const [clinic, setClinic] = useState<any>(null);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const currentUser = useSelector((state: any) => state.currentUser);
  const [lang, setLang] = useState<Lang>('en');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [appointmentLoading, setAppointmentLoading] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const isPhysiotherapist = () => {
    const specialization = doctor?.specialization?.name?.toLowerCase() || '';
    const role = doctor?.role?.toLowerCase() || '';
    return (
      specialization.includes('physiotherapist') ||
      role.includes('physio') ||
      specialization.includes('physical therapy') ||
      role.includes('physical therapy')
    );
  };

  useEffect(() => {
    let mounted = true;
    const loadLang = async () => {
      try {
        const l = await AsyncStorage.getItem('appLanguage');
        if (mounted) setLang(normalizeLang(l || currentUser?.appLanguage));
      } catch {
        if (mounted) setLang('en');
      }
    };
    loadLang();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const t = {
    loading: TR.loading[lang],
    errorTitle: TR.errorTitle[lang],
    errorFetch: TR.errorFetch[lang],
    noDetails: TR.noDetails[lang],
    clinicFetchFailed: TR.clinicFetchFailed[lang],
    headerTitle: TR.headerTitle[lang],
    consultations: TR.consultations[lang],
    recentWith: TR.recentWith[lang],
    noConsultations: TR.noConsultations[lang],
    bio: TR.bio[lang],
    qualifications: TR.qualifications[lang],
    about: TR.about[lang],
    clinicNameAddress: TR.clinicNameAddress[lang],
    servicesCredentials: TR.servicesCredentials[lang],
    awardsAndRecognitions: TR.awardsAndRecognitions[lang],
    degrees: TR.degrees[lang],
    professionalExperience: TR.professionalExperience[lang],
    professionalMemberships: TR.professionalMemberships[lang],
    treatmentsAndProcedures: TR.treatmentsAndProcedures[lang],
    bookAppointment: TR.bookAppointment[lang],
    loadingConsultations: TR.loadingConsultations[lang],
  };

  useEffect(() => {
    let mounted = true;

    const fetchDoctorDetails = async () => {
      
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          Alert.alert(t.errorTitle, t.errorFetch);
          setLoading(false);
          return;
        }

        if (!doctorId) {
          Alert.alert(t.errorTitle, t.errorFetch);
          setLoading(false);
          return;
        }

        const userResp :any = await AuthFetch(
          ENDPOINTS.GET_USER(doctorId),
          token,
        );
        const respId = userResp?.data?.data?._id ?? null;
        if (mounted) setClinicId(respId);

        if (!mounted) return;

        if (userResp?.status === 'success' && userResp?.data?.data) {
          const userData = userResp.data.data;
          setDoctor(userData);

          let resolvedClinic: any = null;
          if (selectedClinicId) {
            resolvedClinic =
              userData?.addresses?.find(
                (a: any) => String(a.addressId) === String(selectedClinicId),
              ) || null;
          }

          try {
            const clinicResp :any = await AuthFetch(
              ENDPOINTS.GET_CLINIC_ADDRESS(doctorId),
              token,
            );

            if (
              clinicResp?.status === 'success' &&
              Array.isArray(clinicResp.data?.data)
            ) {
              const clinicsArray: any[] = clinicResp.data.data;

              let chosenClinic = null;
              if (selectedClinicId) {
                chosenClinic =
                  clinicsArray.find(
                    c => String(c.addressId) === String(selectedClinicId),
                  ) || null;
              }
              if (!chosenClinic) {
                if (resolvedClinic && resolvedClinic.addressId) {
                  chosenClinic =
                    clinicsArray.find(
                      c =>
                        String(c.addressId) ===
                        String(resolvedClinic.addressId),
                    ) || null;
                }
              }
              if (!chosenClinic) {
                chosenClinic = clinicsArray[0] || resolvedClinic || null;
              }

              if (mounted) {
                setClinic(chosenClinic);
              }
            } else {
              if (!resolvedClinic && userData?.addresses?.length) {
                if (mounted) setClinic(userData?.addresses?.[0] || null);
              } else if (resolvedClinic) {
                if (mounted) setClinic(resolvedClinic);
              } else {
                if (mounted) setClinic(null);
              }

              Toast.show({
                type: 'error',
                text1: t.errorTitle,
                text2: clinicResp?.message || t.clinicFetchFailed,
                position: 'top',
                visibilityTime: 2500,
              });
            }
          } catch (clinicFetchError) {
            if (!resolvedClinic && userData?.addresses?.length) {
              if (mounted) setClinic(userData?.addresses?.[0] || null);
            } else if (resolvedClinic) {
              if (mounted) setClinic(resolvedClinic);
            } else {
              if (mounted) setClinic(null);
            }

            Toast.show({
              type: 'error',
              text1: t.errorTitle,
              text2: t.clinicFetchFailed,
              position: 'top',
              visibilityTime: 2500,
            });
          }
        } else {
          const msg = userResp?.message || t.errorFetch;
          Alert.alert(t.errorTitle, msg);
          if (mounted) {
            setDoctor(null);
            setClinic(null);
          }
        }
      } catch (error: any) {
        Alert.alert(
          t.errorTitle,
          t.errorFetch + (error?.message ? `\n${error.message}` : ''),
        );
        if (mounted) {
          setDoctor(null);
          setClinic(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDoctorDetails();

    return () => {
      mounted = false;
    };
  }, [doctorId, selectedClinicId, lang]);

  useEffect(() => {
    let mounted = true;

    const fetchAppointments = async () => {
      setAppointmentLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const userId = currentUser?.userId;

      if (!token || !userId) {
        setAppointmentLoading(false);
        return;
      }

      try {
        const response :any = await AuthFetch(
          ENDPOINTS.GET_ALL_FAMILY_APPOINTMENTS(userId),
          token,
        );
        if (response.status !== 'success') {
          if (response.data?.message) {
            Alert.alert(TR.common.info[lang], response.data.message);
          }
          if (mounted) setAppointments([]);
        } else {
          const appointmentsData = response?.data?.data || [];
          // reverse so newest first (server may return oldest-first)

          const reversed = Array.isArray(appointmentsData)
            ? appointmentsData.slice().reverse()
            : [];

          const formattedData = reversed.map((appointment: any) => {
            const rawStatus = (appointment?.appointmentStatus || '')
              .toString()
              .toLowerCase();
            const dateStr = appointment?.appointmentDate;
            let formattedDate = '';
            if (dateStr) {
              try {
                formattedDate = new Date(dateStr).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
              } catch {
                formattedDate = dateStr;
              }
            }
            
            // Use the shared utility function for time formatting
            const formattedTime = formatAppointmentTime(appointment?.appointmentTime);

            return {
              _id: appointment?._id,
              appointmentId: appointment?.appointmentId,
              doctorName: appointment?.doctorName,
              appointmentDepartment: appointment?.appointmentDepartment,
              appointmentType: appointment?.appointmentType,
              appointmentDate: appointment?.appointmentDate,
              appointmentTime: appointment?.appointmentTime,
              patientName: appointment?.patientName,
              doctorId: appointment?.doctorId,
              status: appointment?.appointmentStatus,
              clinicId: appointment?.addressId || appointment?.clinic,
              fee: appointment?.fee,
              duration: appointment?.duration,
              cancellationReason: appointment?.cancellationReason,
              clinicName: appointment?.clinicName,
              date: formattedDate,
              time: formattedTime,
              raw: appointment,
              normalizedStatus: rawStatus,
            };
          });

          const doctorAppts = formattedData.filter(
            (a: any) => String(a.doctorId) === String(doctorId),
          );
          
          // Filter to show only completed appointments
          const completedAppts = doctorAppts.filter((a: any) =>
            (a.normalizedStatus || '').toLowerCase() === 'completed'
          );

          let finalList = completedAppts.slice(0, 6); // Limit to 6 completed appointments

          if (mounted) setAppointments(finalList);
        }
      } catch (error) {
        Alert.alert(
          TR.common.error[lang],
          'Failed to fetch appointments. Please try again.',
        );
        if (mounted) setAppointments([]);
      } finally {
        if (mounted) setAppointmentLoading(false);
      }
    };

    if (doctorId) {
      fetchAppointments();
    } else {
      setAppointments([]);
      setAppointmentLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [doctorId, lang, currentUser?.userId]);

  const handleCall = (phone?: string) => {
    if (!phone) {
      Alert.alert('Info', 'Phone number not available');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(e =>
      console.error('Error opening dialer', e),
    );
  };

  const handleOpenMaps = (address?: string) => {
    if (!address) {
      Alert.alert('Info', 'Address not available');
      return;
    }
    const query = encodeURIComponent(address);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url).catch(e => console.error('Error opening maps', e));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <ThemedText style={{ marginTop: 12 }}>{t.loading}</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (!doctor) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.center}>
          <ThemedText>{t.noDetails}</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  const clinicAddressString = clinic
    ? `${clinic.line1 || ''} ${clinic.line2 || ''} ${clinic.city || ''} ${
        clinic.state || ''
      } ${clinic.pincode || ''}`.trim()
    : '';

  const getStatusColor = (status: string) => {
    const normalizedStatus = String(status || '').toLowerCase();
    switch (normalizedStatus) {
      case 'confirmed':
      case 'scheduled':
      case 'upcoming':
        return '#10B981';
      case 'completed':
        return '#6B7280';
      case 'cancelled':
        return '#EF4444';
      case 'inprogress':
      case 'ongoing':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (appointmentType: string, status: string) => {
    const normalizedStatus = String(status || '').toLowerCase();
    if (normalizedStatus === 'cancelled') return '❌';

    if (
      appointmentType === 'Video Call' ||
      appointmentType === 'Video Consultation'
    ) {
      return '📹';
    }
    return '🏥';
  };

  const getAvatarInitial = () => {
    return (doctor?.firstname?.[0] || 'D').toUpperCase();
  };

  const handleImagePress = () => {
    const avatarSource = getAvatarSource();
    if (avatarSource?.uri) {
      setSelectedImage(avatarSource.uri);
      setModalVisible(true);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedImage(null);
  };

  const getAvatarSource = () => {
    if (!doctor?.profilepic) return null;

    try {
      if (typeof doctor?.profilepic === 'string') {
        if (doctor?.profilepic.startsWith('http')) {
          return { uri: doctor?.profilepic };
        }
        if (doctor?.profilepic?.startsWith('data:')) {
          return { uri: doctor?.profilepic };
        }
        try {
          const parsed = JSON.parse(doctor.profilepic);
          if (parsed.data && typeof parsed.data === 'string') {
            if (parsed?.data.startsWith('http')) {
              return { uri: parsed.data };
            }
            return { uri: `data:image/jpeg;base64,${parsed.data}` };
          }
        } catch (e) {
          if (
            doctor?.profilepic.trim().length > 0 &&
            !doctor.profilepic.startsWith('http')
          ) {
            return {
              uri: `data:image/jpeg;base64,${doctor.profilepic.trim()}`,
            };
          }
        }
      }
      if (
        doctor?.profilepic.data &&
        typeof doctor.profilepic.data === 'string'
      ) {
        if (doctor?.profilepic?.data.startsWith('http')) {
          return { uri: doctor?.profilepic.data };
        }
        return { uri: `data:image/jpeg;base64,${doctor.profilepic.data}` };
      }

      return null;
    } catch (error) {
      console.warn('Error processing profile image:', error);
      return null;
    }
  };

  const avatarSource = getAvatarSource();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <ThemedText style={{ marginTop: 12 }}>{t.loading}</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (!doctor) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.center}>
          <ThemedText>{t.noDetails}</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <TouchableOpacity 
            style={styles.avatar}
            onPress={handleImagePress}
            activeOpacity={avatarSource ? 0.7 : 1}
          >
            {avatarSource ? (
              <Image
                source={avatarSource}
                style={styles.avatarImage}
                resizeMode="cover"
                onError={e => {
                  console.log('Failed to load profile image');
                }}
              />
            ) : (
              <ThemedText style={styles.avatarText}>{getAvatarInitial()}</ThemedText>
            )}
          </TouchableOpacity>

          <ThemedText style={styles.name}>
            {formatDoctorName(doctor?.firstname, doctor?.lastname)}
          </ThemedText>
          <ThemedText style={styles.specialty}>
            {doctor?.specialization?.name || ''}
          </ThemedText>

          {doctor?.specialization?.bio ? (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>{capitalizeWords(t.bio)}</ThemedText>
              <ThemedText style={styles.sectionText}>
                {doctor.specialization.bio}
              </ThemedText>
            </View>
          ) : null}

          {doctor?.degrees ? (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>{capitalizeWords(t.qualifications)}</ThemedText>
              <ThemedText style={styles.sectionText}>{doctor.degrees}</ThemedText>
            </View>
          ) : null}

          {doctor?.about ? (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>{capitalizeWords(t.about)}</ThemedText>
              <ThemedText style={styles.sectionText}>{doctor.about}</ThemedText>
            </View>
          ) : null}

          {/* <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Contact</Text>
                        {doctor.mobile ? (
                            <View>
                                <Text style={styles.sectionText}>Phone: {doctor.mobile}</Text>
                            </View>
                        ) : null}
                        {doctor.email ? <Text style={styles.sectionText}>Email: {doctor.email}</Text> : null}
                    </View> */}

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>{capitalizeWords(t.clinicNameAddress)}</ThemedText>
            {clinic ? (
              <>
                <ThemedText style={styles.sectionText}>
                  {clinic?.clinicName || clinic?.line1 || '—'}
                </ThemedText>
                {clinic?.line1 ? (
                  <ThemedText style={styles.sectionText}>{clinic.line1}</ThemedText>
                ) : null}
                {clinic?.line2 ? (
                  <ThemedText style={styles.sectionText}>{clinic.line2}</ThemedText>
                ) : null}
                {clinic?.city || clinic?.state || clinic?.pincode ? (
                  <ThemedText style={styles.sectionText}>
                    {(clinic?.city ? clinic.city + ', ' : '') +
                      (clinic?.state ? clinic.state + ', ' : '') +
                      (clinic?.pincode ? clinic.pincode : '')}
                  </ThemedText>
                ) : null}
                {clinic?.timings ? (
                  <ThemedText style={styles.sectionText}>
                    Timings: {clinic.timings}
                  </ThemedText>
                ) : null}
              </>
            ) : (
              <ThemedText style={styles.sectionText}>
                No clinic address available
              </ThemedText>
            )}
          </View>

          {doctor?.credentials || doctor?.services ? (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>{capitalizeWords(t.servicesCredentials)}</ThemedText>
              {doctor.credentials ? (
                <ThemedText style={styles.sectionText}>
                  {JSON.stringify(doctor.credentials)}
                </ThemedText>
              ) : null}
              {doctor.services ? (
                <ThemedText style={styles.sectionText}>
                  {JSON.stringify(doctor.services)}
                </ThemedText>
              ) : null}
            </View>
          ) : null}

          {/* Awards and Recognitions Section */}
          {doctor?.doctorProfile?.awardsAndRecognitions && doctor.doctorProfile?.awardsAndRecognitions.length > 0 ? (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>{capitalizeWords(t.awardsAndRecognitions)}</ThemedText>
              {doctor.doctorProfile?.awardsAndRecognitions
                .filter((award: any) => award.status?.toLowerCase() === 'active')
                .map((award: any, index: number) => (
                  <View key={award._id || index} style={styles.awardItem}>
                    <ThemedText style={styles.awardDescription}>
                      • {award.description}
                    </ThemedText>
                    {award.year && (
                      <ThemedText style={styles.awardYear}>
                        ({award.year})
                      </ThemedText>
                    )}
                  </View>
                ))}
              {doctor.doctorProfile?.awardsAndRecognitions.filter((award: any) => award.status?.toLowerCase() === 'active').length === 0 && (
                <ThemedText style={styles.sectionText}>
                  No active awards and recognitions available.
                </ThemedText>
              )}
            </View>
          ) : null}

          {/* Degrees Section */}
          {doctor?.doctorProfile?.degrees && doctor.doctorProfile?.degrees.length > 0 ? (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>{capitalizeWords(t.degrees)}</ThemedText>
              {doctor.doctorProfile?.degrees
                .filter((degree: any) => degree.status?.toLowerCase() === 'active')
                .map((degree: any, index: number) => (
                  <View key={degree._id || index} style={styles.awardItem}>
                    <ThemedText style={styles.awardDescription}>
                      • {degree.degree} - {degree.institute}
                    </ThemedText>
                    {degree.yearOfPassing && (
                      <ThemedText style={styles.awardYear}>
                        ({degree.yearOfPassing})
                      </ThemedText>
                    )}
                  </View>
                ))}
              {doctor.doctorProfile?.degrees.filter((degree: any) => degree.status?.toLowerCase() === 'active').length === 0 && (
                <ThemedText style={styles.sectionText}>
                  No active degrees available.
                </ThemedText>
              )}
            </View>
          ) : null}

          {/* Professional Experience Section */}
          {doctor?.doctorProfile?.professionalExperience && doctor.doctorProfile?.professionalExperience.length > 0 ? (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>{capitalizeWords(t.professionalExperience)}</ThemedText>
              {doctor.doctorProfile?.professionalExperience
                .filter((experience: any) => experience.status?.toLowerCase() === 'active')
                .map((experience: any, index: number) => (
                  <View key={experience._id || index} style={styles.awardItem}>
                    <ThemedText style={styles.awardDescription}>
                      • {experience.institution}
                    </ThemedText>
                    {(experience.fromYear || experience.toYear) && (
                      <ThemedText style={styles.awardYear}>
                        ({experience.fromYear} - {experience.toYear})
                      </ThemedText>
                    )}
                  </View>
                ))}
              {doctor.doctorProfile?.professionalExperience.filter((experience: any) => experience.status?.toLowerCase() === 'active').length === 0 && (
                <ThemedText style={styles.sectionText}>
                  No active professional experience available.
                </ThemedText>
              )}
            </View>
          ) : null}

          {/* Professional Memberships Section */}
          {doctor?.doctorProfile?.professionalMemberships && doctor.doctorProfile?.professionalMemberships.length > 0 ? (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>{capitalizeWords(t.professionalMemberships)}</ThemedText>
              {doctor.doctorProfile?.professionalMemberships
                .filter((membership: any) => membership.status?.toLowerCase() === 'active')
                .map((membership: any, index: number) => (
                  <View key={membership._id || index} style={styles.awardItem}>
                    <ThemedText style={styles.awardDescription}>
                      • {membership.organization}
                    </ThemedText>
                    {membership.year && (
                      <ThemedText style={styles.awardYear}>
                        ({membership.year})
                      </ThemedText>
                    )}
                  </View>
                ))}
              {doctor.doctorProfile?.professionalMemberships.filter((membership: any) => membership.status?.toLowerCase() === 'active').length === 0 && (
                <ThemedText style={styles.sectionText}>
                  No active professional memberships available.
                </ThemedText>
              )}
            </View>
          ) : null}

          {/* Treatments and Procedures Section */}
          {doctor?.doctorProfile?.treatmentsAndProceduresOffered && doctor.doctorProfile?.treatmentsAndProceduresOffered.length > 0 ? (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>{capitalizeWords(t.treatmentsAndProcedures)}</ThemedText>
              {doctor.doctorProfile?.treatmentsAndProceduresOffered
                .filter((treatment: any) => treatment.status?.toLowerCase() === 'active')
                .map((treatment: any, index: number) => (
                  <View key={treatment._id || index} style={styles.awardItem}>
                    <ThemedText style={styles.awardDescription}>
                      • {treatment.description}
                    </ThemedText>
                  </View>
                ))}
              {doctor.doctorProfile?.treatmentsAndProceduresOffered.filter((treatment: any) => treatment.status?.toLowerCase() === 'active').length === 0 && (
                <ThemedText style={styles.sectionText}>
                  No active treatments and procedures available.
                </ThemedText>
              )}
            </View>
          ) : null}

          <RoundedButton
            title={capitalizeWords(t.bookAppointment)}
            onPress={() => {
              if (isPhysiotherapist()) {
                navigation.navigate('SlotSelection');
              } else {
                navigation.navigate('SelectClinic', {
                  doctor: {
                    id: Number(doctor.userId) || 0,
                    doctorId: Number(doctor.userId) || 0,
                    name: `${doctor.firstname || ''} ${doctor.lastname || ''}`.trim(),
                    specialty: doctor.specialization?.name || '',
                    consultationFee: doctor.consultationModeFee || [],
                    addresses: doctor.addresses || [],
                  },
                });
              }
            }}
            style={styles.bookAppointmentBtn}
            textStyle={styles.bookAppointmentText}
          />

          {/* Your Consultations header */}
          <View style={styles.consultationsHeader}>
            <ThemedText style={styles.consultationsTitle}>{capitalizeWords(t.consultations)}</ThemedText>
            <ThemedText style={styles.consultationsSubtitle}>
              {t.recentWith} {TR.drPrefix[lang]}
              {doctor?.firstname || ''}
            </ThemedText>
          </View>

          {/* Consultations list */}
          <View style={styles.consultationsContainer}>
            {appointmentLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#22C55E" />
                <ThemedText style={styles.loadingText}>{t.loadingConsultations}</ThemedText>
              </View>
            ) : appointments.length === 0 ? (
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>{t.noConsultations}</ThemedText>
              </View>
            ) : (
              appointments.map(appt => (
                <View
                  key={appt._id}
                  style={[
                    styles.consultationCard,
                    appt.normalizedStatus === 'cancelled' &&
                      styles.cancelledConsultationCard,
                  ]}
                >
                  <View style={styles.consultationHeader}>
                    <View style={styles.dateTimeContainer}>
                      <ThemedText style={styles.dateText}>📅 {appt.date}</ThemedText>
                      <ThemedText style={styles.timeText}>{appt.time}</ThemedText>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(appt.status) },
                      ]}
                    >
                      <ThemedText style={styles.statusText}>{capitalizeWords(appt.status)}</ThemedText>
                    </View>
                  </View>

                  <View style={styles.consultationBody}>
                    <ThemedText style={styles.clinicName}>
                      {appt.clinicName || appt.appointmentType}
                    </ThemedText>

                    <View style={styles.consultationDetails}>
                      <ThemedText style={styles.typeIcon}>
                        {getStatusIcon(appt.appointmentType, appt.status)}
                      </ThemedText>
                      <ThemedText style={styles.consultationType}>
                        {appt.appointmentType}
                      </ThemedText>
                    </View>

                    {appt.patientName && (
                      <ThemedText style={styles.patientText}>
                        Patient: {appt.patientName}
                      </ThemedText>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Image Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableOpacity 
          style={styles.modalContainer}
          onPress={closeModal}
          activeOpacity={1}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={closeModal}
            >
              <ThemedText style={styles.closeButtonText}>✕</ThemedText>
            </TouchableOpacity>
            
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.enlargedImage}
                resizeMode="contain"
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
  header: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backBtn: {
    color: '#1976d2',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: isTablet ? SPACING.lg : SPACING.md,
    paddingBottom: SAFE_AREA.safeBottom + SPACING.lg,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: isTablet ? SPACING.xl : SPACING.lg,
    ...LAYOUT.shadow.md,
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: isTablet ? moderateScale(120) : moderateScale(80),
    height: isTablet ? moderateScale(120) : moderateScale(80),
    borderRadius: isTablet ? moderateScale(60) : moderateScale(40),
    backgroundColor: '#667eea',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 4,
    borderColor: '#22C55E',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: isTablet ? moderateScale(60) : moderateScale(40),
  },
  avatarText: {
    fontSize: moderateScale(isTablet ? 32 : 24),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  name: {
    textAlign: 'center',
    fontSize: moderateScale(isTablet ? 24 : 20),
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: SPACING.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  specialty: {
    textAlign: 'center',
    fontSize: moderateScale(isTablet ? 18 : 16),
    color: '#22C55E',
    marginBottom: SPACING.lg,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  section: {
    marginTop: SPACING.md,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    backgroundColor: '#F8FAFC',
    borderRadius: LAYOUT.borderRadius.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: '#22C55E',
    ...LAYOUT.shadow.sm,
  },
  sectionTitle: {
    fontSize: moderateScale(isTablet ? 18 : 16),
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: SPACING.sm,
    letterSpacing: 0.5,
  },
  sectionText: {
    fontSize: moderateScale(isTablet ? 16 : 14),
    color: '#475569',
    lineHeight: moderateScale(22),
    fontWeight: '400',
  },
  awardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    padding: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
    ...LAYOUT.shadow.sm,
  },
  awardDescription: {
    fontSize: moderateScale(isTablet ? 16 : 14),
    color: '#334155',
    lineHeight: moderateScale(20),
    flex: 1,
    fontWeight: '500',
  },
  awardYear: {
    fontSize: moderateScale(isTablet ? 14 : 12),
    color: '#22C55E',
    marginLeft: SPACING.xs,
    fontWeight: '600',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
  },
  bookAppointmentBtn: {
    marginTop: SPACING.xl,
    backgroundColor: '#22C55E',
    paddingVertical: isTablet ? SPACING.lg : SPACING.md,
    borderRadius: LAYOUT.borderRadius.lg,
    alignItems: 'center',
    ...LAYOUT.shadow.lg,
    minHeight: LAYOUT.buttonHeight + 10,
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  bookAppointmentText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: moderateScale(isTablet ? 18 : 16),
    letterSpacing: 0.5,
  },
  consultationsHeader: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
    backgroundColor: '#F8FAFC',
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  consultationsTitle: {
    fontSize: moderateScale(isTablet ? 22 : 18),
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: SPACING.xs,
    letterSpacing: 0.5,
  },
  consultationsSubtitle: {
    color: '#64748B',
    fontSize: moderateScale(isTablet ? 16 : 14),
    fontWeight: '500',
  },
  consultationsContainer: {
    width: '100%',
  },
  consultationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: isTablet ? SPACING.lg : SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 6,
    borderLeftColor: '#22C55E',
    ...LAYOUT.shadow.md,
    elevation: 4,
  },
  cancelledConsultationCard: {
    backgroundColor: '#FEF2F2',
    borderLeftColor: '#EF4444',
  },
  consultationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  dateTimeContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: moderateScale(isTablet ? 16 : 14),
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: SPACING.xxs,
  },
  timeText: {
    fontSize: moderateScale(isTablet ? 14 : 12),
    color: '#64748B',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: LAYOUT.borderRadius.lg,
    marginLeft: SPACING.xs,
    elevation: 2,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: moderateScale(isTablet ? 12 : 11),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  consultationBody: {
    flex: 1,
  },
  clinicName: {
    fontSize: moderateScale(isTablet ? 18 : 16),
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: SPACING.sm,
  },
  consultationDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    backgroundColor: '#F1F5F9',
    padding: SPACING.xs,
    borderRadius: LAYOUT.borderRadius.sm,
  },
  typeIcon: {
    fontSize: moderateScale(isTablet ? 16 : 14),
    marginRight: SPACING.sm,
  },
  consultationType: {
    fontSize: moderateScale(isTablet ? 15 : 13),
    color: '#475569',
    fontWeight: '600',
  },
  patientText: {
    fontSize: moderateScale(isTablet ? 14 : 12),
    color: '#64748B',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: '#F8FAFC',
    borderRadius: LAYOUT.borderRadius.md,
  },
  loadingText: {
    marginLeft: SPACING.md,
    color: '#64748B',
    fontSize: moderateScale(isTablet ? 16 : 14),
    fontWeight: '600',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: '#F8FAFC',
    borderRadius: LAYOUT.borderRadius.lg,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: moderateScale(isTablet ? 18 : 16),
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '600',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: screenWidth,
    height: screenHeight,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: SAFE_AREA.safeTop + SPACING.md,
    right: SPACING.md,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(18),
    fontWeight: 'bold',
  },
  enlargedImage: {
    width: screenWidth,
    height: screenHeight,
  },
});

export default DoctorDetails;
