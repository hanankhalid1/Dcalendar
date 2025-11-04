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
