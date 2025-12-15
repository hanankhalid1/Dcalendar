import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  Alert,
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
import { useSettingsStore } from '../stores/useSetting';
import { s } from 'react-native-size-matters';
import CustomAlert from '../components/CustomAlert';
import { Fonts } from '../constants/Fonts';
import CalendarIcon from '../assets/svgs/calendar.svg';
import TaskCompleteIcon from '../assets/svgs/taskComplete.svg';

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

  // Helper function to expand recurring events
  const expandRecurringEvents = (allEvents: any[]): any[] => {
    const expandedEvents: any[] = [];

    allEvents.forEach(event => {
      // Check if event has recurring pattern
      const repeatEvent = (event.list || []).find(
        (item: any) => item.key === 'repeatEvent',
      )?.value;
      const customRepeatEvent = (event.list || []).find(
        (item: any) => item.key === 'customRepeatEvent',
      )?.value;

      // If no recurring pattern, just add the event as-is
      if (!repeatEvent && !customRepeatEvent) {
        expandedEvents.push(event);
        return;
      }

      // Get recurrence pattern
      const pattern = repeatEvent || customRepeatEvent;

      // If pattern exists, expand the event for the next 90 days
      if (pattern && pattern !== 'Does not repeat') {
        const baseEvent = event;
        const baseFromTime = baseEvent.fromTime;
        const baseDuration = baseEvent.toTime
          ? new Date(
              baseEvent.toTime.match(
                /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?$/,
              )
                ? `${baseEvent.toTime.substring(
                    0,
                    4,
                  )}-${baseEvent.toTime.substring(
                    4,
                    6,
                  )}-${baseEvent.toTime.substring(
                    6,
                    8,
                  )}T${baseEvent.toTime.substring(9)}`
                : baseEvent.toTime,
            ).getTime() -
            new Date(
              baseFromTime.match(
                /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?$/,
              )
                ? `${baseFromTime.substring(0, 4)}-${baseFromTime.substring(
                    4,
                    6,
                  )}-${baseFromTime.substring(6, 8)}T${baseFromTime.substring(
                    9,
                  )}`
                : baseFromTime,
            ).getTime()
          : 0;

        // Parse the base date
        const [, baseYear, baseMonth, baseDay] =
          baseFromTime.match(/^(\d{4})(\d{2})(\d{2})/) || [];
        const baseDateObj = new Date(
          Number(baseYear),
          Number(baseMonth) - 1,
          Number(baseDay),
        );

        // Expand based on pattern
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 90); // Expand for 90 days

        let currentDate = new Date(baseDateObj);

        while (currentDate <= endDate) {
          if (currentDate >= baseDateObj) {
            // Create new event instance for this date
            const expandedFromTime = [
              currentDate.getFullYear().toString().padStart(4, '0'),
              (currentDate.getMonth() + 1).toString().padStart(2, '0'),
              currentDate.getDate().toString().padStart(2, '0'),
              baseFromTime.substring(9),
            ].join('');

            const expandedToTime =
              baseDuration > 0
                ? [
                    new Date(currentDate.getTime() + baseDuration)
                      .getFullYear()
                      .toString()
                      .padStart(4, '0'),
                    (
                      new Date(
                        currentDate.getTime() + baseDuration,
                      ).getMonth() + 1
                    )
                      .toString()
                      .padStart(2, '0'),
                    new Date(currentDate.getTime() + baseDuration)
                      .getDate()
                      .toString()
                      .padStart(2, '0'),
                    baseEvent.toTime.substring(9),
                  ].join('')
                : expandedFromTime;

            expandedEvents.push({
              ...baseEvent,
              fromTime: expandedFromTime,
              toTime: expandedToTime,
            });
          }

          // Increment date based on pattern
          if (pattern === 'Daily' || pattern.includes('daily')) {
            currentDate.setDate(currentDate.getDate() + 1);
          } else if (pattern === 'Weekly' || pattern.includes('weekly')) {
            currentDate.setDate(currentDate.getDate() + 7);
          } else if (pattern === 'Monthly' || pattern.includes('monthly')) {
            currentDate.setMonth(currentDate.getMonth() + 1);
          } else if (pattern === 'Yearly' || pattern.includes('yearly')) {
            currentDate.setFullYear(currentDate.getFullYear() + 1);
          } else {
            // Default to daily if pattern not recognized
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      } else {
        // No recurring pattern, add as-is
        expandedEvents.push(event);
      }
    });

    return expandedEvents;
  };

  useEffect(() => {
    // Set the initial current month dynamically based on today's date
    const today = new Date();
    setCurrentMonth(today.toLocaleString('en-US', { month: 'long' }));
  }, []);

  const transformEventsToCalendar = (
    allEvents: any[],
    selectedTimeZone: string,
  ) => {
    const groupedEvents: Record<string, any[]> = {};

    allEvents.forEach(event => {
      console.log('event in transform func', event.title);
      if (!event.fromTime) {
        console.warn('Missing fromTime:', event);
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
          console.warn('Invalid fromTime after parsing:', event);
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

        console.log('startTimeData in transform func', startTimeData);
        console.log('endTimeData in transform func', endTimeData);
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
        console.log('startTime in transform func', startTime);
        console.log('endTime in transform func', endTime);
        eventTime = `${startTime} - ${endTime}`;
      } else {
        // Fallback if time data is missing
        eventTime = 'Time not available';
      }

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
      });
    });

    return Object.keys(groupedEvents)
      .sort()
      .map(dateKey => {
        const dateObj = new Date(dateKey);

        return {
          day: dateObj
            .toLocaleDateString('en-US', { weekday: 'short' })
            .toUpperCase(),
          date: dateObj.getDate().toString().padStart(2, '0'),
          month: dateObj
            .toLocaleDateString('en-US', { month: 'short' })
            .toUpperCase(),
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

    return allEvents
      .map(dayGroup => {
        // Filter the events within each day group
        const filteredEvents = dayGroup.events.filter((event: any) => {
          const isTask = (event.tags || []).some(
            (item: any) => item.key === 'task',
          );

          if (filter === 'EventsOnly') {
            // Action 1: Show only non-tasks (Events)
            return !isTask;
          } else if (filter === 'TasksOnly') {
            // Action 2: Show only tasks
            return isTask;
          }
          return true;
        });

        // Return the day group only if it still has events after filtering
        if (filteredEvents.length > 0) {
          return { ...dayGroup, events: filteredEvents };
        }
        return null;
      })
      .filter(dayGroup => dayGroup !== null); // Remove null entries
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
    today.setHours(0, 0, 0, 0); // Start of today

    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7); // 7 days from now

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7); // 7 days ago

    return allEvents
      .map(dayGroup => {
        const filteredEvents = dayGroup.events.filter((event: any) => {
          const eventData = event.originalRawEventData || event;

          // Get event date from sortDate or parse fromTime
          let eventDate: Date;
          if (event.sortDate) {
            eventDate = new Date(event.sortDate);
          } else if (eventData.fromTime) {
            // Parse the fromTime format (YYYYMMDDTHHmmss)
            const match = eventData.fromTime.match(/^(\d{4})(\d{2})(\d{2})/);
            if (match) {
              const [, year, month, day] = match;
              eventDate = new Date(
                Number(year),
                Number(month) - 1,
                Number(day),
              );
            } else {
              return false;
            }
          } else {
            return false;
          }

          eventDate.setHours(0, 0, 0, 0); // Normalize to start of day

          if (tab === 'Upcoming') {
            // Show events from today onwards up to 7 days from now
            return eventDate >= today && eventDate < sevenDaysFromNow;
          } else if (tab === 'Completed') {
            // Show events from 7 days ago up to yesterday
            return eventDate >= sevenDaysAgo && eventDate < today;
          }
          return true;
        });

        if (filteredEvents.length > 0) {
          return { ...dayGroup, events: filteredEvents };
        }
        return null;
      })
      .filter(dayGroup => dayGroup !== null);
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

  useFocusEffect(
    useCallback(() => {
      console.log('User Events in HomeScreen:', userEvents);

      // Expand recurring events first
      const expandedEvents = expandRecurringEvents(userEvents);
      console.log(
        'Expanded events count:',
        expandedEvents.length,
        'Original count:',
        userEvents.length,
      );

      let transformedData = transformEventsToCalendar(
        expandedEvents,
        selectedTimeZone,
      );

      // --- APPLY TASK/EVENT FILTER FIRST ---
      transformedData = filterEventsByTaskType(transformedData, filterType);
      // -------------------------------------

      // --- APPLY TAB FILTER (All, Upcoming, Completed) ---
      transformedData = filterEventsByTab(transformedData, selectedTab);
      // -------------------------------------

      // Only apply filterEventsByView if we're on the "All" tab
      // For Upcoming and Completed, we want to see the full 7-day range regardless of Week/Month view
      if (selectedTab === 'All') {
        // For "All" tab, always show full month regardless of currentView selection
        const filteredData = filterEventsByView(transformedData, 'Month');
        setEvents(filteredData);
      } else {
        // For Upcoming and Completed tabs, don't apply week/month filter
        setEvents(transformedData);
      }
    }, [userEvents, currentView, selectedTimeZone, filterType, selectedTab]), // Added selectedTab dependency
  );

  // console.log('All Events',allEvents);
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        console.log('Fetching events for user:', account[3]);

        const events = await getUserEvents(account[3], api);
        console.log('events fetched in 179', events);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [userName]);

  const handleMenuPress = () => {
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentMonthByIndex(monthIndex);
  };

  const handleViewSelect = (view: string) => {
    console.log('View selected:', view);
    setCurrentView(view as 'Day' | 'Week' | 'Month');

    // The filtering will be handled by the useEffect that depends on currentView
    // No need to navigate to different screens, just filter the current view
  };
  // Replace your current handleAction1Press and handleAction2Press with these:

  const handleAction1Press = (isSelected: boolean) => {
    if (isSelected) {
      console.log('Action 1 pressed: Showing only Events (non-tasks)');
      setFilterType('EventsOnly');
    } else {
      console.log('Action 1 pressed: Resetting to All Events/Tasks');
      // Only reset if we're currently showing EventsOnly
      setFilterType(prev => (prev === 'EventsOnly' ? 'All' : prev));
    }
  };

  const handleAction2Press = (isSelected: boolean) => {
    if (isSelected) {
      console.log('Action 2 pressed: Showing only Tasks');
      setFilterType('TasksOnly');
    } else {
      console.log('Action 2 pressed: Resetting to All Events/Tasks');
      // Only reset if we're currently showing TasksOnly
      setFilterType(prev => (prev === 'TasksOnly' ? 'All' : prev));
    }
  };
  const handleFABPress = () => {};

  // When the month text is pressed
  const handleMonthPress = () => {
    const today = new Date();

    // Example: Toggle between current and next month for now
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    setCurrentMonth(prev =>
      prev === today.toLocaleString('en-US', { month: 'long' })
        ? nextMonth.toLocaleString('en-US', { month: 'long' })
        : today.toLocaleString('en-US', { month: 'long' }),
    );
  };
  // Removed handleViewPress to prevent automatic value change
  // Values should only change when selecting from dropdown options
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
          (() => {
            const groupedEvents = groupEventsByDate(events);
            return Object.entries(groupedEvents).map(
              ([dateKey, dateEvents]) => (
                <View key={dateKey} style={styles.dateGroup}>
                  <View style={styles.dateHeader}>
                    <Text style={styles.dateHeaderText} numberOfLines={1}>
                      {dateKey}
                    </Text>
                    <View style={styles.dateDivider} />
                  </View>
                  {dateEvents.map((event, index) => (
                    <EventCard
                      key={event.id || index}
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
                  ))}
                </View>
              ),
            );
          })()
        )}
      </ScrollView>

      <FloatingActionButton
        onPress={handleFABPress}
        onOptionSelect={option => {
          console.log('Selected option:', option);
          // Handle different menu options
          switch (option) {
            case 'goal':
              console.log('Create Goal');
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
    paddingHorizontal: scaleWidth(18),
    paddingTop: scaleHeight(12),
    paddingBottom: scaleHeight(12),
    marginTop: scaleHeight(8), // Gap between header and navigation
    // No background color - transparent to show gray home screen background
  },
  segmentedControl: {
    width: scaleWidth(339),
    height: scaleHeight(48),
    flexDirection: 'row',
    backgroundColor: colors.white, // White navigation container
    borderRadius: 10,
    padding: 4,
    gap: 3,
  },
  segmentButton: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: colors.primaryBlue, // Using the same blue as calendar icon
  },
  segmentText: {
    fontSize: fontSize.textSize16,
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
    width: scaleWidth(375),
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: scaleHeight(80),
    paddingBottom: scaleHeight(80),
  },
  emptyStateIllustration: {
    width: scaleWidth(331),
    height: scaleHeight(456),
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleHeight(20),
  },
  emptyStateIcon: {
    width: scaleWidth(134),
    height: scaleHeight(134),
    borderRadius: scaleWidth(150),
    backgroundColor: '#E5F1FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleHeight(8), // Reduced gap
  },
  emptyStateIconText: {
    fontSize: scaleWidth(60),
  },
  emptyStateTitle: {
    fontSize: fontSize.textSize20,
    fontWeight: '700',
    fontFamily: Fonts.latoBold,
    color: colors.blackText,
    marginTop: scaleHeight(8), // Reduced gap
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: fontSize.textSize14,
    fontFamily: Fonts.latoRegular,
    color: colors.grey400,
    textAlign: 'center',
    paddingHorizontal: scaleWidth(40),
    lineHeight: fontSize.textSize20,
    marginTop: scaleHeight(4), // Reduced gap
  },
  // Date Group Styles (matching DeletedEventsScreen)
  dateGroup: {
    marginBottom: scaleHeight(24),
    paddingHorizontal: scaleWidth(20),
  },
  dateHeader: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#000',
    marginBottom: scaleHeight(12),
    fontFamily: Fonts.latoBold,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateHeaderText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#000',
    fontFamily: Fonts.latoBold,
    marginRight: scaleWidth(12),
  },
  dateDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
});

export default ScheduleScreen;
