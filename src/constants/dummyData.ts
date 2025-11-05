import React from 'react';

export const guestData = [
  {
    id: '1',
    name: 'Aryan A.u',
    username: 'aryan',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: '2',
    name: 'Olivia kindu.u',
    username: 'olivia_djh',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: '3',
    name: 'Erin Turcotte',
    username: 'kj_kga',
    avatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: '4',
    name: 'Arlene McCoy',
    username: 'michel',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: '5',
    name: 'Savannah Nguyen',
    username: 'sana_12',
    avatar: null, // Will show initials
  },
];

export const timezones = [
  { id: 'UTC', name: 'UTC', offset: 'GMT+00:00' },
  { id: 'America/New_York', name: 'Eastern Time', offset: 'GMT-05:00' },
  { id: 'America/Chicago', name: 'Central Time', offset: 'GMT-06:00' },
  { id: 'America/Denver', name: 'Mountain Time', offset: 'GMT-07:00' },
  { id: 'America/Los_Angeles', name: 'Pacific Time', offset: 'GMT-08:00' },
  { id: 'Europe/London', name: 'London', offset: 'GMT+00:00' },
  { id: 'Europe/Paris', name: 'Paris', offset: 'GMT+01:00' },
  { id: 'Europe/Berlin', name: 'Berlin', offset: 'GMT+01:00' },
  { id: 'Asia/Tokyo', name: 'Tokyo', offset: 'GMT+09:00' },
  { id: 'Asia/Shanghai', name: 'Shanghai', offset: 'GMT+08:00' },
  { id: 'Asia/Kolkata', name: 'Mumbai, Kolkata', offset: 'GMT+05:30' },
  { id: 'Asia/Karachi', name: 'Karachi', offset: 'GMT+05:00' },
  { id: 'Asia/Dubai', name: 'Dubai', offset: 'GMT+04:00' },
  { id: 'Australia/Sydney', name: 'Sydney', offset: 'GMT+10:00' },
  { id: 'Pacific/Auckland', name: 'Auckland', offset: 'GMT+12:00' },
  { id: 'America/Sao_Paulo', name: 'São Paulo', offset: 'GMT-03:00' },
  { id: 'America/Toronto', name: 'Toronto', offset: 'GMT-05:00' },
  { id: 'Europe/Moscow', name: 'Moscow', offset: 'GMT+03:00' },
  { id: 'Asia/Seoul', name: 'Seoul', offset: 'GMT+09:00' },
  { id: 'Asia/Bangkok', name: 'Bangkok', offset: 'GMT+07:00' },
];

export const eventTypes = [
  { id: '1', name: 'Event', icon: '✓' },
  { id: '2', name: 'Task', icon: '' },
  { id: '3', name: 'Out of office', icon: '' },
  { id: '4', name: 'Birthday', icon: '' },
  { id: '5', name: 'Working Location', icon: '' },
  { id: '6', name: 'Appointment', icon: '' },
];

export const recurrenceOptions = [
  'Does not repeat',
  'Daily',
  'Weekly on Thursday',
  'Monthly on the first Thursday',
  'Monthly on the last Thursday',
  'Annually on September 4',
  'Every Weekday (Monday to Friday)',
  'Custom...',
];

export const dayAbbreviations = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const dayNames = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
