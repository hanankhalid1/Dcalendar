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
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { moderateScale, scaleHeight, scaleWidth } from '../utils/dimensions';
import {
  colors,
  fontSize,
  spacing,
  borderRadius,
  shadows,
} from '../utils/LightTheme';
import CalendarWithTime from './CalendarWithTime';
import { FlatList } from 'react-native';
import GradientText from './home/GradientText';
import { Colors } from '../constants/Colors';

import { useActiveAccount } from '../stores/useActiveAccount';
import { useToken } from '../stores/useTokenStore';
import AdvancedOptions from './createEvent/AdvancedOptions';
import { useEventsStore } from '../stores/useEventsStore';
import { useApiClient } from '../hooks/useApi';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { useWalletStore } from '../stores/useWalletStore';

interface CreateEventModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: () => void;
  eventData?: any;
  mode?: 'create' | 'edit';
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isVisible,
  onClose,
  onSave: _onSave,
  eventData,
  mode = 'create',
}) => {
  const activeAccount = useActiveAccount(state => state.account);
  const token = useToken(state => state.token);

  // Form state
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [videoConferencing, setVideoConferencing] = React.useState('');
  const [showAdvanced, setShowAdvanced] = React.useState(true); // Set to true to show the toolbar
  const [notificationMinutes, setNotificationMinutes] = React.useState(10);
  const [guestPermissions, setGuestPermissions] = React.useState({
    modifyEvent: false,
    inviteOthers: true,
    seeGuestList: false,
  });
  const [showCalendarModal, setShowCalendarModal] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedStartTime, setSelectedStartTime] = React.useState<string>('');
  const [selectedEndTime, setSelectedEndTime] = React.useState<string>('');
  const [showDetailedDateTime, setShowDetailedDateTime] = React.useState(false);
  const [showGuestDropdown, setShowGuestDropdown] = React.useState(false);
  const [selectedGuests, setSelectedGuests] = React.useState<string[]>([]);
  const [showEventTypeDropdown, setShowEventTypeDropdown] =
    React.useState(false);
  const [selectedEventType, setSelectedEventType] = React.useState('Event');
  const [isLoading, setIsLoading] = React.useState(false);
  console.log('tokentokentokentoken', token);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLocation('');
    setVideoConferencing('');
    setSelectedDate(null);
    setSelectedStartTime('');
    setSelectedEndTime('');
    setSelectedGuests([]);
    setSelectedEventType('Event');
    setNotificationMinutes(10);
    setGuestPermissions({
      modifyEvent: false,
      inviteOthers: true,
      seeGuestList: false,
    });
  };

  React.useEffect(() => {
    if (eventData && mode === 'edit') {
      setTitle(eventData.title || '');
      setDescription(eventData.description || '');
      setLocation(eventData.location || '');
      setVideoConferencing(eventData.videoConferencing || '');
      setSelectedDate(
        eventData.selectedDate ? new Date(eventData.selectedDate) : null,
      );
      setSelectedStartTime(eventData.selectedStartTime || '');
      setSelectedEndTime(eventData.selectedEndTime || '');
      setSelectedGuests(eventData.guests || []);
      setSelectedEventType(eventData.selectedEventType || 'Event');
      setNotificationMinutes(eventData.notificationMinutes || 10);
      setGuestPermissions(
        eventData.guestPermissions || {
          modifyEvent: false,
          inviteOthers: true,
          seeGuestList: false,
        },
      );
    } else {
      resetForm();
    }
  }, [eventData, mode]);

  // Event type options
  const eventTypes = [
    { id: '1', name: 'Event', icon: '✓' },
    { id: '2', name: 'Task', icon: '' },
  ];

  // Sample guest data
  const guestData = [
    {
      id: '1',
      name: 'Ashley Brown',
      username: 'ashley',
      avatar:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWZED7Ipsrw2KxqxLGaUs9q7CeDxpm6h9b0TISuiVxFgJFsWheSPBEZk12d1E7_IE9eBU&usqp=CAU',
    },
    {
      id: '2',
      name: 'Javier Holloway',
      username: 'j_holloway',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    },
    {
      id: '3',
      name: 'Stephen Harris',
      username: 'stephen',
      avatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    },
    {
      id: '4',
      name: 'Richard Walters',
      username: 'richard_walt',
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    },
    {
      id: '5',
      name: 'Michael Simon',
      username: 'michael',
      avatar:
        'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face',
    },
    {
      id: '6',
      name: 'Melissa Bradley',
      username: 'melissa_bradley',
      avatar:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    },
  ];

  const handleGuestSelect = (guestId: string) => {
    setSelectedGuests(prev =>
      prev.includes(guestId)
        ? prev.filter(id => id !== guestId)
        : [...prev, guestId],
    );
  };

  const closeGuestDropdown = () => {
    setShowGuestDropdown(false);
  };

  const closeEventTypeDropdown = () => {
    setShowEventTypeDropdown(false);
  };

  const handleEventTypeSelect = (eventType: string) => {
    setSelectedEventType(eventType);
    setShowEventTypeDropdown(false);
  };

  const handleDateTimeSelect = (
    date: Date,
    startTime: string,
    endTime: string,
  ) => {
    setSelectedDate(date);
    setSelectedStartTime(startTime);
    setSelectedEndTime(endTime);
    setShowDetailedDateTime(true); // Show the detailed UI after selection
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

  const {
    optimisticallyUpdateEvent,
    optimisticallyAddEvent,
    revertOptimisticUpdate,
    getUserEvents,
    userEvents,
  } = useEventsStore();
  const { api } = useApiClient();
  const navigation = useNavigation();
  const { wallet } = useWalletStore();

  const handleSaveEvent = async () => {
    console.log(wallet);

    if (!validateForm()) return;

    // Additional validation: Ensure title is not empty (double-check)
    if (!title || !title.trim() || title.trim().length === 0) {
      Alert.alert('Validation Error', 'Please enter a title for the event');
      return;
    }

    // Don't block UI with loading state - optimistic updates handle this
    setIsLoading(false);

    try {
      // Only include location if it's not empty or whitespace-only
      const trimmedLocation = location.trim();
      const validLocation = trimmedLocation.length > 0 ? trimmedLocation : '';

      // --- Blockchain Guest Registration Logic ---
      const { BlockchainService } = require('../services/BlockChainService');
      const { NECJSPRIVATE_KEY } = require('../constants/Config');
      const blockchainService = new BlockchainService(NECJSPRIVATE_KEY);

      // Helper: extract username from email
      const extractUsernameFromEmail = email => email.split('@')[0];
      const extractNameFromEmail = email => {
        const localPart = email.split('@')[0];
        return localPart
          .replace(/[._]/g, ' ')
          .split(' ')
          .map(
            word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
          )
          .join(' ');
      };

      // Register each guest on-chain if not already present
      for (const guestEmail of selectedGuests) {
        try {
          // Check if user exists on-chain (by wallet address = email or username)
          // For demo, use username as wallet address (adapt as needed)
          const username = extractUsernameFromEmail(guestEmail);
          let userDetails;
          try {
            userDetails = await blockchainService.getUserDetailsForWallet(
              guestEmail,
            );
          } catch (e) {
            userDetails = null;
          }
          if (!userDetails || !userDetails.userName) {
            // Register user on-chain
            const params = {
              organizationId: '', // Set as needed
              role: 'guest',
              userName: username,
              domain: guestEmail.split('@')[1] || '',
              name: extractNameFromEmail(guestEmail),
              publicKey: '', // Optionally generate/fetch
              walletAddress: guestEmail, // For demo, use email as walletAddress
              status: true,
              attributes: [],
            };
            try {
              await blockchainService.createAccount(params);
              console.log(`Registered guest on-chain: ${guestEmail}`);
            } catch (err) {
              console.warn(
                `Failed to register guest on-chain: ${guestEmail}`,
                err,
              );
            }
          }
        } catch (err) {
          console.warn('Guest on-chain check error:', err);
        }
      }
      // --- End Blockchain Guest Registration Logic ---

      const payload = {
        title: title.trim(),
        selectedDate: selectedDate!,
        selectedStartTime,
        selectedEndTime,
        selectedEventType,
        description: description.trim(),
        location: validLocation,
        videoConferencing: videoConferencing.trim(),
        notificationMinutes,
        guests: selectedGuests,
        guestPermissions,
        activeAccount,
        token,
      };
      console.log('modddd', mode);
      if (mode === 'edit' && eventData?.uid) {
        // Store current events for potential revert
        const previousEvents = [...(userEvents || [])];

        // ✅ OPTIMISTIC UPDATE: Update UI immediately
        optimisticallyUpdateEvent(eventData.uid, {
          title: payload.title,
          fromTime: payload.selectedStartTime,
          toTime: payload.selectedEndTime,
          description: payload.description,
          location: validLocation,
        });

        // ✅ NAVIGATE IMMEDIATELY - SYNCHRONOUS (NO DELAY)
        navigation.goBack();

        // Show success alert asynchronously (non-blocking)
        setTimeout(() => {
          Alert.alert('Success', 'Event updated successfully!');
        }, 100);

        // ✅ BACKGROUND OPERATIONS: Run API calls in background
        (async () => {
          try {
            const updatePayload = {
              events: [
                {
                  uid: eventData.uid,
                  fromTime: payload.selectedStartTime, // format: YYYYMMDDTHHmmss
                  toTime: payload.selectedEndTime,
                  repeatEvent: '', // add logic if needed
                  customRepeatEvent: '', // add logic if needed
                },
              ],
              active: payload.activeAccount?.username,
              type: 'update',
            };

            const response = await axios.post(
              'https://dev-api.bmail.earth/updateevents',
              updatePayload,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              },
            );

            if (response.data?.success) {
              // Refresh events in background (non-blocking)
              if (activeAccount?.username) {
                getUserEvents(activeAccount.username, api).catch(err => {
                  console.error('Background event refresh failed:', err);
                });
              }
            } else {
              // Revert on failure
              revertOptimisticUpdate(previousEvents);
              Alert.alert(
                'Error',
                response.data?.message || 'Failed to update event',
              );
            }
          } catch (error: any) {
            console.error('Error updating event in background:', error);
            // Revert optimistic update on error
            revertOptimisticUpdate(previousEvents);
            Alert.alert('Error', error.message || 'Something went wrong');
          }
        })();
      } else {
        // Handle create event (can still use Zustand addEvent or API call)
        // TODO: Implement optimistic create if needed
      }
    } catch (error: any) {
      console.error('Error updating event:', error);
      Alert.alert('Error', error.message || 'Something went wrong');
    }
  };

  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Invisible overlay to close dropdowns when clicking outside */}
      {(showGuestDropdown || showEventTypeDropdown) && (
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => {
            closeGuestDropdown();
            closeEventTypeDropdown();
          }}
        />
      )}

      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>
          {mode === 'edit' ? 'Edit ' : 'Create '}
        </Text>
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
            placeholder="Add title"
            placeholderTextColor={colors.grey400}
            value={title}
            onChangeText={setTitle}
          />
          <View style={styles.inputUnderline} />
        </View>

        {/* Event Details Section */}
        <View style={styles.detailsSection}>
          {/* Date and Time Selection */}
          {showDetailedDateTime && selectedDate ? (
            <View style={styles.dateTimeContainer}>
              {/* Start Date and Time Section */}
              <View style={styles.fieldContainer}>
                <Text style={styles.labelText}>Start Date and Time</Text>
                <TouchableOpacity
                  style={styles.datePicker}
                  onPress={() => setShowCalendarModal(true)}
                >
                  <Text style={styles.selectorText}>
                    {selectedDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    {selectedStartTime || 'Select'}
                  </Text>
                  <FeatherIcon name="calendar" size={20} color="#A4A7AE" />
                </TouchableOpacity>
              </View>

              {/* End Date and Time Section */}
              <View style={styles.fieldContainer}>
                <Text style={styles.labelText}>End Date and Time</Text>
                <TouchableOpacity
                  style={styles.datePicker}
                  onPress={() => setShowCalendarModal(true)}
                >
                  <Text style={styles.selectorText}>
                    {selectedDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    {selectedEndTime || 'Select'}
                  </Text>
                  <FeatherIcon name="calendar" size={20} color="#A4A7AE" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.fieldContainer}>
              <Text style={styles.labelText}>Date and Time</Text>
              <TouchableOpacity
                style={styles.datePicker}
                onPress={() => setShowCalendarModal(true)}
              >
                <Text style={styles.selectorText}>Select</Text>
                <FeatherIcon name="calendar" size={20} color="#A4A7AE" />
              </TouchableOpacity>
            </View>
          )}

          {/* Add guests */}
          <TouchableOpacity style={styles.selectorItem}>
            <MaterialIcons name="person-add" size={20} color="#6C6C6C" />
            <Text style={styles.selectorText}>Add guests</Text>
          </TouchableOpacity>

          {/* Pick location */}
          <View style={styles.selectorItem2}>
            <FeatherIcon name="map-pin" size={20} color="#6C6C6C" />
            <TextInput
              style={[styles.selectorText, styles.locationInput]}
              placeholder="Pick location"
              placeholderTextColor={colors.grey400}
              value={location}
              onChangeText={text => {
                // Check for invalid characters
                // Blocked: < > { } [ ] | \ ` ~ ^ / @ # $ % & * + = ?
                const invalidChars = /[<>{}[\]|\\`~^\/@#$%&*+=?]/;
                if (!invalidChars.test(text)) {
                  setLocation(text);
                }
              }}
            />
            <Image
              source={require('../assets/images/CreateEventImages/addIcon.png')}
            />
          </View>

          {/* Advanced Options - Only show when expanded */}
          {showAdvanced && (
            <AdvancedOptions
              notificationMinutes={notificationMinutes}
              onNotificationMinutesChange={setNotificationMinutes}
              onAddNotification={() => {
                // Handle add notification
                console.log('Add notification pressed');
              }}
              organizerName="Farhanur Rahman"
              onOrganizerPress={() => {
                // Handle organizer selection
                console.log('Organizer pressed');
              }}
              status="Busy"
              visibility="Default visibility"
              onStatusPress={() => {
                // Handle status selection
                console.log('Status pressed');
              }}
              onVisibilityPress={() => {
                // Handle visibility selection
                console.log('Visibility pressed');
              }}
              showGuestDropdown={showGuestDropdown}
              selectedGuests={selectedGuests}
              guestData={guestData}
              onGuestSelect={handleGuestSelect}
              onToggleGuestDropdown={() =>
                setShowGuestDropdown(!showGuestDropdown)
              }
              guestPermissions={guestPermissions}
              onGuestPermissionsChange={setGuestPermissions}
            />
          )}

          {/* Add description */}
          <View style={styles.cardContainer}>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Add description"
              placeholderTextColor={colors.grey400}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />
            {showAdvanced && (
              <View style={styles.formattingToolbar}>
                <View style={styles.toolbarDropdown}>
                  <Text style={styles.toolbarText}>Inter</Text>
                  <FeatherIcon name="chevron-down" size={14} color="#828282" />
                </View>
                <View style={styles.toolbarDropdown}>
                  <Text style={styles.toolbarText}>14 px</Text>
                  <FeatherIcon name="chevron-down" size={14} color="#828282" />
                </View>
                <View style={styles.toolbarDropdown}>
                  <View style={styles.colorPicker}>
                    <LinearGradient
                      colors={['#000', '#000']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.colorCircle}
                    />
                    <Text style={styles.toolbarText}>Colour</Text>
                    <FeatherIcon
                      name="chevron-down"
                      size={14}
                      color="#828282"
                    />
                  </View>
                </View>
                <TouchableOpacity style={styles.toolbarButton}>
                  <FeatherIcon name="align-left" size={16} color="#6C6C6C" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolbarButton}>
                  <FeatherIcon
                    name="more-horizontal"
                    size={16}
                    color="#6C6C6C"
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Add attachment */}
          <View style={styles.attachmentSection}>
            <Text style={styles.attachmentLabel}>Add attachment</Text>
            <TouchableOpacity style={styles.uploadButton}>
              <Image
                source={require('../assets/images/CreateEventImages/fileAdd.png')}
                style={styles.uploadIcon}
              />
              <Text style={styles.uploadText}>Click to upload</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Action Bar */}
        <View style={styles.bottomActionBar}>
          <TouchableOpacity
            style={styles.advanceOptionsButton}
            onPress={() => setShowAdvanced(!showAdvanced)}
          >
            <Text style={styles.advanceOptionsText}>Advance options</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSaveEvent}
            disabled={isLoading}
          >
            <LinearGradient
              colors={
                isLoading ? ['#CCCCCC', '#AAAAAA'] : ['#18F06E', '#0B6DE0']
              }
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.gradient}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Saving...' : 'Save'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    zIndex: 1000,
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
    // justifyContent: 'space-between',
    // paddingHorizontal: spacing.lg,
    paddingTop: scaleHeight(40),
    paddingBottom: spacing.lg,
    width: '100%',
    position: 'relative',
    // backgroundColor: '#000',
    paddingLeft: scaleWidth(10),
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    // justifyContent: 'center',
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
    width: 12,
    height: 8,
    marginTop: 4,
    marginLeft: 1,
  },
  smallArrowDropdown: {
    height: scaleHeight(5.96),
    width: scaleWidth(10.9),
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  inputSection: {
    marginBottom: spacing.lg,
  },
  titleInput: {
    fontSize: fontSize.textSize25,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
    minHeight: scaleHeight(50),
  },
  inputUnderline: {
    height: 1,
    backgroundColor: colors.grey20,
  },
  detailsSection: {
    marginBottom: spacing.lg,
  },
  selectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    width: scaleWidth(185),
  },
  selectorItem2: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    width: scaleWidth(150),
  },
  selectorIcon: {
    width: moderateScale(24),
    height: moderateScale(24),
    marginRight: spacing.md,
  },
  selectorArrow: {
    fontSize: fontSize.textSize14,
    color: colors.figmaAccent,
  },
  addLocationButton: {
    width: moderateScale(24),
    height: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  addLocationIcon: {
    fontSize: fontSize.textSize16,
    color: colors.white,
    fontWeight: 'bold',
  },
  cardContainer: {
    backgroundColor: '#F6F7F9',
    borderRadius: 10, // Rounded corners

    padding: 16, // Inner padding for the content
    marginBottom: spacing.lg,
  },
  descriptionSection: {
    marginBottom: spacing.lg,
  },
  descriptionInput: {
    fontSize: fontSize.textSize16,
    color: colors.textPrimary,
    padding: 0, // Removed padding from here
    minHeight: scaleHeight(100),
    backgroundColor: 'transparent', // Removed background color
    borderRadius: 0,
    textAlignVertical: 'top',
    borderWidth: 0, // Removed border
    borderColor: 'transparent',
  },
  attachmentSection: {
    marginBottom: spacing.xl,
  },
  attachmentLabel: {
    fontSize: fontSize.textSize15,
    color: colors.blackText,
    fontWeight: '400',
    marginBottom: spacing.md,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00C78B1A',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    width: scaleWidth(200),
  },
  uploadIcon: {
    fontSize: fontSize.textSize18,
    marginRight: spacing.sm,
  },
  uploadText: {
    fontSize: fontSize.textSize16,
    color: colors.raisinBlack,
    fontWeight: '500',
  },
  bottomActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginHorizontal: scaleWidth(60),
    paddingBottom: scaleHeight(50),
  },
  advanceOptionsButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  advanceOptionsText: {
    fontSize: fontSize.textSize18,
    color: colors.dimGray,
    fontWeight: '600',
  },
  saveButton: {
    borderRadius: borderRadius.lg,
    minWidth: scaleWidth(120),
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
  notificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorText: {
    fontSize: fontSize.textSize14,
    color: colors.blackText,
    fontWeight: '400',
    marginHorizontal: spacing.sm,
  },
  locationInput: {
    flex: 1,
  },
  dateTimeContainer: {
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  fromToSection: {
    marginBottom: spacing.md,
  },
  fromToLabel: {
    fontSize: fontSize.textSize14,
    color: colors.blackText,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateText: {
    fontSize: fontSize.textSize14,
    color: colors.blackText,
    fontWeight: '400',
    marginLeft: spacing.xs,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.white,
    minWidth: scaleWidth(100),
  },
  timeInput: {
    fontSize: fontSize.textSize14,
    color: colors.blackText,
    fontWeight: '400',
    padding: 0,
    marginRight: spacing.xs,
    textAlign: 'center',
    flex: 1,
  },
  notificationRight: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: scaleWidth(25),
  },
  numberInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    borderColor: '#DCE0E5',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginLeft: spacing.sm,
    height: scaleHeight(32),
    width: scaleWidth(64),
    justifyContent: 'center',
  },
  numberText: {
    fontSize: fontSize.textSize16,
    color: colors.textPrimary,
    fontWeight: '600',
    marginHorizontal: spacing.xs,
  },
  numberArrows: {
    flexDirection: 'column',
    marginLeft: spacing.xs,
  },
  timeUnitDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    borderColor: '#DCE0E5',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginLeft: spacing.sm,
  },
  timeUnitText: {
    fontSize: fontSize.textSize16,
    color: colors.textPrimary,
    fontWeight: '600',
    marginHorizontal: spacing.xs,
  },
  addNotificationButton: {
    width: moderateScale(24),
    height: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: moderateScale(12),
  },
  addNotificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: '#F6F7F9',
    width: scaleWidth(154),
  },
  addNotificationIconContainer: {
    width: moderateScale(24),
    height: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00C78B1A',
    borderRadius: moderateScale(4),
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    paddingRight: scaleWidth(30),
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE0E5',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginLeft: spacing.xs,
    justifyContent: 'center',
    height: scaleHeight(32),
    width: scaleWidth(96),
  },
  statusText: {
    fontSize: fontSize.textSize15,
    color: colors.mediumgray,
    fontWeight: '600',
    marginRight: spacing.xs,
  },
  visibilityDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: '#DCE0E5',
    height: scaleHeight(32),
    width: scaleWidth(169),
  },
  visibilityText: {
    fontSize: fontSize.textSize15,
    color: colors.mediumgray,
    fontWeight: '500',
    marginRight: spacing.sm,
  },
  section: {
    marginBottom: spacing.lg,
    position: 'relative',
  },
  sectionTitle: {
    fontSize: fontSize.textSize14,
    color: colors.blackText,
    fontWeight: '400',
    marginBottom: spacing.sm,
  },
  sectionTitle2: {
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  guestInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.veryLightGrayishBlue,
    backgroundColor: colors.lightgray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    height: scaleHeight(41),
    width: scaleWidth(314),
  },
  guestInput: {
    flex: 1,
    fontSize: fontSize.textSize12,
    color: colors.mediumlightgray,
    paddingVertical: 0,
  },
  guestDropdown: {
    position: 'absolute',
    top: scaleHeight(70),
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.veryLightGrayishBlue,
    maxHeight: scaleHeight(200),
    zIndex: 1000,
    ...shadows.sm,
    width: moderateScale(299),
    height: moderateScale(355),
  },
  guestList: {
    maxHeight: scaleHeight(180),
  },
  guestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGrayishBlue,
  },
  guestCheckbox: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(4),
    borderWidth: 1,
    borderColor: colors.figmaAccent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    overflow: 'hidden',
  },
  guestAvatar: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    marginRight: spacing.sm,
  },
  guestInfo: {
    flex: 1,
  },
  guestName: {
    fontSize: fontSize.textSize14,
    color: colors.blackText,
    fontWeight: '400',
    marginBottom: 2,
  },
  guestUsername: {
    fontSize: fontSize.textSize10,
    color: colors.mediumlightgray,
    fontWeight: '400',
  },
  permissionOptions: {
    marginTop: spacing.sm,
  },
  permissionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  radioButton: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: colors.figmaAccent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  checkboxSelected: {
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
  permissionText: {
    fontSize: fontSize.textSize16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  formattingToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D3D3D3',
    backgroundColor: '#F6F7F9', // Updated to match image
    borderRadius: 6, // Updated to match image
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginTop: spacing.sm,
  },
  toolbarDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarText: {
    fontSize: fontSize.textSize10,
    color: colors.neutralmediumgray,
    fontWeight: '400',
    // marginRight: spacing.xs,
  },
  colorPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircle: {
    width: moderateScale(14),
    height: moderateScale(14),
    borderRadius: moderateScale(7),
    marginRight: spacing.sm,
  },
  toolbarButton: {
    paddingHorizontal: spacing.sm,
  },
  iconText: {
    fontSize: fontSize.textSize18,
    marginRight: spacing.sm,
  },
  addNotificationIcon: {
    fontSize: fontSize.textSize16,
    color: colors.figmaAccent,
  },
  checkboxGradient: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  labelText: {
    fontFamily: 'Lato-Medium',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 12,
    letterSpacing: 0,
    color: '#414651',
    marginBottom: scaleHeight(8),
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#DCE0E5',
    borderRadius: 8,
    paddingVertical: scaleHeight(12),
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.white,
    minHeight: scaleHeight(44),
  },
});

export default CreateEventModal;
