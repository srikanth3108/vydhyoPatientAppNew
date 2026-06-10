import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Linking,
} from 'react-native';
import { useSelector } from 'react-redux';
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
  SAFE_AREA,
  isTablet,
  isIOS,
  isSmallDevice,
  DYNAMIC_DIMENSIONS
} from '../../utils/responsive';

// ---------- Translations ----------
const translations: any = {
  en: {
    helpCenter: "Help Center",
    needHelp: "Need Help?",
    needHelpSubtitle: "We're here for you 24/7",
    callUs: "Call Us",
    chatWithUs: "Chat with Us",
    emailSupport: "Email Support",
    faqSectionTitle: "Frequently Asked Questions",
    supportFormTitle: "Need more help?",
    supportFormSubtitle: "Send us your question",
    supportInputPlaceholder: "Write your question...",
    attachFile: "Attach File",
    attachLimit: "Max 10MB",
    submitRequest: "Submit Request",
    faqs: [
      {
        question: "How to book an appointment?",
        answer: "To book an appointment:\n1. Go to the 'Doctors' section\n2. Select your preferred doctor\n3. Choose an available time slot\n4. Fill in your details\n5. Confirm your booking\n\nYou'll receive a confirmation message with appointment details."
      },
      {
        question: "How to cancel or reschedule?",
        answer: "To cancel or reschedule:\n1. Go to 'My Appointments'\n2. Find your booking\n3. Tap 'Cancel' or 'Reschedule'\n4. Select new date/time if rescheduling\n5. Confirm changes\n\nNote: Cancellations must be made at least 2 hours before the appointment time."
      },
      {
        question: "Where can I view my prescriptions?",
        answer: "Your prescriptions are available in:\n1. 'My Profile' section\n2. 'Medical Records' tab\n3. 'Prescriptions' folder\n\nYou can download, print, or share your prescriptions from there."
      },
      {
        question: "How can I contact my doctor?",
        answer: "You can contact your doctor through:\n1. In-app messaging after your appointment\n2. Scheduled follow-up calls\n3. Emergency contact (for urgent matters)\n\nNote: For medical emergencies, please call emergency services directly."
      }
    ],
    cancel: "Cancel",
    startChat: "Start Chat",
    requestSubmitted: "Request Submitted",
    requestSubmittedMessage: "Thank you for your question. Our support team will get back to you within 24 hours.",
    requiredField: "Required Field",
    requiredFieldMessage: "Please enter your question or concern.",
    attachFileMessage: "File attachment feature coming soon!",
    callError: "Unable to make phone call",
    emailError: "Unable to open email client",
  },
  hi: {
    helpCenter: "सहायता केंद्र",
    needHelp: "सहायता चाहिए?",
    needHelpSubtitle: "हम आपके लिए 24/7 उपलब्ध हैं",
    callUs: "हमें कॉल करें",
    chatWithUs: "हमसे चैट करें",
    emailSupport: "ईमेल समर्थन",
    faqSectionTitle: "अक्सर पूछे जाने वाले प्रश्न",
    supportFormTitle: "अधिक सहायता चाहिए?",
    supportFormSubtitle: "हमें अपना प्रश्न भेजें",
    supportInputPlaceholder: "अपना प्रश्न लिखें...",
    attachFile: "फ़ाइल संलग्न करें",
    attachLimit: "अधिकतम 10MB",
    submitRequest: "अनुरोध सबमिट करें",
    faqs: [
      {
        question: "अपॉइंटमेंट कैसे बुक करें?",
        answer: "अपॉइंटमेंट बुक करने के लिए:\n1. 'डॉक्टर्स' सेक्शन में जाएं\n2. अपने पसंदीदा डॉक्टर का चयन करें\n3. उपलब्ध समय स्लॉट चुनें\n4. अपनी जानकारी भरें\n5. अपनी बुकिंग की पुष्टि करें\n\nआपको अपॉइंटमेंट विवरण के साथ एक पुष्टिकरण संदेश प्राप्त होगा।"
      },
      {
        question: "रद्द या पुनर्निर्धारित कैसे करें?",
        answer: "रद्द या पुनर्निर्धारित करने के लिए:\n1. 'मेरे अपॉइंटमेंट्स' में जाएं\n2. अपनी बुकिंग ढूंढें\n3. 'रद्द करें' या 'पुनर्निर्धारित करें' पर टैप करें\n4. पुनर्निर्धारित करने के लिए नई तारीख/समय चुनें\n5. परिवर्तनों की पुष्टि करें\n\nनोट: रद्द करने की समय सीमा अपॉइंटमेंट समय से कम से कम 2 घंटे पहले है।"
      },
      {
        question: "मेरे प्रिस्क्रिप्शन कहां देख सकते हैं?",
        answer: "आपके प्रिस्क्रिप्शन यहां उपलब्ध हैं:\n1. 'मेरे प्रोफाइल' सेक्शन में\n2. 'मेडिकल रिकॉर्ड्स' टैब में\n3. 'प्रिस्क्रिप्शन्स' फ़ोल्डर में\n\nआप वहां से अपने प्रिस्क्रिप्शन डाउनलोड, प्रिंट या साझा कर सकते हैं।"
      },
      {
        question: "मैं अपने डॉक्टर से कैसे संपर्क कर सकता हूं?",
        answer: "आप अपने डॉक्टर से संपर्क कर सकते हैं:\n1. अपॉइंटमेंट के बाद इन-ऐप मैसेजिंग के माध्यम से\n2. निर्धारित फॉलो-अप कॉल्स के माध्यम से\n3. आपातकालीन संपर्क (तत्काल मामलों के लिए)\n\nनोट: चिकित्सा आपातकाल के लिए, कृपया तुरंत आपातकालीन सेवाओं को कॉल करें।"
      }
    ],
    cancel: "रद्द करें",
    startChat: "चैट शुरू करें",
    requestSubmitted: "अनुरोध सबमिट किया गया",
    requestSubmittedMessage: "आपके प्रश्न के लिए धन्यवाद। हमारी सहायता टीम 24 घंटों के भीतर आपसे संपर्क करेगी।",
    requiredField: "आवश्यक फ़ील्ड",
    requiredFieldMessage: "कृपया अपना प्रश्न या चिंता दर्ज करें।",
    attachFileMessage: "फ़ाइल संलग्न करने की सुविधा जल्द ही आ रही है!",
    callError: "फ़ोन कॉल करने में असमर्थ",
    emailError: "ईमेल क्लाइंट खोलने में असमर्थ",
  },
  tel: {
    helpCenter: "సహాయ కేంద్రం",
    needHelp: "సహాయం కావాలా?",
    needHelpSubtitle: "మేము మీ కోసం 24/7 అందుబాటులో ఉన్నాము",
    callUs: "మాకు కాల్ చేయండి",
    chatWithUs: "మాతో చాట్ చేయండి",
    emailSupport: "ఈమెయిల్ సపోర్ట్",
    faqSectionTitle: "తరచుగా అడిగే ప్రశ్నలు",
    supportFormTitle: "మరింత సహాయం కావాలా?",
    supportFormSubtitle: "మీ ప్రశ్నను మాకు పంపండి",
    supportInputPlaceholder: "మీ ప్రశ్నను రాయండి...",
    attachFile: "ఫైల్ జోడించండి",
    attachLimit: "గరిష్టంగా 10MB",
    submitRequest: "అభ్యర్థన సమర్పించండి",
    faqs: [
      {
        question: "అపాయింట్‌మెంట్ ఎలా బుక్ చేయాలి?",
        answer: "అపాయింట్‌మెంట్ బుక్ చేయడానికి:\n1. 'డాక్టర్స్' విభాగానికి వెళ్ళండి\n2. మీకు ఇష్టమైన డాక్టర్‌ను ఎంచుకోండి\n3. అందుబాటులో ఉన్న సమయ స్లాట్‌ను ఎంచుకోండి\n4. మీ వివరాలను నమోదు చేయండి\n5. మీ బుకింగ్‌ను నిర్ధారించండి\n\nమీకు అపాయింట్‌మెంట్ వివరాలతో ఒక నిర్ధారణ సందేశం అందుతుంది."
      },
      {
        question: "రద్దు లేదా రీషెడ్యూల్ ఎలా చేయాలి?",
        answer: "రద్దు చేయడానికి లేదా రీషెడ్యూల్ చేయడానికి:\n1. 'నా అపాయింట్‌మెంట్స్'కు వెళ్ళండి\n2. మీ బుకింగ్‌ను కనుగొనండి\n3. 'రద్దు' లేదా 'రీషెడ్యూల్'పై నొక్కండి\n4. రీషెడ్యూల్ చేస్తే కొత్త తేదీ/సమయాన్ని ఎంచుకోండి\n5. మార్పులను నిర్ధారించండి\n\nగమనిక: రద్దు చేయడం అపాయింట్‌మెంట్ సమయానికి కనీసం 2 గంటల ముందు జరగాలి."
      },
      {
        question: "నా ప్రిస్క్రిప్షన్‌లను ఎక్కడ చూడవచ్చు?",
        answer: "మీ ప్రిస్క్రిప్షన్‌లు ఇక్కడ అందుబాటులో ఉన్నాయి:\n1. 'నా ప్రొఫైల్' విభాగంలో\n2. 'మెడికల్ రికార్డ్స్' ట్యాబ్‌లో\n3. 'ప్రిస్క్రిప్షన్స్' ఫోల్డర్‌లో\n\nమీరు అక్కడ నుండి మీ ప్రిస్క్రిప్షన్‌లను డౌన్‌లోడ్ చేయవచ్చు, ప్రింట్ చేయవచ్చు లేదా షేర్ చేయవచ్చు."
      },
      {
        question: "నేను నా డాక్టర్‌ను ఎలా సంప్రదించగలను?",
        answer: "మీరు మీ డాక్టర్‌ను సంప్రదించవచ్చు:\n1. అపాయింట్‌మెంట్ తర్వాత ఇన్-ఆప్ మెసేజింగ్ ద్వారా\n2. షెడ్యూల్డ్ ఫాలో-అప్ కాల్స్ ద్వారా\n3. ఎమర్జెన్సీ కాంటాక్ట్ (తక్షణ విషయాల కోసం)\n\nగమనిక: వైద్య అత్యవసర పరిస్థితుల కోసం, దయచేసి వెంటనే ఎమర్జెన్సీ సర్వీసెస్‌కు కాల్ చేయండి."
      }
    ],
    cancel: "రద్దు చేయండి",
    startChat: "చాట్ ప్రారంభించండి",
    requestSubmitted: "అభ్యర్థన సమర్పించబడింది",
    requestSubmittedMessage: "మీ ప్రశ్నకు ధన్యవాదాలు. మా సపోర్ట్ టీమ్ 24 గంటలలోపు మీకు సంప్రదిస్తుంది.",
    requiredField: "అవసరమైన ఫీల్డ్",
    requiredFieldMessage: "దయచేసి మీ ప్రశ్న లేదా ఆందోళనను నమోదు చేయండి.",
    attachFileMessage: "ఫైల్ జోడింపు ఫీచర్ త్వరలో వస్తుంది!",
    callError: "ఫోన్ కాల్ చేయడం సాధ్యం కాలేదు",
    emailError: "ఈమెయిల్ క్లైంట్‌ను తెరవడం సాధ్యం కాలేదు",
  },
};

