import React, { useState } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../stores/useAuthStore';
import { useApiClient } from '../hooks/useApi';
import { useActiveAccount } from '../stores/useActiveAccount';
import GoogleOAuthWebView from '../components/GoogleOAuthWebView';
import { colors, fontSize, spacing, borderRadius, shadows } from '../utils/LightTheme';
import { scaleWidth, scaleHeight, moderateScale } from '../utils/dimensions';
import NcogIntegration from '../services/SimpleNcogIntegration';
import { Screen } from '../navigations/appNavigation.type';
import PlainHeader from '../components/PlainHeader';
import CustomDrawer from '../components/CustomDrawer';

const IntegrationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { returnToScreen } = route.params || {};
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
  const [oauthType, setOauthType] = useState<'google' | 'zoom'>('google');
  const ncogIntegration = React.useRef(new NcogIntegration('DCalendar', 'dcalendar'));
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleMenuPress = () => {
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  // Helper to safely stringify objects with BigInt (for blockchain data)
  const safeStringify = (obj: any): string => {
    return JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );
  };

  const handleGoogleConnect = async () => {
    try {
      if (googleIntegration.isConnected) {
        return Alert.alert('Disconnect Google', 'Do you want to disconnect?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disconnect', style: 'destructive', onPress: handleGoogleDisconnect },
        ]);
      }

      setIsLoading(true);
      
      // Get username - check activeAccount structure
      console.log('Active Account:', safeStringify(activeAccount));
      
      // Try userName first (most common), then other fields
      const userName = activeAccount?.userName || 
                       activeAccount?.user_name || 
                       activeAccount?.username || 
                       activeAccount?.name;
      
      console.log('Using username:', userName);
      
      if (!userName) {
        Alert.alert(
          'User Not Found', 
          'Cannot find username. Please ensure you are logged in.\n\n' +
          `Account data: ${safeStringify(activeAccount).substring(0, 300)}`
        );
        setIsLoading(false);
        return;
      }

      try {
        // Call API - same as web code: getGoogleAuthUrl(user_name)
        const response = await api('GET', `/google/auth-url?user_name=${encodeURIComponent(userName)}`, undefined);
        
        console.log('API Response:', safeStringify(response.data));
        
        // Extract URL - handle nested data structure (response.data.data || response.data)
        const url = response.data?.data || response.data;
        
        // Check if it's an error response
        if (url?.statusCode === 400 || url?.status === false) {
          Alert.alert('Error', url?.message || 'Backend returned an error. Check if user exists.');
          setIsLoading(false);
          return;
        }
        
        // Get the actual URL string
        const authUrl = typeof url === 'string' ? url : url?.authUrl || url?.url;
        
        if (!authUrl || !authUrl.startsWith('http')) {
          Alert.alert(
            'Error', 
            `No valid URL found.\n\nResponse: ${safeStringify(url).substring(0, 200)}`
          );
          setIsLoading(false);
          return;
        }

        // Open WebView with URL
        setOauthType('google');
        setAuthUrl(authUrl);
        setShowWebView(true);
        
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || error.message || 'API call failed';
        Alert.alert('Error', errorMsg);
      } finally {
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('Google OAuth error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to get OAuth URL';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    try {
      setIsLoading(true);
      disconnectGoogle();
      Alert.alert('Disconnected', 'Google account disconnected successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to disconnect');
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthError = (error: string) => {
    setShowWebView(false);
    const errorMsg = oauthType === 'zoom' 
      ? error || 'Failed to authenticate with Zoom'
      : error || 'Failed to authenticate with Google';
    Alert.alert('Authentication Error', errorMsg);
  };

  const handleOAuthCancel = () => {
    setShowWebView(false);
  };

  // Zoom OAuth Handlers - matches web code: getZoomAuthUrl()
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
        // Call API - matches web: getZoomAuthUrl() which calls GET /zoom/auth
        const response = await api('GET', `/zoom/auth`, undefined);
        
        console.log('Zoom API Response:', safeStringify(response.data));
        
        // Extract URL - handle nested data structure
        const url = response.data?.data || response.data;
        
        // Check if it's an error response
        if (url?.statusCode === 400 || url?.status === false) {
          Alert.alert('Error', url?.message || 'Backend returned an error. Check if user exists.');
          setIsLoadingZoom(false);
          return;
        }
        
        // Get the actual URL string
        const zoomAuthUrl = typeof url === 'string' ? url : url?.authUrl || url?.url;
        
        if (!zoomAuthUrl || !zoomAuthUrl.startsWith('http')) {
          Alert.alert(
            'Error', 
            `No valid URL found.\n\nResponse: ${safeStringify(url).substring(0, 200)}`
          );
          setIsLoadingZoom(false);
          return;
        }

        // Open WebView with URL
        setOauthType('zoom');
        setAuthUrl(zoomAuthUrl);
        setShowWebView(true);
        
      } catch (error: any) {
        console.error('Zoom OAuth API error:', error);
        
        // Handle 404 - endpoint doesn't exist
        if (error.response?.status === 404) {
          Alert.alert(
            'Zoom Integration Not Available',
            'The Zoom OAuth endpoint is not configured on the backend yet.\n\n' +
            'Backend needs to implement:\n' +
            '• GET /zoom/auth\n' +
            '• PUT /zoom/disconnect\n' +
            '• OAuth callback handler for Zoom\n' +
            '• Integration status endpoint for Zoom\n\n' +
            'Please contact your backend developer to add Zoom OAuth support.',
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
      
      if (error.response?.status === 404) {
        Alert.alert(
          'Zoom Integration Not Available',
          'The Zoom OAuth endpoint is not configured on the backend yet.\n\n' +
          'Please contact your backend developer to add Zoom OAuth support.',
          [{ text: 'OK' }]
        );
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to get OAuth URL';
        Alert.alert('Error', errorMessage);
      }
      setIsLoadingZoom(false);
    }
  };

  const handleZoomDisconnect = async () => {
    try {
      setIsLoadingZoom(true);
      // Call API - matches web: disconnectZoomStatus() which calls PUT /zoom/disconnect
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

  // Updated OAuth success handler to handle both Google and Zoom
  const handleOAuthSuccess = async (data: {
    accessToken?: string;
    refreshToken?: string;
    email?: string;
    name?: string;
    photo?: string;
  }) => {
    try {
      setShowWebView(false);
      
      // If we have tokens directly, save them
      if (data.accessToken) {
        if (oauthType === 'zoom') {
          connectZoom({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            email: data.email,
            fullName: data.name,
            photo: data.photo,
          });
          Alert.alert('✅ Connected', 'Zoom account connected successfully!');
        } else {
          connectGoogle({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            email: data.email,
            fullName: data.name,
            photo: data.photo,
          });
          
          // After Google connection succeeds, immediately trigger NCOG wallet connection
          try {
            console.log('Google connected successfully - triggering NCOG wallet connection...');
            await ncogIntegration.current.connectToNcog();
          } catch (ncogError) {
            console.error('Failed to open NCOG wallet:', ncogError);
            // Don't show error - user can connect wallet later
          }
          
          // If we came from CreateEventScreen, navigate back first, then show alert
          if (returnToScreen) {
            navigation.navigate(returnToScreen as any);
            // Show success alert after navigation
            setTimeout(() => {
              Alert.alert('✅ Connected', 'Google account connected successfully!');
            }, 500);
          } else {
            Alert.alert('✅ Connected', 'Google account connected successfully!');
          }
        }
        return;
      }

      // If no tokens, backend handled it - verify with backend
      const loadingState = oauthType === 'zoom' ? setIsLoadingZoom : setIsLoading;
      loadingState(true);
      
      try {
        // Check if backend successfully processed OAuth
        const statusResponse = await api('GET', '/calendarIntgrationStatus', undefined);
        
        const integrations = statusResponse.data?.data || statusResponse.data || {};
        
        if (oauthType === 'zoom') {
          if (integrations.isZoomConnected) {
            connectZoom({
              email: integrations.zoomEmail,
              fullName: integrations.zoomName,
            });
            Alert.alert('✅ Connected', 'Zoom account connected successfully!');
          } else {
            Alert.alert(
              'Backend Error',
              'Zoom OAuth completed but backend returned an error.\n\n' +
              'This might mean:\n' +
              '1. Backend callback handler has an issue\n' +
              '2. Check backend logs for details\n' +
              '3. Try again or contact support'
            );
          }
        } else {
          if (integrations.isGoogleConnected) {
            connectGoogle({
              email: integrations.googleEmail,
              fullName: integrations.googleName,
            });
            
            // After Google connection succeeds, immediately trigger NCOG wallet connection
            try {
              console.log('Google connected successfully - triggering NCOG wallet connection...');
              await ncogIntegration.current.connectToNcog();
            } catch (ncogError) {
              console.error('Failed to open NCOG wallet:', ncogError);
              // Don't show error - user can connect wallet later
            }
            
            // If we came from CreateEventScreen, navigate back first, then show alert
            if (returnToScreen) {
              navigation.navigate(returnToScreen as any);
              // Show success alert after navigation
              setTimeout(() => {
                Alert.alert('✅ Connected', 'Google account connected successfully!');
              }, 500);
            } else {
              Alert.alert('✅ Connected', 'Google account connected successfully!');
            }
          } else {
            Alert.alert(
              'Backend Error',
              'Google OAuth completed but backend returned an error.\n\n' +
              'This might mean:\n' +
              '1. Backend callback handler has an issue\n' +
              '2. Check backend logs for details\n' +
              '3. Try again or contact support'
            );
          }
        }
      } catch (err: any) {
        console.error('Error checking integration status:', err);
        Alert.alert(
          'Status Check Failed',
          'Could not verify OAuth status from backend.\n\n' +
          'Error: ' + (err.response?.data?.message || err.message) + '\n\n' +
          'If you completed sign-in, the connection may still be successful. Check your integrations.'
        );
      } finally {
        loadingState(false);
      }
    } catch (error) {
      console.error(`Error saving ${oauthType} integration:`, error);
      Alert.alert('Error', 'Failed to save connection');
      if (oauthType === 'zoom') {
        setIsLoadingZoom(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <PlainHeader onMenuPress={handleMenuPress} title="Integration" />
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
                    : ['#18F06E', '#0B6DE0']
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

      {/* OAuth WebView Modal */}
      {showWebView && authUrl && (
        <GoogleOAuthWebView
          authUrl={authUrl}
          onSuccess={handleOAuthSuccess}
          onError={handleOAuthError}
          onCancel={handleOAuthCancel}
        />
      )}

      {/* Custom Drawer */}
      <CustomDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.white 
  },
  content: { 
    flex: 1, 
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  mainCard: { 
    backgroundColor: colors.white, 
    borderRadius: borderRadius.xl, 
    padding: spacing.xl, 
    marginTop: spacing.md,
    ...shadows.sm 
  },
  title: { 
    fontSize: fontSize.textSize24, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: spacing.md,
    color: colors.blackText,
  },
  description: { 
    fontSize: fontSize.textSize14, 
    textAlign: 'center', 
    marginBottom: spacing.xl,
    color: colors.grey400,
    lineHeight: 20,
  },
  integrationCard: { 
    backgroundColor: colors.white, 
    borderRadius: borderRadius.lg, 
    padding: spacing.lg, 
    borderWidth: 1, 
    borderColor: colors.grey20,
    marginBottom: spacing.md,
  },
  integrationHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: spacing.md 
  },
  integrationLogoContainer: { 
    width: scaleWidth(48), 
    height: scaleWidth(48), 
    borderRadius: borderRadius.md, 
    backgroundColor: '#F8F9FA', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: colors.grey20,
    marginRight: spacing.md,
  },
  integrationInfo: { 
    flex: 1 
  },
  integrationName: { 
    fontSize: fontSize.textSize18, 
    fontWeight: '600',
    color: colors.blackText,
  },
  connectedEmail: { 
    fontSize: fontSize.textSize12, 
    color: colors.figmaAccent, 
    marginTop: spacing.xs 
  },
  connectedName: { 
    fontSize: fontSize.textSize12, 
    color: colors.mediumgray, 
    marginTop: 2 
  },
  connectButton: { 
    borderRadius: borderRadius.lg, 
    overflow: 'hidden', 
    ...shadows.sm,
    marginTop: spacing.sm,
  },
  connectButtonActive: {},
  disconnectButton: {},
  buttonDisabled: { 
    opacity: 0.6 
  },
  gradient: { 
    paddingVertical: spacing.md, 
    alignItems: 'center' 
  },
  connectButtonText: { 
    fontSize: fontSize.textSize16, 
    color: colors.white, 
    fontWeight: '600' 
  },
});

export default IntegrationScreen;
