import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated,
  Share,
  Modal,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/navigationTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import RNFS from 'react-native-fs';
import {
  getCategoryById,
  getOfferingById,
  getProviderById,
} from '../../../data/mockHomeServices';
import { HS_COLORS, hsStyles } from '../homeServiceTheme';
import { SPACING, LAYOUT, moderateScale, scale, verticalScale } from '../../../utils/responsive';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

type RouteProps = RouteProp<RootStackParamList, 'HomeServiceBookingConfirmation'>;
type NavProps = StackNavigationProp<RootStackParamList>;

const HomeServiceBookingConfirmation: React.FC = () => {
  const navigation = useNavigation<NavProps>();
  const route = useRoute<RouteProps>();
  const currentUser = useSelector((state: any) => state.currentUser);
  const lang = currentUser?.appLanguage || 'en';

  const params = route.params || {};

  const [isLoading, setIsLoading] = useState(true);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  // Download animation states
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  // Translations
  const t = {
    en: {
      title: 'Booking Confirmed!',
      subtitle: 'Your care professional has been assigned.',
      bookingId: 'Booking ID',
      transactionId: 'Transaction ID',
      provider: 'Care Provider',
      service: 'Service',
      duration: 'Duration',
      patientName: 'Patient Name',
      dateSlot: 'Date & Time',
      address: 'Address',
      summary: 'Payment Invoice',
      fee: 'Service Fee',
      platformFee: 'Platform Fee',
      discount: 'Discount Applied',
      totalPaid: 'Amount Paid',
      paymentMethod: 'Payment Method',
      status: 'Status',
      paid: 'Paid',
      whatsNext: 'What\'s next?',
      step1: 'You will receive a phone confirmation 30 mins before.',
      step2: 'Keep your clinical records ready for reference.',
      share: 'Share',
      save: 'Save File',
      download: 'Download PDF',
      backHome: 'Back to Home',
      viewBookings: 'Go to My Appointments',
    },
    hi: {
      title: 'बुकिंग की पुष्टि हो गई!',
      subtitle: 'आपके देखभाल पेशेवर को नियुक्त कर दिया गया है।',
      bookingId: 'बुकिंग आईडी',
      transactionId: 'लेनदेन आईडी',
      provider: 'देखभाल प्रदाता',
      service: 'सेवा',
      duration: 'अवधि',
      patientName: 'मरीज का नाम',
      dateSlot: 'दिनांक और समय',
      address: 'पता',
      summary: 'भुगतान चालान',
      fee: 'सेवा शुल्क',
      platformFee: 'प्लेटफॉर्म शुल्क',
      discount: 'लागू छूट',
      totalPaid: 'भुगतान की गई राशि',
      paymentMethod: 'भुगतान का प्रकार',
      status: 'स्थिति',
      paid: 'भुगतान संपन्न',
      whatsNext: 'आगे क्या है?',
      step1: 'आपको 30 मिनट पहले फोन पर पुष्टि मिलेगी।',
      step2: 'संदर्भ के लिए अपने नैदानिक ​​दस्तावेज तैयार रखें।',
      share: 'साझा करें',
      save: 'फ़ाइल सहेजें',
      download: 'पीडीएफ डाउनलोड',
      backHome: 'होम पर वापस जाएं',
      viewBookings: 'मेरे अपॉइंटमेंट्स',
    },
    tel: {
      title: 'బుకింగ్ ఖరారైంది!',
      subtitle: 'మీ కేర్ ప్రొఫెషనల్ కేటాయించబడ్డారు.',
      bookingId: 'బుకింగ్ ఐడీ',
      transactionId: 'ట్రాన్సాక్షన్ ఐడీ',
      provider: 'సేవా ప్రదాత',
      service: 'సేవ',
      duration: 'సమయం',
      patientName: 'రోగి పేరు',
      dateSlot: 'తేదీ & సమయం',
      address: 'చిరునామా',
      summary: 'చెల్లింపు ఇన్వాయిస్',
      fee: 'సేవా రుసుము',
      platformFee: 'ప్లాట్‌ఫారమ్ రుసుము',
      discount: 'డిస్కౌంట్ వర్తించబడింది',
      totalPaid: 'చెల్లించిన మొత్తం',
      paymentMethod: 'చెల్లింపు పద్ధతి',
      status: 'స్థితి',
      paid: 'చెల్లించబడింది',
      whatsNext: 'తదుపరి ఏమిటి?',
      step1: 'మీకు 30 నిమిషాల ముందు ఫోన్ ద్వారా నిర్ధారణ వస్తుంది.',
      step2: 'రిఫరెన్స్ కోసం మీ మెడికల్ రిపోర్ట్లను సిద్ధంగా ఉంచండి.',
      share: 'షేర్ చేయండి',
      save: 'సేవ్ చేయండి',
      download: 'పీడీఎఫ్ డౌన్లోడ్',
      backHome: 'హోమ్‌కు వెళ్లండి',
      viewBookings: 'నా అపాయింట్‌మెంట్‌లు',
    }
  }[lang === 'hi' || lang === 'tel' ? lang : 'en'];

  useEffect(() => {
    const loadDetails = async () => {
      try {
        setIsLoading(true);
        let details: any = {};

        // 1. Try to load from navigation params first
        if (params.categoryId && params.providerId && params.serviceId) {
          const provider = getProviderById(params.providerId);
          const service = getOfferingById(params.serviceId);
          const category = getCategoryById(params.categoryId);

          details = {
            bookingId: params.orderID || `HS-${Math.floor(100000 + Math.random() * 900000)}`,
            providerName: provider?.name || 'Care Professional',
            businessName: provider?.businessName || 'Vydhyo Home Care',
            categoryEmoji: category?.emoji || '🏠',
            categoryName: category?.name || 'Home Visit',
            serviceName: service?.name || 'Physio/Nurse Therapy',
            duration: service?.duration || '45 mins',
            date: params.date || new Date().toISOString().split('T')[0],
            time: params.time || '10:00 AM',
            patientName: params.patient ? `${params.patient.firstname} ${params.patient.lastname || ''}`.trim() : 'Patient',
            address: params.address ?
              (typeof params.address === 'string' ? params.address :
                `${params.address.building || ''}, ${params.address.street || ''}, ${params.address.cityState || ''} - ${params.address.pincode || ''}`) : 'Home Address',
            price: service?.price || 700,
            platformFee: params.platformFee || 15,
            discount: 0,
            totalPaid: (service?.price || 700) + (params.platformFee || 15),
            paymentMethod: params.selectedOption || 'UPI',
            transactionId: params.orderID || `TXN-${Date.now().toString().slice(-8)}`,
          };
        } else {
          // 2. Otherwise try AsyncStorage 'latestAppointmentDetails'
          const latestStr = await AsyncStorage.getItem('latestAppointmentDetails');
          if (latestStr) {
            const data = JSON.parse(latestStr);
            details = {
              bookingId: data.appointmentId || `HS-${Math.floor(100000 + Math.random() * 900000)}`,
              providerName: data.doctorName || 'Care Professional',
              businessName: data.appointmentDepartment || 'Vydhyo Home Care',
              categoryEmoji: '🩺',
              categoryName: 'Home Visit',
              serviceName: 'Specialized Consult',
              duration: 'Home Visit Session',
              date: data.appointmentDate || '',
              time: data.appointmentTime || '',
              patientName: data.patientName || 'Patient',
              address: data.homeAddress ? data.homeAddress.split(',').join('\n') : 'Home Address',
              price: data.amount || 700,
              platformFee: params.platformFee || 15,
              discount: data.discount || 0,
              totalPaid: data.finalAmount !== undefined ? data.finalAmount : (data.amount || 700),
              paymentMethod: data.paymentMethod || 'UPI',
              transactionId: params.orderID || data.appointmentObjId || `TXN-${Date.now().toString().slice(-8)}`,
            };
          } else {
            // Fallback mock details if nothing else is available
            details = {
              bookingId: `HS-${Math.floor(100000 + Math.random() * 900000)}`,
              providerName: 'Sister Lakshmi Rao',
              businessName: 'HomeNurse Pro',
              categoryEmoji: '💉',
              categoryName: 'Nursing Care',
              serviceName: 'Post-Surgery Nursing Care',
              duration: '90 mins',
              date: new Date().toLocaleDateString(),
              time: '10:00 AM',
              patientName: 'Rajesh Kumar',
              address: 'Flat 402, Lotus Heights, Madhapur, Hyderabad - 500081',
              price: 1299,
              platformFee: 25,
              discount: 100,
              totalPaid: 1224,
              paymentMethod: 'UPI',
              transactionId: `TXN-${Date.now().toString().slice(-8)}`,
            };
          }
        }
        setBookingDetails(details);
        setIsLoading(false);
        startEntranceAnimations();
      } catch (err) {
        setIsLoading(false);
        console.error('Error loading details:', err);
      }
    };

    loadDetails();
  }, [params]);

  const startEntranceAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleShareReceipt = async () => {
    if (!bookingDetails) return;
    try {
      const summaryText = `
🏠 VYDHYO HOME SERVICES CONFIRMATION 🏠
----------------------------------------
Booking ID: #${bookingDetails.bookingId}
Provider: ${bookingDetails.providerName}
Service: ${bookingDetails.serviceName}
Patient: ${bookingDetails.patientName}
Date & Time: ${bookingDetails.date} at ${bookingDetails.time}
Address: ${bookingDetails.address}
----------------------------------------
Total Amount Paid: ₹${bookingDetails.totalPaid} (${bookingDetails.paymentMethod})
Status: CONFIRMED & PAID
----------------------------------------
Brought to you by Vydhyo Healthcare.
`;
      await Share.share({
        message: summaryText,
        title: 'Vydhyo Home Visit Confirmation',
      });
    } catch (err) {
      console.error(err);
      Toast.show({ type: 'error', text1: 'Sharing failed' });
    }
  };

  const handleSaveReceipt = async () => {
    if (!bookingDetails) return;
    try {
      const receiptContent = `
==================================================
           VYDHYO MEDICAL RECEIPT
==================================================
Booking ID:     #${bookingDetails.bookingId}
Transaction ID: ${bookingDetails.transactionId}
Date:           ${bookingDetails.date}
Time Slot:      ${bookingDetails.time}
--------------------------------------------------
Provider:       ${bookingDetails.providerName} (${bookingDetails.businessName})
Service:        ${bookingDetails.serviceName}
Duration:       ${bookingDetails.duration}
Patient Name:   ${bookingDetails.patientName}
--------------------------------------------------
Service Fee:    ₹${bookingDetails.price}
Platform Fee:   ₹${bookingDetails.platformFee}
Discount:       -₹${bookingDetails.discount}
--------------------------------------------------
GRAND TOTAL:    ₹${bookingDetails.totalPaid}
Payment Method: ${bookingDetails.paymentMethod}
Payment Status: PAID & CONFIRMED
==================================================
          Thank you for trusting Vydhyo!
`;
      const path = `${RNFS.DocumentDirectoryPath}/Vydhyo_Receipt_${bookingDetails.bookingId}.txt`;
      await RNFS.writeFile(path, receiptContent, 'utf8');

      Alert.alert(
        'Receipt Saved',
        `The transaction receipt has been written successfully to device storage:\n\n${path}`,
        [{ text: 'OK' }]
      );
    } catch (err) {
      console.error('Save error:', err);
      Alert.alert('Save Failed', 'Unable to write receipt file to local document directory.');
    }
  };

  const handleDownloadReceipt = () => {
    setIsDownloading(true);
    setDownloadProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 12;
      if (progress >= 100) {
        setDownloadProgress(100);
        clearInterval(interval);
        setTimeout(() => {
          setIsDownloading(false);
          Alert.alert(
            'Download Successful',
            `Receipt Vydhyo_${bookingDetails?.bookingId}.pdf downloaded successfully into your Downloads/Local storage directory.`
          );
        }, 500);
      } else {
        setDownloadProgress(progress);
      }
    }, 150);
  };

  const handleHomePress = async () => {
    await AsyncStorage.removeItem('latestAppointmentDetails');
    navigation.navigate('Home');
  };

  const handleViewBookings = async () => {
    await AsyncStorage.removeItem('latestAppointmentDetails');
    navigation.navigate('MyAppointments');
  };

  if (isLoading || !bookingDetails) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={HS_COLORS.primary} />
        <Text style={styles.loadingText}>Finalizing booking...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={HS_COLORS.primary} />

      {/* Premium Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Vydhyo Home Care</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.mainWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* Animated Success Badge */}
          <View style={styles.successIconSection}>
            <Animated.View style={[styles.circleBadge, { transform: [{ scale: scaleAnim }] }]}>
              <Text style={styles.checkmarkIcon}>✓</Text>
            </Animated.View>
            <Text style={styles.titleText}>{t.title}</Text>
            <Text style={styles.subtitleText}>{t.subtitle}</Text>
          </View>

          {/* Booking & Transaction Card */}
          <View style={styles.detailsCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{t.provider}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>HOME VISIT</Text>
              </View>
            </View>

            <View style={styles.providerRow}>
              <View style={styles.providerIconBg}>
                <Text style={styles.providerEmoji}>{bookingDetails.categoryEmoji}</Text>
              </View>
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{bookingDetails.providerName}</Text>
                <Text style={styles.providerBusiness}>{bookingDetails.businessName}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailsGrid}>
              <View style={styles.gridCell}>
                <Text style={styles.gridLabel}>{t.service}</Text>
                <Text style={styles.gridValue} numberOfLines={1}>{bookingDetails.serviceName}</Text>
              </View>
              <View style={styles.gridCell}>
                <Text style={styles.gridLabel}>{t.duration}</Text>
                <Text style={styles.gridValue}>{bookingDetails.duration}</Text>
              </View>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.gridCell}>
                <Text style={styles.gridLabel}>{t.patientName}</Text>
                <Text style={styles.gridValue}>{bookingDetails.patientName}</Text>
              </View>
              <View style={styles.gridCell}>
                <Text style={styles.gridLabel}>{t.dateSlot}</Text>
                <Text style={styles.gridValue} numberOfLines={1}>{bookingDetails.date} at {bookingDetails.time}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.addressLabel}>{t.address}</Text>
            <Text style={styles.addressValue}>{bookingDetails.address}</Text>

            <View style={styles.divider} />

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{t.bookingId}</Text>
              <Text style={styles.metaValue}>#{bookingDetails.bookingId}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{t.transactionId}</Text>
              <Text style={styles.metaValue} numberOfLines={1}>{bookingDetails.transactionId}</Text>
            </View>
          </View>

          {/* Pricing Details Invoice Card */}
          <View style={styles.detailsCard}>
            <Text style={styles.invoiceTitle}>{t.summary}</Text>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{t.fee}</Text>
              <Text style={styles.priceValue}>₹{bookingDetails.price}</Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{t.platformFee}</Text>
              <Text style={styles.priceValue}>₹{bookingDetails.platformFee}</Text>
            </View>

            {bookingDetails.discount > 0 && (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, styles.greenText]}>{t.discount}</Text>
                <Text style={[styles.priceValue, styles.greenText]}>-₹{bookingDetails.discount}</Text>
              </View>
            )}

            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>{t.totalPaid}</Text>
              <View style={styles.paidBadgeRow}>
                <Text style={styles.totalPaidAmount}>₹{bookingDetails.totalPaid}</Text>
                <View style={styles.paidTag}>
                  <Text style={styles.paidTagText}>{t.paid.toUpperCase()}</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.invoiceMeta}>
              <Text style={styles.invoiceMetaText}>{t.paymentMethod}: {bookingDetails.paymentMethod}</Text>
              <Text style={styles.invoiceMetaText}>{t.status}: {t.paid}</Text>
            </View>
          </View>

          {/* Quick Actions Control Strip */}
          <View style={styles.actionStrip}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleShareReceipt}>
              <Text style={styles.actionIcon}>🔗</Text>
              <Text style={styles.actionBtnLabel}>{t.share}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleSaveReceipt}>
              <Text style={styles.actionIcon}>💾</Text>
              <Text style={styles.actionBtnLabel}>{t.save}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleDownloadReceipt}>
              <Text style={styles.actionIcon}>📥</Text>
              <Text style={styles.actionBtnLabel}>{t.download}</Text>
            </TouchableOpacity>
          </View>

          {/* Steps / Instructions Card */}
          <View style={styles.whatsNextCard}>
            <Text style={styles.whatsNextTitle}>{t.whatsNext}</Text>
            <View style={styles.stepItem}>
              <View style={styles.stepIndicator}><Text style={styles.stepNumber}>1</Text></View>
              <Text style={styles.stepText}>{t.step1}</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepIndicator}><Text style={styles.stepNumber}>2</Text></View>
              <Text style={styles.stepText}>{t.step2}</Text>
            </View>
          </View>

          {/* Main Redirect Navigation buttons */}
          <View style={styles.btnGroup}>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleViewBookings}>
              <Text style={styles.primaryBtnText}>{t.viewBookings}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={handleHomePress}>
              <Text style={styles.secondaryBtnText}>{t.backHome}</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </ScrollView>

      {/* Downloading interactive modal */}
      <Modal visible={isDownloading} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Generating Secure Receipt...</Text>
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${downloadProgress}%` }]} />
            </View>
            <Text style={styles.progressPct}>{downloadProgress}%</Text>
            <ActivityIndicator size="small" color={HS_COLORS.primary} style={{ marginTop: SPACING.md }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HS_COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: HS_COLORS.bg,
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: moderateScale(14),
    color: HS_COLORS.primary,
    fontWeight: '600',
  },
  topBar: {
    height: verticalScale(50),
    backgroundColor: HS_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  topBarTitle: {
    fontSize: moderateScale(16),
    color: '#FFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scroll: {
    paddingBottom: SPACING.xl * 2,
  },
  mainWrap: {
    padding: SPACING.md,
  },
  successIconSection: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  circleBadge: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
    backgroundColor: HS_COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    marginBottom: SPACING.sm,
  },
  checkmarkIcon: {
    color: '#FFFFFF',
    fontSize: moderateScale(36),
    fontWeight: 'bold',
  },
  titleText: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: HS_COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.xxs,
  },
  subtitleText: {
    fontSize: moderateScale(13),
    color: HS_COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: HS_COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: HS_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  badge: {
    backgroundColor: HS_COLORS.accentSoft,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: moderateScale(9),
    color: '#047857',
    fontWeight: '700',
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  providerIconBg: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  providerEmoji: {
    fontSize: moderateScale(20),
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: HS_COLORS.text,
  },
  providerBusiness: {
    fontSize: moderateScale(12),
    color: HS_COLORS.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: HS_COLORS.border,
    marginVertical: SPACING.sm,
  },
  detailsGrid: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  gridCell: {
    flex: 1,
  },
  gridLabel: {
    fontSize: moderateScale(11),
    color: HS_COLORS.textMuted,
    marginBottom: 2,
  },
  gridValue: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: HS_COLORS.text,
  },
  addressLabel: {
    fontSize: moderateScale(11),
    color: HS_COLORS.textMuted,
    marginBottom: 4,
  },
  addressValue: {
    fontSize: moderateScale(13),
    color: HS_COLORS.text,
    lineHeight: moderateScale(18),
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: moderateScale(12),
    color: HS_COLORS.textMuted,
  },
  metaValue: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: HS_COLORS.text,
  },
  invoiceTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: HS_COLORS.primary,
    marginBottom: SPACING.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xxs,
  },
  priceLabel: {
    fontSize: moderateScale(13),
    color: HS_COLORS.textMuted,
  },
  priceValue: {
    fontSize: moderateScale(13),
    color: HS_COLORS.text,
    fontWeight: '500',
  },
  greenText: {
    color: '#059669',
  },
  totalRow: {
    marginTop: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: HS_COLORS.border,
  },
  totalLabel: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: HS_COLORS.text,
  },
  paidBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalPaidAmount: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: HS_COLORS.primary,
    marginRight: SPACING.xs,
  },
  paidTag: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paidTagText: {
    color: '#FFF',
    fontSize: moderateScale(8),
    fontWeight: '700',
  },
  invoiceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xxs,
  },
  invoiceMetaText: {
    fontSize: moderateScale(11),
    color: HS_COLORS.textMuted,
  },
  actionStrip: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: HS_COLORS.border,
    justifyContent: 'space-around',
    elevation: 1,
  },
  actionBtn: {
    alignItems: 'center',
    width: width * 0.26,
  },
  actionIcon: {
    fontSize: moderateScale(22),
    marginBottom: 4,
  },
  actionBtnLabel: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: HS_COLORS.primary,
  },
  whatsNextCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  whatsNextTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: SPACING.sm,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  stepIndicator: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  stepNumber: {
    color: '#FFF',
    fontSize: moderateScale(11),
    fontWeight: '700',
  },
  stepText: {
    fontSize: moderateScale(12),
    color: '#1E3A8A',
    flex: 1,
  },
  btnGroup: {
    marginTop: SPACING.sm,
  },
  primaryBtn: {
    backgroundColor: HS_COLORS.primary,
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    marginBottom: SPACING.xs,
    minHeight: moderateScale(44),
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: HS_COLORS.border,
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    minHeight: moderateScale(44),
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: HS_COLORS.textMuted,
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: HS_COLORS.text,
    marginBottom: SPACING.md,
  },
  progressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: HS_COLORS.accent,
  },
  progressPct: {
    fontSize: moderateScale(12),
    color: HS_COLORS.textMuted,
    fontWeight: '600',
    marginTop: 6,
  },
});

export default HomeServiceBookingConfirmation;
