import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { Client, WebhookEvent, MessageEvent, TextMessage } from '@line/bot-sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const lineClient = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
});

// 署名検証
function validateSignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac('SHA256', process.env.LINE_CHANNEL_SECRET!)
    .update(body)
    .digest('base64');
  return hash === signature;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-line-signature') || '';

    // 署名検証
    if (!validateSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const events = JSON.parse(body).events as WebhookEvent[];

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        await handleMessage(event as MessageEvent);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('LINE Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleMessage(event: MessageEvent) {
  const lineUserId = event.source.userId;
  if (!lineUserId) return;

  const message = event.message as TextMessage;
  const text = message.text.trim();
  const replyToken = event.replyToken;

  // ユーザー取得
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('line_user_id', lineUserId)
    .single();

  // 連携コマンド処理
  if (text.startsWith('連携')) {
    await handleLinkCommand(text, lineUserId, replyToken);
    return;
  }

  // ヘルプコマンド
  if (text === 'ヘルプ' || text === '使い方') {
    await replyMessage(replyToken, getHelpMessage());
    return;
  }

  // 未連携の場合
  if (!user) {
    await replyMessage(
      replyToken,
      '⚠️ アプリとの連携が必要です\n\nアプリの設定画面から連携コードを取得し、「連携 [コード]」と送信してください'
    );
    return;
  }

  // 残高確認コマンド
  if (text === '残高' || text === '予算' || text === '確認') {
    await handleBalanceCheck(user.id, replyToken);
    return;
  }

  // 支出記録の処理
  await handleExpenseInput(text, user.id, replyToken);
}

// 連携コマンド処理
async function handleLinkCommand(text: string, lineUserId: string, replyToken: string) {
  const parts = text.split(/\s+/);
  if (parts.length < 2) {
    await replyMessage(
      replyToken,
      '❌ 連携コードを入力してください\n\n使い方: 連携 [コード]'
    );
    return;
  }

  const code = parts[1].toUpperCase();

  // 連携コードを検証
  const { data: linkCode } = await supabase
    .from('line_link_codes')
    .select('*')
    .eq('code', code)
    .eq('used', false)
    .single();

  if (!linkCode) {
    await replyMessage(
      replyToken,
      '❌ 無効な連携コードです\n\n・コードが間違っている\n・有効期限が切れている\n・既に使用済み\n\nアプリから新しいコードを取得してください'
    );
    return;
  }

  // 有効期限チェック
  if (new Date(linkCode.expires_at) < new Date()) {
    await replyMessage(
      replyToken,
      '❌ 連携コードの有効期限が切れています\n\nアプリから新しいコードを取得してください'
    );
    return;
  }

  // ユーザーにLINE IDを設定
  await supabase
    .from('users')
    .update({ line_user_id: lineUserId })
    .eq('id', linkCode.user_id);

  // 連携コードを使用済みにする
  await supabase
    .from('line_link_codes')
    .update({ used: true })
    .eq('code', code);

  await replyMessage(
    replyToken,
    '✅ アプリとの連携が完了しました！\n\n📝 使い方\n・金額を送信 → カテゴリ選択\n・「食費 1000」で直接記録\n・「残高」で予算確認'
  );
}

// 残高確認
async function handleBalanceCheck(userId: string, replyToken: string) {
  // 今月の開始日と終了日
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // カテゴリ取得（固定費以外）
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .eq('is_fixed', false)
    .order('display_order');

  if (!categories || categories.length === 0) {
    await replyMessage(replyToken, '⚠️ カテゴリが設定されていません');
    return;
  }

  // 今月の支出を取得
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startOfMonth.toISOString().split('T')[0])
    .lte('date', endOfMonth.toISOString().split('T')[0]);

  let message = '📊 今月の予算状況\n\n';
  let totalRemaining = 0;

  for (const category of categories) {
    const categoryExpenses = expenses?.filter(e => e.category_id === category.id) || [];
    const spent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = category.budget - spent;
    totalRemaining += remaining;

    const icon = getCategoryIcon(category.icon);
    message += `${icon} ${category.name}: ¥${remaining.toLocaleString()} / ¥${category.budget.toLocaleString()}\n`;
  }

  message += `\n💰 残り合計: ¥${totalRemaining.toLocaleString()}`;

  await replyMessage(replyToken, message);
}

