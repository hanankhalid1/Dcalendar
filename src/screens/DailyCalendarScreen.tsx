import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  InteractionManager,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import CustomDrawer from '../components/CustomDrawer';
import EventDetailsModal from '../components/EventDetailsModal';
import FloatingActionButton from '../components/FloatingActionButton';
import WeekHeader from '../components/WeekHeader';
import { useApiClient } from '../hooks/useApi';
import { Screen } from '../navigations/appNavigation.type';
import { useActiveAccount } from '../stores/useActiveAccount';
import { useEventsStore } from '../stores/useEventsStore';
import { parseTimeToPST, isEventInPast } from '../utils';
import { expandEventsForRange, formatYMD } from '../utils/recurrence';
import { useCalendarStore } from '../stores/useCalendarStore';
import CustomAlert from '../components/CustomAlert';
import {
  colors,
  spacing,
  fontSize,
  shadows,
  borderRadius,
} from '../utils/LightTheme';
import { moderateScale, scaleHeight, scaleWidth } from '../utils/dimensions';
import { Fonts } from '../constants/Fonts';
import ClockIcon from '../assets/svgs/clock.svg';
import EventIcon from '../assets/svgs/eventIcon.svg';
import TaskIcon from '../assets/svgs/taskIcon.svg';
import { useSettingsStore } from '../stores/useSetting';
import EventCard from '../components/EventCard';

