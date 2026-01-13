import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Expense, ExpenseFormData } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export function useExpenses(targetMonth?: Date) {
  const { user } = useAuthStore();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentMonth = targetMonth || new Date();
  const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

  const fetchExpenses = useCallback(async () => {
    if (!user) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('expenses')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('user_id', user.id)
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setExpenses(data || []);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('支出の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [user, monthStart, monthEnd]);

  const createExpense = async (data: ExpenseFormData): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error: insertError } = await supabase.from('expenses').insert({
        user_id: user.id,
        category_id: data.category_id,
        amount: data.amount,
        date: data.date,
        memo: data.memo || null,
        input_source: 'app',
      });

      if (insertError) throw insertError;

      await fetchExpenses();
      return true;
    } catch (err) {
      console.error('Error creating expense:', err);
      setError('支出の記録に失敗しました');
      return false;
    }
  };

  const updateExpense = async (
    id: string,
    data: Partial<ExpenseFormData>
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error: updateError } = await supabase
        .from('expenses')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      await fetchExpenses();
      return true;
    } catch (err) {
      console.error('Error updating expense:', err);
      setError('支出の更新に失敗しました');
      return false;
    }
  };

  const deleteExpense = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error: deleteError } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      await fetchExpenses();
      return true;
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError('支出の削除に失敗しました');
      return false;
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return {
    expenses,
    loading,
    error,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  };
}
