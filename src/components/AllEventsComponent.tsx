import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { moderateScale, scaleHeight, scaleWidth } from '../utils/dimensions';
import {
  colors,
  fontSize,
  spacing,
  borderRadius,
  shadows,
} from '../utils/LightTheme';

interface Reminder {
  id: string;
  title: string;
  time: string;
  duration?: string;
  hasAsterisk?: boolean;
}

interface AllEventsComponentProps {
  onReminderPress: (reminder: Reminder) => void;
  onReminderSelect: (reminderId: string) => void;
}

const AllEventsComponent: React.FC<AllEventsComponentProps> = ({
  onReminderPress,
  onReminderSelect,
}) => {
  // Sample data matching the "All Reminders" image
  const todayReminders: Reminder[] = [
    {
      id: '1',
      title: 'Event',
      time: 'Today, 3:55pm',
      duration: 'Time (10 minutes)',
      hasAsterisk: true,
    },
  ];

  const soonReminders: Reminder[] = [
    {
      id: '2',
      title: 'Birthday party',
      time: 'Fri, 29 Aug, 07:34 pm',
      hasAsterisk: true,
    },
    {
      id: '3',
      title: 'Trip day',
      time: 'Sat, 30 Aug, 04:00 pm',
      hasAsterisk: true,
    },
    {
      id: '4',
      title: 'Project submission deadline',
      time: 'Sun, 31 Aug, 12:00 am',
      hasAsterisk: true,
    },
  ];

  const renderReminderCard = (reminder: Reminder) => (
    <TouchableOpacity
      key={reminder.id}
      style={styles.reminderCard}
      onPress={() => onReminderPress(reminder)}
    >
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => onReminderSelect(reminder.id)}
      >
        <View style={styles.checkboxEmpty} />
      </TouchableOpacity>

      <View style={styles.reminderContent}>
        <View style={styles.titleRow}>
          <Text style={styles.reminderTitle}>{reminder.title}</Text>
          {reminder.hasAsterisk && <Text style={styles.asterisk}>*</Text>}
        </View>
        <Text style={styles.reminderTime}>{reminder.time}</Text>
        {reminder.duration && (
          <Text style={styles.reminderDuration}>{reminder.duration}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Today Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today</Text>
        {todayReminders.map(renderReminderCard)}
      </View>

      {/* Soon Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Soon</Text>
        {soonReminders.map(renderReminderCard)}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.textSize18,
    fontWeight: '600',
    color: colors.blackText,
    marginBottom: spacing.md,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#337E890F', // Very light gray background like in the image
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  checkbox: {
    marginRight: spacing.md,
    marginTop: spacing.xs,
  },
  checkboxEmpty: {
    width: moderateScale(11),
    height: moderateScale(11),
    borderRadius: moderateScale(5.5),
    borderWidth: 0.4,
    borderColor: colors.black,
    backgroundColor: 'transparent', // Transparent background like in the image
  },
  reminderContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  reminderTitle: {
    fontSize: fontSize.textSize16,
    fontWeight: '600',
    color: colors.blackText,
  },
  asterisk: {
    fontSize: fontSize.textSize16,
    color: colors.error,
    marginLeft: spacing.xs,
  },
  reminderTime: {
    fontSize: fontSize.textSize14,
    color: colors.mediumgray,
    marginBottom: spacing.xs,
  },
  reminderDuration: {
    fontSize: fontSize.textSize12,
    color: colors.mediumgray,
    marginTop: spacing.xs,
  },
});

export default AllEventsComponent;
// Component for displaying all reminders with Today and Soon sections
