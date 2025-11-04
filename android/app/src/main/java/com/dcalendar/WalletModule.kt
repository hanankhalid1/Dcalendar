package com.dcalendar

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments

// Import the mobile apps functions from mobile_apps.aar
import mobile_apps.Mobile_apps

class WalletModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "WalletModule"
    }

    // Mobile App Functions from mobile_apps.aar

    // 1. Key Generation
    @ReactMethod
    fun keyGenMobile(promise: Promise) {
        try {
            val keyPair = Mobile_apps.keyGenMobile()
            val result = Arguments.createMap().apply {
                putString("pubKey", keyPair.pubKey)
                putString("privKey", keyPair.privKey)
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("KEY_GEN_ERROR", e.message)
        }
    }

    // 2. Asymmetric Encryption
    @ReactMethod
    fun encryptMobile(pubKeyHex: String, message: String, promise: Promise) {
        try {
            val encryptedResult = Mobile_apps.encryptMobile(pubKeyHex, message)
            val result = Arguments.createMap().apply {
                putString("encrypted", encryptedResult.encrypted)
                putString("version", encryptedResult.version)
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ENCRYPT_ERROR", e.message)
        }
    }

    // 3. Asymmetric Decryption
    @ReactMethod
    fun decryptMobile(privKeyHex: String, encryptedData: String, version: String, promise: Promise) {
        try {
            val decryptedText = Mobile_apps.decryptMobile(privKeyHex, encryptedData, version)
            promise.resolve(decryptedText)
        } catch (e: Exception) {
            promise.reject("DECRYPT_ERROR", e.message)
        }
    }

    // 4. Symmetric Encryption
    @ReactMethod
    fun symEncryptMobile(ssKeyHex: String, message: String, promise: Promise) {
        try {
            val encryptedResult = Mobile_apps.symEncryptMobile(ssKeyHex, message)
            val result = Arguments.createMap().apply {
                putString("encrypted", encryptedResult.encrypted)
                putString("version", encryptedResult.version)
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("SYM_ENCRYPT_ERROR", e.message)
        }
    }

    // 5. Symmetric Decryption
    @ReactMethod
    fun symDecryptMobile(ssKeyHex: String, encryptedData: String, version: String, promise: Promise) {
        try {
            val decryptedText = Mobile_apps.symDecryptMobile(ssKeyHex, encryptedData, version)
            promise.resolve(decryptedText)
        } catch (e: Exception) {
            promise.reject("SYM_DECRYPT_ERROR", e.message)
        }
    }

    // 6. Private Key to Wallet Address
    @ReactMethod
    fun privateKeyToWalletAddressMobile(privateKeyHex: String, promise: Promise) {
        try {
            val address = Mobile_apps.privateKeyToWalletAddressMobile(privateKeyHex)
            promise.resolve(address)
        } catch (e: Exception) {
            promise.reject("ADDRESS_ERROR", e.message)
        }
    }

    // 7. Sign Transaction
    @ReactMethod
    fun signTransactionMobile(txArgs: ReadableMap, privKeyHex: String, promise: Promise) {
        try {
            // Convert ReadableMap to JSON string for the Go function
            val txArgsMap = convertReadableMapToMap(txArgs)
            val txArgsJson = org.json.JSONObject(txArgsMap).toString()
            
            val signedResult = Mobile_apps.signTransactionMobile(txArgsJson, privKeyHex)
            val result = Arguments.createMap().apply {
                putString("rawTransaction", signedResult.rawTransaction)
                putString("hash", signedResult.hash)
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("SIGN_TX_ERROR", e.message)
        }
    }

    // 8. Decode RLP Transaction
    @ReactMethod
    fun decodeRLPTransactionMobile(rlpHex: String, promise: Promise) {
        try {
            val decodedResult = Mobile_apps.decodeRLPTransactionMobile(rlpHex)
            val result = Arguments.createMap().apply {
                // Note: fields might be a different type, using placeholder
                // putArray("fields", Arguments.fromArray(decodedResult.fields.toTypedArray()))
                putInt("count", decodedResult.count.toInt())
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("DECODE_RLP_ERROR", e.message)
        }
    }

    // Helper function to convert ReadableMap to Map<String, Any>
    private fun convertReadableMapToMap(readableMap: ReadableMap): Map<String, Any> {
        val map = mutableMapOf<String, Any>()
        val iterator = readableMap.keySetIterator()
        while (iterator.hasNextKey()) {
            val key = iterator.nextKey()
            when (readableMap.getType(key)) {
                com.facebook.react.bridge.ReadableType.Null -> map[key] = null as Any
                com.facebook.react.bridge.ReadableType.Boolean -> map[key] = readableMap.getBoolean(key)
                com.facebook.react.bridge.ReadableType.Number -> map[key] = readableMap.getDouble(key)
                com.facebook.react.bridge.ReadableType.String -> map[key] = readableMap.getString(key) ?: ""
                com.facebook.react.bridge.ReadableType.Array -> map[key] = readableMap.getArray(key)?.toArrayList() ?: ArrayList<Any>()
                com.facebook.react.bridge.ReadableType.Map -> map[key] = convertReadableMapToMap(readableMap.getMap(key) ?: Arguments.createMap())
            }
        }
        return map
    }
}