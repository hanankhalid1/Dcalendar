import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Image,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { moderateScale, scaleHeight, scaleWidth } from '../utils/dimensions';
import {
  colors,
  fontSize,
  spacing,
  borderRadius,
  shadows,
} from '../utils/LightTheme';

const SignInScreen = ({}) => {
  const [username, setUsername] = useState('');
  const [isUsernameValid, setIsUsernameValid] = useState(false);
  const navigation = useNavigation();
  const handleUsernameChange = (text: string) => {
    setUsername(text);
    // Simple validation - username should be at least 3 characters
    setIsUsernameValid(text.length >= 3);
  };

  const handleConfirm = () => {
    if (isUsernameValid) {
      // Handle sign in logic here
      console.log('Username confirmed:', username);
      navigation.navigate('HomeScreen');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Main Card */}
      <View style={styles.mainCard}>
        {/* Title */}
        <Text style={styles.title}>Choose Your Unique Username</Text>

        {/* Description */}
        <Text style={styles.description}>
          Choose your unique username, this name will work as your dmail account
          as well as your Web3ID!
        </Text>

        {/* Username Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.usernameInput}
            placeholder="Username"
            placeholderTextColor={colors.grey400}
            value={username}
            onChangeText={handleUsernameChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.domainContainer}>
            <View style={styles.gradientTextContainer}>
              <LinearGradient
                colors={['#18F06E', '#0B6DE0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientMask}
              >
                <Text style={styles.gradientText}>@dmail.earth</Text>
              </LinearGradient>
            </View>
            {isUsernameValid && (
              <FeatherIcon
                name="check-circle"
                size={16}
                color={colors.figmaAccent}
                style={styles.checkIcon}
              />
            )}
          </View>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={[
            styles.confirmButton,
            !isUsernameValid && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={!isUsernameValid}
        >
          <LinearGradient
            colors={
              isUsernameValid
                ? ['#18F06E', '#0B6DE0']
                : [colors.grey400, colors.grey400]
            }
            start={{ x: 0, y: 2 }}
            end={{ x: 1, y: 1.2 }}
            style={styles.gradient}
          >
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* DCalendar Branding */}

      {/* Footer Links */}
      {/* <View style={styles.footerContainer}>
        <TouchableOpacity style={styles.footerLink}>
          <Text style={styles.footerLinkText}>Terms And Conditions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerLink}>
          <Text style={styles.footerLinkText}>Privacy Policy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerLink}>
          <Text style={styles.footerLinkText}>Contact Us</Text>
        </TouchableOpacity>
      </View> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  mainCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    width: '100%',
    maxWidth: scaleWidth(400),
    shadowColor: '#0B6DE0',
    shadowOffset: { width: 10, height: 20 },
    shadowOpacity: 0.9,
    shadowRadius: 2,
    elevation: 3,
  },
  title: {
    fontSize: fontSize.textSize24,
    fontWeight: 'bold',
    color: colors.blackText,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: fontSize.textSize14,
    color: colors.mediumgray,
    textAlign: 'center',
    lineHeight: fontSize.textSize20,
    marginBottom: spacing.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.grey20,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xl,
    backgroundColor: colors.white,
  },
  usernameInput: {
    flex: 1,
    fontSize: fontSize.textSize16,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  domainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  domainText: {
    fontSize: fontSize.textSize14,
    color: colors.mediumgray,
    marginRight: spacing.xs,
  },
  gradientTextContainer: {
    marginRight: spacing.xs,
  },
  gradientMask: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  gradientText: {
    fontSize: fontSize.textSize14,
    color: 'white',
    fontWeight: '600',
    // textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    // textShadowRadius: 2,
  },
  checkIcon: {
    marginLeft: spacing.xs,
  },
  confirmButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  gradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: fontSize.textSize16,
    color: colors.white,
    fontWeight: '600',
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: moderateScale(24),
    height: moderateScale(24),
    marginRight: spacing.sm,
  },
  logoDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    backgroundColor: colors.figmaAccent,
    borderRadius: moderateScale(3),
    margin: moderateScale(1),
  },
  logoDotMissing: {
    backgroundColor: 'transparent',
  },
  brandName: {
    fontSize: fontSize.textSize18,
    fontWeight: 'bold',
    color: colors.blackText,
  },
  brandDescription: {
    fontSize: fontSize.textSize12,
    color: colors.mediumgray,
    textAlign: 'center',
    lineHeight: fontSize.textSize16,
    maxWidth: scaleWidth(300),
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLink: {
    marginHorizontal: spacing.sm,
  },
  footerLinkText: {
    fontSize: fontSize.textSize12,
    color: colors.mediumgray,
    textDecorationLine: 'underline',
  },
});

export default SignInScreen;
