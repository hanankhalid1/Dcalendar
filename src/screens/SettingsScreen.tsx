import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';

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
  ActivityIndicator,
  TextInput,
  FlatList,
} from 'react-native';

import Share from 'react-native-share';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { useRoute, useNavigation } from '@react-navigation/native';

import Header from '../components/Header';

import { Fonts } from '../constants/Fonts';

import { Colors } from '../constants/Colors';

import { useSettingsStore } from '../stores/useSetting';

import { Screen } from '../navigations/appNavigation.type';

import { BlockchainService } from '../services/BlockChainService';

import WeekHeader from '../components/WeekHeader';

import { ExportService } from '../services/ExportService';

import { ImportService } from '../services/ImportService';

import { useEventsStore } from '../stores/useEventsStore';

import { useToken } from '../stores/useTokenStore';

import { useActiveAccount } from '../stores/useActiveAccount';

import AsyncStorage from '@react-native-async-storage/async-storage';

import LogoutConfirmModal from '../components/LogoutConfirmModal';

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
import { generateEventUID } from '../utils/eventUtils';
import { getTimezoneArray, getTimezoneLabel } from '../constants/timezones';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 600;
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

// Extract scaling functions

const moderateScale = DimensionsUtils.moderateScale;

const scaleHeight = DimensionsUtils.scaleHeight;

const scaleWidth = DimensionsUtils.scaleWidth;

const blockchainService = new BlockchainService();

// Setting Row Component

interface SettingRowProps {
  title: string;
  subtitle?: string;
  hasDropdown?: boolean;
  hasSwitch?: boolean;
  hasButton?: boolean;
  hasRightArrow?: boolean;
  buttonText?: string;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  onPress?: () => void;
  onButtonPress?: () => void;
}

