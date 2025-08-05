// src/hooks/useCategories.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi, handleApiError } from '@/lib/api';
import type { Category, CreateCategoryRequest } from '@/lib/types';

// Query keys
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (campId: string) => [...categoryKeys.lists(), campId] as const,
};

// Get all categories for a camp
export const useCategories = (campId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: categoryKeys.list(campId),
    queryFn: () => categoriesApi.getCategories(campId),
    enabled: !!campId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create category mutation
  const createCategory = useMutation({
    mutationFn: (data: CreateCategoryRequest) => categoriesApi.createCategory(campId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.list(campId) });
    },
    onError: (error) => {
      throw new Error(handleApiError(error));
    },
  });

  // Update category mutation
  const updateCategory = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCategoryRequest> }) => 
      categoriesApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.list(campId) });
    },
    onError: (error) => {
      throw new Error(handleApiError(error));
    },
  });

  // Delete category mutation
  const deleteCategory = useMutation({
    mutationFn: (categoryId: string) => categoriesApi.deleteCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.list(campId) });
    },
    onError: (error) => {
      throw new Error(handleApiError(error));
    },
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createCategory: createCategory.mutateAsync,
    updateCategory: updateCategory.mutateAsync,
    deleteCategory: deleteCategory.mutateAsync,
  };
};