import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import GradientText from './../home/GradientText';
import { Fonts } from '../../constants/Fonts';
import { Colors } from '../../constants/Colors';
import { scale } from 'react-native-size-matters';
import { BlockchainService } from '../../services/BlockChainService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApiClient } from '../../hooks/useApi';
import { useNavigation } from '@react-navigation/native';
import { useActiveAccount } from '../../stores/useActiveAccount';
import { useToken } from '../../stores/useTokenStore';
import Config from '../../config';
import { SafeAreaView } from 'react-native-safe-area-context';
import DIcon from '../../assets/svgs/DIcon.svg';

interface Account {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  backgroundColor?: string;
  isSelected?: boolean;
}

interface AccountSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onAccountSelect: (account: Account) => void;
  onAddNewAccount: () => void;
  accounts: Account[];
  selectedAccountId?: string;
  onNewAccount: boolean;
}

const AccountSelectionModal: React.FC<AccountSelectionModalProps> = ({
  visible,
  onClose,
  onAccountSelect,
  onAddNewAccount,
  onNewAccount,
  selectedAccountId,
}) => {
  const [accounts, setaccounts] = useState([]);
  const [loading, setloading] = useState(false);
  const { setAccount, account } = useActiveAccount();
  const { api } = useApiClient();
  const { token, setToken } = useToken();
  const navigation: any = useNavigation();

  const fetchAccountTokenAndSave = async (userName: any) => {
    console.log('userName1234', userName);
    setloading(true);

    const stpra = await AsyncStorage.getItem('token');
    const parseData = JSON.parse(stpra || '');
    const payload = {
      user_name: userName, // Should be in format "alice@test.earth"
      publicKey: parseData?.ncogPublicKey, // Wallet public key from Ncog
      appName: 'dCalendar', // Note: Capital 'C' as per API spec
    };

    console.log('Payload for login API in Acc Sel:', payload);

    try {
      const res = await api('POST', 'login', payload);
      console.log('Login API response:', res.data);

      if (res && res.data) {
        const { token, isAuth, isAccess } = res.data;

        // Check authentication status according to new API spec
        if (isAuth === true) {
          console.log('✅ Authentication successful');

          // Store current account data
          await AsyncStorage.setItem(
            'currentAccount',
            JSON.stringify(res.data),
          );

          // Store the JWT token
          if (token && token !== null && token !== undefined) {
            await AsyncStorage.setItem('ac', JSON.stringify(token));
            setToken(token);
            const selectedAccount = accounts.find(acc => acc.userName === userName);
            if (selectedAccount) {
              setAccount(selectedAccount); // ⬅️ Set active account
            }
            onClose();
            console.log('Token from response:', token);
            console.log(
              'Token in Zustand (useToken):',
              useToken.getState().token,
            );


            // ONLY NOW close modal and trigger navigation
            onClose();
          } else {
            console.warn('⚠️ No token received from login API response');
            await AsyncStorage.removeItem('ac');
            setToken(null);
          }
        } else {
          console.warn('❌ Authentication failed:', {
            isAuth,
            isAccess,
            message: 'User authentication or access denied',
          });

          // Clear any existing tokens on auth failure
          await AsyncStorage.removeItem('ac');
          setToken(null);

          // You might want to show an error message to the user here
          // or trigger a re-authentication flow
        }
      } else {
        console.warn('⚠️ No response received from login API');
        await AsyncStorage.removeItem('ac');
        setToken(null);
      }
    } catch (error) {
      console.log('❌ Login API error:', error);
      // Remove any existing token on error
      await AsyncStorage.removeItem('ac');
      setToken(null);
    }

    setloading(false);
  };

  const fetchAccountDetails = async () => {
    setloading(true);
    try {
      const hostContract = new BlockchainService(Config.NECJSPK);
      const stpra = await AsyncStorage.getItem('token');
      console.log('stpra', stpra);
      const parseData = JSON.parse(stpra);
      console.log('parseData', parseData);

      const details = await hostContract.getUserDetailsForWallet(
        parseData?.ncogWalletAddress,
      );
      console.log('details====================================details');
      if (details) {
        // Alert.alert('sdhfsdkf')
        setaccounts(details);
        console.log('details====================================');
        console.log(details);
        console.log('====================================');
      } else {
      }
    } catch (error) {
      console.log('error====================================');
      console.log(JSON.stringify(error));
      console.log('====================================');
    }

    setloading(false);
  };
  useEffect(() => {
    fetchAccountDetails();
  }, [onNewAccount]);

  const [tempSelectedId, setTempSelectedId] = useState<string>(
    account?.userName || '',
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarBackgroundColor = (index: number) => {
    const colors = [
      '#FF6B6B', // Red
      '#4ECDC4', // Teal
      '#45B7D1', // Blue
      '#96CEB4', // Green
      '#FFEAA7', // Yellow
      '#DDA0DD', // Plum
      '#98D8C8', // Mint
      '#F7DC6F', // Light Yellow
    ];
    return colors[index % colors.length];
  };

  const handleAccountPress = (account: Account) => {
    setTempSelectedId(account.userName);
    fetchAccountTokenAndSave(account?.userName);

  };

  const renderAccountItem = ({
    item,
    index,
  }: {
    item: Account;
    index: number;
  }) => {
    const isSelected = tempSelectedId === item.userName;
    const backgroundColor =
      item.backgroundColor || getAvatarBackgroundColor(index);

    return (
      <TouchableOpacity
        style={[styles.accountItem, isSelected && styles.selectedAccountItem]}
        onPress={() => handleAccountPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.accountContent}>
          <View style={styles.avatarContainer}>
            {item.avatar ? (
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor }]}>
                <Text
                  style={[styles.avatarText, { fontFamily: Fonts.latoBold }]}
                >
                  {getInitials(item.name)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.accountInfo}>
            <Text style={[styles.accountName, { fontFamily: Fonts.latoBold }]}>
              {item.name}
            </Text>
            <Text style={[styles.accountEmail, { fontFamily: Fonts.latoRegular }]}>
              {item.userName}
            </Text>
          </View>
        </View>

        <View style={styles.radioContainer}>
          <View
            style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}
          >
            {isSelected && <View style={styles.radioInner} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Logo Section */}
      <View style={styles.logoSection}>
        <DIcon width={72} height={72} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.chooseText, { fontFamily: Fonts.latoBold }]}>
          Choose an account
        </Text>
      </View>

      {/* Subtitle */}
      <Text style={[styles.subtitle, { fontFamily: Fonts.latoRegular }]}>
        to continue to <Text style={{ color: '#00AEEF' }}>DCalendar</Text>
      </Text>

      {/* Account List */}
      <FlatList
        data={accounts}
        renderItem={renderAccountItem}
        style={styles.accountList}
        showsVerticalScrollIndicator={false}
      />

      {/* Add New Account Button */}
      <TouchableOpacity style={styles.addAccountButton}
        onPress={() => {
          onAddNewAccount();
          onClose();
        }}
        activeOpacity={0.7}>
        <Icon name="plus-circle-outline" size={24} color="#00AEEF" />
        <GradientText
          style={[styles.addAccountText, { fontFamily: Fonts.medium }]}
          colors={['#00AEEF', '#0088CC']}
        >
          Add new account
        </GradientText>
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primaryblue} />
            <Text style={[styles.loadingText, { fontFamily: Fonts.medium }]}>
              Connecting...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({

  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  accountText: {
    fontSize: scale(20),
  },
  closeButton: {
    padding: 4,
  },


  selectedAccountItem: {
    borderColor: Colors.primaryblue,
    backgroundColor: '#F0F8FF',
  },
  accountContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: scale(16),
  },
  accountInfo: {
    // flex: 1,
  },
  accountName: {
    fontSize: scale(16),
    color: '#000',
    // marginBottom: 4,
  },
  accountEmail: {
    fontSize: scale(14),
    color: '#666',
  },
  radioContainer: {
    marginLeft: 16,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: Colors.primaryblue,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primaryblue,
  },

  addAccountText: {
    fontSize: scale(16),
    marginLeft: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: scale(20),
  },
  loadingContainer: {
    alignItems: 'center',
    gap: scale(12),
  },
  loadingText: {
    fontSize: scale(14),
    color: Colors.primaryblue,
    marginTop: scale(8),
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Gray background matching app design
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  logo: {
    width: 40,
    height: 40,
    marginBottom: 16,
  },
  appName: {
    fontSize: 42.79,
    fontFamily: Fonts.latoExtraBold,
    fontWeight: '800',
    color: '#000000',
    lineHeight: 42.79,
    letterSpacing: 0,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  chooseText: {
    fontSize: scale(24),
    color: '#000',
    textAlign: 'center',
    fontFamily: Fonts.latoBold,
  },
  subtitle: {
    fontSize: scale(14),
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
    fontFamily: Fonts.latoRegular,
  },
  accountList: {
    flexGrow: 0, // Don't let it take all space
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    // Remove radio button styles
  },
  addAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginTop: 12,
    marginBottom: 20,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed', // Dashed border
  },
  useAnotherText: {
    fontSize: scale(16),
    color: Colors.primaryblue,
    marginLeft: 12,
    fontFamily: Fonts.medium,
  },
  walletButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  walletButtonText: {
    fontSize: scale(14),
    color: '#666',
    fontFamily: Fonts.medium,
  },
});

export default AccountSelectionModal;
