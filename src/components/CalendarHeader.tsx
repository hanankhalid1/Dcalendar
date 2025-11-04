import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { moderateScale, scaleHeight, scaleWidth } from '../utils/dimensions';
import {
  colors,
  fontSize,
  spacing,
  borderRadius,
  shadows,
} from '../utils/LightTheme';

interface CalendarHeaderProps {
  currentMonth: string;
  currentView: string;
  onMonthPress: () => void;
  onViewPress: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentMonth,
  currentView,
  onMonthPress,
  onViewPress,
}) => {
  return (
    <View style={styles.container}>
      {/* Left side - Month selector */}
      <TouchableOpacity style={styles.monthSelector} onPress={onMonthPress}>
        <Text style={styles.monthText}>{currentMonth}</Text>
        <Text style={styles.chevronDown}>▼</Text>
      </TouchableOpacity>

      {/* Middle - View toggle */}
      <TouchableOpacity style={styles.viewToggle} onPress={onViewPress}>
        <Text style={styles.viewText}>{currentView}</Text>
        <Text style={styles.chevronDown}>▼</Text>
      </TouchableOpacity>

      {/* Right side - Action icons */}
      <View style={styles.actionIcons}>
        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.iconText}>✓</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.iconText}>📅✓</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.iconText}>⭕✓</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  monthText: {
    fontSize: fontSize.textSize18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginRight: spacing.xs,
  },
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  viewText: {
    fontSize: fontSize.textSize14,
    fontWeight: '500',
    color: colors.primary,
    marginRight: spacing.xs,
  },
  chevronDown: {
    fontSize: fontSize.textSize12,
    color: colors.textSecondary,
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    marginLeft: spacing.xs,
  },
  iconText: {
    fontSize: fontSize.textSize16,
    color: colors.textSecondary,
  },
});

export default CalendarHeader;
