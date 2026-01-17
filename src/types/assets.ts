// ============================================
// Asset Management Type Definitions
// ============================================

export type BankAccountType = 'savings' | 'checking' | 'deposit';
export type NisaAccountType = 'tsumitate' | 'growth' | 'both';
export type CardBrand = 'VISA' | 'Mastercard' | 'JCB' | 'AMEX' | 'Other';
export type IncomeType = 'salary' | 'bonus' | 'side_job' | 'investment' | 'other';
export type IncomeFrequency = 'monthly' | 'yearly' | 'one_time';

export interface AssetPin {
  id: string;
  user_id: string;
  pin_hash: string;
  created_at: string;
  updated_at: string;
}

export interface BankAccount {
  id: string;
  user_id: string;
  name: string;
  bank_name: string;
  account_type: BankAccountType;
  current_balance: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NisaAccount {
  id: string;
  user_id: string;
  name: string;
  broker_name: string;
  account_type: NisaAccountType;
  current_value: number;
  total_invested: number;
  monthly_contribution: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreditCard {
  id: string;
  user_id: string;
  name: string;
  card_brand: CardBrand | null;
  credit_limit: number;
  current_balance: number;
  payment_due_day: number | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IncomeRecord {
  id: string;
  user_id: string;
  name: string;
  income_type: IncomeType;
  amount: number;
  frequency: IncomeFrequency;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Detail types for monthly records
export interface BankDetail {
  id?: string; // bank_account_id if linked
  name: string;
  balance: number;
}

export interface IncomeDetail {
  id?: string; // income_record_id if linked
  name: string;
  amount: number;
}

export interface CreditDetail {
  id?: string; // credit_card_id if linked
  name: string;
  amount: number;
}

export interface NisaDetail {
  id?: string; // nisa_account_id if linked
  name: string;
  value: number;
}

export interface MonthlyAssetRecord {
  id: string;
  user_id: string;
  year_month: string;
  bank_balance: number;
  monthly_income: number;
  credit_expenses: number;
  nisa_value: number;
  calculated_balance: number;
  is_confirmed: boolean;
  notes: string | null;
  bank_details: BankDetail[] | null;
  income_details: IncomeDetail[] | null;
  credit_details: CreditDetail[] | null;
  nisa_details: NisaDetail[] | null;
  created_at: string;
  updated_at: string;
}

export interface MonthlyAssetRecordFormData {
  bank_balance: number;
  monthly_income: number;
  credit_expenses: number;
  nisa_value: number;
  notes?: string;
  bank_details?: BankDetail[];
  income_details?: IncomeDetail[];
  credit_details?: CreditDetail[];
  nisa_details?: NisaDetail[];
}

// Legacy types removed - monthly_snapshots table has been replaced by monthly_asset_records

// Form data types
export interface BankAccountFormData {
  name: string;
  bank_name: string;
  account_type: BankAccountType;
  current_balance: number;
}

export interface NisaAccountFormData {
  name: string;
  broker_name: string;
  account_type: NisaAccountType;
  current_value: number;
  total_invested: number;
  monthly_contribution: number;
}

export interface CreditCardFormData {
  name: string;
  card_brand: CardBrand | null;
  credit_limit: number;
  current_balance: number;
  payment_due_day: number | null;
}

export interface IncomeRecordFormData {
  name: string;
  income_type: IncomeType;
  amount: number;
  frequency: IncomeFrequency;
}

// Summary types
export interface AssetSummary {
  totalBankBalance: number;
  totalNisaValue: number;
  totalNisaInvested: number;
  totalCreditBalance: number;
  totalMonthlyIncome: number;
  totalMonthlyExpenses: number;
  monthlyBalance: number;
  netWorth: number;
  nisaGainLoss: number;
  nisaGainLossPercent: number;
}

// Label mappings for UI
export const BANK_ACCOUNT_TYPE_LABELS: Record<BankAccountType, string> = {
  savings: '普通預金',
  checking: '当座預金',
  deposit: '定期預金',
};

export const NISA_ACCOUNT_TYPE_LABELS: Record<NisaAccountType, string> = {
  tsumitate: 'つみたて投資枠',
  growth: '成長投資枠',
  both: '両方',
};

export const CARD_BRAND_LABELS: Record<CardBrand, string> = {
  VISA: 'VISA',
  Mastercard: 'Mastercard',
  JCB: 'JCB',
  AMEX: 'AMEX',
  Other: 'その他',
};

export const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  salary: '給与',
  bonus: '賞与',
  side_job: '副業',
  investment: '投資収益',
  other: 'その他',
};

export const INCOME_FREQUENCY_LABELS: Record<IncomeFrequency, string> = {
  monthly: '毎月',
  yearly: '年1回',
  one_time: '1回のみ',
};
