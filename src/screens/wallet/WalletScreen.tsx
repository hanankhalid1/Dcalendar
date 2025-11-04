import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Colors } from '../../constants/Colors';
import { NcogWallet } from '../../assets/svgs';
import { Fonts } from '../../constants/Fonts';
import { scale } from 'react-native-size-matters';
import NcogIntegration from '../../services/SimpleNcogIntegration';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useWalletStore } from '../../stores/useWalletStore';
import { handleNcogResponse } from '../../utils/ncogHandler';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Logo from '../../assets/svgs/logo.svg';

const WalletScreen = () => {
  const ncog = new NcogIntegration('DCalendar', 'dcalendar');
  const navigation = useNavigation();
  const { wallet, setWallet } = useWalletStore();
  const [refresh, setrefresh] = useState(false);

  useEffect(() => {
    const onUrl = ({ url }: { url: string }) => {
      console.log('🔗 Received deep link:', url);

      const response = handleNcogResponse(url);
      if (response === true) {
        setrefresh(!refresh);
        navigation.navigate('account');
      }
    };

    Linking.addEventListener('url', onUrl);

    Linking.getInitialURL().then(initialUrl => {
      if (initialUrl) handleNcogResponse(initialUrl);
    });

    return () => Linking.removeAllListeners('url');
  }, []);

  const handleWalletConnect = async () => {
    const wallet = await AsyncStorage.getItem('token');
    console.log('wallet1234', wallet);
    if (wallet) {
      console.log('Wallet Already connected');
      navigation.navigate('account');
    } else {
      await ncog.registerWithNcog();
    }
  };

  useEffect(() => {
    (async () => {
      const wallet = await AsyncStorage.getItem('token');
      if (wallet) {
        console.log('Wallet Already connected');
        navigation.navigate('account');
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Top Section - App Branding */}
     
        {/* Middle Section - Main Content */}
        <View style={styles.middleSection}>
          {/* Wallet Icon Container with gradient background */}
          <View style={styles.iconWrapper}>
            <LinearGradient
              colors={[Colors.primaryGreen, Colors.primaryblue]}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <NcogWallet width={95} height={95} style={styles.walletIcon} />
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={styles.title}>Connect Your Wallet</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Securely connect your NCOG Wallet to access decentralized contacts and calendar features
          </Text>
        </View>

        {/* Bottom Section - Action Button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            onPress={handleWalletConnect}
            style={styles.connectButton}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.primaryGreen, Colors.primaryblue]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>Connect NCOG Wallet</Text>
            </LinearGradient>
          </TouchableOpacity>


        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // Top Section
  topSection: {
    display: 'flex',
    flexDirection:'row',
    paddingTop: 20,
    paddingBottom: 0,
    justifyContent:'flex-start',
    alignItems:'center'
  },
  appName: {
    fontFamily: Fonts.bold,
    fontSize: scale(24),
    color: Colors.black,
    marginBottom: 12,
  },
  decorativeLine: {
    width: 60,
    height: 4,
    backgroundColor: Colors.primaryblue,
    borderRadius: 2,
  },

  // Middle Section
  middleSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  iconWrapper: {
    marginBottom: 32,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primaryblue,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  walletIcon: {
    // Icon styling if needed
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: scale(28),
    color: Colors.black,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },

  // Bottom Section
  bottomSection: {
    paddingBottom: 40,
    marginBottom: 40,
  },
  connectButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.primaryblue,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  helpText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});

export default WalletScreen;