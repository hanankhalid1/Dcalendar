import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  Alert,
  FlatList,
  InteractionManager,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AppNavigationProp, Screen } from '../navigations/appNavigation.type';
import { useCalendarStore } from '../stores/useCalendarStore';
import {
  moderateScale,
  scaledSize,
  scaleHeight,
  scaleWidth,
  screenHeight,
  screenWidth,
} from '../utils/dimensions';
import {
  colors,
  fontSize,
  spacing,
  borderRadius,
  shadows,
} from '../utils/LightTheme';

import RNFS from 'react-native-fs';
import Share from 'react-native-share';

// Import components
import DaySection from '../components/DaySection';
import FloatingActionButton from '../components/FloatingActionButton';
import EventCard from '../components/EventCard';
import CustomDrawer from '../components/CustomDrawer';
import { useToken } from '../stores/useTokenStore';
import { BlockchainService } from '../services/BlockChainService';
import { useActiveAccount } from '../stores/useActiveAccount';
import CustomLoader from '../global/CustomLoader';
import WeekHeader from '../components/WeekHeader';
import { useEventsStore } from '../stores/useEventsStore';
import { useApiClient } from '../hooks/useApi';
import { parseTimeToPST, isEventInPast } from '../utils';
import { expandEventsForRange } from '../utils/recurrence';
import { convertToSelectedTimezone } from '../utils/timezone';
import { useSettingsStore } from '../stores/useSetting';
import { s } from 'react-native-size-matters';
import CustomAlert from '../components/CustomAlert';
import { Fonts } from '../constants/Fonts';
import CalendarIcon from '../assets/svgs/calendar.svg';
import TaskCompleteIcon from '../assets/svgs/taskComplete.svg';

const isTablet = screenWidth >= 600;
const getTabletSafeDimension = (
  mobileValue: number,
  tabletValue: number,
  maxValue: number,
) => {
  if (isTablet) {
    return Math.min(tabletValue, maxValue);
  }
  return mobileValue;
};

