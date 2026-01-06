import {
  StatusBar,
  TouchableOpacity,
  View,
  StyleSheet,
  Text,
} from 'react-native';
import MenuIcon from '../assets/svgs/menu.svg';

import {
  colors,
  fontSize,
  spacing,
  borderRadius,
  shadows,
} from '../utils/LightTheme';
import {
  moderateScale,
  scaleHeight,
  scaleWidth,
  screenWidth,
} from '../utils/dimensions';

// Tablet detection
const isTablet = screenWidth >= 600;
const getTabletSafeDimension = (
  mobileValue: number,
  tabletValue: number,
  maxValue: number,
) => {
  if (isTablet) {
    return Math.min(tabletValue, maxValue);
  }
  return mobileValue;
};

const PlainHeader: React.FC<{ onMenuPress: () => void; title: string }> = ({
  onMenuPress,
  title,
}) => {
  return (
    <View style={headerStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <View style={headerStyles.header}>
        {/* 1. Menu Icon Button */}
        <TouchableOpacity
          style={headerStyles.menuButton}
          onPress={onMenuPress}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MenuIcon width={24} height={24} />
        </TouchableOpacity>

        {/* 2. Title of the Screen (centered) */}
        <Text style={headerStyles.titleText}>{title}</Text>
      </View>
    </View>
  );
};

export default PlainHeader;

const headerStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingBottom: spacing.sm,
    ...shadows.sm,
    position: 'relative',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getTabletSafeDimension(spacing.md, 14, spacing.lg),
    paddingTop: getTabletSafeDimension(spacing.sm, spacing.xs, spacing.sm),
    paddingBottom: getTabletSafeDimension(spacing.sm, spacing.xs, spacing.sm),
    height: getTabletSafeDimension(scaleHeight(60), 52, 60),
  },
  spacer: {
    flex: 1,
  },
  menuButton: {
    width: getTabletSafeDimension(moderateScale(40), 36, 44),
    height: getTabletSafeDimension(moderateScale(40), 36, 44),
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xs,
  },
  // --- NEW STYLE FOR THE TITLE ---
  titleText: {
    fontSize: getTabletSafeDimension(fontSize.textSize20, 18, 20),
    lineHeight: getTabletSafeDimension(fontSize.textSize20, 20, 22),
    fontWeight: '700',
    color: colors.blackText,
    marginLeft: getTabletSafeDimension(scaleWidth(12), 8, 12),
    flex: 1,
  },
  // The original `title` style from your snippet, renamed to `titleText` for usage
  title: {
    fontSize: fontSize.textSize20,
    fontWeight: '700',
    color: colors.blackText,
    textAlign: 'center',
  },
});
