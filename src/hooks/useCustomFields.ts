// src/hooks/useCustomFields.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customFieldsApi, handleApiError } from '@/lib/api';
import type { CustomField, CreateCustomFieldRequest } from '@/lib/types';

// Query keys
export const customFieldKeys = {
  all: ['customFields'] as const,
  lists: () => [...customFieldKeys.all, 'list'] as const,
  list: (campId: string) => [...customFieldKeys.lists(), campId] as const,
};

// Get all custom fields for a camp
export const useCustomFields = (campId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: customFieldKeys.list(campId),
    queryFn: () => customFieldsApi.getCustomFields(campId),
    enabled: !!campId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create custom field mutation
  const createField = useMutation({
    mutationFn: (data: CreateCustomFieldRequest) => customFieldsApi.createCustomField(campId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customFieldKeys.list(campId) });
    },
    onError: (error) => {
      throw new Error(handleApiError(error));
    },
  });

  // Update custom field mutation
  const updateField = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCustomFieldRequest> }) => 
      customFieldsApi.updateCustomField(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customFieldKeys.list(campId) });
    },
    onError: (error) => {
      throw new Error(handleApiError(error));
    },
  });

  // Delete custom field mutation
  const deleteField = useMutation({
    mutationFn: (fieldId: string) => customFieldsApi.deleteCustomField(fieldId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customFieldKeys.list(campId) });
    },
    onError: (error) => {
      throw new Error(handleApiError(error));
    },
  });

  // Reorder fields (you might want to implement this in your API)
  const reorderFields = async (fields: CustomField[]) => {
    // This would require a separate API endpoint to update field orders
    // For now, we'll just log it
    console.log('Reordering fields:', fields);
    // TODO: Implement API endpoint for reordering
  };

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createField: createField.mutateAsync,
    updateField: updateField.mutateAsync,
    deleteField: deleteField.mutateAsync,
    reorderFields,
  };
};