import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PaymentState,
  PaymentStatus,
  PaymentErrorType,
  RetryConfig,
} from '../types/paymentTypes';

const PAYMENT_STATE_KEY = 'vydhyo_payment_state';
const RETRY_CONFIG_KEY = 'vydhyo_retry_config';

// Default retry configuration
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  retryDelays: [1000, 2000, 5000, 10000, 15000], // Progressive delays
  autoRetryOnNetworkError: true,
};

// ============================================================================
// PAYMENT STATE MANAGER
// ============================================================================

export class PaymentStateManager {
  /**
   * Save payment state to local storage
   */
  static async savePaymentState(state: PaymentState): Promise<void> {
    try {
      console.log('💾 Saving payment state:', state.orderId);
      await AsyncStorage.setItem(PAYMENT_STATE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('❌ Failed to save payment state:', error);
    }
  }

  /**
   * Get saved payment state
   */
  static async getPaymentState(): Promise<PaymentState | null> {
    try {
      const state = await AsyncStorage.getItem(PAYMENT_STATE_KEY);
      if (state) {
        console.log('✓ Retrieved payment state from storage');
        return JSON.parse(state);
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get payment state:', error);
      return null;
    }
  }

  /**
   * Clear payment state (after successful completion)
   */
  static async clearPaymentState(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PAYMENT_STATE_KEY);
      console.log('✓ Payment state cleared');
    } catch (error) {
      console.error('❌ Failed to clear payment state:', error);
    }
  }

  /**
   * Check if there's a pending payment
   */
  static async hasPendingPayment(): Promise<boolean> {
    const state = await this.getPaymentState();
    return (
      state !== null &&
      (state.status === PaymentStatus.FAILED ||
        state.status === PaymentStatus.CANCELLED)
    );
  }

  /**
   * Update retry count
   */
  static async incrementRetryCount(): Promise<PaymentState | null> {
    const state = await this.getPaymentState();
    if (state) {
      const updatedState = {
        ...state,
        retryCount: state.retryCount + 1,
        lastRetryTime: Date.now(),
        canRetry:
          state.retryCount + 1 < state.maxRetries &&
          state.errorType !== PaymentErrorType.USER_CANCELLED,
      };
      await this.savePaymentState(updatedState);
      return updatedState;
    }
    return null;
  }

  /**
   * Update payment status
   */
  static async updatePaymentStatus(
    status: PaymentStatus,
    errorType?: PaymentErrorType,
    errorMessage?: string
  ): Promise<PaymentState | null> {
    const state = await this.getPaymentState();
    if (state) {
      const updatedState = {
        ...state,
        status,
        errorType,
        errorMessage,
        timestamp: Date.now(),
      };
      await this.savePaymentState(updatedState);
      return updatedState;
    }
    return null;
  }

  /**
   * Create initial payment state
   */
  static createInitialPaymentState(
    appointmentId: string,
    orderId: string,
    sessionId: string,
    amount: number
  ): PaymentState {
    return {
      appointmentId,
      orderId,
      sessionId,
      amount,
      status: PaymentStatus.INITIATED,
      retryCount: 0,
      maxRetries: DEFAULT_RETRY_CONFIG.maxRetries,
      canRetry: true,
      lastRetryTime: 0,
      timestamp: Date.now(),
    };
  }
}

// ============================================================================
// ERROR CATEGORIZATION
// ============================================================================

