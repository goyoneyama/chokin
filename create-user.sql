-- ユーザー情報をusersテーブルに登録
INSERT INTO users (id, email, display_name, monthly_income)
VALUES (
  '91c3ee0a-0ea8-4736-bf9c-e82ddc340c35',
  'gooyoneyama0914@gmail.com',
  '米山豪',
  0
);

-- 確認: ユーザー情報を表示
SELECT * FROM users WHERE id = '91c3ee0a-0ea8-4736-bf9c-e82ddc340c35';
