import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { moderateScale, scaleHeight, scaleWidth } from '../utils/dimensions';
import {
  colors,
  fontSize,
  spacing,
  borderRadius,
  shadows,
} from '../utils/LightTheme';

import { BlockchainService } from '../services/BlockChainService';
import { useActiveAccount } from '../stores/useActiveAccount';
import { useToken } from '../stores/useTokenStore';
import { AppNavigationProp } from '../navigations/appNavigation.type';
import CalendarWithTime from '../components/CalendarWithTime';
import GradientText from '../components/home/GradientText';
import { Colors } from '../constants/Colors';

const CreateOutOfOfficeScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const activeAccount = useActiveAccount(state => state.account);
  const token = useToken(state => state.token);

  // Initialize blockchain service and get contract instance
  const blockchainService = React.useMemo(() => new BlockchainService(), []);
  const contractInstance = blockchainService.calendarContract;

  // UI State
  const [showCalendarModal, setShowCalendarModal] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedStartTime, setSelectedStartTime] = React.useState<string>('');
  const [selectedEndTime, setSelectedEndTime] = React.useState<string>('');
  const [showDetailedDateTime, setShowDetailedDateTime] = React.useState(false);
  const [showEventTypeDropdown, setShowEventTypeDropdown] =
    React.useState(false);
  const [selectedEventType, setSelectedEventType] =
    React.useState('Out of office');
  const [isLoading, setIsLoading] = React.useState(false);

  // Form State
  const [title, setTitle] = React.useState('Out of office');
  const [description, setDescription] = React.useState(
    'Declined because I am out of office',
  );
  const [declineMeetings, setDeclineMeetings] = React.useState(true);
  const [declineOption, setDeclineOption] = React.useState('new'); // 'new' or 'all'

  // Constants for decline options
  const DECLINE_OPTIONS = {
    NEW: 'new',
    ALL: 'all',
  } as const;
  const [visibility, setVisibility] = React.useState('public');

  // Event type options
  const eventTypes = [
    { id: '1', name: 'Event', icon: '✓' },
    { id: '2', name: 'Task', icon: '' },
    { id: '3', name: 'Out of office', icon: '' },
    { id: '4', name: 'Birthday', icon: '' },
    { id: '5', name: 'Working Location', icon: '' },
  ];

  const handleEventTypeSelect = (eventType: string) => {
    setSelectedEventType(eventType);
    setShowEventTypeDropdown(false);

    // Navigate to corresponding screen
    if (eventType === 'Event') {
      navigation.navigate('CreateEventScreen');
    } else if (eventType === 'Task') {
      navigation.navigate('CreateTaskScreen');
    } else if (eventType === 'Out of office') {
      // Stay on current screen
      return;
    }
    // Add navigation for other event types as needed
  };

  const handleDateTimeSelect = (
    date: Date,
    startTime: string,
    endTime: string,
  ) => {
    setSelectedDate(date);
    setSelectedStartTime(startTime);
    setSelectedEndTime(endTime);
    setShowDetailedDateTime(true);
  };

  const formatSelectedDateTime = () => {
    if (!selectedDate) return 'Pick date and time';

    const dateStr = selectedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return `${dateStr} • ${selectedStartTime} - ${selectedEndTime}`;
  };

  const handleClose = () => {
    navigation.goBack();
  };

  // Form validation
  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for the event');
      return false;
    }
    if (!selectedDate) {
      Alert.alert('Error', 'Please select a date for the event');
      return false;
    }
    if (!selectedStartTime) {
      Alert.alert('Error', 'Please select a start time for the event');
      return false;
    }
    if (!selectedEndTime) {
      Alert.alert('Error', 'Please select an end time for the event');
      return false;
    }
    if (!activeAccount) {
      Alert.alert('Error', 'No active account found. Please log in again.');
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSaveEvent = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Convert date and time to ISO 8601 format
      const formatToISO8601 = (date: Date, time: string): string => {
        const [hours, minutes] = time.split(':');
        const newDate = new Date(date);
        newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        return newDate.toISOString();
      };

      // Prepare event data
      const eventData: Event = {
        uid: '',
        title: title.trim(),
        description: description.trim(),
        fromTime: formatToISO8601(selectedDate!, selectedStartTime),
        toTime: formatToISO8601(selectedDate!, selectedEndTime),
        organizer:
          activeAccount?.email ||
          activeAccount?.userName ||
          activeAccount?.address ||
          '',
        guests: [],
        location: '',
        locationType: 'inperson',
        busy: 'Busy',
        visibility: 'Default Visibility',
        notification: 'Email',
        guest_permission: 'Modify event',
        seconds: 0,
        trigger: 'PT0M',
        timezone: 'UTC',
        repeatEvent: undefined,
        customRepeatEvent: undefined,
        list: [],
      };

      console.log('Creating out of office event with data:', eventData);

     
    } catch (error: any) {
      console.error('Error creating event:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to create event. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Invisible overlay to close dropdowns when clicking outside */}
      {showEventTypeDropdown && (
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowEventTypeDropdown(false);
          }}
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Create </Text>
          <TouchableOpacity
            style={styles.eventTypeContainer}
            onPress={() => setShowEventTypeDropdown(!showEventTypeDropdown)}
          >
            <GradientText
              style={styles.eventTypeText}
              colors={[Colors.primaryGreen, Colors.primaryblue]}
            >
              {selectedEventType}
            </GradientText>
            <Image
              style={styles.arrowDropdown}
              source={require('../assets/images/CreateEventImages/arrowDropdown.png')}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Event Type Dropdown */}
      {showEventTypeDropdown && (
        <View style={styles.eventTypeDropdown}>
          {eventTypes.map(eventType => (
            <TouchableOpacity
              key={eventType.id}
              style={styles.eventTypeItem}
              onPress={() => handleEventTypeSelect(eventType.name)}
            >
              <Text style={styles.eventTypeItemText}>{eventType.name}</Text>
              {selectedEventType === eventType.name && (
                <LinearGradient
                  colors={['#18F06E', '#0B6DE0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.eventTypeCheckmark}
                >
                  <FeatherIcon name="check" size={12} color="white" />
                </LinearGradient>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title Input */}
        <View style={styles.inputSection}>
          <TextInput
            style={styles.titleInput}
            placeholder="Out of office"
            placeholderTextColor={colors.grey400}
            value={title}
            onChangeText={setTitle}
          />
          <View style={styles.inputUnderline} />
        </View>

        {/* Pick date and time */}
        <TouchableOpacity
          style={styles.selectorItem}
          onPress={() => setShowCalendarModal(true)}
        >
          <FeatherIcon name="calendar" size={20} color="#6C6C6C" />
          <Text style={styles.selectorText}>{formatSelectedDateTime()}</Text>
          <Image
            style={styles.smallArrowDropdown}
            source={require('../assets/images/CreateEventImages/smallArrowDropdown.png')}
          />
        </TouchableOpacity>

        {/* Automatically decline meetings checkbox */}
        <View style={styles.checkboxSection}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setDeclineMeetings(!declineMeetings)}
          >
            <View style={styles.checkboxContainer}>
              {declineMeetings ? (
                <LinearGradient
                  colors={['#18F06E', '#0B6DE0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.checkboxGradient}
                >
                  <FeatherIcon name="check" size={12} color="white" />
                </LinearGradient>
              ) : (
                <View style={styles.checkboxEmpty} />
              )}
            </View>
            <Text style={styles.checkboxText}>
              Automatically decline meetings
            </Text>
          </TouchableOpacity>

          {/* Radio button options - only show when checkbox is checked */}
          {declineMeetings && (
            <View style={styles.radioOptions}>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setDeclineOption(DECLINE_OPTIONS.NEW)}
              >
                <View style={styles.radioContainer}>
                  {declineOption === DECLINE_OPTIONS.NEW ? (
                    <LinearGradient
                      colors={['#18F06E', '#0B6DE0']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.checkboxGradient}
                    >
                      <View style={styles.radioSelected} />
                    </LinearGradient>
                  ) : (
                    <View style={styles.radioEmpty} />
                  )}
                </View>
                <Text style={styles.radioText}>
                  Only new meeting invitations
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setDeclineOption(DECLINE_OPTIONS.ALL)}
              >
                <View style={styles.radioContainer}>
                  {declineOption === DECLINE_OPTIONS.ALL ? (
                    <LinearGradient
                      colors={['#18F06E', '#0B6DE0']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.checkboxGradient}
                    >
                      <View style={styles.radioSelected} />
                    </LinearGradient>
                  ) : (
                    <View style={styles.radioEmpty} />
                  )}
                </View>
                <Text style={styles.radioText}>New and existing meetings</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Message Section */}
        <View style={styles.messageSection}>
          <Text style={styles.messageLabel}>Message</Text>
          <View style={styles.messageInputContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Declined because I am out of office"
              placeholderTextColor={colors.grey400}
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </View>

        {/* Visibility Dropdown */}
        <View style={styles.visibilitySection}>
          <FeatherIcon name="eye" size={20} color="#6C6C6C" />
          <TouchableOpacity style={styles.visibilityDropdown}>
            <Text style={styles.visibilityText}>Public</Text>
            <FeatherIcon name="chevron-down" size={16} color="#6C6C6C" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSaveEvent}
          disabled={isLoading}
        >
          <LinearGradient
            colors={isLoading ? ['#CCCCCC', '#AAAAAA'] : ['#18F06E', '#0B6DE0']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradient}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.saveButtonText}>Creating...</Text>
              </View>
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Calendar with Time Modal */}
      <CalendarWithTime
        isVisible={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        onDateTimeSelect={handleDateTimeSelect}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: scaleHeight(40),
    paddingBottom: spacing.lg,
    width: '100%',
    position: 'relative',
    paddingLeft: scaleWidth(10),
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.textSize25,
    color: colors.blackText,
    fontWeight: '600',
  },
  eventTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: scaleWidth(5),
  },
  eventTypeText: {
    fontSize: fontSize.textSize25,
    fontWeight: '600',
    marginRight: scaleWidth(8),
  },
  eventTypeDropdown: {
    position: 'absolute',
    top: scaleHeight(100),
    left: scaleWidth(166),
    width: scaleWidth(138),
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F5F5F5',
    shadowColor: '#0A0D12',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 1000,
    paddingVertical: scaleHeight(8),
  },
  eventTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    minHeight: scaleHeight(44),
  },
  eventTypeItemText: {
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    fontWeight: '400',
    flex: 1,
  },
  eventTypeCheckmark: {
    width: scaleWidth(16),
    height: scaleHeight(16),
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: fontSize.textSize17,
    color: colors.blackText,
    fontWeight: 'bold',
  },
  arrowDropdown: {
    height: scaleHeight(10.96),
    width: scaleWidth(16.16),
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  inputSection: {
    marginBottom: spacing.lg,
  },
  titleInput: {
    fontSize: fontSize.textSize25,
    color: colors.textPrimary2,
    paddingVertical: spacing.sm,
    minHeight: scaleHeight(50),
  },
  inputUnderline: {
    height: 1,
    backgroundColor: colors.grey20,
  },
  selectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    marginHorizontal: 0,
  },
  selectorText: {
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    fontWeight: '400',
    marginHorizontal: spacing.sm,
  },
  smallArrowDropdown: {
    height: scaleHeight(5.96),
    width: scaleWidth(10.9),
  },
  checkboxSection: {
    marginBottom: spacing.lg,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  checkboxContainer: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: colors.figmaAccent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    overflow: 'hidden',
  },
  checkboxGradient: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxEmpty: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: colors.figmaAccent,
  },
  checkboxText: {
    fontSize: fontSize.textSize16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  radioOptions: {
    marginLeft: scaleWidth(32),
    marginTop: spacing.sm,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  radioContainer: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: colors.figmaAccent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  radioSelected: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
  },
  radioEmpty: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    backgroundColor: 'transparent',
  },
  radioText: {
    fontSize: fontSize.textSize16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  messageSection: {
    marginBottom: spacing.lg,
  },
  messageLabel: {
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  messageInputContainer: {
    position: 'relative',
  },
  messageInput: {
    fontSize: fontSize.textSize16,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
    minHeight: scaleHeight(80),
    textAlignVertical: 'top',
    fontWeight: '400',
  },
  visibilitySection: {
    marginBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  visibilityDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE0E5',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: '#F6F7F9',
    width: scaleWidth(120),
    height: scaleHeight(40),
    justifyContent: 'center',
    marginLeft: 10,
  },
  visibilityText: {
    fontSize: fontSize.textSize15,
    color: colors.blackText,
    fontWeight: '400',
    marginRight: spacing.sm,
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: scaleHeight(30),
    right: spacing.lg,
  },
  saveButton: {
    borderRadius: borderRadius.lg,
    minWidth: scaleWidth(100),
    alignItems: 'center',
    ...shadows.sm,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  gradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  saveButtonText: {
    fontSize: fontSize.textSize16,
    color: colors.white,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CreateOutOfOfficeScreen;
