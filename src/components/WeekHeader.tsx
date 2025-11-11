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
      onMonthSelect?.(monthIndex);
    }
    setIsMonthDropdownVisible(false);
  };

  const handleYearSelect = (year: number) => {
    if (currentDate) {
      const newDate = new Date(
        year,
        currentDate.getMonth(),
        currentDate.getDate(),
        12,
        0,
        0,
        0,
      );
      onDateSelect?.(newDate);
    }
    setIsMonthDropdownVisible(false);
  };

  // Auto-scroll to current month when dropdown opens
  useEffect(() => {
    if (isMonthDropdownVisible && currentDate && scrollViewRef.current) {
      const currentMonthIndex = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const previousYear = currentYear - 1;
      
      // Calculate scroll position
      // We show 12 months before current month
      // Count items: previous year label + months from Nov 2024 to Oct 2025 (12 months)
      // Then current year label + months from Jan to current month
      let itemCount = 0;
      
      // Previous year items (from same month to Dec)
      const monthsFromPrevYear = 12 - currentMonthIndex; // e.g., Nov to Dec = 2 months
      if (monthsFromPrevYear > 0) {
        itemCount += 1; // Year label
        itemCount += monthsFromPrevYear;
      }
      
      // Current year items (from Jan to current month)
      itemCount += 1; // Year label
      itemCount += currentMonthIndex + 1; // Months including current
      
      // Each item is approximately 60-70px wide (including margins)
      const itemWidth = 70;
      const scrollPosition = itemCount * itemWidth;
      
      // Scroll with a slight delay to ensure layout is complete
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: Math.max(0, scrollPosition - 100), // Offset slightly to center better
          animated: true,
        });
      }, 150);
    }
  }, [isMonthDropdownVisible, currentDate]);
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={styles.header}>
        {/* Left Section - Menu Icon and Month Component */}
        <View style={styles.leftSection}>
          {/* Hamburger Menu */}
          <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
            {/* <MenuIcon width={24} height={24} /> */}
            <Image
              source={require('../assets/images/HeaderImages/HeaderDrawer.png')}
              style={styles.menuIcon}
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

      {/* Month Slider - Full width horizontal slider */}
      {isMonthDropdownVisible && (() => {
        // Generate dynamic months centered around current month
        // From same month in previous year to same month in next year
        const dynamicItems: Array<{ type: 'month'; monthIndex: number; year: number } | { type: 'year'; year: number }> = [];
        
        if (currentDate) {
          const currentMonthIndex = currentDate.getMonth();
          const currentYear = currentDate.getFullYear();
          const previousYear = currentYear - 1;
          const nextYear = currentYear + 1;
          
          // Start from the same month in previous year (e.g., Nov 2024)
          // Go through to the same month in next year (e.g., Nov 2026)
          
          let lastYearAdded: number | null = null;
          
          // Generate 25 months: 12 months before + current month + 12 months after
          for (let i = -12; i <= 12; i++) {
            const totalMonths = currentMonthIndex + i;
            const monthIndex = ((totalMonths % 12) + 12) % 12; // Handle negative modulo
            const year = currentYear + Math.floor(totalMonths / 12);
            
            // Add year label when year changes
            if (lastYearAdded !== year) {
              dynamicItems.push({ type: 'year', year });
              lastYearAdded = year;
            }
            
            dynamicItems.push({ type: 'month', monthIndex, year });
          }
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
                        const newDate = new Date(
                          item.year,
                          item.monthIndex,
                          1,
                          12,
                          0,
                          0,
                          0,
                        );
                        onDateSelect?.(newDate);
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
    fontWeight: '600',
    color: colors.textPrimary,
    marginRight: spacing.xs,
  },
  dropdownArrow: {
    width: 12,
    height: 8,
    marginTop: 4,
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
    elevation: 13,
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
    // width/height removed as top/bottom/left/right covers the screen
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
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
    backgroundColor: colors.lightGrayishBlue, // App's light gray for unselected
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginHorizontal: 4,
  },
  monthScrollItemSelected: {
    backgroundColor: colors.primary2, // App's primary green for selected
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
  // --- ADD THIS TO styles = StyleSheet.create({...}) ---

  monthDropdownWrapper: {
    position: 'absolute',
    top: moderateScale(30), // Adjust this value to be just below the 'November' text
    left: 0,
    right:0,
    zIndex: 1002, // Higher than backdrop (999) and calendar (1000)
    elevation: 12,
  },
});

export default WeekHeader;
