import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';

// ---------- Translations ----------
const translations: any = {
  en: {
    settings: "Settings",
    notifications: "Notifications",
    notificationSettings: "Notification Settings",
    notificationSettingsSubtitle: "Manage push alerts, reminders, and app notifications",
    notificationInfo: "We use full-screen alerts for audio/video call notifications.",
    reminderSettings: "Reminder Settings",
    reminderVolume: "Reminder Volume",
    vibrate: "Vibrate",
    snoozeDuration: "Snooze Duration",
    popupNotification: "Popup Notification",
    general: "General",
    aboutApp: "About the App",
    aboutAppMessage: "HealthCare App v1.0.0\nDeveloped for better healthcare management",
    privacyPolicy: "Privacy Policy",
    privacyPolicyMessage: "Opening privacy policy...",
    helpSupport: "Help & Support",
    helpSupportMessage: "Opening help center...",
    shareApp: "Share with Friends & Family",
    shareAppMessage: "Share this app with your friends and family!",
    rateApp: "Rate the App",
    rateAppMessage: "Thank you for using our app! Please rate us on the app store.",
    account: "Account",
    logout: "Logout",
    logoutConfirm: "Are you sure you want to logout?",
    logoutSuccess: "User logged out",
    deleteAccount: "Delete Account",
    deleteAccountConfirm: "This action cannot be undone. All your data will be permanently deleted.",
    deleteAccountSuccess: "Your account has been deleted successfully.",
    cancel: "Cancel",
    snoozeDurations: ["5 min", "10 min", "15 min", "30 min", "1 hour"],
    popupOptions: ["Always", "Only when unlocked", "Never"],
  },
  hi: {
    settings: "सेटिंग्स",
    notifications: "सूचनाएँ",
    notificationSettings: "सूचना सेटिंग्स",
    notificationSettingsSubtitle: "पुश अलर्ट, रिमाइंडर और ऐप सूचनाओं को प्रबंधित करें",
    notificationInfo: "हम ऑडियो/वीडियो कॉल सूचनाओं के लिए पूर्ण-स्क्रीन अलर्ट का उपयोग करते हैं।",
    reminderSettings: "रिमाइंडर सेटिंग्स",
    reminderVolume: "रिमाइंडर वॉल्यूम",
    vibrate: "कंपन",
    snoozeDuration: "स्नूज़ अवधि",
    popupNotification: "पॉपअप सूचना",
    general: "सामान्य",
    aboutApp: "ऐप के बारे में",
    aboutAppMessage: "हेल्थकेयर ऐप v1.0.0\nबेहतर स्वास्थ्य प्रबंधन के लिए विकसित",
    privacyPolicy: "गोपनीयता नीति",
    privacyPolicyMessage: "गोपनीयता नीति खोल रहे हैं...",
    helpSupport: "सहायता और समर्थन",
    helpSupportMessage: "सहायता केंद्र खोल रहे हैं...",
    shareApp: "मित्रों और परिवार के साथ साझा करें",
    shareAppMessage: "इस ऐप को अपने मित्रों और परिवार के साथ साझा करें!",
    rateApp: "ऐप को रेट करें",
    rateAppMessage: "हमारे ऐप का उपयोग करने के लिए धन्यवाद! कृपया ऐप स्टोर पर हमें रेट करें।",
    account: "खाता",
    logout: "लॉगआउट",
    logoutConfirm: "क्या आप वाकई लॉगआउट करना चाहते हैं?",
    logoutSuccess: "उपयोगकर्ता लॉगआउट हो गया",
    deleteAccount: "खाता हटाएँ",
    deleteAccountConfirm: "यह क्रिया पूर्ववत नहीं की जा सकती। आपका सारा डेटा स्थायी रूप से हटा दिया जाएगा।",
    deleteAccountSuccess: "आपका खाता सफलतापूर्वक हटा दिया गया है।",
    cancel: "रद्द करें",
    snoozeDurations: ["5 मिनट", "10 मिनट", "15 मिनट", "30 मिनट", "1 घंटा"],
    popupOptions: ["हमेशा", "केवल अनलॉक होने पर", "कभी नहीं"],
  },
  tel: {
    settings: "సెట్టింగులు",
    notifications: "నోటిఫికేషన్లు",
    notificationSettings: "నోటిఫికేషన్ సెట్టింగులు",
    notificationSettingsSubtitle: "పుష్ అలర్ట్‌లు, రిమైండర్‌లు మరియు యాప్ నోటిఫికేషన్‌లను నిర్వహించండి",
    notificationInfo: "మేము ఆడియో/వీడియో కాల్ నోటిఫికేషన్‌ల కోసం పూర్తి-స్క్రీన్ అలర్ట్‌లను ఉపయోగిస్తాము.",
    reminderSettings: "రిమైండర్ సెట్టింగులు",
    reminderVolume: "రిమైండర్ వాల్యూమ్",
    vibrate: "వైబ్రేట్",
    snoozeDuration: "స్నూజ్ డ్యూరేషన్",
    popupNotification: "పాప్‌అప్ నోటిఫికేషన్",
    general: "సాధారణ",
    aboutApp: "యాప్ గురించి",
    aboutAppMessage: "హెల్త్‌కేర్ యాప్ v1.0.0\nమెరుగైన ఆరోగ్య నిర్వహణ కోసం అభివృద్ధి చేయబడింది",
    privacyPolicy: "గోప్యతా విధానం",
    privacyPolicyMessage: "గోప్యతా విధానాన్ని తెరుస్తోంది...",
    helpSupport: "సహాయం & సపోర్ట్",
    helpSupportMessage: "సహాయ కేంద్రాన్ని తెరుస్తోంది...",
    shareApp: "స్నేహితులు & కుటుంబంతో షేర్ చేయండి",
    shareAppMessage: "ఈ యాప్‌ను మీ స్నేహితులు మరియు కుటుంబంతో షేర్ చేయండి!",
    rateApp: "యాప్‌ను రేట్ చేయండి",
    rateAppMessage: "మా యాప్‌ను ఉపయోగించినందుకు ధన్యవాదాలు! దయచేసి యాప్ స్టోర్‌లో మమ్మల్ని రేట్ చేయండి。",
    account: "ఖాతా",
    logout: "లాగ్‌అవుట్",
    logoutConfirm: "మీరు నిజంగా లాగ్‌అవుట్ చేయాలనుకుంటున్నారా?",
    logoutSuccess: "యూజర్ లాగ్‌అవుట్ అయ్యారు",
    deleteAccount: "ఖాతాను తొలగించండి",
    deleteAccountConfirm: "ఈ చర్యను రద్దు చేయలేము. మీ డేటా అంతా శాశ్వతంగా తొలగించబడుతుంది。",
    deleteAccountSuccess: "మీ ఖాతా విజయవంతంగా తొలగించబడింది。",
    cancel: "రద్దు చేయండి",
    snoozeDurations: ["5 నిమిషాలు", "10 నిమిషాలు", "15 నిమిషాలు", "30 నిమిషాలు", "1 గంట"],
    popupOptions: ["ఎల్లప్పుడూ", "అన్‌లాక్ చేసినప్పుడు మాత్రమే", "ఎప్పటికీ కాదు"],
  },
};

