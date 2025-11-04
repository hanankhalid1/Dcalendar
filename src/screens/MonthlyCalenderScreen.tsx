import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Text, Alert, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../navigations/appNavigation.type';
import FloatingActionButton from '../components/FloatingActionButton';
import WeekHeader from '../components/WeekHeader';
import CustomDrawer from '../components/CustomDrawer';
import { useActiveAccount } from '../stores/useActiveAccount';
import { useEventsStore } from '../stores/useEventsStore';
import { parseTimeToPST } from '../utils';
import { useCalendarStore } from '../stores/useCalendarStore';
import EventDetailsModal from '../components/EventDetailsModal';
import { colors } from '../utils/LightTheme';
import { BlockchainService } from '../services/BlockChainService';
import { useToken } from '../stores/useTokenStore';
import { NECJSPRIVATE_KEY } from '../constants/Config';
import { useApiClient } from '../hooks/useApi';

interface MonthlyCalendarProps {
  onDateSelect?: (date: string) => void;
  onEventPress?: (event: any) => void;
  onFABOptionSelect?: (option: string) => void;
  onMenuPress?: () => void;
  onMonthPress?: () => void;
}

const MonthlyCalenderScreen: React.FC<MonthlyCalendarProps> = ({
  onEventPress,
  onFABOptionSelect,
  onMenuPress,
  onMonthPress,
}) => {
  const navigation = useNavigation();
  const { currentMonth, setCurrentMonthByIndex } = useCalendarStore();
  const { account } = useActiveAccount();
  const { userEvents, userEventsLoading, getUserEvents } = useEventsStore();
  const { selectedDate, setSelectedDate } = useCalendarStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isEventModalVisible, setIsEventModalVisible] = useState(false);
  const blockchainService = new BlockchainService(NECJSPRIVATE_KEY);
  const token = useToken(state => state.token);
  const { api } = useApiClient();
  const [isDeleting, setIsDeleting] = useState(false);

  // Format date to YYYY-MM-DD for react-native-calendars
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const selectedDateString = useMemo(() => formatDate(selectedDate), [selectedDate]);

  // Process events and create marked dates with periods for multi-day events
  const { markedDates, eventsByDate } = useMemo(() => {
    const marked: any = {};
    const byDate: { [key: string]: any[] } = {};

    (userEvents || []).forEach(ev => {
      const startDate = parseTimeToPST(ev.fromTime);
      const endDate = parseTimeToPST(ev.toTime);

      if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.log('Skipping invalid event:', ev);
        return;
      }

      const isTask = ev.list?.some((item: any) => item.key === 'task' && item.value === 'true');
      const isRecurring = ev.list?.some((item: any) => item.key === 'repeatEvent');
      const isMultiDay = startDate.toDateString() !== endDate.toDateString();

      // Determine color based on event type
      const eventColor = isTask ? '#9976FF4D' : '#337E894D';

      if (isMultiDay) {
        // Create period marking for multi-day events
        const currentDate = new Date(startDate);
        currentDate.setHours(0, 0, 0, 0);
        const endDateOnly = new Date(endDate);
        endDateOnly.setHours(0, 0, 0, 0);

        while (currentDate <= endDateOnly) {
          const dateString = formatDate(currentDate);
          const isStart = currentDate.toDateString() === startDate.toDateString();
          const isEnd = currentDate.toDateString() === endDate.toDateString();

          if (!marked[dateString]) {
            marked[dateString] = { periods: [] };
          }
          if (!marked[dateString].periods) {
            marked[dateString].periods = [];
          }

          marked[dateString].periods.push({
            startingDay: isStart,
            endingDay: isEnd,
            color: eventColor, // Add transparency
            textColor: '#000000',
          });

          // Store event for this date
          if (!byDate[dateString]) {
            byDate[dateString] = [];
          }
          byDate[dateString].push({
            ...ev,
            isTask,
            isRecurring,
            isMultiDay,
            color: eventColor,
          });

          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else {
        // Single day event - use dot marker
        const dateString = formatDate(startDate);

        if (!marked[dateString]) {
          marked[dateString] = { dots: [] };
        }
        if (!marked[dateString].dots) {
          marked[dateString].dots = [];
        }

        marked[dateString].dots.push({
          color: eventColor,
          selectedDotColor: eventColor,
        });

        // Store event for this date
        if (!byDate[dateString]) {
          byDate[dateString] = [];
        }
        byDate[dateString].push({
          ...ev,
          isTask,
          isRecurring,
          isMultiDay: false,
          color: eventColor,
        });
      }
    });

    // Add selected state to the selected date
    if (marked[selectedDateString]) {
      marked[selectedDateString].selected = true;
      marked[selectedDateString].selectedColor = colors.figmaLightBlue || '#2196F3';
    } else {
      marked[selectedDateString] = {
        selected: true,
        selectedColor: colors.figmaLightBlue || '#2196F3',
      };
    }

    return { markedDates: marked, eventsByDate: byDate };
  }, [userEvents, selectedDateString]);

  const handleMenuPress = () => {
    setIsDrawerOpen(true);
  };

  const handleMonthPress = () => {
    console.log('Month selector pressed');
  };

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentMonthByIndex(monthIndex);
    const newDate = new Date(selectedDate.getFullYear(), monthIndex, 1);
    setSelectedDate(newDate);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setCurrentMonthByIndex(date.getMonth());
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  const handleDayPress = (day: any) => {
    const newDate = new Date(day.timestamp);
    setSelectedDate(newDate);
    setCurrentMonthByIndex(newDate.getMonth());
  };

  const handleMonthChange = (month: any) => {
    const newDate = new Date(month.timestamp);
    setCurrentMonthByIndex(newDate.getMonth());
  };

  const handleEventPress = (event: any) => {
    console.log('Event pressed:', event);
    setSelectedEvent(event);
    setIsEventModalVisible(true);
  };

  const handleCloseEventModal = () => {
    setIsEventModalVisible(false);
    setSelectedEvent(null);
  };

  const handleEditEvent = (event: any) => {
    handleCloseEventModal();
    (navigation as any).navigate(Screen.CreateEventScreen, {
      mode: 'edit',
      eventData: event,
    });
  };

  const handleDeleteEvent = async (event: any) => {
    try {
      if (!account) {
        console.log('Error', 'No active account found. Please log in again.');
        return false;
      }

      // Close modal first
      handleCloseEventModal();

      setIsDeleting(true);
      await blockchainService.deleteEventSoft(event.uid, account, token, api);
      await getUserEvents(account.userName, api);
    } catch (err) {
      console.error("Delete Event Failed:", err);
      Alert.alert("Error", "Failed to move the event to the trash");
    }
    finally {
      setIsDeleting(false);
    }
  };
  // Get events for selected date
  const selectedDateEvents = eventsByDate[selectedDateString] || [];

  return (
    <View style={styles.container}>
      <EventDetailsModal
        visible={isEventModalVisible}
        onClose={handleCloseEventModal}
        event={selectedEvent}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />

      <WeekHeader
        onMenuPress={handleMenuPress}
        currentMonth={currentMonth}
        onMonthPress={handleMonthPress}
        onMonthSelect={handleMonthSelect}
        onDateSelect={handleDateSelect}
        currentDate={selectedDate}
        selectedDate={selectedDate}
      />

      <Calendar
        current={selectedDateString}
        markedDates={markedDates}
        markingType="multi-dot"  // Change from "multi-period" to "multi-dot"
        onDayPress={handleDayPress}
        onMonthChange={handleMonthChange}
        firstDay={1} // Start week on Monday
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#b6c1cd',
          selectedDayBackgroundColor: colors.figmaLightBlue || '#2196F3',
          selectedDayTextColor: '#ffffff',
          todayTextColor: colors.figmaLightBlue || '#2196F3',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: '#337E89',
          selectedDotColor: '#ffffff',
          arrowColor: colors.figmaLightBlue || '#2196F3',
          monthTextColor: '#2d4150',
          textDayFontFamily: 'DM Sans',
          textMonthFontFamily: 'DM Sans',
          textDayHeaderFontFamily: 'DM Sans',
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 12,
        }}
      />

      {/* Events list for selected date */}
      <View style={styles.eventsContainer}>
        <Text style={styles.eventsTitle}>
          Events on {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </Text>
        <ScrollView style={styles.eventsList}>
          {selectedDateEvents.length > 0 ? (
            selectedDateEvents.map((event, index) => (
              <TouchableOpacity
                key={`${event.uid}-${index}`}
                style={[
                  styles.eventItem,
                  {
                    borderLeftColor: event.color,
                    borderLeftWidth: 4,
                  },
                ]}
                onPress={() => handleEventPress(event)}
              >
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle} numberOfLines={1}>
                    {event.title}
                  </Text>
                  <Text style={styles.eventTime}>
                    {parseTimeToPST(event.fromTime)?.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                    {' - '}
                    {parseTimeToPST(event.toTime)?.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                  <View style={styles.eventBadges}>
                    {event.isTask && (
                      <View style={[styles.badge, {
                        backgroundColor: event.isTask ? '#9976FF1A' : '#337E891A'
                      }]}>
                        <Text style={[styles.badgeText, {
                          color: event.isTask ? colors.figmaPurple : '#337E89'
                        }]}>Task</Text>
                      </View>
                    )}
                    {event.isRecurring && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>Recurring</Text>
                      </View>
                    )}
                    {event.isMultiDay && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>Multi-day</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noEventsText}>No events for this date</Text>
          )}
        </ScrollView>
      </View>

      {(userEventsLoading || isDeleting) && (
        <View style={[styles.loadingContainer, { pointerEvents: 'box-none' }]}>
          <ActivityIndicator size="large" color={colors.figmaLightBlue || '#2196F3'} />
          <Text style={styles.loadingText}>
            {isDeleting ? 'Deleting Event...' : 'Loading…'}
          </Text>
        </View>
      )}

      <FloatingActionButton
        onOptionSelect={option => {
          console.log('Selected option:', option);
          switch (option) {
            case 'goal':
              console.log('Create Goal');
              break;
            case 'reminder':
              navigation.navigate(Screen.RemindersScreen as never);
              break;
            case 'task':
              navigation.navigate(Screen.CreateTaskScreen as never);
              break;
            case 'event':
              navigation.navigate(Screen.CreateEventScreen as never);
              break;
            default:
              break;
          }
        }}
      />

      <CustomDrawer isOpen={isDrawerOpen} onClose={handleDrawerClose} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  eventsContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  eventsTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'DM Sans',
    marginBottom: 12,
    color: '#2d4150',
  },
  eventsList: {
    flex: 1,
  },
  eventItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventContent: {
    marginLeft: 8,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'DM Sans',
    color: '#2d4150',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 12,
    fontFamily: 'DM Sans',
    color: '#666',
    marginBottom: 6,
  },
  eventBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'DM Sans',
    color: '#1976d2',
    fontWeight: '500',
  },
  noEventsText: {
    fontSize: 14,
    fontFamily: 'DM Sans',
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
});

export default MonthlyCalenderScreen;