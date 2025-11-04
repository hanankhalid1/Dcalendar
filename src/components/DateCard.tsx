import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import {
  moderateScale,
  scaleHeight,
  scaleWidth,
} from '../utils/dimensions';
import { colors, fontSize, spacing, borderRadius, shadows } from '../utils/LightTheme';

interface DateCardProps {
  day: string;
  date: string;
  month?: string;
  hasEvents?: boolean;
  compact?: boolean;
}

const DateCard: React.FC<DateCardProps> = ({
  day,
  date,
  month,
  hasEvents = false,
  compact = false,
}) => {
  if (compact) {
    return (
      <View style={[styles.compactContainer, hasEvents && styles.compactHasEvents]}>
        <Text style={styles.compactDayText}>{day}</Text>
        <Text style={styles.compactDateText}>{date}</Text>
        {month && <Text style={styles.compactMonthText}>{month}</Text>}
      </View>
    );
  }

  return (
    <View style={[styles.container, hasEvents && styles.hasEvents]}>
      <Text style={styles.dayText}>{day}</Text>
      <Text style={styles.dateText}>{date}</Text>
      {month && <Text style={styles.monthText}>{month}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: scaleWidth(80),
    height: scaleHeight(80),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    ...shadows.sm,
  },
  hasEvents: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundSecondary,
  },
  dayText: {
    fontSize: fontSize.textSize14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  dateText: {
    fontSize: fontSize.textSize24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  monthText: {
    fontSize: fontSize.textSize12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  // Compact styles for single-border layout
  compactContainer: {
    width: scaleWidth(80),
    height: '100%',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  compactHasEvents: {
    backgroundColor: colors.backgroundSecondary,
  },
  compactDayText: {
    fontSize: fontSize.textSize14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  compactDateText: {
    fontSize: fontSize.textSize24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  compactMonthText: {
    fontSize: fontSize.textSize12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});

export default DateCard;
