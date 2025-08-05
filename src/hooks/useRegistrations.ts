// src/hooks/useRegistrations.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { registrationsApi, campsApi, handleApiError } from '@/lib/api';
import type { Registration, CampStats } from '@/lib/types';

// Query keys
export const registrationKeys = {
  all: ['registrations'] as const,
  lists: () => [...registrationKeys.all, 'list'] as const,
  list: (campId: string) => [...registrationKeys.lists(), campId] as const,
  details: () => [...registrationKeys.all, 'detail'] as const,
  detail: (id: string) => [...registrationKeys.details(), id] as const,
  stats: (campId: string) => ['camps', campId, 'stats'] as const,
};

// Get all registrations for a camp
export const useCampRegistrations = (campId: string) => {
  return useQuery({
    queryKey: registrationKeys.list(campId),
    queryFn: () => registrationsApi.getCampRegistrations(campId),
    enabled: !!campId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Get single registration
export const useRegistration = (registrationId: string) => {
  return useQuery({
    queryKey: registrationKeys.detail(registrationId),
    queryFn: () => registrationsApi.getRegistration(registrationId),
    enabled: !!registrationId,
  });
};

// Get camp statistics
export const useCampStats = (campId: string) => {
  return useQuery({
    queryKey: registrationKeys.stats(campId),
    queryFn: () => campsApi.getCampStats(campId),
    enabled: !!campId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Update registration mutation
export const useUpdateRegistration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Registration> }) => 
      registrationsApi.updateRegistration(id, data),
    onSuccess: (updatedRegistration, { id }) => {
      // Update individual registration cache
      queryClient.setQueryData(
        registrationKeys.detail(id), 
        updatedRegistration
      );
      
      // Update registrations list cache
      queryClient.setQueryData<Registration[]>(
        registrationKeys.list(updatedRegistration.camp_id),
        (oldRegistrations) => {
          if (!oldRegistrations) return [updatedRegistration];
          return oldRegistrations.map(reg => 
            reg.id === updatedRegistration.id ? updatedRegistration : reg
          );
        }
      );
      
      // Invalidate stats
      queryClient.invalidateQueries({ 
        queryKey: registrationKeys.stats(updatedRegistration.camp_id) 
      });
    },
    onError: (error) => {
      throw new Error(handleApiError(error));
    },
  });
};

// Update payment status mutation
export const useUpdatePaymentStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ registrationId, hasPaid }: { registrationId: string; hasPaid: boolean }) => 
      registrationsApi.updatePaymentStatus(registrationId, hasPaid),
    onSuccess: (updatedRegistration) => {
      // Update individual registration cache
      queryClient.setQueryData(
        registrationKeys.detail(updatedRegistration.id), 
        updatedRegistration
      );
      
      // Update registrations list cache
      queryClient.setQueryData<Registration[]>(
        registrationKeys.list(updatedRegistration.camp_id),
        (oldRegistrations) => {
          if (!oldRegistrations) return [updatedRegistration];
          return oldRegistrations.map(reg => 
            reg.id === updatedRegistration.id ? updatedRegistration : reg
          );
        }
      );
      
      // Invalidate stats
      queryClient.invalidateQueries({ 
        queryKey: registrationKeys.stats(updatedRegistration.camp_id) 
      });
    },
    onError: (error) => {
      throw new Error(handleApiError(error));
    },
  });
};

// Update check-in status mutation
export const useUpdateCheckinStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ registrationId, hasCheckedIn }: { registrationId: string; hasCheckedIn: boolean }) => 
      registrationsApi.updateCheckinStatus(registrationId, hasCheckedIn),
    onSuccess: (updatedRegistration) => {
      // Update individual registration cache
      queryClient.setQueryData(
        registrationKeys.detail(updatedRegistration.id), 
        updatedRegistration
      );
      
      // Update registrations list cache
      queryClient.setQueryData<Registration[]>(
        registrationKeys.list(updatedRegistration.camp_id),
        (oldRegistrations) => {
          if (!oldRegistrations) return [updatedRegistration];
          return oldRegistrations.map(reg => 
            reg.id === updatedRegistration.id ? updatedRegistration : reg
          );
        }
      );
      
      // Invalidate stats
      queryClient.invalidateQueries({ 
        queryKey: registrationKeys.stats(updatedRegistration.camp_id) 
      });
    },
    onError: (error) => {
      throw new Error(handleApiError(error));
    },
  });
};

// Delete registration mutation
export const useDeleteRegistration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (registrationId: string) => registrationsApi.deleteRegistration(registrationId),
    onSuccess: (_, registrationId) => {
      // Remove from all caches
      queryClient.removeQueries({ queryKey: registrationKeys.detail(registrationId) });
      
      // Invalidate lists and stats
      queryClient.invalidateQueries({ queryKey: registrationKeys.lists() });
    },
    onError: (error) => {
      throw new Error(handleApiError(error));
    },
  });
};