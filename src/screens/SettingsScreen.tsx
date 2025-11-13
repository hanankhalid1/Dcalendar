import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Modal,
  Switch,
  Animated,
  Dimensions,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import Share from 'react-native-share';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useRoute } from '@react-navigation/native';
import Header from '../components/Header';
import { Fonts } from '../constants/Fonts';
import { Colors } from '../constants/Colors';
import { useSettingsStore } from '../stores/useSetting';
import { BlockchainService } from '../services/BlockChainService';
import WeekHeader from '../components/WeekHeader';
import { ExportService } from '../services/ExportService';
import { ImportService } from '../services/ImportService';
import { useEventsStore } from '../stores/useEventsStore';
import { useToken } from '../stores/useTokenStore';
import { useActiveAccount } from '../stores/useActiveAccount';
import RNFS from 'react-native-fs';
import LinearGradient from 'react-native-linear-gradient';
import PlainHeader from '../components/PlainHeader';
import CustomDrawer from '../components/CustomDrawer';
import { set } from 'react-hook-form';
import { pick } from '@react-native-documents/picker';
import RNBlobUtil from 'react-native-blob-util';
import { apiClient, useApiClient } from '../hooks/useApi';
import IntegrationsComponent from '../components/IntegrationsComponent';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const blockchainService = new BlockchainService();

// Setting Row Component
const SettingRow = ({
  title,
  subtitle,
  hasDropdown = false,
  hasSwitch = false,
  hasButton = false, // <-- NEW PROP
  buttonText = 'Action', // <-- NEW PROP for button label
  switchValue,
  onSwitchChange,
  onPress,
  onButtonPress // <-- NEW PROP for button action
}) => (
  <TouchableOpacity
    style={styles.settingRow}
    onPress={onPress}
    // Only disable the row touch if it has a Switch, as a button needs its own press handler.
    disabled={hasSwitch}
  >
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>

    {/* Dropdown Indicator */}
    {hasDropdown && !hasSwitch && !hasButton && (
      <MaterialIcons name="keyboard-arrow-down" size={24} color="#666" />
    )}

    {hasSwitch && (
      <Switch
        value={switchValue}
        onValueChange={onSwitchChange}
        trackColor={{ false: '#E0E0E0', true: '#00BCD4' }}
        thumbColor="#fff"
        ios_backgroundColor="#E0E0E0"
      />
    )}

    {/* Button with Gradient */}
    {hasButton && !hasSwitch && (
      <TouchableOpacity onPress={onButtonPress || onPress}>
        <LinearGradient
          colors={['#18F06E', '#0B6DE0']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.settingButton}
        >
          <Text style={styles.settingButtonText}>{buttonText}</Text>
        </LinearGradient>
      </TouchableOpacity>
    )}
  </TouchableOpacity>
);


