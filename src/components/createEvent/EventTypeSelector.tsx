import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { moderateScale, scaleHeight, scaleWidth } from '../../utils/dimensions';
import { colors, fontSize, spacing } from '../../utils/LightTheme';

interface EventType {
  id: string;
  name: string;
  icon: string;
}

interface EventTypeSelectorProps {
  isVisible: boolean;
  eventTypes: EventType[];
  selectedEventType: string;
  onEventTypeSelect: (eventType: string) => void;
  onClose: () => void;
}

const EventTypeSelector: React.FC<EventTypeSelectorProps> = ({
  isVisible,
  eventTypes,
  selectedEventType,
  onEventTypeSelect,
  onClose,
}) => {
  if (!isVisible) return null;

  return (
    <View style={styles.eventTypeDropdown}>
      {eventTypes.map(eventType => (
        <TouchableOpacity
          key={eventType.id}
          style={styles.eventTypeItem}
          onPress={() => onEventTypeSelect(eventType.name)}
        >
          <Text style={styles.eventTypeItemText}>{eventType.name}</Text>
          {selectedEventType === eventType.name && (
            <LinearGradient
              colors={['#18F06E', '#0B6DE0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.eventTypeCheckmark}
            >
              <FeatherIcon name="check" size={12} color="white" />
            </LinearGradient>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  eventTypeDropdown: {
    position: 'absolute',
    top: scaleHeight(100),
    left: scaleWidth(166),
    width: scaleWidth(138),
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F5F5F5',
    shadowColor: '#0A0D12',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 1000,
    paddingVertical: scaleHeight(8),
  },
  eventTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    minHeight: scaleHeight(44),
  },
  eventTypeItemText: {
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    fontWeight: '400',
    flex: 1,
  },
  eventTypeCheckmark: {
    width: scaleWidth(16),
    height: scaleHeight(16),
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EventTypeSelector;




