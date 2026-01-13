'use client';

import { useState } from 'react';
import { useGoals } from '@/hooks/useGoals';
import { SavingsGoal, GoalPeriod } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Target, Coins, Gift, Calendar } from 'lucide-react';
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

function GoalSimulation({ goal }: { goal: SavingsGoal }) {
  const years = PERIOD_YEARS[goal.period];
  const nisaTotal = calculateNisaFutureValue(
    goal.nisa_monthly,
    goal.nisa_yield_rate,
    years
  );
  const bonusTotal = goal.bonus_per_year * years;
  const monthlyTotal = goal.monthly_savings * years * 12;
  const totalSavings = nisaTotal + bonusTotal + monthlyTotal;
  const achievementRate = Math.round((totalSavings / goal.target_amount) * 100);

  // Calculate long-term projections (5, 7, 10 years)
  const calculateProjection = (targetYears: number) => {
    const nisa = calculateNisaFutureValue(goal.nisa_monthly, goal.nisa_yield_rate, targetYears);
    const bonus = goal.bonus_per_year * targetYears;
    const monthly = goal.monthly_savings * targetYears * 12;
    return nisa + bonus + monthly;
  };

  const projections = [
    { years: 5, amount: calculateProjection(5) },
    { years: 7, amount: calculateProjection(7) },
    { years: 10, amount: calculateProjection(10) },
  ];

  // Calculate monthly breakdown for timeline
  const monthlyBreakdown = [];
  for (let month = 1; month <= years * 12; month++) {
    const yearProgress = month / 12;
    const nisaAccumulated = calculateNisaFutureValue(
      goal.nisa_monthly,
      goal.nisa_yield_rate,
      yearProgress
    );
    const bonusAccumulated = goal.bonus_per_year * yearProgress;
    const monthlyAccumulated = goal.monthly_savings * month;
    const total = nisaAccumulated + bonusAccumulated + monthlyAccumulated;

    monthlyBreakdown.push({
      month,
      nisa: nisaAccumulated,
      bonus: bonusAccumulated,
      monthly: monthlyAccumulated,
      total,
    });
  }

  // Select key milestones to display (every 3 months for 1 year, every 6 months for 3+ years)
  const milestoneInterval = years === 1 ? 3 : years === 3 ? 6 : 12;
  const milestones = monthlyBreakdown.filter(
    (_, index) => (index + 1) % milestoneInterval === 0 || index === monthlyBreakdown.length - 1
  );

  return (
    <div className="space-y-6">
      {/* サマリーカード */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">
            {PERIOD_LABELS[goal.period]}目標
          </h2>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">目標金額</span>
            <span className="text-2xl font-bold">{formatAmount(goal.target_amount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">達成予定額</span>
            <span className="text-2xl font-bold text-primary">{formatAmount(totalSavings)}</span>
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">達成率</span>
              <span className={`text-2xl font-bold ${
                achievementRate >= 100 ? 'text-green-600' : 'text-orange-600'
              }`}>
                {achievementRate}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  achievementRate >= 100 ? 'bg-green-600' : 'bg-orange-600'
                }`}
                style={{ width: `${Math.min(achievementRate, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 内訳 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          貯金の内訳
        </h3>
        <div className="space-y-4">
          {/* NISA */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="font-medium">積立NISA</span>
              </div>
              <span className="font-semibold text-green-600">{formatAmount(nisaTotal)}</span>
            </div>
            <div className="text-sm text-muted-foreground ml-6">
              月{formatAmount(goal.nisa_monthly)} × {years * 12}ヶ月
              （利回り{goal.nisa_yield_rate}%）
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-full rounded-full"
                style={{ width: `${(nisaTotal / totalSavings) * 100}%` }}
              />
            </div>
          </div>

          {/* ボーナス */}
          {goal.bonus_per_year > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-orange-600" />
                  <span className="font-medium">ボーナス</span>
                </div>
                <span className="font-semibold text-orange-600">{formatAmount(bonusTotal)}</span>
              </div>
              <div className="text-sm text-muted-foreground ml-6">
                年{formatAmount(goal.bonus_per_year)} × {years}年
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-600 h-full rounded-full"
                  style={{ width: `${(bonusTotal / totalSavings) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* 月々の貯金 */}
          {goal.monthly_savings > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">月々の貯金</span>
                </div>
                <span className="font-semibold text-blue-600">{formatAmount(monthlyTotal)}</span>
              </div>
              <div className="text-sm text-muted-foreground ml-6">
                月{formatAmount(goal.monthly_savings)} × {years * 12}ヶ月
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-full rounded-full"
                  style={{ width: `${(monthlyTotal / totalSavings) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* タイムライン */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          貯金の推移
        </h3>
        <div className="space-y-3">
          {milestones.map((milestone, index) => {
            const progress = (milestone.total / goal.target_amount) * 100;
            const monthLabel =
              milestone.month === years * 12
                ? `${years}年後`
                : milestone.month % 12 === 0
                ? `${milestone.month / 12}年後`
                : `${milestone.month}ヶ月後`;

            return (
              <div key={milestone.month} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{monthLabel}</span>
                  <span className="text-muted-foreground">
                    {formatAmount(milestone.total)} ({Math.round(progress)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* アドバイス */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold mb-2 text-blue-900">アドバイス</h3>
        <div className="space-y-2 text-sm text-blue-800">
          {achievementRate >= 100 ? (
            <p>素晴らしい！この調子で続ければ目標を達成できます。</p>
          ) : achievementRate >= 90 ? (
            <p>
              もう少しで目標達成です。月々の貯金を
              {formatAmount(Math.ceil((goal.target_amount - totalSavings) / (years * 12)))}
              追加すると目標に到達できます。
            </p>
          ) : (
            <>
              <p>目標達成には、さらなる工夫が必要です：</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                {goal.nisa_monthly < 30000 && (
                  <li>積立NISAの金額を増やす（上限：月33,333円）</li>
                )}
                {goal.bonus_per_year === 0 && <li>ボーナスからの貯金を追加する</li>}
                <li>支出を見直して月々の貯金額を増やす</li>
                <li>期間を延ばすことも検討してみましょう</li>
              </ul>
            </>
          )}
        </div>
      </Card>

      {/* 長期展望 */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        <h3 className="text-lg font-semibold mb-4 text-purple-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          長期的な展望
        </h3>
        <p className="text-sm text-purple-800 mb-4">
          このペースで貯金を続けた場合の長期的な予測です
        </p>
        <div className="space-y-4">
          {projections.map((projection) => {
            const nisaAmount = calculateNisaFutureValue(
              goal.nisa_monthly,
              goal.nisa_yield_rate,
              projection.years
            );
            const bonusAmount = goal.bonus_per_year * projection.years;
            const monthlyAmount = goal.monthly_savings * projection.years * 12;

            return (
              <div key={projection.years} className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-purple-900">
                    {projection.years}年後
                  </span>
                  <span className="text-2xl font-bold text-purple-700">
                    {formatAmount(projection.amount)}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-600" />
                      NISA
                    </span>
                    <span className="font-medium text-green-700">
                      {formatAmount(nisaAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Gift className="w-3 h-3 text-orange-600" />
                      ボーナス
                    </span>
                    <span className="font-medium text-orange-700">
                      {formatAmount(bonusAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Coins className="w-3 h-3 text-blue-600" />
                      月々の貯金
                    </span>
                    <span className="font-medium text-blue-700">
                      {formatAmount(monthlyAmount)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 p-3 bg-purple-100 rounded-lg">
          <p className="text-xs text-purple-800">
            💡 <strong>ヒント:</strong>
            積立NISAは複利効果により、時間が経つほど効率よく資産が増えていきます。
            長期的な視点で継続することが重要です。
          </p>
        </div>
      </Card>
    </div>
  );
}

export default function SimulationPage() {
  const { goals, loading } = useGoals();
  const [selectedPeriod, setSelectedPeriod] = useState<GoalPeriod>('1year');

  const activeGoals = goals.filter((g) => g.is_active);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (activeGoals.length === 0) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-6 pb-24">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">貯金シミュレーション</h1>
        </div>
        <Card className="p-12">
          <div className="text-center space-y-4">
            <Target className="w-16 h-16 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-semibold">目標が設定されていません</h2>
            <p className="text-muted-foreground">
              まずは目標設定画面で貯金目標を設定しましょう。
            </p>
            <Button
              onClick={() => (window.location.href = '/goals')}
              className="mt-4"
            >
              目標を設定する
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Find the selected goal
  const selectedGoal = activeGoals.find((g) => g.period === selectedPeriod) || activeGoals[0];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 pb-24">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">貯金シミュレーション</h1>
      </div>

      <Tabs
        value={selectedGoal.period}
        onValueChange={(value) => setSelectedPeriod(value as GoalPeriod)}
      >
        <TabsList className="grid w-full mb-6" style={{ gridTemplateColumns: `repeat(${activeGoals.length}, 1fr)` }}>
          {activeGoals.map((goal) => (
            <TabsTrigger key={goal.period} value={goal.period}>
              {PERIOD_LABELS[goal.period]}
            </TabsTrigger>
          ))}
        </TabsList>

        {activeGoals.map((goal) => (
          <TabsContent key={goal.period} value={goal.period}>
            <GoalSimulation goal={goal} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
