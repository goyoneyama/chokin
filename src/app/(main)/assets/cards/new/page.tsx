'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreditCards } from '@/hooks/useCreditCards';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardBrand, CARD_BRAND_LABELS } from '@/types/assets';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function NewCreditCardPage() {
  const router = useRouter();
  const { createCreditCard } = useCreditCards();

  const [name, setName] = useState('');
  const [cardBrand, setCardBrand] = useState<CardBrand | ''>('');
  const [creditLimit, setCreditLimit] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [paymentDueDay, setPaymentDueDay] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await createCreditCard({
      name,
      card_brand: cardBrand || null,
      credit_limit: parseInt(creditLimit) || 0,
      current_balance: parseInt(currentBalance) || 0,
      payment_due_day: paymentDueDay ? parseInt(paymentDueDay) : null,
    });

    if (success) {
      toast.success('クレジットカードを追加しました');
      router.push('/assets/cards');
    } else {
      toast.error('クレジットカードの追加に失敗しました');
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl pb-24">
      <div className="flex items-center space-x-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft size={20} /></Button>
        <h1 className="text-2xl font-bold">カードを追加</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle>カード情報</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">カード名</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="例: 楽天カード" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-brand">ブランド</Label>
              <select id="card-brand" value={cardBrand} onChange={(e) => setCardBrand(e.target.value as CardBrand)} className="w-full h-10 px-3 rounded-md border border-input bg-white">
                <option value="">選択してください</option>
                {Object.entries(CARD_BRAND_LABELS).map(([value, label]) => (<option key={value} value={value}>{label}</option>))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit-limit">限度額（円）</Label>
              <Input id="credit-limit" type="number" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} placeholder="0" min="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current-balance">現在の利用残高（円）</Label>
              <Input id="current-balance" type="number" value={currentBalance} onChange={(e) => setCurrentBalance(e.target.value)} placeholder="0" min="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-due-day">支払日（毎月何日）</Label>
              <Input id="payment-due-day" type="number" value={paymentDueDay} onChange={(e) => setPaymentDueDay(e.target.value)} placeholder="例: 27" min="1" max="31" />
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
