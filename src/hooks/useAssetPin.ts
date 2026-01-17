import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useAssetPinStore } from '@/store/useAssetPinStore';
import { hashPin, verifyPin } from '@/lib/pin';

export function useAssetPin() {
  const { user } = useAuthStore();
  const { isPinSet, isUnlocked, setIsPinSet, unlock, lock } = useAssetPinStore();
  const [loading, setLoading] = useState(true);

  // Check if PIN is set
  const checkPinStatus = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('asset_pin')
        .select('id')
        .eq('user_id', user.id)
        .single();

      setIsPinSet(!error && !!data);
    } catch {
      setIsPinSet(false);
    } finally {
      setLoading(false);
    }
  }, [user, setIsPinSet]);

  // Set new PIN
  const setPin = async (pin: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const pin_hash = await hashPin(pin);
      const { error } = await supabase
        .from('asset_pin')
        .upsert({
          user_id: user.id,
          pin_hash,
        });

      if (!error) {
        setIsPinSet(true);
        unlock();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Verify PIN
  const verifyPinInput = async (pin: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('asset_pin')
        .select('pin_hash')
        .eq('user_id', user.id)
        .single();

      if (error || !data) return false;

      const isValid = await verifyPin(pin, data.pin_hash);
      if (isValid) {
        unlock();
      }
      return isValid;
    } catch {
      return false;
    }
  };

  // Change PIN
  const changePin = async (currentPin: string, newPin: string): Promise<boolean> => {
    if (!user) return false;

    // First verify the current PIN
    const isCurrentValid = await verifyPinInput(currentPin);
    if (!isCurrentValid) return false;

    // Then set the new PIN
    return setPin(newPin);
  };

  // Remove PIN
  const removePin = async (currentPin: string): Promise<boolean> => {
    if (!user) return false;

    // First verify the current PIN
    try {
      const { data, error } = await supabase
        .from('asset_pin')
        .select('pin_hash')
        .eq('user_id', user.id)
        .single();

      if (error || !data) return false;

      const isValid = await verifyPin(currentPin, data.pin_hash);
      if (!isValid) return false;

      // Delete the PIN
      const { error: deleteError } = await supabase
        .from('asset_pin')
        .delete()
        .eq('user_id', user.id);

      if (!deleteError) {
        setIsPinSet(false);
        lock();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    checkPinStatus();
  }, [checkPinStatus]);

  return {
    isPinSet,
    isUnlocked,
    loading,
    setPin,
    verifyPin: verifyPinInput,
    changePin,
    removePin,
    lock,
    refresh: checkPinStatus,
  };
}
