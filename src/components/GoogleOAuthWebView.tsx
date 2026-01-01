import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Text,
  Modal,
  Linking,
  Alert,
  AppState,
} from 'react-native';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { useNavigation } from '@react-navigation/native';
import NcogIntegration from '../services/SimpleNcogIntegration';
import { handleNcogResponse } from '../utils/ncogHandler';

interface GoogleOAuthWebViewProps {
  authUrl: string;
  onSuccess?: (data: { accessToken?: string; refreshToken?: string; email?: string; name?: string; photo?: string }) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

const GoogleOAuthWebView: React.FC<GoogleOAuthWebViewProps> = ({
  authUrl,
  onSuccess,
  onError,
  onCancel,
}) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const browserClosedRef = useRef(false);
  const ncogIntegration = useRef(new NcogIntegration('DCalendar', 'dcalendar'));
  const deepLinkHandledRef = useRef(false);

  const handleDeepLink = (event: { url: string }) => {
    const url = event.url;
    console.log('🔗 Deep link received:', url);
    
    // Handle OAuth callback
    if (url.includes('oauth-callback') || url.includes('callback') || url.includes('success')) {
      console.log('✅ OAuth callback detected');
      browserClosedRef.current = true;
      InAppBrowser.close();
      handleCallbackUrl(url);
    }
    // Handle NCOG deep link (when user clicks button on dcalendar.ncog.earth page)
    // The button triggers ncog://connect... which opens the NCOG app
    else if (url.includes('ncog://') || url.startsWith('ncog://')) {
      console.log('✅ NCOG deep link received - opening NCOG app');
      browserClosedRef.current = true;
      InAppBrowser.close();
      
      // Try to open the NCOG app using the deep link
      Linking.openURL(url).catch((error) => {
        console.error('❌ Failed to open NCOG app via deep link:', error);
        // Fallback: try using connectToNcog
        ncogIntegration.current.connectToNcog().catch((ncogError) => {
          console.error('❌ Failed to open NCOG wallet:', ncogError);
          Alert.alert(
            'NCOG Wallet',
            'Please install the NCOG wallet app to complete the connection.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        });
      });
      // Don't navigate back yet - let NCOG app open
      // The app will return via dcalendar://ncog-response when done
    }
    // Handle NCOG response (when NCOG app returns after connection)
    else if (url.includes('ncog-response') || url.startsWith('dcalendar://ncog')) {
      console.log('✅ NCOG response received - connection completed');
      deepLinkHandledRef.current = true;
      browserClosedRef.current = true;
      InAppBrowser.close();
      
      // Use the existing handleNcogResponse function
      try {
        const result = handleNcogResponse(url);
        console.log('📦 NCOG response handling result:', result);
        
        if (result === true) {
          console.log('✅ NCOG wallet connected successfully');
          onSuccess?.({});
        } else {
          // Try to parse manually if handleNcogResponse doesn't return true
          const urlParts = url.split('?');
          if (urlParts.length > 1) {
            const queryString = urlParts[1];
            const params = new URLSearchParams(queryString);
            const success = params.get('success');
            
            if (success === 'true') {
              console.log('✅ NCOG wallet connected successfully (parsed manually)');
              onSuccess?.({});
            } else {
              const error = params.get('error') || 'Connection failed';
              console.error('❌ NCOG connection failed:', error);
              onError?.(error);
            }
          } else {
            // No query params, assume success
            console.log('✅ NCOG response received (no params) - assuming success');
            onSuccess?.({});
          }
        }
      } catch (err) {
        console.error('❌ Error handling NCOG response:', err);
        // Still call success if parsing fails - user might have connected
        onSuccess?.({});
      }
      navigation.goBack();
    } else {
      console.log('⚠️ Unknown deep link format:', url);
    }
  };

  const openBrowser = async () => {
    try {
      console.log('🌐 Opening browser with URL:', authUrl);
      if (await InAppBrowser.isAvailable()) {
        setLoading(true);
        
        // First, open with openAuth to handle OAuth flow
        // If we reach dcalendar.ncog.earth, we'll need to handle it differently
        const result = await InAppBrowser.openAuth(authUrl, 'dcalendar://oauth-callback', {
          // iOS options
          ephemeralWebSession: false,
          // Android options
          showTitle: false,
          enableUrlBarHiding: true,
          enableDefaultShare: false,
        });

        setLoading(false);
        browserClosedRef.current = true;

        console.log('InAppBrowser result:', result);

        if (result.type === 'success' && result.url) {
          // Check if URL contains error from backend
          if (result.url.includes('error') || result.url.includes('400')) {
            const urlParams = new URLSearchParams(result.url.split('?')[1] || '');
            const errorMsg = urlParams.get('error') || urlParams.get('message') || 'Backend callback error';
            onError?.(errorMsg);
            navigation.goBack();
          } 
          // If backend redirected to oauth-callback, handle it
          else if (result.url.includes('oauth-callback')) {
            handleCallbackUrl(result.url);
          } 
          // If redirected to dcalendar.ncog.earth/app, directly open NCOG app
          else if (result.url.includes('dcalendar.ncog.earth')) {
            console.log('✅ Reached dcalendar.ncog.earth - Google OAuth succeeded');
            // Mark Google OAuth as successful
            onSuccess?.({});
            
            // Close browser and directly open NCOG app
            browserClosedRef.current = true;
            InAppBrowser.close();
            
            // Wait a bit for browser to close, then open NCOG app
            setTimeout(async () => {
              try {
                console.log('🔄 Opening NCOG wallet app directly...');
                const canOpen = await Linking.canOpenURL('ncog://connect');
                console.log('📱 Can open NCOG app:', canOpen);
                
                if (canOpen) {
                  await ncogIntegration.current.connectToNcog();
                  console.log('✅ NCOG app opening request sent');
                  // Don't navigate back yet - let NCOG app open
                  // The app will return via dcalendar://ncog-response when done
                } else {
                  console.error('❌ NCOG app not installed or not available');
                  Alert.alert(
                    'NCOG Wallet Required',
                    'Please install the NCOG wallet app to complete the connection.',
                    [
                      { text: 'Cancel', onPress: () => navigation.goBack(), style: 'cancel' },
                      { text: 'OK', onPress: () => navigation.goBack() }
                    ]
                  );
                }
              } catch (ncogError) {
                console.error('❌ Failed to open NCOG wallet:', ncogError);
                Alert.alert(
                  'NCOG Wallet',
                  'Failed to open NCOG wallet app. Please try again.',
                  [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
              }
            }, 500);
          } else {
            handleCallbackUrl(result.url);
          }
        } else if (result.type === 'cancel') {
          onCancel?.();
          navigation.goBack();
        } else {
          // Browser closed - check if NCOG connection was triggered via deep link
          console.log('Browser closed - checking if NCOG connection was triggered');
          navigation.goBack();
        }
      } else {
        // Fallback to system browser
        const canOpen = await Linking.canOpenURL(authUrl);
        if (canOpen) {
          await Linking.openURL(authUrl);
          Alert.alert(
            'Complete in Browser',
            'Please complete the Google sign-in in your browser, then return to the app.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        } else {
          onError?.('Unable to open browser');
          navigation.goBack();
        }
      }
    } catch (error) {
      console.error('Browser error:', error);
      onError?.(String(error));
      setLoading(false);
      navigation.goBack();
    }
  };

  useEffect(() => {
    // Set up deep link listener FIRST, before opening browser
    console.log('🔧 Setting up deep link listener...');
    
    const handleDeepLinkEvent = (event: { url: string }) => {
      console.log('🔗 Deep link event received:', event.url);
      handleDeepLink(event);
    };
    
    const subscription = Linking.addEventListener('url', handleDeepLinkEvent);
    
    // Also check for initial URL (in case app was opened via deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🔗 Initial URL detected:', url);
        handleDeepLink({ url });
      }
    });
    
    // Listen for app state changes (when app comes back from background)
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('📱 App became active - checking for pending deep links...');
        Linking.getInitialURL().then((url) => {
          if (url && !deepLinkHandledRef.current) {
            console.log('🔗 Found pending deep link:', url);
            handleDeepLink({ url });
          }
        });
      }
    });
    
    // Open browser after listener is set up
    openBrowser();
    
    return () => {
      subscription.remove();
      appStateSubscription.remove();
      if (!browserClosedRef.current) {
        InAppBrowser.close();
      }
    };
  }, []);

