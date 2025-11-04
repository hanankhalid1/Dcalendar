// Import crypto polyfill first
import '../utils/crypto-polyfill';
import { getAllTokens, getAllTransactions, Provider, necToHex, Contract, Wallet, weiToNec, decimalToWei } from 'necjs';
import WalletModule from './WalletModule';


const RPC_URL = "https://api-test-pqs.ncogchain.earth";
const GRAPHQL_URL = "https://xapi-test.ncogchain.earth/graphql";

export const getProvider = () => {
  const provider = new Provider(RPC_URL);
  return provider;
};



export const getBalance = async (address: string) => {
  try {
    console.log('Fetching balance for address:', address);
    const provider = getProvider();
    const balance = await provider.getBalance(address); // BigNumber
    const value = balance?.toFixed(5);
    console.log('Balance fetched successfully:', value);
    return `${value} NEC`;
  } catch (err) {
    console.error('Error fetching balance:', err);
    // More specific error handling
    if (err instanceof Error) {
      if (err.message.includes('Network Error')) {
        console.error('Network connectivity issue');
        return "Network Error";
      } else if (err.message.includes('timeout')) {
        console.error('Request timeout');
        return "Request Timeout";
      }
    }
    return "0.00 NEC";
  }
};

export const createWallet = async (privateKey: string) => {
  try {
    const provider = getProvider();
    const passWord = privateKey.slice(0, 10)
    await provider.importRawKey(privateKey, passWord);
    return true;
  } catch (err) {
    return false;
  }
};

export const sendTransaction = async (privateKey: string, to: string, value: string, fromAddress?: string) => {
  try {

    // Try native module approach first (matching Testwallet exactly)
    try {
      console.log('Attempting native module transaction...');

      // Check if WalletModule is available before using it
      if (!WalletModule || !WalletModule.privateKeyToWalletAddressMobile) {
        throw new Error('WalletModule not available, falling back to necjs');
      }

      // Get wallet address from private key using native module
      const derivedAddress = await WalletModule.privateKeyToWalletAddressMobile(privateKey);
      console.log('Derived wallet address from private key:', derivedAddress);

      if (!derivedAddress) {
        throw new Error('Failed to derive address from private key, falling back to necjs');
      }

      // Use derived address as the sender
      const senderAddress = derivedAddress;

      // Get gas price and nonce
      const gasPrice = await getGasPrice();
      const transactionCount = await getTransactionCount(senderAddress);

      // Prepare transaction arguments (exactly like Testwallet)
      const txArgs = {
        to: to,
        value: necToHex(value),
        gas: '21000',
        gasPrice: gasPrice,
        nonce: parseInt(transactionCount.toString(), 10),
      };

      console.log('Transaction args:', txArgs);

      // Validate transaction parameters before signing
      validateTransactionParams(txArgs);

      // Sign transaction using native module
      const signedResult = await WalletModule.signTransactionMobile(txArgs, privateKey);

      if (!signedResult?.rawTransaction) {
        throw new Error('Failed to sign transaction with native module');
      }

      // Send raw transaction to network
      const provider = getProvider();

      const txHash = await provider.sendRawTransaction(signedResult.rawTransaction);

      // Verify the transaction was actually sent by checking if we got a valid hash
      if (!txHash || txHash === '0x' || txHash.length < 10) {
        throw new Error('Invalid transaction hash received from network');
      }

      return {
        hash: txHash,
        rawTransaction: signedResult.rawTransaction,
        signedHash: signedResult.hash,
        from: senderAddress,
        to: to,
        value: value
      };
    } catch (nativeError) {
      console.warn('Native module transaction failed, falling back to necjs:', nativeError);

      const walletConnect = await Wallet.connect(privateKey, RPC_URL);
      const address = walletConnect.address;
      console.log('Wallet connected, address:', address);

      const gasPrice = await getGasPrice();
      const transactionCount = await getTransactionCount(address);

      const esObj = {
        from: address,
        to: to,
        value: value,
      };

      console.log("Estimate gas object:", esObj);
      const gasLimit = await getEstimateGasFee(esObj);

      const obj = {
        from: address,
        to: to,
        gasLimit: gasLimit,
        gasPrice: gasPrice,
        value: value,
        nonce: transactionCount,
      };

      console.log("Transaction object:", obj);

      // Send transaction with dynamic gas values
      const tx = await walletConnect.signer.sendTransaction(obj);
      console.log('Transaction result:', tx);

      // Verify the transaction was actually sent
      if (!tx || (typeof tx === 'object' && !(tx as any).hash && !(tx as any).transactionHash)) {
        throw new Error('No transaction hash received from necjs fallback');
      }

      return tx;
    }
  } catch (err) {
    console.error('sendTransaction error:', err);
    throw err;
  }
}

