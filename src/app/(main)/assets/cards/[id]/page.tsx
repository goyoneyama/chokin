'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCreditCards } from '@/hooks/useCreditCards';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard as CreditCardType, CardBrand, CARD_BRAND_LABELS } from '@/types/assets';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function EditCreditCardPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { getCreditCard, updateCreditCard, deleteCreditCard } = useCreditCards();

  const [card, setCard] = useState<CreditCardType | null>(null);
  const [name, setName] = useState('');
  const [cardBrand, setCardBrand] = useState<CardBrand | ''>('');
  const [creditLimit, setCreditLimit] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [paymentDueDay, setPaymentDueDay] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    const fetchCard = async () => {
      const data = await getCreditCard(id);
      if (data) {
        setCard(data);
        setName(data.name);
        setCardBrand(data.card_brand || '');
        setCreditLimit(data.credit_limit.toString());
        setCurrentBalance(data.current_balance.toString());
        setPaymentDueDay(data.payment_due_day?.toString() || '');
      }
      setLoading(false);
    };
    fetchCard();
  }, [id, getCreditCard]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const success = await updateCreditCard(id, {
      name,
      card_brand: cardBrand || null,
      credit_limit: parseInt(creditLimit) || 0,
      current_balance: parseInt(currentBalance) || 0,
      payment_due_day: paymentDueDay ? parseInt(paymentDueDay) : null,
    });

    if (success) {
      toast.success('カードを更新しました');
      router.push('/assets/cards');
    } else {
      toast.error('カードの更新に失敗しました');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    const success = await deleteCreditCard(id);
    if (success) {
      toast.success('カードを削除しました');
      router.push('/assets/cards');
    } else {
      toast.error('カードの削除に失敗しました');
    }
  };

  if (loading) {
    return (<div className="container mx-auto p-4 max-w-2xl pb-24"><div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" /><Card><CardContent className="p-4"><div className="h-48 bg-gray-100 rounded animate-pulse" /></CardContent></Card></div>);
  }

  if (!card) {
    return (<div className="container mx-auto p-4 max-w-2xl pb-24"><p>カードが見つかりませんでした</p><Button onClick={() => router.push('/assets/cards')}>戻る</Button></div>);
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl pb-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft size={20} /></Button>
          <h1 className="text-2xl font-bold">カードを編集</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsDeleteOpen(true)}><Trash2 size={20} className="text-red-600" /></Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle>カード情報</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="name">カード名</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="card-brand">ブランド</Label><select id="card-brand" value={cardBrand} onChange={(e) => setCardBrand(e.target.value as CardBrand)} className="w-full h-10 px-3 rounded-md border border-input bg-white"><option value="">選択してください</option>{Object.entries(CARD_BRAND_LABELS).map(([value, label]) => (<option key={value} value={value}>{label}</option>))}</select></div>
            <div className="space-y-2"><Label htmlFor="credit-limit">限度額（円）</Label><Input id="credit-limit" type="number" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} min="0" /></div>
            <div className="space-y-2"><Label htmlFor="current-balance">現在の利用残高（円）</Label><Input id="current-balance" type="number" value={currentBalance} onChange={(e) => setCurrentBalance(e.target.value)} min="0" /></div>
            <div className="space-y-2"><Label htmlFor="payment-due-day">支払日</Label><Input id="payment-due-day" type="number" value={paymentDueDay} onChange={(e) => setPaymentDueDay(e.target.value)} min="1" max="31" /></div>
          </CardContent>
        </Card>

        <div className="flex space-x-3">
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1" disabled={saving}>キャンセル</Button>
          <Button type="submit" className="flex-1" disabled={saving}>{saving ? '保存中...' : '保存'}</Button>
        </div>
      </form>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="bg-white"><DialogHeader><DialogTitle>カードを削除</DialogTitle><DialogDescription>「{card.name}」を削除してもよろしいですか？</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setIsDeleteOpen(false)}>キャンセル</Button><Button variant="destructive" onClick={handleDelete}>削除</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}
