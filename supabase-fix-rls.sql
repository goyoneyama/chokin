-- usersテーブルのRLSポリシーを修正
-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view own data" ON users;

-- 新しいポリシーを作成（操作ごとに分ける）
-- 新規ユーザー作成を許可（自分のIDでのみINSERT可能）
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 自分のデータの閲覧を許可
CREATE POLICY "Users can view own data" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- 自分のデータの更新を許可
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- 自分のデータの削除を許可
CREATE POLICY "Users can delete own data" ON users
  FOR DELETE
  USING (auth.uid() = id);
