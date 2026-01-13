import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { SavingsGoal, GoalPeriod } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';

interface GoalFormData {
  period: GoalPeriod;
  target_amount: number;
  nisa_monthly: number;
  nisa_yield_rate: number;
  bonus_per_year: number;
  bonus_frequency: number;
  monthly_savings: number;
}

export function useGoals() {
  const { user } = useAuthStore();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (fetchError) {
        // テーブルが存在しない場合は静かに失敗（Phase 2未セットアップ）
        if (fetchError.code === 'PGRST116' || fetchError.message.includes('does not exist')) {
          console.warn('savings_goals table not found. Please run phase2-setup.sql');
          setGoals([]);
          setError(null); // エラーを表示しない
          return;
        }
        throw fetchError;
      }

      setGoals(data || []);
    } catch (err) {
      console.error('Error fetching goals:', err);
      setError('目標の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getGoal = useCallback(
    (period: GoalPeriod): SavingsGoal | undefined => {
      return goals.find((g) => g.period === period);
    },
    [goals]
  );

  const createOrUpdateGoal = async (data: GoalFormData): Promise<boolean> => {
    if (!user) return false;

    try {
      const existingGoal = goals.find((g) => g.period === data.period);

      if (existingGoal) {
        // 更新
        const { error: updateError } = await supabase
          .from('savings_goals')
          .update({
            target_amount: data.target_amount,
            nisa_monthly: data.nisa_monthly,
            nisa_yield_rate: data.nisa_yield_rate,
            bonus_per_year: data.bonus_per_year,
            bonus_frequency: data.bonus_frequency,
            monthly_savings: data.monthly_savings,
          })
          .eq('id', existingGoal.id)
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
        // 新規作成
        const { error: insertError } = await supabase.from('savings_goals').insert({
          user_id: user.id,
          period: data.period,
          target_amount: data.target_amount,
          nisa_monthly: data.nisa_monthly,
          nisa_yield_rate: data.nisa_yield_rate,
          bonus_per_year: data.bonus_per_year,
          bonus_frequency: data.bonus_frequency,
          monthly_savings: data.monthly_savings,
          is_active: true,
        });

        if (insertError) throw insertError;
      }

      await fetchGoals();
      return true;
    } catch (err) {
      console.error('Error creating/updating goal:', err);
      setError('目標の保存に失敗しました');
      return false;
    }
  };

  const deleteGoal = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error: deleteError } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      await fetchGoals();
      return true;
    } catch (err) {
      console.error('Error deleting goal:', err);
      setError('目標の削除に失敗しました');
      return false;
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return {
    goals,
    loading,
    error,
    fetchGoals,
    getGoal,
    createOrUpdateGoal,
    deleteGoal,
  };
}