// Bottom Sheet Modal Base Component
const BottomSheetModal = ({ visible, onClose, children }) => {
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));

  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} />
        <Animated.View
          style={[
            styles.bottomSheetContent,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

// Day Selection Modal Component
const DaySelectionModal = ({ visible, onClose, selectedDay, onSelectDay }) => {
  const days = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
  ];

  const handleConfirm = () => {
    onClose();
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Start of the week</Text>
      </View>

      <View style={styles.modalBody}>
        {days.map((day) => (
          <TouchableOpacity
            key={day}
            style={styles.radioOption}
            onPress={() => onSelectDay(day)}
          >
            <View style={styles.radioButton}>
              {selectedDay === day && (
                <LinearGradient
                  colors={['#18F06E', '#0B6DE0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.radioButtonSelected}
                />
              )}
            </View>
            <Text style={styles.radioText}>{day}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.modalButtons}>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1 }} onPress={handleConfirm}>
          <LinearGradient
            colors={['#18F06E', '#0B6DE0']} // Your gradient colors
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.confirmButton} // Apply inner padding/alignment here
          >
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
};

// Theme Selection Modal Component
const ThemeSelectionModal = ({ visible, onClose, selectedTheme, onSelectTheme }) => {
  const themes = [
    { id: 'system', label: 'System Default' },
    { id: 'light', label: 'Light mode' },
    { id: 'dark', label: 'Dark mode' }
  ];

  const handleConfirm = () => {
    onClose();
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Theme</Text>
      </View>

      <View style={styles.modalBody}>
        {themes.map((theme) => (
          <TouchableOpacity
            key={theme.id}
            style={styles.radioOption}
            onPress={() => onSelectTheme(theme.id)}
          >
            <View style={styles.radioButton}>
              {selectedTheme === theme.id && (
                <LinearGradient
                  colors={['#18F06E', '#0B6DE0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.radioButtonSelected}
                />)}
            </View>
            <Text style={styles.radioText}>{theme.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.modalButtons}>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1 }} onPress={handleConfirm} activeOpacity={0.8}>
          <LinearGradient
            colors={['#18F06E', '#0B6DE0']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.confirmButton}>
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </LinearGradient>
        </TouchableOpacity>


      </View>
    </BottomSheetModal>
  );
};

// Time Zone Modal Component
const TimeZoneModal = ({ visible, onClose, selectedTimeZone, onSelectTimeZone }) => {
  const timeZones = [
    { id: 'ist', label: '(GMT+05:30) Indian Standard' },
    { id: 'utc', label: '(GMT+00:00) UTC' },
    { id: 'est', label: '(GMT-05:00) Eastern Standard' },
    { id: 'pst', label: '(GMT-08:00) Pacific Standard' },
  ];

  const handleConfirm = () => {
    onClose();
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Time Zone</Text>
      </View>

      <View style={styles.modalBody}>
        {timeZones.map((timezone) => (
          <TouchableOpacity
            key={timezone.id}
            style={styles.radioOption}
            onPress={() => onSelectTimeZone(timezone.id)}
          >
            <View style={styles.radioButton}>
              {selectedTimeZone === timezone.id && (
                <LinearGradient
                  colors={['#18F06E', '#0B6DE0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.radioButtonSelected}
                />)}
            </View>
            <Text style={styles.radioText}>{timezone.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.modalButtons}>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1 }} onPress={handleConfirm}>
          <LinearGradient
            colors={['#18F06E', '#0B6DE0']} // Your gradient colors
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.confirmButton} // Apply inner padding/alignment here
          >
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
};

// Main Settings Screen Component
const SettingsScreen = () => {
  const route = useRoute<any>();
  const { expandIntegration } = route.params || {};
  const [showDayModal, setShowDayModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showTimeZoneModal, setShowTimeZoneModal] = useState(false);
  const [settings, setSettings] = useState<any[]>([]);
  const username = 'arati';
  const { userEvents: events } = useEventsStore();
  const { account } = useActiveAccount();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const exportService = new ExportService();
  const importService = new ImportService();
  const { api } = useApiClient();
  const token = useToken(state => state.token);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        console.log('🚀 Fetching blockchain settings...');
        const result = await blockchainService.getSettings(username);
        console.log('✅ Blockchain settings received:', result);
        setSettings(result); // store in state
      } catch (error) {
        console.error('❌ Error fetching blockchain settings:', error);
      }
    };

    fetchSettings();
  }, [username]);


  const {
    selectedDay,
    selectedTheme,
    selectedTimeZone,
    showCompletedEvents,
    showDeclinedEvents,
    calendarNotifications,
    taskNotifications,
    taskOverdueNotification,
    setSelectedDay,
    setSelectedTheme,
    setSelectedTimeZone,

    toggleShowCompletedEvents,
    toggleShowDeclinedEvents,
    toggleCalendarNotifications,
    toggleTaskNotifications,
    toggleTaskOverdueNotification,
  } = useSettingsStore();




  const getThemeLabel = (themeId) => {
    const themeMap = {
      'system': 'System Default',
      'light': 'Light mode',
      'dark': 'Dark mode'
    };
    return themeMap[themeId] || 'System Default';
  };

  const getTimeZoneLabel = (tzId) => {
    const tzMap = {
      'ist': '(GMT+05:30) Indian Standard',
      'utc': '(GMT+00:00) UTC',
      'est': '(GMT-05:00) Eastern Standard',
      'pst': '(GMT-08:00) Pacific Standard',
    };
    return tzMap[tzId] || '(GMT+05:30) Indian Standard';
  };

  const handleExportEvents = async () => {
    if (!events || !account) {
      Alert.alert('Data not ready', 'Events or account information is missing.');
      return;
    }

    console.log('🗓 Exporting events...');

    try {
      // 1️⃣ Generate the ICS content
      const icsContentArray = await ExportService.exportEvents(events, account);
      const combinedICS = icsContentArray.join('\n\n');
      console.log('ICS data ready.');

      // 2️⃣ Create filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `${account.userName || account}_${timestamp}.ics`;

      let filePath;

      // 3️⃣ Handle iOS & Android separately
      if (Platform.OS === 'android') {
        const dirs = RNBlobUtil.fs.dirs;
        filePath = `${dirs.DownloadDir}/${filename}`;

        // Write the file
        await RNBlobUtil.fs.writeFile(filePath, combinedICS, 'utf8');
        console.log('✅ File written to:', filePath);

        // Add as complete download to make it visible + show notification
        await RNBlobUtil.android.addCompleteDownload({
          title: filename,
          description: 'Exported calendar file',
          mime: 'text/calendar',
          path: filePath,
          showNotification: true,
        });

        Alert.alert('✅ Export Successful', `Saved to Downloads as:\n${filename}`);
      } else {
        // iOS path
        const dirs = RNBlobUtil.fs.dirs;
        filePath = `${dirs.DocumentDir}/${filename}`;
        await RNBlobUtil.fs.writeFile(filePath, combinedICS, 'utf8');
        console.log('✅ File written to:', filePath);

        // Optionally open Share sheet
        const shareOptions = {
          title: 'Export Calendar Events',
          message: `Exporting ${events.length} event(s)`,
          url: filePath,
          type: 'text/calendar',
          filename,
          saveToFiles: true, // allows "Save to Files" option on iOS
        };

        await Share.open(shareOptions);
      }

    } catch (error) {
      console.error('❌ Export failed:', error);

      let errorMessage = 'Failed to export events. Please try again.';
      if (error instanceof Error) errorMessage = error.message;

      Alert.alert('Export Failed', errorMessage);
    }
  };

  const handleImportEvents = async () => {
    try {
      // 1. Define platform-specific types for the .ics file
      // Android uses MIME type, iOS uses Uniform Type Identifier (UTI)
      const icsMimeType = 'text/calendar';
      const icsUti = 'public.calendar-event';

      // Select the correct array for the current platform
      const fileTypes = Platform.select({
        ios: [icsUti],
        android: [icsMimeType],
        default: [icsMimeType, icsUti],
      });

      // 2. Open the document picker
      const results = await pick({
        type: fileTypes,
      });

      // Handle cancellation
      if (!results || results.length === 0) {
        console.log('User cancelled the file picker.');
        return;
      }

      const selectedFile = results[0];

      try {

        const filePath = Platform.OS === 'android' && selectedFile.uri.startsWith('content://')
          ? selectedFile.uri
          : selectedFile.uri.replace('file://', '');

        // Read the file as text
        const icalDataString = await RNFS.readFile(filePath, 'utf8');

        console.log("Account user name", account.userName);
        const parsed = importService.parseIcal(icalDataString, account, events);

        console.log("Parsed events", parsed);

        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          blockchainService.saveImportedEvents(parsed, account.userName, token, api);
          console.log("Successfully imported events in settings screen");
        }
      } catch (err) {
        console.error('Error selecting file:', err);
        Alert.alert('Error', 'Failed to pick file. Check console for details.');
      }
    }
    catch (err) {
      console.error('Error selecting file:', err);
      Alert.alert('Error', 'Failed to pick file. Check console for details.');
    }
  }

  const handleMenuPress = () => {
    setIsDrawerOpen(true);
    console.log("Menu button pressed");
  }
  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <PlainHeader onMenuPress={handleMenuPress} title="Settings" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <SettingRow
          title="Start of the week"
          subtitle={selectedDay}
          hasDropdown={true}
          onPress={() => setShowDayModal(true)}
        />

        <SettingRow
          title="Time Zone"
          subtitle={getTimeZoneLabel(selectedTimeZone)}
          hasDropdown={true}
          onPress={() => setShowTimeZoneModal(true)}
        />

        {/* <SettingRow
          title="Theme"
          subtitle={getThemeLabel(selectedTheme)}
          hasDropdown={true}
          onPress={() => setShowThemeModal(true)}
        />

        <SettingRow
          title="Show week number"
          hasSwitch={false}
        />

        <SettingRow
          title="Show completed events"
          hasSwitch={true}
          switchValue={showCompletedEvents}
          onSwitchChange={toggleShowCompletedEvents}
        />

        <SettingRow
          title="Show declined events"
          hasSwitch={true}
          switchValue={showDeclinedEvents}
          onSwitchChange={toggleShowDeclinedEvents}
        />

        <SettingRow
          title="Calendar notifications"
          hasSwitch={true}
          switchValue={calendarNotifications}
          onSwitchChange={toggleCalendarNotifications}
        />

        <SettingRow
          title="Task notifications"
          hasSwitch={true}
          switchValue={taskNotifications}
          onSwitchChange={toggleTaskNotifications}
        />

        <SettingRow
          title="Task overdue notification"
          hasSwitch={true}
          switchValue={taskOverdueNotification}
          onSwitchChange={toggleTaskNotifications}
        /> */}

        <SettingRow
          title="Export Events"
          subtitle="You can download all calendars you can view and modify in a single file."
          buttonText="Export"
          hasButton={true}
          onButtonPress={handleExportEvents}
        />
{/* 
        <SettingRow
          title="Import Events"
          subtitle="bjdnwjd"
          buttonText="Import"
          hasButton={true}
          onButtonPress={handleImportEvents}
        /> */}

        {/* Integration Component */}
        <IntegrationsComponent initialExpanded={expandIntegration || false} />

      </ScrollView>

      <DaySelectionModal
        visible={showDayModal}
        onClose={() => setShowDayModal(false)}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
      />

      <ThemeSelectionModal
        visible={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        selectedTheme={selectedTheme}
        onSelectTheme={setSelectedTheme}
      />

      <TimeZoneModal
        visible={showTimeZoneModal}
        onClose={() => setShowTimeZoneModal(false)}
        selectedTimeZone={selectedTimeZone}
        onSelectTimeZone={setSelectedTimeZone}
      />
      {/* Custom Drawer */}
      <CustomDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
      />
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
    color: '#333',
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '400',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  settingButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    backgroundColor: '#00BCD4', // Highlight color
  },
  settingButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  bottomSheetContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalBody: {
    paddingVertical: 8,
    maxHeight: SCREEN_HEIGHT * 0.4,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#00BCD4',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00BCD4',
  },
  radioText: {
    fontSize: 16,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },


  containerStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 13,
    paddingBottom: 13,
    paddingHorizontal: 20,
    borderRadius: 32,
  },
  boxStyle: {
    borderRadius: 32
  },
  titleStyle: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: Colors.white,
    textAlignVertical: 'center',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#00BCD4',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});


export default SettingsScreen;