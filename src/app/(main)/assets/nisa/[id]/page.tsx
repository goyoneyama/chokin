'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useNisaAccounts } from '@/hooks/useNisaAccounts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NisaAccount, NisaAccountType, NISA_ACCOUNT_TYPE_LABELS } from '@/types/assets';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function EditNisaAccountPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { getNisaAccount, updateNisaAccount, deleteNisaAccount } = useNisaAccounts();

  const [account, setAccount] = useState<NisaAccount | null>(null);
  const [name, setName] = useState('');
  const [brokerName, setBrokerName] = useState('');
  const [accountType, setAccountType] = useState<NisaAccountType>('tsumitate');
  const [currentValue, setCurrentValue] = useState('');
  const [totalInvested, setTotalInvested] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    const fetchAccount = async () => {
      const data = await getNisaAccount(id);
      if (data) {
        setAccount(data);
        setName(data.name);
        setBrokerName(data.broker_name);
        setAccountType(data.account_type);
        setCurrentValue(data.current_value.toString());
        setTotalInvested(data.total_invested.toString());
        setMonthlyContribution(data.monthly_contribution.toString());
      }
      setLoading(false);
    };
    fetchAccount();
  }, [id, getNisaAccount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const success = await updateNisaAccount(id, {
      name,
      broker_name: brokerName,
      account_type: accountType,
      current_value: parseInt(currentValue) || 0,
      total_invested: parseInt(totalInvested) || 0,
      monthly_contribution: parseInt(monthlyContribution) || 0,
    });

    if (success) {
      toast.success('NISA口座を更新しました');
      router.push('/assets/nisa');
    } else {
      toast.error('NISA口座の更新に失敗しました');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    const success = await deleteNisaAccount(id);
    if (success) {
      toast.success('NISA口座を削除しました');
      router.push('/assets/nisa');
    } else {
      toast.error('NISA口座の削除に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-2xl pb-24">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <Card><CardContent className="p-4"><div className="h-48 bg-gray-100 rounded animate-pulse" /></CardContent></Card>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="container mx-auto p-4 max-w-2xl pb-24">
        <p>口座が見つかりませんでした</p>
        <Button onClick={() => router.push('/assets/nisa')}>戻る</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl pb-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft size={20} /></Button>
          <h1 className="text-2xl font-bold">NISA口座を編集</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsDeleteOpen(true)}>
          <Trash2 size={20} className="text-red-600" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle>口座情報</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="broker-name">証券会社名</Label>
              <Input id="broker-name" value={brokerName} onChange={(e) => setBrokerName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-name">口座名</Label>
              <Input id="account-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-type">投資枠タイプ</Label>
              <select id="account-type" value={accountType} onChange={(e) => setAccountType(e.target.value as NisaAccountType)} className="w-full h-10 px-3 rounded-md border border-input bg-white">
                {Object.entries(NISA_ACCOUNT_TYPE_LABELS).map(([value, label]) => (<option key={value} value={value}>{label}</option>))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="current-value">現在の評価額（円）</Label>
              <Input id="current-value" type="number" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} min="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total-invested">投資元本（円）</Label>
              <Input id="total-invested" type="number" value={totalInvested} onChange={(e) => setTotalInvested(e.target.value)} min="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly-contribution">月額積立額（円）</Label>
              <Input id="monthly-contribution" type="number" value={monthlyContribution} onChange={(e) => setMonthlyContribution(e.target.value)} min="0" />
            </div>
          </CardContent>
        </Card>

        <div className="flex space-x-3">
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1" disabled={saving}>キャンセル</Button>
          <Button type="submit" className="flex-1" disabled={saving}>{saving ? '保存中...' : '保存'}</Button>
        </div>
      </form>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>NISA口座を削除</DialogTitle>
            <DialogDescription>「{account.name}」を削除してもよろしいですか？</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>キャンセル</Button>
            <Button variant="destructive" onClick={handleDelete}>削除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
