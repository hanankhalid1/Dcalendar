import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FeatherIcon from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useAuthStore } from '../stores/useAuthStore';
import { useApiClient } from '../hooks/useApi';
import { useActiveAccount } from '../stores/useActiveAccount';
import GoogleOAuthWebView from '../components/GoogleOAuthWebView';
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
  const [showWebView, setShowWebView] = useState(false);
  const [authUrl, setAuthUrl] = useState('');

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

  // Zoom Integration Handlers
  const handleZoomConnect = async () => {
    try {
      if (zoomIntegration.isConnected) {
        return Alert.alert('Disconnect Zoom', 'Do you want to disconnect?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disconnect', style: 'destructive', onPress: handleZoomDisconnect },
        ]);
      }

      setIsLoadingZoom(true);

      try {
        const response = await api('GET', `/zoom/auth`, undefined);
        console.log('Zoom API Response:', safeStringify(response.data));

        const url = response.data?.data || response.data;

        if (url?.statusCode === 400 || url?.status === false) {
          Alert.alert('Error', url?.message || 'Backend returned an error');
          setIsLoadingZoom(false);
          return;
        }

        const zoomAuthUrl = typeof url === 'string' ? url : url?.authUrl || url?.url;

        if (!zoomAuthUrl || !zoomAuthUrl.startsWith('http')) {
          Alert.alert('Error', 'No valid Zoom auth URL found');
          setIsLoadingZoom(false);
          return;
        }

        setAuthUrl(zoomAuthUrl);
        setShowWebView(true);

      } catch (error: any) {
        console.error('Zoom OAuth API error:', error);

        if (error.response?.status === 404) {
          Alert.alert(
            'Zoom Integration Not Available',
            'The Zoom OAuth endpoint is not configured on the backend yet.',
            [{ text: 'OK' }]
          );
        } else {
          const errorMsg = error.response?.data?.message || error.message || 'API call failed';
          Alert.alert('Error', `Failed to connect Zoom: ${errorMsg}`);
        }
      } finally {
        setIsLoadingZoom(false);
      }
    } catch (error: any) {
      console.error('Zoom OAuth error:', error);
      Alert.alert('Error', error.message || 'Failed to connect Zoom');
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

  const handleOAuthSuccess = async (data: {
    accessToken?: string;
    refreshToken?: string;
    email?: string;
    name?: string;
    photo?: string;
  }) => {
    try {
      setShowWebView(false);

      if (data.accessToken) {
        connectZoom({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          email: data.email,
          fullName: data.name,
          photo: data.photo,
        });
        Alert.alert('✅ Connected', 'Zoom account connected successfully!');
        return;
      }

      setIsLoadingZoom(true);

      try {
        const statusResponse = await api('GET', '/calendarIntgrationStatus', undefined);
        const integrations = statusResponse.data?.data || statusResponse.data || {};

        if (integrations.isZoomConnected) {
          connectZoom({
            email: integrations.zoomEmail,
            fullName: integrations.zoomName,
          });
          Alert.alert('✅ Connected', 'Zoom account connected successfully!');
        } else {
          Alert.alert('Backend Error', 'Zoom OAuth completed but backend returned an error.');
        }
      } catch (err: any) {
        console.error('Error checking integration status:', err);
        Alert.alert('Status Check Failed', 'Could not verify OAuth status from backend.');
      } finally {
        setIsLoadingZoom(false);
      }
    } catch (error) {
      console.error('Error saving zoom integration:', error);
      Alert.alert('Error', 'Failed to save connection');
      setIsLoadingZoom(false);
    }
  };

  const handleOAuthError = (error: string) => {
    setShowWebView(false);
    Alert.alert('Authentication Error', error || 'Failed to authenticate with Zoom');
  };

  const handleOAuthCancel = () => {
    setShowWebView(false);
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
            {/* <View style={[styles.integrationCard, { marginRight: 0 }]}>
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
            </View> */}
          </View>
        </View>
      )}

      {/* OAuth WebView Modal (for Zoom) */}
      {showWebView && authUrl && (
        <GoogleOAuthWebView
          authUrl={authUrl}
          onSuccess={handleOAuthSuccess}
          onError={handleOAuthError}
          onCancel={handleOAuthCancel}
        />
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

