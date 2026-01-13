'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCategories } from '@/hooks/useCategories';
import { useExpenses } from '@/hooks/useExpenses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryIcon } from '@/components/CategoryIcon';
import { formatCurrency, toISODateString } from '@/lib/formatters';
import { getCategoryRemaining } from '@/lib/calculations';
import { Check } from 'lucide-react';

export default function NewExpensePage() {
  const router = useRouter();
  const { categories } = useCategories();
  const { expenses, createExpense } = useExpenses();

  const [amount, setAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [date, setDate] = useState(toISODateString(new Date()));
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const remaining = selectedCategory
    ? getCategoryRemaining(selectedCategory, expenses)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCategoryId) {
      setError('カテゴリを選択してください');
      return;
    }

    const amountNum = parseInt(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('有効な金額を入力してください');
      return;
    }

    setLoading(true);
    setError(null);

    const success = await createExpense({
      amount: amountNum,
      category_id: selectedCategoryId,
      date,
      memo: memo || undefined,
    });

    if (success) {
      router.push('/');
    } else {
      setError('支出の記録に失敗しました');
    }

    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl pb-24">
      <h1 className="text-2xl font-bold mb-6">支出を記録</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        {/* 金額入力 */}
        <Card>
          <CardHeader>
            <CardTitle>金額</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold">¥</span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="text-3xl font-bold border-0 focus:ring-0 p-0 h-auto"
                required
                min="1"
                step="1"
              />
            </div>
          </CardContent>
        </Card>

        {/* カテゴリ選択 */}
        <Card>
          <CardHeader>
            <CardTitle>カテゴリを選択</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map((category) => {
                const isSelected = selectedCategoryId === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={`p-4 rounded-lg border-2 transition-all relative ${
                      isSelected
                        ? 'border-primary bg-primary/20 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-0.5">
                        <Check size={16} strokeWidth={3} />
                      </div>
                    )}
                    <div
                      className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2"
                      style={{ backgroundColor: category.color + (isSelected ? '50' : '30') }}
                    >
                      <CategoryIcon icon={category.icon} size={24} />
                    </div>
                    <div className={`text-sm font-medium text-center ${isSelected ? 'text-primary font-bold' : ''}`}>
                      {category.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 日付選択 */}
        <Card>
          <CardHeader>
            <CardTitle>日付</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </CardContent>
        </Card>

        {/* メモ入力 */}
        <Card>
          <CardHeader>
            <CardTitle>メモ（任意）</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="例: ランチ代、コンビニ"
              maxLength={100}
            />
          </CardContent>
        </Card>

        {/* 残高表示 */}
        {selectedCategory && remaining !== null && (
          <Card className="bg-blue-50">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {selectedCategory.name}の残り予算
                </span>
                <span
                  className={`text-lg font-bold ${
                    remaining - parseInt(amount || '0') >= 0
                      ? 'text-blue-600'
                      : 'text-red-600'
                  }`}
                >
                  {formatCurrency(remaining - parseInt(amount || '0'))}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 保存ボタン */}
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
            disabled={loading}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            disabled={loading || !selectedCategoryId || !amount}
            className="flex-1"
            size="lg"
          >
            {loading ? '保存中...' : '支出を保存'}
          </Button>
        </div>
      </form>
    </div>
  );
}
