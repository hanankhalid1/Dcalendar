import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Modal,
  Alert
} from "react-native";
import LinearGradient from 'react-native-linear-gradient';
import CalendarWithTime from '../components/CalendarWithTime';
import { SafeAreaView } from "react-native-safe-area-context";
import FeatherIcon from 'react-native-vector-icons/Feather';
import { moderateScale, scaleHeight, scaleWidth } from '../utils/dimensions';
import {
  colors,
  fontSize,
  spacing,
  borderRadius,
  shadows,
} from '../utils/LightTheme';
import { AppNavigationProp } from "../navigations/appNavigation.type";
import { useNavigation, useRoute } from "@react-navigation/native";
import GradientText from "../components/home/GradientText";
import { Colors } from "../constants/Colors";
import { dayAbbreviations, dayNames, eventTypes, recurrenceOptions, timezones } from "../constants/dummyData";
import { useActiveAccount } from '../stores/useActiveAccount';
import { useToken } from '../stores/useTokenStore';
import { formatToISO8601 } from '../utils';
import { BlockchainService } from "../services/BlockChainService";
import { NECJSPRIVATE_KEY } from "../constants/Config";
import { useEventsStore } from "../stores/useEventsStore";
import { useApiClient } from "../hooks/useApi";
import { generateEventUID } from "../utils/eventUtils";

