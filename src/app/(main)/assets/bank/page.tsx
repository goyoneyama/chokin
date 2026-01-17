'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { BANK_ACCOUNT_TYPE_LABELS } from '@/types/assets';
import { ArrowLeft, Plus, Building2, Pencil } from 'lucide-react';

export default function BankAccountsPage() {
  const router = useRouter();
  const { bankAccounts, loading, totalBalance } = useBankAccounts();

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl pb-24">
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
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
          <h1 className="text-2xl font-bold">銀行口座</h1>
        </div>
        <Link href="/assets/bank/new">
          <Button>
            <Plus size={16} className="mr-1" />
            追加
          </Button>
        </Link>
      </div>

      {/* Total Balance */}
      <Card className="mb-6 bg-blue-50">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">合計残高</p>
          <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalBalance)}</p>
        </CardContent>
      </Card>

      {/* Account List */}
      {bankAccounts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="mx-auto mb-4 text-muted-foreground" size={48} />
            <p className="text-muted-foreground mb-4">銀行口座がまだありません</p>
            <Link href="/assets/bank/new">
              <Button>
                <Plus size={16} className="mr-1" />
                最初の銀行口座を追加
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bankAccounts.map((account) => (
            <Link key={account.id} href={`/assets/bank/${account.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-blue-100">
                        <Building2 className="w-5 h-5 text-blue-700" />
                      </div>
                      <div>
                        <p className="font-medium">{account.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {account.bank_name} • {BANK_ACCOUNT_TYPE_LABELS[account.account_type]}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <p className="text-lg font-bold">{formatCurrency(account.current_balance)}</p>
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
