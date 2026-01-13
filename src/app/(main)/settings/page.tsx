'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InstallPWA } from '@/components/InstallPWA';
import { LogOut, User, Mail, FolderEdit, Wallet, ChevronRight, MessageCircle } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl pb-24">
      <h1 className="text-2xl font-bold mb-6">設定</h1>

      {/* ユーザー情報 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>ユーザー情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <User className="text-muted-foreground" size={20} />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">表示名</p>
              <p className="font-medium">{user?.display_name || '未設定'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Mail className="text-muted-foreground" size={20} />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">メールアドレス</p>
              <p className="font-medium">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* データ管理 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>データ管理</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link href="/categories">
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FolderEdit className="text-primary" size={20} />
                </div>
                <div className="text-left">
                  <p className="font-medium">カテゴリ管理</p>
                  <p className="text-xs text-muted-foreground">
                    カテゴリの追加・編集・削除
                  </p>
                </div>
              </div>
              <ChevronRight className="text-muted-foreground" size={20} />
            </Button>
          </Link>
          <Link href="/budget">
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <Wallet className="text-green-700" size={20} />
                </div>
                <div className="text-left">
                  <p className="font-medium">予算設定</p>
                  <p className="text-xs text-muted-foreground">
                    月収とカテゴリ別予算の設定
                  </p>
                </div>
              </div>
              <ChevronRight className="text-muted-foreground" size={20} />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* LINE連携 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>LINE連携</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link href="/settings/line">
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <MessageCircle className="text-green-700" size={20} />
                </div>
                <div className="text-left">
                  <p className="font-medium">LINE連携設定</p>
                  <p className="text-xs text-muted-foreground">
                    LINEで支出を簡単に記録
                  </p>
                </div>
              </div>
              <ChevronRight className="text-muted-foreground" size={20} />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* PWAインストール */}
      <div className="mb-6">
        <InstallPWA />
      </div>

      {/* アプリ情報 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>アプリについて</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">バージョン</span>
              <span className="font-medium">3.0.0 (Phase 3完了)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">開発モード</span>
              <span className="font-medium">
                {process.env.NODE_ENV === 'development' ? '有効' : '無効'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ログアウト */}
      <Button
        onClick={handleSignOut}
        variant="destructive"
        className="w-full"
        size="lg"
      >
        <LogOut className="mr-2" size={20} />
        ログアウト
      </Button>

      {/* 実装済み機能 */}
      <Card className="mt-6 bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-900">✅ 実装済み機能</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-green-800 mb-1">Phase 1</p>
              <ul className="text-sm text-green-700 list-disc list-inside space-y-1">
                <li>支出管理（記録・編集・削除）</li>
                <li>カテゴリ管理</li>
                <li>予算設定と残高管理</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-green-800 mb-1">Phase 2</p>
              <ul className="text-sm text-green-700 list-disc list-inside space-y-1">
                <li>貯金目標設定（1年・3年・5年・10年）</li>
                <li>積立NISAのシミュレーション</li>
                <li>長期展望（5年・7年・10年後）</li>
                <li>進捗表示とグラフ</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-green-800 mb-1">Phase 3</p>
              <ul className="text-sm text-green-700 list-disc list-inside space-y-1">
                <li>週間レポート（変動費のみ）</li>
                <li>月間・年間レポート</li>
                <li>カテゴリ別円グラフ</li>
                <li>PWA対応（オフライン・インストール）</li>
                <li>LINE Bot連携（支出の音声入力）</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 今後の予定 */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">📋 今後の予定</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-800 mb-2">
            Phase 4以降で以下の機能を追加予定です：
          </p>
          <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
            <li>目標達成通知機能</li>
            <li>データエクスポート機能（CSV/PDF）</li>
            <li>予算アラート機能</li>
            <li>支出カレンダー表示</li>
            <li>定期支出の自動記録</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
