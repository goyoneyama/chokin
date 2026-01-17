import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { MonthlyAssetRecord, MonthlyAssetRecordFormData } from '@/types/assets';
import { format, addMonths, subMonths } from 'date-fns';

export function useMonthlyAssetRecords(targetMonth?: Date) {
  const { user } = useAuthStore();
  const [currentRecord, setCurrentRecord] = useState<MonthlyAssetRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(targetMonth || new Date());

  const yearMonth = format(currentMonth, 'yyyy-MM');

  // Fetch record for specific month
  const fetchRecord = useCallback(async (month: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('monthly_asset_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('year_month', month)
        .single();

      if (!error && data) {
        return data as MonthlyAssetRecord;
      }
      return null;
    } catch {
      return null;
    }
  }, [user]);

  // Load current month record
  const loadCurrentRecord = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const record = await fetchRecord(yearMonth);
      setCurrentRecord(record);
    } catch (e) {
      console.error('Error loading record:', e);
    } finally {
      setLoading(false);
    }
  }, [user, yearMonth, fetchRecord]);

  // Create or update record
  const upsertRecord = async (
    month: string,
    data: MonthlyAssetRecordFormData,
    isConfirmed: boolean = false
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('monthly_asset_records')
        .upsert({
          user_id: user.id,
          year_month: month,
          ...data,
          is_confirmed: isConfirmed,
        }, { onConflict: 'user_id,year_month' });

      if (!error) {
        if (month === yearMonth) {
          await loadCurrentRecord();
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Generate next month record based on current month
  const generateNextMonthRecord = async (
    currentMonthData: MonthlyAssetRecord
  ): Promise<MonthlyAssetRecordFormData> => {
    if (!user) {
      return {
        bank_balance: 0,
        monthly_income: 0,
        credit_expenses: 0,
        nisa_value: 0,
      };
    }

    // Get NISA accounts to calculate next month's value
    const { data: nisaAccounts } = await supabase
      .from('nisa_accounts')
      .select('monthly_contribution')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const totalNisaContribution = nisaAccounts?.reduce(
      (sum, acc) => sum + acc.monthly_contribution,
      0
    ) || 0;

    // Get recurring income
    const { data: incomeRecords } = await supabase
      .from('income_records')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('frequency', 'monthly');

    const monthlyIncome = incomeRecords?.reduce((sum, record) => sum + record.amount, 0) || 0;

    // Get income details for next month
    const incomeDetails = incomeRecords?.map(record => ({
      id: record.id,
      name: record.name,
      amount: record.amount,
    })) || [];

    // Get default credit cards from user settings
    const defaultCreditCards = user.default_credit_cards || [];
    const totalCreditExpenses = defaultCreditCards.reduce((sum, card) => sum + card.amount, 0);

    // Get credit card details for next month
    const creditDetails = defaultCreditCards.map(card => ({
      name: card.name,
      amount: card.amount,
    }));

    // Next month's bank balance = current month's calculated balance at payment day
    const nextBankBalance = currentMonthData.calculated_balance;

    // Next month's NISA = current + monthly contribution
    const nextNisaValue = currentMonthData.nisa_value + totalNisaContribution;

    return {
      bank_balance: nextBankBalance,
      monthly_income: monthlyIncome,
      credit_expenses: totalCreditExpenses,
      nisa_value: nextNisaValue,
      income_details: incomeDetails.length > 0 ? incomeDetails : undefined,
      credit_details: creditDetails.length > 0 ? creditDetails : undefined,
    };
  };

  // Auto-generate next month if doesn't exist
  const autoGenerateNextMonth = async (): Promise<boolean> => {
    if (!currentRecord) return false;

    const nextMonth = format(addMonths(new Date(yearMonth + '-01'), 1), 'yyyy-MM');
    const existingNextMonth = await fetchRecord(nextMonth);

    if (existingNextMonth) {
      return true; // Already exists
    }

    const nextMonthData = await generateNextMonthRecord(currentRecord);
    return await upsertRecord(nextMonth, nextMonthData, false);
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  // Navigate to next month
  const goToNextMonth = async () => {
    const nextMonth = addMonths(currentMonth, 1);

    // Check if next month record exists, if not, generate it
    const nextMonthYearMonth = format(nextMonth, 'yyyy-MM');
    const existingRecord = await fetchRecord(nextMonthYearMonth);

    if (!existingRecord && currentRecord) {
      // Generate next month record
      const nextMonthData = await generateNextMonthRecord(currentRecord);
      await upsertRecord(nextMonthYearMonth, nextMonthData, false);
    }

    setCurrentMonth(nextMonth);
  };

  // Go to today's month
  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Confirm current record
  const confirmRecord = async (): Promise<boolean> => {
    if (!currentRecord) return false;

    const success = await upsertRecord(
      yearMonth,
      {
        bank_balance: currentRecord.bank_balance,
        monthly_income: currentRecord.monthly_income,
        credit_expenses: currentRecord.credit_expenses,
        nisa_value: currentRecord.nisa_value,
        notes: currentRecord.notes || undefined,
      },
      true
    );

    if (success) {
      await loadCurrentRecord();
    }

    return success;
  };

  useEffect(() => {
    loadCurrentRecord();
  }, [loadCurrentRecord]);

  return {
    currentRecord,
    loading,
    yearMonth,
    currentMonth,
    upsertRecord,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    confirmRecord,
    autoGenerateNextMonth,
    refresh: loadCurrentRecord,
  };
}
