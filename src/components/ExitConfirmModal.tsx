import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import * as DimensionsUtils from '../utils/dimensions';

const { scaleWidth, scaleHeight, moderateScale } = DimensionsUtils;

interface ExitConfirmModalProps {
  visible: boolean;
  onCancel: () => void;
}

const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  visible,
  onCancel,
}) => {
  // Use React Native's built-in BackHandler to exit the app
  const exitApp = () => {
    BackHandler.exitApp();
  };
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Exit App?</Text>
          <Text style={styles.message}>
            Are you sure you want to close DCalendar?
          </Text>

          <View style={styles.buttonRow}>
            {/* Cancel */}
            <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            {/* Exit */}
            <TouchableOpacity onPress={exitApp} style={styles.exitBtn}>
              <Text style={styles.exitText}>Exit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ExitConfirmModal;

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
    fontFamily: Fonts.semiBold,
    fontSize: moderateScale(14),
    color: Colors.black,
  },
  exitBtn: {
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(18),
    borderRadius: moderateScale(8),
    backgroundColor: Colors.primaryblue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitText: {
    fontFamily: Fonts.semiBold,
    fontSize: moderateScale(14),
    color: Colors.white,
  },
});
