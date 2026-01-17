import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { MonthlySnapshot } from '@/types/assets';
import { useBankAccounts } from './useBankAccounts';
import { useNisaAccounts } from './useNisaAccounts';
import { useCreditCards } from './useCreditCards';
import { useIncomeRecords } from './useIncomeRecords';
import { format, subMonths } from 'date-fns';

export function useMonthlySnapshots() {
  const { user } = useAuthStore();
  const [snapshots, setSnapshots] = useState<MonthlySnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  const { bankAccounts, totalBalance: bankTotal } = useBankAccounts();
  const { nisaAccounts, totalValue: nisaTotal, totalInvested: nisaInvested } = useNisaAccounts();
  const { creditCards, totalBalance: creditTotal } = useCreditCards();
  const { incomeRecords, monthlyIncome } = useIncomeRecords();

  const fetchSnapshots = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('monthly_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .order('year_month', { ascending: false })
        .limit(12);

      if (!error && data) {
        setSnapshots(data);
      }
    } catch (e) {
      console.error('Error fetching snapshots:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createSnapshot = async (yearMonth?: string): Promise<boolean> => {
    if (!user) return false;

    const targetMonth = yearMonth || format(new Date(), 'yyyy-MM');

    // Get current month's expenses from expenses table
    const startDate = `${targetMonth}-01`;
    const endDate = `${targetMonth}-31`;

    const { data: expensesData } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate);

    const totalExpenses = expensesData?.reduce((sum, e) => sum + e.amount, 0) || 0;

    const snapshotData = {
      user_id: user.id,
      year_month: targetMonth,
      total_income: monthlyIncome,
      total_expenses: totalExpenses,
      monthly_balance: monthlyIncome - totalExpenses,
      total_bank_balance: bankTotal,
      total_nisa_value: nisaTotal,
      total_credit_balance: creditTotal,
      net_worth: bankTotal + nisaTotal - creditTotal,
      bank_details: bankAccounts.map((a) => ({
        id: a.id,
        name: a.name,
        balance: a.current_balance,
      })),
      nisa_details: nisaAccounts.map((a) => ({
        id: a.id,
        name: a.name,
        value: a.current_value,
        invested: a.total_invested,
      })),
      credit_details: creditCards.map((c) => ({
        id: c.id,
        name: c.name,
        balance: c.current_balance,
      })),
      income_details: incomeRecords.map((r) => ({
        id: r.id,
        name: r.name,
        amount: r.amount,
      })),
    };

    try {
      const { error } = await supabase
        .from('monthly_snapshots')
        .upsert(snapshotData, { onConflict: 'user_id,year_month' });

      if (!error) {
        await fetchSnapshots();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const getSnapshot = async (yearMonth: string): Promise<MonthlySnapshot | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('monthly_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .eq('year_month', yearMonth)
        .single();

      if (!error && data) {
        return data;
      }
      return null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  // Get snapshots for last N months for display
  const getRecentMonths = (count: number = 3): string[] => {
    const months: string[] = [];
    const now = new Date();
    for (let i = 0; i < count; i++) {
      months.push(format(subMonths(now, i), 'yyyy-MM'));
    }
    return months.reverse();
  };

  return {
    snapshots,
    loading,
    createSnapshot,
    getSnapshot,
    getRecentMonths,
    refresh: fetchSnapshots,
  };
}
