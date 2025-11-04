import CryptoJS from 'crypto-js';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEventsStore } from '../stores/useEventsStore';

const ENCRYPTION_KEY = 'NcogDmailSecureConnection2024!';

export function handleNcogResponse(url: string): boolean | void {
  if (url.startsWith('dcalendar://ncog-response')) {
    const params = parseUrlParams(url);
    console.log('====================================');
    console.log('params', params);

    if (params.success === 'true') {
      if (params?.data) {
        let payload = JSON.parse(params.data); // first parse

        // if payload is an array of stringified objects, parse again
        if (Array.isArray(payload) && typeof payload[0] === 'string') {
          payload = payload.map(item => JSON.parse(item));
        }
        useEventsStore.getState().setUserEvents(payload);
        console.log('Payload', payload);
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
