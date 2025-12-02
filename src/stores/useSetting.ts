import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Define Type for State and Actions
export type SettingsStore = {
  // ====== State ======
  selectedDay: string;
  selectedTheme: 'system' | 'light' | 'dark';
  selectedTimeZone: 'ist' | 'utc' | 'est' | 'pst';
  showCompletedEvents: boolean;
  showDeclinedEvents: boolean;
  calendarNotifications: boolean;
  taskNotifications: boolean;
  birthdayNotifications: boolean;
  taskOverdueNotification: boolean;

  // ====== Actions ======
  setSelectedDay: (day: string) => void;
  setSelectedTheme: (theme: 'system' | 'light' | 'dark') => void;
  setSelectedTimeZone: (timeZone: 'ist' | 'utc' | 'est' | 'pst') => void;
  toggleShowCompletedEvents: () => void;
  toggleShowDeclinedEvents: () => void;
  toggleCalendarNotifications: () => void;
  toggleTaskNotifications: () => void;
  toggleBirthdayNotifications: () => void;
  toggleTaskOverdueNotification: () => void;
};

// ✅ Create Zustand Store
export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      // ====== Default State ======
      selectedDay: 'Sunday',
      selectedTheme: 'system',
      selectedTimeZone: 'ist',
      showCompletedEvents: true,
      showDeclinedEvents: false,
      calendarNotifications: true,
      taskNotifications: true,
      birthdayNotifications: true,
      taskOverdueNotification: false,

      // ====== Actions ======
      setSelectedDay: (day) => set({ selectedDay: day }),
      setSelectedTheme: (theme) => set({ selectedTheme: theme }),
      setSelectedTimeZone: (timeZone) => set({ selectedTimeZone: timeZone }),

      toggleShowCompletedEvents: () =>
        set((state) => ({ showCompletedEvents: !state.showCompletedEvents })),

      toggleShowDeclinedEvents: () =>
        set((state) => ({ showDeclinedEvents: !state.showDeclinedEvents })),

      toggleCalendarNotifications: () =>
        set((state) => ({ calendarNotifications: !state.calendarNotifications })),

      toggleTaskNotifications: () =>
        set((state) => ({ taskNotifications: !state.taskNotifications })),

      toggleBirthdayNotifications: () =>
        set((state) => ({ birthdayNotifications: !state.birthdayNotifications })),

      toggleTaskOverdueNotification: () =>
        set((state) => ({ taskOverdueNotification: !state.taskOverdueNotification })),
    }),
    {
      name: 'settings-storage', // Key in AsyncStorage
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
    }
  )
);
