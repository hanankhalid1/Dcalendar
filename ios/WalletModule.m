#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WalletModule, NSObject)

// Key Generation
RCT_EXTERN_METHOD(keyGenMobile:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Address Generation
RCT_EXTERN_METHOD(privateKeyToWalletAddressMobile:(NSString *)privateKey
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Encryption
RCT_EXTERN_METHOD(encryptMobile:(NSString *)pubKeyHex
                  message:(NSString *)message
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(decryptMobile:(NSString *)privKeyHex
                  encryptedData:(NSString *)encryptedData
                  version:(NSString *)version
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Transaction Signing
RCT_EXTERN_METHOD(signTransactionMobile:(NSDictionary *)txArgs
                  privateKey:(NSString *)privateKey
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(decodeRLPTransactionMobile:(NSString *)txHex
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Symmetric Encryption
RCT_EXTERN_METHOD(symEncryptMobile:(NSString *)ssKey
                  message:(NSString *)message
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(symDecryptMobile:(NSString *)ssKey
                  encryptedData:(NSString *)encryptedData
                  version:(NSString *)version
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
