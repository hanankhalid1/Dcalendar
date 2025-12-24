import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Guest {
  id: string;
  name: string;
  email: string;
  username: string;
  avatar?: string;
}

export const extractNameFromEmail = (email: string): string => {
  const localPart = email.split('@')[0];
  return localPart
    .replace(/[._]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
export const extractUsernameFromEmail = (email: string): string => {
  return email.split('@')[0];
};

// Fetch contacts from local AsyncStorage (DContacts)
export const getLocalContacts = async (): Promise<Guest[]> => {
  try {
    const contactsJson = await AsyncStorage.getItem('dcontacts');
    if (!contactsJson) return [];
    const contacts: string[] = JSON.parse(contactsJson);
    return contacts
      .filter(email => typeof email === 'string' && email.trim() !== '')
      .map((email, index) => ({
        id: `guest_${index}_${Date.now()}`,
        name: extractNameFromEmail(email),
        email,
        username: extractUsernameFromEmail(email),
        avatar: undefined,
      }));
  } catch (error) {
    console.error('Failed to fetch local contacts:', error);
    return [];
  }
};

// Add one or more emails to local AsyncStorage (DContacts), deduplicating
export const addEmailsToLocalContacts = async (emails: string[]): Promise<void> => {
  try {
    const contactsJson = await AsyncStorage.getItem('dcontacts');
    let contacts: string[] = [];
    if (contactsJson) {
      contacts = JSON.parse(contactsJson);
    }
    // Merge and deduplicate
    const emailSet = new Set([
      ...contacts.filter(e => typeof e === 'string' && e.trim() !== ''),
      ...emails.filter(e => typeof e === 'string' && e.trim() !== ''),
    ]);
    await AsyncStorage.setItem('dcontacts', JSON.stringify(Array.from(emailSet)));
  } catch (error) {
    console.error('Failed to add emails to local contacts:', error);
  }
};
