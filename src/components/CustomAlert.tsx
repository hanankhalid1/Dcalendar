import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import * as DimensionsUtils from '../utils/dimensions';

const { scaleWidth, scaleHeight, moderateScale, screenWidth } = DimensionsUtils;

// Tablet detection and sizing helper for consistent spacing
const isTablet = screenWidth >= 600;
const getTabletSafeDimension = (
  mobileValue: number,
  tabletValue: number,
  maxValue: number,
) => {
  if (isTablet) {
    return Math.min(tabletValue, maxValue);
  }
  return mobileValue;
};

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
    paddingHorizontal: getTabletSafeDimension(scaleWidth(20), 32, 40),
  },
  container: {
    width: '100%',
    maxWidth: getTabletSafeDimension(scaleWidth(340), 480, 520),
    backgroundColor: Colors.white,
    borderRadius: getTabletSafeDimension(moderateScale(14), 12, 16),
    paddingHorizontal: getTabletSafeDimension(moderateScale(20), 18, 22),
    paddingVertical: getTabletSafeDimension(moderateScale(18), 16, 20),
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
    fontSize: getTabletSafeDimension(moderateScale(18), 16, 20),
    color: Colors.black,
    textAlign: 'left',
    marginBottom: getTabletSafeDimension(scaleHeight(10), 8, 12),
  },
  message: {
    fontFamily: Fonts.regular,
    fontSize: getTabletSafeDimension(moderateScale(14), 13, 15),
    color: Colors.grey,
    textAlign: 'left',
    marginBottom: getTabletSafeDimension(scaleHeight(18), 14, 20),
    lineHeight: getTabletSafeDimension(moderateScale(20), 18, 22),
  },
  button: {
    alignSelf: 'flex-end',
    paddingVertical: getTabletSafeDimension(scaleHeight(10), 9, 12),
    paddingHorizontal: getTabletSafeDimension(scaleWidth(18), 16, 20),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: getTabletSafeDimension(moderateScale(8), 8, 10),
    backgroundColor: Colors.primaryblue,
  },
  buttonText: {
    fontFamily: Fonts.semiBold,
    fontSize: getTabletSafeDimension(moderateScale(14), 13, 15),
    color: Colors.white,
  },
});

export default CustomAlert;
