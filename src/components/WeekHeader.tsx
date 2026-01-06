import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import { moderateScale, scaleHeight, scaleWidth, screenWidth, screenHeight } from '../utils/dimensions';
import {
  colors,
  fontSize,
  spacing,
  borderRadius,
  shadows,
} from '../utils/LightTheme';
import CalendarComponent from './CalendarComponent';
// import MenuIcon from '../assets/svgs/menu.svg';
import { ScrollView } from 'react-native';
import MenuIcon from '../assets/svgs/menu.svg';
import CalendarIconHeader from '../assets/svgs/calendarBlack.svg';
import DIcon from '../assets/svgs/DIcon.svg';
import Icon from 'react-native-vector-icons/AntDesign';
import { Fonts } from '../constants/Fonts';
// import CalendarIconHeader from '../assets/svgs/calendarHeader.svg';

// Tablet detection constants
const isTablet = screenWidth >= 600;
const isSmallMobile = screenWidth <= 340;
const isLargeMobile = screenWidth > 400 && screenWidth < 600;

// Helper function for tablet-safe font sizes
const getTabletSafeFontSize = (mobileSize: number, tabletSize: number, maxSize: number) => {
  if (isTablet) {
    return Math.min(tabletSize, maxSize);
  }
  return mobileSize;
};

// Helper function for tablet-safe dimensions
const getTabletSafeDimension = (mobileValue: number, tabletValue: number, maxValue: number) => {
  if (isTablet) {
    return Math.min(tabletValue, maxValue);
  }
  return mobileValue;
};

interface WeekHeaderProps {
  onMenuPress: () => void;
  currentMonth: string;
  onMonthPress: () => void;
  onMonthSelect?: (monthIndex: number) => void;
  onDateSelect?: (date: Date) => void;
  currentDate?: Date;
  selectedDate?: Date | null;
  showBranding?: boolean; // Show DCalendar branding (only for Schedule screen)
  showMonthSelector?: boolean; // Show month selector (hide in Schedule screen)
  showCalendarIcon?: boolean; // Show calendar icon (hide in Schedule screen)
}

