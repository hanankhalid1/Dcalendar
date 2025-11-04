import { NECJSPRIVATE_KEY } from '../constants/Config';
import { BlockchainService } from '../services/BlockChainService';
import { useToken } from '../stores/useTokenStore';

export interface Guest {
  id: string;
  name: string;
  email: string;
  username: string;
  avatar?: string;
}

// Guest search response interface
export interface GuestSearchResponse {
  success: boolean;
  data: Guest[];
  error?: string;
}
export const extractNameFromEmail = (email: string): string => {
  const localPart = email.split('@')[0];
  // Convert dots and underscores to spaces and capitalize
  return localPart
    .replace(/[._]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
export const extractUsernameFromEmail = (email: string): string => {
  return email.split('@')[0];
};

export const getAllContacts = async (user) => {
  try {
    const blockchainService = new BlockchainService(NECJSPRIVATE_KEY);

    // Get token from useToken store
    const token = useToken.getState().token;
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Get the active account email/username for contact lookup
    // The token should contain user information - we need to extract it // Default fallback

    try {
      // Try to extract user info from token if it's a JWT
      if (typeof token === 'string' && token.includes('.')) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        user =
          payload.userName ||
          payload.email ||
          payload.username ||
          'default_user';
      }
    } catch (e) {
      console.warn('Could not parse token, using default user:', e);
    }

    // Get contact details using EventsService
    const contactEmails = await blockchainService.getContactDetails(user);


    // Convert emails to Guest objects
    const guests: Guest[] = contactEmails.map((email, index) => ({
      id: `guest_${index}_${Date.now()}`,
      name: extractNameFromEmail(email),
      email: email,
      username: extractUsernameFromEmail(email),
      avatar: undefined,
    }));


    return {
      success: true,
      data: guests,
    };
  } catch (error: any) {
    return {
      success: false,
      data: [],
      error: error.message || 'Failed to get contacts',
    };
  }
};
