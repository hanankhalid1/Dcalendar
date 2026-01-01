// (moved to styles object below)
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import moment from 'moment-timezone';
import { useNavigation, useRoute } from '@react-navigation/native';
import { moderateScale, scaleHeight, scaleWidth } from '../utils/dimensions';
import {
  colors,
  fontSize,
  spacing,
  borderRadius,
  shadows,
  colors as themeColors,
} from '../utils/LightTheme';
import { Fonts } from '../constants/Fonts';
import { AppNavigationProp, Screen } from '../navigations/appNavigation.type';
import { timezones, eventTypes } from '../constants/dummyData';
import CalendarWithTime from '../components/CalendarWithTime';
import GradientText from '../components/home/GradientText';
import { Colors } from '../constants/Colors';
import { useToast } from '../hooks/useToast';
import { useActiveAccount } from '../stores/useActiveAccount';
import { useEventsStore } from '../stores/useEventsStore';
import { useApiClient, generateOpenApiToken } from '../hooks/useApi';
import { BlockchainService } from '../services/BlockChainService';
import { NECJSPRIVATE_KEY } from '../constants/Config';
import Config from '../config';
import {
  convertToUTC,
  handleRepeatWeek,
  handleNotRepeat,
  handleCustom,
  handleAvailabilityScheduleDay,
  updateSchedule,
  generateLightColorWithContrast,
} from '../utils/appointmentHelper';
import { useToken } from '../stores/useTokenStore';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  FlatList,
  Alert,
  Switch,
  Image,
  ActivityIndicator,
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';

interface AppointmentScheduleScreenProps {}

interface Location {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface BookingFormField {
  fieldName: string;
  isRequired: boolean;
  manualField: boolean;
}

interface TimeSlot {
  start: string;
  end: string;
  noData?: string;
}

interface ScheduleDay {
  date: Date;
  time: TimeSlot[];
}

const AppointmentScheduleScreen: React.FC<
  AppointmentScheduleScreenProps
> = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<any>();
  const { appointmentId, mode } = route.params || {};
  const formMode = mode ?? null;
  const collaborateUser =
    formMode === 'collaborate_user' ? appointmentId : null;
  const { success, error: showErrorToast } = useToast();
  const activeAccount = useActiveAccount(state => state.account);
  const { api } = useApiClient();
  const blockchainService = new BlockchainService(NECJSPRIVATE_KEY);
  const token = useToken(state => state.token);

  // Appointment details state
  const [appointmentDetails, setAppointmentDetails] = useState({
    title: '',
    description: '',
    appointment_duration: 30,
    availability_type: 'repeat_week',
    appointment_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    is_buffer_time: false,
    buffer_time: 30,
    buffer_time_type: 'mm',
    is_maximum_per_day: false,
    maximum_per_day: 4,
    is_guest_permission: false,
    location: '',
    slotColor: '#18F06E',
  });

  // Schedule state
  const [scheduleRepeatWeek, setScheduleRepeatWeek] = useState<
    Record<string, TimeSlot[]>
  >({
    Sun: [{ start: '', end: '', noData: 'Unavailable' }],
    Mon: [{ start: '9:00 AM', end: '5:00 PM' }],
    Tue: [{ start: '9:00 AM', end: '5:00 PM' }],
    Wed: [{ start: '9:00 AM', end: '5:00 PM' }],
    Thu: [{ start: '9:00 AM', end: '5:00 PM' }],
    Fri: [{ start: '9:00 AM', end: '5:00 PM' }],
    Sat: [{ start: '', end: '', noData: 'Unavailable' }],
  });

  const [manualScheduleDay, setManualScheduleDay] = useState<ScheduleDay[]>([
    {
      date: new Date(),
      time: [{ start: '9:00 AM', end: '5:00 PM' }],
    },
  ]);

  const [availabilityScheduleDay, setAvailabilityScheduleDay] = useState<
    ScheduleDay[]
  >([]);
  const [customTimeSlotValue, setCustomTimeSlotValue] = useState<any>({});

  // Booking form state
  const [bookingForm, setBookingForm] = useState<BookingFormField[]>([
    { fieldName: 'First Name', isRequired: true, manualField: false },
    { fieldName: 'Last Name', isRequired: true, manualField: false },
    { fieldName: 'Email', isRequired: true, manualField: false },
  ]);

