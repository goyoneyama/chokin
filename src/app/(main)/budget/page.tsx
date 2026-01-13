'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCategories } from '@/hooks/useCategories';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryIcon } from '@/components/CategoryIcon';
import { formatCurrency } from '@/lib/formatters';
import { calculateMonthlySavings } from '@/lib/calculations';

export default function BudgetPage() {
  const { user, fetchUser } = useAuthStore();
  const { categories, updateCategory, fetchCategories } = useCategories();
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user) {
      setMonthlyIncome(user.monthly_income || 0);
    }
  }, [user]);

  useEffect(() => {
    const initialBudgets: Record<string, number> = {};
    categories.forEach((cat) => {
      initialBudgets[cat.id] = cat.budget;
    });
    setBudgets(initialBudgets);
  }, [categories]);

  const totalBudget = Object.values(budgets).reduce((sum, budget) => sum + budget, 0);
  const monthlySavings = monthlyIncome - totalBudget;

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 月収を更新
      const { error: updateIncomeError } = await supabase
        .from('users')
        .update({ monthly_income: monthlyIncome })
        .eq('id', user.id);

      if (updateIncomeError) {
        console.error('Update income error:', updateIncomeError);
        throw new Error(`月収の更新に失敗: ${updateIncomeError.message}`);
      }

      // 各カテゴリの予算を更新
      for (const [categoryId, budget] of Object.entries(budgets)) {
        const result = await updateCategory(categoryId, { budget });
        if (!result) {
          throw new Error(`カテゴリ予算の更新に失敗`);
        }
      }

      // ユーザー情報を再取得
      await fetchUser();
      await fetchCategories();

      setSuccess(true);
      setHasChanges(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving budget:', err);
      setError(err.message || '予算の保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl pb-24">
      <h1 className="text-2xl font-bold mb-6">予算設定</h1>

      {error && (
        <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
          予算を保存しました
        </div>
      )}

      {/* 月収設定 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>月収</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="monthly-income">月の手取り収入（円）</Label>
            <Input
              id="monthly-income"
              type="number"
              value={monthlyIncome}
              onChange={(e) => {
                setMonthlyIncome(parseInt(e.target.value) || 0);
                setHasChanges(true);
              }}
              min="0"
              step="1000"
            />
          </div>
        </CardContent>
      </Card>

      {/* カテゴリ別予算設定 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>カテゴリ別予算</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-4">
              <div
                className="p-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: category.color + '20' }}
              >
                <CategoryIcon icon={category.icon} size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Label htmlFor={`budget-${category.id}`} className="font-semibold">
                    {category.name}
                  </Label>
                  {category.is_fixed && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                      固定費
                    </span>
                  )}
                </div>
              </div>
              <div className="w-40">
                <Input
                  id={`budget-${category.id}`}
                  type="number"
                  value={budgets[category.id] || 0}
                  onChange={(e) => {
                    setBudgets({
                      ...budgets,
                      [category.id]: parseInt(e.target.value) || 0,
                    });
                    setHasChanges(true);
                  }}
                  min="0"
                  step="1000"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* サマリー */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>月間収支サマリー</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">月収</span>
            <span className="text-lg font-semibold">{formatCurrency(monthlyIncome)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">予算合計</span>
            <span className="text-lg font-semibold">{formatCurrency(totalBudget)}</span>
          </div>
          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">貯金可能額</span>
              <span
                className={`text-2xl font-bold ${
                  monthlySavings >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(monthlySavings)}
              </span>
            </div>
            {monthlySavings < 0 && (
              <p className="text-sm text-red-600 mt-2">
                予算が収入を超過しています。予算を見直してください。
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {hasChanges && !success && (
          <div className="p-2 text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-md text-center">
            変更が保存されていません
          </div>
        )}
        <Button
          onClick={handleSave}
          disabled={loading}
          className={`w-full ${hasChanges ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
          size="lg"
        >
          {loading ? '保存中...' : hasChanges ? '変更を保存' : '予算を保存'}
        </Button>
      </div>
    </div>
  );
}