export const getTransactionCount = async (address: string) => {
  try {
    const provider = getProvider();
    const transactionCount = await provider.getTransactionCount(address);
    return transactionCount;
  } catch (err) {
    console.log('getTransactionCount', err);
    return 0;
  }
};

export const getGasPrice = async () => {
  try {
    const provider = getProvider();
    const gasPrice = await provider.getGasPrice();
    return gasPrice.toString();
  } catch (err) {
    console.log('getGasPrice', err);
    return '0';
  }
}

export const getEstimateGasFee = async (obj: any) => {
  try {
    const provider = getProvider();
    const res = await provider.estimateGas(obj);
    return res.toString();
  } catch (err) {
    console.log('getEstimateGasFee', err);
    return '21000';
  }
}

export const getTransactions = async (address: string, cursor: string | null = null) => {
  try {

    const transactions = await getAllTransactions({
      url: GRAPHQL_URL,
      variables: {
        address: address,
        count: 10,
        cursor: cursor,
      }
    });
    console.log("Transaction demo before show :", transactions)
    return transactions ?? [];
  } catch (err) {
    console.error('getTransactions error:', err);
    console.error('Error details:', JSON.stringify(err, null, 2));
    return [];
  }
}

export const getTokens = async (address: string) => {
  try {
    const tokens = await getAllTokens({
      url: GRAPHQL_URL,
      variables: {
        address: address,
      }
    });
    return tokens?.tokenSummaries ?? [];
  } catch (err) {
    console.log('getTokens', err);
    return [];
  }
}

// Helper function to get wallet address from private key
export const getWalletAddressFromPrivateKey = async (privateKey: string) => {
  try {
    // Debug: Check if WalletModule is available
    console.log('WalletModule availability check:', {
      WalletModule: !!WalletModule,
      privateKeyToWalletAddressMobile: !!WalletModule?.privateKeyToWalletAddressMobile,
      allMethods: WalletModule ? Object.keys(WalletModule) : 'WalletModule is null'
    });
    
    if (!WalletModule) {
      throw new Error('WalletModule is not available - native module not loaded');
    }
    
    if (!WalletModule.privateKeyToWalletAddressMobile) {
      throw new Error('privateKeyToWalletAddressMobile method is not available on WalletModule');
    }
    
    const address = await WalletModule.privateKeyToWalletAddressMobile(privateKey);
    return address;
  } catch (err) {
    console.error('Error getting wallet address from private key:', err);
    return null;
  }
}

// Helper function to verify transaction was mined
// Note: Provider.getTransactionReceipt is not available in necjs
export const getTransactionReceipt = async (txHash: string) => {
  try {
    console.log('getTransactionReceipt method not available in necjs Provider');
    return null;
  } catch (err) {
    console.error('Error getting transaction receipt:', err);
    return null;
  }
}

// Helper function to wait for transaction confirmation
// Simplified version since necjs Provider doesn't have getTransactionReceipt
export const waitForTransaction = async (txHash: string, maxWaitTime = 15000) => {
  console.log('waitForTransaction: necjs Provider does not support transaction receipt checking');
  console.log('Transaction hash:', txHash);

  // Since we can't actually check transaction status with necjs Provider,
  // we'll just wait a bit and return a mock success response
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('Assuming transaction was processed (cannot verify with current Provider)');
  return {
    transactionHash: txHash,
    status: 'assumed_success',
    note: 'Transaction confirmation cannot be verified with current Provider methods'
  };
}

