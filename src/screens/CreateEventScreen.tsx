import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
  findNodeHandle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FeatherIcon from 'react-native-vector-icons/Feather';
import {
  borderRadius,
  colors,
  fontSize,
  shadows,
  spacing,
} from '../utils/LightTheme';
import { moderateScale, scaleHeight, scaleWidth } from '../utils/dimensions';
import { useApiClient } from '../hooks/useApi';
import { useEventsStore } from '../stores/useEventsStore';


import CalendarWithTime from '../components/CalendarWithTime';

import AdvancedOptions from '../components/createEvent/AdvancedOptions';
import GradientText from '../components/home/GradientText';
import { Colors } from '../constants/Colors';
import { NECJSPRIVATE_KEY } from '../constants/Config';
import {
  dayAbbreviations,
  dayNames,
  eventTypes,
  guestData,
  timezones,
} from '../constants/dummyData';
import { AppNavigationProp, Screen } from '../navigations/appNavigation.type';
import { generateEventUID } from '../utils/eventUtils';

import GuestSelector from '../components/createEvent/GuestSelector';
import { BlockchainService } from '../services/BlockChainService';
import { useActiveAccount } from '../stores/useActiveAccount';
import { useToken } from '../stores/useTokenStore';
import { convertionISOToTime, convertSecondsToUnit } from '../utils/notifications';
import dayjs from "dayjs";
import Icon from 'react-native-vector-icons/Feather';
import { useAuthStore } from '../stores/useAuthStore';
import { useSettingsStore } from '../stores/useSetting';
const CreateEventScreen = () => {
  const navigation: any = useNavigation<AppNavigationProp>();
  const activeAccount = useActiveAccount(state => state.account);
  const token = useToken(state => state.token);
  const route = useRoute<any>();
  const { mode, eventData: editEventData } = route.params || {};
  const { getUserEvents } = useEventsStore();
  const { googleIntegration } = useAuthStore();
  const currentTimezone = useSettingsStore();
  // Initialize blockchain service and get contract instance
  // Form state
  const [title, setTitle] = useState(editEventData?.title ?? '');
  const [description, setDescription] = useState(editEventData?.description ?? '');
  const [location, setLocation] = useState(editEventData?.location ?? '');
  const [videoConferencing, setVideoConferencing] = useState(editEventData?.videoConferencing ?? '');
  const [notificationMinutes, setNotificationMinutes] = useState('0');
  const [selectedTimeUnit, setSelectedTimeUnit] = useState('Minutes');
  const [selectedNotificationType, setSelectedNotificationType] = useState('Notification');
  const [selectedStatus, setSelectedStatus] = useState('Busy');
  const [selectedVisibility, setSelectedVisibility] = useState('Default Visibility');
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(editEventData?.selectedStartDate ? new Date(editEventData.selectedStartDate) : null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(editEventData?.selectedEndDate ? new Date(editEventData.selectedEndDate) : null);
  const [selectedStartTime, setSelectedStartTime] = useState(editEventData?.selectedStartTime || '');
  const [selectedEndTime, setSelectedEndTime] = useState(editEventData?.selectedEndTime || '');
  const [showDetailedDateTime, setShowDetailedDateTime] = useState(!!editEventData);
  const [dateTimeError, setDateTimeError] = useState<string>('');
  const [titleError, setTitleError] = useState<string>('');
  const [locationError, setLocationError] = useState<string>('');
  const [startDateError, setStartDateError] = useState<string>('');
  const [startTimeError, setStartTimeError] = useState<string>('');
  const [endDateError, setEndDateError] = useState<string>('');
  const [endTimeError, setEndTimeError] = useState<string>('');
  const [calendarMode, setCalendarMode] = useState<'from' | 'to'>('from');
  const [showEventTypeDropdown, setShowEventTypeDropdown] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState(editEventData?.selectedEventType || 'Event');
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [selectedPermission, setSelectedPermission] = useState<string>('');
  const [showVideoConferencingOptions, setShowVideoConferencingOptions] = useState(false);
  const [selectedVideoConferencing, setSelectedVideoConferencing] = useState('');
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestSearchQuery, setGuestSearchQuery] = useState('');
  const [showRecurrenceDropdown, setShowRecurrenceDropdown] = useState(false);
  const [selectedRecurrence, setSelectedRecurrence] = useState('Does not repeat');
  const [showCustomRecurrenceModal, setShowCustomRecurrenceModal] = useState(false);
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingEventId, setMeetingEventId] = useState('');

  const [customRecurrence, setCustomRecurrence] = useState(() => {
    const weekday =
      selectedStartDate
        ? selectedStartDate.toLocaleDateString('en-US', { weekday: 'long' })
        : 'Thursday'; // default fallback
    return {

      repeatEvery: '1',
      repeatUnit: 'Week',
      repeatOn: [weekday],
      endsType: 'Never',
      endsDate: '',
      endsAfter: '13',
    }
  });
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState(currentTimezone);
  const [timezoneSearchQuery, setTimezoneSearchQuery] = useState('');
  const [searchQuery, setsearchQuery] = useState("")
  const [locationSuggestions, setLocationSuggestions] = React.useState<any[]>([]);
  const [showLocationModal, setShowLocationModal] = React.useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = React.useState(false);
  const locationModalInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const titleInputRef = useRef<View>(null);
  const dateTimeSectionRef = useRef<View>(null);
  const locationSectionRef = useRef<View>(null);
  const { api } = useApiClient();
  const [isAllDayEvent, setIsAllDayEvent] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const endsOptions = ['Never', 'On', 'After'];
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);

  const isAllDayEventCheck = (fromTime: string, toTime: string): boolean => {
    if (!fromTime || !toTime) {
      return false;
    }

    // Handle date-only format (e.g., YYYYMMDD) - shouldn't happen with our format
    if (!fromTime.includes('T') || !toTime.includes('T')) {
      return true;
    }

    // Extract time components
    const fromTimeOnly = fromTime.split('T')[1];
    const toTimeOnly = toTime.split('T')[1];

    // ✅ The All-Day signature: T000000 for both start and end
    const isStartMidnight = fromTimeOnly && fromTimeOnly.startsWith('000000');
    const isEndMidnight = toTimeOnly && toTimeOnly.startsWith('000000');

    console.log('isAllDayEventCheck details:', {
      fromTime,
      toTime,
      fromTimeOnly,
      toTimeOnly,
      isStartMidnight,
      isEndMidnight,
      result: isStartMidnight && isEndMidnight
    });

    return isStartMidnight && isEndMidnight;
  };
  // Helper function to parse event data from the list/tags array
  const parseEventData = (eventData: any) => {
    // Handle both 'list' and 'tags' array structures
    const dataArray = eventData?.list || eventData?.tags;
    console.log('Data array found:', dataArray);
    if (!eventData || !dataArray) {
      console.log('No data array found in event data');
      return {};
    }

    console.log("Edit event data", eventData);
    const parsedData: any = {};

    // Parse each item in the array
    dataArray.forEach((item: any) => {
      console.log('Processing item:', item);
      const { key, value } = item;

      switch (key) {
        case 'location':
          parsedData.location = value;
          console.log('Set location:', value);
          break;
        case 'locationType':
          parsedData.locationType = value;
          console.log('Set locationType:', value);
          break;
        case 'guest':
          if (!parsedData.guests) parsedData.guests = [];
          parsedData.guests.push(value);
          console.log('Added guest:', value);
          break;
        case 'busy':
          parsedData.busy = value;
          console.log('Set busy:', value);
          break;
        case 'visibility':
          parsedData.visibility = value;
          console.log('Set visibility:', value);
          break;
        case 'notification':
          parsedData.notification = value;
          console.log('Set notification:', value);
          break;
        case 'guest_permission':
          parsedData.guest_permission = value;
          console.log('Set guest_permission:', value);
          break;
        case 'seconds':
          parsedData.seconds = value;
          console.log('Set seconds:', value);
          break;
        case 'trigger':
          parsedData.trigger = value;
          console.log('Set trigger:', value);
          break;
        case 'organizer':
          parsedData.organizer = value;
          console.log('Set organizer:', value);
          break;
        case 'timezone':
          parsedData.timezone = value;
          console.log('Set timezone:', value);
          break;
        case 'repeatEvent':
          parsedData.repeatEvent = value;
          console.log('Set repeatEvent:', value);
          break;
        case 'isDeleted':
          parsedData.isDeleted = value;
          console.log('Set isDeleted:', value);
          break;
        case 'deletedTime':
          parsedData.deletedTime = value;
          console.log('Set deletedTime:', value);
          break;
        case 'meetingLink':
          parsedData.meetingLink = value;
          console.log('Set meetingLink:', value);
          break;
        case 'meetingEventId':
          parsedData.meetingEventId = value;
          console.log('Set meetingEventId:', value);
          break;
        default:
          console.log('Unknown key:', key, 'with value:', value);
          break;
      }
    });

    return parsedData;
  };

  // Helper function to parse date and time from separate strings
  const parseDateAndTime = (dateString: string, timeString: string) => {
    try {
      // Parse date string like "Wed Sep 24 2025"
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error('Invalid date string:', dateString);
        return { startDate: null, startTime: '', endDate: null, endTime: '' };
      }

      // ✅ Handle all-day events (no time string or empty time string)
      if (!timeString || timeString.trim() === '') {
        return {
          startDate: date,
          startTime: '',
          endDate: date,
          endTime: ''
        };
      }

      // Parse time string like "9:00 PM - 10:00 PM"
      const timeParts = timeString.split(' - ');
      if (timeParts.length !== 2) {
        console.error('Invalid time format:', timeString);
        return { startDate: null, startTime: '', endDate: null, endTime: '' };
      }

      const startTime = timeParts[0].trim();
      const endTime = timeParts[1].trim();

      // For now, assume both start and end are on the same date
      // You might want to handle cases where events span multiple days
      return {
        startDate: date,
        startTime: startTime,
        endDate: date,
        endTime: endTime
      };
    } catch (error) {
      console.error('Error parsing date and time:', dateString, timeString, error);
      return { startDate: null, startTime: '', endDate: null, endTime: '' };
    }
  };

  // Helper function to parse datetime from different formats
  const parseDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return { date: null, time: '' };

    let date: Date;
    let timeString = '';

    try {
      // Handle ISO format (2025-09-19T05:00:00.000Z)
      if (dateTimeString.includes('T') && dateTimeString.includes('Z')) {
        date = new Date(dateTimeString);
        if (isNaN(date.getTime())) {
          console.error('Invalid ISO date:', dateTimeString);
          return { date: null, time: '' };
        }
        timeString = date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      }
      // ✅ Handle YYYYMMDDTHHMMSS format (20250924T210000)
      else if (dateTimeString.match(/^\d{8}T\d{6}$/)) {
        const year = dateTimeString.substring(0, 4);
        const month = dateTimeString.substring(4, 6);
        const day = dateTimeString.substring(6, 8);
        const timePart = dateTimeString.substring(9); // Get HHMMSS
        const hour = dateTimeString.substring(9, 11);
        const minute = dateTimeString.substring(11, 13);
        const second = dateTimeString.substring(13, 15);

        // ✅ CHECK IF IT'S MIDNIGHT (ALL-DAY EVENT)
        if (timePart === '000000') {
          // Return date only, no time for all-day events
          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          return { date, time: '' };
        }

        // Parse as normal timed event
        date = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hour),
          parseInt(minute),
          parseInt(second)
        );

        if (isNaN(date.getTime())) {
          console.error('Invalid YYYYMMDDTHHMMSS date:', dateTimeString);
          return { date: null, time: '' };
        }

        // ✅ Convert to 12-hour format manually to avoid locale issues
        const hourNum = parseInt(hour);
        const minuteNum = parseInt(minute);

        let displayHour = hourNum;
        let period = 'AM';

        if (hourNum >= 12) {
          period = 'PM';
          if (hourNum > 12) {
            displayHour = hourNum - 12;
          }
        } else if (hourNum === 0) {
          displayHour = 12;
        }

        timeString = `${displayHour.toString().padStart(2, '0')}:${minuteNum.toString().padStart(2, '0')} ${period}`;
      }
      // ✅ Handle date-only format (YYYYMMDD) - treat as all-day
      else if (dateTimeString.match(/^\d{8}$/)) {
        const year = dateTimeString.substring(0, 4);
        const month = dateTimeString.substring(4, 6);
        const day = dateTimeString.substring(6, 8);

        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (isNaN(date.getTime())) {
          console.error('Invalid YYYYMMDD date:', dateTimeString);
          return { date: null, time: '' };
        }

        // Return empty time for date-only format
        return { date, time: '' };
      }
      // Handle other formats
      else {
        date = new Date(dateTimeString);
        if (isNaN(date.getTime())) {
          console.error('Invalid date format:', dateTimeString);
          return { date: null, time: '' };
        }
        timeString = date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      }

      console.log('parseDateTime result:', {
        input: dateTimeString,
        date: date.toISOString(),
        time: timeString
      });

      return { date, time: timeString };
    } catch (error) {
      console.error('Error parsing datetime:', dateTimeString, error);
      return { date: null, time: '' };
    }
  };


  useEffect(() => {
    console.log('Edit Event Data:', JSON.stringify(editEventData));

    if (editEventData && mode === 'edit') {
      const parsedData = parseEventData(editEventData);
      console.log('Parsed Data from tags/list:', parsedData);

      setTitle(editEventData.title || '');
      setDescription(editEventData.description || '');
      setLocation(parsedData.location || '');

      // ✅ CHECK IF IT'S AN ALL-DAY EVENT FIRST
      if (editEventData.fromTime && editEventData.toTime) {
        const isAllDay = isAllDayEventCheck(editEventData.fromTime, editEventData.toTime);

        console.log('All-day event check:', {
          fromTime: editEventData.fromTime,
          toTime: editEventData.toTime,
          isAllDay,
          checkDetails: {
            hasT: editEventData.fromTime.includes('T'),
            fromTimeOnly: editEventData.fromTime.split('T')[1],
            toTimeOnly: editEventData.toTime.split('T')[1]
          }
        });

        // ✅ SET ALL-DAY STATE IMMEDIATELY
        setIsAllDayEvent(isAllDay);

        // Parse start date/time
        const startDateTime = parseDateTime(editEventData.fromTime);
        if (startDateTime.date) {
          setSelectedStartDate(startDateTime.date);
          // ✅ Only set time for non-all-day events
          setSelectedStartTime(isAllDay ? '' : (startDateTime.time || ''));
        }

        // Parse end date/time
        const endDateTime = parseDateTime(editEventData.toTime);
        if (endDateTime.date) {
          // ✅ For all-day events, subtract 1 day from stored end date
          if (isAllDay) {
            const displayEndDate = new Date(endDateTime.date);
            displayEndDate.setDate(displayEndDate.getDate() - 1);
            setSelectedEndDate(displayEndDate);
            setSelectedEndTime('');

            console.log('All-day event - Adjusted end date:', {
              storedEndDate: endDateTime.date.toISOString(),
              displayEndDate: displayEndDate.toISOString()
            });
          } else {
            setSelectedEndDate(endDateTime.date);
            setSelectedEndTime(endDateTime.time || '');
          }
        }
      } else if (editEventData.date && editEventData.time) {
        console.log('Parsing date and time:', editEventData.date, editEventData.time);
        const dateTime = parseDateAndTime(editEventData.date, editEventData.time);
        console.log('Parsed date and time result:', dateTime);

        if (dateTime.startDate) {
          setSelectedStartDate(dateTime.startDate);
          setSelectedStartTime(dateTime.startTime);
        }
        if (dateTime.endDate) {
          setSelectedEndDate(dateTime.endDate);
          setSelectedEndTime(dateTime.endTime);
        }
      }

      // Set other fields...
      if (parsedData.timezone) {
        setSelectedTimezone(parsedData.timezone);
      }

      if (parsedData.guests && parsedData.guests.length > 0) {
        setSelectedGuests(parsedData.guests);
        setShowGuestDropdown(true);
      }

      if (parsedData.guest_permission) {
        setSelectedPermission(parsedData.guest_permission);
      }

      if (parsedData.notification) {
        setSelectedNotificationType(parsedData.notification);
      }

      if (parsedData.busy) {
        setSelectedStatus(parsedData.busy);
      }

      if (parsedData.visibility) {
        setSelectedVisibility(parsedData.visibility);
      }

      if (parsedData.seconds) {
        const secondsValue = parseInt(parsedData.seconds, 10);
        const unitLabel = parsedData.trigger
          ? convertionISOToTime(parsedData.trigger)?.Label || 'Minutes'
          : 'Minutes';

        const convertedValue = convertSecondsToUnit(secondsValue, unitLabel);
        setNotificationMinutes(convertedValue.toString());
        setSelectedTimeUnit(unitLabel); // Display unit like Minutes/Hours
        setShowAdvanced(true);
      }

      if (parsedData.repeatEvent) {
        setSelectedRecurrence(parsedData.repeatEvent);
      }

      if ((editEventData.fromTime && editEventData.toTime) || (editEventData.date && editEventData.time)) {
        setShowDetailedDateTime(true);
      }

      if (parsedData.locationType) {
        setSelectedVideoConferencing(parsedData.locationType);
        setShowVideoConferencingOptions(true);
      }

      // ✅ Handle Google Meet or any video meeting
      if (
        parsedData.locationType === 'google' ||
        editEventData?.meetingLink?.includes('meet.google.com')
      ) {
        console.log('Detected Google Meet in existing event');

        setSelectedVideoConferencing('google');
        setShowVideoConferencingOptions(true);

        if (editEventData.meetingLink) {
          setMeetingLink(editEventData.meetingLink);
        }

        const meetingEventId =
          parsedData.meetingEventId ||
          editEventData.meetingEventId ||
          (editEventData.list || []).find((i: any) => i.key === 'meetingEventId')?.value;

        if (meetingEventId) {
          setMeetingEventId(meetingEventId);
          console.log('Meeting Event ID found:', meetingEventId);
        }
      }



    }
  }, [editEventData, mode]);

  // Validate date/time whenever dates, times, or all-day status changes
  useEffect(() => {
    validateDateTime();
  }, [validateDateTime]);

  useFocusEffect(
    React.useCallback(() => {
      // Just show the video conferencing options when Google is connected
      if (googleIntegration.isConnected && !showVideoConferencingOptions) {
        setShowVideoConferencingOptions(true);
      }
    }, [googleIntegration.isConnected, showVideoConferencingOptions])
  );
  const handleGoogleMeetClick = () => {
    if (!googleIntegration.isConnected) {
      // Show modal first, then navigate on Continue
      setShowIntegrationModal(true);
    } else {
      // Google is connected, allow selecting Google Meet
      setSelectedVideoConferencing('google');
    }
  };

  useEffect(() => {
    if (selectedStartDate) {
      const weekday = selectedStartDate.toLocaleDateString('en-US', { weekday: 'long' });
      setCustomRecurrence(prev => ({
        ...prev,
        repeatOn: [weekday],
      }));
    }
  }, [selectedStartDate]);

  // Location search function
  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setLocationSuggestions([]);
      // Don't close modal - let user continue typing
      return;
    }

    try {
      setIsLoadingLocations(true);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query,
      )}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'DCalendar-Mobile/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: any[] = await response.json();

      const formattedSuggestions = data.map(location => ({
        value: location.place_id,
        label: location.display_name,
        lat: location.lat,
        lon: location.lon,
      }));

      const suggestionsWithInput = [
        { value: query, label: query },
        ...formattedSuggestions,
      ];
      setLocationSuggestions(suggestionsWithInput);
      // Always show modal when we have suggestions, even if it's already open
      setShowLocationModal(true);
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setLocationSuggestions([{ value: query, label: query }]);
      setShowLocationModal(true);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  // Debounced location search
  const debouncedFetchSuggestions = React.useCallback(
    React.useMemo(() => {
      let timeoutId: NodeJS.Timeout;
      return (query: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fetchSuggestions(query), 300);
      };
    }, []),
    [],
  );

  // Maintain TextInput focus when modal opens
  useEffect(() => {
    if (showLocationModal && locationModalInputRef.current) {
      // Small delay to ensure modal is fully rendered
      const focusTimer = setTimeout(() => {
        if (locationModalInputRef.current) {
          locationModalInputRef.current.focus();
        }
      }, 200);
      return () => clearTimeout(focusTimer);
    } else if (!showLocationModal && locationModalInputRef.current) {
      // Blur the input when modal closes to prevent focus issues
      locationModalInputRef.current.blur();
    }
  }, [showLocationModal]);

