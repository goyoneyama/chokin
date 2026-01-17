'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useIncomeRecords } from '@/hooks/useIncomeRecords';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IncomeRecord, IncomeType, IncomeFrequency, INCOME_TYPE_LABELS, INCOME_FREQUENCY_LABELS } from '@/types/assets';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function EditIncomeRecordPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { getIncomeRecord, updateIncomeRecord, deleteIncomeRecord } = useIncomeRecords();

  const [record, setRecord] = useState<IncomeRecord | null>(null);
  const [name, setName] = useState('');
  const [incomeType, setIncomeType] = useState<IncomeType>('salary');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<IncomeFrequency>('monthly');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    const fetchRecord = async () => {
      const data = await getIncomeRecord(id);
      if (data) {
        setRecord(data);
        setName(data.name);
        setIncomeType(data.income_type);
        setAmount(data.amount.toString());
        setFrequency(data.frequency);
      }
      setLoading(false);
    };
    fetchRecord();
  }, [id, getIncomeRecord]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const success = await updateIncomeRecord(id, {
      name,
      income_type: incomeType,
      amount: parseInt(amount) || 0,
      frequency,
    });

    if (success) {
      toast.success('収入を更新しました');
      router.push('/assets/income');
    } else {
      toast.error('収入の更新に失敗しました');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    const success = await deleteIncomeRecord(id);
    if (success) {
      toast.success('収入を削除しました');
      router.push('/assets/income');
    } else {
      toast.error('収入の削除に失敗しました');
    }
  };

  if (loading) {
    return (<div className="container mx-auto p-4 max-w-2xl pb-24"><div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" /><Card><CardContent className="p-4"><div className="h-48 bg-gray-100 rounded animate-pulse" /></CardContent></Card></div>);
  }

  if (!record) {
    return (<div className="container mx-auto p-4 max-w-2xl pb-24"><p>収入が見つかりませんでした</p><Button onClick={() => router.push('/assets/income')}>戻る</Button></div>);
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl pb-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft size={20} /></Button>
          <h1 className="text-2xl font-bold">収入を編集</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsDeleteOpen(true)}><Trash2 size={20} className="text-red-600" /></Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle>収入情報</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="name">名称</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="income-type">種類</Label><select id="income-type" value={incomeType} onChange={(e) => setIncomeType(e.target.value as IncomeType)} className="w-full h-10 px-3 rounded-md border border-input bg-white">{Object.entries(INCOME_TYPE_LABELS).map(([value, label]) => (<option key={value} value={value}>{label}</option>))}</select></div>
            <div className="space-y-2"><Label htmlFor="amount">金額（円）</Label><Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="0" required /></div>
            <div className="space-y-2"><Label htmlFor="frequency">頻度</Label><select id="frequency" value={frequency} onChange={(e) => setFrequency(e.target.value as IncomeFrequency)} className="w-full h-10 px-3 rounded-md border border-input bg-white">{Object.entries(INCOME_FREQUENCY_LABELS).map(([value, label]) => (<option key={value} value={value}>{label}</option>))}</select></div>
          </CardContent>
        </Card>

        <div className="flex space-x-3">
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1" disabled={saving}>キャンセル</Button>
          <Button type="submit" className="flex-1" disabled={saving}>{saving ? '保存中...' : '保存'}</Button>
        </div>
      </form>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="bg-white"><DialogHeader><DialogTitle>収入を削除</DialogTitle><DialogDescription>「{record.name}」を削除してもよろしいですか？</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setIsDeleteOpen(false)}>キャンセル</Button><Button variant="destructive" onClick={handleDelete}>削除</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}
