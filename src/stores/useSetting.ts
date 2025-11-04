import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  taskOverdueNotification: boolean;

  // ====== Actions ======
  setSelectedDay: (day: string) => void;
  setSelectedTheme: (theme: 'system' | 'light' | 'dark') => void;
  setSelectedTimeZone: (timeZone: 'ist' | 'utc' | 'est' | 'pst') => void;
  toggleShowCompletedEvents: () => void;
  toggleShowDeclinedEvents: () => void;
  toggleCalendarNotifications: () => void;
  toggleTaskNotifications: () => void;
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

      toggleTaskOverdueNotification: () =>
        set((state) => ({ taskOverdueNotification: !state.taskOverdueNotification })),
    }),
    {
      name: 'settings-storage', // Key in AsyncStorage
    }
  )
);
