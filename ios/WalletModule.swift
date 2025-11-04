import Foundation
import React
import MobileApps

@objc(WalletModule)
class WalletModule: NSObject {
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    // MARK: - Key Generation
    
    @objc
    func keyGenMobile(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        var error: NSError?
        if let keyPair = Mobile_appsKeyGenMobile(&error) {
            let result: [String: Any] = [
                "pubKey": keyPair.pubKey,
                "privKey": keyPair.privKey
            ]
            resolve(result)
        } else if let error = error {
            reject("KEY_GEN_ERROR", error.localizedDescription, error)
        } else {
            reject("KEY_GEN_ERROR", "Unknown error", nil)
        }
    }
    
    // MARK: - Address Generation
    
    @objc
    func privateKeyToWalletAddressMobile(_ privateKey: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        var error: NSError?
        let address = Mobile_appsPrivateKeyToWalletAddressMobile(privateKey, &error)
        if error == nil {
            resolve(address)
        } else if let error = error {
            reject("ADDRESS_ERROR", error.localizedDescription, error)
        } else {
            reject("ADDRESS_ERROR", "Unknown error", nil)
        }
    }
    
    // MARK: - Encryption
    
    @objc
    func encryptMobile(_ pubKeyHex: String, message: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        var error: NSError?
        if let encryptedResult = Mobile_appsEncryptMobile(pubKeyHex, message, &error) {
            let result: [String: Any] = [
                "encrypted": encryptedResult.encrypted,
                "version": encryptedResult.version
            ]
            resolve(result)
        } else if let error = error {
            reject("ENCRYPT_ERROR", error.localizedDescription, error)
        } else {
            reject("ENCRYPT_ERROR", "Unknown error", nil)
        }
    }
    
    @objc
    func decryptMobile(_ privKeyHex: String, encryptedData: String, version: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        var error: NSError?
        let decryptedText = Mobile_appsDecryptMobile(privKeyHex, encryptedData, version, &error)
        if error == nil {
            resolve(decryptedText)
        } else if let error = error {
            reject("DECRYPT_ERROR", error.localizedDescription, error)
        } else {
            reject("DECRYPT_ERROR", "Unknown error", nil)
        }
    }
    
    // MARK: - Transaction Signing
    
    @objc
    func signTransactionMobile(_ txArgs: [String: Any], privateKey: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        var error: NSError?
        
        // Convert txArgs dictionary to JSON string
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: txArgs, options: [])
            guard let txArgsJson = String(data: jsonData, encoding: .utf8) else {
                reject("JSON_ERROR", "Failed to convert txArgs to JSON string", nil)
                return
            }
            
            if let signedTx = Mobile_appsSignTransactionMobile(txArgsJson, privateKey, &error) {
                resolve(signedTx)
            } else if let error = error {
                reject("SIGN_ERROR", error.localizedDescription, error)
            } else {
                reject("SIGN_ERROR", "Unknown error", nil)
            }
        } catch {
            reject("JSON_ERROR", "Failed to serialize txArgs to JSON: \(error.localizedDescription)", error)
        }
    }
    
    @objc
    func decodeRLPTransactionMobile(_ txHex: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        var error: NSError?
        if let decoded = Mobile_appsDecodeRLPTransactionMobile(txHex, &error) {
            resolve(decoded)
        } else if let error = error {
            reject("DECODE_ERROR", error.localizedDescription, error)
        } else {
            reject("DECODE_ERROR", "Unknown error", nil)
        }
    }
    
    // MARK: - Symmetric Encryption
    
    @objc
    func symEncryptMobile(_ ssKey: String, message: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        var error: NSError?
        if let encryptedResult = Mobile_appsSymEncryptMobile(ssKey, message, &error) {
            let result: [String: Any] = [
                "encrypted": encryptedResult.encrypted,
                "version": encryptedResult.version
            ]
            resolve(result)
        } else if let error = error {
            reject("SYM_ENCRYPT_ERROR", error.localizedDescription, error)
        } else {
            reject("SYM_ENCRYPT_ERROR", "Unknown error", nil)
        }
    }
    
    @objc
    func symDecryptMobile(_ ssKey: String, encryptedData: String, version: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        var error: NSError?
        let decryptedText = Mobile_appsSymDecryptMobile(ssKey, encryptedData, version, &error)
        if error == nil {
            resolve(decryptedText)
        } else if let error = error {
            reject("SYM_DECRYPT_ERROR", error.localizedDescription, error)
        } else {
            reject("SYM_DECRYPT_ERROR", "Unknown error", nil)
        }
    }
}
