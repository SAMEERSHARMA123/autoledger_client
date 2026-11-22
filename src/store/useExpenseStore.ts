import { create } from 'zustand';
import { api } from '@/lib/axios';

export interface ExpenseItem {
  _id: string;
  amount: number;
  type: string;
  category: string;
  paymentMethod: string;
  notes?: string;
  isDebtRelated?: boolean;
  date: string;
}

export interface DashboardSummary {
  netBalance: number;
  monthlyInflow: number;
  monthlyOutflow: number;
  activeDebts: number;
  categoryBreakdown: { _id: string; amount: number }[];
}

export interface DashboardInsights {
  burnRate: { dailySafeLimit: number; monthlyBurnPercent: number };
  topDrain: { category: string; amount: number; percentage: number };
  pendingDebtsCount: number;
  sevenDayPulse: { date: string; day: string; amount: number; isHighest: boolean }[];
  categorySplit: { category: string; amount: number; percentage: number }[];
}

interface ExpenseState {
  recentExpenses: ExpenseItem[];
  summary: DashboardSummary;
  insights: DashboardInsights;
  isLoading: boolean;
  refreshDashboardData: () => Promise<void>;
  deleteExpense: (item: ExpenseItem) => Promise<void>;
}

const DEFAULT_SUMMARY: DashboardSummary = {
  netBalance: 0,
  monthlyInflow: 0,
  monthlyOutflow: 0,
  activeDebts: 0,
  categoryBreakdown: [],
};

const DEFAULT_INSIGHTS: DashboardInsights = {
  burnRate: { dailySafeLimit: 0, monthlyBurnPercent: 0 },
  topDrain: { category: 'NONE', amount: 0, percentage: 0 },
  pendingDebtsCount: 0,
  sevenDayPulse: [],
  categorySplit: [],
};

let isFetching = false;

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  recentExpenses: [],
  summary: DEFAULT_SUMMARY,
  insights: DEFAULT_INSIGHTS,
  isLoading: true,

  refreshDashboardData: async () => {
    if (isFetching) return;
    isFetching = true;

    try {
      const [expensesRes, summaryRes, insightsRes] = await Promise.all([
        api.get('/expenses?page=1&limit=6'),
        api.get('/analytics/summary'),
        api.get('/analytics/insights'),
      ]);

      set({
        recentExpenses: expensesRes.data.data || [],
        summary: summaryRes.data.summary || DEFAULT_SUMMARY,
        insights: insightsRes.data.insights || DEFAULT_INSIGHTS,
      });
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error);
    } finally {
      isFetching = false;
      set({ isLoading: false });
    }
  },

  deleteExpense: async (item) => {
    const prevExpenses = get().recentExpenses;
    const prevSummary = get().summary;

    const isIncome = item.type?.toUpperCase() === 'INCOME';
    const nextInflow = isIncome ? prevSummary.monthlyInflow - item.amount : prevSummary.monthlyInflow;
    const nextOutflow = !isIncome ? prevSummary.monthlyOutflow - item.amount : prevSummary.monthlyOutflow;
    const nextDebts = item.isDebtRelated ? prevSummary.activeDebts - item.amount : prevSummary.activeDebts;

    set({
      recentExpenses: prevExpenses.filter((exp) => exp._id !== item._id),
      summary: {
        ...prevSummary,
        monthlyInflow: Math.max(0, nextInflow),
        monthlyOutflow: Math.max(0, nextOutflow),
        netBalance: nextInflow - nextOutflow,
        activeDebts: Math.max(0, nextDebts),
      },
    });

    try {
      await api.delete(`/expenses/${item._id}`);
    } catch (error) {
      console.error('Delete failed, rolling back:', error);
      set({ recentExpenses: prevExpenses, summary: prevSummary });
    }
  },
}));