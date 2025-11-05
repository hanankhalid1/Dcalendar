import CryptoJS from 'crypto-js';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEventsStore } from '../stores/useEventsStore';

const ENCRYPTION_KEY = 'NcogDmailSecureConnection2024!';

export function handleNcogResponse(url: string): boolean | void {
  // Only process valid Ncog response URLs
  if (!url || typeof url !== 'string') {
    return;
  }

  if (url.startsWith('dcalendar://ncog-response')) {
    const params = parseUrlParams(url);
    console.log('====================================');
    console.log(' [Ncog Handler] Received response params:', params);
    console.log('====================================');

    if (params.success === 'true') {
      if (params?.data) {
        try {
          let payload = JSON.parse(params.data); // first parse
          console.log('📦 [Ncog Handler] Initial payload:', payload);
          console.log('📦 [Ncog Handler] Payload type:', typeof payload);
          console.log('📦 [Ncog Handler] Is array:', Array.isArray(payload));

          // Handle different payload formats
          if (Array.isArray(payload)) {
            // If payload is an array of stringified objects, parse again
            if (payload.length > 0 && typeof payload[0] === 'string') {
              console.log('📦 [Ncog Handler] Parsing stringified array items...');
              payload = payload.map(item => {
                try {
                  // Skip empty strings or invalid JSON
                  if (!item || typeof item !== 'string' || item.trim() === '') {
                    return null;
                  }
                  return JSON.parse(item);
                } catch (parseError) {
                  console.warn('⚠️ Failed to parse item in payload array:', item, parseError);
                  return null; // Return null for invalid items instead of crashing
                }
              }).filter(item => item !== null); // Remove null entries
            }
          } else if (payload && typeof payload === 'object') {
            // Handle object format with messages property
            if (payload.messages && Array.isArray(payload.messages)) {
              console.log('📦 [Ncog Handler] Found messages property, using it');
              payload = payload.messages;
            } else if (payload.data && Array.isArray(payload.data)) {
              console.log('📦 [Ncog Handler] Found data property, using it');
              payload = payload.data;
            }
          }

          console.log('✅ [Ncog Handler] Final parsed payload:', payload);
          console.log('✅ [Ncog Handler] Payload length:', Array.isArray(payload) ? payload.length : 'N/A');
          
          // Log appointments in the payload
          if (Array.isArray(payload)) {
            const appointmentsInPayload = payload.filter((item: any) => 
              item?.uid?.startsWith('appt_') || 
              item?.appointment_uid?.startsWith('appt_') ||
              item?.appointment_title ||
              (item && typeof item === 'object' && JSON.stringify(item).includes('appointment'))
            );
            console.log('📅 [Ncog Handler] Appointments found in payload:', appointmentsInPayload.length);
            if (appointmentsInPayload.length > 0) {
              console.log('📅 [Ncog Handler] Appointment samples:', appointmentsInPayload.slice(0, 2).map(apt => ({
                uid: apt?.uid,
                appointment_uid: apt?.appointment_uid,
                title: apt?.title,
                appointment_title: apt?.appointment_title,
                keys: Object.keys(apt || {}),
              })));
            }
          }

          if (Array.isArray(payload) && payload.length > 0) {
            // Get blockchain metadata to merge with decrypted data
            const store = useEventsStore.getState();
            const blockchainMetadata = store.blockchainEventsMetadata || [];
            console.log('📋 [Ncog Handler] Blockchain metadata available:', blockchainMetadata.length);
            
            // Merge decrypted data with blockchain metadata (to preserve uid)
            const mergedPayload = payload.map((decryptedItem: any, index: number) => {
              // Try to match by index or UUID
              const blockchainItem = blockchainMetadata[index];
              
              if (blockchainItem) {
                // Merge blockchain metadata (uid, title from blockchain) with decrypted data
                const merged = {
                  ...decryptedItem,
                  uid: blockchainItem.uid || decryptedItem.uid || decryptedItem.appointment_uid,
                  uuid: blockchainItem.uuid || decryptedItem.uuid,
                  title: blockchainItem.title || decryptedItem.title || decryptedItem.appointment_title,
                  description: decryptedItem.description || decryptedItem.appointment_description || blockchainItem.description,
                  fromTime: blockchainItem.fromTime || decryptedItem.fromTime || '',
                  toTime: blockchainItem.toTime || decryptedItem.toTime || '',
                  done: blockchainItem.done || decryptedItem.done || false,
                  list: decryptedItem.list || blockchainItem.list || [],
                };
                
                // Log if this is an appointment
                if (merged.uid?.startsWith('appt_')) {
                  console.log('📅 [Ncog Handler] Merged appointment:', {
                    uid: merged.uid,
                    title: merged.title,
                    hasDecryptedData: !!decryptedItem.appointment_title,
                  });
                }
                
                return merged;
              }
              
              // If no blockchain metadata, return as-is
              return decryptedItem;
            });
            
            console.log('✅ [Ncog Handler] Merged payload length:', mergedPayload.length);
            
            // Log appointments in merged payload
            const appointmentsInMerged = mergedPayload.filter((item: any) => 
              item?.uid?.startsWith('appt_') || 
              item?.appointment_uid?.startsWith('appt_')
            );
            console.log('📅 [Ncog Handler] Appointments in merged payload:', appointmentsInMerged.length);
            
            useEventsStore.getState().setUserEvents(mergedPayload);
            console.log('✅ [Ncog Handler] Events updated in store. Count:', mergedPayload.length);
          } else {
            console.warn('⚠️ [Ncog Handler] No valid events in payload');
          }
        } catch (parseError) {
          console.error('❌ Failed to parse payload data:', params.data, parseError);
          // Don't crash if JSON parsing fails, just log the error
        }
      } else {
        console.warn('⚠️ [Ncog Handler] No data in response params');
      }
      const walletData = {
        walletAddress: decryptData(params.encryptedWalletAddress),
        publicKey: params.dilithiumPublicKey,
        encryptPublicKey: decryptData(params.encryptedEncryptPublicKey),
        dataUserAddress: decryptData(params.encryptedDataUserAddress),
      };

      console.log('✅ Connected to Ncog!', walletData);
      // TODO: Store or use walletData in your app (e.g., Redux, context, etc.)
    } else {
      console.log('❌ Connection failed:', params.error);
    }
  }
  if (url.startsWith('dcalendar://registration-response')) {
    const params = parseUrlParams(url);

    if (params.success === 'true') {
      AsyncStorage.setItem('token', JSON.stringify({ ...params }));

      return true;
    } else {
      return false;
      console.log('Registration failed:', params.error);
    }
  }

  // Your app sends this URL to Ncog
}

function parseUrlParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const urlParts = url.split('?');
  if (urlParts.length > 1) {
    const queryString = urlParts[1];
    const pairs = queryString.split('&');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    }
  }
  return params;
}

function decryptData(encryptedData: string): string {
  try {
    if (encryptedData.startsWith('fallback:')) {
      const base64Data = encryptedData.substring(9);
      const decoded = CryptoJS.enc.Base64.parse(base64Data).toString(
        CryptoJS.enc.Utf8,
      );
      return decoded.split('').reverse().join('');
    }

    if (encryptedData.startsWith('base64:')) {
      const base64Data = encryptedData.substring(7);
      return CryptoJS.enc.Base64.parse(base64Data).toString(CryptoJS.enc.Utf8);
    }

    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.log('⚠️ Decryption failed, returning as-is');
    return encryptedData;
  }
}

export function encryptData(plainText: string): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(
      plainText,
      ENCRYPTION_KEY,
    ).toString();
    return encrypted;
  } catch (error) {
    console.log('Encryption failed encryptData:', error);
    return plainText;
  }
}
