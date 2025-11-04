import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ActiveAccount = any;

type ActiveAccountStore = {
  account: ActiveAccount | null;
  setAccount: (account: ActiveAccount) => void;
  clearAccount: () => void;
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
