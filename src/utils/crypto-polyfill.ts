// Web Crypto API Polyfill for React Native
// This provides a basic implementation of crypto.getRandomValues for React Native

// Polyfill crypto.getRandomValues for React Native
if (typeof global !== 'undefined' && !global.crypto) {
  try {
    const { randomBytes } = require('react-native-get-random-values');
    
    (global as any).crypto = {
      getRandomValues: (array: any) => {
        const bytes = randomBytes(array.length);
        array.set(bytes);
        return array;
      }
    };
  } catch (error) {
    // Fallback implementation if react-native-get-random-values is not available
    (global as any).crypto = {
      getRandomValues: (array: any) => {
        // Simple fallback using Math.random (not cryptographically secure)
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      }
    };
  }
}

export {};