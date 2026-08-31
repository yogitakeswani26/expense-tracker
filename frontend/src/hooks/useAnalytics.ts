import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { queryConfig } from '../services/queryClient';

/**
 * Hook to fetch dashboard summary
 * Combines multiple analytics calls into one
 */
export const useDashboardSummary = (familyId: string) => {
  return useQuery({
    queryKey: ['dashboard', 'summary', familyId],
    queryFn: async () => {
      const { data } = await api.get(`/analytics/${familyId}/summary`);
      return data.data;
    },
    enabled: !!familyId,
    staleTime: 600000, // 10 minutes
    gcTime: 600000,
  });
};

/**
 * Hook to fetch monthly trends
 */
export const useMonthlyTrends = (familyId: string, months: number = 6) => {
  return useQuery({
    queryKey: ['dashboard', 'trends', familyId, months],
    queryFn: async () => {
      const { data } = await api.get(`/analytics/${familyId}/trends?months=${months}`);
      return data.data;
    },
    enabled: !!familyId,
    staleTime: 600000, // 10 minutes
    gcTime: 600000,
  });
};

/**
 * Hook to fetch category breakdown
 */
export const useCategoryBreakdown = (familyId: string) => {
  return useQuery({
    queryKey: ['analytics', 'categories', familyId],
    queryFn: async () => {
      const { data } = await api.get(`/analytics/${familyId}/categories`);
      return data.data;
    },
    enabled: !!familyId,
    staleTime: 600000, // 10 minutes
    gcTime: 600000,
  });
};

/**
 * Hook to fetch budget status
 */
export const useBudgetStatus = (familyId: string) => {
  return useQuery({
    queryKey: ['analytics', 'budget', familyId],
    queryFn: async () => {
      const { data } = await api.get(`/analytics/${familyId}/budget-status`);
      return data.data;
    },
    enabled: !!familyId,
    staleTime: 600000,
    gcTime: 600000,
  });
};

/**
 * Hook to fetch spender comparison
 */
export const useSpenderComparison = (familyId: string, startDate?: Date, endDate?: Date) => {
  return useQuery({
    queryKey: ['analytics', 'spenders', familyId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      const { data } = await api.get(`/analytics/${familyId}/spenders?${params.toString()}`);
      return data.data;
    },
    enabled: !!familyId,
    staleTime: 600000,
    gcTime: 600000,
  });
};
