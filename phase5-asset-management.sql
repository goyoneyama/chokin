-- Phase 5: Asset Management Feature Setup
-- Execute this SQL in Supabase SQL Editor

-- ============================================
-- 1. asset_pin table (PIN protection)
-- ============================================
CREATE TABLE IF NOT EXISTS asset_pin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE asset_pin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own PIN" ON asset_pin
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 2. bank_accounts table
-- ============================================
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_type TEXT DEFAULT 'savings' CHECK (account_type IN ('savings', 'checking', 'deposit')),
  current_balance INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bank accounts" ON bank_accounts
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON bank_accounts(user_id);

-- ============================================
-- 3. nisa_accounts table
-- ============================================
CREATE TABLE IF NOT EXISTS nisa_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  broker_name TEXT NOT NULL,
  account_type TEXT DEFAULT 'tsumitate' CHECK (account_type IN ('tsumitate', 'growth', 'both')),
  current_value INTEGER DEFAULT 0,
  total_invested INTEGER DEFAULT 0,
  monthly_contribution INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE nisa_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own NISA accounts" ON nisa_accounts
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_nisa_accounts_user ON nisa_accounts(user_id);

-- ============================================
-- 4. credit_cards table
-- ============================================
CREATE TABLE IF NOT EXISTS credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  card_brand TEXT,
  credit_limit INTEGER DEFAULT 0,
  current_balance INTEGER DEFAULT 0,
  payment_due_day INTEGER,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own credit cards" ON credit_cards
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_credit_cards_user ON credit_cards(user_id);

-- ============================================
-- 5. income_records table
-- ============================================
CREATE TABLE IF NOT EXISTS income_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  income_type TEXT DEFAULT 'salary' CHECK (income_type IN ('salary', 'bonus', 'side_job', 'investment', 'other')),
  amount INTEGER NOT NULL,
  frequency TEXT DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'yearly', 'one_time')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE income_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own income" ON income_records
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_income_records_user ON income_records(user_id);

-- ============================================
-- 6. monthly_snapshots table
-- ============================================
CREATE TABLE IF NOT EXISTS monthly_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  year_month TEXT NOT NULL,

  total_income INTEGER DEFAULT 0,
  total_expenses INTEGER DEFAULT 0,
  monthly_balance INTEGER DEFAULT 0,
  total_bank_balance INTEGER DEFAULT 0,
  total_nisa_value INTEGER DEFAULT 0,
  total_credit_balance INTEGER DEFAULT 0,
  net_worth INTEGER DEFAULT 0,

  bank_details JSONB,
  nisa_details JSONB,
  credit_details JSONB,
  income_details JSONB,

  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, year_month)
);

ALTER TABLE monthly_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own snapshots" ON monthly_snapshots
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_user_month ON monthly_snapshots(user_id, year_month);

-- ============================================
-- 7. Update triggers (if not exists)
-- ============================================
-- Note: The update_updated_at_column function should already exist from previous migrations
-- If not, uncomment the following:
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = NOW();
--     RETURN NEW;
-- END;
-- $$ language 'plpgsql';

CREATE TRIGGER update_asset_pin_updated_at
    BEFORE UPDATE ON asset_pin
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at
    BEFORE UPDATE ON bank_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nisa_accounts_updated_at
    BEFORE UPDATE ON nisa_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_cards_updated_at
    BEFORE UPDATE ON credit_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_income_records_updated_at
    BEFORE UPDATE ON income_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_snapshots_updated_at
    BEFORE UPDATE ON monthly_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
