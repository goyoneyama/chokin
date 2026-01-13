import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Category, CategoryFormData } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';

export function useCategories() {
  const { user } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!user) {
      setCategories([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order', { ascending: true });

      if (fetchError) throw fetchError;

      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('カテゴリの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createCategory = async (data: CategoryFormData): Promise<boolean> => {
    if (!user) return false;

    try {
      const maxOrder = Math.max(...categories.map((c) => c.display_order), 0);

      const { error: insertError } = await supabase.from('categories').insert({
        user_id: user.id,
        name: data.name,
        budget: data.budget,
        icon: data.icon,
        color: data.color,
        is_fixed: data.is_fixed,
        display_order: maxOrder + 1,
        is_default: false,
      });

      if (insertError) throw insertError;

      await fetchCategories();
      return true;
    } catch (err) {
      console.error('Error creating category:', err);
      setError('カテゴリの作成に失敗しました');
      return false;
    }
  };

  const updateCategory = async (
    id: string,
    data: Partial<CategoryFormData>
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error: updateError } = await supabase
        .from('categories')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      await fetchCategories();
      return true;
    } catch (err) {
      console.error('Error updating category:', err);
      setError('カテゴリの更新に失敗しました');
      return false;
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // カテゴリに関連する支出があるかチェック
      const { data: expenses, error: checkError } = await supabase
        .from('expenses')
        .select('id')
        .eq('category_id', id)
        .limit(1);

      if (checkError) throw checkError;

      if (expenses && expenses.length > 0) {
        setError('このカテゴリには支出記録があるため削除できません');
        return false;
      }

      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      await fetchCategories();
      return true;
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('カテゴリの削除に失敗しました');
      return false;
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
