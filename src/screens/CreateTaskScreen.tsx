import React, { useEffect, useState, useRef } from "react";
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
  Alert
} from "react-native";
import LinearGradient from 'react-native-linear-gradient';
import CalendarWithTime from '../components/CalendarWithTime';
import { SafeAreaView } from "react-native-safe-area-context";
import FeatherIcon from 'react-native-vector-icons/Feather';
import { moderateScale, scaleHeight, scaleWidth } from '../utils/dimensions';
import {
  colors,
  fontSize,
  spacing,
  borderRadius,
  shadows,
} from '../utils/LightTheme';
import { AppNavigationProp } from "../navigations/appNavigation.type";
import { useNavigation, useRoute } from "@react-navigation/native";
import GradientText from "../components/home/GradientText";
import { Colors } from "../constants/Colors";
import { dayAbbreviations, dayNames, eventTypes, timezones } from "../constants/dummyData";
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
  const [showCustomRecurrenceModal, setShowCustomRecurrenceModal] = useState(false);
  const [customRecurrence, setCustomRecurrence] = useState(() => {
    const weekday =
      selectedDate
        ? selectedDate.toLocaleDateString('en-US', { weekday: 'long' })
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
  const endsOptions = ['Never', 'On', 'After'];
  const [selectedValue, setSelectedValue] = useState(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  
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
  const [selectedStartTime, setSelectedStartTime] = useState(
    editEventData?.selectedStartTime || '',
  );

  const [showDetailedDateTime, setShowDetailedDateTime] = useState(
    !!editEventData,
  );
  
  // Error states
  const [titleError, setTitleError] = useState<string>('');
  const [dateError, setDateError] = useState<string>('');
  const [timeError, setTimeError] = useState<string>('');
  
  // Refs for scrolling
  const scrollViewRef = useRef<ScrollView>(null);
  const titleInputRef = useRef<View>(null);
  const dateTimeSectionRef = useRef<View>(null);
  const [showEventTypeDropdown, setShowEventTypeDropdown] =
    useState(false);
  const [selectedEventType, setSelectedEventType] = useState(
    editEventData?.selectedEventType || 'Task',
  );
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
          // Convert 12-hour format to 24-hour format for selectedStartTime
          if (startDateTime.time) {
            const [time, period] = startDateTime.time.split(' ');
            const [hours, minutes] = time.split(':');

            let hour24 = parseInt(hours, 10);
            if (period === 'PM' && hour24 !== 12) {
              hour24 += 12;
            } else if (period === 'AM' && hour24 === 12) {
              hour24 = 0;
            }

            const time24h = `${hour24.toString().padStart(2, '0')}:${minutes}`;
            setSelectedStartTime(time24h);
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

        // Convert 12-hour format to 24-hour format
        const time12h = editEventData.time;
        const [time, period] = time12h.split(' ');
        const [hours, minutes] = time.split(':');

        let hour24 = parseInt(hours, 10);
        if (period === 'PM' && hour24 !== 12) {
          hour24 += 12;
        } else if (period === 'AM' && hour24 === 12) {
          hour24 = 0;
        }

        const time24h = `${hour24.toString().padStart(2, '0')}:${minutes}`;
        setSelectedStartTime(time24h);
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

  const handleDateTimeSelect = (
    date: Date,
    startTime: string,
    endTime: string,
  ) => {
    setSelectedDate(date);
    setSelectedStartTime(startTime);
    setShowDetailedDateTime(true);
    setSelectedRecurrence("Does not repeat");
    // Clear errors when date/time is selected
    setDateError('');
    setTimeError('');
  };
  const handleEventTypeSelect = (eventType: string) => {
    setSelectedEventType(eventType);
    setShowEventTypeDropdown(false);

    // Navigate to corresponding screen
    if (eventType === 'Event') {
      navigation.replace('CreateEventScreen');
    } else if (eventType === 'Out of office') {
      navigation.replace('CreateOutOfOfficeScreen');
    } else if (eventType === 'Task') {
      // Stay on current screen
      return;
    }
    // Add navigation for other event types as needed
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
      const startTimeISO = formatToISO8601(selectedDate!, selectedStartTime);

      const [hours, minutes] = selectedStartTime.split(':');
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
        customRepeatEventValue = `${repeatEvery}|${repeatUnit}|${repeatOn.join(',')}|${endsType}|${endsAfter}|${endsDate}`;
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

      // Refresh events in background (non-blocking) after navigation
      getUserEvents(activeAccount.userName, api).catch(err => {
        console.error('Background event refresh failed:', err);
      });

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
        
        // Refresh events in background (non-blocking) for sync
        getUserEvents(activeAccount.userName, api).catch(err => {
          console.error('Background event refresh failed:', err);
        });
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

      {/* Invisible overlay to close dropdowns when clicking outside */}
      {(showEventTypeDropdown) && (
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowEventTypeDropdown(false);
          }}
        />
      )}
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
        style={styles.scrollView}
      >
        <View style={styles.formContainer}>
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
            collapsable={false}
          >
            <TouchableOpacity
              style={styles.datePicker}
              onPress={() => {
                if (!isLoading) {
                  setShowCalendarModal(true);
                }
              }}
              disabled={isLoading}
            >
              <FeatherIcon name="calendar" size={20} color="#6C6C6C" />

              <Text style={styles.selectorText}>
                {selectedDate
                  ? selectedDate.toLocaleDateString() + ' ' + selectedStartTime
                  : "Pick date and time"}
              </Text>
              <Image
                style={{ marginLeft: scaleWidth(10) }}
                source={require('../assets/images/CreateEventImages/smallArrowDropdown.png')}
              />
            </TouchableOpacity>
            {(dateError || timeError) && (
              <Text style={styles.fieldErrorText}>
                {dateError || timeError}
              </Text>
            )}
          </View>
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
          <TextInput
            style={styles.descriptionInput}
            placeholder="Add description"
            value={description}
            onChangeText={setDescription}
            multiline
            placeholderTextColor="#888"
            editable={!isLoading}
          />
        </View>
      </ScrollView>

      {/* Calendar with Time Modal */}
      <CalendarWithTime
        isVisible={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        onDateTimeSelect={handleDateTimeSelect}
        mode="from"
        selectedDate={selectedDate}
        selectedTime={selectedStartTime ? (() => {
          // Convert 24-hour format to 12-hour format for display
          const [hours, minutes] = selectedStartTime.split(':');
          const hour24 = parseInt(hours, 10);
          const period = hour24 >= 12 ? 'PM' : 'AM';
          const hour12 = hour24 % 12 || 12;
          return `${hour12}:${minutes} ${period}`;
        })() : undefined}
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
                    onChangeText={text =>
                      setCustomRecurrence(prev => ({
                        ...prev,
                        repeatEvery: text,
                      }))
                    }
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
                    editable={customRecurrence.endsType === endsOptions[1] && !isLoading}
                  />
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

      <View style={styles.bottomActionBar}>
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          disabled={isLoading}
          onPress={createTask}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: scaleHeight(40),
    paddingBottom: spacing.lg,
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
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
    gap: 20,
  },
  inputSection: {
    marginBottom: spacing.lg,
  },
  inputUnderline: {
    height: 1,
    backgroundColor: colors.grey20,
  },
  titleInput: {
    fontSize: fontSize.textSize20,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minHeight: scaleHeight(50),
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
  datePicker:
  {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: spacing.md
  },
  fieldErrorText: {
    fontSize: fontSize.textSize12,
    color: '#FF3B30',
    fontWeight: '400',
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  descriptionInput: {
    backgroundColor: "#F6F7F9",
    borderRadius: 8,
    textAlignVertical: "top", // Aligns text to the top for Android
    borderWidth: 1,
    borderColor: "#e0e0e0",
    fontSize: fontSize.textSize18,
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
  bottomActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: spacing.xl,
    marginHorizontal: scaleWidth(20),
    paddingBottom: scaleHeight(50),
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
  buttonContainer: {
    padding: 20,
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  button: {
    backgroundColor: "#007AFF", // A standard blue for buttons
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  selectorText: {
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    fontWeight: '400',
    marginLeft: spacing.sm,
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
    flex: 1,
    marginLeft: spacing.sm,
  },
  recurrenceDropdown: {
    position: 'absolute',
    top: scaleHeight(160),
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
    maxHeight: scaleHeight(360),
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
    gap: spacing.sm,
  },
  customRepeatEveryInput: {
    width: scaleWidth(60),
    height: scaleHeight(40),
    borderWidth: 1,
    borderColor: '#DCE0E5',
    borderRadius: borderRadius.sm,
    textAlign: 'center',
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    paddingHorizontal: 4,
  },
  customRepeatUnitDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE0E5',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    height: scaleHeight(40),
    minWidth: scaleWidth(80),
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