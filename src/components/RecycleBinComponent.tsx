import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
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
}

interface RecycleBinComponentProps {
  onItemPress: (reminder: Reminder) => void;
  onItemSelect: (reminderId: string) => void;
  onRestoreAll: () => void;
  onDeleteAll: () => void;
}

const RecycleBinComponent: React.FC<RecycleBinComponentProps> = ({
  onItemPress,
  onItemSelect,
  onRestoreAll,
  onDeleteAll,
}) => {
  // Sample data matching the "Recycle bin" image
  const deletedReminders: Reminder[] = [
    {
      id: '1',
      title: 'Trip day',
      time: 'Sat, 30 Aug, 04:00 pm',
    },
    {
      id: '2',
      title: 'Project submission deadline',
      time: 'Sun, 31 Aug, 12:00 am',
    },
  ];

  const renderReminderCard = (reminder: Reminder) => (
    <TouchableOpacity
      key={reminder.id}
      style={styles.reminderCard}
      onPress={() => onItemPress(reminder)}
    >
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => onItemSelect(reminder.id)}
      >
        <View style={styles.checkboxEmpty} />
      </TouchableOpacity>

      <View style={styles.reminderContent}>
        <Text style={styles.reminderTitle}>{reminder.title}</Text>
        <Text style={styles.reminderTime}>{reminder.time}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Deletion Warning */}
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>30 days until deletion.</Text>
        </View>

        {/* Deleted Items */}
        <View style={styles.section}>
          {deletedReminders.length > 0 ? (
            deletedReminders.map(renderReminderCard)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No items in recycle bin.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {deletedReminders.length > 0 && (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.restoreButton} onPress={onRestoreAll}>
            <Text style={styles.restoreButtonText}>Restore all</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={onDeleteAll}>
            <LinearGradient
              colors={['#18F06E', '#0B6DE0']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.deleteButtonGradient}
            >
              <Text style={styles.deleteButtonText}>Delete all</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  warningContainer: {
    marginBottom: spacing.lg,
  },
  warningText: {
    fontSize: fontSize.textSize16,
    fontWeight: '600',
    color: colors.black,
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
    color: colors.mediumgray, // Faded text for deleted items
    marginBottom: spacing.xs,
    textDecorationLine: 'line-through',
  },
  reminderTime: {
    fontSize: fontSize.textSize14,
    color: colors.grey400,
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
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  restoreButton: {
    flex: 1,
    backgroundColor: colors.grey100,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  restoreButtonText: {
    fontSize: fontSize.textSize16,
    fontWeight: '600',
    color: colors.blackText,
  },
  deleteButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  deleteButtonGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: fontSize.textSize16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default RecycleBinComponent;