const Settings = () => {
  const user = useSelector((state: any) => state.currentUser);
  const appLanguage = user?.appLanguage || "en";
  const t = translations[appLanguage] || translations.en;

  const [reminderVolume, setReminderVolume] = useState(true);
  const [vibrate, setVibrate] = useState(false);
  const [snoozeDuration, setSnoozeDuration] = useState(t.snoozeDurations[1]); // Default to "10 min" or equivalent
  const [popupNotification, setPopupNotification] = useState(t.popupOptions[0]); // Default to "Always" or equivalent
  const [showSnoozeModal, setShowSnoozeModal] = useState(false);
  const [showPopupModal, setShowPopupModal] = useState(false);

  const handleNotificationSettings = () => {
    Alert.alert(t.notificationSettings, t.notificationSettingsSubtitle);
  };

  const handleAboutApp = () => {
    Alert.alert(t.aboutApp, t.aboutAppMessage);
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(t.privacyPolicy, t.privacyPolicyMessage);
  };

  const handleHelpSupport = () => {
    Alert.alert(t.helpSupport, t.helpSupportMessage);
  };

  const handleShareApp = () => {
    Alert.alert(t.shareApp, t.shareAppMessage);
  };

  const handleRateApp = () => {
    Alert.alert(t.rateApp, t.rateAppMessage);
  };

  const handleClearLogout = async () => {
    console.log(t.logoutSuccess);
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userId');
    // Optionally navigate to login screen here
    // Example: navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const handleLogout = () => {
    Alert.alert(
      t.logout,
      t.logoutConfirm,
      [
        { text: t.cancel, style: 'cancel' },
        { text: t.logout, style: 'destructive', onPress: () => handleClearLogout() },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t.deleteAccount,
      t.deleteAccountConfirm,
      [
        { text: t.cancel, style: 'cancel' },
        { 
          text: t.deleteAccount, 
          style: 'destructive', 
          onPress: () => {
            Alert.alert(t.deleteAccount, t.deleteAccountSuccess);
          },
        },
      ]
    );
  };

  const renderSectionHeader = (title: string) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const renderSettingItem = (icon: string, title: string, subtitle: string | null, rightComponent: any, onPress: () => void, iconBg: string) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={[styles.settingIcon, { backgroundColor: iconBg }]}>
        <Text style={styles.settingIconText}>{icon}</Text>
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSwitchItem = (icon: string, title: string, value: boolean, onValueChange: (value: boolean) => void, iconBg: string) => (
    <View style={styles.settingItem}>
      <View style={[styles.settingIcon, { backgroundColor: iconBg }]}>
        <Text style={styles.settingIconText}>{icon}</Text>
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      <View style={styles.settingRight}>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#e0e0e0', true: '#4285F4' }}
          thumbColor={value ? '#fff' : '#fff'}
        />
      </View>
    </View>
  );

  const renderModal = (visible: boolean, onClose: () => void, title: string, options: string[], selectedValue: string, onSelect: (value: string) => void) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.modalOption,
                selectedValue === option && styles.selectedOption,
              ]}
              onPress={() => {
                onSelect(option);
                onClose();
              }}
            >
              <Text style={[
                styles.modalOptionText,
                selectedValue === option && styles.selectedOptionText,
              ]}>
                {option}
              </Text>
              {selectedValue === option && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.modalCancelButton} onPress={onClose}>
            <Text style={styles.modalCancelText}>{t.cancel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Notifications Section */}
        {renderSectionHeader(t.notifications)}
        
        <View style={styles.section}>
          {renderSettingItem(
            '🔔',
            t.notificationSettings,
            t.notificationSettingsSubtitle,
            null,
            handleNotificationSettings,
            '#4285F4'
          )}
          
          <View style={styles.infoBox}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoIconText}>ℹ️</Text>
            </View>
            <Text style={styles.infoText}>
              {t.notificationInfo}
            </Text>
          </View>
        </View>

        {/* Reminder Settings Section */}
        {renderSectionHeader(t.reminderSettings)}
        
        <View style={styles.section}>
          {renderSwitchItem(
            '🔊',
            t.reminderVolume,
            reminderVolume,
            setReminderVolume,
            '#4CAF50'
          )}
          
          {renderSwitchItem(
            '📳',
            t.vibrate,
            vibrate,
            setVibrate,
            '#9C27B0'
          )}
          
          {renderSettingItem(
            '⏰',
            t.snoozeDuration,
            null,
            <Text style={styles.settingValue}>{snoozeDuration}</Text>,
            () => setShowSnoozeModal(true),
            '#FF9800'
          )}
          
          {renderSettingItem(
            '🔴',
            t.popupNotification,
            null,
            <Text style={styles.settingValue}>{popupNotification}</Text>,
            () => setShowPopupModal(true),
            '#F44336'
          )}
        </View>

        {/* General Section */}
        {renderSectionHeader(t.general)}
        
        <View style={styles.section}>
          {renderSettingItem(
            'ℹ️',
            t.aboutApp,
            null,
            null,
            handleAboutApp,
            '#2196F3'
          )}
          
          {renderSettingItem(
            '🔒',
            t.privacyPolicy,
            null,
            null,
            handlePrivacyPolicy,
            '#4CAF50'
          )}
          
          {renderSettingItem(
            '❓',
            t.helpSupport,
            null,
            null,
            handleHelpSupport,
            '#9C27B0'
          )}
          
          {renderSettingItem(
            '👥',
            t.shareApp,
            null,
            null,
            handleShareApp,
            '#FFB300'
          )}
          
          {renderSettingItem(
            '⭐',
            t.rateApp,
            null,
            null,
            handleRateApp,
            '#FF9800'
          )}
        </View>

        {/* Account Section */}
        {renderSectionHeader(t.account)}
        
        <View style={styles.section}>
          {renderSettingItem(
            '↗️',
            t.logout,
            null,
            null,
            handleLogout,
            '#2196F3'
          )}
          
          {renderSettingItem(
            '🗑️',
            t.deleteAccount,
            null,
            null,
            handleDeleteAccount,
            '#F44336'
          )}
        </View>
      </ScrollView>

      {/* Snooze Duration Modal */}
      {renderModal(
        showSnoozeModal,
        () => setShowSnoozeModal(false),
        t.snoozeDuration,
        t.snoozeDurations,
        snoozeDuration,
        setSnoozeDuration
      )}

      {/* Popup Notification Modal */}
      {renderModal(
        showPopupModal,
        () => setShowPopupModal(false),
        t.popupNotification,
        t.popupOptions,
        popupNotification,
        setPopupNotification
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backArrow: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 16,
    textTransform: 'uppercase',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingIconText: {
    fontSize: 18,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  chevron: {
    fontSize: 20,
    color: '#ccc',
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  infoIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  infoIconText: {
    fontSize: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedOption: {
    backgroundColor: '#f0f8ff',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    color: '#4285F4',
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 18,
    color: '#4285F4',
    fontWeight: 'bold',
  },
  modalCancelButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 10,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default Settings;