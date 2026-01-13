-- Phase 3: LINE連携機能のためのデータベースセットアップ
-- このSQLをSupabaseのSQLエディタで実行してください

-- ============================================
-- line_link_codesテーブル作成とRLS
-- ============================================

CREATE TABLE IF NOT EXISTS line_link_codes (
  code TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS（Row Level Security）有効化
ALTER TABLE line_link_codes ENABLE ROW LEVEL SECURITY;

-- 自分のデータのみアクセス可能
CREATE POLICY "Users can manage own link codes" ON line_link_codes
  FOR ALL USING (auth.uid() = user_id);

-- インデックス（検索高速化）
CREATE INDEX IF NOT EXISTS idx_line_link_codes_user ON line_link_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_line_link_codes_expires ON line_link_codes(expires_at);

-- ============================================
-- セットアップ完了
-- ============================================
-- LINE連携テーブルが正常に作成されました
