import React from 'react';
import { Linking } from 'react-native';

export const parseTimeToPST = (dateString: string) => {
    if (!dateString || dateString.length < 15) return null;

    const year = dateString.slice(0, 4);
    const month = dateString.slice(4, 6); // 01-12
    const day = dateString.slice(6, 8); // 01-31
    const hour = dateString.slice(9, 11); // 00-23
    const minute = dateString.slice(11, 13); // 00-59
    const second = dateString.slice(13, 15); // 00-59

    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
};

export const formatToISO8601 = (date: Date, time: string): string => {
  const [hours, minutes] = time.split(':');
  const newDate = new Date(date);
  newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

  // Format as YYYYMMDDTHHMMSS
  const year = newDate.getFullYear();
  const month = String(newDate.getMonth() + 1).padStart(2, '0');
  const day = String(newDate.getDate()).padStart(2, '0');
  const hour = String(newDate.getHours()).padStart(2, '0');
  const minute = String(newDate.getMinutes()).padStart(2, '0');
  const second = String(newDate.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hour}${minute}${second}`;
};

// Helper function to check if an event/task is in the past
export const isEventInPast = (event: any): boolean => {
  if (!event || !event.fromTime) {
    return false; // If no fromTime, consider it not in past (can't determine)
  }

  try {
    const now = new Date();
    now.setSeconds(0, 0);

    // Parse fromTime format: YYYYMMDDTHHMMSS (e.g., "20251120T173000")
    const fromTime = event.fromTime;
    if (fromTime.length < 15) {
      return false; // Invalid format
    }

    const year = parseInt(fromTime.substring(0, 4), 10);
    const month = parseInt(fromTime.substring(4, 6), 10) - 1; // Month is 0-indexed
    const day = parseInt(fromTime.substring(6, 8), 10);
    const hour = parseInt(fromTime.substring(9, 11), 10);
    const minute = parseInt(fromTime.substring(11, 13), 10);

    const eventDate = new Date(year, month, day, hour, minute, 0);

    return eventDate < now;
  } catch (error) {
    console.error('Error checking if event is in past:', error);
    return false; // On error, allow editing (safer default)
  }
};

export const requestBulkDecrypt = async (
  appId: string,
  returnScheme: string,
  encryptedMessages: Array<string | { encrypted: string; version?: string }>,
) => {
  try {
    const requestId = `req_${Date.now()}`;
    const returnUrl = `dcalendar://ncog-response`;
    console.log('====================================');
    console.log('encrypted message', encryptedMessages);
    console.log('====================================');
    const url =
      `ncog://request?` +
      `appId=${encodeURIComponent(appId)}` +
      `&action=${encodeURIComponent('bulkDecrypt')}` +
      `&requestId=${encodeURIComponent(requestId)}` +
      `&encryptedMessages=${encodeURIComponent(
        JSON.stringify(encryptedMessages),
      )}` +
      `&version=${encodeURIComponent('v1')}` +
      `&returnUrl=${encodeURIComponent(returnUrl)}`;
    console.log('====================================');
    console.log(url);
    console.log('====================================');
    await Linking.openURL(url);
  } catch (err: any) {
    console.log('❌ Failed to open Ncog app:', err.message || err);
  }
};
