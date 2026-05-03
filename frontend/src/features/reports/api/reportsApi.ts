import { apiRequest, downloadWithAuth } from '../../../shared/lib/api-client';
import type {
  CashbookEntry,
  DashboardResponse,
  Expense,
  FinanceSummary,
  PaginatedResponse,
  TopItemsResponse,
} from '../../../shared/types/api';

export function fetchDashboard(period: 'daily' | 'weekly' | 'monthly' | 'custom', anchorDate?: string, startDate?: string, endDate?: string) {
  const query = new URLSearchParams({ period });
  if (anchorDate) query.set('anchorDate', anchorDate);
  if (startDate) query.set('startDate', startDate);
  if (endDate) query.set('endDate', endDate);
  return apiRequest<DashboardResponse>(`/reports/dashboard?${query.toString()}`, {
    auth: true,
  });
}

export function fetchTopItems(period: 'daily' | 'weekly' | 'monthly' | 'custom', anchorDate?: string, startDate?: string, endDate?: string) {
  const query = new URLSearchParams({ period });
  if (anchorDate) query.set('anchorDate', anchorDate);
  if (startDate) query.set('startDate', startDate);
  if (endDate) query.set('endDate', endDate);
  return apiRequest<TopItemsResponse>(`/reports/top-items?${query.toString()}`, {
    auth: true,
  });
}

export function exportReport(period: 'daily' | 'weekly' | 'monthly' | 'custom', anchorDate?: string, startDate?: string, endDate?: string) {
  const query = new URLSearchParams({ period });
  if (anchorDate) query.set('anchorDate', anchorDate);
  if (startDate) query.set('startDate', startDate);
  if (endDate) query.set('endDate', endDate);
  return downloadWithAuth(`/reports/export?${query.toString()}`);
}

export function fetchFinanceSummary() {
  return apiRequest<FinanceSummary>('/finance/summary', {
    auth: true,
  });
}

export function fetchExpenses(type: 'DIRECT' | 'INDIRECT') {
  return apiRequest<PaginatedResponse<Expense>>(`/finance/expenses?type=${type}&page=1&limit=50`, {
    auth: true,
  });
}

export function fetchCashbook() {
  return apiRequest<PaginatedResponse<CashbookEntry>>('/finance/cashbook?page=1&limit=50', {
    auth: true,
  });
}
