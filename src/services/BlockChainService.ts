//@ts-nocheck
import { Contract, Provider } from 'necjs';
import { Alert, NativeModules } from 'react-native';
import {
  CALENDAR_CONTRACT_ABI,
  CONTACT_CONTRACT_ABI,
  HELPER_CONTRACT_ABI,
  HOST_CONTRACT_ABI,
  USER_REGISTRY_ABI,
} from '../abis/index';
import Config from '../config';
import { blockchainConfig } from '../config/blockchain';
import { NECJSPRIVATE_KEY } from '../constants/Config';
import { useToken } from '../stores/useTokenStore';
import {
  buildEventMetadata,
  encryptWithNECJS,
  Event,
  generateEventUID,
  getContactCollection,
  getContactDecryptedValue,
  prepareEventForBlockchain,
  storeContactCollection,
  validateEventData,
} from '../utils/eventUtils';
import {
  extractNameFromEmail,
  extractUsernameFromEmail
} from '../utils/gueastUtils';
import moment from 'moment';

const { WalletModule } = NativeModules;

// Use RPC URL from environment with fallback to config
const RPC_URL = Config.RPC_URL;

// Use contract addresses from environment with fallback to config
const CONTRACT_ADDRESSES = {
  HOST: blockchainConfig.DMAIL_HOST_CONTRACT_ADDRESS,
  USER_REGISTRY: Config.CONTRACT_ADDRESSES.USER_ADDRESS,
  HELPER: blockchainConfig.DMAIL_HELPER_CONTRACT_ADDRESS,
  CONTACT: Config.CONTRACT_ADDRESSES.DCONTACT_ADDRESS,
  CALENDAR: blockchainConfig.CALENDARS_CONTRACT_ADDRESS,
};

export class BlockchainService {
  provider: Provider;
  privateKey?: string;
  hostContract: Contract;
  userRegistryContract: Contract;
  helperContract: Contract;
  contactContract: Contract;
  calendarContract: Contract;

  constructor(privateKey?: string) {
    try {
      this.provider = new Provider(RPC_URL);
      // Use provided private key or fallback to environment/config
      this.privateKey = privateKey || Config.NECJSPK;
      this.hostContract = new Contract(
        CONTRACT_ADDRESSES.HOST,
        HOST_CONTRACT_ABI,
        this.provider,
      );
      this.userRegistryContract = new Contract(
        CONTRACT_ADDRESSES.USER_REGISTRY,
        USER_REGISTRY_ABI,
        this.provider,
      );

      // Test provider connection
      this.provider
        .getBlockNumber()
        .then(blockNumber => {
          // Provider connection test successful
        })
        .catch((error: any) => {
          console.error('❌ Provider connection failed:', error.message);
          // Dispatch to UI: showToast, retry mechanism, or trigger wallet reconnection
        });

      // Initialize contracts
      try {
        this.hostContract = new Contract(
          CONTRACT_ADDRESSES.HOST,
          HOST_CONTRACT_ABI,
          this.provider,
        );
      } catch (error) {
        console.error('❌ Failed to create Host Contract:', error);
      }

      try {
        this.userRegistryContract = new Contract(
          CONTRACT_ADDRESSES.USER_REGISTRY,
          USER_REGISTRY_ABI,
          this.provider,
        );
      } catch (error) {
        console.error('❌ Failed to create User Registry Contract:', error);
      }

      try {
        this.helperContract = new Contract(
          CONTRACT_ADDRESSES.HELPER,
          HELPER_CONTRACT_ABI,
          this.provider,
        );
      } catch (error) {
        console.error('❌ Failed to create Helper Contract:', error);
      }

      try {
        this.contactContract = new Contract(
          CONTRACT_ADDRESSES.CONTACT,
          CONTACT_CONTRACT_ABI,
          this.provider,
        );
      } catch (error) {
        console.error('❌ Failed to create Contact Contract:', error);
      }

      try {
        this.calendarContract = new Contract(
          CONTRACT_ADDRESSES.CALENDAR,
          CALENDAR_CONTRACT_ABI,
          this.provider,
        );
      } catch (error) {
        console.error('❌ Failed to create Calendar Contract:', error);
      }

      // Verify contract deployments after initialization
      this.verifyContractDeployments().catch(error => {
        console.error('❌ Error during contract verification:', error);
      });
    } catch (error) {
      console.error(
        '❌ Critical error during BlockchainService initialization:',
        error,
      );
      throw error;
    }
  }
  getUserRegistryContract() {
    return this.userRegistryContract;
  }


  private async safeCall<T>(
    method: (...args: any[]) => Promise<T>,
    ...params: any[]
  ): Promise<T> {
    try {
      console.log('📞 Making contract call...');
      const result = await method(...params);
      console.log('✅ Contract call successful');
      return result;
    } catch (error: any) {
      console.error('❌ Contract call failed:', error.message);
      console.error('🔍 Error details:', {
        message: error.message,
        code: error.code,
        data: error.data,
      });
      throw error;
    }
  }

  // Method to verify contract deployment status

  async getSettings(username: string) {
    try {
      console.log('🔍 Fetching settings for username:', username);

      const rawSettings = await this.safeCall(
        async () =>
          await this.calendarContract.methods.getSettings(username).call(),
      );

      console.log(
        '📥 Raw settings response:',
        JSON.stringify(rawSettings, null, 2),
      );

      // Transform the nested tuple structure into a cleaner format
      const formattedSettings = rawSettings.map(
        (setting: any, index: number) => {
          return {
            index,
            contacts: setting.contact.map((c: any) => ({
              key: c.key,
              value: c.value,
            })),
          };
        },
      );

      console.log('✅ Formatted settings:', formattedSettings);
      return formattedSettings;
    } catch (error: any) {
      console.error('❌ Failed to fetch settings:', error.message);
      throw error;
    }
  }

