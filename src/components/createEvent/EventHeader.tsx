import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { moderateScale, scaleHeight, scaleWidth } from '../../utils/dimensions';
import { colors, fontSize, spacing } from '../../utils/LightTheme';

interface EventHeaderProps {
  onClose: () => void;
  selectedEventType: string;
  onEventTypePress: () => void;
}

const EventHeader: React.FC<EventHeaderProps> = ({
  onClose,
  selectedEventType,
  onEventTypePress,
}) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>

      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>Create </Text>
        <TouchableOpacity
          style={styles.eventTypeContainer}
          onPress={onEventTypePress}
        >
          <Text style={styles.eventTypeText}>{selectedEventType}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: scaleHeight(40),
    paddingBottom: spacing.lg,
    width: '100%',
    position: 'relative',
    paddingLeft: scaleWidth(10),
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.textSize25,
    color: colors.blackText,
    fontWeight: '600',
  },
  eventTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: scaleWidth(5),
  },
  eventTypeText: {
    fontSize: fontSize.textSize25,
    fontWeight: '600',
    marginRight: scaleWidth(8),
    color: colors.primaryGreen,
  },
  closeButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: fontSize.textSize17,
    color: colors.blackText,
    fontWeight: 'bold',
  },
});

export default EventHeader;




