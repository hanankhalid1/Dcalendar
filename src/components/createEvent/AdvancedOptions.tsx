import React from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing } from '../../utils/LightTheme';
import NotificationSettings from './NotificationSettings';
import AddNotificationRow from './AddNotificationRow';
import OrganizerSelector from './OrganizerSelector';
import StatusVisibilitySelector from './StatusVisibilitySelector';

interface AdvancedOptionsProps {
  // Notification settings
  notificationMinutes: number;
  onNotificationMinutesChange: (minutes: number) => void;
  selectedTimeUnit?: string;
  onTimeUnitChange?: (unit: string) => void;
  onAddNotification?: () => void;

  // Organizer
  organizerName?: string;
  onOrganizerPress?: () => void;

  // Status and visibility
  selectedStatus?: string;
  selectedVisibility?: string;
  onStatusChange?: (value: string) => void;
  onVisibilityChange?: (value: string) => void;
}

const AdvancedOptions: React.FC<AdvancedOptionsProps> = ({
  notificationMinutes,
  onNotificationMinutesChange,
  selectedTimeUnit,
  onTimeUnitChange,
  onAddNotification,
  organizerName,
  onOrganizerPress,
  selectedStatus,
  selectedVisibility,
  onStatusChange,
  onVisibilityChange,
}) => {
  return (
    <View style={styles.container}>
      {/* Notification */}
      <NotificationSettings
        notificationMinutes={notificationMinutes}
        onNotificationMinutesChange={onNotificationMinutesChange}
        selectedTimeUnit={selectedTimeUnit}
        onTimeUnitChange={onTimeUnitChange}
      />

      {/* Add notification */}
      {/* <AddNotificationRow onAddNotification={onAddNotification} /> */}

      {/* Organizer/User */}
      {/* <OrganizerSelector
        organizerName={organizerName}
        onPress={onOrganizerPress}
      /> */}

      {/* Status/Visibility */}
      <StatusVisibilitySelector
        status={selectedStatus}
        visibility={selectedVisibility}
        onStatusChange={onStatusChange}
        onVisibilityChange={onVisibilityChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
});

export default AdvancedOptions;
