'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMonthlyAssetRecords } from '@/hooks/useMonthlyAssetRecords';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { format, addMonths } from 'date-fns';
import { toast } from 'sonner';
import { ja } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';

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
    fetchRecord,
  } = useMonthlyAssetRecords();

  const [isEditing, setIsEditing] = useState(false);
  const [bankBalance, setBankBalance] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [creditExpenses, setCreditExpenses] = useState('');
  const [nisaValue, setNisaValue] = useState('');
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

  // Apply to next month states
  const [applyToNextMonth, setApplyToNextMonth] = useState(false);
  const [nextMonthExists, setNextMonthExists] = useState(false);
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);

  const salaryDay = user?.salary_day || 25;
  const cardPaymentDay = user?.card_payment_day || 27;
  const bankBalanceDay = salaryDay - 1; // 給料日の前日

  // Load data into form when editing
  const startEdit = async () => {
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
      setBankBalance('');
      setMonthlyIncome('');
      setCreditExpenses('');
      setNisaValue('');
      setNotes('');
      setBankDetails([]);
      setIncomeDetails([]);
      setCreditDetails([]);
      setNisaDetails([]);
    }

    // Check if next month record exists
    const nextMonth = format(addMonths(currentMonth, 1), 'yyyy-MM');
    const nextRecord = await fetchRecord(nextMonth);
    setNextMonthExists(!!nextRecord);
    setApplyToNextMonth(false); // デフォルトはOFF

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

  // Apply current record data to next month
  const applyToNextMonthRecord = async (nextMonthYearMonth: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // 次月の前月（つまり現在編集中の月）のデータを取得
      const currentMonthData = await fetchRecord(yearMonth);
      if (!currentMonthData) return false;

      // 次月のデータを準備
      const nextMonthData = {
        bank_balance: currentMonthData.calculated_balance, // 計算後の残高を引き継ぎ
        monthly_income: parseInt(monthlyIncome) || 0,
        credit_expenses: parseInt(creditExpenses) || 0,
        nisa_value: parseInt(nisaValue) || 0,
        notes: notes || undefined,
        // 詳細データは合計額のみコピー（詳細はクリア）
        income_details: undefined,
        credit_details: undefined,
        nisa_details: undefined,
        bank_details: undefined,
      };

      // 次月のデータを保存
      const { error } = await supabase
        .from('monthly_asset_records')
        .upsert({
          user_id: user.id,
          year_month: nextMonthYearMonth,
          ...nextMonthData,
          is_confirmed: false, // 予測データとして保存
        }, { onConflict: 'user_id,year_month' });

      return !error;
    } catch (err) {
      console.error('Error applying to next month:', err);
      return false;
    }
  };

  const saveRecord = async () => {
    // 次月適用がONで、次月が既に存在する場合は確認ダイアログを表示
    if (applyToNextMonth && nextMonthExists) {
      setShowApplyConfirm(true);
      return;
    }

    // 保存処理を実行
    await executeSave();
  };

  const executeSave = async () => {
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

    if (!success) {
      toast.error('保存に失敗しました');
      return;
    }

    // 次月にも適用する場合
    if (applyToNextMonth) {
      const nextMonth = format(addMonths(currentMonth, 1), 'yyyy-MM');
      const nextMonthSuccess = await applyToNextMonthRecord(nextMonth);

      if (nextMonthSuccess) {
        toast.success(`保存しました（${format(addMonths(currentMonth, 1), 'M月', { locale: ja })}にも適用）`);
      } else {
        toast.success('現在の月は保存されましたが、次月への適用に失敗しました');
      }
    } else {
      toast.success('保存しました');
    }

    setIsEditing(false);
    setApplyToNextMonth(false);
    setShowApplyConfirm(false);
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
        <CardHeader>
          <div className="flex flex-row items-center justify-between mb-2">
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
          </div>

          {/* 次月適用オプション */}
          {isEditing && (
            <div className="space-y-2 mt-3">
              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Checkbox
                  id="apply-to-next-month"
                  checked={applyToNextMonth}
                  onCheckedChange={(checked) => setApplyToNextMonth(checked as boolean)}
                />
                <Label
                  htmlFor="apply-to-next-month"
                  className="text-sm font-medium text-blue-900 cursor-pointer"
                >
                  この内容を次月（{format(addMonths(currentMonth, 1), 'M月', { locale: ja })}）にも適用する
                </Label>
              </div>

              {/* 警告メッセージ（次月が既に存在する場合） */}
              {applyToNextMonth && nextMonthExists && (
                <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                  ⚠️ 次月のデータは上書きされます
                </div>
              )}
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
                placeholder="金額を入力"
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
                placeholder="金額を入力"
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
                placeholder="金額を入力"
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
                placeholder="金額を入力"
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

      {/* Apply to Next Month Confirmation Dialog */}
      <Dialog open={showApplyConfirm} onOpenChange={setShowApplyConfirm}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>次月のデータを上書きしますか？</DialogTitle>
            <DialogDescription>
              {format(addMonths(currentMonth, 1), 'yyyy年M月', { locale: ja })}のデータは既に存在します。
              <br />
              <br />
              <strong>上書きされる内容:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>今月の収入: {formatCurrency(parseInt(monthlyIncome) || 0)}</li>
                <li>今月の支出: {formatCurrency(parseInt(creditExpenses) || 0)}</li>
                <li>NISA評価額: {formatCurrency(parseInt(nisaValue) || 0)}</li>
              </ul>
              <br />
              <p className="text-sm text-muted-foreground">
                ※ 詳細データ（収入明細・支出明細など）はクリアされ、合計額のみが適用されます
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplyConfirm(false)}>
              キャンセル
            </Button>
            <Button onClick={executeSave}>
              上書きする
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