const DailyCalendarScreen = () => {
  const navigation = useNavigation();
  const { userEvents, userEventsLoading, getUserEvents } = useEventsStore();
  const { selectedDate, setSelectedDate } = useCalendarStore();
  const { currentMonth, setCurrentMonthByIndex } = useCalendarStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isEventModalVisible, setIsEventModalVisible] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [showEventsList, setShowEventsList] = useState(false);
  const { account } = useActiveAccount();
  const { api } = useApiClient();
  const { selectedTimeZone } = useSettingsStore();

  // Custom Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'warning',
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  // Format date for display
  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Get events for selected date
  const selectedDateString = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [selectedDate]);

  // Group events by date (using expanded instances, same logic as Monthly)
  const { eventsByDate } = useMemo(() => {
    const grouped: { [key: string]: any[] } = {};
    const viewStart = new Date(selectedDate);
    viewStart.setHours(0, 0, 0, 0);
    const viewEnd = new Date(selectedDate);
    viewEnd.setHours(23, 59, 59, 999);

    const expanded = expandEventsForRange(
      userEvents || [],
      viewStart,
      viewEnd,
      selectedTimeZone,
    );
    expanded.forEach(ev => {
      const key =
        ev.instanceDate ||
        formatYMD(parseTimeToPST(ev.fromTime) || new Date(ev.fromTime));
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(ev);
    });

    return { eventsByDate: grouped };
  }, [userEvents, selectedDate, selectedTimeZone]);

  // Get events for selected date and sort by time
  const selectedDateEvents = useMemo(() => {
    const events = eventsByDate[selectedDateString] || [];
    return events.sort((a, b) => {
      const timeA = parseTimeToPST(a.fromTime);
      const timeB = parseTimeToPST(b.fromTime);
      if (!timeA || !timeB) return 0;
      return timeA.getTime() - timeB.getTime();
    });
  }, [eventsByDate, selectedDateString]);

  // Calculate duration
  const calculateDuration = (fromTime: string, toTime: string) => {
    const from = parseTimeToPST(fromTime);
    const to = parseTimeToPST(toTime);
    if (!from || !to) return '0h';

    const diffMs = to.getTime() - from.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return diffMinutes > 0
        ? `${diffHours}h ${diffMinutes}m`
        : `${diffHours}h`;
    }
    return `${diffMinutes}m`;
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = parseTimeToPST(dateString);
    if (!date) return 'Invalid Time';

    return date
      .toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      .toLowerCase()
      .replace(' ', '');
  };

  // Extract guests from event
  const getEventGuests = (
    event: any,
  ): Array<{ email: string; avatar?: string }> => {
    if (!event) return [];
    const guests: Array<{ email: string; avatar?: string }> = [];

    if (event.guests && Array.isArray(event.guests)) {
      event.guests.forEach((g: any) => {
        if (typeof g === 'string') {
          guests.push({ email: g });
        } else if (g && typeof g === 'object' && g.email) {
          guests.push({
            email: g.email,
            avatar: g.avatar || g.picture || g.profilePicture,
          });
        }
      });
    }

    if (event.list && Array.isArray(event.list)) {
      const guestItems = event.list.filter(
        (item: any) => item && item.key === 'guest',
      );
      guestItems.forEach((item: any) => {
        if (typeof item.value === 'string') {
          guests.push({ email: item.value });
        } else if (item.value && typeof item.value === 'object') {
          guests.push({
            email: item.value.email || item.value,
            avatar:
              item.value.avatar ||
              item.value.picture ||
              item.value.profilePicture,
          });
        }
      });
    }

    return guests.filter((g: any) => g && g.email);
  };

  // Generate initials from email
  const getGuestInitials = (email: string): string => {
    if (!email) return '?';
    const parts = email.split('@')[0].split(/[._-]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.charAt(0).toUpperCase();
  };

  // Generate background color based on email
  const getGuestBackgroundColor = (email: string): string[] => {
    const colorOptions = [
      ['#FF6B6B', '#FF8E8E'],
      ['#4ECDC4', '#6EDDD6'],
      ['#45B7D1', '#6BC5D8'],
      ['#FFA07A', '#FFB89A'],
      ['#98D8C8', '#B0E4D4'],
      ['#F7DC6F', '#F9E68A'],
      ['#BB8FCE', '#C9A5D9'],
      ['#85C1E2', '#9DCFE8'],
    ];
    const index = email.charCodeAt(0) % colorOptions.length;
    return colorOptions[index];
  };

  // Get recurrence info
  const getRecurrenceDayText = (event: any) => {
    if (!event.list || !Array.isArray(event.list)) return '';
    const repeatOn = event.list.find((item: any) => item.key === 'repeatOn');
    if (repeatOn && repeatOn.value) {
      return repeatOn.value;
    }
    return '';
  };

  // Get progress percentage
  const getProgress = (event: any): number => {
    if (!event.list || !Array.isArray(event.list)) return 0;
    const progressItem = event.list.find(
      (item: any) =>
        item && (item.key === 'progress' || item.key === 'completion'),
    );
    if (progressItem && typeof progressItem.value === 'number') {
      return Math.min(100, Math.max(0, progressItem.value));
    }
    return 0;
  };

  // Check if event is a task
  const isTask = (event: any) => {
    return event.list?.some((item: any) => item.key === 'task') || false;
  };

  // Defer rendering of events list to after navigation frame
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setShowEventsList(true);
    });
    return () => task.cancel();
  }, [selectedDateString]);

  useEffect(() => {
    if (account && account[3]) {
      getUserEvents(account[3], api).catch((error: any) => {
        console.error('Error fetching events:', error);
      });
    }
  }, [account]);

  const handleMenuPress = () => setIsDrawerOpen(true);
  const handleDrawerClose = () => setIsDrawerOpen(false);
  const handleEventPress = (event: any) => {
    setSelectedEvent(event);
    setIsEventModalVisible(true);
  };

  const handleCloseEventModal = () => {
    setIsEventModalVisible(false);
    setSelectedEvent(null);
  };

  const handleEditEvent = (event: any) => {
    handleCloseEventModal();

    const eventToPass = event.originalRawEventData || event;
    const list =
      eventToPass.list || eventToPass.tags || event.list || event.tags || [];
    const isTaskEvent = list.some((item: any) => item.key === 'task');

    if (isEventInPast(eventToPass)) {
      showAlert(
        isTaskEvent ? 'Cannot edit past Task' : 'Cannot edit past Event',
        '',
        'warning',
      );
      return;
    }

    const targetScreen = isTaskEvent
      ? Screen.CreateTaskScreen
      : Screen.CreateEventScreen;

    (navigation as any).navigate(targetScreen, {
      mode: 'edit',
      eventData: eventToPass,
    });
  };

  const handleDeleteEvent = (event: any) => {
    handleCloseEventModal();
    // Delete functionality handled by EventDetailsModal
  };

  const handleDatePress = () => {
    setIsDatePickerVisible(true);
  };

  const handleCalendarPress = () => {
    // TODO: Navigate to monthly calendar or show calendar picker
  };

  const handleMonthPress = () => {
    // Handle month press for WeekHeader
  };

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentMonthByIndex(monthIndex);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const formatDateForHeader = (date: Date) => {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Transform events for EventCard component
  const transformEventForCard = (event: any) => {
    const startTime = parseTimeToPST(event.fromTime);
    const endTime = parseTimeToPST(event.toTime);
    const duration = calculateDuration(event.fromTime, event.toTime);
    const startTimeStr =
      startTime
        ?.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
        .toLowerCase()
        .replace(' ', '') || '';
    const endTimeStr =
      endTime
        ?.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
        .toLowerCase()
        .replace(' ', '') || '';
    const timeRange = `${startTimeStr}-${endTimeStr}`;
    const timeDisplay = `${duration} (${timeRange})`;

    const isTaskEvent = isTask(event);
    const eventColor = isTaskEvent ? '#8DC63F' : '#00AEEF';

    return {
      id: event.uid,
      eventId: event.uid,
      title: event.title,
      time: timeDisplay,
      date: formatDateDisplay(selectedDate),
      userName: account?.userName || account?.username || '',
      color: eventColor,
      tags: event.list || [],
      originalRawEventData: event,
    };
  };

  return (
    <View style={styles.container}>
      <WeekHeader
        onMenuPress={handleMenuPress}
        currentMonth={formatDateForHeader(selectedDate)}
        onMonthPress={handleMonthPress}
        onMonthSelect={handleMonthSelect}
        onDateSelect={handleDateSelect}
        currentDate={selectedDate}
        selectedDate={selectedDate}
      />

      {/* Today's Schedule Section */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Today's schedule</Text>

        {showEventsList ? (
          selectedDateEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No events scheduled for today
              </Text>
            </View>
          ) : (
            (() => {
              // Group events by time (hour) for display
              const groupedByTime: { [key: string]: any[] } = {};
              selectedDateEvents.forEach(event => {
                const startTime = parseTimeToPST(event.fromTime);
                const timeLabel =
                  startTime
                    ?.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })
                    .toLowerCase()
                    .replace(' ', '') || '';

                if (!groupedByTime[timeLabel]) {
                  groupedByTime[timeLabel] = [];
                }
                groupedByTime[timeLabel].push(event);
              });

              return Object.entries(groupedByTime).map(
                ([timeLabel, events]) => (
                  <View key={timeLabel} style={styles.timeGroup}>
                    <View style={styles.timeHeader}>
                      <Text style={styles.timeLabelText} numberOfLines={1}>
                        {timeLabel}
                      </Text>
                      <View style={styles.timeDivider} />
                    </View>
                    {events.map((event, index) => {
                      const duration = calculateDuration(
                        event.fromTime,
                        event.toTime,
                      );
                      const startTimeStr = formatTime(event.fromTime);
                      const endTimeStr = formatTime(event.toTime);
                      const timeRange = `${startTimeStr}-${endTimeStr}`;
                      const timeDisplay = `${duration} (${timeRange})`;

                      const isTaskEvent = isTask(event);

                      return (
                        <View
                          key={`${event.uid}-${index}`}
                          style={styles.eventCardWrapper}
                        >
                          <EventCard
                            title={event.title}
                            eventId={event.uid}
                            event={transformEventForCard(event)}
                            time={timeDisplay}
                            date={formatDateDisplay(selectedDate)}
                            color={isTaskEvent ? '#8DC63F' : '#00AEEF'}
                            tags={event.list || []}
                            compact={true}
                            onEdit={() => handleEditEvent(event)}
                          />
                        </View>
                      );
                    })}
                  </View>
                ),
              );
            })()
          )
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Loading...</Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FloatingActionButton
        onOptionSelect={option => {
          switch (option) {
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

      {/* Custom Drawer */}
      <CustomDrawer isOpen={isDrawerOpen} onClose={handleDrawerClose} />

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type="warning"
        onClose={() => setAlertVisible(false)}
      />

      <CustomDrawer isOpen={isDrawerOpen} onClose={handleDrawerClose} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scaleWidth(20),
    paddingTop: scaleHeight(20),
    paddingBottom: scaleHeight(100),
  },
  sectionTitle: {
    fontSize: fontSize.textSize18,
    fontFamily: Fonts.latoBold,
    color: '#000',
    marginBottom: scaleHeight(20),
  },
  timeGroup: {
    marginBottom: scaleHeight(16),
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(12),
  },
  timeLabelText: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.latoBold,
    color: '#000',
    marginRight: scaleWidth(12),
  },
  timeDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  eventCardWrapper: {
    marginBottom: scaleHeight(12),
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleHeight(40),
  },
  emptyText: {
    fontSize: fontSize.textSize14,
    fontFamily: Fonts.latoRegular,
    color: '#717680',
  },
});

export default DailyCalendarScreen;