const getRecurrenceOptions = (selectedStartDate: Date) => {
  const d = dayjs(selectedStartDate);
  const weekday = d.format("dddd");
  const dayNumber = d.date();
  const monthName = d.format("MMMM");

  // 1. Determine the week position (first, second, third, fourth)
  const weekNames = ["first", "second", "third", "fourth"];
  const weekOfMonth = Math.ceil(dayNumber / 7);

  // 2. Check if the selected date is the ABSOLUTE last occurrence of this weekday in the month
  const isSelectedDateTheLastWeekday = d.add(7, "day").month() !== d.month();

  // 3. Determine the Nth Week Text to use for the first monthly option
  let nthWeekText;
  if (isSelectedDateTheLastWeekday) {
    // Use "last" if it is the final occurrence of the day in the month
    nthWeekText = "last";
  } else {
    // Otherwise, use the calculated "Nth" position (first, second, third, or fourth)
    nthWeekText = weekNames[weekOfMonth - 1] || "first";
  }

  let options = [
    "Does not repeat",
    "Daily",
    // 1. Weekly on [Weekday]
    `Weekly on ${weekday}`,
  ];

  // 2. Monthly on the [Nth] [Weekday] - Uses "last" when applicable
  options.push(
    `Monthly on the ${nthWeekText} ${weekday}`
  );

  // 3. Monthly on the last [Weekday]
  // We ONLY add this option if the calculated Nth option (step 2) is NOT "last".
  // This prevents the redundant inclusion of the "last" option.
  if (!isSelectedDateTheLastWeekday) {
    options.push(
      `Monthly on the last ${weekday}`
    );
  }

  // 4. Annually and others
  options.push(
    `Annually on ${monthName} ${dayNumber}`,
    "Every Weekday (Monday to Friday)",
    "Custom...",
  );
  
  return options;
};
  const recurrenceOptions = getRecurrenceOptions(selectedStartDate);

  // Handle location selection
  const handleLocationSelect = (selectedLocation: any) => {
    setLocation(selectedLocation.label);
    setShowLocationModal(false);
    setLocationSuggestions([]);
    if (locationError) setLocationError('');
  };

  // Handle opening location modal - ensures it opens even if TextInput is already focused
  const handleOpenLocationModal = () => {
    setShowLocationModal(true);
    // If there's existing location text, fetch suggestions
    if (location && location.length >= 2) {
      debouncedFetchSuggestions(location);
    }
  };

  // Handle location input focus - allow continued typing
  const handleLocationFocus = () => {
    if (location && location.length >= 2) {
      debouncedFetchSuggestions(location);
    }
  };

  const handleUnitSelect = (unit) => {
    setCustomRecurrence(prev => ({ ...prev, repeatUnit: unit }));
    setShowUnitDropdown(false);
  };

  const repeatUnits = ['Day', 'Week', 'Month', 'Year'];

  const getCurrentTimezone = React.useCallback(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneData = timezones.find(tz => tz.id === timezone);
    return (
      timezoneData || { id: timezone, name: timezone, offset: 'GMT+00:00' }
    );
  }, []);


  const handleEventTypeSelect = (eventType: string) => {
    setSelectedEventType(eventType);
    setShowEventTypeDropdown(false);

    // Navigate to corresponding screen
    if (eventType === 'Task') {
      navigation.replace(Screen.CreateTaskScreen);
    } else if (eventType === 'Out of office') {
      navigation.replace(Screen.CreateOutOfOfficeScreen);
    } else if (eventType === 'Event') {
      // Stay on current screen
      return;
    }
    // Add navigation for other event types as needed
  };

  const handleRecurrenceSelect = (recurrence: string) => {
    if (recurrence === 'Custom...') {
      setShowRecurrenceDropdown(false);
      setShowCustomRecurrenceModal(true);
    } else {
      setSelectedRecurrence(recurrence);
      setShowRecurrenceDropdown(false);
    }
  };

  const handleCustomRecurrenceDone = () => {
    // Generate custom recurrence text based on settings
    const { repeatEvery, repeatUnit, repeatOn, endsType } = customRecurrence;
    let customText = `Every ${repeatEvery} ${repeatUnit.toLowerCase()}`;

    if (repeatUnit === 'Week' && repeatOn.length > 0) {
      customText += ` on ${repeatOn.join(', ')}`;
    }

    if (endsType === 'After') {
      customText += ` (${customRecurrence.endsAfter} times)`;
    } else if (endsType === 'On') {
      customText += ` (until ${customRecurrence.endsDate})`;
    }

    setSelectedRecurrence(customText);
    setShowCustomRecurrenceModal(false);
  };

  const handleTimezoneSelect = (timezoneId: string) => {
    setSelectedTimezone(timezoneId);
    setShowTimezoneModal(false);
    setTimezoneSearchQuery('');
  };

  const handleUseCurrentTimezone = () => {
    const currentTz = getCurrentTimezone();
    setSelectedTimezone(currentTz.id);
    setShowTimezoneModal(false);
    setTimezoneSearchQuery('');
  };

  const getSelectedTimezoneData = () => {
    return (
      timezones.find(tz => tz.id === selectedTimezone) || getCurrentTimezone()
    );
  };

  const getFilteredTimezones = () => {
    if (!timezoneSearchQuery) return timezones;
    return timezones.filter(
      tz =>
        tz.name.toLowerCase().includes(timezoneSearchQuery.toLowerCase()) ||
        tz.id.toLowerCase().includes(timezoneSearchQuery.toLowerCase()),
    );
  };

  const handleDayToggle = (day: string) => {
    setCustomRecurrence(prev => ({
      ...prev,
      repeatOn: prev.repeatOn.includes(day)
        ? prev.repeatOn.filter(d => d !== day)
        : [...prev.repeatOn, day],
    }));
  };

  const handleGuestSelect = (guestEmail: string) => {
    setSelectedGuests(prev => {
      const newSelection = prev.includes(guestEmail)
        ? prev.filter(email => email !== guestEmail)
        : [...prev, guestEmail];

      return newSelection;
    });
  };


  // Filter guests based on search query
  const filteredGuests = guestData.filter(
    (guest) =>
      guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const closeGuestDropdown = () => {
    setShowGuestDropdown(false);
  };

  // Validate date/time and set error message
  const validateDateTime = React.useCallback(() => {
    setDateTimeError('');

    if (!selectedStartDate || !selectedEndDate) {
      return; // Don't show error if dates aren't selected yet
    }

    if (isAllDayEvent) {
      // For all-day events, just validate dates
      const startDateTime = new Date(selectedStartDate);
      startDateTime.setHours(0, 0, 0, 0);
      const endDateTime = new Date(selectedEndDate);
      endDateTime.setHours(0, 0, 0, 0);

      if (endDateTime < startDateTime) {
        setDateTimeError('End date must be on or after start date');
        console.log('DEBUG - Setting all-day error:', 'End date must be on or after start date');
        return;
      }
    } else {
      // For timed events, validate both date and time
      if (!selectedStartTime || !selectedEndTime) {
        return; // Don't show error if times aren't selected yet
      }

      const startDateTime = new Date(selectedStartDate);
      const endDateTime = new Date(selectedEndDate);

      // Parse start time (handle non-breaking spaces)
      const normalizedStartTime = selectedStartTime.trim().replace(/\u00A0/g, ' ').replace(/\s+/g, ' ');
      const startTimeMatch = normalizedStartTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

      if (!startTimeMatch) {
        console.log('DEBUG - Invalid start time format:', normalizedStartTime);
        return; // Invalid format, but don't show error here
      }

      const startHours = parseInt(startTimeMatch[1], 10);
      const startMinutes = parseInt(startTimeMatch[2], 10);
      const startPeriod = startTimeMatch[3].toUpperCase();
      let finalStartHours = startHours;
      if (startPeriod === 'PM' && startHours !== 12) {
        finalStartHours = startHours + 12;
      } else if (startPeriod === 'AM' && startHours === 12) {
        finalStartHours = 0;
      }
      startDateTime.setHours(finalStartHours, startMinutes, 0, 0);

      // Parse end time (handle non-breaking spaces)
      const normalizedEndTime = selectedEndTime.trim().replace(/\u00A0/g, ' ').replace(/\s+/g, ' ');
      const endTimeMatch = normalizedEndTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

      if (!endTimeMatch) {
        console.log('DEBUG - Invalid end time format:', normalizedEndTime);
        return; // Invalid format, but don't show error here
      }

      const endHours = parseInt(endTimeMatch[1], 10);
      const endMinutes = parseInt(endTimeMatch[2], 10);
      const endPeriod = endTimeMatch[3].toUpperCase();
      let finalEndHours = endHours;
      if (endPeriod === 'PM' && endHours !== 12) {
        finalEndHours = endHours + 12;
      } else if (endPeriod === 'AM' && endHours === 12) {
        finalEndHours = 0;
      }
      endDateTime.setHours(finalEndHours, endMinutes, 0, 0);

      console.log('DEBUG - DateTime Validation:', {
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        startTime: selectedStartTime,
        endTime: selectedEndTime,
        isValid: endDateTime > startDateTime
      });

      // Validate that end date/time is strictly after start date/time
      if (endDateTime <= startDateTime) {
        // Check if it's a date issue or time issue
        const startDateOnly = new Date(selectedStartDate);
        startDateOnly.setHours(0, 0, 0, 0);
        const endDateOnly = new Date(selectedEndDate);
        endDateOnly.setHours(0, 0, 0, 0);

        let errorMessage = '';
        if (endDateOnly < startDateOnly) {
          errorMessage = 'End date must be on or after start date';
        } else if (endDateOnly.getTime() === startDateOnly.getTime()) {
          // Same date, but end time is before or equal to start time
          errorMessage = 'End time must be after start time';
        } else {
          errorMessage = 'End date and time must be after start date and time';
        }

        console.log('DEBUG - Setting error message:', errorMessage);
        setDateTimeError(errorMessage);
        return;
      }
    }
  }, [selectedStartDate, selectedEndDate, selectedStartTime, selectedEndTime, isAllDayEvent]);

  const handleDateTimeSelect = (date: Date, time: string) => {
    console.log('>>>>>>>> DATE SELECTED <<<<<<<<', {
      date: date.toISOString(),
      dateFormatted: date.toLocaleDateString(),
      time: time,
      timeStringified: JSON.stringify(time),
      mode: calendarMode
    });
    if (calendarMode === 'from') {
      setSelectedStartDate(date);
      setSelectedStartTime(time);
      setSelectedRecurrence("Does not repeat");
      // Clear errors when date/time is selected
      setStartDateError('');
      setStartTimeError('');
      setDateTimeError('');

      // If no end date is set, set it to the same date
      if (!selectedEndDate) {
        setSelectedEndDate(date);
      }

      // Always update end time to 30 minutes after start time when start time is selected
      if (time && time.trim() !== '') {
        const suggestedEndTime = addMinutesToTime(time, 30);
        console.log('>>>>>>>> CALCULATING END TIME IN handleDateTimeSelect <<<<<<<<', {
          startTime: time,
          calculatedEndTime: suggestedEndTime,
          previousEndTime: selectedEndTime
        });
        setSelectedEndTime(suggestedEndTime);
      } else {
        // If time is empty, clear end time too
        setSelectedEndTime('');
      }
    } else {
      setSelectedEndDate(date);
      setSelectedEndTime(time);
      // Clear errors when date/time is selected
      setEndDateError('');
      setEndTimeError('');
      setDateTimeError('');
    }

    // Show detailed date time section when start time is selected
    // The end time is automatically set when start time is selected, so we only need to check start time
    if (calendarMode === 'from' && date && time && time.trim() !== '') {
      // When start date and start time are selected, show the recurrence selector
      setShowDetailedDateTime(true);
    } else if (calendarMode === 'to' && selectedStartDate && selectedStartTime) {
      // When end time is selected (and start date/time already exist), also show it
      setShowDetailedDateTime(true);
    }

    // Validate immediately with new values (don't wait for state to update)
    const newStartDate = calendarMode === 'from' ? date : selectedStartDate;
    const newEndDate = calendarMode === 'to' ? date : (selectedEndDate || date);
    const newStartTime = calendarMode === 'from' ? time : selectedStartTime;
    let newEndTime = calendarMode === 'to' ? time : selectedEndTime;

    // If setting start time, calculate end time
    if (calendarMode === 'from' && time && time.trim() !== '') {
      newEndTime = addMinutesToTime(time, 30);
    }

    // Validate immediately
    setTimeout(() => {
      validateDateTimeWithValues(newStartDate, newEndDate, newStartTime || '', newEndTime || '');
    }, 0);
  };

  // Helper function to validate with specific values (for immediate validation)
  const validateDateTimeWithValues = (
    startDate: Date | null,
    endDate: Date | null,
    startTime: string,
    endTime: string
  ) => {
    setDateTimeError('');

    if (!startDate || !endDate) {
      return;
    }

    if (isAllDayEvent) {
      const startDateTime = new Date(startDate);
      startDateTime.setHours(0, 0, 0, 0);
      const endDateTime = new Date(endDate);
      endDateTime.setHours(0, 0, 0, 0);

      if (endDateTime < startDateTime) {
        setDateTimeError('End date must be on or after start date');
        return;
      }
    } else {
      if (!startTime || !endTime) {
        return;
      }

      const startDateTime = new Date(startDate);
      const endDateTime = new Date(endDate);

      // Parse start time
      const normalizedStartTime = startTime.trim().replace(/\u00A0/g, ' ').replace(/\s+/g, ' ');
      const startTimeMatch = normalizedStartTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

      if (!startTimeMatch) {
        return;
      }

      const startHours = parseInt(startTimeMatch[1], 10);
      const startMinutes = parseInt(startTimeMatch[2], 10);
      const startPeriod = startTimeMatch[3].toUpperCase();
      let finalStartHours = startHours;
      if (startPeriod === 'PM' && startHours !== 12) {
        finalStartHours = startHours + 12;
      } else if (startPeriod === 'AM' && startHours === 12) {
        finalStartHours = 0;
      }
      startDateTime.setHours(finalStartHours, startMinutes, 0, 0);

      // Parse end time
      const normalizedEndTime = endTime.trim().replace(/\u00A0/g, ' ').replace(/\s+/g, ' ');
      const endTimeMatch = normalizedEndTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

      if (!endTimeMatch) {
        return;
      }

      const endHours = parseInt(endTimeMatch[1], 10);
      const endMinutes = parseInt(endTimeMatch[2], 10);
      const endPeriod = endTimeMatch[3].toUpperCase();
      let finalEndHours = endHours;
      if (endPeriod === 'PM' && endHours !== 12) {
        finalEndHours = endHours + 12;
      } else if (endPeriod === 'AM' && endHours === 12) {
        finalEndHours = 0;
      }
      endDateTime.setHours(finalEndHours, endMinutes, 0, 0);

      // Validate that end date/time is strictly after start date/time
      if (endDateTime <= startDateTime) {
        const startDateOnly = new Date(startDate);
        startDateOnly.setHours(0, 0, 0, 0);
        const endDateOnly = new Date(endDate);
        endDateOnly.setHours(0, 0, 0, 0);

        let errorMessage = '';
        if (endDateOnly < startDateOnly) {
          errorMessage = 'End date must be on or after start date';
        } else if (endDateOnly.getTime() === startDateOnly.getTime()) {
          errorMessage = 'End time must be after start time';
        } else {
          errorMessage = 'End date and time must be after start date and time';
        }

        console.log('DEBUG - Setting error message immediately:', errorMessage);
        setDateTimeError(errorMessage);
        return;
      }
    }
  };


  const addMinutesToTime = (timeString: string, minutesToAdd: number): string => {
    // Validate input
    if (!timeString || timeString.trim() === '') {
      return '12:00 AM';
    }

    // Normalize the string: replace any non-breaking spaces or special spaces with regular space
    const normalized = timeString.trim().replace(/\u00A0/g, ' ').replace(/\s+/g, ' ');

    // Try to extract time and period using regex to handle various formats
    const timeMatch = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

    if (!timeMatch) {
      // Fallback: try to split by space
      const parts = normalized.split(/\s+/);
      if (parts.length >= 2) {
        const timePart = parts[0];
        const period = parts[parts.length - 1].toUpperCase();
        const [hours, minutes] = timePart.split(':').map(Number);

        if (!isNaN(hours) && !isNaN(minutes) && (period === 'AM' || period === 'PM')) {
          // Valid format found
          let hours24 = hours;
          if (period === 'PM' && hours < 12) {
            hours24 = hours + 12;
          } else if (period === 'AM' && hours === 12) {
            hours24 = 0;
          }

          let totalMinutes = hours24 * 60 + minutes + minutesToAdd;
          totalMinutes = totalMinutes % (24 * 60);
          const newHours24 = Math.floor(totalMinutes / 60);
          const newMinutes = totalMinutes % 60;
          let displayHours = newHours24 % 12;
          if (displayHours === 0) displayHours = 12;
          const newPeriod = newHours24 >= 12 ? 'PM' : 'AM';
          return `${displayHours}:${newMinutes.toString().padStart(2, '0')} ${newPeriod}`;
        }
      }
      return '12:00 AM';
    }

    // Extract from regex match
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const period = timeMatch[3].toUpperCase();

    // Convert 12-hour to 24-hour
    let hours24 = hours;
    if (period === 'PM' && hours < 12) {
      hours24 = hours + 12;
    } else if (period === 'AM' && hours === 12) {
      hours24 = 0;
    }

    // Total minutes
    let totalMinutes = hours24 * 60 + minutes + minutesToAdd;

    // Handle overflow past 24 hours
    totalMinutes = totalMinutes % (24 * 60);

    // Convert back to hours/minutes
    const newHours24 = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;

    // Convert back to 12-hour format
    let displayHours = newHours24 % 12;
    if (displayHours === 0) displayHours = 12;

    const newPeriod = newHours24 >= 12 ? 'PM' : 'AM';
    return `${displayHours}:${newMinutes.toString().padStart(2, '0')} ${newPeriod}`;
  };


  // Form validation
  const validateForm = () => {
    let isValid = true;
    let firstErrorField: 'title' | 'startDate' | 'startTime' | 'endDate' | 'endTime' | null = null;

    // Clear previous errors
    setTitleError('');
    setLocationError('');
    setStartDateError('');
    setStartTimeError('');
    setEndDateError('');
    setEndTimeError('');
    setDateTimeError('');

    // Validate title
    if (!title.trim()) {
      setTitleError('Title is required');
      isValid = false;
      if (!firstErrorField) firstErrorField = 'title';
    }

    // Validate start date
    if (!selectedStartDate) {
      setStartDateError('Start date is required');
      isValid = false;
      if (!firstErrorField) firstErrorField = 'startDate';
    }

    // Validate end date
    if (!selectedEndDate) {
      setEndDateError('End date is required');
      isValid = false;
      if (!firstErrorField) firstErrorField = 'endDate';
    }

    // Location is optional - no validation needed

    // ✅ Only validate times if NOT an all-day event
    if (!isAllDayEvent) {
      if (!selectedStartTime) {
        setStartTimeError('Start time is required');
        isValid = false;
        if (!firstErrorField) firstErrorField = 'startTime';
      }
      if (!selectedEndTime) {
        setEndTimeError('End time is required');
        isValid = false;
        if (!firstErrorField) firstErrorField = 'endTime';
      }

      // Validate that end date/time is after start date/time
      const startDateTime = new Date(selectedStartDate);
      const endDateTime = new Date(selectedEndDate);

      // Parse start time (handle non-breaking spaces)
      const normalizedStartTime = selectedStartTime.trim().replace(/\u00A0/g, ' ').replace(/\s+/g, ' ');
      const startTimeMatch = normalizedStartTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

      if (!startTimeMatch) {
        setStartTimeError('Invalid start time format');
        isValid = false;
      }

      const startHours = parseInt(startTimeMatch[1], 10);
      const startMinutes = parseInt(startTimeMatch[2], 10);
      const startPeriod = startTimeMatch[3].toUpperCase();
      let finalStartHours = startHours;
      if (startPeriod === 'PM' && startHours !== 12) {
        finalStartHours = startHours + 12;
      } else if (startPeriod === 'AM' && startHours === 12) {
        finalStartHours = 0;
      }
      startDateTime.setHours(finalStartHours, startMinutes, 0, 0);

      // Parse end time (handle non-breaking spaces)
      const normalizedEndTime = selectedEndTime.trim().replace(/\u00A0/g, ' ').replace(/\s+/g, ' ');
      const endTimeMatch = normalizedEndTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

      if (!endTimeMatch) {
        setEndTimeError('Invalid end time format');
        isValid = false;
      }

      const endHours = parseInt(endTimeMatch[1], 10);
      const endMinutes = parseInt(endTimeMatch[2], 10);
      const endPeriod = endTimeMatch[3].toUpperCase();
      let finalEndHours = endHours;
      if (endPeriod === 'PM' && endHours !== 12) {
        finalEndHours = endHours + 12;
      } else if (endPeriod === 'AM' && endHours === 12) {
        finalEndHours = 0;
      }
      endDateTime.setHours(finalEndHours, endMinutes, 0, 0);

      // Validate that end date/time is strictly after start date/time
      console.log('DEBUG - Date/Time Validation:', {
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        startTime: selectedStartTime,
        endTime: selectedEndTime,
        isValid: endDateTime > startDateTime
      });

      if (endDateTime <= startDateTime) {
        // Error is already shown inline, just return false
        return false;
      }
    } else {
      // ✅ For all-day events, just validate that end date is not before start date
      const startDateTime = new Date(selectedStartDate);
      startDateTime.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
      const endDateTime = new Date(selectedEndDate);
      endDateTime.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

      if (endDateTime < startDateTime) {
        setDateTimeError('End date must be on or after start date');
        isValid = false;
        if (!firstErrorField) firstErrorField = 'endDate';
      }
    }

    // Scroll to first error field if validation failed
    if (!isValid && firstErrorField && scrollViewRef.current) {
      // Wait for error messages to render, then scroll
      setTimeout(() => {
        const scrollToField = (ref: React.RefObject<View>) => {
          if (!ref.current || !scrollViewRef.current) {
            // Retry after a delay if refs aren't ready
            setTimeout(() => scrollToField(ref), 100);
            return;
          }

          try {
            // Use measureLayout which measures relative to the ScrollView
            ref.current.measureLayout(
              scrollViewRef.current as any,
              (x, y) => {
                if (scrollViewRef.current) {
                  scrollViewRef.current.scrollTo({
                    y: Math.max(0, y - 40),
                    animated: true
                  });
                }
              },
              (error) => {
                // If measureLayout fails, try UIManager approach
                const scrollViewHandle = findNodeHandle(scrollViewRef.current);
                const fieldHandle = findNodeHandle(ref.current);

                if (scrollViewHandle && fieldHandle) {
                  UIManager.measureLayout(
                    fieldHandle,
                    scrollViewHandle,
                    () => {
                      console.log('Failed to measure layout for scroll');
                    },
                    (x, y, width, height) => {
                      if (scrollViewRef.current) {
                        scrollViewRef.current.scrollTo({
                          y: Math.max(0, y - 40),
                          animated: true
                        });
                      }
                    }
                  );
                }
              }
            );
          } catch (error) {
            console.log('Error scrolling to field:', error);
          }
        };

        switch (firstErrorField) {
          case 'title':
            scrollToField(titleInputRef);
            break;
          case 'startDate':
          case 'startTime':
          case 'endDate':
          case 'endTime':
            scrollToField(dateTimeSectionRef);
            break;
        }
      }, 300);
    }

    if (!activeAccount) {
      // Authentication error - this is a system error, not a validation error
      // Keep the alert for this as it's not a field validation issue
      Alert.alert('Error', 'No active account found. Please log in again.');
      return false;
    }

    return isValid;
  };

  const handleEditEvent = async (eventData: any, activeAccount: any) => {
    try {
      // ✅ If Google Meet is selected and user is connected to Google
      if (eventData.locationType === 'google' && googleIntegration?.isConnected) {
        console.log('Updating Google Meet meeting...');

        const googleEvent = {
          summary: eventData.title,
          description: eventData.description,
          start: {
            dateTime: new Date(selectedStartDate).toISOString(),
            timeZone: 'UTC', // match web
          },
          end: {
            dateTime: new Date(selectedEndDate).toISOString(),
            timeZone: 'UTC',
          },
          attendees: [
            {
              email: activeAccount.userName,
              displayName: activeAccount.userName.split('@')[0] || 'Organizer',
              responseStatus: 'accepted',
            },
            ...(eventData.guests?.map((email) => ({
              email,
              displayName: email.split('@')[0],
              responseStatus: 'needsAction',
            })) || []),
          ],
          conferenceData: {
            createRequest: {
              requestId: `meet_${Date.now()}`,
            },
          },
        };

        // Add recurrence if exists
        if (eventData.recurrenceRule) {
          googleEvent.recurrence = [eventData.recurrenceRule];
        }

        // Wrap same as web code
        const payload = {
          eventDetails: googleEvent,
          user_name: activeAccount.userName,
          eventId: eventData.meetingEventId, // must match backend parameter
        };

        console.log('Google Event Update Payload:', payload);

        try {
          // ✅ Direct backend call for updating Google Meet event
          const response = await api('POST', '/google/update-event', {
            eventDetails: payload,
            user_name: payload.user_name,
            eventId: payload.eventId
          });
          const data = response?.data?.data || response?.data;

          if (data?.hangoutLink) {
            console.log('✅ Google Meet updated via backend:', data.hangoutLink);
            eventData.location = data.hangoutLink;
            eventData.meetingEventId = data.id;
          } else {
            console.error('❌ Failed to update Google Meet via backend:', data);
            Alert.alert('Error', 'Failed to update Google Meet');
          }
        } catch (err) {
          console.error('❌ Google Meet update error via backend:', err);
          Alert.alert('Error', 'Failed to update Google Meet');
        }
      }

      console.log('Editing event payload:', eventData);

      const blockchainService = new BlockchainService(NECJSPRIVATE_KEY);
      const response = await blockchainService.updateEvent(
        eventData,
        activeAccount,
        token,
      );

      if (response) {
        const repeatEvents = (eventData?.list || [])
          .filter((data: any) => data.key === 'repeatEvent')
          .map((data: any) => data.value)
          .filter((value: any) => value !== null);
        const customRepeat = (eventData?.list || [])
          .filter((data: any) => data.key === 'customRepeatEvent')
          .map((data: any) => data.value)
          .filter((value: any) => value !== null);
        const meetingEventIdValue =
          (eventData?.list || []).find((i: any) => i.key === 'meetingEventId')?.value || '';

        const updatePayload = {
          events: [
            {
              uid: eventData?.uid,
              fromTime: eventData?.fromTime,
              toTime: eventData?.toTime,
              repeatEvent: repeatEvents.length ? `${repeatEvents}` : '',
              customRepeatEvent: customRepeat.length ? `${customRepeat}` : '',
              meetingEventId: meetingEventIdValue,
            },
          ],
          active: activeAccount?.userName,
          type: 'update',
        };

        const apiResponse = await api('POST', '/updateevents', updatePayload);
        console.log('API response data (edit):', apiResponse.data);

        await getUserEvents(activeAccount.userName, api);

        navigation.goBack();
        Alert.alert('Event Updated', 'Event Updated Successfully');
      } else {
        Alert.alert('Event Update Failed', 'Failed to Update Event');
      }
    } catch (error) {
      console.error('❌ Error in handleEditEvent:', error);
      Alert.alert('Error', 'Failed to Update Event');
    }
  };


  const handleCreateEvent = async (eventData: any, activeAccount: any) => {
    try {
      // If Google Meet is selected
      if (eventData.locationType === 'google' && googleIntegration?.isConnected) {
        console.log('Creating Google Meet meeting...');

        const googleEvent = {
          summary: eventData.title,
          description: eventData.description,
          start: {
            dateTime: new Date(selectedStartDate).toISOString(),
            timeZone: 'UTC', // match web code
          },
          end: {
            dateTime: new Date(selectedEndDate).toISOString(),
            timeZone: 'UTC',
          },
          attendees: [
            {
              email: activeAccount.userName, // organizer / current user
              displayName: activeAccount.userName.split('@')[0] || 'Organizer',
              responseStatus: 'accepted',
            },
            ...(eventData.guests?.map((email) => ({
              email,
              displayName: email.split('@')[0],
              responseStatus: 'needsAction', // default for guests
            })) || []),
          ],
          conferenceData: {
            createRequest: {
              requestId: `meet_${Date.now()}`,
            },
          },
        };

        // Add recurrence if exists
        if (eventData.recurrenceRule) {
          googleEvent.recurrence = [eventData.recurrenceRule];
        }

        // Wrap in the same structure as web
        const payload = {
          user_name: activeAccount.userName,
          eventDetails: googleEvent,
        };

        console.log('Google Event Payload:', googleEvent);
        try {
          // ✅ Call backend API directly
          const response = await api('POST', '/google/create-event', payload);

          // ✅ Many Axios wrappers put backend data inside `response.data.data`
          const data = response?.data?.data || response?.data;

          if (data?.hangoutLink) {
            console.log('✅ Google Meet created via backend:', data.hangoutLink);
            eventData.location = data.hangoutLink;
            eventData.meetingEventId = data.id;
          } else {
            console.error('❌ Failed to create Google Meet via backend:', data);
            Alert.alert('Error', 'Failed to create Google Meet');
          }

        } catch (err) {
          console.error('❌ Google Meet creation error via backend:', err);
          Alert.alert('Error', 'Failed to create Google Meet');
        }
      }


      console.log("Active account: ", activeAccount.userName);
      console.log("Create event payload: ", eventData);
      const blockchainService = new BlockchainService(NECJSPRIVATE_KEY);
      const response = await blockchainService.createEvent(
        eventData,
        activeAccount,
        token,
      );
      if (response) {
        // Build updatePayload similar to handleEditEvent
        const repeatEvents = (eventData?.list || [])
          .filter((data: any) => data.key === "repeatEvent")
          .map((data: any) => data.value)
          .filter((value: any) => value !== null);
        const customRepeat = (eventData?.list || [])
          .filter((data: any) => data.key === "customRepeatEvent")
          .map((data: any) => data.value)
          .filter((value: any) => value !== null);
        const meetingEventIdValue = (eventData?.list || [])
          .find((i: any) => i.key === 'meetingEventId')?.value || '';

        const updatePayload = {
          events: [{
            uid: eventData?.uid,
            fromTime: eventData?.fromTime,
            toTime: eventData?.toTime,
            repeatEvent: repeatEvents.length ? `${repeatEvents}` : '',
            customRepeatEvent: customRepeat.length ? `${customRepeat}` : '',
            meetingEventId: meetingEventIdValue
          }],
          active: activeAccount?.userName,
          type: 'update',
        };
        // Call the same API as edit
        const apiResponse = await api('POST', '/updateevents', updatePayload);
        console.log('API response data (create):', apiResponse.data);

        await getUserEvents(activeAccount.userName, api);

        navigation.goBack();

        Alert.alert('Event created', 'Event Created Successfully');
      } else {
        Alert.alert('Event Creation Failed', 'Failed to Create Event');
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to Create Event');
    }
  };

  const handleSaveEvent = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    // const storedAccount = await AsyncStorage.getItem('currentAccount');
    // const storedToken = await AsyncStorage.getItem('token');

    if (!activeAccount || !token) {
      Alert.alert('Error', 'Authentication data not found');
      setIsLoading(false);
      return;
    }

    try {
      // Convert date and time to timestamp format (YYYYMMDDTHHMMSS)
      const formatToISO8601Local = (date: Date, time: string, isAllDay: boolean = false
      ): string => {
        console.log('DEBUG - Input date:', date);
        console.log('DEBUG - Input time:', time);

        // Validate inputs
        if (!date || !time) {
          console.error('DEBUG - Invalid inputs:', { date, time });
          return '';
        }

        if (isAllDay) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const result = `${year}${month}${day}T000000`;
          console.log('DEBUG - All-day format result:', result);
          return result;
        }

        // For timed events, time is required
        if (!time) {
          console.error('DEBUG - Time required for non-all-day event');
          return '';
        }
        // Handle AM/PM format properly - normalize whitespace first (including non-breaking spaces)
        const normalizedTime = time.trim().replace(/\u00A0/g, ' ').replace(/\s+/g, ' ');
        console.log('DEBUG - Original time:', JSON.stringify(time));
        console.log('DEBUG - Normalized time:', JSON.stringify(normalizedTime));

        // Use regex to extract time components (more robust than split)
        const timeMatch = normalizedTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

        if (!timeMatch) {
          // Fallback: try splitting by whitespace
          const timeParts = normalizedTime.split(/\s+/);
          console.log('DEBUG - Split result (fallback):', timeParts);

          if (timeParts.length < 2) {
            console.error('DEBUG - Time format should be "HH:MM AM/PM", got:', normalizedTime);
            return '';
          }

          const timePart = timeParts[0];
          const period = timeParts[timeParts.length - 1].toUpperCase();
          console.log('DEBUG - timePart:', timePart, 'period:', period);

          if (!timePart || !period || (period !== 'AM' && period !== 'PM')) {
            console.error('DEBUG - Invalid time format:', time);
            return '';
          }

          const [hours, minutes] = timePart.split(':').map(Number);
          console.log('DEBUG - hours:', hours, 'minutes:', minutes);

          if (isNaN(hours) || isNaN(minutes)) {
            console.error('DEBUG - Invalid hours/minutes:', { hours, minutes });
            return '';
          }

          // Use the parsed values
          let finalHours = hours;
          if (period === 'PM' && hours !== 12) {
            finalHours = hours + 12;
          } else if (period === 'AM' && hours === 12) {
            finalHours = 0;
          }

          console.log('DEBUG - finalHours:', finalHours);

          const newDate = new Date(date);
          newDate.setHours(finalHours, minutes, 0, 0);

          console.log('DEBUG - newDate after setHours:', newDate);

          // Format as YYYYMMDDTHHMMSS
          const year = newDate.getFullYear();
          const month = String(newDate.getMonth() + 1).padStart(2, '0');
          const day = String(newDate.getDate()).padStart(2, '0');
          const hour = String(newDate.getHours()).padStart(2, '0');
          const minute = String(newDate.getMinutes()).padStart(2, '0');
          const second = String(newDate.getSeconds()).padStart(2, '0');

          const result = `${year}${month}${day}T${hour}${minute}${second}`;
          console.log('DEBUG - Final result (fallback):', result);

          // Validate the result
          if (result.includes('NaN') || result.length !== 15) {
            console.error('DEBUG - Invalid result generated:', result);
            return '';
          }

          return result;
        }

        // Extract from regex match
        const hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const period = timeMatch[3].toUpperCase();
        console.log('DEBUG - Regex match - hours:', hours, 'minutes:', minutes, 'period:', period);

        let finalHours = hours;

        // Convert to 24-hour format
        if (period === 'PM' && hours !== 12) {
          finalHours = hours + 12;
        } else if (period === 'AM' && hours === 12) {
          finalHours = 0;
        }

        console.log('DEBUG - finalHours:', finalHours);

        const newDate = new Date(date);
        newDate.setHours(finalHours, minutes, 0, 0);

        console.log('DEBUG - newDate after setHours:', newDate);

        // Format as YYYYMMDDTHHMMSS
        const year = newDate.getFullYear();
        const month = String(newDate.getMonth() + 1).padStart(2, '0');
        const day = String(newDate.getDate()).padStart(2, '0');
        const hour = String(newDate.getHours()).padStart(2, '0');
        const minute = String(newDate.getMinutes()).padStart(2, '0');
        const second = String(newDate.getSeconds()).padStart(2, '0');

        const result = `${year}${month}${day}T${hour}${minute}${second}`;
        console.log('DEBUG - Final result:', result);

        // Validate the result
        if (result.includes('NaN') || result.length !== 15) {
          console.error('DEBUG - Invalid result generated:', result);
          return '';
        }

        return result;
      };

      const getNextDay = (date: Date): Date => {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        return nextDay;
      };

      console.log('CreateEventScreen: Event data ==>', editEventData);

      // Helper function to convert a value to seconds based on unit
      function convertToSeconds(value: number, unit: string) {
        switch (unit) {
          case 'Minutes':
            return value * 60;
          case 'Hours':
            return value * 3600;
          case 'Days':
            return value * 86400;
          case 'Weeks':
            return value * 604800;
          default:
            return value; // fallback, assume already in seconds
        }
      }

      // Creating your event object
      const numericValue = parseInt(notificationMinutes || '0', 10);

      const secondsValue = convertToSeconds(numericValue, selectedTimeUnit);

      const triggerISO = (() => {
        switch (selectedTimeUnit) {
          case 'Minutes':
            return `PT${numericValue}M`;
          case 'Hours':
            return `PT${numericValue}H`;
          case 'Days':
            return `P${numericValue}D`;
          case 'Weeks':
            return `P${numericValue}W`;
          default:
            return `PT${numericValue}S`; // fallback to seconds
        }
      })();
      // Prepare event data in the new format
      const eventData = {
        uuid: editEventData?.uuid || '', // Keep uuid if editing
        uid: editEventData?.id || editEventData?.uid || generateEventUID(), // Generate UID using the utility method
        title: title.trim(),
        description: description.trim(),
        fromTime: formatToISO8601Local(
          selectedStartDate,
          selectedStartTime || '12:00 AM',  // Use midnight if no time
          isAllDayEvent
        ),
        toTime: formatToISO8601Local(
          isAllDayEvent ? getNextDay(selectedEndDate) : selectedEndDate,  // ✅ Add 1 day for all-day
          selectedEndTime || '12:00 AM',  // Use midnight if no time
          isAllDayEvent
        ),
        organizer:
          activeAccount?.email ||
          activeAccount?.userName ||
          activeAccount?.address ||
          '',
        guests: selectedGuests,
        location: location.trim(),
        locationType: selectedVideoConferencing,
        meetingEventId: meetingEventId || '',
        busy: selectedStatus || 'Busy',
        visibility: selectedVisibility || 'Default Visibility',
        notification: selectedNotificationType,
        seconds: secondsValue,
        trigger: triggerISO,
        guest_permission: selectedPermission || 'Modify event',
        timezone: selectedTimezone || 'UTC',
        repeatEvent:
          selectedRecurrence !== 'Does not repeat'
            ? selectedRecurrence
            : undefined,
        customRepeatEvent: undefined,
        list: [],
      };




      console.log('>>>>>>>> START DATE/TIME <<<<<<<<', {
        startDate: selectedStartDate?.toISOString(),
        startDateFormatted: selectedStartDate?.toLocaleDateString(),
        startTime: selectedStartTime
      });
      console.log('>>>>>>>> END DATE/TIME <<<<<<<<', {
        endDate: selectedEndDate?.toISOString(),
        endDateFormatted: selectedEndDate?.toLocaleDateString(),
        endTime: selectedEndTime
      });
      console.log('>>>>>>>> EDIT EVENT DATA <<<<<<<<', eventData);
      // return;
      if (mode == 'edit') {
        await handleEditEvent(eventData, activeAccount);
        return;
      } else {
        await handleCreateEvent(eventData, activeAccount);
      }
    } catch (error: any) {
      console.error('Error creating event:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to create event. Please try again.',
      );
    } finally {
      setIsLoading(false);
      return;
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Invisible overlay to close dropdowns when clicking outside */}
      {(showEventTypeDropdown || showGuestDropdown) && (
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowEventTypeDropdown(false);
            closeGuestDropdown();
          }}
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {mode === 'edit' ? 'Edit ' : 'Create '}
          </Text>
          <TouchableOpacity
            style={styles.eventTypeContainer}
            onPress={() => {
              if (!isLoading) {
                setShowEventTypeDropdown(!showEventTypeDropdown);
              }
            }}
            disabled={isLoading}
          >
            <GradientText
              style={styles.eventTypeText}
              colors={[Colors.primaryGreen, Colors.primaryblue]}
            >
              {selectedEventType}
            </GradientText>
            <Image
              style={styles.arrowDropdown}
              source={require('../assets/images/CreateEventImages/arrowDropdown.png')}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Event Type Dropdown */}
      {showEventTypeDropdown && (
        <View style={styles.eventTypeDropdown}>
          {eventTypes.map(eventType => (
            <TouchableOpacity
              key={eventType.id}
              style={styles.eventTypeItem}
              onPress={() => {
                if (!isLoading) {
                  handleEventTypeSelect(eventType.name);
                }
              }}
              disabled={isLoading}
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
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Input */}
        <View
          ref={titleInputRef}
          style={styles.inputSection}
          collapsable={false}
        >
          <TextInput
            style={styles.titleInput}
            placeholder="Add title"
            placeholderTextColor={colors.grey400}
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (titleError) setTitleError('');
            }}
            editable={!isLoading}
          />
          <View style={styles.inputUnderline} />
          {titleError ? (
            <Text style={styles.fieldErrorText}>{titleError}</Text>
          ) : null}
        </View>

        {/* Pick date and time */}
        <View
          ref={dateTimeSectionRef}
          style={styles.dateTimeSection}
          collapsable={false}
        >
          <View style={styles.dateTimeDisplay}>
            <Text style={styles.dateTimeLabel}>Date & Time</Text>
            <View style={styles.dateTimeRow}>
              <View style={styles.timeSlotContainer}>
                <TouchableOpacity
                  style={styles.timeSlot}
                  onPress={() => {
                    if (!isLoading) {
                      setCalendarMode('from');
                      setShowCalendarModal(true);
                    }
                  }}
                  disabled={isLoading}
                >
                  <Text style={styles.timeSlotLabel}>From</Text>
                  <Text style={styles.timeSlotValue}>
                    {selectedStartDate ? (
                      isAllDayEvent ? (
                        // ✅ All-day: Show only date
                        selectedStartDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })
                      ) : selectedStartTime ? (
                        // ✅ Timed: Show date and time
                        `${selectedStartDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })} ${selectedStartTime}`
                      ) : (
                        'Select start time'
                      )
                    ) : (
                      'Select start date'
                    )}
                  </Text>
                </TouchableOpacity>
                {(startDateError || startTimeError) && (
                  <Text style={styles.fieldErrorText}>
                    {startDateError || startTimeError}
                  </Text>
                )}
              </View>

              <View style={styles.timeSlotContainer}>
                <TouchableOpacity
                  style={styles.timeSlot}
                  onPress={() => {
                    if (!isLoading) {
                      setCalendarMode('to');
                      setShowCalendarModal(true);
                    }
                  }}
                  disabled={isLoading}
                >
                  <Text style={styles.timeSlotLabel}>To</Text>
                  <Text style={styles.timeSlotValue}>
                    {selectedEndDate ? (
                      isAllDayEvent ? (
                        // ✅ All-day: Show only date
                        selectedEndDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })
                      ) : selectedEndTime ? (
                        // ✅ Timed: Show date and time
                        `${selectedEndDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })} ${selectedEndTime}`
                      ) : (
                        'Select end time'
                      )
                    ) : (
                      'Select end date'
                    )}
                  </Text>
                </TouchableOpacity>
                {(endDateError || endTimeError) && (
                  <Text style={styles.fieldErrorText}>
                    {endDateError || endTimeError}
                  </Text>
                )}
              </View>
            </View>
            {/* Date/Time relationship validation error - shown below both fields */}
            {dateTimeError && (
              <View style={styles.dateTimeErrorContainer}>
                <Text style={styles.dateTimeErrorText}>{dateTimeError}</Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.allDayToggle}
          onPress={() => {
            if (isLoading) return;
            const newIsAllDay = !isAllDayEvent;
            setIsAllDayEvent(newIsAllDay);

            if (newIsAllDay) {
              // ✅ When switching TO all-day:
              setSelectedStartTime('');
              setSelectedEndTime('');

              if (selectedStartDate) {
                // Important: Create a new Date object to avoid modifying the start date state directly.
                setSelectedEndDate(new Date(selectedStartDate.getTime()));
              } else {
                // Optional: If no start date is set, set both to today/default
                const today = new Date();
                setSelectedStartDate(today);
                setSelectedEndDate(today);
              }

            } else {
              // ✅ When switching FROM all-day, clear times so user must select
              setSelectedStartTime('');
              setSelectedEndTime('');
            }
          }}
          disabled={isLoading}
        >
          <View style={[
            styles.checkbox,
            isAllDayEvent && styles.checkboxSelected
          ]}>
            {isAllDayEvent && (
              <FeatherIcon name="check" size={14} color="white" />
            )}
          </View>
          <Text style={styles.allDayText}>All-day event</Text>
        </TouchableOpacity>

        {/* Timezone Tag */}
        <TouchableOpacity
          style={styles.timezoneTag}
          onPress={() => {
            if (!isLoading) {
              setShowTimezoneModal(true);
            }
          }}
          disabled={isLoading}
        >
          <Text style={styles.timezoneTagText}>
            {getSelectedTimezoneData().name}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Recurrence Dropdown - Only show when date and time are selected */}
        {showDetailedDateTime && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: spacing.md,
            }}
          >
            <FeatherIcon name="repeat" size={20} color="#6C6C6C" />
            <TouchableOpacity
              style={styles.recurrenceContainer}
              onPress={() => {
                if (!isLoading) {
                  setShowRecurrenceDropdown(!showRecurrenceDropdown);
                }
              }}
              disabled={isLoading}
            >
              <Text style={styles.selectorText}>{selectedRecurrence}</Text>
              <Image
                style={{ marginLeft: scaleWidth(10) }}
                source={require('../assets/images/CreateEventImages/smallArrowDropdown.png')}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Recurrence Dropdown */}
        {showRecurrenceDropdown && (
          <>
            {/* Overlay to close recurrence dropdown when clicking outside */}
            <TouchableOpacity
              style={styles.recurrenceOverlay}
              activeOpacity={1}
              onPress={() => setShowRecurrenceDropdown(false)}
            />
            <View style={styles.recurrenceDropdown}>
              <ScrollView
                style={styles.recurrenceDropdownScroll}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                {recurrenceOptions.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.recurrenceItem,
                      selectedRecurrence === option &&
                      styles.recurrenceItemSelected,
                    ]}
                    onPress={() => {
                      if (!isLoading) {
                        handleRecurrenceSelect(option);
                      }
                    }}
                    disabled={isLoading}
                  >
                    <Text
                      style={[
                        styles.recurrenceItemText,
                        selectedRecurrence === option &&
                        styles.recurrenceItemTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                    {selectedRecurrence === option && (
                      <LinearGradient
                        colors={['#18F06E', '#0B6DE0']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.recurrenceCheckmark}
                      >
                        <FeatherIcon name="check" size={12} color="white" />
                      </LinearGradient>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        )}

        {showDetailedDateTime && <View style={styles.divider} />}

        {/* Guest Selector */}
        <GuestSelector
          isVisible={showGuestDropdown}
          selectedGuests={selectedGuests}
          onGuestSelect={handleGuestSelect}
          onToggleDropdown={() => {
            if (!isLoading) {
              setShowGuestDropdown(!showGuestDropdown);
            }
          }}
          showGuestModal={showGuestModal}
          onToggleGuestModal={() => {
            if (!isLoading) {
              setShowGuestModal(!showGuestModal);
            }
          }}
          searchQuery={guestSearchQuery}
          onSearchQueryChange={setGuestSearchQuery}
          disabled={isLoading}
        />

        <View style={styles.divider} />

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onPress={() => {
              if (!isLoading) {
                setShowVideoConferencingOptions(!showVideoConferencingOptions);
              }
            }}
            disabled={isLoading}
          >
            <Text style={styles.selectorText}>Add video conferencing</Text>
            <Image
              style={{
                marginLeft: scaleWidth(5),
                height: scaleHeight(12.87),
                width: scaleWidth(12.87),
              }}
              source={require('../assets/images/addIcon.png')}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Video Conferencing Options */}
        {showVideoConferencingOptions && (
          <View style={styles.videoConferencingOptions}>
            <TouchableOpacity
              style={[
                styles.videoConferencingButton,
                selectedVideoConferencing === 'inperson' &&
                styles.videoConferencingButtonSelected,
              ]}
              onPress={() => {
                if (!isLoading) {
                  setSelectedVideoConferencing(
                    selectedVideoConferencing === 'inperson' ? null : 'inperson'
                  );
                }
              }}
              disabled={isLoading}
            >
              <View style={styles.videoConferencingIconContainer}>
                <FeatherIcon name="map-pin" size={16} color="#6C6C6C" />
              </View>
              <Text
                style={[
                  styles.videoConferencingButtonText,
                  selectedVideoConferencing === 'inperson' &&
                  styles.videoConferencingButtonTextSelected,
                ]}
              >
                In-person
              </Text>
            </TouchableOpacity>
            {/* 
            <TouchableOpacity
              style={[
                styles.videoConferencingButton,
                selectedVideoConferencing === 'zoom' &&
                styles.videoConferencingButtonSelected,
              ]}
              onPress={() => setSelectedVideoConferencing('zoom')}
            >
              <View style={styles.videoConferencingIconContainer}>
                <FeatherIcon name="video" size={16} color="#0B6DE0" />
              </View>
              <Text
                style={[
                  styles.videoConferencingButtonText,
                  selectedVideoConferencing === 'zoom' &&
                  styles.videoConferencingButtonTextSelected,
                ]}
              >
                Zoom
              </Text>
            </TouchableOpacity> */}

            <TouchableOpacity
              style={[
                styles.videoConferencingButton,
                selectedVideoConferencing === 'google' &&
                styles.videoConferencingButtonSelected,
              ]}
              onPress={() => {
                if (!isLoading) {
                  handleGoogleMeetClick();
                }
              }}
              disabled={isLoading}
            >
              <View style={styles.videoConferencingIconContainer}>
                <FeatherIcon name="video" size={16} color="#34A853" />
              </View>
              <Text
                style={[
                  styles.videoConferencingButtonText,
                  selectedVideoConferencing === 'google' &&
                  styles.videoConferencingButtonTextSelected,
                ]}
              >
                Google Meet
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Add location */}
        <View
          ref={locationSectionRef}
          collapsable={false}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: spacing.lg,
            }}
          >
            <FeatherIcon name="map-pin" size={20} color="#6C6C6C" />

            <TouchableOpacity
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
              onPress={handleOpenLocationModal}
              activeOpacity={1}
              disabled={isLoading}
            >
              <TextInput
                style={[
                  styles.selectorText,
                  { flex: 1, marginHorizontal: spacing.sm },
                ]}
                placeholder="Add location"
                placeholderTextColor={colors.grey400}
                value={location}
                onFocus={handleOpenLocationModal}
                editable={false}
                pointerEvents="none"
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleOpenLocationModal}>
              <Image
                style={{
                  marginLeft: scaleWidth(10),
                  height: scaleHeight(12.87),
                  width: scaleWidth(12.87),
                }}
                source={require('../assets/images/addIcon.png')}
              />
            </TouchableOpacity>
          </View>
          {locationError ? (
            <Text style={styles.fieldErrorText}>{locationError}</Text>
          ) : null}
        </View>



        {/* Add Notification time */}
        {/* <View style={styles.notificationRow}>
          <FeatherIcon name="bell" size={20} color="#6C6C6C" />
          <Text style={styles.selectorText}>Add Notification time</Text>

          <View style={styles.notificationInputContainer}>
            <TextInput
              style={styles.notificationInput}
              value={notificationMinutes}
              onChangeText={
                text => setNotificationMinutes(text.replace(/[^0-9]/g, '')) // only digits
              }
              keyboardType="numeric"
              placeholder="10"
              placeholderTextColor="#9E9E9E"
              maxLength={3}
              scrollEnabled={false}
              multiline={false}
            />
            <View style={styles.timeUnitDropdown}>
              <Text style={styles.timeUnitText}>minutes</Text>
              <FeatherIcon name="chevron-down" size={14} color="#130F26" />
            </View>
          </View>
        </View> */}

        <View style={styles.divider} />

        {/* Advanced Options - Only show when expanded */}
        {showAdvanced && (
          <AdvancedOptions
            notificationMinutes={parseInt(notificationMinutes) || 0}
            onNotificationMinutesChange={minutes =>
              setNotificationMinutes(minutes.toString())
            }
            selectedTimeUnit={selectedTimeUnit}
            onTimeUnitChange={setSelectedTimeUnit}
            selectedNotificationType={selectedNotificationType}
            onNotificationTypeChange={setSelectedNotificationType}
            onAddNotification={() => {
              // Handle add notification
              console.log('Add notification pressed');
            }}
            organizerName="Farhanur Rahman"
            onOrganizerPress={() => {
              // Handle organizer selection
              console.log('Organizer pressed');
            }}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            selectedVisibility={selectedVisibility}
            onVisibilityChange={setSelectedVisibility}
            onStatusPress={() => {
              // Handle status selection
              console.log('Status pressed');
            }}
            onVisibilityPress={() => {
              // Handle visibility selection
              console.log('Visibility pressed');
            }}
          />
        )}

        {/* Add description */}
        <View style={styles.descriptionContainer}>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Add description"
            placeholderTextColor={colors.grey400}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            editable={!isLoading}
          />
        </View>

        {/* Bottom Action Bar */}
        <View style={styles.bottomActionBar}>
          <TouchableOpacity
            style={styles.advanceOptionsButton}
            onPress={() => {
              if (!isLoading) {
                setShowAdvanced(!showAdvanced);
              }
            }}
            disabled={isLoading}
          >
            <Text style={styles.advanceOptionsText}>Advanced options</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSaveEvent}
            disabled={isLoading}
          >
            <LinearGradient
              colors={
                isLoading ? ['#CCCCCC', '#AAAAAA'] : ['#18F06E', '#0B6DE0']
              }
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.gradient}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Saving...' : 'Save'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>


      {/* Calendar with Time Modal */}
      <CalendarWithTime
        isVisible={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        onDateTimeSelect={handleDateTimeSelect}
        mode={calendarMode}
        selectedDate={calendarMode === 'from' ? selectedStartDate || undefined : selectedEndDate || undefined}
        selectedTime={calendarMode === 'from' ? selectedStartTime : selectedEndTime}
      />

      {/* Timezone Selection Modal */}
      <Modal
        visible={showTimezoneModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTimezoneModal(false)}
      >
        <View style={styles.timezoneModalOverlay}>
          <View style={styles.timezoneModal}>
            {/* Modal Header */}
            <View style={styles.timezoneModalHeader}>
              <Text style={styles.timezoneModalTitle}>Event time zone</Text>
              <TouchableOpacity
                style={styles.timezoneModalCloseButton}
                onPress={() => setShowTimezoneModal(false)}
              >
                <Text style={styles.timezoneModalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Current Timezone Display */}
            <View style={styles.currentTimezoneContainer}>
              <TextInput
                style={styles.currentTimezoneInput}
                value={getSelectedTimezoneData().name}
                editable={false}
              />
            </View>

            {/* Timezone List */}
            <FlatList
              data={getFilteredTimezones()}
              keyExtractor={item => item.id}
              style={styles.timezoneList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.timezoneItem,
                    selectedTimezone === item.id && styles.timezoneItemSelected,
                  ]}
                  onPress={() => handleTimezoneSelect(item.id)}
                >
                  <Text
                    style={[
                      styles.timezoneItemText,
                      selectedTimezone === item.id &&
                      styles.timezoneItemTextSelected,
                    ]}
                  >
                    ({item.offset}) {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />

            {/* Modal Footer */}
            <View style={styles.timezoneModalFooter}>
              <TouchableOpacity
                style={styles.timezoneModalButton}
                onPress={handleUseCurrentTimezone}
              >
                <Text style={styles.timezoneModalButtonText}>
                  Use current time zone
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timezoneModalButton}
                onPress={() => setShowTimezoneModal(false)}
              >
                <Text style={styles.timezoneModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timezoneModalOkButton}
                onPress={() => setShowTimezoneModal(false)}
              >
                <LinearGradient
                  colors={['#18F06E', '#0B6DE0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.timezoneModalOkGradient}
                >
                  <Text style={styles.timezoneModalOkText}>Ok</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Recurrence Modal */}
      <Modal
        visible={showCustomRecurrenceModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCustomRecurrenceModal(false)}
      >
        <View style={styles.customModalOverlay}>
          <View style={styles.customRecurrenceModalContainer}>
            {/* Modal Header */}
            <View style={styles.customModalHeader}>
              <Text style={styles.customModalTitle}>Custom recurrence</Text>
            </View>
            <ScrollView
              style={{ flexGrow: 0 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: spacing.lg }}
            >
              <View style={styles.customRecurrenceContent}>
                {/* Repeat every section */}
                <View style={styles.customRecurrenceSection}>
                  <Text style={styles.customRecurrenceSectionTitle}>
                    Repeat every
                  </Text>
                  <View style={styles.customRepeatEveryRow}>
                    <TextInput
                      style={styles.customRepeatEveryInput}
                      value={customRecurrence.repeatEvery}
                      onChangeText={text =>
                        setCustomRecurrence(prev => ({
                          ...prev,
                          repeatEvery: text,
                        }))
                      }
                      keyboardType="numeric"
                      maxLength={2}
                    />
                    <TouchableOpacity
                      style={styles.customRepeatUnitDropdown}
                      onPress={() => setShowUnitDropdown(prev => !prev)}
                    >
                      <Text style={styles.customRepeatUnitText}>
                        {customRecurrence.repeatUnit}
                      </Text>
                      <FeatherIcon
                        name="chevron-down"
                        size={14}
                        color="#6C6C6C"
                        style={{ paddingTop: 3 }}
                      />
                    </TouchableOpacity>
                  </View>
                </View>



                {/* Repeat on section */}
                {customRecurrence.repeatUnit === repeatUnits[1] && (
                  <View style={styles.customRecurrenceSection}>
                    <Text style={styles.customRecurrenceSectionTitle}>
                      Repeat on
                    </Text>
                    <ScrollView horizontal={true}
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ alignItems: 'center' }}
                    >
                      <View style={styles.customDaysRow}>
                        {dayAbbreviations.map((day, index) => (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.customDayButton,
                              customRecurrence.repeatOn.includes(dayNames[index]) &&
                              styles.customDayButtonSelected,
                            ]}
                            onPress={() => handleDayToggle(dayNames[index])}
                          >
                            <Text
                              style={[
                                styles.customDayButtonText,
                                customRecurrence.repeatOn.includes(
                                  dayNames[index],
                                ) && styles.customDayButtonTextSelected,
                              ]}
                            >
                              {day}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}

                {/* Ends section */}
                <View style={styles.customRecurrenceSection}>
                  <Text style={styles.customRecurrenceSectionTitle}>Ends</Text>

                  <TouchableOpacity
                    style={styles.customEndsOption}
                    onPress={() =>
                      setCustomRecurrence(prev => ({
                        ...prev,
                        endsType: endsOptions[0],
                      }))
                    }
                  >
                    <View style={styles.customRadioButton}>
                      {customRecurrence.endsType === endsOptions[0] && (
                        <View style={styles.customRadioButtonSelected} />
                      )}
                    </View>
                    <Text style={styles.customEndsOptionText}>
                      {endsOptions[0]}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.customEndsOption}
                    onPress={() =>
                      setCustomRecurrence(prev => ({
                        ...prev,
                        endsType: endsOptions[1],
                      }))
                    }
                  >
                    <View style={styles.customRadioButton}>
                      {customRecurrence.endsType === endsOptions[1] && (
                        <View style={styles.customRadioButtonSelected} />
                      )}
                    </View>
                    <Text style={styles.customEndsOptionText}>
                      {endsOptions[1]}
                    </Text>
                    <TextInput
                      style={[
                        styles.customEndsInput,
                        customRecurrence.endsType !== endsOptions[1] &&
                        styles.customEndsInputDisabled,
                      ]}
                      value={customRecurrence.endsDate}
                      onChangeText={text =>
                        setCustomRecurrence(prev => ({ ...prev, endsDate: text }))
                      }
                      placeholder="04/09/2025"
                      placeholderTextColor="#9E9E9E"
                      editable={customRecurrence.endsType === endsOptions[1]}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.customEndsOption}
                    onPress={() =>
                      setCustomRecurrence(prev => ({
                        ...prev,
                        endsType: endsOptions[2],
                      }))
                    }
                  >
                    <View style={styles.customRadioButton}>
                      {customRecurrence.endsType === endsOptions[2] && (
                        <View style={styles.customRadioButtonSelected} />
                      )}
                    </View>
                    <Text style={styles.customEndsOptionText}>
                      {endsOptions[2]}
                    </Text>
                    <TextInput
                      style={[
                        styles.customEndsInput,
                        customRecurrence.endsType !== endsOptions[2] &&
                        styles.customEndsInputDisabled,
                      ]}
                      value={customRecurrence.endsAfter}
                      onChangeText={text =>
                        setCustomRecurrence(prev => ({
                          ...prev,
                          endsAfter: text,
                        }))
                      }
                      keyboardType="numeric"
                      editable={customRecurrence.endsType === endsOptions[2]}
                    />
                    <Text style={styles.customEndsOccurrencesText}>
                      occurrences
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              {showUnitDropdown && (
                <View style={styles.dropdownOverlay}>
                  <View style={styles.dropdownContainer}>
                    {repeatUnits.map(unit => (
                      <TouchableOpacity
                        key={unit}
                        style={styles.dropdownItem}
                        onPress={() => handleUnitSelect(unit)}
                      >
                        <Text style={styles.dropdownItemText}>{unit}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

            </ScrollView>
            {/* Action Buttons */}
            <View style={styles.customModalActions}>
              <TouchableOpacity
                style={styles.customCancelButton}
                onPress={() => setShowCustomRecurrenceModal(false)}
              >
                <Text style={styles.customCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.customDoneButton}
                onPress={handleCustomRecurrenceDone}
              >
                <LinearGradient
                  colors={['#18F06E', '#0B6DE0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.customDoneButtonGradient}
                >
                  <Text style={styles.customDoneButtonText}>Done</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

        </View>

      </Modal>

      {/* Location Suggestions Modal */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLocationModal(false)}
        presentationStyle="overFullScreen"
      >
        <View style={styles.locationModalOverlay}>
          {/* Keep the original TextInput visible at the top */}
          <View style={styles.locationInputContainer}>
            <View style={styles.locationInputRow}>
              <FeatherIcon name="map-pin" size={20} color="#6C6C6C" />
              <TextInput
                ref={locationModalInputRef}
                style={styles.locationModalInput}
                placeholder="Add location"
                placeholderTextColor={colors.grey400}
                value={location}
                onChangeText={text => {
                  setLocation(text);
                  if (locationError) setLocationError('');
                  if (text.length >= 2) {
                    debouncedFetchSuggestions(text);
                  } else {
                    setLocationSuggestions([]);
                  }
                }}
                autoCorrect={false}
                autoCapitalize="none"
                autoFocus={true}
                blurOnSubmit={false}
                returnKeyType="search"
                editable={true}
              />
              <TouchableOpacity
                onPress={() => setShowLocationModal(false)}
                style={styles.locationCloseButton}
              >
                <FeatherIcon name="x" size={20} color={colors.blackText} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Suggestions list below the input */}
          <View style={styles.locationSuggestionsContainer}>
            {isLoadingLocations ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Searching locations...</Text>
              </View>
            ) : locationSuggestions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {location.length >= 2 ? 'No locations found' : 'Start typing to search locations...'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={locationSuggestions}
                keyExtractor={(item, index) => `${item.value}-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.locationItem}
                    onPress={() => handleLocationSelect(item)}
                    activeOpacity={0.7}
                  >
                    <FeatherIcon
                      name="map-pin"
                      size={16}
                      color={colors.grey400}
                    />
                    <Text style={styles.locationItemText}>{item.label}</Text>
                  </TouchableOpacity>
                )}
                style={styles.locationList}
                contentContainerStyle={styles.locationListContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
                keyboardDismissMode="none"
                nestedScrollEnabled={true}
                removeClippedSubviews={false}
              />
            )}
          </View>
        </View>
      </Modal>
      {/* Integration Info Modal */}
      <Modal
        visible={showIntegrationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowIntegrationModal(false)}
      >
        <View style={styles.integrationModalOverlay}>
          <View style={styles.integrationModalContainer}>
            <View style={styles.integrationModalHeader}>
              <Icon name="link-variant" size={32} color="#18F06E" />
              <Text style={styles.integrationModalTitle}>Integration Required</Text>
            </View>

            <View style={styles.integrationModalContent}>
              <Text style={styles.integrationModalDescription}>
                To use Google Meet, you need to integrate Google
              </Text>
            </View>

            <View style={styles.integrationModalButtons}>
              <TouchableOpacity
                style={styles.integrationModalCancelButton}
                onPress={() => setShowIntegrationModal(false)}
              >
                <Text style={styles.integrationModalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.integrationModalContinueButton}
                onPress={() => {
                  setShowIntegrationModal(false);
                  navigation.navigate(Screen.SettingsScreen, {
                    expandIntegration: true,
                  });
                }}
              >
                <LinearGradient
                  colors={['#18F06E', '#0B6DE0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.integrationModalGradient}
                >
                  <Text style={styles.integrationModalContinueText}>Continue</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  recurrenceOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.lg,
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
  },
  eventTypeDropdown: {
    position: 'absolute',
    top: scaleHeight(70),
    left: scaleWidth(140),
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
  arrowDropdown: {
    width: 12,
    height: 8,
    marginTop: 4,
    marginLeft: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  inputSection: {
    marginBottom: spacing.lg,
  },
  titleInput: {
    fontSize: fontSize.textSize25,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
    minHeight: scaleHeight(50),
  },
  inputUnderline: {
    height: 1,
    backgroundColor: colors.grey20,
  },
  detailsSection: {
    marginBottom: spacing.lg,
  },
  selectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  selectorText: {
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    fontWeight: '400',
    marginLeft: spacing.sm,
    flex: 1,
  },
  dateTimeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dateTimeSelector: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  dateTimeDisplay: {
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: fontSize.textSize14,
    color: colors.grey400,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  timeSlotContainer: {
    flex: 1,
    minHeight: scaleHeight(80),
  },
  dateTimeErrorContainer: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    width: '100%',
  },
  dateTimeErrorText: {
    fontSize: fontSize.textSize12,
    color: '#FF3B30',
    fontWeight: '400',
    lineHeight: 18,
    marginBottom: spacing.xs / 2,
  },
  fieldErrorText: {
    fontSize: fontSize.textSize12,
    color: '#FF3B30',
    fontWeight: '400',
    marginTop: spacing.xs,
    marginLeft: 0,
    paddingLeft: spacing.xs,
  },
  timeSlot: {
    backgroundColor: '#F6F7F9',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    minHeight: scaleHeight(60),
    justifyContent: 'center',
  },
  timeSlotLabel: {
    fontSize: fontSize.textSize12,
    color: colors.grey400,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  timeSlotValue: {
    fontSize: fontSize.textSize14,
    color: colors.blackText,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.grey20,
    marginVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  addIconContainer: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    backgroundColor: Colors.primaryGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIconText: {
    fontSize: fontSize.textSize14,
    color: colors.white,
    fontWeight: 'bold',
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    width: '100%',
  },
  notificationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  notificationInput: {
    width: scaleWidth(60),
    height: scaleHeight(32),
    borderWidth: 1,
    borderColor: '#DCE0E5',
    borderRadius: borderRadius.sm,
    textAlign: 'center',
    fontSize: fontSize.textSize12,
    color: colors.blackText,
    marginRight: spacing.xs,
    paddingHorizontal: 4,
    paddingVertical: 0,
  },
  timeUnitDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE0E5',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    height: scaleHeight(32),
  },
  timeUnitText: {
    fontSize: fontSize.textSize12,
    color: colors.textPrimary,
    fontWeight: '400',
    marginRight: spacing.xs,
  },
  descriptionContainer: {
    backgroundColor: '#F6F7F9',
    borderRadius: 10,
    padding: 16,
    marginBottom: spacing.lg,
  },
  descriptionInput: {
    fontSize: fontSize.textSize16,
    color: colors.textPrimary,
    padding: 0,
    minHeight: scaleHeight(100),
    backgroundColor: 'transparent',
    borderRadius: 0,
    textAlignVertical: 'top',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  bottomActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
    marginHorizontal: scaleWidth(20),
    paddingBottom: scaleHeight(50),
  },
  advanceOptionsButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  advanceOptionsText: {
    fontSize: fontSize.textSize18,
    color: colors.dimGray,
    fontWeight: '600',
  },
  saveButton: {
    borderRadius: borderRadius.lg,
    minWidth: scaleWidth(120),
    alignItems: 'center',
    ...shadows.sm,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  gradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  saveButtonText: {
    fontSize: fontSize.textSize16,
    color: colors.white,
    fontWeight: '600',
  },
  videoConferencingOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  videoConferencingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: colors.white,
  },
  videoConferencingButtonSelected: {
    borderColor: Colors.primaryGreen,
    backgroundColor: '#F0FFF4',
  },
  videoConferencingIconContainer: {
    width: scaleWidth(24),
    height: scaleHeight(24),
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  videoConferencingButtonText: {
    fontSize: fontSize.textSize14,
    color: colors.blackText,
    fontWeight: '500',
  },
  videoConferencingButtonTextSelected: {
    color: Colors.primaryGreen,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  guestModalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '60%',
    paddingBottom: scaleHeight(40),
  },
  modalHandle: {
    width: scaleWidth(40),
    height: scaleHeight(4),
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: scaleHeight(12),
    marginBottom: scaleHeight(20),
  },
  modalHeader: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.textSize20,
    fontWeight: '600',
    color: colors.blackText,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F7F9',
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    marginLeft: spacing.sm,
    padding: 0,
  },
  guestList: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  guestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  guestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  guestAvatar: {
    width: scaleWidth(40),
    height: scaleHeight(40),
    borderRadius: 20,
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitialsText: {
    fontSize: fontSize.textSize14,
    fontWeight: '600',
    color: colors.white,
  },
  guestDetails: {
    flex: 1,
  },
  guestName: {
    fontSize: fontSize.textSize16,
    fontWeight: '500',
    color: colors.blackText,
    marginBottom: 2,
  },
  guestUsername: {
    fontSize: fontSize.textSize14,
    color: '#6B7280',
  },
  checkbox: {
    width: scaleWidth(20),
    height: scaleHeight(20),
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primaryGreen,
    borderColor: Colors.primaryGreen,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: fontSize.textSize16,
    fontWeight: '500',
    color: '#6B7280',
  },
  addButton: {
    flex: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  addButtonGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: fontSize.textSize16,
    fontWeight: '600',
    color: colors.white,
  },
  // Recurrence Dropdown Styles
  recurrenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: spacing.sm,
  },
  recurrenceDropdown: {
    position: 'absolute',
    top: scaleHeight(180),
    left: scaleWidth(20),
    right: scaleWidth(20),
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
    zIndex: 1001,
    paddingVertical: scaleHeight(8),
    maxHeight: scaleHeight(400),
  },
  recurrenceDropdownScroll: {
    maxHeight: scaleHeight(380),
  },
  recurrenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    minHeight: scaleHeight(44),
  },
  recurrenceItemSelected: {
    backgroundColor: '#F0F8FF',
  },
  recurrenceItemText: {
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    fontWeight: '400',
    flex: 1,
  },
  recurrenceItemTextSelected: {
    color: Colors.primaryblue,
    fontWeight: '500',
  },
  recurrenceCheckmark: {
    width: scaleWidth(16),
    height: scaleHeight(16),
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  customRecurrenceContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    overflow: 'visible', // Add this
  },
  customRecurrenceSection: {
    marginBottom: spacing.xl,
    overflow: 'visible', // Add this
  },
  customRepeatEveryContainer: {
    position: 'relative',
    zIndex: 1000, // Add this
  },
  customRepeatEveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  customRepeatEveryInput: {
    width: scaleWidth(60),
    minWidth: scaleWidth(50),
    maxWidth: scaleWidth(80),
    height: scaleHeight(36),
    borderWidth: 1,
    borderColor: '#DCE0E5',
    borderRadius: borderRadius.sm,
    textAlign: 'center',
    fontSize: fontSize.textSize14,
    color: colors.blackText,
    paddingHorizontal: scaleWidth(4),
    paddingVertical: 0,
    marginRight: spacing.sm,
  },
  customRepeatUnitDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE0E5',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    height: scaleHeight(36),
    width: scaleWidth(100),
    minWidth: scaleWidth(80),
    maxWidth: scaleWidth(120),
    backgroundColor: colors.white,
  },
  customRepeatUnitText: {
    fontSize: fontSize.textSize14,
    color: colors.blackText,
    fontWeight: '400',
    marginRight: spacing.xs,
  },
  dropdownContainer: {
    position: 'absolute',
    top: scaleHeight(45), // Position below the button row
    left: scaleWidth(60) + spacing.sm, // Align with dropdown button
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#DCE0E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    minWidth: scaleWidth(120),
    maxWidth: scaleWidth(150),
    paddingVertical: spacing.xs,
    zIndex: 1001,
  },
  dropdownItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  dropdownItemText: {
    fontSize: fontSize.textSize16,
    color: colors.blackText,
  },
  // Custom Modal Styles
  customModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  customRecurrenceModalContainer: {
    backgroundColor: colors.white,
    borderRadius: 20,
    width: '100%',
    maxHeight: '75%',     // 👈 fixed height for smaller screens
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  customModalHeader: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  customModalTitle: {
    fontSize: fontSize.textSize20,
    fontWeight: '600',
    color: colors.blackText,
  },

  customRecurrenceSectionTitle: {
    fontSize: fontSize.textSize16,
    fontWeight: '600',
    color: colors.blackText,
    marginBottom: spacing.md,
  },


  customDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  customDayButton: {
    width: scaleWidth(40),
    height: scaleHeight(40),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCE0E5',
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customDayButtonSelected: {
    backgroundColor: Colors.primaryblue,
    borderColor: Colors.primaryblue,
  },
  customDayButtonText: {
    fontSize: fontSize.textSize14,
    fontWeight: '500',
    color: colors.blackText,
  },
  customDayButtonTextSelected: {
    color: colors.white,
  },
  customEndsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  customRadioButton: {
    width: scaleWidth(20),
    height: scaleHeight(20),
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#DCE0E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customRadioButtonSelected: {
    width: scaleWidth(10),
    height: scaleHeight(10),
    borderRadius: 5,
    backgroundColor: Colors.primaryblue,
  },
  customEndsOptionText: {
    fontSize: fontSize.textSize14,
    color: colors.blackText,
    fontWeight: '400',
    minWidth: scaleWidth(40),

  },
  customEndsInput: {
    width: scaleWidth(100),
    borderWidth: 1,
    borderColor: '#DCE0E5',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    fontSize: fontSize.textSize12,
    color: colors.blackText,
    paddingVertical: spacing.sm,
    lineHeight: scaleHeight(13),
  },
  customEndsInputDisabled: {
    backgroundColor: '#F5F5F5',
    color: '#9E9E9E',
  },
  customEndsOccurrencesText: {
    fontSize: fontSize.textSize14,
    color: colors.blackText,
    marginLeft: spacing.xs,
  },
  customModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    paddingHorizontal: spacing.lg, // Add horizontal padding to match content
    paddingTop: spacing.sm, // Add top padding/spacing
    // Add bottom padding
    borderTopWidth: 1, // Optional: add a separator line
    borderTopColor: '#E5E7EB', // Optional: separator color
    backgroundColor: colors.white,
  },
  customCancelButton: {
    paddingVertical: 10, // Changed from spacing.md
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: '#F3F4F6',
  },
  customCancelButtonText: {
    fontSize: fontSize.textSize14, // Optional: reduce font size too
    fontWeight: '500',
    color: '#6B7280',
  },
  customDoneButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  customDoneButtonGradient: {
    paddingVertical: 10, // Changed from spacing.md
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  customDoneButtonText: {
    fontSize: fontSize.textSize14, // Optional: reduce font size too
    fontWeight: '600',
    color: colors.white,
  },
  // Timezone Styles
  timezoneTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  timezoneTagText: {
    fontSize: fontSize.textSize14,
    color: colors.blackText,
    fontWeight: '400',
  },
  timezoneModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timezoneModal: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    width: scaleWidth(320),
    maxHeight: scaleHeight(500),
    padding: spacing.lg,
  },
  timezoneModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  timezoneModalTitle: {
    fontSize: fontSize.textSize18,
    fontWeight: '600',
    color: colors.blackText,
  },
  timezoneModalCloseButton: {
    width: moderateScale(24),
    height: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  timezoneModalCloseText: {
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    fontWeight: 'bold',
  },
  currentTimezoneContainer: {
    marginBottom: spacing.md,
  },
  currentTimezoneInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    backgroundColor: colors.white,
  },
  timezoneList: {
    maxHeight: scaleHeight(250),
    marginBottom: spacing.lg,
  },
  timezoneItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  timezoneItemSelected: {
    backgroundColor: '#F0F8FF',
  },
  timezoneItemText: {
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    fontWeight: '400',
  },
  timezoneItemTextSelected: {
    color: '#0B6DE0',
    fontWeight: '500',
  },
  timezoneModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timezoneModalButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  timezoneModalButtonText: {
    fontSize: fontSize.textSize14,
    color: colors.blackText,
    fontWeight: '400',
  },
  timezoneModalOkButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  timezoneModalOkGradient: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  timezoneModalOkText: {
    fontSize: fontSize.textSize14,
    color: colors.white,
    fontWeight: '600',
  },
  // Loading, Error, and Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  errorText: {
    fontSize: fontSize.textSize16,
    color: '#EF4444',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: Colors.primaryGreen,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    fontSize: fontSize.textSize14,
    color: colors.white,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    fontSize: fontSize.textSize16,
    color: colors.grey400,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Location Modal Styles
  locationModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  locationInputContainer: {
    backgroundColor: colors.white,
    paddingTop: scaleHeight(20),
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  locationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F7F9',
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  locationModalInput: {
    flex: 1,
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  locationCloseButton: {
    padding: spacing.xs,
  },
  locationSuggestionsContainer: {
    backgroundColor: colors.white,
    maxHeight: scaleHeight(400),
    flex: 1,
  },
  locationList: {
    flex: 1,
  },
  locationListContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  locationItemText: {
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    marginLeft: spacing.sm,
    flex: 1,
  },
  allDayToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  allDayText: {
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    fontWeight: '400',
    marginLeft: spacing.sm,
  },
  dropdownWrapper: {
    position: 'absolute',
    top: '35%', // Adjust based on where your "Repeat every" section is
    left: spacing.lg + scaleWidth(60) + spacing.sm, // Position next to the input
    zIndex: 1000,
  },

  // Integration Modal Styles
  integrationModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  integrationModalContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    width: scaleWidth(320),
    padding: spacing.xl,
    ...shadows.lg,
  },
  integrationModalHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  integrationModalTitle: {
    fontSize: fontSize.textSize20,
    fontWeight: '700',
    color: colors.blackText,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  integrationModalContent: {
    marginBottom: spacing.xl,
  },
  integrationModalDescription: {
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  integrationModalSubDescription: {
    fontSize: fontSize.textSize14,
    color: colors.grey400,
    textAlign: 'center',
    lineHeight: 20,
  },
  integrationModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  integrationModalCancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.grey20,
    marginRight: spacing.sm,
  },
  integrationModalCancelText: {
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    fontWeight: '600',
  },
  integrationModalContinueButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  integrationModalGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  integrationModalContinueText: {
    fontSize: fontSize.textSize16,
    color: colors.white,
    fontWeight: '600',
  },
});

export default CreateEventScreen;
