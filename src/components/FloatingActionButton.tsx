import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import AddIcon from '../assets/svgs/add.svg';
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
  size?: 'small' | 'medium' | 'large';
  showMenu?: boolean;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  onOptionSelect,
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

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={handleFABPress}
        activeOpacity={0.8}
      >
        <View style={styles.buttonBackground}>
          <AddIcon
            width={scaleWidth(28)}
            height={scaleHeight(28)}
            fill={colors.white}
          />
        </View>
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
    top: scaleHeight(720),
    left: scaleWidth(303),
    width: scaleWidth(52),
    height: scaleHeight(52),
    borderRadius: scaleWidth(12),
    // Box shadow: 0px 4px 14px 0px #00000033
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, // #00000033 = rgba(0,0,0,0.2)
    shadowRadius: 14,
    elevation: 8,
  },
  buttonBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: scaleWidth(12),
    backgroundColor: '#00AEEF', // Solid blue color
    justifyContent: 'center',
    alignItems: 'center',
    padding: scaleWidth(12),
    gap: scaleWidth(14),
  },
});

export default FloatingActionButton;
