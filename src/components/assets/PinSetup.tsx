'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAssetPin } from '@/hooks/useAssetPin';
import { validatePinFormat, pinsMatch } from '@/lib/pin';
import { ShieldCheck, Delete, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type Step = 'enter' | 'confirm';

export function PinSetup() {
  const router = useRouter();
  const { setPin } = useAssetPin();
  const [step, setStep] = useState<Step>('enter');
  const [pin, setPin_] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleNumberClick = async (num: string) => {
    if (pin.length >= 4) return;

    const newPin = pin + num;
    setPin_(newPin);
    setError(null);

    // Auto-proceed when 4 digits are entered
    if (newPin.length === 4) {
      if (step === 'enter') {
        // Move to confirm step
        setFirstPin(newPin);
        setPin_('');
        setStep('confirm');
      } else {
        // Verify and set PIN
        if (pinsMatch(firstPin, newPin)) {
          setLoading(true);
          const success = await setPin(newPin);
          if (success) {
            toast.success('PINを設定しました');
          } else {
            toast.error('PINの設定に失敗しました');
            setStep('enter');
            setFirstPin('');
            setPin_('');
          }
          setLoading(false);
        } else {
          setError('PINが一致しません');
          setPin_('');
        }
      }
    }
  };

  const handleDelete = () => {
    setPin_(pin.slice(0, -1));
    setError(null);
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('enter');
      setPin_('');
      setFirstPin('');
      setError(null);
    } else {
      router.push('/settings');
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-md pb-24 min-h-screen flex flex-col justify-center">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-4 rounded-full bg-green-100">
            <ShieldCheck className="w-8 h-8 text-green-700" />
          </div>
          <CardTitle>PINを設定</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {step === 'enter'
              ? '資産管理を保護する4桁のPINを入力してください'
              : '確認のため、もう一度PINを入力してください'}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step Indicator */}
          <div className="flex justify-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                step === 'enter' ? 'bg-primary' : 'bg-gray-300'
              }`}
            />
            <div
              className={`w-2 h-2 rounded-full ${
                step === 'confirm' ? 'bg-primary' : 'bg-gray-300'
              }`}
            />
          </div>

          {/* PIN Display */}
          <div className="flex justify-center space-x-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                  pin.length > i
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-200'
                }`}
              >
                {pin.length > i ? '●' : ''}
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-center text-sm text-red-600">{error}</p>
          )}

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <Button
                key={num}
                variant="outline"
                size="lg"
                className="h-14 text-xl font-semibold"
                onClick={() => handleNumberClick(num)}
                disabled={loading}
              >
                {num}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="lg"
              className="h-14"
              onClick={handleBack}
              disabled={loading}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-14 text-xl font-semibold"
              onClick={() => handleNumberClick('0')}
              disabled={loading}
            >
              0
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="h-14"
              onClick={handleDelete}
              disabled={loading || pin.length === 0}
            >
              <Delete className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
