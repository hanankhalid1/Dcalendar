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

import PlainHeader from '../components/PlainHeader';

import CustomDrawer from '../components/CustomDrawer';

import { set } from 'react-hook-form';

import { pick } from '@react-native-documents/picker';

import RNBlobUtil from 'react-native-blob-util';

import { apiClient, useApiClient } from '../hooks/useApi';

import IntegrationsComponent from '../components/IntegrationsComponent';

import CustomAlert from '../components/CustomAlert';

import { spacing, fontSize, colors as themeColors } from '../utils/LightTheme';

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

  hasButton = false, // <-- NEW PROP

  hasRightArrow = false, // <-- NEW PROP for right arrow

  buttonText = 'Action', // <-- NEW PROP for button label

  switchValue,

  onSwitchChange,

  onPress,

  onButtonPress, // <-- NEW PROP for button action
}) => (
  <TouchableOpacity
    style={styles.settingRow}
    onPress={onPress}
    // Only disable the row touch if it has a Switch, as a button needs its own press handler.

    disabled={hasSwitch}
    activeOpacity={0.7}
  >
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>

      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>

    {/* Dropdown Indicator */}

    {hasDropdown && !hasSwitch && !hasButton && !hasRightArrow && (
      <MaterialIcons
        name="keyboard-arrow-down"
        size={24}
        color={themeColors.grey400}
      />
    )}

    {/* Right Arrow */}

    {hasRightArrow && (
      <MaterialIcons
        name="chevron-right"
        size={24}
        color={themeColors.grey400}
      />
    )}

    {hasSwitch && (
      <Switch
        value={switchValue}
        onValueChange={onSwitchChange}
        trackColor={{ false: themeColors.grey20, true: Colors.primaryBlue }}
        thumbColor={Colors.white}
        ios_backgroundColor={themeColors.grey20}
      />
    )}

    {/* Text Button (Blue Color) */}

    {hasButton && !hasSwitch && (
      <TouchableOpacity onPress={onButtonPress || onPress} activeOpacity={0.8}>
        <Text style={styles.settingButtonText}>{buttonText}</Text>
      </TouchableOpacity>
    )}
  </TouchableOpacity>
);

// Bottom Sheet Modal Component

const BottomSheetModal = ({ visible, onClose, children }) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,

        duration: 300,

        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,

        duration: 300,

        useNativeDriver: false,
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
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

// Days array - moved outside component to prevent recreation on every render

const WEEK_DAYS = [
  'Monday',

  'Tuesday',

  'Wednesday',

  'Thursday',

  'Friday',

  'Saturday',

  'Sunday',
];

// Day Selection Modal Component

