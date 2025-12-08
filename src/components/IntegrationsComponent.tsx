import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
  AppState,
  Platform,
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { useAuthStore } from '../stores/useAuthStore';
import { useApiClient } from '../hooks/useApi';
import { useActiveAccount } from '../stores/useActiveAccount';
import { colors } from '../utils/LightTheme';
import { scaleWidth } from '../utils/dimensions';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import { fontSize } from '../utils/LightTheme';

interface IntegrationsComponentProps {
  initialExpanded?: boolean;
}

const IntegrationsComponent: React.FC<IntegrationsComponentProps> = ({
  initialExpanded = false,
}) => {
  const [isIntegrationExpanded, setIsIntegrationExpanded] = useState(initialExpanded);
  const { account } = useActiveAccount();
  const { api } = useApiClient();

  // Integration state
  const {
    googleIntegration,
    connectGoogle,
    disconnectGoogle,
    zoomIntegration,
    connectZoom,
    disconnectZoom
  } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingZoom, setIsLoadingZoom] = useState(false);

  // Configure Google Sign-In on mount
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '803362654752-hi8nfh7l9ofq3cmgta7jpabjcf2kn3is.apps.googleusercontent.com',
      offlineAccess: true,
      forceCodeForRefreshToken: true,
      scopes: [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar',
        'openid',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
    });
  }, []);

  // Update expanded state when initialExpanded prop changes
  useEffect(() => {
    setIsIntegrationExpanded(initialExpanded);
  }, [initialExpanded]);

  const safeStringify = (obj: any): string => {
    return JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );
  };

  // Google Integration Handlers
  const handleGoogleConnect = async () => {
    try {
      if (googleIntegration.isConnected) {
        return Alert.alert('Disconnect Google', 'Do you want to disconnect?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disconnect', style: 'destructive', onPress: handleGoogleDisconnect },
        ]);
      }

      setIsLoading(true);

      // Check if Google Play Services are available (Android)
      console.log("Checking for play services...");
      await GoogleSignin.hasPlayServices();

      console.log("Initiating Google Sign-In...");
      // Sign in with native Google Sign-In
      const signInResult = await GoogleSignin.signIn();
      console.log("Google Sign-In Result:", safeStringify(signInResult));
      
      if (!signInResult.data) {
        Alert.alert('Error', 'Failed to get sign-in data from Google');
        setIsLoading(false);
        return;
      }
      
      const user = signInResult.data.user;
      const serverAuthCode = signInResult.data.serverAuthCode;
      console.log('Google Sign-In User Info:', safeStringify(signInResult.data));

      // Validate serverAuthCode
      if (!serverAuthCode) {
        Alert.alert('Error', 'Failed to get authorization code from Google');
        setIsLoading(false);
        return;
      }

      // Get username from activeAccount
      const userName = account?.userName ||
        account?.user_name ||
        account?.username ||
        account?.name;

      if (!userName) {
        Alert.alert('Error', 'Cannot find username. Please ensure you are logged in.');
        setIsLoading(false);
        return;
      }

      console.log("User email:", user.email);
      console.log("Calling Android callback API...");

      // Call the new Android-specific API endpoint
      const response = await api('POST', '/google/android/callback', {
        code: serverAuthCode,
        username: userName,
      });

      console.log('API Response:', safeStringify(response.data));

      // Check if the response was successful
      if (response.data.status && response.data.data) {
        const { access_token, refresh_token, expires_at } = response.data.data;

        // Store tokens in your context/state
        connectGoogle({
          accessToken: access_token,
          refreshToken: refresh_token,
          email: user.email,
          fullName: user.name || undefined,
          photo: user.photo || undefined,
        });

        Alert.alert('Success', 'Google account connected successfully!', [
          {
            text: 'OK',
          },
        ]);

        return true;
      } else {
        Alert.alert('Failed', 'Could not connect Google account');
        return false;
      }

    } catch (error: any) {
      console.error('Google Sign-In Error:', error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled sign-in');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert('In Progress', 'Sign-in is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert(
          'Google Play Services Required',
          'Please install or update Google Play Services to use this feature'
        );
      } else {
        // Handle API errors
        const errorMessage = error.response?.data?.message ||
          error.message ||
          'Failed to connect Google account';
        Alert.alert('Connection Failed', errorMessage);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    try {
      setIsLoading(true);

      // Get username
      const userName = account?.userName ||
        account?.user_name ||
        account?.username ||
        account?.name;

      // Sign out from Google
      await GoogleSignin.signOut();

      // Disconnect from backend
      if (userName) {
        try {
          await api('POST', '/google/disconnect', { user_name: userName });
        } catch (error) {
          console.error('Backend disconnect error:', error);
        }
      }

      // Update local state
      disconnectGoogle();
      Alert.alert('Disconnected', 'Google account disconnected successfully');
    } catch (error) {
      console.error('Disconnect error:', error);
      Alert.alert('Error', 'Failed to disconnect');
    } finally {
      setIsLoading(false);
    }
  };

  // Zoom Integration Handlers (Following Google pattern)
 const handleZoomConnect = async () => {
  try {
    if (zoomIntegration.isConnected) {
      return Alert.alert('Disconnect Zoom', 'Do you want to disconnect?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: handleZoomDisconnect },
      ]);
    }

    setIsLoadingZoom(true);

    // Get username
    const userName =
      account?.userName ||
      account?.user_name ||
      account?.username ||
      account?.name;

    if (!userName) {
      Alert.alert('Error', 'Cannot find username.');
      setIsLoadingZoom(false);
      return;
    }

    // 1️⃣ Get Zoom OAuth URL from backend
    const response = await api('GET', `/zoom/auth?platform=mobile`);
    
    // Zoom Api backend response
    console.log('========================================');
    console.log('Zoom Api backend response');
    console.log('========================================');
    console.log('Full Response:', JSON.stringify(response, null, 2));
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    console.log('Response Status:', response.status);
    console.log('Response Headers:', JSON.stringify(response.headers, null, 2));
    console.log('========================================');
    
    // Extract the auth URL from response
    const zoomAuthUrl =
      response.data?.data ||
      response.data?.url ||
      response.data?.authUrl ||
      response.data?.auth_url;

    // Validate the URL before proceeding
    if (!zoomAuthUrl || typeof zoomAuthUrl !== 'string' || zoomAuthUrl.includes('undefined')) {
      console.error('❌ Invalid Zoom auth URL received:', zoomAuthUrl);
      Alert.alert('Error', 'Invalid Zoom authorization link received from server.');
      setIsLoadingZoom(false);
      return;
    }

    // Validate URL format
    try {
      new URL(zoomAuthUrl);
    } catch (urlError) {
      console.error('❌ Invalid URL format:', zoomAuthUrl);
      Alert.alert('Error', 'Invalid URL format received from server.');
      setIsLoadingZoom(false);
      return;
    }

    // 2️⃣ Use InAppBrowser to open OAuth and extract code from callback URL
    try {
      console.log('🌐 Opening Zoom OAuth in InAppBrowser...');
      
      // Helper function to process Zoom callback
      const processZoomCallback = async (code: string) => {
        try {
          console.log('📤 Sending Zoom code to backend...');

          const callbackResponse = await api('POST', '/zoom/callback', {
            code,
            username: userName,
          });

          console.log('✅ Zoom callback response received:', JSON.stringify(callbackResponse.data, null, 2));

          if (callbackResponse.data?.status && callbackResponse.data?.data) {
            const data = callbackResponse.data.data;

            // Store tokens in state
            connectZoom({
              accessToken: data.access_token || data.accessToken,
              refreshToken: data.refresh_token || data.refreshToken,
              email: data.email || '',
              fullName: data.fullName || data.full_name || '',
            });

            Alert.alert('Success', 'Zoom connected successfully!');
          } else {
            Alert.alert('Error', callbackResponse.data?.message || 'Failed to connect Zoom.');
          }
        } catch (error: any) {
          console.error('❌ Error processing Zoom callback:', error);
          const errorMessage = error.response?.data?.message || error.message || 'Failed to connect Zoom.';
          Alert.alert('Error', errorMessage);
        } finally {
          setIsLoadingZoom(false);
        }
      };

      // Check if InAppBrowser is available
      if (await InAppBrowser.isAvailable()) {
        // Set up deep link listener BEFORE opening browser
        let deepLinkSubscription: any = null;
        let hasProcessedCallback = false;

        const handleDeepLink = async (event: { url: string }) => {
          const url = event.url;
          console.log('🔗 Deep link received:', url);

          if (url.includes('zoom-callback') || (url.includes('zoom') && url.includes('code='))) {
            if (hasProcessedCallback) return;
            hasProcessedCallback = true;

            if (deepLinkSubscription) {
              deepLinkSubscription.remove();
            }

            try {
              InAppBrowser.close();

              // Extract code from URL
              const urlObj = new URL(url);
              const params = new URLSearchParams(urlObj.search);
              const code = params.get('code');
              const error = params.get('error');

              if (error) {
                Alert.alert('Error', `Zoom authentication failed: ${error}`);
                setIsLoadingZoom(false);
                return;
              }

              if (code && code !== 'undefined') {
                await processZoomCallback(code);
              }
            } catch (err) {
              console.error('❌ Error handling deep link:', err);
              setIsLoadingZoom(false);
            }
          }
        };

        deepLinkSubscription = Linking.addEventListener('url', handleDeepLink);

        // Use openAuth with deep link redirect
        // If backend redirects to web URL, we'll need to handle it differently
        const deepLinkRedirect = 'dcalendar://zoom-callback';
        const result = await InAppBrowser.openAuth(
          zoomAuthUrl,
          deepLinkRedirect,
          {
            ephemeralWebSession: false,
            showTitle: false,
            enableUrlBarHiding: true,
            enableDefaultShare: false,
          }
        );

        // Remove deep link listener
        if (deepLinkSubscription) {
          deepLinkSubscription.remove();
        }

        console.log('🔗 InAppBrowser result:', JSON.stringify(result, null, 2));

        if (result.type === 'cancel') {
          console.log('❌ User cancelled Zoom OAuth');
          Alert.alert('Cancelled', 'Zoom connection was cancelled.');
          setIsLoadingZoom(false);
          return;
        }

        if (result.type === 'dismiss') {
          console.log('❌ Browser was dismissed');
          setIsLoadingZoom(false);
          return;
        }

        // Process the result
        if (result.type === 'success' && (result as any).url) {
          const callbackUrl = (result as any).url;
          console.log('✅ Zoom callback URL received:', callbackUrl);

          // Extract code from callback URL (could be deep link or web URL)
          try {
            const urlObj = new URL(callbackUrl);
            const params = new URLSearchParams(urlObj.search);
            const code = params.get('code');
            const error = params.get('error');

            if (error) {
              Alert.alert('Error', `Zoom authentication failed: ${error}`);
              setIsLoadingZoom(false);
              return;
            }

            if (code && code !== 'undefined') {
              await processZoomCallback(code);
            } else {
              // No code in URL - this shouldn't happen with proper OAuth flow
              console.warn('⚠️ No code in callback URL');
              Alert.alert('Error', 'Authorization code not received. Please try again.');
              setIsLoadingZoom(false);
            }
          } catch (urlError) {
            console.error('❌ Error parsing callback URL:', urlError);
            Alert.alert('Error', 'Invalid callback URL received.');
            setIsLoadingZoom(false);
          }
        } else {
          // No URL in result - user may have closed browser manually
          // The backend redirects to web URL, so openAuth doesn't capture it
          // We need to check connection status or show instructions
          console.log('⚠️ No callback URL in result - backend may have processed it');
          Alert.alert(
            'Authorization Complete',
            'Please check if Zoom connection was successful. If the connection status doesn\'t update, please try connecting again.',
            [
              {
                text: 'OK',
                onPress: () => {
                  setIsLoadingZoom(false);
                },
              },
            ]
          );
        }
      } else {
        // Fallback to regular browser
        console.log('⚠️ InAppBrowser not available, using regular browser...');
        await Linking.openURL(zoomAuthUrl);
        
        // Set up listener for deep link callback
        const subscription = Linking.addEventListener('url', async ({ url }) => {
          if (url.includes('zoom-callback') || (url.includes('zoom') && url.includes('code='))) {
            subscription.remove();
            console.log('🔗 Zoom callback received via deep link:', url);
            
            try {
              const urlObj = new URL(url);
              const params = new URLSearchParams(urlObj.search);
              const code = params.get('code');
              
              if (code && code !== 'undefined') {
                const callbackResponse = await api('POST', '/zoom/callback', {
                  code,
                  username: userName,
                });

                if (callbackResponse.data?.status && callbackResponse.data?.data) {
                  const data = callbackResponse.data.data;
                  connectZoom({
                    accessToken: data.access_token || data.accessToken,
                    refreshToken: data.refresh_token || data.refreshToken,
                    email: data.email || '',
                    fullName: data.fullName || data.full_name || '',
                  });
                  Alert.alert('Success', 'Zoom connected successfully!');
                }
              }
            } catch (err) {
              console.error('❌ Error handling deep link:', err);
            } finally {
              setIsLoadingZoom(false);
            }
          }
        });
      }
    } catch (browserError: any) {
      console.error('❌ Failed to open Zoom auth in browser:', browserError);
      Alert.alert('Error', `Failed to open authorization page: ${browserError.message}`);
      setIsLoadingZoom(false);
    }
  } catch (error: any) {
    console.error('❌ Zoom connection error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Zoom connection failed.';
    Alert.alert('Error', errorMessage);
    setIsLoadingZoom(false);
  }
};


// ----------------------------
// Disconnect (simple)
// ----------------------------
const handleZoomDisconnect = async () => {
  try {
    setIsLoadingZoom(true);
    await api('PUT', '/zoom/disconnect', {});
    disconnectZoom();
    Alert.alert('Disconnected', 'Zoom account disconnected.');
  } catch {
    Alert.alert('Error', 'Failed to disconnect Zoom.');
  } finally {
    setIsLoadingZoom(false);
  }
};


  return (
    <>
      <View style={styles.integrationRow}>
        <View style={styles.integrationRowContent}>
          <Text style={styles.integrationRowTitle}>Integrations</Text>
          <Text style={styles.integrationRowSubtitle}>
            Connect your accounts to generate video meeting links
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setIsIntegrationExpanded(!isIntegrationExpanded)}
          style={styles.dropdownButton}
        >
          <MaterialIcons
            name={isIntegrationExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
            size={24}
            color="#666"
          />
        </TouchableOpacity>
      </View>

      {isIntegrationExpanded && (
        <View style={styles.integrationExpandedContent}>
          <View style={styles.integrationContainer}>
            {/* Google Integration Card */}
            <View style={styles.integrationCard}>
              <View style={styles.integrationContent}>
                <View style={styles.integrationTitleRow}>
                  <View style={styles.integrationLogoContainer}>
                    <FeatherIcon name="video" size={24} color="#34A853" />
                  </View>
                  <Text style={styles.integrationName}>Google Meet</Text>
                  {googleIntegration.isConnected && (
                    <View style={styles.connectedBadge}>
                      <View style={styles.badgeGradient}>
                        <Text style={styles.badgeText}>Connected</Text>
                      </View>
                    </View>
                  )}
                </View>
                <Text style={styles.integrationDescription}>
                  Automatically generate a Google Meet link for your events.
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.connectButtonFull,
                  googleIntegration.isConnected ? styles.disconnectButtonFull : styles.connectButtonActive,
                  isLoading && styles.buttonDisabled,
                ]}
                onPress={handleGoogleConnect}
                disabled={isLoading}
              >
                {googleIntegration.isConnected ? (
                  <View style={styles.disconnectButtonContent}>
                    <Text style={styles.disconnectButtonText}>Disconnect</Text>
                  </View>
                ) : (
                  <View style={[styles.gradientFull, isLoading && { backgroundColor: colors.grey400 }]}>
                    {isLoading ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Text style={styles.connectButtonTextFull}>Connect</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Zoom Integration Card */}
            <View style={[styles.integrationCard, { marginRight: 0 }]}>
              <View style={styles.integrationContent}>
                <View style={styles.integrationTitleRow}>
                  <View style={styles.integrationLogoContainer}>
                    <FeatherIcon name="video" size={24} color="#2D8CFF" />
                  </View>
                  <Text style={styles.integrationName}>Zoom</Text>
                  {zoomIntegration.isConnected && (
                    <View style={styles.connectedBadge}>
                      <View style={styles.badgeGradient}>
                        <Text style={styles.badgeText}>Connected</Text>
                      </View>
                    </View>
                  )}
                </View>
                <Text style={styles.integrationDescription}>
                  Automatically generate a Zoom link for your events.
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.connectButtonFull,
                  zoomIntegration.isConnected ? styles.disconnectButtonFull : styles.connectButtonActive,
                  isLoadingZoom && styles.buttonDisabled,
                ]}
                onPress={handleZoomConnect}
                disabled={isLoadingZoom}
              >
                {zoomIntegration.isConnected ? (
                  <View style={styles.disconnectButtonContent}>
                    <Text style={styles.disconnectButtonText}>Connected</Text>
                  </View>
                ) : (
                  <View style={[styles.gradientFull, isLoadingZoom && { backgroundColor: colors.grey400 }]}>
                    {isLoadingZoom ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Text style={styles.connectButtonTextFull}>Connect</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  integrationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  integrationRowContent: {
    flex: 1,
  },
  integrationRowTitle: {
    fontSize: fontSize.textSize14,
    color: Colors.black,
    fontFamily: Fonts.latoRegular,
  },
  integrationRowSubtitle: {
    fontSize: fontSize.textSize12,
    color: colors.grey400,
    marginTop: 2,
    fontFamily: Fonts.latoRegular,
  },
  dropdownButton: {
    padding: 4,
  },
  integrationExpandedContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  integrationContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  integrationCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    justifyContent: 'space-between',
  },
  integrationContent: {
    flex: 1,
  },
  integrationLogoContainer: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 12,
  },
  integrationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  integrationName: {
    fontSize: fontSize.textSize16,
    fontFamily: Fonts.latoSemiBold,
    color: Colors.black,
    marginRight: 8,
  },
  connectedBadge: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  badgeGradient: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.primaryBlue,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: fontSize.textSize11,
    color: Colors.white,
    fontFamily: Fonts.latoSemiBold,
  },
  integrationDescription: {
    fontSize: fontSize.textSize13,
    color: colors.grey400,
    lineHeight: 18,
    marginBottom: 16,
    fontFamily: Fonts.latoRegular,
  },
  connectButtonFull: {
    borderRadius: 8,
    overflow: 'hidden',
    width: '100%',
    marginTop: 8,
  },
  connectButtonActive: {},
  disconnectButtonFull: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  disconnectButtonContent: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disconnectButtonText: {
    fontSize: fontSize.textSize14,
    color: Colors.black,
    fontFamily: Fonts.latoSemiBold,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  gradientFull: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryBlue,
    borderRadius: 8,
  },
  connectButtonTextFull: {
    fontSize: fontSize.textSize14,
    color: Colors.white,
    fontFamily: Fonts.latoSemiBold,
  },
});

export default IntegrationsComponent;

