'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LineSettingsPage() {
  const router = useRouter();
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLinked, setIsLinked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    checkLinkStatus();
  }, []);

  useEffect(() => {
    if (!expiresAt) return;

    const timer = setInterval(() => {
      const now = new Date();
      const expires = new Date(expiresAt);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setLinkCode(null);
        setExpiresAt(null);
        setTimeRemaining('');
        clearInterval(timer);
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  async function checkLinkStatus() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.from('users').select('line_user_id').eq('id', user.id).single();

    setIsLinked(!!data?.line_user_id);
  }

  async function generateLinkCode() {
    setIsLoading(true);
    try {
      const response = await fetch('/api/link-code');
      if (!response.ok) throw new Error('Failed to generate link code');

      const data = await response.json();
      setLinkCode(data.code);
      setExpiresAt(data.expiresAt);
    } catch (error) {
      console.error('Error generating link code:', error);
      alert('連携コードの生成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }

  async function unlinkLine() {
    if (!confirm('LINE連携を解除しますか？')) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('users')
      .update({ line_user_id: null })
      .eq('id', user.id);

    if (error) {
      console.error('Error unlinking LINE:', error);
      alert('連携解除に失敗しました');
      return;
    }

    setIsLinked(false);
    alert('LINE連携を解除しました');
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mr-2">
          ←
        </Button>
        <h1 className="text-2xl font-bold">LINE連携設定</h1>
      </div>

      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">LINE連携について</h2>
        <p className="text-gray-600 mb-4">
          LINEと連携すると、LINEでメッセージを送るだけで支出を記録できます。
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
          <li>金額を送信してカテゴリを選択</li>
          <li>「食費 1500」で直接記録</li>
          <li>「残高」で予算状況を確認</li>
        </ul>
      </Card>

      {isLinked ? (
        <Card className="p-6 bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-700 mb-2">✅ 連携済み</h3>
              <p className="text-gray-600">LINEとの連携が完了しています</p>
            </div>
            <Button variant="destructive" onClick={unlinkLine}>
              連携解除
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">連携手順</h3>
          <ol className="list-decimal list-inside space-y-3 mb-6 text-gray-600">
            <li>下のボタンをタップして連携コードを生成</li>
            <li>
              LINE公式アカウント「貯金管理アプリ」を友だち追加
              <br />
              <a
                href="https://line.me/R/ti/p/@your-line-bot-id"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline ml-4"
              >
                友だち追加はこちら
              </a>
            </li>
            <li>LINEで「連携 [コード]」と送信</li>
          </ol>

          {linkCode ? (
            <div className="bg-blue-50 p-6 rounded-lg mb-4">
              <p className="text-sm text-gray-600 mb-2">連携コード（10分間有効）</p>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-blue-600 tracking-wider">{linkCode}</p>
                <div className="text-right">
                  <p className="text-sm text-gray-500">残り時間</p>
                  <p className="text-2xl font-bold text-red-600">{timeRemaining}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                LINEで「連携 {linkCode}」と送信してください
              </p>
            </div>
          ) : (
            <Button onClick={generateLinkCode} disabled={isLoading} className="w-full">
              {isLoading ? '生成中...' : '連携コードを生成'}
            </Button>
          )}
        </Card>
      )}

      <Card className="p-6 mt-6 bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">使い方</h3>
        <div className="space-y-4 text-sm text-gray-600">
          <div>
            <p className="font-semibold text-gray-800 mb-1">金額のみ送信</p>
            <p className="bg-white p-2 rounded">例: 1500</p>
            <p className="mt-1">→ カテゴリを選択するボタンが表示されます</p>
          </div>
          <div>
            <p className="font-semibold text-gray-800 mb-1">カテゴリ付きで送信</p>
            <p className="bg-white p-2 rounded">例: 食費 1500</p>
            <p className="mt-1">→ 即座に記録されます</p>
          </div>
          <div>
            <p className="font-semibold text-gray-800 mb-1">残高確認</p>
            <p className="bg-white p-2 rounded">「残高」「予算」「確認」のいずれか</p>
            <p className="mt-1">→ 今月の予算状況が表示されます</p>
          </div>
          <div>
            <p className="font-semibold text-gray-800 mb-1">ヘルプ</p>
            <p className="bg-white p-2 rounded">「ヘルプ」「使い方」</p>
            <p className="mt-1">→ 使い方ガイドが表示されます</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
