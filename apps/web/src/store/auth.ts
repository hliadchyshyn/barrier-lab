import { create } from 'zustand';
import { authClient } from '../lib/authClient';

type User = { id: string; name: string; email: string; image?: string | null };

interface AuthStore {
  user: User | null;
  loading: boolean;
  checkSession: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,

  checkSession: async () => {
    const session = await authClient.getSession();
    set({ user: (session?.data?.user as User) ?? null, loading: false });
  },

  signOut: async () => {
    await authClient.signOut();
    set({ user: null });
  },
}));
