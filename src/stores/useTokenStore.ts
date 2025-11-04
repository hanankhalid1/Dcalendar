import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Token = any;

type TokenStore = {
  token: Token | null;
  setToken: (token: Token) => void;
  hydrateToken: () => Promise<void>;
  clearToken: () => void;
};

export const useToken = create<TokenStore>()(
  persist(
    set => ({
      token: null,
      setToken: token => {
        console.log('🔥 Token being set/updated in Zustand store:', token ? 'Token available' : 'Token is null');
        set({ token });
      },
      clearToken: () => set({ token: null }),
    }),
    {
      name: 'active-token-storage', // storage key
      storage: {
        getItem: async name => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          if (value === null || value === undefined) {
            await AsyncStorage.removeItem(name);
          } else {
            await AsyncStorage.setItem(name, JSON.stringify(value));
          }
        },

        removeItem: async name => {
          await AsyncStorage.removeItem(name);
        },
      },
    },
  ),
);
