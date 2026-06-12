import AsyncStorage from '@react-native-async-storage/async-storage';
import server from './auth';
import { ENDPOINTS } from './endpoints';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

// Home Care Types
export interface HomeCareRole {
  name: string;
}

export interface HomeCareProvider {
  _id: string;
  userId: string;
  role: string;
  profilePhoto: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  mobile: string;
  homeAddress: string;
  profession: string;
  highestQualification: string;
  totalExperience: number;
  specialization: string;
  selectedServices: string[];
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  verificationStatus: string;
  rejectionReason: string | null;
  availableForBooking: boolean;
  overallRating: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
  consultationFee: number;
  __v: number;
  documents?: Document[];
}

interface Document {
  documentType: string;
  fileName: string;
  fileUrl: string;
  _id: string;
}

interface ApiResponse<T> {
  success: boolean;
  count: number;
  data: T;
}

// Provider Booking Types
export interface SlotData {
  time: string;
  status: 'available' | 'booked';
  appointmentId: string | null;
}

export interface DateSlots {
  date: string;
  day: string;
  totalSlots: number;
  availableSlots: number;
  slots: SlotData[];
}

export interface ProviderInfo {
  providerId: string;
  providerName: string;
  consultationFee: number;
  specialization: string;
}

export interface ProviderAvailability {
  from: string;
  to: string;
  totalDays: number;
}

export interface GetProviderAvailabilityResponse {
  status: 'success' | 'error';
  provider: ProviderInfo;
  availability: ProviderAvailability;
  dates: DateSlots[];
  message?: string;
}

export interface CreateAppointmentRequest {
  userId: string;
  bookingFor: 'self' | 'family';
  familyMemberId?: string;
  providerId: string;
  appointmentDate: string;
  appointmentTime: string;
  quickPick: string;
  appointmentReason: string;
  patientAddressId: string;
  visitAddress: {
    buildingName: string;
    flatNumber: string;
    street: string;
    landmark: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    latitude: number;
    longitude: number;
  };
  paymentMethod: 'upi' | 'card' | 'wallet';
  amount: number;
}

