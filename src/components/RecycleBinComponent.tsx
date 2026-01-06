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
import TrashIcon from '../assets/svgs/trash.svg';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;
const isTablet = screenWidth >= 600;

const getTabletSafeDimension = (
  mobileValue: number,
  tabletValue: number,
  maxValue: number,
) => {
  const currentScreenWidth = Dimensions.get('window').width;
  if (currentScreenWidth >= 600) {
    return Math.min(tabletValue, maxValue);
  }
  return mobileValue;
};

interface Reminder {
  id: string;
  title: string;
  time: string;
}

interface RecycleBinComponentProps {
  deletedReminders?: Reminder[];
  onItemPress: (reminder: Reminder) => void;
  onItemSelect: (reminderId: string) => void;
  onRestoreAll: () => void;
  onDeleteAll: () => void;
}

const RecycleBinComponent: React.FC<RecycleBinComponentProps> = ({
  deletedReminders = [],
  onItemPress,
  onItemSelect,
  onRestoreAll,
  onDeleteAll,
}) => {
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
        contentContainerStyle={undefined}
      >
        {/* Deletion Warning */}
        {deletedReminders.length > 0 && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>30 days until deletion.</Text>
          </View>
        )}

        {/* Deleted Items */}
        <View style={styles.section}>
          {deletedReminders.length > 0
            ? deletedReminders.map(renderReminderCard)
            : null}
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
    paddingHorizontal: getTabletSafeDimension(spacing.lg, 16, 24),
    paddingTop: getTabletSafeDimension(spacing.lg, 16, 24),
  },
  warningContainer: {
    marginBottom: getTabletSafeDimension(spacing.lg, 14, 20),
  },
  warningText: {
    fontSize: getTabletSafeDimension(fontSize.textSize16, 13, 18),
    fontWeight: '600',
    color: colors.black,
  },
  section: {
    marginBottom: getTabletSafeDimension(spacing.xl, 20, 28),
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#337E890F', // Very light gray background like in the image
    borderRadius: getTabletSafeDimension(borderRadius.md, 8, 10),
    padding: getTabletSafeDimension(spacing.md, 10, 14),
    marginBottom: getTabletSafeDimension(spacing.sm, 6, 10),
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  checkbox: {
    marginRight: getTabletSafeDimension(spacing.md, 8, 12),
    marginTop: getTabletSafeDimension(spacing.xs, 4, 6),
  },
  checkboxEmpty: {
    width: moderateScale(getTabletSafeDimension(11, 9, 13)),
    height: moderateScale(getTabletSafeDimension(11, 9, 13)),
    borderRadius: moderateScale(getTabletSafeDimension(5.5, 4.5, 7)),
    borderWidth: 0.4,
    borderColor: colors.black,
    backgroundColor: 'transparent', // Transparent background like in the image
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: getTabletSafeDimension(fontSize.textSize16, 12, 18),
    fontWeight: '600',
    color: colors.mediumgray, // Faded text for deleted items
    marginBottom: getTabletSafeDimension(spacing.xs, 3, 6),
    textDecorationLine: 'line-through',
  },
  reminderTime: {
    fontSize: getTabletSafeDimension(fontSize.textSize14, 11, 16),
    color: colors.grey400,
    textDecorationLine: 'line-through',
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyStateIllustration: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyStateIcon: {
    width: getTabletSafeDimension(scaleWidth(72), 60, 80),
    height: getTabletSafeDimension(scaleWidth(72), 60, 80),
    borderRadius: getTabletSafeDimension(scaleWidth(36), 30, 40),
    backgroundColor: '#E5F2FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getTabletSafeDimension(spacing.xs, 4, 8),
  },
  emptyStateTitle: {
    fontSize: getTabletSafeDimension(fontSize.textSize16, 13, 18),
    color: colors.black,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: getTabletSafeDimension(fontSize.textSize14, 11, 16),
    color: '#717680',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: getTabletSafeDimension(fontSize.textSize18, 14, 20),
  },
  emptyContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: getTabletSafeDimension(spacing.lg, 16, 24),
    paddingVertical: getTabletSafeDimension(spacing.md, 10, 14),
    gap: getTabletSafeDimension(spacing.md, 10, 14),
  },
  restoreButton: {
    flex: 1,
    backgroundColor: colors.grey100,
    borderRadius: getTabletSafeDimension(borderRadius.md, 8, 10),
    paddingVertical: getTabletSafeDimension(spacing.md, 10, 14),
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  restoreButtonText: {
    fontSize: getTabletSafeDimension(fontSize.textSize16, 12, 18),
    fontWeight: '600',
    color: colors.blackText,
  },
  deleteButton: {
    flex: 1,
    borderRadius: getTabletSafeDimension(borderRadius.md, 8, 10),
    overflow: 'hidden',
    ...shadows.sm,
  },
  deleteButtonGradient: {
    paddingVertical: getTabletSafeDimension(spacing.md, 10, 14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: getTabletSafeDimension(fontSize.textSize16, 12, 18),
    fontWeight: '600',
    color: colors.white,
  },
});

export default RecycleBinComponent;
