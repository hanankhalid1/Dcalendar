import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  moderateScale,
  scaledSize,
  scaleHeight,
  scaleWidth,
  screenHeight,
  screenWidth,
} from '../utils/dimensions';
import {
  colors,
  fontSize,
  spacing,
  borderRadius,
  shadows,
} from '../utils/LightTheme';
import MenuOptionsComponent from './MenuOptionsComponent';

interface FloatingActionButtonProps {
  onPress?: () => void;
  onOptionSelect?: (option: string) => void;
  icon?: string;
  size?: 'small' | 'medium' | 'large';
  showMenu?: boolean;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  onOptionSelect,
  icon = '+',
  size = 'medium',
  showMenu = true,
}) => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const handleFABPress = () => {
    if (showMenu) {
      setIsMenuVisible(true);
    } else if (onPress) {
      onPress();
    }
  };

  const handleMenuClose = () => {
    setIsMenuVisible(false);
  };

  const handleOptionSelect = (option: string) => {
    setIsMenuVisible(false); // Close menu when option is selected
    if (onOptionSelect) {
      onOptionSelect(option);
    }
  };

  const getSize = () => {
    switch (size) {
      case 'small':
        return moderateScale(40);
      case 'large':
        return moderateScale(64);
      default:
        return moderateScale(52); // Figma design: 52px
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return moderateScale(20);
      case 'large':
        return moderateScale(36);
      default:
        return moderateScale(28); // Figma design: 28px icon size
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.container,
          {
            width: getSize(),
            height: getSize(),
            borderRadius: moderateScale(14), // Figma design: 14px radius
          },
        ]}
        onPress={handleFABPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={colors.fabGradient} // Teal to blue gradient from theme
          start={{ x: 0, y: 0 }} // Top-left corner
          end={{ x: 1, y: 1 }} // Bottom-right corner
          style={styles.gradientBackground}
        >
          <Text style={[styles.icon, { 
            fontSize: getIconSize(),
            width: getIconSize(),
            height: getIconSize(),
            textAlign: 'center',
            lineHeight: getIconSize(),
          }]}>{icon}</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Menu Options Component */}
      <MenuOptionsComponent
        isVisible={isMenuVisible}
        onClose={handleMenuClose}
        onOptionSelect={handleOptionSelect}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: scaleHeight(24),
    right: scaleWidth(24),
    // Figma shadow properties: X: 0, Y: 4, Blur: 14, Spread: 0, Opacity: 20%
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, // 20% opacity as shown in Figma
    shadowRadius: 14,
    elevation: 8,
  },
  gradientBackground: {
    flex: 1,
    borderRadius: moderateScale(14), // Figma design: 14px radius
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(12), // Figma design: 12px padding
  },
  icon: {
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default FloatingActionButton;
