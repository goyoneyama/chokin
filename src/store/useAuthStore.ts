import { create } from 'zustand';
import { User } from '@/types';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  fetchUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),

  fetchUser: async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        // usersテーブルからユーザー情報を取得
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (error) {
          console.error('Error fetching user:', error);
          set({ user: null, loading: false });
          return;
        }

        set({ user: userData, loading: false });
      } else {
        set({ user: null, loading: false });
      }
    } catch (error) {
      console.error('Error in fetchUser:', error);
      set({ user: null, loading: false });
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  },
}));
