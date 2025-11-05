import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import { moderateScale, scaleHeight, scaleWidth } from '../utils/dimensions';
import {
  colors,
  fontSize,
  spacing,
  borderRadius,
  shadows,
} from '../utils/LightTheme';

interface MenuOptionsComponentProps {
  isVisible: boolean;
  onClose: () => void;
  onOptionSelect: (option: string) => void;
}

interface MenuOption {
  id: string;
  label: string;
  icon: string;
  iconType: 'MaterialIcons' | 'Feather';
  gradient: string[];
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
      id: 'task',
      label: 'Task',
      icon: 'check-circle',
      iconType: 'Feather',
      gradient: ['#18F06E', '#0B6DE0'],
    },
    {
      id: 'event',
      label: 'Event',
      icon: 'event-available',
      iconType: 'MaterialIcons',
      gradient: ['#18F06E', '#0B6DE0'],
    },
    {
      id: 'appointment',
      label: 'Appointment',
      icon: 'calendar',
      iconType: 'Feather',
      gradient: ['#18F06E', '#0B6DE0'],
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
    const iconSize = moderateScale(24);

    if (option.id === 'event') {
      // Special case for Event - filled gradient background with white plus
      return (
        <View style={styles.eventIconContainer}>
          <MaterialIcons
            name="add"
            size={iconSize}
            color={colors.white}
          />
        </View>
      );
    } else {
      // Other icons - outlined with gradient stroke
      return (
        <View style={styles.iconContainer}>
          <Feather
            name={option.icon}
            size={iconSize}
            color={option.gradient[0]}
          />
        </View>
      );
    }
  };

  if (!isVisible) return null;

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.menuContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {menuOptions.map((option, index) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.menuItem,
                index === menuOptions.length - 1 && styles.lastMenuItem,
              ]}
              onPress={() => handleOptionPress(option)}
              activeOpacity={0.7}
            >
              <View style={styles.iconWrapper}>{renderIcon(option)}</View>
              <Text style={styles.menuLabel}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent backdrop
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: scaleHeight(100), // Position above the FAB
    paddingRight: scaleWidth(24), // Align with FAB position
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menuContainer: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    minWidth: scaleWidth(200),
    maxWidth: scaleWidth(250),
    ...shadows.lg, // Enhanced shadow for better visibility
    borderWidth: 1,
    borderColor: colors.lightGrayishBlue,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: 'transparent',
    borderRadius: moderateScale(12),
    marginBottom: spacing.xs,
  },
  lastMenuItem: {
    marginBottom: 0,
  },
  menuLabel: {
    fontSize: fontSize.textSize16,
    color: colors.textSecondary,
    fontWeight: '500',
    marginLeft: spacing.md,
    flex: 1,
  },
  iconWrapper: {
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: colors.lightGrayishBlue,
    ...shadows.sm,
  },
  eventIconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.figmaAccent,
    ...shadows.sm,
  },
});

export default MenuOptionsComponent;
