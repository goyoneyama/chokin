'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useIncomeRecords } from '@/hooks/useIncomeRecords';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IncomeType, IncomeFrequency, INCOME_TYPE_LABELS, INCOME_FREQUENCY_LABELS } from '@/types/assets';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function NewIncomeRecordPage() {
  const router = useRouter();
  const { createIncomeRecord } = useIncomeRecords();

  const [name, setName] = useState('');
  const [incomeType, setIncomeType] = useState<IncomeType>('salary');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<IncomeFrequency>('monthly');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await createIncomeRecord({
      name,
      income_type: incomeType,
      amount: parseInt(amount) || 0,
      frequency,
    });

    if (success) {
      toast.success('収入を追加しました');
      router.push('/assets/income');
    } else {
      toast.error('収入の追加に失敗しました');
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl pb-24">
      <div className="flex items-center space-x-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft size={20} /></Button>
        <h1 className="text-2xl font-bold">収入を追加</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle>収入情報</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">名称</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="例: 本業給与" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="income-type">種類</Label>
              <select id="income-type" value={incomeType} onChange={(e) => setIncomeType(e.target.value as IncomeType)} className="w-full h-10 px-3 rounded-md border border-input bg-white">
                {Object.entries(INCOME_TYPE_LABELS).map(([value, label]) => (<option key={value} value={value}>{label}</option>))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">金額（円）</Label>
              <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="金額を入力" min="0" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">頻度</Label>
              <select id="frequency" value={frequency} onChange={(e) => setFrequency(e.target.value as IncomeFrequency)} className="w-full h-10 px-3 rounded-md border border-input bg-white">
                {Object.entries(INCOME_FREQUENCY_LABELS).map(([value, label]) => (<option key={value} value={value}>{label}</option>))}
              </select>
            </div>
          </CardContent>
        </Card>

        <div className="flex space-x-3">
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1" disabled={loading}>キャンセル</Button>
          <Button type="submit" className="flex-1" disabled={loading}>{loading ? '保存中...' : '保存'}</Button>
        </div>
      </form>
    </div>
  );
}
