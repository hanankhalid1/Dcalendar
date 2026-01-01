import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { scaleHeight, scaleWidth } from '../../utils/dimensions';
import {
  colors,
  fontSize,
  spacing,
  borderRadius,
} from '../../utils/LightTheme';

interface DateTimeSelectorProps {
  selectedDate: Date | null;
  selectedStartTime: string;
  selectedEndTime: string;
  showDetailedDateTime: boolean;
  onDateTimePress: () => void;
}

const DateTimeSelector: React.FC<DateTimeSelectorProps> = ({
  selectedDate,
  selectedStartTime,
  selectedEndTime,
  showDetailedDateTime,
  onDateTimePress,
}) => {
  if (showDetailedDateTime && selectedDate) {
    return (
      <View style={styles.dateTimeContainer}>
        {/* From Section */}
        <View style={styles.fromToSection}>
          <Text style={styles.fromToLabel}>From:</Text>
          <View style={styles.dateTimeRow}>
            <View style={styles.dateDisplay}>
              <FeatherIcon name="calendar" size={16} color="#6C6C6C" />
              <Text style={styles.dateText}>
                {selectedDate.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.timeInputContainer}
              onPress={onDateTimePress}
            >
              <TextInput
                style={styles.timeInput}
                value={selectedStartTime}
                placeholder="05:25 PM"
                placeholderTextColor={colors.grey400}
                editable={false}
              />
              <FeatherIcon name="clock" size={14} color="#6C6C6C" />
            </TouchableOpacity>
          </View>
        </View>

        {/* To Section */}
        <View style={styles.fromToSection}>
          <Text style={styles.fromToLabel}>To:</Text>
          <View style={styles.dateTimeRow}>
            <View style={styles.dateDisplay}>
              <FeatherIcon name="calendar" size={16} color="#6C6C6C" />
              <Text style={styles.dateText}>
                {selectedDate.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.timeInputContainer}
              onPress={onDateTimePress}
            >
              <TextInput
                style={styles.timeInput}
                value={selectedEndTime}
                placeholder="06:25 PM"
                placeholderTextColor={colors.grey400}
                editable={false}
              />
              <FeatherIcon name="clock" size={14} color="#6C6C6C" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.selectorItem} onPress={onDateTimePress}>
      <FeatherIcon name="calendar" size={20} color="#6C6C6C" />
      <Text style={styles.selectorText}>Pick date and time</Text>
      <Image
        source={require('../../assets/images/CreateEventImages/smallArrowDropdown.png')}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  selectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    width: scaleWidth(185),
  },
  selectorText: {
    fontSize: fontSize.textSize14,
    color: colors.blackText,
    fontWeight: '400',
    marginHorizontal: spacing.sm,
  },
  dateTimeContainer: {
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  fromToSection: {
    marginBottom: spacing.md,
  },
  fromToLabel: {
    fontSize: fontSize.textSize14,
    color: colors.blackText,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateText: {
    fontSize: fontSize.textSize14,
    color: colors.blackText,
    fontWeight: '400',
    marginLeft: spacing.xs,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.white,
    minWidth: scaleWidth(100),
  },
  timeInput: {
    fontSize: fontSize.textSize14,
    color: colors.blackText,
    fontWeight: '400',
    padding: 0,
    marginRight: spacing.xs,
    textAlign: 'center',
    flex: 1,
  },
});

export default DateTimeSelector;




