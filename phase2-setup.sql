-- Phase 2: 貯金目標機能のセットアップ
-- このSQLをSupabaseのSQLエディタで実行してください

-- ============================================
-- savings_goalsテーブル作成とRLS
-- ============================================

CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('1year', '3year', '5year', '10year')),
  target_amount INTEGER NOT NULL DEFAULT 0,
  nisa_monthly INTEGER DEFAULT 0,
  nisa_yield_rate DECIMAL(5,2) DEFAULT 5.00,
  bonus_per_year INTEGER DEFAULT 0,
  bonus_frequency INTEGER DEFAULT 2,
  monthly_savings INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, period)
);

ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own goals" ON savings_goals
  FOR ALL USING (auth.uid() = user_id);

-- updated_at自動更新トリガー
DROP TRIGGER IF EXISTS update_savings_goals_updated_at ON savings_goals;

CREATE TRIGGER update_savings_goals_updated_at
    BEFORE UPDATE ON savings_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 確認: テーブル構造を表示
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'savings_goals'
ORDER BY ordinal_position;
