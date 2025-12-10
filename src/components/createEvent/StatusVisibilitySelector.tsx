import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { scaleHeight } from '../../utils/dimensions';
import {
  colors,
  fontSize,
  spacing,
  borderRadius,
} from '../../utils/LightTheme';
import { Fonts } from '../../constants/Fonts';

interface StatusVisibilitySelectorProps {
  status?: string;
  visibility?: string;
  onStatusChange?: (value: string) => void;
  onVisibilityChange?: (value: string) => void;
}

const StatusVisibilitySelector: React.FC<StatusVisibilitySelectorProps> = ({
  status = 'Busy',
  visibility = 'Default visibility',
  onStatusChange,
  onVisibilityChange,
}) => {
  const [showStatusOptions, setShowStatusOptions] = useState(false);
  const [showVisibilityOptions, setShowVisibilityOptions] = useState(false);

  const statusOptions = ['Free', 'Busy'];
  const visibilityOptions = ['Default visibility', 'Private', 'Public'];

  const handleSelectStatus = (value: string) => {
    onStatusChange?.(value);
    setShowStatusOptions(false);
  };

  const handleSelectVisibility = (value: string) => {
    onVisibilityChange?.(value);
    setShowVisibilityOptions(false);
  };

  return (
    <View style={styles.container}>
      {/* Availability */}
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>Availability</Text>
        <TouchableOpacity
          style={[
            styles.dropdownField,
            showStatusOptions && styles.dropdownFieldActive,
          ]}
          activeOpacity={0.7}
          onPress={() => {
            setShowVisibilityOptions(false);
            setShowStatusOptions(prev => !prev);
          }}
        >
          <Text
            style={[
              styles.dropdownText,
              status ? styles.dropdownTextFilled : undefined,
            ]}
          >
            {status || 'Busy or Free'}
          </Text>
          <FeatherIcon name="chevron-down" size={16} color="#6C6C6C" />
        </TouchableOpacity>
        {showStatusOptions && (
          <View style={styles.optionsCard}>
            {statusOptions.map(option => (
              <TouchableOpacity
                key={option}
                style={styles.optionRow}
                onPress={() => handleSelectStatus(option)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.optionText,
                    status === option && styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
                {status === option && (
                  <FeatherIcon name="check" size={16} color="#00AEEF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Visibility */}
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>Visibility</Text>
        <TouchableOpacity
          style={[
            styles.dropdownField,
            showVisibilityOptions && styles.dropdownFieldActive,
          ]}
          activeOpacity={0.7}
          onPress={() => {
            setShowStatusOptions(false);
            setShowVisibilityOptions(prev => !prev);
          }}
        >
          <Text
            style={[
              styles.dropdownText,
              visibility ? styles.dropdownTextFilled : undefined,
            ]}
          >
            {visibility || 'Public or Private'}
          </Text>
          <FeatherIcon name="chevron-down" size={16} color="#6C6C6C" />
        </TouchableOpacity>
        {showVisibilityOptions && (
          <View style={styles.optionsCard}>
            {visibilityOptions.map(option => (
              <TouchableOpacity
                key={option}
                style={styles.optionRow}
                onPress={() => handleSelectVisibility(option)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.optionText,
                    visibility === option && styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
                {visibility === option && (
                  <FeatherIcon name="check" size={16} color="#00AEEF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
    gap: spacing.md,
    position: 'relative',
    zIndex: 10,
  },
  fieldBlock: {
    width: '100%',
  },
  label: {
    fontSize: fontSize.textSize12,
    color: '#414651',
    fontFamily: Fonts.latoMedium,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  dropdownField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCE0E5',
    paddingHorizontal: spacing.sm,
    minHeight: scaleHeight(44),
    paddingVertical: scaleHeight(10),
  },
  dropdownFieldActive: {
    borderColor: '#00AEEF',
  },
  dropdownText: {
    fontSize: 12,
    fontFamily: Fonts.latoRegular,
    color: '#A4A7AE',
    lineHeight: 18,
  },
  dropdownTextFilled: {
    color: '#252B37',
  },
  optionsCard: {
    marginTop: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    zIndex: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionText: {
    fontSize: fontSize.textSize14,
    color: '#252B37',
    fontFamily: Fonts.latoRegular,
  },
  optionTextSelected: {
    color: '#00AEEF',
    fontWeight: '600',
  },
});

export default StatusVisibilitySelector;
