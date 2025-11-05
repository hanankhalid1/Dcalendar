import CryptoJS from 'crypto-js';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEventsStore } from '../stores/useEventsStore';

const ENCRYPTION_KEY = 'NcogDmailSecureConnection2024!';

export function handleNcogResponse(url: string): boolean | void {
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
          let payload = JSON.parse(params.data);
          console.log('📦 [Ncog Handler] Initial payload:', payload);

          // Handle different payload formats
          if (Array.isArray(payload)) {
            if (payload.length > 0 && typeof payload[0] === 'string') {
              console.log('📦 [Ncog Handler] Parsing stringified array items...');
              payload = payload.map(item => {
                try {
                  if (!item || typeof item !== 'string' || item.trim() === '') {
                    return null;
                  }
                  return JSON.parse(item);
                } catch (parseError) {
                  console.warn('⚠️ Failed to parse item in payload array:', item, parseError);
                  return null;
                }
              }).filter(item => item !== null);
            }
          } else if (payload && typeof payload === 'object') {
            if (payload.messages && Array.isArray(payload.messages)) {
              console.log('📦 [Ncog Handler] Found messages property, using it');
              payload = payload.messages;
            } else if (payload.data && Array.isArray(payload.data)) {
              console.log('📦 [Ncog Handler] Found data property, using it');
              payload = payload.data;
            }
          }

          console.log('✅ [Ncog Handler] Final parsed payload:', payload);
          
          // Enhanced appointment detection and logging
          if (Array.isArray(payload)) {
            const appointmentsInPayload = payload.filter((item: any) => 
              item?.uid?.startsWith('appt_') || 
              item?.appointment_uid?.startsWith('appt_') ||
              item?.appointment_title ||
              (item && typeof item === 'object' && 
               (JSON.stringify(item).includes('appointment') ||
                item.list?.some((listItem: any) => 
                  listItem.key === 'appointment' || listItem.value?.includes('appointment')
                )))
            );
            
            console.log('📅 [Ncog Handler] Appointments found in payload:', appointmentsInPayload.length);
            if (appointmentsInPayload.length > 0) {
              console.log('📅 [Ncog Handler] Appointment details:', appointmentsInPayload.map(apt => ({
                uid: apt?.uid,
                appointment_uid: apt?.appointment_uid,
                title: apt?.title || apt?.appointment_title,
                hasFromTime: !!apt?.fromTime,
                hasToTime: !!apt?.toTime,
                list: apt?.list,
              })));
            }
          }

          if (Array.isArray(payload) && payload.length > 0) {
            // Helper function to decode hex strings (like web code does)
            const decodeHex = (hexString: string | null | undefined): string => {
              if (!hexString || typeof hexString !== 'string') return '';
              try {
                // Check if it's a hex string (starts with 0x or all hex chars)
                let hex = hexString;
                if (hex.startsWith('0x')) {
                  hex = hex.substring(2);
                }
                // Remove leading "22" if present (common prefix in hex-encoded strings)
                if (hex.startsWith('22') && hex.length > 2) {
                  hex = hex.substring(2);
                }
                // Convert hex to string
                let result = '';
                for (let i = 0; i < hex.length; i += 2) {
                  const hexChar = hex.substr(i, 2);
                  const charCode = parseInt(hexChar, 16);
                  if (charCode > 0 && charCode < 128) { // Valid ASCII range
                    result += String.fromCharCode(charCode);
                  }
                }
                return result.trim() || hexString; // Return original if decode fails
              } catch {
                return hexString; // Return original if decode fails
              }
            };
            
            // Normalize appointment data structure to ensure consistency
            const normalizedPayload = payload.map((item: any) => {
              // Check if this is an appointment
              const isAppointment = item?.uid?.startsWith('appt_') || 
                                   item?.appointment_uid?.startsWith('appt_') ||
                                   item?.list?.some((listItem: any) => 
                                     listItem.key === 'appointment' || listItem.value?.includes('appointment')
                                   );
              
              if (isAppointment) {
                // Decode hex-encoded title and description
                const decodedTitle = decodeHex(item.appointment_title) || decodeHex(item.title) || item.appointment_title || item.title || 'Untitled Appointment';
                const decodedDescription = decodeHex(item.appointment_description) || decodeHex(item.description) || item.appointment_description || item.description || '';
                
                console.log('📝 [Ncog Handler] Decoding appointment:', {
                  uid: item.uid,
                  raw_title: item.title,
                  raw_appointment_title: item.appointment_title,
                  decoded_title: decodedTitle
                });
                
                // Normalize appointment structure
                return {
                  ...item,
                  // Ensure both uid fields are present
                  uid: item.uid || item.appointment_uid || `appt_${Date.now()}`,
                  appointment_uid: item.appointment_uid || item.uid || `appt_${Date.now()}`,
                  // Ensure both title fields are present with DECODED values
                  title: decodedTitle, // ✅ Use decoded title
                  appointment_title: decodedTitle, // ✅ Use decoded title
                  // Ensure both description fields are present with DECODED values
                  description: decodedDescription, // ✅ Use decoded description
                  appointment_description: decodedDescription, // ✅ Use decoded description
                  // Ensure fromTime/toTime are strings (can be empty for appointments)
                  fromTime: item.fromTime || '',
                  toTime: item.toTime || '',
                  // Ensure list/tags are present
                  list: item.list || item.tags || [
                    { 
                      key: 'appointment', 
                      value: 'appointment',
                      color: '#18F06E'
                    }
                  ],
                };
              }
              
              // Return regular events as-is
              return item;
            });
            
            useEventsStore.getState().setUserEvents(normalizedPayload);
            console.log('✅ [Ncog Handler] Events updated in store. Count:', normalizedPayload.length);
            
            // Log final appointment count
            const finalAppointments = normalizedPayload.filter((item: any) => 
              item?.uid?.startsWith('appt_') || 
              item?.appointment_uid?.startsWith('appt_')
            );
            console.log('📅 [Ncog Handler] Final appointment count in store:', finalAppointments.length);
            if (finalAppointments.length > 0) {
              console.log('📅 [Ncog Handler] Normalized appointments:', finalAppointments.map(apt => ({
                uid: apt.uid,
                title: apt.title,
                hasFromTime: !!apt.fromTime,
                listLength: apt.list?.length || 0
              })));
            }
          } else {
            console.warn('⚠️ [Ncog Handler] No valid events in payload');
          }
        } catch (parseError) {
          console.error('❌ Failed to parse payload data:', params.data, parseError);
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
