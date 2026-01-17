-- Phase 5 V2 Add-on: Default Settings for Monthly Asset Auto-Generation
-- Execute this SQL in Supabase SQL Editor

-- ============================================
-- 1. Add default credit cards to users table
-- ============================================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS default_credit_cards JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN users.default_credit_cards IS 'デフォルトクレジットカード設定（JSON配列）';

-- ============================================
-- Note: Existing tables already support the other defaults:
-- - income_records: Used for recurring income (already exists)
-- - nisa_accounts: Has monthly_contribution field (already exists)
-- ============================================