// Helper function to validate wallet address format
export const isValidWalletAddress = (address: string): boolean => {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // Check if address starts with 0x and is exactly 42 characters long
  if (!address.startsWith('0x') || address.length !== 42) {
    return false;
  }

  // Check if the remaining 40 characters are valid hexadecimal
  const hexPart = address.slice(2);
  const hexRegex = /^[0-9a-fA-F]+$/;

  return hexRegex.test(hexPart);
};

// Helper function to validate transaction parameters
export const validateTransactionParams = (txArgs: any) => {
  console.log('Validating transaction parameters:', txArgs);

  // Check recipient address
  if (!txArgs.to) {
    throw new Error('Recipient address is required');
  }

  if (!isValidWalletAddress(txArgs.to)) {
    throw new Error('Invalid recipient address format. Address must start with 0x and be 42 characters long');
  }

  // Check transaction value
  if (!txArgs.value) {
    throw new Error('Transaction value is required');
  }

  // Check gas price
  if (!txArgs.gasPrice || txArgs.gasPrice === '0') {
    throw new Error('Invalid gas price');
  }

  // Check gas limit
  if (!txArgs.gas || txArgs.gas === '0') {
    throw new Error('Invalid gas limit');
  }

  // Check nonce
  if (txArgs.nonce === undefined || txArgs.nonce < 0) {
    throw new Error('Invalid nonce');
  }

  console.log('Transaction parameters validation passed');
  return true;
}

// Helper function to get transaction details from blockchain
// Note: Provider.getTransaction is not available in necjs, so we'll use receipt instead
export const getTransaction = async (txHash: string) => {
  try {
    console.log('getTransaction method not available in necjs Provider, using getTransactionReceipt instead');
    const receipt = await getTransactionReceipt(txHash);
    if (receipt && typeof receipt === 'object') {
      // If we have a receipt, the transaction exists
      return {
        hash: txHash,
        blockNumber: (receipt as any).blockNumber,
        status: (receipt as any).status
      };
    }
    return null;
  } catch (err) {
    console.error('Error getting transaction details:', err);
    return null;
  }
}