const DaySelectionModal = React.memo(
  ({ visible, onClose, selectedDay, onSelectDay }) => {
    const { account } = useActiveAccount();

    const [isSaving, setIsSaving] = useState(false);

    const [tempSelectedDay, setTempSelectedDay] = useState(selectedDay);

    // Reset temporary state when modal opens/closes

    useEffect(() => {
      if (visible) {
        // When modal opens, initialize with current selected day

        setTempSelectedDay(selectedDay);
      } else {
        // When modal closes, reset to original value

        setTempSelectedDay(selectedDay);

        setIsSaving(false);
      }
    }, [visible, selectedDay]);

    // Memoize the day select handler to prevent unnecessary re-renders

    const handleDaySelect = React.useCallback((day: string) => {
      // Only update temporary state, don't save yet

      setTempSelectedDay(day);
    }, []);

    // Memoize confirm handler

    const handleConfirm = React.useCallback(async () => {
      // Only save when Confirm is clicked

      if (tempSelectedDay !== selectedDay) {
        console.log(
          '🔄 Updating start of week from',
          selectedDay,
          'to',
          tempSelectedDay,
        );

        // Update local store (Zustand persist will save to AsyncStorage automatically)

        onSelectDay(tempSelectedDay);

        console.log('✅ Start of week updated in store:', tempSelectedDay);

        // Save to blockchain as background sync

        if (account?.userName) {
          setIsSaving(true);

          blockchainService
            .updateSettings(
              account.userName,

              'startOfWeek',

              [{ key: 'value', value: tempSelectedDay }],
            )
            .then(() => {
              console.log(
                '✅ Start of week synced to blockchain:',
                tempSelectedDay,
              );

              setIsSaving(false);
            })
            .catch(error => {
              console.error(
                '❌ Failed to sync start of week to blockchain (non-critical):',
                error,
              );

              setIsSaving(false);
            });
        }
      } else {
        console.log('ℹ️ Start of week unchanged:', selectedDay);
      }

      onClose();
    }, [tempSelectedDay, selectedDay, account?.userName, onSelectDay, onClose]);

    // Memoize cancel handler

    const handleCancel = React.useCallback(() => {
      // Reset to original value when canceling

      setTempSelectedDay(selectedDay);

      onClose();
    }, [selectedDay, onClose]);

    return (
      <BottomSheetModal visible={visible} onClose={onClose}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Start of the week</Text>
        </View>

        <View style={styles.modalBody}>
          {WEEK_DAYS.map(day => {
            const isSelected = tempSelectedDay === day;

            return (
              <TouchableOpacity
                key={day}
                style={styles.radioOption}
                onPress={() => handleDaySelect(day)}
                activeOpacity={0.7}
                disabled={isSaving}
              >
                <View style={styles.radioButton}>
                  {isSelected && <View style={styles.radioButtonSelected} />}
                </View>

                <Text style={styles.radioText}>{day}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            activeOpacity={0.7}
            disabled={isSaving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmButton, isSaving && { opacity: 0.6 }]}
            onPress={handleConfirm}
            activeOpacity={0.8}
            disabled={isSaving}
          >
            <Text style={styles.confirmButtonText}>
              {isSaving ? 'Saving...' : 'Confirm'}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetModal>
    );
  },
);

// Theme Selection Modal Component

const ThemeSelectionModal = ({
  visible,
  onClose,
  selectedTheme,
  onSelectTheme,
}) => {
  const themes = [
    { id: 'system', label: 'System Default' },

    { id: 'light', label: 'Light mode' },

    { id: 'dark', label: 'Dark mode' },
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
        {themes.map(theme => (
          <TouchableOpacity
            key={theme.id}
            style={styles.radioOption}
            onPress={() => onSelectTheme(theme.id)}
            activeOpacity={0.7}
          >
            <View style={styles.radioButton}>
              {selectedTheme === theme.id && (
                <View style={styles.radioButtonSelected} />
              )}
            </View>

            <Text style={styles.radioText}>{theme.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.modalButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
          activeOpacity={0.8}
        >
          <Text style={styles.confirmButtonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
};

// Time Zone Modal Component

const TimeZoneModal = ({
  visible,
  onClose,
  selectedTimeZone,
  onSelectTimeZone,
}) => {
  const [tempSelectedTimeZone, setTempSelectedTimeZone] =
    useState(selectedTimeZone);

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
        {timeZones.map(timezone => (
          <TouchableOpacity
            key={timezone.id}
            style={styles.radioOption}
            onPress={() => setTempSelectedTimeZone(timezone.id)}
            activeOpacity={0.7}
          >
            <View style={styles.radioButton}>
              {tempSelectedTimeZone === timezone.id && (
                <View style={styles.radioButtonSelected} />
              )}
            </View>

            <Text style={styles.radioText}>{timezone.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.modalButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
          activeOpacity={0.8}
        >
          <Text style={styles.confirmButtonText}>Confirm</Text>
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

  const [alertType, setAlertType] = useState<
    'success' | 'error' | 'warning' | 'info'
  >('info');

  // Helper function to show custom alert

  const showAlert = (
    title: string,

    message: string,

    type: 'success' | 'error' | 'warning' | 'info' = 'info',
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

        const result = await blockchainService.getSettings(
          account?.userName || '',
        );

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

  const getThemeLabel = themeId => {
    const themeMap = {
      system: 'System Default',

      light: 'Light mode',

      dark: 'Dark mode',
    };

    return themeMap[themeId] || 'System Default';
  };

  const getTimeZoneLabel = tzId => {
    const tzMap = {
      ist: '(GMT+05:30) Indian Standard',

      utc: '(GMT+00:00) UTC',

      est: '(GMT-05:00) Eastern Standard',

      pst: '(GMT-08:00) Pacific Standard',
    };

    return tzMap[tzId] || '(GMT+05:30) Indian Standard';
  };

  const handleExportEvents = async () => {
    if (!events || !account) {
      showAlert(
        'Data not ready',
        'Events or account information is missing.',
        'warning',
      );

      return;
    }

    console.log('🗓 Exporting events...');

    try {
      // 1️⃣ Generate the ICS content

      const icsContentArray = await ExportService.exportEvents(events, account);

      const combinedICS = icsContentArray.join('\n\n');

      console.log('ICS data ready.');

      // 2️⃣ Create filename

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .split('T')[0];

      const filename = `${account.userName || account}_${timestamp}.ics`;

      let filePath;

      // 3️⃣ Handle iOS & Android separately

      if (Platform.OS === 'android') {
        const dirs = RNBlobUtil.fs.dirs; // Write to cache first

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

          tempPath,
        );

        // Clean up temp file

        await RNBlobUtil.fs.unlink(tempPath);

        showAlert(
          'Export Successful',
          `Saved to Downloads as:\n${filename}`,
          'success',
        );
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
        const filePath =
          Platform.OS === 'android' && selectedFile.uri.startsWith('content://')
            ? selectedFile.uri
            : selectedFile.uri.replace('file://', '');

        // Read the file as text

        const icalDataString = await RNFS.readFile(filePath, 'utf8');

        console.log('Account user name', account.userName);

        // Parse the file to get all events (before filtering)

        const allParsedEvents = importService.parseIcal(
          icalDataString,
          account,
          [],
        );

        const parsed = importService.parseIcal(icalDataString, account, events);

        console.log('All parsed events:', allParsedEvents);

        console.log('Filtered parsed events:', parsed);

        // Determine the scenario

        const totalEventsInFile =
          allParsedEvents && Array.isArray(allParsedEvents)
            ? allParsedEvents.length
            : 0;

        const newEventsCount =
          parsed && Array.isArray(parsed) ? parsed.length : 0;

        // Case 1: File is invalid or parsing failed

        if (allParsedEvents === null || !Array.isArray(allParsedEvents)) {
          showAlert(
            'Invalid File',

            'The selected file is not a valid calendar file. Please select a valid .ics or .ical file.',

            'error',
          );

          return;
        }

        // Case 2: File has no valid events

        if (totalEventsInFile === 0) {
          showAlert(
            'No Events Found',

            'The selected file does not contain any valid events.',

            'warning',
          );

          return;
        }

        // Case 3: All events already exist (duplicates)

        if (totalEventsInFile > 0 && newEventsCount === 0) {
          showAlert(
            'Events Already Exist',

            `All ${totalEventsInFile} event(s) from the file already exist in your calendar. No new events were imported.`,

            'info',
          );

          return;
        }

        // Case 4: Some or all events are new - proceed with import

        if (newEventsCount > 0) {
          try {
            await blockchainService.saveImportedEvents(
              parsed,
              account.userName,
              token,
              api,
            );

            // Success: Events imported

            showAlert(
              'Import Successful',

              `Successfully imported ${newEventsCount} event(s)${
                totalEventsInFile > newEventsCount
                  ? ` (${
                      totalEventsInFile - newEventsCount
                    } event(s) were skipped as they already exist)`
                  : ''
              }.`,

              'success',
            );
          } catch (saveError) {
            console.error('Error saving imported events:', saveError);

            showAlert(
              'Import Failed',

              'Failed to save the imported events. Please try again or check your connection.',

              'error',
            );
          }
        }
      } catch (err) {
        console.error('Error processing file:', err);

        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error occurred';

        showAlert(
          'Import Error',

          `Failed to import events: ${errorMessage}. Please ensure the file is a valid calendar file and try again.`,

          'error',
        );
      }
    } catch (err) {
      console.error('Error selecting file:', err);

      const errorMessage =
        err instanceof Error ? err.message : 'Failed to access the file';

      showAlert(
        'File Selection Error',

        `Unable to select the file: ${errorMessage}. Please try again.`,

        'error',
      );
    }
  };

  const handleMenuPress = () => {
    setIsDrawerOpen(true);

    console.log('Menu button pressed');
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <PlainHeader onMenuPress={handleMenuPress} title="Settings" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>App settings</Text>
          <View style={styles.card}>
            <SettingRow
              title="Start of the week"
              subtitle={selectedDay}
              hasDropdown={true}
              onPress={() => setShowDayModal(true)}
            />
          </View>
          <View style={[styles.card, { marginTop: spacing.xs }]}>
            <SettingRow
              title="Time Zone"
              subtitle={getTimeZoneLabel(selectedTimeZone)}
              hasDropdown={true}
              onPress={() => setShowTimeZoneModal(true)}
            />
          </View>
        </View>

        {/* Import/Export Events Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Import/Export Events</Text>
          <View style={styles.card}>
            <SettingRow
              title="Export Events"
              subtitle="You can download all calendars you can view and modify in a single file."
              buttonText="Export"
              hasButton={true}
              onButtonPress={handleExportEvents}
            />
          </View>
          <View style={[styles.card, { marginTop: spacing.xs }]}>
            <SettingRow
              title="Import Events"
              subtitle="You can import all events from a single .ical/.ics file."
              buttonText="Import"
              hasButton={true}
              onButtonPress={handleImportEvents}
            />
          </View>
        </View>

        {/* Integrations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Integrations</Text>
          <IntegrationsComponent initialExpanded={false} />
        </View>

        {/* About DCalendar Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>About DCalendar</Text>
          <View style={styles.card}>
            <SettingRow
              title="About app"
              hasRightArrow={true}
              onPress={() => {}}
            />
          </View>
          <View style={[styles.card, { marginTop: spacing.xs }]}>
            <SettingRow
              title="Contact us"
              hasRightArrow={true}
              onPress={() => {}}
            />
          </View>
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
      <CustomDrawer isOpen={isDrawerOpen} onClose={handleDrawerClose} />

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

    backgroundColor: '#F5F5F5',
  },

  header: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    paddingHorizontal: spacing.md,

    paddingVertical: spacing.sm,

    backgroundColor: Colors.white,

    borderBottomWidth: 1,

    borderBottomColor: themeColors.grey20,
  },

  headerLeft: {
    flexDirection: 'row',

    alignItems: 'center',
  },

  headerTitle: {
    fontSize: fontSize.textSize18,

    fontWeight: '600',

    marginLeft: scaleWidth(12),

    color: Colors.black,

    fontFamily: Fonts.latoBold,
  },

  content: {
    flex: 1,

    backgroundColor: 'transparent',

    paddingTop: spacing.sm,
  },

  scrollContent: {
    paddingHorizontal: spacing.md,

    paddingBottom: spacing.lg,
  },

  section: {
    marginBottom: spacing.md,
  },

  sectionLabel: {
    fontSize: fontSize.textSize12,

    color: themeColors.grey400,

    textTransform: 'capitalize',

    marginBottom: spacing.xs,

    fontFamily: Fonts.latoRegular,
  },

  card: {
    backgroundColor: Colors.white,

    borderRadius: 12,

    overflow: 'hidden',

    borderWidth: 1,

    borderColor: themeColors.grey20,
  },

  rowDivider: {
    height: 1,

    backgroundColor: themeColors.grey20,

    marginLeft: spacing.md,
  },

  rowSpacer: {
    height: spacing.sm,
  },

  settingRow: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    backgroundColor: Colors.white,

    paddingHorizontal: spacing.md,

    paddingVertical: scaleHeight(16),
  },

  settingContent: {
    flex: 1,
  },

  settingTitle: {
    fontSize: fontSize.textSize14,

    color: Colors.black,

    fontWeight: '400',

    fontFamily: Fonts.latoRegular,
  },

  settingSubtitle: {
    fontSize: fontSize.textSize12,

    color: themeColors.grey400,

    marginTop: scaleHeight(2),

    fontFamily: Fonts.latoRegular,
  },

  settingButtonText: {
    color: Colors.primaryBlue,

    fontSize: fontSize.textSize14,

    fontWeight: '700',

    fontFamily: Fonts.latoBold,
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
    backgroundColor: Colors.white,

    borderTopLeftRadius: moderateScale(16),

    borderTopRightRadius: moderateScale(16),

    maxHeight: SCREEN_HEIGHT * 0.7,

    paddingBottom: Platform.OS === 'ios' ? scaleHeight(20) : 0,

    width: '100%',
    alignSelf: 'center',
  },

  modalHeader: {
    paddingHorizontal: moderateScale(20),

    paddingTop: scaleHeight(20),

    paddingBottom: scaleHeight(16),

    borderBottomWidth: 1,

    borderBottomColor: themeColors.grey20,
  },

  modalTitle: {
    fontSize: fontSize.textSize20,

    fontWeight: '600',

    color: Colors.black,

    fontFamily: Fonts.latoBold,
  },

  modalBody: {
    paddingVertical: scaleHeight(8),
  },

  radioOption: {
    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: moderateScale(20),

    paddingVertical: scaleHeight(14),

    minHeight: scaleHeight(48), // Minimum touch target size
  },

  radioButton: {
    width: moderateScale(22),

    height: moderateScale(22),

    borderRadius: moderateScale(11),

    borderWidth: 2,

    borderColor: Colors.primaryBlue,

    marginRight: moderateScale(14),

    alignItems: 'center',

    justifyContent: 'center',
  },

  radioButtonSelected: {
    width: moderateScale(12),

    height: moderateScale(12),

    borderRadius: moderateScale(6),

    backgroundColor: Colors.primaryBlue,
  },

  radioText: {
    fontSize: fontSize.textSize14,

    color: Colors.black,

    flex: 1,

    fontFamily: Fonts.latoRegular,
  },

  modalButtons: {
    flexDirection: 'row',

    borderTopWidth: 1,

    borderTopColor: themeColors.grey20,

    minHeight: scaleHeight(56),

    width: '100%',
  },

  cancelButton: {
    flex: 1,

    paddingVertical: scaleHeight(18),

    alignItems: 'center',

    justifyContent: 'center',

    borderRightWidth: 1,

    borderRightColor: themeColors.grey20,

    minHeight: scaleHeight(56),

    backgroundColor: Colors.white,
  },

  confirmButton: {
    flex: 1,

    paddingVertical: scaleHeight(18),

    alignItems: 'center',

    justifyContent: 'center',

    minHeight: scaleHeight(56),

    backgroundColor: Colors.primaryBlue,
  },

  cancelButtonText: {
    fontSize: fontSize.textSize16,

    color: Colors.black,

    fontWeight: '500',

    fontFamily: Fonts.latoMedium,
  },

  confirmButtonText: {
    fontSize: fontSize.textSize16,

    color: Colors.white,

    fontWeight: '600',

    fontFamily: Fonts.latoBold,
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
    borderRadius: 32,
  },

  titleStyle: {
    fontFamily: Fonts.semiBold,

    fontSize: 16,

    color: Colors.white,

    textAlignVertical: 'center',
  },
});

export default SettingsScreen;
