import { Alert, Linking } from 'react-native';
import CryptoJS from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/hooks/useApi';

type WalletData = {
  walletAddress: string;
  publicKey: string;
  encryptPublicKey: string;
  dataUserAddress: string;
};

type NcogParams = {
  [key: string]: string;
  success?: string;
  error?: string;
  encryptedWalletAddress?: string;
  dilithiumPublicKey?: string;
  encryptedEncryptPublicKey?: string;
  encryptedDataUserAddress?: string;
};



class NcogIntegration {
  private appName: string;
  private returnUrlScheme: string;
  private encryptionKey: string;

  constructor(appName: string, returnUrlScheme: string) {
    this.appName = appName;
    this.returnUrlScheme = returnUrlScheme;
    this.encryptionKey = 'NcogGenericSecureConnection2024!';

    // Linking.addEventListener('url', this.handleResponse.bind(this));
  }



async initNcog() {
  try {
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      // this.handleResponse({ url: initialUrl });
    }

    const token = await AsyncStorage.getItem("token");

    if (token) {
      console.log("Found existing registration, connecting...");
      await this.connectToNcog();
    } else {
      console.log("No registration found, registering...");
      await this.registerWithNcog();
    }
  } catch (err) {
    console.log("Error initializing Ncog:", err);
  }
}


  
  // Register app with Ncog
async registerWithNcog(): Promise<void> {
    const requestId = `reg_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const registrationUrl = `ncog://register?appId=dcalendar&displayName=${encodeURIComponent(
      this.appName,
    )}&description=${encodeURIComponent(
      'My awesome app',
    )}&requestedActions=encrypt,decrypt,connect&urlScheme=${
      this.returnUrlScheme
    }://&requestId=${requestId}`;
    console.log('Registering with Ncog...', registrationUrl);
    try {
      await Linking.openURL(registrationUrl);
    } catch (error) {
      console.log('Failed to open Ncog for registration:', error);
    }
  }

  // Connect to Ncog wallet
  async connectToNcog(): Promise<void> {
    const requestId = `req_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const requestUrl = `ncog://connect?fromApp=${this.appName}&responseUrl=${this.returnUrlScheme}://ncog-response&autoApprove=false&requestId=${requestId}`;

    console.log('Connecting to Ncog...', requestUrl);

    try {
      await Linking.openURL(requestUrl);
    } catch (error) {
      console.log('Failed to open Ncog:', error);
    }
  }


  private encryptData(plainText: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(
        plainText,
        this.encryptionKey,
      ).toString();
      return encrypted;
    } catch (error) {
      console.log('Encryption failed encryptData2 :', error);
      return plainText;
    }
  }

  // Decrypt data from Ncog
   decryptData(encryptedData: string): string {
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
        return CryptoJS.enc.Base64.parse(base64Data).toString(
          CryptoJS.enc.Utf8,
        );
      }

      const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.log('Decryption failed, returning as-is');
      return encryptedData;
    }
  }

  // Parse URL parameters
  private parseUrlParams(url: string): NcogParams {
    const params: NcogParams = {};
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

  // Callback when wallet is connected
  protected onWalletConnected(walletData: WalletData): void {
    console.log('Wallet connected!');
    console.log('Wallet Address:', walletData.walletAddress);
    console.log('Public Key:', walletData.publicKey);
    console.log('Encrypt Public Key:', walletData.encryptPublicKey);
    console.log('Data User Address:', walletData.dataUserAddress);

    // Extend or override this method to use wallet data
  }

  // Callback when connection fails
  protected onConnectionFailed(error: string): void {
    console.log('Connection failed:', error);

    // Extend or override this method to handle errors
  }
}

export default NcogIntegration;