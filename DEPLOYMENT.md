# Vercelデプロイ手順

このガイドでは、貯金管理アプリをVercelにデプロイする手順を説明します。

## 前提条件

1. GitHubアカウント
2. Vercelアカウント（[vercel.com](https://vercel.com/)）
3. Supabaseプロジェクトが作成済み
4. （オプション）LINE Developersアカウント

## デプロイ手順

### 1. GitHubリポジトリの準備

プロジェクトをGitHubにプッシュします：

```bash
cd savings-app
git init
git add .
git commit -m "Initial commit with LINE integration"
git branch -M main
git remote add origin https://github.com/your-username/savings-app.git
git push -u origin main
```

### 2. Vercelプロジェクトの作成

1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. 「Add New...」→「Project」をクリック
3. GitHubリポジトリをインポート
4. プロジェクト名を設定（例: `savings-app`）
5. Framework Presetは「Next.js」が自動選択される
6. Root Directoryは空白のまま（または `savings-app` を指定）

### 3. 環境変数の設定

Vercelプロジェクトの「Settings」→「Environment Variables」で以下を追加：

#### 必須の環境変数

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | SupabaseプロジェクトURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` | Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | Supabase Service Role Key |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | デプロイ後のアプリURL |

#### オプション（LINE連携を使用する場合）

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `LINE_CHANNEL_SECRET` | `xxx` | LINE Channel Secret |
| `LINE_CHANNEL_ACCESS_TOKEN` | `xxx` | LINE Channel Access Token |

**重要:** 環境変数は「Production」「Preview」「Development」すべてに適用してください。

### 4. デプロイの実行

1. 「Deploy」ボタンをクリック
2. ビルドが完了するまで待機（通常2-3分）
3. デプロイが成功すると、URLが表示されます

### 5. デプロイ後の設定

#### 5.1 アプリURLの更新

1. デプロイされたURLをコピー（例: `https://savings-app-xxx.vercel.app`）
2. Vercelの環境変数 `NEXT_PUBLIC_APP_URL` をこのURLに更新
3. 再デプロイを実行

#### 5.2 LINE Webhook URLの設定（LINE連携を使用する場合）

1. [LINE Developers Console](https://developers.line.biz/) にログイン
2. 作成したMessaging APIチャネルを開く
3. 「Messaging API設定」タブを選択
4. Webhook URLに以下を設定：
   ```
   https://your-app.vercel.app/api/line-webhook
   ```
5. 「Webhook の利用」を「オン」に設定
6. 「検証」ボタンで接続をテスト

### 6. 動作確認

1. デプロイされたURLにアクセス
2. ログイン/新規登録が正常に動作するか確認
3. 支出の記録が正常に動作するか確認
4. （LINE連携を設定した場合）LINE Botとの連携が動作するか確認

## トラブルシューティング

### ビルドエラーが発生する場合

```bash
# ローカルでビルドテスト
cd savings-app
npm run build
```

エラーが発生した場合は、エラーメッセージに従って修正してください。

### 環境変数が反映されない場合

1. Vercelダッシュボードで環境変数を確認
2. すべての環境（Production、Preview、Development）に設定されているか確認
3. 再デプロイを実行

### データベース接続エラーが発生する場合

1. Supabaseの環境変数が正しいか確認
2. SupabaseプロジェクトのAPI設定を確認
3. RLS（Row Level Security）ポリシーが正しく設定されているか確認

### LINE Webhookが動作しない場合

1. Webhook URLが正しいか確認（https://your-app.vercel.app/api/line-webhook）
2. LINE_CHANNEL_SECRETとLINE_CHANNEL_ACCESS_TOKENが正しいか確認
3. Vercelの「Functions」タブでAPIログを確認
4. LINE DevelopersコンソールでWebhook検証を実行

## 自動デプロイの設定

Vercelは自動的にGitHubと連携し、以下の動作をします：

- `main`ブランチへのプッシュ → 本番環境へ自動デプロイ
- その他のブランチへのプッシュ → プレビュー環境へ自動デプロイ
- プルリクエスト → プレビュー環境を自動作成

## カスタムドメインの設定（オプション）

1. Vercelダッシュボードで「Settings」→「Domains」を開く
2. 「Add」ボタンをクリック
3. 独自ドメインを入力
4. DNS設定に従ってドメインのレコードを追加
5. SSL証明書が自動的に発行されます

## モニタリングとログ

- **デプロイログ**: Vercelダッシュボードの「Deployments」タブ
- **実行時ログ**: 「Functions」タブで各APIエンドポイントのログを確認
- **アナリティクス**: 「Analytics」タブでアクセス統計を確認

## セキュリティのベストプラクティス

1. 環境変数は絶対にコードにコミットしない
2. Supabase Service Role Keyはサーバーサイド（API Routes）でのみ使用
3. RLSポリシーを必ず有効化
4. LINE Webhook署名検証を実装済み（実装済み）
5. 定期的に依存パッケージを更新

## 参考リンク

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Documentation](https://supabase.com/docs)
- [LINE Messaging API](https://developers.line.biz/ja/docs/messaging-api/)
