import { useMutation } from '@tanstack/react-query';
import api, { handleApiError } from '../lib/api';
import { ApiResponse } from '../lib/types';

// Types for OTP verification
export interface OtpRequestData {
  camper_code: string;
}

export interface OtpVerifyData {
  camper_code: string;
  otp_code: string;
}

export interface CamperData {
  age: number;
  camp_id: string;
  camper_code: string;
  category_id: string;
  church: {
    area: string;
    camp_id: string;
    district: string;
    id: string;
    name: string;
  };
  church_id: string;
  custom_field_responses: Record<string, any>;
  email: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  has_checked_in: boolean;
  has_paid: boolean;
  id: string;
  is_fully_paid: boolean;
  last_name: string;
  middle_name: string;
  outstanding_balance: number;
  payments: Array<{
    id: string;
    amount: number;
    payment_date: string;
    payment_channel: string;
    recorded_by: string;
    payment_reference: string;
    payment_metadata: Record<string, any>;
  }>;
  phone_number: string;
  registration_date: string;
  registration_link_id: string;
  sex: string;
  surname: string;
  total_amount: string;
  total_payments: number;
}

// Hook for requesting OTP
export const useOtpRequest = () => {
  return useMutation({
    mutationFn: async (data: OtpRequestData) => {
      const response = await api.post<ApiResponse<any>>('/register/otp/request', { data });
      return response.data;
    },
    onError: (error) => {
      throw new Error(handleApiError(error));
    },
  });
};

// Hook for verifying OTP
export const useOtpVerify = () => {
  return useMutation({
    mutationFn: async (data: OtpVerifyData): Promise<CamperData> => {
      const response = await api.post<ApiResponse<CamperData>>('/register/otp/verify', { data });
      return response.data.data;
    },
    onError: (error) => {
      throw new Error(handleApiError(error));
    },
  });
};
