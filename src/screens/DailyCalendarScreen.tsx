import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import WeekView from 'react-native-week-view';
import CustomDrawer from '../components/CustomDrawer';
import EventDetailsModal from '../components/EventDetailsModal';
import FloatingActionButton from '../components/FloatingActionButton';
import WeekHeader from '../components/WeekHeader';
import { useApiClient } from '../hooks/useApi';
import { Screen } from '../navigations/appNavigation.type';
import { useActiveAccount } from '../stores/useActiveAccount';
import { useCalendarStore } from '../stores/useCalendarStore';
import { useEventsStore } from '../stores/useEventsStore';
import { useToken } from '../stores/useTokenStore';
import { parseTimeToPST } from '../utils';
import { colors } from '../utils/LightTheme';

const CustomDayHeader = ({
  date: _date,
  formattedDate,
  textStyle: _textStyle,
  isToday,
}: {
  date: any;
  formattedDate: string;
  textStyle: StyleProp<TextStyle>;
  isToday: boolean;
}) => {
  const dayName = formattedDate.split(' ')[0];
  const dayNumber = formattedDate.split(' ')[1];

  return (
    <View style={styles.dayHeaderContainer}>
      <Text style={styles.dayNameText}>{dayName}</Text>
      {isToday ? (
        <LinearGradient
          colors={['#18F06E', '#0B6DE0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.selectedDateCircle}
        >
          <Text style={styles.selectedDateText}>{dayNumber}</Text>
        </LinearGradient>
      ) : (
        <LinearGradient
          colors={['#18F06E', '#0B6DE0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.selectedDateCircle}
        >
          <Text style={styles.selectedDateText}>{dayNumber}</Text>
        </LinearGradient>
      )}

      {/* {dayName === 'Sat' && (
        <LinearGradient
          colors={['#4CAF50', '#2196F3']}
          style={styles.holidayLabel}
        >
          <Text style={styles.holidayText}>Holiday</Text>
        </LinearGradient>
      )} */}
    </View>
  );
};
// Custom EventComponent to match the design
const CustomEventComponent = ({ event }: { event: any }) => {
  return (
    <View>
      <Text style={styles.eventTitle}>{event.description}</Text>
      <Text style={styles.eventTime}>
        {event.startDate
          .toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })
          .toLowerCase()}
      </Text>
      {/* {event.location && (
          <Text style={styles.eventLocation}>{event.location}</Text>
        )} */}
    </View>
  );
};

const DailyCalendarScreen = () => {
  const navigation = useNavigation();
  const { userEvents, userEventsLoading, userEventsError } = useEventsStore();
  const { currentMonth, setCurrentMonthByIndex } = useCalendarStore();
  const { selectedDate, setSelectedDate } = useCalendarStore();
  const [isPaging, setIsPaging] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isEventModalVisible, setIsEventModalVisible] = useState(false);


  // Transform UserEvents to WeekView format
  const transformUserEventsForWeekView = (userEvents: any[]) => {

  
    return userEvents
      .map((event, index) => {
        const startDate = parseTimeToPST(event.fromTime);
        const endDate = parseTimeToPST(event.toTime);

        // const isTask = (event: any): boolean => {
        //   return event.list?.some(
        //     (item: any) => item.key === 'task' && item.value === 'true'
        //   ) || false;
        // };
        
        if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.log('Skipping invalid event:', event);
          return null;
        }

        let colour = '#337E891A'; // Default color for standard events
        if(event.list?.some((item: any) => item.key === 'task' && item.value === 'true')) {
          console.log('Event is a task:', event);
          colour = colors.figmaPurpleOpacity20; // Color for tasks
        }

        return {
          id: event.uuid || `event-${index}`,
          startDate,
          endDate,
          color: colour,
          description: event.title || 'Event',
          title: event.title || 'Event',
          location: '',
          eventKind: 'standard' as const,
          resolveOverlap: 'stack' as const,
          stackKey: event.uuid || `event-${index}`,
          originalEvent: event, // Store the original event data
        };
      })
      .filter((event): event is NonNullable<typeof event> => event !== null);
  };

  // Transform user events for WeekView display
  const myEvents = transformUserEventsForWeekView(userEvents);
  const handleMenuPress = () => {
    setIsDrawerOpen(true);
  };

  const handleMonthPress = () => {
    console.log('Month selector pressed');
  };

  // Helper function to update month display
  const updateMonthDisplay = (date: Date) => {
    setCurrentMonthByIndex(date.getMonth());
  };

  const handleDateSelect = (date: Date) => {
    console.log('Date selected:', date);
    console.log('Date day of week:', date.getDay()); // 0 = Sunday, 1 = Monday, etc.
    console.log(
      'Date formatted:',
      date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    );

    // Create a new date object to avoid any timezone issues
    const newDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      12,
      0,
      0,
      0,
    );
    console.log('New date created:', newDate);
    console.log('New date day of week:', newDate.getDay());

    setSelectedDate(newDate);
    updateMonthDisplay(newDate);
  };

  const handleSwipeNext = (date: Date) => {
    console.log('Swiped to next:', date);
    setIsPaging(true);
    setSelectedDate(date);
    updateMonthDisplay(date);
    setTimeout(() => setIsPaging(false), 200);
  };

  const handleSwipePrev = (date: Date) => {
    console.log('Swiped to previous:', date);
    setIsPaging(true);
    setSelectedDate(date);
    updateMonthDisplay(date);
    setTimeout(() => setIsPaging(false), 200);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  const handleEventPress = (event: any) => {
    console.log('Event pressed:', event);

    // Use the original event data that we stored in the processed event
    const originalEvent = event.originalEvent;
    console.log('Found original event:', originalEvent);

    if (originalEvent) {
      setSelectedEvent(originalEvent);
      setIsEventModalVisible(true);
      console.log('Modal should be visible now');
    } else {
      console.log('No original event found in event object');
    }
  };

  const handleCloseEventModal = () => {
    setIsEventModalVisible(false);
    setSelectedEvent(null);
  };

  const handleEditEvent = (event: any) => {
    handleCloseEventModal();
    
    // Extract the raw data if available
    const eventToPass = event.originalRawEventData || event;
    
    // Check if it's a task
    const list = eventToPass.list || eventToPass.tags || event.list || event.tags || [];
    const isTask = list.some((item: any) => item.key === 'task');
    
    // Determine the target screen
    const targetScreen = isTask
      ? Screen.CreateTaskScreen
      : Screen.CreateEventScreen;
    
    (navigation as any).navigate(targetScreen, {
      mode: 'edit',
      eventData: eventToPass,
    });
  };

  const handleDeleteEvent = (event: any) => {
    console.log('Delete event:', event);
    // TODO: Implement delete functionality
    handleCloseEventModal();
  };

  // Drawer-specific handlers removed; CustomDrawer navigates internally
  return (
    <View style={styles.container}>
      <WeekHeader
        onMenuPress={handleMenuPress}
        currentMonth={currentMonth}
        onMonthPress={handleMonthPress}
        onDateSelect={handleDateSelect}
        currentDate={selectedDate}
        selectedDate={selectedDate}
      />
      {/* Loading indicator */}
      {userEventsLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      )}

      {/* Error indicator */}
      {userEventsError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {userEventsError}</Text>
        </View>
      )}

      <WeekView
        key={`dailyview-${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`}
        events={myEvents}
        selectedDate={selectedDate}
        numberOfDays={1}
        pageStartAt={{ left: 0, weekday: 1 }}
        formatDateHeader="ddd D"
        showTitle={false} // Hide the default title
        headerStyle={styles.headerStyle}
        headerTextStyle={styles.headerTextStyle}
        hourTextStyle={styles.hourTextStyle}
        eventContainerStyle={styles.eventContainerStyle}
        gridRowStyle={styles.gridRowStyle}
        startHour={10}
        hoursInDisplay={12}
        timeStep={60}
        formatTimeLabel="h A"
        rightToLeft={false}
        showNowLine={true}
        timesColumnWidth={0.15}
        DayHeaderComponent={CustomDayHeader}
        EventComponent={CustomEventComponent}
        onSwipeNext={handleSwipeNext}
        onSwipePrev={handleSwipePrev}
        onDayPress={handleDateSelect}
        onEventPress={handleEventPress}
      />

      {isPaging && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      )}

      {/* Floating Action Button matching the design */}
      <FloatingActionButton
        onOptionSelect={option => {
          console.log('Selected option:', option);
          // Handle different menu options
          switch (option) {
            case 'goal':
              console.log('Create Goal');
              break;
            case 'reminder':
              navigation.navigate(Screen.RemindersScreen as never);
              break;
            case 'task':
              navigation.navigate(Screen.CreateTaskScreen as never);
              break;
            case 'event':
              navigation.navigate(Screen.CreateEventScreen as never);
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

      {/* Event Details Modal */}
      <EventDetailsModal
        visible={isEventModalVisible}
        onClose={handleCloseEventModal}
        event={selectedEvent}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />
    </View>
  );
};

export default DailyCalendarScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    // paddingTop: 60,
  },

  // WeekView Header Styles
  headerStyle: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0,
    paddingVertical: 5,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    // elevation: 3,
  },
  headerTextStyle: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Day Header Component Styles
  dayHeaderContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    justifyContent: 'center',
    position: 'absolute',
    left: 0,
  },
  dayNameText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  selectedDateCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDateText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  regularDateCircle: {
    backgroundColor: '#F9F9F9',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  dateText: {
    fontSize: 16,
    color: '#CACACA',
    fontWeight: '600',
  },
  holidayLabel: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 2,
  },
  holidayText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '500',
  },

  // Event Component Styles
  eventTitle: {
    color: '#337E89',
    fontSize: 8,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  eventTime: {
    color: '#747474',
    fontSize: 6,
    fontWeight: '400',
  },
  eventLocation: {
    color: '#747474',
    fontSize: 9,
    fontWeight: '400',
    marginTop: 2,
  },

  // WeekView Styles
  hourTextStyle: {
    color: '#6C6C6C',
    fontSize: 14,
    fontWeight: '300',
    lineHeight: 16,
  },
  eventContainerStyle: {
    borderRadius: 4,
    padding: 2,
   // backgroundColor: '#337E891A',
    borderColor: '#337E89',
    borderWidth: 1,
  },
  eventTextStyle: {
    color: '#333',
    fontSize: 12,
    fontWeight: '500',
  },
  gridRowStyle: {
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },

  // Floating Action Button Styles
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabIcon: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },

  // Loading and Error States
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 5,
  },
  errorContainer: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  errorText: {
    fontSize: 14,
    color: '#ff4444',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 5,
    textAlign: 'center',
  },
});
