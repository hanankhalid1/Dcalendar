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
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Fonts } from '../../constants/Fonts';
import { Colors } from '../../constants/Colors';
import { scale } from 'react-native-size-matters';
import {
  moderateScale,
  scaleWidth,
  scaleHeight,
  screenWidth,
  screenHeight,
} from '../../utils/dimensions';
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
            const selectedAccount = accounts.find(
              acc => acc.userName === userName,
            );
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
    // Don't connect immediately - wait for button click
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
    const isLastItem = index === accounts.length - 1;

    return (
      <TouchableOpacity
        style={[
          styles.accountItem,
          isSelected && styles.selectedAccountItem,
          isLastItem && styles.lastAccountItem,
        ]}
        onPress={() => handleAccountPress(item)}
        activeOpacity={0.7}
      >
        {isSelected && <View style={styles.selectedIndicator} />}
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
            <Text
              style={[styles.accountName, { fontFamily: Fonts.latoRegular }]}
            >
              {item.name}
            </Text>
            <Text
              style={[styles.accountEmail, { fontFamily: Fonts.latoRegular }]}
            >
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <DIcon width={72} height={72} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text
            style={[styles.chooseText, { fontFamily: Fonts.latoExtraBold }]}
          >
            Choose an account
          </Text>
        </View>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { fontFamily: Fonts.latoRegular }]}>
          Select or add new account to continue Dcalendar
        </Text>

        {/* Accounts List Card */}
        <View style={styles.accountsCard}>
          {/* Accounts Header */}
          <View style={styles.accountsHeader}>
            <Text
              style={[styles.accountsLabel, { fontFamily: Fonts.latoMedium }]}
            >
              Accounts
            </Text>
          </View>
          {/* Accounts List */}
          <FlatList
            data={accounts}
            renderItem={renderAccountItem}
            style={styles.accountList}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.connectButton}
            onPress={() => {
              if (tempSelectedId) {
                const selectedAccount = accounts.find(
                  acc => acc.userName === tempSelectedId,
                );
                if (selectedAccount) {
                  fetchAccountTokenAndSave(selectedAccount.userName);
                }
              }
            }}
            activeOpacity={0.7}
            disabled={!tempSelectedId}
          >
            <Text
              style={[
                styles.connectButtonText,
                { fontFamily: Fonts.latoMedium },
              ]}
            >
              {tempSelectedId ? 'Continue with selected account' : 'Connect'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addAccountButton}
            onPress={() => {
              onAddNewAccount();
              onClose();
            }}
            activeOpacity={0.7}
          >
            <Icon name="plus" size={20} color={Colors.white} />
            <Text
              style={[styles.addAccountText, { fontFamily: Fonts.latoMedium }]}
            >
              Add new account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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

