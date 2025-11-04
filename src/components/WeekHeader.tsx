import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import { moderateScale, scaleHeight } from '../utils/dimensions';
import {
  colors,
  fontSize,
  spacing,
  borderRadius,
  shadows,
} from '../utils/LightTheme';
import CalendarComponent from './CalendarComponent';

interface WeekHeaderProps {
  onMenuPress: () => void;
  currentMonth: string;
  onMonthPress: () => void;
  onMonthSelect?: (monthIndex: number) => void;
  onDateSelect?: (date: Date) => void;
  currentDate?: Date;
  selectedDate?: Date | null;
}

const WeekHeader: React.FC<WeekHeaderProps> = ({
  onMenuPress,
  currentMonth,
  onMonthPress,
  onMonthSelect,
  onDateSelect,
  currentDate,
  selectedDate,
}) => {
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [isMonthDropdownVisible, setIsMonthDropdownVisible] = useState(false);

  const monthNames = [
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
  ];

  const handleMonthPress = () => {
    setIsCalendarVisible(!isCalendarVisible);
    onMonthPress();
  };

  const handleMonthNamePress = () => {
    setIsMonthDropdownVisible(!isMonthDropdownVisible);
    setIsCalendarVisible(false); // Close calendar if open
  };

  const handleDateSelect = (date: Date) => {
    setIsCalendarVisible(false);
    onDateSelect?.(date);
  };

  const handleMonthSelect = (monthIndex: number) => {
    if (currentDate) {
      // Create date with fixed time to avoid timezone issues
      const newDate = new Date(
        currentDate.getFullYear(),
        monthIndex,
        1,
        12,
        0,
        0,
        0,
      );
      console.log('WeekHeader - Month selected:', newDate);
      console.log('WeekHeader - Day of week:', newDate.getDay());
      onDateSelect?.(newDate);
    }
    setIsMonthDropdownVisible(false);
  };
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={styles.header}>
        {/* Left Section - Menu Icon and Month Component */}
        <View style={styles.leftSection}>
          {/* Hamburger Menu */}
          <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
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
                {monthNames.map((month, index) => (
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

        {/* Right Section - Calendar Icon */}
        <View style={styles.rightSection}>
          <TouchableOpacity
            style={styles.calendarButton}
            onPress={handleMonthPress}
          >
            <Image
              source={require('../assets/images/HeaderImages/Calenderdaterange.png')}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Backdrop for both dropdowns */}
      {(isCalendarVisible || isMonthDropdownVisible) && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => {
            setIsCalendarVisible(false);
            setIsMonthDropdownVisible(false);
          }}
        />
      )}

      {/* Calendar Component */}
      {isCalendarVisible && (
        <View style={styles.calendarContainer}>
          <CalendarComponent
            onDateSelect={handleDateSelect}
            currentDate={currentDate}
            selectedDate={selectedDate}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingTop: scaleHeight(10),
    paddingBottom: spacing.md,
    ...shadows.sm,
    position: 'relative',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
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
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  monthSelectorContainer: {
    position: 'relative',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthText: {
    fontSize: fontSize.textSize18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginRight: spacing.xs,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  dropdownArrow: {
    width: 12,
    height: 8,
    marginTop:4,
    marginLeft: 4,
  },
  dropdownArrowRotated: {
    transform: [{ rotate: '180deg' }],
  },
  backdrop: {
    position: 'absolute',
    top: -Dimensions.get('window').height,
    left: -Dimensions.get('window').width,
    right: -Dimensions.get('window').width,
    bottom: -Dimensions.get('window').height,
    width: Dimensions.get('window').width * 3,
    height: Dimensions.get('window').height * 3,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 999,
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
  calendarContainer: {
    position: 'absolute',
    top: '100%',
    left: spacing.md,
    right: spacing.md,
    zIndex: 1000,
    elevation: 10,
  },
});

export default WeekHeader;
