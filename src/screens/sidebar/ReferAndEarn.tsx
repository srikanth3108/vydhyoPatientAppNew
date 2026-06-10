import React, { useState, useEffect } from 'react';
import { AuthPost, apiRequest, ENDPOINTS } from '../../services';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Share,
  Alert,
  Clipboard,
  FlatList,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
;
import {
  responsiveWidth,
  responsiveHeight,
  responsiveText,
  SPACING,
  FONT_SIZE,
  ICON_SIZE,
  LAYOUT,
  isTablet,
  moderateScale,
  SAFE_AREA,
  PLATFORM,
} from '../../utils/responsive';



const ReferAndEarn = () => {
  const user = useSelector((state: any) => state.currentUser);
  const appLanguage = user?.appLanguage || 'en';
  const [walletConfigs, setWalletConfigs] = useState({rewardAmount:100, signupAmount:100});

  // ---------- Translations ----------
const translations: any = {
  en: {
    // Header
    referAndEarn: `Refer & Earn ₹${walletConfigs.rewardAmount}`,
    headerSubtitle: `Invite your friends & family. Both of you get Rewards.`,
    headerSubline: 'Help them book trusted doctors. Earn rewards for every successful referral.',

    // Stats
    totalEarned: 'Total ₹ Earned',
    totalInstalled: 'Friends Joined',
    applied: 'Consultations Booked',
    completed: 'Consultations Completed',

    // Main section
    makeHealthConvenient: 'Make healthcare easy for your people.',
    referToFriends: 'When your friend completes their first consultation:',
    mainBenefit1: `✔ They get ₹${walletConfigs.signupAmount} benefit`,
    mainBenefit2: `✔ You get ₹${walletConfigs.rewardAmount} in your wallet`,
    noLimits: 'No limits. Refer more. Earn more.',

    // What they get / What you get
    whatTheyGet: 'What Your Friend Gets',
    whatYouGet: 'What You Get',
    theyGetBenefit: `₹${walletConfigs.signupAmount} will be credited to their VYDHYO wallet after signup.\nValid only for new users.`,
    youGetBenefit: `₹${walletConfigs.rewardAmount} added to your VYDHYO wallet after their first completed consultation.\nWallet money can be used for future bookings.`,

    // Referral code section
    yourReferralCode: 'Your Referral Code',
    referralCodeSubtitle: 'Share this code with your friends during signup.',
    referralCodeMicrocopy: 'Code must be entered at the time of registration.',
    everyReferral: `Every Referral = ₹${walletConfigs.rewardAmount}`,
    everyReferralDesc: `Your friend saves ₹${walletConfigs.signupAmount}.\nYou earn ₹${walletConfigs.rewardAmount}.\nSimple.`,

    // Buttons
    shareNow: 'Share Your Code Now',
    generateReferralCode: 'Generate Referral Code',
    howItWorksLink: 'How it works?',

    // How It Works page
    howReferralWorks: 'How Referral Works',
    howItWorksIntro: `Care for your friends and family.\nEarn ₹${walletConfigs.rewardAmount} every time.`,
    howItWorksSubIntro: 'Invite your friends and family to VYDHYO and both of you get rewarded.',
    howItWorksTitle: 'How It Works',
    processStep1: '1️⃣ Share your referral code with a friend who is new to VYDHYO.',
    processStep2: '2️⃣ They sign up using your code.',
    processStep3: `3️⃣ They get ₹${walletConfigs.signupAmount} benefit on their first consultation.`,
    processStep4: '4️⃣ They book and complete their first doctor consultation.',
    processStep5: `5️⃣ You get ₹${walletConfigs.rewardAmount} in your VYDHYO wallet.`,
    noLimitsLine: 'No limits. Refer more. Earn more.',

    theReward: 'THE REWARD',
    reward1: `✔ Your friend gets ₹${walletConfigs.signupAmount} credited to their VYDHYO wallet after signup.`,
    reward2: `✔ You get ₹${walletConfigs.rewardAmount} added to your VYDHYO wallet.`,
    reward3: '✔ No minimum booking value required.',
    reward4: '✔ Wallet amount can be used for future doctor bookings.',

    importantPoints: 'Important Points to Remember',
    point1: 'Friend must be new to VYDHYO',
    point2: 'Referral code must be used during signup',
    point3: 'Reward is given only after completed consultation',
    point4: `₹${walletConfigs.rewardAmount} will reflect within 48 hours`,
    point5: 'Wallet money is for VYDHYO bookings only',
    point6: 'No cash withdrawal',
    point7: 'No referral limit',
    point8: 'Misuse or fake bookings will cancel rewards',

    safeSecure: 'Safe & secure bookings',
    safePoint1: '• Verified doctors',
    safePoint2: '• Transparent pricing',
    safePoint3: '• Wallet credit within 48 hours of completed appointment',
    helpLoved: 'Help your loved ones access healthcare easily — and earn while doing it.',
    codeMustBeEntered: 'Code must be entered during signup. Cannot be added later.',

    // Share message
    shareMessage: `Join VYDHYO using my referral code {code} and get ₹${walletConfigs.signupAmount} OFF on your first consultation! {link}`,
    copySuccess: 'Referral code copied to clipboard!',
    copyError: 'Failed to share referral code',
    noAuthToken: 'No auth token found',
    failedGenerateCode: 'Failed to generate referral code',
    somethingWentWrong: 'Something went wrong',

    // Tabs & List
    referralTab: 'Referral',
    listTab: 'List',
    installed: 'Installed',
    pending: 'Pending',
    patientName: 'Patient Name',
    mobile: 'Mobile',
    appointmentDate: 'Appointment Date',
    status: 'Status',
    rewardAmount: 'Reward Amount',
    noData: 'No referrals found',
    loadingMore: 'Loading more...',

    // Send Reminder
    sendReminder: 'Send Reminder',
    reminderSubtext: "They haven't booked yet — nudge them!",
  },
  hi: {
    // Header
    referAndEarn: `रेफर करें और ₹${walletConfigs.rewardAmount} कमाएँ`,
    headerSubtitle: 'अपने दोस्तों और परिवार को आमंत्रित करें। दोनों को इनाम मिलेंगे।',
    headerSubline: 'उन्हें भरोसेमंद डॉक्टर बुक करने में मदद करें। हर सफल रेफरल पर रिवॉर्ड कमाएँ।',

    // Stats
    totalEarned: 'कुल ₹ कमाई',
    totalInstalled: 'दोस्त शामिल हुए',
    applied: 'परामर्श बुक किए',
    completed: 'परामर्श पूरे हुए',

    // Main section
    makeHealthConvenient: 'अपनों के लिए स्वास्थ्य सेवा आसान बनाएँ।',
    referToFriends: 'जब आपका दोस्त पहला परामर्श पूरा करता है:',
    mainBenefit1: `✔ उन्हें ₹${walletConfigs.signupAmount} का लाभ मिलता है`,
    mainBenefit2: `✔ आपको अपने वॉलेट में ₹${walletConfigs.rewardAmount} मिलते हैं`,
    noLimits: 'कोई सीमा नहीं। ज़्यादा रेफर करें। ज़्यादा कमाएँ।',

    // What they get / What you get
    whatTheyGet: 'आपके दोस्त को क्या मिलता है',
    whatYouGet: 'आपको क्या मिलता है',
    theyGetBenefit: `₹${walletConfigs.signupAmount} उनके VYDHYO वॉलेट में साइनअप के बाद जोड़ा जाएगा।\nकेवल नए उपयोगकर्ताओं के लिए मान्य।`,
    youGetBenefit: `उनके पहले पूर्ण परामर्श के बाद आपके VYDHYO वॉलेट में ₹${walletConfigs.rewardAmount} जोड़े जाएंगे।\nवॉलेट का पैसा भविष्य की बुकिंग के लिए उपयोग किया जा सकता है।`,

    // Referral code section
    yourReferralCode: 'आपका रेफरल कोड',
    referralCodeSubtitle: 'साइनअप के दौरान यह कोड अपने दोस्तों के साथ साझा करें।',
    referralCodeMicrocopy: 'कोड पंजीकरण के समय दर्ज करना होगा।',
    everyReferral: `हर रेफरल = ₹${walletConfigs.rewardAmount}`,
    everyReferralDesc: `आपका दोस्त ₹${walletConfigs.signupAmount} बचाता है।\nआप ₹${walletConfigs.rewardAmount} कमाते हैं।\nसरल।`,

    // Buttons
    shareNow: 'अपना कोड अभी शेयर करें',
    generateReferralCode: 'रेफरल कोड जनरेट करें',
    howItWorksLink: 'यह कैसे काम करता है?',

    // How It Works page
    howReferralWorks: 'रेफरल कैसे काम करता है',
    howItWorksIntro: `अपने दोस्तों और परिवार की देखभाल करें।\nहर बार ₹${walletConfigs.rewardAmount} कमाएँ।`,
    howItWorksSubIntro: 'अपने दोस्तों और परिवार को VYDHYO पर आमंत्रित करें और दोनों को रिवॉर्ड मिलेगा।',
    howItWorksTitle: 'यह कैसे काम करता है',
    processStep1: '1️⃣ अपना रेफरल कोड एक ऐसे दोस्त के साथ साझा करें जो VYDHYO पर नया है।',
    processStep2: '2️⃣ वे आपके कोड का उपयोग करके साइन अप करते हैं।',
    processStep3: `3️⃣ उन्हें पहले परामर्श पर ₹${walletConfigs.signupAmount} का लाभ मिलता है।`,
    processStep4: '4️⃣ वे अपना पहला डॉक्टर परामर्श बुक करते हैं और पूरा करते हैं।',
    processStep5: `5️⃣ आपको अपने VYDHYO वॉलेट में ₹${walletConfigs.rewardAmount} मिलते हैं।`,
    noLimitsLine: 'कोई सीमा नहीं। ज़्यादा रेफर करें। ज़्यादा कमाएँ।',

    theReward: 'रिवॉर्ड',
    reward1: `✔ आपके दोस्त के VYDHYO वॉलेट में साइनअप के बाद ₹${walletConfigs.signupAmount} जोड़ा जाएगा।`,
    reward2: `✔ आपको अपने VYDHYO वॉलेट में ₹${walletConfigs.rewardAmount} जोड़े जाते हैं।`,
    reward3: '✔ कोई न्यूनतम बुकिंग राशि आवश्यक नहीं।',
    reward4: '✔ वॉलेट राशि भविष्य की डॉक्टर बुकिंग के लिए उपयोग की जा सकती है।',

    importantPoints: 'याद रखने योग्य महत्वपूर्ण बातें',
    point1: 'दोस्त VYDHYO पर नया होना चाहिए',
    point2: 'रेफरल कोड साइनअप के दौरान उपयोग होना चाहिए',
    point3: 'रिवॉर्ड केवल पूर्ण परामर्श के बाद दिया जाता है',
    point4: `₹${walletConfigs.rewardAmount} 48 घंटों के भीतर दिखाई देंगे`,
    point5: 'वॉलेट का पैसा केवल VYDHYO बुकिंग के लिए है',
    point6: 'नकद निकासी नहीं',
    point7: 'कोई रेफरल सीमा नहीं',
    point8: 'दुरुपयोग या फर्जी बुकिंग से रिवॉर्ड रद्द हो जाएंगे',

    safeSecure: 'सुरक्षित बुकिंग',
    safePoint1: '• सत्यापित डॉक्टर',
    safePoint2: '• पारदर्शी मूल्य निर्धारण',
    safePoint3: '• पूर्ण अपॉइंटमेंट के 48 घंटों के भीतर वॉलेट क्रेडिट',
    helpLoved: 'अपनों को आसानी से स्वास्थ्य सेवा प्राप्त करने में मदद करें — और कमाई भी करें।',
    codeMustBeEntered: 'कोड साइनअप के दौरान दर्ज करना होगा। बाद में नहीं जोड़ा जा सकता।',

    // Share message
    shareMessage: `मेरे रेफरल कोड {code} का उपयोग करके VYDHYO में शामिल हों और अपने पहले परामर्श पर ₹${walletConfigs.signupAmount} की छूट पाएँ! {link}`,
    copySuccess: 'रेफरल कोड क्लिपबोर्ड पर कॉपी किया गया!',
    copyError: 'रेफरल कोड साझा करने में विफल',
    noAuthToken: 'कोई ऑथ टोकन नहीं मिला',
    failedGenerateCode: 'रेफरल कोड जनरेट करने में विफल',
    somethingWentWrong: 'कुछ गलत हो गया',

    // Tabs & List
    referralTab: 'रेफरल',
    listTab: 'सूची',
    installed: 'शामिल हुए',
    pending: 'लंबित',
    patientName: 'रोगी का नाम',
    mobile: 'मोबाइल',
    appointmentDate: 'नियुक्ति की तारीख',
    status: 'स्थिति',
    rewardAmount: 'रिवॉर्ड राशि',
    noData: 'कोई रेफरल नहीं मिला',
    loadingMore: 'अधिक लोड हो रहा है...',

    // Send Reminder
    sendReminder: 'रिमाइंडर भेजें',
    reminderSubtext: 'उन्होंने अभी बुक नहीं किया — उन्हें याद दिलाएँ!',
  },
  tel: {
    // Header
    referAndEarn: `రిఫర్ చేయండి & ₹${walletConfigs.rewardAmount} సంపాదించండి`,
    headerSubtitle: `మీ స్నేహితులు & కుటుంబాన్ని ఆహ్వానించండి. ఇద్దరికీ రివార్డ్ లభిస్తుంది.`,
    headerSubline: `వారికి నమ్మకమైన డాక్టర్లను బుక్ చేయడంలో సహాయపడండి. ప్రతి విజయవంతమైన రిఫరల్‌కు రివార్డ్‌లు సంపాదించండి.`,

    // Stats
    totalEarned: 'మొత్తం ₹ సంపాదన',
    totalInstalled: 'స్నేహితులు చేరారు',
    applied: 'కన్సల్టేషన్‌లు బుక్ చేయబడ్డాయి',
    completed: 'కన్సల్టేషన్‌లు పూర్తయ్యాయి',

    // Main section
    makeHealthConvenient: 'మీ వారి కోసం ఆరోగ్య సంరక్షణ సులభం చేయండి.',
    referToFriends: 'మీ స్నేహితుడు మొదటి కన్సల్టేషన్ పూర్తి చేసినప్పుడు:',
    mainBenefit1: `✔ వారికి ₹${walletConfigs.signupAmount} ప్రయోజనం లభిస్తుంది`,
    mainBenefit2: `✔ మీకు మీ వాలెట్‌లో ₹${walletConfigs.rewardAmount} లభిస్తుంది`,
    noLimits: 'పరిమితులు లేవు. ఎక్కువ రిఫర్ చేయండి. ఎక్కువ సంపాదించండి.',

    // What they get / What you get
    whatTheyGet: 'మీ స్నేహితుడికి ఏమి లభిస్తుంది',
    whatYouGet: 'మీకు ఏమి లభిస్తుంది',
   theyGetBenefit: `₹${walletConfigs.signupAmount} వారి VYDHYO వాలెట్‌లో సైన్ అప్ తర్వాత జోడించబడుతుంది.\nకొత్త వినియోగదారులకు మాత్రమే వర్తిస్తుంది.`,
    youGetBenefit: `వారి మొదటి పూర్తయిన కన్సల్టేషన్ తర్వాత మీ VYDHYO వాలెట్‌లో ₹${walletConfigs.rewardAmount} జోడించబడుతుంది.\nవాలెట్ డబ్బు భవిష్యత్ బుకింగ్‌ల కోసం ఉపయోగించవచ్చు.`,

    // Referral code section
    yourReferralCode: 'మీ రిఫరల్ కోడ్',
    referralCodeSubtitle: 'సైన్ అప్ సమయంలో ఈ కోడ్‌ను మీ స్నేహితులతో షేర్ చేయండి.',
    referralCodeMicrocopy: 'రిజిస్ట్రేషన్ సమయంలో కోడ్ ఎంటర్ చేయాలి.',
    everyReferral: `ప్రతి రిఫరల్ = ₹${walletConfigs.rewardAmount}`,
    everyReferralDesc: `మీ స్నేహితుడు ₹${walletConfigs.signupAmount} ఆదా చేస్తారు.\nమీరు ₹${walletConfigs.rewardAmount} సంపాదిస్తారు.\nసింపుల్.`,

    // Buttons
    shareNow: 'మీ కోడ్ ఇప్పుడే షేర్ చేయండి',
    generateReferralCode: 'రిఫరల్ కోడ్ జనరేట్ చేయండి',
    howItWorksLink: 'ఇది ఎలా పనిచేస్తుంది?',

    // How It Works page
    howReferralWorks: 'రిఫరల్ ఎలా పనిచేస్తుంది',
    howItWorksIntro: `మీ స్నేహితులు మరియు కుటుంబం పట్ల శ్రద్ధ వహించండి.\nప్రతిసారి ₹${walletConfigs.rewardAmount} సంపాదించండి.`,
    howItWorksSubIntro: 'మీ స్నేహితులు మరియు కుటుంబాన్ని VYDHYOకి ఆహ్వానించండి మరియు ఇద్దరికీ రివార్డ్ లభిస్తుంది.',
    howItWorksTitle: 'ఇది ఎలా పనిచేస్తుంది',
    processStep1: '1️⃣ VYDHYOకి కొత్తగా ఉన్న స్నేహితుడితో మీ రిఫరల్ కోడ్ షేర్ చేయండి.',
    processStep2: '2️⃣ వారు మీ కోడ్ ఉపయోగించి సైన్ అప్ చేస్తారు.',
    processStep3: `3️⃣ వారికి మొదటి కన్సల్టేషన్‌పై ₹${walletConfigs.signupAmount} ప్రయోజనం లభిస్తుంది.`,
    processStep4: '4️⃣ వారు మొదటి డాక్టర్ కన్సల్టేషన్ బుక్ చేసి పూర్తి చేస్తారు.',
    processStep5: `5️⃣ మీకు మీ VYDHYO వాలెట్‌లో ₹${walletConfigs.rewardAmount} లభిస్తుంది.`,
    noLimitsLine: 'పరిమితులు లేవు. ఎక్కువ రిఫర్ చేయండి. ఎక్కువ సంపాదించండి.',

    theReward: 'రివార్డ్',
    reward1: `✔ మీ స్నేహితుడి VYDHYO వాలెట్‌లో సైన్ అప్ తర్వాత ₹${walletConfigs.signupAmount} జోడించబడుతుంది.`,
    reward2: `✔ మీకు మీ VYDHYO వాలెట్‌లో ₹${walletConfigs.rewardAmount} జోడించబడుతుంది.`,
    reward3: '✔ కనీస బుకింగ్ విలువ అవసరం లేదు.',
    reward4: '✔ వాలెట్ మొత్తం భవిష్యత్ డాక్టర్ బుకింగ్‌ల కోసం ఉపయోగించవచ్చు.',

    importantPoints: 'గుర్తుంచుకోవలసిన ముఖ్యమైన అంశాలు',
    point1: 'స్నేహితుడు VYDHYOకి కొత్తవాడు అయి ఉండాలి',
    point2: 'సైన్ అప్ సమయంలో రిఫరల్ కోడ్ ఉపయోగించాలి',
    point3: 'పూర్తయిన కన్సల్టేషన్ తర్వాత మాత్రమే రివార్డ్ ఇవ్వబడుతుంది',
    point4: `₹${walletConfigs.rewardAmount} 48 గంటలలోపు ప్రతిబింబిస్తుంది`,
    point5: 'వాలెట్ డబ్బు VYDHYO బుకింగ్‌ల కోసం మాత్రమే',
    point6: 'నగదు ఉపసంహరణ లేదు',
    point7: 'రిఫరల్ పరిమితి లేదు',
    point8: 'దుర్వినియోగం లేదా నకిలీ బుకింగ్‌లు రివార్డ్‌లను రద్దు చేస్తాయి',

    safeSecure: 'సురక్షితమైన బుకింగ్‌లు',
    safePoint1: '• ధృవీకరించబడిన డాక్టర్లు',
    safePoint2: '• పారదర్శక ధర',
    safePoint3: '• పూర్తయిన అపాయింట్‌మెంట్ తర్వాత 48 గంటలలోపు వాలెట్ క్రెడిట్',
    helpLoved: 'మీ ప్రియమైన వారికి ఆరోగ్య సంరక్షణను సులభంగా పొందడంలో సహాయపడండి — మరియు అలా చేస్తూ సంపాదించండి.',
    codeMustBeEntered: 'సైన్ అప్ సమయంలో కోడ్ ఎంటర్ చేయాలి. తర్వాత జోడించలేరు.',

    // Share message
    shareMessage: `నా రిఫరల్ కోడ్ {code} ఉపయోగించి VYDHYOలో చేరండి మరియు మీ మొదటి కన్సల్టేషన్‌పై ₹${walletConfigs.signupAmount} తగ్గింపు పొందండి! {link}`,
    copySuccess: 'రిఫరల్ కోడ్ క్లిప్‌బోర్డ్‌కు కాపీ చేయబడింది!',
    copyError: 'రిఫరల్ కోడ్ షేర్ చేయడంలో విఫలమైంది',
    noAuthToken: 'ఆథ్ టోకన్ కనుగొనబడలేదు',
    failedGenerateCode: 'రిఫరల్ కోడ్ జనరేట్ చేయడంలో విఫలమైంది',
    somethingWentWrong: 'ఏదో తప్పు జరిగింది',

    // Tabs & List
    referralTab: 'రిఫరల్',
    listTab: 'జాబితా',
    installed: 'చేరారు',
    pending: 'పెండింగ్',
    patientName: 'రోగి పేరు',
    mobile: 'మొబైల్',
    appointmentDate: 'అపాయింట్‌మెంట్ తేదీ',
    status: 'స్థితి',
    rewardAmount: 'రివార్డ్ మొత్తం',
    noData: 'రిఫరల్‌లు కనుగొనబడలేదు',
    loadingMore: 'మరిన్ని లోడ్ చేస్తోంది...',

    // Send Reminder
    sendReminder: 'రిమైండర్ పంపండి',
    reminderSubtext: 'వారు ఇంకా బుక్ చేయలేదు — వారికి గుర్తు చేయండి!',
  },
};

  const t = translations[appLanguage] || translations.en;

  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const navigation = useNavigation();
  const currentUserDetails = useSelector((state: any) => state.currentUser);
  // console.log('userrrrrr', currentUserDetails);
  const [referralCode, setReferralCode] = useState(
    currentUserDetails?.referralCode || '',
  );
  const [referralType, setReferralType] = useState<'customized' | 'normal'>('customized');

  // New state for tabs and list
  const [activeTab, setActiveTab] = useState<'referral' | 'list'>('referral');
  const [selectedFilter, setSelectedFilter] = useState<'installed' | 'applied' | 'completed'>('completed');
  const [referralList, setReferralList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalInstalled, setTotalInstalled] = useState(0);
  const [appliedCount, setAppliedCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(false);

  console.log("walletConfigs",walletConfigs)
    const fetchWalletConfigs = async (status = "active") => {
    try {
      let endpoint = `auth/getWalletConfigs?status=${status}`;
      const storedToken = await AsyncStorage.getItem('authToken');
      const response: any = await apiRequest({
        url: endpoint,
        method: 'get',
        token: storedToken,
      });

      console.log("Wallet config fetch response:", response);

      if (response?.data?.status === "success") {
        const { rewardAmount, signupAmount } = response?.data?.data[0] || {};
        setWalletConfigs({ rewardAmount, signupAmount });
      }
    } catch (err) {
      console.error("Wallet config fetch error:", err);
    }
  };

  // Fetch referral statistics
  useEffect(() => {
    fetchReferralStats();
    fetchWalletConfigs();
  }, []);

  // Fetch referral list when filter or tab changes
  useEffect(() => {
    if (activeTab === 'list') {
      setReferralList([]);
      setPage(1);
      setHasMore(true);
      fetchReferralList(1, selectedFilter);
    }
  }, [selectedFilter, activeTab]);

  const fetchReferralStats = async () => {
    try {
      setStatsLoading(true);
      const storedToken = await AsyncStorage.getItem('authToken');
      if (!storedToken) {
        setStatsLoading(false);
        return;
      }

      console.log("auth/referral/stats======before")

      const response: any = await apiRequest({
        url: 'auth/referral/stats',
        method: 'get',
        token: storedToken,
      });
      console.log("auth/referral/stats",response)
      console.log("auth/referral/stats=====data",response.data.data)

      if (response?.data?.data) {
        setTotalEarned(response.data.data.totalEarnings || 0);
        setTotalInstalled(response.data.data.totalInstalled || 0);
        setAppliedCount(response.data.data.totalBookedAppointments || 0);
        setCompletedCount(response.data.data.totalCompletedAppointments || 0);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchReferralList = async (pageNum: number, filter: string) => {
    try {
      setLoading(true);
      const storedToken = await AsyncStorage.getItem('authToken');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      // Map filter to API status
      // installed -> no status param, applied -> completed, completed -> rewarded
      const statusMap: { [key: string]: string | null } = {
        'installed': null, // Don't pass status for installed
        'applied': 'completed',
        'completed': 'rewarded'
      };
      const apiStatus = statusMap[filter];

      // Calculate date range (last 30 days)
      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 30);

      const fromDateStr = fromDate.toISOString().split('T')[0];
      const toDateStr = toDate.toISOString().split('T')[0];
      
      // Build URL with conditional status parameter
      let url = `auth/referral/status`;
      if (apiStatus !== null) {
        url += `?status=${apiStatus}`;
      }
      
      console.log(`🔍 Fetching referral list - UI Filter: ${filter}, API Status: ${apiStatus || 'none'}, URL: ${url}`);
      
      const response: any = await apiRequest({
        url: url,
        method: 'get',
        token: storedToken,
      });

      console.log(`🔍 Fetching referral list - Response:`, response.data);

      if (response?.data?.data) {
          setReferralList(response.data.data);
      } else {
        setReferralList([]);
      }
    } catch (error) {
      console.error('Error fetching referral list:', error);
      if (pageNum === 1) {
        setReferralList([]);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // const loadMore = () => {
  //   if (!loading && hasMore && referralList.length > 0) {
  //     const nextPage = page + 1;
  //     setPage(nextPage);
  //     fetchReferralList(nextPage, selectedFilter);
  //   }
  // };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return '#2196F3';
      case 'rewarded':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      default:
        return '#999';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'APPOINTMENT SCHEDULED';
      case 'rewarded':
        return 'APPOINTMENT COMPLETED';
      case 'pending':
        return 'PENDING';
      default:
        return status?.toUpperCase() || '';
    }
  };

  const formatDate = (dateString: string) => {
    if(!dateString) return "N/A"
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      // 10 lakhs or more = 1 million or more
      const millions = amount / 1000000;
      return `₹${millions.toFixed(1)}M`;
    }
    return `₹${amount}`;
  };


  const handleSendReminder = (item: any) => {
    const mobile = item.mobile?.replace(/\D/g, '');
    if (!mobile) {
      Alert.alert('Error', 'No mobile number found for this referral.');
      return;
    }
    const message = `Hi! I wanted to remind you that you signed up on VYDHYO using my referral code. Book your first doctor consultation now and get ₹${walletConfigs.signupAmount} OFF! 🎉\n\nDownload & book here: https://vydhyo.com/ref/${referralCode}`;
    const whatsappUrl = `whatsapp://send?phone=91${mobile}&text=${encodeURIComponent(message)}`;
    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          Alert.alert('WhatsApp not installed', 'Please install WhatsApp to send a reminder.');
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Could not open WhatsApp. Please try again.');
      });
  };

const handleShare = async () => {
  try {
    const shareMessage = `

Hey! I've been using VYDHYO for booking doctor consultations and other health services, and it's made things much simpler—no waiting, no calls , just direct access to verified doctors and hospitals

Since health matters to all of us, here's my referral link — click it to get started:

https://vydhyo.com/ref/${referralCode}

Referral Code: ${referralCode}

You'll get! ₹${walletConfigs.signupAmount} 𝗢𝗙𝗙 on your first doctor consultation when you sign up through this.

Just a small health treat from me 😊 — use it anytime on your first visit.

If you have any questions or need help booking, happy to help.`;

    await Share.share({
      message: shareMessage,
    });
  } catch (error) {
    Alert.alert(t.copyError, t.copyError);
  }
};



  const handleCopyCode = async () => {
    try {
      await Clipboard.setString(referralCode);
      Alert.alert(t.copySuccess, t.copySuccess);
    } catch (error) {
      Alert.alert(t.copyError, t.copyError);
    }
  };

  const handleGenerate = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');

      if (!storedToken) {
        Alert.alert(t.noAuthToken, t.noAuthToken);
        navigation.navigate('Login' as never);
        return;
      }
      const response: any = await AuthPost(
        ENDPOINTS.GENERATE_REFERRAL_CODE,
        { referralType },
        storedToken,
      );
      console.log('ressss', response);
      if (response?.data?.referralCode) {
        setReferralCode(response?.data?.referralCode);
      } else {
        Alert.alert(
          t.failedGenerateCode,
          response?.data?.message || t.failedGenerateCode,
        );
      }
    } catch (error) {
      Alert.alert(t.somethingWentWrong, t.somethingWentWrong);
    }
  };

  if (showHowItWorks) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setShowHowItWorks(false)}
            style={styles.backButton}
          >
            <Text style={styles.backArrow}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.howReferralWorks}</Text>
        </View>
        <ScrollView
          contentContainerStyle={styles.howItWorksContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Intro */}
          <View style={styles.section}>
            <Text style={styles.howItWorksIntroText}>{t.howItWorksIntro}</Text>
            <Text style={styles.howItWorksSubIntroText}>{t.howItWorksSubIntro}</Text>
          </View>

          {/* How It Works Steps */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.howItWorksTitle}</Text>
            <View style={styles.processItem}>
              <View style={styles.processTextContainer}>
                <Text style={styles.processText}>{t.processStep1}</Text>
              </View>
            </View>
            <View style={styles.processItem}>
              <View style={styles.processTextContainer}>
                <Text style={styles.processText}>{t.processStep2}</Text>
              </View>
            </View>
            <View style={styles.processItem}>
              <View style={styles.processTextContainer}>
                <Text style={styles.processText}>{t.processStep3}</Text>
              </View>
            </View>
            <View style={styles.processItem}>
              <View style={styles.processTextContainer}>
                <Text style={styles.processText}>{t.processStep4}</Text>
              </View>
            </View>
            <View style={styles.processItem}>
              <View style={styles.processTextContainer}>
                <Text style={styles.processText}>{t.processStep5}</Text>
              </View>
            </View>
            <Text style={styles.noLimitsText}>{t.noLimitsLine}</Text>
          </View>

          {/* The Reward */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.theReward}</Text>
            <View style={styles.rewardItem}>
              <View style={styles.processTextContainer}>
                <Text style={styles.rewardText}>{t.reward1}</Text>
              </View>
            </View>
            <View style={styles.rewardItem}>
              <View style={styles.processTextContainer}>
                <Text style={styles.rewardText}>{t.reward2}</Text>
              </View>
            </View>
            <View style={styles.rewardItem}>
              <View style={styles.processTextContainer}>
                <Text style={styles.rewardText}>{t.reward3}</Text>
              </View>
            </View>
            <View style={styles.rewardItem}>
              <View style={styles.processTextContainer}>
                <Text style={styles.rewardText}>{t.reward4}</Text>
              </View>
            </View>
          </View>

          {/* Important Points */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.importantPoints}</Text>
            <View style={styles.termItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.termText}>{t.point1}</Text>
            </View>
            <View style={styles.termItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.termText}>{t.point2}</Text>
            </View>
            <View style={styles.termItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.termText}>{t.point3}</Text>
            </View>
            <View style={styles.termItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.termText}>{t.point4}</Text>
            </View>
            <View style={styles.termItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.termText}>{t.point5}</Text>
            </View>
            <View style={styles.termItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.termText}>{t.point6}</Text>
            </View>
            <View style={styles.termItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.termText}>{t.point7}</Text>
            </View>
            <View style={styles.termItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.termText}>{t.point8}</Text>
            </View>
          </View>

          {/* Safe & Secure */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.safeSecure}</Text>
            <Text style={styles.safePointText}>{t.safePoint1}</Text>
            <Text style={styles.safePointText}>{t.safePoint2}</Text>
            <Text style={styles.safePointText}>{t.safePoint3}</Text>
          </View>

          {/* Help loved ones */}
          <View style={styles.section}>
            <Text style={styles.helpLovedText}>{t.helpLoved}</Text>
          </View>

          {/* Referral code box with microcopy */}
          {referralCode ? (
            <View style={styles.section}>
              <View style={styles.codeContainer}>
                <TextInput
                  style={styles.codeInput}
                  value={referralCode}
                  editable={false}
                />
                <TouchableOpacity
                  onPress={handleCopyCode}
                  style={styles.copyButton}
                >
                  <Text style={styles.copyText}>Copy</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.codeMicrocopyText}>{t.codeMustBeEntered}</Text>
              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Text style={styles.shareButtonText}>{t.shareNow}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{t.referAndEarn}</Text>
          <Text style={styles.headerSubtitle}>{t.headerSubtitle}</Text>
          <Text style={styles.headerSubline}>{t.headerSubline}</Text>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsWrapper}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            {statsLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Text style={styles.statValue}>{formatCurrency(totalEarned)}</Text>
                <Text style={styles.statLabel}>{t.totalEarned}</Text>
              </>
            )}
          </View>
          <View style={styles.statCard}>
            {statsLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Text style={styles.statValue}>{totalInstalled}</Text>
                <Text style={styles.statLabel}>{t.totalInstalled}</Text>
              </>
            )}
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            {statsLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Text style={styles.statValue}>{appliedCount}</Text>
                <Text style={styles.statLabel}>{t.applied}</Text>
              </>
            )}
          </View>
          <View style={styles.statCard}>
            {statsLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Text style={styles.statValue}>{completedCount}</Text>
                <Text style={styles.statLabel}>{t.completed}</Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'referral' && styles.activeTab]}
          onPress={() => setActiveTab('referral')}
        >
          <Text style={[styles.tabText, activeTab === 'referral' && styles.activeTabText]}>
            {t.referralTab}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'list' && styles.activeTab]}
          onPress={() => setActiveTab('list')}
        >
          <Text style={[styles.tabText, activeTab === 'list' && styles.activeTabText]}>
            {t.listTab}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'referral' ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.illustrationContainer}>
            <Image
              source={require('../../assets/refer_illustration.png')}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>

          {/* Main Section */}
          <Text style={styles.mainText}>{t.makeHealthConvenient}</Text>
          <Text style={styles.mainSubText}>{t.referToFriends}</Text>
          <Text style={styles.mainBenefitText}>{t.mainBenefit1}</Text>
          <Text style={styles.mainBenefitText}>{t.mainBenefit2}</Text>
          <Text style={styles.noLimitsText}>{t.noLimits}</Text>

          {/* What They Get */}
          <View style={styles.benefitSection}>
            <Text style={styles.benefitTitle}>{t.whatTheyGet}</Text>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitNumber}>🎁</Text>
              <Text style={styles.benefitText}>{t.theyGetBenefit}</Text>
            </View>
          </View>

          {/* What You Get */}
          <View style={styles.benefitSection}>
            <Text style={styles.benefitTitle}>{t.whatYouGet}</Text>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitNumber}>💰</Text>
              <Text style={styles.benefitText}>{t.youGetBenefit}</Text>
            </View>
          </View>

          {/* Referral Code Section */}
          {referralCode ? (
            <>
              <Text style={styles.yourReferralCodeTitle}>{t.yourReferralCode}</Text>
              <Text style={styles.referralCodeSubtitle}>{t.referralCodeSubtitle}</Text>
              <View style={styles.codeContainer}>
                <TextInput
                  style={styles.codeInput}
                  value={referralCode}
                  editable={false}
                />
                <TouchableOpacity
                  onPress={handleCopyCode}
                  style={styles.copyButton}
                >
                  <Text style={styles.copyText}>Copy</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.codeMicrocopyText}>{t.referralCodeMicrocopy}</Text>

              {/* Every Referral */}
              <View style={styles.everyReferralSection}>
                <Text style={styles.everyReferralTitle}>{t.everyReferral}</Text>
                <Text style={styles.everyReferralDesc}>{t.everyReferralDesc}</Text>
              </View>

              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Text style={styles.shareButtonText}>{t.shareNow}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleGenerate}
            >
              <Text style={styles.generateButtonText}>
                {t.generateReferralCode}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.howItWorksLink}
            onPress={() => setShowHowItWorks(true)}
          >
            <Text style={styles.howItWorksText}>{t.howItWorksLink}</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.listContainer}>
          {/* Filter Tabs */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === 'installed' && styles.activeFilterButton,
              ]}
              onPress={() => setSelectedFilter('installed')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === 'installed' && styles.activeFilterButtonText,
                ]}
              >
                {t.installed}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === 'applied' && styles.activeFilterButtonCompleted,
              ]}
              onPress={() => setSelectedFilter('applied')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === 'applied' && styles.activeFilterButtonTextWhite,
                ]}
              >
                {t.applied}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === 'completed' && styles.activeFilterButtonRewarded,
              ]}
              onPress={() => setSelectedFilter('completed')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === 'completed' && styles.activeFilterButtonTextWhite,
                ]}
              >
                {t.completed}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Referral List */}
          <FlatList
            data={referralList}
            keyExtractor={(item, index) => `${item.referredTo}-${index}`}
            renderItem={({ item }) => (
              <View style={styles.listItem}>
                <View style={styles.listItemHeader}>
                  <Text style={styles.listItemName}>{item.patientName}</Text>
                </View>
                <View style={styles.listItemRow}>
                  <Text style={styles.listItemLabel}>{t.mobile}:</Text>
                  <Text style={styles.listItemValue}>{item.mobile}</Text>
                </View>
              {item?.appointmentDate &&
                <View style={styles.listItemRow}>
                  <Text style={styles.listItemLabel}>{t.appointmentDate}:</Text>
                  <Text style={styles.listItemValue}>
                    {formatDate(item.appointmentDate)}
                  </Text>
                </View>
              }

                <View style={styles.listItemRow}>
                  <Text style={styles.listItemLabel}>{t.rewardAmount}:</Text>
                  <Text style={styles.listItemValue}>₹{item.referralAmount}</Text>
                </View>
                <View style={styles.listItemRow}>
                  <Text style={styles.listItemLabel}>{t.status}:</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(item.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {getStatusLabel(item.status)}
                    </Text>
                  </View>
                </View>
                

                {item.status?.toLowerCase() === 'pending' && (
                  <View style={styles.reminderWrapper}>
                    <TouchableOpacity
                      style={styles.reminderButton}
                      onPress={() => handleSendReminder(item)}
                    >
                      <Text style={styles.reminderButtonText}>📲  {t.sendReminder}</Text>
                    </TouchableOpacity>
                    <Text style={styles.reminderSubtext}>{t.reminderSubtext}</Text>
                  </View>
                )}
              </View>
            )}
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>{t.noData}</Text>
                </View>
              ) : null
            }
            ListFooterComponent={
              loading ? (
                <ActivityIndicator
                  size="small"
                  color="#FFF"
                  style={styles.footerLoader}
                />
              ) : null
            }
            onEndReachedThreshold={0.5}
            contentContainerStyle={styles.listContentContainer}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00203F',
    paddingTop: PLATFORM.STATUS_BAR_HEIGHT,
  },
  scrollContent: {
    paddingBottom: SAFE_AREA.safeBottom + SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  howItWorksContent: {
    paddingBottom: SAFE_AREA.safeBottom + SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  codeInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: LAYOUT.borderRadius.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: '#000',
    marginRight: SPACING.sm,
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
    height: isTablet ? 48 : 44,
  },
  copyButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#E6EEF5',
    borderRadius: LAYOUT.borderRadius.sm,
    height: isTablet ? 48 : 44,
    justifyContent: 'center',
  },
  copyText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    fontWeight: '600',
    color: '#00203F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: '#00203F',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  backArrow: {
    color: '#FFF',
    fontSize: responsiveText(FONT_SIZE.xl),
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: responsiveText(FONT_SIZE.md),
    fontWeight: 'bold',
    marginBottom: 2,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: responsiveText(FONT_SIZE.xs),
    fontWeight: '400',
  },
  radioContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    marginHorizontal: SPACING.sm,
    marginVertical: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  radioTitle: {
    color: '#FFF',
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  radioCircle: {
    width: isTablet ? 24 : 20,
    height: isTablet ? 24 : 20,
    borderRadius: isTablet ? 12 : 10,
    borderWidth: 2,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  radioSelected: {
    width: isTablet ? 14 : 12,
    height: isTablet ? 14 : 12,
    borderRadius: isTablet ? 7 : 6,
    backgroundColor: '#FFF',
  },
  radioLabel: {
    color: '#FFF',
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '500',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  illustration: {
    width: isTablet ? responsiveWidth(50) : responsiveWidth(65),
    height: isTablet ? responsiveHeight(20) : responsiveHeight(18),
  },
  mainText: {
    color: '#FFF',
    fontSize: responsiveText(FONT_SIZE.md),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.xs,
    lineHeight: moderateScale(24),
  },
  benefitSection: {
    marginVertical: SPACING.sm,
  },
  benefitTitle: {
    color: '#FFF',
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A3A5A',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    marginHorizontal: SPACING.sm,
  },
  benefitNumber: {
    color: '#FFF',
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: 'bold',
    marginRight: SPACING.sm,
    backgroundColor: '#00203F',
    width: isTablet ? ICON_SIZE.md : ICON_SIZE.sm,
    height: isTablet ? ICON_SIZE.md : ICON_SIZE.sm,
    borderRadius: isTablet ? ICON_SIZE.md / 2 : ICON_SIZE.sm / 2,
    textAlign: 'center',
    lineHeight: isTablet ? ICON_SIZE.md : ICON_SIZE.sm,
  },
  benefitText: {
    color: '#FFF',
    fontSize: responsiveText(FONT_SIZE.xs),
    flex: 1,
    lineHeight: moderateScale(18),
  },
  shareButton: {
    backgroundColor: '#FFF',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    marginHorizontal: SPACING.sm,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    height: isTablet ? 52 : 48,
    justifyContent: 'center',
  },
  shareButtonText: {
    color: '#00203F',
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: 'bold',
  },
  generateButton: {
    backgroundColor: '#FFF',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    marginHorizontal: SPACING.sm,
    alignItems: 'center',
    marginTop: SPACING.sm,
    height: isTablet ? 52 : 48,
    justifyContent: 'center',
  },
  disabledGenerateButton: {
    opacity: 0.5,
  },
  generateButtonText: {
    color: '#00203F',
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: 'bold',
  },
  howItWorksLink: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  howItWorksText: {
    color: '#AEEED3',
    fontSize: responsiveText(FONT_SIZE.xs),
    textDecorationLine: 'underline',
  },
  section: {
    marginVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: responsiveText(FONT_SIZE.md),
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  processItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  processIcon: {
    fontSize: responsiveText(FONT_SIZE.lg),
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  processTextContainer: {
    flex: 1,
  },
  processText: {
    color: '#FFF',
    fontSize: responsiveText(FONT_SIZE.xs),
    lineHeight: moderateScale(18),
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  rewardIcon: {
    fontSize: responsiveText(FONT_SIZE.lg),
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  rewardText: {
    color: '#FFF',
    fontSize: responsiveText(FONT_SIZE.xs),
    lineHeight: moderateScale(18),
    flex: 1,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  bulletPoint: {
    color: '#FFF',
    fontSize: responsiveText(FONT_SIZE.xs),
    marginRight: SPACING.xs,
    lineHeight: moderateScale(18),
  },
  termText: {
    color: '#FFF',
    fontSize: responsiveText(FONT_SIZE.xs),
    lineHeight: moderateScale(18),
    flex: 1,
  },
  statsWrapper: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A3A5A',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: isTablet ? 80 : 70,
  },
  statValue: {
    color: '#FFF',
    fontSize: responsiveText(FONT_SIZE.xl),
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: responsiveText(FONT_SIZE.xxs),
    fontWeight: '500',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A3A5A',
    marginHorizontal: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.xs,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: LAYOUT.borderRadius.sm,
  },
  activeTab: {
    backgroundColor: '#00203F',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  filterButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderRadius: LAYOUT.borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#FFF',
    borderColor: '#FFF',
  },
  activeFilterButtonCompleted: {
    backgroundColor: '#9E9E9E',
    borderColor: '#9E9E9E',
  },
  activeFilterButtonRewarded: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterButtonText: {
    color: '#FFF',
    fontSize: responsiveText(FONT_SIZE.xs),
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#00203F',
    fontWeight: 'bold',
  },
  activeFilterButtonTextWhite: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  listContentContainer: {
    paddingBottom: SPACING.xl * 3,
    flexGrow: 1,
  },
  listItem: {
    backgroundColor: '#1A3A5A',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  listItemName: {
    color: '#FFF',
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: LAYOUT.borderRadius.sm,
  },
  statusText: {
    color: '#FFF',
    fontSize: responsiveText(FONT_SIZE.xxs),
    fontWeight: 'bold',
  },
  listItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  listItemLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: responsiveText(FONT_SIZE.xs),
  },
  listItemValue: {
    color: '#FFF',
    fontSize: responsiveText(FONT_SIZE.xs),
    fontWeight: '500',
  },
  rewardIssuedBadge: {
    marginTop: SPACING.sm,
    backgroundColor: '#4CAF50',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: LAYOUT.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  rewardIssuedText: {
    color: '#FFF',
    fontSize: responsiveText(FONT_SIZE.xxs),
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 3,
    flex: 1,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: responsiveText(FONT_SIZE.sm),
    textAlign: 'center',
  },
  loader: {
    marginTop: SPACING.xl * 2,
  },
  footerLoader: {
    marginVertical: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  // ---- New styles for updated content ----
  headerSubline: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: responsiveText(FONT_SIZE.xxs),
    fontWeight: '400',
    marginTop: 2,
  },
  howItWorksIntroText: {
    color: '#FFF',
    fontSize: responsiveText(FONT_SIZE.lg),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.sm,
    lineHeight: moderateScale(28),
  },
  howItWorksSubIntroText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: responsiveText(FONT_SIZE.sm),
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: moderateScale(20),
  },
  noLimitsText: {
    color: '#AEEED3',
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: SPACING.md,
  },
  safePointText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: responsiveText(FONT_SIZE.xs),
    lineHeight: moderateScale(20),
    marginBottom: SPACING.xs,
    paddingLeft: SPACING.xs,
  },
  helpLovedText: {
    color: '#AEEED3',
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: moderateScale(20),
  },
  codeMicrocopyText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: responsiveText(FONT_SIZE.xxs),
    textAlign: 'center',
    marginBottom: SPACING.md,
    fontStyle: 'italic',
  },
  mainSubText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: responsiveText(FONT_SIZE.sm),
    textAlign: 'center',
    marginBottom: SPACING.sm,
    lineHeight: moderateScale(20),
  },
  mainBenefitText: {
    color: '#AEEED3',
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.xs,
    lineHeight: moderateScale(20),
  },
  yourReferralCodeTitle: {
    color: '#FFF',
    fontSize: responsiveText(FONT_SIZE.md),
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  referralCodeSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: responsiveText(FONT_SIZE.xs),
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  everyReferralSection: {
    backgroundColor: '#1A3A5A',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    marginHorizontal: SPACING.sm,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  everyReferralTitle: {
    color: '#AEEED3',
    fontSize: responsiveText(FONT_SIZE.md),
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  everyReferralDesc: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: responsiveText(FONT_SIZE.xs),
    textAlign: 'center',
    lineHeight: moderateScale(18),
  },
  // ---- Send Reminder styles ----
  reminderWrapper: {
    marginTop: SPACING.sm,
    alignItems: 'center',
  },
  reminderButton: {
    backgroundColor: '#23b85a',
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: isTablet ? 52 : 46,
  },
  reminderButtonText: {
    color: '#FFF',
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: 'bold',
  },
  reminderSubtext: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: responsiveText(FONT_SIZE.xxs),
    marginTop: SPACING.xs,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ReferAndEarn;