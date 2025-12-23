import React, { useState } from 'react';
import { TouchableOpacity, View, useWindowDimensions } from 'react-native';
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
  const { width, height } = useWindowDimensions();

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

  // Responsive FAB position and size
  const fabSize = width > 380 ? scaleWidth(52) : scaleWidth(48);
  const fabRadius = width > 380 ? scaleWidth(12) : scaleWidth(10);
  const fabBottom = height > 700 ? scaleHeight(100) : scaleHeight(80);
  const fabRight = width > 400 ? scaleWidth(24) : scaleWidth(20);

  return (
    <>
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: fabBottom,
          right: fabRight,
          width: fabSize,
          height: fabSize,
          borderRadius: fabRadius,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 14,
          elevation: 8,
        }}
        onPress={handleFABPress}
        activeOpacity={0.8}
      >
        <View
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            borderRadius: fabRadius,
            backgroundColor: '#00AEEF',
            justifyContent: 'center',
            alignItems: 'center',
            padding: scaleWidth(12),
            gap: scaleWidth(14),
          }}
        >
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
        windowDimensions={{ width, height }}
      />
    </>
  );
};

// Styles removed; now handled inline for responsiveness

export default FloatingActionButton;
