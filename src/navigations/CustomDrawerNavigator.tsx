import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { moderateScale, scaleWidth, screenHeight } from '../utils/dimensions';
import { colors, shadows } from '../utils/LightTheme';
import HomeScreen from '../screens/HomeScreen';
import DrawerContent from '../components/DrawerContent';

const Drawer = createDrawerNavigator();

const CustomDrawerNavigator = () => {
  return (
    <Drawer.Navigator
      initialRouteName="HomeScreen"
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: scaleWidth(260),
          height: screenHeight,
          backgroundColor: colors.drawerBackground,
          ...shadows.lg,
        },
        drawerType: 'front',
        overlayColor: 'rgba(0, 0, 0, 0.5)',
      }}
    >
      <Drawer.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{
          drawerLabel: 'Home',
        }}
      />
    </Drawer.Navigator>
  );
};

export default CustomDrawerNavigator;
