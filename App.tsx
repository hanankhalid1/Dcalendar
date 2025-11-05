import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigation from './src/navigations/AppNavigation';
import ToastProvider from './src/hooks/useToast';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { handleNcogResponse } from './src/utils/ncogHandler';

const App = () => {
  // Global deep link listener for Ncog wallet responses
  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('🔗 [App] Received deep link:', url);
      handleNcogResponse(url);
    });

    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then(initialUrl => {
      if (initialUrl) {
        console.log('🔗 [App] Initial URL:', initialUrl);
        handleNcogResponse(initialUrl);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent={true}
        />
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
          <ToastProvider>
            <NavigationContainer>
              <AppNavigation />
            </NavigationContainer>
          </ToastProvider>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;

const styles = StyleSheet.create({});