export class PaymentErrorCategorizer {
  /**
   * Categorize payment error based on error object
   */
  static categorizeError(error: any): {
    errorType: PaymentErrorType;
    message: string;
  } {
    const errorString = JSON.stringify(error).toLowerCase();
    const errorMessage = error?.message || error?.toString() || '';

    // Network errors
    if (
      errorString.includes('network') ||
      errorString.includes('unable to connect') ||
      errorString.includes('timeout') ||
      errorString.includes('enotfound')
    ) {
      return {
        errorType: PaymentErrorType.NETWORK_ERROR,
        message: 'Unable to connect to payment server. Please check your internet connection.',
      };
    }

    // Card errors
    if (
      errorString.includes('card') ||
      errorString.includes('invalid') ||
      errorString.includes('declined')
    ) {
      return {
        errorType: PaymentErrorType.INVALID_CARD,
        message: 'Card declined. Please try another card or payment method.',
      };
    }

    // Insufficient funds
    if (errorString.includes('insufficient') || errorString.includes('balance')) {
      return {
        errorType: PaymentErrorType.INSUFFICIENT_FUNDS,
        message: 'Insufficient funds. Please try another payment method.',
      };
    }

    // Session expired
    if (
      errorString.includes('session') ||
      errorString.includes('expired') ||
      errorString.includes('invalid')
    ) {
      return {
        errorType: PaymentErrorType.SESSION_EXPIRED,
        message: 'Payment session expired. Generating new session...',
      };
    }

    // User cancelled
    if (
      errorString.includes('cancel') ||
      errorString.includes('user abort') ||
      errorString.includes('user_abort')
    ) {
      return {
        errorType: PaymentErrorType.USER_CANCELLED,
        message: 'Payment cancelled. Click retry to try again.',
      };
    }

    // Verification failed
    if (
      errorString.includes('verification') ||
      errorString.includes('unable to verify')
    ) {
      return {
        errorType: PaymentErrorType.VERIFICATION_FAILED,
        message: 'Payment received but unable to verify. Retrying verification...',
      };
    }

    // Gateway errors
    if (errorString.includes('gateway') || errorString.includes('500')) {
      return {
        errorType: PaymentErrorType.GATEWAY_ERROR,
        message: 'Payment gateway error. Please try again.',
      };
    }

    // Default
    return {
      errorType: PaymentErrorType.UNKNOWN,
      message: errorMessage || 'Payment failed. Please try again.',
    };
  }

  /**
   * Is error recoverable with retry?
   */
  static isRecoverableError(errorType: PaymentErrorType): boolean {
    return [
      PaymentErrorType.NETWORK_ERROR,
      PaymentErrorType.SESSION_EXPIRED,
      PaymentErrorType.VERIFICATION_FAILED,
      PaymentErrorType.GATEWAY_ERROR,
    ].includes(errorType);
  }

  /**
   * Should auto-retry this error?
   */
  static shouldAutoRetry(errorType: PaymentErrorType): boolean {
    return [
      PaymentErrorType.NETWORK_ERROR,
      PaymentErrorType.SESSION_EXPIRED,
      PaymentErrorType.VERIFICATION_FAILED,
    ].includes(errorType);
  }
}

// ============================================================================
// RETRY LOGIC
// ============================================================================

export class PaymentRetryManager {
  /**
   * Calculate delay for next retry based on attempt number
   */
  static getRetryDelay(retryCount: number): number {
    const delays = DEFAULT_RETRY_CONFIG.retryDelays;
    return delays[Math.min(retryCount, delays.length - 1)];
  }

  /**
   * Check if retry is possible
   */
  static canRetry(paymentState: PaymentState): boolean {
    if (!paymentState.canRetry) {
      return false;
    }

    if (paymentState.retryCount >= paymentState.maxRetries) {
      return false;
    }

    const errorType = paymentState.errorType;
    if (errorType && !PaymentErrorCategorizer.isRecoverableError(errorType)) {
      return false;
    }

    return true;
  }

  /**
   * Wait before retry
   */
  static async waitBeforeRetry(retryCount: number): Promise<void> {
    const delay = this.getRetryDelay(retryCount);
    console.log(`⏳ Waiting ${delay}ms before retry #${retryCount + 1}...`);
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Format retry message
   */
  static formatRetryMessage(paymentState: PaymentState): string {
    const { retryCount, maxRetries } = paymentState;
    return `Attempt ${retryCount + 1} of ${maxRetries}`;
  }
}
