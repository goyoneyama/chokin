'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // ユーザー登録
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError('登録に失敗しました。' + signUpError.message);
        return;
      }

      if (!authData.user) {
        setError('ユーザー登録に失敗しました。');
        return;
      }

      // usersテーブルにユーザー情報を登録
      const { error: insertError } = await supabase.from('users').insert({
        id: authData.user.id,
        email: authData.user.email!,
        display_name: displayName || null,
        monthly_income: 0,
      });

      if (insertError) {
        console.error('Error inserting user:', insertError);
        setError('ユーザー情報の登録に失敗しました。');
        return;
      }

      // 登録完了後、ログイン状態でホーム画面へ
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Signup error:', err);
      setError('エラーが発生しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>新規登録</CardTitle>
          <CardDescription>貯金管理アプリのアカウントを作成</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                6文字以上のパスワードを入力してください
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">表示名（任意）</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="山田 太郎"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登録中...' : '新規登録'}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              すでにアカウントをお持ちの方は{' '}
              <Link href="/login" className="text-primary hover:underline">
                ログイン
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
