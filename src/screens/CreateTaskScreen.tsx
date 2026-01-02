import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Modal,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import CalendarWithTime from '../components/CalendarWithTime';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { moderateScale, scaleHeight, scaleWidth } from '../utils/dimensions';
import ClockIcon from '../assets/svgs/clock.svg';
import CalendarIcon from '../assets/svgs/calendar.svg';
import ArrowDownIcon from '../assets/svgs/arrow-down.svg';
import { Fonts } from '../constants/Fonts';
import {
  colors,
  fontSize,
  spacing,
  borderRadius,
  shadows,
} from '../utils/LightTheme';
import { AppNavigationProp } from '../navigations/appNavigation.type';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors } from '../constants/Colors';
import { dayAbbreviations, dayNames, timezones } from '../constants/dummyData';
import dayjs from 'dayjs';
import { useActiveAccount } from '../stores/useActiveAccount';
import { useToken } from '../stores/useTokenStore';
import { formatToISO8601 } from '../utils';
import { BlockchainService } from '../services/BlockChainService';
import { NECJSPRIVATE_KEY } from '../constants/Config';
import { useEventsStore } from '../stores/useEventsStore';
import { useApiClient } from '../hooks/useApi';
import { generateEventUID } from '../utils/eventUtils';
import CustomAlert from '../components/CustomAlert';
import { useToast } from '../hooks/useToast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 600;
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

