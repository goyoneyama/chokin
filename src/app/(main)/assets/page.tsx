'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useNisaAccounts } from '@/hooks/useNisaAccounts';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useIncomeRecords } from '@/hooks/useIncomeRecords';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import {
  ArrowLeft,
  Building2,
  TrendingUp,
  CreditCard,
  Wallet,
  Settings,
  History,
} from 'lucide-react';

export default function AssetsPage() {
  const router = useRouter();
  const { bankAccounts, totalBalance: bankTotal, loading: bankLoading } = useBankAccounts();
  const { nisaAccounts, totalValue: nisaTotal, loading: nisaLoading } = useNisaAccounts();
  const { creditCards, totalBalance: creditTotal, loading: creditLoading } = useCreditCards();
  const { incomeRecords, monthlyIncome, loading: incomeLoading } = useIncomeRecords();

  const loading = bankLoading || nisaLoading || creditLoading || incomeLoading;
  const netWorth = bankTotal + nisaTotal - creditTotal;

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl pb-24">
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="h-24 bg-gray-100 rounded animate-pulse" />
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-20 bg-gray-100 rounded animate-pulse" />
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
          <Button variant="ghost" size="sm" onClick={() => router.push('/settings')}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold">資産管理</h1>
        </div>
        <Link href="/assets/settings">
          <Button variant="ghost" size="sm">
            <Settings size={20} />
          </Button>
        </Link>
      </div>

      {/* Net Worth Summary Card */}
      <Card className="mb-6 bg-gradient-to-br from-primary/10 to-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">純資産</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatCurrency(netWorth)}</div>
          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">資産合計</span>
              <span className="font-medium text-green-600">{formatCurrency(bankTotal + nisaTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">負債合計</span>
              <span className="font-medium text-red-600">-{formatCurrency(creditTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">月間収入</span>
              <span className="font-medium">{formatCurrency(monthlyIncome)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asset Categories */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Link href="/assets/bank">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="p-2 rounded-full bg-blue-100">
                  <Building2 className="w-4 h-4 text-blue-700" />
                </div>
                <span className="font-medium text-sm">銀行口座</span>
              </div>
              <p className="text-lg font-bold text-blue-700">{formatCurrency(bankTotal)}</p>
              <p className="text-xs text-muted-foreground">{bankAccounts.length}件</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/assets/nisa">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="p-2 rounded-full bg-green-100">
                  <TrendingUp className="w-4 h-4 text-green-700" />
                </div>
                <span className="font-medium text-sm">NISA</span>
              </div>
              <p className="text-lg font-bold text-green-700">{formatCurrency(nisaTotal)}</p>
              <p className="text-xs text-muted-foreground">{nisaAccounts.length}件</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/assets/cards">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="p-2 rounded-full bg-orange-100">
                  <CreditCard className="w-4 h-4 text-orange-700" />
                </div>
                <span className="font-medium text-sm">クレジットカード</span>
              </div>
              <p className="text-lg font-bold text-orange-700">-{formatCurrency(creditTotal)}</p>
              <p className="text-xs text-muted-foreground">{creditCards.length}件</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/assets/income">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="p-2 rounded-full bg-purple-100">
                  <Wallet className="w-4 h-4 text-purple-700" />
                </div>
                <span className="font-medium text-sm">収入</span>
              </div>
              <p className="text-lg font-bold text-purple-700">{formatCurrency(monthlyIncome)}/月</p>
              <p className="text-xs text-muted-foreground">{incomeRecords.length}件</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* History Link */}
      <Link href="/assets/history">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gray-100">
              <History className="w-5 h-5 text-gray-700" />
            </div>
            <div className="flex-1">
              <p className="font-medium">月次履歴</p>
              <p className="text-sm text-muted-foreground">
                スプレッドシート風の月別推移を確認
              </p>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
