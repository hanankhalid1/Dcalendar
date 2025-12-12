import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import WeekScreen from '../screens/WeekScreen';
import DailyCalendarScreen from '../screens/DailyCalendarScreen';
import RemindersScreen from '../screens/RemindersScreen';
import MonthlyCalenderScreen from '../screens/MonthlyCalenderScreen';
import CreateTaskScreen from '../screens/CreateTaskScreen';
import CreateEventScreen from '../screens/CreateEventScreen';
import CreateOutOfOfficeScreen from '../screens/CreateOutOfOfficeScreen';
import AppointmentScheduleScreen from '../screens/AppointmentScheduleScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SignInScreen from '../screens/SignInScreen';
import WalletScreen from '../screens/wallet/WalletScreen';
import AccountSelection from '../screens/wallet/AccountSelection';
import HelpScreen from '../screens/HelpScreen';
import DeletedEventsScreen from '../screens/DeletedEventsScreen';

const Stack = createNativeStackNavigator();

// 🔹 Stack Navigator (for Main App Screens)
const StackNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Wallet">
      <Stack.Screen
        name="SignInScreen"
        component={SignInScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HomeScreen"
        component={MonthlyCalenderScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="HelpScreen"
        component={HelpScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WeekScreen"
        component={WeekScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DailyCalendarScreen"
        component={DailyCalendarScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MonthlyCalenderScreen"
        component={MonthlyCalenderScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ScheduleScreen"
        component={ScheduleScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RemindersScreen"
        component={RemindersScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateTaskScreen"
        component={CreateTaskScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateEventScreen"
        component={CreateEventScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateOutOfOfficeScreen"
        component={CreateOutOfOfficeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AppointmentScheduleScreen"
        component={AppointmentScheduleScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SettingsScreen"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DeletedEventsScreen"
        component={DeletedEventsScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="Wallet"
        component={WalletScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="account"
        component={AccountSelection}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

// 🔹 Root Navigation
const AppNavigation = () => {
  return <StackNavigator />;
};

export default AppNavigation;
