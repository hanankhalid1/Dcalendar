import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../hooks/useApi';

export interface Event {
  uid: string;
  title: string;
  description: string;
  fromTime: string;
  toTime: string;
  organizer: string;
  guests: string[];
  location: string;
  locationType: 'inperson' | 'zoom' | 'google';
  meetingEventId?: string;
  busy: string;
  visibility: string;
  notification: string;
  guest_permission: string;
  seconds: number;
  trigger: string;
  timezone: string;
  repeatEvent?: any;
  customRepeatEvent?: any;
  done?: string;
  list: EventMetadata[];
}
export interface EventMetadata {
  key: string;
  value: any;
}

// Legacy interfaces for backward compatibility
export interface EventData {
  uid: string;
  fromTime: string;
  toTime: string;
  repeatEvent: string;
  customRepeatEvent: string;
}

export const generateEventUID = () => {
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r & 3) | 8;
    return v.toString(16);
  });
};
export const validateEventData = (
  eventData: Partial<Event>,
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!eventData.title || eventData.title.trim().length === 0) {
    errors.push('Title is required');
  }
  if (!eventData.fromTime) {
    errors.push('Start time is required');
  }
  if (!eventData.toTime) {
    errors.push('End time is required');
  }
  if (!eventData.organizer) {
    errors.push('Organizer is required');
  }

  if (eventData.fromTime && eventData.toTime) {
    const startTime = new Date(eventData.fromTime);
    const endTime = new Date(eventData.toTime);
    if (startTime >= endTime) {
      errors.push('End time must be after start time');
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
};
export const convertToISO8601Duration = (
  timeOptions: any,
  seconds: number,
): string => {
  console.log("converting time with tiemOptions:", timeOptions, "and seconds:", seconds);
  const timeOption = timeOptions?.value || 'Minutes';
  switch (timeOption) {
    case 'Minutes':
      return `PT${seconds / 60}M`;
    case 'Hours':
      return `PT${seconds / 3600}H`;
    case 'Days':
      return `P${seconds / 86400}D`;
    case 'Weeks':
      return `P${seconds / 604800}W`;
    default:
      return `PT${seconds / 60}M`;
  }
};

export const buildEventMetadata = (
  eventData: Event,
  conferencingData?: any,
): EventMetadata[] => {
  const metadata: EventMetadata[] = [];

  console.log("Building metadata for event:", eventData);
  // Location information - only add if not empty
  if (eventData.location && eventData.location.trim().length > 0) {
    metadata.push({ key: 'location', value: eventData.location });

  }
  if (eventData.locationType == "google") {
    metadata.push({ key: 'locationType', value: eventData.locationType });
    metadata.push({ key: 'meetingEventId', value: eventData.meetingEventId });
  } else if (eventData.locationType == "inperson") {
    metadata.push({ key: 'locationType', value: 'inperson' });
  }

  const isTask = (eventData.list || []).find(
    (item: any) => item.key === 'task'
  );

  if (isTask) {

    (eventData.list || []).forEach((item: any) => {
      if (item.key === 'task') {
        metadata.push({ key: item.key, value: item.value });
        metadata.push({ key: 'done', value: item.done });
      }
    });
  }
  //Checking if event is marked as deleted
  const isDeletedItem = (eventData.list || []).find(
    (item: any) => item.key === 'isDeleted')


  if (isDeletedItem) {
    // Push both isDeleted and deletedTime items from the list into metadata
    (eventData.list || []).forEach((item: any) => {
      if (item.key === 'isDeleted' || item.key === 'deletedTime') {
        metadata.push({ key: item.key, value: item.value });
      }
    });
  }
  console.log("metadata after isDeleted check:", metadata);

  const isPermanentDeletedItem = (eventData.list || []).find(
    (item: any) => item.key === 'isPermanentDelete')

  if (isPermanentDeletedItem) {
    // Push both isPermanentDeleted and permanentDeletedTime items from the list into metadata
    (eventData.list || []).forEach((item: any) => {
      if (item.key === 'isPermanentDelete') {
        metadata.push({ key: item.key, value: item.value });
      }
    });
  }

  console.log("metadata after isPermanentDelete check:", metadata);
  // Guest information
  if (eventData.guests && eventData.guests.length > 0) {
    eventData.guests.forEach(guest => {
      metadata.push({ key: 'guest', value: guest });
    });
  }

  // Event settings
  metadata.push({ key: 'busy', value: eventData.busy || 'Busy' });
  metadata.push({
    key: 'visibility',
    value: eventData.visibility || 'Default Visibility',
  });
  metadata.push({
    key: 'notification',
    value: eventData.notification || 'Email',
  });
  metadata.push({
    key: 'guest_permission',
    value: eventData.guest_permission || 'Modify event',
  });

  // Notification settings
  if (eventData.seconds && eventData.seconds > 0) {
    metadata.push({ key: 'seconds', value: eventData.seconds.toString() });
    metadata.push({
      key: 'trigger',
      value: eventData.trigger,
    });
  }

  // Organizer information
  metadata.push({ key: 'organizer', value: eventData.organizer });

  // Timezone information
  if (eventData.timezone) {
    metadata.push({ key: 'timezone', value: eventData.timezone });
  }

  // Recurring event information
  if (eventData.repeatEvent) {
    metadata.push({ key: 'repeatEvent', value: eventData.repeatEvent });
  }

  if (eventData.customRepeatEvent) {
    metadata.push({
      key: 'customRepeatEvent',
      value: eventData.customRepeatEvent,
    });
  }

  // Filter out undefined or empty values
  return metadata.filter(
    entry => entry.value !== undefined && entry.value !== '',
  );
};
export const prepareEventForBlockchain = (
  eventData: Event,
  metadata: EventMetadata[],
  uid: string,
): any => {
  return {
    uid: uid,
    title: eventData.title,
    description: eventData.description || '',
    fromTime: eventData.fromTime,
    toTime: eventData.toTime,
    done: false,
    list: metadata,
  };
};
export const encryptWithNECJS = async (
  data: string,
  publicKey: string,
  token: string,
  uid: string[],
): Promise<string> => {
  try {
    console.log("data before encrypting", data);

    const { WalletModule } = require('react-native').NativeModules;
    const encrypted = await WalletModule.encryptMobile(publicKey, data);


    if (!encrypted || typeof encrypted.encrypted !== 'string') {
      throw new Error('Invalid encrypted data from WalletModule');
    }

    const requestData = {
      msg: [
        {
          encryptedData: encrypted.encrypted,
          version: encrypted.version || 'v1',
        },
      ],
      uid: uid,
    };

    try {
      const response = await apiClient.post(
        '/getEncryptCalendarValue',
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      // extract server encrypted data (if any)
      const dataArr =
        response.data?.data?.encryptedData ??
        response.data?.encryptedData ??
        response.data?.data ??
        response.data;

      const encryptedData = Array.isArray(dataArr) ? dataArr[0] : dataArr;
      console.log('Encrypted data from server:', encryptedData);
      return encryptedData || encrypted.encrypted;
    } catch {
      // fallback to local encryption if server fails
      return encrypted.encrypted;
    }
  } catch (err: any) {
    throw new Error(
      `NECJS encryption failed: ${err?.message || 'Unknown error'}`,
    );
  }
};

export const getContactCollection = async () => {
  try {
    const data = await AsyncStorage.getItem('ContactCollection');
    return data ? JSON.parse(data) : { data: [] };
  } catch (error) {
    console.error('Error getting contact collection:', error);
    return { data: [] };
  }
};

export const getContactDecryptedValue = async () => {
  try {
    const data = await AsyncStorage.getItem('ContactDecryptedValue');
    return data ? JSON.parse(data) : { data: [] };
  } catch (error) {
    console.error('Error getting contact decrypted value:', error);
    return { data: [] };
  }
};
export const storeContactCollection = async (contacts: any[]) => {
  try {
    await AsyncStorage.setItem(
      'ContactCollection',
      JSON.stringify({ data: contacts }),
    );
    console.log('✅ Contact collection stored locally');
  } catch (error) {
    console.error('Error storing contact collection:', error);
  }
};
