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
  // Notify parent when any dropdown inside AdvancedOptions is about to open
  onAnyDropdownOpen?: () => void;
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
  onAnyDropdownOpen,
}) => {
  // Track child dropdown closers so we can ensure mutual exclusivity
  const closersRef = React.useRef<Record<string, () => void>>({});

  const registerCloser = React.useCallback(
    (key: string, closeFn: () => void) => {
      closersRef.current[key] = closeFn;
    },
    [],
  );

  // When a child dropdown opens, close all other registered dropdowns
  const handleChildDropdownOpen = React.useCallback(
    (sourceKey: string) => {
      // Close external dropdowns in parent screen
      onAnyDropdownOpen?.();
      // Close sibling dropdowns inside AdvancedOptions
      Object.entries(closersRef.current).forEach(([key, fn]) => {
        if (key !== sourceKey && typeof fn === 'function') {
          try {
            fn();
          } catch {}
        }
      });
    },
    [onAnyDropdownOpen],
  );
  return (
    <View style={styles.container}>
      {/* Notification */}
      <NotificationSettings
        notificationMinutes={notificationMinutes}
        onNotificationMinutesChange={onNotificationMinutesChange}
        selectedTimeUnit={selectedTimeUnit}
        onTimeUnitChange={onTimeUnitChange}
        onDropdownOpen={() => handleChildDropdownOpen('timeUnit')}
        registerCloser={fn => registerCloser('timeUnit', fn)}
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
        onAnyDropdownOpen={key => handleChildDropdownOpen(key)}
        registerCloser={(key, fn) => registerCloser(key, fn)}
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
