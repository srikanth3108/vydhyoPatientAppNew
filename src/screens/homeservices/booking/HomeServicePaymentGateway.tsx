import React, { useEffect, useState } from 'react';
import {
  View,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CFEnvironment, CFSession } from 'cashfree-pg-api-contract';
import { CFPaymentGatewayService } from 'react-native-cashfree-pg-sdk';
import { RootStackParamList } from '../../../navigation/navigationTypes';
import { verifyProviderAppointmentPayment } from '../../../services/homeCareService';
import {
  PaymentStateManager,
  PaymentErrorCategorizer,
  PaymentRetryManager,
} from '../../../services/paymentStateManager';
import { PaymentStatus, PaymentErrorType } from '../../../types/paymentTypes';
import { HS_COLORS, hsStyles } from '../homeServiceTheme';

type HomeServicePaymentGatewayRouteProp = RouteProp<RootStackParamList, 'HomeServicePaymentGateway'>;

interface HomeServicePaymentGatewayProps {
  route: HomeServicePaymentGatewayRouteProp;
}

type Nav = StackNavigationProp<RootStackParamList>;

const HomeServicePaymentGateway: React.FC<HomeServicePaymentGatewayProps> = ({ route }) => {
  const navigation = useNavigation<Nav>();
  const {
    payment_session_id,
    order_id,
    categoryId,
    providerId,
    date,
    time,
    patient,
    address,
    reason,
    appointmentDetails,
  } = route.params as any;

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentState, setPaymentState] = useState<any>(null);

  useEffect(() => {
    initiateCashfreePayment();
  }, []);

  const getToken = async () => {
    return await AsyncStorage.getItem('authToken');
  };

  const initiateCashfreePayment = async () => {
    try {
      if (!payment_session_id || !order_id) {
        const errorMsg = `Missing payment session details. payment_session_id: ${payment_session_id}, order_id: ${order_id}`;
        console.error('❌ Payment Gateway Error:', errorMsg);
        
        // Save error state
        await PaymentStateManager.updatePaymentStatus(
          PaymentStatus.FAILED,
          PaymentErrorType.GATEWAY_ERROR,
          errorMsg
        );

        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Missing payment session details',
        });
        setTimeout(() => navigation.goBack(), 2000);
        return;
      }

      // Create initial payment state
      const initialState = PaymentStateManager.createInitialPaymentState(
        appointmentDetails?.appointmentId || order_id,
        order_id,
        payment_session_id,
        appointmentDetails?.amount || 0
      );
      
      await PaymentStateManager.savePaymentState(initialState);
      setPaymentState(initialState);

      await PaymentStateManager.updatePaymentStatus(PaymentStatus.GATEWAY_OPEN);

      console.log('✓ Payment Session Details:', {
        payment_session_id: payment_session_id?.substring(0, 50),
        order_id,
      });

      // Initialize Cashfree session - Use SANDBOX for testing
      // The session_id format determines if it's sandbox or production
      const environment = payment_session_id?.startsWith('session_')
        ? CFEnvironment.SANDBOX
        : CFEnvironment.PRODUCTION;

      console.log('🔧 Using Environment:', environment === CFEnvironment.SANDBOX ? 'SANDBOX' : 'PRODUCTION');

      const session = new CFSession(payment_session_id, order_id, environment);

      console.log('✓ CFSession created successfully');

      // Set up payment callbacks
      CFPaymentGatewayService.setCallback({
        onVerify: async (verifiedOrderId: string) => {
          console.log('✅ Payment Verified. Order ID:', verifiedOrderId);
          await handlePaymentVerification(verifiedOrderId);
        },
        onError: (error: any, errorOrderId: string) => {
          console.log('❌ Payment Error:', error);
          handlePaymentError(error, errorOrderId);
        },
      });

      console.log('📤 Opening Cashfree payment gateway...');
      // Open Cashfree payment gateway
      await CFPaymentGatewayService.doWebPayment(session);

      setLoading(false);
      await PaymentStateManager.updatePaymentStatus(PaymentStatus.PROCESSING);
      
      Toast.show({
        type: 'success',
        text1: 'Payment Gateway',
        text2: 'Opening payment interface...',
      });
    } catch (error: any) {
      console.error('❌ Error initiating Cashfree payment:', error);
      console.error('Error details:', error?.message, error?.code);
      
      // Categorize and save error
      const { errorType, message } = PaymentErrorCategorizer.categorizeError(error);
      await PaymentStateManager.updatePaymentStatus(
        PaymentStatus.FAILED,
        errorType,
        message
      );

      setLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Payment Error',
        text2: error?.message || 'Failed to open payment gateway',
      });
      
      // Navigate to payment failed screen with retry option
      setTimeout(() => {
        navigation.replace('HomeServicePaymentFailed', {
          appointmentDetails,
          categoryId,
          providerId,
          date,
          time,
          patient,
          address,
          reason,
          paymentSessionId: payment_session_id,
          orderId: order_id,
          errorType,
          errorMessage: message,
        });
      }, 2000);
    }
  };

  const handlePaymentVerification = async (verifiedOrderId: string) => {
    setProcessing(true);
    try {
      await PaymentStateManager.updatePaymentStatus(PaymentStatus.VERIFYING);

      // Call backend to verify payment
      const verifyResult = await verifyProviderAppointmentPayment(verifiedOrderId);

      if (verifyResult.success && verifyResult.data) {
        await PaymentStateManager.updatePaymentStatus(PaymentStatus.SUCCESS);
        
        Toast.show({
          type: 'success',
          text1: 'Payment Successful',
          text2: `Order: ${verifiedOrderId}`,
        });

        // Navigate to confirmation screen with appointment details
        navigation.replace('HomeServiceBookingConfirmation', {
          orderID: verifiedOrderId,
          platformFee: appointmentDetails?.platformFee || 0,
          selectedOption: 'gateway',
          categoryId,
          providerId,
          date,
          time,
          patient,
          address,
          reason,
          paymentStatus: 'success',
          appointmentId: appointmentDetails?.appointmentId,
        });

        // Clear payment state after success
        await PaymentStateManager.clearPaymentState();
      } else {
        // Verification failed - can retry
        const { errorType, message } =
          PaymentErrorCategorizer.categorizeError(
            verifyResult.error || 'Verification failed'
          );
        
        await PaymentStateManager.updatePaymentStatus(
          PaymentStatus.FAILED,
          errorType,
          message
        );

        Toast.show({
          type: 'error',
          text1: 'Payment Verification Failed',
          text2: verifyResult.error || 'Unable to verify payment',
        });

        // Navigate to payment failed screen
        setTimeout(() => {
          navigation.replace('HomeServicePaymentFailed', {
            appointmentDetails,
            categoryId,
            providerId,
            date,
            time,
            patient,
            address,
            reason,
            paymentSessionId: payment_session_id,
            orderId: verifiedOrderId,
            errorType: errorType,
            errorMessage: message,
          });
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      
      const { errorType, message } = PaymentErrorCategorizer.categorizeError(error);
      await PaymentStateManager.updatePaymentStatus(
        PaymentStatus.FAILED,
        errorType,
        message
      );

      Toast.show({
        type: 'error',
        text1: 'Verification Error',
        text2: error?.message || 'Failed to verify payment',
      });

      setTimeout(() => {
        navigation.replace('HomeServicePaymentFailed', {
          appointmentDetails,
          categoryId,
          providerId,
          date,
          time,
          patient,
          address,
          reason,
          paymentSessionId: payment_session_id,
          orderId: order_id,
          errorType,
          errorMessage: message,
        });
      }, 2000);
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentError = async (error: any, errorOrderId: string) => {
    console.error('Payment gateway error:', error, errorOrderId);
    
    // Categorize error
    const { errorType, message } = PaymentErrorCategorizer.categorizeError(error);
    
    // Save error state
    await PaymentStateManager.updatePaymentStatus(
      PaymentStatus.FAILED,
      errorType,
      message
    );

    Toast.show({
      type: 'error',
      text1: 'Payment Failed',
      text2: message,
    });

    setProcessing(false);

    // Navigate to payment failed screen with retry option
    setTimeout(() => {
      navigation.replace('HomeServicePaymentFailed', {
        appointmentDetails,
        categoryId,
        providerId,
        date,
        time,
        patient,
        address,
        reason,
        paymentSessionId: payment_session_id,
        orderId: errorOrderId || order_id,
        errorType,
        errorMessage: message,
      });
    }, 1500);
  };

  return (
    <SafeAreaView style={[hsStyles.screen, styles.container]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <ActivityIndicator size="large" color={HS_COLORS.primary} />
        <Text style={styles.loadingText}>
          {loading ? 'Initializing Payment Gateway...' : 'Processing Payment...'}
        </Text>
        {processing && (
          <Text style={styles.processingText}>
            Please wait while we verify your payment
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: HS_COLORS.primary,
    fontWeight: '600',
    marginTop: 16,
  },
  processingText: {
    fontSize: 14,
    color: HS_COLORS.textMuted,
    fontWeight: '500',
    marginTop: 8,
  },
});

export default HomeServicePaymentGateway;
