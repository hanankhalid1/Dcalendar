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

const { scaleWidth, scaleHeight, moderateScale, screenWidth } = DimensionsUtils;

// Tablet detection
const isTablet = screenWidth >= 600;

// Helper function for tablet-safe font sizes
const getResponsiveFontSize = (mobileSize: number, tabletFixedSize: number) => {
  if (isTablet) {
    return tabletFixedSize; // Use fixed smaller size for tablets
  }
  return mobileSize;
};

// Helper function for tablet-safe dimensions
const getResponsiveDimension = (mobileSize: number, tabletFixedSize: number) => {
  if (isTablet) {
    return tabletFixedSize; // Use fixed smaller size for tablets
  }
  return mobileSize;
};

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
    maxWidth: isTablet ? 320 : scaleWidth(340),
    backgroundColor: Colors.white,
    borderRadius: getResponsiveDimension(moderateScale(14), 10),
    paddingHorizontal: getResponsiveDimension(moderateScale(20), 16),
    paddingVertical: getResponsiveDimension(moderateScale(18), 14),
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
    fontSize: getResponsiveFontSize(moderateScale(18), 15),
    color: Colors.black,
    textAlign: 'left',
    marginBottom: getResponsiveDimension(scaleHeight(10), 8),
  },
  message: {
    fontFamily: Fonts.regular,
    fontSize: getResponsiveFontSize(moderateScale(14), 12),
    color: Colors.grey,
    textAlign: 'left',
    marginBottom: getResponsiveDimension(scaleHeight(18), 14),
    lineHeight: getResponsiveFontSize(moderateScale(20), 16),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: getResponsiveDimension(scaleWidth(12), 10),
  },
  cancelBtn: {
    paddingVertical: getResponsiveDimension(scaleHeight(10), 8),
    paddingHorizontal: getResponsiveDimension(scaleWidth(18), 14),
    borderRadius: getResponsiveDimension(moderateScale(8), 6),
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: Fonts.semiBold,
    fontSize: getResponsiveFontSize(moderateScale(14), 12),
    color: Colors.black,
  },
  exitBtn: {
    paddingVertical: getResponsiveDimension(scaleHeight(10), 8),
    paddingHorizontal: getResponsiveDimension(scaleWidth(18), 14),
    borderRadius: getResponsiveDimension(moderateScale(8), 6),
    backgroundColor: Colors.primaryblue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitText: {
    fontFamily: Fonts.semiBold,
    fontSize: getResponsiveFontSize(moderateScale(14), 12),
    color: Colors.white,
  },
});
