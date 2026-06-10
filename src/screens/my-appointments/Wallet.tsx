import React, { useState, useEffect } from 'react';
import { AuthFetch, UploadFiles, ENDPOINTS } from '../../services';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  ToastAndroid,
  Image,
  Platform,   
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
;
import { RootStackParamList } from '../../navigation/navigationTypes';
import { useSelector } from 'react-redux';
// import { pick, types } from '@react-native-documents/picker';

// Import responsive utilities
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
  isTablet,
  isIOS,
  isAndroid,
  PLATFORM,
  SAFE_AREA,
} from '../../utils/responsive';

interface Transaction {
  _id: string;
  transactionID: string;
  isExpired:boolean;
  amount: number;
  transactionType: 'credit' | 'debit';
  purpose: string;
  description: string;
  currency: string;
  status: string;
  createdAt: number;
}

interface WalletData {
  customerID: string;
  balance: number;
  currency: string;
  transactions?: Transaction[];
}

interface KYCData {
  pan?: {
    number: string;
    verified: boolean;
  };
  panFile?: string;
}

type WalletRouteProp = RouteProp<RootStackParamList, 'Wallet'>;

// Translations for multiple languages
const translations: any = {
  en: {
    myWallet: 'My Wallet',
    kycNotCompleted: 'KYC Not Completed',
    kycWarningSubtitle:
      'To use your wallet, please complete your KYC verification.',
    walletBalance: 'Wallet Balance',
    totalEarnings: 'TOTAL EARNINGS',
    totalRedeemed: 'TOTAL REDEEMED',
    completeKycNow: 'Complete KYC Now',
    goToKycDetails: 'Go to KYC Details',
    whyKycRequired: 'Why is KYC Required?',
    whyKycSubtitle:
      'As per government regulations, KYC is mandatory to prevent fraud and ensure secure wallet transactions.',
    recentTransactions: 'Recent Transactions',
    noTransactionsYet: 'No transactions yet',
    kycDetails: 'KYC Details',
    completeYourKyc: 'Complete Your KYC',
    pancardProof: 'Pancard Proof',
    panNumber: 'PAN Number',
    enterPanNumber: 'Enter 10-character PAN Number',
    acceptedFormats: 'Accepted: PDF, JPG, PNG',
    submitKyc: 'Submit KYC',
    vydhyoAidUnits: 'Vydhyo Aid Units (VU)',
    startUsingWallet: 'Start using your wallet',
    loadingWalletData: 'Loading wallet data...',
    processing: 'Processing...',
    error: 'Error',
    authenticationError:
      'Authentication token or user ID not found. Please log in again.',
    failedFetchWallet: 'Failed to fetch wallet data.',
    tryAgain: 'Please try again.',
    kycCompleted: 'KYC Completed',
    kycCannotEdit: 'Your KYC has already been completed and cannot be edited.',
    uploadPanCard: 'Upload PAN Card',
    chooseOption: 'Choose an option',
    uploadPdf: 'Upload PDF',
    cancel: 'Cancel',
    invalidFile: 'Invalid file selected. Please try again.',
    validPanRequired:
      'Please enter a valid 10-character PAN number (e.g., ABCDE1234F).',
    uploadPancard: 'Please upload a Pancard document.',
    kycSubmitted: 'KYC details submitted successfully',
    kycSkipped: 'KYC details skipped',
    failedSkip: 'Failed to skip. Please try again.',
    kycFailed: 'Failed to submit KYC details. Please try again.',
    serverError:
      'Failed to submit KYC details due to a server error. Please try again.',
    whyKycAlertTitle: 'Why is KYC Required?',
    whyKycAlertMessage:
      'As per government regulations, KYC is mandatory to prevent fraud and ensure secure wallet transactions.',
  },
  hi: {
    myWallet: 'मेरा वॉलेट',
    kycNotCompleted: 'KYC पूरा नहीं हुआ',
    kycWarningSubtitle:
      'अपने वॉलेट का उपयोग करने के लिए, कृपया अपनी KYC सत्यापन पूरी करें।',
    walletBalance: 'वॉलेट बैलेंस',
    totalEarnings: 'कुल कमाई',
    totalRedeemed: 'कुल रिडीम किया गया',
    completeKycNow: 'अभी KYC पूरी करें',
    goToKycDetails: 'KYC विवरण पर जाएं',
    whyKycRequired: 'KYC क्यों आवश्यक है?',
    whyKycSubtitle:
      'सरकारी नियमों के अनुसार, धोखाधड़ी को रोकने और सुरक्षित वॉलेट लेनदेन सुनिश्चित करने के लिए KYC अनिवार्य है।',
    recentTransactions: 'हाल के लेनदेन',
    noTransactionsYet: 'अभी तक कोई लेनदेन नहीं',
    kycDetails: 'KYC विवरण',
    completeYourKyc: 'अपनी KYC पूरी करें',
    pancardProof: 'पैनकार्ड प्रूफ',
    panNumber: 'PAN नंबर',
    enterPanNumber: '10-अक्षर का PAN नंबर दर्ज करें',
    acceptedFormats: 'स्वीकृत: PDF, JPG, PNG',
    submitKyc: 'KYC जमा करें',
    vydhyoAidUnits: 'व्याध्यो एड यूनिट्स (VU)',
    startUsingWallet: 'अपने वॉलेट का उपयोग शुरू करें',
    loadingWalletData: 'वॉलेट डेटा लोड हो रहा है...',
    processing: 'प्रसंस्करण...',
    error: 'त्रुटि',
    authenticationError:
      'प्रमाणीकरण टोकन या उपयोगकर्ता आईडी नहीं मिला। कृपया फिर से लॉग इन करें।',
    failedFetchWallet: 'वॉलेट डेटा प्राप्त करने में विफल।',
    tryAgain: 'कृपया पुनः प्रयास करें।',
    kycCompleted: 'KYC पूर्ण',
    kycCannotEdit:
      'आपकी KYC पहले ही पूरी हो चुकी है और इसे संपादित नहीं किया जा सकता।',
    uploadPanCard: 'PAN कार्ड अपलोड करें',
    chooseOption: 'एक विकल्प चुनें',
    uploadPdf: 'PDF अपलोड करें',
    cancel: 'रद्द करें',
    invalidFile: 'अमान्य फ़ाइल चयनित। कृपया पुनः प्रयास करें।',
    validPanRequired:
      'कृपया एक वैध 10-अक्षर का PAN नंबर दर्ज करें (जैसे, ABCDE1234F)।',
    uploadPancard: 'कृपया एक पैनकार्ड दस्तावेज़ अपलोड करें।',
    kycSubmitted: 'KYC विवरण सफलतापूर्वक जमा किए गए',
    kycSkipped: 'KYC विवरण छोड़ दिए गए',
    failedSkip: 'छोड़ने में विफल। कृपया पुनः प्रयास करें।',
    kycFailed: 'KYC विवरण जमा करने में विफल। कृपया पुनः प्रयास करें।',
    serverError:
      'सर्वर त्रुटि के कारण KYC विवरण जमा करने में विफल। कृपया पुनः प्रयास करें।',
    whyKycAlertTitle: 'KYC क्यों आवश्यक है?',
    whyKycAlertMessage:
      'सरकारी नियमों के अनुसार, धोखाधड़ी को रोकने और सुरक्षित वॉलेट लेनदेन सुनिश्चित करने के लिए KYC अनिवार्य है।',
  },
  tel: {
    myWallet: 'నా వాలెట్',
    kycNotCompleted: 'KYC పూర్తి కాలేదు',
    kycWarningSubtitle:
      'మీ వాలెట్ ఉపయోగించడానికి, దయచేసి మీ KYC ధృవీకరణను పూర్తి చేయండి.',
    walletBalance: 'వాలెట్ బ్యాలెన్స్',
    totalEarnings: 'మొత్తం ఆదాయం',
    totalRedeemed: 'మొత్తం రిడీమ్ చేయబడింది',
    completeKycNow: 'ఇప్పుడే KYC పూర్తి చేయండి',
    goToKycDetails: 'KYC వివరాలకు వెళ్లండి',
    whyKycRequired: 'KYC ఎందుకు అవసరం?',
    whyKycSubtitle:
      'ప్రభుత్వ నిబంధనల ప్రకారం, మోసాన్ని నివారించడానికి మరియు సురక్షిత వాలెట్ లావాదేవీలను నిర్ధారించడానికి KYC తప్పనిసరి.',
    recentTransactions: 'ఇటీవలి లావాదేవీలు',
    noTransactionsYet: 'ఇంకా లావాదేవీలు లేవు',
    kycDetails: 'KYC వివరాలు',
    completeYourKyc: 'మీ KYC పూర్తి చేయండి',
    pancardProof: 'పాన్కార్డ్ రుజువు',
    panNumber: 'PAN నంబర్',
    enterPanNumber: '10-అక్షరాల PAN నంబర్ నమోదు చేయండి',
    acceptedFormats: 'ఆమోదించబడినవి: PDF, JPG, PNG',
    submitKyc: 'KYC సమర్పించండి',
    vydhyoAidUnits: 'వ్యాధ్యో ఎయిడ్ యూనిట్స్ (VU)',
    startUsingWallet: 'మీ వాలెట్ ఉపయోగించడం ప్రారంభించండి',
    loadingWalletData: 'వాలెట్ డేటా లోడ్ అవుతోంది...',
    processing: 'ప్రాసెసింగ్...',
    error: 'లోపం',
    authenticationError:
      'ఆధిక్షణ టోకన్ లేదా యూజర్ ID దొరకలేదు. దయచేసి మళ్లీ లాగిన్ అవ్వండి.',
    failedFetchWallet: 'వాలెట్ డేటా పొందడంలో విఫలమైంది.',
    tryAgain: 'దయచేసి మళ్లీ ప్రయత్నించండి.',
    kycCompleted: 'KYC పూర్తయింది',
    kycCannotEdit: 'మీ KYC ఇప్పటికే పూర్తయింది మరియు దీన్ని సవరించలేరు.',
    uploadPanCard: 'PAN కార్డ్ అప్లోడ్ చేయండి',
    chooseOption: 'ఒక ఎంపికను ఎంచుకోండి',
    uploadPdf: 'PDF అప్లోడ్ చేయండి',
    cancel: 'రద్దు చేయండి',
    invalidFile: 'చెల్లని ఫైల్ ఎంపిక చేయబడింది. దయచేసి మళ్లీ ప్రయత్నించండి.',
    validPanRequired:
      'దయచేసి చెల్లుబాటు అయ్యే 10-అక్షరాల PAN నంబర్ నమోదు చేయండి (ఉదా., ABCDE1234F).',
    uploadPancard: 'దయచేసి పాన్కార్డ్ డాక్యుమెంట్ అప్లోడ్ చేయండి.',
    kycSubmitted: 'KYC వివరాలు విజయవంతంగా సమర్పించబడ్డాయి',
    kycSkipped: 'KYC వివరాలు దాటవేయబడ్డాయి',
    failedSkip: 'దాటవేయడంలో విఫలమైంది. దయచేసి మళ్లీ ప్రయత్నించండి.',
    kycFailed:
      'KYC వివరాలు సమర్పించడంలో విఫలమైంది. దయచేసి మళ్లీ ప్రయత్నించండి.',
    serverError:
      'సర్వర్ లోపం కారణంగా KYC వివరాలు సమర్పించడంలో విఫలమైంది. దయచేసి మళ్లీ ప్రయత్నించండి.',
    whyKycAlertTitle: 'KYC ఎందుకు అవసరం?',
    whyKycAlertMessage:
      'ప్రభుత్వ నిబంధనల ప్రకారం, మోసాన్ని నివారించడానికి మరియు సురక్షిత వాలెట్ లావాదేవీలను నిర్ధారించడానికి KYC తప్పనిసరి.',
  },
};

