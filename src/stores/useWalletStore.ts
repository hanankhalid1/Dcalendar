import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ActiveAccount = any;

type WalletStore = {
  wallet: ActiveAccount | null;
  setWallet: (account: ActiveAccount) => void;
  clearWallet: () => void;
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
