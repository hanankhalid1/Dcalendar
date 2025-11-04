import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AppointmentScheduleScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Appointment Schedule</Text>
      <Text style={styles.subtitle}>Work in progress…</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#B0B0B0',
    fontSize: 16,
  },
});

export default AppointmentScheduleScreen;


