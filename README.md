# 貯金管理アプリ

目標達成を支援する貯金管理アプリ

## 🎯 実装済み機能

### ✅ 認証機能
- メールアドレス・パスワードでのログイン
- ユーザー登録（Supabase Auth）
- ログアウト

### ✅ 支出管理
- 支出の記録（金額、カテゴリ、日付、メモ）
- 支出の編集・削除
- 月別の支出一覧表示
- 月間合計の表示

### ✅ カテゴリ管理
- カテゴリの追加・編集・削除
- カテゴリアイコンとカラーのカスタマイズ
- 固定費/変動費の区別
- デフォルトカテゴリの自動作成

### ✅ 予算設定
- 月収の設定
- カテゴリ別予算の設定
- 貯金可能額の自動計算

### ✅ ホーム画面
- 月間の予算状況サマリー
- カテゴリ別残高の表示
- プログレスバーでの視覚化

### ✅ UI/UX
- モバイルファーストデザイン
- ボトムナビゲーション
- レスポンシブデザイン
- タッチ操作最適化

### ✅ 貯金目標設定（Phase 2）
- 1年・3年・5年・10年の期間別目標設定
- 目標金額の設定
- 積立NISAの設定（月額・利回り）
- ボーナス貯金の設定
- 月々の必要貯金額の自動計算

### ✅ シミュレーション機能（Phase 2）
- 目標達成率の可視化
- 貯金の内訳表示（NISA・ボーナス・月々）
- 時系列での貯金推移表示
- 達成状況に応じたアドバイス表示

### ✅ ホーム画面の強化（Phase 2）
- 貯金目標の進捗表示
- シミュレーションへのクイックアクセス
- 週間予算状況の表示（変動費のみ）

### ✅ レポート機能（Phase 3）
- 週間レポート（変動費のみ、月曜始まり）
- 月間レポート（全カテゴリ）
- 年間レポート（月別推移）
- カテゴリ別円グラフ
- 支出推移の可視化

### ✅ PWA対応（Phase 3）
- Service Worker によるオフライン対応
- ホーム画面へのインストール促進
- アプリショートカット機能
- スタンドアロンモード対応

### ✅ LINE連携（Phase 3）
- LINE Bot による支出記録
- 連携コード発行・検証機能
- LINEからのカテゴリ選択
- 残高確認機能

## 🛠 技術スタック

- **フロントエンド**: Next.js 16 (App Router) + TypeScript
- **スタイリング**: Tailwind CSS 4
- **UIライブラリ**: shadcn/ui
- **状態管理**: Zustand
- **バックエンド**: Supabase (PostgreSQL + Auth)
- **ホスティング**: Vercel (予定)

## 📦 セットアップ

### 1. 依存パッケージのインストール

\`\`\`bash
npm install
\`\`\`

### 2. 環境変数の設定

\`.env.local\` ファイルを作成：

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# LINE（連携する場合のみ）
LINE_CHANNEL_SECRET=your-line-channel-secret
LINE_CHANNEL_ACCESS_TOKEN=your-line-access-token

NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

### 3. Supabaseデータベースのセットアップ

1. Supabaseプロジェクトを作成
2. SQL Editorで \`supabase-setup.sql\` を実行（Phase 1）
3. SQL Editorで \`supabase-fix-rls.sql\` を実行（RLS設定）
4. SQL Editorで \`phase2-setup.sql\` を実行（Phase 2: 貯金目標機能）
5. SQL Editorで \`phase3-line-setup.sql\` を実行（Phase 3: LINE連携）
6. Authentication → Providersで「Email」を有効化

### 4. 開発サーバーの起動

\`\`\`bash
npm run dev
\`\`\`

http://localhost:3000 でアクセス

### 5. LINE連携（オプション）

LINE Botとの連携を行う場合：

1. [LINE Developers Console](https://developers.line.biz/) でプロバイダーを作成
2. Messaging APIチャネルを作成
3. チャネルアクセストークン（長期）を発行
4. `.env.local` に `LINE_CHANNEL_SECRET` と `LINE_CHANNEL_ACCESS_TOKEN` を追加
5. Webhook URLに `https://your-app.vercel.app/api/line-webhook` を設定（デプロイ後）
6. Webhook利用を「オン」に設定

## 📱 画面構成

- \`/login\` - ログイン
- \`/signup\` - 新規登録
- \`/\` - ホーム（予算サマリー + 目標進捗）
- \`/expenses/new\` - 支出入力
- \`/expenses\` - 支出一覧
- \`/budget\` - 予算設定
- \`/categories\` - カテゴリ管理
- \`/goals\` - 貯金目標設定
- \`/simulation\` - 貯金シミュレーション
- \`/reports\` - レポート（週間・月間・年間）
- \`/settings\` - 設定
- \`/settings/line\` - LINE連携設定

## 🗄 データベース構造

### users
- ユーザー情報（メール、表示名、月収）

### categories
- カテゴリ情報（名前、予算、アイコン、カラー）

### expenses
- 支出記録（金額、カテゴリ、日付、メモ）

### savings_goals
- 貯金目標（期間、目標金額、NISA設定、ボーナス設定、月々の貯金）

### line_link_codes
- LINE連携コード（コード、有効期限、使用状態）

## 🚀 今後の予定

- ✅ Phase 3完了：レポート機能、PWA対応、LINE Bot連携
- 🔔 目標達成通知機能
- 📤 データエクスポート機能（CSV/PDF）
- ⚠️ 予算アラート機能
- 📅 支出カレンダー表示
- 🔄 定期支出の自動記録

## 📝 開発メモ

### デフォルトカテゴリ
新規ユーザー登録時に以下のカテゴリが自動作成されます：
- 固定費（家賃等）
- 食費
- サブスク
- 娯楽
- 飲み会

### RLS（Row Level Security）
すべてのテーブルでRLSが有効化されており、ユーザーは自分のデータのみアクセス可能です。

## 📄 ライセンス

ISC
