import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Calendar } from 'react-native-big-calendar';
import FloatingActionButton from './FloatingActionButton';
import WeekHeader from './WeekHeader';

interface MonthlyCalendarProps {
  onDateSelect?: (date: string) => void;
  onEventPress?: (event: any) => void;
  onFABOptionSelect?: (option: string) => void;
  onMenuPress?: () => void;
  onMonthPress?: () => void;
}

const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({
  onEventPress,
  onFABOptionSelect,
  onMenuPress,
  onMonthPress,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );

  // Events with three different types
  const events = [
    {
      title: 'Holiday',
      start: new Date(2024, 11, 5),
      end: new Date(2024, 11, 5, 23, 59),
      type: 'holiday',
    },
    {
      title: 'Christmas Eve',
      start: new Date(2024, 11, 24),
      end: new Date(2024, 11, 24, 23, 59),
      type: 'holiday',
    },
    {
      title: 'Christmas Day',
      start: new Date(2024, 11, 25),
      end: new Date(2024, 11, 25, 23, 59),
      type: 'holiday',
    },

    {
      title: 'New Green Deal Corp Daily Scrum Meeting with Long Title',
      start: new Date(2024, 11, 14, 13, 30),
      end: new Date(2024, 11, 14, 14, 0),
      type: 'meeting',
    },
    {
      title: 'Team Meeting',
      start: new Date(2024, 11, 2, 9, 0),
      end: new Date(2024, 11, 2, 10, 0),
      type: 'meeting',
    },
    {
      title: 'Client Call with Very Long Description Text',
      start: new Date(2024, 11, 4, 14, 0),
      end: new Date(2024, 11, 4, 15, 0),
      type: 'meeting',
    },

    {
      title: 'Event',
      start: new Date(2024, 11, 18, 2, 34),
      end: new Date(2024, 11, 18, 3, 0),
      type: 'task',
    },
    {
      title: 'Party',
      start: new Date(2024, 11, 18, 19, 50),
      end: new Date(2024, 11, 18, 20, 30),
      type: 'task',
    },
    {
      title: 'Project Deadline with Long Description',
      start: new Date(2024, 11, 5),
      end: new Date(2024, 11, 5, 23, 59),
      type: 'task',
    },
    {
      title: 'Code Review Meeting',
      start: new Date(2024, 11, 6, 15, 0),
      end: new Date(2024, 11, 6, 16, 0),
      type: 'task',
    },
    {
      title: 'Very Long Task Name That Should Expand Container Height',
      start: new Date(2024, 11, 8, 10, 0),
      end: new Date(2024, 11, 8, 11, 0),
      type: 'task',
    },
  ];

  const handleEventPress = (event: any) => {
    console.log('Event pressed:', event);
    onEventPress?.(event);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <WeekHeader
        onMenuPress={onMenuPress || (() => {})}
        currentMonth={new Date().toLocaleString('default', { month: 'long' })}
        onMonthPress={onMonthPress || (() => {})}
      />

      <Calendar
        events={events}
        height={600}
        mode="month"
        onPressEvent={handleEventPress}
        renderEvent={event => {
          let containerStyle: any = {};
          let textStyle: any = {};

          if (event.type === 'holiday') {
            containerStyle = {
              backgroundColor: '#18F06E',
              borderRadius: 20,
              width: 60,
              height: 24,
              borderWidth: 1,
              borderColor: '#0B6DE0',
              shadowColor: '#0B6DE0',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.4,
              shadowRadius: 3,
              elevation: 4,
              justifyContent: 'center',
              alignItems: 'center',
            };
            textStyle = {
              color: '#FFFFFF',
              fontFamily: 'Poppins',
              fontWeight: '500',
              fontSize: 12,
              lineHeight: 12, // 100% of font size
              letterSpacing: 0,
            };
          } else if (event.type === 'meeting') {
            containerStyle = {
              backgroundColor: '#F7FAFC',
              borderWidth: 1,
              borderColor: '#337E8980',
              borderRadius: 4,
              width: 72,
              height: 54,
              justifyContent: 'center',
              alignItems: 'center',
              padding: 4,
            };
            textStyle = {
              color: '#337E89',
              fontFamily: 'DM Sans',
              fontWeight: '700',
              fontSize: 8,
              lineHeight: 9,
              letterSpacing: 0,
              textAlign: 'center',
            };
          } else if (event.type === 'task') {
            containerStyle = {
              backgroundColor: '#F7FAFC',
              borderWidth: 1,
              borderColor: '#337E8980',
              borderRadius: 4,
              width: 48,
              height: 24,
              justifyContent: 'center',
              alignItems: 'center',
              padding: 2,
            };
            textStyle = {
              color: '#337E89',
              fontFamily: 'DM Sans',
              fontWeight: '700',
              fontSize: 8,
              lineHeight: 16,
              letterSpacing: 0,
              textAlign: 'center',
            };
          }

          return (
            <View style={containerStyle}>
              <Text style={textStyle} numberOfLines={2}>
                {event.title}
              </Text>
            </View>
          );
        }}
      />

      {/* Floating Action Button */}
      <FloatingActionButton onOptionSelect={onFABOptionSelect} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});

export default MonthlyCalendar;
