import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Text } from 'react-native';
import { moderateScale, scaleWidth, screenHeight } from '../utils/dimensions';
import { colors, shadows } from '../utils/LightTheme';
import HomeScreen from '../screens/HomeScreen';

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      initialRouteName="HomeScreen"
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: scaleWidth(260),
          height: screenHeight,
          backgroundColor: colors.drawerBackground,
          ...shadows.lg,
        },
        drawerLabelStyle: {
          color: colors.white,
          fontSize: moderateScale(16),
          fontWeight: '500',
        },
        drawerActiveBackgroundColor: colors.primary,
        drawerActiveTintColor: colors.white,
        drawerInactiveTintColor: colors.white,
        drawerItemStyle: {
          marginHorizontal: moderateScale(8),
          borderRadius: moderateScale(8),
          marginVertical: moderateScale(2),
        },
      }}
    >
      <Drawer.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{
          drawerLabel: 'Home',
          drawerIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🏠</Text>
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