  const handleCallbackUrl = async (url: string) => {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      
      const accessToken = params.get('access_token') || params.get('token');
      const refreshToken = params.get('refresh_token');
      const error = params.get('error');
      const code = params.get('code');
      
      if (error) {
        onError?.(params.get('error_description') || error);
        navigation.goBack();
        return;
      }
      
      // If OAuth succeeded (we have token or code), trigger NCOG wallet connection immediately
      if (accessToken || code) {
        // Close browser first
        InAppBrowser.close();
        
        // Call success callback first
        onSuccess?.({
          accessToken: accessToken || undefined,
          refreshToken: refreshToken || undefined,
        });
        
        // Immediately trigger NCOG wallet connection
        try {
          console.log('Google OAuth succeeded - triggering NCOG wallet connection...');
          await ncogIntegration.current.connectToNcog();
          navigation.goBack();
        } catch (ncogError) {
          console.error('Failed to open NCOG wallet:', ncogError);
          // Still navigate back - wallet connection can be done later
          navigation.goBack();
        }
        return;
      }
      
      // If URL indicates success (but no token/code), still trigger NCOG connection
      if (url.includes('success') || url.includes('connected')) {
        InAppBrowser.close();
        onSuccess?.({});
        
        // Trigger NCOG wallet connection
        try {
          console.log('OAuth completed - triggering NCOG wallet connection...');
          await ncogIntegration.current.connectToNcog();
        } catch (ncogError) {
          console.error('Failed to open NCOG wallet:', ncogError);
        }
        navigation.goBack();
      }
    } catch (err) {
      console.error('Error parsing callback:', err);
    }
  };

  return (
    <Modal
      visible={true}
      animationType="fade"
      transparent={true}
      onRequestClose={() => {
        onCancel?.();
        navigation.goBack();
      }}
    >
      <SafeAreaView style={styles.container}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4285F4" />
            <Text style={styles.loadingText}>Opening browser...</Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

export default GoogleOAuthWebView;
