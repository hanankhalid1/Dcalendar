import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppNavigationProp, Screen } from '../navigations/appNavigation.type';
import { scaleHeight, scaleWidth, screenHeight } from '../utils/dimensions';
import { colors, spacing } from '../utils/LightTheme';

// Import components
import AllEventsComponent from '../components/AllEventsComponent';
import CompletedComponent from '../components/CompletedComponent';
import CustomDrawer from '../components/CustomDrawer';
import FloatingActionButton from '../components/FloatingActionButton';
import RecycleBinComponent from '../components/RecycleBinComponent';
import RemindersHeader from '../components/RemindersHeader';
import TodayComponent from '../components/TodayComponent';

const RemindersScreen = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [selectedFilter, setSelectedFilter] = useState('all');


    const [events, setEvents] = useState<any[]>([]);



    
  const handleMenuPress = () => {
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
  };

  const handleFABPress = () => {
    console.log('Add reminder pressed');
  };

  

  

  

  

  const handleReminderPress = (reminder: any) => {
    console.log('Reminder pressed:', reminder);
  };

  const handleReminderSelect = (reminderId: string) => {
    console.log('Reminder selected:', reminderId);
  };

  const handleRestoreAll = () => {
    console.log('Restore all pressed');
  };

  const handleDeleteAll = () => {
    console.log('Delete all pressed');
  };

  const renderSelectedComponent = () => {
    switch (selectedFilter) {
      case 'all':
        return (
          <AllEventsComponent
            onReminderPress={handleReminderPress}
            onReminderSelect={handleReminderSelect}
          />
        );
      case 'today':
        return (
          <TodayComponent
            onReminderPress={handleReminderPress}
            onReminderSelect={handleReminderSelect}
          />
        );
      case 'completed':
        return (
          <CompletedComponent
            onReminderPress={handleReminderPress}
            onReminderSelect={handleReminderSelect}
          />
        );
      case 'recycle':
        return (
          <RecycleBinComponent
            onItemPress={handleReminderPress}
            onItemSelect={handleReminderSelect}
            onRestoreAll={handleRestoreAll}
            onDeleteAll={handleDeleteAll}
          />
        );
      default:
        return (
          <AllEventsComponent
            onReminderPress={handleReminderPress}
            onReminderSelect={handleReminderSelect}
          />
        );
    }
  };

  // Determine if the FloatingActionButton should be shown
  const showFloatingActionButton =
    selectedFilter !== 'completed' && selectedFilter !== 'recycle';

  return (
    <SafeAreaView style={styles.container}>
      <RemindersHeader
        onMenuPress={handleMenuPress}
        selectedFilter={selectedFilter}
        onFilterChange={handleFilterChange}
      />

      {/* Left edge touch area for drawer */}
      <TouchableOpacity
        style={styles.leftEdgeTouchArea}
        onPress={handleMenuPress}
        activeOpacity={0.1}
      />

      {/* Main Content and FAB */}
      <View style={styles.contentContainer}>
        {renderSelectedComponent()}

        {showFloatingActionButton && (
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
                  // Already on RemindersScreen, no navigation needed
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
        )}
      </View>

      {/* Custom Drawer */}
      <CustomDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  contentContainer: {
    flex: 1,
  },
  leftEdgeTouchArea: {
    position: 'absolute',
    left: 0,
    top: scaleHeight(80),
    width: scaleWidth(20),
    height: screenHeight - scaleHeight(80),
    zIndex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
  },
});

export default RemindersScreen;
