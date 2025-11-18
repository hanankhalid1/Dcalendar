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
import { moderateScale, scaleHeight, scaleWidth } from '../utils/dimensions';
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
import Icon from 'react-native-vector-icons/AntDesign';
import { Fonts } from '../constants/Fonts';
// import CalendarIconHeader from '../assets/svgs/calendarHeader.svg';

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
  const scrollViewRef = useRef<ScrollView>(null);
  const calendarKeyRef = useRef(0);

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
        formatted: `${currentDate.getMonth() + 1}/${currentDate.getDate()}/${currentDate.getFullYear()}`,
      });
      // Increment the key to force CalendarComponent to remount with latest date
      calendarKeyRef.current += 1;
    }
    setIsCalendarVisible(!isCalendarVisible);
    onMonthPress();
  };

  const handleMonthNamePress = () => {
    // When opening the slider, log the current date to ensure it's up to date
    if (!isMonthDropdownVisible && currentDate) {
      console.log('WeekHeader: Opening month slider with currentDate:', {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth(),
        date: currentDate.toISOString(),
        formatted: `${currentDate.getMonth() + 1}/${currentDate.getDate()}/${currentDate.getFullYear()}`,
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
      formatted: `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
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
        formatted: `${currentDate.getMonth() + 1}/${currentDate.getDate()}/${currentDate.getFullYear()}`,
      });
      // Increment key to force CalendarComponent remount if calendar is visible
      if (isCalendarVisible) {
        calendarKeyRef.current += 1;
        console.log('WeekHeader: Updated calendar key because currentDate changed and calendar is visible');
      }
    }
  }, [currentDate?.getFullYear(), currentDate?.getMonth(), currentDate?.getDate()]);

  // Auto-scroll to current month when dropdown opens
  // Auto-scroll to center the current month when dropdown opens
  useEffect(() => {
    if (isMonthDropdownVisible && currentDate && scrollViewRef.current) {
      const currentMonthIndex = 13; // always center index (since you have 25 items total: -12..+12)
      const itemWidth = 70;
      const scrollPosition = currentMonthIndex * itemWidth - Dimensions.get('window').width / 2 + itemWidth / 2;

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

      <View style={[
        styles.header,
        isMonthDropdownVisible && styles.headerNoBorder // Remove shadow when dropdown is open
      ]}>
        {/* Left Section - Menu Icon and Month Component */}
        <View style={styles.leftSection}>
          {/* Hamburger Menu */}
          <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
            {/* <MenuIcon width={24} height={24} /> */}
            <MenuIcon width={24} height={24} />
          </TouchableOpacity>

          {/* Month Selector */}
          <View style={styles.monthSelectorContainer}>
            <TouchableOpacity
              style={styles.monthSelector}
              onPress={handleMonthNamePress}
            >
              <Text style={styles.monthText}>{currentMonth}</Text>
                <Icon
                name={isMonthDropdownVisible ? 'caretup' : 'caretdown'}
                size={14}
                color="black"
                style={styles.dropdownArrow}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Right Section - Calendar Icon */}
        <View style={styles.rightSection}>
          <TouchableOpacity
            style={styles.calendarButton}
            onPress={handleMonthPress}
          >
           {/* <CalendarIconHeader width={20} height={20} /> */}
           <Icon name="calendar" size={20} color={colors.black} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Month Slider - Full width horizontal slider */}
      {isMonthDropdownVisible && (() => {
        // Generate dynamic months centered around current month
        // From same month in previous year to same month in next year
        const dynamicItems: Array<{ type: 'month'; monthIndex: number; year: number } | { type: 'year'; year: number }> = [];

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
          
          console.log('WeekHeader: Generated items:', dynamicItems.slice(0, 5).map(item => 
            item.type === 'month' ? `${monthNamesShort[item.monthIndex]} ${item.year}` : `Year ${item.year}`
          ));
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
                          item.year,        // Year from slider item
                          item.monthIndex,  // Month index (0-11)
                          1,                // Day 1 of the month
                          12,               // Hour 12 (noon) to avoid timezone issues
                          0,                // Minutes
                          0,                // Seconds
                          0,                // Milliseconds
                        );
                        
                        // Verify the date was created correctly
                        const createdYear = newDate.getFullYear();
                        const createdMonth = newDate.getMonth();
                        const createdDay = newDate.getDate();
                        
                        console.log('WeekHeader: Month selected from slider - DETAILED:', {
                          'Slider Item Year': item.year,
                          'Slider Item Month Index': item.monthIndex,
                          'Slider Item Month Name': monthNamesShort[item.monthIndex],
                          'Created Date Year': createdYear,
                          'Created Date Month': createdMonth,
                          'Created Date Day': createdDay,
                          'Created Date Full': newDate.toISOString(),
                          'Created Date Formatted': `${createdMonth + 1}/${createdDay}/${createdYear}`,
                          'Date Match Check': createdYear === item.year && createdMonth === item.monthIndex ? '✅ MATCH' : '❌ MISMATCH',
                          'Current Date Before': currentDate ? `${currentDate.getMonth() + 1}/${currentDate.getDate()}/${currentDate.getFullYear()}` : 'none',
                        });
                        
                        // Double-check: if there's a mismatch, log a warning
                        if (createdYear !== item.year || createdMonth !== item.monthIndex) {
                          console.error('❌ WeekHeader: Date creation mismatch!', {
                            expected: `${item.year}-${item.monthIndex}`,
                            actual: `${createdYear}-${createdMonth}`,
                          });
                        }
                        
                        // IMPORTANT: Call onDateSelect FIRST to update the date in the parent
                        // This ensures both the slider and calendar icon stay synchronized
                        console.log('WeekHeader: Calling onDateSelect with newDate:', {
                          year: newDate.getFullYear(),
                          month: newDate.getMonth(),
                          formatted: `${newDate.getMonth() + 1}/${newDate.getDate()}/${newDate.getFullYear()}`,
                        });
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
                  const isYearSelected = currentDate?.getFullYear() === item.year;
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
            key={`calendar-${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}-${calendarKeyRef.current}-${isCalendarVisible}`}
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
    backgroundColor: colors.white, // ← ADD THIS LINE
    zIndex: 1004, // ensure header stays above backdrop if needed
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
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  menuIcon: {
    width: 24,
    height: 24,
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
    fontFamily: Fonts.bold, 
    color: '#181D27',
    marginRight: spacing.xs,
  },
 dropdownArrow: {
    marginLeft: 4,
  },
  dropdownArrowRotated: {
    transform: [{ rotate: '180deg' }],
  },
  monthSliderWrapper: {
    width: '100%',
    backgroundColor: 'transparent',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 50,
    zIndex: 1003,
    elevation: 0,
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
  backdrop: {

    position: 'absolute',
    top: 0,           // Change from -Dimensions.get('window').height
    left: 0,          // Change from -Dimensions.get('window').width
    right: 0,         // Add
    bottom: 0,        // Add

    zIndex: 999, // Backdrop Z-Index
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
    top: '100%',
    left: spacing.md,
    right: spacing.md,
    zIndex: 1000,
    elevation: 10,
  },
  monthScrollViewStyle: {
    flex: 1,
    width: '100%',
  },
  monthScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    flexWrap: 'nowrap',
  },
  monthScrollItem: {
      backgroundColor: '#F9F9F9', 
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginHorizontal: 4,
    borderWidth: 0,
  },
  monthScrollItemSelected: {
    backgroundColor: '#00AEEF' // App's primary green for selected
  },
  monthScrollText: {
    fontSize: fontSize.textSize14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  monthScrollTextSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  yearContainer: {
    marginHorizontal: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  yearText: {
    fontSize: fontSize.textSize14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  yearTextSelected: {
    color: colors.textPrimary,
    fontWeight: '700',
  },

  monthDropdownWrapper: {
    position: 'absolute',
    top: moderateScale(30), // Adjust this value to be just below the 'November' text
    left: 0,
    right: 0,
    zIndex: 1002, // Higher than backdrop (999) and calendar (1000)
    elevation: 12,
  },
});

export default WeekHeader;
