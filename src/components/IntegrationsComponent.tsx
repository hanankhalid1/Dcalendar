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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FeatherIcon from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { useAuthStore } from '../stores/useAuthStore';
import { useApiClient } from '../hooks/useApi';
import { useActiveAccount } from '../stores/useActiveAccount';
import { colors } from '../utils/LightTheme';
import { scaleWidth } from '../utils/dimensions';

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

      // Get username from activeAccount (same as Google)
      const userName = account?.userName ||
        account?.user_name ||
        account?.username ||
        account?.name;

      if (!userName) {
        Alert.alert('Error', 'Cannot find username. Please ensure you are logged in.');
        setIsLoadingZoom(false);
        return;
      }

      try {
        // Get Zoom OAuth deep link from backend (returns ncog://zoom/auth?user=335)
        const response = await api('GET', `/zoom/auth?platform=mobile`);
        const url = response.data?.data || response.data;
        const zoomAuthUrl = typeof url === 'string' ? url : url?.authUrl || url?.url;

        if (!zoomAuthUrl) {
          Alert.alert('Error', 'No valid Zoom auth URL found');
          setIsLoadingZoom(false);
          return;
        }

        console.log('Opening Zoom auth deep link:', zoomAuthUrl);

        // COMMENTED OUT: Zoom OAuth callback handling
        // Handle ncog:// deep link (similar to Google's serverAuthCode pattern)
        // let subscription: any = null;
        // let callbackHandled = false;

        // COMMENTED OUT: Listen for OAuth callback URL with code
        // const handleCallback = async (event: { url: string }) => {
        //   if (callbackHandled) return;
        //   
        //   const callbackUrl = event.url;
        //   console.log('🔗 Zoom OAuth callback received:', callbackUrl);

        //   // Extract code from callback URL (Zoom redirects with ?code=...)
        //   if (callbackUrl.includes('zoom-callback') || callbackUrl.includes('code=')) {
        //     callbackHandled = true;
        //     
        //     if (subscription) {
        //       subscription.remove();
        //     }
        //     
        //     try {
        //       // Parse code from URL
        //       const urlObj = new URL(callbackUrl);
        //       const params = new URLSearchParams(urlObj.search);
        //       const code = params.get('code');
        //       const error = params.get('error');

        //       if (error) {
        //         Alert.alert('Authentication Error', params.get('error_description') || error);
        //         setIsLoadingZoom(false);
        //         return;
        //       }

        //       if (!code) {
        //         Alert.alert('Error', 'Failed to get authorization code from Zoom');
        //         setIsLoadingZoom(false);
        //         return;
        //       }

        //       console.log('Calling Zoom callback API...');

        //       // Send code to backend (same pattern as Google)
        //       const callbackResponse = await api('POST', '/zoom/callback', {
        //         code: code,
        //         username: userName,
        //       });

        //       console.log('Zoom Callback API Response:', safeStringify(callbackResponse.data));

        //       // Check if the response was successful
        //       if (callbackResponse.data.status && callbackResponse.data.data) {
        //         const { access_token, refresh_token, email, fullName } = callbackResponse.data.data;

        //         // Store tokens in state (same as Google)
        //         connectZoom({
        //           accessToken: access_token,
        //           refreshToken: refresh_token,
        //           email: email,
        //           fullName: fullName,
        //         });

        //         Alert.alert('Success', 'Zoom account connected successfully!');
        //       } else {
        //         Alert.alert('Failed', 'Could not connect Zoom account');
        //       }
        //     } catch (err: any) {
        //       console.error('Zoom callback error:', err);
        //       Alert.alert('Error', err.response?.data?.message || 'Failed to connect Zoom account');
        //     } finally {
        //       setIsLoadingZoom(false);
        //     }
        //   }
        // };

        // COMMENTED OUT: Set up deep link listener for callback
        // subscription = Linking.addEventListener('url', handleCallback);

        // Open ncog:// deep link (this will open NCOG app or handle Zoom auth)
        // Try to open directly - canOpenURL might not recognize custom schemes
        try {
          await Linking.openURL(zoomAuthUrl);
          console.log('✅ Opened Zoom auth deep link:', zoomAuthUrl);
          console.log('⚠️ NOTE: Callback handling is disabled - connection status will not update automatically');
          // COMMENTED OUT: Keep listener active - callback will come back via deep link
          
          // Reset loading after opening (since callback won't be handled)
          setTimeout(() => {
            setIsLoadingZoom(false);
          }, 2000);
        } catch (error: any) {
          console.error('Failed to open Zoom auth URL:', error);
          // COMMENTED OUT: if (subscription) { subscription.remove(); }
          Alert.alert('Error', 'Unable to open Zoom authentication. Please make sure the NCOG app is installed.');
          setIsLoadingZoom(false);
        }
      } catch (error: any) {
        console.error('Zoom OAuth error:', error);
        Alert.alert('Error', error.message || 'Failed to connect Zoom');
        setIsLoadingZoom(false);
      }
    } catch (error: any) {
      console.error('Zoom error:', error);
      Alert.alert('Error', 'Failed to connect Zoom');
      setIsLoadingZoom(false);
    }
  };

  const handleZoomDisconnect = async () => {
    try {
      setIsLoadingZoom(true);
      await api('PUT', '/zoom/disconnect', {});
      disconnectZoom();
      Alert.alert('Disconnected', 'Zoom account disconnected successfully');
    } catch (error: any) {
      console.error('Zoom disconnect error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to disconnect';
      Alert.alert('Error', errorMsg);
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
                      <LinearGradient
                        colors={['#18F06E', '#0B6DE0']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.badgeGradient}
                      >
                        <Text style={styles.badgeText}>Connected</Text>
                      </LinearGradient>
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
                  <LinearGradient
                    colors={
                      isLoading
                        ? [colors.grey400, colors.grey400]
                        : ['#18F06E', '#0B6DE0']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientFull}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Text style={styles.connectButtonTextFull}>Connect</Text>
                    )}
                  </LinearGradient>
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
                      <LinearGradient
                        colors={['#18F06E', '#0B6DE0']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.badgeGradient}
                      >
                        <Text style={styles.badgeText}>Connected</Text>
                      </LinearGradient>
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
                    <Text style={styles.disconnectButtonText}>Disconnect</Text>
                  </View>
                ) : (
                  <LinearGradient
                    colors={
                      isLoadingZoom
                        ? [colors.grey400, colors.grey400]
                        : ['#18F06E', '#0B6DE0']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientFull}
                  >
                    {isLoadingZoom ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Text style={styles.connectButtonTextFull}>Connect</Text>
                    )}
                  </LinearGradient>
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
    fontSize: 16,
    color: '#333',
    fontWeight: '400',
  },
  integrationRowSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  connectedBadge: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  badgeGradient: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  integrationDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 16,
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
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  gradientFull: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButtonTextFull: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default IntegrationsComponent;

