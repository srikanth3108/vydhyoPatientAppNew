// MyDoctors.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthFetch, ENDPOINTS } from '../../services';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSelector } from 'react-redux';
;
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { formatDoctorName } from '../../utils/util';

type Lang = 'en' | 'hi' | 'tel';
const normalizeLang = (l?: string): Lang => {
  if (l === 'en' || l === 'hi' || l === 'tel') return l;
  if (l === 'te') return 'tel';
  return 'en';
};

const TR = {
  searchPlaceholder: {
    en: 'Search by name or specialty',
    hi: 'नाम या विशेषज्ञता से खोजें',
    tel: 'పేరు లేదా నైపుణ్యం ద్వారా శోధించండి',
  },
  loadingDoctors: {
    en: 'Loading doctors...',
    hi: 'डॉक्टर्स लोड हो रहे हैं...',
    tel: 'వైద్యులను లోడ్ చేస్తున్నాం...',
  },
  noDoctors: {
    en: 'No previously consulted doctors',
    hi: 'पहले परामर्श किए गए डॉक्टर नहीं मिले',
    tel: 'ముందుగా సంప్రదించిన వైద్యులు లేరు',
  },
  errorTitle: {
    en: 'Error',
    hi: 'त्रुटि',
    tel: 'లోపం',
  },
  errorUserIdMissing: {
    en: 'User ID not found. Please log in again.',
    hi: 'यूज़र आईडी नहीं मिली। कृपया पुनः लॉग इन करें।',
    tel: 'వినియోగదారుడి ఐడి కనబడలేదు. దయచేసి తిరిగి లాగిన్ అవండి.',
  },
  errorFetchList: {
    en: 'Failed to fetch doctors list',
    hi: 'डॉक्टर्स सूची प्राप्त करने में विफल',
    tel: 'వైద్యుల జాబితాను పొందడంలో విఫలమైంది',
  },
  errorGeneric: {
    en: 'Something went wrong while fetching doctors list',
    hi: 'डॉक्टर्स सूची लाते समय कुछ गलत हो गया',
    tel: 'వైద్యుల జాబితా తీసుకునే సమయంలో సమస్య ఏర్పడింది',
  },
  toastClinicFail: {
    en: 'Failed to fetch clinic data',
    hi: 'क्लिनिक डेटा प्राप्त करने में विफल',
    tel: 'క్లినిక్ డేటాను పొందడంలో విఫలమైంది',
  },
};

