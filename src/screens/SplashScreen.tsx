import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DIcon from '../assets/svgs/DIcon.svg';
import { Fonts } from '../constants/Fonts';
import { Colors } from '../constants/Colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SplashScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    // Navigate to main app after 2-3 seconds
    const timer = setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Wallet' as never }],
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <DIcon width={72} height={72} />
        <Text style={styles.appName} numberOfLines={1}>
          DCalendar
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 1,
  },
  contentContainer: {
    width: 281.98,
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    opacity: 1,
  },
  appName: {
    fontFamily: Fonts.latoExtraBold,
    fontSize: 42.79,
    fontWeight: '800',
    color: '#000000',
    lineHeight: 42.79, // 100% of font size (line-height: 100%)
    letterSpacing: 0,
  },
});

export default SplashScreen;

