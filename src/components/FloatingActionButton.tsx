import React, { useState } from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';

import AddIcon from '../assets/svgs/add.svg';
import MenuOptionsComponent from './MenuOptionsComponent';

import { moderateScale, scaleHeight, scaleWidth, screenWidth } from '../utils/dimensions';

import { colors, shadows } from '../utils/LightTheme';

// Tablet detection
const isTablet = screenWidth >= 600;

// Helper function for tablet-safe dimensions
const getTabletSafeDimension = (mobileValue: number, tabletValue: number, maxValue: number) => {
  if (isTablet) {
    return Math.min(tabletValue, maxValue);
  }
  return mobileValue;
};

interface FloatingActionButtonProps {
  onPress?: () => void;
  onOptionSelect?: (option: string) => void;
  showMenu?: boolean;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  onOptionSelect,
  showMenu = true,
}) => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const { width } = useWindowDimensions();

  // FAB sizing (responsive but consistent)
  const fabSize = getTabletSafeDimension(
    width > 380 ? scaleWidth(52) : scaleWidth(48),
    scaleWidth(64),
    72
  );
  const fabRadius = getTabletSafeDimension(moderateScale(12), moderateScale(16), 20);

  // MATCH MENU POSITION (IMPORTANT)
  const fabBottom = getTabletSafeDimension(scaleHeight(24), scaleHeight(32), 40);
  const fabRight = getTabletSafeDimension(scaleWidth(16), scaleWidth(24), 32);

  const handleFABPress = () => {
    if (showMenu) {
      setIsMenuVisible(true);
    } else {
      onPress?.();
    }
  };

  const handleMenuClose = () => {
    setIsMenuVisible(false);
  };

  const handleOptionSelect = (option: string) => {
    setIsMenuVisible(false);
    onOptionSelect?.(option);
  };

  return (
    <>
      {/* Floating Action Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleFABPress}
        style={[
          styles.fab,
          {
            width: fabSize,
            height: fabSize,
            borderRadius: fabRadius,
            bottom: fabBottom,
            right: fabRight,
          },
        ]}
      >
        <View style={styles.fabInner}>
          <AddIcon
            width={scaleWidth(28)}
            height={scaleHeight(28)}
            fill={colors.white}
          />
        </View>
      </TouchableOpacity>

      {/* Menu */}
      <MenuOptionsComponent
        isVisible={isMenuVisible}
        onClose={handleMenuClose}
        onOptionSelect={handleOptionSelect}
      />
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    backgroundColor: '#00AEEF',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  fabInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FloatingActionButton;
