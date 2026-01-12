import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Calendar } from 'react-native-big-calendar';
import FloatingActionButton from './FloatingActionButton';
import WeekHeader from './WeekHeader';
import { Fonts } from '../constants/Fonts';
import { screenWidth, scaleWidth, scaleHeight } from '../utils/dimensions';

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

  const isTablet = screenWidth >= 600;
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
          // Unified compact badge style matching EventCard
          const containerStyle: any = {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: scaleWidth(getTabletSafeDimension(6, 8, 10)),
            paddingVertical: scaleHeight(getTabletSafeDimension(3, 4, 5)),
            borderRadius: getTabletSafeDimension(12, 14, 16),
            backgroundColor: 'transparent',
            borderWidth: 0.5,
            borderColor: '#D5D7DA',
            gap: scaleWidth(getTabletSafeDimension(3, 4, 5)),
            maxWidth: getTabletSafeDimension(80, 90, 100),
          };
          const textStyle: any = {
            color: '#717680',
            fontFamily: Fonts.latoBold,
            fontWeight: '500',
            fontSize: getTabletSafeDimension(10, 12, 12),
            lineHeight: getTabletSafeDimension(12, 14, 14),
            letterSpacing: 0,
            textAlign: 'center',
          };

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
