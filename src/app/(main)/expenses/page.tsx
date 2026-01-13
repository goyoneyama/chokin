'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useExpenses } from '@/hooks/useExpenses';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
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
      setIsEditOpen(false);
      setSelectedExpense(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedExpense) return;
    const success = await deleteExpense(selectedExpense.id);
    if (success) {
      setIsDeleteOpen(false);
      setSelectedExpense(null);
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>読み込み中...</p>
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
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {expense.category && (
                      <div
                        className="p-2 rounded-full"
                        style={{ backgroundColor: expense.category.color + '20' }}
                      >
                        <CategoryIcon icon={expense.category.icon} size={20} />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">
                          {expense.category?.name || '未分類'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatDateShort(expense.date)}
                        </span>
                      </div>
                      {expense.memo && (
                        <p className="text-sm text-muted-foreground">{expense.memo}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">
                        {formatCurrency(expense.amount)}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(expense)}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(expense)}
                    >
                      <Trash2 size={16} />
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
        <DialogContent>
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>支出を編集</DialogTitle>
              <DialogDescription>支出情報を更新します</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-amount">金額（円）</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  required
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">カテゴリ</Label>
                <select
                  id="edit-category"
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  required
                >
                  <option value="">選択してください</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date">日付</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-memo">メモ</Label>
                <Input
                  id="edit-memo"
                  type="text"
                  value={editMemo}
                  onChange={(e) => setEditMemo(e.target.value)}
                  placeholder="メモを入力"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditOpen(false);
                  setSelectedExpense(null);
                }}
              >
                キャンセル
              </Button>
              <Button type="submit">更新</Button>
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
