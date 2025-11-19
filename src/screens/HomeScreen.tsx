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
import { s } from 'react-native-size-matters';


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

        allEvents.forEach(event => {
            if (!event.fromTime) {
                console.warn('Missing fromTime:', event);
                return;
            }

            console.log("event title in home", event.title);
            console.log("selected timezone", { selectedTimeZone })

            const fromTimeOnly = event.fromTime.split('T')[1];
            const toTimeOnly = event.toTime?.split('T')[1];

            const isAllDay =
                fromTimeOnly?.startsWith('000000') &&
                toTimeOnly?.startsWith('000000');

            console.log("Detected all-day:", isAllDay);
            // Convert times with proper parsing and timezone application
            // ✅ Skip timezone conversion if all-day
            const parseAllDayDate = (dateStr: string) => {
                const year = parseInt(dateStr.substring(0, 4), 10);
                const month = parseInt(dateStr.substring(4, 6), 10) - 1; // month index fix
                const day = parseInt(dateStr.substring(6, 8), 10);

                return new Date(year, month, day);
            };

            // Parse times directly from the string format to avoid timezone conversion issues
            const parseTimeFromString = (dateStr: string): Date | null => {
                if (!dateStr) return null;
                // Format: YYYYMMDDTHHmmss
                const match = dateStr.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?$/);
                if (!match) return null;
                
                const [, year, month, day, hour, minute, second] = match;
                return new Date(
                    Number(year),
                    Number(month) - 1, // JS months are 0-indexed
                    Number(day),
                    Number(hour),
                    Number(minute),
                    Number(second) || 0
                );
            };

            const startTimeDate = isAllDay
                ? parseAllDayDate(event.fromTime)
                : parseTimeFromString(event.fromTime);

            const endTimeDate = isAllDay
                ? parseAllDayDate(event.toTime)
                : event.toTime
                    ? parseTimeFromString(event.toTime)
                    : null;

            console.log("Parsed Start Time:", startTimeDate);
            console.log("Parsed End Time:", endTimeDate);
            if (!(startTimeDate instanceof Date) || isNaN(startTimeDate.getTime())) {
                console.warn('Invalid fromTime after parsing:', event);
                return;
            }
            if (endTimeDate !== null && (!(endTimeDate instanceof Date) || isNaN(endTimeDate.getTime()))) {
                console.warn('Invalid toTime after parsing:', event);
                // Decide whether to skip or ignore endTime here; ignoring for now
            }

            const eventDateKey = startTimeDate.toDateString();
            const isTask = (event.list || []).some((item: any) => item.key === 'task');
            const eventColor = isTask ? colors.figmaPurple : colors.figmaOrange;

            // Format times directly from the parsed date without timezone conversion
            const startTime = startTimeDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            const endTime = endTimeDate instanceof Date
                ? endTimeDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                : '';

            const eventTime = isAllDay
                ? 'All Day'
                : isTask
                    ? startTime
                    : `${startTime} - ${endTime}`;

            if (!groupedEvents[eventDateKey]) {
                groupedEvents[eventDateKey] = [];
            }

            console.log('Event time', eventTime)
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
            });
        });

        return Object.keys(groupedEvents).map(dateKey => {
            const dateObj = new Date(dateKey);

            return {
                day: dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
                date: dateObj.getDate().toString().padStart(2, '0'),
                month: dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
                events: groupedEvents[dateKey],
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
            console.log('User Events in HomeScreen:', userEvents);
            let transformedData = transformEventsToCalendar(userEvents, selectedTimeZone);

            // --- APPLY TASK/EVENT FILTER FIRST ---
            transformedData = filterEventsByTaskType(transformedData, filterType);
            // -------------------------------------

            const filteredData = filterEventsByView(transformedData, currentView);
            setEvents(filteredData);
        }, [userEvents, currentView, selectedTimeZone, filterType]) // Dependency on filterType
    );

    // console.log('All Events',allEvents);
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                console.log('Fetching events for user:', account[3]);

                const events = await getUserEvents(account[3], api);
                console.log("events fetched in 179", events);
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
        const today = new Date();

        if (view === 'Day') {
            // Show only today's events
            return allEvents.filter(dayGroup => {
                const dayDate = new Date(dayGroup.events[0]?.date);
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
                const dayDate = new Date(dayGroup.events[0]?.date);
                return dayDate >= startOfWeek && dayDate <= endOfWeek;
            });
        }

        if (view === 'Month') {
            // Show events for current month
            return allEvents.filter(dayGroup => {
                const dayDate = new Date(dayGroup.events[0]?.date);
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
