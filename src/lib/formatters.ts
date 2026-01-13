import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * 金額をフォーマット（¥1,234形式）
 */
export function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`;
}

/**
 * 金額をフォーマット（1,234円形式）
 */
export function formatAmount(amount: number): string {
  return `${amount.toLocaleString('ja-JP')}円`;
}

/**
 * 金額を短縮形式でフォーマット（1.2万、123万など）
 */
export function formatCurrencyShort(amount: number): string {
  if (amount >= 10000) {
    const man = amount / 10000;
    return `¥${man.toFixed(1)}万`;
  }
  return formatCurrency(amount);
}

/**
 * 日付をフォーマット（2026年1月12日形式）
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'yyyy年M月d日', { locale: ja });
}

/**
 * 日付を短縮形式でフォーマット（1/12形式）
 */
export function formatDateShort(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'M/d');
}

/**
 * 月をフォーマット（2026年1月形式）
 */
export function formatMonth(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'yyyy年M月', { locale: ja });
}

/**
 * 週をフォーマット（1/13〜1/19形式）
 */
export function formatWeek(date: Date = new Date()): string {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // 月曜始まり
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  return `${format(weekStart, 'M/d')}〜${format(weekEnd, 'M/d')}`;
}

/**
 * 週をフォーマット（詳細版：2026年1月13日〜1月19日形式）
 */
export function formatWeekDetail(date: Date = new Date()): string {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  return `${format(weekStart, 'yyyy年M月d日', { locale: ja })}〜${format(weekEnd, 'M月d日', { locale: ja })}`;
}

/**
 * 曜日付き日付をフォーマット（2026年1月12日（日）形式）
 */
export function formatDateWithDay(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'yyyy年M月d日（E）', { locale: ja });
}

/**
 * ISO形式の日付文字列を取得（YYYY-MM-DD）
 */
export function toISODateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * パーセンテージをフォーマット
 */
export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${Math.round(percentage)}%`;
}

/**
 * 残高の色を取得（プラスは青、マイナスは赤）
 */
export function getRemainingColor(remaining: number): string {
  if (remaining > 0) return 'text-blue-600';
  if (remaining < 0) return 'text-red-600';
  return 'text-gray-600';
}

/**
 * プログレスバーの色を取得（使用率に応じて）
 */
export function getProgressColor(percentage: number): string {
  if (percentage <= 50) return 'bg-green-500';
  if (percentage <= 75) return 'bg-yellow-500';
  if (percentage <= 90) return 'bg-orange-500';
  return 'bg-red-500';
}
