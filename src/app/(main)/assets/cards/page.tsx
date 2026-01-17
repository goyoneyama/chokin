'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreditCards } from '@/hooks/useCreditCards';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { ArrowLeft, Plus, CreditCard, Pencil } from 'lucide-react';

export default function CreditCardsPage() {
  const router = useRouter();
  const { creditCards, loading, totalBalance, totalLimit } = useCreditCards();

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl pb-24">
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i}><CardContent className="p-4"><div className="h-16 bg-gray-100 rounded animate-pulse" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl pb-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/assets')}><ArrowLeft size={20} /></Button>
          <h1 className="text-2xl font-bold">クレジットカード</h1>
        </div>
        <Link href="/assets/cards/new"><Button><Plus size={16} className="mr-1" />追加</Button></Link>
      </div>

      <Card className="mb-6 bg-orange-50">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">利用残高（負債）</p>
              <p className="text-2xl font-bold text-orange-700">{formatCurrency(totalBalance)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">限度額合計</p>
              <p className="text-lg font-medium">{formatCurrency(totalLimit)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {creditCards.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CreditCard className="mx-auto mb-4 text-muted-foreground" size={48} />
            <p className="text-muted-foreground mb-4">クレジットカードがまだありません</p>
            <Link href="/assets/cards/new"><Button><Plus size={16} className="mr-1" />最初のカードを追加</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {creditCards.map((card) => (
            <Link key={card.id} href={`/assets/cards/${card.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-orange-100">
                        <CreditCard className="w-5 h-5 text-orange-700" />
                      </div>
                      <div>
                        <p className="font-medium">{card.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {card.card_brand || 'カード'} • 支払日: {card.payment_due_day ? `${card.payment_due_day}日` : '未設定'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="text-lg font-bold text-orange-700">{formatCurrency(card.current_balance)}</p>
                        <p className="text-xs text-muted-foreground">/ {formatCurrency(card.credit_limit)}</p>
                      </div>
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
