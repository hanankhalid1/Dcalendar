import { View, Text, TouchableOpacity, Linking, StyleSheet, ScrollView } from 'react-native';
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
import DIcon from '../../assets/svgs/DIcon.svg';

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
        navigation.navigate('account' as never);
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
      navigation.navigate('account' as never);
    } else {
      await ncog.registerWithNcog();
    }
  };

  useEffect(() => {
    (async () => {
      const wallet = await AsyncStorage.getItem('token');
      if (wallet) {
        console.log('Wallet Already connected');
        navigation.navigate('account' as never);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Main Content Frame - All content inside */}
        <View style={styles.mainContentFrame}>
          {/* Top Calendar Icon */}
          <View style={styles.topIconContainer}>
            <DIcon width={scale(69.9806900024414)} height={scale(72.00009155273438)} />
          </View>

          {/* Title Container */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Connect Your Wallet</Text>
          </View>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Click the Wallet icon to connect your Wallet
          </Text>

          {/* Wallet Icon Container with dotted border */}
          <View style={styles.walletIconContainer}>
            <TouchableOpacity 
              onPress={handleWalletConnect}
              activeOpacity={0.8}
            >
              <View style={styles.walletIconWrapper}>
                <NcogWallet width={54} height={54} />
              </View>
            </TouchableOpacity>
            <Text style={styles.ncogText}>NCOG</Text>
          </View>

          {/* Continue Text */}
          <Text style={styles.continueText}>
            Connect your Wallet to continue
          </Text>

          {/* Action Button */}
          <TouchableOpacity
            onPress={handleWalletConnect}
            style={styles.connectButton}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Get free test tokens? (NFC Faucet)</Text>
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
    alignItems: 'center',
  },

  // Main Content Frame - All content inside with exact dimensions
  mainContentFrame: {
    width: scale(374),
    alignItems: 'center',
    marginTop: scale(134),
  },

  // Top Calendar Icon
  topIconContainer: {
    width: scale(69.9806900024414),
    height: scale(72.00009155273438),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(16),
  },

  // Title Container
  titleContainer: {
    width: scale(326),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(8),
  },
  title: {
    fontFamily: Fonts.latoExtraBold,
    fontSize: 30,
    lineHeight: 38,
    color: Colors.black,
    textAlign: 'center',
    letterSpacing: 0,
  },

  // Subtitle
  subtitle: {
    width: scale(326),
    fontFamily: Fonts.latoRegular,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.grey,
    textAlign: 'center',
    letterSpacing: 0,
    marginBottom: scale(20),
  },

  // Wallet Icon Container
  walletIconContainer: {
    width: scale(134),
    alignItems: 'center',
    marginBottom: scale(16),
  },
  walletIconWrapper: {
    width: scale(134),
    height: scale(134),
    borderRadius: scale(150),
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(40),
  },
  ncogText: {
    fontFamily: Fonts.latoBold,
    fontSize: scale(14),
    color: Colors.black,
    marginTop: 10,
  },

  // Continue Text
  continueText: {
    width: scale(326),
    fontFamily: Fonts.latoRegular,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.black,
    textAlign: 'center',
    letterSpacing: 0,
    marginBottom: scale(20),
  },

  // Button
  connectButton: {
    width: scale(300),
    minHeight: 44,
    backgroundColor: '#00AEEF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A0D12',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    fontFamily: Fonts.latoMedium,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: 0,
    flexShrink: 1,
  },
});

export default WalletScreen;