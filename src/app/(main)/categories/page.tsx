'use client';

import { useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CategoryIcon, iconOptions } from '@/components/CategoryIcon';
import { Category } from '@/types';
import { formatCurrency } from '@/lib/formatters';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function CategoriesPage() {
  const { categories, loading, error, createCategory, updateCategory, deleteCategory } =
    useCategories();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    budget: 0,
    icon: 'receipt',
    color: '#6B7280',
    is_fixed: false,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      budget: 0,
      icon: 'receipt',
      color: '#6B7280',
      is_fixed: false,
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await createCategory(formData);
    if (success) {
      setIsCreateOpen(false);
      resetForm();
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    const success = await updateCategory(selectedCategory.id, formData);
    if (success) {
      setIsEditOpen(false);
      setSelectedCategory(null);
      resetForm();
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    const success = await deleteCategory(selectedCategory.id);
    if (success) {
      setIsDeleteOpen(false);
      setSelectedCategory(null);
    }
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      budget: category.budget,
      icon: category.icon,
      color: category.color,
      is_fixed: category.is_fixed,
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteOpen(true);
  };

  const colorOptions = [
    { value: '#EF4444', label: '赤' },
    { value: '#F97316', label: 'オレンジ' },
    { value: '#F59E0B', label: '黄' },
    { value: '#84CC16', label: '緑' },
    { value: '#3B82F6', label: '青' },
    { value: '#8B5CF6', label: '紫' },
    { value: '#EC4899', label: 'ピンク' },
    { value: '#6B7280', label: 'グレー' },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">カテゴリ管理</h1>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2" size={16} />
          カテゴリを追加
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div
                    className="p-2 rounded-full"
                    style={{ backgroundColor: category.color + '20' }}
                  >
                    <CategoryIcon
                      icon={category.icon}
                      className="text-gray-700"
                      size={24}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{category.name}</h3>
                      {category.is_fixed && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                          固定費
                        </span>
                      )}
                      {category.is_default && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded">
                          デフォルト
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      予算: {formatCurrency(category.budget)}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(category)}
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteDialog(category)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 作成ダイアログ */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>カテゴリを追加</DialogTitle>
              <DialogDescription>
                新しいカテゴリを作成します
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">カテゴリ名</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">月予算（円）</Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) =>
                    setFormData({ ...formData, budget: parseInt(e.target.value) || 0 })
                  }
                  required
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label>アイコン</Label>
                <div className="grid grid-cols-7 gap-2">
                  {iconOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`p-2 border rounded hover:bg-gray-50 ${
                        formData.icon === option.value
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200'
                      }`}
                      onClick={() => setFormData({ ...formData, icon: option.value })}
                    >
                      <option.Icon size={20} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>カラー</Label>
                <div className="grid grid-cols-8 gap-2">
                  {colorOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`w-10 h-10 rounded-full border-2 ${
                        formData.color === option.value
                          ? 'border-gray-900'
                          : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: option.value }}
                      onClick={() => setFormData({ ...formData, color: option.value })}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_fixed"
                  checked={formData.is_fixed}
                  onChange={(e) =>
                    setFormData({ ...formData, is_fixed: e.target.checked })
                  }
                  className="rounded"
                />
                <Label htmlFor="is_fixed" className="font-normal">
                  固定費として設定
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  resetForm();
                }}
              >
                キャンセル
              </Button>
              <Button type="submit">作成</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 編集ダイアログ */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>カテゴリを編集</DialogTitle>
              <DialogDescription>
                カテゴリ情報を更新します
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">カテゴリ名</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-budget">月予算（円）</Label>
                <Input
                  id="edit-budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) =>
                    setFormData({ ...formData, budget: parseInt(e.target.value) || 0 })
                  }
                  required
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label>アイコン</Label>
                <div className="grid grid-cols-7 gap-2">
                  {iconOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`p-2 border rounded hover:bg-gray-50 ${
                        formData.icon === option.value
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200'
                      }`}
                      onClick={() => setFormData({ ...formData, icon: option.value })}
                    >
                      <option.Icon size={20} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>カラー</Label>
                <div className="grid grid-cols-8 gap-2">
                  {colorOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`w-10 h-10 rounded-full border-2 ${
                        formData.color === option.value
                          ? 'border-gray-900'
                          : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: option.value }}
                      onClick={() => setFormData({ ...formData, color: option.value })}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-is_fixed"
                  checked={formData.is_fixed}
                  onChange={(e) =>
                    setFormData({ ...formData, is_fixed: e.target.checked })
                  }
                  className="rounded"
                />
                <Label htmlFor="edit-is_fixed" className="font-normal">
                  固定費として設定
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditOpen(false);
                  setSelectedCategory(null);
                  resetForm();
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
            <DialogTitle>カテゴリを削除</DialogTitle>
            <DialogDescription>
              「{selectedCategory?.name}」を削除してもよろしいですか？
              <br />
              この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteOpen(false);
                setSelectedCategory(null);
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
