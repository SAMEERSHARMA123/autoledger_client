import { create } from 'zustand';
import { api } from '@/lib/axios';

interface User {
  id: string;
  name : string,
  email: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  
  setAccessToken: (token) => set({ accessToken: token, isAuthenticated: true }),
  
  setUser: (user) => set({ user }),
  
  logout: () => {
    set({ user: null, accessToken: null, isAuthenticated: false });
    api.post('/auth/logout').catch(console.error); 
  },
  
  checkAuth: async () => {
  try {
    const { data } = await api.get('/auth/profile');
    set({
      user: {
        id: data._id || data.id,
        name: data.name,
        email: data.email,
      },
      isAuthenticated: true,
    });
  } catch {
    set({ user: null, isAuthenticated: false });
  }
}

}));