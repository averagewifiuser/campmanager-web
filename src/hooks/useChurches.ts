// src/hooks/useChurches.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { churchesApi, handleApiError } from '@/lib/api';
// import type { Church } from '@/lib/types';

// Query keys
export const churchKeys = {
  all: ['churches'] as const,
  lists: () => [...churchKeys.all, 'list'] as const,
  list: (campId: string) => [...churchKeys.lists(), campId] as const,
};

// Get all churches for a camp
export const useChurches = (campId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: churchKeys.list(campId),
    queryFn: () => churchesApi.getChurches(campId),
    enabled: !!campId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create church mutation
  const createChurch = useMutation({
    mutationFn: (data: { name: string }) => churchesApi.createChurch(campId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: churchKeys.list(campId) });
    },
    onError: (error) => {
      throw new Error(handleApiError(error));
    },
  });

  // Update church mutation
  const updateChurch = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string } }) => 
      churchesApi.updateChurch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: churchKeys.list(campId) });
    },
    onError: (error) => {
      throw new Error(handleApiError(error));
    },
  });

  // Delete church mutation
  const deleteChurch = useMutation({
    mutationFn: (churchId: string) => churchesApi.deleteChurch(churchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: churchKeys.list(campId) });
    },
    onError: (error) => {
      throw new Error(handleApiError(error));
    },
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createChurch: createChurch.mutateAsync,
    updateChurch: updateChurch.mutateAsync,
    deleteChurch: deleteChurch.mutateAsync,
  };
};