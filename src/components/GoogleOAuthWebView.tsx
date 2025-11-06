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
} from 'react-native';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { useNavigation } from '@react-navigation/native';
import NcogIntegration from '../services/SimpleNcogIntegration';

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

  useEffect(() => {
    openBrowser();
    
    // Listen for deep link callback
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    return () => {
      subscription.remove();
      if (!browserClosedRef.current) {
        InAppBrowser.close();
      }
    };
  }, []);

  const handleDeepLink = (event: { url: string }) => {
    const url = event.url;
    console.log('Deep link received:', url);
    
    if (url.includes('oauth-callback') || url.includes('callback') || url.includes('success')) {
      browserClosedRef.current = true;
      InAppBrowser.close();
      handleCallbackUrl(url);
    }
  };

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

  const openBrowser = async () => {
    try {
      if (await InAppBrowser.isAvailable()) {
        setLoading(true);
        
        // Use openAuth with deep link redirect
        // When backend redirects to dcalendar.ncog.earth, it means OAuth succeeded
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
          // If backend redirected to dcalendar.ncog.earth, it means OAuth succeeded
          // Immediately trigger NCOG wallet connection without showing the wallet page
          else if (result.url.includes('dcalendar.ncog.earth') || result.url.includes('oauth-callback')) {
            if (result.url.includes('oauth-callback')) {
              handleCallbackUrl(result.url);
            } else {
              // Backend redirected to dcalendar.ncog.earth - OAuth succeeded
              // Close browser and immediately trigger NCOG wallet connection
              console.log('OAuth completed - redirecting to NCOG wallet:', result.url);
              InAppBrowser.close();
              
              // Call success callback
              onSuccess?.({});
              
              // Immediately trigger NCOG wallet connection
              try {
                await ncogIntegration.current.connectToNcog();
              } catch (error) {
                console.error('Failed to open NCOG wallet:', error);
                Alert.alert(
                  'NCOG Wallet',
                  'Please install the NCOG wallet app to complete the connection.',
                  [{ text: 'OK' }]
                );
              }
              navigation.goBack();
            }
          } else {
            handleCallbackUrl(result.url);
          }
        } else if (result.type === 'cancel') {
          onCancel?.();
          navigation.goBack();
        } else {
          // Browser closed without deep link - check what user saw
          // If they reached dcalendar.ncog.earth, OAuth succeeded
          Alert.alert(
            'OAuth Status',
            'Did you see an error page or the wallet connection page?\n\n' +
            'If you saw "400 error failed to handle google auth callback", this is a backend issue.',
            [
              {
                text: 'Saw Wallet Page (Success)',
                onPress: () => {
                  // Treat as success - backend might have failed but OAuth completed
                  onSuccess?.({});
                  navigation.goBack();
                },
              },
              {
                text: 'Saw Error',
                style: 'destructive',
                onPress: () => {
                  onError?.('Backend callback handler returned an error. Please check backend logs.');
                  navigation.goBack();
                },
              },
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => {
                  onCancel?.();
                  navigation.goBack();
                },
              },
            ]
          );
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
