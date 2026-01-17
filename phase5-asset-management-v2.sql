-- Phase 5 V2: Monthly Asset Management with Reference Dates
-- Execute this SQL in Supabase SQL Editor

-- ============================================
-- 1. Add reference dates to users table
-- ============================================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS salary_day INTEGER DEFAULT 25,
ADD COLUMN IF NOT EXISTS card_payment_day INTEGER DEFAULT 27;

COMMENT ON COLUMN users.salary_day IS '給料日（口座残高の基準日は前日）';
COMMENT ON COLUMN users.card_payment_day IS 'カード支払日（資産合計の基準日）';

-- ============================================
-- 2. Monthly asset records table
-- ============================================
CREATE TABLE IF NOT EXISTS monthly_asset_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  year_month TEXT NOT NULL,

  -- Bank balance at (salary_day - 1)
  bank_balance INTEGER DEFAULT 0,

  -- Monthly income
  monthly_income INTEGER DEFAULT 0,

  -- Monthly credit card expenses
  credit_expenses INTEGER DEFAULT 0,

  -- NISA value (current evaluation)
  nisa_value INTEGER DEFAULT 0,

  -- Auto-calculated: bank_balance + monthly_income - credit_expenses
  calculated_balance INTEGER DEFAULT 0,

  -- Is this confirmed (true) or predicted (false)
  is_confirmed BOOLEAN DEFAULT false,

  -- Optional notes
  notes TEXT,

  -- Detailed breakdowns (JSON)
  bank_details JSONB DEFAULT '[]'::jsonb,
  income_details JSONB DEFAULT '[]'::jsonb,
  credit_details JSONB DEFAULT '[]'::jsonb,
  nisa_details JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, year_month)
);

ALTER TABLE monthly_asset_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own monthly records" ON monthly_asset_records
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_monthly_asset_records_user_month
  ON monthly_asset_records(user_id, year_month);

-- ============================================
-- 3. Trigger to auto-calculate balance
-- ============================================
CREATE OR REPLACE FUNCTION calculate_monthly_balance()
RETURNS TRIGGER AS $$
BEGIN
  NEW.calculated_balance = NEW.bank_balance + NEW.monthly_income - NEW.credit_expenses;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_balance_on_insert_or_update
  BEFORE INSERT OR UPDATE ON monthly_asset_records
  FOR EACH ROW
  EXECUTE FUNCTION calculate_monthly_balance();

-- ============================================
-- 4. Update trigger
-- ============================================
CREATE TRIGGER update_monthly_asset_records_updated_at
  BEFORE UPDATE ON monthly_asset_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. Keep existing tables but mark as legacy
-- ============================================
-- Note: bank_accounts, nisa_accounts, credit_cards, income_records are kept
-- but will be used differently:
-- - bank_accounts: Track multiple accounts, sum for monthly record
-- - nisa_accounts: Track NISA with monthly contribution
-- - income_records: Track recurring income sources
-- - credit_cards: Individual cards (balances will be aggregated to monthly_asset_records)

-- ============================================
-- 6. Add detail columns to existing monthly_asset_records (if already created)
-- ============================================
ALTER TABLE monthly_asset_records
ADD COLUMN IF NOT EXISTS bank_details JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS income_details JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS credit_details JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS nisa_details JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN monthly_asset_records.bank_details IS '銀行口座の詳細（JSON配列）';
COMMENT ON COLUMN monthly_asset_records.income_details IS '収入の詳細（JSON配列）';
COMMENT ON COLUMN monthly_asset_records.credit_details IS 'クレジットカード支出の詳細（JSON配列）';
COMMENT ON COLUMN monthly_asset_records.nisa_details IS 'NISA口座の詳細（JSON配列）';

-- ============================================
-- 7. Drop old monthly_snapshots if exists (replaced by monthly_asset_records)
-- ============================================
DROP TABLE IF EXISTS monthly_snapshots CASCADE;
