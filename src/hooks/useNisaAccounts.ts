import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { NisaAccount, NisaAccountFormData } from '@/types/assets';

export function useNisaAccounts() {
  const { user } = useAuthStore();
  const [nisaAccounts, setNisaAccounts] = useState<NisaAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNisaAccounts = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('nisa_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (!error && data) {
        setNisaAccounts(data);
      }
    } catch (e) {
      console.error('Error fetching NISA accounts:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createNisaAccount = async (data: NisaAccountFormData): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase.from('nisa_accounts').insert({
        user_id: user.id,
        ...data,
      });

      if (!error) {
        await fetchNisaAccounts();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const updateNisaAccount = async (
    id: string,
    data: Partial<NisaAccountFormData>
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('nisa_accounts')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);

      if (!error) {
        await fetchNisaAccounts();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const deleteNisaAccount = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('nisa_accounts')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user.id);

      if (!error) {
        await fetchNisaAccounts();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const getNisaAccount = async (id: string): Promise<NisaAccount | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('nisa_accounts')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        return data;
      }
      return null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    fetchNisaAccounts();
  }, [fetchNisaAccounts]);

  const totalValue = nisaAccounts.reduce((sum, acc) => sum + acc.current_value, 0);
  const totalInvested = nisaAccounts.reduce((sum, acc) => sum + acc.total_invested, 0);
  const gainLoss = totalValue - totalInvested;
  const gainLossPercent = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;

  return {
    nisaAccounts,
    loading,
    totalValue,
    totalInvested,
    gainLoss,
    gainLossPercent,
    createNisaAccount,
    updateNisaAccount,
    deleteNisaAccount,
    getNisaAccount,
    refresh: fetchNisaAccounts,
  };
}
