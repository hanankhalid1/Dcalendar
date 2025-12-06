import React, { useState, useEffect } from 'react';
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
import DIcon from '../assets/svgs/DIcon.svg';
import SearchIcon from '../assets/svgs/search.svg';
import CalendarIcon from '../assets/svgs/calendarBlack.svg';
import MenuIcon from '../assets/svgs/menu.svg';
import { Fonts } from '../constants/Fonts';
import { moderateScale, scaleHeight, scaleWidth, screenWidth } from '../utils/dimensions';
import {
  borderRadius,
  colors,
  fontSize,
  shadows,
  spacing,
} from '../utils/LightTheme';
import MenuIcon from '../assets/svgs/menu.svg';
import EventIcon from '../assets/svgs/eventIcon.svg';
type EventFilter = 'All' | 'EventsOnly' | 'TasksOnly';

interface HeaderProps {
  onMenuPress: () => void;
  onMonthChange?: (month: string) => void;
  onViewChange?: (view: string) => void;
  onAction1Press?: (isSelected: boolean) => void; // Event (Calendar/Check)
  onAction2Press?: (isSelected: boolean) => void;
  // New props for HomeScreen integration
  title?: string;
  currentMonth?: string;
  currentView?: 'Day' | 'Week' | 'Month';
  onMonthPress?: () => void;
  onMonthSelect?: (monthIndex: number) => void;
  onViewPress?: () => void;
  onViewSelect?: (view: string) => void;
  filterType?: EventFilter; // Add this prop
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
  filterType = 'All', // Default value
}) => {
  // Dropdown states
  const [isMonthDropdownVisible, setIsMonthDropdownVisible] = useState(false);
  const [isViewDropdownVisible, setIsViewDropdownVisible] = useState(false);

  // Selected values - use props if available, otherwise fallback to state
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedView, setSelectedView] = useState(currentView);

  // Derive button states from filterType prop
  const isEventSelected = filterType === 'EventsOnly';
  const isTaskSelected = filterType === 'TasksOnly';

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

  const handleEventPress = () => {
    if (isEventSelected) {
      // If already selected, unselect it (show all)
      onAction1Press?.(false);
    } else {
      // If not selected, select Events and unselect Tasks
      onAction1Press?.(true);
      onAction2Press?.(false);
    }
  };

  const handleTaskPress = () => {
    if (isTaskSelected) {
      // If already selected, unselect it (show all)
      onAction2Press?.(false);
    } else {
      // If not selected, select Tasks and unselect Events
      onAction2Press?.(true);
      onAction1Press?.(false);
    }
  };

  const handleViewSelect = (view: string) => {
    setSelectedView(view as 'Day' | 'Week' | 'Month');
    setIsViewDropdownVisible(false);
    onViewChange?.(view);
    onViewSelect?.(view);
  };

  // Update local state when props change
  useEffect(() => {
    setSelectedMonth(currentMonth);
  }, [currentMonth]);

  useEffect(() => {
    setSelectedView(currentView);
  }, [currentView]);

  return (
    <View style={[styles.container]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={styles.header}>
        {/* Left Section - Hamburger Menu + Logo */}
        <View style={styles.leftSection}>
          {/* Hamburger Menu */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={onMenuPress}
            activeOpacity={0.7}
          >
            <MenuIcon width={24} height={24} />
          </TouchableOpacity>

          {/* DCalendar Logo */}
          <View style={styles.logoContainer}>
            <DIcon width={scaleWidth(24)} height={scaleHeight(24)} />
            <Text style={styles.logoText}>DCalendar</Text>
          </View>
        </View>

        {/* Right Section - Search and Calendar Icons */}
        <View style={styles.rightSection}>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <SearchIcon width={24} height={24} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <CalendarIcon width={24} height={24} />
          </TouchableOpacity>
        </View>

      </View>

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
    width: screenWidth, // Full screen width for responsiveness
    flexDirection: 'column', // Changed to column to stack header and navigation
    position: 'relative',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: scaleHeight(80),
    paddingRight: scaleWidth(18),
    paddingLeft: scaleWidth(18),
    borderBottomWidth: 1,
    borderBottomColor: colors.white,
    gap: scaleWidth(12),
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8), // Increased gap between menu and logo
    flex: 1,
  },
  menuButton: {
    width: scaleWidth(40),
    height: scaleHeight(40),
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xs,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
  },
  logoText: {
    fontSize: fontSize.textSize18,
    fontWeight: '600',
    fontFamily: Fonts.latoBold,
    color: colors.blackText,
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
    gap: scaleWidth(8), // Reduced gap between search and calendar icons
  },
  iconButton: {
    width: scaleWidth(40),
    height: scaleHeight(40),
    justifyContent: 'center',
    alignItems: 'center',
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
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: scaleHeight(36.11),
    borderRadius: scaleHeight(20),
    paddingHorizontal: spacing.sm,
  },
  actionButton1: {
    flexDirection: 'row',
    backgroundColor: '#00AEEF',
    marginRight: scaleWidth(3),
    width: scaleWidth(55.47),
  },
  actionButton2: {
    backgroundColor: '#00AEEF',
    borderWidth: 1,
    width: scaleWidth(40.11),
  },
  actionButtonInactive: {
    borderWidth: 1,
    borderColor: colors.grey20,
    backgroundColor: colors.white,
  },
  CalenderView: {
    backgroundColor: colors.white,
    borderRadius: 2,
    marginLeft: 5,
  },
  CalenderViewActive: {
    backgroundColor: colors.white,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 999,
  },
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
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: colors.grey20,
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownText: {
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    textAlign: 'center',
  },
  selectedText: {
    fontWeight: 'bold',
    color: '#00AEEF',
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
    marginTop: 4,
    marginLeft: 1,
  },
  dropdownArrowRotated: {
    transform: [{ rotate: '180deg' }],
  },
  backdrop: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 999,
  },
  viewDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.xs,
    minWidth: 150,
    ...shadows.sm,
    zIndex: 1001,
    elevation: 11,
    borderWidth: 1,
    borderColor: colors.lightGrayishBlue || 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  viewDropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    minHeight: 44,
    color: colors.blackText,
  },
  viewDropdownItemSelected: {
    backgroundColor: colors.lightGrayishBlue || 'rgba(11, 109, 224, 0.1)',
  },
  viewDropdownText: {
    fontSize: fontSize.textSize16,
    fontFamily: Fonts.latoMedium,
    color: colors.blackText,
    fontWeight: '500',
  },
  viewDropdownTextSelected: {
    fontWeight: '600',
    fontFamily: Fonts.latoBold,
    color: colors.primary || '#00AEEF',
  },
});

export default CustomeHeader;