'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAssetPin } from '@/hooks/useAssetPin';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Lock, KeyRound, Trash2, Delete, Calendar, Repeat, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { validatePinFormat, pinsMatch } from '@/lib/pin';
import { DefaultCreditCard } from '@/types';
import { IncomeRecord } from '@/types/assets';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/formatters';

type Mode = 'main' | 'change' | 'remove';
type ChangeStep = 'current' | 'new' | 'confirm';

export default function AssetSettingsPage() {
  const router = useRouter();
  const { changePin, removePin } = useAssetPin();
  const { user, fetchUser } = useAuthStore();

  const [mode, setMode] = useState<Mode>('main');
  const [changeStep, setChangeStep] = useState<ChangeStep>('current');
  const [pin, setPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);

  // Reference date settings
  const [salaryDay, setSalaryDay] = useState<string>('25');
  const [cardPaymentDay, setCardPaymentDay] = useState<string>('27');
  const [isSavingDates, setIsSavingDates] = useState(false);

  // Default settings
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [defaultCreditCards, setDefaultCreditCards] = useState<DefaultCreditCard[]>([]);
  const [totalNisaContribution, setTotalNisaContribution] = useState(0);
  const [isSavingDefaults, setIsSavingDefaults] = useState(false);
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(true);

  useEffect(() => {
    if (user) {
      setSalaryDay(user.salary_day?.toString() || '25');
      setCardPaymentDay(user.card_payment_day?.toString() || '27');
      setDefaultCreditCards(user.default_credit_cards || []);
      loadDefaultSettings();
    }
  }, [user]);

  const loadDefaultSettings = async () => {
    if (!user) return;

    setIsLoadingDefaults(true);
    try {
      // Load income records
      const { data: incomeData } = await supabase
        .from('income_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('frequency', 'monthly')
        .order('created_at', { ascending: true });

      if (incomeData) {
        setIncomeRecords(incomeData as IncomeRecord[]);
      }

      // Load NISA total contribution
      const { data: nisaData } = await supabase
        .from('nisa_accounts')
        .select('monthly_contribution')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (nisaData) {
        const total = nisaData.reduce((sum, acc) => sum + acc.monthly_contribution, 0);
        setTotalNisaContribution(total);
      }
    } catch (err) {
      console.error('Error loading defaults:', err);
    } finally {
      setIsLoadingDefaults(false);
    }
  };

  const resetState = () => {
    setMode('main');
    setChangeStep('current');
    setPin('');
    setCurrentPin('');
    setNewPin('');
    setError(null);
  };

  const handleSaveReferenceDates = async () => {
    if (!user) return;

    const salaryDayNum = parseInt(salaryDay);
    const cardPaymentDayNum = parseInt(cardPaymentDay);

    // Validation
    if (isNaN(salaryDayNum) || salaryDayNum < 1 || salaryDayNum > 31) {
      toast.error('給料日は1〜31の間で入力してください');
      return;
    }

    if (isNaN(cardPaymentDayNum) || cardPaymentDayNum < 1 || cardPaymentDayNum > 31) {
      toast.error('カード支払日は1〜31の間で入力してください');
      return;
    }

    setIsSavingDates(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          salary_day: salaryDayNum,
          card_payment_day: cardPaymentDayNum,
        })
        .eq('id', user.id);

      if (error) {
        toast.error('保存に失敗しました');
        return;
      }

      await fetchUser();
      toast.success('基準日を更新しました');
    } catch (err) {
      toast.error('保存に失敗しました');
    } finally {
      setIsSavingDates(false);
    }
  };

  const addIncome = () => {
    setIncomeRecords([...incomeRecords, {
      id: '',
      user_id: user!.id,
      name: '',
      income_type: 'salary',
      amount: '' as any,
      frequency: 'monthly',
      is_active: true,
      created_at: '',
      updated_at: ''
    }]);
  };

  const updateIncome = (index: number, field: 'name' | 'amount', value: string | number) => {
    const updated = [...incomeRecords];
    updated[index] = { ...updated[index], [field]: value };
    setIncomeRecords(updated);
  };

  const removeIncome = (index: number) => {
    setIncomeRecords(incomeRecords.filter((_, i) => i !== index));
  };

  const addCreditCard = () => {
    setDefaultCreditCards([...defaultCreditCards, { name: '', amount: '' as any }]);
  };

  const updateCreditCard = (index: number, field: 'name' | 'amount', value: string | number) => {
    const updated = [...defaultCreditCards];
    updated[index] = { ...updated[index], [field]: value };
    setDefaultCreditCards(updated);
  };

  const removeCreditCard = (index: number) => {
    setDefaultCreditCards(defaultCreditCards.filter((_, i) => i !== index));
  };

  const handleSaveDefaults = async () => {
    if (!user) return;

    setIsSavingDefaults(true);

    try {
      // Save income records - delete all and recreate
      await supabase
        .from('income_records')
        .delete()
        .eq('user_id', user.id)
        .eq('frequency', 'monthly');

      const validIncomes = incomeRecords.filter(inc => inc.name.trim() !== '' && inc.amount > 0);
      if (validIncomes.length > 0) {
        const incomesToInsert = validIncomes.map(inc => ({
          user_id: user.id,
          name: inc.name,
          income_type: 'salary' as const,
          amount: inc.amount,
          frequency: 'monthly' as const,
          is_active: true,
        }));

        await supabase.from('income_records').insert(incomesToInsert);
      }

      // Save default credit cards
      const validCards = defaultCreditCards.filter(card => card.name.trim() !== '');
      await supabase
        .from('users')
        .update({ default_credit_cards: validCards })
        .eq('id', user.id);

      await fetchUser();
      await loadDefaultSettings();
      toast.success('デフォルト値を保存しました');
    } catch (err) {
      console.error('Error saving defaults:', err);
      toast.error('保存に失敗しました');
    } finally {
      setIsSavingDefaults(false);
    }
  };

  const handleNumberClick = async (num: string) => {
    if (pin.length >= 4) return;

    const newPinValue = pin + num;
    setPin(newPinValue);
    setError(null);

    if (newPinValue.length === 4) {
      if (mode === 'change') {
        if (changeStep === 'current') {
          setCurrentPin(newPinValue);
          setPin('');
          setChangeStep('new');
        } else if (changeStep === 'new') {
          setNewPin(newPinValue);
          setPin('');
          setChangeStep('confirm');
        } else if (changeStep === 'confirm') {
          if (pinsMatch(newPin, newPinValue)) {
            setLoading(true);
            const success = await changePin(currentPin, newPinValue);
            if (success) {
              toast.success('PINを変更しました');
              resetState();
            } else {
              setError('現在のPINが正しくありません');
              setChangeStep('current');
              setCurrentPin('');
              setNewPin('');
              setPin('');
            }
            setLoading(false);
          } else {
            setError('新しいPINが一致しません');
            setChangeStep('new');
            setNewPin('');
            setPin('');
          }
        }
      } else if (mode === 'remove') {
        setLoading(true);
        const success = await removePin(newPinValue);
        if (success) {
          toast.success('PINを削除しました');
          router.push('/settings');
        } else {
          setError('PINが正しくありません');
          setPin('');
        }
        setLoading(false);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError(null);
  };

  const handleBack = () => {
    if (mode !== 'main') {
      resetState();
    } else {
      router.push('/assets');
    }
  };

  const getTitle = () => {
    if (mode === 'change') {
      if (changeStep === 'current') return '現在のPINを入力';
      if (changeStep === 'new') return '新しいPINを入力';
      return '新しいPINを確認';
    }
    if (mode === 'remove') return 'PINを入力して削除';
    return 'PIN設定';
  };

  const getDescription = () => {
    if (mode === 'change') {
      if (changeStep === 'current') return '現在のPINを入力してください';
      if (changeStep === 'new') return '新しい4桁のPINを入力してください';
      return '確認のため、もう一度入力してください';
    }
    if (mode === 'remove') return 'PINを入力してPIN保護を解除します';
    return '';
  };

  // PIN入力モード
  if (mode !== 'main') {
    return (
      <div className="container mx-auto p-4 max-w-md pb-24 min-h-screen flex flex-col justify-center">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>{getTitle()}</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">{getDescription()}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {mode === 'change' && (
              <div className="flex justify-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${changeStep === 'current' ? 'bg-primary' : 'bg-gray-300'}`} />
                <div className={`w-2 h-2 rounded-full ${changeStep === 'new' ? 'bg-primary' : 'bg-gray-300'}`} />
                <div className={`w-2 h-2 rounded-full ${changeStep === 'confirm' ? 'bg-primary' : 'bg-gray-300'}`} />
              </div>
            )}

            <div className="flex justify-center space-x-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                    pin.length > i ? 'border-primary bg-primary/10' : 'border-gray-200'
                  }`}
                >
                  {pin.length > i ? '●' : ''}
                </div>
              ))}
            </div>

            {error && <p className="text-center text-sm text-red-600">{error}</p>}

            <div className="grid grid-cols-3 gap-3">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <Button key={num} variant="outline" size="lg" className="h-14 text-xl font-semibold" onClick={() => handleNumberClick(num)} disabled={loading}>
                  {num}
                </Button>
              ))}
              <Button variant="ghost" size="lg" className="h-14" onClick={handleBack} disabled={loading}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="lg" className="h-14 text-xl font-semibold" onClick={() => handleNumberClick('0')} disabled={loading}>
                0
              </Button>
              <Button variant="ghost" size="lg" className="h-14" onClick={handleDelete} disabled={loading || pin.length === 0}>
                <Delete className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // メインメニュー
  return (
    <div className="container mx-auto p-4 max-w-2xl pb-24">
      <div className="flex items-center space-x-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/assets')}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-2xl font-bold">資産管理設定</h1>
      </div>

      {/* Reference Date Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>基準日設定</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="salary-day" className="text-sm font-medium">
              給料日
            </Label>
            <Input
              id="salary-day"
              type="number"
              min="1"
              max="31"
              value={salaryDay}
              onChange={(e) => setSalaryDay(e.target.value)}
              className="mt-2"
              placeholder="25"
            />
            <p className="text-xs text-muted-foreground mt-1">
              口座残高は給料日の前日（{parseInt(salaryDay) - 1 || 24}日）時点で記録します
            </p>
          </div>

          <div>
            <Label htmlFor="card-payment-day" className="text-sm font-medium">
              カード支払日
            </Label>
            <Input
              id="card-payment-day"
              type="number"
              min="1"
              max="31"
              value={cardPaymentDay}
              onChange={(e) => setCardPaymentDay(e.target.value)}
              className="mt-2"
              placeholder="27"
            />
            <p className="text-xs text-muted-foreground mt-1">
              資産合計はこの日時点で自動計算されます
            </p>
          </div>

          <Button
            onClick={handleSaveReferenceDates}
            disabled={isSavingDates}
            className="w-full"
          >
            {isSavingDates ? '保存中...' : '基準日を保存'}
          </Button>
        </CardContent>
      </Card>

      {/* Default Values Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Repeat className="w-5 h-5" />
            <span>デフォルト値設定</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            次月以降の予測データに自動的に設定される値
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Fixed Income */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">固定収入</Label>
              <Button size="sm" variant="outline" onClick={addIncome}>
                <Plus size={14} className="mr-1" />
                追加
              </Button>
            </div>
            {incomeRecords.length === 0 ? (
              <p className="text-sm text-muted-foreground">固定収入が設定されていません</p>
            ) : (
              <div className="space-y-2">
                {incomeRecords.map((income, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      placeholder="収入名"
                      value={income.name}
                      onChange={(e) => updateIncome(index, 'name', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="金額を入力"
                      value={income.amount || ''}
                      onChange={(e) => updateIncome(index, 'amount', e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                      className="w-32"
                    />
                    <Button size="icon" variant="ghost" onClick={() => removeIncome(index)}>
                      <X size={16} />
                    </Button>
                  </div>
                ))}
                <p className="text-sm text-muted-foreground">
                  合計: {formatCurrency(incomeRecords.reduce((sum, inc) => sum + inc.amount, 0))}
                </p>
              </div>
            )}
          </div>

          {/* Default Credit Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">デフォルトクレジットカード</Label>
              <Button size="sm" variant="outline" onClick={addCreditCard}>
                <Plus size={14} className="mr-1" />
                追加
              </Button>
            </div>
            {defaultCreditCards.length === 0 ? (
              <p className="text-sm text-muted-foreground">デフォルトカードが設定されていません</p>
            ) : (
              <div className="space-y-2">
                {defaultCreditCards.map((card, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      placeholder="カード名"
                      value={card.name}
                      onChange={(e) => updateCreditCard(index, 'name', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="金額を入力"
                      value={card.amount || ''}
                      onChange={(e) => updateCreditCard(index, 'amount', e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                      className="w-32"
                    />
                    <Button size="icon" variant="ghost" onClick={() => removeCreditCard(index)}>
                      <X size={16} />
                    </Button>
                  </div>
                ))}
                <p className="text-sm text-muted-foreground">
                  合計: {formatCurrency(defaultCreditCards.reduce((sum, card) => sum + card.amount, 0))}
                </p>
              </div>
            )}
          </div>

          {/* NISA Monthly Contribution */}
          <div>
            <Label className="text-sm font-medium">NISA月次積立額</Label>
            <div className="mt-2 p-3 rounded-lg bg-purple-50 border border-purple-200">
              <p className="text-lg font-bold text-purple-900">
                {formatCurrency(totalNisaContribution)} / 月
              </p>
              <p className="text-xs text-purple-700 mt-1">
                ※ 詳細な口座管理は{' '}
                <button
                  onClick={() => router.push('/assets/nisa')}
                  className="underline hover:text-purple-900"
                >
                  NISA管理ページ
                </button>{' '}
                へ
              </p>
            </div>
          </div>

          <Button
            onClick={handleSaveDefaults}
            disabled={isSavingDefaults || isLoadingDefaults}
            className="w-full"
          >
            {isSavingDefaults ? '保存中...' : 'デフォルト値を保存'}
          </Button>
        </CardContent>
      </Card>

      {/* PIN Security */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="w-5 h-5" />
            <span>セキュリティ</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start" onClick={() => setMode('change')}>
            <KeyRound className="mr-2" size={18} />
            PINを変更
          </Button>
          <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700" onClick={() => setIsRemoveOpen(true)}>
            <Trash2 className="mr-2" size={18} />
            PINを削除
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <p className="text-sm text-yellow-800">
            PINを削除すると、資産管理セクションはパスワード保護されなくなります。
            再度設定するには、資産管理に再アクセスしてください。
          </p>
        </CardContent>
      </Card>

      {/* Remove Confirmation Dialog */}
      <Dialog open={isRemoveOpen} onOpenChange={setIsRemoveOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>PINを削除しますか？</DialogTitle>
            <DialogDescription>
              PIN保護を解除すると、誰でも資産管理セクションにアクセスできるようになります。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRemoveOpen(false)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={() => { setIsRemoveOpen(false); setMode('remove'); }}>
              続行
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