const WeekHeader: React.FC<WeekHeaderProps> = ({
  onMenuPress,
  currentMonth,
  onMonthPress,
  onMonthSelect,
  onDateSelect,
  currentDate,
  selectedDate,
  showBranding = false,
  showMonthSelector = true,
  showCalendarIcon = true,
}) => {
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [isMonthDropdownVisible, setIsMonthDropdownVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

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

  const monthNamesShort = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const handleMonthPress = () => {
    // When opening the calendar, ensure it uses the current date
    // This ensures the calendar shows the same month/year as the slider
    if (!isCalendarVisible && currentDate) {
      console.log('WeekHeader: Opening calendar icon with currentDate:', {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth(),
        date: currentDate.toISOString(),
        formatted: `${
          currentDate.getMonth() + 1
        }/${currentDate.getDate()}/${currentDate.getFullYear()}`,
      });
    }
    setIsCalendarVisible(!isCalendarVisible);
    setIsMonthDropdownVisible(false); // Close month slider if open
    onMonthPress();
  };

  const handleMonthNamePress = () => {
    // When opening the slider, log the current date to ensure it's up to date
    if (!isMonthDropdownVisible && currentDate) {
      console.log('WeekHeader: Opening month slider with currentDate:', {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth(),
        date: currentDate.toISOString(),
        formatted: `${
          currentDate.getMonth() + 1
        }/${currentDate.getDate()}/${currentDate.getFullYear()}`,
      });
    }
    setIsMonthDropdownVisible(!isMonthDropdownVisible);
    setIsCalendarVisible(false); // Close calendar if open
  };

  const handleDateSelect = (date: Date) => {
    // When a date is selected from the calendar, update both the date and month display
    // This ensures the slider month stays synchronized with the calendar
    console.log('WeekHeader: Date selected from calendar:', {
      year: date.getFullYear(),
      month: date.getMonth(),
      formatted: `${
        date.getMonth() + 1
      }/${date.getDate()}/${date.getFullYear()}`,
    });
    onDateSelect?.(date);
    // Also update the month display to keep slider synchronized
    onMonthSelect?.(date.getMonth());
    setIsCalendarVisible(false);
  };

  const handleYearSelect = (year: number) => {
    if (currentDate) {
      // When year is selected, keep the same month and day, just change the year
      const newDate = new Date(
        year,
        currentDate.getMonth(),
        currentDate.getDate(),
        12,
        0,
        0,
        0,
      );
      console.log('WeekHeader: Year selected:', {
        oldYear: currentDate.getFullYear(),
        newYear: year,
        month: currentDate.getMonth(),
        newDate: newDate.toISOString(),
      });
      onDateSelect?.(newDate);
      // Also trigger month select to ensure month display updates
      onMonthSelect?.(currentDate.getMonth());
    }
    setIsMonthDropdownVisible(false);
  };

  // Update calendar key when currentDate changes to ensure calendar always uses latest date
  useEffect(() => {
    if (currentDate) {
      console.log('WeekHeader: currentDate prop changed:', {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth(),
        formatted: `${
          currentDate.getMonth() + 1
        }/${currentDate.getDate()}/${currentDate.getFullYear()}`,
      });
    }
  }, [
    currentDate?.getFullYear(),
    currentDate?.getMonth(),
    currentDate?.getDate(),
  ]);

  // Auto-scroll to current month when dropdown opens
  // Auto-scroll to center the current month when dropdown opens
  useEffect(() => {
    if (isMonthDropdownVisible && currentDate && scrollViewRef.current) {
      const currentMonthIndex = 13; // always center index (since you have 25 items total: -12..+12)
      const itemWidth = 70;
      const scrollPosition =
        currentMonthIndex * itemWidth -
        Dimensions.get('window').width / 2 +
        itemWidth / 2;

      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: Math.max(0, scrollPosition),
          animated: true,
        });
      }, 200);
    }
  }, [isMonthDropdownVisible, currentDate]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View
        style={[
          styles.header,
          isMonthDropdownVisible && styles.headerNoBorder, // Remove shadow when dropdown is open
        ]}
      >
        {/* Left Section - Logo and Month Component */}
        <View style={styles.leftSection}>
          {/* Hamburger Menu */}
          <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
            <MenuIcon width={24} height={24} />
          </TouchableOpacity>

          {/* DCalendar Branding - Only show in Schedule screen */}
          {showBranding && (
            <View style={styles.logoContainer}>
              <DIcon width={scaleWidth(24)} height={scaleHeight(24)} />
              <Text style={styles.logoText}>DCalendar</Text>
            </View>
          )}

          {/* Month Selector - Show month text and dropdown on all devices */}
          {showMonthSelector && (
            <View style={styles.monthSelectorContainer}>
              <TouchableOpacity
                style={styles.monthSelector}
                onPress={handleMonthNamePress}
              >
                <Text style={styles.monthText}>{currentMonth}</Text>
                <Icon
                  name={isMonthDropdownVisible ? 'caretup' : 'caretdown'}
                  size={12}
                  color="#181D27"
                  style={styles.dropdownArrow}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Right Section - Calendar Icon */}
        {showCalendarIcon && (
          <View style={styles.rightSection}>
            <TouchableOpacity
              style={styles.calendarButton}
              onPress={handleMonthPress}
            >
              <CalendarIconHeader width={24} height={24} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Month Slider - Show on all devices */}
      {isMonthDropdownVisible &&
        (() => {
          // Generate dynamic months centered around current month
          // From same month in previous year to same month in next year
          const dynamicItems: Array<
            | { type: 'month'; monthIndex: number; year: number }
            | { type: 'year'; year: number }
          > = [];

          if (currentDate) {
            const currentMonthIndex = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();

            console.log('WeekHeader: Generating month dropdown for:', {
              currentMonthIndex,
              currentYear,
              currentDate: currentDate.toISOString(),
            });

            let lastYearAdded: number | null = null;

            // Generate 25 months: 12 months before + current month + 12 months after
            for (let i = -12; i <= 12; i++) {
              const totalMonths = currentMonthIndex + i;
              const monthIndex = ((totalMonths % 12) + 12) % 12; // Handle negative modulo
              const year = currentYear + Math.floor(totalMonths / 12);

              // Debug: Log the first few items to verify year calculation
              if (i >= -2 && i <= 2) {
                console.log(`WeekHeader: Generating slider item ${i}:`, {
                  currentMonthIndex,
                  currentYear,
                  totalMonths,
                  monthIndex,
                  calculatedYear: year,
                  monthName: monthNamesShort[monthIndex],
                  calculation: `currentYear(${currentYear}) + floor(${totalMonths}/12) = ${year}`,
                });
              }

              // Add year label when year changes
              if (lastYearAdded !== year) {
                dynamicItems.push({ type: 'year', year });
                lastYearAdded = year;
              }

              dynamicItems.push({ type: 'month', monthIndex, year });
            }

            console.log(
              'WeekHeader: Generated items:',
              dynamicItems
                .slice(0, 5)
                .map(item =>
                  item.type === 'month'
                    ? `${monthNamesShort[item.monthIndex]} ${item.year}`
                    : `Year ${item.year}`,
                ),
            );
          }

          return (
            <View style={styles.monthSliderWrapper}>
              <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.monthScrollContainer}
                style={styles.monthScrollViewStyle}
                nestedScrollEnabled={true}
                scrollEnabled={true}
                bounces={false}
              >
                {dynamicItems.map((item, index) => {
                  if (item.type === 'month') {
                    const isSelected =
                      currentDate?.getMonth() === item.monthIndex &&
                      currentDate?.getFullYear() === item.year;

                    return (
                      <TouchableOpacity
                        key={`month-${item.monthIndex}-${item.year}-${index}`}
                        style={[
                          styles.monthScrollItem,
                          isSelected && styles.monthScrollItemSelected,
                        ]}
                        onPress={() => {
                          // Create date with the selected year and month
                          // IMPORTANT: JavaScript Date months are 0-indexed (0=Jan, 11=Dec)
                          // item.monthIndex is already 0-indexed, so use it directly
                          const newDate = new Date(
                            item.year, // Year from slider item
                            item.monthIndex, // Month index (0-11)
                            1, // Day 1 of the month
                            12, // Hour 12 (noon) to avoid timezone issues
                            0, // Minutes
                            0, // Seconds
                            0, // Milliseconds
                          );

                          // Verify the date was created correctly
                          const createdYear = newDate.getFullYear();
                          const createdMonth = newDate.getMonth();
                          const createdDay = newDate.getDate();

                          console.log(
                            'WeekHeader: Month selected from slider - DETAILED:',
                            {
                              'Slider Item Year': item.year,
                              'Slider Item Month Index': item.monthIndex,
                              'Slider Item Month Name':
                                monthNamesShort[item.monthIndex],
                              'Created Date Year': createdYear,
                              'Created Date Month': createdMonth,
                              'Created Date Day': createdDay,
                              'Created Date Full': newDate.toISOString(),
                              'Created Date Formatted': `${
                                createdMonth + 1
                              }/${createdDay}/${createdYear}`,
                              'Date Match Check':
                                createdYear === item.year &&
                                createdMonth === item.monthIndex
                                  ? '✅ MATCH'
                                  : '❌ MISMATCH',
                              'Current Date Before': currentDate
                                ? `${
                                    currentDate.getMonth() + 1
                                  }/${currentDate.getDate()}/${currentDate.getFullYear()}`
                                : 'none',
                            },
                          );

                          // Double-check: if there's a mismatch, log a warning
                          if (
                            createdYear !== item.year ||
                            createdMonth !== item.monthIndex
                          ) {
                            console.error(
                              '❌ WeekHeader: Date creation mismatch!',
                              {
                                expected: `${item.year}-${item.monthIndex}`,
                                actual: `${createdYear}-${createdMonth}`,
                              },
                            );
                          }

                          // IMPORTANT: Call onDateSelect FIRST to update the date in the parent
                          // This ensures both the slider and calendar icon stay synchronized
                          console.log(
                            'WeekHeader: Calling onDateSelect with newDate:',
                            {
                              year: newDate.getFullYear(),
                              month: newDate.getMonth(),
                              formatted: `${
                                newDate.getMonth() + 1
                              }/${newDate.getDate()}/${newDate.getFullYear()}`,
                            },
                          );
                          onDateSelect?.(newDate);
                          // Update month display immediately (don't use setTimeout)
                          // The date has already been set correctly by onDateSelect
                          onMonthSelect?.(item.monthIndex);
                          setIsMonthDropdownVisible(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.monthScrollText,
                            isSelected && styles.monthScrollTextSelected,
                          ]}
                        >
                          {monthNamesShort[item.monthIndex]}
                        </Text>
                      </TouchableOpacity>
                    );
                  } else {
                    // Year item
                    const isYearSelected =
                      currentDate?.getFullYear() === item.year;
                    return (
                      <TouchableOpacity
                        key={`year-${item.year}-${index}`}
                        style={styles.yearContainer}
                        onPress={() => handleYearSelect(item.year)}
                      >
                        <Text
                          style={[
                            styles.yearText,
                            isYearSelected && styles.yearTextSelected,
                          ]}
                        >
                          {item.year}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                })}
              </ScrollView>
            </View>
          );
        })()}

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
      {isCalendarVisible && currentDate && (
        <View style={styles.calendarContainer}>
          <CalendarComponent
            key={`calendar-${currentDate.getFullYear()}-${currentDate.getMonth()}`}
            onDateSelect={handleDateSelect}
            currentDate={currentDate}
            selectedDate={selectedDate}
            isVisible={isCalendarVisible}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingTop: getTabletSafeDimension(scaleHeight(10), scaleHeight(16), 20),
    paddingBottom: getTabletSafeDimension(spacing.md, spacing.lg, 24),
    ...shadows.sm,
    position: 'relative',
    zIndex: 1,
    overflow: 'visible',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getTabletSafeDimension(spacing.md, spacing.lg, 32),
    paddingTop: getTabletSafeDimension(spacing.sm, spacing.md, 16),
    backgroundColor: colors.white,
    zIndex: 1004,
  },
  headerNoBorder: {
    shadowOpacity: 0,
    elevation: 0,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    width: getTabletSafeDimension(moderateScale(40), moderateScale(48), 56),
    height: getTabletSafeDimension(moderateScale(40), moderateScale(48), 56),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: getTabletSafeDimension(borderRadius.md, borderRadius.lg, 12),
    marginRight: getTabletSafeDimension(spacing.md, spacing.lg, 24),
  },
  menuIcon: {
    width: 24,
    height: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: getTabletSafeDimension(spacing.md, spacing.lg, 24),
  },
  logoText: {
    fontSize: getTabletSafeFontSize(fontSize.textSize18, fontSize.textSize20, 24),
    fontWeight: '600',
    fontFamily: Fonts.latoBold,
    color: colors.blackText,
    marginLeft: getTabletSafeDimension(spacing.xs, 0, 12),
  },
  monthSelectorContainer: {
    position: 'relative',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthText: {
    fontSize: getTabletSafeFontSize(moderateScale(18), moderateScale(22), 26),
    fontFamily: Fonts.latoBold,
    color: '#181D27',
    marginRight: getTabletSafeDimension(spacing.xs, spacing.sm, 12),
  },
  dropdownArrow: {
    marginLeft: 4,
    color: '#181D27',
  },
  dropdownArrowRotated: {
    transform: [{ rotate: '180deg' }],
  },
  monthSliderWrapper: {
    width: '100%',
    backgroundColor: 'transparent',
    paddingVertical: getTabletSafeDimension(spacing.sm, spacing.md, 16),
    paddingHorizontal: getTabletSafeDimension(spacing.md, spacing.lg, 32),
    minHeight: isTablet ? 60 : 50,
    zIndex: 1003,
    elevation: 10,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getTabletSafeDimension(spacing.sm, spacing.md, 16),
  },
  iconButton: {
    width: getTabletSafeDimension(moderateScale(40), moderateScale(48), 56),
    height: getTabletSafeDimension(moderateScale(40), moderateScale(48), 56),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: getTabletSafeDimension(borderRadius.md, borderRadius.lg, 12),
  },
  calendarButton: {
    width: getTabletSafeDimension(moderateScale(40), moderateScale(48), 56),
    height: getTabletSafeDimension(moderateScale(40), moderateScale(48), 56),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: getTabletSafeDimension(borderRadius.md, borderRadius.lg, 12),
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    zIndex: 1001,
  },
  monthDropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  monthDropdownItemSelected: {
    backgroundColor: '#00AEEF',
  },
  monthDropdownText: {
    fontSize: fontSize.textSize16,
    color: colors.textPrimary,
    fontFamily: Fonts.regular,
  },
  monthDropdownTextSelected: {
    fontFamily: Fonts.bold,
    color: colors.primary,
  },
  calendarContainer: {
    position: 'absolute',
    top: isTablet ? 120 : '100%',
    left: isTablet ? undefined : getTabletSafeDimension(spacing.md, spacing.lg, 32),
    right: isTablet ? getTabletSafeDimension(spacing.md, spacing.lg, 32) : getTabletSafeDimension(spacing.md, spacing.lg, 32),
    width: isTablet ? scaleWidth(280) : undefined,
    height: isTablet ? 360 : undefined,
    maxWidth: isTablet ? scaleWidth(280) : undefined,
    zIndex: 1000,
    elevation: 10,
  },
  monthScrollViewStyle: {
    width: '100%',
    minHeight: isTablet ? 60 : 50,
  },
  monthScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: getTabletSafeDimension(spacing.xs, spacing.sm, 12),
    flexWrap: 'nowrap',
    minHeight: isTablet ? 60 : 50,
  },
  monthScrollItem: {
    backgroundColor: '#F9F9F9',
    borderRadius: getTabletSafeDimension(20, 24, 28),
    paddingHorizontal: getTabletSafeDimension(spacing.md, spacing.lg, 24),
    paddingVertical: getTabletSafeDimension(spacing.xs, spacing.sm, 12),
    marginHorizontal: isTablet ? 8 : 5,
    borderWidth: 0,
    minHeight: isTablet ? 50 : 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthScrollItemSelected: {
    backgroundColor: '#00AEEF',
  },
  monthScrollText: {
    fontSize: getTabletSafeFontSize(fontSize.textSize14, fontSize.textSize16, 18),
    color: colors.textPrimary,
    fontWeight: '500',
    textAlign: 'center',
  },
  monthScrollTextSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  yearContainer: {
    marginHorizontal: getTabletSafeDimension(spacing.xs, spacing.sm, 12),
    paddingHorizontal: getTabletSafeDimension(spacing.sm, spacing.md, 16),
  },
  yearText: {
    fontSize: getTabletSafeFontSize(fontSize.textSize14, fontSize.textSize16, 18),
    color: colors.textPrimary,
    fontWeight: '500',
  },
  yearTextSelected: {
    color: colors.textPrimary,
    fontWeight: '700',
  },

  monthDropdownWrapper: {
    position: 'absolute',
    top: moderateScale(30),
    left: 0,
    right: 0,
    zIndex: 1002,
    elevation: 12,
  },
});

export default WeekHeader;
