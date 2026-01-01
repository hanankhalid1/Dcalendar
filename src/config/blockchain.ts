// Blockchain Configuration for React Native
// Environment Variables Required

// Import ABI files
import Config from '.';
import { 
  CALENDAR_CONTRACT_ABI,
  HOST_CONTRACT_ABI,
  HELPER_CONTRACT_ABI
} from '../abis';

// Required environment variables for blockchain integration
const blockchainConfig = {
  // Private key for blockchain transactions (ML-KEM format)

  // Contract addresses
  CALENDARS_CONTRACT_ADDRESS: Config.CONTRACT_ADDRESSES.CALENDAR_ADDRESS || "0xC0A845e30eAcc8d9aa493E413018Ce5ddb67f02f",
  DMAIL_HOST_CONTRACT_ADDRESS: Config.CONTRACT_ADDRESSES.HOST  || "0x954f17AA1923c59c61Fa97DE73Ca5575E5E0A680",
  DMAIL_HELPER_CONTRACT_ADDRESS: Config.CONTRACT_ADDRESSES.HELPER_CONTRACT  || "0x3613d4cED2863384be1C6f298E9ce27dCcA4f8B0",
  

};

// Required contract ABIs
const contractABIs = {
  calendar: CALENDAR_CONTRACT_ABI,
  dmailHost: HOST_CONTRACT_ABI,
  dmailHelper: HELPER_CONTRACT_ABI
};

// Contract instances configuration
const contractConfig = {
  calendars: {
    address: blockchainConfig.CALENDARS_CONTRACT_ADDRESS,
    abi: contractABIs.calendar
  },
  dmailHost: {
    address: blockchainConfig.DMAIL_HOST_CONTRACT_ADDRESS,
    abi: contractABIs.dmailHost
  },
  dmailHelper: {
    address: blockchainConfig.DMAIL_HELPER_CONTRACT_ADDRESS,
    abi: contractABIs.dmailHelper
  }
};

// Export configurations
export {
  blockchainConfig,
  contractABIs,
  contractConfig
};

export default blockchainConfig;
