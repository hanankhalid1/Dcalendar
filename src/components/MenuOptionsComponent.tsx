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
import { moderateScale, scaleHeight, scaleWidth } from '../utils/dimensions';
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

interface MenuOptionsComponentProps {
  isVisible: boolean;
  onClose: () => void;
  onOptionSelect: (option: string) => void;

  id: string;
  label: string;
  iconType: 'calendar' | 'task' | 'appointment';
}

const MenuOptionsComponent: React.FC<MenuOptionsComponentProps> = ({
  isVisible,
  onClose,
  onOptionSelect,
}) => {
  const navigation = useNavigation();
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
      navigation.navigate(Screen.AppointmentScheduleScreen);
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
            let itemStyle = styles.menuItem;
            if (option.id === 'appointment') {
              itemStyle = [styles.menuItem, styles.appointmentItem];
            } else if (option.id === 'event') {
              itemStyle = [styles.menuItem, styles.eventItem];
            } else if (option.id === 'task') {
              itemStyle = [styles.menuItem, styles.taskItem];
            }

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  itemStyle,
                  index === menuOptions.length - 1 && styles.lastMenuItem,
                ]}
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
    paddingBottom: scaleHeight(24),
    paddingRight: scaleWidth(16),
  },
  menuContainer: {
    backgroundColor: 'transparent',
    alignItems: 'flex-end',
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
    minWidth: scaleWidth(140),
    maxWidth: SCREEN_WIDTH * 0.5,
    ...shadows.sm,
  },
  appointmentItem: {
    width: SCREEN_WIDTH > 380 ? scaleWidth(210) : scaleWidth(195),
  },
  eventItem: {
    width: SCREEN_WIDTH > 380 ? scaleWidth(160) : scaleWidth(145),
  },
  taskItem: {
    width: SCREEN_WIDTH > 380 ? scaleWidth(150) : scaleWidth(140),
  },
  lastMenuItem: {
    marginBottom: scaleHeight(24),
  },
  menuLabel: {
    fontSize: SCREEN_WIDTH > 380 ? moderateScale(14) : moderateScale(13),
    color: colors.blackText,
    fontWeight: '500',
    marginLeft: scaleWidth(12),
    flex: 1,
    fontFamily: 'Lato-Medium',
    includeFontPadding: false,
    lineHeight: SCREEN_WIDTH > 380 ? moderateScale(18) : moderateScale(16),
  },
  iconWrapper: {
    width: moderateScale(24),
    height: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  iconContainer: {
    width: moderateScale(24),
    height: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: SCREEN_WIDTH > 380 ? scaleWidth(56) : scaleWidth(50),
    height: SCREEN_WIDTH > 380 ? scaleWidth(56) : scaleWidth(50),
    borderRadius: SCREEN_WIDTH > 380 ? scaleWidth(28) : scaleWidth(25),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
});

export default MenuOptionsComponent;
