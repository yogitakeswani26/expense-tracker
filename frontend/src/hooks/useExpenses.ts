import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { queryConfig, invalidateRelated } from '../services/queryClient';

/**
 * Hook to fetch expenses for a family
 * Automatically caches and deduplicates requests
 */
export const useExpenses = (familyId: string, filters?: any) => {
  return useQuery({
    ...queryConfig.expenses(familyId),
    queryFn: async () => {
      const { data } = await api.get(`/expenses/${familyId}`, { params: filters });
      return data.data;
    },
    enabled: !!familyId,
  });
};

/**
 * Hook to fetch a specific expense
 */
export const useExpenseDetail = (familyId: string, expenseId: string) => {
  return useQuery({
    ...queryConfig.expenseDetail(familyId, expenseId),
    queryFn: async () => {
      const { data } = await api.get(`/expenses/${familyId}/${expenseId}`);
      return data.data;
    },
    enabled: !!familyId && !!expenseId,
  });
};

/**
 * Hook to create an expense
 */
export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ familyId, ...payload }: any) => {
      const { data } = await api.post(`/expenses/${familyId}`, payload);
      return data.data;
    },
    onSuccess: (_, variables) => {
      invalidateRelated('expense');
    },
  });
};

/**
 * Hook to update an expense
 */
export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ familyId, expenseId, ...payload }: any) => {
      const { data } = await api.put(`/expenses/${familyId}/${expenseId}`, payload);
      return data.data;
    },
    onSuccess: (_, variables) => {
      invalidateRelated('expense');
    },
  });
};

/**
 * Hook to delete an expense
 */
export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ familyId, expenseId }: any) => {
      const { data } = await api.delete(`/expenses/${familyId}/${expenseId}`);
      return data.data;
    },
    onSuccess: (_, variables) => {
      invalidateRelated('expense');
    },
  });
};