const CreateTaskScreen = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const activeAccount = useActiveAccount(state => state.account);
  const token = useToken(state => state.token);
  const route = useRoute<any>();
  const { mode, eventData: editEventData } = route.params || {};
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const {
    getUserEvents,
    setUserEvents,
    userEvents,
    optimisticallyAddEvent,
    optimisticallyUpdateEvent,
    revertOptimisticUpdate,
  } = useEventsStore();
  const { api } = useApiClient();
  const blockchainService = new BlockchainService(NECJSPRIVATE_KEY);
  const toast = useToast();
  const [showRecurrenceDropdown, setShowRecurrenceDropdown] = useState(false);
  const [selectedRecurrence, setSelectedRecurrence] =
    useState('Does not repeat');
  const [showCustomRecurrenceModal, setShowCustomRecurrenceModal] =
    useState(false);
  const [activeField, setActiveField] = useState<
    'title' | 'date' | 'startTime' | 'endTime' | 'repeat' | 'description' | null
  >(null);
  const endsOptions = ['Never', 'On', 'After'];
  const [selectedValue, setSelectedValue] = useState(null);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [showEndsDatePicker, setShowEndsDatePicker] = useState(false);
  const [repeatEveryError, setRepeatEveryError] = useState('');
  const repeatEveryInputRef = React.useRef<TextInput>(null);
  const isRepeatEveryFocused = React.useRef(false);

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
  const getCurrentTimezone = React.useCallback(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneData = timezones.find(tz => tz.id === timezone);
    return (
      timezoneData || { id: timezone, name: timezone, offset: 'GMT+00:00' }
    );
  }, [timezones]);

  // Initialize selectedDate from editEventData.fromTime if editing (like CreateEventScreen)
  const getInitialDate = () => {
    if (mode === 'edit' && editEventData?.fromTime) {
      // Parse fromTime immediately to set initial date
      const year = editEventData.fromTime.substring(0, 4);
      const month = editEventData.fromTime.substring(4, 6);
      const day = editEventData.fromTime.substring(6, 8);
      if (year && month && day) {
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
    }
    return null;
  };

  const [selectedDate, setSelectedDate] = useState<Date | null>(
    getInitialDate(),
  );

  // Initialize customRecurrence after selectedDate is defined
  const [customRecurrence, setCustomRecurrence] = useState(() => {
    const weekday = getInitialDate()
      ? getInitialDate()!.toLocaleDateString('en-US', { weekday: 'long' })
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
  const [selectedStartTime, setSelectedStartTime] = useState(
    editEventData?.selectedStartTime || '',
  );
  const [selectedEndTime, setSelectedEndTime] = useState(
    editEventData?.selectedEndTime || '',
  );
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarModalMode, setCalendarModalMode] = useState<
    'date' | 'startTime' | 'endTime'
  >('date');

  const [showDetailedDateTime, setShowDetailedDateTime] = useState(
    !!editEventData,
  );

  // Update customRecurrence when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      const weekday = selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
      });
      setCustomRecurrence(prev => ({
        ...prev,
        repeatOn: [weekday],
      }));
    }
  }, [selectedDate]);

  // Error states
  const [titleError, setTitleError] = useState<string>('');
  const [dateError, setDateError] = useState<string>('');
  const [timeError, setTimeError] = useState<string>('');

  // Refs for scrolling
  const scrollViewRef = useRef<ScrollView>(null);
  const titleInputRef = useRef<View>(null);
  const dateTimeSectionRef = useRef<View>(null);
  const repeatFieldRef = useRef<View>(null);
  const [labelList, setLabelList] = useState([
    { label: 'My Tasks', value: '1' },
    { label: 'Work', value: '2' },
    { label: 'Personal', value: '3' },
  ]);
  const repeatUnits = ['Day', 'Week', 'Month', 'Year'];

  useEffect(() => {
    if (selectedDate) {
      const weekday = selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
      });
      setCustomRecurrence(prev => ({
        ...prev,
        repeatOn: [weekday],
      }));
    }
  }, [selectedDate]);

  const getRecurrenceOptions = (selectedDate: Date) => {
    const d = dayjs(selectedDate);
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

  const handleUnitSelect = unit => {
    setCustomRecurrence(prev => ({ ...prev, repeatUnit: unit }));
    setShowUnitDropdown(false);
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

  const handleDayToggle = (day: string) => {
    setCustomRecurrence(prev => ({
      ...prev,
      repeatOn: prev.repeatOn.includes(day)
        ? prev.repeatOn.filter(d => d !== day)
        : [...prev.repeatOn, day],
    }));
  };

  // Always use dynamic recurrence options based on selected date (same as CreateEventScreen)
  // Use current date as fallback if selectedDate is not set yet
  // Recalculate when selectedDate changes
  const recurrenceOptions = useMemo(() => {
    return getRecurrenceOptions(selectedDate || new Date());
  }, [selectedDate]);

  // Helper function to parse datetime from different formats (same as CreateEventScreen)
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
      // Handle YYYYMMDDTHHMMSS format (20250924T210000)
      else if (dateTimeString.match(/^\d{8}T\d{6}$/)) {
        const year = dateTimeString.substring(0, 4);
        const month = dateTimeString.substring(4, 6);
        const day = dateTimeString.substring(6, 8);
        const timePart = dateTimeString.substring(9); // Get HHMMSS
        const hour = dateTimeString.substring(9, 11);
        const minute = dateTimeString.substring(11, 13);
        const second = dateTimeString.substring(13, 15);

        // CHECK IF IT'S MIDNIGHT (ALL-DAY EVENT)
        if (timePart === '000000') {
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

        // Convert to 12-hour format manually to avoid locale issues
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
      // Handle date-only format (YYYYMMDD) - treat as all-day
      else if (dateTimeString.match(/^\d{8}$/)) {
        const year = dateTimeString.substring(0, 4);
        const month = dateTimeString.substring(4, 6);
        const day = dateTimeString.substring(6, 8);

        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (isNaN(date.getTime())) {
          console.error('Invalid YYYYMMDD date:', dateTimeString);
          return { date: null, time: '' };
        }

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

      return { date, time: timeString };
    } catch (error) {
      console.error('Error parsing datetime:', dateTimeString, error);
      return { date: null, time: '' };
    }
  };

  // Helper function to parse event data from tags/list (same as CreateEventScreen)
  const parseEventData = (eventData: any) => {
    if (!eventData) return {};

    const dataArray = eventData.list || eventData.tags || [];
    const parsedData: any = {};

    dataArray.forEach((item: any) => {
      const { key, value } = item;
      switch (key) {
        case 'repeatEvent':
          parsedData.repeatEvent = value;
          break;
        case 'customRepeatEvent':
          parsedData.customRepeatEvent = value;
          break;
        default:
          break;
      }
    });

    return parsedData;
  };

  useEffect(() => {
    console.log('Edit Task Data:', JSON.stringify(editEventData));

    if (mode === 'edit' && editEventData) {
      const parsedData = parseEventData(editEventData);
      console.log('Parsed Data from tags/list:', parsedData);

      // Set title
      setTitle(editEventData.title || '');

      // Set description
      setDescription(editEventData.description || '');

      // Parse date and time from fromTime (same as CreateEventScreen)
      if (editEventData.fromTime) {
        const startDateTime = parseDateTime(editEventData.fromTime);
        if (startDateTime.date) {
          setSelectedDate(startDateTime.date);
          // Store in 12-hour format (like CreateEventScreen)
          if (startDateTime.time) {
            setSelectedStartTime(startDateTime.time);
          } else {
            // All-day event
            setSelectedStartTime('');
          }
        }
      } else if (editEventData.date && editEventData.time) {
        // Fallback: parse from date and time strings if fromTime is not available
        const parsedDate = new Date(editEventData.date);
        if (!isNaN(parsedDate.getTime())) {
          setSelectedDate(parsedDate);
        }

        // Store in 12-hour format (like CreateEventScreen)
        setSelectedStartTime(editEventData.time);
      }

      // Set recurrence
      if (parsedData.repeatEvent) {
        setSelectedRecurrence(parsedData.repeatEvent);
      }

      // Set showDetailedDateTime if we have date/time
      if (
        editEventData.fromTime ||
        (editEventData.date && editEventData.time)
      ) {
        setShowDetailedDateTime(true);
      }
    }
  }, [mode, editEventData]);

  // Helper function to get original date/time from editEventData
  const getOriginalDateTime = React.useCallback(() => {
    if (mode === 'edit' && editEventData?.fromTime) {
      try {
        const fromTime = editEventData.fromTime;
        if (fromTime.length >= 15) {
          const year = parseInt(fromTime.substring(0, 4), 10);
          const month = parseInt(fromTime.substring(4, 6), 10) - 1;
          const day = parseInt(fromTime.substring(6, 8), 10);
          const hour = parseInt(fromTime.substring(9, 11), 10);
          const minute = parseInt(fromTime.substring(11, 13), 10);

          return new Date(year, month, day, hour, minute, 0);
        }
      } catch (error) {
        console.error('Error parsing original date/time:', error);
      }
    }
    return null;
  }, [mode, editEventData]);

  // Real-time validation for past date/time
  const validateDateTime = React.useCallback(() => {
    // Clear previous errors first
    setDateError('');
    setTimeError('');

    if (!selectedDate || !selectedStartTime) {
      return;
    }

    const currentTime = new Date();
    currentTime.setSeconds(0, 0); // Reset seconds and milliseconds for accurate comparison

    // In edit mode, check if original task is in the past
    if (mode === 'edit') {
      const originalDateTime = getOriginalDateTime();
      if (originalDateTime) {
        // If original task is in the past, allow editing (no validation needed)
        if (originalDateTime < currentTime) {
          return;
        }
        // If original task is in the future, validate that new date/time is not in the past
        // Continue with validation below
      } else {
        // If we can't parse original date/time, allow editing (safer default)
        return;
      }
    }

    // Check if the selected month is in the past
    const selectedMonth = selectedDate.getMonth();
    const selectedYear = selectedDate.getFullYear();
    const currentMonth = currentTime.getMonth();
    const currentYear = currentTime.getFullYear();

    if (
      selectedYear < currentYear ||
      (selectedYear === currentYear && selectedMonth < currentMonth)
    ) {
      setDateError('Please select valid time and date');
      return;
    }

    // Check if the selected date is in the past
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    const today = new Date(currentTime);
    today.setHours(0, 0, 0, 0);

    if (selectedDateOnly < today) {
      setDateError('Please select valid time and date');
      return;
    }

    // If same day, check if time is in the past
    if (selectedDateOnly.getTime() === today.getTime()) {
      if (selectedStartTime && selectedStartTime.trim() !== '') {
        // Parse time from 12-hour format (e.g., "11:30 AM") or 24-hour format (e.g., "11:30")
        const normalizedTime = selectedStartTime
          .trim()
          .replace(/\u00A0/g, ' ')
          .replace(/\s+/g, ' ');
        const timeMatch = normalizedTime.match(
          /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i,
        );

        if (timeMatch) {
          // 12-hour format
          let hours = parseInt(timeMatch[1], 10);
          const minutes = parseInt(timeMatch[2], 10);
          const period = timeMatch[3].toUpperCase();

          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;

          const selectedDateTime = new Date(selectedDate);
          selectedDateTime.setHours(hours, minutes, 0, 0);

          if (selectedDateTime < currentTime) {
            setTimeError('Please select valid time and date');
            return;
          }
        } else {
          // Try 24-hour format (HH:MM)
          const [hours, minutes] = selectedStartTime.split(':');
          const hour24 = parseInt(hours, 10);
          const minute24 = parseInt(minutes, 10);

          if (!isNaN(hour24) && !isNaN(minute24)) {
            const selectedDateTime = new Date(selectedDate);
            selectedDateTime.setHours(hour24, minute24, 0, 0);

            if (selectedDateTime < currentTime) {
              setTimeError('Please select valid time and date');
              return;
            }
          }
        }
      }
    }

    // If we reach here, validation passed - errors are already cleared at the start
  }, [mode, selectedDate, selectedStartTime, getOriginalDateTime]);

  // Validate when date/time changes
  useEffect(() => {
    validateDateTime();
  }, [validateDateTime]);

  const handleDateTimeSelect = (
    date: Date,
    startTime: string,
    endTime?: string,
  ) => {
    // Clear errors first
    setDateError('');
    setTimeError('');

    // Normalize time to prevent AM/PM duplication
    // Remove any duplicate AM/PM patterns (e.g., "10:00 AM AM" -> "10:00 AM")
    let normalizedTime = startTime.trim();

    // Extract the time part (HH:MM) and the period (AM/PM)
    // Match pattern: HH:MM followed by optional spaces and AM/PM (possibly duplicated)
    const timeMatch = normalizedTime.match(/^(\d{1,2}:\d{2})\s*(AM|PM).*$/i);

    if (timeMatch) {
      // Extract clean time and the last AM/PM (in case of duplicates)
      const timePart = timeMatch[1];
      // Find the last AM or PM in the string (handles duplicates)
      const lastPeriodMatch = normalizedTime.match(/(AM|PM)\s*$/i);
      const period = lastPeriodMatch ? lastPeriodMatch[1].toUpperCase() : '';

      normalizedTime = period ? `${timePart} ${period}` : timePart;
    } else {
      // If format doesn't match expected pattern, try to clean it
      // Remove any trailing duplicate AM/PM patterns
      normalizedTime = normalizedTime.replace(
        /\s+(AM|PM)(\s+(AM|PM))+$/gi,
        match => {
          // Extract the last AM/PM
          const lastMatch = match.match(/(AM|PM)\s*$/i);
          return lastMatch ? ` ${lastMatch[1].toUpperCase()}` : '';
        },
      );

      // Also handle cases where AM/PM might be concatenated without spaces
      normalizedTime = normalizedTime.replace(/(AM|PM)(AM|PM)+$/gi, match => {
        const lastMatch = match.match(/(AM|PM)$/i);
        return lastMatch ? lastMatch[1].toUpperCase() : '';
      });
    }

    setSelectedDate(date);
    setSelectedStartTime(normalizedTime);
    setShowDetailedDateTime(true);
    // Don't reset recurrence when date/time changes - let user keep their selection
    // setSelectedRecurrence("Does not repeat");
    setActiveField(null);

    // Validate immediately after state updates (for real-time feedback)
    setTimeout(() => {
      if (!date || !startTime) {
        return;
      }

      const currentTime = new Date();
      currentTime.setSeconds(0, 0);

      // In edit mode, check if original task is in the past
      if (mode === 'edit' && editEventData?.fromTime) {
        try {
          const fromTime = editEventData.fromTime;
          if (fromTime.length >= 15) {
            const year = parseInt(fromTime.substring(0, 4), 10);
            const month = parseInt(fromTime.substring(4, 6), 10) - 1;
            const day = parseInt(fromTime.substring(6, 8), 10);
            const hour = parseInt(fromTime.substring(9, 11), 10);
            const minute = parseInt(fromTime.substring(11, 13), 10);

            const originalDateTime = new Date(
              year,
              month,
              day,
              hour,
              minute,
              0,
            );

            // If original task is in the past, allow editing (no validation needed)
            if (originalDateTime < currentTime) {
              return;
            }
            // If original task is in the future, validate that new date/time is not in the past
            // Continue with validation below
          } else {
            // If we can't parse original date/time, allow editing (safer default)
            return;
          }
        } catch (error) {
          console.error('Error parsing original date/time:', error);
          // On error, allow editing (safer default)
          return;
        }
      }

      // Check if the selected month is in the past
      const selectedMonth = date.getMonth();
      const selectedYear = date.getFullYear();
      const currentMonth = currentTime.getMonth();
      const currentYear = currentTime.getFullYear();

      if (
        selectedYear < currentYear ||
        (selectedYear === currentYear && selectedMonth < currentMonth)
      ) {
        setDateError('Please select valid time and date');
        return;
      }

      // Check if the selected date is in the past
      const selectedDateOnly = new Date(date);
      selectedDateOnly.setHours(0, 0, 0, 0);
      const today = new Date(currentTime);
      today.setHours(0, 0, 0, 0);

      if (selectedDateOnly < today) {
        setDateError('Please select valid time and date');
        return;
      }

      // If same day, check if time is in the past
      if (selectedDateOnly.getTime() === today.getTime()) {
        if (startTime && startTime.trim() !== '') {
          // Parse time from 12-hour format (e.g., "11:30 AM") or 24-hour format (e.g., "11:30")
          const normalizedTime = startTime
            .trim()
            .replace(/\u00A0/g, ' ')
            .replace(/\s+/g, ' ');
          const timeMatch = normalizedTime.match(
            /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i,
          );

          if (timeMatch) {
            // 12-hour format
            let hours = parseInt(timeMatch[1], 10);
            const minutes = parseInt(timeMatch[2], 10);
            const period = timeMatch[3].toUpperCase();

            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;

            const selectedDateTime = new Date(date);
            selectedDateTime.setHours(hours, minutes, 0, 0);

            if (selectedDateTime < currentTime) {
              setTimeError('Please select valid time and date');
              return;
            }
          } else {
            // Try 24-hour format (HH:MM)
            const [hours, minutes] = startTime.split(':');
            const hour24 = parseInt(hours, 10);
            const minute24 = parseInt(minutes, 10);

            if (!isNaN(hour24) && !isNaN(minute24)) {
              const selectedDateTime = new Date(date);
              selectedDateTime.setHours(hour24, minute24, 0, 0);

              if (selectedDateTime < currentTime) {
                setTimeError('Please select valid time and date');
                return;
              }
            }
          }
        }
      }

      // If we reach here, validation passed - ensure errors are cleared
      setDateError('');
      setTimeError('');
    }, 0);
  };
  const handleClose = () => {
    if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.reset({ index: 0, routes: [{ name: 'MonthlyCalenderScreen' }] });
  };

  const validateForm = () => {
    let isValid = true;
    let firstErrorField: 'title' | 'date' | 'time' | null = null;

    // Clear previous errors
    setTitleError('');
    setDateError('');
    setTimeError('');

    // Validate title
    if (!title || title.trim() === '') {
      setTitleError('Title is required');
      isValid = false;
      if (!firstErrorField) firstErrorField = 'title';
    }

    // Validate date
    if (!selectedDate) {
      setDateError('Date is required');
      isValid = false;
      if (!firstErrorField) firstErrorField = 'date';
    }

    // Validate time
    if (!selectedStartTime) {
      setTimeError('Time is required');
      isValid = false;
      if (!firstErrorField) firstErrorField = 'time';
    }

    // Validate past date/time
    if (selectedDate && selectedStartTime) {
      const currentTime = new Date();
      currentTime.setSeconds(0, 0); // Reset seconds and milliseconds for accurate comparison

      // In edit mode, check if original task is in the past
      let shouldValidate = true;
      if (mode === 'edit' && editEventData?.fromTime) {
        try {
          const fromTime = editEventData.fromTime;
          if (fromTime.length >= 15) {
            const year = parseInt(fromTime.substring(0, 4), 10);
            const month = parseInt(fromTime.substring(4, 6), 10) - 1;
            const day = parseInt(fromTime.substring(6, 8), 10);
            const hour = parseInt(fromTime.substring(9, 11), 10);
            const minute = parseInt(fromTime.substring(11, 13), 10);

            const originalDateTime = new Date(
              year,
              month,
              day,
              hour,
              minute,
              0,
            );

            // If original task is in the past, allow editing (no validation needed)
            if (originalDateTime < currentTime) {
              shouldValidate = false;
            }
            // If original task is in the future, validate that new date/time is not in the past
          }
        } catch (error) {
          console.error('Error parsing original date/time:', error);
          // On error, allow editing (safer default)
          shouldValidate = false;
        }
      }

      if (shouldValidate) {
        // Check if the selected month is in the past
        const selectedMonth = selectedDate.getMonth();
        const selectedYear = selectedDate.getFullYear();
        const currentMonth = currentTime.getMonth();
        const currentYear = currentTime.getFullYear();

        if (
          selectedYear < currentYear ||
          (selectedYear === currentYear && selectedMonth < currentMonth)
        ) {
          setDateError('Please select valid time and date');
          isValid = false;
          if (!firstErrorField) firstErrorField = 'date';
        } else {
          // Check if the selected date is in the past
          const selectedDateOnly = new Date(selectedDate);
          selectedDateOnly.setHours(0, 0, 0, 0);
          const today = new Date(currentTime);
          today.setHours(0, 0, 0, 0);

          if (selectedDateOnly < today) {
            setDateError('Please select valid time and date');
            isValid = false;
            if (!firstErrorField) firstErrorField = 'date';
          } else if (selectedDateOnly.getTime() === today.getTime()) {
            // Same day - check if time is in the past
            if (selectedStartTime && selectedStartTime.trim() !== '') {
              // Parse time from 12-hour format (e.g., "11:30 AM") or 24-hour format (e.g., "11:30")
              const normalizedTime = selectedStartTime
                .trim()
                .replace(/\u00A0/g, ' ')
                .replace(/\s+/g, ' ');
              const timeMatch = normalizedTime.match(
                /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i,
              );

              if (timeMatch) {
                // 12-hour format
                let hours = parseInt(timeMatch[1], 10);
                const minutes = parseInt(timeMatch[2], 10);
                const period = timeMatch[3].toUpperCase();

                if (period === 'PM' && hours !== 12) hours += 12;
                if (period === 'AM' && hours === 12) hours = 0;

                const selectedDateTime = new Date(selectedDate);
                selectedDateTime.setHours(hours, minutes, 0, 0);

                if (selectedDateTime < currentTime) {
                  setTimeError('Please select valid time and date');
                  isValid = false;
                  if (!firstErrorField) firstErrorField = 'time';
                }
              } else {
                // Try 24-hour format (HH:MM)
                const [hours, minutes] = selectedStartTime.split(':');
                const hour24 = parseInt(hours, 10);
                const minute24 = parseInt(minutes, 10);

                if (!isNaN(hour24) && !isNaN(minute24)) {
                  const selectedDateTime = new Date(selectedDate);
                  selectedDateTime.setHours(hour24, minute24, 0, 0);

                  if (selectedDateTime < currentTime) {
                    setTimeError('Please select valid time and date');
                    isValid = false;
                    if (!firstErrorField) firstErrorField = 'time';
                  }
                }
              }
            }
          }
        }
      }
    }

    if (!activeAccount) {
      // Authentication error - this is a system error, not a validation error
      Alert.alert('Error', 'No active account found. Please log in again.');
      return false;
    }

    // Scroll to first error field if validation failed
    if (!isValid && firstErrorField && scrollViewRef.current) {
      setTimeout(() => {
        const scrollToField = (ref: React.RefObject<View>) => {
          if (!ref.current || !scrollViewRef.current) {
            setTimeout(() => scrollToField(ref), 100);
            return;
          }

          try {
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
              () => {
                // Fallback: try again after delay
                setTimeout(() => {
                  if (ref.current && scrollViewRef.current) {
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
                      () => {},
                    );
                  }
                }, 300);
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
          case 'date':
          case 'time':
            scrollToField(dateTimeSectionRef);
            break;
        }
      }, 300);
    }

    return isValid;
  };

  const createTask = async () => {
    // ✅ Set loading state IMMEDIATELY - FIRST THING, before ANY other code
    // This ensures the button grays out instantly on click
    setIsLoading(true);

    // ✅ Auto-hide loading after 1.5 seconds (save operation continues in background)
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    // ✅ Use requestAnimationFrame to ensure React processes the state update first
    // Then do validation and processing in the next frame
    requestAnimationFrame(async () => {
      // 1. Validate Form
      if (!validateForm()) {
        clearTimeout(loadingTimeout);
        setIsLoading(false);
        return;
      }

      // Additional validation: Ensure title is not empty (double-check)
      if (!title || !title.trim() || title.trim().length === 0) {
        clearTimeout(loadingTimeout);
        setIsLoading(false);
        setTitleError('Title is required');
        showAlert(
          'Validation Error',
          'Please enter a title for the task',
          'error',
        );
        return;
      }

      if (!activeAccount || !token) {
        clearTimeout(loadingTimeout);
        setIsLoading(false);
        showAlert('Error', 'Authentication data not found', 'error');
        return;
      }

      console.log('Processing task...');

      // Store for potential revert (before any operations)
      const previousEvents = [...(userEvents || [])];

      try {
        // Use uid (like web version) or fallback to id
        const uid =
          mode === 'edit' && (editEventData?.uid || editEventData?.id)
            ? editEventData.uid || editEventData.id
            : generateEventUID();
        console.log('Edit event uid:', editEventData?.uid || editEventData?.id);
        console.log('Generated/Using UID:', uid);
        // Convert 12-hour format to 24-hour format for formatToISO8601 (like CreateEventScreen)
        const convertTo24Hour = (time12h: string): string => {
          if (!time12h || time12h.trim() === '') return '';
          const normalizedTime = time12h
            .trim()
            .replace(/\u00A0/g, ' ')
            .replace(/\s+/g, ' ');
          const timeMatch = normalizedTime.match(
            /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i,
          );

          if (timeMatch) {
            let hours = parseInt(timeMatch[1], 10);
            const minutes = parseInt(timeMatch[2], 10);
            const period = timeMatch[3].toUpperCase();

            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;

            return `${hours.toString().padStart(2, '0')}:${minutes
              .toString()
              .padStart(2, '0')}`;
          }
          return time12h; // Fallback: assume it's already 24-hour
        };

        const startTime24h = convertTo24Hour(selectedStartTime);
        const startTimeISO = formatToISO8601(selectedDate!, startTime24h);

        // Calculate end time (30 minutes after start) in 24-hour format
        const [hours, minutes] = startTime24h.split(':');
        const totalMinutes = parseInt(hours) * 60 + parseInt(minutes) + 30;
        const endHours = Math.floor(totalMinutes / 60) % 24;
        const endMinutes = totalMinutes % 60;
        const endTimeString = `${endHours}:${String(endMinutes).padStart(
          2,
          '0',
        )}`;

        const endTimeISO = formatToISO8601(selectedDate!, endTimeString);

        // Build recurrence data from current state (exactly like CreateEventScreen)
        const repeatEventValue =
          selectedRecurrence !== 'Does not repeat' ? selectedRecurrence : '';

        // Build custom recurrence string if it's a custom recurrence (exactly like CreateEventScreen)
        let customRepeatEventValue = '';
        if (
          selectedRecurrence.startsWith('Every ') &&
          selectedRecurrence !== 'Every Weekday (Monday to Friday)'
        ) {
          // This is a custom recurrence, format it exactly like CreateEventScreen
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

        let list: { key: string; value: string }[] = [];

        // Build list array exactly like CreateEventScreen pattern
        // If editing, preserve existing list and only update specific keys
        if (
          mode === 'edit' &&
          editEventData?.list &&
          Array.isArray(editEventData.list)
        ) {
          // Map through existing list and update only the keys we need to change (like web version)
          const updatedList = editEventData.list
            .map((data: any) => {
              switch (data.key) {
                case 'repeatEvent':
                  // Update with new value, or remove if empty
                  return repeatEventValue
                    ? { ...data, value: repeatEventValue }
                    : null;
                case 'customRepeatEvent':
                  // Update with new value, or remove if empty
                  return customRepeatEventValue
                    ? { ...data, value: customRepeatEventValue }
                    : null;
                case 'LabelName':
                  // Preserve LabelName if it exists
                  return { ...data, value: data.value || 'My Tasks' };
                default:
                  // Preserve all other items
                  return data;
              }
            })
            .filter((item: any) => item !== null); // Remove null entries

          // Filter out entries with empty values
          list = updatedList.filter((entry: any) => {
            if (entry.key === 'repeatEvent' && !entry.value) return false;
            if (entry.key === 'customRepeatEvent' && !entry.value) return false;
            return entry.value !== undefined && entry.value !== '';
          });

          // Ensure required entries exist
          const hasTask = list.some((item: any) => item.key === 'task');
          const hasLabelName = list.some(
            (item: any) => item.key === 'LabelName',
          );
          const hasOrganizer = list.some(
            (item: any) => item.key === 'organizer',
          );
          const hasRepeatEvent = list.some(
            (item: any) => item.key === 'repeatEvent',
          );
          const hasCustomRepeatEvent = list.some(
            (item: any) => item.key === 'customRepeatEvent',
          );

          if (!hasTask) {
            list.push({ key: 'task', value: 'true' });
          }
          if (!hasLabelName) {
            list.push({ key: 'LabelName', value: 'My Tasks' });
          }
          if (!hasOrganizer) {
            list.push({
              key: 'organizer',
              value: activeAccount?.userName || '',
            });
          }
          // Add recurrence entries if they don't exist but have values
          if (!hasRepeatEvent && repeatEventValue) {
            list.push({ key: 'repeatEvent', value: repeatEventValue });
          }
          if (!hasCustomRepeatEvent && customRepeatEventValue) {
            list.push({
              key: 'customRepeatEvent',
              value: customRepeatEventValue,
            });
          }
        } else {
          // For new tasks, build list from scratch (exactly like CreateEventScreen pattern)
          const entries = [
            { key: 'task', value: 'true' },
            { key: 'LabelName', value: 'My Tasks' },
            { key: 'organizer', value: activeAccount?.userName || '' },
          ];

          // Add recurrence if it exists (exactly like CreateEventScreen)
          if (repeatEventValue) {
            entries.push({ key: 'repeatEvent', value: repeatEventValue });
          }

          // Add custom recurrence if it exists (exactly like CreateEventScreen)
          if (customRepeatEventValue) {
            entries.push({
              key: 'customRepeatEvent',
              value: customRepeatEventValue,
            });
          }

          // Filter out empty values (exactly like CreateEventScreen)
          list = entries.filter(
            entry => entry.value !== undefined && entry.value !== '',
          );
        }

        // ✅ PREPARE MINIMAL DATA FOR OPTIMISTIC UPDATE (SYNCHRONOUS - NO AWAIT)
        const minimalTaskData = {
          uuid: editEventData?.uuid || '',
          uid: uid.toString(),
          title: title.trim(),
          description: description.trim() || '',
          fromTime: startTimeISO,
          toTime: endTimeISO,
          done: editEventData?.done || false,
          list: list,
          organizer: activeAccount?.userName || activeAccount?.username || '',
        };

        console.log(
          '📋 Task data being saved:',
          JSON.stringify(minimalTaskData, null, 2),
        );
        console.log('📋 Task list:', JSON.stringify(list, null, 2));

        // 4. Handle Edit vs. Create - Optimistic Update
        if (mode === 'edit') {
          optimisticallyUpdateEvent(minimalTaskData.uid, minimalTaskData);
        } else {
          optimisticallyAddEvent(minimalTaskData);
        }

        // Navigate after successful save
        navigation.goBack();

        // Show success toast at the top
        setTimeout(() => {
          if (mode === 'edit') {
            toast.success('', 'Task updated successfully!');
          } else {
            toast.success('', 'Task created successfully!');
          }
        }, 300);

        // ✅ STEP 3: TRIGGER BLOCKCHAIN OPERATION IN BACKGROUND (NON-BLOCKING)
        // Start blockchain operations as soon as possible after navigation
        (async () => {
          try {
            // Use minimalTaskData for blockchain operations
            if (mode === 'edit') {
              await handleEditTask(minimalTaskData, activeAccount);
            } else {
              await handleCreateTask(minimalTaskData, activeAccount);
            }
          } catch (error: any) {
            console.error('Error in background task operation:', error);
            clearTimeout(loadingTimeout);
            revertOptimisticUpdate(previousEvents);
            setIsLoading(false); // Reset loading state on error
            // Show error alert
            const errorMessage =
              error?.message || 'Failed to save task. Please try again.';
            showAlert('Task Save Failed', errorMessage, 'error');
          }
        })();
      } catch (error: any) {
        console.error('Error saving task:', error);
        clearTimeout(loadingTimeout);
        // Revert optimistic update on error
        revertOptimisticUpdate(previousEvents);
        // Show user-friendly error message from blockchain service
        const errorMessage =
          error?.message || 'Failed to save task. Please try again.';
        showAlert('Task Save Failed', errorMessage, 'error');
        setIsLoading(false);
      } finally {
        // 5. Hide Loader (only if not already hidden by timeout)
        clearTimeout(loadingTimeout);
        // Don't set to false here if timeout already cleared it
        // The timeout will handle it automatically after 1s
      }
    }); // Close requestAnimationFrame
  };

  const handleCreateTask = async (taskData: any, activeAccount: any) => {
    try {
      console.log('Creating task on blockchain:', taskData);
      console.log('Active account:', activeAccount);
      console.log('Token available:', !!token);

      // Ensure organizer is set correctly
      if (!taskData.organizer) {
        taskData.organizer =
          activeAccount?.userName || activeAccount?.username || '';
        console.log('Organizer was missing, set to:', taskData.organizer);
      }

      const response = await blockchainService.createEvent(
        taskData,
        activeAccount,
        token,
      );

      if (!response) {
        throw new Error('Blockchain transaction returned no response');
      }

      console.log('✅ Task created successfully on blockchain:', response);

      // Extract recurrence data from list (exactly like CreateEventScreen)
      const repeatEvents = (taskData?.list || [])
        .filter((data: any) => data.key === 'repeatEvent')
        .map((data: any) => data.value)
        .filter((value: any) => value !== null);
      const customRepeat = (taskData?.list || [])
        .filter((data: any) => data.key === 'customRepeatEvent')
        .map((data: any) => data.value)
        .filter((value: any) => value !== null);

      const updatePayload = {
        events: [
          {
            uid: taskData?.uid,
            fromTime: taskData?.fromTime,
            toTime: taskData?.toTime,
            repeatEvent: repeatEvents.length ? `${repeatEvents}` : '',
            customRepeatEvent: customRepeat.length ? `${customRepeat}` : '',
            meetingEventId: '',
          },
        ],
        active: activeAccount?.userName,
        type: 'update',
      };

      // Call the same API as edit
      await api('POST', '/updateevents', updatePayload);

      // ✅ Background refresh (non-blocking, skip loading screen)
      // Optimistic update already done in createTask, so just refresh in background
      setTimeout(() => {
        getUserEvents(activeAccount?.userName, api, undefined, {
          skipLoading: true,
        }).catch(err => {
          console.error('Background task refresh failed:', err);
        });
      }, 2000);
    } catch (error: any) {
      console.error('Error in handleCreateTask:', error);
      // Error handling is done in createTask's background operation
      throw error; // Re-throw to be caught by createTask's error handler
    }
  };

  const handleEditTask = async (taskData: any, activeAccount: any) => {
    try {
      console.log('Updating task on blockchain:', taskData);

      // Using the same updateEvent method as per your requirement
      const response = await blockchainService.updateEvent(
        taskData,
        activeAccount,
        token,
      );

      if (response) {
        // Extract recurrence data from list (exactly like CreateEventScreen)
        const repeatEvents = (taskData?.list || [])
          .filter((data: any) => data.key === 'repeatEvent')
          .map((data: any) => data.value)
          .filter((value: any) => value !== null);
        const customRepeat = (taskData?.list || [])
          .filter((data: any) => data.key === 'customRepeatEvent')
          .map((data: any) => data.value)
          .filter((value: any) => value !== null);

        const updatePayload = {
          events: [
            {
              uid: taskData?.uid,
              fromTime: taskData?.fromTime,
              toTime: taskData?.toTime,
              repeatEvent: repeatEvents.length ? `${repeatEvents}` : '',
              customRepeatEvent: customRepeat.length ? `${customRepeat}` : '',
              meetingEventId: '',
            },
          ],
          active: activeAccount?.userName,
          type: 'update',
        };

        const apiResponse = await api('POST', '/updateevents', updatePayload);
        console.log('API response data (edit task):', apiResponse.data);

        // Optimistically update local state for immediate UI feedback
        if (userEvents && Array.isArray(userEvents)) {
          const updatedEvents = userEvents.map((event: any) => {
            if (event.uid === taskData.uid) {
              return {
                ...event,
                title: taskData.title,
                description: taskData.description,
                fromTime: taskData.fromTime,
                toTime: taskData.toTime,
                list: taskData.list,
              };
            }
            return event;
          });
          setUserEvents(updatedEvents);
        }

        // The optimistic UI update already updates the local state
      } else {
        throw new Error('Failed to update the task on blockchain');
      }
    } catch (error: any) {
      console.error('Error in handleEditTask:', error);
      // Error handling is done in createTask's background operation
      throw error; // Re-throw to be caught by createTask's error handler
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {mode === 'edit' ? 'Edit Task' : 'Create Task'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        enabled={Platform.OS === 'ios'}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          scrollEnabled={!showRecurrenceDropdown}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: scaleHeight(20) }}
          showsVerticalScrollIndicator={true}
          bounces={false}
        >
          <View style={styles.formContainer}>
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

            {/* Pick date and time */}
            <View
              ref={dateTimeSectionRef}
              style={styles.fieldContainer}
              collapsable={false}
            >
              <Text style={styles.labelText}>Date and Time</Text>
              <TouchableOpacity
                style={styles.datePicker}
                onPress={() => {
                  if (!isLoading) {
                    setShowCalendarModal(true);
                  }
                }}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.selectorText,
                    selectedDate &&
                      selectedStartTime &&
                      styles.selectorTextFilled,
                  ]}
                >
                  {selectedDate
                    ? selectedDate.toLocaleDateString() +
                      ' ' +
                      selectedStartTime
                    : 'Select'}
                </Text>
                <FeatherIcon name="calendar" size={20} color="#A4A7AE" />
              </TouchableOpacity>
              {(dateError || timeError) && (
                <Text style={styles.fieldErrorText}>
                  {dateError || timeError}
                </Text>
              )}
            </View>

            {/* Repeat Field - Match task screen design */}
            {showDetailedDateTime && (
              <View
                ref={repeatFieldRef}
                style={[styles.fieldContainer, styles.repeatFieldContainer]}
                collapsable={false}
              >
                <Text style={styles.labelText}>Repeat</Text>
                <TouchableOpacity
                  style={[
                    styles.recurrenceContainer,
                    showRecurrenceDropdown && styles.fieldActive,
                  ]}
                  onPress={() => {
                    if (!isLoading) {
                      const willOpen = !showRecurrenceDropdown;
                      setShowRecurrenceDropdown(willOpen);
                      setActiveField(willOpen ? 'repeat' : null);

                      // Scroll to show dropdown when opening
                      if (
                        willOpen &&
                        scrollViewRef.current &&
                        repeatFieldRef.current
                      ) {
                        setTimeout(() => {
                          repeatFieldRef.current?.measureLayout(
                            scrollViewRef.current as any,
                            (x, y) => {
                              if (scrollViewRef.current) {
                                // Scroll to position the field near the top, accounting for dropdown height
                                const dropdownHeight = scaleHeight(280);
                                const scrollPosition = Math.max(0, y - 100);
                                scrollViewRef.current.scrollTo({
                                  y: scrollPosition,
                                  animated: true,
                                });
                              }
                            },
                            () => {
                              // Fallback: try scrolling after a delay
                              setTimeout(() => {
                                if (
                                  repeatFieldRef.current &&
                                  scrollViewRef.current
                                ) {
                                  repeatFieldRef.current.measureLayout(
                                    scrollViewRef.current as any,
                                    (x, y) => {
                                      if (scrollViewRef.current) {
                                        const scrollPosition = Math.max(
                                          0,
                                          y - 100,
                                        );
                                        scrollViewRef.current.scrollTo({
                                          y: scrollPosition,
                                          animated: true,
                                        });
                                      }
                                    },
                                    () => {},
                                  );
                                }
                              }, 200);
                            },
                          );
                        }, 100);
                      }
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
                      contentInsetAdjustmentBehavior="automatic"
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
                }}
                onBlur={() => setActiveField(null)}
                multiline
                placeholderTextColor="#A4A7AE"
                editable={!isLoading}
              />
            </View>

            {/* Create Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isLoading && styles.saveButtonDisabled,
                ]}
                disabled={isLoading}
                onPress={createTask}
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
        mode="from"
        selectedDate={selectedDate || undefined}
        selectedTime={selectedStartTime || undefined}
      />

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
                      ref={repeatEveryInputRef}
                      style={[
                        styles.customRepeatEveryInput,
                        repeatEveryError && styles.customRepeatEveryInputError,
                      ]}
                      placeholder="Enter number"
                      placeholderTextColor="#A4A7AE"
                      value={customRecurrence.repeatEvery}
                      onChangeText={text => {
                        // Clear error on input
                        if (repeatEveryError) {
                          setRepeatEveryError('');
                        }

                        // Remove any non-numeric characters
                        const numericOnly = text.replace(/[^0-9]/g, '');

                        // Allow empty temporarily for backspace
                        if (numericOnly === '') {
                          setCustomRecurrence(prev => ({
                            ...prev,
                            repeatEvery: '',
                          }));
                          return;
                        }

                        // Prevent zero
                        if (numericOnly === '0') {
                          return;
                        }

                        // Handle smart replacement when focused and typing single digit
                        const currentValue = customRecurrence.repeatEvery;
                        if (
                          isRepeatEveryFocused.current &&
                          currentValue.length === 1 &&
                          numericOnly.length === 1
                        ) {
                          // Direct replacement when typing a single digit
                          setCustomRecurrence(prev => ({
                            ...prev,
                            repeatEvery: numericOnly,
                          }));
                          return;
                        }

                        // Handle case where text was appended instead of replaced
                        if (
                          currentValue.length === 1 &&
                          numericOnly.length === 2 &&
                          numericOnly.startsWith(currentValue)
                        ) {
                          const newDigit = numericOnly.slice(1);
                          setCustomRecurrence(prev => ({
                            ...prev,
                            repeatEvery: newDigit,
                          }));
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
                      onFocus={() => {
                        isRepeatEveryFocused.current = true;
                        setRepeatEveryError('');
                      }}
                      onBlur={() => {
                        isRepeatEveryFocused.current = false;
                        // Validate on blur
                        const value = customRecurrence.repeatEvery.trim();
                        if (
                          !value ||
                          value === '' ||
                          parseInt(value, 10) < 1 ||
                          parseInt(value, 10) > 99
                        ) {
                          setRepeatEveryError(
                            'Please enter a number between 1 and 99',
                          );
                          setCustomRecurrence(prev => ({
                            ...prev,
                            repeatEvery: '1',
                          }));
                        }
                      }}
                      keyboardType="numeric"
                      maxLength={2}
                      selectTextOnFocus={true}
                      editable={!isLoading}
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
                {repeatEveryError ? (
                  <Text style={styles.customRepeatEveryErrorText}>
                    {repeatEveryError}
                  </Text>
                ) : null}

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
    backgroundColor: colors.lightGrayBg, // #F5F5F5
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: getTabletSafeDimension(scaleHeight(16), 18, 22),
    paddingBottom: getTabletSafeDimension(scaleHeight(12), 14, 18),
    paddingHorizontal: getTabletSafeDimension(scaleWidth(16), 20, 24),
    width: '100%',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: getTabletSafeDimension(scaleWidth(4), 6, 8),
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: getTabletSafeDimension(18, 20, 22),
    color: '#252B37',
    fontWeight: '700',
    fontFamily: Fonts.latoBold,
  },
  closeButton: {
    width: getTabletSafeDimension(moderateScale(40), 44, 48),
    height: getTabletSafeDimension(moderateScale(40), 44, 48),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: getTabletSafeDimension(fontSize.textSize17, 15, 17),
    color: colors.blackText,
    fontWeight: '700',
    fontFamily: Fonts.latoBold,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: getTabletSafeDimension(scaleWidth(20), 18, 22),
    paddingTop: getTabletSafeDimension(scaleHeight(20), 18, 22),
    paddingBottom: getTabletSafeDimension(scaleHeight(20), 18, 22),
    overflow: 'visible',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: getTabletSafeDimension(scaleHeight(32), 28, 36),
    marginBottom: getTabletSafeDimension(scaleHeight(20), 16, 22),
  },
  fieldContainer: {
    marginBottom: getTabletSafeDimension(scaleHeight(20), 16, 22),
  },
  inputUnderline: {
    height: 1,
    backgroundColor: colors.grey20,
  },
  labelText: {
    fontFamily: Fonts.latoMedium,
    fontWeight: '500',
    fontSize: getTabletSafeDimension(12, 11, 13),
    lineHeight: getTabletSafeDimension(12, 12, 14),
    letterSpacing: 0,
    color: '#414651', // Gray-700
    marginBottom: getTabletSafeDimension(scaleHeight(8), 6, 10),
  },
  fieldActive: {
    borderColor: colors.primaryBlue,
  },
  titleInput: {
    fontSize: getTabletSafeDimension(12, 11, 13),
    fontFamily: Fonts.latoRegular,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: 0,
    color: '#252B37',
    paddingVertical: getTabletSafeDimension(scaleHeight(12), 10, 14),
    paddingHorizontal: getTabletSafeDimension(spacing.sm, spacing.xs, spacing.sm),
    borderWidth: 1,
    borderColor: '#DCE0E5',
    borderRadius: 8,
    backgroundColor: colors.white,
    minHeight: getTabletSafeDimension(scaleHeight(44), 40, 48),
  },
  fieldActiveInput: {
    borderColor: colors.primaryBlue,
  },
  timeComponentPlaceholder: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  placeholderText: {
    color: '#a0a0a0',
    fontStyle: 'italic',
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderWidth: 1,
    borderColor: '#DCE0E5',
    borderRadius: 8,
    paddingVertical: getTabletSafeDimension(scaleHeight(12), 10, 14),
    paddingHorizontal: getTabletSafeDimension(spacing.sm, spacing.xs, spacing.sm),
    backgroundColor: colors.white,
    minHeight: getTabletSafeDimension(scaleHeight(44), 40, 48),
  },
  fieldErrorText: {
    fontSize: fontSize.textSize12,
    color: '#FF3B30',
    fontWeight: '400',
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  descriptionInput: {
    backgroundColor: colors.white,
    borderRadius: 8,
    textAlignVertical: 'top', // Aligns text to the top for Android
    borderWidth: 1,
    borderColor: '#DCE0E5',
    fontSize: getTabletSafeDimension(12, 11, 13),
    fontFamily: Fonts.latoRegular,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: 0,
    color: '#252B37',
    padding: getTabletSafeDimension(spacing.md, spacing.sm, spacing.md),
    minHeight: getTabletSafeDimension(scaleHeight(150), 130, 170),
  },
  pickerContainer: {
    width: 165,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  saveButton: {
    width: '100%',
    maxWidth: getTabletSafeDimension(scaleWidth(335), 480, 520),
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryBlue, // Solid blue #00AEEF
    paddingVertical: getTabletSafeDimension(scaleHeight(14), 16, 18),
    paddingHorizontal: getTabletSafeDimension(spacing.xl, spacing.xl, spacing.xl),
    ...shadows.sm,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: getTabletSafeDimension(fontSize.textSize16, 17, 18),
    color: colors.white,
    fontWeight: '700',
    fontFamily: Fonts.latoBold,
  },
  selectorText: {
    fontSize: 12,
    fontFamily: Fonts.latoRegular,
    lineHeight: 18,
    letterSpacing: 0,
    color: '#A4A7AE', // Text color for placeholder/empty state
    marginLeft: spacing.sm,
    flex: 1,
  },
  selectorTextFilled: {
    color: '#252B37', // Text color when value is entered
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  //Recurrence Styles

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
    paddingVertical: getTabletSafeDimension(scaleHeight(12), 10, 14),
    paddingHorizontal: getTabletSafeDimension(spacing.sm, spacing.xs, spacing.sm),
    backgroundColor: colors.white,
    width: '100%',
    minHeight: getTabletSafeDimension(scaleHeight(44), 40, 48),
  },

  repeatDropdown: {
    position: 'absolute',
    top: '100%',
    left: getTabletSafeDimension(scaleWidth(10), 14, 18), // Add left margin to make it narrower
    right: getTabletSafeDimension(scaleWidth(10), 14, 18), // Add right margin to make it narrower
    marginTop: getTabletSafeDimension(scaleHeight(4), 6, 8),
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
    maxHeight: getTabletSafeDimension(scaleHeight(320), 360, 400), // Increased height to show more options
    overflow: 'hidden', // Ensure content doesn't overflow
  },

  repeatOptionsWrapper: {
    height: getTabletSafeDimension(scaleHeight(320), 360, 400), // Fixed height - forces scrolling when content exceeds this
  },

  repeatOptionsContent: {
    paddingBottom: getTabletSafeDimension(scaleHeight(12), 10, 14), // Compact padding at bottom
    paddingTop: getTabletSafeDimension(scaleHeight(4), 6, 8), // Compact padding at top
  },

  repeatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getTabletSafeDimension(scaleWidth(16), 14, 18),
    paddingVertical: getTabletSafeDimension(scaleHeight(10), 12, 14), // Reduced from 14 to make more compact
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
    minHeight: getTabletSafeDimension(scaleHeight(38), 40, 44), // Reduced from 44 to make more compact
    backgroundColor: colors.white,
    flexWrap: 'nowrap',
  },

  repeatOptionSelected: {
    backgroundColor: '#F0FBFF', // Light blue background for selected option
  },

  repeatOptionText: {
    fontSize: getTabletSafeDimension(14, 13, 15),
    color: colors.blackText,
    fontFamily: Fonts.latoMedium,
    flex: 1,
    marginRight: getTabletSafeDimension(scaleWidth(8), 6, 10),
    flexShrink: 1,
  },

  repeatOptionTextSelected: {
    color: colors.primaryBlue,
    fontFamily: Fonts.latoBold,
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
    maxWidth: getTabletSafeDimension(scaleWidth(480), 520, 560),
    maxHeight: '75%',
    paddingVertical: getTabletSafeDimension(spacing.lg, spacing.md, spacing.lg),
    paddingHorizontal: getTabletSafeDimension(spacing.md, spacing.sm, spacing.md),
  },
  customRecurrenceContent: {
    flex: 1,
    overflow: 'visible',
    paddingHorizontal: spacing.md,
  },
  customModalHeader: {
    marginBottom: getTabletSafeDimension(spacing.lg, spacing.md, spacing.lg),
    paddingHorizontal: getTabletSafeDimension(spacing.md, spacing.sm, spacing.md),
  },
  customModalTitle: {
    fontSize: getTabletSafeDimension(fontSize.textSize18, 16, 20),
    fontWeight: '600',
    color: '#252B37',
    fontFamily: Fonts.latoBold,
  },
  customRecurrenceSection: {
    marginBottom: getTabletSafeDimension(spacing.lg, spacing.md, spacing.lg),
    overflow: 'visible',
  },
  customRecurrenceSectionTitle: {
    fontSize: getTabletSafeDimension(fontSize.textSize14, 13, 15),
    fontWeight: '600',
    color: '#414651',
    marginBottom: getTabletSafeDimension(spacing.md, spacing.sm, spacing.md),
    fontFamily: Fonts.latoSemiBold,
  },
  customRepeatEveryColumn: {
    flexDirection: 'column',
    width: '100%',
    gap: spacing.sm,
  },
  customRepeatEveryInput: {
    width: '100%',
    height: getTabletSafeDimension(scaleHeight(40), 38, 44),
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
  customRepeatEveryInputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  customRepeatEveryErrorText: {
    fontSize: fontSize.textSize12,
    color: '#EF4444',
    marginTop: spacing.xs,
    marginLeft: 0,
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
    paddingHorizontal: getTabletSafeDimension(spacing.md, spacing.sm, spacing.md),
    paddingVertical: getTabletSafeDimension(spacing.sm, spacing.xs, spacing.sm),
    height: getTabletSafeDimension(scaleHeight(40), 38, 44),
    width: '100%',
    backgroundColor: colors.white,
  },
  customRepeatUnitText: {
    fontSize: fontSize.textSize14,
    color: '#252B37',
    fontWeight: '400',
    marginRight: spacing.xs,
    fontFamily: Fonts.latoRegular,
  },
  customUnitDropdownContainer: {
    position: 'absolute',
    top: getTabletSafeDimension(scaleHeight(45), 42, 48),
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
    maxHeight: getTabletSafeDimension(scaleHeight(180), 200, 220),
  },
  customUnitDropdownItem: {
    paddingVertical: getTabletSafeDimension(scaleHeight(10), 12, 14),
    paddingHorizontal: getTabletSafeDimension(spacing.md, spacing.sm, spacing.md),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  customUnitDropdownItemText: {
    fontSize: getTabletSafeDimension(fontSize.textSize14, 13, 15),
    color: '#252B37',
    fontFamily: Fonts.latoRegular,
  },
  customRepeatUnitTextPlaceholder: {
    color: '#A4A7AE',
  },
  dropdownContainer: {
    position: 'absolute',
    top: getTabletSafeDimension(scaleHeight(45), 42, 48), // Position below the button row
    left: getTabletSafeDimension(scaleWidth(60), 56, 64) + spacing.sm, // Align with dropdown button
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#DCE0E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    minWidth: getTabletSafeDimension(scaleWidth(120), 130, 150),
    maxWidth: getTabletSafeDimension(scaleWidth(150), 170, 190),
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
    width: getTabletSafeDimension(scaleWidth(20), 22, 24),
    height: getTabletSafeDimension(scaleHeight(20), 22, 24),
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
    minWidth: getTabletSafeDimension(scaleWidth(40), 44, 50),
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
    paddingHorizontal: spacing.xs,
    fontSize: fontSize.textSize12,
    color: colors.blackText,
    paddingVertical: spacing.sm,
    lineHeight: scaleHeight(13),
    justifyContent: 'center',
    flexShrink: 1,
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
    padding: getTabletSafeDimension(spacing.lg, spacing.lg, spacing.xl),
    width: '90%',
    maxWidth: getTabletSafeDimension(scaleWidth(400), 500, 560),
  },
  datePickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getTabletSafeDimension(spacing.md, spacing.md, spacing.lg),
  },
  datePickerModalTitle: {
    fontSize: getTabletSafeDimension(fontSize.textSize18, 18, 20),
    fontWeight: 'bold',
    color: colors.blackText,
  },
  datePickerModalCloseButton: {
    padding: getTabletSafeDimension(spacing.xs, spacing.sm, spacing.md),
  },
  datePickerModalCloseText: {
    fontSize: getTabletSafeDimension(fontSize.textSize20, 20, 22),
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
    paddingVertical: getTabletSafeDimension(scaleHeight(12), 10, 14),
    paddingHorizontal: getTabletSafeDimension(spacing.lg, spacing.md, spacing.lg),
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
    paddingVertical: getTabletSafeDimension(scaleHeight(12), 10, 14),
    paddingHorizontal: getTabletSafeDimension(spacing.lg, spacing.md, spacing.lg),
    alignItems: 'center',
    justifyContent: 'center',
  },
  customDoneButtonText: {
    fontSize: fontSize.textSize14,
    fontWeight: '600',
    color: colors.white,
    fontFamily: Fonts.latoSemiBold,
  },
  repeatContainer: {
    marginTop: getTabletSafeDimension(scaleHeight(24), 20, 28),
    marginBottom: getTabletSafeDimension(scaleHeight(24), 20, 28),
  },
  repeatHeader: {
    marginBottom: getTabletSafeDimension(scaleHeight(12), 10, 14),
  },
  repeatTitle: {
    fontSize: getTabletSafeDimension(16, 15, 17),
    fontWeight: '600',
    fontFamily: Fonts.latoSemiBold,
    color: colors.blackText,
  },
  repeatButtonsContainer: {
    flexDirection: 'column',
    gap: getTabletSafeDimension(scaleHeight(8), 6, 10),
  },
  repeatButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: getTabletSafeDimension(scaleWidth(8), 10, 12),
  },
  repeatButton: {
    flex: 1,
    minWidth: 0, // Allows flexbox to properly distribute space
    height: getTabletSafeDimension(scaleHeight(44), 40, 48),
    borderWidth: 1,
    borderColor: '#DCE0E5',
    borderRadius: 8,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  repeatButtonSelected: {
    borderColor: colors.primaryBlue,
    backgroundColor: '#F0FBFF',
  },
  repeatButtonText: {
    fontSize: 14,
    fontFamily: Fonts.latoRegular,
    fontWeight: '400',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  repeatButtonTextSelected: {
    color: colors.primaryBlue,
    fontWeight: '600',
    fontFamily: Fonts.latoSemiBold,
  },

  // ... rest of your styles ...
});

export default CreateTaskScreen;
