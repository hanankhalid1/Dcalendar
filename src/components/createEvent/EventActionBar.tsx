import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { scaleHeight, scaleWidth } from '../../utils/dimensions';
import {
  colors,
  fontSize,
  spacing,
  borderRadius,
  shadows,
} from '../../utils/LightTheme';

const screenWidth = Dimensions.get('window').width;
const isTablet = screenWidth >= 600;

const getTabletSafeDimension = (
  mobileValue: number,
  tabletValue: number,
  maxValue: number,
) => {
  if (isTablet) {
    return Math.min(tabletValue, maxValue);
  }
  return mobileValue;
};

interface EventActionBarProps {
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  onSave: () => void;
  isLoading: boolean;
}

const EventActionBar: React.FC<EventActionBarProps> = ({
  showAdvanced,
  onToggleAdvanced,
  onSave,
  isLoading,
}) => {
  return (
    <View style={styles.bottomActionBar}>
      <TouchableOpacity
        style={styles.advanceOptionsButton}
        onPress={onToggleAdvanced}
      >
        <Text style={styles.advanceOptionsText}>Advanced options</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
        onPress={onSave}
        disabled={isLoading}
      >
        <LinearGradient
          colors={isLoading ? ['#CCCCCC', '#AAAAAA'] : ['#18F06E', '#0B6DE0']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradient}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : 'Save'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginHorizontal: scaleWidth(60),
    paddingBottom: scaleHeight(50),
  },
  advanceOptionsButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  advanceOptionsText: {
    fontSize: getTabletSafeDimension(fontSize.textSize18, 20, 22),
    color: colors.dimGray,
    fontWeight: '600',
  },
  saveButton: {
    borderRadius: borderRadius.lg,
    minWidth: scaleWidth(120),
    alignItems: 'center',
    ...shadows.sm,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  gradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  saveButtonText: {
    fontSize: fontSize.textSize16,
    color: colors.white,
    fontWeight: '600',
  },
});

export default EventActionBar;




