'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMonthlyAssetRecords } from '@/hooks/useMonthlyAssetRecords';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/formatters';
import { BankDetail, IncomeDetail, CreditDetail, NisaDetail } from '@/types/assets';
import { BankBalanceDetailModal } from '@/components/assets/BankBalanceDetailModal';
import { IncomeDetailModal } from '@/components/assets/IncomeDetailModal';
import { CreditDetailModal } from '@/components/assets/CreditDetailModal';
import { NisaDetailModal } from '@/components/assets/NisaDetailModal';
import {
  ArrowLeft,
  Settings,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Edit,
  Check,
  Save,
  ListTree,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ja } from 'date-fns/locale';

export default function AssetsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    currentRecord,
    loading,
    yearMonth,
    currentMonth,
    upsertRecord,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    confirmRecord,
  } = useMonthlyAssetRecords();

  const [isEditing, setIsEditing] = useState(false);
  const [bankBalance, setBankBalance] = useState('0');
  const [monthlyIncome, setMonthlyIncome] = useState('0');
  const [creditExpenses, setCreditExpenses] = useState('0');
  const [nisaValue, setNisaValue] = useState('0');
  const [notes, setNotes] = useState('');

  // Detail states
  const [bankDetails, setBankDetails] = useState<BankDetail[]>([]);
  const [incomeDetails, setIncomeDetails] = useState<IncomeDetail[]>([]);
  const [creditDetails, setCreditDetails] = useState<CreditDetail[]>([]);
  const [nisaDetails, setNisaDetails] = useState<NisaDetail[]>([]);

  // Modal states
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [nisaModalOpen, setNisaModalOpen] = useState(false);

  const salaryDay = user?.salary_day || 25;
  const cardPaymentDay = user?.card_payment_day || 27;
  const bankBalanceDay = salaryDay - 1; // 給料日の前日

  // Load data into form when editing
  const startEdit = () => {
    if (currentRecord) {
      setBankBalance(currentRecord.bank_balance.toString());
      setMonthlyIncome(currentRecord.monthly_income.toString());
      setCreditExpenses(currentRecord.credit_expenses.toString());
      setNisaValue(currentRecord.nisa_value.toString());
      setNotes(currentRecord.notes || '');
      setBankDetails(currentRecord.bank_details || []);
      setIncomeDetails(currentRecord.income_details || []);
      setCreditDetails(currentRecord.credit_details || []);
      setNisaDetails(currentRecord.nisa_details || []);
    } else {
      setBankBalance('0');
      setMonthlyIncome('0');
      setCreditExpenses('0');
      setNisaValue('0');
      setNotes('');
      setBankDetails([]);
      setIncomeDetails([]);
      setCreditDetails([]);
      setNisaDetails([]);
    }
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const handleBankDetailSave = (details: BankDetail[]) => {
    setBankDetails(details);
    const total = details.reduce((sum, d) => sum + d.balance, 0);
    setBankBalance(total.toString());
  };

  const handleIncomeDetailSave = (details: IncomeDetail[]) => {
    setIncomeDetails(details);
    const total = details.reduce((sum, d) => sum + d.amount, 0);
    setMonthlyIncome(total.toString());
  };

  const handleCreditDetailSave = (details: CreditDetail[]) => {
    setCreditDetails(details);
    const total = details.reduce((sum, d) => sum + d.amount, 0);
    setCreditExpenses(total.toString());
  };

  const handleNisaDetailSave = (details: NisaDetail[]) => {
    setNisaDetails(details);
    const total = details.reduce((sum, d) => sum + d.value, 0);
    setNisaValue(total.toString());
  };

  const saveRecord = async () => {
    const success = await upsertRecord(
      yearMonth,
      {
        bank_balance: parseInt(bankBalance) || 0,
        monthly_income: parseInt(monthlyIncome) || 0,
        credit_expenses: parseInt(creditExpenses) || 0,
        nisa_value: parseInt(nisaValue) || 0,
        notes: notes || undefined,
        bank_details: bankDetails.length > 0 ? bankDetails : undefined,
        income_details: incomeDetails.length > 0 ? incomeDetails : undefined,
        credit_details: creditDetails.length > 0 ? creditDetails : undefined,
        nisa_details: nisaDetails.length > 0 ? nisaDetails : undefined,
      },
      false
    );

    if (success) {
      toast.success('保存しました');
      setIsEditing(false);
    } else {
      toast.error('保存に失敗しました');
    }
  };

  const handleConfirm = async () => {
    const success = await confirmRecord();
    if (success) {
      toast.success('確定しました');
    } else {
      toast.error('確定に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl pb-24">
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="h-48 bg-gray-100 rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const calculatedBalance = (parseInt(bankBalance) || 0) + (parseInt(monthlyIncome) || 0) - (parseInt(creditExpenses) || 0);
  const displayBalance = isEditing ? calculatedBalance : (currentRecord?.calculated_balance || 0);
  const displayBankBalance = isEditing ? (parseInt(bankBalance) || 0) : (currentRecord?.bank_balance || 0);
  const displayIncome = isEditing ? (parseInt(monthlyIncome) || 0) : (currentRecord?.monthly_income || 0);
  const displayCredit = isEditing ? (parseInt(creditExpenses) || 0) : (currentRecord?.credit_expenses || 0);
  const displayNisa = isEditing ? (parseInt(nisaValue) || 0) : (currentRecord?.nisa_value || 0);

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
        <Button variant="ghost" size="sm" onClick={() => router.push('/assets/settings')}>
          <Settings size={20} />
        </Button>
      </div>

      {/* Month Selector */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft size={16} />
            </Button>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-semibold">
                {format(currentMonth, 'yyyy年M月', { locale: ja })}
              </h2>
              <Button variant="outline" size="sm" onClick={goToToday}>
                <Calendar size={14} className="mr-1" />
                今月
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight size={16} />
            </Button>
          </div>

          {currentRecord && !currentRecord.is_confirmed && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-orange-600 font-medium">予測データ</span>
                <Button size="sm" variant="outline" onClick={handleConfirm}>
                  <Check size={14} className="mr-1" />
                  確定する
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Data Card */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{format(currentMonth, 'M月', { locale: ja })}の資産状況</CardTitle>
          {!isEditing ? (
            <Button size="sm" variant="outline" onClick={startEdit}>
              <Edit size={14} className="mr-1" />
              編集
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" onClick={cancelEdit}>
                キャンセル
              </Button>
              <Button size="sm" onClick={saveRecord}>
                <Save size={14} className="mr-1" />
                保存
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Asset Total */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
            <p className="text-sm text-muted-foreground mb-1">
              資産合計（{cardPaymentDay}日時点）
            </p>
            <p className="text-3xl font-bold">{formatCurrency(displayBalance)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              = 口座残高 + 収入 - 支出
            </p>
          </div>

          {/* Bank Balance */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">
                口座残高（{bankBalanceDay}日時点）
              </Label>
              {isEditing && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setBankModalOpen(true)}
                  className="text-xs h-7"
                >
                  <ListTree size={14} className="mr-1" />
                  詳細
                </Button>
              )}
            </div>
            {isEditing ? (
              <Input
                type="number"
                value={bankBalance}
                onChange={(e) => setBankBalance(e.target.value)}
                className="mt-1 text-lg font-bold"
                placeholder="0"
              />
            ) : (
              <div>
                <p className="text-2xl font-bold text-blue-700">
                  {formatCurrency(displayBankBalance)}
                </p>
                {currentRecord?.bank_details && currentRecord.bank_details.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {currentRecord.bank_details.map((detail, idx) => (
                      <div key={idx} className="text-sm text-muted-foreground flex justify-between">
                        <span>{detail.name}</span>
                        <span>{formatCurrency(detail.balance)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Monthly Income */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">今月の収入</Label>
              {isEditing && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIncomeModalOpen(true)}
                  className="text-xs h-7"
                >
                  <ListTree size={14} className="mr-1" />
                  詳細
                </Button>
              )}
            </div>
            {isEditing ? (
              <Input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                className="mt-1 text-lg font-bold"
                placeholder="0"
              />
            ) : (
              <div>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(displayIncome)}
                </p>
                {currentRecord?.income_details && currentRecord.income_details.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {currentRecord.income_details.map((detail, idx) => (
                      <div key={idx} className="text-sm text-muted-foreground flex justify-between">
                        <span>{detail.name}</span>
                        <span>{formatCurrency(detail.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Credit Expenses */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">今月の支出（クレジット）</Label>
              {isEditing && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCreditModalOpen(true)}
                  className="text-xs h-7"
                >
                  <ListTree size={14} className="mr-1" />
                  詳細
                </Button>
              )}
            </div>
            {isEditing ? (
              <Input
                type="number"
                value={creditExpenses}
                onChange={(e) => setCreditExpenses(e.target.value)}
                className="mt-1 text-lg font-bold"
                placeholder="0"
              />
            ) : (
              <div>
                <p className="text-2xl font-bold text-red-700">
                  {formatCurrency(displayCredit)}
                </p>
                {currentRecord?.credit_details && currentRecord.credit_details.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {currentRecord.credit_details.map((detail, idx) => (
                      <div key={idx} className="text-sm text-muted-foreground flex justify-between">
                        <span>{detail.name}</span>
                        <span>{formatCurrency(detail.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* NISA Value */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">NISA評価額</Label>
              {isEditing && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setNisaModalOpen(true)}
                  className="text-xs h-7"
                >
                  <ListTree size={14} className="mr-1" />
                  詳細
                </Button>
              )}
            </div>
            {isEditing ? (
              <Input
                type="number"
                value={nisaValue}
                onChange={(e) => setNisaValue(e.target.value)}
                className="mt-1 text-lg font-bold"
                placeholder="0"
              />
            ) : (
              <div>
                <p className="text-2xl font-bold text-purple-700">
                  {formatCurrency(displayNisa)}
                </p>
                {currentRecord?.nisa_details && currentRecord.nisa_details.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {currentRecord.nisa_details.map((detail, idx) => (
                      <div key={idx} className="text-sm text-muted-foreground flex justify-between">
                        <span>{detail.name}</span>
                        <span>{formatCurrency(detail.value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          {isEditing && (
            <div>
              <Label className="text-sm font-medium">メモ（任意）</Label>
              <Input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2"
                placeholder="メモを入力"
              />
            </div>
          )}

          {currentRecord?.notes && !isEditing && (
            <div className="pt-3 border-t">
              <p className="text-sm text-muted-foreground">{currentRecord.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800">
            <strong>基準日について:</strong>
            <br />
            ・口座残高は給料日前日（{bankBalanceDay}日）の値を入力
            <br />
            ・資産合計はカード支払日（{cardPaymentDay}日）時点で自動計算
            <br />
            ・次月は自動で予測値が設定されます
          </p>
        </CardContent>
      </Card>

      {/* Detail Modals */}
      <BankBalanceDetailModal
        open={bankModalOpen}
        onOpenChange={setBankModalOpen}
        details={bankDetails}
        onSave={handleBankDetailSave}
      />
      <IncomeDetailModal
        open={incomeModalOpen}
        onOpenChange={setIncomeModalOpen}
        details={incomeDetails}
        onSave={handleIncomeDetailSave}
      />
      <CreditDetailModal
        open={creditModalOpen}
        onOpenChange={setCreditModalOpen}
        details={creditDetails}
        onSave={handleCreditDetailSave}
      />
      <NisaDetailModal
        open={nisaModalOpen}
        onOpenChange={setNisaModalOpen}
        details={nisaDetails}
        onSave={handleNisaDetailSave}
      />
    </div>
  );
}
