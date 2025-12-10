import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Fonts } from '../../constants/Fonts';
import { Colors } from '../../constants/Colors';
import { scale } from 'react-native-size-matters';
import { moderateScale } from '../../utils/dimensions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToken } from '../../stores/useTokenStore';
import CustomLoader from '../../global/CustomLoader';
import { BlockchainService } from '../../services/BlockChainService';
import { useToast } from '../../hooks/useToast';
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
    if (!storage) {
      toast.error('Error', 'Token not found');
      return;
    }
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
      <Text style={[styles.errorText, { fontFamily: Fonts.latoRegular }]}>
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
            <Text style={[styles.title, { fontFamily: Fonts.latoBold }]}>
              Add new account
            </Text>
          </View>

          {/* Description */}
          <Text style={[styles.description, { fontFamily: Fonts.latoRegular }]}>
            Choose your unique username. This name will work as your dmail
            account as well as web3.
          </Text>

          {/* Username Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { fontFamily: Fonts.latoMedium }]}>
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
                    style={[styles.input, { fontFamily: Fonts.latoRegular }]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="johndoe"
                    placeholderTextColor="#A4A7AE"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Text
                    style={[styles.domainText, { fontFamily: Fonts.latoRegular }]}
                  >
                    {domain}
                  </Text>
                </View>
              )}
            />
            {renderError(errors.username)}

            {/* Preview full email */}
            {watchedUsername && (
              <View style={styles.previewContainer}>
                <Text
                  style={[styles.previewLabel, { fontFamily: Fonts.latoRegular }]}
                >
                  Your email will be:{' '}
                </Text>
                <Text
                  style={[styles.previewEmail, { fontFamily: Fonts.latoRegular }]}
                >
                  {watchedUsername}
                  {domain}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
            >
              <Text style={[styles.cancelButtonText, { fontFamily: Fonts.latoMedium }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                !isValid && styles.confirmButtonDisabled,
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid}
            >
              <Text style={[styles.confirmButtonText, { fontFamily: Fonts.latoMedium }]}>
                Confirm
              </Text>
            </TouchableOpacity>
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
    marginBottom: 16,
  },
  title: {
    fontSize: moderateScale(16),
    color: '#000',
    fontWeight: '700',
  },
  description: {
    fontSize: moderateScale(12),
    color: '#A4A7AE',
    marginBottom: 24,
    lineHeight: 18,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: moderateScale(12),
    color: '#414651',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.primaryBlue,
    gap: 0,
  },
  inputWrapperError: {
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: moderateScale(12),
    color: '#000',
    paddingVertical: 4,
    paddingRight: 0,
    marginRight: 0,
  },
  domainText: {
    fontSize: moderateScale(12),
    marginLeft: 0,
    color: Colors.primaryBlue,
    lineHeight: moderateScale(16),
    includeFontPadding: false,
    textAlignVertical: 'center',
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
    flexWrap: 'wrap',
  },
  previewLabel: {
    fontSize: moderateScale(12),
    color: '#535862',
  },
  previewEmail: {
    fontSize: moderateScale(12),
    color: Colors.primaryBlue,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  cancelButtonText: {
    fontSize: moderateScale(16),
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: Colors.primaryBlue,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: moderateScale(16),
    color: Colors.white,
  },
});

export default AddAccountModal;
