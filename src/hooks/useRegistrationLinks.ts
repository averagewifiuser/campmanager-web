// src/hooks/useRegistrationLinks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { registrationLinksApi, handleApiError } from '@/lib/api';
import type { RegistrationLink, CreateRegistrationLinkRequest } from '@/lib/types';

// Query keys
export const registrationLinkKeys = {
  all: ['registrationLinks'] as const,
  lists: () => [...registrationLinkKeys.all, 'list'] as const,
  list: (campId: string) => [...registrationLinkKeys.lists(), campId] as const,
  details: () => [...registrationLinkKeys.all, 'detail'] as const,
  detail: (id: string) => [...registrationLinkKeys.details(), id] as const,
};

// Get all registration links for a camp
export const useRegistrationLinks = (campId: string) => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: registrationLinkKeys.list(campId),
    queryFn: () => registrationLinksApi.getRegistrationLinks(campId),
    enabled: !!campId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create registration link mutation
  const createLink = useMutation({
    mutationFn: (data: CreateRegistrationLinkRequest) => 
      registrationLinksApi.createRegistrationLink(campId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: registrationLinkKeys.list(campId)
      });
    },
    onError: (error) => {
      throw new Error(handleApiError(error));
    },
  });

  // Update registration link mutation
  const updateLink = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateRegistrationLinkRequest> }) => 
      registrationLinksApi.updateRegistrationLink(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: registrationLinkKeys.list(campId)
      });
    },
    onError: (error) => {
      throw new Error(handleApiError(error));
    },
  });

  // Toggle registration link active status mutation
  const toggleLink = useMutation({
    mutationFn: (linkId: string) => registrationLinksApi.toggleRegistrationLink(linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: registrationLinkKeys.list(campId)
      });
    },
    onError: (error) => {
      throw new Error(handleApiError(error));
    },
  });

  // Delete registration link mutation
  const deleteLink = useMutation({
    mutationFn: (linkId: string) => registrationLinksApi.deleteRegistrationLink(linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: registrationLinkKeys.list(campId)
      });
    },
    onError: (error) => {
      throw new Error(handleApiError(error));
    },
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createLink: createLink.mutateAsync,
    updateLink: updateLink.mutateAsync,
    toggleLink: toggleLink.mutateAsync,
    deleteLink: deleteLink.mutateAsync,
    // Loading states for mutations
    isCreating: createLink.isPending,
    isUpdating: updateLink.isPending,
    isToggling: toggleLink.isPending,
    isDeleting: deleteLink.isPending,
  };
};

// Hook for getting a single registration link details
export const useRegistrationLink = (linkId: string) => {
  return useQuery({
    queryKey: registrationLinkKeys.detail(linkId),
    queryFn: () => registrationLinksApi.getRegistrationLink(linkId),
    enabled: !!linkId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};