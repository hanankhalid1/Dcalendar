import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { scaleHeight, scaleWidth } from '../../utils/dimensions';
import {
  colors,
  fontSize,
  spacing,
  borderRadius,
} from '../../utils/LightTheme';

interface NotificationSettingsProps {
  notificationMinutes: number;
  onNotificationMinutesChange: (minutes: number) => void;
  selectedTimeUnit?: string;
  onTimeUnitChange?: (unit: string) => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  notificationMinutes,
  onNotificationMinutesChange,
  selectedTimeUnit = 'Minutes',
  onTimeUnitChange,
}) => {
  const [showTimeUnitDropdown, setShowTimeUnitDropdown] = React.useState(false);

  const timeUnits = ['Minutes', 'Hours', 'Days', 'Weeks'];

  const handleTimeUnitSelect = (unit: string) => {
    if (onTimeUnitChange) {
      onTimeUnitChange(unit);
    }
    setShowTimeUnitDropdown(false);
  };
  return (
    <View style={styles.notificationRow}>
      <View style={styles.notificationLeft}>
        <FeatherIcon name="bell" size={24} color="#6C6C6C" />
        <Text style={styles.selectorText}>Notification</Text>
        <Image
          style={styles.smallArrowDropdown}
          source={require('../../assets/images/CreateEventImages/arrowDropdown.png')}
        />
      </View>
      <View style={styles.notificationRight}>
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
            selectTextOnFocus
          />
          <View style={styles.numberArrows}>
            <TouchableOpacity
              onPress={() =>
                onNotificationMinutesChange(
                  Math.min(notificationMinutes + 1, 999),
                )
              }
            >
              <FeatherIcon name="chevron-up" size={14} color="#130F26" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                onNotificationMinutesChange(
                  Math.max(notificationMinutes - 1, 0),
                )
              }
            >
              <FeatherIcon name="chevron-down" size={14} color="#130F26" />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity
          style={styles.timeUnitDropdown}
          onPress={() => setShowTimeUnitDropdown(!showTimeUnitDropdown)}
        >
          <Text style={styles.timeUnitText}>{selectedTimeUnit}</Text>
          <FeatherIcon name="chevron-down" size={14} color="#130F26" />
        </TouchableOpacity>
      </View>

      {/* Time Unit Dropdown */}
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
  );
};

const styles = StyleSheet.create({
  notificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorText: {
    fontSize: fontSize.textSize14,
    color: colors.blackText,
    fontWeight: '400',
    marginHorizontal: spacing.sm,
  },
  smallArrowDropdown: {
    height: scaleHeight(5.96),
    width: scaleWidth(10.9),
  },
  notificationRight: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: scaleWidth(25),
  },
  numberInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    borderColor: '#DCE0E5',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginLeft: spacing.sm,
    height: scaleHeight(32),
    width: scaleWidth(64),
    justifyContent: 'center',
  },
  numberText: {
    fontSize: fontSize.textSize16,
    color: colors.textPrimary,
    fontWeight: '600',
    marginHorizontal: spacing.xs,
  },
  numberTextInput: {
    fontSize: fontSize.textSize16,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
    padding: 0,
    margin: 0,
  },
  numberArrows: {
    flexDirection: 'column',
    marginLeft: spacing.xs,
  },
  timeUnitDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    borderColor: '#DCE0E5',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginLeft: spacing.sm,
  },
  timeUnitText: {
    fontSize: fontSize.textSize16,
    color: colors.textPrimary,
    fontWeight: '600',
    marginHorizontal: spacing.xs,
  },
  timeUnitDropdownMenu: {
    position: 'absolute',
    top: scaleHeight(40),
    right: scaleWidth(25),
    width: scaleWidth(100),
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#DCE0E5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  timeUnitOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timeUnitOptionSelected: {
    backgroundColor: '#E3F2FD',
  },
  timeUnitOptionText: {
    fontSize: fontSize.textSize14,
    color: colors.textPrimary,
    fontWeight: '400',
  },
  timeUnitOptionTextSelected: {
    color: '#1976D2',
    fontWeight: '600',
  },
});

export default NotificationSettings;
