'use client';

import { useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useExpenses } from '@/hooks/useExpenses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryIcon } from '@/components/CategoryIcon';
import { PieChart } from '@/components/PieChart';
import { formatCurrency, formatWeek, formatMonth } from '@/lib/formatters';
import { calculateWeeklySummary, calculateBudgetSummary } from '@/lib/calculations';
import { FileText, Calendar, TrendingUp, PieChartIcon } from 'lucide-react';
import { startOfYear, endOfYear, eachMonthOfInterval, format, parseISO, isSameMonth } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function ReportsPage() {
  const { categories } = useCategories();
  const { expenses } = useExpenses();
  const [selectedTab, setSelectedTab] = useState('weekly');

  const currentYear = new Date().getFullYear();

  // 週間レポート
  const weeklySummary = calculateWeeklySummary(categories, expenses);
  const weeklyUsagePercentage = weeklySummary.totalWeeklyBudget > 0
    ? Math.round((weeklySummary.totalWeeklySpent / weeklySummary.totalWeeklyBudget) * 100)
    : 0;

  // 月間レポート
  const monthlySummary = calculateBudgetSummary(categories, expenses);
  const monthlyUsagePercentage = monthlySummary.total_budget > 0
    ? Math.round((monthlySummary.total_spent / monthlySummary.total_budget) * 100)
    : 0;

  // 年間レポート
  const yearStart = startOfYear(new Date());
  const yearEnd = endOfYear(new Date());
  const monthsInYear = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  const yearlyData = monthsInYear.map((month) => {
    const monthExpenses = expenses.filter((e) => {
      const expenseDate = parseISO(e.date);
      return isSameMonth(expenseDate, month);
    });
    const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    return {
      month,
      monthLabel: format(month, 'M月', { locale: ja }),
      total,
    };
  });

  const yearlyTotal = yearlyData.reduce((sum, data) => sum + data.total, 0);
  const yearlyAverage = Math.round(yearlyTotal / 12);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 pb-24">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">レポート</h1>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="weekly">週間</TabsTrigger>
          <TabsTrigger value="monthly">月間</TabsTrigger>
          <TabsTrigger value="yearly">年間</TabsTrigger>
        </TabsList>

        {/* 週間レポート */}
        <TabsContent value="weekly">
          <div className="space-y-6">
            {/* サマリーカード */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    今週の支出（変動費のみ）
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {formatWeek(new Date())}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">週間予算</span>
                    <span className="text-lg font-semibold">
                      {formatCurrency(weeklySummary.totalWeeklyBudget)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">使用額</span>
                    <span className="text-lg font-semibold text-red-600">
                      {formatCurrency(weeklySummary.totalWeeklySpent)}
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">残り予算</span>
                      <span
                        className={`text-2xl font-bold ${
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
                </div>
              </CardContent>
            </Card>

            {/* カテゴリ別詳細 */}
            <Card>
              <CardHeader>
                <CardTitle>カテゴリ別詳細</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {weeklySummary.categories.map((category) => {
                    const usage = category.weeklyBudget > 0
                      ? Math.round((category.weeklySpent / category.weeklyBudget) * 100)
                      : 0;

                    return (
                      <div key={category.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="p-2 rounded-full"
                              style={{ backgroundColor: category.color + '20' }}
                            >
                              <CategoryIcon icon={category.icon} size={20} />
                            </div>
                            <div>
                              <p className="font-medium">{category.name}</p>
                              <p className="text-xs text-muted-foreground">
                                週 {formatCurrency(category.weeklyBudget)} (月 {formatCurrency(category.monthlyBudget)})
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-lg font-bold ${
                                category.weeklyRemaining >= 0 ? 'text-blue-600' : 'text-red-600'
                              }`}
                            >
                              {formatCurrency(category.weeklyRemaining)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              使用 {formatCurrency(category.weeklySpent)}
                            </p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              usage <= 75 ? 'bg-green-400' : usage <= 90 ? 'bg-yellow-400' : 'bg-red-400'
                            }`}
                            style={{ width: `${Math.min(usage, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-4 text-center bg-blue-50 p-2 rounded">
                  💡 週間予算 = 月間予算 ÷ 4週（変動費のみ）
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 月間レポート */}
        <TabsContent value="monthly">
          <div className="space-y-6">
            {/* サマリーカード */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    今月の支出
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {formatMonth(new Date())}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">予算</span>
                    <span className="text-lg font-semibold">
                      {formatCurrency(monthlySummary.total_budget)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">使用額</span>
                    <span className="text-lg font-semibold text-red-600">
                      {formatCurrency(monthlySummary.total_spent)}
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">残り予算</span>
                      <span
                        className={`text-2xl font-bold ${
                          monthlySummary.total_remaining >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(monthlySummary.total_remaining)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          monthlyUsagePercentage <= 75
                            ? 'bg-green-500'
                            : monthlyUsagePercentage <= 90
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(monthlyUsagePercentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      {monthlyUsagePercentage}% 使用中
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* カテゴリ別円グラフ */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  カテゴリ別支出割合
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <PieChart
                  data={monthlySummary.categories
                    .filter((cat) => cat.spent > 0)
                    .sort((a, b) => b.spent - a.spent)
                    .map((cat) => ({
                      name: cat.name,
                      value: cat.spent,
                      color: cat.color,
                    }))}
                  size={240}
                />
              </CardContent>
            </Card>

            {/* カテゴリ別詳細 */}
            <Card>
              <CardHeader>
                <CardTitle>カテゴリ別詳細</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlySummary.categories
                    .sort((a, b) => b.spent - a.spent)
                    .map((category) => {
                      const usage = category.budget > 0
                        ? Math.round((category.spent / category.budget) * 100)
                        : 0;

                      return (
                        <div key={category.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="p-2 rounded-full"
                                style={{ backgroundColor: category.color + '20' }}
                              >
                                <CategoryIcon icon={category.icon} size={20} />
                              </div>
                              <div>
                                <p className="font-medium">{category.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  予算 {formatCurrency(category.budget)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p
                                className={`text-lg font-bold ${
                                  category.remaining >= 0 ? 'text-blue-600' : 'text-red-600'
                                }`}
                              >
                                {formatCurrency(category.remaining)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                使用 {formatCurrency(category.spent)}
                              </p>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                usage <= 75 ? 'bg-green-400' : usage <= 90 ? 'bg-yellow-400' : 'bg-red-400'
                              }`}
                              style={{ width: `${Math.min(usage, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 年間レポート */}
        <TabsContent value="yearly">
          <div className="space-y-6">
            {/* サマリーカード */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  {currentYear}年の支出
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">年間合計</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(yearlyTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">月平均</span>
                    <span className="text-lg font-semibold">
                      {formatCurrency(yearlyAverage)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 月別推移 */}
            <Card>
              <CardHeader>
                <CardTitle>月別支出推移</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {yearlyData.map((data) => {
                    const percentage = yearlyAverage > 0
                      ? Math.round((data.total / yearlyAverage) * 100)
                      : 0;

                    return (
                      <div key={data.monthLabel} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{data.monthLabel}</span>
                          <span className="text-sm font-semibold">
                            {formatCurrency(data.total)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
