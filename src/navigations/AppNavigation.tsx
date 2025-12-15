import React, { useEffect, useState } from 'react';
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
import AboutApp from '../components/AboutApp';
import { useToken } from '../stores/useTokenStore';
import { useActiveAccount } from '../stores/useActiveAccount';

const Stack = createNativeStackNavigator();

// 🔹 Stack Navigator (for Main App Screens)
const StackNavigator = ({ initialRoute }: { initialRoute: string }) => {
  return (
    <Stack.Navigator initialRouteName={initialRoute}>
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
        name="AboutAppScreen"
        component={AboutApp}
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
  const token = useToken(state => state.token);
  const account = useActiveAccount(state => state.account);
  const tokenHydrated = useToken(state => state._hasHydrated);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for stores to fully hydrate before showing UI
    const timer = setTimeout(() => {
      console.log(
        '🔍 App startup - Token:',
        token ? 'exists' : 'null',
        'Account:',
        account ? 'exists' : 'null',
        'Hydrated:',
        tokenHydrated,
      );
      setIsLoading(false);
    }, 800); // Increased delay to ensure hydration completes

    return () => clearTimeout(timer);
  }, [token, account, tokenHydrated]);

  // Show nothing while checking login status
  if (isLoading) {
    return null;
  }

  // If both token and account exist, user is logged in - go to home
  // Otherwise, go to Wallet screen
  const initialRoute = token && account ? 'MonthlyCalenderScreen' : 'Wallet';

  console.log('📍 Initial route:', initialRoute);

  return <StackNavigator initialRoute={initialRoute} />;
};

export default AppNavigation;