const SettingRow = ({
  title,
  subtitle,
  hasDropdown = false,
  hasSwitch = false,
  hasButton = false,
  hasRightArrow = false,
  buttonText = 'Action',
  switchValue,
  onSwitchChange,
  onPress,
  onButtonPress,
}: SettingRowProps) => (
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

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const BottomSheetModal = ({ visible, onClose, children }: BottomSheetModalProps) => {
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

interface DaySelectionModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDay: string;
  onSelectDay: (day: string) => void;
}

const DaySelectionModal = React.memo(
  ({ visible, onClose, selectedDay, onSelectDay }: DaySelectionModalProps) => {
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

interface ThemeSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  selectedTheme: string;
  onSelectTheme: (theme: 'system' | 'light' | 'dark') => void;
}

const ThemeSelectionModal = ({
  visible,
  onClose,
  selectedTheme,
  onSelectTheme,
}: ThemeSelectionModalProps) => {
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
            onPress={() => onSelectTheme(theme.id as 'system' | 'light' | 'dark')}
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

interface TimeZoneModalProps {
  visible: boolean;
  onClose: () => void;
  selectedTimeZone: string;
  onSelectTimeZone: (timeZone: string) => void;
}

const TimeZoneModal = ({
  visible,
  onClose,
  selectedTimeZone,
  onSelectTimeZone,
}: TimeZoneModalProps) => {
  const [tempSelectedTimeZone, setTempSelectedTimeZone] =
    useState(selectedTimeZone);
  const [searchQuery, setSearchQuery] = useState('');

  const allTimeZones = useMemo(() => getTimezoneArray(), []);

  const filteredTimeZones = useMemo(() => {
    if (!searchQuery.trim()) {
      return allTimeZones;
    }
    const query = searchQuery.toLowerCase();
    return allTimeZones.filter(tz => 
      tz.label.toLowerCase().includes(query) || 
      tz.id.toLowerCase().includes(query)
    );
  }, [searchQuery, allTimeZones]);

  // Reset temp state when modal opens or selectedTimeZone changes
  useEffect(() => {
    if (visible) {
      setTempSelectedTimeZone(selectedTimeZone);
      setSearchQuery('');
    }
  }, [visible, selectedTimeZone]);

  const handleConfirm = () => {
    onSelectTimeZone(tempSelectedTimeZone);
    onClose();
  };

  const handleCancel = () => {
    // Reset to original value
    setTempSelectedTimeZone(selectedTimeZone);
    setSearchQuery('');
    onClose();
  };

  const renderTimezoneItem = useCallback(
    ({ item }: { item: any }) => (
      <TouchableOpacity
        style={[
          styles.timezoneOption,
          tempSelectedTimeZone === item.id && styles.timezoneOptionSelected,
        ]}
        onPress={() => setTempSelectedTimeZone(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.radioButton}>
          {tempSelectedTimeZone === item.id && (
            <View style={styles.radioButtonSelected} />
          )}
        </View>
        <View style={styles.timezoneTextContainer}>
          <Text style={styles.timezoneId}>{item.id}</Text>
          <Text style={styles.timezoneLabel}>{item.label}</Text>
        </View>
      </TouchableOpacity>
    ),
    [tempSelectedTimeZone],
  );

  return (
    <BottomSheetModal visible={visible} onClose={handleCancel}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Select Time Zone</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <MaterialIcons
          name="search"
          size={20}
          color={Colors.grey}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search timezones..."
          placeholderTextColor={Colors.grey}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons
              name="close"
              size={20}
              color={Colors.grey}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Timezone List */}
      <ScrollView 
        style={styles.modalBody} 
        scrollEnabled={true} 
        nestedScrollEnabled={true}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {filteredTimeZones.length > 0 ? (
          filteredTimeZones.map((item) => renderTimezoneItem({ item }))
        ) : (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No timezones found</Text>
          </View>
        )}
      </ScrollView>

      {/* Buttons */}
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
  const navigation = useNavigation<any>();

  const { expandIntegration } = route.params || {};

  const [showDayModal, setShowDayModal] = useState(false);

  const [showThemeModal, setShowThemeModal] = useState(false);

  const [showTimeZoneModal, setShowTimeZoneModal] = useState(false);

  const [settings, setSettings] = useState<any[]>([]);

  const { userEvents: events, clearAllEventsData } = useEventsStore();

  const { account, setAccount } = useActiveAccount();

  const { clearToken } = useToken();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // Custom Alert State

  const [alertVisible, setAlertVisible] = useState(false);

  const [alertTitle, setAlertTitle] = useState('');

  const [alertMessage, setAlertMessage] = useState('');

  const [alertType, setAlertType] = useState<
    'success' | 'error' | 'warning' | 'info'
  >('info');

  // Import Events Loading State

  const [isImporting, setIsImporting] = useState(false);

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

  // Logout handler with confirmation
  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    try {
      setLogoutModalVisible(false);
      console.log('🚪 Logging out user...');

      // Clear events data
      await clearAllEventsData();

      // Clear all state stores - these will persist the cleared state to AsyncStorage
      setAccount(null);
      clearToken();

      // Clear all AsyncStorage data to ensure clean logout
      await AsyncStorage.clear();

      console.log('✅ Logout complete, navigating to WalletScreen');

      // Reset navigation stack to WalletScreen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Wallet' }],
      });
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

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

  const getThemeLabel = (themeId: string): string => {
    const themeMap: Record<string, string> = {
      system: 'System Default',
      light: 'Light mode',
      dark: 'Dark mode',
    };
    return themeMap[themeId] || 'System Default';
  };

  const getTimeZoneLabelLocal = (tzId: string) => {
    return getTimezoneLabel(tzId) || tzId;
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

    try {
      // 1️⃣ Generate the ICS content

      const icsContentArray = await ExportService.exportEvents(events, account);

      const combinedICS = icsContentArray.join('\n\n');

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
        return;
      }

      const selectedFile = results[0];

      try {
        const filePath =
          Platform.OS === 'android' && selectedFile.uri.startsWith('content://')
            ? selectedFile.uri
            : selectedFile.uri.replace('file://', '');

        // Show loading indicator

        setIsImporting(true);

        // Read the file as text
        const icalDataString = await RNFS.readFile(filePath, 'utf8');

        // Parse the file only once
        const allParsedEvents = importService.parseIcal(
          icalDataString,
          account,
        );

        // Filter out duplicates (events already in the store) in a single pass
        // Check by UID first (most reliable), then by title+fromTime combination
        const parsed =
          allParsedEvents?.filter(
            event =>
              !events.some(
                existingEvent =>
                  // Match by UID (primary check)
                  (event.uid &&
                    existingEvent.uid &&
                    existingEvent.uid === event.uid) ||
                  // Match by title + fromTime (fallback for events without UID)
                  (existingEvent.title === event.title &&
                    existingEvent.fromTime === event.fromTime),
              ),
          ) || [];

        console.log('Imported events are here:', parsed);

        // Determine the scenario

        const totalEventsInFile =
          allParsedEvents && Array.isArray(allParsedEvents)
            ? allParsedEvents.length
            : 0;

        const newEventsCount = Array.isArray(parsed) ? parsed.length : 0;

        // Case 1: File is invalid or parsing failed

        if (allParsedEvents === null || !Array.isArray(allParsedEvents)) {
          setIsImporting(false);

          showAlert(
            'Invalid File',

            'The selected file is not a valid calendar file. Please select a valid .ics or .ical file.',

            'error',
          );

          return;
        }

        // Case 2: File has no valid events

        if (totalEventsInFile === 0) {
          setIsImporting(false);

          showAlert(
            'No Events Found',

            'The selected file does not contain any valid events.',

            'warning',
          );

          return;
        }

        // Case 3: All events already exist (duplicates)

        if (totalEventsInFile > 0 && newEventsCount === 0) {
          setIsImporting(false);

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
            // ⚡ Immediately add events to local store for instant UI feedback
            // Ensure each imported event has a unique uid to avoid dedupe conflicts
            const { optimisticallyAddEvent } = useEventsStore.getState();
            parsed?.forEach(evt => {
              const safeEvent = {
                ...evt,
                uid: evt?.uid ?? generateEventUID(),
              };
              optimisticallyAddEvent(safeEvent as any);
            });

            // Hide loading and show success immediately (blockchain save happens in background)
            setIsImporting(false);

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

            // ⚡ Save to blockchain in background (non-blocking)
            blockchainService
              .saveImportedEvents(parsed, account.userName, token, api)
              .catch(error => {
                console.error('Background blockchain save failed:', error);
                // Events are already in local store, so this is just a sync issue
              });
          } catch (saveError) {
            setIsImporting(false);

            showAlert(
              'Import Failed',

              'Failed to save the imported events. Please try again or check your connection.',

              'error',
            );
          }
        }
      } catch (err) {
        setIsImporting(false);

        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error occurred';

        showAlert(
          'Import Error',

          `Failed to import events: ${errorMessage}. Please ensure the file is a valid calendar file and try again.`,

          'error',
        );
      }
    } catch (err) {
      setIsImporting(false);

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
              subtitle={getTimeZoneLabelLocal(selectedTimeZone)}
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
          <IntegrationsComponent
            initialExpanded={expandIntegration || false}
            onIntegrationSuccess={() => {
              // Navigate back to CreateEventScreen after successful integration
              if (expandIntegration) {
                navigation.goBack();
              }
            }}
          />
        </View>

        {/* About DCalendar Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>About DCalendar</Text>
          <View style={styles.card}>
            <SettingRow
              title="About app"
              hasRightArrow={true}
              onPress={() => navigation.navigate(Screen.AboutAppScreen)}
            />
          </View>
          <View style={[styles.card, { marginTop: spacing.xs }]}>
            <TouchableOpacity
              style={styles.logoutRow}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Text style={styles.logoutText}>Log out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        visible={logoutModalVisible}
        onCancel={() => setLogoutModalVisible(false)}
        onConfirm={confirmLogout}
      />

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

      {/* Import Loading Modal */}
      <Modal
        visible={isImporting}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: Colors.white,
              borderRadius: 16,
              padding: scaleHeight(30),
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: scaleWidth(200),
            }}
          >
            <ActivityIndicator
              size="large"
              color={Colors.primaryBlue}
              style={{ marginBottom: scaleHeight(16) }}
            />
            <Text
              style={{
                fontSize: fontSize.textSize16,
                fontWeight: '600',
                color: Colors.black,
                fontFamily: Fonts.latoBold,
              }}
            >
              Importing Events...
            </Text>
          </View>
        </View>
      </Modal>
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

    paddingHorizontal: getTabletSafeDimension(spacing.md, 14, spacing.lg),

    paddingVertical: getTabletSafeDimension(spacing.sm, spacing.xs, spacing.sm),

    backgroundColor: Colors.white,

    borderBottomWidth: 1,

    borderBottomColor: themeColors.grey20,
  },

  headerLeft: {
    flexDirection: 'row',

    alignItems: 'center',
  },

  headerTitle: {
    fontSize: getTabletSafeDimension(fontSize.textSize18, 20, 24),

    fontWeight: '600',

    marginLeft: getTabletSafeDimension(scaleWidth(12), 10, 14),

    color: Colors.black,

    fontFamily: Fonts.latoBold,
  },

  content: {
    flex: 1,

    backgroundColor: 'transparent',

    paddingTop: getTabletSafeDimension(spacing.sm, spacing.xs, spacing.sm),
  },

  scrollContent: {
    paddingHorizontal: getTabletSafeDimension(spacing.md, 14, spacing.lg),

    paddingBottom: getTabletSafeDimension(spacing.lg, spacing.md, spacing.lg),
  },

  section: {
    marginBottom: spacing.md,
  },

  sectionLabel: {
    fontSize: getTabletSafeDimension(fontSize.textSize12, 15, 17),

    color: themeColors.grey400,

    textTransform: 'capitalize',

    marginBottom: spacing.xs,

    fontFamily: Fonts.latoRegular,
  },

  card: {
    backgroundColor: Colors.white,

    borderRadius: getTabletSafeDimension(12, 10, 12),

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

    paddingHorizontal: getTabletSafeDimension(spacing.md, 14, spacing.lg),

    paddingVertical: getTabletSafeDimension(scaleHeight(16), 12, 18),
  },

  settingContent: {
    flex: 1,
  },

  settingTitle: {
    fontSize: getTabletSafeDimension(fontSize.textSize14, 16, 18),

    color: Colors.black,

    fontWeight: '400',

    fontFamily: Fonts.latoRegular,
  },

  settingSubtitle: {
    fontSize: getTabletSafeDimension(fontSize.textSize12, 14, 15),

    color: themeColors.grey400,

    marginTop: scaleHeight(2),

    fontFamily: Fonts.latoRegular,
  },

  settingButtonText: {
    color: Colors.primaryBlue,

    fontSize: getTabletSafeDimension(fontSize.textSize14, 16, 18),

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

    maxHeight: SCREEN_HEIGHT * 0.85,

    paddingBottom: Platform.OS === 'ios' ? scaleHeight(20) : 0,

    width: '100%',
    alignSelf: 'center',
    flexDirection: 'column',
  },

  modalHeader: {
    paddingHorizontal: getTabletSafeDimension(moderateScale(20), 16, 22),

    paddingTop: getTabletSafeDimension(scaleHeight(20), 16, 22),

    paddingBottom: getTabletSafeDimension(scaleHeight(16), 12, 18),

    borderBottomWidth: 1,

    borderBottomColor: themeColors.grey20,
  },

  modalTitle: {
    fontSize: getTabletSafeDimension(fontSize.textSize20, 20, 22),

    fontWeight: '600',

    color: Colors.black,

    fontFamily: Fonts.latoBold,
  },

  modalBody: {
    maxHeight: SCREEN_HEIGHT * 0.45,
    flexGrow: 0,
  },

  radioOption: {
    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: getTabletSafeDimension(moderateScale(20), 16, 22),

    paddingVertical: getTabletSafeDimension(scaleHeight(14), 12, 16),

    minHeight: getTabletSafeDimension(scaleHeight(48), 44, 52), // Minimum touch target size
  },

  radioButton: {
    width: getTabletSafeDimension(moderateScale(22), 18, 24),

    height: getTabletSafeDimension(moderateScale(22), 18, 24),

    borderRadius: getTabletSafeDimension(moderateScale(11), 9, 12),

    borderWidth: 2,

    borderColor: Colors.primaryBlue,

    marginRight: getTabletSafeDimension(moderateScale(14), 12, 16),

    alignItems: 'center',

    justifyContent: 'center',
  },

  radioButtonSelected: {
    width: getTabletSafeDimension(moderateScale(12), 10, 14),

    height: getTabletSafeDimension(moderateScale(12), 10, 14),

    borderRadius: getTabletSafeDimension(moderateScale(6), 5, 7),

    backgroundColor: Colors.primaryBlue,
  },

  radioText: {
    fontSize: getTabletSafeDimension(fontSize.textSize14, 16, 18),

    color: Colors.black,

    flex: 1,

    fontFamily: Fonts.latoRegular,
  },

  modalButtons: {
    flexDirection: 'row',

    borderTopWidth: 1,

    borderTopColor: themeColors.grey20,

    minHeight: getTabletSafeDimension(scaleHeight(56), 50, 60),

    width: '100%',
  },

  cancelButton: {
    flex: 1,

    paddingVertical: getTabletSafeDimension(scaleHeight(18), 14, 20),

    alignItems: 'center',

    justifyContent: 'center',

    borderRightWidth: 1,

    borderRightColor: themeColors.grey20,

    minHeight: getTabletSafeDimension(scaleHeight(56), 50, 60),

    backgroundColor: Colors.white,
  },

  confirmButton: {
    flex: 1,

    paddingVertical: getTabletSafeDimension(scaleHeight(18), 14, 20),

    alignItems: 'center',

    justifyContent: 'center',

    minHeight: getTabletSafeDimension(scaleHeight(56), 50, 60),

    backgroundColor: Colors.primaryBlue,
  },

  cancelButtonText: {
    fontSize: getTabletSafeDimension(fontSize.textSize16, 16, 18),

    color: Colors.black,

    fontWeight: '500',

    fontFamily: Fonts.latoMedium,
  },

  confirmButtonText: {
    fontSize: getTabletSafeDimension(fontSize.textSize16, 16, 18),

    color: Colors.white,

    fontWeight: '600',

    fontFamily: Fonts.latoBold,
  },

  containerStyle: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: getTabletSafeDimension(12, 10, 14),

    paddingTop: getTabletSafeDimension(13, 11, 15),

    paddingBottom: getTabletSafeDimension(13, 11, 15),

    paddingHorizontal: getTabletSafeDimension(20, 16, 22),

    borderRadius: 32,
  },

  boxStyle: {
    borderRadius: 32,
  },

  titleStyle: {
    fontFamily: Fonts.semiBold,

    fontSize: getTabletSafeDimension(16, 18, 20),

    color: Colors.white,

    textAlignVertical: 'center',
  },

  logoutRow: {
    paddingVertical: getTabletSafeDimension(scaleHeight(16), 12, 18),
    paddingHorizontal: getTabletSafeDimension(scaleWidth(20), 16, 22),
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoutText: {
    fontSize: getTabletSafeDimension(fontSize.textSize16, 16, 18),
    color: '#FF3B30', // Red color for logout
    fontFamily: Fonts.regular,
    fontWeight: '400',
  },

  // Timezone Modal Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getTabletSafeDimension(moderateScale(20), 16, 22),
    paddingVertical: getTabletSafeDimension(scaleHeight(12), 10, 14),
    backgroundColor: themeColors.grey100,
    marginHorizontal: getTabletSafeDimension(moderateScale(20), 16, 22),
    marginVertical: getTabletSafeDimension(scaleHeight(12), 10, 14),
    borderRadius: moderateScale(8),
  },

  searchIcon: {
    marginRight: getTabletSafeDimension(moderateScale(10), 8, 12),
  },

  searchInput: {
    flex: 1,
    fontSize: getTabletSafeDimension(fontSize.textSize14, 14, 16),
    color: Colors.black,
    fontFamily: Fonts.latoRegular,
    padding: 0,
  },

  timezoneOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getTabletSafeDimension(moderateScale(20), 16, 22),
    paddingVertical: getTabletSafeDimension(scaleHeight(12), 10, 14),
    minHeight: getTabletSafeDimension(scaleHeight(48), 44, 52),
  },

  timezoneOptionSelected: {
    backgroundColor: themeColors.grey100,
  },

  timezoneTextContainer: {
    flex: 1,
    marginLeft: getTabletSafeDimension(moderateScale(14), 12, 16),
  },

  timezoneId: {
    fontSize: getTabletSafeDimension(fontSize.textSize14, 14, 16),
    color: Colors.black,
    fontWeight: '500',
    fontFamily: Fonts.latoMedium,
  },

  timezoneLabel: {
    fontSize: getTabletSafeDimension(fontSize.textSize12, 12, 14),
    color: themeColors.grey400,
    marginTop: scaleHeight(2),
    fontFamily: Fonts.latoRegular,
  },

  noResultsContainer: {
    paddingVertical: getTabletSafeDimension(scaleHeight(40), 30, 50),
    alignItems: 'center',
    justifyContent: 'center',
  },

  noResultsText: {
    fontSize: getTabletSafeDimension(fontSize.textSize14, 14, 16),
    color: themeColors.grey400,
    fontFamily: Fonts.latoRegular,
  },
});

export default SettingsScreen;
