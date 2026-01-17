'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGoals } from '@/hooks/useGoals';
import { GoalPeriod } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, TrendingUp, Coins, Gift, BarChart3 } from 'lucide-react';
import { calculateNisaFutureValue } from '@/lib/calculations';
import { formatAmount } from '@/lib/formatters';

const PERIOD_LABELS: Record<GoalPeriod, string> = {
  '1year': '1年',
  '3year': '3年',
  '5year': '5年',
  '10year': '10年',
};

const PERIOD_YEARS: Record<GoalPeriod, number> = {
  '1year': 1,
  '3year': 3,
  '5year': 5,
  '10year': 10,
};

export default function GoalsPage() {
  const router = useRouter();
  const { goals, loading, getGoal, createOrUpdateGoal } = useGoals();
  const [selectedPeriod, setSelectedPeriod] = useState<GoalPeriod>('1year');
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [nisaMonthly, setNisaMonthly] = useState<string>('');
  const [nisaYieldRate, setNisaYieldRate] = useState<string>('5.00');
  const [bonusPerYear, setBonusPerYear] = useState<string>('');
  const [bonusFrequency, setBonusFrequency] = useState<string>('2');
  const [monthlySavings, setMonthlySavings] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Load existing goal when period changes
  useEffect(() => {
    const existingGoal = getGoal(selectedPeriod);
    if (existingGoal) {
      setTargetAmount(existingGoal.target_amount.toString());
      setNisaMonthly(existingGoal.nisa_monthly.toString());
      setNisaYieldRate(existingGoal.nisa_yield_rate.toString());
      // Convert yearly bonus to per-bonus amount
      const perBonusAmount = existingGoal.bonus_frequency > 0
        ? Math.round(existingGoal.bonus_per_year / existingGoal.bonus_frequency)
        : existingGoal.bonus_per_year;
      setBonusPerYear(perBonusAmount.toString());
      setBonusFrequency(existingGoal.bonus_frequency.toString());
      setMonthlySavings(existingGoal.monthly_savings.toString());
    } else {
      // Reset to defaults for new goal
      setTargetAmount('');
      setNisaMonthly('');
      setNisaYieldRate('5.00');
      setBonusPerYear('');
      setBonusFrequency('2');
      setMonthlySavings('');
    }
  }, [selectedPeriod, goals, getGoal]);

  // Calculate required monthly savings
  useEffect(() => {
    const target = parseInt(targetAmount) || 0;
    const nisa = parseInt(nisaMonthly) || 0;
    const yieldRate = parseFloat(nisaYieldRate) || 5.0;
    const bonusAmount = parseInt(bonusPerYear) || 0;
    const frequency = parseInt(bonusFrequency) || 2;
    const years = PERIOD_YEARS[selectedPeriod];

    if (target > 0) {
      // Calculate NISA future value with compound interest
      const nisaTotal = calculateNisaFutureValue(nisa, yieldRate, years);

      // Calculate total bonus savings (1回の額 × 回数 × 年数)
      const yearlyBonus = bonusAmount * frequency;
      const bonusTotal = yearlyBonus * years;

      // Calculate remaining amount needed from monthly savings
      const remainingNeeded = target - nisaTotal - bonusTotal;

      // Calculate monthly savings required
      const requiredMonthly = Math.max(0, Math.ceil(remainingNeeded / (years * 12)));

      setMonthlySavings(requiredMonthly.toString());
    } else {
      setMonthlySavings('');
    }
  }, [targetAmount, nisaMonthly, nisaYieldRate, bonusPerYear, bonusFrequency, selectedPeriod]);

  const handleSave = async () => {
    const target = parseInt(targetAmount) || 0;

    if (target <= 0) {
      alert('目標金額を入力してください');
      return;
    }

    setSaving(true);
    try {
      const bonusAmount = parseInt(bonusPerYear) || 0;
      const frequency = parseInt(bonusFrequency) || 2;
      const yearlyBonus = bonusAmount * frequency; // 1回の額 × 回数 = 年間合計

      const success = await createOrUpdateGoal({
        period: selectedPeriod,
        target_amount: target,
        nisa_monthly: parseInt(nisaMonthly) || 0,
        nisa_yield_rate: parseFloat(nisaYieldRate) || 5.0,
        bonus_per_year: yearlyBonus,
        bonus_frequency: frequency,
        monthly_savings: parseInt(monthlySavings) || 0,
      });

      if (success) {
        alert('目標を保存しました！');
      } else {
        alert('保存に失敗しました');
      }
    } catch (error) {
      console.error('Error saving goal:', error);
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const calculateTotalSavings = () => {
    const nisa = parseInt(nisaMonthly) || 0;
    const yieldRate = parseFloat(nisaYieldRate) || 5.0;
    const years = PERIOD_YEARS[selectedPeriod];
    const nisaTotal = calculateNisaFutureValue(nisa, yieldRate, years);
    const bonusAmount = parseInt(bonusPerYear) || 0;
    const frequency = parseInt(bonusFrequency) || 2;
    const yearlyBonus = bonusAmount * frequency;
    const bonusTotal = yearlyBonus * years;
    const monthlyTotal = (parseInt(monthlySavings) || 0) * years * 12;

    return nisaTotal + bonusTotal + monthlyTotal;
  };

  const achievementRate = () => {
    const target = parseInt(targetAmount) || 0;
    const total = calculateTotalSavings();
    return target > 0 ? Math.round((total / target) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 pb-24">
      <div className="flex items-center gap-2 mb-6">
        <Target className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">貯金目標設定</h1>
      </div>

      <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as GoalPeriod)}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          {Object.entries(PERIOD_LABELS).map(([period, label]) => (
            <TabsTrigger key={period} value={period}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.keys(PERIOD_LABELS).map((period) => (
          <TabsContent key={period} value={period}>
            <div className="space-y-6">
              {/* 目標金額 */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">目標金額</h2>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target">
                    {PERIOD_LABELS[period as GoalPeriod]}後の目標金額
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="target"
                      type="number"
                      placeholder="目標金額を入力"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      className="text-lg"
                    />
                    <span className="text-muted-foreground">円</span>
                  </div>
                </div>
              </Card>

              {/* 積立NISA */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-semibold">積立NISA</h2>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nisa-monthly">月々の積立額</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="nisa-monthly"
                        type="number"
                        placeholder="積立額を入力"
                        value={nisaMonthly}
                        onChange={(e) => setNisaMonthly(e.target.value)}
                      />
                      <span className="text-muted-foreground">円</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nisa-yield">想定利回り（年率）</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="nisa-yield"
                        type="number"
                        step="0.01"
                        placeholder="5.00"
                        value={nisaYieldRate}
                        onChange={(e) => setNisaYieldRate(e.target.value)}
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                  </div>
                  {nisaMonthly && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-800">
                        {PERIOD_YEARS[period as GoalPeriod]}年後の評価額：
                        <span className="font-bold ml-2">
                          {formatAmount(
                            calculateNisaFutureValue(
                              parseInt(nisaMonthly),
                              parseFloat(nisaYieldRate) || 5.0,
                              PERIOD_YEARS[period as GoalPeriod]
                            )
                          )}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* ボーナス */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Gift className="w-5 h-5 text-orange-600" />
                  <h2 className="text-lg font-semibold">ボーナス</h2>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bonus-amount">1回のボーナス貯金額</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="bonus-amount"
                        type="number"
                        placeholder="金額を入力"
                        value={bonusPerYear}
                        onChange={(e) => setBonusPerYear(e.target.value)}
                      />
                      <span className="text-muted-foreground">円</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bonus-frequency">ボーナス回数（年間）</Label>
                    <Input
                      id="bonus-frequency"
                      type="number"
                      placeholder="2"
                      value={bonusFrequency}
                      onChange={(e) => setBonusFrequency(e.target.value)}
                    />
                  </div>
                  {bonusPerYear && bonusFrequency && (
                    <div className="bg-orange-50 p-4 rounded-lg space-y-1">
                      <p className="text-sm text-orange-800">
                        1年間の合計：
                        <span className="font-bold ml-2">
                          {formatAmount(
                            parseInt(bonusPerYear) * parseInt(bonusFrequency)
                          )}
                        </span>
                      </p>
                      <p className="text-sm text-orange-800">
                        {PERIOD_YEARS[period as GoalPeriod]}年後の合計：
                        <span className="font-bold ml-2">
                          {formatAmount(
                            parseInt(bonusPerYear) * parseInt(bonusFrequency) * PERIOD_YEARS[period as GoalPeriod]
                          )}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* 月々の貯金 */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Coins className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold">月々の貯金</h2>
                </div>
                <div className="space-y-2">
                  <Label>必要な月々の貯金額（自動計算）</Label>
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <p className="text-3xl font-bold text-blue-900">
                      {formatAmount(parseInt(monthlySavings) || 0)}
                      <span className="text-lg font-normal ml-2">/ 月</span>
                    </p>
                  </div>
                </div>
              </Card>

              {/* サマリー */}
              {targetAmount && (
                <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10">
                  <h3 className="text-lg font-semibold mb-4">達成予測</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">目標金額</span>
                      <span className="font-semibold">
                        {formatAmount(parseInt(targetAmount))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">合計貯金予定額</span>
                      <span className="font-semibold">
                        {formatAmount(calculateTotalSavings())}
                      </span>
                    </div>
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">達成率</span>
                        <span className={`text-2xl font-bold ${
                          achievementRate() >= 100 ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {achievementRate()}%
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* シミュレーションと保存ボタン */}
              <div className="space-y-3">
                {getGoal(period as GoalPeriod) && (
                  <Button
                    onClick={() => router.push('/simulation')}
                    variant="outline"
                    className="w-full py-6 text-lg"
                    size="lg"
                  >
                    <BarChart3 className="mr-2" size={20} />
                    詳しいシミュレーションを見る
                  </Button>
                )}
                <Button
                  onClick={handleSave}
                  disabled={saving || !targetAmount}
                  className="w-full py-6 text-lg"
                  size="lg"
                >
                  {saving ? '保存中...' : '目標を保存する'}
                </Button>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
