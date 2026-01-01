export interface WalletModule {
    // Key Generation
    keyGenMobile(): Promise<{ pubKey: string; privKey: string }>;
    
    // Address Generation
    privateKeyToWalletAddressMobile(privateKey: string): Promise<string>;
    
    // Encryption
    encryptMobile(pubKeyHex: string, message: string): Promise<{ encrypted: string; version: string }>;
    decryptMobile(privKeyHex: string, encryptedData: string, version: string): Promise<string>;
    
    // Transaction Signing
    signTransactionMobile(txArgs: any, privateKey: string): Promise<any>;
    decodeRLPTransactionMobile(txHex: string): Promise<any>;
    
    // Symmetric Encryption
    symEncryptMobile(ssKey: string, message: string): Promise<{ encrypted: string; version: string }>;
    symDecryptMobile(ssKey: string, encryptedData: string, version: string): Promise<string>;
  }
  
  declare global {
    interface NativeModulesStatic {
      WalletModule: WalletModule;
    }
  }