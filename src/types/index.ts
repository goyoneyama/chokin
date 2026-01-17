// ============================================
// ユーザー関連の型定義
// ============================================

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  line_user_id: string | null;
  monthly_income: number;
  salary_day: number;
  card_payment_day: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// 貯金目標関連の型定義（Phase 2で使用）
// ============================================

export type GoalPeriod = '1year' | '3year' | '5year' | '10year';

export interface SavingsGoal {
  id: string;
  user_id: string;
  period: GoalPeriod;
  target_amount: number;
  nisa_monthly: number;
  nisa_yield_rate: number;
  bonus_per_year: number;
  bonus_frequency: number;
  monthly_savings: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// カテゴリ関連の型定義
// ============================================

export interface Category {
  id: string;
  user_id: string;
  name: string;
  budget: number;
  icon: string;
  color: string;
  is_fixed: boolean;
  display_order: number;
  is_default: boolean;
  created_at: string;
}

export interface CategoryWithExpenses extends Category {
  spent: number;
  remaining: number;
}

// ============================================
// 支出関連の型定義
// ============================================

export type InputSource = 'app' | 'line';

export interface Expense {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  memo: string | null;
  date: string;
  input_source: InputSource;
  created_at: string;
  category?: Category;
}

export interface ExpenseWithCategory extends Expense {
  category: Category;
}

// ============================================
// LINE連携関連の型定義（Phase 3で使用）
// ============================================

export interface LineLinkCode {
  code: string;
  user_id: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

// ============================================
// フォーム入力用の型定義
// ============================================

export interface ExpenseFormData {
  amount: number;
  category_id: string;
  date: string;
  memo?: string;
}

export interface CategoryFormData {
  name: string;
  budget: number;
  icon: string;
  color: string;
  is_fixed: boolean;
}

// ============================================
// 統計・集計用の型定義
// ============================================

export interface BudgetSummary {
  total_budget: number;
  total_spent: number;
  total_remaining: number;
  categories: CategoryWithExpenses[];
}

export interface MonthlySummary {
  year: number;
  month: number;
  total_income: number;
  total_expenses: number;
  total_savings: number;
  categories: {
    category_id: string;
    category_name: string;
    budget: number;
    spent: number;
  }[];
}