const ScheduleScreen = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const { setCurrentMonthByIndex } = useCalendarStore();
  const { selectedTimeZone } = useSettingsStore();
  // const [currentView, setCurrentView] = useState('Week');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { api } = useApiClient();
  const { getUserEvents, events: allEvents, userEvents } = useEventsStore();
  const account = useActiveAccount(state => state.account);
  const userName = account?.username || '';
  const [exitModal, setExitModal] = useState(false);
  const [navigationAction, setNavigationAction] = useState(null);

  // Custom Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<
    'success' | 'error' | 'warning' | 'info'
  >('error');

  // Helper function to show custom alert
  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'error',
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  const handleEditEvent = (event: any) => {
    console.log('Edit event Uid in home:', event);

    // 1. Extract the raw data. This contains the original fromTime and toTime strings.
    const eventToPass = event.originalRawEventData || event;

    // Check if it's a task first (needed for conditional alert message)
    const list =
      eventToPass.list || eventToPass.tags || event.list || event.tags || [];
    const isTask = list.some((item: any) => item.key === 'task');

    // Check if event is in the past
    if (isEventInPast(eventToPass)) {
      showAlert(
        isTask ? 'Cannot edit past Task' : 'Cannot edit past Event',
        '',
        'warning',
      );
      return;
    }

    console.log('Is Task check:', { isTask, list, eventToPass, event });

    // 2. Determine the target screen
    const targetScreen = isTask
      ? Screen.CreateTaskScreen
      : Screen.CreateEventScreen;

    // 3. Navigate to the appropriate screen
    (navigation as any).navigate(targetScreen, {
      mode: 'edit', // Pass the mode for editing
      eventData: eventToPass, // ✅ Pass the full, raw event object
    });
  };

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [currentMonth, setCurrentMonth] = useState<string>('');
  const [currentView, setCurrentView] = useState<'Day' | 'Week' | 'Month'>(
    'Week',
  );
  type EventFilter = 'All' | 'EventsOnly' | 'TasksOnly';
  const [filterType, setFilterType] = useState<EventFilter>('All');
  const [selectedTab, setSelectedTab] = useState<
    'All' | 'Upcoming' | 'Completed'
  >('All');

  // Memoize expanded recurring events separately with reduced range
  const expandedRecurringEvents = useMemo(() => {
    if (!userEvents || userEvents.length === 0) return [];
    const today = new Date();
    const viewStart = new Date(today);
    viewStart.setDate(viewStart.getDate() - 30);
    viewStart.setHours(0, 0, 0, 0);
    const viewEnd = new Date(today);
    viewEnd.setDate(viewEnd.getDate() + 30); // Reduced from 120 to 30 days
    viewEnd.setHours(23, 59, 59, 999);
    return expandEventsForRange(
      userEvents,
      viewStart,
      viewEnd,
      selectedTimeZone,
    );
  }, [userEvents, selectedTimeZone]);

  const transformEventsToCalendar = (
    allEvents: any[],
    selectedTimeZone: string,
  ) => {
    const groupedEvents: Record<string, any[]> = {};

    allEvents.forEach(event => {
      if (!event.fromTime) {
        return;
      }

      const fromTimeOnly = event.fromTime.split('T')[1];
      const toTimeOnly = event.toTime?.split('T')[1];

      const isAllDay =
        fromTimeOnly?.startsWith('000000') && toTimeOnly?.startsWith('000000');

      const parseAllDayDate = (dateStr: string) => {
        const year = parseInt(dateStr.substring(0, 4), 10);
        const month = parseInt(dateStr.substring(4, 6), 10) - 1;
        const day = parseInt(dateStr.substring(6, 8), 10);
        return new Date(year, month, day);
      };

      // Parse times directly from the string format to avoid timezone conversion issues
      const parseTimeFromString = (dateStr: string): Date | null => {
        if (!dateStr) return null;
        // Format: YYYYMMDDTHHmmss
        const match = dateStr.match(
          /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?$/,
        );
        if (!match) return null;

        const [, year, month, day, hour, minute, second] = match;
        return new Date(
          Number(year),
          Number(month) - 1, // JS months are 0-indexed
          Number(day),
          Number(hour),
          Number(minute),
          Number(second) || 0,
        );
      };

      let startTimeData, endTimeData;
      let eventDateKey: string;

      if (isAllDay) {
        const startDate = parseAllDayDate(event.fromTime);
        eventDateKey = startDate.toDateString();
        startTimeData = { displayValues: null };
        endTimeData = { displayValues: null };
      } else {
        // Parse times directly from the string format to avoid timezone conversion issues
        const startTimeDate = parseTimeFromString(event.fromTime);
        const endTimeDate = event.toTime
          ? parseTimeFromString(event.toTime)
          : null;

        if (!startTimeDate || isNaN(startTimeDate.getTime())) {
          return;
        }

        // Extract date components for grouping
        const year = startTimeDate.getFullYear();
        const month = startTimeDate.getMonth() + 1; // getMonth() returns 0-11
        const day = startTimeDate.getDate();
        eventDateKey = `${year}-${String(month).padStart(2, '0')}-${String(
          day,
        ).padStart(2, '0')}`;

        // Create display values object for time formatting
        startTimeData = {
          date: startTimeDate, // Store the Date object for sorting
          displayValues: {
            year: year,
            month: month,
            day: day,
            hour: startTimeDate.getHours(),
            minute: startTimeDate.getMinutes(),
            second: startTimeDate.getSeconds(),
          },
        };
        endTimeData =
          endTimeDate && !isNaN(endTimeDate.getTime())
            ? {
                date: endTimeDate, // Store the Date object for sorting
                displayValues: {
                  year: endTimeDate.getFullYear(),
                  month: endTimeDate.getMonth() + 1,
                  day: endTimeDate.getDate(),
                  hour: endTimeDate.getHours(),
                  minute: endTimeDate.getMinutes(),
                  second: endTimeDate.getSeconds(),
                },
              }
            : null;
      }

      const isTask = (event.list || []).some(
        (item: any) => item.key === 'task',
      );
      const eventColor = isTask ? colors.figmaPurple : colors.figmaOrange;

      // Format time for display
      const formatTime12Hour = (hour: number, minute: number) => {
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${String(minute).padStart(2, '0')} ${ampm}`;
      };

      let eventTime: string = '';
      if (isAllDay) {
        eventTime = 'All Day';
      } else if (isTask && startTimeData?.displayValues) {
        eventTime = formatTime12Hour(
          startTimeData.displayValues.hour,
          startTimeData.displayValues.minute,
        );
      } else if (startTimeData?.displayValues) {
        const startTime = formatTime12Hour(
          startTimeData.displayValues.hour,
          startTimeData.displayValues.minute,
        );
        const endTime = endTimeData?.displayValues
          ? formatTime12Hour(
              endTimeData.displayValues.hour,
              endTimeData.displayValues.minute,
            )
          : '';
        eventTime = `${startTime} - ${endTime}`;
      } else {
        // Fallback if time data is missing
        eventTime = 'Time not available';
      }

      // Handle multi-day events - add event to all dates it spans
      if (!isAllDay && startTimeData?.date && endTimeData?.date) {
        const startDate = new Date(startTimeData.date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(endTimeData.date);
        endDate.setHours(0, 0, 0, 0);

        const isMultiDay = startDate.getTime() !== endDate.getTime();

        if (isMultiDay) {
          // Add event to all dates in the range
          const currentDate = new Date(startDate);
          while (currentDate <= endDate) {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            const day = currentDate.getDate();
            const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(
              day,
            ).padStart(2, '0')}`;

            if (!groupedEvents[dateKey]) {
              groupedEvents[dateKey] = [];
            }

            groupedEvents[dateKey].push({
              id: event.uid,
              title: event.title || 'Untitled Event',
              time: eventTime,
              description: event.description || '',
              date: dateKey,
              color: eventColor,
              tags: event.list || [],
              isExpandable: true,
              hasActions: true,
              originalRawEventData: event,
              sortDate: startTimeData?.date || parseAllDayDate(event.fromTime),
              isMultiDay: true,
            });

            currentDate.setDate(currentDate.getDate() + 1);
          }
          return; // Skip the regular single-date add below
        }
      }

      // Single day event
      if (!groupedEvents[eventDateKey]) {
        groupedEvents[eventDateKey] = [];
      }

      groupedEvents[eventDateKey].push({
        id: event.uid,
        title: event.title || 'Untitled Event',
        time: eventTime,
        description: event.description || '',
        date: eventDateKey,
        color: eventColor,
        tags: event.list || [],
        isExpandable: true,
        hasActions: true,
        originalRawEventData: event,
        // Store the UTC date for sorting
        sortDate: startTimeData?.date || parseAllDayDate(event.fromTime),
        isMultiDay: false,
      });
    });

    return Object.keys(groupedEvents)
      .sort()
      .map(dateKey => {
        const dateObj = new Date(dateKey);
        const weekday = dateObj
          .toLocaleDateString('en-US', { weekday: 'short' })
          .toUpperCase();
        const day = dateObj.getDate().toString().padStart(2, '0');
        const month = dateObj
          .toLocaleDateString('en-US', { month: 'short' })
          .toUpperCase();

        return {
          day: weekday,
          date: day,
          month: month,
          events: groupedEvents[dateKey].sort(
            (a, b) => a.sortDate.getTime() - b.sortDate.getTime(),
          ),
        };
      });
  };
  // useEffect(() => {
  //         console.log('Selected Timezone in HomeScreen:', selectedTimeZone);
  //         const transformedData = transformEventsToCalendar(allEvents, selectedTimeZone);
  //         const filteredData = filterEventsByView(transformedData, currentView);
  //         console.log('Filtered Events:', filteredData);
  //         setEvents(filteredData);
  //     }, [selectedTimeZone]);
  const filterEventsByTaskType = (allEvents: any[], filter: EventFilter) => {
    if (filter === 'All') {
      return allEvents;
    }

    const result: any[] = [];
    for (const dayGroup of allEvents) {
      const filteredEvents = dayGroup.events.filter((event: any) => {
        const isTask = (event.tags || []).some(
          (item: any) => item.key === 'task',
        );
        return filter === 'EventsOnly' ? !isTask : isTask;
      });

      if (filteredEvents.length > 0) {
        result.push({ ...dayGroup, events: filteredEvents });
      }
    }
    return result;
  };
  // ------------------------------------------------

  // Filter events by selectedTab (All, Upcoming, Completed)
  const filterEventsByTab = (
    allEvents: any[],
    tab: 'All' | 'Upcoming' | 'Completed',
  ) => {
    if (tab === 'All') {
      return allEvents;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    const lastDayOfMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
    );
    lastDayOfMonth.setHours(23, 59, 59, 999);

    const result: any[] = [];
    for (const dayGroup of allEvents) {
      const filteredEvents = dayGroup.events.filter((event: any) => {
        const eventData = event.originalRawEventData || event;
        let eventDate: Date;
        if (event.sortDate) {
          eventDate = new Date(event.sortDate);
        } else if (eventData.fromTime) {
          const match = eventData.fromTime.match(/^(\d{4})(\d{2})(\d{2})/);
          if (match) {
            const [, year, month, day] = match;
            eventDate = new Date(Number(year), Number(month) - 1, Number(day));
          } else {
            return false;
          }
        } else {
          return false;
        }
        eventDate.setHours(0, 0, 0, 0);
        return tab === 'Upcoming'
          ? eventDate >= today && eventDate <= lastDayOfMonth
          : eventDate >= firstDayOfMonth && eventDate < today;
      });

      if (filteredEvents.length > 0) {
        result.push({ ...dayGroup, events: filteredEvents });
      }
    }
    return result;
  };

  // Format date header like DeletedEventsScreen
  const formatDateHeader = (dateString: string) => {
    const date = parseTimeToPST(dateString);
    if (!date) return 'Invalid Date';

    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Group events by date for display
  const groupEventsByDate = (eventsData: any[]) => {
    const grouped: { [key: string]: any[] } = {};

    eventsData.forEach(dayData => {
      dayData.events.forEach((event: any) => {
        const eventData = event.originalRawEventData || event;
        // Try to get fromTime from the original event data
        let fromTime = eventData.fromTime;

        // If fromTime is not available, try to construct from date string
        if (!fromTime && eventData.date) {
          // eventData.date might be in format "YYYY-MM-DD"
          const dateParts = eventData.date.split('-');
          if (dateParts.length === 3) {
            // Create a date string in the format expected by parseTimeToPST
            fromTime = `${dateParts[0]}${dateParts[1]}${dateParts[2]}T000000`;
          }
        }

        if (!fromTime) {
          // Fallback: use the dayData date
          const dayDate = new Date(dayData.events[0]?.date || dayData.date);
          fromTime = dayDate.toISOString().replace(/[-:]/g, '').split('.')[0];
        }

        const dateKey = formatDateHeader(fromTime);
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(event);
      });
    });

    return grouped;
  };

  const filterEventsByView = (
    allEvents: any[],
    view: 'Day' | 'Week' | 'Month',
  ) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    // Helper function to parse "YYYY-MM-DD" format properly in local time
    const parseLocalDate = (dateString: string): Date => {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day); // month is 0-indexed in JavaScript
    };

    if (view === 'Day') {
      // Show only today's events
      return allEvents.filter(dayGroup => {
        if (!dayGroup.events[0]?.date) return false;
        const dayDate = parseLocalDate(dayGroup.events[0].date);
        return dayDate.toDateString() === today.toDateString();
      });
    }

    if (view === 'Week') {
      // Get start and end of current week
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday

      const endOfWeek = new Date(today);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday

      return allEvents.filter(dayGroup => {
        if (!dayGroup.events[0]?.date) return false;
        const dayDate = parseLocalDate(dayGroup.events[0].date);
        return dayDate >= startOfWeek && dayDate <= endOfWeek;
      });
    }

    if (view === 'Month') {
      // Show events for current month
      return allEvents.filter(dayGroup => {
        if (!dayGroup.events[0]?.date) return false;
        const dayDate = parseLocalDate(dayGroup.events[0].date);
        return (
          dayDate.getMonth() === today.getMonth() &&
          dayDate.getFullYear() === today.getFullYear()
        );
      });
    }

    return allEvents; // fallback - show all events
  };

  useFocusEffect(useCallback(() => {}, []));

  // Memoized event transformation (expansion already memoized separately)
  const processedEvents = useMemo(() => {
    if (expandedRecurringEvents.length === 0) return [];
    let transformedData = transformEventsToCalendar(
      expandedRecurringEvents,
      selectedTimeZone,
    );
    transformedData = filterEventsByTaskType(transformedData, filterType);
    transformedData = filterEventsByTab(transformedData, selectedTab);
    if (selectedTab === 'All') {
      return filterEventsByView(transformedData, 'Month');
    }
    return transformedData;
  }, [expandedRecurringEvents, selectedTimeZone, filterType, selectedTab]);

  // Defer setting state to after navigation frame completes
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setEvents(processedEvents);
    });
    return () => task.cancel();
  }, [processedEvents]);

  // Memoize grouped events for rendering performance
  const groupedEventsData = useMemo(() => {
    if (events.length === 0) return {};
    return groupEventsByDate(events);
  }, [events]);

  // Memoize event cards to prevent re-renders
  const renderEventCard = useCallback(
    (event: any, dateKey: string, index: number) => (
      <EventCard
        key={event.id || `${dateKey}-${index}`}
        title={event.title}
        eventId={event.id}
        event={event}
        time={event.time}
        date={event.date}
        color={event.color}
        tags={event.tags}
        compact={true}
        onEdit={() => handleEditEvent(event)}
      />
    ),
    [],
  );

  // Fetch events on mount or when account changes
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        await getUserEvents(account[3], api);
      } catch (error: any) {
        console.error('Error fetching events:', error);

        // Handle 401 Unauthorized specifically
        if (error.response?.status === 401) {
          showAlert(
            'Session Expired',
            'Your session has expired. Please log out and log in again.',
            'warning',
          );
        } else {
          const errorMsg =
            error.response?.data?.message ||
            error.message ||
            'Failed to fetch events';
          showAlert('Error', errorMsg, 'error');
        }
      } finally {
        setLoading(false);
      }
    };

    if (account && account[3]) {
      fetchEvents();
    }
  }, [account]);

  const handleMenuPress = () => setIsDrawerOpen(true);
  const handleDrawerClose = () => setIsDrawerOpen(false);
  const handleMonthSelect = (monthIndex: number) =>
    setCurrentMonthByIndex(monthIndex);
  const handleViewSelect = (view: string) => {
    setCurrentView(view as 'Day' | 'Week' | 'Month');
  };
  // Replace your current handleAction1Press and handleAction2Press with these:
  const handleAction1Press = (isSelected: boolean) => {
    setFilterType(isSelected ? 'EventsOnly' : 'All');
  };

  const handleAction2Press = (isSelected: boolean) => {
    setFilterType(isSelected ? 'TasksOnly' : 'All');
  };
  const handleFABPress = () => {};

  // When the month text is pressed
  const handleMonthPress = () => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    setCurrentMonth(prev =>
      prev === today.toLocaleString('en-US', { month: 'long' })
        ? nextMonth.toLocaleString('en-US', { month: 'long' })
        : today.toLocaleString('en-US', { month: 'long' }),
    );
  };

  return (
    <View style={styles.container}>
      <WeekHeader
        onMenuPress={handleMenuPress}
        currentMonth={currentMonth}
        onMonthPress={handleMonthPress}
        onMonthSelect={handleMonthSelect}
        onDateSelect={(date: Date) => {
          // When a date is selected from the calendar modal, navigate to that date
          // This allows the user to jump to a specific date
          handleMonthSelect(date.getMonth());
        }}
        currentDate={new Date()}
        showBranding={true}
        showMonthSelector={false}
        showCalendarIcon={false}
      />

      {/* Segmented Control Navigation */}
      <View style={styles.segmentedControlContainer}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              selectedTab === 'All' && styles.segmentButtonActive,
            ]}
            onPress={() => setSelectedTab('All')}
          >
            <Text
              style={[
                styles.segmentText,
                selectedTab === 'All' && styles.segmentTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentButton,
              selectedTab === 'Upcoming' && styles.segmentButtonActive,
            ]}
            onPress={() => setSelectedTab('Upcoming')}
          >
            <Text
              style={[
                styles.segmentText,
                selectedTab === 'Upcoming' && styles.segmentTextActive,
              ]}
            >
              Upcoming
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentButton,
              selectedTab === 'Completed' && styles.segmentButtonActive,
            ]}
            onPress={() => setSelectedTab('Completed')}
          >
            <Text
              style={[
                styles.segmentText,
                selectedTab === 'Completed' && styles.segmentTextActive,
              ]}
            >
              Completed
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Left edge touch area for drawer */}
      <TouchableOpacity
        style={styles.leftEdgeTouchArea}
        onPress={handleMenuPress}
        activeOpacity={0.1}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <CustomLoader />
        ) : events.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateIllustration}>
              {/* Icon based on selected tab */}
              <View style={styles.emptyStateIcon}>
                {selectedTab === 'Completed' ? (
                  <TaskCompleteIcon
                    width={scaleWidth(54)}
                    height={scaleHeight(54)}
                    fill={colors.primaryBlue}
                  />
                ) : (
                  <CalendarIcon
                    width={scaleWidth(54)}
                    height={scaleHeight(54)}
                    fill={colors.primaryBlue}
                  />
                )}
              </View>
              <Text style={styles.emptyStateTitle}>
                {selectedTab === 'All'
                  ? 'No Activity Available'
                  : selectedTab === 'Upcoming'
                  ? 'No Upcoming Activity'
                  : 'No Completed Activity'}
              </Text>
              <Text style={styles.emptyStateDescription}>
                {selectedTab === 'All'
                  ? "You haven't added any Activity yet. Tap the 'create button' below to quickly set up your first task, event, or activity."
                  : selectedTab === 'Upcoming'
                  ? "You don't have any upcoming activity right now. New scheduled events will automatically appear here as soon as they are created."
                  : 'There are no completed activity to show. After you finish or mark activity as completed, they will be listed here.'}
              </Text>
            </View>
          </View>
        ) : (
          Object.entries(groupedEventsData).map(
            ([dateKey, dateEvents]: [string, any]) => (
              <View key={dateKey} style={styles.dateGroup}>
                <View style={styles.dateHeader}>
                  <Text style={styles.dateHeaderText} numberOfLines={1}>
                    {dateKey}
                  </Text>
                  <View style={styles.dateDivider} />
                </View>
                {dateEvents.map((event: any, index: number) =>
                  renderEventCard(event, dateKey, index),
                )}
              </View>
            ),
          )
        )}
      </ScrollView>

      <FloatingActionButton
        onPress={handleFABPress}
        onOptionSelect={option => {
          switch (option) {
            case 'goal':
              break;
            case 'reminder':
              navigation.navigate(Screen.RemindersScreen);
              break;
            case 'task':
              navigation.navigate(Screen.CreateTaskScreen);
              break;
            case 'event':
              navigation.navigate(Screen.CreateEventScreen);
              break;
            default:
              break;
          }
        }}
      />

      {/* Custom Alert */}
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => setAlertVisible(false)}
      />

      {/* Custom Drawer */}
      <CustomDrawer isOpen={isDrawerOpen} onClose={handleDrawerClose} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Gray background matching DeletedEventsScreen
  },
  content: {
    flex: 1,
  },
  leftEdgeTouchArea: {
    position: 'absolute',
    left: 0,
    top: scaleHeight(80),
    width: scaleWidth(20),
    height: screenHeight - scaleHeight(80),
    zIndex: 1,
  },
  // Segmented Control Navigation
  segmentedControlContainer: {
    width: screenWidth,
    alignItems: 'center',
    paddingHorizontal: getTabletSafeDimension(scaleWidth(18), 14, 20),
    paddingTop: getTabletSafeDimension(scaleHeight(12), 10, 14),
    paddingBottom: getTabletSafeDimension(scaleHeight(12), 10, 14),
    marginTop: getTabletSafeDimension(scaleHeight(8), 6, 10),
    // No background color - transparent to show gray home screen background
  },
  segmentedControl: {
    width: getTabletSafeDimension(scaleWidth(339), screenWidth * 0.9, screenWidth - 20),
    height: getTabletSafeDimension(scaleHeight(48), 40, 52),
    flexDirection: 'row',
    backgroundColor: colors.white, // White navigation container
    borderRadius: getTabletSafeDimension(10, 8, 12),
    padding: getTabletSafeDimension(4, 3, 5),
    gap: getTabletSafeDimension(3, 2, 4),
  },
  segmentButton: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: getTabletSafeDimension(8, 6, 10),
  },
  segmentButtonActive: {
    backgroundColor: colors.primaryBlue, // Using the same blue as calendar icon
  },
  segmentText: {
    fontSize: getTabletSafeDimension(fontSize.textSize16, 14, 16),
    fontWeight: '500',
    fontFamily: Fonts.latoMedium,
    color: colors.grey400,
  },
  segmentTextActive: {
    color: colors.white,
    fontWeight: '600',
    fontFamily: Fonts.latoBold,
  },
  // Empty State
  emptyStateContainer: {
    width: getTabletSafeDimension(scaleWidth(375), 280, 360),
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: getTabletSafeDimension(scaleHeight(80), 60, 100),
    paddingBottom: getTabletSafeDimension(scaleHeight(80), 60, 100),
  },
  emptyStateIllustration: {
    width: getTabletSafeDimension(scaleWidth(331), 240, 340),
    height: getTabletSafeDimension(scaleHeight(456), 350, 480),
    alignItems: 'center',
    justifyContent: 'center',
    gap: getTabletSafeDimension(scaleHeight(20), 16, 24),
  },
  emptyStateIcon: {
    width: getTabletSafeDimension(scaleWidth(134), 100, 140),
    height: getTabletSafeDimension(scaleHeight(134), 100, 140),
    borderRadius: getTabletSafeDimension(scaleWidth(150), 110, 160),
    backgroundColor: '#E5F1FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: getTabletSafeDimension(scaleHeight(8), 6, 10), // Reduced gap
  },
  emptyStateIconText: {
    fontSize: getTabletSafeDimension(scaleWidth(60), 48, 64),
  },
  emptyStateTitle: {
    fontSize: getTabletSafeDimension(fontSize.textSize20, 16, 22),
    fontWeight: '700',
    fontFamily: Fonts.latoBold,
    color: colors.blackText,
    marginTop: getTabletSafeDimension(scaleHeight(8), 6, 10),
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: getTabletSafeDimension(fontSize.textSize14, 11, 16),
    fontFamily: Fonts.latoRegular,
    color: colors.grey400,
    textAlign: 'center',
    paddingHorizontal: getTabletSafeDimension(scaleWidth(40), 30, 50),
    lineHeight: getTabletSafeDimension(fontSize.textSize20, 16, 24),
    marginTop: getTabletSafeDimension(scaleHeight(4), 3, 6),
  },
  // Date Group Styles (matching DeletedEventsScreen)
  dateGroup: {
    marginBottom: getTabletSafeDimension(scaleHeight(24), 18, 28),
    paddingHorizontal: getTabletSafeDimension(scaleWidth(20), 16, 24),
  },
  dateHeader: {
    fontSize: getTabletSafeDimension(moderateScale(16), 13, 18),
    fontWeight: '600',
    color: '#000',
    marginBottom: getTabletSafeDimension(scaleHeight(12), 10, 14),
    fontFamily: Fonts.latoBold,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateHeaderText: {
    fontSize: getTabletSafeDimension(moderateScale(16), 13, 18),
    fontWeight: '600',
    color: '#000',
    fontFamily: Fonts.latoBold,
    marginRight: getTabletSafeDimension(scaleWidth(12), 10, 14),
  },
  dateDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
});

export default ScheduleScreen;
