-- 貯金管理アプリ データベースセットアップ
-- このSQLをSupabaseのSQLエディタで実行してください

-- ============================================
-- 1. usersテーブル作成とRLS
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  line_user_id TEXT UNIQUE,
  monthly_income INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS（Row Level Security）有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 自分のデータのみアクセス可能
CREATE POLICY "Users can view own data" ON users
  FOR ALL USING (auth.uid() = id);

-- ============================================
-- 2. categoriesテーブル作成とRLS
-- ============================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  budget INTEGER DEFAULT 0,
  icon TEXT DEFAULT 'receipt',
  color TEXT DEFAULT '#6B7280',
  is_fixed BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own categories" ON categories
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 3. expensesテーブル作成とRLS
-- ============================================

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  memo TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  input_source TEXT DEFAULT 'app' CHECK (input_source IN ('app', 'line')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own expenses" ON expenses
  FOR ALL USING (auth.uid() = user_id);

-- インデックス（検索高速化）
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);

-- ============================================
-- 4. デフォルトカテゴリ作成関数とトリガー
-- ============================================

-- 新規ユーザー登録時にデフォルトカテゴリを自動作成
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO categories (user_id, name, icon, color, is_fixed, display_order, is_default) VALUES
    (NEW.id, '固定費（家賃等）', 'home', '#EF4444', true, 1, true),
    (NEW.id, '食費', 'utensils', '#F97316', false, 2, true),
    (NEW.id, 'サブスク', 'credit-card', '#8B5CF6', true, 3, true),
    (NEW.id, '娯楽', 'gamepad-2', '#3B82F6', false, 4, true),
    (NEW.id, '飲み会', 'beer', '#EC4899', false, 5, true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーが既に存在する場合は削除してから作成
DROP TRIGGER IF EXISTS on_user_created ON users;

CREATE TRIGGER on_user_created
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION create_default_categories();

-- ============================================
-- 5. updated_at自動更新関数（オプション）
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- usersテーブルのupdated_at自動更新
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- セットアップ完了
-- ============================================
-- 以下のコマンドでテーブルを確認できます:
-- SELECT * FROM users;
-- SELECT * FROM categories;
-- SELECT * FROM expenses;
