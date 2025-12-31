import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  StyleSheet,
  ScrollView,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { Colors } from '../../constants/Colors';
import { NcogWallet } from '../../assets/svgs';
import { Fonts } from '../../constants/Fonts';
import {
  moderateScale,
  scaleWidth,
  scaleHeight,
  screenWidth,
  screenHeight,
} from '../../utils/dimensions';
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
            <DIcon
              width={scaleWidth(69.9806900024414)}
              height={scaleHeight(72.00009155273438)}
            />
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
            <TouchableOpacity onPress={handleWalletConnect} activeOpacity={0.8}>
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
        </View>
      </View>
    </SafeAreaView>
  );
};

const isTablet = screenWidth >= 600;
const isSmallMobile = screenWidth <= 340;
const isLargeMobile = screenWidth > 400 && screenWidth < 600;
const isFolding =
  screenWidth >= 380 && screenWidth <= 500 && screenHeight > 800;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center', // Center content vertically
  },

  // Main Content Frame - All content inside with exact dimensions
  mainContentFrame: {
    width: isTablet
      ? Math.min(screenWidth * 0.7, 600)
      : isFolding
      ? scaleWidth(420)
      : isLargeMobile
      ? scaleWidth(400)
      : isSmallMobile
      ? scaleWidth(320)
      : scaleWidth(374),
    alignItems: 'center',
    marginTop: isTablet
      ? scaleHeight(24) // Much smaller margin for tablets
      : isFolding
      ? scaleHeight(150)
      : isLargeMobile
      ? scaleHeight(140)
      : isSmallMobile
      ? scaleHeight(80)
      : scaleHeight(134),
  },

  // Top Calendar Icon
  topIconContainer: {
    width: isTablet
      ? scaleWidth(120)
      : isFolding
      ? scaleWidth(80)
      : scaleWidth(69.9806900024414),
    height: isTablet
      ? scaleHeight(130)
      : isFolding
      ? scaleHeight(90)
      : scaleHeight(72.00009155273438),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isTablet
      ? scaleHeight(32)
      : isFolding
      ? scaleHeight(20)
      : scaleHeight(16),
  },

  // Title Container
  titleContainer: {
    width: isTablet
      ? Math.min(screenWidth * 0.6, 500)
      : isFolding
      ? scaleWidth(340)
      : isLargeMobile
      ? scaleWidth(320)
      : isSmallMobile
      ? scaleWidth(220)
      : scaleWidth(326),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isTablet
      ? scaleHeight(20)
      : isFolding
      ? scaleHeight(12)
      : scaleHeight(8),
  },
  title: {
    fontFamily: Fonts.latoExtraBold,
    fontSize: isTablet
      ? moderateScale(38)
      : isFolding
      ? moderateScale(32)
      : isLargeMobile
      ? moderateScale(28)
      : isSmallMobile
      ? moderateScale(22)
      : moderateScale(30),
    lineHeight: isTablet
      ? moderateScale(46)
      : isFolding
      ? moderateScale(40)
      : isLargeMobile
      ? moderateScale(34)
      : isSmallMobile
      ? moderateScale(28)
      : moderateScale(38),
    color: Colors.black,
    textAlign: 'center',
    letterSpacing: 0,
  },

  // Subtitle
  subtitle: {
    width: isTablet
      ? Math.min(screenWidth * 0.6, 500)
      : isFolding
      ? scaleWidth(340)
      : isLargeMobile
      ? scaleWidth(320)
      : isSmallMobile
      ? scaleWidth(220)
      : scaleWidth(326),
    fontFamily: Fonts.latoRegular,
    fontSize: isTablet
      ? moderateScale(18)
      : isFolding
      ? moderateScale(16)
      : isLargeMobile
      ? moderateScale(15)
      : isSmallMobile
      ? moderateScale(12)
      : moderateScale(14),
    lineHeight: isTablet
      ? moderateScale(26)
      : isFolding
      ? moderateScale(22)
      : isLargeMobile
      ? moderateScale(20)
      : isSmallMobile
      ? moderateScale(16)
      : moderateScale(20),
    color: Colors.grey,
    textAlign: 'center',
    letterSpacing: 0,
    marginBottom: isTablet
      ? scaleHeight(32)
      : isFolding
      ? scaleHeight(28)
      : isLargeMobile
      ? scaleHeight(24)
      : isSmallMobile
      ? scaleHeight(16)
      : scaleHeight(20),
  },

  // Wallet Icon Container
  walletIconContainer: {
    width: isTablet
      ? scaleWidth(200)
      : isFolding
      ? scaleWidth(150)
      : scaleWidth(134),
    alignItems: 'center',
    marginBottom: isTablet
      ? scaleHeight(32)
      : isFolding
      ? scaleHeight(20)
      : scaleHeight(16),
  },
  walletIconWrapper: {
    width: isTablet
      ? scaleWidth(200)
      : isFolding
      ? scaleWidth(150)
      : scaleWidth(134),
    height: isTablet
      ? scaleWidth(200)
      : isFolding
      ? scaleWidth(150)
      : scaleWidth(134),
    borderRadius: isTablet
      ? scaleWidth(100)
      : isFolding
      ? scaleWidth(75)
      : scaleWidth(67),
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: isTablet
      ? scaleWidth(70)
      : isFolding
      ? scaleWidth(50)
      : scaleWidth(40),
  },
  ncogText: {
    fontFamily: Fonts.latoBold,
    fontSize: isTablet
      ? moderateScale(22)
      : isFolding
      ? moderateScale(16)
      : isLargeMobile
      ? moderateScale(15)
      : isSmallMobile
      ? moderateScale(12)
      : moderateScale(14),
    color: Colors.black,
    marginTop: isTablet
      ? scaleHeight(20)
      : isFolding
      ? scaleHeight(12)
      : scaleHeight(10),
  },

  // Continue Text
  continueText: {
    width: isTablet
      ? Math.min(screenWidth * 0.6, 500)
      : isFolding
      ? scaleWidth(340)
      : isLargeMobile
      ? scaleWidth(320)
      : isSmallMobile
      ? scaleWidth(220)
      : scaleWidth(326),
    fontFamily: Fonts.latoRegular,
    fontSize: isTablet
      ? moderateScale(20)
      : isFolding
      ? moderateScale(16)
      : isLargeMobile
      ? moderateScale(15)
      : isSmallMobile
      ? moderateScale(12)
      : moderateScale(14),
    lineHeight: isTablet
      ? moderateScale(28)
      : isFolding
      ? moderateScale(22)
      : isLargeMobile
      ? moderateScale(20)
      : isSmallMobile
      ? moderateScale(16)
      : moderateScale(20),
    color: Colors.black,
    textAlign: 'center',
    letterSpacing: 0,
    marginBottom: isTablet
      ? scaleHeight(36)
      : isFolding
      ? scaleHeight(28)
      : isLargeMobile
      ? scaleHeight(24)
      : isSmallMobile
      ? scaleHeight(16)
      : scaleHeight(20),
  },

  // Button
  connectButton: {
    width: isTablet
      ? scaleWidth(400)
      : isFolding
      ? scaleWidth(340)
      : isLargeMobile
      ? scaleWidth(320)
      : isSmallMobile
      ? scaleWidth(220)
      : scaleWidth(300),
    minHeight: isTablet
      ? scaleHeight(60)
      : isFolding
      ? scaleHeight(50)
      : isLargeMobile
      ? scaleHeight(44)
      : isSmallMobile
      ? scaleHeight(36)
      : scaleHeight(44),
    backgroundColor: '#00AEEF',
    borderRadius: isTablet
      ? moderateScale(14)
      : isFolding
      ? moderateScale(12)
      : moderateScale(8),
    paddingVertical: isTablet
      ? scaleHeight(18)
      : isFolding
      ? scaleHeight(14)
      : isLargeMobile
      ? scaleHeight(12)
      : isSmallMobile
      ? scaleHeight(8)
      : scaleHeight(10),
    paddingHorizontal: isTablet
      ? scaleWidth(32)
      : isFolding
      ? scaleWidth(24)
      : isLargeMobile
      ? scaleWidth(20)
      : isSmallMobile
      ? scaleWidth(10)
      : scaleWidth(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A0D12',
    shadowOffset: {
      width: 0,
      height: isTablet ? scaleHeight(2) : scaleHeight(1),
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    fontFamily: Fonts.latoMedium,
    fontSize: isTablet
      ? moderateScale(20)
      : isFolding
      ? moderateScale(18)
      : isLargeMobile
      ? moderateScale(16)
      : isSmallMobile
      ? moderateScale(13)
      : moderateScale(16),
    lineHeight: isTablet
      ? moderateScale(28)
      : isFolding
      ? moderateScale(24)
      : isLargeMobile
      ? moderateScale(22)
      : isSmallMobile
      ? moderateScale(18)
      : moderateScale(24),
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: 0,
    flexShrink: 1,
  },
});

export default WalletScreen;