// Helper function to verify transaction exists on blockchain
// Simplified version since necjs Provider has limited methods
export const verifyTransactionOnBlockchain = async (txHash: string) => {
  try {

    // Basic validation of transaction hash format
    if (!txHash || !txHash.startsWith('0x') || txHash.length !== 66) {
      console.log('Invalid transaction hash format');
      return { exists: false, confirmed: false, error: 'Invalid transaction hash format' };
    }
    return {
      exists: true,
      confirmed: false, // We can't verify confirmation without getTransactionReceipt
      note: 'Transaction hash received from network. Confirmation status cannot be verified with current Provider methods.'
    };
  } catch (error) {
    console.error('Error verifying transaction on blockchain:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { exists: false, confirmed: false, error: errorMessage };
  }
}

export const getERC20Contract = async (address: string, privateKey?: string) => {
  try {
    const ERC20_ABI = [
      "function transfer(address to, uint256 value) public returns (bool)",
      "function balanceOf(address who) public view returns (uint256)",
      "function allowance(address owner, address spender) public view returns (uint256)",
      "function transferFrom(address from, address to, uint256 value) public returns (bool)",
      "function approve(address spender, uint256 value) public returns (bool)"
    ];

    // Use provider directly like Testwallet - no need for Wallet.connect
    const provider = getProvider();
    const contract = new Contract(address, ERC20_ABI, provider);
    return contract;
  } catch (err) {
    console.log('getERC20Contract', err);
    return null;
  }
}

export const getErc20EstimatePrice = async (
  address: string,
  privateKey: string,
  params: {
    to: string,
    value: any,
    from: string
  }) => {
  try {
    const contract = await getERC20Contract(address, privateKey);
    if (!contract) {
      return '0';
    }
    const amountInWei = decimalToWei(params.value);
    const res = await contract.methods.transfer(params.to, amountInWei).estimateGas({ from: params.from });
    const gasLimit = Math.floor(Number(res) * 1.2);
    const gasPrice = await getGasPrice();
    const gasFee = gasLimit * Number(gasPrice);
    const necFee = weiToNec(gasFee.toString()) || '21000';
    return necFee;
  } catch (err) {
    console.log('getErc20EstimatePrice', err);
    const gasLimit = 21000
    const gasPrice = await getGasPrice();
    const gasFee = gasLimit * Number(gasPrice);
    const necFee = weiToNec(gasFee.toString());
    return necFee;
  }
}

export const sendErc20Token = async (
  contractAddress: string,
  privateKey: string,
  params: {
    to: string,
    value: any,
    from: string
  }) => {
  try {

    // Check if WalletModule is available before using it
    if (!WalletModule || !WalletModule.privateKeyToWalletAddressMobile) {
      throw new Error('WalletModule not available, falling back to necjs');
    }

    // Get wallet address from private key using native module
    const derivedAddress = await WalletModule.privateKeyToWalletAddressMobile(privateKey);

    if (!derivedAddress) {
      throw new Error('Failed to derive address from private key, falling back to necjs');
    }

    // Try native module approach first (matching Testwallet exactly)
    try {

      // Use the same approach as Testwallet - get contract and use nativeSend
      const contract = await getERC20Contract(contractAddress, privateKey);
      if (!contract) {
        throw new Error('Failed to get ERC20 contract');
      }

      // Convert amount to wei
      const amountInWei = decimalToWei(params.value);
      console.log('Amount in wei:', amountInWei);

      // Estimate gas for the transaction
      const res = await contract.methods.transfer(params.to, amountInWei).estimateGas({ from: derivedAddress });
      const gasLimit = Math.floor(Number(res) * 1.2);
      const gasPrice = await getGasPrice();
      const nonce = await getTransactionCount(derivedAddress);

      // Check if nativeSend method exists
      if (typeof contract.methods.transfer(params.to, amountInWei).nativeSend !== 'function') {
        throw new Error('nativeSend method not available in this version of necjs');
      }

      // Use nativeSend to get transaction data for signing (like Testwallet)
      const result = await contract.methods.transfer(params.to, amountInWei).nativeSend({
        from: contractAddress, // This should be the contract address
        gas: gasLimit,
        gasPrice: gasPrice,
        nonce
      });

      if (!result || !result.data) {
        throw new Error('Failed to get transaction data from nativeSend');
      }

      // Sign transaction using native module (exactly like Testwallet)
      const signedResult = await WalletModule.signTransactionMobile(result, privateKey);

      if (!signedResult?.rawTransaction) {
        throw new Error('Failed to sign ERC20 transaction with native module');
      }

      // Send raw transaction to network
      const provider = getProvider();

      const txHash = await provider.sendRawTransaction(signedResult.rawTransaction);
      // Verify the transaction was actually sent by checking if we got a valid hash
      if (!txHash || txHash === '0x' || txHash.length < 10) {
        throw new Error('Invalid ERC20 transaction hash received from network');
      }

      return {
        hash: txHash,
        rawTransaction: signedResult.rawTransaction,
        signedHash: signedResult.hash,
        from: derivedAddress,
        to: contractAddress,
        value: '0x0',
        data: result.data
      };
    } catch (nativeError) {
      // Fallback to manual transaction construction (if nativeSend is not available)
      try {

        // Get gas price and nonce
        const gasPrice = await getGasPrice();
        const transactionCount = await getTransactionCount(derivedAddress);


        // Convert amount to wei
        const amountInWei = decimalToWei(params.value);

        // Create ERC20 transfer function data
        // transfer(address,uint256) = 0xa9059cbb
        const transferMethodId = '0xa9059cbb';
        const toAddressPadded = params.to.replace('0x', '').toLowerCase().padStart(64, '0');

        // Convert amount to proper hex format for transaction data
        let amountHex;
        if (typeof amountInWei === 'string' && amountInWei.startsWith('0x')) {
          // Already hex format
          amountHex = amountInWei;
        } else {
          // Convert decimal string to hex
          const amountBigInt = BigInt(amountInWei.toString());
          amountHex = '0x' + amountBigInt.toString(16);
        }
        const amountPadded = amountHex.replace('0x', '').padStart(64, '0');
        const data = transferMethodId + toAddressPadded + amountPadded;

        // console.log('Transaction data:', data);

        // Prepare transaction arguments for ERC20 transfer
        const txArgs = {
          to: contractAddress,
          value: '0x0', // No NEC value for ERC20 transfer
          gas: '65000', // Higher gas limit for ERC20 transfers
          gasPrice: gasPrice,
          nonce: parseInt(transactionCount.toString(), 10),
          data: data,
        };

        console.log('ERC20 transaction args:', txArgs);

        // Validate transaction parameters before signing
        validateTransactionParams(txArgs);
        console.log('Transaction parameters validation passed');

        // Sign transaction using native module
        const signedResult = await WalletModule.signTransactionMobile(txArgs, privateKey);

        if (!signedResult?.rawTransaction) {
          throw new Error('Failed to sign ERC20 transaction with native module');
        }

        // Send raw transaction to network
        const provider = getProvider();

        const txHash = await provider.sendRawTransaction(signedResult.rawTransaction);

        // Verify the transaction was actually sent by checking if we got a valid hash
        if (!txHash || txHash === '0x' || txHash.length < 10) {
          throw new Error('Invalid ERC20 transaction hash received from network');
        }

        return {
          hash: txHash,
          rawTransaction: signedResult.rawTransaction,
          signedHash: signedResult.hash,
          from: derivedAddress,
          to: contractAddress,
          value: '0x0',
          data: data
        };
      } catch (manualError) {
        console.warn('Manual ERC20 transaction construction failed, falling back to necjs:', manualError);

        // Final fallback to necjs approach
        console.log('Attempting necjs ERC20 transaction...');

        const contract = await getERC20Contract(contractAddress, privateKey);
        if (!contract) {
          throw new Error('Failed to get ERC20 contract');
        }

        // Get decimals to convert amount
        const amountInWei = decimalToWei(params.value);
        const res = await contract.methods.transfer(params.to, amountInWei).estimateGas({ from: params.from });
        const gasLimit = Math.floor(Number(res) * 1.2);
        const gasPrice = await getGasPrice();
        const nonce = await getTransactionCount(params.from);

        const result = await contract.methods.transfer(params.to, amountInWei).send({
          from: params.from,
          gas: gasLimit,
          gasPrice: gasPrice,
          nonce
        });

        console.log('ERC20 transaction result:', result);
        return result;
      }
    }
  } catch (err) {
    console.error('Error on sendErc20Token:', err);
    throw err;
  }
}

export const handleSendTransaction = async (transaction: any, privateKey: string) => {
  try {
    const result = await sendSMTransaction(privateKey, transaction);
    return result;
  } catch (err) {
    console.log('handleSendTransaction', err);
    return null;
  }
}

export const sendSMTransaction = async (privateKey: string, transaction: any) => {
  try {
    console.log('Starting smart contract transaction with native module...');

    // Get wallet address from private key using native module
    const derivedAddress = await WalletModule.privateKeyToWalletAddressMobile(privateKey);
    console.log('Derived wallet address from private key:', derivedAddress);

    // Prepare transaction arguments for smart contract call
    const txArgs = {
      to: transaction.to,
      value: transaction.value || '0x0',
      gas: transaction.gas,
      gasPrice: transaction.gasPrice,
      nonce: parseInt(transaction.nonce.toString(), 10),
      data: transaction.data,
    };

    console.log('Smart contract transaction args:', txArgs);

    // Sign transaction using native module
    const signedResult = await WalletModule.signTransactionMobile(txArgs, privateKey);
    console.log('Signed smart contract transaction result:', signedResult);

    if (!signedResult?.rawTransaction) {
      throw new Error('Failed to sign smart contract transaction');
    }

    // Send raw transaction to network
    const provider = getProvider();
    const txHash = await provider.sendRawTransaction(signedResult.rawTransaction);
    console.log('Smart contract transaction hash:', txHash);

    return {
      hash: txHash,
      rawTransaction: signedResult.rawTransaction,
      signedHash: signedResult.hash,
      from: derivedAddress,
      to: transaction.to,
      value: transaction.value || '0x0',
      data: transaction.data
    };
  } catch (err) {
    console.error('sendSMTransaction error:', err);
    return false
  }
}