const isTablet = screenWidth >= 600;
const isSmallMobile = screenWidth <= 340;
const isLargeMobile = screenWidth > 400 && screenWidth < 600;
const isFolding =
  screenWidth >= 380 && screenWidth <= 500 && screenHeight > 800;

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  accountText: {
    fontSize: moderateScale(20),
  },
  closeButton: {
    padding: 4,
  },

  selectedAccountItem: {
    backgroundColor: '#F0F8FF',
  },
  selectedIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.primaryBlue,
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
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: moderateScale(14),
    fontFamily: Fonts.latoBold,
  },
  accountInfo: {
    // flex: 1,
  },
  accountName: {
    fontSize: moderateScale(14),
    color: '#000',
    marginBottom: 4,
    fontFamily: Fonts.latoRegular,
  },
  accountEmail: {
    fontSize: moderateScale(14),
    color: '#181D27',
    fontFamily: Fonts.latoRegular,
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
    fontSize: moderateScale(16),
    color: Colors.white,
    fontFamily: Fonts.latoMedium,
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
    borderRadius: moderateScale(20),
  },
  loadingContainer: {
    alignItems: 'center',
    gap: moderateScale(12),
  },
  loadingText: {
    fontSize: moderateScale(14),
    color: Colors.primaryblue,
    marginTop: scaleHeight(8),
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Gray background matching app design
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  logo: {
    width: isTablet
      ? 64
      : isFolding
      ? 48
      : isLargeMobile
      ? 44
      : isSmallMobile
      ? 32
      : 40,
    height: isTablet
      ? 64
      : isFolding
      ? 48
      : isLargeMobile
      ? 44
      : isSmallMobile
      ? 32
      : 40,
    marginBottom: isTablet ? 24 : isFolding ? 20 : 16,
  },
  appName: {
    fontSize: isTablet
      ? 56
      : isFolding
      ? 44
      : isLargeMobile
      ? 38
      : isSmallMobile
      ? 28
      : 42.79,
    fontFamily: Fonts.latoExtraBold,
    fontWeight: '800',
    color: '#000000',
    lineHeight: isTablet
      ? 56
      : isFolding
      ? 44
      : isLargeMobile
      ? 38
      : isSmallMobile
      ? 28
      : 42.79,
    letterSpacing: 0,
  },
  header: {
    alignItems: 'center',
    marginBottom: isTablet ? 16 : isFolding ? 12 : 8,
  },
  chooseText: {
    fontSize: isTablet
      ? moderateScale(38)
      : isFolding
      ? moderateScale(32)
      : isLargeMobile
      ? moderateScale(28)
      : isSmallMobile
      ? moderateScale(22)
      : moderateScale(30),
    color: '#181D27',
    textAlign: 'center',
    fontFamily: Fonts.latoExtraBold,
  },
  subtitle: {
    fontSize: isTablet
      ? moderateScale(18)
      : isFolding
      ? moderateScale(16)
      : isLargeMobile
      ? moderateScale(15)
      : isSmallMobile
      ? moderateScale(12)
      : moderateScale(14),
    color: '#666',
    marginBottom: isTablet
      ? 32
      : isFolding
      ? 28
      : isLargeMobile
      ? 24
      : isSmallMobile
      ? 16
      : 24,
    textAlign: 'center',
    fontFamily: Fonts.latoRegular,
  },
  accountsCard: {
    backgroundColor: Colors.white,
    borderRadius: isTablet ? 20 : isFolding ? 16 : 12,
    overflow: 'hidden',
    marginBottom: isTablet ? 32 : isFolding ? 24 : 20,
  },
  accountsHeader: {
    backgroundColor: '#FAFAFA',
    paddingTop: isTablet
      ? moderateScale(20)
      : isFolding
      ? moderateScale(16)
      : moderateScale(14),
    paddingRight: isTablet
      ? moderateScale(18)
      : isFolding
      ? moderateScale(14)
      : moderateScale(12),
    paddingBottom: isTablet
      ? moderateScale(20)
      : isFolding
      ? moderateScale(16)
      : moderateScale(14),
    paddingLeft: isTablet
      ? moderateScale(18)
      : isFolding
      ? moderateScale(14)
      : moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
    borderTopLeftRadius: isTablet ? 20 : isFolding ? 16 : 12,
    borderTopRightRadius: isTablet ? 20 : isFolding ? 16 : 12,
  },
  accountsLabel: {
    fontSize: isTablet
      ? moderateScale(18)
      : isFolding
      ? moderateScale(16)
      : moderateScale(14),
    color: '#535862',
  },
  accountList: {
    flexGrow: 0,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: isTablet
      ? 24
      : isFolding
      ? 20
      : isLargeMobile
      ? 18
      : isSmallMobile
      ? 12
      : 16,
    paddingHorizontal: isTablet
      ? 32
      : isFolding
      ? 24
      : isLargeMobile
      ? 20
      : isSmallMobile
      ? 10
      : 16,
    marginBottom: 0,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
    position: 'relative',
  },
  lastAccountItem: {
    borderBottomWidth: 0,
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20,
  },
  connectButton: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: isTablet ? 14 : isFolding ? 12 : 8,
    paddingVertical: isTablet ? 22 : isFolding ? 18 : 14,
    paddingHorizontal: isTablet ? 36 : isFolding ? 28 : 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E7',
    opacity: 1,
  },
  connectButtonText: {
    fontSize: isTablet
      ? moderateScale(20)
      : isFolding
      ? moderateScale(18)
      : moderateScale(16),
    color: '#000',
    fontFamily: Fonts.latoMedium,
  },
  addAccountButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryBlue,
    borderRadius: isTablet ? 14 : isFolding ? 12 : 8,
    paddingVertical: isTablet ? 22 : isFolding ? 18 : 14,
    paddingHorizontal: isTablet ? 36 : isFolding ? 28 : 24,
    gap: 8,
  },
  useAnotherText: {
    fontSize: isTablet ? scale(20) : isFolding ? scale(18) : scale(16),
    color: Colors.primaryblue,
    marginLeft: isTablet ? 18 : isFolding ? 14 : 12,
    fontFamily: Fonts.medium,
  },
  walletButton: {
    paddingVertical: isTablet ? 24 : isFolding ? 20 : 16,
    alignItems: 'center',
    marginBottom: isTablet ? 32 : isFolding ? 24 : 20,
  },
  walletButtonText: {
    fontSize: isTablet ? scale(18) : isFolding ? scale(16) : scale(14),
    color: '#666',
    fontFamily: Fonts.medium,
  },
});

export default AccountSelectionModal;