export interface AppointmentData {
  appointmentId: string;
  userId: string;
  bookingFor: 'self' | 'family';
  familyMemberId?: string;
  providerId: string;
  appointmentDate: string;
  appointmentTime: string;
  quickPick: string;
  appointmentReason: string;
  medicalReports: any[];
  patientAddressId: string;
  visitAddress: {
    buildingName: string;
    flatNumber: string;
    street: string;
    landmark: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    latitude: number;
    longitude: number;
  };
  amount: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'success' | 'failed';
  refundAmount: number;
  providerSettlementStatus: string;
  appointmentStatus: 'pending_payment' | 'scheduled' | 'completed' | 'cancelled';
  isPatientVerified: boolean;
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentResponse {
  status: 'success' | 'error';
  message: string;
  data?: AppointmentData;
}

export interface PaymentResponse {
  status: 'success' | 'error';
  message: string;
  data?: AppointmentData;
}

export interface FamilyMember {
  _id: string;
  familyMemberId: string;
  userId: string;
  name: string;
  relation: string;
  gender: string;
  age: number;
  mobile: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMembersResponse {
  status: 'success' | 'error';
  count: number;
  familyMembers: FamilyMember[];
  message?: string;
}

export interface AddFamilyMemberRequest {
  name: string;
  relation: string;
  gender: string;
  age: number;
  mobile: string;
}

export interface AddFamilyMemberResponse {
  status: 'success' | 'error';
  message: string;
  familyMember?: FamilyMember;
}

export interface UpdateFamilyMemberRequest {
  name: string;
  relation: string;
  gender: string;
  age: number;
  mobile: string;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

const handleApiError = (err: any): string => {
  if (err?.response?.data?.message) {
    return err.response.data.message;
  }
  if (err?.response?.data?.error) {
    return typeof err.response.data.error === 'string'
      ? err.response.data.error
      : JSON.stringify(err.response.data.error);
  }
  return 'Failed to perform operation';
};

// ============================================================================
// HOME CARE PROVIDER API FUNCTIONS
// ============================================================================

/**
 * Fetch all available home care roles
 */
export const getHomeCareRoles = async () => {
  try {
    const response = await server.get(ENDPOINTS.GET_HOME_CARE_ROLES, {
      requiresAuth: true,
    });

    const apiData = response.data as ApiResponse<string[]>;
    if (apiData.success && apiData.data && Array.isArray(apiData.data)) {
      return { roles: apiData.data };
    }
    return { roles: [], error: 'Invalid response format' };
  } catch (err) {
    console.error('Error fetching home care roles:', err);
    const errorMsg = handleApiError(err);
    return { roles: [], error: errorMsg };
  }
};

/**
 * Fetch providers for a specific role
 */
export const getProvidersByRole = async (
  role: string,
) => {
  try {
    const response = await server.get(ENDPOINTS.GET_HOME_CARE_PROVIDERS_ROLE + role, {
      requiresAuth: true,
    });

    const apiData = response.data as ApiResponse<HomeCareProvider[]>;
    if (apiData.success && apiData.data && Array.isArray(apiData.data)) {
      return { providers: apiData.data };
    }
    return { providers: [], error: 'Invalid response format' };
  } catch (err) {
    console.error('Error fetching providers for role:', err);
    const errorMsg = handleApiError(err);
    return { providers: [], error: errorMsg };
  }
};

/**
 * Fetch a specific provider by ID
 */
export const getProviderDetailsById = async (
  providerId: string,
) => {
  try {
    const response = await server.get(ENDPOINTS.GET_HOME_CARE_PROVIDER_ID(providerId), {
      requiresAuth: true,
    });
    const apiData = response.data as any;
    if (apiData.success && apiData.data) {
      const profileData = apiData.data.profile || apiData.data;
      const documentsData = apiData.data.documents?.documents || [];

      const provider = {
        ...profileData,
        documents: documentsData,
      } as HomeCareProvider;

      return { provider };
    }

    return { provider: null, error: 'Invalid response format' };
  } catch (err) {
    console.error('Error fetching provider:', err);
    const errorMsg = handleApiError(err);
    return { provider: null, error: errorMsg };
  }
};

// ============================================================================
// PROVIDER BOOKING API FUNCTIONS
// ============================================================================

/**
 * Get provider availability and slots
 */
export const getProviderSlotsAvailability = async (providerId: string) => {
  try {
    const response = await server.get(
      `provider-slots/getProviderAvailability?providerId=${providerId}`,
      { requiresAuth: true },
    );
    return { data: response.data };
  } catch (err) {
    console.error('Error fetching provider availability:', err);
    const errorMsg = handleApiError(err);
    return { error: errorMsg };
  }
};

/**
 * Create provider appointment - with Cashfree payment gateway
 */
export const createProviderAppointment = async (appointmentData: CreateAppointmentRequest) => {
  try {
      const response = await server.post(ENDPOINTS.CREATE_PROVIDER_APPOINTMENT, appointmentData, {
        requiresAuth: true,
      });
    const result = response.data as any;
    console.log('✓ Appointment Creation Response:', result);
    
    if (result.status === 'success' && result.data) {
      // Response contains both appointmentDetails and paymentDetails
      console.log('✓ Payment Details in Response:', {
        hasPaymentDetails: !!result.data.paymentDetails,
        payment_session_id: result.data.paymentDetails?.payment_session_id?.substring(0, 30) + '...',
        order_id: result.data.paymentDetails?.order_id,
      });

      return { 
        data: result.data.appointmentDetails,
        paymentDetails: result.data.paymentDetails,
        fullResponse: result.data
      };
    }
    console.error('❌ Appointment creation failed:', result.message);
    return { error: result.message || 'Failed to create appointment' };
  } catch (err) {
    console.error('Error creating provider appointment:', err);
    const errorMsg = handleApiError(err);
    return { error: errorMsg };
  }
};

/**
 * Handle payment success - Verify appointment payment status
 */
export const providerPaymentSuccess = async (appointmentId: string) => {
  try {
    const response = await server.post(ENDPOINTS.PAYMENT_VERIFY,
      { appointmentId },
      { requiresAuth: true },
    );
    const result = response.data as PaymentResponse;
    if (result.status === 'success' && result.data) {
      return { data: result.data };
    }
    return { error: result.message || 'Payment success failed' };
  } catch (err) {
    console.error('Error processing payment success:', err);
    const errorMsg = handleApiError(err);
    return { error: errorMsg };
  }
};

/**
 * Verify provider appointment payment by order ID
 */
export const verifyProviderAppointmentPayment = async (orderId: string) => {
  try {
    const response = await server.post(ENDPOINTS.PAYMENT_VERIFY,
      { appointmentId: orderId },
      { requiresAuth: true },
    );
    const result = response.data as PaymentResponse;
    if (result.status === 'success' && result.data) {
      return { data: result.data, success: true };
    }
    return { error: result.message || 'Payment verification failed', success: false };
  } catch (err) {
    console.error('Error verifying provider appointment payment:', err);
    const errorMsg = handleApiError(err);
    return { error: errorMsg, success: false };
  }
};

/**
 * Extract payment session details from appointment creation response
 */
export interface PaymentSessionData {
  payment_session_id: string;
  order_id: string;
  customer_id: string;
  customer_email: string;
  customer_phone: string;
  order_amount: number;
  order_currency: string;
}

export const extractPaymentSessionFromResponse = (responseData: any): PaymentSessionData | null => {
  try {
    console.log('🔎 Extracting payment session from:', {
      hasPaymentDetails: !!responseData?.paymentDetails,
      hasData: !!responseData?.data,
      hasPaymentSessionId: !!responseData?.payment_session_id,
      keys: Object.keys(responseData || {}).slice(0, 5),
    });

    // Try multiple response structures
    let paymentDetails = null;

    // Structure 1: Direct paymentDetails property (most common)
    if (responseData?.paymentDetails) {
      console.log('✓ Found paymentDetails at level 1');
      paymentDetails = responseData.paymentDetails;
    }
    // Structure 2: Inside data wrapper (nested)
    else if (responseData?.data?.paymentDetails) {
      console.log('✓ Found paymentDetails inside data');
      paymentDetails = responseData.data.paymentDetails;
    }
    // Structure 3: The entire object might be paymentDetails
    else if (responseData?.payment_session_id) {
      console.log('✓ Found payment_session_id at root level');
      paymentDetails = responseData;
    }
    // Structure 4: Check for alternative naming
    else if (responseData?.paymentSessionData) {
      console.log('✓ Found paymentSessionData');
      paymentDetails = responseData.paymentSessionData;
    }

    if (!paymentDetails) {
      console.error('❌ Payment details not found in response:', {
        hasPaymentDetails: !!responseData?.paymentDetails,
        hasData: !!responseData?.data,
        responseKeys: Object.keys(responseData || {}),
      });
      return null;
    }

    // Validate required fields
    if (!paymentDetails.payment_session_id) {
      console.error('❌ payment_session_id missing:', {
        payment_session_id: paymentDetails.payment_session_id,
        keys: Object.keys(paymentDetails),
      });
      return null;
    }

    if (!paymentDetails.order_id) {
      console.error('❌ order_id missing:', {
        order_id: paymentDetails.order_id,
        keys: Object.keys(paymentDetails),
      });
      return null;
    }

    const extracted = {
      payment_session_id: paymentDetails.payment_session_id,
      order_id: paymentDetails.order_id,
      customer_id: paymentDetails.customer_details?.customer_id || paymentDetails.customer_id || '',
      customer_email: paymentDetails.customer_details?.customer_email || paymentDetails.customer_email || '',
      customer_phone: paymentDetails.customer_details?.customer_phone || paymentDetails.customer_phone || '',
      order_amount: paymentDetails.order_amount || 0,
      order_currency: paymentDetails.order_currency || 'INR',
    };

    console.log('✅ Successfully extracted:', {
      payment_session_id: extracted.payment_session_id?.substring(0, 30) + '...',
      order_id: extracted.order_id,
      order_amount: extracted.order_amount,
    });

    return extracted;
  } catch (err) {
    console.error('❌ Error extracting payment session:', err);
    return null;
  }
};


// ============================================================================
// FAMILY MEMBERS API FUNCTIONS
// ============================================================================

/**
 * Get family members
 */
export const getFamilyMembers = async () => {
  try {
    const response = await server.get('/family-member/getFamilyMembers', { requiresAuth: true });
    const result = response.data as FamilyMembersResponse;
    if (result.status === 'success') {
      return { familyMembers: result.familyMembers };
    }
    return { error: result.message || 'Failed to fetch family members' };
  } catch (err) {
    console.error('Error fetching family members:', err);
    const errorMsg = handleApiError(err);
    return { error: errorMsg };
  }
};

/**
 * Add family member
 */
export const addFamilyMember = async (data: AddFamilyMemberRequest) => {
  return server.post('/family-member/addFamilyMember', data, { requiresAuth: true });
};

/**
 * Update family member
 */
export const updateFamilyMember = async (familyMemberId: string, data: UpdateFamilyMemberRequest) => {
  return server.put(`/family-member/updateFamilyMember/${familyMemberId}`, data, {
    requiresAuth: true,
  });
};

/**
 * Delete family member
 */
export const deleteFamilyMember = async (familyMemberId: string) => {
  try {
    const response = await server.delete(`/family-member/deleteFamilyMember/${familyMemberId}`, {
      requiresAuth: true,
    });
    const result = response.data as any;
    if (result.status === 'success') {
      return { success: true };
    }
    return { success: false, error: result.message || 'Failed to delete family member' };
  } catch (err) {
    console.error('Error deleting family member:', err);
    const errorMsg = handleApiError(err);
    return { success: false, error: errorMsg };
  }
};


// get address by id
export const getAddressById = async (userId: string) => {
  try {
    const response = await server.get(
      ENDPOINTS.GET_ADDRESSES,
      {
        headers: {
          userId,
        },
        requiresAuth: true,
      } as any,
    );

    return response.data;
  } catch (err) {
    console.error('Error fetching address:', err);
    return { error: handleApiError(err) };
  }
};



