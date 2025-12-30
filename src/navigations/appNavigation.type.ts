// navigation/appNavigation.type.ts
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export enum Screen {
  HomeScreen = 'HomeScreen',
  ScheduleScreen = 'ScheduleScreen',
  HelpScreen = 'HelpScreen',
  SendFeedbackScreen = 'SendFeedbackScreen',
  WeekScreen = 'WeekScreen',
  DailyCalendarScreen = 'DailyCalendarScreen',
  MonthlyCalenderScreen = 'MonthlyCalenderScreen',
  RemindersScreen = 'RemindersScreen',
  CreateTaskScreen = 'CreateTaskScreen',
  CreateEventScreen = 'CreateEventScreen',
  CreateOutOfOfficeScreen = 'CreateOutOfOfficeScreen',
  SettingsScreen = 'SettingsScreen',
  DeletedEventsScreen = 'DeletedEventsScreen',
  AboutAppScreen = 'AboutAppScreen',
  AppointmentScheduleScreen = 'AppointmentScheduleScreen',
}

export type RootStackParamList = {
  [Screen.HomeScreen]: undefined;
  [Screen.ScheduleScreen]: undefined;
  [Screen.WeekScreen]: undefined;
  [Screen.HelpScreen]: undefined;
  [Screen.SendFeedbackScreen]: undefined;
  [Screen.DailyCalendarScreen]: undefined;
  [Screen.MonthlyCalenderScreen]: undefined;
  [Screen.RemindersScreen]: undefined;
  [Screen.CreateTaskScreen]: undefined;
  [Screen.CreateEventScreen]: undefined;
  [Screen.CreateOutOfOfficeScreen]: undefined;
  [Screen.SettingsScreen]: { expandIntegration?: boolean } | undefined;
  [Screen.DeletedEventsScreen]: undefined;
  [Screen.AboutAppScreen]: undefined;
  [Screen.AppointmentScheduleScreen]: { appointmentId?: string; mode?: string } | undefined;
};

export type AppNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export type HomeScreenRoute = RouteProp<RootStackParamList, Screen.HomeScreen>;
export type HelpScreenRoute = RouteProp<RootStackParamList, Screen.HelpScreen>;
export type WeekScreenRoute = RouteProp<RootStackParamList, Screen.WeekScreen>;
export type DailyCalendarScreenRoute = RouteProp<RootStackParamList, Screen.DailyCalendarScreen>;
export type RemindersScreenRoute = RouteProp<RootStackParamList, Screen.RemindersScreen>;
