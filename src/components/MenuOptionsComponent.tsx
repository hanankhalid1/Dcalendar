import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
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

interface MenuOptionsComponentProps {
  isVisible: boolean;
  onClose: () => void;
  onOptionSelect: (option: string) => void;
}

interface MenuOption {
  id: string;
  label: string;
  iconType: 'calendar' | 'task';
}

const MenuOptionsComponent: React.FC<MenuOptionsComponentProps> = ({
  isVisible,
  onClose,
  onOptionSelect,
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(20)).current;

  const menuOptions: MenuOption[] = [
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
            if (option.id === 'event') {
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
                onPress={(e) => {
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
            onPress={(e) => {
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Darker backdrop to match image
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: scaleHeight(100), // Position above the FAB
    paddingRight: scaleWidth(20), // Align with FAB position (303 - 52/2 = 277, but using 20 for padding)
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
    ...shadows.sm,
  },
  eventItem: {
    width: scaleWidth(160), // Increased width to show full "Create event" text
  },
  taskItem: {
    width: scaleWidth(150), // Width for "Create task"
  },
  lastMenuItem: {
    marginBottom: scaleHeight(24), // Space before close button
  },
  menuLabel: {
    fontSize: moderateScale(14), // Smaller text size as requested
    color: colors.blackText,
    fontWeight: '500',
    marginLeft: scaleWidth(12),
    flex: 1,
    fontFamily: 'Lato-Medium',
    includeFontPadding: false, // Remove extra padding for better text visibility
    lineHeight: moderateScale(18), // Adjusted line height for smaller text
  },
  iconWrapper: {
    width: moderateScale(24),
    height: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: moderateScale(24),
    height: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: scaleWidth(56),
    height: scaleWidth(56),
    borderRadius: scaleWidth(28),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
});

export default MenuOptionsComponent;
