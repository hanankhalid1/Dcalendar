import { create } from 'zustand';

interface CalendarStore {
  // Shared selected date across views
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;

  // Header month label (merged from useMonthStore)
  currentMonth: string;
  setCurrentMonth: (month: string) => void;
  setCurrentMonthByIndex: (monthIndex: number) => void;
}

export const useCalendarStore = create<CalendarStore>(set => ({
  selectedDate: new Date(),
  setSelectedDate: (date: Date) => {
    const normalized = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      12,
      0,
      0,
      0,
    );
    set({ selectedDate: normalized });
  },

  currentMonth: (() => {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return monthNames[new Date().getMonth()];
  })(),
  setCurrentMonth: (month: string) => set({ currentMonth: month }),
  setCurrentMonthByIndex: (monthIndex: number) => {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    set({ currentMonth: monthNames[monthIndex] });
  },
}));


