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
  Modal,
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MeetIcon from '../assets/svgs/meet.svg';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
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
  variant?: 'default' | 'compact';
}

const IntegrationsComponent: React.FC<IntegrationsComponentProps> = ({
  initialExpanded = false,
  variant = 'default',
}) => {
  const [isIntegrationExpanded, setIsIntegrationExpanded] =
    useState(initialExpanded);
  const [showGoogleDisconnectConfirm, setShowGoogleDisconnectConfirm] =
    useState(false);
  const { account } = useActiveAccount();
  const { api } = useApiClient();

  // Integration state
  const {
    googleIntegration,
    connectGoogle,
    disconnectGoogle,
    zoomIntegration,
    connectZoom,
    disconnectZoom,
  } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingZoom, setIsLoadingZoom] = useState(false);

  // Configure Google Sign-In on mount
  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '803362654752-hi8nfh7l9ofq3cmgta7jpabjcf2kn3is.apps.googleusercontent.com',
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
      typeof value === 'bigint' ? value.toString() : value,
    );
  };

  // Google Integration Handlers
  const handleGoogleConnect = async () => {
    try {
      if (googleIntegration.isConnected) {
        setShowGoogleDisconnectConfirm(true);
        return;
      }

      setIsLoading(true);

      // Check if Google Play Services are available (Android)
      console.log('Checking for play services...');
      await GoogleSignin.hasPlayServices();

      console.log('Initiating Google Sign-In...');
      // Sign in with native Google Sign-In
      const signInResult = await GoogleSignin.signIn();
      console.log('Google Sign-In Result:', safeStringify(signInResult));

      if (!signInResult.data) {
        Alert.alert('Error', 'Failed to get sign-in data from Google');
        setIsLoading(false);
        return;
      }

      const user = signInResult.data.user;
      const serverAuthCode = signInResult.data.serverAuthCode;
      console.log(
        'Google Sign-In User Info:',
        safeStringify(signInResult.data),
      );

      // Validate serverAuthCode
      if (!serverAuthCode) {
        Alert.alert('Error', 'Failed to get authorization code from Google');
        setIsLoading(false);
        return;
      }

      // Get username from activeAccount
      const userName =
        account?.userName ||
        account?.user_name ||
        account?.username ||
        account?.name;

      if (!userName) {
        Alert.alert(
          'Error',
          'Cannot find username. Please ensure you are logged in.',
        );
        setIsLoading(false);
        return;
      }

      console.log('User email:', user.email);
      console.log('Calling Android callback API...');

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
          'Please install or update Google Play Services to use this feature',
        );
      } else {
        // Handle API errors
        const errorMessage =
          error.response?.data?.message ||
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
      const userName =
        account?.userName ||
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
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: handleZoomDisconnect,
          },
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
      console.log(
        'Response Headers:',
        JSON.stringify(response.headers, null, 2),
      );
      console.log('========================================');

      // Extract the auth URL from response
      const zoomAuthUrl =
        response.data?.data ||
        response.data?.url ||
        response.data?.authUrl ||
        response.data?.auth_url;

      // Validate the URL before proceeding
      if (
        !zoomAuthUrl ||
        typeof zoomAuthUrl !== 'string' ||
        zoomAuthUrl.includes('undefined')
      ) {
        console.error('❌ Invalid Zoom auth URL received:', zoomAuthUrl);
        Alert.alert(
          'Error',
          'Invalid Zoom authorization link received from server.',
        );
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

            console.log(
              '✅ Zoom callback response received:',
              JSON.stringify(callbackResponse.data, null, 2),
            );

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
              Alert.alert(
                'Error',
                callbackResponse.data?.message || 'Failed to connect Zoom.',
              );
            }
          } catch (error: any) {
            console.error('❌ Error processing Zoom callback:', error);
            const errorMessage =
              error.response?.data?.message ||
              error.message ||
              'Failed to connect Zoom.';
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

            if (
              url.includes('zoom-callback') ||
              (url.includes('zoom') && url.includes('code='))
            ) {
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

          deepLinkSubscription = Linking.addEventListener(
            'url',
            handleDeepLink,
          );

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
            },
          );

          // Remove deep link listener
          if (deepLinkSubscription) {
            deepLinkSubscription.remove();
          }

          console.log(
            '🔗 InAppBrowser result:',
            JSON.stringify(result, null, 2),
          );

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
                Alert.alert(
                  'Error',
                  'Authorization code not received. Please try again.',
                );
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
            console.log(
              '⚠️ No callback URL in result - backend may have processed it',
            );
            Alert.alert(
              'Authorization Complete',
              "Please check if Zoom connection was successful. If the connection status doesn't update, please try connecting again.",
              [
                {
                  text: 'OK',
                  onPress: () => {
                    setIsLoadingZoom(false);
                  },
                },
              ],
            );
          }
        } else {
          // Fallback to regular browser
          console.log(
            '⚠️ InAppBrowser not available, using regular browser...',
          );
          await Linking.openURL(zoomAuthUrl);

          // Set up listener for deep link callback
          const subscription = Linking.addEventListener(
            'url',
            async ({ url }) => {
              if (
                url.includes('zoom-callback') ||
                (url.includes('zoom') && url.includes('code='))
              ) {
                subscription.remove();
                console.log('🔗 Zoom callback received via deep link:', url);

                try {
                  const urlObj = new URL(url);
                  const params = new URLSearchParams(urlObj.search);
                  const code = params.get('code');

                  if (code && code !== 'undefined') {
                    const callbackResponse = await api(
                      'POST',
                      '/zoom/callback',
                      {
                        code,
                        username: userName,
                      },
                    );

                    if (
                      callbackResponse.data?.status &&
                      callbackResponse.data?.data
                    ) {
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
            },
          );
        }
      } catch (browserError: any) {
        console.error('❌ Failed to open Zoom auth in browser:', browserError);
        Alert.alert(
          'Error',
          `Failed to open authorization page: ${browserError.message}`,
        );
        setIsLoadingZoom(false);
      }
    } catch (error: any) {
      console.error('❌ Zoom connection error:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Zoom connection failed.';
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
      {/* Google Meet Card */}
      <View style={styles.integrationCard}>
        <View style={styles.compactRow}>
          <View style={styles.compactLeft}>
            <View style={styles.compactLogoContainer}>
              <MeetIcon width={20} height={20} />
            </View>
            <Text style={styles.compactName}>Google Meet</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.compactButton,
              googleIntegration.isConnected
                ? styles.compactConnected
                : styles.compactConnect,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleGoogleConnect}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator
                size="small"
                color={
                  googleIntegration.isConnected ? Colors.black : colors.white
                }
              />
            ) : (
              <Text
                style={[
                  styles.compactButtonText,
                  googleIntegration.isConnected
                    ? styles.compactButtonTextConnected
                    : styles.compactButtonTextConnect,
                ]}
              >
                {googleIntegration.isConnected ? 'Connected' : 'Connect'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Zoom Card */}
      <View style={styles.integrationCard}>
        <View style={styles.compactRow}>
          <View style={styles.compactLeft}>
            <View style={styles.compactLogoContainer}>
              <FeatherIcon name="video" size={20} color="#0B6DE0" />
            </View>
            <Text style={styles.compactName}>Zoom</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.compactButton,
              zoomIntegration.isConnected
                ? styles.compactConnected
                : styles.compactConnect,
              isLoadingZoom && styles.buttonDisabled,
            ]}
            onPress={handleZoomConnect}
            disabled={isLoadingZoom}
          >
            {isLoadingZoom ? (
              <ActivityIndicator
                size="small"
                color={
                  zoomIntegration.isConnected ? Colors.black : colors.white
                }
              />
            ) : (
              <Text
                style={[
                  styles.compactButtonText,
                  zoomIntegration.isConnected
                    ? styles.compactButtonTextConnected
                    : styles.compactButtonTextConnect,
                ]}
              >
                {zoomIntegration.isConnected ? 'Connected' : 'Connect'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <ConfirmModal
        visible={showGoogleDisconnectConfirm}
        title="Disconnect Google"
        message="Are you sure you want to disconnect Google account from DCalendar?"
        onCancel={() => setShowGoogleDisconnectConfirm(false)}
        onConfirm={() => {
          setShowGoogleDisconnectConfirm(false);
          handleGoogleDisconnect();
        }}
      />
    </>
  );
};

const ConfirmModal = ({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}) => (
  <Modal
    transparent
    visible={visible}
    animationType="fade"
    onRequestClose={onCancel}
  >
    <View style={styles.confirmOverlay}>
      <View style={styles.confirmCard}>
        <Text style={styles.confirmTitle}>{title}</Text>
        <Text style={styles.confirmMessage}>{message}</Text>
        <View style={styles.confirmButtons}>
          <TouchableOpacity onPress={onCancel} style={styles.confirmCancel}>
            <Text style={styles.confirmCancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onConfirm} style={styles.confirmPrimary}>
            <Text style={styles.confirmPrimaryText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  compactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  compactLogoContainer: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  compactName: {
    fontSize: fontSize.textSize14,
    fontFamily: Fonts.latoRegular,
    color: Colors.black,
  },
  compactButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactConnect: {},
  compactConnected: {},
  compactButtonText: {
    fontSize: fontSize.textSize14,
    fontFamily: Fonts.latoBold,
    fontWeight: '700',
  },
  compactButtonTextConnect: {
    color: Colors.primaryBlue,
  },
  compactButtonTextConnected: {
    color: Colors.primaryBlue,
  },
  compactDivider: {},

  integrationCard: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 4,
  },
  confirmTitle: {
    fontFamily: Fonts.latoSemiBold,
    fontSize: fontSize.textSize16,
    color: Colors.black,
    marginBottom: 6,
  },
  confirmMessage: {
    fontFamily: Fonts.latoRegular,
    fontSize: fontSize.textSize13,
    color: '#555',
    marginBottom: 18,
    lineHeight: 18,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  confirmCancel: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  confirmCancelText: {
    fontFamily: Fonts.latoSemiBold,
    fontSize: fontSize.textSize14,
    color: '#555',
  },
  confirmPrimary: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.primaryBlue,
    borderRadius: 8,
  },
  confirmPrimaryText: {
    fontFamily: Fonts.latoSemiBold,
    fontSize: fontSize.textSize14,
    color: Colors.white,
  },
});

export default IntegrationsComponent;