// 支出入力処理
async function handleExpenseInput(text: string, userId: string, replyToken: string) {
  // パターン1: 金額のみ（例: "1500"）
  const amountOnlyMatch = text.match(/^(\d+)$/);
  if (amountOnlyMatch) {
    const amount = parseInt(amountOnlyMatch[1]);
    await askForCategory(userId, amount, replyToken);
    return;
  }

  // パターン2: カテゴリ + 金額（例: "食費 1500" or "1500 食費"）
  const withCategoryMatch = text.match(/(\d+)|([^\d\s]+)/g);
  if (withCategoryMatch && withCategoryMatch.length >= 2) {
    let amount: number | null = null;
    let categoryName: string | null = null;

    for (const part of withCategoryMatch) {
      if (/^\d+$/.test(part)) {
        amount = parseInt(part);
      } else {
        categoryName = part;
      }
    }

    if (amount && categoryName) {
      await recordExpenseWithCategory(userId, amount, categoryName, replyToken);
      return;
    }
  }

  // 不明な入力
  await replyMessage(
    replyToken,
    '❓ 入力内容が認識できませんでした\n\n使い方:\n・金額のみ: 1500\n・カテゴリ付き: 食費 1500\n・ヘルプ: 「ヘルプ」と送信'
  );
}

// カテゴリ選択を促す
async function askForCategory(userId: string, amount: number, replyToken: string) {
  // カテゴリ取得
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('display_order')
    .limit(10);

  if (!categories || categories.length === 0) {
    await replyMessage(replyToken, '⚠️ カテゴリが設定されていません');
    return;
  }

  await lineClient.replyMessage(replyToken, {
    type: 'text',
    text: `¥${amount.toLocaleString()}ですね💰\nカテゴリを選んでください`,
    quickReply: {
      items: categories.slice(0, 10).map(cat => ({
        type: 'action',
        action: {
          type: 'message',
          label: cat.name,
          text: `${cat.name} ${amount}`,
        },
      })),
    },
  });
}

// カテゴリ付きで支出を記録
async function recordExpenseWithCategory(
  userId: string,
  amount: number,
  categoryName: string,
  replyToken: string
) {
  // カテゴリを検索
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .ilike('name', `%${categoryName}%`)
    .single();

  if (!category) {
    await replyMessage(
      replyToken,
      `❌ カテゴリ「${categoryName}」が見つかりません\n\nアプリでカテゴリを確認してください`
    );
    return;
  }

  // 支出を記録
  const { error } = await supabase.from('expenses').insert({
    user_id: userId,
    category_id: category.id,
    amount: amount,
    date: new Date().toISOString().split('T')[0],
    input_source: 'line',
  });

  if (error) {
    await replyMessage(replyToken, '❌ 記録に失敗しました');
    return;
  }

  // 今月の該当カテゴリの支出合計を計算
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount')
    .eq('user_id', userId)
    .eq('category_id', category.id)
    .gte('date', startOfMonth.toISOString().split('T')[0]);

  const totalSpent = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
  const remaining = category.budget - totalSpent;

  const icon = getCategoryIcon(category.icon);
  await replyMessage(
    replyToken,
    `✅ ${category.name}に¥${amount.toLocaleString()}を記録しました\n\n📊 今月の${category.name}\n残り: ¥${remaining.toLocaleString()} / ¥${category.budget.toLocaleString()}`
  );
}

// メッセージ返信
async function replyMessage(replyToken: string, text: string) {
  try {
    await lineClient.replyMessage(replyToken, {
      type: 'text',
      text: text,
    });
  } catch (error) {
    console.error('Reply message error:', error);
  }
}

// ヘルプメッセージ
function getHelpMessage(): string {
  return `📝 使い方ガイド

【支出を記録】
・金額だけ送信: 1500
・カテゴリ付き: 食費 1500

【確認】
・残高 → 予算状況を表示

【連携】
・連携 [コード] → アプリと連携`;
}

// カテゴリアイコン取得
function getCategoryIcon(icon: string): string {
  const iconMap: Record<string, string> = {
    home: '🏠',
    utensils: '🍽️',
    'credit-card': '💳',
    'gamepad-2': '🎮',
    beer: '🍺',
    car: '🚗',
    train: '🚃',
    shopping: '🛒',
    heart: '❤️',
    book: '📚',
    phone: '📱',
    shirt: '👕',
  };
  return iconMap[icon] || '📝';
}
