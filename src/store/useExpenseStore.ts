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

interface ExpenseState {
  recentExpenses: ExpenseItem[];
  summary: DashboardSummary;
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

let isFetching = false;

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  recentExpenses: [],
  summary: DEFAULT_SUMMARY,
  isLoading: true,

  refreshDashboardData: async () => {
    if (isFetching) return;
    isFetching = true;

    try {
      const [expensesRes, summaryRes] = await Promise.all([
        api.get('/expenses?page=1&limit=6'),
        api.get('/analytics/summary'),
      ]);

      set({
        recentExpenses: expensesRes.data.data || [],
        summary: summaryRes.data.summary || DEFAULT_SUMMARY,
      });
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error);
    } finally {
      isFetching = false;
      set({ isLoading: false });
    }
  },

  // List + Summary dono ko turant update karega, bina dobara GET API call kiye
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