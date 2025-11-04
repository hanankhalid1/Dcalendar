import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import GradientText from '../home/GradientText';
import { Fonts } from '../../constants/Fonts';
import { Colors } from '../../constants/Colors';
import { scale } from 'react-native-size-matters';
import CustomButton from '../../global/CustomButton';
// import { CrossIcon } from '../../assets/svgs';
// import { BlockchainService } from '@/services/BlockChainService';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRIVATE_KEY } from '../../constants/Config';
import { useToken } from '../../stores/useTokenStore';
import CustomLoader from '../../global/CustomLoader';
import { BlockchainService } from '../../services/BlockChainService';
import { useToast } from '../../hooks/useToast';
import { Contract } from 'necjs';
import { CONTACT_CONTRACT_ABI } from '../../abis';
import Config from '../../config';
interface AddAccountFormData {
  username: string;
}

interface AddAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (username: string, fullEmail: string) => void;
  onNewAccount: () => void;
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({
  visible,
  onClose,
  onConfirm,
  onNewAccount,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<AddAccountFormData>({
    mode: 'onChange',
    defaultValues: {
      username: '',
    },
  });

  const watchedUsername = watch('username');
  // const domain = '@dmail.earth'; dev
  const domain = '@dmail.earth';
  const toast = useToast();
  const [loading, setloading] = useState(false);
  const { token, setToken } = useToken();

  const onSubmit = async (data: AddAccountFormData) => {
    console.log('Accountt Checking');

    const storage = await AsyncStorage.getItem('token');
    // const storage=token;
    const parseData = JSON.parse(storage);
    console.log('parseData///', parseData);
    setloading(true);
    try {
      const hostContract = new BlockchainService(Config.NECJSPK);
      console.log(data);

      const publicKey = await hostContract.getPublicKeyOfUser(
        data?.username + domain,
      );
      if (publicKey) {
        toast.error('Invalid User', 'Username already exists');
        setloading(false);
        return;
      }
      const sd = await hostContract.createAccount({
        organizationId: '',
        role: '',
        userName: data?.username + domain,
        domain: 'dmail.earth',
        name: data?.username,
        publicKey: parseData?.ncogPublicKey,
        walletAddress: parseData?.ncogWalletAddress,
        status: true,
        attributes: [],
      });
      if (sd) {
        console.log('====================================');
        console.log('creatinng user............');
        toast.success('Account Create', 'Account Created Successfully');
        setloading(false);
        console.log('====================================');
        console.log('====================================');
        console.log(sd);
        console.log('====================================');
        onNewAccount();
      }
      // console.log(publicKey);
      // const fullEmail = data.username + domain;
      // onConfirm(data.username, fullEmail);
      reset();
      onClose();
    } catch (error) {
      console.log(error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const renderError = (error?: { message?: string }) => {
    if (!error?.message) return null;
    return (
      <Text style={[styles.errorText, { fontFamily: Fonts.regular }]}>
        {error.message}
      </Text>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      {loading && <CustomLoader />}
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={[styles.addText, { fontFamily: Fonts.semiBold }]}>
                Add new{' '}
              </Text>
              <GradientText
                style={[styles.accountText, { fontFamily: Fonts.semiBold }]}
                colors={[Colors.primaryGreen, Colors.primaryblue]}
              >
                account
              </GradientText>
            </View>

            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              {/* <CrossIcon /> */}
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <Text style={[styles.description, { fontFamily: Fonts.regular }]}>
            Choose your unique username. This name will work as your dmail
            account as well as your web3.
          </Text>

          {/* Username Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { fontFamily: Fonts.medium }]}>
              Username
            </Text>

            <Controller
              control={control}
              name="username"
              rules={{
                required: 'Username is required',
                minLength: {
                  value: 3,
                  message: 'Username must be at least 3 characters',
                },
                maxLength: {
                  value: 20,
                  message: 'Username must be less than 20 characters',
                },
                pattern: {
                  value: /^[a-zA-Z0-9_]+$/,
                  message:
                    'Username can only contain letters, numbers, and underscores',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  style={[
                    styles.inputWrapper,
                    errors.username && styles.inputWrapperError,
                  ]}
                >
                  <TextInput
                    style={[styles.input, { fontFamily: Fonts.regular }]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Username"
                    placeholderTextColor="#A0A0A0"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <GradientText
                    style={[styles.domainText, { fontFamily: Fonts.medium }]}
                    colors={[Colors.primaryGreen, Colors.primaryblue]}
                  >
                    {domain}
                  </GradientText>
                </View>
              )}
            />
            {renderError(errors.username)}

            {/* Preview full email */}
            {watchedUsername && (
              <View style={styles.previewContainer}>
                <Text
                  style={[styles.previewLabel, { fontFamily: Fonts.regular }]}
                >
                  Your email will be:{' '}
                </Text>
                <GradientText
                  style={[styles.previewEmail, { fontFamily: Fonts.medium }]}
                  colors={[Colors.primaryGreen, Colors.primaryblue]}
                >
                  {watchedUsername}
                  {domain}
                </GradientText>
              </View>
            )}
          </View>

          {/* Confirm Button */}
          <View style={styles.buttonContainer}>
            <CustomButton
              title="Confirm"
              style={{
                justifyContent: 'center',
                opacity: isValid ? 1 : 0.6,
                marginTop: 8,
              }}
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addText: {
    fontSize: scale(20),
    color: '#000',
  },
  accountText: {
    fontSize: scale(20),
  },
  closeButton: {
    padding: 4,
  },
  description: {
    fontSize: scale(12),
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: scale(13),
    color: '#3C3C43',
    marginBottom: 8,
    opacity: 0.6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  inputWrapperError: {
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: scale(16),
    color: '#000',
    paddingVertical: 4,
  },
  domainText: {
    fontSize: scale(16),
    marginLeft: 4,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: scale(12),
    marginTop: 6,
    marginLeft: 4,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  previewLabel: {
    fontSize: scale(13),
    color: '#666',
  },
  previewEmail: {
    fontSize: scale(13),
  },
  buttonContainer: {
    marginTop: 8,
  },
});

export default AddAccountModal;
