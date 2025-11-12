import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Text, Alert, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../navigations/appNavigation.type';
import FloatingActionButton from '../components/FloatingActionButton';
import WeekHeader from '../components/WeekHeader';
import CustomDrawer from '../components/CustomDrawer';
import { useActiveAccount } from '../stores/useActiveAccount';
import { useEventsStore } from '../stores/useEventsStore';
import { parseTimeToPST } from '../utils';
import { useCalendarStore } from '../stores/useCalendarStore';
import EventDetailsModal from '../components/EventDetailsModal';
import { colors, spacing } from '../utils/LightTheme';
import { BlockchainService } from '../services/BlockChainService';
import { useToken } from '../stores/useTokenStore';
import { NECJSPRIVATE_KEY } from '../constants/Config';
import { useApiClient } from '../hooks/useApi';
import ExitConfirmModal from "../components/ExitConfirmModal";
import ClockIcon from '../assets/svgs/clock.svg';
import CalendarIcon from '../assets/svgs/calendar.svg';
import EventIcon from '../assets/svgs/eventIcon.svg';
import TaskIcon from '../assets/svgs/taskIcon.svg';

interface MonthlyCalendarProps {
  onDateSelect?: (date: string) => void;
  onEventPress?: (event: any) => void;
  onFABOptionSelect?: (option: string) => void;
  onMenuPress?: () => void;
  onMonthPress?: () => void;
}

