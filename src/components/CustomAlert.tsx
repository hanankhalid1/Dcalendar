import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import * as DimensionsUtils from '../utils/dimensions';

const { scaleWidth, scaleHeight, moderateScale } = DimensionsUtils;

export interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  buttonText?: string;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  type = 'info',
  onClose,
  buttonText = 'OK',
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Button */}
          <TouchableOpacity
            onPress={onClose}
            style={styles.button}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>{buttonText}</Text>
          </TouchableOpacity>
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
    paddingHorizontal: scaleWidth(20),
  },
  container: {
    width: '100%',
    maxWidth: scaleWidth(340),
    backgroundColor: Colors.white,
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(18),
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: moderateScale(18),
    color: Colors.black,
    textAlign: 'left',
    marginBottom: scaleHeight(10),
  },
  message: {
    fontFamily: Fonts.regular,
    fontSize: moderateScale(14),
    color: Colors.grey,
    textAlign: 'left',
    marginBottom: scaleHeight(18),
    lineHeight: moderateScale(20),
  },
  button: {
    alignSelf: 'flex-end',
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(18),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: moderateScale(8),
    backgroundColor: Colors.primaryblue,
  },
  buttonText: {
    fontFamily: Fonts.semiBold,
    fontSize: moderateScale(14),
    color: Colors.white,
  },
});

export default CustomAlert;
