import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { BankAccount, BankAccountFormData } from '@/types/assets';

export function useBankAccounts() {
  const { user } = useAuthStore();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBankAccounts = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (!error && data) {
        setBankAccounts(data);
      }
    } catch (e) {
      console.error('Error fetching bank accounts:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createBankAccount = async (data: BankAccountFormData): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase.from('bank_accounts').insert({
        user_id: user.id,
        ...data,
      });

      if (!error) {
        await fetchBankAccounts();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const updateBankAccount = async (
    id: string,
    data: Partial<BankAccountFormData>
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);

      if (!error) {
        await fetchBankAccounts();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const deleteBankAccount = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user.id);

      if (!error) {
        await fetchBankAccounts();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const getBankAccount = async (id: string): Promise<BankAccount | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('bank_accounts')
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
    fetchBankAccounts();
  }, [fetchBankAccounts]);

  const totalBalance = bankAccounts.reduce((sum, acc) => sum + acc.current_balance, 0);

  return {
    bankAccounts,
    loading,
    totalBalance,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
    getBankAccount,
    refresh: fetchBankAccounts,
  };
}
