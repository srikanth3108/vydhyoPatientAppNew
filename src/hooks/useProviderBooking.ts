import { useState, useCallback } from 'react';
import {
  createProviderAppointment,
  providerPaymentSuccess,
  providerPaymentFailure,
  CreateAppointmentRequest,
  AppointmentData,
} from '../services/homeCareService';

export interface BookingState {
  loading: boolean;
  error: string | null;
  appointmentId: string | null;
  appointmentData: AppointmentData | null;
}

export const useProviderBooking = () => {
  const [state, setState] = useState<BookingState>({
    loading: false,
    error: null,
    appointmentId: null,
    appointmentData: null,
  });

  const createAppointment = useCallback(
    async (appointmentData: CreateAppointmentRequest) => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const { data, error } = await createProviderAppointment(appointmentData);
      
      if (error) {
        setState(prev => ({ ...prev, loading: false, error }));
        return { success: false, error };
      }

      if (data) {
        setState(prev => ({
          ...prev,
          loading: false,
          appointmentId: data.appointmentId,
          appointmentData: data,
        }));
        return { success: true, data };
      }

      const genericError = 'Failed to create appointment';
      setState(prev => ({ ...prev, loading: false, error: genericError }));
      return { success: false, error: genericError };
    },
    [],
  );

  const processPaymentSuccess = useCallback(
    async (appointmentId: string) => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const { data, error } = await providerPaymentSuccess(appointmentId);
      
      if (error) {
        setState(prev => ({ ...prev, loading: false, error }));
        return { success: false, error };
      }

      if (data) {
        setState(prev => ({
          ...prev,
          loading: false,
          appointmentData: data,
        }));
        return { success: true, data };
      }

      const genericError = 'Payment processing failed';
      setState(prev => ({ ...prev, loading: false, error: genericError }));
      return { success: false, error: genericError };
    },
    [],
  );

  const processPaymentFailure = useCallback(
    async (appointmentId: string) => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const { success, error } = await providerPaymentFailure(appointmentId);
      
      if (!success) {
        setState(prev => ({ ...prev, loading: false, error: error || 'Failed to process payment failure' }));
        return { success: false, error };
      }

      setState(prev => ({ ...prev, loading: false }));
      return { success: true };
    },
    [],
  );

  const resetState = useCallback(() => {
    setState({
      loading: false,
      error: null,
      appointmentId: null,
      appointmentData: null,
    });
  }, []);

  return {
    ...state,
    createAppointment,
    processPaymentSuccess,
    processPaymentFailure,
    resetState,
  };
};
