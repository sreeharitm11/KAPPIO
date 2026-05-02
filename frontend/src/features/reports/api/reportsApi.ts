import { apiRequest, downloadWithAuth } from '../../../shared/lib/api-client';
import type {
  CashbookEntry,
  DashboardResponse,
  Expense,
  FinanceSummary,
  PaginatedResponse,
  TopItemsResponse,
} from '../../../shared/types/api';

export function fetchDashboard(period: 'daily' | 'weekly' | 'monthly') {
  return apiRequest<DashboardResponse>(`/reports/dashboard?period=${period}`, {
    auth: true,
  });
}

export function fetchTopItems(period: 'daily' | 'weekly' | 'monthly') {
  return apiRequest<TopItemsResponse>(`/reports/top-items?period=${period}`, {
    auth: true,
  });
}

export function exportReport(period: 'daily' | 'weekly' | 'monthly') {
  return downloadWithAuth(`/reports/export?period=${period}`);
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
