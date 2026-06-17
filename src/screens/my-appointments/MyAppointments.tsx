import React, {useEffect, useState} from 'react';
import {AuthFetch, ENDPOINTS, GetProviderAppointments} from '../../services';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {
  RootStackParamList,
  AppointmentBase,
  UpcomingAppointment,
  CompletedAppointment,
  CancelledAppointment,
} from '../../navigation/navigationTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {useSelector} from 'react-redux';

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

type TabType = 'Upcoming' | 'Completed' | 'Cancelled';
type AppointmentCategory = 'Clinic' | 'Homecare';

/** ===================== i18n (EN / HI / TEL) ===================== */
type Lang = 'en' | 'hi' | 'tel';
const normalizeLang = (l?: string): Lang => {
  if (l === 'en' || l === 'hi' || l === 'tel') {
    return l;
  }
  if (l === 'te') {
    return 'tel';
  }
  return 'en';
};

const UI = {
  headerTitle: {
    en: 'My Appointments',
    hi: 'मेरी अपॉइंटमेंट्स',
    tel: 'నా అపాయింట్‌మెంట్‌లు',
  },
  tabs: {
    Upcoming: {en: 'Upcoming', hi: 'आगामी', tel: 'రాబోయేవి'},
    Completed: {en: 'Completed', hi: 'पूर्ण', tel: 'పూర్తయ్యినవి'},
    Cancelled: {en: 'Cancelled', hi: 'रद्द', tel: 'రద్దయినవి'},
  },
  categories: {
    Clinic: {en: 'Clinic', hi: 'क्लिनिक', tel: 'క్లినిక్'},
    Homecare: {en: 'Homecare', hi: 'होमकेयर', tel: 'హోమ్‌కేర్'},
  },
  loading: {
    en: 'Loading appointments...',
    hi: 'अपॉइंटमेंट्स लोड हो रही हैं...',
    tel: 'అపాయింట్‌మెంట్‌లు లోడ్ అవుతున్నాయి...',
  },
  empty: {
    upcoming: {
      en: 'No upcoming appointments',
      hi: 'कोई आगामी अपॉइंटमेंट नहीं',
      tel: 'రాబోయే అపాయింట్‌మెంట్‌లు లేవు',
    },
    completed: {
      en: 'No completed appointments',
      hi: 'कोई पूर्ण अपॉइंटमेंट नहीं',
      tel: 'పూర్తయిన అపాయింట్‌మెంట్‌లు లేవు',
    },
    cancelled: {
      en: 'No cancelled appointments',
      hi: 'कोई रद्द अपॉइंटमेंट नहीं',
      tel: 'రద్దైన అపాయింట్‌మెంట్‌లు లేవు',
    },
  },
  status: {
    completed: {en: 'Completed', hi: 'पूर्ण', tel: 'పూర్తయ్యింది'},
    cancelled: {en: 'Cancelled', hi: 'रद्द', tel: 'రద్దు'},
  },
  buttons: {
    viewDetails: {en: 'View Details', hi: 'विवरण देखें', tel: 'వివరాలు చూడండి'},
    reschedule: {en: 'Reschedule', hi: 'रीशेड्यूल', tel: 'రీషెడ్యూల్ చేయండి'},
    rescheduleDisabled: {en: 'Reschedule', hi: 'रीशेड्यूल', tel: 'రీషెడ్యూల్'},
    rescheduleDisabledSub: {
      en: 'within 2 hrs',
      hi: '2 घंटे में नहीं',
      tel: '2 గంటల్లో కాదు',
    },
    cancel: {en: 'Cancel', hi: 'रद्द करें', tel: 'రద్దు చేయండి'},
    downloadReceipt: {
      en: 'Download Receipt',
      hi: 'रसीद डाउनलोड करें',
      tel: 'రశీదు డౌన్‌లోడ్ చేయండి',
    },
    viewReceipt: {en: 'View Receipt', hi: 'रसीद देखें', tel: 'రశీదు చూడండి'},
    bookAgain: {
      en: 'Book Again',
      hi: 'फिर से बुक करें',
      tel: 'మళ్లీ బుక్ చేయండి',
    },
    rebook: {en: 'Rebook', hi: 'रीबुक', tel: 'రిబుక్ చేయండి'},
    details: {en: 'Details', hi: 'विवरण', tel: 'వివరాలు'},
  },
  drPrefix: {en: 'Dr. ', hi: 'डा. ', tel: 'డా. '},
  common: {
    info: {en: 'Info', hi: 'जानकारी', tel: 'సమాచారం'},
    error: {en: 'Error', hi: 'त्रुटि', tel: 'లోపం'},
  },
};
/** ================================================================ */

