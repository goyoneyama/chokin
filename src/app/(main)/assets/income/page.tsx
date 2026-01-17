'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useIncomeRecords } from '@/hooks/useIncomeRecords';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { INCOME_TYPE_LABELS, INCOME_FREQUENCY_LABELS } from '@/types/assets';
import { ArrowLeft, Plus, Wallet, Pencil } from 'lucide-react';

export default function IncomeRecordsPage() {
  const router = useRouter();
  const { incomeRecords, loading, monthlyIncome, yearlyIncome } = useIncomeRecords();

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
          <h1 className="text-2xl font-bold">収入</h1>
        </div>
        <Link href="/assets/income/new"><Button><Plus size={16} className="mr-1" />追加</Button></Link>
      </div>

      <Card className="mb-6 bg-purple-50">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">月収</p>
              <p className="text-2xl font-bold text-purple-700">{formatCurrency(monthlyIncome)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">年収（見込み）</p>
              <p className="text-lg font-medium">{formatCurrency(yearlyIncome)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {incomeRecords.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Wallet className="mx-auto mb-4 text-muted-foreground" size={48} />
            <p className="text-muted-foreground mb-4">収入がまだ登録されていません</p>
            <Link href="/assets/income/new"><Button><Plus size={16} className="mr-1" />最初の収入を追加</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {incomeRecords.map((record) => (
            <Link key={record.id} href={`/assets/income/${record.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-purple-100">
                        <Wallet className="w-5 h-5 text-purple-700" />
                      </div>
                      <div>
                        <p className="font-medium">{record.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {INCOME_TYPE_LABELS[record.income_type]} • {INCOME_FREQUENCY_LABELS[record.frequency]}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <p className="text-lg font-bold text-purple-700">{formatCurrency(record.amount)}</p>
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
