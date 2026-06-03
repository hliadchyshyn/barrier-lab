import { create } from 'zustand';
import { authClient } from '../lib/authClient';
import { api } from '../lib/apiClient';

type Role = 'athlete' | 'coach' | 'admin';
type User = { id: string; name: string; email: string; image?: string | null; role: Role };

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
    if (!session?.data?.user) {
      set({ user: null, loading: false });
      return;
    }
    const baseUser = session.data.user as Omit<User, 'role'>;
    try {
      const profile = await api.get<{ role: Role }>('/api/profile');
      set({ user: { ...baseUser, role: profile.role }, loading: false });
    } catch {
      set({ user: { ...baseUser, role: 'athlete' }, loading: false });
    }
  },

  signOut: async () => {
    await authClient.signOut();
    set({ user: null });
  },
}));
