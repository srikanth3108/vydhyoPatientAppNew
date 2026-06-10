import axios from 'axios';
import {ENDPOINTS} from './endpoints';

const HOME_CARE_BASE_URL = 'http://localhost:4002';

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

// Separate axios instance for home care API
const homeCareApi = axios.create({
  baseURL: HOME_CARE_BASE_URL,
});

// Common error handler
const handleApiError = (err: any): string => {
  if (err?.response?.data?.message) {
    return err.response.data.message;
  }
  if (err?.response?.data?.error) {
    return typeof err.response.data.error === 'string'
      ? err.response.data.error
      : JSON.stringify(err.response.data.error);
  }
  return 'Failed to fetch data';
};

/**
 * Fetch all available home care roles
 */
export async function getHomeCareRoles(
  token?: string | null | undefined,
): Promise<{roles: string[]; error?: string}> {
  try {
    const config: any = {};
    if (token) {
      config.headers = {Authorization: `Bearer ${token}`};
    }

    const response = await homeCareApi.get(
      ENDPOINTS.GET_HOME_CARE_ROLES,
      config,
    );
    const apiData = response.data as ApiResponse<string[]>;

    if (apiData.success && apiData.data && Array.isArray(apiData.data)) {
      return {roles: apiData.data};
    }

    return {roles: [], error: 'Invalid response format'};
  } catch (err) {
    console.error('Error fetching home care roles:', err);
    const errorMsg = handleApiError(err);
    return {roles: [], error: errorMsg};
  }
}

/**
 * Fetch providers for a specific role
 */
export async function getProvidersByRole(
  role: string,
  token?: string | null | undefined,
): Promise<{providers: HomeCareProvider[]; error?: string}> {
  try {
    const config: any = {};
    if (token) {
      config.headers = {Authorization: `Bearer ${token}`};
    }

    const response = await homeCareApi.get(
      ENDPOINTS.GET_HOME_CARE_PROVIDERS_ROLE + role,
      config,
    );
    const apiData = response.data as ApiResponse<HomeCareProvider[]>;

    if (apiData.success && apiData.data && Array.isArray(apiData.data)) {
      return {providers: apiData.data};
    }

    return {providers: [], error: 'Invalid response format'};
  } catch (err) {
    console.error('Error fetching providers for role:', err);
    const errorMsg = handleApiError(err);
    return {providers: [], error: errorMsg};
  }
}

/**
 * Fetch a specific provider by ID
 */
export async function getProviderDetailsById(
  providerId: string,
  token?: string | null | undefined,
): Promise<{provider: HomeCareProvider | null; error?: string}> {
  try {
    const config: any = {};
    if (token) {
      config.headers = {Authorization: `Bearer ${token}`};
    }

    const response = await homeCareApi.get(
      ENDPOINTS.GET_HOME_CARE_PROVIDER_ID(providerId),
      config,
    );
    const apiData = response.data as any;

    if (apiData.success && apiData.data) {
      // Handle the response structure with profile and documents
      const profileData = apiData.data.profile || apiData.data;
      const documentsData = apiData.data.documents?.documents || [];

      // Merge documents into profile
      const provider = {
        ...profileData,
        documents: documentsData,
      } as HomeCareProvider;

      return {provider};
    }

    return {provider: null, error: 'Invalid response format'};
  } catch (err) {
    console.error('Error fetching provider:', err);
    const errorMsg = handleApiError(err);
    return {provider: null, error: errorMsg};
  }
}
