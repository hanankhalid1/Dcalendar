import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Colors } from '../../constants/Colors';
// import { BlockchainService } from '@/services/BlockChainService';
// import { useApiClient } from '@/hooks/useApi';
import { useNavigation } from '@react-navigation/native';
import AccountSelectionModal from '../../components/home/AccountSelection';
import AddAccountModal from '../../components/home/AddAccountModal';
import { useActiveAccount } from '../../stores/useActiveAccount';

const AccountSelection = () => {
  const [showNew, setshowNew] = useState(false);
  const [showAccounts, setshowAccounts] = useState(false);
  const [accounts, setaccounts] = useState([]);
  const navigation: any = useNavigation();
  const [newAccount, setnewAccount] = useState(false);
  const { account } = useActiveAccount();
  useEffect(() => {
    if (account) {
      navigation.navigate('HomeScreen');
    } else {
      setshowAccounts(true);
    }
  }, [account]);

  const handleCloseAddAccount = () => {
    setshowNew(false);
    setshowAccounts(true); // Show accounts list again
  };

  // Handle after new account is added
  const handleNewAccountAdded = () => {
    setnewAccount(prev => !prev); // Toggle to trigger useEffect in AccountSelectionModal
    setshowNew(false);
    setshowAccounts(true); // Show accounts list with the new account
  };
  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      {showAccounts && (
        <AccountSelectionModal
          visible={true}
          accounts={accounts}
          onNewAccount={newAccount}
           onAddNewAccount={() => {
            setshowAccounts(false); // Hide accounts modal
            setshowNew(true); // Show add account modal
          }}
          onClose={() => setshowAccounts(false)}
        />
      )}
      {showNew && (
        <AddAccountModal
          onNewAccount={handleNewAccountAdded} // After adding account, go back to accounts list
          onConfirm={handleNewAccountAdded} // Same behavior
          visible={showNew}
          onClose={handleCloseAddAccount} // On close/cancel, go back to accounts list
        />
      )}
    </View>
  );
};

export default AccountSelection;
