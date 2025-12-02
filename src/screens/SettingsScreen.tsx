import React, { useEffect, useState, useRef } from 'react';
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
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import Share from 'react-native-share';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SearchIcon from '../assets/svgs/search.svg';
import MenuIcon from '../assets/svgs/menu.svg';
import { useRoute } from '@react-navigation/native';
import Header from '../components/Header';
import { Fonts } from '../constants/Fonts';
import { Colors } from '../constants/Colors';
import { useSettingsStore } from '../stores/useSetting';
import { BlockchainService } from '../services/BlockChainService';
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
import CustomAlert from '../components/CustomAlert';
import { spacing, fontSize } from '../utils/LightTheme';
import * as DimensionsUtils from '../utils/dimensions';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Extract scaling functions
const moderateScale = DimensionsUtils.moderateScale;
const scaleHeight = DimensionsUtils.scaleHeight;
const scaleWidth = DimensionsUtils.scaleWidth;

const blockchainService = new BlockchainService();

// Setting Row Component
const SettingRow = ({
  title,
  subtitle,
  hasDropdown = false,
  hasSwitch = false,
  hasButton = false,
  hasArrow = false,
  isLogout = false,
  isLast = false,
  buttonText = 'Action',
  switchValue,
  onSwitchChange,
  onPress,
  onButtonPress
}) => (
  <TouchableOpacity
    style={[
      styles.settingRow,
      isLogout && styles.logoutRow,
    ]}
    onPress={onPress}
    disabled={hasSwitch}
    activeOpacity={0.7}
  >
    {isLogout && (
      <MaterialIcons name="arrow-back" size={20} color="#FF4444" style={styles.logoutIcon} />
    )}
    <View style={styles.settingContent}>
      <Text style={[styles.settingTitle, isLogout && styles.logoutTitle]}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>

    {/* Dropdown Indicator */}
    {hasDropdown && !hasSwitch && !hasButton && !hasArrow && (
      <MaterialIcons name="keyboard-arrow-down" size={24} color="#666" />
    )}

    {/* Arrow for navigation items */}
    {hasArrow && !hasSwitch && !hasButton && (
      <MaterialIcons name="chevron-right" size={24} color="#666" />
    )}

    {hasSwitch && (
      <Switch
        value={switchValue}
        onValueChange={onSwitchChange}
        trackColor={{ false: '#E0E0E0', true: '#000' }}
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
          {/* Draggable indicator */}
          <View style={styles.dragIndicator} />
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

  const { account } = useActiveAccount();
  const blockchainService = new BlockchainService();
  const [isSaving, setIsSaving] = useState(false);

  // Reset isSaving when modal closes
  useEffect(() => {
    if (!visible) {
      setIsSaving(false);
    }
  }, [visible]);

  const handleDaySelect = async (day: string) => {
    // ✅ Update local store immediately (Zustand persist will save to AsyncStorage automatically)
    onSelectDay(day);

    // ✅ Save to blockchain as background sync (don't block UI or show errors)
    if (account?.userName) {
      setIsSaving(true);
      // Don't await - let it run in background
      blockchainService.updateSettings(
        account.userName,
        'startOfWeek',
        [{ key: 'value', value: day }]
      ).then(() => {
        console.log('✅ Start of week synced to blockchain:', day);
        setIsSaving(false);
      }).catch((error) => {
        console.error('❌ Failed to sync start of week to blockchain (non-critical):', error);
        // Don't show error to user - local storage is working
        setIsSaving(false);
      });
    } else {
      // If no account, ensure isSaving is false
      setIsSaving(false);
    }
    
    // Close modal after selection
    onClose();
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Start of the week</Text>
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="close" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.modalDivider} />

      <View style={styles.modalBody}>
        {days.map((day) => (
          <TouchableOpacity
            key={day}
            style={[
              styles.dayOption,
              selectedDay === day && styles.dayOptionSelected
            ]}
            onPress={() => handleDaySelect(day)}
            activeOpacity={0.7}
          >
            <Text style={styles.dayText}>{day}</Text>
            {selectedDay === day && (
              <MaterialIcons name="check" size={24} color="#00AEEF" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </BottomSheetModal>
  );
};

// Theme Selection Modal Component
const ThemeSelectionModal = ({ visible, onClose, selectedTheme, onSelectTheme }) => {
  const themes = [
    { id: 'system', label: 'System default' },
    { id: 'light', label: 'Light mode' },
    { id: 'dark', label: 'Dark mode' }
  ];

  const handleThemeSelect = (themeId: string) => {
    onSelectTheme(themeId);
    // Close modal after selection
    onClose();
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Theme</Text>
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="close" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.modalDivider} />

      <View style={styles.modalBody}>
        {themes.map((theme) => (
          <TouchableOpacity
            key={theme.id}
            style={[
              styles.dayOption,
              selectedTheme === theme.id && styles.dayOptionSelected
            ]}
            onPress={() => handleThemeSelect(theme.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.dayText}>{theme.label}</Text>
            {selectedTheme === theme.id && (
              <MaterialIcons name="check" size={24} color="#00AEEF" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </BottomSheetModal>
  );
};

// Time Zone Modal Component
const TimeZoneModal = ({ visible, onClose, selectedTimeZone, onSelectTimeZone }) => {
  const [tempSelectedTimeZone, setTempSelectedTimeZone] = useState(selectedTimeZone);
  
  const timeZones = [
    { id: 'ist', label: '(GMT+05:30) Indian Standard' },
    { id: 'utc', label: '(GMT+00:00) UTC' },
    { id: 'est', label: '(GMT-05:00) Eastern Standard' },
    { id: 'pst', label: '(GMT-08:00) Pacific Standard' },
  ];

  // Reset temp state when modal opens or selectedTimeZone changes
  useEffect(() => {
    if (visible) {
      setTempSelectedTimeZone(selectedTimeZone);
    }
  }, [visible, selectedTimeZone]);

  const handleConfirm = () => {
    onSelectTimeZone(tempSelectedTimeZone);
    onClose();
  };

  const handleCancel = () => {
    // Reset to original value
    setTempSelectedTimeZone(selectedTimeZone);
    onClose();
  };

  return (
    <BottomSheetModal visible={visible} onClose={handleCancel}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Time Zone</Text>
      </View>

      <View style={styles.modalBody}>
        {timeZones.map((timezone) => (
          <TouchableOpacity
            key={timezone.id}
            style={styles.radioOption}
            onPress={() => setTempSelectedTimeZone(timezone.id)}
          >
            <View style={styles.radioButton}>
              {tempSelectedTimeZone === timezone.id && (
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
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
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
  const { userEvents: events } = useEventsStore();
  const { account } = useActiveAccount();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Custom Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  // Helper function to show custom alert
  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info'
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  const exportService = new ExportService();
  const importService = new ImportService();
  const { api } = useApiClient();
  const token = useToken(state => state.token);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        console.log('🚀 Fetching blockchain settings...');
        const result = await blockchainService.getSettings(account?.userName || '');
        console.log('✅ Blockchain settings received:', result);
        setSettings(result); // store in state
        // Don't sync from blockchain - Zustand persist handles everything
      } catch (error) {
        console.error('❌ Error fetching blockchain settings:', error);
      }
    };

    if (account?.userName) {
      fetchSettings();
    }
  }, [account?.userName]);


  const {
    selectedDay,
    selectedTheme,
    selectedTimeZone,
    showCompletedEvents,
    showDeclinedEvents,
    calendarNotifications,
    taskNotifications,
    birthdayNotifications,
    taskOverdueNotification,
    setSelectedDay,
    setSelectedTheme,
    setSelectedTimeZone,

    toggleShowCompletedEvents,
    toggleShowDeclinedEvents,
    toggleCalendarNotifications,
    toggleTaskNotifications,
    toggleBirthdayNotifications,
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
      showAlert('Data not ready', 'Events or account information is missing.', 'warning');
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
        const dirs = RNBlobUtil.fs.dirs;  // Write to cache first
        const tempPath = `${dirs.CacheDir}/${filename}`;
        await RNBlobUtil.fs.writeFile(tempPath, combinedICS, 'utf8');

        // Use MediaStore to save to Downloads
        await RNBlobUtil.MediaCollection.copyToMediaStore(
          {
            name: filename,
            parentFolder: 'Download', // or '' for root Downloads
            mimeType: 'text/calendar',
          },
          'Download',
          tempPath
        );

        // Clean up temp file
        await RNBlobUtil.fs.unlink(tempPath);
        showAlert('Export Successful', `Saved to Downloads as:\n${filename}`, 'success');
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

      showAlert('Export Failed', errorMessage, 'error');
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
        
        // Parse the file to get all events (before filtering)
        const allParsedEvents = importService.parseIcal(icalDataString, account, []);
        const parsed = importService.parseIcal(icalDataString, account, events);

        console.log("All parsed events:", allParsedEvents);
        console.log("Filtered parsed events:", parsed);

        // Determine the scenario
        const totalEventsInFile = allParsedEvents && Array.isArray(allParsedEvents) ? allParsedEvents.length : 0;
        const newEventsCount = parsed && Array.isArray(parsed) ? parsed.length : 0;

        // Case 1: File is invalid or parsing failed
        if (allParsedEvents === null || !Array.isArray(allParsedEvents)) {
          showAlert(
            "Invalid File",
            "The selected file is not a valid calendar file. Please select a valid .ics or .ical file.",
            'error'
          );
          return;
        }

        // Case 2: File has no valid events
        if (totalEventsInFile === 0) {
          showAlert(
            "No Events Found",
            "The selected file does not contain any valid events.",
            'warning'
          );
          return;
        }

        // Case 3: All events already exist (duplicates)
        if (totalEventsInFile > 0 && newEventsCount === 0) {
          showAlert(
            "Events Already Exist",
            `All ${totalEventsInFile} event(s) from the file already exist in your calendar. No new events were imported.`,
            'info'
          );
          return;
        }

        // Case 4: Some or all events are new - proceed with import
        if (newEventsCount > 0) {
          try {
            await blockchainService.saveImportedEvents(parsed, account.userName, token, api);
            
            // Success: Events imported
            showAlert(
              "Import Successful",
              `Successfully imported ${newEventsCount} event(s)${totalEventsInFile > newEventsCount ? ` (${totalEventsInFile - newEventsCount} event(s) were skipped as they already exist)` : ''}.`,
              'success'
            );
          } catch (saveError) {
            console.error('Error saving imported events:', saveError);
            showAlert(
              "Import Failed",
              "Failed to save the imported events. Please try again or check your connection.",
              'error'
            );
          }
        }
      } catch (err) {
        console.error('Error processing file:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        showAlert(
          "Import Error",
          `Failed to import events: ${errorMessage}. Please ensure the file is a valid calendar file and try again.`,
          'error'
        );
      }
    }
    catch (err) {
      console.error('Error selecting file:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to access the file';
      showAlert(
        "File Selection Error",
        `Unable to select the file: ${errorMessage}. Please try again.`,
        'error'
      );
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
      {/* Custom Header with Settings title and search */}
      <View style={styles.headerContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleMenuPress}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MenuIcon width={24} height={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity
            style={styles.searchButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <SearchIcon width={24} height={24} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Notification settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification settings</Text>
          <SettingRow
            title="Event notification"
            hasSwitch={true}
            switchValue={calendarNotifications}
            onSwitchChange={toggleCalendarNotifications}
            isLast={false}
          />
          <SettingRow
            title="Task notification"
            hasSwitch={true}
            switchValue={taskNotifications}
            onSwitchChange={toggleTaskNotifications}
            isLast={false}
          />
          <SettingRow
            title="Birthday notification"
            hasSwitch={true}
            switchValue={birthdayNotifications}
            onSwitchChange={toggleBirthdayNotifications}
            isLast={false}
          />
          <SettingRow
            title="Show completed tasks & events"
            hasSwitch={true}
            switchValue={showCompletedEvents}
            onSwitchChange={toggleShowCompletedEvents}
            isLast={false}
          />
        </View>

        {/* App settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App settings</Text>
          <SettingRow
            title="Start of the week"
            subtitle={selectedDay}
            hasDropdown={true}
            onPress={() => setShowDayModal(true)}
            isLast={false}
          />
          <SettingRow
            title="Theme"
            subtitle={getThemeLabel(selectedTheme)}
            hasDropdown={true}
            onPress={() => setShowThemeModal(true)}
            isLast={false}
          />
        </View>

        {/* About DCalendar Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About DCalendar</Text>
          <SettingRow
            title="About app"
            hasArrow={true}
            onPress={() => {
              // Navigate to about app screen
              console.log('Navigate to About app');
            }}
            isLast={false}
          />
          <SettingRow
            title="Contact us"
            hasArrow={true}
            onPress={() => {
              // Navigate to contact us screen
              console.log('Navigate to Contact us');
            }}
            isLast={false}
          />
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <SettingRow
            title="Logout"
            isLogout={true}
            onPress={() => {
              // Handle logout
              console.log('Logout pressed');
            }}
          />
        </View>

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

      {/* Custom Alert */}
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Gray background
  },
  headerContainer: {
    backgroundColor: '#fff', // White background for header
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    height: scaleHeight(60),
  },
  menuButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#000',
    fontFamily: Fonts.latoBold,
    marginLeft: scaleWidth(12),
    flex: 1,
  },
  searchButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Gray background
  },
  section: {
    marginBottom: scaleHeight(16),
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: '#666',
    paddingHorizontal: scaleWidth(20),
    paddingBottom: scaleHeight(8),
    fontFamily: Fonts.latoMedium,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    marginHorizontal: scaleWidth(20),
    marginBottom: scaleHeight(10),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(14),
  },
  logoutRow: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    marginHorizontal: scaleWidth(20),
    marginBottom: scaleHeight(12),
  },
  logoutIcon: {
    marginRight: scaleWidth(8),
  },
  logoutTitle: {
    color: '#FF4444',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: moderateScale(16),
    color: '#000', // Black text
    fontWeight: '400',
    fontFamily: Fonts.latoRegular,
  },
  settingSubtitle: {
    fontSize: moderateScale(14),
    color: '#666',
    marginTop: scaleHeight(2),
    fontFamily: Fonts.latoRegular,
  },
  logoutContainer: {
    marginTop: scaleHeight(4),
    marginBottom: scaleHeight(0),
  },
  scrollContent: {
    paddingTop: scaleHeight(20),
    paddingBottom: scaleHeight(20),
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
    borderTopLeftRadius: moderateScale(16),
    borderTopRightRadius: moderateScale(16),
    maxHeight: SCREEN_HEIGHT * 0.7,
    paddingBottom: Platform.OS === 'ios' ? scaleHeight(20) : 0,
    paddingTop: scaleHeight(8),
    width: '100%',
    alignSelf: 'center',
  },
  dragIndicator: {
    width: scaleWidth(40),
    height: scaleHeight(4),
    backgroundColor: '#E0E0E0',
    borderRadius: moderateScale(2),
    alignSelf: 'center',
    marginBottom: scaleHeight(8),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(20),
    paddingTop: scaleHeight(20),
    paddingBottom: scaleHeight(16),
    borderBottomWidth: 0,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: moderateScale(20),
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#000',
    fontFamily: Fonts.latoBold,
  },
  modalBody: {
    paddingVertical: scaleHeight(8),
  },
  dayOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(20),
    paddingVertical: scaleHeight(14),
    minHeight: scaleHeight(48),
    marginHorizontal: moderateScale(20),
    marginVertical: scaleHeight(2),
    borderRadius: moderateScale(8),
  },
  dayOptionSelected: {
    backgroundColor: '#F5F5F5',
  },
  dayText: {
    fontSize: moderateScale(16),
    color: '#000',
    fontFamily: Fonts.latoRegular,
    flex: 1,
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: scaleWidth(20),
    marginVertical: scaleHeight(10),
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
});


export default SettingsScreen;