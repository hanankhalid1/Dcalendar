import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
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
import { Calendar } from 'react-native-calendars';
import LinearGradient from 'react-native-linear-gradient';
import FeatherIcon from 'react-native-vector-icons/Feather';
import {
  borderRadius,
  colors,
  fontSize,
  shadows,
  spacing,
  colors as themeColors,
} from '../utils/LightTheme';
import { moderateScale, scaleHeight, scaleWidth } from '../utils/dimensions';
import { Fonts } from '../constants/Fonts';
import ClockIcon from '../assets/svgs/clock.svg';
import CalendarIcon from '../assets/svgs/calendar.svg';
import ArrowDownIcon from '../assets/svgs/arrow-down.svg';
import MeetIcon from '../assets/svgs/meet.svg';
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
import {
  generateEventUID,
  buildEventMetadata,
  prepareEventForBlockchain,
  encryptWithNECJS,
} from '../utils/eventUtils';

import GuestSelector from '../components/createEvent/GuestSelector';
import { BlockchainService } from '../services/BlockChainService';
import { useActiveAccount } from '../stores/useActiveAccount';
import { useToken } from '../stores/useTokenStore';
import {
  convertionISOToTime,
  convertSecondsToUnit,
} from '../utils/notifications';
import dayjs from 'dayjs';
import Icon from 'react-native-vector-icons/Feather';
import { useAuthStore } from '../stores/useAuthStore';
import CustomAlert from '../components/CustomAlert';
import { useSettingsStore } from '../stores/useSetting';
import { useToast } from '../hooks/useToast';
const CreateEventScreen = () => {
  const navigation: any = useNavigation<AppNavigationProp>();
  const activeAccount = useActiveAccount(state => state.account);
  const token = useToken(state => state.token);
  const route = useRoute<any>();
  const { mode, eventData: editEventData } = route.params || {};
  const { getUserEvents, setUserEvents, userEvents } = useEventsStore();
  const { googleIntegration, zoomIntegration } = useAuthStore();
  const currentTimezone = useSettingsStore();
  const toast = useToast();
  // Initialize blockchain service and get contract instance
  // Form state
  const [title, setTitle] = useState(editEventData?.title ?? '');
  const [description, setDescription] = useState(
    editEventData?.description ?? '',
  );
  const [location, setLocation] = useState(editEventData?.location ?? '');
  const [videoConferencing, setVideoConferencing] = useState(
    editEventData?.videoConferencing ?? '',
  );
  const [notificationMinutes, setNotificationMinutes] = useState(
    editEventData?.seconds
      ? convertSecondsToUnit(
          parseInt(editEventData.seconds, 10),
          convertionISOToTime(editEventData.trigger)?.Label || 'Minutes',
        ).toString()
      : '0',
  );
  const [selectedTimeUnit, setSelectedTimeUnit] = useState(
    editEventData?.trigger
      ? convertionISOToTime(editEventData.trigger)?.Label || 'Minutes'
      : 'Minutes',
  );
  const [selectedNotificationType, setSelectedNotificationType] = useState(
    editEventData?.notification || 'Notification',
  );
  const [selectedStatus, setSelectedStatus] = useState(
    editEventData?.busy || 'Busy',
  );
  const [selectedVisibility, setSelectedVisibility] = useState(
    editEventData?.visibility || 'Default Visibility',
  );
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(
    editEventData?.selectedStartDate
      ? new Date(editEventData.selectedStartDate)
      : null,
  );
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(
    editEventData?.selectedEndDate
      ? new Date(editEventData.selectedEndDate)
      : null,
  );
  const [selectedStartTime, setSelectedStartTime] = useState(
    editEventData?.selectedStartTime || '',
  );
  const [selectedEndTime, setSelectedEndTime] = useState(
    editEventData?.selectedEndTime || '',
  );
  const [showDetailedDateTime, setShowDetailedDateTime] = useState(
    !!editEventData,
  );
  const [dateTimeError, setDateTimeError] = useState<string>('');
  const [titleError, setTitleError] = useState<string>('');
  const [locationError, setLocationError] = useState<string>('');
  const [startDateError, setStartDateError] = useState<string>('');
  const [startTimeError, setStartTimeError] = useState<string>('');
  const [endDateError, setEndDateError] = useState<string>('');
  const [endTimeError, setEndTimeError] = useState<string>('');
  const [calendarMode, setCalendarMode] = useState<'from' | 'to'>('from');
  const [showEventTypeDropdown, setShowEventTypeDropdown] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState(
    editEventData?.selectedEventType || 'Event',
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [selectedPermission, setSelectedPermission] = useState<string>('');
  const [showVideoConferencingOptions, setShowVideoConferencingOptions] =
    useState(false);
  const [selectedVideoConferencing, setSelectedVideoConferencing] =
    useState('');
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestSearchQuery, setGuestSearchQuery] = useState('');
  const [activeField, setActiveField] = useState<
    | 'title'
    | 'date'
    | 'startTime'
    | 'endTime'
    | 'repeat'
    | 'description'
    | 'videoConferencing'
    | 'location'
    | null
  >(null);
  const [showRecurrenceDropdown, setShowRecurrenceDropdown] = useState(false);
  const [selectedRecurrence, setSelectedRecurrence] =
    useState('Does not repeat');
  const [showCustomRecurrenceModal, setShowCustomRecurrenceModal] =
    useState(false);
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingEventId, setMeetingEventId] = useState('');

  const [customRecurrence, setCustomRecurrence] = useState(() => {
    const weekday = selectedStartDate
      ? selectedStartDate.toLocaleDateString('en-US', { weekday: 'long' })
      : 'Thursday'; // default fallback
    return {
      repeatEvery: '1',
      repeatUnit: 'Week',
      repeatOn: [weekday],
      endsType: 'Never',
      endsDate: null as Date | null,
      endsAfter: '13',
    };
  });
  const [showEndsDatePicker, setShowEndsDatePicker] = useState(false);
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState(currentTimezone);
  const [timezoneSearchQuery, setTimezoneSearchQuery] = useState('');
  const [searchQuery, setsearchQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = React.useState<any[]>(
    [],
  );
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
  const [integrationType, setIntegrationType] = useState<'google' | 'zoom'>(
    'google',
  );
  const integrationModalSlideAnim = useRef(
    new Animated.Value(Dimensions.get('window').height),
  ).current;

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
      result: isStartMidnight && isEndMidnight,
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

    console.log('Edit event data', eventData);
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
          endTime: '',
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
        endTime: endTime,
      };
    } catch (error) {
      console.error(
        'Error parsing date and time:',
        dateString,
        timeString,
        error,
      );
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
          hour12: true,
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
          parseInt(second),
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

        timeString = `${displayHour.toString().padStart(2, '0')}:${minuteNum
          .toString()
          .padStart(2, '0')} ${period}`;
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
          hour12: true,
        });
      }

      console.log('parseDateTime result:', {
        input: dateTimeString,
        date: date.toISOString(),
        time: timeString,
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

      // Only set location if it's NOT a video conferencing meeting link
      // Video conferencing links should not be shown in the location field
      const shouldSetLocation = !(
        parsedData.locationType === 'google' ||
        parsedData.locationType === 'zoom'
      );

      if (shouldSetLocation) {
        setLocation(parsedData.location || '');
      } else {
        setLocation(''); // Clear location for video conferencing events
      }

      // CHECK IF IT'S AN ALL-DAY EVENT FIRST
      if (editEventData.fromTime && editEventData.toTime) {
        const isAllDay = isAllDayEventCheck(
          editEventData.fromTime,
          editEventData.toTime,
        );

        console.log('All-day event check:', {
          fromTime: editEventData.fromTime,
          toTime: editEventData.toTime,
          isAllDay,
          checkDetails: {
            hasT: editEventData.fromTime.includes('T'),
            fromTimeOnly: editEventData.fromTime.split('T')[1],
            toTimeOnly: editEventData.toTime.split('T')[1],
          },
        });

        // ✅ SET ALL-DAY STATE IMMEDIATELY
        setIsAllDayEvent(isAllDay);

        // Parse start date/time
        const startDateTime = parseDateTime(editEventData.fromTime);
        if (startDateTime.date) {
          setSelectedStartDate(startDateTime.date);
          // ✅ Only set time for non-all-day events
          setSelectedStartTime(isAllDay ? '' : startDateTime.time || '');
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
              displayEndDate: displayEndDate.toISOString(),
            });
          } else {
            setSelectedEndDate(endDateTime.date);
            setSelectedEndTime(endDateTime.time || '');
          }
        }
      } else if (editEventData.date && editEventData.time) {
        console.log(
          'Parsing date and time:',
          editEventData.date,
          editEventData.time,
        );
        const dateTime = parseDateAndTime(
          editEventData.date,
          editEventData.time,
        );
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

      if (
        (editEventData.fromTime && editEventData.toTime) ||
        (editEventData.date && editEventData.time)
      ) {
        setShowDetailedDateTime(true);
      }

      if (parsedData.locationType) {
        setSelectedVideoConferencing(parsedData.locationType);
        // Don't auto-open dropdown in edit mode
      }

      // ✅ Handle Google Meet or any video meeting
      if (
        parsedData.locationType === 'google' ||
        editEventData?.meetingLink?.includes('meet.google.com')
      ) {
        console.log('Detected Google Meet in existing event');

        setSelectedVideoConferencing('google');
        // Don't auto-open dropdown in edit mode

        if (editEventData.meetingLink) {
          setMeetingLink(editEventData.meetingLink);
        }

        const meetingEventId =
          parsedData.meetingEventId ||
          editEventData.meetingEventId ||
          (editEventData.list || []).find(
            (i: any) => i.key === 'meetingEventId',
          )?.value;

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

  // Removed auto-open dropdown on focus - dropdown should only open on user click
  const handleGoogleMeetClick = () => {
    if (!googleIntegration.isConnected) {
      // Show modal first, then navigate on Continue
      setShowIntegrationModal(true);
    } else {
      // Google is connected, allow selecting Google Meet
      setSelectedVideoConferencing('google');
      setShowVideoConferencingOptions(false);
    }
  };

  // Helper to render selected video conferencing with its icon
  const getVideoConferencingDisplay = (value: string | null) => {
    switch (value) {
      case 'inperson':
        return {
          label: 'In-person meeting',
          icon: <FeatherIcon name="map-pin" size={18} color="#6C6C6C" />,
          filled: true,
        };
      case 'google':
        return {
          label: 'Google Meet',
          icon: <MeetIcon width={18} height={18} />,
          filled: true,
        };
      case 'zoom':
        return {
          label: 'Zoom Meeting',
          icon: <FeatherIcon name="video" size={18} color="#0B6DE0" />,
          filled: true,
        };
      default:
        return { label: 'Select', icon: null, filled: false };
    }
  };

  useEffect(() => {
    if (selectedStartDate) {
      const weekday = selectedStartDate.toLocaleDateString('en-US', {
        weekday: 'long',
      });
      setCustomRecurrence(prev => ({
        ...prev,
        repeatOn: [weekday],
      }));
    }
  }, [selectedStartDate]);

  // Animate integration modal slide
  useEffect(() => {
    if (showIntegrationModal) {
      Animated.timing(integrationModalSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(integrationModalSlideAnim, {
        toValue: Dimensions.get('window').height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showIntegrationModal, integrationModalSlideAnim]);

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
    const weekday = d.format('dddd');
    const dayNumber = d.date();
    const monthName = d.format('MMMM');

    // 1. Determine the week position (first, second, third, fourth)
    const weekNames = ['first', 'second', 'third', 'fourth'];
    const weekOfMonth = Math.ceil(dayNumber / 7);

    // 2. Check if the selected date is the ABSOLUTE last occurrence of this weekday in the month
    const isSelectedDateTheLastWeekday = d.add(7, 'day').month() !== d.month();

    // 3. Determine the Nth Week Text to use for the first monthly option
    let nthWeekText;
    if (isSelectedDateTheLastWeekday) {
      // Use "last" if it is the final occurrence of the day in the month
      nthWeekText = 'last';
    } else {
      // Otherwise, use the calculated "Nth" position (first, second, third, or fourth)
      nthWeekText = weekNames[weekOfMonth - 1] || 'first';
    }

    let options = [
      'Does not repeat',
      'Daily',
      // 1. Weekly on [Weekday]
      `Weekly on ${weekday}`,
    ];

    // 2. Monthly on the [Nth] [Weekday] - Uses "last" when applicable
    options.push(`Monthly on the ${nthWeekText} ${weekday}`);

    // 3. Monthly on the last [Weekday]
    // We ONLY add this option if the calculated Nth option (step 2) is NOT "last".
    // This prevents the redundant inclusion of the "last" option.
    if (!isSelectedDateTheLastWeekday) {
      options.push(`Monthly on the last ${weekday}`);
    }

    // 4. Annually and others
    options.push(
      `Annually on ${monthName} ${dayNumber}`,
      'Every Weekday (Monday to Friday)',
      'Custom...',
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

  const handleUnitSelect = unit => {
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
    // Validate repeatEvery value
    const repeatEveryNum = parseInt(customRecurrence.repeatEvery, 10);

    // Check if repeatEvery is valid (must be a positive integer between 1-99)
    if (isNaN(repeatEveryNum) || repeatEveryNum < 1 || repeatEveryNum > 99) {
      // Show error alert
      showAlert(
        'Invalid Repeat Value',
        'Please enter a valid number between 1 and 99 for "Repeat every".',
        'error',
      );
      return;
    }

    // Generate custom recurrence text based on settings
    const { repeatEvery, repeatUnit, repeatOn, endsType } = customRecurrence;
    let customText = `Every ${repeatEvery} ${repeatUnit.toLowerCase()}`;

    if (repeatUnit === 'Week' && repeatOn.length > 0) {
      customText += ` on ${repeatOn.join(', ')}`;
    }

    if (endsType === 'After') {
      customText += ` (${customRecurrence.endsAfter} times)`;
    } else if (endsType === 'On' && customRecurrence.endsDate) {
      // Format date as MM/DD/YYYY
      const date = customRecurrence.endsDate;
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      customText += ` (until ${month}/${day}/${year})`;
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
    guest =>
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

    // Check if start date/time is in the past (only for new events, not edit mode)
    if (mode !== 'edit') {
      const now = new Date();
      now.setSeconds(0, 0); // Reset seconds and milliseconds for accurate comparison

      // Check if the selected month is in the past
      const selectedMonth = selectedStartDate.getMonth();
      const selectedYear = selectedStartDate.getFullYear();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      if (
        selectedYear < currentYear ||
        (selectedYear === currentYear && selectedMonth < currentMonth)
      ) {
        setStartDateError('Please select valid time and date');
        return;
      }

      if (isAllDayEvent) {
        // For all-day events, check if start date is in the past
        const startDateTime = new Date(selectedStartDate);
        startDateTime.setHours(0, 0, 0, 0);
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        if (startDateTime < today) {
          setStartDateError('Please select valid time and date');
          return;
        }
      } else {
        // For timed events, check if start date/time is in the past
        if (selectedStartTime && selectedStartTime.trim() !== '') {
          const startDateTime = new Date(selectedStartDate);
          const normalizedStartTime = selectedStartTime
            .trim()
            .replace(/\u00A0/g, ' ')
            .replace(/\s+/g, ' ');
          const startTimeMatch = normalizedStartTime.match(
            /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i,
          );

          if (startTimeMatch) {
            let hours = parseInt(startTimeMatch[1], 10);
            const minutes = parseInt(startTimeMatch[2], 10);
            const period = startTimeMatch[3].toUpperCase();

            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;

            startDateTime.setHours(hours, minutes, 0, 0);

            if (startDateTime < now) {
              setStartTimeError('Please select valid time and date');
              return;
            }
          }
        }
      }
    }

    if (isAllDayEvent) {
      // For all-day events, just validate dates
      const startDateTime = new Date(selectedStartDate);
      startDateTime.setHours(0, 0, 0, 0);
      const endDateTime = new Date(selectedEndDate);
      endDateTime.setHours(0, 0, 0, 0);

      if (endDateTime < startDateTime) {
        setDateTimeError('End date must be on or after start date');
        console.log(
          'DEBUG - Setting all-day error:',
          'End date must be on or after start date',
        );
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
      const normalizedStartTime = selectedStartTime
        .trim()
        .replace(/\u00A0/g, ' ')
        .replace(/\s+/g, ' ');
      const startTimeMatch = normalizedStartTime.match(
        /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i,
      );

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
      const normalizedEndTime = selectedEndTime
        .trim()
        .replace(/\u00A0/g, ' ')
        .replace(/\s+/g, ' ');
      const endTimeMatch = normalizedEndTime.match(
        /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i,
      );

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
        isValid: endDateTime > startDateTime,
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
  }, [
    selectedStartDate,
    selectedEndDate,
    selectedStartTime,
    selectedEndTime,
    isAllDayEvent,
  ]);

  const handleDateTimeSelect = (date: Date, time: string) => {
    console.log('>>>>>>>> DATE SELECTED <<<<<<<<', {
      date: date.toISOString(),
      dateFormatted: date.toLocaleDateString(),
      time: time,
      timeStringified: JSON.stringify(time),
      mode: calendarMode,
    });
    if (calendarMode === 'from') {
      setSelectedStartDate(date);
      setSelectedStartTime(time);
      setSelectedRecurrence('Does not repeat');
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
        console.log(
          '>>>>>>>> CALCULATING END TIME IN handleDateTimeSelect <<<<<<<<',
          {
            startTime: time,
            calculatedEndTime: suggestedEndTime,
            previousEndTime: selectedEndTime,
            startDate: date.toISOString(),
          },
        );
        setSelectedEndTime(suggestedEndTime);

        // Check if end time rolled over to next day (12:00 AM)
        // Only add 1 day if the END time (after adding 30 min) is 12:00 AM or later
        const normalizedEndTime = suggestedEndTime
          .trim()
          .replace(/\u00A0/g, ' ')
          .replace(/\s+/g, ' ');
        const endTimeMatch = normalizedEndTime.match(
          /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i,
        );
        if (endTimeMatch) {
          let endHours = parseInt(endTimeMatch[1], 10);
          const endPeriod = endTimeMatch[3].toUpperCase();
          // If end time is 12:00 AM, it means it rolled over to next day
          if (endPeriod === 'AM' && endHours === 12) {
            // Add 1 day to end date
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            setSelectedEndDate(nextDay);
            console.log(
              '>>>>>>>> END TIME ROLLED OVER - Setting end date to next day:',
              nextDay.toISOString(),
            );
          } else {
            // End time is same day, ensure end date matches start date
            setSelectedEndDate(date);
            console.log(
              '>>>>>>>> END TIME SAME DAY - Setting end date to start date:',
              date.toISOString(),
            );
          }
        }

        // Always set the calculated end time (this ensures it's always 30 min after start)
        setSelectedEndTime(suggestedEndTime);
        console.log('>>>>>>>> SET END TIME TO:', suggestedEndTime);
      } else {
        // If time is empty, clear end time too
        setSelectedEndTime('');
      }
    } else {
      // When "To" is selected, set the date and time
      setSelectedEndDate(date);
      setSelectedEndTime(time);

      // If start time exists and we're setting end time, validate that end is after start
      // But don't auto-calculate here - let user set their own end time
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
    } else if (
      calendarMode === 'to' &&
      selectedStartDate &&
      selectedStartTime
    ) {
      // When end time is selected (and start date/time already exist), also show it
      setShowDetailedDateTime(true);
    }

    // Validate immediately with new values (don't wait for state to update)
    const newStartDate = calendarMode === 'from' ? date : selectedStartDate;
    let newEndDate = calendarMode === 'to' ? date : selectedEndDate || date;
    const newStartTime = calendarMode === 'from' ? time : selectedStartTime;
    let newEndTime = calendarMode === 'to' ? time : selectedEndTime;

    // If setting start time, calculate end time
    if (calendarMode === 'from' && time && time.trim() !== '') {
      newEndTime = addMinutesToTime(time, 30);

      // Check if end time rolled over to next day (12:00 AM)
      // Only add 1 day if the END time (after adding 30 min) is 12:00 AM or later
      const normalizedEndTime = newEndTime
        .trim()
        .replace(/\u00A0/g, ' ')
        .replace(/\s+/g, ' ');
      const endTimeMatch = normalizedEndTime.match(
        /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i,
      );
      if (endTimeMatch) {
        let endHours = parseInt(endTimeMatch[1], 10);
        const endPeriod = endTimeMatch[3].toUpperCase();
        // If end time is 12:00 AM, it means it rolled over to next day
        if (endPeriod === 'AM' && endHours === 12) {
          // Add 1 day to end date
          const nextDay = new Date(date);
          nextDay.setDate(nextDay.getDate() + 1);
          newEndDate = nextDay;
        } else {
          // End time is same day, ensure end date matches start date
          newEndDate = date;
        }
      }
    }

    // Validate immediately
    setTimeout(() => {
      validateDateTimeWithValues(
        newStartDate,
        newEndDate,
        newStartTime || '',
        newEndTime || '',
      );
    }, 0);
  };

  // Helper function to validate with specific values (for immediate validation)
  const validateDateTimeWithValues = (
    startDate: Date | null,
    endDate: Date | null,
    startTime: string,
    endTime: string,
  ) => {
    setDateTimeError('');

    if (!startDate || !endDate) {
      return;
    }

    // Check if start date/time is in the past (only for new events, not edit mode)
    if (mode !== 'edit') {
      const now = new Date();
      now.setSeconds(0, 0); // Reset seconds and milliseconds for accurate comparison

      // Check if the selected month is in the past
      const selectedMonth = startDate.getMonth();
      const selectedYear = startDate.getFullYear();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      if (
        selectedYear < currentYear ||
        (selectedYear === currentYear && selectedMonth < currentMonth)
      ) {
        setStartDateError('Please select valid time and date');
        return;
      }

      if (isAllDayEvent) {
        // For all-day events, check if start date is in the past
        const startDateTime = new Date(startDate);
        startDateTime.setHours(0, 0, 0, 0);
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        if (startDateTime < today) {
          setStartDateError('Please select valid time and date');
          return;
        }
      } else {
        // For timed events, check if start date/time is in the past
        if (startTime && startTime.trim() !== '') {
          const startDateTime = new Date(startDate);
          const normalizedStartTime = startTime
            .trim()
            .replace(/\u00A0/g, ' ')
            .replace(/\s+/g, ' ');
          const startTimeMatch = normalizedStartTime.match(
            /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i,
          );

          if (startTimeMatch) {
            let hours = parseInt(startTimeMatch[1], 10);
            const minutes = parseInt(startTimeMatch[2], 10);
            const period = startTimeMatch[3].toUpperCase();

            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;

            startDateTime.setHours(hours, minutes, 0, 0);

            if (startDateTime < now) {
              setStartTimeError('Please select valid time and date');
              return;
            }
          }
        }
      }
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
      const normalizedStartTime = startTime
        .trim()
        .replace(/\u00A0/g, ' ')
        .replace(/\s+/g, ' ');
      const startTimeMatch = normalizedStartTime.match(
        /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i,
      );

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
      const normalizedEndTime = endTime
        .trim()
        .replace(/\u00A0/g, ' ')
        .replace(/\s+/g, ' ');
      const endTimeMatch = normalizedEndTime.match(
        /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i,
      );

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
      // If end time is 12:00 AM, it means it's on the next day, so add 1 day to endDateTime for comparison
      const endDateTimeForComparison = new Date(endDateTime);
      if (endPeriod === 'AM' && endHours === 12) {
        endDateTimeForComparison.setDate(
          endDateTimeForComparison.getDate() + 1,
        );
      }

      if (endDateTimeForComparison <= startDateTime) {
        const startDateOnly = new Date(startDate);
        startDateOnly.setHours(0, 0, 0, 0);
        const endDateOnly = new Date(endDate);
        endDateOnly.setHours(0, 0, 0, 0);

        // If end time is 12:00 AM, it's actually on the next day
        if (endPeriod === 'AM' && endHours === 12) {
          endDateOnly.setDate(endDateOnly.getDate() + 1);
        }

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

  const addMinutesToTime = (
    timeString: string,
    minutesToAdd: number,
  ): string => {
    // Validate input
    if (!timeString || timeString.trim() === '') {
      return '12:00 AM';
    }

    // Normalize the string: replace any non-breaking spaces or special spaces with regular space
    const normalized = timeString
      .trim()
      .replace(/\u00A0/g, ' ')
      .replace(/\s+/g, ' ');

    // Try to extract time and period using regex to handle various formats
    const timeMatch = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

    if (!timeMatch) {
      // Fallback: try to split by space
      const parts = normalized.split(/\s+/);
      if (parts.length >= 2) {
        const timePart = parts[0];
        const period = parts[parts.length - 1].toUpperCase();
        const [hours, minutes] = timePart.split(':').map(Number);

        if (
          !isNaN(hours) &&
          !isNaN(minutes) &&
          (period === 'AM' || period === 'PM')
        ) {
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
          return `${displayHours}:${newMinutes
            .toString()
            .padStart(2, '0')} ${newPeriod}`;
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
    return `${displayHours}:${newMinutes
      .toString()
      .padStart(2, '0')} ${newPeriod}`;
  };

  // Form validation
  const validateForm = () => {
    let isValid = true;
    let firstErrorField:
      | 'title'
      | 'startDate'
      | 'startTime'
      | 'endDate'
      | 'endTime'
      | 'location'
      | null = null;

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

    // Validate location format (if provided) - reject whitespace-only strings
    // Skip validation if video conferencing is selected (Google Meet/Zoom link stored separately)
    const trimmedLocation = location.trim();
    if (
      trimmedLocation &&
      trimmedLocation.length > 0 &&
      selectedVideoConferencing !== 'google' &&
      selectedVideoConferencing !== 'zoom'
    ) {
      // Check for invalid characters that could cause issues
      // Blocked: < > { } [ ] ( ) | \ ` ~ ^ / @ # $ % & * + = ? ! ; " _ -
      const invalidChars = /[<>{}[\]()|\\`~^\/@#$%&*+=?!;"_-]/;
      if (invalidChars.test(location)) {
        setLocationError('Enter valid location');
        isValid = false;
        if (!firstErrorField) firstErrorField = 'location';
      }
    } else if (
      location &&
      location.length > 0 &&
      selectedVideoConferencing !== 'google' &&
      selectedVideoConferencing !== 'zoom'
    ) {
      // Location has only whitespace - reject it
      setLocationError('Location cannot be empty or contain only spaces');
      isValid = false;
      if (!firstErrorField) firstErrorField = 'location';
    }

    // Check if start date/time is in the past (only for new events, not edit mode)
    if (mode !== 'edit' && selectedStartDate) {
      const now = new Date();
      now.setSeconds(0, 0); // Reset seconds and milliseconds for accurate comparison

      // Check if the selected month is in the past
      const selectedMonth = selectedStartDate.getMonth();
      const selectedYear = selectedStartDate.getFullYear();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      if (
        selectedYear < currentYear ||
        (selectedYear === currentYear && selectedMonth < currentMonth)
      ) {
        setStartDateError('Please select valid time and date');
        isValid = false;
        if (!firstErrorField) firstErrorField = 'startDate';
      } else if (isAllDayEvent) {
        // For all-day events, check if start date is in the past
        const startDateTime = new Date(selectedStartDate);
        startDateTime.setHours(0, 0, 0, 0);
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        if (startDateTime < today) {
          setStartDateError('Please select valid time and date');
          isValid = false;
          if (!firstErrorField) firstErrorField = 'startDate';
        }
      } else {
        // For timed events, check if start date/time is in the past
        if (selectedStartTime && selectedStartTime.trim() !== '') {
          const startDateTime = new Date(selectedStartDate);
          const normalizedStartTime = selectedStartTime
            .trim()
            .replace(/\u00A0/g, ' ')
            .replace(/\s+/g, ' ');
          const startTimeMatch = normalizedStartTime.match(
            /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i,
          );

          if (startTimeMatch) {
            let hours = parseInt(startTimeMatch[1], 10);
            const minutes = parseInt(startTimeMatch[2], 10);
            const period = startTimeMatch[3].toUpperCase();

            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;

            startDateTime.setHours(hours, minutes, 0, 0);

            if (startDateTime < now) {
              setStartTimeError('Please select valid time and date');
              isValid = false;
              if (!firstErrorField) firstErrorField = 'startTime';
            }
          }
        }
      }
    }

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

      // Only proceed with time parsing if both times are provided
      if (
        selectedStartTime &&
        selectedStartTime.trim() &&
        selectedEndTime &&
        selectedEndTime.trim()
      ) {
        // Validate that end date/time is after start date/time
        const startDateTime = new Date(selectedStartDate);
        const endDateTime = new Date(selectedEndDate);

        // Parse start time (handle non-breaking spaces)
        const normalizedStartTime = selectedStartTime
          .trim()
          .replace(/\u00A0/g, ' ')
          .replace(/\s+/g, ' ');
        const startTimeMatch = normalizedStartTime.match(
          /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i,
        );

        if (!startTimeMatch) {
          setStartTimeError('Invalid start time format');
          isValid = false;
        } else {
          // Only parse if match is successful
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
        }

        // Parse end time (handle non-breaking spaces)
        const normalizedEndTime = selectedEndTime
          .trim()
          .replace(/\u00A0/g, ' ')
          .replace(/\s+/g, ' ');
        const endTimeMatch = normalizedEndTime.match(
          /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i,
        );

        if (!endTimeMatch) {
          setEndTimeError('Invalid end time format');
          isValid = false;
        } else {
          // Only parse if match is successful
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

          // Validate that end date/time is strictly after start date/time (only if both parsed successfully)
          if (startTimeMatch && endTimeMatch) {
            console.log('DEBUG - Date/Time Validation:', {
              startDateTime: startDateTime.toISOString(),
              endDateTime: endDateTime.toISOString(),
              startTime: selectedStartTime,
              endTime: selectedEndTime,
              isValid: endDateTime > startDateTime,
            });

            if (endDateTime <= startDateTime) {
              setDateTimeError('End time must be after start time');
              isValid = false;
              if (!firstErrorField) firstErrorField = 'endTime';
            }
          }
        }
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
                    animated: true,
                  });
                }
              },
              error => {
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
                          animated: true,
                        });
                      }
                    },
                  );
                }
              },
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
      if (
        eventData.locationType === 'google' &&
        googleIntegration?.isConnected
      ) {
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
            ...(eventData.guests?.map(email => ({
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
            eventId: payload.eventId,
          });
          const data = response?.data?.data || response?.data;

          if (data?.hangoutLink) {
            console.log(
              '✅ Google Meet updated via backend:',
              data.hangoutLink,
            );
            eventData.location = data.hangoutLink;
            eventData.meetingEventId = data.id;

            // ✅ Rebuild metadata list to include the updated Google Meet meeting link
            console.log(
              '🔄 Rebuilding metadata with updated Google Meet meeting link',
            );
            const updatedMetadataList = buildEventMetadata(
              eventData as any,
              null,
            );

            // Replace location-related items in the list with updated ones
            let updatedList = eventData.list.filter(
              (item: any) =>
                item.key !== 'location' &&
                item.key !== 'locationType' &&
                item.key !== 'meetingEventId',
            );

            // Add updated location items
            updatedMetadataList.forEach((item: any) => {
              if (
                item.key === 'location' ||
                item.key === 'locationType' ||
                item.key === 'meetingEventId'
              ) {
                updatedList.push(item);
              }
            });

            eventData.list = updatedList;
            console.log(
              '✅ Updated metadata with Google Meet link:',
              updatedList.filter(
                (item: any) =>
                  item.key === 'location' ||
                  item.key === 'locationType' ||
                  item.key === 'meetingEventId',
              ),
            );
          } else {
            console.error('❌ Failed to update Google Meet via backend:', data);
          }
        } catch (err) {
          console.error('❌ Google Meet update error via backend:', err);
        }
      }

      // ✅ If Zoom is selected and user is connected to Zoom
      if (eventData.locationType === 'zoom' && zoomIntegration?.isConnected) {
        console.log('Updating Zoom meeting...');
        console.log(
          '🔍 Full Zoom Integration State:',
          JSON.stringify(zoomIntegration, null, 2),
        );

        // Validate token exists
        if (!zoomIntegration.accessToken) {
          console.error('❌ Zoom access token is missing!');
          Alert.alert(
            'Error',
            'Zoom access token is missing. Please reconnect your Zoom account.',
          );
          return; // Don't proceed with event update if token is missing
        }

        // ✅ Build Zoom update payload - same structure as create, but with meetingId
        const startTime = new Date(selectedStartDate);
        const endTime = new Date(selectedEndDate);
        const durationMinutes = Math.round(
          (endTime.getTime() - startTime.getTime()) / (1000 * 60),
        );

        const zoomMeetingUpdate = {
          topic: eventData.title || 'Updated Meeting',
          start_time: startTime.toISOString(),
          duration: durationMinutes,
          timezone: 'UTC',
          userName: activeAccount.userName,
          type: 'appointment',
          meetingId: eventData.meetingEventId, // Use existing meeting ID for update
        };

        console.log(
          '📤 Sending to /zoom/meetings with payload:',
          zoomMeetingUpdate,
        );
        console.log(
          '🔑 Zoom access token:',
          zoomIntegration.accessToken.substring(0, 20) + '...',
        );

        try {
          // ✅ Call backend API to update Zoom meeting (same endpoint as create)
          const response = await api(
            'POST',
            '/zoom/meetings',
            zoomMeetingUpdate,
            undefined,
            'api',
          );

          console.log('✅ Zoom API Update Response Status:', response.status);
          console.log('✅ Zoom API Update Response Data:', response.data);

          // Extract zoom meeting link from response
          const data = response?.data?.data || response?.data;

          if (data?.join_url || data?.joinUrl) {
            const zoomLink = data.join_url || data.joinUrl;
            console.log('✅ Zoom meeting updated via backend:', zoomLink);
            eventData.location = zoomLink;
            eventData.meetingEventId = data.id || eventData.meetingEventId;

            // ✅ Rebuild metadata list to include the updated Zoom meeting link
            console.log(
              '🔄 Rebuilding metadata with updated Zoom meeting link',
            );
            const updatedMetadataList = buildEventMetadata(
              eventData as any,
              null,
            );

            // Replace location-related items in the list with updated ones
            let updatedList = eventData.list.filter(
              (item: any) =>
                item.key !== 'location' &&
                item.key !== 'locationType' &&
                item.key !== 'meetingEventId',
            );

            // Add updated location items
            updatedMetadataList.forEach((item: any) => {
              if (
                item.key === 'location' ||
                item.key === 'locationType' ||
                item.key === 'meetingEventId'
              ) {
                updatedList.push(item);
              }
            });

            eventData.list = updatedList;
            console.log(
              '✅ Updated metadata with Zoom link:',
              updatedList.filter(
                (item: any) =>
                  item.key === 'location' ||
                  item.key === 'locationType' ||
                  item.key === 'meetingEventId',
              ),
            );
          } else {
            console.error(
              '❌ Failed to update Zoom meeting via backend:',
              data,
            );
            Alert.alert('Error', 'Failed to update Zoom meeting');
          }
        } catch (err) {
          console.error('❌ Zoom meeting update error via backend:', err);
          Alert.alert('Error', 'Failed to update Zoom meeting');
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
          (eventData?.list || []).find((i: any) => i.key === 'meetingEventId')
            ?.value || '';

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

        // Optimistically update event in local state for immediate UI feedback (like create flow)
        if (userEvents && Array.isArray(userEvents)) {
          const updatedEvents = userEvents.map((event: any) => {
            if (event.uid === eventData.uid) {
              return {
                ...event,
                title: eventData.title,
                description: eventData.description,
                fromTime: eventData.fromTime,
                toTime: eventData.toTime,
                list: eventData.list || [],
              };
            }
            return event;
          });
          setUserEvents(updatedEvents);
          console.log('✅ Event updated optimistically in local state');
        }

        // Navigate back immediately (don't wait for refresh)
        navigation.goBack();

        // Show success toast at the top
        setTimeout(() => {
          toast.success('', 'Event updated successfully!');
        }, 300);

        // Refresh events in background (non-blocking) - this will sync with server
        getUserEvents(activeAccount.userName, api).catch(err => {
          console.error('Background event refresh failed:', err);
        });
      } else {
        showAlert(
          'Event Update Failed',
          'Failed to update event. Please try again.',
          'error',
        );
      }
    } catch (error: any) {
      console.error('❌ Error in handleEditEvent:', error);
      // Show user-friendly error message from blockchain service
      const errorMessage =
        error?.message || 'Failed to update event. Please try again.';
      showAlert('Event Update Failed', errorMessage, 'error');
    }
  };

  const handleCreateEvent = async (eventData: any, activeAccount: any) => {
    try {
      // If Google Meet is selected
      if (
        eventData.locationType === 'google' &&
        googleIntegration?.isConnected
      ) {
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
            ...(eventData.guests?.map(email => ({
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
            console.log(
              '✅ Google Meet created via backend:',
              data.hangoutLink,
            );
            eventData.location = data.hangoutLink;
            eventData.meetingEventId = data.id;

            // ✅ Rebuild metadata list to include the Google Meet meeting link
            console.log('🔄 Rebuilding metadata with Google Meet meeting link');
            const updatedMetadataList = buildEventMetadata(
              eventData as any,
              null,
            );

            // Replace location-related items in the list with updated ones
            let updatedList = eventData.list.filter(
              (item: any) =>
                item.key !== 'location' &&
                item.key !== 'locationType' &&
                item.key !== 'meetingEventId',
            );

            // Add updated location items
            updatedMetadataList.forEach((item: any) => {
              if (
                item.key === 'location' ||
                item.key === 'locationType' ||
                item.key === 'meetingEventId'
              ) {
                updatedList.push(item);
              }
            });

            eventData.list = updatedList;
            console.log(
              '✅ Updated metadata with Google Meet link:',
              updatedList.filter(
                (item: any) =>
                  item.key === 'location' ||
                  item.key === 'locationType' ||
                  item.key === 'meetingEventId',
              ),
            );
          } else {
            console.error('❌ Failed to create Google Meet via backend:', data);
          }
        } catch (err) {
          console.error('❌ Google Meet creation error via backend:', err);
        }
      }

      // If Zoom is selected
      if (eventData.locationType === 'zoom' && zoomIntegration?.isConnected) {
        console.log('Creating Zoom meeting...');
        console.log(
          '🔍 Full Zoom Integration State:',
          JSON.stringify(zoomIntegration, null, 2),
        );

        // Validate token exists
        if (!zoomIntegration.accessToken) {
          console.error('❌ Zoom access token is missing!');
          Alert.alert(
            'Error',
            'Zoom access token is missing. Please reconnect your Zoom account.',
          );
          return; // Don't proceed with event creation if token is missing
        }

        // ✅ Build Zoom-native payload matching backend requirements
        const startTime = new Date(selectedStartDate);
        const endTime = new Date(selectedEndDate);
        const durationMinutes = Math.round(
          (endTime.getTime() - startTime.getTime()) / (1000 * 60),
        );

        const zoomMeeting = {
          topic: eventData.title || 'New Meeting',
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration: durationMinutes,
          timezone: 'UTC',
          userName: activeAccount.userName,
          type: 'appointment',
        };

        console.log('📤 Sending to /zoom/meetings with payload:', zoomMeeting);
        console.log(
          ' Zoom access token:',
          zoomIntegration.accessToken.substring(0, 20) + '...',
        );

        try {
          //  Call backend API with correct payload structure using API token authentication
          const response = await api(
            'POST',
            '/zoom/meetings',
            zoomMeeting,
            undefined,
            'api',
          );

          console.log('✅ Zoom API Response Status:', response.status);
          console.log('✅ Zoom API Response Data:', response.data);

          // Extract zoom meeting link from response
          const data = response?.data?.data || response?.data;

          if (data?.join_url || data?.joinUrl || data?.hangoutLink) {
            const zoomLink = data.join_url || data.joinUrl || data?.hangoutLink;
            console.log('✅ Zoom meeting created via backend:', zoomLink);
            eventData.location = zoomLink;
            eventData.meetingEventId = data.id;

            // ✅ Rebuild metadata list to include the Zoom meeting link
            console.log('🔄 Rebuilding metadata with Zoom meeting link');
            const updatedMetadataList = buildEventMetadata(
              eventData as any,
              null,
            );

            // Replace location-related items in the list with updated ones
            let updatedList = eventData.list.filter(
              (item: any) =>
                item.key !== 'location' &&
                item.key !== 'locationType' &&
                item.key !== 'meetingEventId',
            );

            // Add updated location items
            updatedMetadataList.forEach((item: any) => {
              if (
                item.key === 'location' ||
                item.key === 'locationType' ||
                item.key === 'meetingEventId'
              ) {
                updatedList.push(item);
              }
            });

            eventData.list = updatedList;
            console.log(
              '✅ Updated metadata with Zoom link:',
              updatedList.filter(
                (item: any) =>
                  item.key === 'location' ||
                  item.key === 'locationType' ||
                  item.key === 'meetingEventId',
              ),
            );
          } else {
            console.warn(
              'No Zoom meeting link returned, continuing without it',
            );
          }
        } catch (err: any) {
          console.error('Zoom meeting creation error:', {
            status: err.response?.status,
            statusText: err.response?.statusText,
            fullUrl: err.config?.url,
            baseURL: err.config?.baseURL,
            urlPath: err.config?.url?.replace(err.config?.baseURL, ''),
            method: err.config?.method,
            headers: err.config?.headers,
            message: err.message,
            data: err.response?.data,
            requestPayload: err.config?.data,
          });
          // Don't fail event creation if Zoom meeting fails - continue with event
          console.log('Continuing event creation without Zoom meeting');
        }
      }

      console.log('Active account: ', activeAccount.userName);
      console.log('Create event payload: ', eventData);
      const blockchainService = new BlockchainService(NECJSPRIVATE_KEY);
      const response = await blockchainService.createEvent(
        eventData,
        activeAccount,
        token,
      );
      if (response) {
        // Build updatePayload similar to handleEditEvent
        const repeatEvents = (eventData?.list || [])
          .filter((data: any) => data.key === 'repeatEvent')
          .map((data: any) => data.value)
          .filter((value: any) => value !== null);
        const customRepeat = (eventData?.list || [])
          .filter((data: any) => data.key === 'customRepeatEvent')
          .map((data: any) => data.value)
          .filter((value: any) => value !== null);
        const meetingEventIdValue =
          (eventData?.list || []).find((i: any) => i.key === 'meetingEventId')
            ?.value || '';

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
        // Call the same API as edit
        const apiResponse = await api('POST', '/updateevents', updatePayload);
        console.log('API response data (create):', apiResponse.data);

        // Optimistically add event to local state for immediate UI feedback (like tasks)
        if (userEvents && Array.isArray(userEvents)) {
          const newEvent = {
            uid: eventData.uid,
            title: eventData.title,
            description: eventData.description,
            fromTime: eventData.fromTime,
            toTime: eventData.toTime,
            list: eventData.list || [],
          };
          setUserEvents([...userEvents, newEvent]);
          console.log(' Event added optimistically to local state');
          console.log(
            ' Event list includes guests:',
            eventData.list?.filter((item: any) => item.key === 'guest') || [],
          );
        }

        // Refresh events in background (non-blocking) - this will merge with optimistic event
        getUserEvents(activeAccount.userName, api).catch(err => {
          console.error('Background event refresh failed:', err);
        });

        // Navigate back immediately (don't wait for refresh)
        navigation.goBack();

        // Show success toast at the top
        setTimeout(() => {
          toast.success('', 'Event created successfully!');
        }, 300);
      } else {
        showAlert(
          'Event Creation Failed',
          'Failed to create event. Please try again.',
          'error',
        );
      }
    } catch (error: any) {
      console.error('Error creating event:', error);
      // Show user-friendly error message from blockchain service
      const errorMessage =
        error?.message || 'Failed to create event. Please try again.';
      showAlert('Event Creation Failed', errorMessage, 'error');
    }
  };

  const handleSaveEvent = async () => {
    // ✅ FAST VALIDATION - Return immediately if invalid
    if (!validateForm()) {
      return;
    }

    // Additional validation: Ensure title is not empty (double-check)
    if (!title || !title.trim() || title.trim().length === 0) {
      setTitleError('Title is required');
      Alert.alert('Validation Error', 'Please enter a title for the event');
      return;
    }

    setIsLoading(true);

    if (!activeAccount || !token) {
      Alert.alert('Error', 'Authentication data not found');
      setIsLoading(false);
      return;
    }

    try {
      // Convert date and time to timestamp format (YYYYMMDDTHHMMSS)
      const formatToISO8601Local = (
        date: Date,
        time: string,
        isAllDay: boolean = false,
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
        const normalizedTime = time
          .trim()
          .replace(/\u00A0/g, ' ')
          .replace(/\s+/g, ' ');
        console.log('DEBUG - Original time:', JSON.stringify(time));
        console.log('DEBUG - Normalized time:', JSON.stringify(normalizedTime));

        // Use regex to extract time components (more robust than split)
        const timeMatch = normalizedTime.match(
          /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i,
        );

        if (!timeMatch) {
          // Fallback: try splitting by whitespace
          const timeParts = normalizedTime.split(/\s+/);
          console.log('DEBUG - Split result (fallback):', timeParts);

          if (timeParts.length < 2) {
            console.error(
              'DEBUG - Time format should be "HH:MM AM/PM", got:',
              normalizedTime,
            );
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
        console.log(
          'DEBUG - Regex match - hours:',
          hours,
          'minutes:',
          minutes,
          'period:',
          period,
        );

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
      // Build recurrence data from current state
      const repeatEventValue =
        selectedRecurrence !== 'Does not repeat' ? selectedRecurrence : '';

      // Build custom recurrence string if it's a custom recurrence
      let customRepeatEventValue = '';
      if (
        selectedRecurrence.startsWith('Every ') &&
        selectedRecurrence !== 'Every Weekday (Monday to Friday)'
      ) {
        // This is a custom recurrence, format it
        const {
          repeatEvery,
          repeatUnit,
          repeatOn,
          endsType,
          endsAfter,
          endsDate,
        } = customRecurrence;
        // Format endsDate as YYYYMMDD if it's a Date object
        const formattedEndsDate = endsDate
          ? `${endsDate.getFullYear()}${String(
              endsDate.getMonth() + 1,
            ).padStart(2, '0')}${String(endsDate.getDate()).padStart(2, '0')}`
          : '';
        customRepeatEventValue = `${repeatEvery}|${repeatUnit}|${repeatOn.join(
          ',',
        )}|${endsType}|${endsAfter}|${formattedEndsDate}`;
      }

      // Prepare event data in the new format (before building metadata)
      const eventDataForMetadata = {
        uuid: mode === 'edit' && editEventData?.uuid ? editEventData.uuid : '', // Preserve original uuid when editing
        uid:
          mode === 'edit' && editEventData?.uid
            ? editEventData.uid
            : generateEventUID(), // Preserve original UID when editing
        title: title.trim(),
        description: description.trim(),
        fromTime: formatToISO8601Local(
          selectedStartDate,
          selectedStartTime || '12:00 AM', // Use midnight if no time
          isAllDayEvent,
        ),
        toTime: formatToISO8601Local(
          isAllDayEvent ? getNextDay(selectedEndDate) : selectedEndDate, // ✅ Add 1 day for all-day
          selectedEndTime || '12:00 AM', // Use midnight if no time
          isAllDayEvent,
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
        customRepeatEvent: customRepeatEventValue || undefined,
        list: mode === 'edit' && editEventData?.list ? editEventData.list : [], // Preserve existing list for edit mode
      };

      // Build complete metadata list using buildEventMetadata (includes guests, location, etc.)
      console.log('🔍 Building metadata with guests:', selectedGuests);
      console.log('🔍 Event data for metadata:', {
        guests: eventDataForMetadata.guests,
        location: eventDataForMetadata.location,
        organizer: eventDataForMetadata.organizer,
      });

      const metadataList = buildEventMetadata(
        eventDataForMetadata as any,
        null,
      );

      console.log('🔍 Metadata list built:', metadataList);
      console.log(
        '🔍 Guest items in metadata:',
        metadataList.filter((item: any) => item.key === 'guest'),
      );

      // If editing, merge with existing list to preserve items like isDeleted, etc.
      let finalList = metadataList;
      if (
        mode === 'edit' &&
        editEventData?.list &&
        Array.isArray(editEventData.list)
      ) {
        // Preserve special items from existing list (but not guests, location, etc. - those come from new metadata)
        const preservedItems = editEventData.list.filter(
          (item: any) =>
            item.key === 'isDeleted' ||
            item.key === 'deletedTime' ||
            item.key === 'isPermanentDelete' ||
            item.key === 'task' ||
            item.key === 'done',
        );

        // Use the new metadata list (which includes updated guests, location, etc.)
        // Combine preserved items with new metadata
        finalList = [...preservedItems, ...metadataList];
      }

      console.log(
        '🔍 Final list with guests:',
        finalList.filter((item: any) => item.key === 'guest'),
      );

      // Prepare final event data with complete list
      const eventData = {
        ...eventDataForMetadata,
        list: finalList,
      };

      console.log('>>>>>>>> START DATE/TIME <<<<<<<<', {
        startDate: selectedStartDate?.toISOString(),
        startDateFormatted: selectedStartDate?.toLocaleDateString(),
        startTime: selectedStartTime,
      });
      console.log('>>>>>>>> END DATE/TIME <<<<<<<<', {
        endDate: selectedEndDate?.toISOString(),
        endDateFormatted: selectedEndDate?.toLocaleDateString(),
        endTime: selectedEndTime,
      });
      console.log('>>>>>>>> EDIT EVENT DATA <<<<<<<<', eventData);
      // return;
      if (mode == 'edit') {
        await handleEditEvent(eventData, activeAccount);
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
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const videoConferencingDisplay = getVideoConferencingDisplay(
    selectedVideoConferencing,
  );

  // Close any open inline dropdowns/modals when another is about to open
  const closeInlineDropdowns = React.useCallback(() => {
    setShowVideoConferencingOptions(false);
    setShowRecurrenceDropdown(false);
    setShowEventTypeDropdown(false);
    setShowGuestDropdown(false);
    setShowGuestModal(false);
    setShowCalendarModal(false);
    setShowTimezoneModal(false);
  }, []);

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

      {/* Header - Match task screen design */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {mode === 'edit' ? 'Edit Event' : 'Create Event'}
          </Text>
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: scaleHeight(20) }}
          bounces={false}
        >
          <View style={styles.formContainer}>
            {/* Title Input */}
            <View
              ref={titleInputRef}
              style={styles.fieldContainer}
              collapsable={false}
            >
              <Text style={styles.labelText}>Add title</Text>
              <TextInput
                style={[
                  styles.titleInput,
                  activeField === 'title' && styles.fieldActiveInput,
                ]}
                placeholder="Write here"
                placeholderTextColor="#A4A7AE"
                value={title}
                onFocus={() => {
                  setActiveField('title');
                  setShowRecurrenceDropdown(false);
                  setShowVideoConferencingOptions(false);
                }}
                onBlur={() => setActiveField(null)}
                onChangeText={text => {
                  setTitle(text);
                  if (titleError) setTitleError('');
                }}
                editable={!isLoading}
              />
              {titleError ? (
                <Text style={styles.fieldErrorText}>{titleError}</Text>
              ) : null}
            </View>

            {/* Start Date and Time */}
            <View
              ref={dateTimeSectionRef}
              style={styles.fieldContainer}
              collapsable={false}
            >
              <Text style={styles.labelText}>Start Date and Time</Text>
              <TouchableOpacity
                style={styles.datePicker}
                onPress={() => {
                  if (!isLoading) {
                    closeInlineDropdowns();
                    setCalendarMode('from');
                    setShowCalendarModal(true);
                  }
                }}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.selectorText,
                    selectedStartDate && styles.selectorTextFilled,
                  ]}
                >
                  {selectedStartDate
                    ? isAllDayEvent
                      ? selectedStartDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : selectedStartTime
                      ? `${selectedStartDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })} ${selectedStartTime}`
                      : 'Select'
                    : 'Select'}
                </Text>
                <FeatherIcon name="calendar" size={20} color="#A4A7AE" />
              </TouchableOpacity>
              {(startDateError || startTimeError) && (
                <Text style={styles.fieldErrorText}>
                  {startDateError || startTimeError}
                </Text>
              )}
            </View>

            {/* End Date and Time */}
            <View style={styles.fieldContainer} collapsable={false}>
              <Text style={styles.labelText}>End Date and Time</Text>
              <TouchableOpacity
                style={styles.datePicker}
                onPress={() => {
                  if (!isLoading) {
                    closeInlineDropdowns();
                    setCalendarMode('to');
                    setShowCalendarModal(true);
                  }
                }}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.selectorText,
                    selectedEndDate && styles.selectorTextFilled,
                  ]}
                >
                  {selectedEndDate
                    ? isAllDayEvent
                      ? selectedEndDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : selectedEndTime
                      ? `${selectedEndDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })} ${selectedEndTime}`
                      : 'Select'
                    : 'Select'}
                </Text>
                <FeatherIcon name="calendar" size={20} color="#A4A7AE" />
              </TouchableOpacity>
              {(endDateError || endTimeError) && (
                <Text style={styles.fieldErrorText}>
                  {endDateError || endTimeError}
                </Text>
              )}
            </View>

            {/* Date/Time relationship validation error - shown below both fields */}
            {dateTimeError && (
              <View style={styles.dateTimeErrorContainer}>
                <Text style={styles.dateTimeErrorText}>{dateTimeError}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.allDayToggle}
              onPress={() => {
                if (isLoading) return;
                const newIsAllDay = !isAllDayEvent;
                setIsAllDayEvent(newIsAllDay);

                // Clear all error messages when toggling All Day
                setStartDateError('');
                setStartTimeError('');
                setEndDateError('');
                setEndTimeError('');
                setDateTimeError('');

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
              <View
                style={[
                  styles.checkbox,
                  isAllDayEvent && styles.checkboxSelected,
                ]}
              >
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
                  closeInlineDropdowns();
                  setShowTimezoneModal(true);
                }
              }}
              disabled={isLoading}
            >
              <Text style={styles.timezoneTagText}>
                {getSelectedTimezoneData().name}
              </Text>
            </TouchableOpacity>

            {/* Repeat Field - Match task screen design */}
            {showDetailedDateTime && (
              <View
                style={[styles.fieldContainer, styles.repeatFieldContainer]}
              >
                <Text style={styles.labelText}>Repeat</Text>
                <TouchableOpacity
                  style={[
                    styles.recurrenceContainer,
                    showRecurrenceDropdown && styles.fieldActive,
                  ]}
                  onPress={() => {
                    if (!isLoading) {
                      closeInlineDropdowns();
                      setShowRecurrenceDropdown(!showRecurrenceDropdown);
                      setActiveField(showRecurrenceDropdown ? null : 'repeat');
                    }
                  }}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.selectorText,
                      selectedRecurrence &&
                        selectedRecurrence !== 'Does not repeat' &&
                        styles.selectorTextFilled,
                    ]}
                  >
                    {selectedRecurrence}
                  </Text>
                  <ArrowDownIcon width={20} height={20} fill="#6C6C6C" />
                </TouchableOpacity>

                {/* Repeat Dropdown - Match task screen design */}
                {showRecurrenceDropdown && (
                  <View style={styles.repeatDropdown}>
                    <ScrollView
                      style={styles.repeatOptionsWrapper}
                      contentContainerStyle={styles.repeatOptionsContent}
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                      bounces={false}
                      scrollEnabled={true}
                      keyboardShouldPersistTaps="handled"
                      alwaysBounceVertical={false}
                      removeClippedSubviews={false}
                    >
                      {recurrenceOptions.map((option, index) => (
                        <TouchableOpacity
                          key={`${option}-${index}`}
                          style={[
                            styles.repeatOption,
                            selectedRecurrence === option &&
                              styles.repeatOptionSelected,
                          ]}
                          onPress={() => {
                            if (!isLoading) {
                              handleRecurrenceSelect(option);
                            }
                          }}
                          disabled={isLoading}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.repeatOptionText,
                              selectedRecurrence === option &&
                                styles.repeatOptionTextSelected,
                            ]}
                            numberOfLines={1}
                          >
                            {option}
                          </Text>
                          {selectedRecurrence === option && (
                            <FeatherIcon
                              name="check"
                              size={18}
                              color={colors.primaryBlue}
                            />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}

            {showRecurrenceDropdown && (
              <TouchableOpacity
                style={styles.recurrenceOverlay}
                activeOpacity={1}
                onPress={() => {
                  setShowRecurrenceDropdown(false);
                  setActiveField(null);
                }}
              />
            )}

            {/* Add people Field - Match task screen design */}
            <View style={styles.fieldContainer}>
              <Text style={styles.labelText}>Add people</Text>
              <GuestSelector
                isVisible={showGuestDropdown}
                selectedGuests={selectedGuests}
                onGuestSelect={handleGuestSelect}
                onToggleDropdown={() => {
                  if (!isLoading) {
                    closeInlineDropdowns();
                    setShowGuestDropdown(!showGuestDropdown);
                  }
                }}
                showGuestModal={showGuestModal}
                onToggleGuestModal={() => {
                  if (!isLoading) {
                    closeInlineDropdowns();
                    setShowGuestModal(!showGuestModal);
                  }
                }}
                searchQuery={guestSearchQuery}
                onSearchQueryChange={setGuestSearchQuery}
                disabled={isLoading}
              />
            </View>

            {/* Add video conferencing Field - Match task screen design */}
            <View style={styles.fieldContainer}>
              <Text style={styles.labelText} numberOfLines={2}>Add video conferencing</Text>
              <TouchableOpacity
                style={[
                  styles.datePicker,
                  activeField === 'videoConferencing' && styles.fieldActive,
                ]}
                onPress={() => {
                  if (!isLoading) {
                    closeInlineDropdowns();
                    setActiveField('videoConferencing');
                    setShowVideoConferencingOptions(
                      !showVideoConferencingOptions,
                    );
                  }
                }}
                disabled={isLoading}
              >
                <View style={styles.videoConferencingValueContainer}>
                  {videoConferencingDisplay.icon && (
                    <View style={styles.videoConferencingValueIcon}>
                      {videoConferencingDisplay.icon}
                    </View>
                  )}
                  <Text
                    style={[
                      styles.selectorText,
                      videoConferencingDisplay.filled &&
                        styles.selectorTextFilled,
                    ]}
                  >
                    {videoConferencingDisplay.label}
                  </Text>
                </View>
                <FeatherIcon name="chevron-down" size={20} color="#6C6C6C" />
              </TouchableOpacity>

              {/* Video Conferencing Dropdown */}
              {showVideoConferencingOptions && (
                <View style={styles.videoConferencingDropdown}>
                  {/* In-person option */}
                  <TouchableOpacity
                    style={[
                      styles.videoConferencingDropdownItem,
                      selectedVideoConferencing === 'inperson' &&
                        styles.videoConferencingDropdownItemSelected,
                    ]}
                    onPress={() => {
                      if (!isLoading) {
                        setSelectedVideoConferencing('inperson');
                        setLocation('');
                        setLocationError('');
                        setShowVideoConferencingOptions(false);
                      }
                    }}
                    disabled={isLoading}
                  >
                    <View style={styles.videoConferencingDropdownItemContent}>
                      <FeatherIcon name="map-pin" size={18} color="#6C6C6C" />
                      <Text style={styles.videoConferencingDropdownItemText}>
                        In-person meeting
                      </Text>
                    </View>
                    {selectedVideoConferencing === 'inperson' && (
                      <FeatherIcon
                        name="check"
                        size={18}
                        color={colors.primaryBlue}
                      />
                    )}
                  </TouchableOpacity>

                  {/* Google Meet option */}
                  <TouchableOpacity
                    style={[
                      styles.videoConferencingDropdownItem,
                      selectedVideoConferencing === 'google' &&
                        styles.videoConferencingDropdownItemSelected,
                    ]}
                    onPress={() => {
                      if (!isLoading) {
                        setSelectedVideoConferencing('google');
                        setLocation('');
                        setLocationError('');
                        setShowVideoConferencingOptions(false);
                        handleGoogleMeetClick();
                      }
                    }}
                    disabled={isLoading}
                  >
                    <View style={styles.videoConferencingDropdownItemContent}>
                      <MeetIcon width={18} height={18} />
                      <Text style={styles.videoConferencingDropdownItemText}>
                        Google Meet
                      </Text>
                    </View>
                    {selectedVideoConferencing === 'google' && (
                      <FeatherIcon
                        name="check"
                        size={18}
                        color={colors.primaryBlue}
                      />
                    )}
                  </TouchableOpacity>

                  {/* Zoom option */}
                  <TouchableOpacity
                    style={[
                      styles.videoConferencingDropdownItem,
                      selectedVideoConferencing === 'zoom' &&
                        styles.videoConferencingDropdownItemSelected,
                    ]}
                    onPress={() => {
                      if (!isLoading) {
                        setLocation('');
                        setLocationError('');
                        setSelectedVideoConferencing('zoom');
                        setShowVideoConferencingOptions(false);

                        if (!zoomIntegration.isConnected) {
                          setIntegrationType('zoom');
                          setShowIntegrationModal(true);
                        }
                      }
                    }}
                    disabled={isLoading}
                  >
                    <View style={styles.videoConferencingDropdownItemContent}>
                      <FeatherIcon name="video" size={18} color="#0B6DE0" />
                      <Text style={styles.videoConferencingDropdownItemText}>
                        Zoom Meeting
                      </Text>
                    </View>
                    {selectedVideoConferencing === 'zoom' && (
                      <FeatherIcon
                        name="check"
                        size={18}
                        color={colors.primaryBlue}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Overlay for video conferencing dropdown */}
            {showVideoConferencingOptions && (
              <TouchableOpacity
                style={styles.recurrenceOverlay}
                activeOpacity={1}
                onPress={() => {
                  setShowVideoConferencingOptions(false);
                  setActiveField(null);
                }}
              />
            )}

            {/* Add location - Match task screen design */}
            <View
              ref={locationSectionRef}
              style={styles.fieldContainer}
              collapsable={false}
            >
              <Text style={styles.labelText}>Add Location</Text>
              <TouchableOpacity
                style={[
                  styles.datePicker,
                  activeField === 'location' && styles.fieldActive,
                  (selectedVideoConferencing === 'google' ||
                    selectedVideoConferencing === 'zoom') &&
                    styles.fieldDisabled,
                ]}
                onPress={() => {
                  if (!isLoading) {
                    if (
                      selectedVideoConferencing !== 'google' &&
                      selectedVideoConferencing !== 'zoom'
                    ) {
                      setActiveField('location');
                      handleOpenLocationModal();
                    }
                  }
                }}
                disabled={
                  isLoading ||
                  selectedVideoConferencing === 'google' ||
                  selectedVideoConferencing === 'zoom'
                }
              >
                <FeatherIcon name="map-pin" size={20} color="#A4A7AE" />
                <Text
                  style={[
                    styles.selectorText,
                    location && styles.selectorTextFilled,
                    (selectedVideoConferencing === 'google' ||
                      selectedVideoConferencing === 'zoom') &&
                      styles.fieldDisabledText,
                  ]}
                >
                  {selectedVideoConferencing === 'google' ||
                  selectedVideoConferencing === 'zoom'
                    ? 'Location cannot be selected'
                    : location || 'Add Location'}
                </Text>
                <FeatherIcon name="plus" size={20} color="#6C6C6C" />
              </TouchableOpacity>
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
              placeholderTextColor="#A4A7AE"
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

            {/* Advanced Options - Only show when expanded */}
            {showAdvanced && (
              <AdvancedOptions
                notificationMinutes={parseInt(notificationMinutes) || 0}
                onNotificationMinutesChange={minutes =>
                  setNotificationMinutes(minutes.toString())
                }
                selectedTimeUnit={selectedTimeUnit}
                onTimeUnitChange={setSelectedTimeUnit}
                onAnyDropdownOpen={closeInlineDropdowns}
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

            {/* Description Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.labelText}>Description</Text>
              <TextInput
                style={[
                  styles.descriptionInput,
                  activeField === 'description' && styles.fieldActiveInput,
                ]}
                placeholder="Enter here.."
                value={description}
                onChangeText={setDescription}
                onFocus={() => {
                  setActiveField('description');
                  setShowRecurrenceDropdown(false);
                  setShowVideoConferencingOptions(false);
                }}
                onBlur={() => setActiveField(null)}
                multiline
                placeholderTextColor="#A4A7AE"
                editable={!isLoading}
              />
            </View>

            {/* Bottom Action Bar - Advanced Options and Create Button Inline */}
            <View style={styles.bottomActionBar}>
              <TouchableOpacity
                style={[
                  styles.advanceOptionsButton,
                  showAdvanced && styles.advanceOptionsButtonActive,
                ]}
                onPress={() => {
                  if (!isLoading) {
                    setShowAdvanced(!showAdvanced);
                  }
                }}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.advanceOptionsText,
                    showAdvanced && styles.advanceOptionsTextActive,
                  ]}
                  numberOfLines={1}
                >
                  Advanced options
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isLoading && styles.saveButtonDisabled,
                ]}
                disabled={isLoading}
                onPress={handleSaveEvent}
              >
                <Text style={styles.saveButtonText}>
                  {isLoading
                    ? mode === 'edit'
                      ? 'Updating...'
                      : 'Creating...'
                    : mode === 'edit'
                    ? 'Update'
                    : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Calendar with Time Modal */}
      <CalendarWithTime
        isVisible={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        onDateTimeSelect={handleDateTimeSelect}
        mode={calendarMode}
        selectedDate={
          calendarMode === 'from'
            ? selectedStartDate || undefined
            : selectedEndDate || undefined
        }
        selectedTime={
          calendarMode === 'from' ? selectedStartTime : selectedEndTime
        }
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
              <TouchableOpacity
                style={styles.timezoneModalCloseButton}
                onPress={() => setShowTimezoneModal(false)}
              >
                <Text style={styles.timezoneModalCloseText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.timezoneModalTitle}>Event time zone</Text>
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

            {/* Use Current Timezone Button - Aligned with timezone options */}
            <TouchableOpacity
              style={styles.useCurrentTimezoneButton}
              onPress={handleUseCurrentTimezone}
            >
              <Text style={styles.useCurrentTimezoneButtonText}>
                Use current time zone
              </Text>
            </TouchableOpacity>

            {/* Modal Footer */}
            <View style={styles.timezoneModalFooter}>
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
                <Text style={styles.timezoneModalOkText}>Ok</Text>
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
              <Text style={styles.customModalTitle}>Custom repeat</Text>
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
                  <View style={styles.customRepeatEveryColumn}>
                    <TextInput
                      style={styles.customRepeatEveryInput}
                      placeholder="Enter number"
                      placeholderTextColor="#A4A7AE"
                      value={customRecurrence.repeatEvery}
                      onChangeText={text => {
                        // Only allow positive integers (1-99)
                        // Remove any non-numeric characters
                        const numericOnly = text.replace(/[^0-9]/g, '');

                        // Prevent empty string or zero
                        if (numericOnly === '' || numericOnly === '0') {
                          // Don't update if it would be empty or zero
                          return;
                        }

                        // Limit to 2 digits (1-99)
                        const limitedValue =
                          numericOnly.length > 2
                            ? numericOnly.slice(0, 2)
                            : numericOnly;

                        setCustomRecurrence(prev => ({
                          ...prev,
                          repeatEvery: limitedValue,
                        }));
                      }}
                      keyboardType="numeric"
                      maxLength={2}
                    />
                    <View style={styles.customRepeatUnitContainer}>
                      <TouchableOpacity
                        style={styles.customRepeatUnitDropdown}
                        onPress={() => setShowUnitDropdown(prev => !prev)}
                      >
                        <Text
                          style={[
                            styles.customRepeatUnitText,
                            !repeatUnits.includes(customRecurrence.repeatUnit)
                              ? styles.customRepeatUnitTextPlaceholder
                              : null,
                          ]}
                        >
                          {repeatUnits.includes(customRecurrence.repeatUnit)
                            ? customRecurrence.repeatUnit
                            : 'Select'}
                        </Text>
                        <FeatherIcon
                          name="chevron-down"
                          size={14}
                          color="#6C6C6C"
                          style={{ paddingTop: 3 }}
                        />
                      </TouchableOpacity>
                      {showUnitDropdown && (
                        <View style={styles.customUnitDropdownContainer}>
                          {repeatUnits.map(unit => (
                            <TouchableOpacity
                              key={unit}
                              style={styles.customUnitDropdownItem}
                              onPress={() => {
                                setCustomRecurrence(prev => ({
                                  ...prev,
                                  repeatUnit: unit,
                                }));
                                setShowUnitDropdown(false);
                              }}
                            >
                              <Text style={styles.customUnitDropdownItemText}>
                                {unit}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Repeat on section */}
                {customRecurrence.repeatUnit === repeatUnits[1] && (
                  <View style={styles.customRecurrenceSection}>
                    <Text style={styles.customRecurrenceSectionTitle}>
                      Repeat on
                    </Text>
                    <View style={styles.customDaysList}>
                      {dayNames.map((day, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.customDayOption}
                          onPress={() => handleDayToggle(day)}
                        >
                          <View
                            style={[
                              styles.customDayCheckbox,
                              customRecurrence.repeatOn.includes(day) &&
                                styles.customDayCheckboxSelected,
                            ]}
                          >
                            {customRecurrence.repeatOn.includes(day) && (
                              <FeatherIcon
                                name="check"
                                size={14}
                                color="#000000"
                              />
                            )}
                          </View>
                          <Text
                            style={[
                              styles.customDayOptionText,
                              customRecurrence.repeatOn.includes(day) &&
                                styles.customDayOptionTextSelected,
                            ]}
                          >
                            {day}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
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
                    <View
                      style={[
                        styles.customCheckbox,
                        customRecurrence.endsType === endsOptions[0] &&
                          styles.customCheckboxSelected,
                      ]}
                    >
                      {customRecurrence.endsType === endsOptions[0] && (
                        <FeatherIcon name="check" size={14} color="#000000" />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.customEndsOptionText,
                        customRecurrence.endsType === endsOptions[0] &&
                          styles.customEndsOptionTextSelected,
                      ]}
                    >
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
                    <View
                      style={[
                        styles.customCheckbox,
                        customRecurrence.endsType === endsOptions[1] &&
                          styles.customCheckboxSelected,
                      ]}
                    >
                      {customRecurrence.endsType === endsOptions[1] && (
                        <FeatherIcon name="check" size={14} color="#000000" />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.customEndsOptionText,
                        customRecurrence.endsType === endsOptions[1] &&
                          styles.customEndsOptionTextSelected,
                      ]}
                    >
                      {endsOptions[1]}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.customEndsInput,
                        customRecurrence.endsType !== endsOptions[1] &&
                          styles.customEndsInputDisabled,
                      ]}
                      onPress={() => {
                        if (customRecurrence.endsType === endsOptions[1]) {
                          setShowEndsDatePicker(true);
                        }
                      }}
                      disabled={customRecurrence.endsType !== endsOptions[1]}
                    >
                      <Text
                        style={[
                          styles.customEndsInputText,
                          !customRecurrence.endsDate &&
                            styles.customEndsInputPlaceholder,
                        ]}
                      >
                        {customRecurrence.endsDate
                          ? (() => {
                              const date = customRecurrence.endsDate;
                              const month = String(
                                date.getMonth() + 1,
                              ).padStart(2, '0');
                              const day = String(date.getDate()).padStart(
                                2,
                                '0',
                              );
                              const year = date.getFullYear();
                              return `${month}/${day}/${year}`;
                            })()
                          : '04/09/2025'}
                      </Text>
                    </TouchableOpacity>
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
                    <View
                      style={[
                        styles.customCheckbox,
                        customRecurrence.endsType === endsOptions[2] &&
                          styles.customCheckboxSelected,
                      ]}
                    >
                      {customRecurrence.endsType === endsOptions[2] && (
                        <FeatherIcon name="check" size={14} color="#000000" />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.customEndsOptionText,
                        customRecurrence.endsType === endsOptions[2] &&
                          styles.customEndsOptionTextSelected,
                      ]}
                    >
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
            </ScrollView>

            {/* Date Picker Modal for Ends Date */}
            <Modal
              visible={showEndsDatePicker}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowEndsDatePicker(false)}
            >
              <View style={styles.datePickerModalOverlay}>
                <View style={styles.datePickerModalContainer}>
                  <View style={styles.datePickerModalHeader}>
                    <Text style={styles.datePickerModalTitle}>
                      Select End Date
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowEndsDatePicker(false)}
                      style={styles.datePickerModalCloseButton}
                    >
                      <Text style={styles.datePickerModalCloseText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <Calendar
                    onDayPress={day => {
                      const selectedDate = new Date(day.dateString);
                      setCustomRecurrence(prev => ({
                        ...prev,
                        endsDate: selectedDate,
                      }));
                      setShowEndsDatePicker(false);
                    }}
                    minDate={new Date().toISOString().split('T')[0]}
                    markedDates={
                      customRecurrence.endsDate
                        ? {
                            [customRecurrence.endsDate
                              .toISOString()
                              .split('T')[0]]: {
                              selected: true,
                              selectedColor: '#0B6DE0',
                            },
                          }
                        : {}
                    }
                    theme={{
                      selectedDayBackgroundColor: '#0B6DE0',
                      selectedDayTextColor: '#ffffff',
                      todayTextColor: '#0B6DE0',
                      arrowColor: '#0B6DE0',
                      monthTextColor: '#000000',
                      textDayFontWeight: '400',
                      textMonthFontWeight: 'bold',
                      textDayHeaderFontWeight: '600',
                    }}
                  />
                </View>
              </View>
            </Modal>

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
                <Text style={styles.customDoneButtonText}>Done</Text>
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
              <FeatherIcon name="map-pin" size={20} color="#A4A7AE" />
              <TextInput
                ref={locationModalInputRef}
                style={styles.locationModalInput}
                placeholder="Add location"
                placeholderTextColor="#A4A7AE"
                value={location}
                onChangeText={text => {
                  // Check for invalid characters
                  // Blocked: < > { } [ ] ( ) | \ ` ~ ^ / @ # $ % & * + = ? ! ; " _ -
                  const invalidChars = /[<>{}[\]()|\\`~^\/@#$%&*+=?!;"_-]/;
                  if (invalidChars.test(text)) {
                    // Show error message and don't update the location
                    setLocationError('Enter valid location');
                    return;
                  }

                  // If valid, update location and clear error
                  setLocation(text);
                  if (locationError) setLocationError('');
                  // Only search if text has non-whitespace characters
                  const trimmedText = text.trim();
                  if (trimmedText.length >= 2) {
                    debouncedFetchSuggestions(trimmedText);
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
                  {location.length >= 2
                    ? 'No locations found'
                    : 'Start typing to search locations...'}
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
          <TouchableOpacity
            style={styles.integrationModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowIntegrationModal(false)}
          />
          <View style={styles.integrationModalContainer}>
            <View style={styles.integrationModalHeader}>
              <Text style={styles.integrationModalTitle}>
                Integration Required
              </Text>
            </View>

            <View style={styles.integrationModalContent}>
              <Text style={styles.integrationModalDescription}>
                {integrationType === 'google'
                  ? 'To use Google Meet, you need to integrate your Google account first.'
                  : 'To use Zoom Meeting, you need to integrate your Zoom account first.'}
              </Text>
              <Text style={styles.integrationModalSubDescription}>
                {integrationType === 'google'
                  ? "You'll be redirected to Settings to connect your Google account."
                  : "You'll be redirected to Settings to connect your Zoom account."}
              </Text>
            </View>

            <View style={styles.integrationModalButtons}>
              <TouchableOpacity
                style={styles.integrationModalCancelButton}
                onPress={() => setShowIntegrationModal(false)}
                activeOpacity={0.7}
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
                activeOpacity={0.8}
              >
                <Text style={styles.integrationModalContinueText}>
                  Continue
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGrayBg, // #F5F5F5 - Match task screen
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
    backgroundColor: 'transparent',
    zIndex: 1004, // Below dropdown (1005) but above container
    pointerEvents: 'auto', // Allow overlay to capture touches for closing
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: scaleHeight(16),
    paddingBottom: scaleHeight(12),
    paddingHorizontal: scaleWidth(16),
    width: '100%',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: scaleWidth(4),
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: '#252B37',
    fontWeight: '700',
    fontFamily: Fonts.latoBold,
  },
  eventTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: scaleWidth(5),
  },
  eventTypeText: {
    fontSize: 16,
    color: colors.blackText, // Black color
    fontWeight: '700',
    fontFamily: Fonts.latoBold,
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
    fontWeight: '700',
    fontFamily: Fonts.latoBold,
  },
  arrowDropdown: {
    width: 12,
    height: 8,
    marginTop: 4,
    marginLeft: 1,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: scaleWidth(20),
    paddingTop: scaleHeight(20),
    paddingBottom: scaleHeight(20),
    overflow: 'visible',
  },
  inputSection: {
    marginBottom: scaleHeight(20),
  },
  fieldContainer: {
    marginBottom: scaleHeight(20),
  },
  labelText: {
    fontFamily: Fonts.latoMedium,
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    color: '#414651', // Gray-700
    marginBottom: scaleHeight(8),
  },
  titleInput: {
    fontSize: 12,
    fontFamily: Fonts.latoRegular,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: 0,
    color: '#252B37',
    paddingVertical: scaleHeight(12),
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: '#DCE0E5',
    borderRadius: 8,
    backgroundColor: colors.white,
    minHeight: scaleHeight(44),
  },
  fieldActiveInput: {
    borderColor: colors.primaryBlue,
  },
  fieldActive: {
    borderColor: colors.primaryBlue,
  },
  fieldDisabled: {
    borderColor: '#DCE0E5',
    backgroundColor: '#F5F5F5',
    opacity: 0.7,
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#DCE0E5',
    borderRadius: 8,
    paddingVertical: scaleHeight(12),
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.white,
    minHeight: scaleHeight(44),
  },
  selectorText: {
    fontSize: 14,
    fontFamily: Fonts.latoRegular,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: 0,
    color: '#A4A7AE', // Text color for placeholder/empty state
    flex: 1,
    marginLeft: spacing.sm,
  },
  selectorTextFilled: {
    color: '#252B37', // Text color when value is entered
  },
  fieldDisabledText: {
    color: '#A4A7AE',
    fontStyle: 'italic',
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
    fontSize: 12,
    fontFamily: Fonts.latoMedium,
    lineHeight: 12,
    letterSpacing: 0,
    color: colors.grey400,
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
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCE0E5',
    paddingVertical: scaleHeight(12),
    paddingHorizontal: spacing.sm,
    minHeight: scaleHeight(44),
    justifyContent: 'center',
  },
  timeSlotLabel: {
    fontSize: 12,
    fontFamily: Fonts.latoMedium,
    lineHeight: 12,
    letterSpacing: 0,
    color: colors.grey400,
    marginBottom: spacing.xs,
  },
  timeSlotValue: {
    fontSize: 12,
    fontFamily: Fonts.latoRegular,
    lineHeight: 18,
    letterSpacing: 0,
    color: '#252B37',
  },
  timeSlotValuePlaceholder: {
    color: '#A4A7AE',
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
    backgroundColor: colors.white,
    borderRadius: 8,
    textAlignVertical: 'top', // Aligns text to the top for Android
    borderWidth: 1,
    borderColor: '#DCE0E5',
    fontSize: 12,
    fontFamily: Fonts.latoRegular,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: 0,
    color: '#252B37',
    padding: spacing.md,
    minHeight: scaleHeight(150),
  },
  bottomActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: scaleHeight(20),
    marginBottom: scaleHeight(20),
    gap: scaleWidth(12),
  },
  advanceOptionsButton: {
    flex: 1,
    paddingVertical: scaleHeight(14),
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE0E5',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  advanceOptionsButtonActive: {
    borderColor: '#DCE0E5',
  },
  advanceOptionsText: {
    fontSize: fontSize.textSize14,
    color: '#A4A7AE',
    fontWeight: '600',
    fontFamily: Fonts.latoSemiBold,
  },
  advanceOptionsTextActive: {
    color: '#00AEEF',
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryBlue,
    paddingVertical: scaleHeight(14),
    paddingHorizontal: spacing.xl,
    ...shadows.sm,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: fontSize.textSize16,
    color: colors.white,
    fontWeight: '600',
    fontFamily: Fonts.latoBold,
  },
  videoConferencingOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  videoConferencingValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  videoConferencingValueIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  videoConferencingDropdown: {
    borderWidth: 1,
    borderColor: '#DCE0E5',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: colors.white,
    marginTop: -1,
    zIndex: 1005,
    elevation: 15,
  },
  videoConferencingDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scaleHeight(12),
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  videoConferencingDropdownItemSelected: {
    backgroundColor: '#F8F9FA',
  },
  videoConferencingDropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  videoConferencingDropdownItemText: {
    fontSize: 14,
    fontFamily: Fonts.latoRegular,
    color: '#252B37',
    marginLeft: spacing.sm,
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
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
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
  // Repeat Field Styles - Match task screen
  repeatFieldContainer: {
    position: 'relative',
    zIndex: 1006, // Higher z-index to ensure dropdown appears above everything
    marginBottom: scaleHeight(20),
  },
  recurrenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#DCE0E5',
    borderRadius: 8,
    paddingVertical: scaleHeight(12),
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.white,
    width: '100%',
    minHeight: scaleHeight(44),
  },
  repeatDropdown: {
    position: 'absolute',
    top: '100%',
    left: scaleWidth(10), // Add left margin to make it narrower
    right: scaleWidth(10), // Add right margin to make it narrower
    marginTop: scaleHeight(4),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0F2F1', // Light border for dropdown
    backgroundColor: colors.white,
    zIndex: 1005, // Higher z-index than overlay
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 15, // Higher elevation for Android
    maxHeight: scaleHeight(320), // Increased height to show more options
    overflow: 'hidden', // Ensure content doesn't overflow
  },
  repeatOptionsWrapper: {
    height: scaleHeight(320), // Fixed height - forces scrolling when content exceeds this
  },
  repeatOptionsContent: {
    paddingBottom: scaleHeight(12), // Compact padding at bottom
    paddingTop: scaleHeight(4), // Compact padding at top
  },
  repeatOption: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(10), // Reduced from 14 to make more compact
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
    minHeight: scaleHeight(38), // Reduced from 44 to make more compact
    backgroundColor: colors.white,
    width: '100%',
  },
  repeatOptionSelected: {
    backgroundColor: '#F0FBFF', // Light blue background for selected option
  },
  repeatOptionText: {
    fontSize: 14,
    color: colors.blackText,
    fontFamily: Fonts.latoMedium,
    flex: 1,
    marginRight: scaleWidth(8),
  },
  repeatOptionTextSelected: {
    color: colors.primaryBlue,
    fontFamily: Fonts.latoBold,
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
    overflow: 'visible',
    paddingHorizontal: spacing.md,
  },
  customRecurrenceSection: {
    marginBottom: spacing.lg,
    overflow: 'visible',
  },
  customRepeatEveryContainer: {
    position: 'relative',
    zIndex: 1000, // Add this
  },
  customRepeatEveryColumn: {
    flexDirection: 'column',
    width: '100%',
    gap: spacing.sm,
  },
  customRepeatEveryInput: {
    width: '100%',
    height: scaleHeight(40),
    borderWidth: 1,
    borderColor: '#DCE0E5',
    borderRadius: borderRadius.sm,
    textAlign: 'left',
    fontSize: fontSize.textSize14,
    color: '#252B37',
    paddingHorizontal: spacing.md,
    paddingVertical: 0,
    backgroundColor: colors.white,
    fontFamily: Fonts.latoRegular,
  },
  customRepeatUnitContainer: {
    position: 'relative',
    width: '100%',
  },
  customRepeatUnitDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#DCE0E5',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    height: scaleHeight(40),
    width: '100%',
    backgroundColor: colors.white,
  },
  customUnitDropdownContainer: {
    position: 'absolute',
    top: scaleHeight(45),
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#DCE0E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1001,
    maxHeight: scaleHeight(180),
  },
  customUnitDropdownItem: {
    paddingVertical: scaleHeight(10),
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  customUnitDropdownItemText: {
    fontSize: fontSize.textSize14,
    color: '#252B37',
    fontFamily: Fonts.latoRegular,
  },
  customRepeatUnitText: {
    fontSize: fontSize.textSize14,
    color: '#252B37',
    fontWeight: '400',
    marginRight: spacing.xs,
    fontFamily: Fonts.latoRegular,
  },
  customRepeatUnitTextPlaceholder: {
    color: '#A4A7AE',
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
    width: '92%',
    maxWidth: scaleWidth(480),
    maxHeight: '75%',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  customModalHeader: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  customModalTitle: {
    fontSize: fontSize.textSize18,
    fontWeight: '600',
    color: '#252B37',
    fontFamily: Fonts.latoBold,
  },

  customRecurrenceSectionTitle: {
    fontSize: fontSize.textSize14,
    fontWeight: '600',
    color: '#414651',
    marginBottom: spacing.md,
    fontFamily: Fonts.latoSemiBold,
  },
  customDaysList: {
    flexDirection: 'column',
    gap: spacing.xs,
  },
  customDayOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleHeight(8),
  },
  customDayCheckbox: {
    width: scaleWidth(20),
    height: scaleHeight(20),
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#A4A7AE',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginRight: spacing.md,
  },
  customDayCheckboxSelected: {
    backgroundColor: colors.white,
    borderColor: '#000000',
  },
  customDayOptionText: {
    fontSize: fontSize.textSize14,
    fontWeight: '400',
    color: '#A4A7AE',
    fontFamily: Fonts.latoRegular,
  },
  customDayOptionTextSelected: {
    color: '#000000',
  },
  customEndsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    flexWrap: 'nowrap',
  },
  customCheckbox: {
    width: scaleWidth(20),
    height: scaleHeight(20),
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#A4A7AE',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  customCheckboxSelected: {
    backgroundColor: colors.white,
    borderColor: '#000000',
  },
  customEndsOptionText: {
    fontSize: fontSize.textSize14,
    color: '#A4A7AE',
    fontWeight: '400',
    minWidth: scaleWidth(40),
    fontFamily: Fonts.latoRegular,
  },
  customEndsOptionTextSelected: {
    color: '#000000',
  },
  customEndsInput: {
    minWidth: scaleWidth(80),
    maxWidth: scaleWidth(100),
    borderWidth: 1,
    borderColor: '#DCE0E5',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    fontSize: fontSize.textSize12,
    color: colors.blackText,
    paddingVertical: spacing.sm,
    lineHeight: scaleHeight(13),
    justifyContent: 'center',
    flexShrink: 0,
  },
  customEndsInputDisabled: {
    backgroundColor: '#F5F5F5',
  },
  customEndsInputText: {
    fontSize: fontSize.textSize12,
    color: colors.blackText,
    flexShrink: 0,
    fontFamily: Fonts.latoRegular,
  },
  customEndsInputPlaceholder: {
    color: '#9E9E9E',
  },
  datePickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerModalContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '90%',
    maxWidth: scaleWidth(400),
  },
  datePickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  datePickerModalTitle: {
    fontSize: fontSize.textSize18,
    fontWeight: 'bold',
    color: colors.blackText,
  },
  datePickerModalCloseButton: {
    padding: spacing.xs,
  },
  datePickerModalCloseText: {
    fontSize: fontSize.textSize20,
    color: colors.blackText,
  },
  customEndsOccurrencesText: {
    fontSize: fontSize.textSize14,
    color: colors.blackText,
    marginLeft: spacing.xs,
    fontFamily: Fonts.latoRegular,
  },
  customModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    backgroundColor: colors.white,
  },
  customCancelButton: {
    paddingVertical: scaleHeight(12),
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: '#F3F4F6',
  },
  customCancelButtonText: {
    fontSize: fontSize.textSize14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: Fonts.latoMedium,
  },
  customDoneButton: {
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryBlue,
    paddingVertical: scaleHeight(12),
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customDoneButtonText: {
    fontSize: fontSize.textSize14,
    fontWeight: '600',
    color: colors.white,
    fontFamily: Fonts.latoSemiBold,
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
    marginTop: spacing.xs,
    marginBottom: scaleHeight(20),
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
    alignItems: 'center',
    gap: scaleWidth(4),
    marginBottom: spacing.lg,
  },
  timezoneModalTitle: {
    fontSize: 18,
    fontWeight: '400',
    color: '#252B37',
    fontFamily: Fonts.latoRegular,
  },
  timezoneModalCloseButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  timezoneModalCloseText: {
    fontSize: fontSize.textSize17,
    color: colors.blackText,
    fontWeight: '400',
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
    fontFamily: Fonts.latoRegular,
  },
  timezoneList: {
    maxHeight: scaleHeight(250),
    marginBottom: spacing.md,
  },
  timezoneItem: {
    paddingVertical: scaleHeight(12),
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timezoneItemSelected: {
    backgroundColor: '#F8F9FA',
  },
  timezoneItemText: {
    fontSize: 14,
    color: '#252B37',
    fontWeight: '400',
    fontFamily: Fonts.latoRegular,
  },
  timezoneItemTextSelected: {
    color: colors.primaryBlue,
    fontWeight: '600',
    fontFamily: Fonts.latoBold,
  },
  useCurrentTimezoneButton: {
    paddingVertical: scaleHeight(12),
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  useCurrentTimezoneButtonText: {
    fontSize: 14,
    color: '#252B37',
    fontWeight: '400',
    fontFamily: Fonts.latoRegular,
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
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    fontWeight: '400',
    fontFamily: Fonts.latoRegular,
  },
  timezoneModalOkButton: {
    flex: 0.5,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryBlue,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timezoneModalOkText: {
    fontSize: fontSize.textSize14,
    color: colors.white,
    fontWeight: '600',
    fontFamily: Fonts.latoSemiBold,
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
    color: '#252B37',
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
    paddingVertical: spacing.sm,
  },
  allDayText: {
    fontSize: 14,
    fontFamily: Fonts.latoRegular,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: 0,
    color: colors.blackText,
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
  integrationModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  integrationModalContainer: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(12),
    paddingTop: scaleHeight(24),
    paddingBottom: scaleHeight(24),
    paddingHorizontal: spacing.lg,
    maxHeight: '70%',
    minHeight: scaleHeight(300),
    width: '85%',
  },
  integrationModalHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  integrationModalIconContainer: {
    width: scaleWidth(64),
    height: scaleHeight(64),
    borderRadius: moderateScale(32),
    backgroundColor: '#E5F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  integrationModalTitle: {
    fontSize: fontSize.textSize18,
    fontWeight: '600',
    color: Colors.black,
    textAlign: 'center',
    fontFamily: Fonts.latoBold,
  },
  integrationModalContent: {
    marginBottom: spacing.xl,
  },
  integrationModalDescription: {
    fontSize: fontSize.textSize14,
    color: Colors.black,
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: 20,
    fontFamily: Fonts.latoRegular,
  },
  integrationModalSubDescription: {
    fontSize: fontSize.textSize12,
    color: themeColors.grey400,
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: Fonts.latoRegular,
  },
  integrationModalButtons: {
    flexDirection: 'row',
    paddingTop: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  integrationModalCancelButton: {
    flex: 1,
    paddingVertical: scaleHeight(18),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: themeColors.grey20,
    backgroundColor: Colors.white,
    minHeight: scaleHeight(56),
  },
  integrationModalCancelText: {
    fontSize: fontSize.textSize14,
    color: Colors.black,
    fontWeight: '500',
    fontFamily: Fonts.latoMedium,
  },
  integrationModalContinueButton: {
    flex: 1,
    borderRadius: moderateScale(8),
    backgroundColor: Colors.primaryBlue,
    paddingVertical: scaleHeight(18),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: scaleHeight(56),
  },
  integrationModalContinueText: {
    fontSize: fontSize.textSize14,
    color: Colors.white,
    fontWeight: '600',
    fontFamily: Fonts.latoBold,
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#DCE0E5',
    borderRadius: 8,
    paddingVertical: scaleHeight(12),
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.white,
    minHeight: scaleHeight(44),
  },
  selectorText: {
    fontSize: 12,
    fontFamily: Fonts.latoRegular,
    lineHeight: 18,
    letterSpacing: 0,
    color: '#A4A7AE',
    flex: 1,
  },
  selectorTextFilled: {
    color: '#252B37',
  },
});

export default CreateEventScreen;
