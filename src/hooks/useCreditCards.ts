import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { CreditCard, CreditCardFormData } from '@/types/assets';

export function useCreditCards() {
  const { user } = useAuthStore();
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCreditCards = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (!error && data) {
        setCreditCards(data);
      }
    } catch (e) {
      console.error('Error fetching credit cards:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createCreditCard = async (data: CreditCardFormData): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase.from('credit_cards').insert({
        user_id: user.id,
        ...data,
      });

      if (!error) {
        await fetchCreditCards();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const updateCreditCard = async (
    id: string,
    data: Partial<CreditCardFormData>
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('credit_cards')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);

      if (!error) {
        await fetchCreditCards();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const deleteCreditCard = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('credit_cards')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user.id);

      if (!error) {
        await fetchCreditCards();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const getCreditCard = async (id: string): Promise<CreditCard | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('credit_cards')
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
    fetchCreditCards();
  }, [fetchCreditCards]);

  const totalBalance = creditCards.reduce((sum, card) => sum + card.current_balance, 0);
  const totalLimit = creditCards.reduce((sum, card) => sum + card.credit_limit, 0);

  return {
    creditCards,
    loading,
    totalBalance,
    totalLimit,
    createCreditCard,
    updateCreditCard,
    deleteCreditCard,
    getCreditCard,
    refresh: fetchCreditCards,
  };
}
