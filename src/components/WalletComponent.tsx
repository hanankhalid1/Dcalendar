import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert, StyleSheet } from 'react-native';
import { NativeModules } from 'react-native';

const { WalletModule } = NativeModules;

interface WalletState {
  publicKey: string;
  privateKey: string;
  address: string;
  isLoading: boolean;
}

export const WalletComponent: React.FC = () => {
  const [wallet, setWallet] = useState<WalletState>({
    publicKey: '',
    privateKey: '',
    address: '',
    isLoading: false,
  });

  const generateWallet = async () => {
    try {
      setWallet(prev => ({ ...prev, isLoading: true }));

      const keyPair = await WalletModule.keyGenMobile();

      setWallet({
        publicKey: keyPair.pubKey,
        privateKey: keyPair.privKey,
        isLoading: false,
      });

      Alert.alert('Success', 'Wallet generated successfully!');
    } catch (error) {
      setWallet(prev => ({ ...prev, isLoading: false }));
      Alert.alert('Error', `Failed to generate wallet: ${error.message}`);
    }
  };

  const testEncryption = async () => {
    if (!wallet.publicKey || !wallet.privateKey) {
      Alert.alert('Error', 'Please generate a wallet first');
      return;
    }

    try {
      const message = 'Hello, Quantum World!';
      const encrypted = await WalletModule.encryptMobile(
        wallet.publicKey,
        message,
      );
      const decrypted = await WalletModule.decryptMobile(
        wallet.privateKey,
        encrypted.encrypted,
        encrypted.version,
      );

      Alert.alert(
        'Encryption Test',
        `Original: ${message}\nDecrypted: ${decrypted}`,
      );
    } catch (error) {
      Alert.alert('Error', `Encryption test failed: ${error.message}`);
    }
  };

  const testTransactionSigning = async () => {
    if (!wallet.privateKey) {
      Alert.alert('Error', 'Please generate a wallet first');
      return;
    }

    try {
      const txObject = {
        to: '0x1234567890123456789012345678901234567890',
        value: '0x1000000000000000000',
        gasPrice: '0x09184e72a000',
        nonce: 0,
      };

      const signedTx = await WalletModule.signTransactionMobile(
        txObject,
        wallet.privateKey,
      );
      Alert.alert('Transaction Signed', `Signed TX: ${signedTx}`);
    } catch (error) {
      Alert.alert('Error', `Transaction signing failed: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NEC Wallet</Text>

      <Button
        title={wallet.isLoading ? 'Generating...' : 'Generate Wallet'}
        onPress={generateWallet}
        disabled={wallet.isLoading}
      />

      {wallet.address && (
        <View style={styles.walletInfo}>
          <Text style={styles.label}>Address:</Text>
          <Text style={styles.value}>{wallet.address}</Text>

          <Text style={styles.label}>Public Key:</Text>
          <Text style={styles.value}>
            {wallet.publicKey.substring(0, 20)}...
          </Text>

          <Button title="Test Encryption" onPress={testEncryption} />
          <Button
            title="Test Transaction Signing"
            onPress={testTransactionSigning}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  walletInfo: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  value: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    fontFamily: 'monospace',
  },
});
