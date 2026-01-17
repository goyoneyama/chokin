import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { IncomeRecord, IncomeRecordFormData } from '@/types/assets';

export function useIncomeRecords() {
  const { user } = useAuthStore();
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncomeRecords = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('income_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setIncomeRecords(data);
      }
    } catch (e) {
      console.error('Error fetching income records:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createIncomeRecord = async (data: IncomeRecordFormData): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase.from('income_records').insert({
        user_id: user.id,
        ...data,
      });

      if (!error) {
        await fetchIncomeRecords();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const updateIncomeRecord = async (
    id: string,
    data: Partial<IncomeRecordFormData>
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('income_records')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);

      if (!error) {
        await fetchIncomeRecords();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const deleteIncomeRecord = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('income_records')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user.id);

      if (!error) {
        await fetchIncomeRecords();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const getIncomeRecord = async (id: string): Promise<IncomeRecord | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('income_records')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
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
    fetchIncomeRecords();
  }, [fetchIncomeRecords]);

  // Calculate monthly income (only monthly frequency records)
  const monthlyIncome = incomeRecords
    .filter((r) => r.frequency === 'monthly')
    .reduce((sum, r) => sum + r.amount, 0);

  // Calculate yearly income (yearly frequency / 12 + monthly)
  const yearlyIncome = incomeRecords.reduce((sum, r) => {
    if (r.frequency === 'monthly') return sum + r.amount * 12;
    if (r.frequency === 'yearly') return sum + r.amount;
    return sum;
  }, 0);

  return {
    incomeRecords,
    loading,
    monthlyIncome,
    yearlyIncome,
    createIncomeRecord,
    updateIncomeRecord,
    deleteIncomeRecord,
    getIncomeRecord,
    refresh: fetchIncomeRecords,
  };
}
