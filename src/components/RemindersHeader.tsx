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
import Feather from 'react-native-vector-icons/Feather';
import {
  colors,
  fontSize,
  spacing,
  borderRadius,
  shadows,
} from '../utils/LightTheme';
import LinearGradient from 'react-native-linear-gradient';

interface RemindersHeaderProps {
  onMenuPress: () => void;
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
}

const RemindersHeader: React.FC<RemindersHeaderProps> = ({
  onMenuPress,
  selectedFilter,
  onFilterChange,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filterOptions = [
    { value: 'today', label: 'Today' },
    { value: 'all', label: 'All' },
    { value: 'completed', label: 'Completed' },
    { value: 'recycle', label: 'Recycle bin' },
  ];

  const handleFilterSelect = (filter: string) => {
    onFilterChange(filter);
    setIsDropdownOpen(false);
  };

  const getFilterLabel = (value: string) => {
    const option = filterOptions.find(opt => opt.value === value);
    return option ? option.label : 'All';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={styles.header}>
        {/* Left Section - Hamburger Menu */}
        <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
          <Image
            source={require('../assets/images/HeaderImages/HeaderDrawer.png')}
          />
        </TouchableOpacity>

        {/* Center Section - Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>All Reminders</Text>
        </View>

        {/* Right Section - Filter Dropdown */}

        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Show reminder</Text>
          <LinearGradient
            colors={['#18F06E', '#0B6DE0']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradientBorder}
          >
            <TouchableOpacity
              style={styles.filterDropdown}
              onPress={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <Text style={styles.filterText}>
                {getFilterLabel(selectedFilter)}
              </Text>
              <Feather
                name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.mediumgray}
              />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>

      {/* Dropdown Options */}
      {isDropdownOpen && (
        <View style={styles.dropdownContainer}>
          {filterOptions.map(option => (
            <TouchableOpacity
              key={option.value}
              style={styles.dropdownOption}
              onPress={() => handleFilterSelect(option.value)}
            >
              <Text
                style={[
                  styles.dropdownOptionText,
                  selectedFilter === option.value && styles.selectedOptionText,
                ]}
              >
                {option.label}
              </Text>
              {selectedFilter === option.value && (
                // <Feather name="check" size={16} color={colors.figmaAccent} />
                <Image
                  style={styles.checkiconsimple}
                  source={require('../assets/images/checkiconsimple.png')}
                />
              )}
            </TouchableOpacity>
          ))}
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
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  menuButton: {
    width: moderateScale(17.14),
    height: moderateScale(13.16),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  titleText: {
    fontSize: fontSize.textSize18,
    fontWeight: '500',
    color: colors.blackText,
  },
  filterContainer: {
    // flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: fontSize.textSize14,
    color: colors.grey700,
    marginRight: spacing.xs,
    fontWeight: '500',
    paddingBottom: scaleHeight(5),
  },
  gradientBorder: {
    padding: 1,
    borderRadius: borderRadius.md,
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: scaleWidth(5),
    height: scaleHeight(44),
    width: scaleWidth(114),
    justifyContent: 'center',
  },
  filterText: {
    fontSize: fontSize.textSize14,
    color: colors.blackText,
    fontWeight: '500',
    marginRight: spacing.xs,
  },
  dropdownContainer: {
    position: 'absolute',
    right: spacing.md,
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    height: scaleHeight(184),
    width: scaleWidth(114),
    ...shadows.sm,
    zIndex: 1,
    top: scaleHeight(105),
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dropdownOptionText: {
    fontSize: fontSize.textSize14,
    color: colors.blackText,
    fontWeight: '400',
    // backgroundColor: 'red',
    width: scaleWidth(80),
    height: scaleHeight(20),
  },
  checkiconsimple: {
    width: scaleWidth(13.33),
    height: scaleHeight(9.7),
  },
  selectedOptionText: {
    color: colors.black,
    fontWeight: '500',
    fontSize: fontSize.textSize14,
  },
});

export default RemindersHeader;
