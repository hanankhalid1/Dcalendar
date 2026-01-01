// import CryptoJS from "crypto-js";
// import pako from "pako";

import WalletModule from "../NecSdk/WalletModule";

// /**
//  * Step 1: Compress data using GZIP and Base64 encode it
//  */
// export const compressAndEncode = (data: any): string => {
//   const jsonString = JSON.stringify(data);
//   const compressed = pako.gzip(jsonString);
//   return Buffer.from(compressed).toString("base64");
// };

// /**
//  * Step 2: AES encrypt the compressed data
//  */
// export const encryptData = (compressedBase64: string, key: string): string => {
//   const encrypted = CryptoJS.AES.encrypt(compressedBase64, key).toString();
//   return encrypted;
// };




 export const encryptWithNECJS = async (data: string, publicKey: string): Promise<string> => {
  try {
    console.log('🔐 Encrypting data with NECJS...');
    const encrypted = await WalletModule.encryptMobile(publicKey, data);

    console.log("NECJS ENCRYTOTION DATA",encrypted)
    
    if (encrypted) {
      console.log('✅ Data encrypted successfully with NECJS');
      return encrypted.encrypted
    } else {
      throw new Error(`NECJS encryption failed: `);
    }
  } catch (error:any) {
    console.error('❌ Error encrypting with NECJS:', error);
    throw new Error(`NECJS encryption failed: ${error?.message}`);
  }
};