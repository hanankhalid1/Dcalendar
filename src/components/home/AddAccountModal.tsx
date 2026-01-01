import React, { useState, useEffect } from 'react';
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
import {
  moderateScale,
  screenWidth,
  screenHeight,
} from '../../utils/dimensions';
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

  // Reset loading state when modal visibility changes
  useEffect(() => {
    if (!visible) {
      setloading(false);
    }
  }, [visible]);

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
    setloading(false);
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
                    style={[
                      styles.domainText,
                      { fontFamily: Fonts.latoRegular },
                    ]}
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
                  style={[
                    styles.previewLabel,
                    { fontFamily: Fonts.latoRegular },
                  ]}
                >
                  Your email will be:{' '}
                </Text>
                <Text
                  style={[
                    styles.previewEmail,
                    { fontFamily: Fonts.latoRegular },
                  ]}
                >
                  {watchedUsername}
                  {domain}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text
                style={[
                  styles.cancelButtonText,
                  { fontFamily: Fonts.latoMedium },
                ]}
              >
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
              <Text
                style={[
                  styles.confirmButtonText,
                  { fontFamily: Fonts.latoMedium },
                ]}
              >
                Confirm
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const isTablet = screenWidth >= 600;
const isSmallMobile = screenWidth <= 340;
const isLargeMobile = screenWidth > 400 && screenWidth < 600;
const isFolding =
  screenWidth >= 380 && screenWidth <= 500 && screenHeight > 800;

// Helper to cap font sizes for tablets
const getTabletSafeFontSize = (mobileSize: number, tabletSize: number, maxSize: number) => {
  if (isTablet) {
    return Math.min(tabletSize, maxSize);
  }
  return mobileSize;
};

// Helper to cap dimensions for tablets
const getTabletSafeDimension = (
  mobileValue: number,
  foldingValue: number,
  largeMobileValue: number,
  smallMobileValue: number,
  tabletValue: number,
  maxValue: number
) => {
  if (isTablet) {
    return Math.min(tabletValue, maxValue);
  } else if (isFolding) {
    return foldingValue;
  } else if (isLargeMobile) {
    return largeMobileValue;
  } else if (isSmallMobile) {
    return smallMobileValue;
  }
  return mobileValue;
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
    borderRadius: getTabletSafeDimension(16, 16, 16, 14, 16, 18),
    padding: getTabletSafeDimension(24, 28, 26, 20, 28, 32),
    width: isTablet ? Math.min(screenWidth * 0.7, 380) : '90%',
    maxWidth: 420,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: getTabletSafeFontSize(
      moderateScale(16),
      moderateScale(18),
      18
    ),
    color: '#000',
    fontWeight: '700',
  },
  description: {
    fontSize: getTabletSafeFontSize(
      moderateScale(12),
      moderateScale(13),
      14
    ),
    color: '#A4A7AE',
    marginBottom: getTabletSafeDimension(24, 28, 26, 20, 28, 32),
    lineHeight: getTabletSafeFontSize(18, 20, 20),
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: getTabletSafeFontSize(
      moderateScale(12),
      moderateScale(13),
      14
    ),
    color: '#414651',
    marginBottom: getTabletSafeDimension(8, 10, 9, 6, 10, 12),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: getTabletSafeDimension(8, 10, 9, 6, 10, 12),
    paddingHorizontal: getTabletSafeDimension(16, 18, 17, 12, 18, 20),
    paddingVertical: getTabletSafeDimension(12, 14, 13, 10, 14, 16),
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
    fontSize: getTabletSafeFontSize(
      moderateScale(12),
      moderateScale(13),
      14
    ),
    color: '#000',
    paddingVertical: 4,
    paddingRight: 0,
    marginRight: 0,
  },
  domainText: {
    fontSize: getTabletSafeFontSize(
      moderateScale(12),
      moderateScale(13),
      14
    ),
    marginLeft: 0,
    color: Colors.primaryBlue,
    lineHeight: getTabletSafeFontSize(moderateScale(16), 18, 18),
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: getTabletSafeFontSize(scale(12), scale(13), 14),
    marginTop: getTabletSafeDimension(6, 8, 7, 4, 8, 10),
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
    fontSize: getTabletSafeFontSize(
      moderateScale(12),
      moderateScale(13),
      14
    ),
    color: '#535862',
  },
  previewEmail: {
    fontSize: getTabletSafeFontSize(
      moderateScale(12),
      moderateScale(13),
      14
    ),
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
    borderRadius: getTabletSafeDimension(8, 10, 9, 6, 10, 12),
    paddingVertical: getTabletSafeDimension(14, 16, 15, 12, 16, 18),
    paddingHorizontal: getTabletSafeDimension(24, 28, 26, 20, 28, 32),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  cancelButtonText: {
    fontSize: getTabletSafeFontSize(
      moderateScale(16),
      moderateScale(16),
      16
    ),
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: Colors.primaryBlue,
    borderRadius: getTabletSafeDimension(8, 10, 9, 6, 10, 12),
    paddingVertical: getTabletSafeDimension(14, 16, 15, 12, 16, 18),
    paddingHorizontal: getTabletSafeDimension(24, 28, 26, 20, 28, 32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: getTabletSafeFontSize(
      moderateScale(16),
      moderateScale(16),
      16
    ),
    color: Colors.white,
  },
});

export default AddAccountModal;