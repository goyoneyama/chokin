import { Category, Expense, CategoryWithExpenses } from '@/types';
import { startOfMonth, endOfMonth, isSameMonth, parseISO, startOfWeek, endOfWeek, isSameWeek } from 'date-fns';

/**
 * 月々の貯金可能額を計算
 * 月収 - カテゴリ予算合計
 */
export function calculateMonthlySavings(
  monthlyIncome: number,
  categories: Category[]
): number {
  const totalBudget = categories.reduce((sum, cat) => sum + cat.budget, 0);
  return monthlyIncome - totalBudget;
}

/**
 * カテゴリ別の残高を計算
 */
export function getCategoryRemaining(
  category: Category,
  expenses: Expense[],
  targetMonth: Date = new Date()
): number {
  const monthExpenses = expenses.filter((e) => {
    if (e.category_id !== category.id) return false;
    const expenseDate = parseISO(e.date);
    return isSameMonth(expenseDate, targetMonth);
  });

  const spent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  return category.budget - spent;
}

/**
 * カテゴリ別の支出合計を計算
 */
export function getCategoryTotal(
  categoryId: string,
  expenses: Expense[],
  targetMonth: Date = new Date()
): number {
  const monthExpenses = expenses.filter((e) => {
    if (e.category_id !== categoryId) return false;
    const expenseDate = parseISO(e.date);
    return isSameMonth(expenseDate, targetMonth);
  });

  return monthExpenses.reduce((sum, e) => sum + e.amount, 0);
}

/**
 * 全カテゴリの予算状況を計算
 */
export function calculateBudgetSummary(
  categories: Category[],
  expenses: Expense[],
  targetMonth: Date = new Date()
): {
  total_budget: number;
  total_spent: number;
  total_remaining: number;
  categories: CategoryWithExpenses[];
} {
  const categoriesWithExpenses: CategoryWithExpenses[] = categories.map((cat) => {
    const spent = getCategoryTotal(cat.id, expenses, targetMonth);
    const remaining = cat.budget - spent;

    return {
      ...cat,
      spent,
      remaining,
    };
  });

  const total_budget = categories.reduce((sum, cat) => sum + cat.budget, 0);
  const total_spent = categoriesWithExpenses.reduce((sum, cat) => sum + cat.spent, 0);
  const total_remaining = total_budget - total_spent;

  return {
    total_budget,
    total_spent,
    total_remaining,
    categories: categoriesWithExpenses,
  };
}

/**
 * 月別の支出をフィルタ
 */
export function filterExpensesByMonth(
  expenses: Expense[],
  targetMonth: Date = new Date()
): Expense[] {
  return expenses.filter((e) => {
    const expenseDate = parseISO(e.date);
    return isSameMonth(expenseDate, targetMonth);
  });
}

/**
 * 支出の合計を計算
 */
export function calculateTotalExpenses(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

/**
 * 積立NISAの複利計算（Phase 2で使用）
 * FV = PMT × ((1 + r)^n - 1) / r
 */
export function calculateNisaFutureValue(
  monthlyAmount: number,
  annualYieldRate: number,
  years: number
): number {
  if (monthlyAmount === 0) return 0;

  const monthlyRate = annualYieldRate / 100 / 12;
  const months = years * 12;

  if (monthlyRate === 0) {
    return monthlyAmount * months;
  }

  return Math.round(
    monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
  );
}

/**
 * 総貯金額計算（Phase 2で使用）
 */
export function calculateTotalSavings(
  nisaMonthly: number,
  nisaYieldRate: number,
  bonusPerYear: number,
  bonusFrequency: number,
  monthlySavings: number,
  years: number
): number {
  const nisaTotal = calculateNisaFutureValue(nisaMonthly, nisaYieldRate, years);
  const bonusTotal = bonusPerYear * bonusFrequency * years;
  const monthlyTotal = monthlySavings * 12 * years;

  return nisaTotal + bonusTotal + monthlyTotal;
}

/**
 * 進捗率を計算
 */
export function calculateProgress(
  currentAmount: number,
  targetAmount: number
): number {
  if (targetAmount === 0) return 0;
  return Math.min(100, Math.round((currentAmount / targetAmount) * 100));
}

/**
 * カテゴリの使用率を計算
 */
export function calculateCategoryUsage(spent: number, budget: number): number {
  if (budget === 0) return 0;
  return Math.round((spent / budget) * 100);
}

/**
 * 週間の支出合計を計算（変動費のみ）
 */
export function getWeeklyTotal(
  categoryId: string,
  expenses: Expense[],
  targetWeek: Date = new Date()
): number {
  const weekStart = startOfWeek(targetWeek, { weekStartsOn: 1 }); // 月曜始まり
  const weekEnd = endOfWeek(targetWeek, { weekStartsOn: 1 });

  const weekExpenses = expenses.filter((e) => {
    if (e.category_id !== categoryId) return false;
    const expenseDate = parseISO(e.date);
    return expenseDate >= weekStart && expenseDate <= weekEnd;
  });

  return weekExpenses.reduce((sum, e) => sum + e.amount, 0);
}

/**
 * 週間予算を計算（月間予算を4週で割る）
 */
export function calculateWeeklyBudget(monthlyBudget: number): number {
  return Math.round(monthlyBudget / 4);
}

/**
 * 変動費カテゴリのみの週間サマリーを計算
 */
export function calculateWeeklySummary(
  categories: Category[],
  expenses: Expense[],
  targetWeek: Date = new Date()
): {
  categories: Array<{
    id: string;
    name: string;
    color: string;
    icon: string;
    weeklyBudget: number;
    weeklySpent: number;
    weeklyRemaining: number;
    monthlyBudget: number;
  }>;
  totalWeeklyBudget: number;
  totalWeeklySpent: number;
  totalWeeklyRemaining: number;
} {
  // 変動費のみをフィルタ（is_fixed = false）
  const variableCategories = categories.filter((cat) => !cat.is_fixed);

  const categoriesWithWeekly = variableCategories.map((cat) => {
    const weeklyBudget = calculateWeeklyBudget(cat.budget);
    const weeklySpent = getWeeklyTotal(cat.id, expenses, targetWeek);
    const weeklyRemaining = weeklyBudget - weeklySpent;

    return {
      id: cat.id,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      weeklyBudget,
      weeklySpent,
      weeklyRemaining,
      monthlyBudget: cat.budget,
    };
  });

  const totalWeeklyBudget = categoriesWithWeekly.reduce(
    (sum, cat) => sum + cat.weeklyBudget,
    0
  );
  const totalWeeklySpent = categoriesWithWeekly.reduce(
    (sum, cat) => sum + cat.weeklySpent,
    0
  );
  const totalWeeklyRemaining = totalWeeklyBudget - totalWeeklySpent;

  return {
    categories: categoriesWithWeekly,
    totalWeeklyBudget,
    totalWeeklySpent,
    totalWeeklyRemaining,
  };
}
