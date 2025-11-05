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
import Header from '../components/Header';
import DaySection from '../components/DaySection';
import FloatingActionButton from '../components/FloatingActionButton';
import CustomDrawer from '../components/CustomDrawer';
import { useToken } from '../stores/useTokenStore';
import { BlockchainService } from '../services/BlockChainService';
import { useActiveAccount } from '../stores/useActiveAccount';
import CustomLoader from '../global/CustomLoader';
import CustomeHeader from '../global/CustomeHeader';
import { useEventsStore } from '../stores/useEventsStore';
import { useApiClient } from '../hooks/useApi';
import { parseTimeToPST } from '../utils';
import { useSettingsStore } from '../stores/useSetting';
import { convertToSelectedTimezone } from '../utils/timezone';
import { s } from 'react-native-size-matters';
import { Colors } from '../constants/Colors';


const HomeScreen = () => {
    const navigation = useNavigation<AppNavigationProp>();
    const { setCurrentMonthByIndex } = useCalendarStore();
    const { selectedTimeZone } = useSettingsStore();
    // const [currentView, setCurrentView] = useState('Week');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const { api } = useApiClient();
    const { getUserEvents, events: allEvents, userEvents } = useEventsStore();
    const account = useActiveAccount(state => state.account);
    const userName = account?.username || '';
    
    const handleEditEvent = (event: any) => {
        console.log('Edit event Uid in home:', event);

        // 1. Extract the raw data. This contains the original fromTime and toTime strings.
        const eventToPass = event.originalRawEventData || event;

        // Use the raw data for checking if it's a task (as tags/list are present here)
        const isTask = (eventToPass.list || eventToPass.tags || []).some(
            (item: any) => item.key === 'task'
        );

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

    useEffect(() => {
        // Set the initial current month dynamically based on today's date
        const today = new Date();
        setCurrentMonth(today.toLocaleString('en-US', { month: 'long' }));
    }, []);

    const transformEventsToCalendar = (allEvents: any[], selectedTimeZone: string) => {
        const groupedEvents: Record<string, any[]> = {};
        
        console.log('🔄 [HomeScreen] transformEventsToCalendar - Processing events:', allEvents?.length || 0);
        console.log('🔄 [HomeScreen] All events sample:', allEvents?.slice(0, 3));

        if (!allEvents || allEvents.length === 0) {
            console.log('🔄 [HomeScreen] No events to process');
            return [];
        }

        allEvents.forEach((event, index) => {
            if (!event) {
                console.warn('🔄 [HomeScreen] Skipping null/undefined event at index:', index);
                return;
            }

            // Enhanced appointment detection - check multiple indicators
            const isAppointment = 
                event.uid?.startsWith('appt_') || 
                event.appointment_uid?.startsWith('appt_') ||
                event.title?.toLowerCase().includes('appointment') ||
                event.appointment_title?.toLowerCase().includes('appointment') ||
                event.list?.some((item: any) => 
                    item?.key === 'appointment' || 
                    item?.value?.includes('appointment')
                ) ||
                event.tags?.some((item: any) => 
                    item?.key === 'appointment' || 
                    item?.value?.includes('appointment')
                );

            console.log(`🔄 [HomeScreen] Event ${index}:`, {
                uid: event.uid,
                title: event.title,
                isAppointment: isAppointment,
                hasFromTime: !!event.fromTime,
                list: event.list
            });

            if (isAppointment) {
                console.log(`📅 [HomeScreen] Processing APPOINTMENT at index ${index}:`, {
                    uid: event.uid,
                    title: event.title || event.appointment_title,
                    hasFromTime: !!event.fromTime,
                    fromTime: event.fromTime,
                    list: event.list
                });

                // Handle appointment time display
                let startTimeDate: Date | null = null;
                let endTimeDate: Date | null = null;
                let eventDateKey: string;
                let eventTime: string;
                
                // For appointments, if no specific time is set, use today's date with "Available Schedule"
                if (event.fromTime && event.fromTime.trim() !== '' && event.fromTime !== 'null') {
                    try {
                        const fromTimeOnly = event.fromTime.split('T')[1];
                        const toTimeOnly = event.toTime?.split('T')[1];
                        
                        const isAllDay = fromTimeOnly?.startsWith('000000') && toTimeOnly?.startsWith('000000');
                        
                        const parseAllDayDate = (dateStr: string) => {
                            const year = parseInt(dateStr.substring(0, 4), 10);
                            const month = parseInt(dateStr.substring(4, 6), 10) - 1;
                            const day = parseInt(dateStr.substring(6, 8), 10);
                            return new Date(year, month, day);
                        };
                        
                        startTimeDate = isAllDay
                            ? parseAllDayDate(event.fromTime)
                            : convertToSelectedTimezone(event.fromTime, selectedTimeZone);
                        
                        endTimeDate = isAllDay
                            ? parseAllDayDate(event.toTime)
                            : event.toTime && event.toTime !== 'null'
                                ? convertToSelectedTimezone(event.toTime, selectedTimeZone)
                                : null;
                        
                        if (startTimeDate instanceof Date && !isNaN(startTimeDate.getTime())) {
                            eventDateKey = startTimeDate.toDateString();
                            const startTime = startTimeDate.toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit', 
                                hour12: true 
                            });
                            const endTime = endTimeDate instanceof Date && !isNaN(endTimeDate.getTime())
                                ? endTimeDate.toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit', 
                                    hour12: true 
                                })
                                : '';
                            eventTime = isAllDay ? 'All Day' : endTime ? `${startTime} - ${endTime}` : startTime;
                        } else {
                            throw new Error('Invalid start time date');
                        }
                    } catch (error) {
                        console.warn('⚠️ Error processing appointment time, using default:', error);
                        // Fallback: use today's date
                        const today = new Date();
                        eventDateKey = today.toDateString();
                        eventTime = 'Available Schedule';
                    }
                } else {
                    // No specific time - use today's date with "Available Schedule"
                    const today = new Date();
                    eventDateKey = today.toDateString();
                    eventTime = 'Available Schedule';
                }
                
                if (!groupedEvents[eventDateKey]) {
                    groupedEvents[eventDateKey] = [];
                }
                
                // Decode hex-encoded title if needed
                const decodeHexTitle = (titleStr: string | null | undefined): string => {
                    if (!titleStr || typeof titleStr !== 'string') return '';
                    // Check if it looks like hex (all hex chars and not a normal string)
                    if (/^[0-9a-fA-F]+$/.test(titleStr) && titleStr.length > 10) {
                        try {
                            let hex = titleStr;
                            // Remove leading "22" if present
                            if (hex.startsWith('22') && hex.length > 2) {
                                hex = hex.substring(2);
                            }
                            // Convert hex to string
                            let result = '';
                            for (let i = 0; i < hex.length; i += 2) {
                                const hexChar = hex.substr(i, 2);
                                const charCode = parseInt(hexChar, 16);
                                if (charCode > 0 && charCode < 128) {
                                    result += String.fromCharCode(charCode);
                                }
                            }
                            const decoded = result.trim();
                            if (decoded && decoded.length > 0) {
                                return decoded;
                            }
                        } catch (e) {
                            console.warn('⚠️ Failed to decode hex title:', e);
                        }
                    }
                    return titleStr;
                };
                
                const rawTitle = event.title || event.appointment_title || '';
                const appointmentTitle = decodeHexTitle(rawTitle) || rawTitle || 'Untitled Appointment';
                
                console.log('📝 [HomeScreen] Appointment title decoding:', {
                    raw_title: rawTitle,
                    decoded_title: appointmentTitle,
                    uid: event.uid
                });
                
                const appointmentEvent = {
                    id: event.uid || event.appointment_uid || `appt_${Date.now()}`,
                    title: appointmentTitle,
                    time: eventTime,
                    description: event.description || event.appointment_description || '',
                    date: eventDateKey,
                    color: Colors.primaryGreen, // GREEN color for appointments
                    tags: event.list || [],
                    isExpandable: true,
                    hasActions: true,
                    originalRawEventData: event,
                    isAppointment: true,
                };
                
                console.log('✅ [HomeScreen] Adding APPOINTMENT to calendar:', {
                    date: eventDateKey,
                    title: appointmentTitle,
                    time: eventTime,
                    color: Colors.primaryGreen
                });
                
                groupedEvents[eventDateKey].push(appointmentEvent);
                return; // Skip regular event processing for appointments
            }
            
            // Regular event processing (only if it has fromTime)
            if (!event.fromTime || event.fromTime.trim() === '' || event.fromTime === 'null') {
                console.warn('🔄 [HomeScreen] Skipping event without fromTime:', event);
                return;
            }

            try {
                const fromTimeOnly = event.fromTime.split('T')[1];
                const toTimeOnly = event.toTime?.split('T')[1];

                const isAllDay =
                    fromTimeOnly?.startsWith('000000') &&
                    toTimeOnly?.startsWith('000000');

                const parseAllDayDate = (dateStr: string) => {
                    const year = parseInt(dateStr.substring(0, 4), 10);
                    const month = parseInt(dateStr.substring(4, 6), 10) - 1;
                    const day = parseInt(dateStr.substring(6, 8), 10);
                    return new Date(year, month, day);
                };

                const startTimeDate = isAllDay
                    ? parseAllDayDate(event.fromTime)
                    : convertToSelectedTimezone(event.fromTime, selectedTimeZone);

                const endTimeDate = isAllDay
                    ? parseAllDayDate(event.toTime)
                    : event.toTime && event.toTime !== 'null'
                        ? convertToSelectedTimezone(event.toTime, selectedTimeZone)
                        : null;

                if (!(startTimeDate instanceof Date) || isNaN(startTimeDate.getTime())) {
                    console.warn('🔄 [HomeScreen] Invalid fromTime after conversion:', event);
                    return;
                }

                const eventDateKey = startTimeDate.toDateString();
                const isTask = (event.list || []).some((item: any) => item.key === 'task');
                const eventColor = isTask ? colors.figmaPurple : colors.figmaOrange;

                const startTime = startTimeDate.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    hour12: true 
                });
                const endTime = endTimeDate instanceof Date && !isNaN(endTimeDate.getTime())
                    ? endTimeDate.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        hour12: true 
                    })
                    : '';

                const eventTime = isAllDay
                    ? 'All Day'
                    : isTask
                        ? startTime
                        : endTime ? `${startTime} - ${endTime}` : startTime;

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
                    isAppointment: false,
                });

            } catch (error) {
                console.error('🔄 [HomeScreen] Error processing regular event:', error, event);
            }
        });

        const result = Object.keys(groupedEvents).map(dateKey => {
            const dateObj = new Date(dateKey);

            return {
                day: dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
                date: dateObj.getDate().toString().padStart(2, '0'),
                month: dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
                events: groupedEvents[dateKey],
            };
        });

        console.log('🔄 [HomeScreen] Final transformed events:', {
            totalDays: result.length,
            totalEvents: result.reduce((acc, day) => acc + day.events.length, 0),
            appointments: result.reduce((acc, day) => acc + day.events.filter((e: any) => e.isAppointment).length, 0)
        });

        return result;
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
                        (item: any) => item.key === 'task'
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

    useFocusEffect(
        useCallback(() => {
            console.log('🔄 [HomeScreen] useFocusEffect triggered');
            
            // Transform current events
            console.log('🔄 [HomeScreen] Transforming current events:', userEvents?.length || 0);
            let transformedData = transformEventsToCalendar(userEvents || [], selectedTimeZone);
            console.log('🔄 [HomeScreen] After transformation:', transformedData?.length || 0);

            transformedData = filterEventsByTaskType(transformedData, filterType);
            const filteredData = filterEventsByView(transformedData, currentView);
            
            console.log('🔄 [HomeScreen] Final events to display:', filteredData?.length || 0);
            setEvents(filteredData);
            
        }, [userEvents, currentView, selectedTimeZone, filterType])
    );

    // Add this useEffect to debug the events flow and update display when userEvents changes
    useEffect(() => {
        console.log('🔍 [HomeScreen DEBUG] Current state:', {
            userEventsCount: userEvents?.length || 0,
            eventsCount: events?.length || 0,
            userEventsSample: userEvents?.slice(0, 3),
            filteredEventsSample: events?.slice(0, 3)
        });

        // Check for appointments in userEvents
        if (userEvents && userEvents.length > 0) {
            const appointments = userEvents.filter((event: any) => 
                event?.uid?.startsWith('appt_') || 
                event?.appointment_uid?.startsWith('appt_') ||
                event?.list?.some((item: any) => item?.key === 'appointment')
            );
            console.log('🔍 [HomeScreen DEBUG] Appointments found in userEvents:', {
                total: appointments.length,
                appointments: appointments.map((apt: any) => ({
                    uid: apt.uid,
                    appointment_uid: apt.appointment_uid,
                    title: apt.title,
                    appointment_title: apt.appointment_title,
                    hasFromTime: !!apt.fromTime,
                    hasList: !!apt.list,
                    listLength: apt.list?.length || 0
                }))
            });
        }
        
        // Transform events whenever userEvents changes (but not when events change to avoid loop)
        if (userEvents !== undefined) {
            console.log('🔄 [HomeScreen] userEvents changed, transforming events...');
            let transformedData = transformEventsToCalendar(userEvents || [], selectedTimeZone);
            transformedData = filterEventsByTaskType(transformedData, filterType);
            const filteredData = filterEventsByView(transformedData, currentView);
            setEvents(filteredData);
            console.log('🔄 [HomeScreen] Events updated from userEvents change');
        }
    }, [userEvents, selectedTimeZone, filterType, currentView]);

    // console.log('All Events',allEvents);
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                const username = account?.userName || account?.username || account?.[3] || userName;
                console.log('Fetching events for user:', username);
                
                if (!username) {
                    console.warn('No username available to fetch events');
                    setLoading(false);
                    return;
                }

                const events = await getUserEvents(username, api);
                console.log("events fetched in 179", events);
            } catch (error) {
                console.error('Error fetching events:', error);
            } finally {
                setLoading(false);
            }
        };
        if (account && userName) {
            fetchEvents();
        }
    }, [userName, account]);

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
    const handleAction1Press = () => {
        // If we are already filtering to 'EventsOnly', pressing the button again resets to 'All'
        if (filterType === 'EventsOnly') {
            console.log('Action 1 pressed: Resetting to All Events/Tasks');
            setFilterType('All');
        } else {
            console.log('Action 1 pressed: Showing only Events (non-tasks)');
            setFilterType('EventsOnly');
        }
    };

    const handleAction2Press = () => {
        // If we are already filtering to 'TasksOnly', pressing the button again resets to 'All'
        if (filterType === 'TasksOnly') {
            console.log('Action 2 pressed: Resetting to All Events/Tasks');
            setFilterType('All');
        } else {
            console.log('Action 2 pressed: Showing only Tasks');
            setFilterType('TasksOnly');
        }
    };

    const handleFABPress = () => { };


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
        console.log('🔍 [FILTER] Filtering events by view:', view);
        
        // For appointments: ALWAYS show them regardless of date
        // For regular events: apply date filtering
        const filtered = allEvents.filter(dayGroup => {
          const hasAppointments = dayGroup.events.some((event: any) => event.isAppointment);
          
          if (hasAppointments) {
            console.log('✅ [FILTER] Keeping day with appointments:', dayGroup.date);
            return true; // Always keep days with appointments
          }
          
          // For days without appointments, apply normal date filtering
          const dayDate = new Date(dayGroup.events[0]?.date);
          const today = new Date();
          
          if (view === 'Day') {
            const isToday = dayDate.toDateString() === today.toDateString();
            console.log('🔍 [FILTER DAY] Regular event:', dayDate.toDateString(), 'isToday:', isToday);
            return isToday;
          }
      
          if (view === 'Week') {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            const endOfWeek = new Date(today);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            const isInWeek = dayDate >= startOfWeek && dayDate <= endOfWeek;
            console.log('🔍 [FILTER WEEK] Regular event:', dayDate.toDateString(), 'inWeek:', isInWeek);
            return isInWeek;
          }
      
          if (view === 'Month') {
            const isCurrentMonth = 
              dayDate.getMonth() === today.getMonth() && 
              dayDate.getFullYear() === today.getFullYear();
            console.log('🔍 [FILTER MONTH] Regular event:', dayDate.toDateString(), 'inMonth:', isCurrentMonth);
            return isCurrentMonth;
          }
      
          return true;
        });
      
        console.log('✅ [FILTER] Final filtered days:', filtered.length);
        return filtered;
      };


    return (
        <View style={styles.container}>
            <CustomeHeader
                onMenuPress={handleMenuPress}
                title="Calendar"
                currentMonth={currentMonth}
                currentView={currentView}
                onMonthPress={handleMonthPress}
                onMonthSelect={handleMonthSelect}
                onViewSelect={handleViewSelect}
                onAction1Press={handleAction1Press}
                onAction2Press={handleAction2Press}
            />

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
                    <View
                        style={{
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 20,
                        }}
                    >
                        <Text>No events found</Text>
                    </View>
                ) : (
                    events?.map((dayData, index) => (
                        <DaySection
                            key={index}
                            day={dayData.day}
                            date={dayData.date}
                            month={dayData.month}
                            events={dayData.events}
                            onEditEvent={handleEditEvent}
                        />
                    ))
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
                        case 'appointment':
                            navigation.navigate(Screen.AppointmentScheduleScreen);
                            break;
                        default:
                            break;
                    }
                }}
            />

            {/* Custom Drawer */}
            <CustomDrawer
                isOpen={isDrawerOpen}
                onClose={handleDrawerClose}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFF",
    },
    content: {
        flex: 1,
        paddingTop: spacing.lg,

    },
    leftEdgeTouchArea: {
        position: 'absolute',
        left: 0,
        top: scaleHeight(80),
        width: scaleWidth(20),
        height: screenHeight - scaleHeight(80),
        zIndex: 1,
    },
});

export default HomeScreen;
