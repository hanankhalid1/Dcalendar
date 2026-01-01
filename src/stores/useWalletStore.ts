import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ActiveAccount = any;

type WalletStore = {
  wallet: ActiveAccount | null;
  setWallet: (account: ActiveAccount) => void;
  clearWallet: () => void;
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

export const useWalletStore = create<WalletStore>()(
  persist(
    set => ({
      wallet: null,
      setWallet: wallet => set({ wallet }),
      clearWallet: () => set({ wallet: null }),
    }),
    {
      name: 'wallet', // storage key
      storage: {
        getItem: async name => {
          try {
            const value = await AsyncStorage.getItem(name);
            return value ? JSON.parse(value, reviver) : null;
          } catch (error) {
            console.error('❌ Error loading wallet:', error);
            return null;
          }
        },
        setItem: async (name, value) => {
          try {
            if (value === null || value === undefined) {
              await AsyncStorage.removeItem(name);
            } else {
              await AsyncStorage.setItem(name, JSON.stringify(value, replacer));
            }
          } catch (error) {
            console.error('❌ Error saving wallet:', error);
          }
        },
        removeItem: async name => {
          try {
            await AsyncStorage.removeItem(name);
          } catch (error) {
            console.error('❌ Error removing wallet:', error);
          }
        },
      },
    },
  ),
);
