import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Token = any;

type TokenStore = {
  token: Token | null;
  setToken: (token: Token) => void;
  hydrateToken: () => Promise<void>;
  clearToken: () => void;
  _hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
};

// Helper functions for BigInt serialization
const replacer = (key: string, value: any) => {
  if (typeof value === 'bigint') {
    return `__BIGINT__${value.toString()}__BIGINT__`;
  }
  return value;
};

const reviver = (key: string, value: any) => {
  if (typeof value === 'string' && value.match(/^__BIGINT__.*__BIGINT__$/)) {
    return BigInt(value.replace(/__BIGINT__/g, ''));
  }
  return value;
};

export const useToken = create<TokenStore>()(
  persist(
    set => ({
      token: null,
      _hasHydrated: false,
      setToken: token => {
        console.log('🔥 Token being set/updated in Zustand store:', token ? 'Token available' : 'Token is null');
        set({ token });
      },
      clearToken: () => set({ token: null }),
      setHasHydrated: (hydrated: boolean) => {
        set({ _hasHydrated: hydrated });
      },
    }),
    {
      name: 'active-token-storage', // storage key
      storage: {
        getItem: async name => {
          try {
            const value = await AsyncStorage.getItem(name);
            console.log('📥 Loading token from storage:', value ? 'Token found' : 'No token');
            return value ? JSON.parse(value, reviver) : null;
          } catch (error) {
            console.error('❌ Error loading token:', error);
            return null;
          }
        },
        setItem: async (name, value) => {
          try {
            // Always persist the state, even if null (for proper logout)
            await AsyncStorage.setItem(name, JSON.stringify(value, replacer));
            console.log('💾 Token saved to storage:', value?.state?.token ? 'Token saved' : 'Token cleared');
          } catch (error) {
            console.error('❌ Error saving token:', error);
          }
        },
        removeItem: async name => {
          try {
            await AsyncStorage.removeItem(name);
            console.log('🗑️ Token removed from storage');
          } catch (error) {
            console.error('❌ Error removing token:', error);
          }
        },
      },
      onRehydrateStorage: () => (state) => {
        console.log('✅ Token store hydration complete');
        state?.setHasHydrated(true);
      },
    },
  ),
);
