import AsyncStorage from '@react-native-async-storage/async-storage';

export const debugLogDcontacts = async () => {
  try {
    const contactsJson = await AsyncStorage.getItem('dcontacts');
    if (!contactsJson) {
      console.log('No dcontacts found in AsyncStorage.');
      return [];
    }
    const contacts = JSON.parse(contactsJson);
    console.log('dcontacts in AsyncStorage:', contacts);
    return contacts;
  } catch (e) {
    console.error('Error reading dcontacts from AsyncStorage:', e);
    return [];
  }
};
