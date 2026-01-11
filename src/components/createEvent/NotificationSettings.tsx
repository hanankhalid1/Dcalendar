import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Platform,
  Dimensions,
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { scaleHeight, scaleWidth } from '../../utils/dimensions';
import {
  colors,
  fontSize,
  spacing,
  borderRadius,
} from '../../utils/LightTheme';
import { Fonts } from '../../constants/Fonts';

interface NotificationSettingsProps {
  notificationMinutes: number;
  onNotificationMinutesChange: (minutes: number) => void;
  selectedTimeUnit?: string;
  onTimeUnitChange?: (unit: string) => void;
  // Called when the time unit dropdown is about to open
  onDropdownOpen?: () => void;
  // Register a closer so parent can close this dropdown when others open
  registerCloser?: (closeFn: () => void) => void;
}

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

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  notificationMinutes,
  onNotificationMinutesChange,
  selectedTimeUnit = 'Minutes',
  onTimeUnitChange,
  onDropdownOpen,
  registerCloser,
}) => {
  const [showTimeUnitDropdown, setShowTimeUnitDropdown] = React.useState(false);

  const timeUnits = ['Minutes', 'Hours', 'Days', 'Weeks'];

  const handleTimeUnitSelect = (unit: string) => {
    if (onTimeUnitChange) {
      onTimeUnitChange(unit);
    }
    setShowTimeUnitDropdown(false);
  };

  // Auto-close the dropdown whenever the selected unit changes
  React.useEffect(() => {
    if (showTimeUnitDropdown) {
      setShowTimeUnitDropdown(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTimeUnit]);

  // Expose a closer to parent coordinator
  React.useEffect(() => {
    registerCloser?.(() => setShowTimeUnitDropdown(false));
  }, [registerCloser]);
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.labelText}>Notification</Text>
      <View style={styles.notificationInputsRow}>
        {/* Minutes/Hours Input */}
        <View style={styles.minutesContainer}>
          <View style={styles.numberInput}>
            <TextInput
              style={styles.numberTextInput}
              value={notificationMinutes.toString()}
              onChangeText={text => {
                const num = parseInt(text.replace(/[^0-9]/g, '')) || 0;
                onNotificationMinutesChange(Math.min(Math.max(num, 0), 999));
              }}
              keyboardType="numeric"
              maxLength={3}
            />
            <View style={styles.numberArrows}>
              <TouchableOpacity
                onPress={() =>
                  onNotificationMinutesChange(
                    Math.min(notificationMinutes + 1, 999),
                  )
                }
              >
                <FeatherIcon name="chevron-up" size={12} color="#130F26" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  onNotificationMinutesChange(
                    Math.max(notificationMinutes - 1, 0),
                  )
                }
              >
                <FeatherIcon name="chevron-down" size={12} color="#130F26" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Time Unit Dropdown */}
        <TouchableOpacity
          style={[
            styles.timeUnitDropdown,
            showTimeUnitDropdown && styles.timeUnitDropdownActive,
          ]}
          onPress={() => {
            // Notify parent so other dropdowns close
            onDropdownOpen?.();
            setShowTimeUnitDropdown(!showTimeUnitDropdown);
          }}
        >
          <Text style={styles.timeUnitText}>{selectedTimeUnit}</Text>
          <FeatherIcon name="chevron-down" size={14} color="#6C6C6C" />
        </TouchableOpacity>

        {/* Outside tap overlay to close dropdown reliably */}
        {showTimeUnitDropdown && (
          <TouchableOpacity
            style={styles.dropdownOverlay}
            activeOpacity={1}
            onPress={() => setShowTimeUnitDropdown(false)}
          />
        )}

        {/* Time Unit Dropdown Menu */}
        {showTimeUnitDropdown && (
          <View style={styles.timeUnitDropdownMenu}>
            {timeUnits.map(unit => (
              <TouchableOpacity
                key={unit}
                style={[
                  styles.timeUnitOption,
                  selectedTimeUnit === unit && styles.timeUnitOptionSelected,
                ]}
                onPress={() => handleTimeUnitSelect(unit)}
              >
                <Text
                  style={[
                    styles.timeUnitOptionText,
                    selectedTimeUnit === unit &&
                      styles.timeUnitOptionTextSelected,
                  ]}
                >
                  {unit}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: scaleHeight(20),
  },
  labelText: {
    fontFamily: Fonts.latoMedium,
    fontWeight: '500',
    fontSize: getTabletSafeDimension(12, 15, 17),
    lineHeight: getTabletSafeDimension(12, 18, 20),
    letterSpacing: 0,
    color: '#414651',
    marginBottom: scaleHeight(8),
  },
  notificationInputsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  minutesContainer: {
    flex: 1,
  },
  numberInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#DCE0E5',
    paddingHorizontal: spacing.sm,
    paddingVertical: scaleHeight(10),
    height: scaleHeight(44),
    justifyContent: 'space-between',
  },
  numberText: {
    fontSize: getTabletSafeDimension(12, 14, 16),
    fontFamily: Fonts.latoRegular,
    color: colors.textPrimary,
    fontWeight: '400',
    marginHorizontal: spacing.xs,
  },
  numberTextInput: {
    fontSize: getTabletSafeDimension(12, 14, 16),
    fontFamily: Fonts.latoRegular,
    color: '#252B37',
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
    padding: 0,
    margin: 0,
  },
  numberArrows: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  timeUnitDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#DCE0E5',
    paddingHorizontal: spacing.md,
    paddingVertical: scaleHeight(10),
    height: scaleHeight(44),
    minWidth: scaleWidth(110),
    position: 'relative',
    zIndex: 5,
  },
  timeUnitDropdownActive: {
    borderColor: '#00AEEF',
  },
  timeUnitText: {
    fontSize: getTabletSafeDimension(12, 14, 16),
    fontFamily: Fonts.latoRegular,
    color: '#252B37',
    fontWeight: '500',
  },
  timeUnitDropdownMenu: {
    position: 'absolute',
    top: scaleHeight(48),
    right: 0,
    width: scaleWidth(110),
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCE0E5',
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  timeUnitOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timeUnitOptionSelected: {
    backgroundColor: 'transparent',
  },
  timeUnitOptionText: {
    fontSize: getTabletSafeDimension(12, 14, 16),
    fontFamily: Fonts.latoRegular,
    color: '#252B37',
    fontWeight: '500',
    lineHeight: 18,
  },
  timeUnitOptionTextSelected: {
    color: '#00AEEF',
    fontWeight: '600',
  },
});

export default NotificationSettings;