const CreateTaskScreen = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const activeAccount = useActiveAccount(state => state.account);
  const token = useToken(state => state.token);
  const route = useRoute<any>();
  const { mode, eventData: editEventData } = route.params || {};
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { getUserEvents } = useEventsStore();
  const { api } = useApiClient();
  const blockchainService = new BlockchainService(NECJSPRIVATE_KEY);
  const [showRecurrenceDropdown, setShowRecurrenceDropdown] = useState(false);
  const [selectedRecurrence, setSelectedRecurrence] = useState('Does not repeat');
  const [showCustomRecurrenceModal, setShowCustomRecurrenceModal] = useState(false);
  const [customRecurrence, setCustomRecurrence] = useState({
    repeatEvery: '1',
    repeatUnit: 'Week',
    repeatOn: ['Thursday'],
    endsType: 'Never',
    endsDate: '',
    endsAfter: '13',
  });
  const endsOptions = ['Never', 'On', 'After'];
  const [selectedValue, setSelectedValue] = useState(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const getCurrentTimezone = React.useCallback(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneData = timezones.find(tz => tz.id === timezone);
    return (
      timezoneData || { id: timezone, name: timezone, offset: 'GMT+00:00' }
    );
  }, [timezones]);

  const [selectedDate, setSelectedDate] = useState<Date | null>(
    editEventData?.selectedDate ? new Date(editEventData.selectedDate) : null,
  );
  const [selectedStartTime, setSelectedStartTime] = useState(
    editEventData?.selectedStartTime || '',
  );

  const [showDetailedDateTime, setShowDetailedDateTime] = useState(
    !!editEventData,
  );
  const [showEventTypeDropdown, setShowEventTypeDropdown] =
    useState(false);
  const [selectedEventType, setSelectedEventType] = useState(
    editEventData?.selectedEventType || 'Task',
  );
  const [labelList, setLabelList] = useState([
    { label: "My Tasks", value: "1" },
    { label: "Work", value: "2" },
    { label: "Personal", value: "3" },
  ]);
  const repeatUnits = ['Day', 'Week', 'Month', 'Year'];

  const handleRecurrenceSelect = (recurrence: string) => {
    if (recurrence === 'Custom...') {
      setShowRecurrenceDropdown(false);
      setShowCustomRecurrenceModal(true);
    } else {
      setSelectedRecurrence(recurrence);
      setShowRecurrenceDropdown(false);
    }
  };
  const handleCustomRecurrenceDone = () => {
    // Generate custom recurrence text based on settings
    const { repeatEvery, repeatUnit, repeatOn, endsType } = customRecurrence;
    let customText = `Every ${repeatEvery} ${repeatUnit.toLowerCase()}`;

    if (repeatUnit === 'Week' && repeatOn.length > 0) {
      customText += ` on ${repeatOn.join(', ')}`;
    }

    if (endsType === 'After') {
      customText += ` (${customRecurrence.endsAfter} times)`;
    } else if (endsType === 'On') {
      customText += ` (until ${customRecurrence.endsDate})`;
    }

    setSelectedRecurrence(customText);
    setShowCustomRecurrenceModal(false);
  };

  const handleDayToggle = (day: string) => {
    setCustomRecurrence(prev => ({
      ...prev,
      repeatOn: prev.repeatOn.includes(day)
        ? prev.repeatOn.filter(d => d !== day)
        : [...prev.repeatOn, day],
    }));
  };





  useEffect(() => {
    if (mode === 'edit' && editEventData) {
      // Set title
      console.log("edit task opened:", editEventData)
      setTitle(editEventData.title || '');

      // Set description
      setDescription(editEventData.description || '');
      if (editEventData.date) {
        // Parse date string like "Wed Oct 01 2025"
        const parsedDate = new Date(editEventData.date);
        setSelectedDate(parsedDate);
      }

      const repeatEventTag = editEventData.tags.find(tag => tag.key === 'repeatEvent');

      // Check if the tag was found
      if (repeatEventTag) {
        // Use the value from the found tag object (e.g., 'Daily')
        setSelectedRecurrence(repeatEventTag.value);

        // Show recurrence dropdown
        //setShowRecurrenceDropdown(true);
      }
      console.log("Edit Event Start Time:", editEventData);
      // Set date and time from fromTime
      if (editEventData.time) {
        // Convert 12-hour format to 24-hour format (HH:MM)
        const time12h = editEventData.time; // e.g., "11:10 PM"
        const [time, period] = time12h.split(' ');
        const [hours, minutes] = time.split(':');

        let hour24 = parseInt(hours, 10);
        if (period === 'PM' && hour24 !== 12) {
          hour24 += 12;
        } else if (period === 'AM' && hour24 === 12) {
          hour24 = 0;
        }

        const time24h = `${hour24.toString().padStart(2, '0')}:${minutes}`;
        setSelectedStartTime(time24h);
      }

      setShowDetailedDateTime(true);
    }
  }, [mode, editEventData]);

  const handleDateTimeSelect = (
    date: Date,
    startTime: string,
    endTime: string,
  ) => {
    setSelectedDate(date);
    setSelectedStartTime(startTime);
    setShowDetailedDateTime(true);
  };
  const handleEventTypeSelect = (eventType: string) => {
    setSelectedEventType(eventType);
    setShowEventTypeDropdown(false);

    // Navigate to corresponding screen
    if (eventType === 'Event') {
      navigation.replace('CreateEventScreen');
    } else if (eventType === 'Out of office') {
      navigation.replace('CreateOutOfOfficeScreen');
    } else if (eventType === 'Task') {
      // Stay on current screen
      return;
    }
    // Add navigation for other event types as needed
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const validateForm = () => {
    if (!title || title.trim() === '') {
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

    if (!activeAccount) {
      Alert.alert('Error', 'No active account found. Please log in again.');
    }

    return true;
  };

  const createTask = async () => {
    // 1. Validate Form
    if (!validateForm()) {
      return;
    }

    // 2. Set Loading State
    setIsLoading(true);
    console.log("Processing task...");

    try {
      console.log("edit event uid:", editEventData?.id);
      const uid = mode === 'edit' && editEventData?.id
        ? editEventData.id
        : generateEventUID();
      console.log("Generated/Using UID:", uid);
      const startTimeISO = formatToISO8601(selectedDate!, selectedStartTime);

      const [hours, minutes] = selectedStartTime.split(':');
      const totalMinutes = parseInt(hours) * 60 + parseInt(minutes) + 30;
      const endHours = Math.floor(totalMinutes / 60) % 24;
      const endMinutes = totalMinutes % 60;
      const endTimeString = `${endHours}:${String(endMinutes).padStart(2, '0')}`;

      const endTimeISO = formatToISO8601(selectedDate!, endTimeString);

      const repeatEvents = (editEventData?.list || [])
        .filter((data: any) => data.key === "repeatEvent")
        .map((data: any) => data.value)
        .filter((value: any) => value !== null);
      // ... [Same customRepeat and meetingEventIdValue extraction logic] ...
      const customRepeat = (editEventData?.list || [])
        .filter((data: any) => data.key === "customRepeatEvent")
        .map((data: any) => data.value)
        .filter((value: any) => value !== null);
      const entries = [
        { key: "task", value: "true" },
        { key: "repeatEvent", value: repeatEvents },
        { key: "customRepeatEvent", value: customRepeat },
        { key: "LabelName", value: "My Tasks" },
        { key: "organizer", value: activeAccount?.userName }
      ].filter((entry) => entry.value !== undefined && entry.value !== '');

      const list: { key: string; value: string }[] = [];
      list.push(...entries);

      // 6. Build task data structure
      const taskData = {
        uid: uid.toString(),
        title: title.trim(),
        description: description.trim() || "",
        fromTime: startTimeISO,
        toTime: endTimeISO,
        done: editEventData?.done || false,
        repeatEvent:
          selectedRecurrence !== 'Does not repeat'
            ? selectedRecurrence
            : undefined,
        list: list,
        organizer: activeAccount?.userName
      };

      // 4. Handle Edit vs. Create
      if (mode === 'edit') {
        await handleEditTask(taskData, activeAccount);
      } else {
        await handleCreateTask(taskData, activeAccount);
      }

      await getUserEvents(activeAccount.userName, api);
      navigation.goBack();

    } catch (error: any) {
      console.error('Error saving task:', error);
      Alert.alert('Error', error.message || 'Failed to save task. Please try again.');
    } finally {
      // 5. Hide Loader
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (taskData, activeAccount) => {
    try {

      console.log("Creating task on blockchain:", taskData);
      const response = await blockchainService.createEvent(
        taskData,
        activeAccount,
        token,
      );
      const repeatEvents = (taskData?.list || [])
        .filter((data: any) => data.key === "repeatEvent")
        .map((data: any) => data.value)
        .filter((value: any) => value !== null);
      const customRepeat = (taskData?.list || [])
        .filter((data: any) => data.key === "customRepeatEvent")
        .map((data: any) => data.value)
      const updatePayload = {
        events: [{
          uid: taskData?.uid,
          fromTime: taskData?.fromTime,
          toTime: taskData?.toTime,
          repeatEvent: repeatEvents.length ? `${repeatEvents}` : '',
          customRepeatEvent: customRepeat.length ? `${customRepeat}` : '',
          meetingEventId: '',

        }],
        active: activeAccount?.userName,
        type: 'update',
      };
      // Call the same API as edit
      await api('POST', '/updateevents', updatePayload);

      await getUserEvents(activeAccount.userName, api);

      navigation.goBack();
    } catch (error: any) {
      console.error('Error in handleCreateTask:', error);
      Alert.alert('Error', 'An unexpected error occurred while creating the task. Please check your network connection.');
    }
  };

  const handleEditTask = async (taskData: any, activeAccount: any) => {
    try {

      console.log("Updating task on blockchain:", taskData);

      // Using the same createEvent method as per your requirement
      const response = await blockchainService.updateEvent(
        taskData,
        activeAccount,
        token,
      );

      if (response) {
        Alert.alert('Success', 'Task has been successfully updated.');
      } else {
        Alert.alert('Failed', 'Failed to update the task. Please try again.');
      }
    } catch (error: any) {
      console.error('Error in handleEditTask:', error);
      Alert.alert('Error', 'An unexpected error occurred while updating the task.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Invisible overlay to close dropdowns when clicking outside */}
      {(showEventTypeDropdown) && (
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowEventTypeDropdown(false);
          }}
        />
      )}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

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
      </View>
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

      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
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

          {/* Pick date and time */}
          <TouchableOpacity
            style={styles.datePicker}
            onPress={() => setShowCalendarModal(true)}
          >
            <FeatherIcon name="calendar" size={20} color="#6C6C6C" />

            <Text style={styles.selectorText}>
              {selectedDate
                ? selectedDate.toLocaleDateString() + ' ' + selectedStartTime
                : "Pick date and time"}
            </Text>
            <Image
              style={{ marginLeft: scaleWidth(10) }}
              source={require('../assets/images/CreateEventImages/smallArrowDropdown.png')}
            />
          </TouchableOpacity>
          {/* Recurrence Dropdown - Only show when date and time are selected */}
          {showDetailedDateTime && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: spacing.md,
              }}
            >
              <FeatherIcon name="repeat" size={20} color="#6C6C6C" />
              <TouchableOpacity
                style={styles.recurrenceContainer}
                onPress={() => setShowRecurrenceDropdown(!showRecurrenceDropdown)}
              >
                <Text style={styles.selectorText}>{selectedRecurrence}</Text>
                <Image
                  style={{ marginLeft: scaleWidth(10) }}
                  source={require('../assets/images/CreateEventImages/smallArrowDropdown.png')}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Recurrence Dropdown */}
          {showRecurrenceDropdown && (
            <>
              {/* Overlay to close recurrence dropdown when clicking outside */}
              <TouchableOpacity
                style={styles.recurrenceOverlay}
                activeOpacity={1}
                onPress={() => setShowRecurrenceDropdown(false)}
              />
              <View style={styles.recurrenceDropdown}>
                <ScrollView
                  style={styles.recurrenceDropdownScroll}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {recurrenceOptions.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.recurrenceItem,
                        selectedRecurrence === option &&
                        styles.recurrenceItemSelected,
                      ]}
                      onPress={() => handleRecurrenceSelect(option)}
                    >
                      <Text
                        style={[
                          styles.recurrenceItemText,
                          selectedRecurrence === option &&
                          styles.recurrenceItemTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                      {selectedRecurrence === option && (
                        <LinearGradient
                          colors={['#18F06E', '#0B6DE0']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.recurrenceCheckmark}
                        >
                          <FeatherIcon name="check" size={12} color="white" />
                        </LinearGradient>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </>
          )}
          <TextInput
            style={styles.descriptionInput}
            placeholder="Add description"
            value={description}
            onChangeText={setDescription}
            multiline
            placeholderTextColor="#888"
          />
        </View>
      </ScrollView>

      {/* Calendar with Time Modal */}
      <CalendarWithTime
        isVisible={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        onDateTimeSelect={handleDateTimeSelect}
      />


      <Modal
        visible={showCustomRecurrenceModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCustomRecurrenceModal(false)}
      >
        <View style={styles.customModalOverlay}>
          <View style={styles.customRecurrenceModalContainer}>
            {/* Modal Header */}
            <View style={styles.customModalHeader}>
              <Text style={styles.customModalTitle}>Custom recurrence</Text>
            </View>

            <View style={styles.customRecurrenceContent}>
              {/* Repeat every section */}
              <View style={styles.customRecurrenceSection}>
                <Text style={styles.customRecurrenceSectionTitle}>
                  Repeat every
                </Text>
                <View style={styles.customRepeatEveryRow}>
                  <TextInput
                    style={styles.customRepeatEveryInput}
                    value={customRecurrence.repeatEvery}
                    onChangeText={text =>
                      setCustomRecurrence(prev => ({
                        ...prev,
                        repeatEvery: text,
                      }))
                    }
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <View style={styles.customRepeatUnitDropdown}>
                    <Text style={styles.customRepeatUnitText}>
                      {customRecurrence.repeatUnit}
                    </Text>
                    <FeatherIcon
                      name="chevron-down"
                      size={16}
                      color="#6C6C6C"
                    />
                  </View>
                </View>
              </View>

              {/* Repeat on section */}
              {customRecurrence.repeatUnit === repeatUnits[1] && (
                <View style={styles.customRecurrenceSection}>
                  <Text style={styles.customRecurrenceSectionTitle}>
                    Repeat on
                  </Text>
                  <View style={styles.customDaysRow}>
                    {dayAbbreviations.map((day, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.customDayButton,
                          customRecurrence.repeatOn.includes(dayNames[index]) &&
                          styles.customDayButtonSelected,
                        ]}
                        onPress={() => handleDayToggle(dayNames[index])}
                      >
                        <Text
                          style={[
                            styles.customDayButtonText,
                            customRecurrence.repeatOn.includes(
                              dayNames[index],
                            ) && styles.customDayButtonTextSelected,
                          ]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Ends section */}
              <View style={styles.customRecurrenceSection}>
                <Text style={styles.customRecurrenceSectionTitle}>Ends</Text>

                <TouchableOpacity
                  style={styles.customEndsOption}
                  onPress={() =>
                    setCustomRecurrence(prev => ({
                      ...prev,
                      endsType: endsOptions[0],
                    }))
                  }
                >
                  <View style={styles.customRadioButton}>
                    {customRecurrence.endsType === endsOptions[0] && (
                      <View style={styles.customRadioButtonSelected} />
                    )}
                  </View>
                  <Text style={styles.customEndsOptionText}>
                    {endsOptions[0]}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.customEndsOption}
                  onPress={() =>
                    setCustomRecurrence(prev => ({
                      ...prev,
                      endsType: endsOptions[1],
                    }))
                  }
                >
                  <View style={styles.customRadioButton}>
                    {customRecurrence.endsType === endsOptions[1] && (
                      <View style={styles.customRadioButtonSelected} />
                    )}
                  </View>
                  <Text style={styles.customEndsOptionText}>
                    {endsOptions[1]}
                  </Text>
                  <TextInput
                    style={[
                      styles.customEndsInput,
                      customRecurrence.endsType !== endsOptions[1] &&
                      styles.customEndsInputDisabled,
                    ]}
                    value={customRecurrence.endsDate}
                    onChangeText={text =>
                      setCustomRecurrence(prev => ({ ...prev, endsDate: text }))
                    }
                    placeholder="04/09/2025"
                    placeholderTextColor="#9E9E9E"
                    editable={customRecurrence.endsType === endsOptions[1]}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.customEndsOption}
                  onPress={() =>
                    setCustomRecurrence(prev => ({
                      ...prev,
                      endsType: endsOptions[2],
                    }))
                  }
                >
                  <View style={styles.customRadioButton}>
                    {customRecurrence.endsType === endsOptions[2] && (
                      <View style={styles.customRadioButtonSelected} />
                    )}
                  </View>
                  <Text style={styles.customEndsOptionText}>
                    {endsOptions[2]}
                  </Text>
                  <TextInput
                    style={[
                      styles.customEndsInput,
                      customRecurrence.endsType !== endsOptions[2] &&
                      styles.customEndsInputDisabled,
                    ]}
                    value={customRecurrence.endsAfter}
                    onChangeText={text =>
                      setCustomRecurrence(prev => ({
                        ...prev,
                        endsAfter: text,
                      }))
                    }
                    keyboardType="numeric"
                    editable={customRecurrence.endsType === endsOptions[2]}
                  />
                  <Text style={styles.customEndsOccurrencesText}>
                    occurrences
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.customModalActions}>
              <TouchableOpacity
                style={styles.customCancelButton}
                onPress={() => setShowCustomRecurrenceModal(false)}
              >
                <Text style={styles.customCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.customDoneButton}
                onPress={handleCustomRecurrenceDone}
              >
                <LinearGradient
                  colors={['#18F06E', '#0B6DE0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.customDoneButtonGradient}
                >
                  <Text style={styles.customDoneButtonText}>Done</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomActionBar}>
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          disabled={isLoading}
          onPress={createTask}
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
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
    gap: 20,
  },
  inputSection: {
    marginBottom: spacing.lg,
  },
  inputUnderline: {
    height: 1,
    backgroundColor: colors.grey20,
  },
  titleInput: {
    fontSize: fontSize.textSize20,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minHeight: scaleHeight(50),
  },
  timeComponentPlaceholder: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  placeholderText: {
    color: "#a0a0a0",
    fontStyle: "italic",
  },
  datePicker:
  {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: spacing.md
  },
  descriptionInput: {
    backgroundColor: "#F6F7F9",
    borderRadius: 8,
    textAlignVertical: "top", // Aligns text to the top for Android
    borderWidth: 1,
    borderColor: "#e0e0e0",
    fontSize: fontSize.textSize18,
    color: colors.textPrimary,
    padding: spacing.md,
    minHeight: scaleHeight(150),

  },
  pickerContainer: {
    width: 165,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  bottomActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: spacing.xl,
    marginHorizontal: scaleWidth(20),
    paddingBottom: scaleHeight(50),
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
  buttonContainer: {
    padding: 20,
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  button: {
    backgroundColor: "#007AFF", // A standard blue for buttons
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  selectorText: {
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    fontWeight: '400',
    marginLeft: spacing.sm,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  //Recurrence Styles

  // Recurrence Dropdown Styles
  recurrenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: spacing.sm,
  },
  recurrenceDropdown: {
    position: 'absolute',
    top: scaleHeight(160),
    left: scaleWidth(20),
    right: scaleWidth(20),
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
    zIndex: 1001,
    paddingVertical: scaleHeight(8),
    maxHeight: scaleHeight(400),
  },
  recurrenceDropdownScroll: {
    maxHeight: scaleHeight(360),
  },
  recurrenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    minHeight: scaleHeight(44),
  },
  recurrenceItemSelected: {
    backgroundColor: '#F0F8FF',
  },
  recurrenceItemText: {
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    fontWeight: '400',
    flex: 1,
  },
  recurrenceItemTextSelected: {
    color: Colors.primaryblue,
    fontWeight: '500',
  },
  recurrenceCheckmark: {
    width: scaleWidth(16),
    height: scaleHeight(16),
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Custom Recurrence Modal Styles
  customRecurrenceModalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '60%',
    paddingBottom: scaleHeight(40),
  },
  customRecurrenceContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },

  // Custom Modal Styles
  customModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  customModalHeader: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  customModalTitle: {
    fontSize: fontSize.textSize20,
    fontWeight: '600',
    color: colors.blackText,
  },
  customRecurrenceSection: {
    marginBottom: spacing.xl,
  },
  customRecurrenceSectionTitle: {
    fontSize: fontSize.textSize16,
    fontWeight: '600',
    color: colors.blackText,
    marginBottom: spacing.md,
  },
  customRepeatEveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  customRepeatEveryInput: {
    width: scaleWidth(60),
    height: scaleHeight(40),
    borderWidth: 1,
    borderColor: '#DCE0E5',
    borderRadius: borderRadius.sm,
    textAlign: 'center',
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    paddingHorizontal: 4,
  },
  customRepeatUnitDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE0E5',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    height: scaleHeight(40),
    minWidth: scaleWidth(80),
  },
  customRepeatUnitText: {
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    fontWeight: '400',
    marginRight: spacing.xs,
  },
  customDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  customDayButton: {
    width: scaleWidth(40),
    height: scaleHeight(40),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCE0E5',
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customDayButtonSelected: {
    backgroundColor: Colors.primaryblue,
    borderColor: Colors.primaryblue,
  },
  customDayButtonText: {
    fontSize: fontSize.textSize14,
    fontWeight: '500',
    color: colors.blackText,
  },
  customDayButtonTextSelected: {
    color: colors.white,
  },
  customEndsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  customRadioButton: {
    width: scaleWidth(20),
    height: scaleHeight(20),
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#DCE0E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customRadioButtonSelected: {
    width: scaleWidth(10),
    height: scaleHeight(10),
    borderRadius: 5,
    backgroundColor: Colors.primaryblue,
  },
  customEndsOptionText: {
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    fontWeight: '400',
    minWidth: scaleWidth(40),
  },
  customEndsInput: {
    width: scaleWidth(100),
    height: scaleHeight(32),
    borderWidth: 1,
    borderColor: '#DCE0E5',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    fontSize: fontSize.textSize14,
    color: colors.blackText,
  },
  customEndsInputDisabled: {
    backgroundColor: '#F5F5F5',
    color: '#9E9E9E',
  },
  customEndsOccurrencesText: {
    fontSize: fontSize.textSize14,
    color: colors.blackText,
    marginLeft: spacing.xs,
  },
  customModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  customCancelButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: '#F3F4F6',
  },
  customCancelButtonText: {
    fontSize: fontSize.textSize16,
    fontWeight: '500',
    color: '#6B7280',
  },
  customDoneButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  customDoneButtonGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  customDoneButtonText: {
    fontSize: fontSize.textSize16,
    fontWeight: '600',
    color: colors.white,
  },
  recurrenceOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
});

export default CreateTaskScreen;