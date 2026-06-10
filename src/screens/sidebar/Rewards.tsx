import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/navigationTypes';
import { useSelector } from 'react-redux';
import {
  responsiveWidth,
  responsiveHeight,
  responsiveText,
  SPACING,
  FONT_SIZE,
  ICON_SIZE,
  LAYOUT,
  isTablet,
  isSmallDevice,
  scale,
  moderateScale,
  SAFE_AREA,
  PLATFORM,
} from '../../utils/responsive';

type NotificationType = {
  id: string;
  icon: string;
  iconBg: string;
  title: string;
  description: string;
  time: string;
  actionButton?: string;
  secondaryButton?: string;
};

type TabType = 'All' | 'Appointments' | 'Payments' | 'Others';

// ---------- Translations ----------
const translations: any = {
  en: {
    notifications: "Notifications",
    tabs: {
      all: "All",
      appointments: "Appointments",
      payments: "Payments",
      others: "Others",
    },
    notificationsData: [
      {
        id: '1',
        icon: '📅',
        iconBg: '#3B82F6',
        title: 'Appointment Reminder',
        description: 'Your consultation with Dr. Priya is scheduled for 4:00 PM today.',
        time: '2 hours ago',
        actionButton: 'Confirm',
        secondaryButton: 'Reschedule'
      },
      {
        id: '2',
        icon: '✅',
        iconBg: '#22C55E',
        title: 'Payment Successful',
        description: 'Your payment of ₹500 for Dr. Sharma consultation has been processed successfully.',
        time: '5 hours ago'
      },
      {
        id: '3',
        icon: '⚠',
        iconBg: '#F59E0B',
        title: 'KYC Pending',
        description: 'Complete your KYC verification to unlock all wallet features and higher transaction limits.',
        time: '1 day ago',
        actionButton: 'Complete KYC'
      },
      {
        id: '4',
        icon: '👤',
        iconBg: '#8B5CF6',
        title: 'New Specialist Added',
        description: 'Dr. Rajesh Kumar, Cardiologist is now available for consultations in your area.',
        time: '3 days ago',
        actionButton: 'View Profile'
      },
      {
        id: '5',
        icon: '💳',
        iconBg: '#2563EB',
        title: 'Wallet Update',
        description: '₹200 has been added to your VYDHYO wallet. Current balance: ₹1,250',
        time: '3 days ago'
      },
      {
        id: '6',
        icon: '📄',
        iconBg: '#14B8A6',
        title: 'Lab Report Ready',
        description: 'Your blood test report is now available. Download it from your reports section.',
        time: '4 days ago'
      }
    ],
  },
  hi: {
    notifications: "सूचनाएं",
    tabs: {
      all: "सभी",
      appointments: "अपॉइंटमेंट्स",
      payments: "भुगतान",
      others: "अन्य",
    },
    notificationsData: [
      {
        id: '1',
        icon: '📅',
        iconBg: '#3B82F6',
        title: 'अपॉइंटमेंट रिमाइंडर',
        description: 'डॉ. प्रिया के साथ आपका परामर्श आज दोपहर 4:00 बजे निर्धारित है।',
        time: '2 घंटे पहले',
        actionButton: 'पुष्टि करें',
        secondaryButton: 'पुनर्निर्धारित करें'
      },
      {
        id: '2',
        icon: '✅',
        iconBg: '#22C55E',
        title: 'भुगतान सफल',
        description: 'डॉ. शर्मा के परामर्श के लिए ₹500 का आपका भुगतान सफलतापूर्वक संसाधित हो गया है।',
        time: '5 घंटे पहले'
      },
      {
        id: '3',
        icon: '⚠',
        iconBg: '#F59E0B',
        title: 'KYC लंबित',
        description: 'सभी वॉलेट सुविधाओं और उच्च लेनदेन सीमाओं को अनलॉक करने के लिए अपनी KYC सत्यापन पूरा करें।',
        time: '1 दिन पहले',
        actionButton: 'KYC पूरा करें'
      },
      {
        id: '4',
        icon: '👤',
        iconBg: '#8B5CF6',
        title: 'नया विशेषज्ञ जोड़ा गया',
        description: 'डॉ. राजेश कुमार, हृदय रोग विशेषज्ञ, अब आपके क्षेत्र में परामर्श के लिए उपलब्ध हैं।',
        time: '3 दिन पहले',
        actionButton: 'प्रोफाइल देखें'
      },
      {
        id: '5',
        icon: '💳',
        iconBg: '#2563EB',
        title: 'वॉलेट अपडेट',
        description: 'आपके VYDHYO वॉलेट में ₹200 जोड़े गए हैं। वर्तमान शेष: ₹1,250',
        time: '3 दिन पहले'
      },
      {
        id: '6',
        icon: '📄',
        iconBg: '#14B8A6',
        title: 'लैब रिपोर्ट तैयार',
        description: 'आपकी रक्त परीक्षण रिपोर्ट अब उपलब्ध है। इसे अपने रिपोर्ट्स सेक्शन से डाउनलोड करें।',
        time: '4 दिन पहले'
      }
    ],
  },
  tel: {
    notifications: "నోటిఫికేషన్లు",
    tabs: {
      all: "అన్నీ",
      appointments: "అపాయింట్‌మెంట్లు",
      payments: "చెల్లింపులు",
      others: "ఇతరాలు",
    },
    notificationsData: [
      {
        id: '1',
        icon: '📅',
        iconBg: '#3B82F6',
        title: 'అపాయింట్‌మెంట్ రిమైండర్',
        description: 'డాక్టర్ ప్రియాతో మీ సంప్రదింపు ఈ రోజు సాయంత్రం 4:00 గంటలకు షెడ్యూల్ చేయబడింది.',
        time: '2 గంటల క్రితం',
        actionButton: 'నిర్ధారించండి',
        secondaryButton: 'రీషెడ్యూల్ చేయండి'
      },
      {
        id: '2',
        icon: '✅',
        iconBg: '#22C55E',
        title: 'చెల్లింపు విజయవంతం',
        description: 'డాక్టర్ శర్మ సంప్రదింపు కోసం మీ ₹500 చెల్లింపు విజయవంతంగా ప్రాసెస్ చేయబడింది.',
        time: '5 గంటల క్రితం'
      },
      {
        id: '3',
        icon: '⚠',
        iconBg: '#F59E0B',
        title: 'KYC పెండింగ్‌లో ఉంది',
        description: 'అన్ని వాలెట్ ఫీచర్లను అన్‌లాక్ చేయడానికి మరియు ఎక్కువ లావాదేవీ పరిమితుల కోసం మీ KYC సత్యాపనను పూర్తి చేయండి.',
        time: '1 రోజు క్రితం',
        actionButton: 'KYC పూర్తి చేయండి'
      },
      {
        id: '4',
        icon: '👤',
        iconBg: '#8B5CF6',
        title: 'కొత్త స్పెషలిస్ట్ జోడించబడ్డారు',
        description: 'డాక్టర్ రాజేష్ కుమార్, కార్డియాలజిస్ట్, ఇప్పుడు మీ ప్రాంతంలో సంప్రదింపుల కోసం అందుబాటులో ఉన్నారు.',
        time: '3 రోజుల క్రితం',
        actionButton: 'ప్రొఫైల్ చూడండి'
      },
      {
        id: '5',
        icon: '💳',
        iconBg: '#2563EB',
        title: 'వాలెట్ అప్‌డేట్',
        description: 'మీ VYDHYO వాలెట్‌కు ₹200 జోడించబడింది. ప్రస్తుత బ్యాలెన్స్: ₹1,250',
        time: '3 రోజుల క్రితం'
      },
      {
        id: '6',
        icon: '📄',
        iconBg: '#14B8A6',
        title: 'లాబ్ రిపోర్ట్ సిద్ధంగా ఉంది',
        description: 'మీ రక్త పరీక్ష రిపోర్ట్ ఇప్పుడు అందుబాటులో ఉంది. మీ రిపోర్ట్స్ విభాగం నుండి దాన్ని డౌన్‌లోడ్ చేయండి.',
        time: '4 రోజుల క్రితం'
      }
    ],
  },
};

