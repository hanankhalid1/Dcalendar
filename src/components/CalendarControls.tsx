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

interface CalendarControlsProps {
  currentView: string;
  onViewPress: () => void;
  onAction1Press: () => void;
  onAction2Press: () => void;
}

const CalendarControls: React.FC<CalendarControlsProps> = ({
  currentView,
  onViewPress,
  onAction1Press,
  onAction2Press,
}) => {
  return (
    <View style={styles.container}>
      {/* View Selector - Center */}
      <View style={styles.viewSection}>
        <TouchableOpacity style={styles.viewSelector} onPress={onViewPress}>
          <Text style={styles.viewText}>{currentView}</Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons - Right */}
      <View style={styles.actionSection}>
        {/* Action Button 1 - Selected */}
        <TouchableOpacity style={styles.actionButton1} onPress={onAction1Press}>
          <Text style={styles.actionIcon1}>✓</Text>
          <Text style={styles.actionIcon2}>📅</Text>
        </TouchableOpacity>

        {/* Action Button 2 - Unselected */}
        <TouchableOpacity style={styles.actionButton2} onPress={onAction2Press}>
          <Text style={styles.actionIcon3}>✓</Text>
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
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey20,
  },
  viewSection: {
    flex: 1,
    alignItems: 'center',
  },
  viewSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.figmaAccent, // Green border
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.sm,
  },
  viewText: {
    fontSize: fontSize.textSize16,
    fontWeight: '600',
    color: colors.figmaAccent, // Green text
    marginRight: spacing.xs,
  },
  dropdownArrow: {
    fontSize: fontSize.textSize12,
    color: colors.figmaAccent, // Green color
    fontWeight: 'bold',
  },
  actionSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton1: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.figmaLightBlue, // Light blue background
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    ...shadows.sm,
  },
  actionButton2: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.grey20,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.sm,
  },
  actionIcon1: {
    fontSize: fontSize.textSize16,
    color: colors.textPrimary,
    marginRight: spacing.xs,
  },
  actionIcon2: {
    fontSize: fontSize.textSize16,
    color: colors.textPrimary,
  },
  actionIcon3: {
    fontSize: fontSize.textSize16,
    color: colors.textPrimary,
  },
});

export default CalendarControls;
