import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import {
  moderateScale,
  scaleHeight,
  scaleWidth,
  screenWidth,
} from '../utils/dimensions';
import {
  colors,
  fontSize,
  spacing,
  borderRadius,
  shadows,
} from '../utils/LightTheme';
import EventIcon from '../assets/svgs/eventIcon.svg';
import TaskIcon from '../assets/svgs/taskIcon.svg';
import CrossIcon from '../assets/svgs/crossIcon.svg';
import AppointmentIcon from '../assets/svgs/appoitnmentIcon.svg';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../navigations/appNavigation.type';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 600;
const isSmallMobile = SCREEN_WIDTH <= 340;
const isLargeMobile = SCREEN_WIDTH > 400 && SCREEN_WIDTH < 600;
const isFolding =
  SCREEN_WIDTH >= 380 && SCREEN_WIDTH <= 500 && SCREEN_HEIGHT > 800;

// Helper function for tablet-safe dimensions
const getTabletSafeDimension = (
  mobileValue: number,
  foldingValue: number,
  largeMobileValue: number,
  smallMobileValue: number,
  tabletValue: number,
  maxValue: number
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

interface MenuOptionsComponentProps {
  isVisible: boolean;
  onClose: () => void;
  onOptionSelect: (option: string) => void;

  id: string;
  label: string;
  iconType: 'calendar' | 'task' | 'appointment';
}

type MenuOption = {
  id: string;
  label: string;
  iconType: 'calendar' | 'task' | 'appointment';
};

const MenuOptionsComponent: React.FC<MenuOptionsComponentProps> = ({
  isVisible,
  onClose,
  onOptionSelect,
}) => {
  // Responsive menu item style (media-query-like)
  const getMenuItemStyle = () => {
    // Make each menu item fit its content (text + icon)
    return {
      width: 'auto',
      alignSelf: 'flex-end',
    };
  };
  const navigation = useNavigation<any>();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(20)).current;

  const menuOptions: MenuOption[] = [
    {
      id: 'appointment',
      label: 'Create appointment',
      iconType: 'appointment',
    },
    {
      id: 'event',
      label: 'Create event',
      iconType: 'calendar',
    },
    {
      id: 'task',
      label: 'Create task',
      iconType: 'task',
    },
  ];

  React.useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 20,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const handleOptionPress = (option: MenuOption) => {
    if (option.id === 'appointment') {
      navigation.navigate('AppointmentScheduleScreen');
      onClose();
      return;
    }
    onOptionSelect(option.id);
    onClose();
  };

  const renderIcon = (option: MenuOption) => {
    const iconSize = getTabletSafeDimension(
      moderateScale(20),
      moderateScale(18),
      moderateScale(18),
      moderateScale(18),
      moderateScale(20),
      22
    );
    const iconColor = '#717680'; // Light gray color to match event and birthday icons

    switch (option.iconType) {
      case 'calendar':
        return (
          <View style={styles.iconContainer}>
            <EventIcon width={iconSize} height={iconSize} />
          </View>
        );
      case 'task':
        return (
          <View style={styles.iconContainer}>
            <TaskIcon width={iconSize} height={iconSize} color={iconColor} />
          </View>
        );
      case 'appointment':
        return (
          <View style={styles.iconContainer}>
            <AppointmentIcon width={iconSize} height={iconSize} />
          </View>
        );
      default:
        return null;
    }
  };

  if (!isVisible) return null;

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.menuContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
          pointerEvents="box-none"
        >
          {menuOptions.map((option, index) => {
            let itemStyle = {
              ...styles.menuItem,
              ...getMenuItemStyle(),
            };
            // Add lastMenuItem margin if last item
            if (index === menuOptions.length - 1) {
              itemStyle = { ...itemStyle, ...styles.lastMenuItem };
            }
            return (
              <TouchableOpacity
                key={option.id}
                style={itemStyle}
                onPress={e => {
                  e.stopPropagation();
                  handleOptionPress(option);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.iconWrapper}>{renderIcon(option)}</View>
                <Text style={styles.menuLabel}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={e => {
              e.stopPropagation();
              onClose();
            }}
            activeOpacity={0.7}
          >
            <CrossIcon 
              width={getTabletSafeDimension(moderateScale(18), moderateScale(20), moderateScale(18), moderateScale(16), moderateScale(20), 22)} 
              height={getTabletSafeDimension(moderateScale(18), moderateScale(20), moderateScale(18), moderateScale(16), moderateScale(20), 22)} 
            />
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: getTabletSafeDimension(
      scaleHeight(24),
      scaleHeight(36),
      scaleHeight(32),
      scaleHeight(16),
      scaleHeight(56),
      64
    ),
    paddingRight: getTabletSafeDimension(
      scaleWidth(16),
      scaleWidth(32),
      scaleWidth(24),
      scaleWidth(8),
      scaleWidth(56),
      64
    ),
  },
  menuContainer: {
    backgroundColor: 'transparent',
    position: 'absolute',
    right: getTabletSafeDimension(
      scaleWidth(16),
      scaleWidth(32),
      scaleWidth(24),
      scaleWidth(8),
      scaleWidth(56),
      64
    ),
    bottom: getTabletSafeDimension(
      scaleHeight(16),
      scaleHeight(24),
      scaleHeight(20),
      scaleHeight(12),
      scaleHeight(40),
      48
    ),
    width: 'auto',
    alignItems: 'flex-end',
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getTabletSafeDimension(scaleWidth(16), scaleWidth(20), scaleWidth(18), scaleWidth(14), scaleWidth(20), 24),
    paddingVertical: getTabletSafeDimension(scaleHeight(11), scaleHeight(14), scaleHeight(12), scaleHeight(10), scaleHeight(14), 18),
    backgroundColor: colors.white,
    borderRadius: getTabletSafeDimension(moderateScale(12), moderateScale(14), moderateScale(12), moderateScale(10), moderateScale(14), 18),
    marginBottom: getTabletSafeDimension(scaleHeight(12), scaleHeight(16), scaleHeight(14), scaleHeight(10), scaleHeight(16), 20),
    height: getTabletSafeDimension(scaleHeight(42), scaleHeight(48), scaleHeight(44), scaleHeight(36), scaleHeight(50), 56),
    alignSelf: 'flex-end',
    ...shadows.sm,
  },
  appointmentItem: {
    // Remove fixed width for better responsiveness
  },
  eventItem: {
    // Remove fixed width for better responsiveness
  },
  taskItem: {
    // Remove fixed width for better responsiveness
  },
  lastMenuItem: {
    marginBottom: getTabletSafeDimension(scaleHeight(24), scaleHeight(32), scaleHeight(28), scaleHeight(20), scaleHeight(40), 48),
  },
  menuLabel: {
    fontSize: getTabletSafeDimension(
      moderateScale(13),
      moderateScale(14),
      moderateScale(14),
      moderateScale(12),
      moderateScale(16),
      18
    ),
    color: colors.blackText,
    fontWeight: '500',
    marginLeft: getTabletSafeDimension(scaleWidth(12), scaleWidth(14), scaleWidth(12), scaleWidth(10), scaleWidth(14), 16),
    fontFamily: 'Lato-Medium',
    includeFontPadding: false,
    lineHeight: getTabletSafeDimension(
      moderateScale(16),
      moderateScale(18),
      moderateScale(18),
      moderateScale(14),
      moderateScale(20),
      22
    ),
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  iconWrapper: {
    width: getTabletSafeDimension(moderateScale(24), moderateScale(28), moderateScale(26), moderateScale(22), moderateScale(28), 32),
    height: getTabletSafeDimension(moderateScale(24), moderateScale(28), moderateScale(26), moderateScale(22), moderateScale(28), 32),
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  iconContainer: {
    width: getTabletSafeDimension(moderateScale(24), moderateScale(28), moderateScale(26), moderateScale(22), moderateScale(28), 32),
    height: getTabletSafeDimension(moderateScale(24), moderateScale(28), moderateScale(26), moderateScale(22), moderateScale(28), 32),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: getTabletSafeDimension(scaleWidth(50), scaleWidth(56), scaleWidth(54), scaleWidth(48), scaleWidth(56), 64),
    height: getTabletSafeDimension(scaleWidth(50), scaleWidth(56), scaleWidth(54), scaleWidth(48), scaleWidth(56), 64),
    borderRadius: getTabletSafeDimension(scaleWidth(25), scaleWidth(28), scaleWidth(27), scaleWidth(24), scaleWidth(28), 32),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
});

export default MenuOptionsComponent;
