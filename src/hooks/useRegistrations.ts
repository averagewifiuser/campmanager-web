// src/hooks/useRegistrations.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { registrationsApi, campsApi, handleApiError } from '@/lib/api';
import type { Registration } from '@/lib/types';

// Query keys
export const registrationKeys = {
  all: ['registrations'] as const,
  lists: () => [...registrationKeys.all, 'list'] as const,
  list: (campId: string) => [...registrationKeys.lists(), campId] as const,
  details: () => [...registrationKeys.all, 'detail'] as const,
  detail: (id: string) => [...registrationKeys.details(), id] as const,
  stats: (campId: string) => ['camps', campId, 'stats'] as const,
};

/**
 * Get all registrations for a camp, with optional filters.
 * @param campId - The camp ID
 * @param filters - Optional filters: { church_id?: string, category_id?: string }
 */
export const useCampRegistrations = (
  campId: string,
  filters?: { church_id?: string; category_id?: string }
) => {
  return useQuery({
    queryKey: [
      ...registrationKeys.list(campId),
      'filters',
      filters?.church_id || 'all',
      filters?.category_id || 'all'
    ],
    queryFn: () => registrationsApi.getCampRegistrations(campId, filters),
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
      
      // Invalidate all registration list queries for this camp (including filtered ones)
      queryClient.invalidateQueries({ 
        queryKey: registrationKeys.list(updatedRegistration.camp_id)
      });
      
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
      
      // Invalidate all registration list queries for this camp (including filtered ones)
      queryClient.invalidateQueries({ 
        queryKey: registrationKeys.list(updatedRegistration.camp_id)
      });
      
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
      
      // Invalidate all registration list queries for this camp (including filtered ones)
      queryClient.invalidateQueries({ 
        queryKey: registrationKeys.list(updatedRegistration.camp_id)
      });
      
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