  async updateSettings(username: string, key: string, options: Array<{ key: string; value: string }>) {
    try {
      console.log('🔧 Updating settings for username:', username, 'key:', key);
      console.log('📤 Settings options:', options);

      const helperContract = new Contract(
        CONTRACT_ADDRESSES.HELPER,
        HELPER_CONTRACT_ABI,
        this.provider,
      );

      const walletAddress = await this.getWalletAddress(Config.NECJSPK);
      const wallet = this.provider.getSigner(walletAddress);

      const gasEstimate = await helperContract
        .connect(wallet)
        .methods.updateSettings(username, key, options)
        .estimateGas();

      console.log('⛽ Gas estimate:', gasEstimate.toString());

      const tx = await helperContract
        .connect(wallet)
        .methods.updateSettings(username, key, options)
        .send({ gasLimit: gasEstimate });

      console.log('✅ Settings updated successfully. Transaction:', tx);
      return tx;
    } catch (error: any) {
      console.error('❌ Failed to update settings:', error.message);
      throw error;
    }
  }

  async verifyContractDeployments(): Promise<void> {
    console.log('🔍 Verifying contract deployments...');

    const contracts = [
      {
        name: 'Host Contract',
        address: CONTRACT_ADDRESSES.HOST,
        contract: this.hostContract,
      },
      {
        name: 'User Registry Contract',
        address: CONTRACT_ADDRESSES.USER_REGISTRY,
        contract: this.userRegistryContract,
      },
      {
        name: 'Helper Contract',
        address: CONTRACT_ADDRESSES.HELPER,
        contract: this.helperContract,
      },
      {
        name: 'Contact Contract',
        address: CONTRACT_ADDRESSES.CONTACT,
        contract: this.contactContract,
      },
      {
        name: 'Calendar Contract',
        address: CONTRACT_ADDRESSES.CALENDAR,
        contract: this.calendarContract,
      },
    ];

    for (const contract of contracts) {
      try {
        console.log(`🔍 Checking ${contract.name}...`);
        const code = await this.provider.getCode(contract.address);

        if (code === '0x') {
          console.log(
            `❌ ${contract.name} is NOT deployed at ${contract.address}`,
          );
        } else {
          console.log(`✅ ${contract.name} is deployed at ${contract.address}`);
          console.log(`📊 Contract code length: ${code.length} characters`);
        }
      } catch (error) {
        console.error(`❌ Error checking ${contract.name}:`, error);
      }
    }

    console.log('🎉 Contract deployment verification completed!');
  }

  // Utility method to get wallet address from private key
  async getWalletAddress(privateKey?: string): Promise<string> {
    const key = privateKey || this.privateKey;
    if (!key) {
      throw new Error('🔐 Private key is required to get wallet address');
    }
    return await WalletModule.privateKeyToWalletAddressMobile(key);
  }

  // Utility method to generate a new wallet
  async generateWallet(): Promise<{
    address: string;
    publicKey: string;
    privateKey: string;
  }> {
    const keyPair = await WalletModule.keyGenMobile();
    const address = await WalletModule.privateKeyToWalletAddressMobile(
      keyPair.privKey,
    );

    return {
      address,
      publicKey: keyPair.pubKey,
      privateKey: keyPair.privKey,
    };
  }

  async getPublicKeyOfUser(userName: string) {
    try {
      console.log('🔍 Fetching public key for user:', userName);
      const publicKey = await this.hostContract.methods
        .getPublicKeyOfUser(userName)
        .call();
      console.log('✅ Public key fetched:', publicKey);
      return publicKey || '';
    } catch (error) {
      console.error('Error getting public key for user:', error);
      return '';
    }
  }

  async getUserDetails(walletAddress: string) {
    //todo
    return await this.userRegistryContract.methods
      .getUserDetailsForWallet(walletAddress)
      .call();
  }

  async getEmailList(username: string) {
    return this.hostContract.methods.getEmailList.call(username);
  }

  async getWeb2Emails(username: string) {
    return this.helperContract.methods.getWeb2Emails.call(username);
  }

  async getAddressBookForUser(username: string) {
    return this.hostContract.methods.getAddressBookForUser.call(username);
  }

  async getUserDetailsForWallet(address: string) {
    return this.getUserDetails(address); // alias
  }

  async createAccount(params: {
    organizationId: string;
    role: string;
    userName: string;
    domain: string;
    name: string;
    publicKey: string;
    walletAddress: string;
    status: boolean;
    attributes: { key: string; value: string }[];
  }) {
    if (!this.privateKey) {
      throw new Error(
        '🔐 Private key not available. Private key is required for write operations.',
      );
    }

    const {
      organizationId,
      role,
      userName,
      domain,
      name,
      publicKey,
      walletAddress,
      status,
      attributes,
    } = params;

    try {
      const contract = new Contract(
        CONTRACT_ADDRESSES.HOST,
        HOST_CONTRACT_ABI,
        this.provider,
      );
      // Get transaction parameters
      const sender = await WalletModule.privateKeyToWalletAddressMobile(
        Config.NECJSPK,
      );
      console.log('Sender Address:', sender);
      const gasPrice = await this.provider.getGasPrice();
      const nonce = await this.provider.getTransactionCount(sender);
      console.log('Gas Price:', gasPrice.toString());

      // Prepare function parameters
      const functionParams = [
        organizationId,
        role,
        userName,
        domain,
        name,
        publicKey,
        walletAddress,
        status,
        attributes,
      ];

      // Estimate gas for createAccount method
      const estimatedGas = await contract.methods
        .createAccount(...functionParams)
        .estimateGas({ from: sender });
      // Use nativeSend method for contract interaction
      console.log('Estimated Gas:', estimatedGas.toString());
      const result = await contract.methods
        .createAccount(
          organizationId,
          role,
          userName,
          domain,
          name,
          publicKey,
          walletAddress,
          status,
          attributes,
        )
        .nativeSend({
          from: walletAddress || sender,
          gas: estimatedGas, // Estimated gas for createAccount
          gasPrice: gasPrice,
          nonce: nonce,
          value: '0x0',
        });

      // Sign transaction using WalletModule
      const signedResult = await WalletModule.signTransactionMobile(
        result,
        Config.NECJSPK,
      );

      // Send transaction
      const txHash = await this.provider.sendRawTransaction(
        signedResult.rawTransaction,
      );
      console.log('TRANSACTION HASH', txHash);
      // Wait for transaction receipt
      const receipt = await this.provider.getTransactionReceipt(txHash);
      console.log('receipt receipt', receipt);
      return receipt;
    } catch (error: any) {
      console.error('❌ Failed to create account:', error);
      throw error;
    }
  }

