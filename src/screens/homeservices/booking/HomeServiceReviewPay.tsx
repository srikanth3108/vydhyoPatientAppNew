import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import moment from 'moment';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/navigationTypes';
import {
  getCategoryById,
} from '../../../data/mockHomeServices';
import { AddressFormData } from './HomeServiceAddress';
import { HS_COLORS, hsStyles } from '../homeServiceTheme';
import { SPACING, moderateScale, LAYOUT, verticalScale } from '../../../utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { AuthFetch, AuthPost, ENDPOINTS } from '../../../services';
import { useSelector } from 'react-redux';
import { WebView } from 'react-native-webview';
import { 
  createProviderAppointment, 
  providerPaymentSuccess, 
  getProviderDetailsById,
  extractPaymentSessionFromResponse
} from '../../../services/homeCareService';

type Patient = {
  firstname: string;
  lastname?: string;
  relationship?: string;
  mobile?: string;
  age?: number;
  gender?: string;
  userId?: string | number;
};

type Params = {
  providerId: string;
  categoryId: string;
  date: string;
  time: string;
  reason: string;
  patient: Patient;
  formData: AddressFormData;
};

type Nav = StackNavigationProp<RootStackParamList>;

const HomeServiceReviewPay: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<{ HomeServiceReviewPay: Params }, 'HomeServiceReviewPay'>>();
  const params = route.params;

  const user: any = useSelector((state: any) => state.currentUser);
  const userWallet = useSelector((s: any) => s.userWallet);

  const category = getCategoryById(params.categoryId);
  const { patient, formData, reason, date, time } = params;

  const [providerDetails, setProviderDetails] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchProvider = async () => {
      const res = await getProviderDetailsById(params.providerId);
      if (res.provider) setProviderDetails(res.provider);
      setInitialLoading(false);
    };
    fetchProvider();
  }, [params.providerId]);

  // ─── Payment state ────────────────────────────────
  const [selectedOption, setSelectedOption] = useState<string>('upi');
  const [loading, setLoading] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [platformFee, setPlatformFee] = useState(0);

  // Wallet
  const [useWallet, setUseWallet] = useState(false);
  const walletBalance = userWallet?.balance || 0;
  const hasWalletBalance = walletBalance > 0;

  // Promo code
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [couponId, setCouponId] = useState<string | null>(null);

  // Referral
  const [hasAppointments, setHasAppointments] = useState<boolean | null>(null);
  const [checkingAppointments, setCheckingAppointments] = useState(true);
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [referralFinalAmount, setReferralFinalAmount] = useState<number | null>(null);
  const [selectedDiscount, setSelectedDiscount] = useState<'referral' | 'promo' | null>(null);

  // ─── Derived values ───────────────────────────────
  const serviceFee = providerDetails?.consultationFee || 0;
  const computedPlatformFee = Math.round(serviceFee * 0.02);
  const baseTotal = serviceFee + computedPlatformFee;

  const computeAmounts = useCallback(() => {
    let afterDiscount = baseTotal;

    if (selectedDiscount === 'referral' && hasAppointments === false && user?.usedReferralCode) {
      afterDiscount = Math.max(baseTotal - (user?.referralDiscount ?? 0), 0);
    } else if (selectedDiscount === 'promo' && appliedPromoCode) {
      afterDiscount = Math.max(baseTotal - promoDiscount, 0);
    }

    let walletDeduction = 0;
    let upiAmount = afterDiscount;

    if (useWallet && walletBalance > 0) {
      walletDeduction = Math.min(walletBalance, afterDiscount);
      upiAmount = Math.max(afterDiscount - walletDeduction, 0);
    }

    return { afterDiscount, walletDeduction, upiAmount };
  }, [
    baseTotal,
    selectedDiscount,
    hasAppointments,
    user?.usedReferralCode,
    user?.referralDiscount,
    appliedPromoCode,
    promoDiscount,
    useWallet,
    walletBalance,
  ]);

  const { afterDiscount, walletDeduction, upiAmount } = useMemo(
    () => computeAmounts(),
    [computeAmounts],
  );

  // ─── Helpers ──────────────────────────────────────
  async function getToken() {
    return await AsyncStorage.getItem('authToken');
  }

  const formatDate = (d: string) => moment(d).format('dddd, DD MMM YYYY');

  const addressLines = [
    [formData.building, formData.floorFlat].filter(Boolean).join(', '),
    formData.street,
    formData.landmark,
    `${formData.cityState} - ${formData.pincode}`,
  ].filter(Boolean);

  // ─── Check previous appointments (for referral) ──
  useEffect(() => {
    const check = async () => {
      try {
        const token = await getToken();
        const userId = user?.userId;
        if (!token || !userId) {
          setCheckingAppointments(false);
          return;
        }
        const response: any = await AuthFetch(
          ENDPOINTS.GET_ALL_FAMILY_APPOINTMENTS(userId, 'scheduled'),
          token,
        );
        setHasAppointments(response?.data?.data?.length > 0);
      } catch {
        setHasAppointments(false);
      } finally {
        setCheckingAppointments(false);
      }
    };
    check();
  }, [user?.userId]);

  // Auto-select referral discount for first appointment
  useEffect(() => {
    if (hasAppointments === false && user?.usedReferralCode && user?.referralDiscount > 0) {
      setSelectedDiscount('referral');
      setAppliedPromoCode(null);
      setPromoDiscount(0);
      setPromoCode('');
      setCouponId(null);
    }
  }, [hasAppointments, user?.usedReferralCode, user?.referralDiscount]);

  // Apply referral discount
  useEffect(() => {
    if (selectedDiscount === 'referral' && hasAppointments === false && user?.usedReferralCode) {
      const discount = user?.referralDiscount;
      setReferralDiscount(discount);
      setReferralFinalAmount(Math.max(baseTotal - discount, 0));
      Toast.show({
        type: 'success',
        text1: 'Referral Discount Applied',
        text2: `₹${discount} discount applied`,
      });
    } else {
      setReferralDiscount(0);
      setReferralFinalAmount(null);
    }
  }, [selectedDiscount, hasAppointments, user?.usedReferralCode, user?.referralDiscount, baseTotal]);

  // ─── Promo code ───────────────────────────────────
  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter a promo code' });
      return;
    }
    try {
      const token = await getToken();
      if (!token) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Authentication token not found' });
        return;
      }
      const patientUserId = patient?.userId || user?.userId;
      const promoData = {
        userId: patientUserId,
        purchaseAmount: baseTotal,
        code: promoCode.trim().toUpperCase(),
      };
      const response: any = await AuthPost(ENDPOINTS.VALIDATE_COUPON_CODE, promoData, token);
      if (response?.status === 'success') {
        const discount = response?.data?.discountAmount || 0;
        setSelectedDiscount('promo');
        setAppliedPromoCode(promoCode.trim().toUpperCase());
        setPromoDiscount(discount);
        setCouponId(response?.data?.couponId || null);
        Toast.show({
          type: 'success',
          text1: 'Promo Code Applied',
          text2: `Discount: ₹${discount}`,
        });
        setPromoCode('');
      } else {
        const errorMessage = response?.message?.message || response?.message || 'Invalid promo code';
        Alert.alert('Invalid Promo Code', errorMessage);
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Something went wrong');
    }
  };

  const removePromoCode = () => {
    setSelectedDiscount(null);
    setAppliedPromoCode(null);
    setPromoDiscount(0);
    setPromoCode('');
    setCouponId(null);
  };

  // ─── Release slot on failure ──────────────────────
  const handleReleaseSlot = async (reason: string) => {
    try {
      const latestStr = await AsyncStorage.getItem('latestAppointmentDetails');
      const appointmentDetails = latestStr ? JSON.parse(latestStr) : null;
      if (!appointmentDetails) return;
    } catch {
      // silent
    }
  };

  // ─── Initiate Cashfree Payment Gateway ─────────────────
  const initiateCashfreePaymentGateway = async (
    fullResponse: any,
    appointmentId: string,
    platformFeeValue: number,
  ) => {
    try {
      console.log('📤 Initiating Cashfree Payment Gateway');
      console.log('Full Response:', fullResponse);

      // Extract payment session from the appointment creation response
      const paymentSessionData = extractPaymentSessionFromResponse(fullResponse);
      
      console.log('🔍 Extracted Payment Session:', paymentSessionData);

      if (!paymentSessionData) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to extract payment session from response',
        });
        console.error('❌ Payment session extraction failed. Response:', fullResponse);
        return;
      }

      console.log('✅ Payment session extracted successfully');

      // Navigate to payment gateway screen with payment session details
      navigation.navigate('HomeServicePaymentGateway', {
        payment_session_id: paymentSessionData.payment_session_id,
        order_id: paymentSessionData.order_id,
        categoryId: params.categoryId,
        providerId: params.providerId,
        date: params.date,
        time: params.time,
        patient: params.patient,
        address: params.formData,
        reason: params.reason,
        appointmentDetails: {
          appointmentId,
          platformFee: platformFeeValue,
        },
      });
    } catch (error: any) {
      console.error('❌ Error initiating payment gateway:', error);
      Toast.show({
        type: 'error',
        text1: 'Payment Error',
        text2: error?.message || 'Failed to initiate payment',
      });
    }
  };

  // ─── Cashfree WebView Payment ─────────────────────
  const handleCashfreePayment = async (fee: number, appointmentId: string) => {
    if (serviceFee <= 0) {
      Toast.show({ type: 'error', text1: 'Invalid Amount', text2: 'Service fee is invalid.' });
      return;
    }
    try {
      const mobileRegex = /^[6-9]\d{9}$/;
      if (!mobileRegex.test(user.mobile)) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Please provide a valid 10-digit Indian mobile number.',
        });
        return;
      }
      await AsyncStorage.removeItem('linkId');

      const finalAmount = upiAmount;
      const body = {
        mobile: user.mobile,
        amount: parseFloat(finalAmount.toString()),
        currency: 'INR',
        paymentMethod: useWallet && walletDeduction > 0 ? 'wallet' : 'upi',
      };
      const token = await getToken();
      const response: any = await AuthPost(ENDPOINTS.PLACE_ORDER(appointmentId), body, token);
      if (!response) {
        Toast.show({ type: 'error', text1: 'Payment Error', text2: 'Something went wrong' });
        return;
      }
      const link = response?.data?.link_url;
      const linkId = response?.data?.linkId;
      if (!link || !linkId) {
        Toast.show({
          type: 'error',
          text1: 'Payment Error',
          text2: 'Payment link not received from server',
        });
        return;
      }
      await AsyncStorage.setItem('linkId', linkId);
      setPaymentLink(link);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Payment Error',
        text2: error?.message || 'Something went wrong',
      });
    }
  };

  const checkPaymentStatus = async () => {
    try {
      const linkId = await AsyncStorage.getItem('linkId');
      if (!linkId) return;
      const token = await getToken();
      const response: any = await AuthFetch(ENDPOINTS.GET_STATUS_BY_LINK_ID(linkId), token);
      if (response?.data?.length > 0) {
        const status = response.data[0]?.order_status;
        const orderId = response.data[0]?.order_id;
        if (status === 'PAID') {
          const verifyRes = await providerPaymentSuccess(orderId || linkId);
          if (!verifyRes.error) {
            Toast.show({ type: 'success', text1: `Payment Verified: ${linkId}` });
            await AsyncStorage.removeItem('linkId');
            navigation.replace('HomeServiceBookingConfirmation', {
              orderID: orderId || linkId,
              platformFee: platformFee || computedPlatformFee,
              selectedOption: selectedOption,
              categoryId: params.categoryId,
              providerId: params.providerId,
              date: params.date,
              time: params.time,
              patient: params.patient,
              address: params.formData,
              reason: params.reason,
            });
          } else {
            Toast.show({ type: 'error', text1: 'Payment Failed Verification', text2: `Order: ${linkId}` });
            await AsyncStorage.removeItem('linkId');
          }
        } else {
          Toast.show({ type: 'error', text1: 'Payment Failed', text2: `Order: ${linkId}` });
        }
      } else {
        Toast.show({ type: 'error', text1: 'Payment Failed', text2: `Order: ${linkId}` });
        await AsyncStorage.removeItem('linkId');
        const latestStr = await AsyncStorage.getItem('latestAppointmentDetails');
        if (latestStr) {
          const appointmentDetails = JSON.parse(latestStr);
        }
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Payment Error',
        text2: error?.message || 'Something went wrong',
      });
    }
  };

  // ─── Create appointment & pay ─────────────────────
  const handlePay = async () => {
    if (loading) return;

    if (useWallet && couponId) {
      Alert.alert(
        'Wallet + Promo',
        'Wallet balance cannot be used with promo code. Please deselect wallet or remove promo code.',
      );
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Authentication token not found' });
        setLoading(false);
        return;
      }

      const patientUserId = patient?.userId || user?.userId;
      const walletFullyCovered = useWallet && walletDeduction > 0 && upiAmount === 0;

      // Determine payment method & status
      let paymentMethod = 'upi';
      let paymentStatus = 'unpaid';

      if (useWallet && walletDeduction > 0) {
        if (upiAmount === 0) {
          paymentMethod = 'wallet';
          paymentStatus = 'paid';
        } else {
          paymentMethod = 'wallet+upi';
        }
      }

      // Discount info
      let discountAmount = 0;
      let discountType = 'percentage';
      if (selectedDiscount === 'promo' && appliedPromoCode && couponId) {
        discountAmount = promoDiscount;
        discountType = 'flat';
      } else if (selectedDiscount === 'referral' && hasAppointments === false && user?.usedReferralCode) {
        discountAmount = user?.referralDiscount;
        discountType = 'flat';
      }

      const appointmentData: any = {
        userId: user?.userId || '',
        bookingFor: params.patient.relationship === 'Self' ? 'self' : 'family',
        familyMemberId: (params.patient as any).familyMemberId,
        providerId: params.providerId,
        appointmentDate: date,
        appointmentTime: time,
        quickPick: reason,
        appointmentReason: reason,
        patientAddressId: '',
        visitAddress: {
          buildingName: formData.building || '',
          flatNumber: formData.floorFlat || '',
          street: formData.street || '',
          landmark: formData.landmark || '',
          city: formData.cityState?.split(',')[0]?.trim() || '',
          state: formData.cityState?.split(',')[1]?.trim() || '',
          country: 'India',
          pincode: formData.pincode || '',
          latitude: 0,
          longitude: 0,
        },
        paymentMethod: paymentMethod === 'wallet' ? 'wallet' : 'upi',
        amount: Math.round(upiAmount > 0 ? upiAmount : serviceFee),
      };

      const response = await createProviderAppointment(appointmentData);

      if (!response.error && response.data) {
        const appointmentId = response.data.appointmentId;
        const platformFeeValue = computedPlatformFee;
        setPlatformFee(platformFeeValue);

        const appointmentDetails: any = {
          userId: patientUserId,
          doctorId: params.providerId,
          patientName: `${patient.firstname} ${patient.lastname || ''}`.trim(),
          doctorName: providerDetails?.fullName || '',
          appointmentType: 'Home Visit',
          appointmentDepartment: category?.name || 'Home Service',
          appointmentDate: date,
          appointmentTime: time,
          homeAddress: formData.street,
          appointmentStatus: 'pending',
          appointmentReason: reason,
          amount: serviceFee,
          discount: discountAmount,
          discountType,
          paymentStatus,
          appSource: 'patientApp',
          appointmentId,
          paymentMethod,
        };

        if (couponId) {
          appointmentDetails.couponId = couponId;
          appointmentDetails.appliedPromoCode = appliedPromoCode;
        }
        if (useWallet && walletDeduction > 0) {
          appointmentDetails.walletAmount = walletDeduction;
        }
        appointmentDetails.finalAmount = Math.max(serviceFee - discountAmount, 0);

        await AsyncStorage.setItem(
          'latestAppointmentDetails',
          JSON.stringify(appointmentDetails),
        );

        if (walletFullyCovered) {
          // Wallet covers everything — go directly to confirmation
          navigation.replace('HomeServiceBookingConfirmation', {
            orderID: appointmentId || `HS-${Date.now().toString(36).toUpperCase()}`,
            platformFee: platformFeeValue,
            selectedOption: 'wallet',
            categoryId: params.categoryId,
            providerId: params.providerId,
            date: params.date,
            time: params.time,
            patient: params.patient,
            address: params.formData,
            reason: params.reason,
            paymentStatus: 'success',
            appointmentId,
          });
        } else if (upiAmount > 0) {
          // UPI payment needed - initiate Cashfree payment gateway
          await initiateCashfreePaymentGateway(response.fullResponse, appointmentId, platformFeeValue);
        } else {
          // Zero-amount (fully discounted)
          navigation.replace('HomeServiceBookingConfirmation', {
            orderID: appointmentId || `HS-${Date.now().toString(36).toUpperCase()}`,
            platformFee: platformFeeValue,
            selectedOption,
            categoryId: params.categoryId,
            providerId: params.providerId,
            date: params.date,
            time: params.time,
            patient: params.patient,
            address: params.formData,
            reason: params.reason,
            paymentStatus: 'success',
            appointmentId,
          });
        }
      } else {
        const errorMessage = response.error || 'Failed to create appointment';
        Alert.alert('Error', errorMessage);
        Toast.show({
          type: 'error',
          text1: 'Appointment Error',
          text2: errorMessage,
          position: 'top',
          visibilityTime: 4000,
        });
      }
    } catch (error: any) {
      const errorMessage =
        error?.message || error?.response?.data?.message || 'Something went wrong';
      Alert.alert('Error', errorMessage);
      Toast.show({
        type: 'error',
        text1: 'Appointment Error',
        text2: errorMessage,
        position: 'top',
        visibilityTime: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  // ─── WebView for Cashfree payment ─────────────────
  if (paymentLink) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <WebView
          source={{ uri: paymentLink }}
          startInLoadingState={true}
          onNavigationStateChange={navState => {
            if (navState.url.includes('paymentResponse')) {
              Toast.show({ type: 'success', text1: 'Payment page completed' });
              checkPaymentStatus();
              setPaymentLink(null);
            }
          }}
        />
      </SafeAreaView>
    );
  }

  if (initialLoading) {
    return (
      <SafeAreaView style={[hsStyles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={HS_COLORS.primary} />
      </SafeAreaView>
    );
  }

  // ─── Main UI ──────────────────────────────────────
  return (
    <SafeAreaView style={hsStyles.screen}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.successBanner}>
            <Text style={styles.bannerEmoji}>✨</Text>
            <Text style={styles.bannerText}>Almost done! Review your booking</Text>
          </View>

          {/* Provider */}
          <Section title="Provider" icon="👤">
            <Text style={styles.bold}>{providerDetails?.fullName || ''}</Text>
            <Text style={hsStyles.muted}>{providerDetails?.profession || ''}</Text>
            <View style={styles.pill}>
              <Text style={styles.pillText}>
                {category?.emoji} {category?.name} · Home visit
              </Text>
            </View>
          </Section>

          {/* Service & Slot */}
          <Section title="Service & slot" icon="📅">
            <Text style={styles.bold}>Home Visit Consultation</Text>
            <InfoRow label="Date" value={formatDate(date)} />
            <InfoRow label="Time" value={time} />
          </Section>

          {/* Patient */}
          <Section title="Patient" icon="🧑">
            <InfoRow
              label="Name"
              value={`${patient.firstname} ${patient.lastname || ''}`.trim()}
            />
            <InfoRow label="For" value={patient.relationship || 'Self'} />
            <InfoRow label="Phone" value={patient.mobile || '—'} />
          </Section>

          {/* Visit Address */}
          <Section title="Visit address" icon="🏠">
            {addressLines.map((line, i) => (
              <Text key={i} style={styles.line}>
                {line}
              </Text>
            ))}
          </Section>

          {/* Reason */}
          <Section title="Reason" icon="📝">
            <Text style={styles.quote}>"{reason}"</Text>
          </Section>

          {/* Payment Summary */}
          <Section title="Payment summary" icon="🧾">
            <InfoRow label="Service fee" value={`₹${serviceFee}`} />
            <InfoRow label="Platform fee" value={`₹${computedPlatformFee}`} />
            {(appliedPromoCode && promoDiscount > 0) && (
              <View style={styles.discountRow}>
                <Text style={styles.discountLabel}>Promo discount</Text>
                <Text style={styles.discountValue}>- ₹{promoDiscount}</Text>
              </View>
            )}
            {selectedDiscount === 'referral' && referralDiscount > 0 && (
              <View style={styles.discountRow}>
                <Text style={styles.discountLabel}>Referral discount</Text>
                <Text style={styles.discountValue}>- ₹{referralDiscount}</Text>
              </View>
            )}
            {useWallet && walletDeduction > 0 && (
              <View style={styles.discountRow}>
                <Text style={styles.discountLabel}>Wallet deduction</Text>
                <Text style={styles.discountValue}>- ₹{walletDeduction}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total payable</Text>
              <Text style={styles.totalValue}>₹{upiAmount}</Text>
            </View>
          </Section>

          {/* ─── Discount Options (First Appointment) ────── */}
          {hasAppointments === false && (
            <View style={styles.discountSection}>
              <Text style={styles.discountSectionTitle}>Apply Discount</Text>
              <View style={styles.discountBtnRow}>
                <TouchableOpacity
                  style={[
                    styles.discountBtn,
                    selectedDiscount === 'promo' && styles.discountBtnActive,
                  ]}
                  onPress={() => {
                    setSelectedDiscount('promo');
                    setReferralDiscount(0);
                    setReferralFinalAmount(null);
                  }}
                >
                  <Text
                    style={[
                      styles.discountBtnText,
                      selectedDiscount === 'promo' && styles.discountBtnTextActive,
                    ]}
                  >
                    🏷️ Promo Code
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ─── Promo Code Input ─────────────────────────── */}
          {(selectedDiscount === 'promo' || appliedPromoCode) && (
            <View style={styles.promoSection}>
              <View style={styles.promoHeader}>
                <Text style={styles.promoLabel}>Promo Code</Text>
                {appliedPromoCode && (
                  <TouchableOpacity onPress={removePromoCode} style={styles.promoRemoveBtn}>
                    <Text style={styles.promoRemoveText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              {appliedPromoCode ? (
                <View style={styles.promoAppliedBox}>
                  <Text style={styles.promoAppliedText}>
                    {appliedPromoCode}
                    <Text style={styles.promoAppliedDiscount}>
                      {` (₹${promoDiscount} discount)`}
                    </Text>
                  </Text>
                  <Text style={styles.promoCheckmark}>✓</Text>
                </View>
              ) : (
                <View style={styles.promoInputRow}>
                  <TextInput
                    style={styles.promoInput}
                    placeholder="Enter Promo Code"
                    placeholderTextColor="#999"
                    value={promoCode}
                    onChangeText={setPromoCode}
                    maxLength={20}
                    autoCapitalize="characters"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={[
                      styles.promoApplyBtn,
                      !promoCode.trim() && styles.promoApplyBtnDisabled,
                    ]}
                    onPress={handleApplyPromoCode}
                    disabled={!promoCode.trim() || loading}
                  >
                    <Text style={styles.promoApplyText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* ─── Wallet Checkbox ─────────────────────────── */}
          <View style={styles.walletSection}>
            <TouchableOpacity
              style={styles.walletRow}
              onPress={() => {
                if (hasWalletBalance) setUseWallet(prev => !prev);
              }}
              activeOpacity={hasWalletBalance ? 0.7 : 1}
            >
              <View
                style={[
                  styles.checkbox,
                  useWallet && hasWalletBalance && styles.checkboxChecked,
                  !hasWalletBalance && styles.checkboxDisabled,
                ]}
              >
                {useWallet && hasWalletBalance && (
                  <Text style={styles.checkboxTick}>✓</Text>
                )}
              </View>
              <View style={styles.walletInfo}>
                <Text
                  style={[styles.walletLabel, !hasWalletBalance && styles.walletLabelDisabled]}
                >
                  Use Wallet Balance
                </Text>
                <Text
                  style={[
                    styles.walletBalanceText,
                    !hasWalletBalance && styles.walletLabelDisabled,
                  ]}
                >
                  {hasWalletBalance
                    ? `Balance: ₹${walletBalance}`
                    : 'No wallet balance available'}
                </Text>
              </View>
            </TouchableOpacity>

            {useWallet && hasWalletBalance && walletDeduction > 0 && (
              <View style={styles.walletBreakdown}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Wallet deduction</Text>
                  <Text style={[styles.breakdownValue, { color: '#16A34A' }]}>
                    - ₹{walletDeduction}
                  </Text>
                </View>
                {upiAmount > 0 ? (
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Remaining via UPI</Text>
                    <Text style={[styles.breakdownValue, { color: HS_COLORS.primary, fontWeight: '700' }]}>
                      ₹{upiAmount}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.breakdownRow, { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: SPACING.xs }]}>
                    <Text style={[styles.breakdownLabel, { fontWeight: '700' }]}>
                      Wallet covers full amount
                    </Text>
                    <Text style={[styles.breakdownValue, { color: '#16A34A', fontWeight: '700' }]}>
                      ✓ Fully Paid
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* ─── Auto-Cancel Warning ──────────────────────── */}
          <View style={styles.warningBox}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              Auto-Cancel Notice: If payment is not completed, booking will be automatically
              cancelled.
            </Text>
          </View>

          {/* ─── Info Note ────────────────────────────────── */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              🔒 Payments are securely processed via Cashfree payment gateway.
            </Text>
          </View>
        </ScrollView>

        {/* ─── Fixed Bottom Pay Button ────────────────── */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[hsStyles.primaryBtn, loading && { opacity: 0.7 }]}
            onPress={handlePay}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={hsStyles.primaryBtnText}>
                {upiAmount > 0
                  ? `Pay ₹${upiAmount} & confirm booking`
                  : walletDeduction > 0
                  ? 'Pay with Wallet & confirm booking'
                  : 'Confirm booking'}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelLink}
            onPress={() =>
              Alert.alert('Cancel booking?', 'Your slot will not be reserved.', [
                { text: 'Stay', style: 'cancel' },
                { text: 'Leave', onPress: () => navigation.navigate('Home') },
              ])
            }
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Sub-components ──────────────────────────────────

const Section: React.FC<{
  title: string;
  icon: string;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <View style={[hsStyles.card, styles.section]}>
    <View style={styles.sectionHead}>
      <Text style={styles.sectionIcon}>{icon}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={hsStyles.muted}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

// ─── Styles ──────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xl * 3 },
  successBanner: {
    backgroundColor: HS_COLORS.primary,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerEmoji: { fontSize: moderateScale(18), marginRight: SPACING.xs },
  bannerText: {
    color: '#FFF',
    fontSize: moderateScale(15),
    fontWeight: '600',
    textAlign: 'center',
  },
  section: { marginBottom: SPACING.sm },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  sectionIcon: { fontSize: moderateScale(16), marginRight: SPACING.xs },
  sectionTitle: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: HS_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bold: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: HS_COLORS.text,
  },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: HS_COLORS.accentSoft,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: SPACING.xs,
  },
  pillText: { fontSize: moderateScale(11), color: '#047857', fontWeight: '600' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  rowValue: {
    fontSize: moderateScale(13),
    fontWeight: '500',
    color: HS_COLORS.text,
    flexShrink: 1,
    textAlign: 'right',
    maxWidth: '60%',
  },
  line: {
    fontSize: moderateScale(13),
    color: HS_COLORS.text,
    marginBottom: 4,
  },
  quote: {
    fontSize: moderateScale(13),
    color: HS_COLORS.text,
    fontStyle: 'italic',
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  discountLabel: {
    fontSize: moderateScale(12),
    color: '#16A34A',
    fontWeight: '500',
  },
  discountValue: {
    fontSize: moderateScale(12),
    color: '#16A34A',
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: HS_COLORS.border,
  },
  totalLabel: { fontSize: moderateScale(15), fontWeight: '700', color: HS_COLORS.text },
  totalValue: { fontSize: moderateScale(18), fontWeight: '700', color: HS_COLORS.primary },

  // Discount options
  discountSection: {
    backgroundColor: '#FFF',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: HS_COLORS.border,
  },
  discountSectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: HS_COLORS.text,
    marginBottom: SPACING.sm,
  },
  discountBtnRow: { flexDirection: 'row', gap: SPACING.sm },
  discountBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    borderWidth: 1.5,
    borderColor: HS_COLORS.border,
    alignItems: 'center',
  },
  discountBtnActive: {
    borderColor: HS_COLORS.primary,
    backgroundColor: '#EFF6FF',
  },
  discountBtnText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: HS_COLORS.textMuted,
  },
  discountBtnTextActive: { color: HS_COLORS.primary },

  // Promo code
  promoSection: {
    backgroundColor: '#FFF',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: HS_COLORS.border,
  },
  promoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  promoLabel: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: HS_COLORS.text,
  },
  promoRemoveBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoRemoveText: { color: '#EF4444', fontWeight: '700', fontSize: 12 },
  promoAppliedBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  promoAppliedText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#166534',
  },
  promoAppliedDiscount: {
    fontWeight: '400',
    color: '#16A34A',
  },
  promoCheckmark: {
    fontSize: moderateScale(16),
    color: '#16A34A',
    fontWeight: '700',
  },
  promoInputRow: { flexDirection: 'row', gap: SPACING.sm },
  promoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: HS_COLORS.border,
    borderRadius: LAYOUT.borderRadius.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    fontSize: moderateScale(13),
    color: HS_COLORS.text,
    backgroundColor: '#F8FAFC',
  },
  promoApplyBtn: {
    backgroundColor: HS_COLORS.primary,
    paddingHorizontal: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoApplyBtnDisabled: { opacity: 0.5 },
  promoApplyText: {
    color: '#FFF',
    fontSize: moderateScale(13),
    fontWeight: '600',
  },

  // Wallet
  walletSection: {
    backgroundColor: '#FFF',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: HS_COLORS.border,
  },
  walletRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: HS_COLORS.border,
    borderRadius: 4,
    marginRight: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  checkboxChecked: {
    backgroundColor: HS_COLORS.primary,
    borderColor: HS_COLORS.primary,
  },
  checkboxDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  checkboxTick: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  walletInfo: { flex: 1 },
  walletLabel: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: HS_COLORS.text,
  },
  walletLabelDisabled: { color: '#94A3B8' },
  walletBalanceText: {
    fontSize: moderateScale(11),
    color: HS_COLORS.textMuted,
    marginTop: 2,
  },
  walletBreakdown: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  breakdownLabel: {
    fontSize: moderateScale(12),
    color: HS_COLORS.textMuted,
  },
  breakdownValue: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    color: HS_COLORS.text,
  },

  // Warning & info
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    padding: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: SPACING.sm,
    alignItems: 'flex-start',
  },
  warningIcon: { fontSize: moderateScale(14), marginRight: SPACING.xs, marginTop: 1 },
  warningText: {
    flex: 1,
    fontSize: moderateScale(11),
    color: '#991B1B',
    lineHeight: moderateScale(16),
  },
  infoBox: {
    backgroundColor: '#F0FDF4',
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: SPACING.sm,
  },
  infoText: { fontSize: moderateScale(12), color: '#166534' },

  // Footer
  footer: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: HS_COLORS.border,
    backgroundColor: HS_COLORS.bg,
  },
  cancelLink: { alignItems: 'center', marginTop: SPACING.sm },
  cancelText: { color: HS_COLORS.textMuted, fontSize: moderateScale(14) },
});

export default HomeServiceReviewPay;
