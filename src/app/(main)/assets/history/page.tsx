'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMonthlySnapshots } from '@/hooks/useMonthlySnapshots';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useNisaAccounts } from '@/hooks/useNisaAccounts';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useIncomeRecords } from '@/hooks/useIncomeRecords';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function HistoryPage() {
  const router = useRouter();
  const { snapshots, loading, createSnapshot, getRecentMonths } = useMonthlySnapshots();
  const { bankAccounts, totalBalance: bankTotal } = useBankAccounts();
  const { nisaAccounts, totalValue: nisaTotal } = useNisaAccounts();
  const { creditCards, totalBalance: creditTotal } = useCreditCards();
  const { incomeRecords, monthlyIncome } = useIncomeRecords();
  const [saving, setSaving] = useState(false);

  const recentMonths = getRecentMonths(3);
  const currentMonth = format(new Date(), 'yyyy-MM');

  const handleSaveSnapshot = async () => {
    setSaving(true);
    const success = await createSnapshot();
    if (success) {
      toast.success('今月のスナップショットを保存しました');
    } else {
      toast.error('スナップショットの保存に失敗しました');
    }
    setSaving(false);
  };

  const getSnapshotForMonth = (yearMonth: string) => {
    return snapshots.find((s) => s.year_month === yearMonth);
  };

  const formatMonth = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    return `${month}月`;
  };

  const formatYearMonth = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    return `${year}年${parseInt(month)}月`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl pb-24">
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="h-64 bg-gray-100 rounded animate-pulse" />
          </CardContent>
        </Card>
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
          <h1 className="text-2xl font-bold">月次履歴</h1>
        </div>
        <Button onClick={handleSaveSnapshot} disabled={saving}>
          <Save size={16} className="mr-1" />
          {saving ? '保存中...' : '今月を保存'}
        </Button>
      </div>

      {/* Current Status */}
      <Card className="mb-6 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">現在の状況（{formatYearMonth(currentMonth)}）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">銀行残高: </span>
              <span className="font-bold">{formatCurrency(bankTotal)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">NISA評価額: </span>
              <span className="font-bold">{formatCurrency(nisaTotal)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">カード残高: </span>
              <span className="font-bold text-red-600">-{formatCurrency(creditTotal)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">月間収入: </span>
              <span className="font-bold">{formatCurrency(monthlyIncome)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spreadsheet-like History Table */}
      <Card>
        <CardHeader>
          <CardTitle>月別推移</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {snapshots.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">履歴がまだありません</p>
              <p className="text-sm text-muted-foreground">
                「今月を保存」ボタンで現在の状況を記録しましょう
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium"></th>
                  {recentMonths.map((month) => (
                    <th key={month} className="text-right py-2 px-2 font-medium min-w-[100px]">
                      {formatMonth(month)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Income Section */}
                <tr className="bg-purple-50">
                  <td colSpan={recentMonths.length + 1} className="py-2 px-2 font-bold text-purple-900">
                    収入
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-2">収入計</td>
                  {recentMonths.map((month) => {
                    const snapshot = getSnapshotForMonth(month);
                    return (
                      <td key={month} className="text-right py-2 px-2 font-medium text-purple-700">
                        {snapshot ? formatCurrency(snapshot.total_income) : '-'}
                      </td>
                    );
                  })}
                </tr>

                {/* Expenses Section */}
                <tr className="bg-red-50">
                  <td colSpan={recentMonths.length + 1} className="py-2 px-2 font-bold text-red-900">
                    支出
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-2">支出計</td>
                  {recentMonths.map((month) => {
                    const snapshot = getSnapshotForMonth(month);
                    return (
                      <td key={month} className="text-right py-2 px-2 font-medium text-red-600">
                        {snapshot ? formatCurrency(snapshot.total_expenses) : '-'}
                      </td>
                    );
                  })}
                </tr>

                {/* Monthly Balance */}
                <tr className="border-b bg-gray-50">
                  <td className="py-2 px-2 font-bold">月次収支</td>
                  {recentMonths.map((month) => {
                    const snapshot = getSnapshotForMonth(month);
                    const balance = snapshot?.monthly_balance || 0;
                    return (
                      <td
                        key={month}
                        className={`text-right py-2 px-2 font-bold ${
                          balance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {snapshot ? (balance >= 0 ? '+' : '') + formatCurrency(balance) : '-'}
                      </td>
                    );
                  })}
                </tr>

                {/* Bank Section */}
                <tr className="bg-blue-50">
                  <td colSpan={recentMonths.length + 1} className="py-2 px-2 font-bold text-blue-900">
                    銀行口座
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-2">銀行計</td>
                  {recentMonths.map((month) => {
                    const snapshot = getSnapshotForMonth(month);
                    return (
                      <td key={month} className="text-right py-2 px-2 font-medium text-blue-700">
                        {snapshot ? formatCurrency(snapshot.total_bank_balance) : '-'}
                      </td>
                    );
                  })}
                </tr>

                {/* NISA Section */}
                <tr className="bg-green-50">
                  <td colSpan={recentMonths.length + 1} className="py-2 px-2 font-bold text-green-900">
                    NISA
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-2">NISA計</td>
                  {recentMonths.map((month) => {
                    const snapshot = getSnapshotForMonth(month);
                    return (
                      <td key={month} className="text-right py-2 px-2 font-medium text-green-700">
                        {snapshot ? formatCurrency(snapshot.total_nisa_value) : '-'}
                      </td>
                    );
                  })}
                </tr>

                {/* Credit Cards Section */}
                <tr className="bg-orange-50">
                  <td colSpan={recentMonths.length + 1} className="py-2 px-2 font-bold text-orange-900">
                    クレジットカード
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-2">カード計</td>
                  {recentMonths.map((month) => {
                    const snapshot = getSnapshotForMonth(month);
                    return (
                      <td key={month} className="text-right py-2 px-2 font-medium text-orange-700">
                        {snapshot ? `-${formatCurrency(snapshot.total_credit_balance)}` : '-'}
                      </td>
                    );
                  })}
                </tr>

                {/* Net Worth */}
                <tr className="bg-gray-100 font-bold">
                  <td className="py-3 px-2">純資産</td>
                  {recentMonths.map((month) => {
                    const snapshot = getSnapshotForMonth(month);
                    return (
                      <td key={month} className="text-right py-3 px-2 text-primary">
                        {snapshot ? formatCurrency(snapshot.net_worth) : '-'}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
