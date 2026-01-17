'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNisaAccounts } from '@/hooks/useNisaAccounts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NisaAccountType, NISA_ACCOUNT_TYPE_LABELS } from '@/types/assets';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function NewNisaAccountPage() {
  const router = useRouter();
  const { createNisaAccount } = useNisaAccounts();

  const [name, setName] = useState('');
  const [brokerName, setBrokerName] = useState('');
  const [accountType, setAccountType] = useState<NisaAccountType>('tsumitate');
  const [currentValue, setCurrentValue] = useState('');
  const [totalInvested, setTotalInvested] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await createNisaAccount({
      name,
      broker_name: brokerName,
      account_type: accountType,
      current_value: parseInt(currentValue) || 0,
      total_invested: parseInt(totalInvested) || 0,
      monthly_contribution: parseInt(monthlyContribution) || 0,
    });

    if (success) {
      toast.success('NISA口座を追加しました');
      router.push('/assets/nisa');
    } else {
      toast.error('NISA口座の追加に失敗しました');
    }

    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl pb-24">
      <div className="flex items-center space-x-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-2xl font-bold">NISA口座を追加</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>口座情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="broker-name">証券会社名</Label>
              <Input
                id="broker-name"
                value={brokerName}
                onChange={(e) => setBrokerName(e.target.value)}
                placeholder="例: 楽天証券"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-name">口座名（表示名）</Label>
              <Input
                id="account-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 楽天NISA"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-type">投資枠タイプ</Label>
              <select
                id="account-type"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as NisaAccountType)}
                className="w-full h-10 px-3 rounded-md border border-input bg-white"
              >
                {Object.entries(NISA_ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current-value">現在の評価額（円）</Label>
              <Input
                id="current-value"
                type="number"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total-invested">投資元本（円）</Label>
              <Input
                id="total-invested"
                type="number"
                value={totalInvested}
                onChange={(e) => setTotalInvested(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly-contribution">月額積立額（円）</Label>
              <Input
                id="monthly-contribution"
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex space-x-3">
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1" disabled={loading}>
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