const formatDate = (dateStr: string) => {
  if (!dateStr) {
    return 'Date not available';
  }

  try {
    let dateObj: Date;

    if (dateStr.includes('T')) {
      dateObj = new Date(dateStr);
    } else if (dateStr.includes('-') && dateStr.length === 10) {
      dateObj = new Date(dateStr);
    } else if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/').map(Number);
      dateObj = new Date(year, month - 1, day);
    } else {
      return 'Invalid date';
    }

    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }

    const options = {day: 'numeric', month: 'short', year: 'numeric'} as const;
    return dateObj.toLocaleDateString('en-GB', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date error';
  }
};

const safeString = (
  val: any,
  fallback: string = 'Something went wrong.',
): string => {
  if (!val) {
    return fallback;
  }
  if (typeof val === 'string') {
    return val;
  }
  if (
    typeof val === 'object' &&
    val.message &&
    typeof val.message === 'string'
  ) {
    return val.message;
  }
  try {
    return JSON.stringify(val);
  } catch {
    return fallback;
  }
};

const isRescheduleDisabled = (appointment: any): boolean => {
  try {
    const dateStr = appointment.date || appointment.appointmentDate;
    const timeStr = appointment.appointmentTime;
    if (!dateStr || !timeStr) {
      return false;
    }

    const apptDateTime = new Date(`${dateStr.split('T')[0]}T${timeStr}`);
    const diffMs = apptDateTime.getTime() - Date.now();
    const diffMins = diffMs / 60000;

    // Disable if past (diffMins <= 0) OR within 2 hours (diffMins <= 120)
    return diffMins <= 120;
  } catch {
    return false;
  }
};

const handleViewReceiptUtil = async (
  appointment: any,
  lang: Lang,
  receiptLoadingId: string | null,
  setReceiptLoadingId: (id: string | null) => void,
) => {
  const appointmentId =
    appointment.appointmentId || appointment._id || appointment.id;
  if (!appointmentId) {
    Alert.alert(UI.common.error[lang], 'Appointment ID not found.');
    return;
  }
  setReceiptLoadingId(appointmentId);
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      Alert.alert(
        UI.common.error[lang],
        'You are not logged in. Please log in to view the receipt.',
      );
      setReceiptLoadingId(null);
      return;
    }
    const response: any = await AuthFetch(
      ENDPOINTS.GET_APPOINTMENT_RECEIPT(appointmentId),
      token,
    );
    console.log('Receipt response:', response);
    console.log('Receipt response:', response?.data?.data?.receiptUrl);
    // AuthFetch wraps server response under response.data
    // Server shape: { status, message, data: { appointmentId, receiptUrl, expiresIn } }
    // Full path: response.data.data.receiptUrl
    const receiptUrl = response?.data?.data?.receiptUrl;
    if (receiptUrl) {
      await Linking.openURL(receiptUrl);
      // // const supported = await Linking.canOpenURL(receiptUrl);
      // console.log('supported Receipt URL:', supported);
      // if (!supported) {
      // } else {
      //   Alert.alert(UI.common.error[lang], 'Unable to open receipt URL.');
      // }
    } else {
      const errMsg = safeString(
        response?.data?.message || response?.message,
        'Failed to fetch receipt.',
      );
      Alert.alert(UI.common.error[lang], errMsg);
    }
  } catch (error) {
    console.error('Error fetching receipt:', error);
    Alert.alert(
      UI.common.error[lang],
      'Failed to fetch receipt. Please try again.',
    );
  } finally {
    setReceiptLoadingId(null);
  }
};

interface TabProps {
  appointments: any[];
  isLoading: boolean;
}

