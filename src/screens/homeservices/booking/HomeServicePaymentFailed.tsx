import React, { useEffect, useState } from 'react';
import {
  View,
  SafeAreaView,
  StatusBar,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import { RootStackParamList } from '../../../navigation/navigationTypes';
import {
  PaymentStateManager,
  PaymentRetryManager,
  PaymentErrorCategorizer,
} from '../../../services/paymentStateManager';
import { PaymentErrorType } from '../../../types/paymentTypes';
import { HS_COLORS, hsStyles } from '../homeServiceTheme';

type HomeServicePaymentFailedRouteProp = RouteProp<
  RootStackParamList,
  'HomeServicePaymentFailed'
>;

interface HomeServicePaymentFailedProps {
  route: HomeServicePaymentFailedRouteProp;
}

type Nav = StackNavigationProp<RootStackParamList>;

const HomeServicePaymentFailed: React.FC<HomeServicePaymentFailedProps> = ({
  route,
}) => {
  const navigation = useNavigation<Nav>();
  const {
    appointmentDetails,
    categoryId,
    providerId,
    date,
    time,
    patient,
    address,
    reason,
    paymentSessionId,
    orderId,
    errorType,
    errorMessage,
  } = route.params as any;

  const [retrying, setRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries, setMaxRetries] = useState(5);
  const [canRetry, setCanRetry] = useState(true);
  const [paymentState, setPaymentState] = useState<any>(null);

  useEffect(() => {
    loadPaymentState();
  }, []);

  const loadPaymentState = async () => {
    const state = await PaymentStateManager.getPaymentState();
    if (state) {
      setPaymentState(state);
      setRetryCount(state.retryCount);
      setMaxRetries(state.maxRetries);
      setCanRetry(
        state.canRetry &&
          state.retryCount < state.maxRetries &&
          PaymentErrorCategorizer.isRecoverableError(state.errorType)
      );
    }
  };

  const handleRetry = async () => {
    if (!canRetry) {
      Alert.alert(
        'Max Retries Exceeded',
        'You have exceeded the maximum number of retry attempts. Please contact support.',
        [{ text: 'Contact Support', onPress: handleContactSupport }]
      );
      return;
    }

    setRetrying(true);

    try {
      // Increment retry count
      const updatedState = await PaymentStateManager.incrementRetryCount();
      if (updatedState) {
        setRetryCount(updatedState.retryCount);
        setCanRetry(updatedState.canRetry);
      }

      // Wait before retrying
      const retryMessage = PaymentRetryManager.formatRetryMessage(
        updatedState || paymentState
      );
      Toast.show({
        type: 'info',
        text1: 'Retrying Payment',
        text2: retryMessage,
      });

      await PaymentRetryManager.waitBeforeRetry(retryCount);

      // Navigate back to payment gateway with same session
      navigation.replace('HomeServicePaymentGateway', {
        payment_session_id: paymentSessionId,
        order_id: orderId,
        categoryId,
        providerId,
        date,
        time,
        patient,
        address,
        reason,
        appointmentDetails,
      });
    } catch (error) {
      console.error('Error retrying payment:', error);
      Toast.show({
        type: 'error',
        text1: 'Retry Failed',
        text2: 'Failed to initiate retry',
      });
    } finally {
      setRetrying(false);
    }
  };

  const handleEditAppointment = () => {
    navigation.goBack();
  };

  const handleChangePaymentMethod = () => {
    Alert.alert(
      'Change Payment Method',
      'Would you like to try a different payment method?',
      [
        {
          text: 'Yes',
          onPress: () => {
            navigation.replace('HomeServiceReviewPay', {
              categoryId,
              providerId,
              date,
              time,
              patient,
              address,
              reason,
            });
          },
        },
        { text: 'No', style: 'cancel' },
      ]
    );
  };

  const handleContactSupport = () => {
    // Implement contact support logic
    Toast.show({
      type: 'info',
      text1: 'Support',
      text2: 'Our team will contact you soon',
    });
  };

  const getErrorIcon = (): string => {
    switch (errorType) {
      case PaymentErrorType.NETWORK_ERROR:
        return '📡';
      case PaymentErrorType.INVALID_CARD:
      case PaymentErrorType.INSUFFICIENT_FUNDS:
        return '💳';
      case PaymentErrorType.SESSION_EXPIRED:
        return '⏰';
      case PaymentErrorType.USER_CANCELLED:
        return '❌';
      case PaymentErrorType.VERIFICATION_FAILED:
        return '⚠️';
      default:
        return '❌';
    }
  };

  const getErrorTitle = (): string => {
    switch (errorType) {
      case PaymentErrorType.NETWORK_ERROR:
        return 'Connection Error';
      case PaymentErrorType.INVALID_CARD:
        return 'Card Declined';
      case PaymentErrorType.INSUFFICIENT_FUNDS:
        return 'Insufficient Funds';
      case PaymentErrorType.SESSION_EXPIRED:
        return 'Session Expired';
      case PaymentErrorType.USER_CANCELLED:
        return 'Payment Cancelled';
      case PaymentErrorType.VERIFICATION_FAILED:
        return 'Verification Failed';
      default:
        return 'Payment Failed';
    }
  };

  return (
    <SafeAreaView style={[hsStyles.screen, styles.container]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Error Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.errorIcon}>{getErrorIcon()}</Text>
        </View>

        {/* Error Title */}
        <Text style={styles.errorTitle}>{getErrorTitle()}</Text>

        {/* Error Message */}
        <Text style={styles.errorMessage}>{errorMessage || 'Payment failed'}</Text>

        {/* Appointment Details */}
        <View style={styles.appointmentCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>
              ₹{appointmentDetails?.amount || 500}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{date}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={[styles.detailValue, styles.pendingStatus]}>
              Pending Payment
            </Text>
          </View>
        </View>

        {/* Retry Information */}
        {canRetry && (
          <View style={styles.retryInfo}>
            <Text style={styles.retryText}>
              {PaymentRetryManager.formatRetryMessage({
                retryCount,
                maxRetries,
              } as any)}
            </Text>
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          {canRetry && (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleRetry}
              disabled={retrying}
            >
              {retrying ? (
                <ActivityIndicator color={HS_COLORS.white} size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>🔄 Retry Payment</Text>
              )}
            </TouchableOpacity>
          )}

          {errorType === PaymentErrorType.INVALID_CARD ||
          errorType === PaymentErrorType.INSUFFICIENT_FUNDS ? (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleChangePaymentMethod}
              disabled={retrying}
            >
              <Text style={styles.secondaryButtonText}>💵 Try Other Method</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[styles.button, styles.tertiaryButton]}
            onPress={handleEditAppointment}
            disabled={retrying}
          >
            <Text style={styles.tertiaryButtonText}>📝 Edit Booking</Text>
          </TouchableOpacity>

          {!canRetry && (
            <TouchableOpacity
              style={[styles.button, styles.supportButton]}
              onPress={handleContactSupport}
            >
              <Text style={styles.supportButtonText}>🆘 Contact Support</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Info Message */}
        {!canRetry && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              You've exceeded the maximum retry attempts. Please contact our support team for assistance.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HS_COLORS.white,
  },
  content: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  errorIcon: {
    fontSize: 64,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: HS_COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 14,
    color: HS_COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  appointmentCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: HS_COLORS.warning,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: HS_COLORS.textMuted,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: HS_COLORS.text,
    fontWeight: '600',
  },
  pendingStatus: {
    color: HS_COLORS.warning,
  },
  divider: {
    height: 1,
    backgroundColor: HS_COLORS.border,
    marginVertical: 4,
  },
  retryInfo: {
    backgroundColor: '#E8F4F8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: HS_COLORS.primary,
  },
  retryText: {
    fontSize: 13,
    color: HS_COLORS.primary,
    fontWeight: '500',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 24,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: HS_COLORS.primary,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: HS_COLORS.white,
  },
  secondaryButton: {
    backgroundColor: HS_COLORS.success,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: HS_COLORS.white,
  },
  tertiaryButton: {
    backgroundColor: HS_COLORS.white,
    borderWidth: 1,
    borderColor: HS_COLORS.primary,
  },
  tertiaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: HS_COLORS.primary,
  },
  supportButton: {
    backgroundColor: HS_COLORS.warning,
  },
  supportButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: HS_COLORS.white,
  },
  infoBox: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: HS_COLORS.warning,
  },
  infoText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 18,
  },
});

export default HomeServicePaymentFailed;
