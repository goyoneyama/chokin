import { create } from 'zustand';

interface AssetPinState {
  isPinSet: boolean;
  isUnlocked: boolean;

  setIsPinSet: (value: boolean) => void;
  unlock: () => void;
  lock: () => void;
  reset: () => void;
}

export const useAssetPinStore = create<AssetPinState>((set) => ({
  isPinSet: false,
  isUnlocked: false,

  setIsPinSet: (value) => set({ isPinSet: value }),

  unlock: () => set({ isUnlocked: true }),

  lock: () => set({ isUnlocked: false }),

  reset: () => set({ isPinSet: false, isUnlocked: false }),
}));