const AllTab: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const user = useSelector((state: any) => state.currentUser);
  const appLanguage = user?.appLanguage || "en";
  const t = translations[appLanguage] || translations.en;
  const notifications = t.notificationsData;

  const handleAction = (notification: NotificationType, button: string | undefined) => {
    if (!button) return;
    console.log(`Performing action: ${button} for notification: ${notification.title}`);
    // Add navigation logic based on button type
  };

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {notifications.map((notification: NotificationType) => (
        <TouchableOpacity
          key={notification.id}
          style={styles.notificationCard}
          onPress={() => handleAction(notification, notification.actionButton)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: notification.iconBg }]}>
              <Text style={styles.icon}>{notification.icon}</Text>
            </View>
            <View style={styles.notificationDetails}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationDescription}>{notification.description}</Text>
              <Text style={styles.notificationTime}>{notification.time}</Text>
            </View>
          </View>

          {(notification.actionButton || notification.secondaryButton) && (
            <View style={styles.buttonContainer}>
              {notification.actionButton && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleAction(notification, notification.actionButton)}
                >
                  <Text style={styles.actionButtonText}>{notification.actionButton}</Text>
                </TouchableOpacity>
              )}
              {notification.secondaryButton && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => handleAction(notification, notification.secondaryButton)}
                >
                  <Text style={styles.secondaryButtonText}>{notification.secondaryButton}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const AppointmentsTab: React.FC = () => {
  const user = useSelector((state: any) => state.currentUser);
  const appLanguage = user?.appLanguage || "en";
  const t = translations[appLanguage] || translations.en;
  const appointmentNotifications = t.notificationsData.filter(
    (n: NotificationType) => n.title.includes(t.tabs.appointments) || n.title.includes('Specialist')
  );

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {appointmentNotifications.map((notification: NotificationType) => (
        <TouchableOpacity
          key={notification.id}
          style={styles.notificationCard}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: notification.iconBg }]}>
              <Text style={styles.icon}>{notification.icon}</Text>
            </View>
            <View style={styles.notificationDetails}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationDescription}>{notification.description}</Text>
              <Text style={styles.notificationTime}>{notification.time}</Text>
            </View>
          </View>

          {(notification.actionButton || notification.secondaryButton) && (
            <View style={styles.buttonContainer}>
              {notification.actionButton && (
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>{notification.actionButton}</Text>
                </TouchableOpacity>
              )}
              {notification.secondaryButton && (
                <TouchableOpacity style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>{notification.secondaryButton}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const PaymentsTab: React.FC = () => {
  const user = useSelector((state: any) => state.currentUser);
  const appLanguage = user?.appLanguage || "en";
  const t = translations[appLanguage] || translations.en;
  const paymentNotifications = t.notificationsData.filter(
    (n: NotificationType) => n.title.includes(t.tabs.payments) || n.title.includes('Wallet')
  );

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {paymentNotifications.map((notification: NotificationType) => (
        <TouchableOpacity
          key={notification.id}
          style={styles.notificationCard}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: notification.iconBg }]}>
              <Text style={styles.icon}>{notification.icon}</Text>
            </View>
            <View style={styles.notificationDetails}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationDescription}>{notification.description}</Text>
              <Text style={styles.notificationTime}>{notification.time}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const OthersTab: React.FC = () => {
  const user = useSelector((state: any) => state.currentUser);
  const appLanguage = user?.appLanguage || "en";
  const t = translations[appLanguage] || translations.en;
  const otherNotifications = t.notificationsData.filter(
    (n: NotificationType) => n.title.includes('KYC') || n.title.includes('Lab Report')
  );

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {otherNotifications.map((notification: NotificationType) => (
        <TouchableOpacity
          key={notification.id}
          style={styles.notificationCard}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: notification.iconBg }]}>
              <Text style={styles.icon}>{notification.icon}</Text>
            </View>
            <View style={styles.notificationDetails}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationDescription}>{notification.description}</Text>
              <Text style={styles.notificationTime}>{notification.time}</Text>
            </View>
          </View>

          {notification.actionButton && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>{notification.actionButton}</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const Notifications: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const user = useSelector((state: any) => state.currentUser);
  const appLanguage = user?.appLanguage || "en";
  const t = translations[appLanguage] || translations.en;

  const handleBackPress = () => {
    navigation.goBack();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'All':
        return <AllTab />;
      case 'Appointments':
        return <AppointmentsTab />;
      case 'Payments':
        return <PaymentsTab />;
      case 'Others':
        return <OthersTab />;
      default:
        return <AllTab />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0FDF4" />
      
      {/* <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.notifications}</Text>
        <View style={styles.placeholder} />
      </View> */}

      <View style={styles.tabContainer}>
        {(['All', 'Appointments', 'Payments', 'Others'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.activeTabText
            ]}>
              {t.tabs[tab.toLowerCase() as keyof typeof t.tabs]}
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
    backgroundColor: '#EDFFF7',
    paddingTop: PLATFORM.STATUS_BAR_HEIGHT,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#F0FDF4',
  },
  backButton: {
    padding: SPACING.xs,
  },
  backArrow: {
    fontSize: responsiveText(FONT_SIZE.lg),
    color: '#333333',
  },
  headerTitle: {
    fontSize: responsiveText(FONT_SIZE.md),
    fontWeight: '600',
    color: '#333333',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: isTablet ? ICON_SIZE.md : ICON_SIZE.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.xxs,
    ...LAYOUT.shadow.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderRadius: LAYOUT.borderRadius.sm,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#22C55E',
  },
  tabText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  notificationCard: {
    backgroundColor: '#ffffff',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...LAYOUT.shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  iconContainer: {
    width: isTablet ? ICON_SIZE.md : ICON_SIZE.sm,
    height: isTablet ? ICON_SIZE.md : ICON_SIZE.sm,
    borderRadius: LAYOUT.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  icon: {
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  notificationDetails: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: SPACING.xxs,
  },
  notificationDescription: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#6B7280',
    marginBottom: SPACING.xxs,
    lineHeight: moderateScale(16),
  },
  notificationTime: {
    fontSize: responsiveText(FONT_SIZE.xxs),
    color: '#9CA3AF',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.sm,
    alignItems: 'center',
    height: isTablet ? 36 : 32,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: responsiveText(FONT_SIZE.xxs),
    fontWeight: '500',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.sm,
    alignItems: 'center',
    height: isTablet ? 36 : 32,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: responsiveText(FONT_SIZE.xxs),
    fontWeight: '500',
  },
});

export default Notifications;