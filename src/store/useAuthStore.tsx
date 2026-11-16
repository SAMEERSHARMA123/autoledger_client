import { create } from 'zustand';
import { api } from '@/lib/axios';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // शुरुआती लोडिंग स्टेट ताकि पेज रीफ्रेश पर फ्लिकर न हो
  
  // अब यूज़र सेट होते ही isAuthenticated भी तुरंत true हो जाएगा
  setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),
  
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error(error);
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
      window.location.href = '/login'; // या आपका जो भी auth रूट है
    }
  },
  
  checkAuth: async () => {
    try {
      const { data } = await api.get('/auth/profile');
      set({
        user: {
          id: data._id || data.id,
          name: data.name,
          email: data.email,
          avatar: data.avatar,
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  }
}));
