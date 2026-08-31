import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Budget, BudgetAlertsSummary } from '../types';

export interface BudgetInput {
  category: string;
  limit: number;
  period: 'monthly' | 'yearly';
  alertThreshold?: number;
}

/**
 * Hook to fetch all budgets for a family, with live spent/remaining/status
 * computed server-side from the family's expenses.
 */
export const useBudgets = (familyId: string) => {
  return useQuery<Budget[]>({
    queryKey: ['budgets', familyId],
    queryFn: async () => {
      const { data } = await api.get(`/budgets/${familyId}`);
      return data.data;
    },
    enabled: !!familyId,
    staleTime: 120000, // 2 minutes — spend changes as new expenses come in
    gcTime: 300000,
  });
};

/**
 * Hook to fetch a dashboard-friendly budget summary: totals plus the
 * budgets that are at/over their alert threshold, most severe first.
 */
export const useBudgetAlerts = (familyId: string) => {
  return useQuery<BudgetAlertsSummary>({
    queryKey: ['budgets', familyId, 'alerts'],
    queryFn: async () => {
      const { data } = await api.get(`/budgets/${familyId}/alerts`);
      return data.data;
    },
    enabled: !!familyId,
    staleTime: 120000,
    gcTime: 300000,
  });
};

/** Hook to create a new budget. */
export const useCreateBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ familyId, ...payload }: BudgetInput & { familyId: string }) => {
      const { data } = await api.post(`/budgets/${familyId}`, payload);
      return data.data as Budget;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budgets', variables.familyId] });
    },
  });
};

/** Hook to update an existing budget (partial update). */
export const useUpdateBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      familyId,
      budgetId,
      ...payload
    }: Partial<BudgetInput> & { familyId: string; budgetId: string }) => {
      const { data } = await api.put(`/budgets/${familyId}/${budgetId}`, payload);
      return data.data as Budget;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budgets', variables.familyId] });
    },
  });
};

/** Hook to delete a budget. */
export const useDeleteBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ familyId, budgetId }: { familyId: string; budgetId: string }) => {
      const { data } = await api.delete(`/budgets/${familyId}/${budgetId}`);
      return data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budgets', variables.familyId] });
    },
  });
};
