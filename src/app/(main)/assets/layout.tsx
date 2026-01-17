'use client';

import { useAssetPin } from '@/hooks/useAssetPin';
import { PinEntry } from '@/components/assets/PinEntry';
import { PinSetup } from '@/components/assets/PinSetup';

export default function AssetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isPinSet, isUnlocked, loading } = useAssetPin();

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-md pb-24 min-h-screen flex flex-col justify-center">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // First time: prompt to set PIN
  if (!isPinSet) {
    return <PinSetup />;
  }

  // PIN is set but not unlocked: show PIN entry
  if (!isUnlocked) {
    return <PinEntry />;
  }

  // Unlocked: show content
  return <>{children}</>;
}
