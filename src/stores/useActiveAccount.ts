import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ActiveAccount = any;

type ActiveAccountStore = {
  account: ActiveAccount | null;
  setAccount: (account: ActiveAccount) => void;
  clearAccount: () => void;
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

export const useActiveAccount = create<ActiveAccountStore>()(
  persist(
    set => ({
      account: null,
      setAccount: account => set({ account }),
      clearAccount: () => set({ account: null }),
    }),
    {
      name: 'active-account-storage', // storage key
      storage: {
        getItem: async name => {
          try {
            const value = await AsyncStorage.getItem(name);
            console.log('📥 Loading account from storage:', value ? 'Account found' : 'No account');
            return value ? JSON.parse(value, reviver) : null;
          } catch (error) {
            console.error('❌ Error loading account:', error);
            return null;
          }
        },
        setItem: async (name, value) => {
          try {
            // Always persist the state, even if null (for proper logout)
            await AsyncStorage.setItem(name, JSON.stringify(value, replacer));
            console.log('💾 Account saved to storage:', value?.state?.account ? 'Account saved' : 'Account cleared');
          } catch (error) {
            console.error('❌ Error saving account:', error);
          }
        },
        removeItem: async name => {
          try {
            await AsyncStorage.removeItem(name);
            console.log('🗑️ Account removed from storage');
          } catch (error) {
            console.error('❌ Error removing account:', error);
          }
        },
      },
    },
  ),
);
