// src/hooks/usePublicRegistration.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { publicApi, handleApiError } from '@/lib/api';
import type { 
  PublicRegistrationData, 
  RegistrationFormData, 
  RegistrationLinkStatus 
} from '@/lib/types';

// Query keys for public registration
export const publicRegistrationKeys = {
  all: ['publicRegistration'] as const,
  campForm: (campId: string) => [...publicRegistrationKeys.all, 'campForm', campId] as const,
  linkForm: (linkToken: string) => [...publicRegistrationKeys.all, 'linkForm', linkToken] as const,
  linkStatus: (linkToken: string) => [...publicRegistrationKeys.all, 'linkStatus', linkToken] as const,
};

// Get camp registration form (general registration)
export const useCampRegistrationForm = (campId: string) => {
  return useQuery({
    queryKey: publicRegistrationKeys.campForm(campId),
    queryFn: () => publicApi.getCampRegistrationForm(campId),
    enabled: !!campId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

// Get registration form by link token
export const useRegistrationFormByLink = (linkToken: string) => {
  return useQuery({
    queryKey: publicRegistrationKeys.linkForm(linkToken),
    queryFn: () => publicApi.getCampRegistrationFormByLink(linkToken),
    enabled: !!linkToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

// Check registration link status
export const useRegistrationLinkStatus = (linkToken: string) => {
  return useQuery({
    queryKey: publicRegistrationKeys.linkStatus(linkToken),
    queryFn: () => publicApi.checkRegistrationLink(linkToken),
    enabled: !!linkToken,
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
  });
};

// Submit general camp registration
export const useSubmitRegistration = () => {
  return useMutation({
    mutationFn: ({ campId, data }: { campId: string; data: RegistrationFormData }) => 
      publicApi.submitRegistration(campId, data),
    onError: (error) => {
      throw new Error(handleApiError(error));
    },
  });
};

// Submit registration via link
export const useSubmitRegistrationByLink = () => {
  return useMutation({
    mutationFn: ({ linkToken, data }: { linkToken: string; data: RegistrationFormData }) => 
      publicApi.submitRegistrationByLink(linkToken, data),
    onError: (error) => {
      throw new Error(handleApiError(error));
    },
  });
};