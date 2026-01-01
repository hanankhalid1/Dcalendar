import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import * as DimensionsUtils from '../utils/dimensions';

const { scaleWidth, scaleHeight, moderateScale } = DimensionsUtils;

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
    paddingHorizontal: scaleWidth(20),
  },
  container: {
    width: '100%',
    maxWidth: scaleWidth(340),
    backgroundColor: Colors.white,
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(18),
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
    fontSize: moderateScale(18),
    color: Colors.black,
    textAlign: 'left',
    marginBottom: scaleHeight(10),
  },
  message: {
    fontFamily: Fonts.latoRegular,
    fontSize: moderateScale(14),
    color: Colors.grey,
    textAlign: 'left',
    marginBottom: scaleHeight(18),
    lineHeight: moderateScale(20),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: scaleWidth(12),
  },
  cancelBtn: {
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(18),
    borderRadius: moderateScale(8),
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: Fonts.latoSemiBold,
    fontSize: moderateScale(14),
    color: Colors.black,
  },
  logoutBtn: {
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(18),
    borderRadius: moderateScale(8),
    backgroundColor: '#FF3B30', // Red for logout action
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    fontFamily: Fonts.latoSemiBold,
    fontSize: moderateScale(14),
    color: Colors.white,
  },
});