const HelpCenter = () => {
  const user = useSelector((state: any) => state.currentUser);
  const appLanguage = user?.appLanguage || "en";
  const t = translations[appLanguage] || translations.en;

  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [supportQuestion, setSupportQuestion] = useState('');

  const handleFAQPress = (id: number) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleCallUs = () => {
    const phoneNumber = 'tel:+919666955501';
    Linking.openURL(phoneNumber).catch(err => {
      Alert.alert(t.callError, t.callError);
    });
  };

  const handleChatWithUs = () => {
    Alert.alert(t.chatWithUs, "Chat feature will be available soon!", [
      { text: "OK" }
    ]);
  };

  const handleEmailSupport = () => {
    const email = 'mailto:vydhyo@gmail.com?subject=Support Request';
    Linking.openURL(email).catch(err => {
      Alert.alert(t.emailError, t.emailError);
    });
  };

  const handleSubmitSupportRequest = () => {
    if (!supportQuestion.trim()) {
      Alert.alert(t.requiredField, t.requiredFieldMessage);
      return;
    }

    Alert.alert(
      t.requestSubmitted,
      t.requestSubmittedMessage,
      [
        {
          text: 'OK',
          onPress: () => {
            setSupportQuestion('');
          }
        }
      ]
    );
  };

  const handleAttachFile = () => {
    Alert.alert(t.attachFile, t.attachFileMessage);
  };

  const renderContactOptions = () => (
    <View style={styles.contactSection}>
      <View style={styles.helpHeader}>
        <View style={styles.helpIcon}>
          <Text style={styles.helpIconText}>?</Text>
        </View>
        <View style={styles.helpTextContainer}>
          <Text style={styles.helpTitle}>{t.needHelp}</Text>
          <Text style={styles.helpSubtitle}>{t.needHelpSubtitle}</Text>
        </View>
      </View>

      <View style={styles.contactButtonsContainer}>
        <TouchableOpacity style={styles.callButton} onPress={handleCallUs}>
          <Text style={styles.callIcon}>📞</Text>
          <Text style={styles.callButtonText}>{t.callUs}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.chatButton} onPress={handleChatWithUs}>
          <Text style={styles.chatIcon}>💬</Text>
          <Text style={styles.chatButtonText}>{t.chatWithUs}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.emailButton} onPress={handleEmailSupport}>
          <Text style={styles.emailIcon}>📧</Text>
          <Text style={styles.emailButtonText}>{t.emailSupport}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFAQItem = (item: { id: number; question: string; answer: string }) => (
    <View key={item.id} style={styles.faqItem}>
      <TouchableOpacity
        style={styles.faqQuestion}
        onPress={() => handleFAQPress(item.id)}
      >
        <Text style={styles.faqQuestionText}>{item.question}</Text>
        <Text style={[
          styles.faqChevron,
          expandedFAQ === item.id && styles.faqChevronExpanded
        ]}>
          ›
        </Text>
      </TouchableOpacity>
      
      {expandedFAQ === item.id && (
        <View style={styles.faqAnswer}>
          <Text style={styles.faqAnswerText}>{item.answer}</Text>
        </View>
      )}
    </View>
  );

  const renderSupportForm = () => (
    <View style={styles.supportFormSection}>
      <Text style={styles.supportFormTitle}>{t.supportFormTitle}</Text>
      <Text style={styles.supportFormSubtitle}>{t.supportFormSubtitle}</Text>

      <TextInput
        style={styles.supportInput}
        placeholder={t.supportInputPlaceholder}
        placeholderTextColor="#999"
        value={supportQuestion}
        onChangeText={setSupportQuestion}
        multiline
        textAlignVertical="top"
        numberOfLines={4}
      />

      <TouchableOpacity style={styles.attachFileButton} onPress={handleAttachFile}>
        <Text style={styles.attachIcon}>📎</Text>
        <Text style={styles.attachText}>{t.attachFile}</Text>
        <Text style={styles.attachLimit}>{t.attachLimit}</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.submitButton}
        onPress={handleSubmitSupportRequest}
      >
        <Text style={styles.submitButtonText}>{t.submitRequest}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderContactOptions()}
        <View style={styles.faqSection}>
          <Text style={styles.faqSectionTitle}>{t.faqSectionTitle}</Text>
          {t.faqs.map((faq: any, index: number) => 
            renderFAQItem({ ...faq, id: index })
          )}
        </View>
        {renderSupportForm()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SAFE_AREA.safeBottom + SPACING.md,
  },
  contactSection: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: '#fff',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: 12,
    ...LAYOUT.shadow.sm,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  helpIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  helpIconText: {
    color: '#fff',
    fontSize: moderateScale(18),
    fontWeight: 'bold',
  },
  helpTextContainer: {
    flex: 1,
  },
  helpTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  helpSubtitle: {
    fontSize: moderateScale(13),
    color: '#666',
    lineHeight: moderateScale(18),
  },
  contactButtonsContainer: {
    gap: SPACING.sm,
  },
  callButton: {
    backgroundColor: '#4285F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 10,
    ...LAYOUT.shadow.xs,
  },
  callIcon: {
    fontSize: moderateScale(18),
    marginRight: SPACING.sm,
  },
  callButtonText: {
    color: '#fff',
    fontSize: moderateScale(15),
    fontWeight: '600',
  },
  chatButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4285F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 10,
  },
  chatIcon: {
    fontSize: moderateScale(18),
    marginRight: SPACING.sm,
  },
  chatButtonText: {
    color: '#4285F4',
    fontSize: moderateScale(15),
    fontWeight: '600',
  },
  emailButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4285F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 10,
  },
  emailIcon: {
    fontSize: moderateScale(18),
    marginRight: SPACING.sm,
  },
  emailButtonText: {
    color: '#4285F4',
    fontSize: moderateScale(15),
    fontWeight: '600',
  },
  faqSection: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  faqSectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#333',
    marginBottom: SPACING.md,
    marginLeft: SPACING.xs,
  },
  faqItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
    ...LAYOUT.shadow.xs,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: moderateScale(14),
    color: '#333',
    fontWeight: '500',
    lineHeight: moderateScale(20),
    paddingRight: SPACING.sm,
  },
  faqChevron: {
    fontSize: moderateScale(16),
    color: '#999',
    transform: [{ rotate: '0deg' }],
  },
  faqChevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  faqAnswer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  faqAnswerText: {
    fontSize: moderateScale(13),
    color: '#666',
    lineHeight: moderateScale(18),
    paddingTop: SPACING.sm,
  },
  supportFormSection: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: '#fff',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: 12,
    padding: SPACING.md,
    ...LAYOUT.shadow.sm,
  },
  supportFormTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  supportFormSubtitle: {
    fontSize: moderateScale(13),
    color: '#666',
    marginBottom: SPACING.md,
    lineHeight: moderateScale(18),
  },
  supportInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: SPACING.md,
    height: verticalScale(100),
    fontSize: moderateScale(14),
    color: '#333',
    textAlignVertical: 'top',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  attachFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  attachIcon: {
    fontSize: moderateScale(16),
    marginRight: SPACING.sm,
    color: '#4285F4',
  },
  attachText: {
    fontSize: moderateScale(14),
    color: '#4285F4',
    fontWeight: '500',
    flex: 1,
  },
  attachLimit: {
    fontSize: moderateScale(11),
    color: '#999',
  },
  submitButton: {
    backgroundColor: '#4285F4',
    paddingVertical: SPACING.md,
    borderRadius: 10,
    alignItems: 'center',
    ...LAYOUT.shadow.xs,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: moderateScale(15),
    fontWeight: '600',
  },
});

export default HelpCenter;