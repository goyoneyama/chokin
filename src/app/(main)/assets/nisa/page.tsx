'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useNisaAccounts } from '@/hooks/useNisaAccounts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { NISA_ACCOUNT_TYPE_LABELS } from '@/types/assets';
import { ArrowLeft, Plus, TrendingUp, Pencil } from 'lucide-react';

export default function NisaAccountsPage() {
  const router = useRouter();
  const { nisaAccounts, loading, totalValue, totalInvested, gainLoss, gainLossPercent } = useNisaAccounts();

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl pb-24">
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-16 bg-gray-100 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/assets')}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold">NISA口座</h1>
        </div>
        <Link href="/assets/nisa/new">
          <Button>
            <Plus size={16} className="mr-1" />
            追加
          </Button>
        </Link>
      </div>

      {/* Summary */}
      <Card className="mb-6 bg-green-50">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">評価額</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(totalValue)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">損益</p>
              <p className={`text-lg font-bold ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)}
                <span className="text-sm ml-1">({gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(1)}%)</span>
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">投資元本: {formatCurrency(totalInvested)}</p>
        </CardContent>
      </Card>

      {/* Account List */}
      {nisaAccounts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <TrendingUp className="mx-auto mb-4 text-muted-foreground" size={48} />
            <p className="text-muted-foreground mb-4">NISA口座がまだありません</p>
            <Link href="/assets/nisa/new">
              <Button>
                <Plus size={16} className="mr-1" />
                最初のNISA口座を追加
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {nisaAccounts.map((account) => {
            const accountGainLoss = account.current_value - account.total_invested;
            return (
              <Link key={account.id} href={`/assets/nisa/${account.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-green-100">
                          <TrendingUp className="w-5 h-5 text-green-700" />
                        </div>
                        <div>
                          <p className="font-medium">{account.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {account.broker_name} • {NISA_ACCOUNT_TYPE_LABELS[account.account_type]}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex items-center space-x-2">
                        <div>
                          <p className="text-lg font-bold">{formatCurrency(account.current_value)}</p>
                          <p className={`text-xs ${accountGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {accountGainLoss >= 0 ? '+' : ''}{formatCurrency(accountGainLoss)}
                          </p>
                        </div>
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
