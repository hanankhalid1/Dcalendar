import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import LinearGradient from 'react-native-linear-gradient';
import CalendarWithTime from '../components/CalendarWithTime';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from "react-native-safe-area-context";
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
import { AppNavigationProp } from "../navigations/appNavigation.type";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Colors } from "../constants/Colors";
import { dayAbbreviations, dayNames, timezones } from "../constants/dummyData";
import dayjs from "dayjs";
import { useActiveAccount } from '../stores/useActiveAccount';
import { useToken } from '../stores/useTokenStore';
import { formatToISO8601 } from '../utils';
import { BlockchainService } from "../services/BlockChainService";
import { NECJSPRIVATE_KEY } from "../constants/Config";
import { useEventsStore } from "../stores/useEventsStore";
import { useApiClient } from "../hooks/useApi";
import { generateEventUID } from "../utils/eventUtils";
import CustomAlert from '../components/CustomAlert';

const CreateTaskScreen = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const activeAccount = useActiveAccount(state => state.account);
  const token = useToken(state => state.token);
  const route = useRoute<any>();
  const { mode, eventData: editEventData } = route.params || {};
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { getUserEvents, setUserEvents, userEvents } = useEventsStore();
  const { api } = useApiClient();
  const blockchainService = new BlockchainService(NECJSPRIVATE_KEY);
  const [showRecurrenceDropdown, setShowRecurrenceDropdown] = useState(false);
  const [selectedRecurrence, setSelectedRecurrence] = useState('Does not repeat');
  const [isRepeatDropdownOpen, setIsRepeatDropdownOpen] = useState(false);
  const [showCustomRecurrenceModal, setShowCustomRecurrenceModal] = useState(false);
  const [activeField, setActiveField] = useState<'title' | 'date' | 'startTime' | 'endTime' | 'repeat' | 'description' | null>(null);
  const endsOptions = ['Never', 'On', 'After'];
  const [selectedValue, setSelectedValue] = useState(null);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [showEndsDatePicker, setShowEndsDatePicker] = useState(false);
  
  // Custom Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('error');

  // Helper function to show custom alert
  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'error'
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

  const [selectedDate, setSelectedDate] = useState<Date | null>(getInitialDate());
  
  // Initialize customRecurrence after selectedDate is defined
  const [customRecurrence, setCustomRecurrence] = useState(() => {
    const weekday =
      getInitialDate()
        ? getInitialDate()!.toLocaleDateString('en-US', { weekday: 'long' })
        : 'Thursday'; // default fallback
    return {
      repeatEvery: '1',
      repeatUnit: 'Week',
      repeatOn: [weekday],
      endsType: 'Never',
      endsDate: null as Date | null,
      endsAfter: '13',
    }
  });
  const [selectedStartTime, setSelectedStartTime] = useState(
    editEventData?.selectedStartTime || '',
  );
  const [selectedEndTime, setSelectedEndTime] = useState(
    editEventData?.selectedEndTime || '',
  );
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarModalMode, setCalendarModalMode] = useState<'date' | 'startTime' | 'endTime'>('date');

  const [showDetailedDateTime, setShowDetailedDateTime] = useState(
    !!editEventData,
  );
  
  // Update customRecurrence when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      const weekday = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
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
  const [labelList, setLabelList] = useState([
    { label: "My Tasks", value: "1" },
    { label: "Work", value: "2" },
    { label: "Personal", value: "3" },
  ]);
  const repeatUnits = ['Day', 'Week', 'Month', 'Year'];

  useEffect(() => {
    if (selectedDate) {
      const weekday = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
      setCustomRecurrence(prev => ({
        ...prev,
        repeatOn: [weekday],
      }));
    }
  }, [selectedDate]);

  const getRecurrenceOptions = (selectedDate: Date) => {
    const d = dayjs(selectedDate);
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

  const handleUnitSelect = (unit) => {
    setCustomRecurrence(prev => ({ ...prev, repeatUnit: unit }));
    setShowUnitDropdown(false);
  };

  const handleRecurrenceSelect = (recurrence: string) => {
    if (recurrence === 'Custom...') {
      setShowRecurrenceDropdown(false);
      setIsRepeatDropdownOpen(false);
      setActiveField(null);
      setShowCustomRecurrenceModal(true);
    } else {
      setSelectedRecurrence(recurrence);
      setShowRecurrenceDropdown(false);
      setActiveField(null);
      setIsRepeatDropdownOpen(false);
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
        'error'
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

  const toggleRepeatDropdown = () => {
    if (isLoading) {
      return;
    }

    setShowRecurrenceDropdown(prev => !prev);
    setIsRepeatDropdownOpen(prev => !prev);
    setActiveField(prev => (prev === 'repeat' ? null : 'repeat'));
  };

  const handleDayToggle = (day: string) => {
    setCustomRecurrence(prev => ({
      ...prev,
      repeatOn: prev.repeatOn.includes(day)
        ? prev.repeatOn.filter(d => d !== day)
        : [...prev.repeatOn, day],
    }));
  };

  const recurrenceOptions = selectedDate ? getRecurrenceOptions(selectedDate) : [
    "Does not repeat",
    "Daily",
    "Weekly on Thursday",
    "Monthly on the first Thursday",
    "Monthly on the last Thursday",
    "Annually on January 1",
    "Every Weekday (Monday to Friday)",
    "Custom...",
  ];





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
          hour12: true
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
          parseInt(second)
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

        timeString = `${displayHour.toString().padStart(2, '0')}:${minuteNum.toString().padStart(2, '0')} ${period}`;
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
          hour12: true
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
      if (editEventData.fromTime || (editEventData.date && editEventData.time)) {
        setShowDetailedDateTime(true);
      }
    }
  }, [mode, editEventData]);

  // Real-time validation for past date/time (only for new tasks, not edit mode)
  const validateDateTime = React.useCallback(() => {
    // Clear previous errors first
    setDateError('');
    setTimeError('');

    // Only validate for new tasks, not when editing
    if (mode === 'edit' || !selectedDate || !selectedStartTime) {
      return;
    }

    const now = new Date();
    now.setSeconds(0, 0); // Reset seconds and milliseconds for accurate comparison

    // Check if the selected month is in the past
    const selectedMonth = selectedDate.getMonth();
    const selectedYear = selectedDate.getFullYear();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    if (selectedYear < currentYear || (selectedYear === currentYear && selectedMonth < currentMonth)) {
      setDateError('Please select valid time and date');
      return;
    }

    // Check if the selected date is in the past
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    if (selectedDateOnly < today) {
      setDateError('Please select valid time and date');
      return;
    }

    // If same day, check if time is in the past
    if (selectedDateOnly.getTime() === today.getTime()) {
      if (selectedStartTime && selectedStartTime.trim() !== '') {
        // Parse time from 12-hour format (e.g., "11:30 AM") or 24-hour format (e.g., "11:30")
        const normalizedTime = selectedStartTime.trim().replace(/\u00A0/g, ' ').replace(/\s+/g, ' ');
        const timeMatch = normalizedTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        
        if (timeMatch) {
          // 12-hour format
          let hours = parseInt(timeMatch[1], 10);
          const minutes = parseInt(timeMatch[2], 10);
          const period = timeMatch[3].toUpperCase();

          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;

          const selectedDateTime = new Date(selectedDate);
          selectedDateTime.setHours(hours, minutes, 0, 0);

          if (selectedDateTime < now) {
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

            if (selectedDateTime < now) {
              setTimeError('Please select valid time and date');
              return;
            }
          }
        }
      }
    }
    
    // If we reach here, validation passed - errors are already cleared at the start
  }, [mode, selectedDate, selectedStartTime]);

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
      normalizedTime = normalizedTime.replace(/\s+(AM|PM)(\s+(AM|PM))+$/gi, (match) => {
        // Extract the last AM/PM
        const lastMatch = match.match(/(AM|PM)\s*$/i);
        return lastMatch ? ` ${lastMatch[1].toUpperCase()}` : '';
      });
      
      // Also handle cases where AM/PM might be concatenated without spaces
      normalizedTime = normalizedTime.replace(/(AM|PM)(AM|PM)+$/gi, (match) => {
        const lastMatch = match.match(/(AM|PM)$/i);
        return lastMatch ? lastMatch[1].toUpperCase() : '';
      });
    }
    
    setSelectedDate(date);
    setSelectedStartTime(normalizedTime);
    setShowDetailedDateTime(true);
    setSelectedRecurrence("Does not repeat");
    setActiveField(null);
    
    // Validate immediately after state updates (for real-time feedback)
    setTimeout(() => {
      // Only validate for new tasks, not when editing
      if (mode === 'edit' || !date || !startTime) {
        return;
      }

      const now = new Date();
      now.setSeconds(0, 0);

      // Check if the selected month is in the past
      const selectedMonth = date.getMonth();
      const selectedYear = date.getFullYear();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      if (selectedYear < currentYear || (selectedYear === currentYear && selectedMonth < currentMonth)) {
        setDateError('Please select valid time and date');
        return;
      }

      // Check if the selected date is in the past
      const selectedDateOnly = new Date(date);
      selectedDateOnly.setHours(0, 0, 0, 0);
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      if (selectedDateOnly < today) {
        setDateError('Please select valid time and date');
        return;
      }

      // If same day, check if time is in the past
      if (selectedDateOnly.getTime() === today.getTime()) {
        if (startTime && startTime.trim() !== '') {
          // Parse time from 12-hour format (e.g., "11:30 AM") or 24-hour format (e.g., "11:30")
          const normalizedTime = startTime.trim().replace(/\u00A0/g, ' ').replace(/\s+/g, ' ');
          const timeMatch = normalizedTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
          
          if (timeMatch) {
            // 12-hour format
            let hours = parseInt(timeMatch[1], 10);
            const minutes = parseInt(timeMatch[2], 10);
            const period = timeMatch[3].toUpperCase();

            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;

            const selectedDateTime = new Date(date);
            selectedDateTime.setHours(hours, minutes, 0, 0);

            if (selectedDateTime < now) {
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

              if (selectedDateTime < now) {
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
    navigation.goBack();
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

    // Validate past date/time (only for new tasks, not edit mode)
    if (mode !== 'edit' && selectedDate && selectedStartTime) {
      const now = new Date();
      now.setSeconds(0, 0); // Reset seconds and milliseconds for accurate comparison

      // Check if the selected month is in the past
      const selectedMonth = selectedDate.getMonth();
      const selectedYear = selectedDate.getFullYear();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      if (selectedYear < currentYear || (selectedYear === currentYear && selectedMonth < currentMonth)) {
        setDateError('Please select valid time and date');
        isValid = false;
        if (!firstErrorField) firstErrorField = 'date';
      } else {
        // Check if the selected date is in the past
        const selectedDateOnly = new Date(selectedDate);
        selectedDateOnly.setHours(0, 0, 0, 0);
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        if (selectedDateOnly < today) {
          setDateError('Please select valid time and date');
          isValid = false;
          if (!firstErrorField) firstErrorField = 'date';
        } else if (selectedDateOnly.getTime() === today.getTime()) {
          // Same day - check if time is in the past
          if (selectedStartTime && selectedStartTime.trim() !== '') {
            // Parse time from 12-hour format (e.g., "11:30 AM") or 24-hour format (e.g., "11:30")
            const normalizedTime = selectedStartTime.trim().replace(/\u00A0/g, ' ').replace(/\s+/g, ' ');
            const timeMatch = normalizedTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
            
            if (timeMatch) {
              // 12-hour format
              let hours = parseInt(timeMatch[1], 10);
              const minutes = parseInt(timeMatch[2], 10);
              const period = timeMatch[3].toUpperCase();

              if (period === 'PM' && hours !== 12) hours += 12;
              if (period === 'AM' && hours === 12) hours = 0;

              const selectedDateTime = new Date(selectedDate);
              selectedDateTime.setHours(hours, minutes, 0, 0);

              if (selectedDateTime < now) {
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

                if (selectedDateTime < now) {
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
                    animated: true 
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
                            animated: true 
                          });
                        }
                      },
                      () => {}
                    );
                  }
                }, 300);
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
    // 1. Validate Form
    if (!validateForm()) {
      return;
    }

    // 2. Set Loading State
    setIsLoading(true);
    console.log("Processing task...");

    try {
      // Use uid (like web version) or fallback to id
      const uid = mode === 'edit' && (editEventData?.uid || editEventData?.id)
        ? (editEventData.uid || editEventData.id)
        : generateEventUID();
      console.log("Edit event uid:", editEventData?.uid || editEventData?.id);
      console.log("Generated/Using UID:", uid);
      // Convert 12-hour format to 24-hour format for formatToISO8601 (like CreateEventScreen)
      const convertTo24Hour = (time12h: string): string => {
        if (!time12h || time12h.trim() === '') return '';
        const normalizedTime = time12h.trim().replace(/\u00A0/g, ' ').replace(/\s+/g, ' ');
        const timeMatch = normalizedTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        
        if (timeMatch) {
          let hours = parseInt(timeMatch[1], 10);
          const minutes = parseInt(timeMatch[2], 10);
          const period = timeMatch[3].toUpperCase();
          
          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;
          
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
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
      const endTimeString = `${endHours}:${String(endMinutes).padStart(2, '0')}`;

      const endTimeISO = formatToISO8601(selectedDate!, endTimeString);

      // Build recurrence data from current state (exactly like CreateEventScreen)
      const repeatEventValue = selectedRecurrence !== 'Does not repeat' ? selectedRecurrence : '';
      
      // Build custom recurrence string if it's a custom recurrence (exactly like CreateEventScreen)
      let customRepeatEventValue = '';
      if (selectedRecurrence.startsWith('Every ') && selectedRecurrence !== 'Every Weekday (Monday to Friday)') {
        // This is a custom recurrence, format it exactly like CreateEventScreen
        const { repeatEvery, repeatUnit, repeatOn, endsType, endsAfter, endsDate } = customRecurrence;
        // Format endsDate as YYYYMMDD if it's a Date object
        const formattedEndsDate = endsDate
          ? `${endsDate.getFullYear()}${String(endsDate.getMonth() + 1).padStart(2, '0')}${String(endsDate.getDate()).padStart(2, '0')}`
          : '';
        customRepeatEventValue = `${repeatEvery}|${repeatUnit}|${repeatOn.join(',')}|${endsType}|${endsAfter}|${formattedEndsDate}`;
      }

      let list: { key: string; value: string }[] = [];

      // Build list array exactly like CreateEventScreen pattern
      // If editing, preserve existing list and only update specific keys
      if (mode === 'edit' && editEventData?.list && Array.isArray(editEventData.list)) {
        // Map through existing list and update only the keys we need to change (like web version)
        const updatedList = editEventData.list.map((data: any) => {
          switch (data.key) {
            case "repeatEvent":
              // Update with new value, or remove if empty
              return repeatEventValue ? { ...data, value: repeatEventValue } : null;
            case "customRepeatEvent":
              // Update with new value, or remove if empty
              return customRepeatEventValue ? { ...data, value: customRepeatEventValue } : null;
            case "LabelName":
              // Preserve LabelName if it exists
              return { ...data, value: data.value || "My Tasks" };
            default:
              // Preserve all other items
              return data;
          }
        }).filter((item: any) => item !== null); // Remove null entries

        // Filter out entries with empty values
        list = updatedList.filter((entry: any) => {
          if (entry.key === 'repeatEvent' && !entry.value) return false;
          if (entry.key === 'customRepeatEvent' && !entry.value) return false;
          return entry.value !== undefined && entry.value !== '';
        });

        // Ensure required entries exist
        const hasTask = list.some((item: any) => item.key === 'task');
        const hasLabelName = list.some((item: any) => item.key === 'LabelName');
        const hasOrganizer = list.some((item: any) => item.key === 'organizer');
        const hasRepeatEvent = list.some((item: any) => item.key === 'repeatEvent');
        const hasCustomRepeatEvent = list.some((item: any) => item.key === 'customRepeatEvent');

        if (!hasTask) {
          list.push({ key: "task", value: "true" });
        }
        if (!hasLabelName) {
          list.push({ key: "LabelName", value: "My Tasks" });
        }
        if (!hasOrganizer) {
          list.push({ key: "organizer", value: activeAccount?.userName || '' });
        }
        // Add recurrence entries if they don't exist but have values
        if (!hasRepeatEvent && repeatEventValue) {
          list.push({ key: "repeatEvent", value: repeatEventValue });
        }
        if (!hasCustomRepeatEvent && customRepeatEventValue) {
          list.push({ key: "customRepeatEvent", value: customRepeatEventValue });
        }
      } else {
        // For new tasks, build list from scratch (exactly like CreateEventScreen pattern)
      const entries = [
        { key: "task", value: "true" },
        { key: "LabelName", value: "My Tasks" },
          { key: "organizer", value: activeAccount?.userName || '' }
        ];

        // Add recurrence if it exists (exactly like CreateEventScreen)
        if (repeatEventValue) {
          entries.push({ key: "repeatEvent", value: repeatEventValue });
        }

        // Add custom recurrence if it exists (exactly like CreateEventScreen)
        if (customRepeatEventValue) {
          entries.push({ key: "customRepeatEvent", value: customRepeatEventValue });
        }

        // Filter out empty values (exactly like CreateEventScreen)
        list = entries.filter((entry) => entry.value !== undefined && entry.value !== '');
      }

      // 6. Build task data structure
      const taskData = {
        uid: uid.toString(),
        title: title.trim(),
        description: description.trim() || "",
        fromTime: startTimeISO,
        toTime: endTimeISO,
        done: editEventData?.done || false,
        repeatEvent:
          selectedRecurrence !== 'Does not repeat'
            ? selectedRecurrence
            : undefined,
        list: list,
        organizer: activeAccount?.userName
      };

      // 4. Handle Edit vs. Create
      if (mode === 'edit') {
        await handleEditTask(taskData, activeAccount);
      } else {
        await handleCreateTask(taskData, activeAccount);
      }

      // Navigate immediately for better UX (don't wait for refresh)
      navigation.goBack();

      // Note: getUserEvents is not called here to avoid showing "Loading Events" indicator
      // The optimistic UI update in handleCreateTask/handleEditTask already updates the local state

    } catch (error: any) {
      console.error('Error saving task:', error);
      // Show user-friendly error message from blockchain service
      const errorMessage = error?.message || 'Failed to save task. Please try again.';
      showAlert('Task Save Failed', errorMessage, 'error');
    } finally {
      // 5. Hide Loader
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (taskData, activeAccount) => {
    try {
      console.log("Creating task on blockchain:", taskData);
      const response = await blockchainService.createEvent(
        taskData,
        activeAccount,
        token,
      );
      
      // Extract recurrence data from list (exactly like CreateEventScreen)
      const repeatEvents = (taskData?.list || [])
        .filter((data: any) => data.key === "repeatEvent")
        .map((data: any) => data.value)
        .filter((value: any) => value !== null);
      const customRepeat = (taskData?.list || [])
        .filter((data: any) => data.key === "customRepeatEvent")
        .map((data: any) => data.value)
        .filter((value: any) => value !== null);
      
      const updatePayload = {
        events: [{
          uid: taskData?.uid,
          fromTime: taskData?.fromTime,
          toTime: taskData?.toTime,
          repeatEvent: repeatEvents.length ? `${repeatEvents}` : '',
          customRepeatEvent: customRepeat.length ? `${customRepeat}` : '',
          meetingEventId: '',
        }],
        active: activeAccount?.userName,
        type: 'update',
      };
      
      // Call the same API as edit
      await api('POST', '/updateevents', updatePayload);

      // Optimistically add task to local state for immediate UI feedback
      if (userEvents && Array.isArray(userEvents)) {
        const newTask = {
          uid: taskData.uid,
          title: taskData.title,
          description: taskData.description,
          fromTime: taskData.fromTime,
          toTime: taskData.toTime,
          list: taskData.list,
          done: taskData.done,
        };
        setUserEvents([...userEvents, newTask]);
      }

      // Don't wait for refresh - navigation happens in createTask
    } catch (error: any) {
      console.error('Error in handleCreateTask:', error);
      // Show user-friendly error message from blockchain service
      const errorMessage = error?.message || 'An unexpected error occurred while creating the task. Please check your network connection.';
      showAlert('Task Creation Failed', errorMessage, 'error');
    }
  };

  const handleEditTask = async (taskData: any, activeAccount: any) => {
    try {
      console.log("Updating task on blockchain:", taskData);

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
          events: [{
            uid: taskData?.uid,
            fromTime: taskData?.fromTime,
            toTime: taskData?.toTime,
            repeatEvent: repeatEvents.length ? `${repeatEvents}` : '',
            customRepeatEvent: customRepeat.length ? `${customRepeat}` : '',
            meetingEventId: '',
          }],
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

        // Show success and navigate immediately
        showAlert('Task Updated', 'Task has been successfully updated.', 'success');
        
        // Note: getUserEvents is not called here to avoid showing "Loading Events" indicator
        // The optimistic UI update already updates the local state
      } else {
        showAlert('Task Update Failed', 'Failed to update the task. Please try again.', 'error');
      }
    } catch (error: any) {
      console.error('Error in handleEditTask:', error);
      // Show user-friendly error message from blockchain service
      const errorMessage = error?.message || 'Failed to update the task. Please try again.';
      showAlert('Task Update Failed', errorMessage, 'error');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {mode === 'edit' ? 'Edit task' : 'Create task'}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
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
              style={[styles.titleInput, activeField === 'title' && styles.fieldActiveInput]}
              placeholder="Write here"
              placeholderTextColor="#A4A7AE"
              value={title}
              onFocus={() => setActiveField('title')}
              onBlur={() => setActiveField(null)}
              onChangeText={(text) => {
                setTitle(text);
                if (titleError) setTitleError('');
              }}
              editable={!isLoading}
            />
            {titleError ? (
              <Text style={styles.fieldErrorText}>{titleError}</Text>
            ) : null}
          </View>

          {/* Date Field */}
          <View 
            ref={dateTimeSectionRef}
            style={styles.fieldContainer}
            collapsable={false}
          >
            <Text style={styles.labelText}>Date</Text>
            <TouchableOpacity
              style={[styles.datePicker, activeField === 'date' && styles.fieldActive]}
              onPress={() => {
                if (!isLoading) {
                  setActiveField('date');
                  setCalendarModalMode('date');
                  setShowCalendarModal(true);
                }
              }}
              disabled={isLoading}
            >
              <Text style={styles.selectorText}>
                {selectedDate
                  ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : "Select"}
              </Text>
              <CalendarIcon width={20} height={20} fill="#6C6C6C" />
            </TouchableOpacity>
            {dateError && (
              <Text style={styles.fieldErrorText}>
                {dateError}
              </Text>
            )}
          </View>

          {/* Start Time Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.labelText}>Start Time</Text>
            <TouchableOpacity
              style={[styles.datePicker, activeField === 'startTime' && styles.fieldActive]}
              onPress={() => {
                if (!isLoading) {
                  setActiveField('startTime');
                  setCalendarModalMode('startTime');
                  setShowCalendarModal(true);
                }
              }}
              disabled={isLoading}
            >
              <Text style={styles.selectorText}>
                {selectedStartTime || "Select"}
              </Text>
              <ClockIcon width={20} height={20} fill="#6C6C6C" />
            </TouchableOpacity>
            {timeError && (
              <Text style={styles.fieldErrorText}>
                {timeError}
              </Text>
            )}
          </View>

          {/* End Time Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.labelText}>End Time</Text>
            <TouchableOpacity
              style={[styles.datePicker, activeField === 'endTime' && styles.fieldActive]}
              onPress={() => {
                if (!isLoading) {
                  setActiveField('endTime');
                  setCalendarModalMode('endTime');
                  setShowCalendarModal(true);
                }
              }}
              disabled={isLoading}
            >
              <Text style={styles.selectorText}>
                {selectedEndTime || "Select"}
              </Text>
              <ClockIcon width={20} height={20} fill="#6C6C6C" />
            </TouchableOpacity>
          </View>

          {/* Repeat Field */}
          <View
            style={[styles.fieldContainer, styles.repeatFieldContainer]}
          >
            <Text style={styles.labelText}>Repeat</Text>
            <TouchableOpacity
              style={[
                styles.recurrenceContainer,
                (isRepeatDropdownOpen || showRecurrenceDropdown) && styles.fieldActive,
              ]}
              onPress={toggleRepeatDropdown}
              disabled={isLoading}
            >
                <Text style={styles.selectorText}>{selectedRecurrence}</Text>
                <ArrowDownIcon width={20} height={20} fill="#6C6C6C" />
            </TouchableOpacity>
            {showRecurrenceDropdown && (
              <View style={styles.repeatDropdown}>
                <ScrollView
                  style={styles.repeatOptionsWrapper}
                  showsVerticalScrollIndicator={false}
                >
                  {recurrenceOptions.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.repeatOption,
                        selectedRecurrence === option && styles.repeatOptionSelected,
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
                          styles.repeatOptionText,
                          selectedRecurrence === option && styles.repeatOptionTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                      {selectedRecurrence === option && (
                        <FeatherIcon name="check" size={16} color={colors.primaryBlue} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={styles.repeatDropdownFooter} />
              </View>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.labelText}>Description</Text>
            <TextInput
              style={[styles.descriptionInput, activeField === 'description' && styles.fieldActiveInput]}
              placeholder="Enter here.."
              value={description}
              onChangeText={setDescription}
              onFocus={() => setActiveField('description')}
              onBlur={() => setActiveField(null)}
              multiline
              placeholderTextColor="#A4A7AE"
              editable={!isLoading}
            />
          </View>

          {/* Create Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
              disabled={isLoading}
              onPress={createTask}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Creating...' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {showRecurrenceDropdown && (
        <TouchableOpacity
          style={styles.recurrenceOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowRecurrenceDropdown(false);
            setIsRepeatDropdownOpen(false);
            setActiveField(null);
          }}
        />
      )}

      {/* Calendar with Time Modal */}
      <CalendarWithTime
        isVisible={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        onDateTimeSelect={(date, time) => {
          if (calendarModalMode === 'date') {
            setSelectedDate(date);
            if (!selectedStartTime) {
              setShowDetailedDateTime(true);
            }
          } else if (calendarModalMode === 'startTime') {
            setSelectedStartTime(time);
            setSelectedDate(date);
            setShowDetailedDateTime(true);
          } else if (calendarModalMode === 'endTime') {
            setSelectedEndTime(time);
            setSelectedDate(date);
          }
          setShowCalendarModal(false);
        }}
        mode={calendarModalMode === 'endTime' ? 'to' : 'from'}
        selectedDate={selectedDate || new Date()}
        selectedTime={
          calendarModalMode === 'startTime' 
            ? selectedStartTime || undefined
            : calendarModalMode === 'endTime'
            ? selectedEndTime || undefined
            : undefined
        }
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
                      const limitedValue = numericOnly.length > 2 ? numericOnly.slice(0, 2) : numericOnly;
                      
                      setCustomRecurrence(prev => ({
                        ...prev,
                        repeatEvery: limitedValue,
                      }));
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                    editable={!isLoading}
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
                  onPress={() => {
                    if (!isLoading) {
                      setCustomRecurrence(prev => ({
                        ...prev,
                        endsType: endsOptions[0],
                      }));
                    }
                  }}
                  disabled={isLoading}
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
                  onPress={() => {
                    if (!isLoading) {
                      setCustomRecurrence(prev => ({
                        ...prev,
                        endsType: endsOptions[1],
                      }));
                    }
                  }}
                  disabled={isLoading}
                >
                  <View style={styles.customRadioButton}>
                    {customRecurrence.endsType === endsOptions[1] && (
                      <View style={styles.customRadioButtonSelected} />
                    )}
                  </View>
                  <Text style={styles.customEndsOptionText}>
                    {endsOptions[1]}
                  </Text>
                    <TouchableOpacity
                    style={[
                      styles.customEndsInput,
                      customRecurrence.endsType !== endsOptions[1] &&
                      styles.customEndsInputDisabled,
                    ]}
                      onPress={() => {
                        if (customRecurrence.endsType === endsOptions[1] && !isLoading) {
                          setShowEndsDatePicker(true);
                        }
                      }}
                      disabled={customRecurrence.endsType !== endsOptions[1] || isLoading}
                    >
                      <Text
                        style={[
                          styles.customEndsInputText,
                          !customRecurrence.endsDate && styles.customEndsInputPlaceholder,
                        ]}
                      >
                        {customRecurrence.endsDate
                          ? (() => {
                              const date = customRecurrence.endsDate;
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const day = String(date.getDate()).padStart(2, '0');
                              const year = date.getFullYear();
                              return `${month}/${day}/${year}`;
                            })()
                          : '04/09/2025'}
                      </Text>
                    </TouchableOpacity>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.customEndsOption}
                  onPress={() => {
                    if (!isLoading) {
                      setCustomRecurrence(prev => ({
                        ...prev,
                        endsType: endsOptions[2],
                      }));
                    }
                  }}
                  disabled={isLoading}
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
                    editable={customRecurrence.endsType === endsOptions[2] && !isLoading}
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
                    <Text style={styles.datePickerModalTitle}>Select End Date</Text>
                    <TouchableOpacity
                      onPress={() => setShowEndsDatePicker(false)}
                      style={styles.datePickerModalCloseButton}
                    >
                      <Text style={styles.datePickerModalCloseText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <Calendar
                    onDayPress={(day) => {
                      const selectedDate = new Date(day.dateString);
                      setCustomRecurrence(prev => ({ ...prev, endsDate: selectedDate }));
                      setShowEndsDatePicker(false);
                    }}
                    minDate={new Date().toISOString().split('T')[0]}
                    markedDates={
                      customRecurrence.endsDate
                        ? {
                            [customRecurrence.endsDate.toISOString().split('T')[0]]: {
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
                onPress={() => {
                  if (!isLoading) {
                    setShowCustomRecurrenceModal(false);
                  }
                }}
                disabled={isLoading}
              >
                <Text style={styles.customCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.customDoneButton}
                onPress={() => {
                  if (!isLoading) {
                    handleCustomRecurrenceDone();
                  }
                }}
                disabled={isLoading}
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
    paddingTop: scaleHeight(18),
    paddingBottom: scaleHeight(12),
    paddingHorizontal: scaleWidth(18),
    width: '100%',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: scaleWidth(12),
  },
  headerTitle: {
    fontSize: 16,
    color: colors.blackText,
    fontWeight: '700',
    fontFamily: Fonts.latoBold,
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
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: scaleWidth(20),
    paddingTop: scaleHeight(20),
    paddingBottom: scaleHeight(20),
    overflow: 'visible',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: scaleHeight(32),
    marginBottom: scaleHeight(20),
  },
  fieldContainer: {
    marginBottom: scaleHeight(20),
  },
  repeatFieldContainer: {
    position: 'relative',
    zIndex: 1001,
  },
  inputUnderline: {
    height: 1,
    backgroundColor: colors.grey20,
  },
  labelText: {
    fontFamily: Fonts.latoMedium,
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 12,
    letterSpacing: 0,
    color: '#414651', // Gray-700
    marginBottom: scaleHeight(8),
  },
  fieldActive: {
    borderColor: colors.primaryBlue,
  },
  titleInput: {
    fontSize: 12,
    fontFamily: Fonts.latoRegular,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: 0,
    color: colors.textPrimary,
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
  timeComponentPlaceholder: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  placeholderText: {
    color: "#a0a0a0",
    fontStyle: "italic",
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#DCE0E5',
    borderRadius: 8,
    paddingVertical: scaleHeight(12),
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.white,
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
    textAlignVertical: "top", // Aligns text to the top for Android
    borderWidth: 1,
    borderColor: '#DCE0E5',
    fontSize: 12,
    fontFamily: Fonts.latoRegular,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: 0,
    color: colors.textPrimary,
    padding: spacing.md,
    minHeight: scaleHeight(150),
  },
  pickerContainer: {
    width: 165,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  saveButton: {
    width: '100%',
    maxWidth: scaleWidth(335),
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryBlue, // Solid blue #00AEEF
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
  selectorText: {
    fontSize: 12,
    fontFamily: Fonts.latoRegular,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: 0,
    color: '#A4A7AE', // Placeholder color
    flex: 1,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  //Recurrence Styles

  // Recurrence Dropdown Styles
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
  },
  repeatDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: scaleHeight(6),
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primaryBlue,
    backgroundColor: colors.white,
    zIndex: 1002,
    shadowColor: '#0A0D12',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    overflow: 'hidden',
  },
  repeatOptionsWrapper: {
    maxHeight: scaleHeight(240),
  },
  repeatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
  },
  repeatOptionSelected: {
    backgroundColor: '#F0FBFF',
  },
  repeatOptionText: {
    fontSize: 14,
    color: colors.blackText,
    fontFamily: Fonts.latoMedium,
  },
  repeatOptionTextSelected: {
    color: colors.primaryBlue,
    fontFamily: Fonts.latoBold,
  },
  repeatDropdownFooter: {
    height: scaleHeight(6),
    backgroundColor: colors.primaryBlue,
  },
  // Custom Recurrence Modal Styles
  customRecurrenceModalContainer: {
    backgroundColor: colors.white,
    borderRadius: 20,
    width: '100%',
    maxHeight: '75%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  customRecurrenceContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    overflow: 'visible',
  },

  // Custom Modal Styles
  customModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
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
  customRecurrenceSection: {
    marginBottom: spacing.xl,
    overflow: 'visible',
  },
  customRecurrenceSectionTitle: {
    fontSize: fontSize.textSize16,
    fontWeight: '600',
    color: colors.blackText,
    marginBottom: spacing.md,
  },
  customRepeatEveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  customRepeatEveryInput: {
    width: scaleWidth(70),
    minWidth: scaleWidth(60),
    maxWidth: scaleWidth(90),
    height: scaleHeight(40),
    borderWidth: 1,
    borderColor: '#DCE0E5',
    borderRadius: borderRadius.sm,
    textAlign: 'center',
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    paddingHorizontal: scaleWidth(10),
    paddingVertical: 0,
    backgroundColor: colors.white,
    flexShrink: 0,
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
    minWidth: scaleWidth(90),
    maxWidth: scaleWidth(130),
    flex: 0,
    backgroundColor: colors.white,
  },
  customRepeatUnitText: {
    fontSize: fontSize.textSize16,
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
    flexWrap: 'wrap',
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
    minWidth: scaleWidth(100),
    width: scaleWidth(110),
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
  },
  customModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: colors.white,
  },
  customCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: '#F3F4F6',
  },
  customCancelButtonText: {
    fontSize: fontSize.textSize14,
    fontWeight: '500',
    color: '#6B7280',
  },
  customDoneButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  customDoneButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  customDoneButtonText: {
    fontSize: fontSize.textSize14,
    fontWeight: '600',
    color: colors.white,
  },
  recurrenceOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
});

export default CreateTaskScreen;