const Wallet: React.FC<{ route: WalletRouteProp }> = ({ route }) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const currentuserDetails = useSelector((state: any) => state.currentUser);
  const userWallet = useSelector((s: any) => s.userWallet);
  
  const appLanguage = currentuserDetails?.appLanguage || 'en';
  const t = translations[appLanguage] || translations.en;
  const [token, setToken] = useState<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState('wallet');
  const [panImage, setPanImage] = useState<{
    uri: string;
    name: string;
    type?: string;
  } | null>(null);
  const [pancardUploaded, setPancardUploaded] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [panNumber, setPanNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kycCompleted, setKycCompleted] = useState(false);
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const userId = currentuserDetails?.userId;
  const { doctor, date, time, patient, amount } = route.params || {};

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Info', message);
    }
  };

  useEffect(() => {
    const fetchWalletData = async () => {
      setIsLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('authToken');

      if (!token || !userId) {
        setIsLoading(false);
        return;
      }

      try {
        setToken(token);
        const response = await AuthFetch(ENDPOINTS.GET_FINANCE(userId), token);
        console.log('Wallet data response:', response);
        if (response.status === 'success') {
          setWalletData({
            ...response?.data?.data,
            transactions: response?.data?.data?.transactions || [],
          });
        } else {
          console.error(
            'Failed to fetch wallet data:',
            response?.data?.message,
          );
          setError(response?.data?.message || t.failedFetchWallet);
          Alert.alert(t.error, response?.data?.message || t.failedFetchWallet);
        }
      } catch (error: any) {
        console.error('Error fetching wallet data:', error.message);
        setError(t.failedFetchWallet + ' ' + t.tryAgain);
        Alert.alert(t.error, t.failedFetchWallet + ' ' + t.tryAgain);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchKycData = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token || !userId) {
          return;
        }
        setToken(token);

        const response = await AuthFetch(ENDPOINTS.GET_KYC_BY_USER_ID, token);
        console.log('KYC data response:', response);
        if (response?.data?.status === 'success') {
          const userData = response?.data?.data;
          console.log('userData', userData);

          if (userData?.pan?.number) {
            setPanNumber(userData.pan.number);
            setKycCompleted(true);
          }

          if (userData?.panFile) {
            const fileExtension = userData.panFile
              .split('.')
              .pop()
              ?.toLowerCase();
            const fileType =
              fileExtension === 'pdf' ? 'application/pdf' : 'image/jpeg';
            setPanImage({
              uri: userData.panFile,
              name: `pan.${fileExtension}`,
              type: fileType,
            });
            setPancardUploaded(true);
          }

          if (userData?.pan?.verified) {
            setKycCompleted(true);
          }

          setKycData(userData);
        }
      } catch (error: any) {
        console.error('Error fetching KYC data:', error.message);
        showToast(t.failedFetchWallet);
      }
    };

    fetchWalletData();
    fetchKycData();
  }, [userId, navigation]);

  const handleCompleteKYC = () => {
    setCurrentScreen('kyc');
  };

  const handleGoBack = () => {
    if (currentScreen === 'kyc' || currentScreen === 'vydhyo') {
      setCurrentScreen('wallet');
    } else {
      navigation.navigate('Home');
    }
  };

  const handleWhyKYC = () => {
    Alert.alert(t.whyKycAlertTitle, t.whyKycAlertMessage);
  };

  const handlePancardUpload = async () => {
    if (kycCompleted) {
      Alert.alert(t.kycCompleted, t.kycCannotEdit);
      return;
    }

    Alert.alert(
      t.uploadPanCard,
      t.chooseOption,
      [
        {
          text: t.uploadPdf,
          onPress: async () => {
            try {
              const [res] = await pick({
                type: [types.pdf, types.images],
              });
              if (res && res.uri && res.name) {
                setPanImage({
                  uri: res.uri,
                  name: res.name,
                  type:
                    res.type ||
                    (res.name.endsWith('.pdf')
                      ? 'application/pdf'
                      : 'image/jpeg'),
                });
                setPancardUploaded(true);
              } else {
                Alert.alert(t.error, t.invalidFile);
              }
            } catch (error: any) {
              console.error('PDF selection error:', error.message);
              Alert.alert(t.error, t.invalidFile);
            }
          },
        },
        {
          text: t.cancel,
          style: 'cancel',
        },
      ],
      { cancelable: true },
    );
  };

  const validatePanNumber = (number: string) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(number);
  };

  const handleKYCSubmit = async () => {
    if (kycCompleted) {
      Alert.alert(t.kycCompleted, t.kycCannotEdit);
      return;
    }

    if (!panNumber && !pancardUploaded) {
      try {
        setLoading(true);
        await AsyncStorage.setItem('currentStep', 'ConfirmationScreen');
        showToast(t.kycSkipped);
        navigation.navigate('ConfirmationScreen');
      } catch (error: any) {
        console.error('Error skipping KYC details:', error.message);
        showToast(t.failedSkip);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!panNumber || !validatePanNumber(panNumber)) {
      Alert.alert(t.error, t.validPanRequired);
      return;
    }

    if (!panImage?.uri) {
      Alert.alert(t.error, t.uploadPancard);
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const userId = await AsyncStorage.getItem('userId');
      if (!token || !userId) {
        Alert.alert(t.error, t.authenticationError);
        return;
      }
      if (!userId) {
        Alert.alert(t.error, t.authenticationError);
        return;
      }

      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('panNumber', panNumber);
      formData.append('panFile', {
        uri: panImage.uri,
        name: panImage.name,
        type:
          panImage.type ||
          (panImage.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
      } as any);

      console.log('Submitting KYC FormData:', {
        userId,
        panNumber,
        panFile: {
          uri: panImage.uri,
          name: panImage.name,
          type: panImage.type,
        },
      });

      const response = await UploadFiles(
        ENDPOINTS.ADD_KYC_DETAILS,
        formData,
        token,
      );
      console.log('KYC submission response:', response);

      if (response.status === 'success') {
        showToast(t.kycSubmitted);
        setKycCompleted(true);
        setTimeout(async () => {
          await AsyncStorage.setItem('currentStep', 'ConfirmationScreen');
          setCurrentScreen('vydhyo');
        }, 2000);
      } else {
        console.error('KYC submission failed:', response?.message);
        Alert.alert(t.error, response?.message?.error || t.kycFailed);
      }
    } catch (error: any) {
      console.error(
        'KYC submission error:',
        error.message,
        error.response?.data,
      );
      const errorMessage =
        error?.response?.data?.message || error?.message || t.serverError;
      Alert.alert(t.error, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const totalEarnings =
    walletData?.transactions
      ?.filter(t => t.transactionType === 'credit' && !t.isExpired )
      ?.reduce((sum, t) => sum + t.amount, 0) || 0;
  const totalRedeemed =
    walletData?.transactions
      ?.filter(t => t.transactionType === 'debit' && !t.isExpired)
      ?.reduce((sum, t) => sum + t.amount, 0) || 0;
  
      const totalUsableAmt = userWallet?.balance || 0;

  if (currentScreen === 'wallet') {
    return (
      <SafeAreaView style={styles.container}>
      

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#00203F" />
              <Text style={styles.loadingText}>{t.loadingWalletData}</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <>
              {/* {(!kycCompleted && token) && (
                <View style={styles.kycWarning}>
                  <Text style={styles.lockIcon}>🔒</Text>
                  <View style={styles.kycWarningText}>
                    <Text style={styles.kycWarningTitle}>
                      {t.kycNotCompleted}
                    </Text>
                    <Text style={styles.kycWarningSubtitle}>
                      {t.kycWarningSubtitle}
                    </Text>
                  </View>
                </View>
              )} */}

              <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>{t.walletBalance}</Text>
                <Text style={styles.balanceAmount}>
                  {walletData
                    ? `${totalUsableAmt} ${userWallet?.currency}`
                    : '0 INR'}
                </Text>
                <View style={styles.balanceDetails}>
                  <View style={styles.balanceItem}>
                    <Text style={styles.balanceValue}>
                      {totalEarnings} {walletData?.currency || 'INR'}
                    </Text>
                    <Text style={styles.balanceType}>{t.totalEarnings}</Text>
                  </View>
                  <View style={styles.balanceItem}>
                    <Text style={styles.balanceValue}>
                      {totalRedeemed} {walletData?.currency || 'INR'}
                    </Text>
                    <Text style={styles.balanceType}>{t.totalRedeemed}</Text>
                  </View>
                </View>
              </View>

              {/* {token && (
                <>
                  <TouchableOpacity
                    style={styles.kycButton}
                    onPress={handleCompleteKYC}
                  >
                    <Text style={styles.kycButtonText}>
                      {kycCompleted ? t.goToKycDetails : t.completeKycNow}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.whyKycContainer}
                    onPress={handleWhyKYC}
                  >
                    <Text style={styles.infoIcon}>ℹ️</Text>
                    <View style={styles.whyKycText}>
                      <Text style={styles.whyKycTitle}>{t.whyKycRequired}</Text>
                      <Text style={styles.whyKycSubtitle}>
                        {t.whyKycSubtitle}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </>
              )} */}

              <View style={styles.transactionsContainer}>
                <Text style={styles.transactionsTitle}>
                  {t.recentTransactions}
                </Text>
                {!walletData ||
                !walletData.transactions ||
                walletData.transactions.length === 0 ? (
                  <View style={styles.noTransactions}>
                    <Text style={styles.documentIcon}>📄</Text>
                    <Text style={styles.noTransactionsText}>
                      {t.noTransactionsYet}
                    </Text>
                    
                    <Text style={styles.noTransactionsSubtext}>
                      {kycCompleted
                        ? 'Your transactions will appear here'
                        : t.startUsingWallet}
                    </Text>
                  </View>
                ) : (
                  walletData.transactions.map(transaction => (
                    <View key={transaction._id} style={styles.transactionItem}>
                      <View style={styles.transactionIconContainer}>
                        <Text style={styles.transactionIcon}>
                          {transaction.transactionType === 'credit' ? '↑' : '↓'}
                        </Text>
                      </View>
                      <View style={styles.transactionDetails}>
                        <Text style={styles.transactionDescription}>
                          {transaction.description}
                        </Text>
                       
                        
                        <Text style={styles.transactionDate}>
                          {new Date(transaction.createdAt).toLocaleDateString(
                            'en-IN',
                            {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            },
                          )}
                        </Text>
                         {transaction?.isExpired&&(
                          <Text style={styles.transactionExpiredDescription}>
                          Expired
                        </Text>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.transactionAmount,
                          transaction.transactionType === 'credit'
                            ? styles.creditAmount
                            : styles.debitAmount,
                        ]}
                      >
                        {transaction.transactionType === 'credit' ? '+' : '-'}
                        {transaction.amount} {transaction.currency}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (currentScreen === 'kyc') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
        {loading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="small" color="#00203F" />
            <Text style={styles.loaderText}>{t.processing}</Text>
          </View>
        )}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>
              {kycCompleted ? t.kycDetails : t.completeYourKyc}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.kycScrollContent}
          contentContainerStyle={styles.kycScrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.label}>{t.pancardProof}</Text>
            <TouchableOpacity
              style={[styles.uploadBox, kycCompleted && styles.disabledInput]}
              onPress={handlePancardUpload}
              disabled={kycCompleted}
            >
              <View style={styles.uploadInner}>
                {panImage ? (
                  <>
                    {/^image\//.test(panImage?.type || '') ? (
                      <Image
                        source={{ uri: panImage?.uri || panImage?.path }}
                        style={styles.previewImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={styles.fileEmoji}>📄</Text>
                    )}

                    <Text
                      style={styles.uploadedText}
                      numberOfLines={1}
                      ellipsizeMode="middle"
                    >
                      PAN document uploaded
                      {panImage?.name ? `: ${panImage.name}` : ''}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.imageText}>📎</Text>
                    <Text style={styles.uploadText}>{t.uploadPdf}</Text>
                    <Text style={styles.acceptedText}>{t.acceptedFormats}</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            <Text style={styles.label}>{t.panNumber}</Text>
            <TextInput
              style={[styles.input, kycCompleted && styles.disabledInput]}
              value={panNumber}
              onChangeText={text =>
                !kycCompleted && setPanNumber(text.toUpperCase())
              }
              placeholder={t.enterPanNumber}
              placeholderTextColor="#666"
              keyboardType="default"
              maxLength={10}
              autoCapitalize="characters"
              editable={!kycCompleted}
            />
          </View>

          {!kycCompleted && (
            <TouchableOpacity
              style={[styles.nextButton, loading && styles.disabledButton]}
              onPress={handleKYCSubmit}
              disabled={loading}
            >
              <Text style={styles.nextText}>{t.submitKyc}</Text>
            </TouchableOpacity>
          )}
          <View style={styles.spacer} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (currentScreen === 'vydhyo') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
        {loading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="small" color="#00203F" />
            <Text style={styles.loaderText}>{t.processing}</Text>
          </View>
        )}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{t.vydhyoAidUnits}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#00203F" />
              <Text style={styles.loadingText}>{t.loadingWalletData}</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <>
              <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>{t.walletBalance}</Text>
                <Text style={styles.balanceAmount}>
                  {walletData
                    ? `${walletData.balance} ${walletData.currency}`
                    : ''}
                </Text>
                <View style={styles.balanceDetails}>
                  <View style={styles.balanceItem}>
                    <Text style={styles.balanceValue}>
                      {totalEarnings} {walletData?.currency || 'INR'}
                    </Text>
                    <Text style={styles.balanceType}>{t.totalEarnings}</Text>
                  </View>
                  <View style={styles.balanceItem}>
                    <Text style={styles.balanceValue}>
                      {totalRedeemed} {walletData?.currency || 'INR'}
                    </Text>
                    <Text style={styles.balanceType}>{t.totalRedeemed}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.transactionsContainer}>
                <Text style={styles.transactionsTitle}>
                  {t.recentTransactions}
                </Text>
                {!walletData ||
                !walletData.transactions ||
                walletData.transactions.length === 0 ? (
                  <View style={styles.noTransactions}>
                    <Text style={styles.documentIcon}>📄</Text>
                    <Text style={styles.noTransactionsText}>
                      {t.noTransactionsYet}
                    </Text>
                    <Text style={styles.noTransactionsSubtext}>
                      {t.startUsingWallet}
                    </Text>
                  </View>
                ) : (
                  walletData.transactions.map(transaction => (
                    <View key={transaction._id} style={styles.transactionItem}>
                      <View style={styles.transactionIconContainer}>
                        <Text style={styles.transactionIcon}>
                          {transaction.transactionType === 'credit' ? '↑' : '↓'}
                        </Text>
                      </View>
                      <View style={styles.transactionDetails}>
                        <Text style={styles.transactionDescription}>
                          {transaction.description}
                        </Text>
                        <Text style={styles.transactionDate}>
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.transactionAmount,
                          transaction.transactionType === 'credit'
                            ? styles.creditAmount
                            : styles.debitAmount,
                        ]}
                      >
                        {transaction.transactionType === 'credit' ? '+' : '-'}
                        {transaction.amount} {transaction.currency}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: isTablet ? SPACING.md : SPACING.sm,
    backgroundColor: '#00203F',
    paddingTop: PLATFORM.STATUS_BAR_HEIGHT + (isTablet ? SPACING.md : SPACING.sm),
    ...LAYOUT.shadow.sm,
  },
  backButton: {
    width: isTablet ? ICON_SIZE.md : ICON_SIZE.sm,
    height: isTablet ? ICON_SIZE.md : ICON_SIZE.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: responsiveText(isTablet ? FONT_SIZE.lg : FONT_SIZE.md),
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  backText: {
    color: '#fff',
    fontSize: responsiveText(isTablet ? FONT_SIZE.xl : FONT_SIZE.lg),
    fontWeight: isIOS ? '300' : '400',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: SPACING.md,
    paddingBottom: SAFE_AREA.safeBottom + SPACING.md,
  },
  kycScrollContent: {
    flex: 1,
  },
  kycScrollContentContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SAFE_AREA.safeBottom + SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    minHeight: responsiveSafeHeight(50),
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    minHeight: responsiveSafeHeight(50),
  },
  errorText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#D32F2F',
    textAlign: 'center',
    lineHeight: moderateScale(18),
  },
  kycWarning: {
    flexDirection: 'row',
    backgroundColor: '#FFF2F2',
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#FFE5E5',
    alignItems: 'flex-start',
  },
  lockIcon: {
    fontSize: responsiveText(FONT_SIZE.md),
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  kycWarningText: {
    flex: 1,
  },
  kycWarningTitle: {
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
    color: '#D32F2F',
    marginBottom: 4,
  },
  kycWarningSubtitle: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#666666',
    lineHeight: moderateScale(16),
  },
  balanceCard: {
    backgroundColor: '#1A365D',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: isTablet ? SPACING.lg : SPACING.md,
    marginBottom: SPACING.md,
    ...LAYOUT.shadow.md,
  },
  balanceLabel: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  balanceAmount: {
    fontSize: responsiveText(isTablet ? FONT_SIZE.xl : FONT_SIZE.lg),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: isTablet ? SPACING.lg : SPACING.md,
    textAlign: 'center',
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  balanceItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.md,
    padding: isTablet ? SPACING.md : SPACING.sm,
    alignItems: 'center',
    ...LAYOUT.shadow.xs,
  },
  balanceValue: {
    fontSize: responsiveText(isTablet ? FONT_SIZE.md : FONT_SIZE.sm),
    fontWeight: '600',
    color: '#1A365D',
    marginBottom: 2,
  },
  balanceType: {
    fontSize: responsiveText(FONT_SIZE.xxs),
    color: '#666666',
    fontWeight: '500',
    textAlign: 'center',
  },
  kycButton: {
    backgroundColor: '#00203F',
    borderRadius: LAYOUT.borderRadius.md,
    padding: isTablet ? SPACING.md : SPACING.sm,
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...LAYOUT.shadow.sm,
  },
  kycButtonText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  whyKycContainer: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    marginBottom: SPACING.md,
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: responsiveText(FONT_SIZE.md),
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  whyKycText: {
    flex: 1,
  },
  whyKycTitle: {
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 4,
  },
  whyKycSubtitle: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#666666',
    lineHeight: moderateScale(16),
  },
  transactionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...LAYOUT.shadow.xs,
  },
  transactionsTitle: {
    fontSize: responsiveText(FONT_SIZE.md),
    fontWeight: '600',
    color: '#333333',
    marginBottom: SPACING.sm,
  },
  noTransactions: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  documentIcon: {
    fontSize: responsiveText(ICON_SIZE.lg),
    marginBottom: SPACING.sm,
    opacity: 0.3,
  },
  noTransactionsText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '500',
    color: '#999999',
    marginBottom: SPACING.xs,
  },
  noTransactionsSubtext: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#CCCCCC',
    textAlign: 'center',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  transactionIconContainer: {
    width: isTablet ? ICON_SIZE.md : ICON_SIZE.sm,
    height: isTablet ? ICON_SIZE.md : ICON_SIZE.sm,
    borderRadius: isTablet ? 20 : 16,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  transactionIcon: {
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: responsiveText(FONT_SIZE.xs),
    fontWeight: '500',
    color: '#333333',
    marginBottom: 2,
  },
  transactionExpiredDescription:{
    fontSize: responsiveText(FONT_SIZE.xs),
    fontWeight: '500',
    color: 'red',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: responsiveText(FONT_SIZE.xxs),
    color: '#999999',
  },
  transactionAmount: {
    fontSize: responsiveText(FONT_SIZE.xs),
    fontWeight: '600',
  },
  creditAmount: {
    color: '#22C55E',
  },
  debitAmount: {
    color: '#D32F2F',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...LAYOUT.shadow.xs,
  },
  label: {
    fontSize: responsiveText(FONT_SIZE.sm),
    marginBottom: SPACING.xs,
    color: '#000',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: LAYOUT.borderRadius.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    fontSize: responsiveText(FONT_SIZE.sm),
    marginBottom: SPACING.md,
    color: '#333',
    height: isTablet ? verticalScale(44) : verticalScale(40),
  },
  disabledInput: {
    opacity: 0.6,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: SPACING.sm,
    ...LAYOUT.shadow.xs,
  },
  uploadInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
    width: '100%',
  },
  imageText: {
    fontSize: responsiveText(ICON_SIZE.md),
    fontWeight: 'bold',
    color: '#00203F',
    marginBottom: SPACING.xs,
  },
  uploadText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#00203F',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 2,
  },
  acceptedText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  uploadedText: {
    marginTop: SPACING.xs,
    fontSize: responsiveText(FONT_SIZE.xs),
    fontWeight: '600',
    color: '#0C1B1F',
    textAlign: 'center',
    maxWidth: '96%',
  },
  fileEmoji: {
    fontSize: responsiveText(ICON_SIZE.md),
    marginBottom: SPACING.xs,
  },
  previewImage: {
    width: '100%',
    height: isTablet ? verticalScale(120) : verticalScale(80),
    borderRadius: LAYOUT.borderRadius.sm,
    marginBottom: SPACING.xs,
  },
  nextButton: {
    backgroundColor: '#00203F',
    paddingVertical: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...LAYOUT.shadow.sm,
    height: isTablet ? verticalScale(48) : verticalScale(42),
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  nextText: {
    color: '#fff',
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
  },
  spacer: {
    height: SAFE_AREA.safeBottom,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loaderText: {
    color: '#fff',
    fontSize: responsiveText(FONT_SIZE.sm),
    marginTop: SPACING.sm,
  },
});

export default Wallet;