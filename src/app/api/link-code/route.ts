import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

export async function GET() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 6文字の連携コード生成
  const code = nanoid(6).toUpperCase();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分後

  // 既存のコードを無効化
  await supabase.from('line_link_codes').delete().eq('user_id', user.id);

  // 新しいコードを作成
  const { error } = await supabase.from('line_link_codes').insert({
    code,
    user_id: user.id,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    console.error('Error creating link code:', error);
    return NextResponse.json({ error: 'Failed to create link code' }, { status: 500 });
  }

  return NextResponse.json({ code, expiresAt: expiresAt.toISOString() });
}
