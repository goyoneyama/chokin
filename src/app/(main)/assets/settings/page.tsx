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
import { ArrowLeft, Lock, KeyRound, Trash2, Delete, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { validatePinFormat, pinsMatch } from '@/lib/pin';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

  useEffect(() => {
    if (user) {
      setSalaryDay(user.salary_day?.toString() || '25');
      setCardPaymentDay(user.card_payment_day?.toString() || '27');
    }
  }, [user]);

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
