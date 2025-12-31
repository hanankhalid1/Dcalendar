import { Guest as GuestType, extractNameFromEmail as extractName, extractUsernameFromEmail as extractUsername } from './gueastUtils';
export type Guest = GuestType;
export const extractNameFromEmail = extractName;
export const extractUsernameFromEmail = extractUsername;
import { getLocalContacts } from './dcontactsUtils';
import { getAllContacts } from './gueastUtils';
import { BlockchainService } from '../services/BlockChainService';
import { requestBulkDecrypt } from './index';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Provider } from 'necjs';
import Config from '../config';

// Helper: fetch all encrypted contacts from blockchain in pages
async function fetchAllEncryptedContacts(user: string, contractAddress: string, provider: any, pageSize = 1000) {
  const contactsContract = new BlockchainService().contactContract;
  const totalCount = await contactsContract.methods.getContactsCount(user).call();
  const totalCountNum = Number(totalCount);
  if (totalCountNum === 0) return [];
  let allContacts: any[] = [];
  for (let offset = 0; offset < totalCountNum; offset += pageSize) {
    const pageOfContacts = await contactsContract.methods.getEncryptedContacts(user, offset, pageSize).call();
    allContacts.push(...pageOfContacts);
  }
  return allContacts;
}

// Main function: fetch, merge, decrypt, filter, deduplicate, and persist contacts (web parity)
export const updateAndGetUnifiedContacts = async (userName: string): Promise<Guest[]> => {
  // 1. Always fetch latest from all sources (blockchain, decrypted, local)
  const provider = new Provider(Config.RPC_URL);
  const contractAddress = Config.CONTRACT_ADDRESSES.DCONTACT_ADDRESS;
  let encryptedContacts: any[] = [];
  try {
    encryptedContacts = await fetchAllEncryptedContacts(userName, contractAddress, provider);
  } catch (e) {
    encryptedContacts = [];
  }

  // 2. Get locally decrypted UUIDs and decrypted contacts
  let decryptedValue: any = await AsyncStorage.getItem('ContactDecryptedValue');
  let decryptedData: any[] = [];
  if (decryptedValue) {
    try {
      const parsed = JSON.parse(decryptedValue);
      decryptedData = parsed?.data || [];
    } catch {}
  }
  const decryptedUUIDs = new Set(decryptedData.map((d: any) => d.decryptedUUID));

  // 3. Find encrypted contacts not yet decrypted
  const toDecrypt = encryptedContacts.filter(c => c.uuid && !decryptedUUIDs.has(c.uuid));
  // 4. Bulk decrypt new contacts if any (trigger, but user must re-fetch for results)
  if (toDecrypt.length > 0) {
    const encryptedMessages = toDecrypt.map(c => ({ encrypted: c.encryptedData, version: c.version || 'v1', uuid: c.uuid }));
    await requestBulkDecrypt('dcalendar', 'dcalendar', encryptedMessages);
    // After decryption, user must re-fetch or listen for decrypted results (not handled here)
  }

  // 5. Get local dcontacts (emails added locally)
  let localGuests: Guest[] = [];
  try {
    localGuests = await getLocalContacts();
  } catch (e) {
    localGuests = [];
  }

  // 6. Get original blockchain contacts (email-only, as in original code)
  let originalBlockchainGuests: Guest[] = [];
  try {
    const result = await getAllContacts(userName);
    if (result.success && Array.isArray(result.data)) {
      originalBlockchainGuests = result.data;
    }
  } catch (e) {
    originalBlockchainGuests = [];
  }

  // 6. Merge all decrypted contacts, local contacts, and contract contacts


  // Decrypted contacts (from decryptedData)
  const decryptedGuests: Guest[] = decryptedData.map((c: any, idx: number) => ({
    id: c.contactId || c.decryptedUUID || `decrypted_${idx}`,
    name: c.name || (c.email ? extractNameFromEmail(c.email) : 'Unknown'),
    email: c.email || '',
    username: c.email ? extractUsernameFromEmail(c.email) : '',
    avatar: undefined,
    attributes: c.attributes || [],
  })).filter(c => !!c.email);

  // Blockchain contacts (encrypted, fallback if not decrypted)
  // Always include all blockchain contacts, even if missing email/name
  const blockchainGuests: Guest[] = encryptedContacts
    .filter(c => !decryptedUUIDs.has(c.uuid))
    .map((c: any, idx: number) => ({
      id: c.contactId || c.uuid || `blockchain_${idx}`,
      name: c.name || (c.email ? extractNameFromEmail(c.email) : 'Unknown'),
      email: c.email || '',
      username: c.email ? extractUsernameFromEmail(c.email) : '',
      avatar: undefined,
      attributes: c.attributes || [],
    }));

  // If a blockchain contact is missing email, still include it with a fallback id
  const blockchainGuestsWithFallback = blockchainGuests.map((g, idx) => ({
    ...g,
    email: g.email || `unknown_blockchain_${g.id || idx}@unknown`,
    username: g.username || `unknown_${g.id || idx}`,
  }));

  // Log all sources for debugging
  console.log('[unifiedContacts] Decrypted contacts:', decryptedGuests);
  console.log('[unifiedContacts] Blockchain contacts:', blockchainGuestsWithFallback);
  console.log('[unifiedContacts] Local dcontacts:', localGuests);
  console.log('[unifiedContacts] Original blockchain contacts:', originalBlockchainGuests);

  // 7. Merge all sources (including original blockchain contacts)
  const allContacts = [
    ...decryptedGuests,
    ...blockchainGuestsWithFallback,
    ...localGuests,
    ...originalBlockchainGuests,
  ];


  // 8. Filter out deleted/permanently deleted contacts (only if attributes are present and valid)
  const filteredContacts = allContacts.filter(contact => {
    if (!contact.attributes || !Array.isArray(contact.attributes)) return true;
    return !contact.attributes.some((attr: any) =>
      (attr.key === 'isDeleted' && attr.value === 'true') ||
      (attr.key === 'isPermanentlyDeleted' && attr.value === 'true')
    );
  });

  // 9. Deduplicate by email (case-insensitive), only for contacts with valid, non-empty emails
  const guestMap = new Map<string, Guest>();
  filteredContacts.forEach((contact: any) => {
    if (contact.email && typeof contact.email === 'string' && contact.email.trim() !== '') {
      const em = contact.email.toLowerCase();
      if (!guestMap.has(em)) {
        guestMap.set(em, contact);
      }
    }
  });
  // Log deduplication keys
  console.log('[unifiedContacts] Deduplication keys:', Array.from(guestMap.keys()));

  // 10. Store the merged, deduplicated, filtered contact list in AsyncStorage
  const mergedContacts = Array.from(guestMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  await AsyncStorage.setItem('ContactCollection', JSON.stringify({ data: mergedContacts }));

  // 11. Always return the freshly merged list
  return mergedContacts;
};
