'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wallet, PieChart, Target, FileText, Settings } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'ホーム',
      href: '/',
      icon: Home,
      active: pathname === '/',
    },
    {
      label: '支出',
      href: '/expenses/new',
      icon: Wallet,
      active: pathname.startsWith('/expenses'),
    },
    {
      label: '予算',
      href: '/budget',
      icon: PieChart,
      active: pathname === '/budget' || pathname === '/categories',
    },
    {
      label: '目標',
      href: '/goals',
      icon: Target,
      active: pathname === '/goals' || pathname === '/simulation',
    },
    {
      label: 'レポート',
      href: '/reports',
      icon: FileText,
      active: pathname === '/reports',
    },
    {
      label: '設定',
      href: '/settings',
      icon: Settings,
      active: pathname === '/settings',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="container mx-auto max-w-4xl">
        <div className="grid grid-cols-6 gap-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 transition-colors active:bg-gray-100 ${
                  item.active
                    ? 'text-primary'
                    : 'text-gray-500'
                }`}
              >
                <Icon size={20} strokeWidth={item.active ? 2.5 : 2} />
                <span className="text-xs mt-0.5 font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