const UpcomingTab: React.FC<TabProps> = ({appointments, isLoading}) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const current = useSelector((state: any) => state.currentUser);
  const lang: Lang = normalizeLang(current?.appLanguage);
  const [receiptLoadingId, setReceiptLoadingId] = useState<string | null>(null);

  const handleViewDetails = (appointment: UpcomingAppointment) => {
    navigation.navigate('ViewDetails', {appointment});
  };

  const handleReschedule = (appointment: UpcomingAppointment) => {
    if (appointment.appointmentType === 'Home Visit') {
      navigation.navigate('HomeServiceReBook', {
        appointment: appointment as any,
      });
    } else {
      navigation.navigate('Reschedule', {appointment});
    }
  };

  const handleCancel = (appointment: UpcomingAppointment) => {
    if (appointment.appointmentType === 'Home Visit') {
      navigation.navigate('HomeServiceCancel', {appointment});
    } else {
      navigation.navigate('Cancel', {appointment});
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#22C55E" />
        <Text style={styles.loadingText}>{UI.loading[lang]}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {appointments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{UI.empty.upcoming[lang]}</Text>
        </View>
      ) : (
        appointments.map((appointment: any) => (
          <TouchableOpacity
            key={appointment._id}
            style={[styles.appointmentCard]}
            onPress={() => handleViewDetails(appointment)}
            activeOpacity={0.7}>
            <View style={styles.cardHeader}>
              <View style={styles.doctorInfo}>
                <View style={styles.doctorDetails}>
                  <Text style={styles.doctorName} numberOfLines={1}>
                    {appointment.doctorName}
                  </Text>
                  <Text style={styles.doctorSpecialty} numberOfLines={1}>
                    {appointment.appointmentDepartment}
                  </Text>
                </View>
              </View>
              {appointment.appointmentStatus && (
                <View style={styles.statusContainer}>
                  <View
                    style={[styles.statusBadge, styles.confirmedStatusBadge]}>
                    <Text style={[styles.statusText, styles.confirmedStatus]}>
                      {appointment.appointmentStatus}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.appointmentDetails}>
              <View style={styles.detailRow}>
                <View style={styles.iconContainer}>
                  <Text style={styles.detailIcon}>🏥</Text>
                </View>
                <Text style={styles.detailText} numberOfLines={1}>
                  {appointment.appointmentType}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.iconContainer}>
                  <Text style={styles.detailIcon}>📅</Text>
                </View>
                <Text style={styles.detailText} numberOfLines={1}>
                  {formatDate(appointment.date || appointment.appointmentDate)},{' '}
                  {appointment.time?.replace(/am|pm/g, (match: string) =>
                    match.toUpperCase(),
                  )}
                </Text>
              </View>

              <View style={[styles.detailRow, styles.lastDetailRow]}>
                <View style={styles.iconContainer}>
                  <Text style={styles.detailIcon}>👤</Text>
                </View>
                <Text style={styles.detailText} numberOfLines={1}>
                  {appointment.patientName}
                </Text>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.viewDetailsButton]}
                onPress={() => handleViewDetails(appointment)}>
                <Text style={styles.viewDetailsButtonText}>
                  {UI.buttons.viewDetails[lang]}
                </Text>
              </TouchableOpacity>

              {isRescheduleDisabled(appointment) ? (
                <View
                  style={[
                    styles.actionButton,
                    styles.rescheduleDisabledButton,
                  ]}>
                  <Text style={styles.rescheduleDisabledText}>
                    🚫 {UI.buttons.rescheduleDisabled[lang]}
                  </Text>
                  <Text style={styles.rescheduleDisabledSubText}>
                    {UI.buttons.rescheduleDisabledSub[lang]}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, styles.rescheduleButton]}
                  onPress={() => handleReschedule(appointment)}>
                  <Text style={styles.rescheduleButtonText}>
                    {UI.buttons.reschedule[lang]}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => handleCancel(appointment)}>
                <Text style={styles.cancelButtonText}>
                  {UI.buttons.cancel[lang]}
                </Text>
              </TouchableOpacity>
            </View>

            {appointment.appointmentType !== 'Home Visit' && (
              <TouchableOpacity
                style={styles.viewReceiptFullButton}
                onPress={() =>
                  handleViewReceiptUtil(
                    appointment,
                    lang,
                    receiptLoadingId,
                    setReceiptLoadingId,
                  )
                }
                disabled={
                  receiptLoadingId ===
                  (appointment.appointmentId ||
                    appointment._id ||
                    appointment.id)
                }>
                {receiptLoadingId ===
                (appointment.appointmentId ||
                  appointment._id ||
                  appointment.id) ? (
                  <ActivityIndicator size="small" color="#00203F" />
                ) : (
                  <Text style={styles.viewReceiptButtonText}>
                    🧾 {UI.buttons.viewReceipt[lang]}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

const CompletedTab: React.FC<TabProps> = ({appointments, isLoading}) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const current = useSelector((state: any) => state.currentUser);
  const lang: Lang = normalizeLang(current?.appLanguage);
  const [receiptLoadingId, setReceiptLoadingId] = useState<string | null>(null);

  const handleViewDetails = (appointment: CompletedAppointment) => {
    if (appointment.appointmentType === 'Home Visit') {
      navigation.navigate('HomecareAppointmentDetails', {appointment});
    } else {
      navigation.navigate('AppointmentDetails', {appointment});
    }
  };

  const handleDownloadReceipt = (appointment: CompletedAppointment) => {
    console.log(
      'Download receipt for:',
      (appointment as any)._id || appointment.appointmentId,
    );
  };

  const handleBookAgain = (appointment: CompletedAppointment) => {
    if (appointment.appointmentType === 'Home Visit') {
      navigation.navigate('HomeServiceReBook', {
        appointment: appointment as any,
      });
    } else {
      navigation.navigate('BookAgain', {appointment});
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#22C55E" />
        <Text style={styles.loadingText}>{UI.loading[lang]}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {appointments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{UI.empty.completed[lang]}</Text>
        </View>
      ) : (
        appointments.map((appointment: any) => (
          <TouchableOpacity
            key={appointment._id || appointment.appointmentId || appointment.id}
            style={[styles.appointmentCard]}
            onPress={() => handleViewDetails(appointment)}
            activeOpacity={0.7}>
            <View style={styles.cardHeader}>
              <View style={styles.doctorInfo}>
                <View style={styles.doctorDetails}>
                  <Text style={styles.doctorName} numberOfLines={1}>
                    {appointment.doctorName}
                  </Text>
                  <Text style={styles.doctorSpecialty} numberOfLines={1}>
                    {appointment.appointmentDepartment}
                  </Text>
                </View>
              </View>
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, styles.completedStatusBadge]}>
                  <Text style={[styles.statusText, styles.completedStatus]}>
                    ✓ {UI.status.completed[lang]}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.appointmentDetails}>
              <View style={styles.detailRow}>
                <View style={styles.iconContainer}>
                  <Text style={styles.detailIcon}>
                    {appointment.appointmentType === 'Video Call' ? '📹' : '🏥'}
                  </Text>
                </View>
                <Text style={styles.detailText} numberOfLines={1}>
                  {appointment.appointmentType === 'In-Clinic Visit' &&
                  appointment.clinicName
                    ? `${appointment.appointmentType} - ${appointment.clinicName}`
                    : appointment.appointmentType}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.iconContainer}>
                  <Text style={styles.detailIcon}>📅</Text>
                </View>
                <Text style={styles.detailText} numberOfLines={1}>
                  {formatDate(appointment.date || appointment.appointmentDate)},{' '}
                  {appointment.time?.replace(/am|pm/g, (match: string) =>
                    match.toUpperCase(),
                  )}
                </Text>
              </View>

              <View style={[styles.detailRow, styles.lastDetailRow]}>
                <View style={styles.iconContainer}>
                  <Text style={styles.detailIcon}>👤</Text>
                </View>
                <Text style={styles.detailText} numberOfLines={1}>
                  {appointment.patientName}
                </Text>
              </View>
            </View>

            <View style={styles.completedButtonContainer}>
              {appointment.appointmentType !== 'Home Visit' && (
                <TouchableOpacity
                  style={styles.viewReceiptButton}
                  onPress={() =>
                    handleViewReceiptUtil(
                      appointment,
                      lang,
                      receiptLoadingId,
                      setReceiptLoadingId,
                    )
                  }
                  disabled={
                    receiptLoadingId ===
                    (appointment.appointmentId ||
                      appointment._id ||
                      appointment.id)
                  }>
                  {receiptLoadingId ===
                  (appointment.appointmentId ||
                    appointment._id ||
                    appointment.id) ? (
                    <ActivityIndicator size="small" color="#00203F" />
                  ) : (
                    <Text style={styles.viewReceiptButtonText}>
                      🧾 {UI.buttons.viewReceipt[lang]}
                    </Text>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.bookAgainButton}
                onPress={() => handleBookAgain(appointment)}>
                <Text style={styles.bookAgainButtonText}>
                  + {UI.buttons.bookAgain[lang]}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

const CancelledTab: React.FC<TabProps> = ({appointments, isLoading}) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const current = useSelector((state: any) => state.currentUser);
  const lang: Lang = normalizeLang(current?.appLanguage);
  const [receiptLoadingId, setReceiptLoadingId] = useState<string | null>(null);

  const handleViewDetails = (appointment: CancelledAppointment) => {
    navigation.navigate('CancelledAppointmentDetails', {appointment});
  };

  const handleRebook = (appointment: CancelledAppointment) => {
    console.log('Rebook appointment:', appointment);
    if (appointment.appointmentType === 'Home Visit') {
      navigation.navigate('HomeServiceReBook', {appointment});
    } else {
      navigation.navigate('ReBook', {
        appointment: {
          ...appointment,
        },
      });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#22C55E" />
        <Text style={styles.loadingText}>{UI.loading[lang]}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {appointments?.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{UI.empty.cancelled[lang]}</Text>
        </View>
      ) : (
        appointments?.map((appointment: any) => (
          <TouchableOpacity
            key={appointment._id || appointment.appointmentId || appointment.id}
            style={[styles.appointmentCard, styles.cancelledCard]}
            onPress={() => handleViewDetails(appointment)}
            activeOpacity={0.7}>
            <View style={styles.cardHeader}>
              <View style={styles.doctorInfo}>
                <View style={styles.doctorDetails}>
                  <Text style={styles.doctorName} numberOfLines={1}>
                    {appointment.doctorName}
                  </Text>
                  <Text style={styles.doctorSpecialty} numberOfLines={1}>
                    {appointment.appointmentDepartment}
                  </Text>
                </View>
              </View>
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, styles.cancelledStatusBadge]}>
                  <Text style={[styles.statusText, styles.cancelledStatus]}>
                    ✗ {UI.status.cancelled[lang]}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.appointmentDetails}>
              <View style={styles.detailRow}>
                <View style={styles.iconContainer}>
                  <Text style={styles.detailIcon}>🏥</Text>
                </View>
                <Text style={styles.detailText} numberOfLines={1}>
                  {appointment.appointmentType === 'In-Clinic Visit' &&
                  appointment.clinic
                    ? `${appointment.appointmentType} - ${appointment.clinic}`
                    : appointment.appointmentType}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.iconContainer}>
                  <Text style={styles.detailIcon}>📅</Text>
                </View>
                <Text style={styles.detailText} numberOfLines={1}>
                  {formatDate(appointment.date || appointment.appointmentDate)},{' '}
                  {appointment.time?.replace(/am|pm/g, (match: string) =>
                    match.toUpperCase(),
                  )}
                </Text>
              </View>

              <View style={[styles.detailRow, styles.lastDetailRow]}>
                <View style={styles.iconContainer}>
                  <Text style={styles.detailIcon}>👤</Text>
                </View>
                <Text style={styles.detailText} numberOfLines={1}>
                  {appointment.patientName}
                </Text>
              </View>
            </View>

            <View style={styles.cancellationReason}>
              <Text style={styles.reasonIcon}>⚠</Text>
              <Text style={styles.reasonText} numberOfLines={2}>
                {appointment.cancellationReason}
              </Text>
            </View>

            <View style={styles.cancelledButtonContainer}>
              <TouchableOpacity
                style={styles.rebookButton}
                onPress={() => handleRebook(appointment)}>
                <Text style={styles.rebookButtonText}>
                  🔄 {UI.buttons.rebook[lang]}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.detailsButton}
                onPress={() => handleViewDetails(appointment)}>
                <Text style={styles.detailsButtonText}>
                  📋 {UI.buttons.details[lang]}
                </Text>
              </TouchableOpacity>
            </View>

            {appointment.appointmentType !== 'Home Visit' && (
              <TouchableOpacity
                style={styles.viewReceiptFullButton}
                onPress={() =>
                  handleViewReceiptUtil(
                    appointment,
                    lang,
                    receiptLoadingId,
                    setReceiptLoadingId,
                  )
                }
                disabled={
                  receiptLoadingId ===
                  (appointment.appointmentId ||
                    appointment._id ||
                    appointment.id)
                }>
                {receiptLoadingId ===
                (appointment.appointmentId ||
                  appointment._id ||
                  appointment.id) ? (
                  <ActivityIndicator size="small" color="#00203F" />
                ) : (
                  <Text style={styles.viewReceiptButtonText}>
                    🧾 {UI.buttons.viewReceipt[lang]}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

const MyAppointments: React.FC = () => {
  const [activeCategory, setActiveCategory] =
    useState<AppointmentCategory>('Clinic');
  const [activeTab, setActiveTab] = useState<TabType>('Upcoming');
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [appointments, setAppointments] = useState<AppointmentBase[]>([]);
  const [status, setStatus] = useState('scheduled');
  const [isLoading, setIsLoading] = useState(true);
  const currentuserDetails = useSelector((state: any) => state.currentUser);
  const language = currentuserDetails?.appLanguage;
  const lang: Lang = normalizeLang(language);

  const userId = currentuserDetails?.userId || '';

  useEffect(() => {
    const fetchAppointments = async () => {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        if (activeCategory === 'Clinic') {
          const response: any = await AuthFetch(
            ENDPOINTS.GET_ALL_FAMILY_APPOINTMENTS(userId, status),
            token,
          );
          if (response.status !== 'success') {
            console.error(
              'Failed to fetch clinic appointments:',
              response.message,
            );
            if (response.data?.message) {
              Alert.alert(
                UI.common.info[lang],
                safeString(response.data.message),
              );
            }
            setAppointments([]);
          } else {
            const appointmentsData = response?.data?.data?.reverse() || [];
            console.log('Fetched clinic appointments:', appointmentsData);
            const formattedData = appointmentsData.map((appointment: any) => {
              return {
                _id: appointment?._id,
                amount: appointment?.amount,
                discount: appointment?.discount || 0,
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
                date: appointment?.appointmentDate,
                paymentDetails: appointment?.paymentDetails,
                time: appointment?.appointmentTime
                  ? new Date(
                      `1970-01-01T${appointment?.appointmentTime}`,
                    ).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })
                  : '',
              };
            });
            setAppointments(formattedData);
          }
        } else {
          const response = await GetProviderAppointments(userId, status);
          if (response.error) {
            console.error(
              'Failed to fetch homecare appointments:',
              response.error,
            );
            Alert.alert(UI.common.error[lang], safeString(response.error));
            setAppointments([]);
          } else {
            const homecareData =
              response?.appointments?.appointments ||
              response?.appointments ||
              [];
            const appointmentsData = Array.isArray(homecareData)
              ? homecareData.reverse()
              : [];
            console.log('Fetched homecare appointments:', appointmentsData);
            const formattedData = appointmentsData.map((appointment: any) => {
              return {
                _id: appointment?._id,
                amount: appointment?.amount,
                discount: appointment?.discount || 0,
                appointmentId: appointment?.appointmentId,
                doctorName:
                  appointment?.providerDetails?.providerName || 'Provider',
                appointmentDepartment:
                  appointment?.providerDetails?.specialization || 'Homecare',
                appointmentType: 'Home Visit',
                appointmentDate: appointment?.appointmentDate,
                appointmentTime: appointment?.appointmentTime,
                patientName: appointment?.patientDetails?.patientName,
                doctorId: appointment?.providerId,
                status: appointment?.appointmentStatus,
                clinicId: appointment?.providerAddressId,
                fee: appointment?.amount,
                cancellationReason:
                  appointment?.rejectionReason ||
                  appointment?.cancellationReason,
                date: appointment?.appointmentDate,
                paymentDetails: appointment?.paymentMethod,
                time: appointment?.appointmentTime
                  ? new Date(
                      `1970-01-01T${appointment?.appointmentTime}`,
                    ).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })
                  : '',
                rawAppointment: appointment, // for Rebook/Cancel navigation
              };
            });
            setAppointments(formattedData);
          }
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
        Alert.alert(
          UI.common.error[lang],
          'Failed to fetch appointments. Please try again.',
        );
        setAppointments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [status, userId, lang, activeCategory]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  useEffect(() => {
    if (activeTab === 'Completed') {
      setStatus('completed');
    } else if (activeTab === 'Cancelled') {
      setStatus('cancelled');
    } else {
      setStatus('scheduled');
    }
  }, [activeTab]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Upcoming':
        return (
          <UpcomingTab appointments={appointments} isLoading={isLoading} />
        );
      case 'Completed':
        return (
          <CompletedTab appointments={appointments} isLoading={isLoading} />
        );
      case 'Cancelled':
        return (
          <CancelledTab appointments={appointments} isLoading={isLoading} />
        );
      default:
        return (
          <UpcomingTab appointments={appointments} isLoading={isLoading} />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0FDF4" />

      <View style={styles.categoryTabContainer}>
        {(['Clinic', 'Homecare'] as AppointmentCategory[]).map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryTab,
              activeCategory === category && styles.activeCategoryTab,
            ]}
            onPress={() => setActiveCategory(category)}>
            <Text
              style={[
                styles.categoryTabText,
                activeCategory === category && styles.activeCategoryTabText,
              ]}>
              {UI.categories[category][lang]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tabContainer}>
        {(['Upcoming', 'Completed', 'Cancelled'] as TabType[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}>
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}>
              {UI.tabs[tab][lang]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderTabContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F6F8', // clean light gray background
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: isTablet ? SPACING.lg : SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: '#E2E8F0',
    borderRadius: LAYOUT.borderRadius.full || 24,
    padding: 4,
  },
  categoryTabContainer: {
    flexDirection: 'row',
    marginHorizontal: isTablet ? SPACING.lg : SPACING.md,
    marginTop: SPACING.md,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
  },
  categoryTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeCategoryTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryTabText: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: '#64748B',
  },
  activeCategoryTabText: {
    color: '#0F172A',
    fontWeight: '700',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.full || 20,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#0F172A', // dark blue/black for active pill
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    paddingTop: SPACING.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: moderateScale(14),
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: moderateScale(14),
    color: '#6B7280',
    textAlign: 'center',
  },
  appointmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cancelledCard: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  doctorInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: '#64748B',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: moderateScale(11),
    fontWeight: '700',
  },
  confirmedStatusBadge: {
    backgroundColor: '#ECFDF5',
  },
  confirmedStatus: {
    color: '#059669',
  },
  completedStatusBadge: {
    backgroundColor: '#EFF6FF',
  },
  completedStatus: {
    color: '#2563EB',
  },
  cancelledStatusBadge: {
    backgroundColor: '#FEF2F2',
  },
  cancelledStatus: {
    color: '#DC2626',
  },
  appointmentDetails: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  lastDetailRow: {
    marginBottom: 0,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailIcon: {
    fontSize: moderateScale(14),
  },
  detailText: {
    fontSize: moderateScale(14),
    color: '#334155',
    fontWeight: '600',
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  viewDetailsButton: {
    backgroundColor: '#EFF6FF',
  },
  viewDetailsButtonText: {
    color: '#2563EB',
    fontSize: moderateScale(13),
    fontWeight: '700',
  },
  rescheduleButton: {
    backgroundColor: '#FFFBEB',
  },
  rescheduleButtonText: {
    color: '#D97706',
    fontSize: moderateScale(13),
    fontWeight: '700',
  },
  rescheduleDisabledButton: {
    backgroundColor: '#F8FAFC',
  },
  rescheduleDisabledText: {
    color: '#94A3B8',
    fontSize: moderateScale(13),
    fontWeight: '700',
  },
  rescheduleDisabledSubText: {
    color: '#94A3B8',
    fontSize: moderateScale(10),
    fontWeight: '500',
    marginTop: 2,
  },
  cancelButton: {
    backgroundColor: '#FEF2F2',
  },
  cancelButtonText: {
    color: '#DC2626',
    fontSize: moderateScale(13),
    fontWeight: '700',
  },
  completedButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
  },
  viewReceiptButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewReceiptFullButton: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginTop: 12,
  },
  viewReceiptButtonText: {
    color: '#475569',
    fontSize: moderateScale(13),
    fontWeight: '700',
  },
  bookAgainButton: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  bookAgainButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(13),
    fontWeight: '700',
  },
  cancellationReason: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  reasonIcon: {
    fontSize: moderateScale(14),
    marginRight: 10,
  },
  reasonText: {
    fontSize: moderateScale(13),
    color: '#991B1B',
    fontWeight: '600',
    flex: 1,
  },
  cancelledButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  rebookButton: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 44,
  },
  rebookButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(13),
    fontWeight: '700',
  },
  detailsButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 44,
  },
  detailsButtonText: {
    color: '#475569',
    fontSize: moderateScale(13),
    fontWeight: '700',
  },
});

export default MyAppointments;