  // Location state
  const [locationType, setLocationType] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  // Collaborate users state
  const [searchQuery, setSearchQuery] = useState('');
  const [availableGuest, setAvailableGuest] = useState<string[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<string[]>([]);
  const [allContacts, setAllContacts] = useState<string[]>([]);

  // UI state
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);
  const [timezoneSearchQuery, setTimezoneSearchQuery] = useState('');
  const [showEventTypeDropdown, setShowEventTypeDropdown] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState('Appointment');
  const [isBookingForm, setIsBookingForm] = useState(false);
  const [bookAppointment, setBookAppointment] = useState(false);
  const [isCollaborateUser, setIsCollaborateUser] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarMode, setCalendarMode] = useState<'from' | 'to'>('from');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [currentTimeSlot, setCurrentTimeSlot] = useState<{
    day?: string;
    date?: Date;
    index?: number;
    type?: 'start' | 'end';
  } | null>(null);
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [errorDetails, setErrorDetails] = useState<any>({});
  const [editFormData, setEditFormData] = useState<any>(null);
  const [bookingFormFieldPopup, setBookingFormFieldPopup] = useState(false);
  const [bookingFormFieldName, setBookingFormFieldName] = useState('');
  const [bookingFormFieldRequired, setBookingFormFieldRequired] =
    useState(false);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Load contacts on mount
  useEffect(() => {
    const loadContacts = async () => {
      if (activeAccount?.userName) {
        const result = await getAllContacts(activeAccount.userName);
        if (result.success) {
          const emails = result.data.map((guest: any) => guest.email);
          setAllContacts(emails);
        }
      }
    };
    loadContacts();
  }, [activeAccount]);

  // Filter contacts based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = allContacts
        .filter((contact: string) =>
          contact.toLowerCase().includes(searchQuery.toLowerCase()),
        )
        .filter((contact: string) => contact !== activeAccount?.userName)
        .filter((contact: string) => !availableGuest.includes(contact));
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts([]);
    }
  }, [searchQuery, allContacts, availableGuest, activeAccount]);

  // Fetch appointment details for edit mode
  useEffect(() => {
    const fetchAppointmentData = async () => {
      if (
        appointmentId &&
        (formMode === 'edit' || formMode === 'collaborate_user')
      ) {
        try {
          setIsLoading(true);
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const activeUser = activeAccount?.userName || '';

          if (!activeUser) {
            setIsLoading(false);
            return;
          }

          // Fetch appointment details from API
          // Match web endpoint: GET /appointmentDetailsById/${appointmentId} with x-api-token header
          const openApiToken = generateOpenApiToken(
            JSON.stringify({ appointmentId }),
            Config.CRYPTO_SECRET || 'dmail-secret',
          );
          const response = await api(
            'GET',
            `/appointmentDetailsById/${appointmentId}`,
            undefined,
            {
              headers: {
                'x-api-token': openApiToken,
              },
            },
          );

          // Match web response structure: response?.data?.data
          const appointmentData = response?.data?.data || response?.data;
          if (appointmentData?.displaySlotTimes) {
            const displaySlotTimes = appointmentData.displaySlotTimes;
            const filterLoginUser = displaySlotTimes.filter(
              (user: any) => user?.userName === activeUser,
            );

            if (
              filterLoginUser.length &&
              (formMode === 'edit' || formMode === 'collaborate_user')
            ) {
              const filterCollaborateUser = displaySlotTimes.filter(
                (user: any) => user?.userName !== activeUser,
              );

              // Set appointment details
              const loginUserData = filterLoginUser[0];
              setAppointmentDetails({
                title: loginUserData?.title ?? '',
                description: loginUserData?.description ?? '',
                appointment_duration: loginUserData?.appointment_duration ?? 30,
                availability_type:
                  loginUserData?.availability_type ?? 'repeat_week',
                appointment_timezone:
                  loginUserData?.timeZone ??
                  Intl.DateTimeFormat().resolvedOptions().timeZone,
                is_buffer_time: loginUserData?.is_buffer_time ?? false,
                buffer_time: loginUserData?.buffer_time ?? 30,
                buffer_time_type: loginUserData?.buffer_time_type ?? 'mm',
                is_maximum_per_day: loginUserData?.is_maximum_per_day ?? false,
                maximum_per_day: loginUserData?.maximum_per_day ?? 4,
                is_guest_permission:
                  loginUserData?.is_guest_permission ?? false,
                location: loginUserData?.location ?? '',
                slotColor:
                  loginUserData?.userSettings?.slotColor ??
                  loginUserData?.slotColor ??
                  generateLightColorWithContrast(),
              });

              // Handle location data
              const location = loginUserData?.location ?? '';
              if (location) {
                setLocationType('inperson');
                setSelectedLocation({
                  value: location,
                  label: location,
                  lat: '',
                  lon: '',
                });
              } else {
                setLocationType(null);
              }

              // Set schedules
              if (loginUserData?.timeValue) {
                setScheduleRepeatWeek(loginUserData.timeValue);
              }
              if (loginUserData?.booking_form) {
                setBookingForm(loginUserData.booking_form);
              }
              if (loginUserData?.userSettings?.custom_time_slot) {
                setCustomTimeSlotValue(
                  loginUserData.userSettings.custom_time_slot,
                );
              }
              if (loginUserData?.appointmentCollaborateUsers) {
                setAvailableGuest(loginUserData.appointmentCollaborateUsers);
              }
              if (loginUserData?.availableTime) {
                setAvailabilityScheduleDay(
                  loginUserData.availableTime.map((date: any) => ({
                    date: moment(date.date).toDate(),
                    time: date.time,
                  })),
                );
              }
              if (loginUserData?.manualTimeValue) {
                setManualScheduleDay(
                  loginUserData.manualTimeValue.map((date: any) => ({
                    date: moment(date.date).toDate(),
                    time: date.time,
                  })),
                );
              }
            }
          }
        } catch (err) {
          console.error('Error fetching appointment details:', err);
          showErrorToast('Error', 'Failed to load appointment details');
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchAppointmentData();
  }, [appointmentId, formMode, activeAccount?.userName]);

  // Update schedule times based on availability type
  useEffect(() => {
    let updatedSchedules: any[] = [];

    if (appointmentDetails.availability_type === 'repeat_week') {
      updatedSchedules = handleRepeatWeek(scheduleRepeatWeek);
    } else if (appointmentDetails.availability_type === 'not_repeat') {
      updatedSchedules = handleNotRepeat(manualScheduleDay);
    } else if (appointmentDetails.availability_type === 'custom') {
      updatedSchedules = handleCustom(customTimeSlotValue, scheduleRepeatWeek);
    }

    if (
      appointmentDetails.availability_type !== 'not_repeat' &&
      availabilityScheduleDay.length > 0
    ) {
      const availabilitySchedules = handleAvailabilityScheduleDay(
        availabilityScheduleDay,
        updatedSchedules,
      );
      updatedSchedules = availabilitySchedules;
    }

    // Update schedule state if needed (for future use)
    // setAppointmentScheduleTime(prev => updateSchedule(prev, updatedSchedules));
  }, [
    scheduleRepeatWeek,
    appointmentDetails.availability_type,
    manualScheduleDay,
    customTimeSlotValue,
    availabilityScheduleDay,
  ]);

  const handleClose = () => {
    navigation.goBack();
  };

  const handleEventTypeSelect = (eventType: string) => {
    setSelectedEventType(eventType);
    setShowEventTypeDropdown(false);

    if (eventType === 'Task') {
      navigation.navigate(Screen.CreateTaskScreen);
    } else if (eventType === 'Out of office') {
      navigation.navigate(Screen.CreateOutOfOfficeScreen);
    } else if (eventType === 'Event') {
      navigation.navigate(Screen.CreateEventScreen);
    } else if (eventType === 'Appointment') {
      return;
    }
  };

  const handleAvailabilityChange = (value: string) => {
    setAppointmentDetails(prev => ({
      ...prev,
      availability_type: value,
    }));
    if (value === 'custom') {
      setShowRecurrenceModal(true);
      setCustomTimeSlotValue({
        repeatEvery: 2,
        startDate: moment().format('YYYY-MM-DD'),
        endOption: 'never',
        endDate: moment().add(2, 'months').format('YYYY-MM-DD'),
      });
    }
  };

  // Time validation helper
  const isValidTime = (timeStr: string): boolean => {
    return moment(timeStr, 'h:mm A', true).isValid();
  };

  const parseTime = (timeStr: string): moment.Moment => {
    return moment(timeStr, 'h:mm A');
  };

  const handleToTimeChange = (
    day: string,
    timeStr: string,
    index: number,
    type: 'start' | 'end',
  ) => {
    if (!isValidTime(timeStr)) {
      showErrorToast(
        'Invalid Time',
        'Please enter a valid time format (e.g., 9:00 AM)',
      );
      return;
    }

    setScheduleRepeatWeek(prev => {
      let updatedSchedule = { ...prev };
      const daySchedule = updatedSchedule[day];

      if (daySchedule) {
        updatedSchedule[day] = daySchedule.map((slot: any, i: number) => {
          if (i === index) {
            const newTime = parseTime(timeStr);
            const otherTime =
              type === 'start' ? parseTime(slot.end) : parseTime(slot.start);

            if (type === 'start' && newTime.isAfter(otherTime)) {
              showErrorToast(
                'Invalid Time',
                'Start time cannot be after end time',
              );
              return slot;
            }

            if (type === 'end' && newTime.isBefore(otherTime)) {
              showErrorToast(
                'Invalid Time',
                'End time cannot be before start time',
              );
              return slot;
            }

            return { ...slot, [type]: timeStr };
          }
          return slot;
        });
      }

      return updatedSchedule;
    });
  };

  const handleAvailability = (day: string, type: string, index?: number) => {
    setScheduleRepeatWeek(prev => {
      const updatedSchedule = { ...prev };
      const daySchedule = updatedSchedule[day] || [];

      if (type === 'remove') {
        updatedSchedule[day] =
          daySchedule.length === 1
            ? [{ noData: 'Unavailable' }]
            : daySchedule.filter((_, i) => i !== index);
      }

      if (type === 'add') {
        if (daySchedule[0]?.start) {
          const lastSlot = daySchedule[daySchedule.length - 1];
          const lastEndTime = parseTime(lastSlot.end);
          const lastEndTimeAddHour = lastEndTime.add(1, 'hour');
          const lastEndTimeAddTwoHour = lastEndTime.add(2, 'hour');
          const cutoffTime = parseTime('11:59 PM');

          if (
            lastEndTimeAddHour.isBefore(cutoffTime) &&
            lastEndTimeAddTwoHour.isBefore(cutoffTime)
          ) {
            updatedSchedule[day] = [
              ...daySchedule,
              {
                start: lastEndTimeAddHour.format('h:mm A'),
                end: lastEndTimeAddTwoHour.format('h:mm A'),
              },
            ];
          }
        } else {
          updatedSchedule[day] = [{ start: '9:00 AM', end: '5:00 PM' }];
        }
      }

      if (type === 'copy') {
        daysOfWeek.forEach(weekday => {
          if (!prev[weekday]?.[0]?.noData) {
            updatedSchedule[weekday] = [...prev[day]];
          }
        });
      }

      return updatedSchedule;
    });
  };

  const handleManualSchedule = (type: string, date: Date, index?: number) => {
    setManualScheduleDay(prev => {
      let updatedSchedule = [...prev];
      const findIndex = updatedSchedule.findIndex(
        dates => dates.date.getTime() === date.getTime(),
      );

      if (type === 'remove' && findIndex !== -1) {
        const daySchedule = updatedSchedule[findIndex];
        if (daySchedule.time.length === 1) {
          updatedSchedule.splice(findIndex, 1);
        } else if (index !== undefined) {
          updatedSchedule[findIndex] = {
            ...daySchedule,
            time: daySchedule.time.filter((_, i) => i !== index),
          };
        }
      }

      if (type === 'add' && findIndex !== -1) {
        const daySchedule = updatedSchedule[findIndex];
        const lastSlot = daySchedule.time[daySchedule.time.length - 1];
        const lastEndTime = parseTime(lastSlot.end);
        const lastEndTimeAddHour = lastEndTime.add(1, 'hour');
        const lastEndTimeAddTwoHour = lastEndTime.add(2, 'hour');
        const cutoffTime = parseTime('11:59 PM');

        if (
          lastEndTimeAddHour.isBefore(cutoffTime) &&
          lastEndTimeAddTwoHour.isBefore(cutoffTime)
        ) {
          updatedSchedule[findIndex] = {
            ...daySchedule,
            time: [
              ...daySchedule.time,
              {
                start: lastEndTimeAddHour.format('h:mm A'),
                end: lastEndTimeAddTwoHour.format('h:mm A'),
              },
            ],
          };
        }
      }

      return updatedSchedule;
    });
  };

  const handleManualSelect = (date: Date) => {
    const findIndex = manualScheduleDay.findIndex((dates: ScheduleDay) => {
      return (
        moment(dates.date).format('YYYY-MM-DD') ===
        moment(date).format('YYYY-MM-DD')
      );
    });

    if (findIndex === -1) {
      setManualScheduleDay(prev => [
        ...prev,
        {
          date: date,
          time: [{ start: '9:00 AM', end: '5:00 PM' }],
        },
      ]);
    }
  };

  const handleManualTimeChange = (
    date: Date,
    timeStr: string,
    index: number,
    type: 'start' | 'end',
  ) => {
    if (!isValidTime(timeStr)) {
      showErrorToast('Invalid Time', 'Please enter a valid time format');
      return;
    }

    setManualScheduleDay(prev => {
      let updatedSchedule = [...prev];
      const findIndex = updatedSchedule.findIndex(
        dates => dates.date.getTime() === date.getTime(),
      );

      if (findIndex !== -1) {
        const daySchedule = updatedSchedule[findIndex];
        updatedSchedule[findIndex] = {
          ...daySchedule,
          time: daySchedule.time.map((slot: any, i: number) => {
            if (i === index) {
              const newTime = parseTime(timeStr);
              const otherTime =
                type === 'start' ? parseTime(slot.end) : parseTime(slot.start);

              if (type === 'start' && newTime.isAfter(otherTime)) {
                showErrorToast(
                  'Invalid Time',
                  'Start time cannot be after end time',
                );
                return slot;
              }

              if (type === 'end' && newTime.isBefore(otherTime)) {
                showErrorToast(
                  'Invalid Time',
                  'End time cannot be before start time',
                );
                return slot;
              }

              return { ...slot, [type]: timeStr };
            }
            return slot;
          }),
        };
      }

      return updatedSchedule;
    });
  };

  const handleGuestUser = async (type: string, value: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (type === 'add' && emailRegex.test(value)) {
      try {
        // Check if user exists on blockchain
        const userExist = await blockchainService.getPublicKeyOfUser(value);
        if (!userExist || userExist === '') {
          showErrorToast(
            'Error',
            "User doesn't exist in our dsuite applications",
          );
          setSearchQuery('');
          return;
        }

        setAvailableGuest(prev => [...prev, value]);
        setSearchQuery('');
      } catch (err) {
        console.error('Error checking user existence:', err);
        showErrorToast(
          'Error',
          "User doesn't exist in our dsuite applications",
        );
        setSearchQuery('');
      }
    } else if (type === 'remove') {
      setAvailableGuest(prev => prev.filter(guest => guest !== value));
    }
  };

  const handleAvailabilityDateChange = (date: Date) => {
    const findIndex = availabilityScheduleDay.findIndex(
      (dates: ScheduleDay) => {
        return (
          moment(dates.date).format('YYYY-MM-DD') ===
          moment(date).format('YYYY-MM-DD')
        );
      },
    );

    if (findIndex === -1) {
      setAvailabilityScheduleDay(prev => [
        ...prev,
        {
          date: date,
          time: [{ start: '9:00 AM', end: '5:00 PM' }],
        },
      ]);
    }
  };

  const handleAvailabilityDateTimeChange = (
    date: Date,
    timeStr: string,
    index: number,
    type: 'start' | 'end',
  ) => {
    if (!isValidTime(timeStr)) {
      showErrorToast('Invalid Time', 'Please enter a valid time format');
      return;
    }

    setAvailabilityScheduleDay(prev => {
      let updatedSchedule = [...prev];
      const findIndex = updatedSchedule.findIndex(
        dates => dates.date.getTime() === date.getTime(),
      );

      if (findIndex !== -1) {
        const daySchedule = updatedSchedule[findIndex];
        updatedSchedule[findIndex] = {
          ...daySchedule,
          time: daySchedule.time.map((slot: any, i: number) => {
            if (i === index) {
              const newTime = parseTime(timeStr);
              const otherTime =
                type === 'start' ? parseTime(slot.end) : parseTime(slot.start);

              if (type === 'start' && newTime.isAfter(otherTime)) {
                showErrorToast(
                  'Invalid Time',
                  'Start time cannot be after end time',
                );
                return slot;
              }

              if (type === 'end' && newTime.isBefore(otherTime)) {
                showErrorToast(
                  'Invalid Time',
                  'End time cannot be before start time',
                );
                return slot;
              }

              return { ...slot, [type]: timeStr };
            }
            return slot;
          }),
        };
      }

      return updatedSchedule;
    });
  };

  const handleAvailabilityDateSchedule = (
    type: string,
    date: Date,
    index?: number,
  ) => {
    setAvailabilityScheduleDay(prev => {
      let updatedSchedule = [...prev];
      const findIndex = updatedSchedule.findIndex(
        dates => dates.date.getTime() === date.getTime(),
      );

      if (type === 'remove' && findIndex !== -1) {
        const daySchedule = updatedSchedule[findIndex];
        if (daySchedule.time.length === 1) {
          updatedSchedule.splice(findIndex, 1);
        } else if (index !== undefined) {
          updatedSchedule[findIndex] = {
            ...daySchedule,
            time: daySchedule.time.filter((_, i) => i !== index),
          };
        }
      }

      if (type === 'add' && findIndex !== -1) {
        const daySchedule = updatedSchedule[findIndex];
        const lastSlot = daySchedule.time[daySchedule.time.length - 1];
        const lastEndTime = parseTime(lastSlot.end);
        const lastEndTimeAddHour = lastEndTime.add(1, 'hour');
        const lastEndTimeAddTwoHour = lastEndTime.add(2, 'hour');
        const cutoffTime = parseTime('11:59 PM');

        if (
          lastEndTimeAddHour.isBefore(cutoffTime) &&
          lastEndTimeAddTwoHour.isBefore(cutoffTime)
        ) {
          updatedSchedule[findIndex] = {
            ...daySchedule,
            time: [
              ...daySchedule.time,
              {
                start: lastEndTimeAddHour.format('h:mm A'),
                end: lastEndTimeAddTwoHour.format('h:mm A'),
              },
            ],
          };
        }
      }

      return updatedSchedule;
    });
  };

  const handleRemoveBookingFormField = (index: number) => {
    const updatedFormFields = [...bookingForm];
    updatedFormFields.splice(index, 1);
    setBookingForm(updatedFormFields);
  };

  const handleAddBookingFormField = () => {
    if (bookingFormFieldName.trim()) {
      if (editFormData) {
        // Edit existing field
        const updatedFormFields = bookingForm.map((field, index) => {
          if (
            field.fieldName === editFormData.fieldName &&
            field.manualField === editFormData.manualField
          ) {
            return {
              fieldName: bookingFormFieldName.trim(),
              isRequired: bookingFormFieldRequired,
              manualField: true,
            };
          }
          return field;
        });
        setBookingForm(updatedFormFields);
      } else {
        // Add new field
        setBookingForm([
          ...bookingForm,
          {
            fieldName: bookingFormFieldName.trim(),
            isRequired: bookingFormFieldRequired,
            manualField: true,
          },
        ]);
      }
      setBookingFormFieldName('');
      setBookingFormFieldRequired(false);
      setEditFormData(null);
      setBookingFormFieldPopup(false);
    }
  };

  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowLocationModal(false);
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

      const data: Location[] = await response.json();

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
      setSuggestions(suggestionsWithInput);
      setShowLocationModal(true);
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setSuggestions([{ value: query, label: query }]);
      setShowLocationModal(true);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  // Debounced location search
  const debouncedFetch = useRef<((query: string) => void) | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    debouncedFetch.current = (query: string) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        fetchSuggestions(query);
        timeoutId = null;
      }, 300);
    };

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const handleInputChange = (inputValue: string) => {
    setAppointmentDetails(prev => ({ ...prev, location: inputValue }));
    if (debouncedFetch.current) {
      debouncedFetch.current(inputValue);
    } else {
      fetchSuggestions(inputValue);
    }
  };

  // Handle location input focus - allow continued typing
  const handleLocationFocus = () => {
    if (
      appointmentDetails.location &&
      appointmentDetails.location.length >= 2
    ) {
      if (debouncedFetch.current) {
        debouncedFetch.current(appointmentDetails.location);
      } else {
        fetchSuggestions(appointmentDetails.location);
      }
    }
  };

  const handleSuggestionSelect = (selectedOption: any) => {
    if (selectedOption) {
      setSelectedLocation(selectedOption);
      setAppointmentDetails(prev => ({
        ...prev,
        location: selectedOption.label,
      }));
    } else {
      setSelectedLocation(null);
      setAppointmentDetails(prev => ({
        ...prev,
        location: '',
      }));
    }
    setSuggestions([]);
    setShowLocationModal(false);
  };

  // Get duration display text
  const getDurationText = () => {
    const duration = appointmentDetails.appointment_duration;
    if (duration === 60) return '1 hour';
    if (duration === 90) return '1.5 hour';
    if (duration === 120) return '2 hours';
    return `${duration} minutes`;
  };

  // Get availability type display text
  const getAvailabilityTypeText = () => {
    const type = appointmentDetails.availability_type;
    if (type === 'repeat_week') return 'Repeat weekly';
    if (type === 'not_repeat') return "Doesn't repeat";
    if (type === 'custom') return 'Custom';
    return 'Repeat weekly';
  };

  const getLocationIcon = (type: string) => {
    if (type === 'inperson') {
      return <FeatherIcon name="map-pin" size={20} color={colors.primary} />;
    }
    return null;
  };

  const getLocationLabel = (type: string) => {
    if (type === 'inperson') {
      return 'In-person';
    }
    return '';
  };

  const handleDateTimeSelect = (date: Date, time: string) => {
    if (currentTimeSlot) {
      if (currentTimeSlot.day) {
        handleToTimeChange(
          currentTimeSlot.day,
          time,
          currentTimeSlot.index || 0,
          currentTimeSlot.type || 'start',
        );
      } else if (currentTimeSlot.date) {
        if (
          availabilityScheduleDay.some(
            d => d.date.getTime() === currentTimeSlot.date!.getTime(),
          )
        ) {
          handleAvailabilityDateTimeChange(
            currentTimeSlot.date,
            time,
            currentTimeSlot.index || 0,
            currentTimeSlot.type || 'start',
          );
        } else {
          handleManualTimeChange(
            currentTimeSlot.date,
            time,
            currentTimeSlot.index || 0,
            currentTimeSlot.type || 'start',
          );
        }
      } else {
        // New date selection
        if (appointmentDetails.availability_type === 'not_repeat') {
          handleManualSelect(date);
        } else {
          handleAvailabilityDateChange(date);
        }
      }
    }
    setShowCalendarModal(false);
    setCurrentTimeSlot(null);
  };

  const openTimePicker = (
    day?: string,
    date?: Date,
    index?: number,
    type?: 'start' | 'end',
  ) => {
    setCurrentTimeSlot({ day, date, index, type });
    setShowCalendarModal(true);
  };

  const getSelectedTimezoneData = () => {
    return (
      timezones.find(
        tz => tz.id === appointmentDetails.appointment_timezone,
      ) || {
        id: appointmentDetails.appointment_timezone,
        name: appointmentDetails.appointment_timezone,
        offset: 'GMT+00:00',
      }
    );
  };

  const getFilteredTimezones = () => {
    if (!timezoneSearchQuery) return timezones;
    return timezones.filter(tz =>
      tz.name.toLowerCase().includes(timezoneSearchQuery.toLowerCase()),
    );
  };

  const handleTimezoneSelect = (timezoneId: string) => {
    setAppointmentDetails(prev => ({
      ...prev,
      appointment_timezone: timezoneId,
    }));
    setShowTimezoneModal(false);
    setTimezoneSearchQuery('');
  };

  // Date Display Container Component
  const DateDisplayContainer = (
    ScheduleDay: ScheduleDay[],
    handleTimeChange: (
      date: Date,
      time: string,
      index: number,
      type: 'start' | 'end',
    ) => void,
    handleSchedule: (type: string, date: Date, index?: number) => void,
  ) => {
    return (
      <View style={styles.dateDisplayContainer}>
        {ScheduleDay.map((day, _index) => (
          <View key={_index} style={styles.dateTimeRow}>
            <View style={styles.datePickerContainer}>
              <Text style={styles.dateText}>
                {moment(day.date).format('DD MMM YY')}
              </Text>
            </View>
            <View style={styles.timeSlotsContainer}>
              {day.time.map((time: any, timeIndex: number) => (
                <View key={'time_slot' + timeIndex} style={styles.timeSlotRow}>
                  <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={() =>
                      openTimePicker(undefined, day.date, timeIndex, 'start')
                    }
                  >
                    <Text style={styles.timePickerText}>{time.start}</Text>
                    <FeatherIcon
                      name="clock"
                      size={14}
                      color={colors.grey400}
                    />
                  </TouchableOpacity>
                  <Text style={styles.timeSeparator}>-</Text>
                  <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={() =>
                      openTimePicker(undefined, day.date, timeIndex, 'end')
                    }
                  >
                    <Text style={styles.timePickerText}>{time.end}</Text>
                    <FeatherIcon
                      name="clock"
                      size={14}
                      color={colors.grey400}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleSchedule('add', day.date, undefined)}
                    style={styles.iconButton}
                  >
                    <FeatherIcon name="plus" size={14} color={colors.grey400} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      handleSchedule('remove', day.date, timeIndex)
                    }
                    style={styles.iconButton}
                  >
                    <FeatherIcon name="x" size={14} color={colors.grey400} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const handleSubmit = async () => {
    let txHash = null;
    let apiResponse = null;

    try {
      setIsLoading(true);

      if (!activeAccount || !token) {
        showErrorToast('Error', 'Authentication data not found');
        setIsLoading(false);
        return;
      }

      if (!appointmentDetails.title.trim()) {
        showErrorToast('Validation Error', 'Please enter a title');
        setIsLoading(false);
        return;
      }

      // Generate proper appointment UID
      const appointmentUID =
        formMode === 'edit'
          ? appointmentId
          : `appt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Get current time in the same format as events (YYYYMMDDTHHMMSS)
      const currentTime = new Date();
      const fromTime = currentTime
        .toISOString()
        .replace(/[-:]/g, '')
        .split('.')[0]; // Format: "20251106T090000"
      const toTime = new Date(currentTime.getTime() + 30 * 60000)
        .toISOString()
        .replace(/[-:]/g, '')
        .split('.')[0]; // +30 minutes

      // Create appointment data that is COMPATIBLE with event structure
      const newAppointmentDetails = {
        // ✅ CORE EVENT FIELDS (required for retrieval with events)
        uid: appointmentUID,
        title: appointmentDetails.title,
        description: appointmentDetails.description || '',
        fromTime: fromTime, // ✅ MUST be in event format: "YYYYMMDDTHHMMSS"
        toTime: toTime, // ✅ MUST be in event format: "YYYYMMDDTHHMMSS"
        done: false,
        list: [
          {
            key: 'appointment',
            value: 'appointment',
            color: Colors.primaryGreen,
          },
        ],

        // ✅ APPOINTMENT-SPECIFIC FIELDS (for appointment functionality)
        appointment_uid: appointmentUID,
        appointment_title: appointmentDetails.title,
        appointment_description: appointmentDetails.description || '',
        appointment_collaborate_users: JSON.stringify(availableGuest),
        appointment_settings: JSON.stringify({
          booking_form: bookingForm,
          locationType: locationType,
          slotColor: appointmentDetails.slotColor,
          ...appointmentDetails,
        }),
        appointment_public_link: '',
        appointment_create_user: activeAccount?.userName,
        collaborate_users: [
          {
            user_id: activeAccount?.userName,
            appointment_available_time: JSON.stringify(
              convertToUTC(
                {
                  repeat_week: scheduleRepeatWeek,
                  manual_schedule: manualScheduleDay,
                  availability_schedule_day: availabilityScheduleDay,
                },
                appointmentDetails.appointment_timezone,
              ),
            ),
            appointment_time_zone: appointmentDetails.appointment_timezone,
            appointment_booking_settings: JSON.stringify({
              custom_time_slot: customTimeSlotValue,
              availability_type: appointmentDetails.availability_type,
              slotColor: appointmentDetails.slotColor,
            }),
          },
        ],
      };

      console.log('📝 [Appointment] Creating appointment with data:', {
        uid: newAppointmentDetails.uid,
        title: newAppointmentDetails.title,
        fromTime: newAppointmentDetails.fromTime, // Should be like "20251106T090000"
        toTime: newAppointmentDetails.toTime, // Should be like "20251106T093000"
        hasList: !!newAppointmentDetails.list,
        listContent: newAppointmentDetails.list,
      });

      if (formMode === 'edit') {
        // Update existing appointment
        const updatePayload = {
          ...newAppointmentDetails,
          appointment_schedule_id: appointmentId,
          updateType: 'edit',
        };
        delete updatePayload.appointment_public_link;

        console.log('🔄 [Appointment] Updating appointment...');
        txHash = await blockchainService.updateAppointmentDetails(
          updatePayload,
          activeAccount,
          token,
        );

        if (!txHash) {
          showErrorToast(
            'Blockchain Error',
            'Failed to confirm blockchain update.',
          );
          setIsLoading(false);
          return;
        }

        // API call for update
        const apiPayload = {
          appointmentDetails: updatePayload,
        };
        apiResponse = await api(
          'POST',
          '/updateAppointmentDetails',
          apiPayload,
        );

        const result = apiResponse?.data;

        const isSuccess =
          result?.status === true ||
          result?.status === 1 ||
          result?.success === true ||
          apiResponse?.status === 200;

        if (isSuccess) {
          success(
            'Success',
            result?.message || 'Appointment schedule updated successfully',
          );

          // Force refresh events after successful update
          try {
            console.log(
              '🔄 Force refreshing events after appointment update...',
            );
            const { getUserEvents, setUserEvents } = useEventsStore.getState();

            // Normalize appointment structure to match what the store expects
            const normalizedAppointment = {
              ...newAppointmentDetails,
              // Ensure both uid fields are present
              uid:
                newAppointmentDetails.uid ||
                newAppointmentDetails.appointment_uid,
              appointment_uid:
                newAppointmentDetails.appointment_uid ||
                newAppointmentDetails.uid,
              // Ensure both title fields are present
              title:
                newAppointmentDetails.title ||
                newAppointmentDetails.appointment_title,
              appointment_title:
                newAppointmentDetails.appointment_title ||
                newAppointmentDetails.title,
              // Ensure both description fields are present
              description:
                newAppointmentDetails.description ||
                newAppointmentDetails.appointment_description,
              appointment_description:
                newAppointmentDetails.appointment_description ||
                newAppointmentDetails.description,
              // Ensure list/tags are present
              list: newAppointmentDetails.list || [],
            };

            // Also manually add the appointment to the store to ensure it appears
            const currentEvents = useEventsStore.getState().userEvents || [];
            const updatedEvents = [
              ...currentEvents.filter(
                (e: any) => (e.uid || e.appointment_uid) !== appointmentUID,
              ),
              normalizedAppointment,
            ];
            setUserEvents(updatedEvents);

            console.log(
              '📅 Updated appointment in store. Total events:',
              updatedEvents.length,
            );

            // Also trigger API refresh to sync with server
            await getUserEvents(activeAccount?.userName, api);
            console.log('✅ Events refreshed from API');
          } catch (refreshError) {
            console.error('⚠️ Error refreshing events:', refreshError);
          }

          await new Promise(resolve => setTimeout(resolve, 1000));
          navigation.goBack();
        } else {
          showErrorToast(
            'Error',
            result?.message || 'Appointment update failed.',
          );
        }
      } else {
        // Create new appointment
        console.log('🔄 [Appointment] Creating new appointment...');
        const blockchainResult =
          await blockchainService.storeAppointmentDetails(
            newAppointmentDetails,
            activeAccount,
            token,
          );

        if (!blockchainResult || !blockchainResult.txHash) {
          showErrorToast(
            'Blockchain Error',
            'Failed to confirm blockchain creation.',
          );
          setIsLoading(false);
          return;
        }

        txHash = blockchainResult.txHash;
        console.log('✅ [Appointment] Blockchain creation successful:', txHash);

        // API call for creation
        const apiPayload = {
          appointmentDetails: newAppointmentDetails,
        };
        apiResponse = await api(
          'POST',
          '/appointmentScheduleCreate',
          apiPayload,
        );

        const result = apiResponse?.data;

        const isSuccess =
          result?.status === true ||
          result?.status === 1 ||
          result?.success === true ||
          apiResponse?.status === 200;

        if (isSuccess) {
          success(
            'Success',
            result?.message || 'Appointment schedule created successfully',
          );

          // Force refresh events after successful creation
          try {
            console.log(
              '🔄 Force refreshing events after appointment creation...',
            );
            const { getUserEvents, setUserEvents } = useEventsStore.getState();

            // Also manually add the appointment to the store to ensure it appears immediately
            // Normalize appointment structure to match what the store expects
            const normalizedAppointment = {
              ...newAppointmentDetails,
              // Ensure both uid fields are present
              uid:
                newAppointmentDetails.uid ||
                newAppointmentDetails.appointment_uid,
              appointment_uid:
                newAppointmentDetails.appointment_uid ||
                newAppointmentDetails.uid,
              // Ensure both title fields are present
              title:
                newAppointmentDetails.title ||
                newAppointmentDetails.appointment_title,
              appointment_title:
                newAppointmentDetails.appointment_title ||
                newAppointmentDetails.title,
              // Ensure both description fields are present
              description:
                newAppointmentDetails.description ||
                newAppointmentDetails.appointment_description,
              appointment_description:
                newAppointmentDetails.appointment_description ||
                newAppointmentDetails.description,
              // Ensure list/tags are present
              list: newAppointmentDetails.list || [],
            };

            const currentEvents = useEventsStore.getState().userEvents || [];
            // Remove any existing appointment with same UID to avoid duplicates
            const filteredEvents = currentEvents.filter(
              (e: any) => (e.uid || e.appointment_uid) !== appointmentUID,
            );
            const updatedEvents = [...filteredEvents, normalizedAppointment];
            setUserEvents(updatedEvents);

            console.log(
              '📅 Manually added appointment to store. Total events:',
              updatedEvents.length,
            );
            console.log('📅 Appointment details:', {
              uid: normalizedAppointment.uid,
              title: normalizedAppointment.title,
              fromTime: normalizedAppointment.fromTime,
              toTime: normalizedAppointment.toTime,
              hasList: !!normalizedAppointment.list,
              listLength: normalizedAppointment.list?.length || 0,
            });

            // Wait a bit for blockchain to sync, then trigger API refresh
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Also trigger API refresh to sync with server (will update when blockchain syncs)
            try {
              await getUserEvents(activeAccount?.userName, api);
              console.log('✅ Events refreshed from API');

              // After API refresh, ensure our appointment is still in the store
              // (in case API doesn't have it yet due to blockchain delay)
              const refreshedEvents =
                useEventsStore.getState().userEvents || [];
              const hasAppointment = refreshedEvents.some(
                (e: any) => (e.uid || e.appointment_uid) === appointmentUID,
              );

              if (!hasAppointment) {
                console.log(
                  '📅 Appointment not in refreshed events, re-adding to store...',
                );
                const finalEvents = [...refreshedEvents, normalizedAppointment];
                setUserEvents(finalEvents);
                console.log(
                  '📅 Re-added appointment. Final count:',
                  finalEvents.length,
                );
              }
            } catch (refreshError) {
              console.error('⚠️ Error refreshing events:', refreshError);
              // Don't fail - appointment is already in store manually
            }
          } catch (refreshError) {
            console.error('⚠️ Error refreshing events:', refreshError);
          }

          await new Promise(resolve => setTimeout(resolve, 1000));
          navigation.goBack();
        } else {
          showErrorToast(
            'Error',
            result?.message || 'Appointment creation failed.',
          );
        }
      }
    } catch (err: any) {
      console.error('Error saving appointment:', err);
      showErrorToast(
        'Error',
        err.response?.data?.message ||
          err.message ||
          'Failed to save appointment.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCollaborateSubmit = async () => {
    let txHash = null;
    let apiResponse = null;

    try {
      setIsLoading(true);

      if (!activeAccount || !token) {
        showErrorToast('Error', 'Authentication data not found');
        setIsLoading(false);
        return;
      }

      const collaborate_users = {
        appointment_schedule_id: appointmentId,
        user_id: activeAccount?.userName,
        appointment_available_time: JSON.stringify(
          convertToUTC(
            {
              repeat_week: scheduleRepeatWeek,
              manual_schedule: manualScheduleDay,
              availability_schedule_day: availabilityScheduleDay,
            },
            appointmentDetails.appointment_timezone,
          ),
        ),
        appointment_time_zone: appointmentDetails.appointment_timezone,
        appointment_booking_settings: JSON.stringify({
          custom_time_slot: customTimeSlotValue,
          availability_type: appointmentDetails.availability_type,
          slotColor: appointmentDetails.slotColor,
          locationType: locationType,
        }),
      };

      // 1. 🎯 CRITICAL: EXECUTE BLOCKCHAIN SEQUENTIALLY
      console.log('Calling blockchain storeCollaborateUsers...');
      txHash = await blockchainService.storeCollaborateUsers(
        collaborate_users,
        activeAccount,
        token,
      );

      if (!txHash) {
        showErrorToast(
          'Blockchain Error',
          'Failed to confirm blockchain update.',
        );
        setIsLoading(false);
        return; // Stop if blockchain fails
      }
      console.log('Blockchain collaborate users successful:', txHash);

      // 2. 🎯 CRITICAL: EXECUTE API SEQUENTIALLY (ONLY AFTER BLOCKCHAIN SUCCESS)
      console.log('Calling API storeCollaborateUsers...');
      // Match web endpoint: POST /storeCollaborateUserData with payload {collaborate_users: {...}}
      const apiPayload = {
        collaborate_users: collaborate_users,
      };
      apiResponse = await api('POST', '/storeCollaborateUserData', apiPayload);
      console.log('API response data:', apiResponse.data);

      // Check for successful response - handle various response formats
      const isSuccess =
        apiResponse?.data?.status === true ||
        apiResponse?.data?.success === true ||
        apiResponse?.status === 200 ||
        (apiResponse?.data &&
          !apiResponse?.data?.error &&
          !apiResponse?.data?.message?.toLowerCase().includes('error'));

      if (isSuccess) {
        success(
          'Success',
          apiResponse.data.message ||
            'Collaboration settings saved successfully',
        );
        navigation.goBack();
      } else {
        const errorMessage = txHash
          ? `Server sync failed after blockchain success. Response: ${JSON.stringify(
              apiResponse?.data,
            )}`
          : 'Collaboration settings save failed (Blockchain or API).';
        showErrorToast('Error', errorMessage);
      }
    } catch (err: any) {
      console.error('Error saving collaboration settings:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url,
      });

      // Handle API errors - check if it's a network/API error vs blockchain success
      let errorMessage = '';

      if (txHash) {
        // Blockchain succeeded but API failed
        if (err.response?.status === 404) {
          errorMessage =
            'Server endpoint not found. Please check the API endpoint configuration.';
        } else if (err.response?.status >= 500) {
          errorMessage = 'Server error occurred. Please try again later.';
        } else if (err.response?.data?.message) {
          errorMessage = `Server sync failed: ${err.response.data.message}`;
        } else {
          errorMessage = `Server sync failed after blockchain success. Status: ${
            err.response?.status || 'Unknown'
          }`;
        }
      } else {
        // Both blockchain and API failed
        errorMessage =
          err.response?.data?.message ||
          err.message ||
          'Failed to save collaboration settings. Please check your network connection.';
      }

      showErrorToast('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {showEventTypeDropdown && (
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setShowEventTypeDropdown(false)}
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <FeatherIcon name="x" size={24} color={colors.blackText} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>
              {formMode === 'edit' || formMode === 'collaborate_user'
                ? 'Edit '
                : 'Create '}
            </Text>
            <Text style={styles.eventTypeText}>Appointment</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title Input - Match Event Screen */}
        {!collaborateUser && (
          <View style={styles.fieldContainer}>
            <Text style={styles.labelText}>Add title</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Write here"
              placeholderTextColor="#A4A7AE"
              value={appointmentDetails.title}
              onFocus={() => {}}
              onBlur={() => {}}
              onChangeText={text =>
                setAppointmentDetails(prev => ({ ...prev, title: text }))
              }
              editable={true}
            />
          </View>
        )}

        {/* Description Field - Match Event Screen */}
        {!collaborateUser && (
          <View style={styles.fieldContainer}>
            <Text style={styles.labelText}>Description</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Enter here.."
              value={appointmentDetails.description}
              onChangeText={text =>
                setAppointmentDetails(prev => ({ ...prev, description: text }))
              }
              onFocus={() => {}}
              onBlur={() => {}}
              multiline
              placeholderTextColor="#A4A7AE"
              editable={true}
            />
          </View>
        )}

        {/* Appointment Duration - Show selected value in field */}
        {!collaborateUser && (
          <View style={styles.fieldContainer}>
            <Text style={styles.labelText}>Appointment duration</Text>
            <TouchableOpacity
              style={styles.selectorItem}
              onPress={() => setShowDurationModal(true)}
              activeOpacity={0.7}
            >
              <FeatherIcon
                name="clock"
                size={18}
                color="#A4A7AE"
                style={{ marginRight: scaleWidth(8) }}
              />
              <View style={styles.selectorTextContainer}>
                <Text style={[styles.selectorText, styles.selectorTextFilled]}>
                  {getDurationText()}
                </Text>
              </View>
              <FeatherIcon
                name="chevron-down"
                size={20}
                color="#A4A7AE"
                style={{ marginLeft: scaleWidth(8) }}
              />
            </TouchableOpacity>
            <Modal
              visible={showDurationModal}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowDurationModal(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowDurationModal(false)}
              >
                <View style={styles.modalContent}>
                  {['30', '45', '60', '90', '120'].map((dur, idx, arr) => (
                    <TouchableOpacity
                      key={dur}
                      style={[
                        styles.modalOptionCustom,
                        idx === 0 && {
                          borderTopLeftRadius: 10,
                          borderTopRightRadius: 10,
                        },
                        idx === arr.length - 1 && {
                          borderBottomLeftRadius: 10,
                          borderBottomRightRadius: 10,
                        },
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setAppointmentDetails(prev => ({
                          ...prev,
                          appointment_duration: parseInt(dur),
                        }));
                        setShowDurationModal(false);
                      }}
                    >
                      <Text style={styles.modalOptionText}>
                        {dur === '60'
                          ? '1 hour'
                          : dur === '90'
                          ? '1.5 hour'
                          : dur === '120'
                          ? '2 hours'
                          : `${dur} minutes`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        )}

        {/* General Availability - Show selected value in field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.labelText}>General availability</Text>
          <TouchableOpacity
            style={styles.selectorItem}
            onPress={() => setShowAvailabilityModal(true)}
            activeOpacity={0.7}
          >
            <FeatherIcon
              name="calendar"
              size={18}
              color="#A4A7AE"
              style={{ marginRight: scaleWidth(8) }}
            />
            <View style={styles.selectorTextContainer}>
              <Text style={[styles.selectorText, styles.selectorTextFilled]}>
                {getAvailabilityTypeText()}
              </Text>
            </View>
            <FeatherIcon
              name="chevron-down"
              size={20}
              color="#A4A7AE"
              style={{ marginLeft: scaleWidth(8) }}
            />
          </TouchableOpacity>
        </View>
        <Modal
          visible={showAvailabilityModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAvailabilityModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowAvailabilityModal(false)}
          >
            <View style={styles.modalContent}>
              {[
                { label: 'Repeat weekly', value: 'repeat_week' },
                { label: "Doesn't repeat", value: 'not_repeat' },
                { label: 'Custom', value: 'custom' },
              ].map((opt, idx, arr) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.modalOptionCustom,
                    idx === 0 && {
                      borderTopLeftRadius: 10,
                      borderTopRightRadius: 10,
                    },
                    idx === arr.length - 1 && {
                      borderBottomLeftRadius: 10,
                      borderBottomRightRadius: 10,
                    },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    handleAvailabilityChange(opt.value);
                    setShowAvailabilityModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Repeat Week Schedule */}
        {(appointmentDetails.availability_type === 'repeat_week' ||
          appointmentDetails.availability_type === 'custom') && (
          <View style={styles.weekScheduleContainer}>
            {daysOfWeek.map(day => (
              <View key={day} style={styles.dayRow}>
                <Text style={styles.dayLabel}>{day}</Text>
                <View style={styles.timeSlotsContainer}>
                  {scheduleRepeatWeek[day]?.map((time: any, index: number) => (
                    <View key={index} style={styles.timeSlotRow}>
                      {time.noData ? (
                        <Text style={styles.unavailableText}>Unavailable</Text>
                      ) : (
                        <>
                          <TouchableOpacity
                            style={styles.timePickerButton}
                            onPress={() =>
                              openTimePicker(day, undefined, index, 'start')
                            }
                          >
                            <Text style={styles.timePickerText}>
                              {time.start} - {time.end}
                            </Text>
                          </TouchableOpacity>
                        </>
                      )}
                      <View style={styles.timeSlotActions}>
                        {!time.noData && (
                          <>
                            <TouchableOpacity
                              onPress={() =>
                                handleAvailability(day, 'remove', index)
                              }
                              style={styles.iconButton}
                            >
                              <FeatherIcon
                                name="x"
                                size={14}
                                color={colors.grey400}
                              />
                            </TouchableOpacity>
                            {index === 0 && (
                              <>
                                <TouchableOpacity
                                  onPress={() => handleAvailability(day, 'add')}
                                  style={styles.iconButton}
                                >
                                  <FeatherIcon
                                    name="plus"
                                    size={14}
                                    color={colors.grey400}
                                  />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() =>
                                    handleAvailability(day, 'copy')
                                  }
                                  style={styles.iconButton}
                                >
                                  <FeatherIcon
                                    name="copy"
                                    size={14}
                                    color={colors.grey400}
                                  />
                                </TouchableOpacity>
                              </>
                            )}
                          </>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Manual Schedule (Doesn't Repeat) */}
        {appointmentDetails.availability_type === 'not_repeat' && (
          <View style={styles.manualScheduleContainer}>
            {DateDisplayContainer(
              manualScheduleDay,
              handleManualTimeChange,
              handleManualSchedule,
            )}
            <TouchableOpacity
              style={styles.addDateButton}
              onPress={() => {
                setCalendarMode('from');
                setCurrentTimeSlot({});
                setShowCalendarModal(true);
              }}
            >
              <FeatherIcon name="plus" size={14} color={colors.primary} />
              <Text style={styles.addDateButtonText}>Add date</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Custom Recurrence Modal */}
        {appointmentDetails.availability_type === 'custom' &&
          showRecurrenceModal && (
            <Modal
              visible={showRecurrenceModal}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowRecurrenceModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.recurrenceModalContent}>
                  <Text style={styles.recurrenceModalTitle}>
                    Custom Recurrence
                  </Text>
                  <Text style={styles.recurrenceModalText}>
                    Custom recurrence settings will be implemented in a future
                    update.
                  </Text>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setShowRecurrenceModal(false)}
                  >
                    <Text style={styles.modalCloseButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}

        {/* Divider removed for cleaner look between fields */}

        {/* Time Zone */}
        <View style={styles.fieldContainer}>
          <Text style={styles.labelText}>Time Zone</Text>
          <TouchableOpacity
            style={styles.timezoneTag}
            onPress={() => setShowTimezoneModal(true)}
          >
            <Text style={styles.timezoneTagText}>
              {getSelectedTimezoneData().name}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />

        {/* Adjusted Availability */}
        {appointmentDetails.availability_type !== 'not_repeat' && (
          <>
            <View style={styles.selectorItem}>
              <FeatherIcon name="clock" size={20} color="#6C6C6C" />
              <View style={styles.selectorTextWrapper}>
                <Text style={styles.selectorText}>Adjusted availability</Text>
                <Text style={styles.selectorSubtext}>
                  Indicate times on specific dates when you're available
                </Text>
              </View>
            </View>
            <View style={styles.adjustedAvailabilityContainer}>
              {DateDisplayContainer(
                availabilityScheduleDay,
                handleAvailabilityDateTimeChange,
                handleAvailabilityDateSchedule,
              )}
              <TouchableOpacity
                style={styles.addDateButton}
                onPress={() => {
                  setCalendarMode('from');
                  setCurrentTimeSlot({});
                  setShowCalendarModal(true);
                }}
              >
                <Text style={styles.addDateButtonText}>
                  Change a date's availability
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />
          </>
        )}

        {/* Location */}
        {!collaborateUser && (
          <>
            <View style={styles.selectorItem}>
              <FeatherIcon name="map-pin" size={20} color="#6C6C6C" />
              <View style={styles.locationContainer}>
                {!locationType && (
                  <View style={styles.locationTypeButtons}>
                    <TouchableOpacity
                      style={styles.locationTypeButton}
                      onPress={() => setLocationType('inperson')}
                    >
                      <FeatherIcon
                        name="map-pin"
                        size={16}
                        color={colors.primary}
                      />
                      <Text style={styles.locationTypeButtonText}>
                        In-person
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {locationType && (
                  <View style={styles.selectedLocationContainer}>
                    <View style={styles.selectedLocationRow}>
                      {getLocationIcon(locationType)}
                      <Text style={styles.selectedLocationText}>
                        {getLocationLabel(locationType)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setLocationType(null);
                          setSelectedLocation(null);
                          setAppointmentDetails(prev => ({
                            ...prev,
                            location: '',
                          }));
                        }}
                      >
                        <FeatherIcon
                          name="x"
                          size={16}
                          color={colors.grey400}
                        />
                      </TouchableOpacity>
                    </View>

                    {locationType === 'inperson' && (
                      <TouchableOpacity
                        style={styles.locationInputContainer}
                        onPress={() => setShowLocationModal(true)}
                      >
                        <TextInput
                          style={styles.locationInput}
                          placeholder="Pick a location"
                          placeholderTextColor={colors.grey400}
                          value={appointmentDetails.location}
                          onChangeText={handleInputChange}
                          onFocus={handleLocationFocus}
                          editable={true}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {!locationType && (
                  <TextInput
                    style={styles.locationInput}
                    placeholder="Enter location"
                    placeholderTextColor={colors.grey400}
                    value={appointmentDetails.location}
                    onChangeText={text =>
                      setAppointmentDetails(prev => ({
                        ...prev,
                        location: text,
                      }))
                    }
                  />
                )}
              </View>
            </View>
            <View style={styles.divider} />
          </>
        )}

        {/* Booking Settings */}
        {!collaborateUser && (
          <>
            <View style={styles.selectorItem}>
              <FeatherIcon name="calendar" size={20} color="#6C6C6C" />
              <View style={styles.expandableSection}>
                <TouchableOpacity
                  style={styles.expandableHeader}
                  onPress={() => setBookAppointment(prev => !prev)}
                >
                  <View style={styles.selectorTextWrapper}>
                    <Text style={styles.selectorText}>
                      Booked appointment settings
                    </Text>
                    <Text style={styles.selectorSubtext}>
                      Manage the booked appointments that will appear on your
                      calendar
                    </Text>
                  </View>
                  <FeatherIcon
                    name={bookAppointment ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.grey400}
                  />
                </TouchableOpacity>

                {bookAppointment && (
                  <View style={styles.bookingSettingsContent}>
                    {/* Buffer Time */}
                    <View style={styles.settingRow}>
                      <View style={styles.settingLabelContainer}>
                        <Text style={styles.settingLabel}>Buffer Time</Text>
                        <Text style={styles.settingHint}>
                          Add time between appointment slots
                        </Text>
                      </View>
                      <View style={styles.settingControls}>
                        <Switch
                          value={appointmentDetails.is_buffer_time}
                          onValueChange={value =>
                            setAppointmentDetails(prev => ({
                              ...prev,
                              is_buffer_time: value,
                            }))
                          }
                        />
                        <TextInput
                          style={[
                            styles.numberInput,
                            !appointmentDetails.is_buffer_time &&
                              styles.disabledInput,
                          ]}
                          value={appointmentDetails.buffer_time.toString()}
                          onChangeText={text => {
                            const num = parseInt(text) || 0;
                            setAppointmentDetails(prev => ({
                              ...prev,
                              buffer_time: num,
                            }));
                          }}
                          keyboardType="numeric"
                          editable={appointmentDetails.is_buffer_time}
                        />
                        <TouchableOpacity
                          style={[
                            styles.selectButton,
                            !appointmentDetails.is_buffer_time &&
                              styles.disabledInput,
                          ]}
                          disabled={!appointmentDetails.is_buffer_time}
                          onPress={() => {
                            // Toggle between mm and hh
                            const newType =
                              appointmentDetails.buffer_time_type === 'mm'
                                ? 'hh'
                                : 'mm';
                            if (
                              newType === 'hh' &&
                              appointmentDetails.buffer_time > 12
                            ) {
                              setErrorDetails(prev => ({
                                ...prev,
                                bufferTime: true,
                              }));
                            } else {
                              setErrorDetails(prev => ({
                                ...prev,
                                bufferTime: false,
                              }));
                              setAppointmentDetails(prev => ({
                                ...prev,
                                buffer_time_type: newType,
                              }));
                            }
                          }}
                        >
                          <Text style={styles.selectButtonText}>
                            {appointmentDetails.buffer_time_type === 'mm'
                              ? 'Minutes'
                              : 'Hours'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      {errorDetails.bufferTime && (
                        <Text style={styles.errorText}>
                          Buffer time must be 12 or lower
                        </Text>
                      )}
                    </View>

                    {/* Maximum per day */}
                    <View style={styles.settingRow}>
                      <View style={styles.settingLabelContainer}>
                        <Text style={styles.settingLabel}>
                          Maximum booking per day
                        </Text>
                        <Text style={styles.settingHint}>
                          Limit the number of appointments per day
                        </Text>
                      </View>
                      <View style={styles.settingControls}>
                        <Switch
                          value={appointmentDetails.is_maximum_per_day}
                          onValueChange={value =>
                            setAppointmentDetails(prev => ({
                              ...prev,
                              is_maximum_per_day: value,
                            }))
                          }
                        />
                        <TextInput
                          style={[
                            styles.numberInput,
                            !appointmentDetails.is_maximum_per_day &&
                              styles.disabledInput,
                          ]}
                          value={appointmentDetails.maximum_per_day.toString()}
                          onChangeText={text => {
                            const num = parseInt(text) || 0;
                            setAppointmentDetails(prev => ({
                              ...prev,
                              maximum_per_day: num,
                            }));
                          }}
                          keyboardType="numeric"
                          editable={appointmentDetails.is_maximum_per_day}
                        />
                      </View>
                    </View>

                    {/* Guest Permission */}
                    <View style={styles.settingRow}>
                      <View style={styles.settingLabelContainer}>
                        <Text style={styles.settingLabel}>
                          Guest Permission
                        </Text>
                        <Text style={styles.settingHint}>
                          After booking an appointment, guests can modify the
                          calendar event to invite others
                        </Text>
                      </View>
                      <Switch
                        value={appointmentDetails.is_guest_permission}
                        onValueChange={value =>
                          setAppointmentDetails(prev => ({
                            ...prev,
                            is_guest_permission: value,
                          }))
                        }
                      />
                    </View>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.divider} />
          </>
        )}

        {/* Collaborate Users */}
        {!collaborateUser && (
          <>
            <View style={styles.selectorItem}>
              <FeatherIcon name="users" size={20} color="#6C6C6C" />
              <View style={styles.expandableSection}>
                <TouchableOpacity
                  style={styles.expandableHeader}
                  onPress={() => setIsCollaborateUser(prev => !prev)}
                >
                  <View style={styles.selectorTextWrapper}>
                    <Text style={styles.selectorText}>Collaborate Users</Text>
                    <Text style={styles.selectorSubtext}>
                      Organize and collaborative user available time on your
                      schedule.
                    </Text>
                  </View>
                  <FeatherIcon
                    name={isCollaborateUser ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.grey400}
                  />
                </TouchableOpacity>

                {isCollaborateUser && (
                  <View style={styles.collaborateContent}>
                    <Text style={styles.collaborateLabel}>Add users</Text>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search users"
                      placeholderTextColor={colors.grey400}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />

                    {filteredContacts.length > 0 && searchQuery && (
                      <View style={styles.contactsDropdown}>
                        <FlatList
                          data={filteredContacts}
                          keyExtractor={item => item}
                          renderItem={({ item }) => (
                            <TouchableOpacity
                              style={styles.contactItem}
                              onPress={() => handleGuestUser('add', item)}
                            >
                              <Text style={styles.contactItemText}>{item}</Text>
                            </TouchableOpacity>
                          )}
                        />
                      </View>
                    )}

                    {availableGuest.length > 0 && (
                      <View style={styles.guestList}>
                        <Text style={styles.guestListLabel}>
                          Collaborate users
                        </Text>
                        {availableGuest.map(guest => (
                          <View key={guest} style={styles.guestItem}>
                            <Text style={styles.guestItemText}>{guest}</Text>
                            <TouchableOpacity
                              onPress={() => handleGuestUser('remove', guest)}
                              style={styles.removeGuestButton}
                            >
                              <FeatherIcon
                                name="x"
                                size={14}
                                color={colors.error}
                              />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
            <View style={styles.divider} />
          </>
        )}

        {/* Booking Form */}
        {!collaborateUser && (
          <>
            <View style={styles.selectorItem}>
              <FeatherIcon name="file-text" size={20} color="#6C6C6C" />

              <View style={styles.expandableSection}>
                <TouchableOpacity
                  style={styles.expandableHeader}
                  onPress={() => setIsBookingForm(prev => !prev)}
                >
                  <View style={styles.selectorTextWrapper}>
                    <Text style={styles.selectorText}>Booking Form</Text>
                    <Text style={styles.selectorSubtext}>
                      Customise the form that people use to book an appointment
                    </Text>
                  </View>
                  <FeatherIcon
                    name={isBookingForm ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.grey400}
                  />
                </TouchableOpacity>

                {isBookingForm && (
                  <View style={styles.bookingFormContent}>
                    <View style={styles.bookingFormFields}>
                      {bookingForm.map((formField, index) => (
                        <View key={index} style={styles.bookingFormField}>
                          <Text style={styles.bookingFormFieldText}>
                            {formField.fieldName}{' '}
                            {formField.isRequired ? '*' : ''}
                          </Text>
                          {formField.manualField && (
                            <View style={styles.bookingFormFieldActions}>
                              <TouchableOpacity
                                onPress={() => {
                                  setEditFormData(formField);
                                  setBookingFormFieldName(formField.fieldName);
                                  setBookingFormFieldRequired(
                                    formField.isRequired,
                                  );
                                  setBookingFormFieldPopup(true);
                                }}
                              >
                                <FeatherIcon
                                  name="edit"
                                  size={14}
                                  color={colors.grey400}
                                />
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() =>
                                  handleRemoveBookingFormField(index)
                                }
                              >
                                <FeatherIcon
                                  name="x"
                                  size={14}
                                  color={colors.grey400}
                                />
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                    <Text style={styles.requiredHint}>*Required</Text>
                    <TouchableOpacity
                      style={styles.addFieldButton}
                      onPress={() => {
                        setEditFormData(null);
                        setBookingFormFieldName('');
                        setBookingFormFieldRequired(false);
                        setBookingFormFieldPopup(true);
                      }}
                    >
                      <Text style={styles.addFieldButtonText}>Add a field</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.divider} />
          </>
        )}

        {/* Save Button */}
        <View style={styles.bottomActionBar}>
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={collaborateUser ? handleCollaborateSubmit : handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Timezone Modal */}
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

            {/* Search Input */}
            <View style={styles.currentTimezoneContainer}>
              <TextInput
                style={styles.currentTimezoneInput}
                value={timezoneSearchQuery}
                onChangeText={setTimezoneSearchQuery}
                placeholder="Search time zone"
                placeholderTextColor={colors.grey400}
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
                    appointmentDetails.appointment_timezone === item.id &&
                      styles.timezoneItemSelected,
                  ]}
                  onPress={() => handleTimezoneSelect(item.id)}
                >
                  <Text
                    style={[
                      styles.timezoneItemText,
                      appointmentDetails.appointment_timezone === item.id &&
                        styles.timezoneItemTextSelected,
                    ]}
                  >
                    ({item.offset}) {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />

            {/* Use Current Timezone Button */}
            <TouchableOpacity
              style={styles.useCurrentTimezoneButton}
              onPress={() =>
                handleTimezoneSelect(
                  Intl.DateTimeFormat().resolvedOptions().timeZone,
                )
              }
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

      {/* Location Suggestions Modal */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLocationModal(false)}
        presentationStyle="overFullScreen"
      >
        <View style={styles.locationModalOverlay}>
          <View style={styles.locationInputContainer}>
            <View style={styles.locationInputRow}>
              <FeatherIcon name="map-pin" size={20} color="#6C6C6C" />
              <TextInput
                style={styles.locationModalInput}
                placeholder="Add location"
                placeholderTextColor={colors.grey400}
                value={appointmentDetails.location}
                onChangeText={text => {
                  setAppointmentDetails(prev => ({ ...prev, location: text }));
                  if (debouncedFetch.current) {
                    debouncedFetch.current(text);
                  } else {
                    fetchSuggestions(text);
                  }
                }}
                autoCorrect={false}
                autoCapitalize="none"
                autoFocus={true}
              />
              <TouchableOpacity
                onPress={() => setShowLocationModal(false)}
                style={styles.locationCloseButton}
              >
                <FeatherIcon name="x" size={20} color={colors.blackText} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.locationSuggestionsContainer}>
            {isLoadingLocations ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Searching locations...</Text>
              </View>
            ) : (
              <FlatList
                data={suggestions}
                keyExtractor={(item, index) => `${item.value}-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.locationItem}
                    onPress={() => handleSuggestionSelect(item)}
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
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Booking Form Field Popup Modal */}
      <Modal
        visible={bookingFormFieldPopup}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setBookingFormFieldPopup(false);
          setBookingFormFieldName('');
          setBookingFormFieldRequired(false);
          setEditFormData(null);
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setBookingFormFieldPopup(false);
            setBookingFormFieldName('');
            setBookingFormFieldRequired(false);
            setEditFormData(null);
          }}
        >
          <View style={styles.bookingFormModalContent}>
            <View style={styles.bookingFormModalHeader}>
              <Text style={styles.bookingFormModalTitle}>
                {editFormData ? 'Edit Field' : 'Add Field'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setBookingFormFieldPopup(false);
                  setBookingFormFieldName('');
                  setBookingFormFieldRequired(false);
                  setEditFormData(null);
                }}
              >
                <FeatherIcon name="x" size={20} color={colors.blackText} />
              </TouchableOpacity>
            </View>
            <View style={styles.bookingFormModalBody}>
              <Text style={styles.bookingFormModalLabel}>Field Name</Text>
              <TextInput
                style={styles.bookingFormModalInput}
                placeholder="Enter field name"
                placeholderTextColor={colors.grey400}
                value={bookingFormFieldName}
                onChangeText={setBookingFormFieldName}
                autoFocus={true}
              />
              <View style={styles.bookingFormModalSwitchRow}>
                <Text style={styles.bookingFormModalLabel}>Required</Text>
                <Switch
                  value={bookingFormFieldRequired}
                  onValueChange={setBookingFormFieldRequired}
                />
              </View>
              <TouchableOpacity
                style={styles.bookingFormModalSaveButton}
                onPress={handleAddBookingFormField}
              >
                <Text style={styles.bookingFormModalSaveText}>
                  {editFormData ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Calendar Modal */}
      <CalendarWithTime
        isVisible={showCalendarModal}
        onClose={() => {
          setShowCalendarModal(false);
          setCurrentTimeSlot(null);
        }}
        onDateTimeSelect={handleDateTimeSelect}
        mode={calendarMode}
        selectedDate={selectedDate || undefined}
        selectedTime={selectedTime}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGrayBg || '#F5F5F5',
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
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    color: '#252B37',
    fontWeight: '700',
    fontFamily: Fonts.latoBold,
  },
  eventTypeText: {
    fontSize: 16,
    color: colors.blackText,
    fontWeight: '700',
    fontFamily: Fonts.latoBold,
    marginRight: scaleWidth(8),
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  inputSection: {
    marginBottom: spacing.lg,
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
  inputUnderline: {
    height: 1,
    backgroundColor: colors.grey20,
  },
  fieldContainer: {
    marginBottom: spacing.lg,
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
  descriptionContainer: {
    backgroundColor: '#F6F7F9',
    borderRadius: 10,
    padding: 16,
    marginBottom: spacing.lg,
  },
  descriptionInput: {
    backgroundColor: colors.white,
    borderRadius: 8,
    textAlignVertical: 'top',
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
  selectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleHeight(12),
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#DCE0E5',
    borderRadius: 8,
    backgroundColor: colors.white,
    minHeight: scaleHeight(44),
    paddingHorizontal: spacing.sm,
  },
  selectorTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: spacing.sm,
  },
  selectorTextWrapper: {
    flex: 1,
  },
  selectorText: {
    fontSize: 14,
    fontFamily: Fonts.latoRegular,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: 0,
    color: '#A4A7AE',
    flex: 1,
    marginLeft: spacing.sm,
  },
  selectorTextFilled: {
    color: '#252B37',
  },
  selectorSubtext: {
    fontSize: fontSize.textSize14,
    color: colors.grey400,
    marginTop: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.grey20,
    marginVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  weekScheduleContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4, // reduce gap between day rows
    paddingVertical: 2, // reduce vertical padding
  },
  dayLabel: {
    width: scaleWidth(48),
    fontSize: 13,
    fontWeight: '500',
    color: '#252B37',
    marginTop: scaleHeight(8),
    fontFamily: Fonts.latoMedium,
  },
  timeSlotsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#DCE0E5',
    borderRadius: 8,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    minHeight: scaleHeight(36),
    paddingHorizontal: spacing.sm,
    paddingVertical: scaleHeight(4),
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginRight: 0,
  },
  timePickerText: {
    fontSize: 13,
    color: '#252B37',
    fontFamily: Fonts.latoRegular,
    marginRight: scaleWidth(2),
  },
  timeSeparator: {
    fontSize: 13,
    color: '#A4A7AE',
    marginHorizontal: scaleWidth(4),
  },
  timeSlotActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  iconButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  unavailableText: {
    fontSize: fontSize.textSize12,
    color: colors.error,
    fontWeight: '500',
  },
  manualScheduleContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  dateDisplayContainer: {
    marginTop: spacing.md,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  datePickerContainer: {
    width: scaleWidth(95),
    paddingVertical: spacing.xs,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 8, // keep reduced padding
    marginHorizontal: 24, // keep reduced horizontal margin
    marginTop: 40, // further reduce top margin for general availability modal
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalOption: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrayishBlue,
  },
  modalOptionCustom: {
    paddingVertical: 4, // further reduce vertical padding for general availability
    paddingHorizontal: 8, // keep reduced horizontal padding
    backgroundColor: colors.white,
  },
  modalOptionText: {
    fontSize: fontSize.textSize14,
    color: colors.textSecondary,
    fontFamily: Fonts.latoRegular,
    textAlign: 'left',
  },
  locationTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  locationTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGrayishBlue,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  locationTypeButtonText: {
    fontSize: fontSize.textSize12,
    color: colors.textSecondary,
  },
  selectedLocationContainer: {
    marginTop: spacing.sm,
  },
  selectedLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGrayishBlue,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  selectedLocationText: {
    flex: 1,
    fontSize: fontSize.textSize14,
    fontWeight: '500',
    color: colors.blackText,
    marginLeft: spacing.sm,
  },
  locationInputContainer: {
    position: 'relative',
  },
  locationInput: {
    borderWidth: 1,
    borderColor: colors.lightGrayishBlue,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: fontSize.textSize12,
    color: colors.textSecondary,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: scaleHeight(40),
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGrayishBlue,
    borderRadius: borderRadius.sm,
    maxHeight: scaleHeight(200),
    zIndex: 1000,
    elevation: 5,
  },
  suggestionItem: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrayishBlue,
  },
  suggestionText: {
    fontSize: fontSize.textSize12,
    color: colors.textSecondary,
  },
  integrationWarningContainer: {
    marginTop: spacing.sm,
  },
  warningBox: {
    backgroundColor: '#ffe2d9',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  warningText: {
    fontSize: fontSize.textSize12,
    color: colors.error,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGrayishBlue,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  connectButtonText: {
    fontSize: fontSize.textSize12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  integrationNote: {
    fontSize: fontSize.textSize12,
    color: colors.grey400,
    marginTop: spacing.sm,
  },
  expandableSection: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  expandableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookingSettingsContent: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  settingRow: {
    marginBottom: spacing.md,
  },
  settingLabelContainer: {
    marginBottom: spacing.sm,
  },
  settingLabel: {
    fontSize: fontSize.textSize12,
    fontWeight: '500',
    color: colors.blackText,
    marginBottom: spacing.xs,
  },
  settingHint: {
    fontSize: fontSize.textSize10,
    color: colors.grey400,
  },
  settingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: colors.lightGrayishBlue,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: fontSize.textSize12,
    color: colors.textSecondary,
    width: scaleWidth(60),
  },
  disabledInput: {
    backgroundColor: colors.grey20,
    opacity: 0.6,
  },
  selectButton: {
    borderWidth: 1,
    borderColor: colors.lightGrayishBlue,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  selectButtonText: {
    fontSize: fontSize.textSize12,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: fontSize.textSize12,
    color: colors.error,
    marginTop: spacing.xs,
  },
  collaborateContent: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  collaborateLabel: {
    fontSize: fontSize.textSize14,
    fontWeight: '500',
    color: colors.blackText,
    marginBottom: spacing.xs,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.lightGrayishBlue,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: fontSize.textSize12,
    color: colors.textSecondary,
  },
  contactsDropdown: {
    borderWidth: 1,
    borderColor: colors.lightGrayishBlue,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.white,
    maxHeight: scaleHeight(200),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactItem: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrayishBlue,
  },
  contactItemText: {
    fontSize: fontSize.textSize14,
    color: colors.textSecondary,
  },
  guestList: {
    marginTop: spacing.md,
  },
  guestListLabel: {
    fontSize: fontSize.textSize14,
    fontWeight: '500',
    color: colors.blackText,
    marginBottom: spacing.sm,
  },
  guestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrayishBlue,
  },
  guestItemText: {
    fontSize: fontSize.textSize14,
    color: colors.textSecondary,
  },
  removeGuestButton: {
    padding: spacing.xs,
  },
  bookingFormContent: {
    marginTop: spacing.md,
  },
  bookingFormFields: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  bookingFormField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.textSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  bookingFormFieldText: {
    fontSize: fontSize.textSize12,
    color: colors.textSecondary,
  },
  bookingFormFieldActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  requiredHint: {
    fontSize: fontSize.textSize10,
    color: colors.grey400,
    marginBottom: spacing.sm,
  },
  addFieldButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.textSecondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  addFieldButtonText: {
    fontSize: fontSize.textSize12,
    color: colors.primary,
  },
  bottomActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  saveButtonText: {
    fontSize: fontSize.textSize16,
    color: colors.white,
    fontWeight: '600',
    fontFamily: Fonts.latoBold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: '80%',
    maxHeight: '80%',
  },
  modalOption: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrayishBlue,
  },
  modalOptionText: {
    fontSize: fontSize.textSize14,
    color: colors.textSecondary,
    fontFamily: Fonts.latoRegular,
    textAlign: 'left',
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
    width: '90%',
    maxHeight: '80%',
    padding: spacing.md,
  },
  timezoneModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  timezoneModalTitle: {
    fontSize: fontSize.textSize18,
    fontWeight: '600',
    color: colors.blackText,
  },
  timezoneModalCloseButton: {
    padding: spacing.xs,
  },
  timezoneModalCloseText: {
    fontSize: fontSize.textSize17,
    color: colors.blackText,
    fontWeight: 'bold',
  },
  currentTimezoneContainer: {
    marginBottom: spacing.md,
  },
  currentTimezoneInput: {
    borderWidth: 1,
    borderColor: colors.lightGrayishBlue,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: fontSize.textSize14,
    color: colors.textSecondary,
  },
  timezoneList: {
    maxHeight: scaleHeight(300),
  },
  timezoneItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrayishBlue,
  },
  timezoneItemText: {
    fontSize: fontSize.textSize14,
    color: colors.textSecondary,
  },
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
  timezoneItemTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  recurrenceModalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '90%',
  },
  recurrenceModalTitle: {
    fontSize: fontSize.textSize18,
    fontWeight: '600',
    color: colors.blackText,
    marginBottom: spacing.md,
  },
  recurrenceModalText: {
    fontSize: fontSize.textSize14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  modalCloseButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-end',
  },
  modalCloseButtonText: {
    fontSize: fontSize.textSize14,
    color: colors.white,
    fontWeight: '600',
  },
  locationModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingTop: scaleHeight(60),
  },
  locationInputContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrayishBlue,
  },
  locationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  locationModalInput: {
    flex: 1,
    fontSize: fontSize.textSize16,
    color: colors.textPrimary,
    paddingVertical: spacing.xs,
  },
  locationCloseButton: {
    padding: spacing.xs,
  },
  locationSuggestionsContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  locationList: {
    flex: 1,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrayishBlue,
    gap: spacing.sm,
  },
  locationItemText: {
    flex: 1,
    fontSize: fontSize.textSize14,
    color: colors.textSecondary,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fontSize.textSize14,
    color: colors.grey400,
  },
  bookingFormModalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    width: '90%',
    maxWidth: scaleWidth(400),
    padding: spacing.lg,
  },
  bookingFormModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  bookingFormModalTitle: {
    fontSize: fontSize.textSize18,
    fontWeight: '600',
    color: colors.blackText,
  },
  bookingFormModalBody: {
    gap: spacing.md,
  },
  bookingFormModalLabel: {
    fontSize: fontSize.textSize14,
    fontWeight: '500',
    color: colors.blackText,
    marginBottom: spacing.xs,
  },
  bookingFormModalInput: {
    borderWidth: 1,
    borderColor: colors.lightGrayishBlue,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: fontSize.textSize14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  bookingFormModalSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  bookingFormModalSaveButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  bookingFormModalSaveText: {
    fontSize: fontSize.textSize14,
    color: colors.white,
    fontWeight: '600',
  },
});

export default AppointmentScheduleScreen;
