'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useExpenses } from '@/hooks/useExpenses';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CategoryIcon } from '@/components/CategoryIcon';
import { Expense } from '@/types';
import { formatCurrency, formatDate, formatDateShort } from '@/lib/formatters';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth } from 'date-fns';

export default function ExpensesPage() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { expenses, loading, deleteExpense, updateExpense } = useExpenses(currentMonth);
  const { categories } = useCategories();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editMemo, setEditMemo] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  const openEditDialog = (expense: Expense) => {
    setSelectedExpense(expense);
    setEditAmount(expense.amount.toString());
    setEditMemo(expense.memo || '');
    setEditDate(expense.date);
    setEditCategoryId(expense.category_id || '');
    setIsEditOpen(true);
  };

  const openDeleteDialog = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDeleteOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;

    const success = await updateExpense(selectedExpense.id, {
      amount: parseInt(editAmount),
      category_id: editCategoryId,
      date: editDate,
      memo: editMemo || undefined,
    });

    if (success) {
      toast.success('支出を更新しました');
      setIsEditOpen(false);
      setSelectedExpense(null);
    } else {
      toast.error('支出の更新に失敗しました');
    }
  };

  const handleDelete = async () => {
    if (!selectedExpense) return;
    const success = await deleteExpense(selectedExpense.id);
    if (success) {
      toast.success('支出を削除しました');
      setIsDeleteOpen(false);
      setSelectedExpense(null);
    } else {
      toast.error('支出の削除に失敗しました');
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl pb-20">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="h-20 bg-gray-100 rounded animate-pulse"></div>
          </CardContent>
        </Card>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-16 bg-gray-100 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl pb-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">支出一覧</h1>
        <Button onClick={() => router.push('/expenses/new')}>
          <Plus className="mr-2" size={16} />
          支出を追加
        </Button>
      </div>

      {/* 月選択 */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={handlePrevMonth}>
              <ChevronLeft size={16} />
            </Button>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-semibold">
                {format(currentMonth, 'yyyy年M月')}
              </h2>
              <Button variant="outline" size="sm" onClick={handleToday}>
                今月
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <ChevronRight size={16} />
            </Button>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">合計支出</span>
              <span className="text-2xl font-bold text-red-600">
                {formatCurrency(totalExpenses)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 支出一覧 */}
      {expenses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">この月の支出はまだありません</p>
            <Button onClick={() => router.push('/expenses/new')}>
              <Plus className="mr-2" size={16} />
              最初の支出を記録
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0">
                  <div className="flex items-center space-x-3 flex-1">
                    {expense.category && (
                      <div
                        className="p-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: expense.category.color + '20' }}
                      >
                        <CategoryIcon icon={expense.category.icon} size={20} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm sm:text-base">
                          {expense.category?.name || '未分類'}
                        </span>
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {formatDateShort(expense.date)}
                        </span>
                      </div>
                      {expense.memo && (
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{expense.memo}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-base sm:text-lg font-bold text-red-600">
                        {formatCurrency(expense.amount)}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 sm:ml-4 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(expense)}
                      className="flex-1 sm:flex-initial touch-manipulation min-h-[44px] sm:min-h-0"
                    >
                      <Pencil size={16} className="mr-1 sm:mr-0" />
                      <span className="sm:hidden">編集</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(expense)}
                      className="flex-1 sm:flex-initial touch-manipulation min-h-[44px] sm:min-h-0"
                    >
                      <Trash2 size={16} className="mr-1 sm:mr-0" />
                      <span className="sm:hidden">削除</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 編集ダイアログ */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>支出を編集</DialogTitle>
              <DialogDescription>支出情報を更新します</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* 金額入力 */}
              <Card>
                <CardContent className="pt-6">
                  <Label htmlFor="edit-amount" className="text-sm font-medium mb-2 block">金額</Label>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold">¥</span>
                    <Input
                      id="edit-amount"
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      placeholder="0"
                      className="text-2xl font-bold border-0 focus:ring-0 p-0 h-auto"
                      required
                      min="1"
                      step="1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* カテゴリ選択 */}
              <Card>
                <CardContent className="pt-6">
                  <Label className="text-sm font-medium mb-3 block">カテゴリを選択</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {categories.map((category) => {
                      const isSelected = editCategoryId === category.id;
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => setEditCategoryId(category.id)}
                          className={`p-3 rounded-lg border-2 transition-all relative ${
                            isSelected
                              ? 'border-primary bg-primary/20 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-0.5">
                              <Check size={14} strokeWidth={3} />
                            </div>
                          )}
                          <div
                            className="mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-1"
                            style={{ backgroundColor: category.color + (isSelected ? '50' : '30') }}
                          >
                            <CategoryIcon icon={category.icon} size={20} />
                          </div>
                          <div className={`text-xs font-medium text-center ${isSelected ? 'text-primary font-bold' : ''}`}>
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
                <CardContent className="pt-6">
                  <Label htmlFor="edit-date" className="text-sm font-medium mb-2 block">日付</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                    className="text-base"
                  />
                </CardContent>
              </Card>

              {/* メモ入力 */}
              <Card>
                <CardContent className="pt-6">
                  <Label htmlFor="edit-memo" className="text-sm font-medium mb-2 block">メモ（任意）</Label>
                  <Input
                    id="edit-memo"
                    type="text"
                    value={editMemo}
                    onChange={(e) => setEditMemo(e.target.value)}
                    placeholder="例: ランチ代、コンビニ"
                    maxLength={100}
                    className="text-base"
                  />
                </CardContent>
              </Card>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditOpen(false);
                  setSelectedExpense(null);
                }}
                className="w-full sm:w-auto"
              >
                キャンセル
              </Button>
              <Button type="submit" className="w-full sm:w-auto">更新</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>支出を削除</DialogTitle>
            <DialogDescription>
              この支出を削除してもよろしいですか？
              <br />
              この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteOpen(false);
                setSelectedExpense(null);
              }}
            >
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
