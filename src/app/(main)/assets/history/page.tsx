'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import { MonthlyAssetRecord } from '@/types/assets';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function HistoryPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [records, setRecords] = useState<MonthlyAssetRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecords();
  }, [user]);

  const loadRecords = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('monthly_asset_records')
        .select('*')
        .eq('user_id', user.id)
        .order('year_month', { ascending: false })
        .limit(12);

      if (!error && data) {
        setRecords(data as MonthlyAssetRecord[]);
      }
    } catch (e) {
      console.error('Error loading records:', e);
    } finally {
      setLoading(false);
    }
  };

  const getRecentMonths = (count: number = 6) => {
    const months: string[] = [];
    const now = new Date();
    for (let i = 0; i < count; i++) {
      const date = subMonths(now, i);
      months.push(format(date, 'yyyy-MM'));
    }
    return months.reverse();
  };

  const getRecordForMonth = (yearMonth: string) => {
    return records.find((r) => r.year_month === yearMonth);
  };

  const formatMonth = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    return `${parseInt(month)}月`;
  };

  const formatYearMonth = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    return `${year}年${parseInt(month)}月`;
  };

  const recentMonths = getRecentMonths(6);
  const salaryDay = user?.salary_day || 25;
  const cardPaymentDay = user?.card_payment_day || 27;

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-6xl pb-24">
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
    <div className="container mx-auto p-4 max-w-6xl pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/assets')}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold">月次履歴</h1>
        </div>
      </div>

      {/* Info Card */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800">
            <strong>基準日:</strong> 口座残高は{salaryDay - 1}日時点、資産合計は{cardPaymentDay}日時点で記録
          </p>
        </CardContent>
      </Card>

      {/* Spreadsheet-like History Table */}
      <Card>
        <CardHeader>
          <CardTitle>月別推移</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {records.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">履歴がまだありません</p>
              <p className="text-sm text-muted-foreground">
                資産管理のメイン画面でデータを入力すると、自動的に記録されます
              </p>
            </div>
          ) : (
            <div className="min-w-[600px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-3 font-medium bg-gray-50 sticky left-0">項目</th>
                    {recentMonths.map((month) => (
                      <th key={month} className="text-right py-3 px-3 font-medium min-w-[120px]">
                        {formatMonth(month)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Bank Balance */}
                  <tr className="border-b hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium bg-gray-50 sticky left-0">
                      口座残高 ({salaryDay - 1}日)
                    </td>
                    {recentMonths.map((month) => {
                      const record = getRecordForMonth(month);
                      return (
                        <td key={month} className="text-right py-3 px-3 font-medium text-blue-700">
                          {record ? formatCurrency(record.bank_balance) : '-'}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Monthly Income */}
                  <tr className="border-b hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium bg-gray-50 sticky left-0">
                      今月の収入
                    </td>
                    {recentMonths.map((month) => {
                      const record = getRecordForMonth(month);
                      return (
                        <td key={month} className="text-right py-3 px-3 font-medium text-green-700">
                          {record ? formatCurrency(record.monthly_income) : '-'}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Credit Expenses */}
                  <tr className="border-b hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium bg-gray-50 sticky left-0">
                      今月の支出（クレジット）
                    </td>
                    {recentMonths.map((month) => {
                      const record = getRecordForMonth(month);
                      return (
                        <td key={month} className="text-right py-3 px-3 font-medium text-red-700">
                          {record ? formatCurrency(record.credit_expenses) : '-'}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Calculated Balance */}
                  <tr className="border-b bg-blue-50 hover:bg-blue-100">
                    <td className="py-3 px-3 font-bold bg-blue-100 sticky left-0">
                      資産合計 ({cardPaymentDay}日)
                    </td>
                    {recentMonths.map((month) => {
                      const record = getRecordForMonth(month);
                      const prevMonth = recentMonths[recentMonths.indexOf(month) - 1];
                      const prevRecord = prevMonth ? getRecordForMonth(prevMonth) : null;
                      const change = record && prevRecord
                        ? record.calculated_balance - prevRecord.calculated_balance
                        : null;

                      return (
                        <td key={month} className="text-right py-3 px-3">
                          <div className="font-bold text-blue-900">
                            {record ? formatCurrency(record.calculated_balance) : '-'}
                          </div>
                          {change !== null && (
                            <div className={`text-xs flex items-center justify-end mt-1 ${
                              change >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {change >= 0 ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                              {change >= 0 ? '+' : ''}{formatCurrency(change)}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* NISA Value */}
                  <tr className="border-b hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium bg-gray-50 sticky left-0">
                      NISA評価額
                    </td>
                    {recentMonths.map((month) => {
                      const record = getRecordForMonth(month);
                      return (
                        <td key={month} className="text-right py-3 px-3 font-medium text-purple-700">
                          {record ? formatCurrency(record.nisa_value) : '-'}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Status Indicator */}
                  <tr className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 text-sm bg-gray-50 sticky left-0">
                      ステータス
                    </td>
                    {recentMonths.map((month) => {
                      const record = getRecordForMonth(month);
                      return (
                        <td key={month} className="text-right py-2 px-3 text-xs">
                          {record ? (
                            <span className={`px-2 py-1 rounded ${
                              record.is_confirmed
                                ? 'bg-green-100 text-green-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}>
                              {record.is_confirmed ? '確定' : '予測'}
                            </span>
                          ) : '-'}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {records.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">平均月収</p>
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(
                  Math.round(
                    records.reduce((sum, r) => sum + r.monthly_income, 0) / records.length
                  )
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">平均支出</p>
              <p className="text-2xl font-bold text-red-700">
                {formatCurrency(
                  Math.round(
                    records.reduce((sum, r) => sum + r.credit_expenses, 0) / records.length
                  )
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">月平均貯蓄額</p>
              <p className="text-2xl font-bold text-blue-700">
                {formatCurrency(
                  Math.round(
                    records.reduce((sum, r) => sum + (r.monthly_income - r.credit_expenses), 0) / records.length
                  )
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
