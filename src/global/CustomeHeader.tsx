import React, { useState } from 'react';
import {
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { moderateScale, scaleHeight, scaleWidth } from '../utils/dimensions';
import {
  borderRadius,
  colors,
  fontSize,
  shadows,
  spacing,
} from '../utils/LightTheme';

interface HeaderProps {
  onMenuPress: () => void;
  onMonthChange?: (month: string) => void;
  onViewChange?: (view: string) => void;
  onAction1Press?: () => void;
  onAction2Press?: () => void;
  // New props for HomeScreen integration
  title?: string;
  currentMonth?: string;
  currentView?: 'Day' | 'Week' | 'Month';
  onMonthPress?: () => void;
  onMonthSelect?: (monthIndex: number) => void;
  onViewPress?: () => void;
  onViewSelect?: (view: string) => void;
  isDrawerOpen?: boolean; // New prop to track drawer state
}

const CustomeHeader: React.FC<HeaderProps> = ({
  onMenuPress,
  onMonthChange,
  onViewChange,
  onAction1Press,
  onAction2Press,
  // New props
  title = 'Calendar',
  currentMonth = 'August',
  currentView = 'Week',
  onMonthPress,
  onMonthSelect,
  onViewPress,
  onViewSelect,
  isDrawerOpen = false, // Track drawer state
}) => {
  // Dropdown states
  const [isMonthDropdownVisible, setIsMonthDropdownVisible] = useState(false);
  const [isViewDropdownVisible, setIsViewDropdownVisible] = useState(false);
  
  // Close dropdowns when drawer opens
  React.useEffect(() => {
    if (isDrawerOpen) {
      setIsViewDropdownVisible(false);
      setIsMonthDropdownVisible(false);
    }
  }, [isDrawerOpen]);

  // Selected values - use props if available, otherwise fallback to state
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedView, setSelectedView] = useState(currentView);

  // Dropdown data
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const views = ['Day', 'Week', 'Month'];

  // Handlers
  const handleMonthSelect = (month: string) => {
    setSelectedMonth(month);
    setIsMonthDropdownVisible(false);
    onMonthChange?.(month);
  };

  const handleViewSelect = (view: string) => {
    setSelectedView(view as 'Day' | 'Week' | 'Month');
    setIsViewDropdownVisible(false);
    onViewChange?.(view);
    onViewSelect?.(view); // Call the new prop handler
  };

  // Update local state when props change
  React.useEffect(() => {
    setSelectedMonth(currentMonth);
  }, [currentMonth]);

  React.useEffect(() => {
    setSelectedView(currentView);
  }, [currentView]);

  return (
    <View style={[styles.container]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

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

          {/* Month Selector - COMMENTED OUT */}
          {/* <TouchableOpacity
            style={styles.monthSelector}
            onPress={() => {
              setIsMonthDropdownVisible(!isMonthDropdownVisible);
              setIsViewDropdownVisible(false); // close other dropdown
            }}
          >
            <Text style={styles.monthText}>{selectedMonth}</Text>
            <Image
              source={require('../assets/images/HeaderImages/arrowDropdown.png')}
            />
          </TouchableOpacity> */}
        </View>

        {/* Spacer to push right section to the far right */}
        <View style={styles.spacer} />

        {/* Right Section - View Selector */}
        <View style={styles.rightSection}>
          <View style={styles.viewSelectorContainer}>
            <TouchableOpacity
              style={styles.viewSelectorContent}
              onPress={() => {
                setIsViewDropdownVisible(!isViewDropdownVisible);
                setIsMonthDropdownVisible(false); // close other dropdown
                // Removed onViewPress to prevent automatic value change
              }}
            >
              <LinearGradient
                colors={['#18F06E', '#0B6DE0']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.gradientBorder}
              >
                <View style={styles.viewSelectorContent}>
                  <Text style={styles.viewText}>{selectedView}</Text>
                  <Image
                    source={require('../assets/images/HeaderImages/arrowDropdown.png')}
                    style={[
                      styles.dropdownArrow,
                      isViewDropdownVisible && styles.dropdownArrowRotated,
                    ]}
                  />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* View Dropdown */}
            {isViewDropdownVisible && (
              <View style={styles.viewDropdown}>
                {views.map((view) => (
                  <TouchableOpacity
                    key={view}
                    style={[
                      styles.viewDropdownItem,
                      view === selectedView && styles.viewDropdownItemSelected,
                    ]}
                    onPress={() => handleViewSelect(view)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text
                      style={[
                        styles.viewDropdownText,
                        view === selectedView && styles.viewDropdownTextSelected,
                      ]}
                    >
                      {view}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.actionButton1}
            onPress={onAction1Press}
          >
            <AntDesign
              name="check"
              size={14}
              color="#000"
              style={{ backgroundColor: 'transparent' }}
            />
            <View style={styles.CalenderView}>
              <FontAwesome6 name="calendar" size={14} color="#000" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton2}
            onPress={onAction2Press}
          >
            <Feather name="check-circle" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Month Dropdown - COMMENTED OUT */}
      {/* {isMonthDropdownVisible && (
        <Pressable
          style={styles.dropdownOverlay}
          onPress={() => setIsMonthDropdownVisible(false)}
        >
          <View style={[styles.dropdownContainer, { left: 55, top: 70 }]}>
            
            <FlatList
              data={months}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleMonthSelect(item)}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      item === selectedMonth && styles.selectedText,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      )} */}

      {/* Backdrop for dropdown */}
      {isViewDropdownVisible && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setIsViewDropdownVisible(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingBottom: spacing.md,
    ...shadows.sm,
    position: 'relative',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  spacer: {
    flex: 1, // This will take up all available space, pushing right section to the far right
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
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthText: {
    fontSize: fontSize.textSize18,
    fontWeight: '500',
    color: colors.blackText,
    marginRight: spacing.xs,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  viewSelectorContainer: {
    position: 'relative',
    zIndex: 1000,
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

  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)', // slight dim background
    zIndex: 999, // ensure it's on top
  },

  // Dropdown container box
  dropdownContainer: {
    position: 'absolute',
    backgroundColor: colors.white,
    borderRadius: 10,
    width: 180,
    maxHeight: 260,
    paddingVertical: 6,
    ...shadows.sm,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: colors.grey20,
  },

  // Each dropdown option
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: colors.grey20,
  },

  // Last item without border
  dropdownItemLast: {
    borderBottomWidth: 0,
  },

  // Text inside dropdown
  dropdownText: {
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    textAlign: 'center',
  },

  // Highlighted selected item
  selectedText: {
    fontWeight: 'bold',
    color: '#0B6DE0',
  },
  actionButton2: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.grey20,
    borderRadius: scaleHeight(20),
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

  // Dropdown Styles
   dropdownArrow: {
    width: 12,
    height: 8,
    marginTop:4,
    marginLeft: 1,
  },
  dropdownArrowRotated: {
    transform: [{ rotate: '180deg' }],
  },

  // Improved View Dropdown Styles (matching WeekHeader design exactly)
  backdrop: {
    position: 'absolute',
    top: '100%', // Start below the header
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 999,
  },
  viewDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0, // Align to right side
    backgroundColor: '#FFFFFF', // Explicit white background
    borderRadius: borderRadius.md,
    paddingVertical: spacing.xs,
    minWidth: 150,
    ...shadows.sm,
    zIndex: 1001,
    elevation: 11,
    borderWidth: 1,
    borderColor: colors.lightGrayishBlue || 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden', // Ensure clean edges
  },
  viewDropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF', // Explicit white background for each item
    minHeight: 44, // Ensure proper touch target size
    color: colors.blackText,
  },
  viewDropdownItemSelected: {
    backgroundColor: colors.lightGrayishBlue || 'rgba(11, 109, 224, 0.1)',
  },
  viewDropdownText: {
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    fontWeight: '500',
  },
  viewDropdownTextSelected: {
    fontWeight: '600',
    color: colors.primary || '#0B6DE0',
  },
});

export default CustomeHeader;
