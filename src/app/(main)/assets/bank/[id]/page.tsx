'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BankAccount, BankAccountType, BANK_ACCOUNT_TYPE_LABELS } from '@/types/assets';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function EditBankAccountPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { getBankAccount, updateBankAccount, deleteBankAccount } = useBankAccounts();

  const [account, setAccount] = useState<BankAccount | null>(null);
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountType, setAccountType] = useState<BankAccountType>('savings');
  const [balance, setBalance] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    const fetchAccount = async () => {
      const data = await getBankAccount(id);
      if (data) {
        setAccount(data);
        setName(data.name);
        setBankName(data.bank_name);
        setAccountType(data.account_type);
        setBalance(data.current_balance.toString());
      }
      setLoading(false);
    };
    fetchAccount();
  }, [id, getBankAccount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const success = await updateBankAccount(id, {
      name,
      bank_name: bankName,
      account_type: accountType,
      current_balance: parseInt(balance) || 0,
    });

    if (success) {
      toast.success('銀行口座を更新しました');
      router.push('/assets/bank');
    } else {
      toast.error('銀行口座の更新に失敗しました');
    }

    setSaving(false);
  };

  const handleDelete = async () => {
    const success = await deleteBankAccount(id);
    if (success) {
      toast.success('銀行口座を削除しました');
      router.push('/assets/bank');
    } else {
      toast.error('銀行口座の削除に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-2xl pb-24">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <Card>
          <CardContent className="p-4">
            <div className="h-48 bg-gray-100 rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="container mx-auto p-4 max-w-2xl pb-24">
        <p>口座が見つかりませんでした</p>
        <Button onClick={() => router.push('/assets/bank')}>戻る</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold">銀行口座を編集</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsDeleteOpen(true)}>
          <Trash2 size={20} className="text-red-600" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>口座情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bank-name">銀行名</Label>
              <Input
                id="bank-name"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-name">口座名（表示名）</Label>
              <Input
                id="account-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-type">口座種別</Label>
              <select
                id="account-type"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as BankAccountType)}
                className="w-full h-10 px-3 rounded-md border border-input bg-white"
              >
                {Object.entries(BANK_ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="balance">現在の残高（円）</Label>
              <Input
                id="balance"
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="金額を入力"
                min="0"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
            disabled={saving}
          >
            キャンセル
          </Button>
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </form>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>銀行口座を削除</DialogTitle>
            <DialogDescription>
              「{account.name}」を削除してもよろしいですか？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
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