const MonthlyCalenderScreen: React.FC<MonthlyCalendarProps> = ({
  onEventPress,
  onFABOptionSelect,
  onMenuPress,
  onMonthPress,
}) => {
  const navigation = useNavigation();
  const { currentMonth, setCurrentMonthByIndex } = useCalendarStore();
  const { account } = useActiveAccount();
  const { userEvents, userEventsLoading, getUserEvents } = useEventsStore();
  const { selectedDate, setSelectedDate } = useCalendarStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isEventModalVisible, setIsEventModalVisible] = useState(false);
  const blockchainService = new BlockchainService(NECJSPRIVATE_KEY);
  const token = useToken(state => state.token);
  const { api } = useApiClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [exitModal, setExitModal] = useState(false);
  const [navigationAction, setNavigationAction] = useState(null);

  // Format date to YYYY-MM-DD for react-native-calendars
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const selectedDateString = useMemo(() => {
    const dateString = formatDate(selectedDate);
    console.log('✅ Calendar `current` date updated:', dateString);
    return dateString;
  }, [selectedDate]);

  const generateRecurringInstances = (
    event: any,
    viewStartDate: Date,
    viewEndDate: Date
  ): Array<{ date: Date; event: any }> => {
    const instances: Array<{ date: Date; event: any }> = [];

    const startDate = parseTimeToPST(event.fromTime);
    const endDate = parseTimeToPST(event.toTime);

    if (!startDate || !endDate) return instances;

    const repeatType = event.repeatEvent || event.list?.find((item: any) => item.key === 'repeatEvent')?.value;

    if (!repeatType || repeatType === 'Does not repeat') {
      return [{ date: startDate, event }];
    }

    const eventDurationMs = endDate.getTime() - startDate.getTime();

    let currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);

    const maxDate = new Date(viewEndDate);
    maxDate.setHours(23, 59, 59, 999);

    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    const limitDate = maxDate < oneYearFromNow ? maxDate : oneYearFromNow;

    while (currentDate <= limitDate) {
      if (currentDate >= viewStartDate && currentDate <= viewEndDate) {
        instances.push({
          date: new Date(currentDate),
          event: {
            ...event,
            displayDate: new Date(currentDate),
          },
        });
      }

      switch (repeatType.toLowerCase()) {
        case 'daily':
        case 'every day':
          currentDate.setDate(currentDate.getDate() + 1);
          break;

        case 'weekly':
        case 'every week':
          currentDate.setDate(currentDate.getDate() + 7);
          break;

        case 'bi-weekly':
        case 'every 2 weeks':
          currentDate.setDate(currentDate.getDate() + 14);
          break;

        case 'monthly':
        case 'every month':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;

        case 'yearly':
        case 'every year':
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;

        case 'weekdays':
        case 'every weekday':
          do {
            currentDate.setDate(currentDate.getDate() + 1);
          } while (currentDate.getDay() === 0 || currentDate.getDay() === 6);
          break;

        default:
          return instances;
      }

      if (instances.length > 366) {
        console.warn('Too many recurring instances generated, stopping at 366');
        break;
      }
    }

    return instances;
  };

  const { markedDates, eventsByDate } = useMemo(() => {
    const marked: any = {};
    const byDate: { [key: string]: any[] } = {};

    const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const lastDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

    const viewStartDate = new Date(firstDayOfMonth);
    viewStartDate.setDate(viewStartDate.getDate() - 7);

    const viewEndDate = new Date(lastDayOfMonth);
    viewEndDate.setDate(viewEndDate.getDate() + 7);

    (userEvents || []).forEach(ev => {
      const startDate = parseTimeToPST(ev.fromTime);
      const endDate = parseTimeToPST(ev.toTime);

      if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.log('Skipping invalid event:', ev);
        return;
      }

      const isTask = ev.list?.some((item: any) => item.key === 'task' && item.value === 'true');
      const repeatType = ev.repeatEvent || ev.list?.find((item: any) => item.key === 'repeatEvent')?.value;
      const isRecurring = repeatType && repeatType !== 'Does not repeat';

      const eventColor = isTask ? '#8DC63F' : '#00AEEF';

      const instances = generateRecurringInstances(ev, viewStartDate, viewEndDate);

      instances.forEach(({ date: instanceDate, event }) => {
        const instanceStartDate = new Date(instanceDate);
        instanceStartDate.setHours(startDate.getHours(), startDate.getMinutes(), startDate.getSeconds());

        const instanceEndDate = new Date(instanceDate);
        instanceEndDate.setHours(endDate.getHours(), endDate.getMinutes(), endDate.getSeconds());

        if (startDate.toDateString() !== endDate.toDateString()) {
          const duration = endDate.getTime() - startDate.getTime();
          instanceEndDate.setTime(instanceStartDate.getTime() + duration);
        }

        const isMultiDay = instanceStartDate.toDateString() !== instanceEndDate.toDateString();

        if (isMultiDay) {
          const currentDate = new Date(instanceStartDate);
          currentDate.setHours(0, 0, 0, 0);
          const endDateOnly = new Date(instanceEndDate);
          endDateOnly.setHours(0, 0, 0, 0);

          while (currentDate <= endDateOnly) {
            const dateString = formatDate(currentDate);
            const isStart = currentDate.toDateString() === instanceStartDate.toDateString();
            const isEnd = currentDate.toDateString() === instanceEndDate.toDateString();

            if (!marked[dateString]) {
              marked[dateString] = { periods: [] };
            }
            if (!marked[dateString].periods) {
              marked[dateString].periods = [];
            }

            marked[dateString].periods.push({
              startingDay: isStart,
              endingDay: isEnd,
              color: eventColor,
              textColor: '#000000',
            });

            if (!byDate[dateString]) {
              byDate[dateString] = [];
            }

            const alreadyExists = byDate[dateString].some(e =>
              e.uid === ev.uid &&
              e.instanceDate === dateString
            );

            if (!alreadyExists) {
              byDate[dateString].push({
                ...ev,
                instanceDate: dateString,
                instanceStartTime: instanceStartDate,
                instanceEndTime: instanceEndDate,
                isTask,
                isRecurring,
                isMultiDay,
                color: eventColor,
              });
            }

            currentDate.setDate(currentDate.getDate() + 1);
          }
        } else {
          const dateString = formatDate(instanceStartDate);

          if (!marked[dateString]) {
            marked[dateString] = { periods: [] };
          }
          if (!marked[dateString].periods) {
            marked[dateString].periods = [];
          }

          marked[dateString].periods.push({
            color: eventColor,
            selectedColor: eventColor,
          });

          if (!byDate[dateString]) {
            byDate[dateString] = [];
          }

          const alreadyExists = byDate[dateString].some(e =>
            e.uid === ev.uid &&
            e.instanceDate === dateString
          );

          if (!alreadyExists) {
            byDate[dateString].push({
              ...ev,
              instanceDate: dateString,
              instanceStartTime: instanceStartDate,
              instanceEndTime: instanceEndDate,
              isTask,
              isRecurring,
              isMultiDay: false,
              color: eventColor,
            });
          }
        }
      });
    });

    if (marked[selectedDateString]) {
      marked[selectedDateString].selected = true;
      marked[selectedDateString].selectedColor = '#2196F3';
    } else {
      marked[selectedDateString] = {
        selected: true,
        selectedColor: '#2196F3',
      };
    }

    return { markedDates: marked, eventsByDate: byDate };
  }, [userEvents, selectedDateString, selectedDate]);

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: false,
    });

    const unsub = navigation.addListener("beforeRemove", (e) => {
      if (exitModal) return;

      e.preventDefault();
      setExitModal(true);

      setNavigationAction(e.data.action);
    });

    return unsub;
  }, [navigation, exitModal]);

  const handleMenuPress = () => {
    setIsDrawerOpen(true);
  };

  const handleMonthPress = () => {
    console.log('Month selector pressed');
  };

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentMonthByIndex(monthIndex);
    const newDate = new Date(selectedDate.getFullYear(), monthIndex, 1);
    console.log('New Selected Date:', newDate.toDateString());
    setSelectedDate(newDate);
  };

  const handleDateSelect = (date: Date) => {
    console.log('Date selected:', date.toDateString());
    setSelectedDate(date);
    setCurrentMonthByIndex(date.getMonth());
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  const handleDayPress = (day: any) => {
    const newDate = new Date(day.timestamp);
    setSelectedDate(newDate);
    setCurrentMonthByIndex(newDate.getMonth());
  };

  const handleMonthChange = (month: any) => {
    const newDate = new Date(month.timestamp);
    setCurrentMonthByIndex(newDate.getMonth());
  };

  const handleEventPress = (event: any) => {
    console.log('Event pressed:', event);
    setSelectedEvent(event);
    setIsEventModalVisible(true);
  };

  const handleCloseEventModal = () => {
    setIsEventModalVisible(false);
    setSelectedEvent(null);
  };

  const handleEditEvent = (event: any) => {
    handleCloseEventModal();
    (navigation as any).navigate(Screen.CreateEventScreen, {
      mode: 'edit',
      eventData: event,
    });
  };

  const handleDeleteEvent = async (event: any) => {
    try {
      if (!account) {
        console.log('Error', 'No active account found. Please log in again.');
        return false;
      }

      handleCloseEventModal();

      setIsDeleting(true);
      await blockchainService.deleteEventSoft(event.uid, account, token, api);
      await getUserEvents(account.userName, api);
    } catch (err) {
      console.error("Delete Event Failed:", err);
      Alert.alert("Error", "Failed to move the event to the trash");
    } finally {
      setIsDeleting(false);
    }
  };

  const getRecurrenceDayText = (event: any): string => {
    if (!event) return 'Recurring';

    // Try to extract repeat type safely
    const repeatType =
      event.repeatEvent ??
      event.list?.find((item: any) => item.key === 'repeatEvent')?.value;

    if (!repeatType || typeof repeatType !== 'string') return 'Recurring';

    const type = repeatType.toLowerCase();

    if (type.includes('weekday')) return 'Mon - Fri';
    if (type.includes('week')) return 'Weekly';
    if (type.includes('day')) return 'Daily';
    if (type.includes('month')) return 'Monthly';
    if (type.includes('year')) return 'Yearly';

    return repeatType;
  };


  const selectedDateEvents = eventsByDate[selectedDateString] || [];

  console.log('Selected date:', selectedDateString);
  console.log('Events for selected date:', selectedDateEvents.length);

  return (
    <View style={styles.container}>
      <EventDetailsModal
        visible={isEventModalVisible}
        onClose={handleCloseEventModal}
        event={selectedEvent}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />

      <WeekHeader
        onMenuPress={handleMenuPress}
        currentMonth={currentMonth}
        onMonthPress={handleMonthPress}
        onMonthSelect={handleMonthSelect}
        onDateSelect={handleDateSelect}
        currentDate={selectedDate}
        selectedDate={selectedDate}
      />

      <View style={styles.calendarWrapper}>
        <Calendar
          key={selectedDateString}
          current={selectedDateString}
          markedDates={markedDates}
          markingType="multi-period"
          onDayPress={handleDayPress}
          firstDay={1}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#b6c1cd',
            selectedDayBackgroundColor: '#000',
            selectedDayTextColor: '#ffffff',
            todayTextColor: colors.figmaLightBlue || '#2196F3',
            dayTextColor: '#2d4150',
            textDisabledColor: '#d9e1e8',
            dotColor: '#337E89',
            selectedDotColor: '#ffffff',
            arrowColor: colors.figmaLightBlue || '#2196F3',
            monthTextColor: '#2d4150',
            textDayFontFamily: 'DM Sans',
            textMonthFontFamily: 'DM Sans',
            textDayHeaderFontFamily: 'DM Sans',
            textDayFontSize: 14,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 12,
          }}
          renderHeader={() => null}
          hideArrows={true}
        />
      </View>

      <View style={styles.eventsContainer}>
        <Text style={styles.eventsTitle}>Timeline</Text>

        <ScrollView style={styles.eventsList}>
          {selectedDateEvents.length > 0 ? (
            selectedDateEvents.map((event, index) => (
              <View key={`${event.uid}-${index}`}
                style={{ display: 'flex', flexDirection: 'column', marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                  <Text style={[styles.eventTime]}>
                    {event.instanceStartTime?.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>

                  {/* Line */}
                  <View style={{ flex: 1, height: 1, backgroundColor: '#D5D7DA', marginLeft: 14 }} />
                </View>

                <TouchableOpacity
                  style={styles.eventItem}
                  onPress={() => handleEventPress(event)}
                >
                  <View style={styles.eventContent}>
                    <Text style={styles.eventTitle} numberOfLines={1}>
                      {event.title}
                    </Text>

                    <View style={styles.eventBadges}>
                      <View style={styles.badge}>
                        <ClockIcon height={14} width={14} />
                        <Text style={styles.eventTime}>
                          {parseTimeToPST(event.fromTime)?.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                          {' - '}
                          {parseTimeToPST(event.toTime)?.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>

                      {event.isRecurring && (
                        <View style={styles.badge}>
                          <CalendarIcon height={14} width={14} />
                          <Text style={styles.badgeText}>
                            {getRecurrenceDayText(event)}
                          </Text>
                        </View>
                      )}

                      <View style={[styles.badge, {
                        borderColor: event.isTask ? '#8DC63F' : '#00AEEF',
                      }]}>
                        {event.isTask? <TaskIcon height={14} width={14}/> : <EventIcon height={14} width={14}/>}
                        <Text style={styles.badgeText}>
                          {event.isTask ? 'Task' : 'Event'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.noEventsText}>No events for this date</Text>
          )}
        </ScrollView>
      </View>

      {(userEventsLoading || isDeleting) && (
        <View style={[styles.loadingContainer, { pointerEvents: 'box-none' }]}>
          <ActivityIndicator size="large" color={colors.figmaLightBlue || '#2196F3'} />
          <Text style={styles.loadingText}>
            {isDeleting ? 'Deleting Event...' : 'Loading…'}
          </Text>
        </View>
      )}

      <FloatingActionButton
        onOptionSelect={option => {
          console.log('Selected option:', option);
          switch (option) {
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

      <CustomDrawer isOpen={isDrawerOpen} onClose={handleDrawerClose} />
      <ExitConfirmModal
        visible={exitModal}
        onCancel={() => {
          setExitModal(false);
          setNavigationAction(null);
        }}
        onConfirm={() => {
          setExitModal(false);
          if (navigationAction) {
            navigation.dispatch(navigationAction);
          } else {
            navigation.goBack();
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  calendarWrapper: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.lg,
    borderRadius: 14,
    overflow: 'hidden',
  },
  eventsContainer: {
    marginHorizontal: spacing.md,
    paddingHorizontal: 4,
    flex: 1,
  },
  eventsTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'DM Sans',
    marginBottom: spacing.md,
    color: '#2d4150',
  },
  eventsList: {
    flex: 1,
  },
  eventItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: spacing.sm,
    borderColor: '#D5D7DA',
    borderWidth: 1,
    borderLeftColor: '#D5D7DA',
    borderLeftWidth: 1
  },
  eventContent: {
    gap: 12,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'DM Sans',
    color: '#1a1a1a',
    marginBottom: 0,
  },
  eventTime: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'left',
  },
  eventStartTime: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'left',
    borderWidth: 1,
  },
  eventBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    display: 'flex',
    flexDirection: 'row',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 0.5,
    borderColor: '#D5D7DA',
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'DM Sans',
    color: '#666',
    fontWeight: '500',
  },
  noEventsText: {
    fontSize: 14,
    fontFamily: 'DM Sans',
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
});

export default MonthlyCalenderScreen;