const MyDoctors: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const currentUserDetails = useSelector((state: any) => state.currentUser);
  const lang: Lang = normalizeLang(currentUserDetails?.appLanguage);
  const t = {
    searchPlaceholder: TR.searchPlaceholder[lang],
    loadingDoctors: TR.loadingDoctors[lang],
    noDoctors: TR.noDoctors[lang],
    errorTitle: TR.errorTitle[lang],
    errorUserIdMissing: TR.errorUserIdMissing[lang],
    errorFetchList: TR.errorFetchList[lang],
    errorGeneric: TR.errorGeneric[lang],
    toastClinicFail: TR.toastClinicFail[lang],
  };

  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [clinics, setClinics] = useState<{ [key: string]: any }>({});
  // map doctorId -> most recent past appointment (object)
  const [recentConsultations, setRecentConsultations] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();

  useEffect(() => {
    let mounted = true;
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const storedToken = await AsyncStorage.getItem('authToken');
        if (!storedToken) return;
        const userId = currentUserDetails?.userId;

        if (!userId) {
          Alert.alert(t.errorTitle, t.errorUserIdMissing);
          setLoading(false);
          return;
        }

        const response = await AuthFetch(ENDPOINTS.GET_DOCTORS_LIST_BY_FAMILY(userId), storedToken);

        if (!mounted) return;

        if (response?.status === 'success' && response?.data?.data) {
          setDoctorsList(response.data.data || []);
        } else {
          const msg = response?.message || t.errorFetchList;
          Alert.alert(t.errorTitle, msg);
        }
      } catch (error: any) {
        Alert.alert(t.errorTitle, t.errorGeneric);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDoctors();
    return () => {
      mounted = false;
    };
  }, [currentUserDetails?.userId, lang]);

  const getCurrentUserData = async (doctorId: string, selectedClinicId: string | null) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!doctorId) return;
      const response = await AuthFetch(ENDPOINTS.GET_USER(doctorId), token);
      const userData = response?.data?.data;
      const clinic =
        userData?.addresses?.find((address: any) => address.addressId === selectedClinicId) || null;
      setClinics((prev) => ({
        ...prev,
        [doctorId]: {
          clinicData: clinic,
          profilepic: userData?.profilepic 
        },
      }));
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t.errorTitle,
        text2: t.toastClinicFail,
        position: 'top',
        visibilityTime: 3000,
      });
    }
  };
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

  useEffect(() => {
    if (!doctorsList || doctorsList.length === 0) return;

    doctorsList.forEach((doctor: any) => {
      const doctorId = doctor.userId || doctor._id || doctor.id;
      const selectedClinicId = doctor.selectedClinicId ?? null;
      if (doctorId && !clinics[doctorId]) {
        getCurrentUserData(String(doctorId), selectedClinicId);
      }
    });

    const fetchPatientAppointmentsAndMap = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const userId = currentUserDetails?.userId;
        if (!userId) {
            Alert.alert(t.errorTitle, t.errorUserIdMissing);
          return;
        }
        const resp = await AuthFetch(ENDPOINTS.GET_ALL_FAMILY_APPOINTMENTS(userId, 'completed'), token);

        if (resp?.status === 'success' && Array.isArray(resp.data?.data)) {
          const appointments: any[] = resp.data.data;

          const map: { [key: string]: any } = {};
          appointments.forEach((a) => {
            const docId = String(a.doctorId || a.doctor || '');
            if (!docId) return;
            const existing = map[docId];
            const candidateDate = a.appointmentDate ? new Date(a.appointmentDate) : null;
            if (!candidateDate || Number.isNaN(candidateDate.getTime())) {
              map[docId] = existing ? existing : a;
            } else {
              if (!existing) map[docId] = a;
              else {
                const existingDate = existing.appointmentDate ? new Date(existing.appointmentDate) : null;
                if (!existingDate || candidateDate > existingDate) {
                  map[docId] = a;
                }
              }
            }
          });

          setRecentConsultations(map);
        } else {
            Alert.alert(t.errorTitle, t.errorGeneric);
        }
      } catch (err) {
        Alert.alert(t.errorTitle, t.errorGeneric);
      }
    };

    fetchPatientAppointmentsAndMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorsList]);


  const filteredDoctors = doctorsList.filter((doctor: any) => {
    const name = `${doctor?.firstname || ''} ${doctor?.lastname || ''}`.toLowerCase();
    const spec = (doctor?.specialization?.name || '').toLowerCase();
    const q = (searchText || '').toLowerCase();
    return name.includes(q) || spec.includes(q);
  });

  const onPressDoctor = (doctor: any) => {
    const doctorId = String(doctor.userId || doctor._id || doctor.id || '');
    const selectedClinicId = doctor.selectedClinicId || null;
    if (!doctorId) {
      Alert.alert(t.errorTitle, t.errorGeneric);
      return;
    }
    navigation.navigate('DoctorDetails' as never, { doctorId, selectedClinicId } as never);
  };

  const formatAppointmentDate = (appt: any) => {
    if (!appt) return null;
    const dateStr = appt.appointmentDate || appt.date || appt.createdAt;
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString(lang === 'tel' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

const DoctorCard = ({ doctor }: { doctor: any }) => {
  const id = String(doctor.userId || doctor._id || doctor.id || '');
  const recent = recentConsultations[id];
  const clinicInfo = clinics[id];
  
  const getAvatarInitial = () => {
    return (doctor?.firstname?.[0] || '').toUpperCase();
  };

  const avatarSource = clinicInfo?.profilepic ? getAvatarSource(clinicInfo.profilepic) : null;

    return (
      <TouchableOpacity style={styles.doctorCard} onPress={() => onPressDoctor(doctor)}>
        <View style={styles.doctorHeader}>
          <View style={styles.doctorInfo}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                {avatarSource ? (
                  <Image
                    source={avatarSource}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.avatarText}>{getAvatarInitial()}</Text>
                )}
              </View>
            </View>
            <View style={styles.doctorDetails}>
              <Text style={styles.doctorName}>
                {formatDoctorName(doctor?.firstname, doctor?.lastname)}
              </Text>
              <Text style={styles.doctorSpecialty}>{doctor?.specialization?.name || ''}</Text>
              {clinicInfo?.clinicData ? (
                <Text style={styles.clinicText}>
                  {clinicInfo.clinicData?.clinicName || clinicInfo.clinicData?.line1 || ''}
                </Text>
              ) : null}
              {recent ? (
                <Text style={styles.recentText}>
                  Last consulted: {formatAppointmentDate(recent) || '—'}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t.searchPlaceholder}
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#1976d2" />
          <Text style={styles.loadingText}>{t.loadingDoctors}</Text>
        </View>
      ) : (
        <ScrollView style={styles.doctorsList} showsVerticalScrollIndicator={false}>
          {filteredDoctors.length > 0 ? (
            filteredDoctors.map((doctor: any) => (
              <DoctorCard key={doctor._id || doctor.userId || doctor.id} doctor={doctor} />
            ))
          ) : (
            <Text style={styles.noDoctorsText}>{t.noDoctors}</Text>
          )}
        </ScrollView>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#999',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  doctorsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  doctorCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  doctorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  doctorInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1976d2',
  },
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  clinicText: {
    fontSize: 13,
    color: '#555',
  },
  recentText: {
    marginTop: 6,
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  noDoctorsText: {
    textAlign: 'center',
    color: '#0e0a0aff',
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default MyDoctors;