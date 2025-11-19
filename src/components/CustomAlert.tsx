import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
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
  const getIconColor = () => {
    switch (type) {
      case 'success':
        return Colors.primaryGreen;
      case 'error':
        return '#F44336';
      case 'warning':
        return '#FF9800';
      default:
        return Colors.primaryblue;
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Icon/Indicator */}
          <View style={[styles.iconContainer, { backgroundColor: `${getIconColor()}15` }]}>
            <View style={[styles.iconCircle, { borderColor: getIconColor() }]}>
              {type === 'success' && (
                <Text style={[styles.iconText, { color: getIconColor() }]}>✓</Text>
              )}
              {type === 'error' && (
                <Text style={[styles.iconText, { color: getIconColor() }]}>✕</Text>
              )}
              {type === 'warning' && (
                <Text style={[styles.iconText, { color: getIconColor() }]}>⚠</Text>
              )}
              {type === 'info' && (
                <Text style={[styles.iconText, { color: getIconColor() }]}>ℹ</Text>
              )}
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Button */}
          <TouchableOpacity
            onPress={onClose}
            style={styles.buttonWrapper}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.primaryGreen, Colors.primaryblue]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>{buttonText}</Text>
            </LinearGradient>
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
    borderRadius: moderateScale(20),
    padding: moderateScale(24),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: scaleHeight(16),
    borderRadius: moderateScale(50),
    padding: moderateScale(4),
  },
  iconCircle: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  iconText: {
    fontSize: moderateScale(28),
    fontWeight: 'bold',
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: moderateScale(20),
    color: Colors.black,
    textAlign: 'center',
    marginBottom: scaleHeight(12),
  },
  message: {
    fontFamily: Fonts.regular,
    fontSize: moderateScale(15),
    color: Colors.grey,
    textAlign: 'center',
    marginBottom: scaleHeight(24),
    lineHeight: moderateScale(22),
  },
  buttonWrapper: {
    width: '100%',
    borderRadius: moderateScale(14),
    overflow: 'hidden',
  },
  button: {
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(24),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: moderateScale(14),
  },
  buttonText: {
    fontFamily: Fonts.semiBold,
    fontSize: moderateScale(16),
    color: Colors.white,
  },
});

export default CustomAlert;

