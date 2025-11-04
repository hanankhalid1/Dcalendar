import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { moderateScale, scaleHeight, scaleWidth } from '../utils/dimensions';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Feather from 'react-native-vector-icons/Feather';
import {
  colors,
  fontSize,
  spacing,
  borderRadius,
  shadows,
} from '../utils/LightTheme';
import LinearGradient from 'react-native-linear-gradient';
import CalendarViewDropdown from './CalendarViewDropdown';


interface HeaderProps {
  onMenuPress: () => void;
  title?: string;
  currentMonth?: string;
  currentView?: string;
  onMonthPress?: () => void;
  onMonthSelect?: (monthIndex: number) => void;
  onViewPress?: () => void;
  onViewSelect?: (view: string) => void;
  onAction1Press?: () => void;
  onAction2Press?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onMenuPress,
  currentMonth = 'August',
  currentView = 'Week',
  onMonthPress: _onMonthPress,
  onMonthSelect,
  onViewPress,
  onViewSelect,
  onAction1Press,
  onAction2Press,
}) => {
  const [isViewDropdownVisible, setIsViewDropdownVisible] = useState(false);
  const [isMonthDropdownVisible, setIsMonthDropdownVisible] = useState(false);
  const [isWeekDropdownVisible, setIsWeekDropdownVisible] = useState(false);

  // const handleViewPress = () => {

  // };



  const handleViewSelect = (view: string) => {
    onViewSelect?.(view);
    setIsViewDropdownVisible(false);
  };

  const handleCloseDropdown = () => {
    setIsViewDropdownVisible(false);
  };

  const handleMonthNamePress = () => {
    setIsMonthDropdownVisible(!isMonthDropdownVisible);
    setIsViewDropdownVisible(false); // Close view dropdown if open
  };
  const handleWeekhNamePress = () => {
    setIsWeekDropdownVisible(!isWeekDropdownVisible);
    setIsViewDropdownVisible(!isWeekDropdownVisible);
    onViewPress?.();
  };

  const handleMonthSelect = (monthIndex: number) => {
    onMonthSelect?.(monthIndex);
    setIsMonthDropdownVisible(false);
  };
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Backdrop for dropdowns */}
      {(isViewDropdownVisible ||
        isMonthDropdownVisible ||
        isWeekDropdownVisible) && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => {
            setIsViewDropdownVisible(false);
            setIsMonthDropdownVisible(false);
            setIsWeekDropdownVisible(false);
          }}
        />
      )}

      <View style={styles.header}>
        {/* Left Section */}
        <View style={styles.leftSection}>
          {/* Hamburger Menu */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={onMenuPress}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Image
              source={require('../assets/images/HeaderImages/HeaderDrawer.png')}
            />
          </TouchableOpacity>

          {/* Month Selector */}
          <View style={styles.monthSelectorContainer}>
            <TouchableOpacity
              style={styles.monthSelector}
              onPress={handleMonthNamePress}
            >
              <Text style={styles.monthText}>{currentMonth}</Text>
              <Image
                source={require('../assets/images/HeaderImages/arrowDropdown.png')}
                style={[
                  styles.dropdownArrow,
                  isMonthDropdownVisible && styles.dropdownArrowRotated,
                ]}
              />
            </TouchableOpacity>

            {/* Month Dropdown */}
            {isMonthDropdownVisible && (
              <View style={styles.monthDropdown}>
                {[
                  'January',
                  'February',
                  'March',
                  'April',
                  'May',
                  'June',
                  'July',
                  'August',
                  'September',
                  'October',
                  'November',
                  'December',
                ].map((month, index) => (
                  <TouchableOpacity
                    key={month}
                    style={[
                      styles.monthDropdownItem,
                      month === currentMonth &&
                        styles.monthDropdownItemSelected,
                    ]}
                    onPress={() => handleMonthSelect(index)}
                  >
                    <Text
                      style={[
                        styles.monthDropdownText,
                        month === currentMonth &&
                          styles.monthDropdownTextSelected,
                      ]}
                    >
                      {month}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Center Section - View Selector */}
        <View style={styles.centerSection}>
          <View style={styles.viewSelectorWrapper}>
            <TouchableOpacity
              style={styles.viewSelectorContainer}
              onPress={handleWeekhNamePress}
            >
              <LinearGradient
                colors={['#18F06E', '#0B6DE0']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.gradientBorder}
              >
                <View style={styles.viewSelectorContent}>
                  <Text style={styles.viewText}>{currentView}</Text>
                  <Image
                    source={require('../assets/images/HeaderImages/arrowDropdown.png')}
                    style={[
                      styles.viewDropdownArrow,
                      isWeekDropdownVisible && styles.dropdownArrowRotated,
                    ]}
                  />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Calendar View Dropdown */}
            <CalendarViewDropdown
              currentView={currentView}
              onViewSelect={handleViewSelect}
              isVisible={isViewDropdownVisible}
              onClose={handleCloseDropdown}
            />
          </View>
        </View>

        <View style={styles.rightSection}>
          <TouchableOpacity
            style={styles.actionButton1}
            onPress={onAction1Press}
          >
            <AntDesign name="check" size={14} color="#000" />
            <View style={styles.CalenderView}>
              <FontAwesome6 name="calendar" size={14} color="#000" />
            </View>
          </TouchableOpacity>

          {/* Action Button 2 - Unselected */}
          <TouchableOpacity
            style={styles.actionButton2}
            onPress={onAction2Press}
          >
            <Feather name="check-circle" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingBottom: spacing.md,
    ...shadows.sm,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  monthSelectorContainer: {
    position: 'relative',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: 'red',
  },
  monthText: {
    fontSize: fontSize.textSize18,
    fontWeight: '500',
    color: colors.blackText,
    marginRight: spacing.xs,
  },
  dropdownArrow: {
    width: 12,
    height: 8,
    marginTop:4,
    marginLeft: 1,
  },
  dropdownArrowRotated: {
    transform: [{ rotate: '180deg' }],
  },
  monthDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.xs,
    minWidth: 150,
    ...shadows.sm,
    zIndex: 1001,
    elevation: 11,
    borderWidth: 1,
    borderColor: colors.lightGrayishBlue,
  },
  monthDropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  monthDropdownItemSelected: {
    backgroundColor: colors.lightGrayishBlue,
  },
  monthDropdownText: {
    fontSize: fontSize.textSize16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  monthDropdownTextSelected: {
    fontWeight: '600',
    color: colors.primary,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    paddingLeft: scaleWidth(35),
  },
  viewSelectorWrapper: {
    position: 'relative',
  },
  viewSelectorContainer: {
    // borderRadius: borderRadius.xl,
    // overflow: 'hidden',
  },
  gradientBorder: {
    padding: 1,
    borderRadius: borderRadius.xl,
  },
  viewSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.sm,
    paddingVertical: scaleWidth(5),
  },
  viewText: {
    fontSize: fontSize.textSize16,
    fontWeight: '600',
    color: '#18F06E',
    marginRight: spacing.xs,
  },
  viewDropdownArrow: {
    height: scaleHeight(5.96),
    width: scaleWidth(10.9),
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton1: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E6EFFF',
    marginRight: scaleWidth(3),
    borderTopRightRadius: scaleHeight(1),
    borderTopLeftRadius: scaleHeight(20),
    borderBottomLeftRadius: scaleHeight(20),
    width: scaleWidth(55.47),
    height: scaleHeight(35.73),
  },
  actionButton2: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.grey20,
    borderRadius: scaleHeight(20),
    borderTopRightRadius: scaleHeight(20),
    borderTopLeftRadius: scaleHeight(1),
    borderBottomLeftRadius: scaleHeight(1),
    width: scaleWidth(40.11),
    height: scaleHeight(36.11),
    justifyContent: 'center',
    alignItems: 'center',
  },
  CalenderView: {
    backgroundColor: colors.white,
    padding: 2,
    borderRadius: 2,
    marginLeft: 5,
  },
  actionIcon: {
    width: moderateScale(18),
    height: moderateScale(18),
    resizeMode: 'contain',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 999,
  },
});

export default Header;
