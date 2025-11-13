import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useAuthStore } from '../stores/useAuthStore';
import { useApiClient } from '../hooks/useApi';
import { useActiveAccount } from '../stores/useActiveAccount';
import GoogleOAuthWebView from '../components/GoogleOAuthWebFlow';
import { colors, fontSize, spacing, borderRadius, shadows } from '../utils/LightTheme';
import { scaleWidth } from '../utils/dimensions';
import { useRoute, RouteProp } from '@react-navigation/native';

const IntegrationScreen = () => {
  const navigation = useNavigation();
  const {
    googleIntegration,
    connectGoogle,
    disconnectGoogle,
    zoomIntegration,
    connectZoom,
    disconnectZoom
  } = useAuthStore();
  const { api } = useApiClient();
  const activeAccount = useActiveAccount(state => state.account);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingZoom, setIsLoadingZoom] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const route = useRoute();
  const returnToScreen = route.params?.returnToScreen;
  // Configure Google Sign-In on mount
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '803362654752-hi8nfh7l9ofq3cmgta7jpabjcf2kn3is.apps.googleusercontent.com', // From Google Cloud Console
      offlineAccess: true, // To get refresh token
      forceCodeForRefreshToken: true,
      scopes: [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar',
        'openid',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ]
    });
  }, []);

  const safeStringify = (obj: any): string => {
    return JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );
  };

  // Native Google Sign-In Handler
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
      const userName = activeAccount?.userName ||
        activeAccount?.user_name ||
        activeAccount?.username ||
        activeAccount?.name;

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
          fullName: user.name,
          photo: user.photo,
          expiresAt: expires_at, // Optional: store expiry time if needed
        });

        Alert.alert('Success', 'Google account connected successfully!', [
          {
            text: 'OK',
            onPress: () => {
              // Simply go back - the CreateEventScreen will detect the change
              navigation.goBack();
            },
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
      const userName = activeAccount?.userName ||
        activeAccount?.user_name ||
        activeAccount?.username ||
        activeAccount?.name;

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

  // Zoom OAuth Handlers (keep WebView for Zoom since it might not have native SDK)
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mainCard}>
          <Text style={styles.title}>Connect Your Apps</Text>
          <Text style={styles.description}>
            Connect your accounts to generate video meeting links when creating events.
          </Text>

          {/* Google Integration Card */}
          <View style={styles.integrationCard}>
            <View style={styles.integrationHeader}>
              <View style={styles.integrationLogoContainer}>
                <FeatherIcon name="video" size={24} color="#34A853" />
              </View>
              <View style={styles.integrationInfo}>
                <Text style={styles.integrationName}>Google Meet</Text>
                {googleIntegration.isConnected && (
                  <>
                    <Text style={styles.connectedEmail}>Connected as: {googleIntegration.email}</Text>
                    <Text style={styles.connectedName}>{googleIntegration.fullName}</Text>
                  </>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.connectButton,
                googleIntegration.isConnected ? styles.disconnectButton : styles.connectButtonActive,
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleGoogleConnect}
              disabled={isLoading}
            >
              <LinearGradient
                colors={
                  isLoading
                    ? [colors.grey400, colors.grey400]
                    : googleIntegration.isConnected
                      ? ['#FF6B6B', '#EE5A52']
                      : ['#18F06E', '#0B6DE0']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.connectButtonText}>
                    {googleIntegration.isConnected ? 'Disconnect' : 'Connect Google'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Zoom Integration Card */}
          <View style={[styles.integrationCard, { marginTop: spacing.lg }]}>
            <View style={styles.integrationHeader}>
              <View style={styles.integrationLogoContainer}>
                <FeatherIcon name="video" size={24} color="#2D8CFF" />
              </View>
              <View style={styles.integrationInfo}>
                <Text style={styles.integrationName}>Zoom</Text>
                {zoomIntegration.isConnected && (
                  <>
                    <Text style={styles.connectedEmail}>Connected as: {zoomIntegration.email}</Text>
                    <Text style={styles.connectedName}>{zoomIntegration.fullName}</Text>
                  </>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.connectButton,
                zoomIntegration.isConnected ? styles.disconnectButton : styles.connectButtonActive,
                isLoadingZoom && styles.buttonDisabled,
              ]}
              onPress={handleZoomConnect}
              disabled={isLoadingZoom}
            >
              <LinearGradient
                colors={
                  isLoadingZoom
                    ? [colors.grey400, colors.grey400]
                    : zoomIntegration.isConnected
                      ? ['#FF6B6B', '#EE5A52']
                      : ['#2D8CFF', '#1E6BD8']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
              >
                {isLoadingZoom ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.connectButtonText}>
                    {zoomIntegration.isConnected ? 'Disconnect' : 'Connect Zoom'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* OAuth WebView Modal (for Zoom) */}
      {showWebView && authUrl && (
        <GoogleOAuthWebView
          authUrl={authUrl}
          onSuccess={handleOAuthSuccess}
          onError={handleOAuthError}
          onCancel={handleOAuthCancel}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  mainCard: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.xl, ...shadows.sm },
  title: { fontSize: fontSize.textSize24, fontWeight: 'bold', textAlign: 'center', marginBottom: spacing.md },
  description: { fontSize: fontSize.textSize14, textAlign: 'center', marginBottom: spacing.xl },
  integrationCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.grey20 },
  integrationHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  integrationLogoContainer: { width: scaleWidth(48), height: scaleWidth(48), borderRadius: borderRadius.md, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.grey20 },
  integrationInfo: { flex: 1, marginLeft: spacing.md },
  integrationName: { fontSize: fontSize.textSize18, fontWeight: '600' },
  connectedEmail: { fontSize: fontSize.textSize12, color: colors.figmaAccent, marginTop: spacing.xs },
  connectedName: { fontSize: fontSize.textSize12, color: colors.mediumgray, marginTop: 2 },
  connectButton: { borderRadius: borderRadius.lg, overflow: 'hidden', ...shadows.sm },
  connectButtonActive: {},
  disconnectButton: {},
  buttonDisabled: { opacity: 0.6 },
  gradient: { paddingVertical: spacing.md, alignItems: 'center' },
  connectButtonText: { fontSize: fontSize.textSize16, color: colors.white, fontWeight: '600' },
});

export default IntegrationScreen;