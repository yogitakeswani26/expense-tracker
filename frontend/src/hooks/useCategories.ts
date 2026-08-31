import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { queryConfig } from '../services/queryClient';

/**
 * Hook to fetch all categories
 * Caches for 1 hour since categories rarely change
 */
export const useCategories = () => {
  return useQuery({
    ...queryConfig.categories,
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data.data;
    },
  });
};

/**
 * Hook to fetch categories for a specific family
 */
export const useFamilyCategories = (familyId: string) => {
  return useQuery({
    queryKey: ['categories', familyId],
    queryFn: async () => {
      const { data } = await api.get(`/expenses/${familyId}/categories`);
      return data.data;
    },
    enabled: !!familyId,
    staleTime: 3600000, // 1 hour
    gcTime: 1800000,    // 30 minutes
  });
};
