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
}

interface CompletedComponentProps {
  onReminderPress: (reminder: Reminder) => void;
  onReminderSelect: (reminderId: string) => void;
}

const CompletedComponent: React.FC<CompletedComponentProps> = ({
  onReminderPress,
  onReminderSelect,
}) => {
  // Sample data matching the "Completed" image
  const completedReminders: Reminder[] = [
    {
      id: '1',
      title: 'Event',
      time: 'Today, 3:55pm',
      duration: 'Time (10 minutes)',
    },
    {
      id: '2',
      title: 'Birthday party',
      time: 'Fri, 29 Aug, 07:34 pm',
    },
    {
      id: '3',
      title: 'Trip day',
      time: 'Sat, 30 Aug, 04:00 pm',
    },
    {
      id: '4',
      title: 'Project submission deadline',
      time: 'Sun, 31 Aug, 12:00 am',
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
        <Text style={styles.reminderTitle}>{reminder.title}</Text>
        <Text style={styles.reminderTime}>{reminder.time}</Text>
        {reminder.duration && (
          <Text style={styles.reminderDuration}>{reminder.duration}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        {completedReminders.length > 0 ? (
          completedReminders.map(renderReminderCard)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No completed reminders.</Text>
          </View>
        )}
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
  reminderTitle: {
    fontSize: fontSize.textSize16,
    fontWeight: '600',
    color: colors.grey300, // Faded text for deleted items
    marginBottom: spacing.xs,
    textDecorationLine: 'line-through',
  },
  reminderTime: {
    fontSize: fontSize.textSize14,
    color: colors.grey300,
    textDecorationLine: 'line-through',
  },
  reminderDuration: {
    fontSize: fontSize.textSize12,
    color: colors.grey400,
    marginLeft: spacing.sm,
    textDecorationLine: 'line-through',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyStateText: {
    fontSize: fontSize.textSize16,
    color: colors.mediumgray,
    fontWeight: '400',
    textAlign: 'center',
  },
});

export default CompletedComponent;
