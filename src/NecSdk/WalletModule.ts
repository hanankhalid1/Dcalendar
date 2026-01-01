import { NativeModules } from 'react-native';

if (NativeModules.WalletModule) {
  console.log('WalletModule methods:', Object.keys(NativeModules.WalletModule));
} else {
  console.log('WalletModule is null/undefined');
}

// Type definitions for mobile app functions
export interface KeyPair {
  pubKey: string;
  privKey: string;
}

export interface EncryptedResult {
  encrypted: string;
  version: string;
}

export interface SignedTxResult {
  rawTransaction: string;
  hash: string;
}

export interface DecodedRLP {
  fields: string[];
  count: number;
}

export interface TransactionArgs {
  [key: string]: any;
}

interface WalletModuleInterface {
  // Mobile App Functions
  keyGenMobile(): Promise<KeyPair>;
  encryptMobile(pubKeyHex: string, message: string): Promise<EncryptedResult>;
  decryptMobile(privKeyHex: string, encryptedData: string, version: string): Promise<string>;
  symEncryptMobile(ssKeyHex: string, message: string): Promise<EncryptedResult>;
  symDecryptMobile(ssKeyHex: string, encryptedData: string, version: string): Promise<string>;
  privateKeyToWalletAddressMobile(privateKeyHex: string): Promise<string>;
  signTransactionMobile(txArgs: TransactionArgs, privKeyHex: string): Promise<SignedTxResult>;
  decodeRLPTransactionMobile(rlpHex: string): Promise<DecodedRLP>;
}

const { WalletModule } = NativeModules;

export default WalletModule as WalletModuleInterface;