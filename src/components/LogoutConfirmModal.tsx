import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import * as DimensionsUtils from '../utils/dimensions';

const { scaleWidth, scaleHeight, moderateScale, screenWidth } = DimensionsUtils;

// Tablet-aware sizing helper to keep the modal balanced on larger screens
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

interface LogoutConfirmModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  visible,
  onCancel,
  onConfirm,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Log Out</Text>
          <Text style={styles.message}>Are you sure you want to log out?</Text>

          <View style={styles.buttonRow}>
            {/* Cancel Button */}
            <TouchableOpacity
              onPress={onCancel}
              style={styles.cancelBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            {/* Log Out Button */}
            <TouchableOpacity
              onPress={onConfirm}
              style={styles.logoutBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default LogoutConfirmModal;

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
    maxWidth: getTabletSafeDimension(scaleWidth(340), 460, 500),
    backgroundColor: Colors.white,
    borderRadius: getTabletSafeDimension(moderateScale(14), 12, 16),
    paddingHorizontal: getTabletSafeDimension(moderateScale(20), 18, 22),
    paddingVertical: getTabletSafeDimension(moderateScale(18), 16, 20),
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
    fontFamily: Fonts.latoBold,
    fontSize: getTabletSafeDimension(moderateScale(18), 16, 20),
    color: Colors.black,
    textAlign: 'left',
    marginBottom: getTabletSafeDimension(scaleHeight(10), 8, 12),
  },
  message: {
    fontFamily: Fonts.latoRegular,
    fontSize: getTabletSafeDimension(moderateScale(14), 13, 15),
    color: Colors.grey,
    textAlign: 'left',
    marginBottom: getTabletSafeDimension(scaleHeight(18), 14, 20),
    lineHeight: getTabletSafeDimension(moderateScale(20), 18, 22),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: getTabletSafeDimension(scaleWidth(12), 14, 16),
  },
  cancelBtn: {
    paddingVertical: getTabletSafeDimension(scaleHeight(10), 9, 12),
    paddingHorizontal: getTabletSafeDimension(scaleWidth(18), 16, 20),
    borderRadius: getTabletSafeDimension(moderateScale(8), 8, 10),
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: Fonts.latoSemiBold,
    fontSize: getTabletSafeDimension(moderateScale(14), 13, 15),
    color: Colors.black,
  },
  logoutBtn: {
    paddingVertical: getTabletSafeDimension(scaleHeight(10), 9, 12),
    paddingHorizontal: getTabletSafeDimension(scaleWidth(18), 16, 20),
    borderRadius: getTabletSafeDimension(moderateScale(8), 8, 10),
    backgroundColor: '#FF3B30', // Red for logout action
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    fontFamily: Fonts.latoSemiBold,
    fontSize: getTabletSafeDimension(moderateScale(14), 13, 15),
    color: Colors.white,
  },
});
