// Payment Error Types
export enum PaymentErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_CARD = 'INVALID_CARD',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  USER_CANCELLED = 'USER_CANCELLED',
  GATEWAY_ERROR = 'GATEWAY_ERROR',
  UNKNOWN = 'UNKNOWN',
}

// Payment States
export enum PaymentStatus {
  INITIATED = 'initiated',
  GATEWAY_OPEN = 'gateway_open',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  VERIFYING = 'verifying',
}

// Payment State Interface
export interface PaymentState {
  appointmentId: string;
  orderId: string;
  sessionId: string;
  amount: number;
  status: PaymentStatus;
  errorType?: PaymentErrorType;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  canRetry: boolean;
  lastRetryTime: number;
  timestamp: number;
  transactionId?: string;
  userId?: string;
}

// Payment Response
export interface PaymentResponse {
  success: boolean;
  status: PaymentStatus;
  errorType?: PaymentErrorType;
  errorMessage?: string;
  data?: any;
  transactionId?: string;
}

// Retry Configuration
export interface RetryConfig {
  maxRetries: number;
  retryDelays: number[]; // In milliseconds
  autoRetryOnNetworkError: boolean;
}
