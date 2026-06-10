import React, { useEffect, useRef, useState } from 'react';
import { AuthFetch, AuthPost, ENDPOINTS } from '../../services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  SafeAreaView,
  FlatList,
  Platform,
  KeyboardAvoidingView,
  BackHandler,
} from 'react-native';
import { useSelector } from 'react-redux';
;
import { useNavigation } from '@react-navigation/native';

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

// ---------- Translations ----------
const translations: any = {
  en: {
    rateAndFeedback: "Rate & Feedback",
    enjoyingApp: "Enjoying our App?",
    appRatingSubtitle: "We'd love your feedback. Rate us on the App Store!",
    rateNow: "Rate Now",
    doctorsTab: "Doctors",
    // ambulanceTab: "Ambulance",
    // homeServicesTab: "Home Services",
    ratingRequired: "Rating Required",
    ratingRequiredMessage: "Please provide a rating before submitting.",
    feedbackSubmitted: "Feedback Submitted",
    feedbackSubmittedMessage: "Thank you for rating {doctorName}!",
    howWasExperience: "How was your experience?",
    tapToRate: "Tap stars to rate",
    additionalComments: "Additional Comments (Optional)",
    commentsPlaceholder: "Write about your experience...",
    uploadImages: "Upload Images (Optional)",
    addPhoto: "Add Photo",
    uploadSubtext: "Share your experience visually",
    submitFeedback: "Submit Feedback",
    conversationHistory: "Conversation",
    common: { error: "Error" },
    errorNotLoggedIn: "Not logged in",
    errorFetchDoctor: "Unable to fetch",
  },
  hi: {
    rateAndFeedback: "रेटिंग और फीडबैक",
    enjoyingApp: "हमारा ऐप पसंद आ रहा है?",
    appRatingSubtitle: "हमें आपका फीडबैक चाहिए। ऐप स्टोर पर हमें रेट करें!",
    rateNow: "अभी रेट करें",
    doctorsTab: "डॉक्टर्स",
    // ambulanceTab: "एम्बुलेंस",
    // homeServicesTab: "होम सर्विसेज",
    ratingRequired: "रेटिंग आवश्यक",
    ratingRequiredMessage: "कृपया सबमिट करने से पहले रेटिंग प्रदान करें।",
    feedbackSubmitted: "फीडबैक सबमिट किया गया",
    feedbackSubmittedMessage: "{doctorName} को रेट करने के लिए धन्यवाद!",
    howWasExperience: "आपका अनुभव कैसा रहा?",
    tapToRate: "रेट करने के लिए स्टार्स पर टैप करें",
    additionalComments: "अतिरिक्त टिप्पणियाँ (वैकल्पिक)",
    commentsPlaceholder: "अपने अनुभव के बारे में लिखें...",
    uploadImages: "छवियाँ अपलोड करें (वैकल्पिक)",
    addPhoto: "फोटो जोड़ें",
    uploadSubtext: "अपने अनुभव को दृश्य रूप से साझा करें",
    submitFeedback: "फीडबैक सबमिट करें",
    conversationHistory: "वार्तालाप",
    common: { error: "त्रुटि" },
    errorNotLoggedIn: "लॉग इन नहीं हैं",
    errorFetchDoctor: "डेटा नहीं मिला",
  },
  tel: {
    rateAndFeedback: "రేటింగ్ & ఫీడ్‌బ్యాక్",
    enjoyingApp: "మా యాప్‌ను ఆనందిస్తున్నారా?",
    appRatingSubtitle: "మీ ఫీడ్‌బ్యాక్ మాకు కావాలి. యాప్ స్టోర్‌లో మమ్మల్ని రేట్ చేయండి!",
    rateNow: "ఇప్పుడు రేట్ చేయండి",
    doctorsTab: "డాక్టర్లు",
    // ambulanceTab: "అంబులెన్స్",
    // homeServicesTab: "హోమ్ సర్వీసెస్",
    ratingRequired: "రేటింగ్ అవసరం",
    ratingRequiredMessage: "సమర్పించే ముందు దయచేసి రేటింగ్ ఇవ్వండి.",
    feedbackSubmitted: "ఫీడ్‌బ్యాక్ సమర్పించబడింది",
    feedbackSubmittedMessage: "{doctorName}ని రేట్ చేసినందుకు ధన్యవాదాలు!",
    howWasExperience: "మీ అనుభవం ఎలా ఉంది?",
    tapToRate: "రేట్ చేయడానికి స్టార్స్‌పై నొక్కండి",
    additionalComments: "అదనపు వ్యాఖ్యలు (ఐచ్ఛికం)",
    commentsPlaceholder: "మీ అనుభవం గురించి రాయండి...",
    uploadImages: "చిత్రాలను అప్‌లోడ్ చేయండి (ఐచ్ఛికం)",
    addPhoto: "ఫోటో జోడించండి",
    uploadSubtext: "మీ అనుభవాన్ని దృశ్యమానంగా షేర్ చేయండి",
    submitFeedback: "ఫీడ్‌బ్యాక్ సమర్పించండి",
    conversationHistory: "సంభాషణ",
    common: { error: "లోపం" },
    errorNotLoggedIn: "లాగిన్ కాలేదు",
    errorFetchDoctor: "తీసుకురాలేకపోయాం",
  },
};

