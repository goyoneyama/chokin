'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BankAccountType, BANK_ACCOUNT_TYPE_LABELS } from '@/types/assets';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function NewBankAccountPage() {
  const router = useRouter();
  const { createBankAccount } = useBankAccounts();

  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountType, setAccountType] = useState<BankAccountType>('savings');
  const [balance, setBalance] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await createBankAccount({
      name,
      bank_name: bankName,
      account_type: accountType,
      current_balance: parseInt(balance) || 0,
    });

    if (success) {
      toast.success('銀行口座を追加しました');
      router.push('/assets/bank');
    } else {
      toast.error('銀行口座の追加に失敗しました');
    }

    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl pb-24">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-2xl font-bold">銀行口座を追加</h1>
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
                placeholder="例: 三菱UFJ銀行"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-name">口座名（表示名）</Label>
              <Input
                id="account-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: メイン口座、給与口座"
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
            disabled={loading}
          >
            キャンセル
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? '保存中...' : '保存'}
          </Button>
        </div>
      </form>
    </div>
  );
}
