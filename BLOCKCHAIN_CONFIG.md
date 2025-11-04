# Blockchain Configuration Guide

## Environment Variables Required

Create a `.env` file in your project root with the following variables:

```bash
# Blockchain Network Configuration
NEC_PRIVATE_KEY=your_private_key_here
NEC_RPC_URL=https://api-test-pqs.ncogchain.earth
CHAIN_ID=2479
CHAIN_NAME=NCOG EARTH CHAIN
CURRENCY_SYMBOL=NEC
BLOCK_EXPLORER_URL=https://explorer-test.ncogchain.earth

# Contract Addresses
CALENDARS_CONTRACT_ADDRESS=0xC0A845e30eAcc8d9aa493E413018Ce5ddb67f02f
DMAIL_HOST_CONTRACT_ADDRESS=0x954f17AA1923c59c61Fa97DE73Ca5575E5E0A680
DMAIL_HELPER_CONTRACT_ADDRESS=0x3613d4cED2863384be1C6f298E9ce27dCcA4f8B0

# API Configuration
API_BASE_URL=https://dev-api.bmail.earth

# Security
CRYPTO_SECRET=your_crypto_secret_here
```

## Contract ABI Files

The following ABI files are already configured in `/src/abis/`:

- `CalendarsAbi.json` - Calendar contract ABI
- `EmailHostContractAbi.json` - Dmail Host contract ABI
- `HelperContractAbi.json` - Helper contract ABI

## Configuration Files

### `/src/config/blockchain.ts`

Contains the blockchain configuration that:

- Loads environment variables with fallback defaults
- Imports ABI files
- Exports contract configurations
- Provides blockchain service initialization parameters

### `/src/config/index.ts`

Contains the existing configuration with hardcoded values (used as fallbacks)

## Usage in EventsService

The `EventsService` now automatically:

- Loads blockchain configuration from environment variables
- Initializes `BlockchainService` with proper contract addresses and ABIs
- Uses the configured RPC URL and private key for blockchain operations

## React Native Environment Variables

For React Native, you may need to use a library like `react-native-config` to access environment variables:

```bash
npm install react-native-config
```

Then access variables using:

```typescript
import Config from 'react-native-config';

const privateKey = Config.NEC_PRIVATE_KEY;
```

## Security Notes

- Never commit your `.env` file to version control
- Use different private keys for development and production
- Keep your private keys secure and never share them
- Consider using environment-specific configuration files