const FeedbackRating = () => {
  const navigation: any = useNavigation();
  const user = useSelector((state: any) => state.currentUser);
  const appLanguage = user?.appLanguage || "en";
  const t = translations[appLanguage] || translations.en;

  const [currentScreen, setCurrentScreen] = useState<'list' | 'feedback'>('list');
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const [appointmentDate, setAppointmentData] = useState('');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [appointmentDateTime, setAppointmentDateTime] = useState("");
  const [conversations, setConversations] = useState<any[]>([]);

  // refs for keyboard-aware scrolling
  const listScrollRef = useRef<ScrollView | null>(null);
  const feedbackScrollRef = useRef<ScrollView | null>(null);
  const commentsRef = useRef<TextInput | null>(null);

  // ---- BACK HANDLING (arrow + Android hardware) ----
  const handleBack = () => {
    if (currentScreen === 'feedback') {
      setCurrentScreen('list');
      return true; // handled
    }
    // currentScreen === 'list' -> leave this screen
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home'); // <-- change "Home" if your route is named differently
    }
    return true; // handled
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScreen, navigation]);


  useEffect(() => {
    const reviews = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return;
      }
      const response = await AuthFetch(ENDPOINTS.GET_ALL_FEEDBACKS(user.userId), token);
      console.log("222",response)
      if (response?.status === 'success') {
        setDoctors(response?.data?.feedback || []);
      } else {
        Alert.alert(
          t.common?.error || "Error",
          response?.message?.message || response?.data?.message || t.errorFetchDoctor || "Unable to fetch"
        );
      }
    };
    reviews();
  }, []);

  const formatApptDateTime = (dateInput?: string, timeInput?: string) => {
    if (!dateInput) return "";
    let y: number, m: number, d: number;
    const ddmmyyyy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
    const yyyymmdd = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/;
    const ddMonYyyy = /^(\d{1,2})[\/\-]([A-Za-z]{3})[\/\-](\d{4})$/;

    const monMap: Record<string, number> = {
      jan:1,feb:2,mar:3,apr:4,may:5,jun:6,
      jul:7,aug:8,sep:9,oct:10,nov:11,dec:12
    };

    if (ddmmyyyy.test(dateInput)) {
      const [, dd, mm, yyyy] = dateInput.match(ddmmyyyy)!;
      d = +dd; m = +mm; y = +yyyy;
    } else if (yyyymmdd.test(dateInput)) {
      const [, yyyy, mm, dd] = dateInput.match(yyyymmdd)!;
      y = +yyyy; m = +mm; d = +dd;
    } else if (ddMonYyyy.test(dateInput)) {
      const [, dd, mon, yyyy] = dateInput.match(ddMonYyyy)!;
      d = +dd; y = +yyyy; m = monMap[mon.toLowerCase()] || 1;
    } else {
      const dt = new Date(dateInput);
      if (isNaN(dt.getTime())) return "";
      y = dt.getFullYear(); m = dt.getMonth() + 1; d = dt.getDate();
    }

    let hours = 9, minutes = 0;
    if (timeInput && typeof timeInput === "string") {
      const h24 = /^(\d{1,2}):(\d{2})$/;
      const h12 = /^(\d{1,2}):(\d{2})\s*([APap][Mm])$/;

      if (h12.test(timeInput)) {
        const [, h, min, ap] = timeInput.match(h12)!;
        hours = +h % 12;
        minutes = +min;
        const isPM = ap.toUpperCase() === "PM";
        if (isPM) hours += 12;
      } else if (h24.test(timeInput)) {
        const [, h, min] = timeInput.match(h24)!;
        hours = +h; minutes = +min;
      } else {
        const t = new Date(timeInput);
        if (!isNaN(t.getTime())) {
          hours = t.getHours();
          minutes = t.getMinutes();
        }
      }
    }

    const jsDate = new Date(y, m - 1, d, hours, minutes, 0, 0);
    const dayNum = jsDate.getDate();
    const shortMonthLower = jsDate.toLocaleString("en-GB", { month: "short" }).toLowerCase();
    const year = jsDate.getFullYear();
    let h12num = jsDate.getHours();
    const ampm = h12num >= 12 ? "PM" : "AM";
    h12num = h12num % 12 || 12;
    const mmStr = String(jsDate.getMinutes()).padStart(2, "0");
    return `${dayNum} ${shortMonthLower} ${year} ${h12num}:${mmStr}${ampm}`;
  };

  const appointmentDetails = async (doctor: any) => {
    if (!doctor?.appointmentId) return;
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return;
      }
      const response = await AuthFetch(
        ENDPOINTS.GET_APPOINTMENT(doctor.appointmentId),
        token
      );
      console.log("222",response)
      if (response?.status === 'success') {
        const appt = response?.data?.data || {};
        const dateStr = appt.appointmentDate || appt.date || appt.appointment_date || "";
        const timeStr = appt.appointmentTime || appt.time || appt.appointment_time || "";
        setAppointmentDateTime(formatApptDateTime(dateStr, timeStr));
      } else {
        Alert.alert("Error", response?.message?.message || response?.data?.message || "Unable to fetch appointment");
      }
    } catch (e) {
      console.error("appointmentDetails error:", e);
      Alert.alert("Error", "Unable to fetch appointment");
    }
  };

  const completeConversation = async (doctor: any) => {
    if (!doctor?.appointmentId) return;
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return;
      }
      const response = await AuthFetch(ENDPOINTS.GET_FEEDBACK_BY_ID(doctor?.feedbackId), token);
      console.log("444",response)
      if (response?.status === 'success') {
        const convo = response?.data?.feedback?.conversation || [];
        setConversations(Array.isArray(convo) ? convo : []);
      } else {
        Alert.alert("Error", response?.message?.message || response?.data?.message || "Unable to fetch appointment");
      }
    } catch (e) {
      console.error("appointmentDetails error:", e);
      Alert.alert("Error", "Unable to fetch appointment");
    }
  };

  useEffect(() => {
    appointmentDetails(selectedDoctor);
    completeConversation(selectedDoctor);
  }, [selectedDoctor]);

  const handleDoctorPress = (doctor: any) => {
    setSelectedDoctor(doctor);
    setCurrentScreen('feedback');
    setRating(0);
    setComments('');
    requestAnimationFrame(() => {
      feedbackScrollRef.current?.scrollTo({ y: 0, animated: false });
    });
  };

  const handleStarPress = (starRating: number) => setRating(starRating);

  const handleSubmitFeedback = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert(t.common.error, t.errorNotLoggedIn);
        return;
      }
      const body = { feedbackId: selectedDoctor?.feedbackId, message: comments };
      const response = await AuthPost(ENDPOINTS.SUBMIT_PATIENT_RESPONSE, body, token);
      console.log("111",response)
      if (response?.status === 'success') {
        setComments('');
        setRating(0);
        Alert.alert("Feedback Submited Successfully", "Thank you for providing your feedback");
        setCurrentScreen('list');
      } else {
        Alert.alert(t.common.error, response?.message?.message || response?.data?.message || t.errorFetchDoctor);
      }
    } catch (error) {
      console.log(error, "feedback error");
      Alert.alert("error");
    }
  };

  const renderStars = (currentRating: number, isInteractive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={isInteractive ? () => handleStarPress(i) : undefined}
          disabled={!isInteractive}
        >
          <Text
            style={[
              styles.star,
              (isInteractive ? rating : currentRating) >= i ? styles.filledStar : styles.emptyStar
            ]}
          >
            ★
          </Text>
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const renderAppRatingCard = () => (
    <View style={styles.appRatingCard}>
      <Text style={styles.appRatingTitle}>{t.enjoyingApp}</Text>
      <Text style={styles.appRatingSubtitle}>{t.appRatingSubtitle}</Text>
      <View style={styles.appStarsContainer}>{renderStars(5)}</View>
      <TouchableOpacity style={styles.rateNowButton}>
        <Text style={styles.rateNowButtonText}>{t.rateNow}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity style={styles.tabItem}>
        <Text style={[styles.tabText, styles.activeTab]}>{t.doctorsTab}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDoctorCard = (doctor: any) => (
    <TouchableOpacity
      key={doctor.id || doctor.feedbackId}
      style={styles.doctorCard}
      onPress={() => handleDoctorPress(doctor)}
    >
      <View style={styles.placeholderCircle}>
        <Text style={styles.placeholderText}>{doctor.doctorName?.[0] || "D"}</Text>
      </View>
      <View style={styles.doctorInfo}>
        <Text style={styles.doctorName}>{doctor.doctorName}</Text>
        <Text style={styles.doctorSpecialty}>{doctor.specialization}</Text>
        <View style={styles.ratingContainer}>
          <View style={styles.starsContainer}>{renderStars(doctor.rating)}</View>
          <Text style={styles.ratingText}>{doctor.rating}</Text>
        </View>
        <Text style={styles.doctorDescription}>{doctor.comment}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  const renderDoctorsList = () => (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.select({ ios: 80, android: 0 })}
      >
        <ScrollView
          ref={listScrollRef}
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: SPACING.lg }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderAppRatingCard()}
          {renderTabBar()}
          <View style={styles.doctorsContainer}>
            {doctors.length > 0 ? doctors.map(renderDoctorCard) : <Text>No Feedback Till Now</Text>}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  const renderFeedbackScreen = () => (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.select({ ios: 80, android: 0 })}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.rateAndFeedback}</Text>
        </View>

        <ScrollView
          ref={feedbackScrollRef}
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: SPACING.lg, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.feedbackContainer}>
            <View style={styles.doctorHeader}>
              <View style={styles.placeholderCircle}>
                <Text style={styles.placeholderText}>{selectedDoctor?.doctorName?.[0] || "D"}</Text>
              </View>
              <View style={styles.doctorHeaderInfo}>
                <Text style={styles.feedbackDoctorName}>{selectedDoctor?.doctorName}</Text>
                <Text style={styles.feedbackDoctorSpecialty}>{selectedDoctor?.specialization}</Text>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.appointmentDate}>📅 {appointmentDateTime}</Text>
                </View>
              </View>
            </View>

            {Array.isArray(conversations) && conversations.length > 0 && (
              <View style={styles.conversationsSection}>
                <Text style={styles.sectionTitle}>{t?.conversationHistory || "Conversation"}</Text>
                <FlatList
                  data={conversations}
                  keyExtractor={(item, index) => item?._id?.toString?.() ?? `${item?.sender ?? "s"}-${index}`}
                  scrollEnabled={false}
                  contentContainerStyle={styles.conversationsList}
                  renderItem={({ item }) => (
                    <View style={styles.conversationCard}>
                      <View style={styles.convoHeader}>
                        <Text style={styles.convoSender}>{item?.sender ?? "Unknown"}</Text>
                      </View>
                      <Text style={styles.convoMessage}>{item?.message ?? ""}</Text>
                    </View>
                  )}
                />
              </View>
            )}

            <View style={styles.ratingSection}>
              <Text style={styles.ratingQuestion}>{t.howWasExperience}</Text>
              <View style={styles.interactiveStarsContainer}>
                {renderStars(rating, true)}
                <Text style={styles.emoji}>😊</Text>
              </View>
              <Text style={styles.tapToRate}>{t.tapToRate}</Text>
            </View>

            <View style={styles.commentsSection}>
              <Text style={styles.commentsLabel}>{t.additionalComments}</Text>
              <TextInput
                ref={commentsRef}
                style={styles.commentsInput}
                placeholder={t.commentsPlaceholder}
                placeholderTextColor="#999"
                value={comments}
                onChangeText={setComments}
                multiline
                textAlignVertical="top"
                returnKeyType="done"
                blurOnSubmit={Platform.OS === 'android' ? true : false}
                onFocus={() => {
                  requestAnimationFrame(() => {
                    feedbackScrollRef.current?.scrollToEnd({ animated: true });
                  });
                }}
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitFeedback}>
              <Text style={styles.submitButtonText}>{t.submitFeedback}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  return currentScreen === 'list' ? renderDoctorsList() : renderFeedbackScreen();
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  header: {
    flexDirection: 'row', 
    alignItems: 'center',
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md, 
    paddingVertical: SPACING.md,
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#e0e0e0',
    paddingTop: SAFE_AREA.safeTop,
  },
  placeholderCircle: {
    width: moderateScale(50),
    height: moderateScale(50), 
    borderRadius: moderateScale(25), 
    backgroundColor: '#1e3a5f',
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: SPACING.md,
  },
  placeholderText: { 
    fontSize: moderateScale(18), 
    fontWeight: 'bold', 
    color: '#fff' 
  },
  backButton: { 
    padding: SPACING.xs, 
    marginRight: SPACING.sm 
  },
  backArrow: { 
    fontSize: moderateScale(20), 
    color: '#333' 
  },
  headerTitle: { 
    fontSize: responsiveText(FONT_SIZE.lg), 
    fontWeight: '600', 
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginRight: moderateScale(40),
  },
  scrollView: { 
    flex: 1 
  },
  appRatingCard: {
    backgroundColor: '#1e3a5f', 
    margin: isTablet ? SPACING.lg : SPACING.md, 
    padding: isTablet ? SPACING.xl : SPACING.lg, 
    borderRadius: LAYOUT.borderRadius.lg, 
    alignItems: 'center',
  },
  appRatingTitle: { 
    fontSize: responsiveText(FONT_SIZE.lg), 
    fontWeight: 'bold', 
    color: '#fff', 
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  appRatingSubtitle: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    color: '#ccc', 
    textAlign: 'center', 
    marginBottom: SPACING.md,
    lineHeight: moderateScale(18),
  },
  appStarsContainer: { 
    flexDirection: 'row', 
    marginBottom: SPACING.md 
  },
  rateNowButton: { 
    backgroundColor: '#fff', 
    paddingHorizontal: SPACING.lg, 
    paddingVertical: SPACING.sm, 
    borderRadius: LAYOUT.borderRadius.md,
    minWidth: responsiveWidth(30),
  },
  rateNowButtonText: { 
    color: '#1e3a5f', 
    fontWeight: '600', 
    fontSize: responsiveText(FONT_SIZE.sm),
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    marginHorizontal: isTablet ? SPACING.lg : SPACING.md, 
    marginBottom: SPACING.md, 
    borderRadius: LAYOUT.borderRadius.lg, 
    padding: SPACING.xs,
  },
  tabItem: { 
    flex: 1, 
    paddingVertical: SPACING.sm, 
    alignItems: 'center' 
  },
  tabText: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    color: '#666' 
  },
  activeTab: { 
    color: '#007AFF', 
    fontWeight: '600' 
  },
  doctorsContainer: { 
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md 
  },
  doctorCard: {
    backgroundColor: '#fff', 
    padding: isTablet ? SPACING.lg : SPACING.md, 
    borderRadius: LAYOUT.borderRadius.lg, 
    marginBottom: SPACING.sm,
    flexDirection: 'row', 
    alignItems: 'center',
    ...LAYOUT.shadow.sm,
  },
  doctorInfo: { 
    flex: 1 
  },
  doctorName: { 
    fontSize: responsiveText(FONT_SIZE.md), 
    fontWeight: '600', 
    color: '#333', 
    marginBottom: SPACING.xxs 
  },
  doctorSpecialty: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    color: '#666', 
    marginBottom: SPACING.xxs 
  },
  ratingContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: SPACING.xs 
  },
  starsContainer: { 
    flexDirection: 'row', 
    marginRight: SPACING.sm 
  },
  star: { 
    fontSize: moderateScale(14), 
    marginRight: SPACING.xxs 
  },
  filledStar: { 
    color: '#ffd700' 
  },
  emptyStar: { 
    color: '#ddd' 
  },
  ratingText: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    color: '#666', 
    fontWeight: '600' 
  },
  doctorDescription: { 
    fontSize: responsiveText(FONT_SIZE.xs), 
    color: '#666', 
    lineHeight: moderateScale(16) 
  },
  chevron: { 
    fontSize: moderateScale(18), 
    color: '#ccc', 
    marginLeft: SPACING.sm 
  },

  // Feedback Screen Styles
  feedbackContainer: { 
    padding: isTablet ? SPACING.lg : SPACING.md 
  },
  doctorHeader: {
    backgroundColor: '#fff', 
    padding: isTablet ? SPACING.lg : SPACING.md, 
    borderRadius: LAYOUT.borderRadius.lg, 
    marginBottom: SPACING.lg,
    flexDirection: 'row', 
    alignItems: 'center',
  },
  doctorHeaderInfo: { 
    flex: 1 
  },
  feedbackDoctorName: { 
    fontSize: responsiveText(FONT_SIZE.lg), 
    fontWeight: '600', 
    color: '#333', 
    marginBottom: SPACING.xs 
  },
  feedbackDoctorSpecialty: { 
    fontSize: responsiveText(FONT_SIZE.md), 
    color: '#007AFF', 
    marginBottom: SPACING.sm 
  },
  appointmentInfo: { 
    gap: SPACING.xs 
  },
  appointmentDate: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    color: '#666' 
  },
  ratingSection: {
    backgroundColor: '#fff', 
    padding: isTablet ? SPACING.lg : SPACING.md, 
    borderRadius: LAYOUT.borderRadius.lg, 
    marginBottom: SPACING.lg, 
    alignItems: 'center',
  },
  ratingQuestion: { 
    fontSize: responsiveText(FONT_SIZE.lg), 
    fontWeight: '600', 
    color: '#333', 
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  interactiveStarsContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: SPACING.sm 
  },
  emoji: { 
    fontSize: moderateScale(20), 
    marginLeft: SPACING.sm 
  },
  tapToRate: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    color: '#999' 
  },
  commentsSection: { 
    backgroundColor: '#fff', 
    padding: isTablet ? SPACING.lg : SPACING.md, 
    borderRadius: LAYOUT.borderRadius.lg, 
    marginBottom: SPACING.lg 
  },
  commentsLabel: { 
    fontSize: responsiveText(FONT_SIZE.md), 
    fontWeight: '600', 
    color: '#333', 
    marginBottom: SPACING.sm 
  },
  commentsInput: {
    borderWidth: 1, 
    borderColor: '#e0e0e0', 
    borderRadius: LAYOUT.borderRadius.md, 
    padding: SPACING.md, 
    height: responsiveHeight(15),
    fontSize: responsiveText(FONT_SIZE.sm), 
    color: '#333',
    textAlignVertical: 'top',
  },
  submitButton: { 
    backgroundColor: '#513c78ff', 
    paddingVertical: SPACING.md, 
    borderRadius: LAYOUT.borderRadius.lg, 
    alignItems: 'center',
    marginHorizontal: isTablet ? SPACING.lg : SPACING.md,
  },
  submitButtonText: { 
    fontSize: responsiveText(FONT_SIZE.md), 
    fontWeight: '600', 
    color: '#ede7e7ff' 
  },

  // Conversations
  conversationsSection: { 
    marginBottom: SPACING.lg 
  },
  sectionTitle: { 
    fontSize: responsiveText(FONT_SIZE.md), 
    fontWeight: "600", 
    marginBottom: SPACING.sm, 
    color: "#111" 
  },
  conversationsList: { 
    gap: SPACING.sm 
  },
  conversationCard: {
    backgroundColor: "#fff", 
    borderRadius: LAYOUT.borderRadius.md, 
    padding: SPACING.md,
    borderWidth: 1, 
    borderColor: "rgba(0,0,0,0.06)",
    ...LAYOUT.shadow.sm,
  },
  convoHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: SPACING.xs 
  },
  convoSender: { 
    fontWeight: "700", 
    color: "#222",
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  convoTime: { 
    fontSize: responsiveText(FONT_SIZE.xs), 
    color: "#777" 
  },
  convoMessage: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    color: "#333", 
    lineHeight: moderateScale(18) 
  },
});

export default FeedbackRating;