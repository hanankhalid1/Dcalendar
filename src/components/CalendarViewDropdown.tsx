import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { moderateScale, scaleHeight, scaleWidth } from '../utils/dimensions';
import {
  colors,
  fontSize,
  spacing,
  borderRadius,
  shadows,
} from '../utils/LightTheme';

interface CalendarViewDropdownProps {
  currentView: string;
  onViewSelect: (view: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

const CalendarViewDropdown: React.FC<CalendarViewDropdownProps> = ({
  currentView,
  onViewSelect,
  isVisible,
  onClose,
}) => {
  const viewOptions = [
    { key: 'Month', label: 'Month' },
    { key: 'Week', label: 'Week' },
    { key: 'Day', label: 'Day' },
    { key: 'Agenda', label: 'Agenda' },
  ];

  const handleViewSelect = (view: string) => {
    onViewSelect(view);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <View style={styles.dropdownContainer}>
      {viewOptions.map(option => (
        <TouchableOpacity
          key={option.key}
          style={[
            styles.dropdownItem,
            currentView === option.key && styles.selectedItem,
          ]}
          onPress={() => handleViewSelect(option.key)}
        >
          <Text
            style={[
              styles.dropdownText,
              currentView === option.key && styles.selectedText,
            ]}
          >
            {option.label}
          </Text>
          {currentView === option.key && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    minWidth: 150,
    ...shadows.lg,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.lightGrayishBlue,
    zIndex: 1001,
    marginTop: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  selectedItem: {
    backgroundColor: colors.lightGrayishBlue,
  },
  dropdownText: {
    fontSize: fontSize.textSize16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  selectedText: {
    fontWeight: '600',
    color: colors.primary,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default CalendarViewDropdown;
