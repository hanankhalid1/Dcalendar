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

// Helper to cap font sizes for tablets
const getTabletSafeFontSize = (
  mobileSize: number,
  tabletSize: number,
  maxSize: number,
) => {
  if (isTablet) {
    return Math.min(tabletSize, maxSize);
  }
  return mobileSize;
};

// Helper to cap dimensions for tablets
const getTabletSafeDimension = (
  mobileValue: number,
  foldingValue: number,
  largeMobileValue: number,
  smallMobileValue: number,
  tabletValue: number,
  maxValue: number,
) => {
  if (isTablet) {
    return Math.min(tabletValue, maxValue);
  } else if (isFolding) {
    return foldingValue;
  } else if (isLargeMobile) {
    return largeMobileValue;
  } else if (isSmallMobile) {
    return smallMobileValue;
  }
  return mobileValue;
};

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
    
  },

  // Top Calendar Icon
  topIconContainer: {
    width: getTabletSafeDimension(
      scaleWidth(69.9806900024414),
      scaleWidth(80),
      scaleWidth(80),
      scaleWidth(70),
      scaleWidth(90),
      100,
    ),
    height: getTabletSafeDimension(
      scaleHeight(72.00009155273438),
      scaleHeight(90),
      scaleHeight(85),
      scaleHeight(70),
      scaleHeight(100),
      110,
    ),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getTabletSafeDimension(
      scaleHeight(16),
      scaleHeight(20),
      scaleHeight(20),
      scaleHeight(16),
      scaleHeight(24),
      28,
    ),
  },

  // Title Container
  titleContainer: {
    width: isTablet
      ? Math.min(screenWidth * 0.65, 450)
      : isFolding
      ? scaleWidth(340)
      : isLargeMobile
      ? scaleWidth(320)
      : isSmallMobile
      ? scaleWidth(220)
      : scaleWidth(326),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getTabletSafeDimension(
      scaleHeight(8),
      scaleHeight(12),
      scaleHeight(12),
      scaleHeight(8),
      scaleHeight(16),
      18,
    ),
  },
  title: {
    fontFamily: Fonts.latoExtraBold,
    fontSize: getTabletSafeFontSize(moderateScale(30), moderateScale(32), 32),
    lineHeight: getTabletSafeFontSize(moderateScale(38), moderateScale(40), 40),
    color: Colors.black,
    textAlign: 'center',
    letterSpacing: 0,
  },

  // Subtitle
  subtitle: {
    width: isTablet
      ? Math.min(screenWidth * 0.65, 450)
      : isFolding
      ? scaleWidth(340)
      : isLargeMobile
      ? scaleWidth(320)
      : isSmallMobile
      ? scaleWidth(220)
      : scaleWidth(326),
    fontFamily: Fonts.latoRegular,
    fontSize: getTabletSafeFontSize(moderateScale(14), moderateScale(16), 16),
    lineHeight: getTabletSafeFontSize(moderateScale(20), moderateScale(24), 24),
    color: Colors.grey,
    textAlign: 'center',
    letterSpacing: 0,
    marginBottom: getTabletSafeDimension(
      scaleHeight(20),
      scaleHeight(28),
      scaleHeight(24),
      scaleHeight(16),
      scaleHeight(28),
      32,
    ),
  },

  // Wallet Icon Container
  walletIconContainer: {
    width: getTabletSafeDimension(
      scaleWidth(134),
      scaleWidth(150),
      scaleWidth(140),
      scaleWidth(120),
      scaleWidth(160),
      180,
    ),
    alignItems: 'center',
    marginBottom: getTabletSafeDimension(
      scaleHeight(16),
      scaleHeight(20),
      scaleHeight(20),
      scaleHeight(16),
      scaleHeight(24),
      28,
    ),
  },
  walletIconWrapper: {
    width: getTabletSafeDimension(
      scaleWidth(134),
      scaleWidth(150),
      scaleWidth(140),
      scaleWidth(120),
      scaleWidth(160),
      180,
    ),
    height: getTabletSafeDimension(
      scaleWidth(134),
      scaleWidth(150),
      scaleWidth(140),
      scaleWidth(120),
      scaleWidth(160),
      180,
    ),
    borderRadius: getTabletSafeDimension(
      scaleWidth(67),
      scaleWidth(75),
      scaleWidth(70),
      scaleWidth(60),
      scaleWidth(80),
      90,
    ),
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: getTabletSafeDimension(
      scaleWidth(40),
      scaleWidth(50),
      scaleWidth(45),
      scaleWidth(35),
      scaleWidth(55),
      65,
    ),
  },
  ncogText: {
    fontFamily: Fonts.latoBold,
    fontSize: getTabletSafeFontSize(moderateScale(14), moderateScale(16), 16),
    color: Colors.black,
    marginTop: getTabletSafeDimension(
      scaleHeight(10),
      scaleHeight(12),
      scaleHeight(12),
      scaleHeight(10),
      scaleHeight(16),
      18,
    ),
  },

  // Continue Text
  continueText: {
    width: isTablet
      ? Math.min(screenWidth * 0.65, 450)
      : isFolding
      ? scaleWidth(340)
      : isLargeMobile
      ? scaleWidth(320)
      : isSmallMobile
      ? scaleWidth(220)
      : scaleWidth(326),
    fontFamily: Fonts.latoRegular,
    fontSize: getTabletSafeFontSize(moderateScale(14), moderateScale(16), 16),
    lineHeight: getTabletSafeFontSize(moderateScale(20), moderateScale(24), 24),
    color: Colors.black,
    textAlign: 'center',
    letterSpacing: 0,
    marginBottom: getTabletSafeDimension(
      scaleHeight(20),
      scaleHeight(28),
      scaleHeight(24),
      scaleHeight(16),
      scaleHeight(32),
      36,
    ),
  },

  // Button
  connectButton: {
    width: isTablet
      ? Math.min(scaleWidth(400), 350)
      : isFolding
      ? scaleWidth(340)
      : isLargeMobile
      ? scaleWidth(320)
      : isSmallMobile
      ? scaleWidth(220)
      : scaleWidth(300),
    minHeight: getTabletSafeDimension(
      scaleHeight(44),
      scaleHeight(50),
      scaleHeight(44),
      scaleHeight(36),
      scaleHeight(52),
      56,
    ),
    backgroundColor: '#00AEEF',
    borderRadius: getTabletSafeFontSize(
      moderateScale(8),
      moderateScale(10),
      12,
    ),
    paddingVertical: getTabletSafeDimension(
      scaleHeight(10),
      scaleHeight(14),
      scaleHeight(12),
      scaleHeight(8),
      scaleHeight(14),
      16,
    ),
    paddingHorizontal: getTabletSafeDimension(
      scaleWidth(16),
      scaleWidth(24),
      scaleWidth(20),
      scaleWidth(10),
      scaleWidth(24),
      28,
    ),
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
    fontSize: getTabletSafeFontSize(moderateScale(16), moderateScale(20), 22),
    lineHeight: getTabletSafeFontSize(moderateScale(24), moderateScale(28), 32),
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: 0,
    flexShrink: 1,
  },
});

export default WalletScreen;