  async getUuidFromUid(uid: string, apiClient: any, token: string): Promise<string> {
    try {
      console.log(`📡 Requesting UUID for UID: ${uid}`);

      if (!apiClient || !token) {
        throw new Error('API client or authentication token is missing.');
      }

      const requestData = { uid };

      const response = await apiClient.post(
        '/getEncryptCalendarValue',
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      // Assuming the response structure contains the UUID at response.data.uuid
      // Adjust the path (e.g., response.data.result.uuid) based on your actual API response.
      const uuid = response?.data?.uuid;

      if (!uuid) {
        console.error('❌ API response did not contain a UUID:', response.data);
        throw new Error('Could not retrieve UUID from API response.');
      }

      console.log(`✅ Retrieved UUID for ${uid}: ${uuid}`);
      return uuid;

    } catch (error: any) {
      console.error(`❌ Failed to fetch UUID for UID ${uid}:`, error.message);
      // Re-throw the error for upstream handling
      throw new Error(`UUID retrieval failed: ${error.message}`);
    }
  }

  // Event Crud Operations
  async createEvent(eventData: Event, activeAccount: any, token: string) {
    try {

      const validation = validateEventData(eventData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      const uid = eventData?.uid || generateEventUID();
      const conferencingData = null;
      const metadata = buildEventMetadata(eventData, conferencingData);
      const eventParams = prepareEventForBlockchain(eventData, metadata, uid);
      console.log("Event params before encryption: ", eventParams);
      const publicKey = await this.hostContract.methods
        .getPublicKeyOfUser(activeAccount?.userName)
        .call();
      console.log('📊 Public key length:', publicKey?.length);
      console.log('📊 Public key type:', typeof publicKey);
      console.log('📊 Public key value:', publicKey);
      const encryptedUUID = await encryptWithNECJS(
        JSON.stringify(eventParams),
        publicKey,
        token,
      );
      const calendarContract = new Contract(
        CONTRACT_ADDRESSES.CALENDAR,
        CALENDAR_CONTRACT_ABI,
        this.provider,
      );
      console.log('Calender Contract Executed');

      const walletAddress = await this.getWalletAddress(Config.NECJSPK);
      const eventParamsValue = {
        uuid: encryptedUUID,
        uid: eventParams.uid,
        title: eventParams.title,
        fromTime: eventParams.fromTime,
        toTime: eventParams.toTime,
      };

      const inputContact = {
        contact: eventParams.list
          .filter((item: any) => item.key === 'guest')
          .map((item: any) => ({ key: 'contact', value: item.value })),
      };

      const paramsValue = [
        [eventParamsValue],
        activeAccount?.userName,
        inputContact,
      ];
      console.log(paramsValue);

      const gasEstimate = await calendarContract.methods
        .addEvent(...paramsValue)
        .estimateGas({
          from: walletAddress,
        });
      console.log('Estimated Gas', gasEstimate);

      const sender = await WalletModule.privateKeyToWalletAddressMobile(
        Config.NECJSPK,
      );
      const nonce = await this.provider.getTransactionCount(sender);
      // Get gas price
      const gasPrice = await this.provider.getGasPrice();
      const transactionHash = await calendarContract.methods
        .addEvent(...paramsValue)
        .nativeSend({
          from: walletAddress,
          gas: gasEstimate,
          gasPrice: gasPrice,
          nonce: nonce,
          value: '0x0',
        });
      const signedResult = await WalletModule.signTransactionMobile(
        transactionHash,
        Config.NECJSPK,
      );

      // Send transaction
      const txHash = await this.provider.sendRawTransaction(
        signedResult.rawTransaction,
      );
      return txHash;
    } catch (error: any) {
      console.error('Blockchain transaction error:', error);
      
      // Parse blockchain error messages
      let errorMessage = 'Failed to create event. Please try again.';
      
      if (error?.message) {
        const errorMsg = error.message.toLowerCase();
        const errorStr = JSON.stringify(error).toLowerCase();
        
        // Check for specific blockchain errors
        if (errorMsg.includes('replacement transaction underpriced') || errorStr.includes('replacement transaction underpriced')) {
          errorMessage = 'Transaction failed. Please wait a moment and try again.';
        } else if (errorMsg.includes('insufficient funds') || errorStr.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds. Please check your wallet balance.';
        } else if (errorMsg.includes('nonce') || errorStr.includes('nonce')) {
          errorMessage = 'Transaction error. Please try again in a moment.';
        } else if (errorMsg.includes('network') || errorStr.includes('network') || errorMsg.includes('timeout')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (errorMsg.includes('gas') || errorStr.includes('gas')) {
          errorMessage = 'Transaction failed due to gas estimation error. Please try again.';
        } else if (error?.code === -32000 || error?.code === -32603) {
          errorMessage = 'Blockchain transaction failed. Please try again.';
        } else {
          // Try to extract meaningful error from the error object
          try {
            const errorObj = typeof error === 'string' ? JSON.parse(error) : error;
            if (errorObj?.name || errorObj?.message) {
              errorMessage = `Transaction error: ${errorObj.name || errorObj.message}`;
            }
          } catch (parseError) {
            // If parsing fails, use default message
          }
        }
      }
      
      // Throw error with user-friendly message so it can be caught by the calling function
      throw new Error(errorMessage);
    }
  }

  async saveImportedEvents(eventsData, account, token, api) {
    try {
      const publicKey = await this.hostContract.methods
        .getPublicKeyOfUser(account)
        .call();
      const encryptionPromises = eventsData.map(async (event) => {
        return await encryptWithNECJS(JSON.stringify(event), publicKey, token);
      });
      const encryptedEvents = await Promise.all(encryptionPromises);
      let inputContact = [];
      let eventParamsValue = [];
      const shareEvents = [];
      const walletAddress = await this.getWalletAddress(Config.NECJSPK);

      console.log("eventsData here", eventsData);
      eventsData.map(async (data, index) => {
        eventParamsValue.push({
          uuid: encryptedEvents[index],
          uid: data?.uid.toString(),
          title: data?.title,
          fromTime: data?.fromTime || "",
          toTime: data?.toTime || "",
        })
        const repeatEvents = data.list?.filter(data => data.key === "repeatEvent").map(data => data.value).filter(value => value !== null)
        const customRepeat = data.list?.filter(data => data.key === "customRepeatEvent").map(data => data.value).filter(value => value !== null)
        shareEvents.push({
          uid: data?.uid.toString(),
          title: data?.title,
          fromTime: data?.fromTime || "",
          toTime: data?.toTime || "",
          repeatEvent: `${repeatEvents}`,
          customRepeatEvent: `${customRepeat}`
        })
        const contacts = data.list.filter((event) => event.key === "guest").map((event) => ({ key: "contact", value: event.value }))
        inputContact.push(...contacts);
      })
      const responseValue = [...new Set(inputContact)]
      const filteredValue = { contact: responseValue }
      const paramsValue = [eventParamsValue, account, filteredValue];

    
      console.log("🔍 eventParamsValue:", eventParamsValue);

      const calendarContract = new Contract(
        CONTRACT_ADDRESSES.CALENDAR,
        CALENDAR_CONTRACT_ABI,
        this.provider,
      );



      const gasEstimate = await calendarContract.methods
        .addEvent(...paramsValue)
        .estimateGas({
          from: walletAddress,
        });

      const sender = await WalletModule.privateKeyToWalletAddressMobile(
        Config.NECJSPK,
      );

      const nonce = await this.provider.getTransactionCount(sender);

      const gasPrice = await this.provider.getGasPrice();
      const transactionHash = await calendarContract.methods
        .addEvent(...paramsValue)
        .nativeSend({
          from: walletAddress,
          gas: gasEstimate,
          gasPrice: gasPrice,
          nonce: nonce,
          value: '0x0',
        });

      console.log("Transaction hash", transactionHash);

      const signedResult = await WalletModule.signTransactionMobile(
        transactionHash,
        Config.NECJSPK,
      );

      console.log("signed result");

      // Send transaction
      const txHash = await this.provider.sendRawTransaction(
        signedResult.rawTransaction,
      );

      console.log("Share events while import saving", shareEvents);
      const shareCalendarparams = {
        events: shareEvents,
        active: account,
        type: "update",
      }
      await api('POST', '/updateevents', shareCalendarparams);
      console.log("Imported events saved");
    } catch (err) {
      console.error(err);
    }
  }

  async updateEvent(eventData: Event, activeAccount: any, token: string) {
    try {

      const validation = validateEventData(eventData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      const allEventsData = await this.getAllEvents(activeAccount.userName);
      const allEvents = allEventsData.events;

      // 2. Find the specific event using the UID
      const eventToUpdate = allEvents.find((event: any) => event.uid === eventData.uid);

      if (!eventToUpdate) {
        console.error(`Event with UID: ${eventData.uid} not found for user: ${activeAccount}`);
        throw new Error(`Could not find event with UID: ${uid} for user: ${activeAccount}`);

      }

      // 3. Extract the UUID

      const uid = eventData?.uid;
      const uuid = eventToUpdate.uuid;


      const conferencingData = null;
      const metadata = buildEventMetadata(eventData, conferencingData);
      const eventParams = prepareEventForBlockchain(eventData, metadata, uid);
      const publicKey = await this.hostContract.methods
        .getPublicKeyOfUser(activeAccount?.userName)
        .call();

      console.log('uuid in update event', uuid);
      // const encryptedUUID = await this.encryptEventData(eventParams, publicKey, token);
      const encryptedUUID = await encryptWithNECJS(
        JSON.stringify(eventParams),
        publicKey,
        token,
        [uuid]
      );
      const calendarContract = new Contract(
        CONTRACT_ADDRESSES.CALENDAR,
        CALENDAR_CONTRACT_ABI,
        this.provider,
      );
      console.log('Calender Contract Executed');

      const walletAddress = await this.getWalletAddress(Config.NECJSPK);
      const eventParamsValue = {
        uuid: encryptedUUID,
        uid: eventParams.uid,
        title: eventParams.title,
        fromTime: eventParams.fromTime,
        toTime: eventParams.toTime,
      };

      const inputContact = {
        contact: eventParams.list
          .filter((item: any) => item.key === 'guest')
          .map((item: any) => ({ key: 'contact', value: item.value })),
      };

      const paramsValue = [
        [eventParams.uid], // <-- ARG 1: The UID MUST be wrapped in an array
        eventParamsValue,  // <-- ARG 2: The event data object
        activeAccount?.userName, // <-- ARG 3: The active account
      ];
      console.log("BlockchainService: Params value ==>", paramsValue);
      console.log("BlockchainService: Wallet address ==>", walletAddress);
      const gasEstimate = await calendarContract.methods
        .editEvent(...paramsValue)
        .estimateGas({
          from: walletAddress,
        });
      console.log('Estimated Gas', gasEstimate);

      const sender = await WalletModule.privateKeyToWalletAddressMobile(
        Config.NECJSPK,
      );
      const nonce = await this.provider.getTransactionCount(sender);
      const gasPrice = await this.provider.getGasPrice();
      const transactionHash = await calendarContract.methods
        .editEvent(...paramsValue)
        .nativeSend({
          from: walletAddress,
          gas: gasEstimate,
          gasPrice: gasPrice,
          nonce: nonce,
          value: '0x0',
        });

      console.log("transaction hash:" + transactionHash);

      const signedResult = await WalletModule.signTransactionMobile(
        transactionHash,
        Config.NECJSPK,
      );

      // Send transaction
      const txHash = await this.provider.sendRawTransaction(
        signedResult.rawTransaction,
      );
      return txHash;
    } catch (error: any) {
      console.error('Blockchain transaction error (update):', error);
      
      // Parse blockchain error messages (same logic as createEvent)
      let errorMessage = 'Failed to update event. Please try again.';
      
      if (error?.message) {
        const errorMsg = error.message.toLowerCase();
        const errorStr = JSON.stringify(error).toLowerCase();
        
        // Check for specific blockchain errors
        if (errorMsg.includes('replacement transaction underpriced') || errorStr.includes('replacement transaction underpriced')) {
          errorMessage = 'Transaction failed. Please wait a moment and try again.';
        } else if (errorMsg.includes('insufficient funds') || errorStr.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds. Please check your wallet balance.';
        } else if (errorMsg.includes('nonce') || errorStr.includes('nonce')) {
          errorMessage = 'Transaction error. Please try again in a moment.';
        } else if (errorMsg.includes('network') || errorStr.includes('network') || errorMsg.includes('timeout')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (errorMsg.includes('gas') || errorStr.includes('gas')) {
          errorMessage = 'Transaction failed due to gas estimation error. Please try again.';
        } else if (error?.code === -32000 || error?.code === -32603) {
          errorMessage = 'Blockchain transaction failed. Please try again.';
        } else {
          // Try to extract meaningful error from the error object
          try {
            const errorObj = typeof error === 'string' ? JSON.parse(error) : error;
            if (errorObj?.name || errorObj?.message) {
              errorMessage = `Transaction error: ${errorObj.name || errorObj.message}`;
            }
          } catch (parseError) {
            // If parsing fails, use default message
          }
        }
      }
      
      // Throw error with user-friendly message so it can be caught by the calling function
      throw new Error(errorMessage);
    }
  }

  async deleteEventSoft(eventId: string, activeAccount: any, token: string, api: any) {
    try {
      const allEvents = await this.getAllEvents(activeAccount.userName);

      const selected = (allEvents.events || []).find((event: any) =>
        event && (event.uid === eventId || event.eventId === eventId || event.id === eventId)
      );

      const listValue = (selected.list || []).filter((data: any) =>
        !(data.key === "isDeleted" || data.key === "deletedTime")
      );

      const updatedEvent = {
        ...selected,
        list: [
          ...listValue,
          { key: "isDeleted", value: "true" },
          { key: "deletedTime", value: moment.utc().format("YYYYMMDDTHHmmss") }
        ]
      };

      console.log("Event marked for deletion:", updatedEvent);

      const uid = updatedEvent.uid;
      const uuid = selected.uuid;
      // Reuse preparation logic
      const conferencingData = null;
      const metadata = buildEventMetadata(updatedEvent, conferencingData);

      const eventParams = prepareEventForBlockchain(updatedEvent, metadata, uid);

      // 3. Encrypt the Modified Event Data (using the existing UUID to overwrite)
      const publicKey = await this.hostContract.methods
        .getPublicKeyOfUser(activeAccount?.userName)
        .call();

      // FIXED: Use the existing UUID (like updateEvent does)
      const encryptedUUID = await encryptWithNECJS(
        JSON.stringify(eventParams),
        publicKey,
        token,
        [uuid] // Use the existing UUID, not updatedEvent.uuid
      );

      const updatePayload = {
        events: [
          updatedEvent
        ],
        active: activeAccount?.userName,
        type: 'delete',
      };

      if (encryptedUUID) {
        await api('POST', '/updateevents', updatePayload);
      }
      return;

    } catch (error) {
      console.log('Delete Event Failed:', error);

    }
  }

  async deleteEventPermanent(eventId: string, activeAccount: any, token: string, api: any) {
    try {
      const allEvents = await this.getAllEvents(activeAccount.userName);

      const selected = (allEvents.events || []).find((event: any) =>
        event && (event.uid === eventId)
      );

      const listValue = (selected.list || []).filter((data: any) =>
        !(data.key === "isDeleted" || data.key === "deletedTime")
      );

      const updatedEvent = {
        ...selected,
        list: [
          ...listValue,
          { key: "isDeleted", value: "true" },
          { key: "isPermanentDelete", value: "true" },
          { key: "deletedTime", value: moment.utc().format("YYYYMMDDTHHmmss") }
        ]
      };

      console.log("Event marked for deletion:", updatedEvent);

      const uid = updatedEvent.uid;
      const uuid = selected.uuid;
      // Reuse preparation logic
      const conferencingData = null;
      const metadata = buildEventMetadata(updatedEvent, conferencingData);

      const eventParams = prepareEventForBlockchain(updatedEvent, metadata, uid);

      // 3. Encrypt the Modified Event Data (using the existing UUID to overwrite)
      const publicKey = await this.hostContract.methods
        .getPublicKeyOfUser(activeAccount?.userName)
        .call();

      // FIXED: Use the existing UUID (like updateEvent does)
      const encryptedUUID = await encryptWithNECJS(
        JSON.stringify(eventParams),
        publicKey,
        token,
        [uuid] // Use the existing UUID, not updatedEvent.uuid
      );

      const updatePayload = {
        events: [
          updatedEvent
        ],
        active: activeAccount?.userName,
        type: 'delete',
      };

      if (encryptedUUID) {
        apiResponse = await api('POST', '/updateevents', updatePayload);
      }
      return;

    } catch (error) {
      console.log('Delete Event Failed:', error);

    }
  }


  async restoreEvent(eventToRestore: any, activeAccount: any, token: string, api: any) {
    try {
      // 1. Fetch all events
      const allEvents = await this.getAllEvents(activeAccount.userName);

      // 2. Find the selected event. 
      // Renamed 'event' parameter to 'eventToRestore' and 'event' in find to 'item' for clarity.
      const selected = (allEvents.events || []).find((item: any) =>
        item && (item.uid === eventToRestore.uid))

      if (selected) {
        const listValue = (selected.list || []).filter((data: any) =>
          !(data.key === "isDeleted" || data.key === "deletedTime" || data.key === "isPermanentDelete")
        );

        const updatedEvent = {
          ...selected,
          list: [
            ...listValue,
            { key: "isDeleted", value: "false" }
          ]
        };

        console.log("Event marked for restoration:", updatedEvent);

        const uid = updatedEvent.uid;
        const uuid = selected.uuid;

        console.log('uuid in restore event', uuid);
        // Reuse preparation logic
        const conferencingData = null;

        const metadata = buildEventMetadata(updatedEvent as any, conferencingData);

        const eventParams = prepareEventForBlockchain(updatedEvent as any, metadata, uid);

        // 3. Encrypt the Modified Event Data (using the existing UUID to overwrite)
        const publicKey = await this.hostContract.methods
          .getPublicKeyOfUser(activeAccount?.userName)
          .call();

        // FIXED: Use the existing UUID (like updateEvent does)
        const encryptedUUID = await encryptWithNECJS(
          JSON.stringify(eventParams),
          publicKey,
          token,
          [uuid] // Use the existing UUID, not updatedEvent.uuid
        );

        const updatePayload = {
          events: [
            updatedEvent
          ],
          active: activeAccount?.userName,
          type: 'delete',
        };

        console.log("Update payload for restoration:", updatePayload);
        if (encryptedUUID) {
          await api('POST', '/updateevents', updatePayload);

        }
        return;
      }

    } catch (error) {
      console.log('Delete Event Failed:', error);

    }

  }

  //Here we are starting methods related to task

  async createTask(taskData: any, activeAccount: any, token: string) {
    try {
      // Validate task data
      if (!taskData.title || taskData.title.trim() === '') {
        throw new Error('Task title is required');
      }
      if (!taskData.fromTime) {
        throw new Error('Task start time is required');
      }
      if (!taskData.toTime) {
        throw new Error('Task end time is required');
      }

      console.log("Task params before encryption: ", taskData);

      // Get public key for encryption
      const publicKey = await this.hostContract.methods
        .getPublicKeyOfUser(activeAccount?.userName)
        .call();

      // Encrypt the task data
      const encryptedUUID = await encryptWithNECJS(
        JSON.stringify(taskData),
        publicKey,
        token,
      );

      // Initialize calendar contract
      const calendarContract = new Contract(
        CONTRACT_ADDRESSES.CALENDAR,
        CALENDAR_CONTRACT_ABI,
        this.provider,
      );
      console.log('Calendar Contract Executed');

      // Get wallet address
      const walletAddress = await this.getWalletAddress(Config.NECJSPK);

      // Prepare event params value (tasks are stored as events in the contract)
      const eventParamsValue = {
        uuid: encryptedUUID,
        uid: taskData.uid,
        title: taskData.title,
        fromTime: taskData.fromTime,
        toTime: taskData.toTime,
      };

      // Prepare input contact (tasks typically don't have guests, so empty array)
      const inputContact = {
        contact: [],
      };

      const paramsValue = [
        [eventParamsValue],
        activeAccount?.userName,
        inputContact,
      ];
      console.log('Transaction params:', paramsValue);

      // Estimate gas
      const gasEstimate = await calendarContract.methods
        .addEvent(...paramsValue)
        .estimateGas({
          from: walletAddress,
        });
      console.log('Estimated Gas:', gasEstimate);

      // Get sender address and nonce
      const sender = await WalletModule.privateKeyToWalletAddressMobile(
        Config.NECJSPK,
      );
      const nonce = await this.provider.getTransactionCount(sender);

      // Get gas price
      const gasPrice = await this.provider.getGasPrice();

      // Create transaction
      const transactionHash = await calendarContract.methods
        .addEvent(...paramsValue)
        .nativeSend({
          from: walletAddress,
          gas: gasEstimate,
          gasPrice: gasPrice,
          nonce: nonce,
          value: '0x0',
        });

      // Sign transaction
      const signedResult = await WalletModule.signTransactionMobile(
        transactionHash,
        Config.NECJSPK,
      );

      // Send transaction
      const txHash = await this.provider.sendRawTransaction(
        signedResult.rawTransaction,
      );

      console.log('Task created successfully. Transaction hash:', txHash);
      return txHash;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async checkUserExists(username: string) {
    try {
      console.log('🔍 Checking if user exists:', username);
      // Try to get user's public key - this will fail if user doesn't exist
      const publicKey = await this.safeCall(
        async () =>
          await this.calendarContract.methods.getPublicKeyOfUser.call(username),
      );
      console.log('✅ User exists, public key:', publicKey);
      return true;
    } catch (error: any) {
      if (
        error.code === 'CALL_EXCEPTION' &&
        error.message.includes('missing revert data')
      ) {
        console.log('❌ User does not exist in contract');
        return false;
      }
      console.error('❌ Error checking user existence:', error);
      throw error;
    }
  }
  async getAllEvents(username: string) {
    try {
      console.log('🔍 Fetching all events for user:', username);
      console.log('📋 Contract address:', CONTRACT_ADDRESSES.CALENDAR);
      console.log('🌐 RPC URL:', RPC_URL);

      // Check network connectivity
      try {
        const blockNumber = await this.provider.getBlockNumber();
        console.log('🌐 Connected to network, latest block:', blockNumber);
      } catch (networkError) {
        console.error('❌ Network connection error:', networkError);
        throw new Error('Network connection failed');
      }

      // Get total number of events
      const rawCount = await this.safeCall(
        async () =>
          await this.calendarContract.methods.getEventCount(username).call(),
      );
      const eventCount = Number(rawCount);

      console.log('📈 Total events for user:', eventCount);

      if (!eventCount || eventCount <= 0) {
        console.log('📭 No events found for user');
        return {
          events: [],
          uuids: [],
        };
      }

      // Fetch all events from contract safely
      const rawEvents = await this.safeCall(
        async () =>
          await this.calendarContract.methods
            .getEvent(username, 0, eventCount)
            .call(),
      );


      console.log("[RETRIEVE] Raw events from contract:", JSON.stringify(rawEvents, null, 2));
      if (!rawEvents || !Array.isArray(rawEvents)) {
        console.log('📭 No events returned from contract');
        return {
          events: [],
          uuids: [],
        };
      }

      console.log('📅 Raw events from contract:', rawEvents);


      // Transform nested list tuples into JS objects
      const formattedEvents = rawEvents.map((event: any) => ({
        uid: event.uid,
        uuid: event.uuid,
        title: event.title,
        description: event.description,
        fromTime: event.fromTime,
        toTime: event.toTime,
        done: event.done,
        list: Array.isArray(event.list)
          ? event.list.map((item: any) => ({
            key: item.key,
            value: item.value,
          }))
          : [],
      })
      );
      console.log('UID to UUID Map:', this.uidToUuidMap);
      console.log("[RETRIEVE] Formatted events:", JSON.stringify(formattedEvents, null, 2));
      // Extract UUIDs
      const eventUUIDs = formattedEvents.map((event: any) => {
        console.log('event ====>', event);
        return event.uuid;
      });

      console.log('✅ Formatted events:', formattedEvents);
      console.log('🆔 Event UUIDs:', eventUUIDs);

      return {
        events: formattedEvents,
        uuids: eventUUIDs,
      };
    } catch (error: any) {
      console.error('❌ Failed to fetch events:', error);

      if (
        error.code === 'CALL_EXCEPTION' ||
        (error.message &&
          error.message.includes('Limit must be greater than 0'))
      ) {
        console.log(
          '📭 User may not exist or has no events, returning empty arrays',
        );
        return {
          events: [],
          uuids: [],
        };
      }

      throw error;
    }
  }
  async storeEncryptedEvent(uuid, uid, eventTitle, startTime, endTime, user) {
    console.log('Storing encrypted event on blockchain...');
    console.log(uuid, uid, eventTitle, startTime, endTime, user);

    try {
      const contract = new Contract(
        CONTRACT_ADDRESSES.CALENDAR, // Make sure you have an event contract address
        HOST_CONTRACT_ABI, // ABI for events
        this.provider,
      );

      const sender = await WalletModule.privateKeyToWalletAddressMobile(
        NECJSPRIVATE_KEY,
      );

      // Prepare parameters for your contract method
      const functionParams = [uuid, uid, eventTitle, startTime, endTime, user];
      console.log(functionParams);

      // Estimate gas
      const estimatedGas = await contract.methods
        .storeEncryptedEvents(...functionParams) // Method name in your event contract
        .estimateGas({ from: sender });

      const gasLimit = Math.floor(Number(estimatedGas) * 1.2);
      const gasPrice = await this.provider.getGasPrice();
      const nonce = await this.provider.getTransactionCount(sender);

      // Send transaction
      const result = await contract.methods
        .storeEncryptedEvents(...functionParams)
        .nativeSend({
          from: CONTRACT_ADDRESSES.CALENDAR || sender,
          gas: gasLimit,
          gasPrice,
          nonce,
        });

      // Sign transaction
      const signedResult = await WalletModule.signTransactionMobile(
        result,
        NECJSPRIVATE_KEY,
      );

      // Send raw transaction
      const txHash = await this.provider.sendRawTransaction(
        signedResult.rawTransaction,
      );

      console.log('Transaction Hash:', txHash);
      return txHash;
    } catch (error) {
      console.error('Error storing encrypted event:', error);
      throw error;
    }
  }

  async encryptMessage(publicKey: string, message: string) {
    try {
      const encrypted = await WalletModule.encryptMobile(publicKey, message);
      return encrypted;
    } catch (error: any) {
      console.error('❌ Encryption failed encryptMessage :', error);
      throw error;
    }
  }

  async decryptMessage(
    privateKey: string,
    encryptedData: string,
    version: string,
  ) {
    try {
      const decrypted = await WalletModule.decryptMobile(
        privateKey,
        encryptedData,
        version,
      );
      return decrypted;
    } catch (error: any) {
      console.error('❌ Decryption failed:', error);
      throw error;
    }
  }

  async symmetricEncrypt(sharedSecret: string, message: string) {
    try {
      const encrypted = await WalletModule.symEncryptMobile(
        sharedSecret,
        message,
      );
      return encrypted;
    } catch (error: any) {
      console.error('❌ Symmetric encryption failed:', error);
      throw error;
    }
  }

  async symmetricDecrypt(
    sharedSecret: string,
    encryptedData: string,
    version: string,
  ) {
    try {
      const decrypted = await WalletModule.symDecryptMobile(
        sharedSecret,
        encryptedData,
        version,
      );
      return decrypted;
    } catch (error: any) {
      console.error('❌ Symmetric decryption failed:', error);
      throw error;
    }
  }

  // Transaction utility methods
  async sendTransaction(to: string, value: string, privateKey?: string) {
    const key = privateKey || this.privateKey;
    if (!key) {
      throw new Error('🔐 Private key is required for transactions');
    }

    try {
      const sender = await this.getWalletAddress(key);
      const gasPrice = await this.provider.getGasPrice();
      const nonce = await this.provider.getTransactionCount(sender);

      const txObject = {
        to,
        value,
        gas: '21000', // Standard transfer gas limit
        gasPrice: gasPrice.toString(),
        nonce: nonce.toString(),
      };

      const signedResult = await WalletModule.signTransactionMobile(
        txObject,
        key,
      );
      const txHash = await this.provider.sendRawTransaction(
        signedResult.rawTransaction,
      );

      return txHash;
    } catch (error: any) {
      console.error('❌ Transaction failed:', error);
      throw error;
    }
  }

  async getBalance(address?: string, privateKey?: string) {
    try {
      let targetAddress = address;
      if (!targetAddress) {
        const key = privateKey || this.privateKey;
        if (!key) {
          throw new Error(
            '🔐 Address or private key is required to get balance',
          );
        }
        targetAddress = await this.getWalletAddress(key);
      }

      const balance = await this.provider.getBalance(targetAddress);
      return balance.toString();
    } catch (error: any) {
      console.error('❌ Failed to get balance:', error);
      throw error;
    }
  }
  async getContacts(user: string) {
    try {
      const contacts = await this.calendarContract.methods
        .getContacts(user)
        .call();
      return contacts;
    } catch (error) {
      throw error;
    }
  }
  async getGuests(query: string): Promise<any> {
    try {
      console.log('🔍 Searching guests with query:', query);

      // Get token from useToken store
      const token = useToken.getState().token;
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Get the active account email/username for contact lookup
      // The token should contain user information - we need to extract it
      // For now, we'll use a placeholder approach - you may need to adjust this based on your token structure
      let user = 'default_user'; // Default fallback

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
      } catch (e) { }

      // Get contact details using EventsService
      const contactEmails = await this.getContactDetails(user);

      // Filter contacts based on search query
      const filteredContacts = contactEmails.filter(email =>
        email.toLowerCase().includes(query.toLowerCase()),
      );

      // Convert emails to Guest objects
      const guests: any[] = filteredContacts.map((email, index) => ({
        id: `guest_${index}_${Date.now()}`,
        name: extractNameFromEmail(email),
        email: email,
        username: extractUsernameFromEmail(email),
        avatar: undefined, // You can add avatar logic here if needed
      }));

      return {
        success: true,
        data: guests,
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to search guests',
      };
    }
  }
  private async fetchAllContacts(user: string): Promise<any[]> {
    try {
      // Return empty array to avoid circular calls
      // This method was causing recursive calls to getAllContacts
      const response = { data: [] };
      return response?.data;
    } catch (error) {
      console.error('Error fetching all contacts:', error);
      // Fallback: return empty array if method doesn't exist
      return [];
    }
  }

  async getContactDetails(user: string): Promise<string[]> {
    try {
      // Get token from useToken store
      const token = useToken.getState().token;
      if (!token) {
        throw new Error('No authentication token found');
      }

      const getCalendarContacts = await this.getContacts(user);
      console.log('Calendar Contacts:', getCalendarContacts);

      const filteredCalendarContacts = getCalendarContacts
        .filter((item: any) => item.key === 'contact')
        .map((item: any) => item.value);

      // Get address book contacts using new blockchain method
      let addressBookForUser: string[] = [];
      let web2AddressBookForUser: string[] = [];

      try {
        const addressBookResult = await this.getAddressBookForUser(user);
        addressBookForUser = Array.isArray(addressBookResult)
          ? addressBookResult
          : [];
      } catch (e) {
        addressBookForUser = [];
      }

      try {
        const web2Result = await this.getWeb2Emails(user);
        web2AddressBookForUser = Array.isArray(web2Result) ? web2Result : [];
      } catch (e) {
        web2AddressBookForUser = [];
      }

      // Get all contacts from blockchain
      const response = await this.fetchAllContacts(user);
      if (!Array.isArray(response)) {
        throw new Error('Invalid response format from contract.');
      }

      // Extract email addresses from blockchain contacts
      const blockchainEmails: string[] = [];
      for (const contact of response) {
        if (contact.email && contact.email.trim() !== '') {
          blockchainEmails.push(contact.email);
        }
      }

      let decryptedUUIDValue: any[] = [];
      let allEvents: any[] = [];
      let encryptedData: any[] = [];

      // Get local storage data
      const eventCollectionPromise = getContactCollection();
      const decryptedValuePromise = getContactDecryptedValue();
      const [eventCollection, decryptedValue] = await Promise.all([
        eventCollectionPromise,
        decryptedValuePromise,
      ]);

      const data = eventCollection?.data || [];
      const decryptedData = decryptedValue?.data || [];
      const getContactValue: any[] = [];

      const decryptedDataResponse = decryptedData.map((data: any) => {
        return { decryptedUUID: data.decryptedUUID };
      });

      allEvents.push(...data);
      decryptedUUIDValue.push(...decryptedDataResponse);

      // Process response to find new contacts
      for (const element of response) {
        if (!element.uuid) {
          continue;
        }
        const alreadyDecrypted = decryptedData.some(
          (item: any) => item.decryptedUUID === element.uuid,
        );
        if (!alreadyDecrypted) {
          getContactValue.push(element.uuid);
        }
      }

      // For now, we'll work with the blockchain emails directly
      // Skip the complex decryption process and use blockchain data directly

      // Store blockchain contacts locally for future use
      const blockchainContacts = response.map((contact: any) => ({
        contactId: contact.uuid || contact.uid,
        name: contact.name || 'Unknown',
        email: contact.email || '',
        attributes: [],
      }));

      await storeContactCollection(blockchainContacts);

      const contactsEmailValue = blockchainContacts
        .map((data: any) => data.email)
        .filter((email: string) => email);

      // Combine all contact sources
      const filteredAddressBook = addressBookForUser
        .concat(web2AddressBookForUser)
        .concat(contactsEmailValue)
        .concat(filteredCalendarContacts)
        .concat(blockchainEmails) // Add blockchain emails
        .filter((email: string) => email !== '')
        .reduce((uniqueEmails: string[], email: string) => {
          if (!uniqueEmails.includes(email)) {
            uniqueEmails.push(email);
          }
          return uniqueEmails;
        }, []);

      return filteredAddressBook;
    } catch (error) {
      throw error;
    }
  }

  // Add more safe read/write wrappers here...
}
