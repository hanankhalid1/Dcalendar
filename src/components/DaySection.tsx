import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { moderateScale, scaleHeight, scaleWidth } from '../utils/dimensions';
import {
  borderRadius,
  colors,
  fontSize,
  spacing
} from '../utils/LightTheme';
import EventCard from './EventCard';

interface CalendarEvent {
  id: string;
  eventId: string;
  title: string;
  time: string;
  date: string;
  userName: string;
  color: string;
  tags: Array<{
    id: string;
    label: string;
    icon: string;
    color: string;
    textColor?: string;
    iconColor?: string;
  }>;
}

interface DaySectionProps {
  day: string;
  date: string;
  month?: string;
  events: CalendarEvent[];
  onEditEvent: (event: CalendarEvent) => void;
}

const DaySection: React.FC<DaySectionProps> = ({
  day,
  date,
  month,
  events,
  onEditEvent
}) => {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const handleEventPress = (eventId: string) => {
    setExpandedEventId(eventId === expandedEventId ? null : eventId);
  };

  const hasExpandedEvent = events.length > 0 && expandedEventId !== null;
  const expandedEvent = events.find(event => event.id === expandedEventId);




  return (
    <View style={styles.container}>
      {events.length > 0 ? (
        // Show normal layout with date and events
        <View style={[styles.card, hasExpandedEvent && styles.cardExpanded]}>
          {/* Date Section */}
          <View
            style={[
              styles.dateSection,
              hasExpandedEvent && styles.dateSectionExpanded,
            ]}
          >
            {!hasExpandedEvent ? (
              <View>
                <Text style={styles.dayTextExpanded}>{day.toUpperCase()}</Text>
                <Text style={styles.dateTextExpanded}>{date}</Text>
              </View>
            ) : (
              <View style={styles.dateContainerExpanded}>
                <Text style={styles.dayTextExpanded}>{day}</Text>
                {month && <Text style={styles.monthTextExpanded}>{month}</Text>}
                <Text style={styles.dateTextExpanded}>{date}</Text>
              </View>
            )}
          </View>

          {/* Events Section */}
          <View style={styles.eventsSection}>
            {events.map((event, index) => (
              <Pressable
                key={index}
                onPress={() => handleEventPress(event.id)}
              >
                <EventCard
                  title={event.title}
                  eventId={event.id}         // ✅ Pass eventId
                  event={event}
                  time={event.time}
                  date={event.date}
                  color={event.color}
                  tags={event.tags}
                  compact={true}
                  onEdit={() => onEditEvent(event)}
                  isExpanded={expandedEventId === event.id}
                />
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        // Show empty state with full width
        <View style={styles.emptyCard}>
          <Text style={styles.emptyDateText}>
            {date} {month}, {day}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Existing styles
  container: {
    marginBottom: spacing.md,

    // width: scaleWidth(397),
  },
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#ACCFFF',
    padding: spacing.sm, // Reduced padding to give more space for content
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ACCFFF1A',
    width: '100%',
    maxWidth: scaleWidth(350),
    minHeight: scaleHeight(50), // Reduced min height
    alignSelf: 'center',
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm, // Reduced margin to give more space to events
    minWidth: scaleWidth(55), // Slightly reduced to give more space to events
    alignSelf: 'flex-start',
    flexShrink: 0, // Prevent date section from shrinking
  },
  dayText: {
    fontSize: fontSize.textSize16,
    fontWeight: '500',
    color: colors.textSecondary,
    marginRight: spacing.sm,
    textTransform: 'uppercase',
    paddingLeft: scaleWidth(8),
  },
  dateText: {
    fontSize: fontSize.textSize24,
    fontWeight: '500',
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  monthText: {
    fontSize: fontSize.textSize16,
    fontWeight: '500',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  eventsSection: {
    flex: 1,
    flexDirection: 'column',
    alignSelf: 'flex-start',
    minWidth: 0, // Allow events section to shrink
  },
  emptyCard: {
    backgroundColor: '#ACCFFF1A',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#ACCFFF',
    height: scaleHeight(66),
    width: '100%',
    maxWidth: scaleWidth(350),
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: scaleWidth(20),
    alignSelf: 'center',
  },
  emptyText: {
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    fontWeight: '500',
  },
  emptyDateText: {
    fontSize: fontSize.textSize18,
    color: colors.textPrimary,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // New styles for expanded state
  cardExpanded: {
    flexDirection: 'row', // Keep horizontal layout when expanded
    alignItems: 'flex-start',
  },
  dateSectionExpanded: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    // marginRight: spacing.lg,
  },
  dateContainerExpanded: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  monthTextExpanded: {
    fontSize: fontSize.textSize14,
    fontWeight: '500',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },

  // Expanded event styles
  expandedEventContainer: {
    backgroundColor: '#F6F7F9', // Same light beige background as collapsed state
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flex: 1,
    minHeight: scaleHeight(200),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)', // Same subtle border as collapsed state
  },
  expandedEventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  expandedEventTitleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  expandedColorIndicator: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    marginRight: spacing.sm,
    marginTop: spacing.xs,
  },
  expandedCloseButton: {
    padding: spacing.xs,
  },
  expandedEventTitle: {
    fontSize: fontSize.textSize20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
  },
  expandedEventTimeDate: {
    fontSize: fontSize.textSize16,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  expandedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  expandedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  expandedTagLabel: {
    fontSize: fontSize.textSize12,
    fontWeight: '500',
  },
  expandedTagIcon: {
    marginRight: spacing.xs,
  },
  expandedActionIcons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  expandedActionIcon: {
    width: moderateScale(32),
    height: moderateScale(32),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  expandedInviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    width: scaleWidth(200),
    height: scaleHeight(40),
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    alignSelf: 'center',
    gap: spacing.xs,
  },
  expandedInviteButtonText: {
    fontSize: fontSize.textSize14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  dayTextExpanded: {
    fontSize: fontSize.textSize16,
    fontWeight: '500',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  dateTextExpanded: {
    fontSize: fontSize.textSize24,
    fontWeight: '400',
    color: colors.blackText,
    marginTop: spacing.xs,
  },
});

export default DaySection;
