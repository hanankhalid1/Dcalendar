import React, { useState } from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';

import AddIcon from '../assets/svgs/add.svg';
import MenuOptionsComponent from './MenuOptionsComponent';

import { moderateScale, scaleHeight, scaleWidth } from '../utils/dimensions';

import { colors, shadows } from '../utils/LightTheme';

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
  const fabSize = width > 380 ? scaleWidth(52) : scaleWidth(48);
  const fabRadius = moderateScale(12);

  // MATCH MENU POSITION (IMPORTANT)
  const fabBottom = scaleHeight(24);
  const fabRight = scaleWidth(16);

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
