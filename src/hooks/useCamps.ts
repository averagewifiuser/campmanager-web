// src/hooks/useCamps.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campsApi, handleApiError } from '@/lib/api';
import type { Camp, CreateCampRequest } from '@/lib/types';

// Query keys for consistent cache management
export const campKeys = {
  all: ['camps'] as const,
  lists: () => [...campKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...campKeys.lists(), { filters }] as const,
  details: () => [...campKeys.all, 'detail'] as const,
  detail: (id: string) => [...campKeys.details(), id] as const,
};

// Get all camps
export const useCamps = () => {
  return useQuery({
    queryKey: campKeys.lists(),
    queryFn: campsApi.getCamps,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get single camp
export const useCamp = (id: string) => {
  return useQuery({
    queryKey: campKeys.detail(id),
    queryFn: () => campsApi.getCamp(id),
    enabled: !!id,
  });
};

// Create camp mutation
export const useCreateCamp = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateCampRequest) => campsApi.createCamp(data),
    onSuccess: () => {
      // Invalidate camps list to refetch
      queryClient.invalidateQueries({ queryKey: campKeys.lists() });
    },
    onError: (error) => {
      throw new Error(handleApiError(error));
    },
  });
};

// Update camp mutation
export const useUpdateCamp = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCampRequest> }) => 
      campsApi.updateCamp(id, data),
    onSuccess: (updatedCamp) => {
      // Update the camps list cache
      queryClient.setQueryData<Camp[]>(campKeys.lists(), (oldCamps) => {
        if (!oldCamps) return [updatedCamp];
        return oldCamps.map(camp => 
          camp.id === updatedCamp.id ? updatedCamp : camp
        );
      });
      
      // Update the individual camp cache
      queryClient.setQueryData(campKeys.detail(updatedCamp.id), updatedCamp);
    },
    onError: (error) => {
      throw new Error(handleApiError(error));
    },
  });
};

// Delete camp mutation
export const useDeleteCamp = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => campsApi.deleteCamp(id),
    onSuccess: (_, deletedId) => {
      // Remove from camps list cache
      queryClient.setQueryData<Camp[]>(campKeys.lists(), (oldCamps) => {
        if (!oldCamps) return [];
        return oldCamps.filter(camp => camp.id !== deletedId);
      });
      
      // Remove individual camp cache
      queryClient.removeQueries({ queryKey: campKeys.detail(deletedId) });
    },
    onError: (error) => {
      throw new Error(handleApiError(error));
    },
  });
};