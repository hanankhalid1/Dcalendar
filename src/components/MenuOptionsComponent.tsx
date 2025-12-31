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
    const iconSize = moderateScale(20);
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
            <CrossIcon width={moderateScale(20)} height={moderateScale(20)} />
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
    paddingBottom: isTablet
      ? scaleHeight(48)
      : isFolding
      ? scaleHeight(36)
      : isLargeMobile
      ? scaleHeight(32)
      : isSmallMobile
      ? scaleHeight(16)
      : scaleHeight(24),
    paddingRight: isTablet
      ? scaleWidth(48)
      : isFolding
      ? scaleWidth(32)
      : isLargeMobile
      ? scaleWidth(24)
      : isSmallMobile
      ? scaleWidth(8)
      : scaleWidth(16),
  },
  menuContainer: {
    backgroundColor: 'transparent',
    position: 'absolute',
    right: isTablet
      ? scaleWidth(48)
      : isFolding
      ? scaleWidth(32)
      : isLargeMobile
      ? scaleWidth(24)
      : isSmallMobile
      ? scaleWidth(8)
      : scaleWidth(16),
    bottom: isTablet
      ? scaleHeight(32)
      : isFolding
      ? scaleHeight(24)
      : isLargeMobile
      ? scaleHeight(20)
      : isSmallMobile
      ? scaleHeight(12)
      : scaleHeight(16),
    width: 'auto',
    alignItems: 'flex-end',
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(11),
    backgroundColor: colors.white,
    borderRadius: moderateScale(12),
    marginBottom: scaleHeight(12),
    height: scaleHeight(42),
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
    marginBottom: isTablet ? scaleHeight(32) : scaleHeight(24),
  },
  menuLabel: {
    fontSize: isTablet
      ? moderateScale(20)
      : SCREEN_WIDTH > 380
      ? moderateScale(14)
      : moderateScale(13),
    color: colors.blackText,
    fontWeight: '500',
    marginLeft: isTablet ? scaleWidth(24) : scaleWidth(12),
    fontFamily: 'Lato-Medium',
    includeFontPadding: false,
    lineHeight: isTablet
      ? moderateScale(28)
      : SCREEN_WIDTH > 380
      ? moderateScale(18)
      : moderateScale(16),
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  iconWrapper: {
    width: isTablet ? moderateScale(40) : moderateScale(24),
    height: isTablet ? moderateScale(40) : moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  iconContainer: {
    width: isTablet ? moderateScale(40) : moderateScale(24),
    height: isTablet ? moderateScale(40) : moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: isTablet
      ? scaleWidth(80)
      : SCREEN_WIDTH > 380
      ? scaleWidth(56)
      : scaleWidth(50),
    height: isTablet
      ? scaleWidth(80)
      : SCREEN_WIDTH > 380
      ? scaleWidth(56)
      : scaleWidth(50),
    borderRadius: isTablet
      ? scaleWidth(40)
      : SCREEN_WIDTH > 380
      ? scaleWidth(28)
      : scaleWidth(25),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
});

export default MenuOptionsComponent;
