'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // PWAが既にインストール済みかチェック
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // インストールイベントをキャッチ
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // バナーを非表示にしたことがなければ表示
      const bannerDismissed = localStorage.getItem('pwa-banner-dismissed');
      if (!bannerDismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // インストール完了イベント
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;

    if (choiceResult.outcome === 'accepted') {
      console.log('PWA installed');
    }

    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  // インストールバナー（ホーム画面用）
  if (showInstallBanner && !isInstalled) {
    return (
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Smartphone className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-blue-900 mb-1">
                ホーム画面に追加
              </h3>
              <p className="text-sm text-blue-700 mb-3">
                アプリをインストールして、すぐにアクセスできるようにしましょう
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleInstallClick}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="mr-1" size={16} />
                  インストール
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                  className="text-blue-600"
                >
                  後で
                </Button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-blue-400 hover:text-blue-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 設定画面用のインストールセクション
  if (isInstalled) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-900 flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            アプリインストール済み
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-700">
            アプリがホーム画面にインストールされています。ありがとうございます！
          </p>
        </CardContent>
      </Card>
    );
  }

  if (deferredPrompt) {
    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            ホーム画面に追加
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-700 mb-4">
            アプリをインストールすると、ホーム画面から直接起動できて便利です。
          </p>
          <Button
            onClick={handleInstallClick}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Download className="mr-2" size={18} />
            今すぐインストール
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
