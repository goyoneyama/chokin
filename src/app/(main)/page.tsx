'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { useCategories } from '@/hooks/useCategories';
import { useExpenses } from '@/hooks/useExpenses';
import { useGoals } from '@/hooks/useGoals';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryIcon } from '@/components/CategoryIcon';
import { InstallPWA } from '@/components/InstallPWA';
import { formatCurrency, formatMonth, formatAmount, formatWeek } from '@/lib/formatters';
import { calculateBudgetSummary, calculateNisaFutureValue, calculateWeeklySummary } from '@/lib/calculations';
import { Plus, Settings, TrendingUp, Target, BarChart3, Calendar } from 'lucide-react';
import { GoalPeriod } from '@/types';

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

export default function Home() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { categories } = useCategories();
  const { expenses } = useExpenses();
  const { goals } = useGoals();

  const summary = calculateBudgetSummary(categories, expenses);
  // すべてのカテゴリを表示（使用額の多い順）
  const sortedCategories = summary.categories
    .sort((a, b) => b.spent - a.spent);

  const usagePercentage = summary.total_budget > 0
    ? Math.round((summary.total_spent / summary.total_budget) * 100)
    : 0;

  const activeGoals = goals.filter((g) => g.is_active).slice(0, 2); // Show top 2 goals

  // 週間サマリー（変動費のみ）
  const weeklySummary = calculateWeeklySummary(categories, expenses);
  const weeklyUsagePercentage = weeklySummary.totalWeeklyBudget > 0
    ? Math.round((weeklySummary.totalWeeklySpent / weeklySummary.totalWeeklyBudget) * 100)
    : 0;

  return (
    <div className="container mx-auto p-4 max-w-4xl pb-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">ホーム</h1>
        <Link href="/budget">
          <Button variant="outline" size="sm">
            <Settings className="mr-2" size={16} />
            予算設定
          </Button>
        </Link>
      </div>

      {/* PWAインストールバナー */}
      <InstallPWA />

      {/* 月収表示 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2" size={20} />
            {formatMonth(new Date())}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">月収</span>
              <span className="text-lg font-semibold">
                {formatCurrency(user?.monthly_income || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">予算</span>
              <span className="text-lg font-semibold">
                {formatCurrency(summary.total_budget)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">支出</span>
              <span className="text-lg font-semibold text-red-600">
                {formatCurrency(summary.total_spent)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 予算状況 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>今月の予算状況</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">
                  残り予算
                </span>
                <span
                  className={`text-2xl font-bold ${
                    summary.total_remaining >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(summary.total_remaining)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    usagePercentage <= 75
                      ? 'bg-green-500'
                      : usagePercentage <= 90
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {usagePercentage}% 使用中
              </p>
            </div>

            {/* カテゴリ別残高（すべて表示） */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold mb-3">カテゴリ別残高</h3>
              <div className="space-y-3">
                {sortedCategories.map((category) => {
                  const categoryUsage = category.budget > 0
                    ? Math.round((category.spent / category.budget) * 100)
                    : 0;

                  return (
                    <div key={category.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            className="p-1.5 rounded-full"
                            style={{ backgroundColor: category.color + '20' }}
                          >
                            <CategoryIcon icon={category.icon} size={16} />
                          </div>
                          <span className="text-sm font-medium">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-sm font-semibold block ${
                              category.remaining >= 0 ? 'text-blue-600' : 'text-red-600'
                            }`}
                          >
                            {formatCurrency(category.remaining)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(category.spent)} / {formatCurrency(category.budget)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            categoryUsage <= 75
                              ? 'bg-green-400'
                              : categoryUsage <= 90
                              ? 'bg-yellow-400'
                              : 'bg-red-400'
                          }`}
                          style={{ width: `${Math.min(categoryUsage, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 今週の予算状況（変動費のみ） */}
      {weeklySummary.categories.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Calendar className="mr-2" size={20} />
                今週の予算状況
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                {formatWeek(new Date())}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">
                    今週の残り予算（変動費）
                  </span>
                  <span
                    className={`text-xl font-bold ${
                      weeklySummary.totalWeeklyRemaining >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(weeklySummary.totalWeeklyRemaining)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      weeklyUsagePercentage <= 75
                        ? 'bg-green-500'
                        : weeklyUsagePercentage <= 90
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(weeklyUsagePercentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {weeklyUsagePercentage}% 使用中
                </p>
              </div>

              {/* カテゴリ別週間残高 */}
              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold mb-3">カテゴリ別（変動費のみ）</h3>
                <div className="space-y-3">
                  {weeklySummary.categories.map((category) => {
                    const categoryUsage = category.weeklyBudget > 0
                      ? Math.round((category.weeklySpent / category.weeklyBudget) * 100)
                      : 0;

                    return (
                      <div key={category.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div
                              className="p-1.5 rounded-full"
                              style={{ backgroundColor: category.color + '20' }}
                            >
                              <CategoryIcon icon={category.icon} size={16} />
                            </div>
                            <span className="text-sm font-medium">{category.name}</span>
                          </div>
                          <div className="text-right">
                            <span
                              className={`text-sm font-semibold block ${
                                category.weeklyRemaining >= 0 ? 'text-blue-600' : 'text-red-600'
                              }`}
                            >
                              {formatCurrency(category.weeklyRemaining)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              週 {formatCurrency(category.weeklySpent)} / {formatCurrency(category.weeklyBudget)}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              categoryUsage <= 75
                                ? 'bg-green-400'
                                : categoryUsage <= 90
                                ? 'bg-yellow-400'
                                : 'bg-red-400'
                            }`}
                            style={{ width: `${Math.min(categoryUsage, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  💡 週間予算 = 月間予算 ÷ 4週
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 貯金目標 */}
      {activeGoals.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Target className="mr-2" size={20} />
                貯金目標
              </CardTitle>
              <Link href="/goals">
                <Button variant="ghost" size="sm">
                  編集
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeGoals.map((goal) => {
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

                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        {PERIOD_LABELS[goal.period]}目標
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatAmount(goal.target_amount)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          achievementRate >= 100 ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(achievementRate, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>達成率 {achievementRate}%</span>
                      <span>予定額 {formatAmount(totalSavings)}</span>
                    </div>
                  </div>
                );
              })}
              <Link href="/simulation" className="block">
                <Button variant="outline" size="sm" className="w-full mt-2">
                  <BarChart3 className="mr-2" size={16} />
                  詳しいシミュレーションを見る
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 支出を記録するボタン */}
      <Button
        onClick={() => router.push('/expenses/new')}
        className="w-full"
        size="lg"
      >
        <Plus className="mr-2" size={20} />
        支出を記録する
      </Button>
    </div>
  );
}
