import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { moderateScale, scaleWidth } from '../../utils/dimensions';
import { colors, fontSize, spacing } from '../../utils/LightTheme';

interface AddNotificationRowProps {
  onAddNotification?: () => void;
}

const AddNotificationRow: React.FC<AddNotificationRowProps> = ({
  onAddNotification,
}) => {
  return (
    <TouchableOpacity
      style={styles.addNotificationRow}
      onPress={onAddNotification}
    >
      <View style={styles.addNotificationIconContainer}>
        <Image
          source={require('../../assets/images/CreateEventImages/addIcon.png')}
        />
      </View>
      <Text style={styles.selectorText}>Add notification</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  addNotificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: '#F6F7F9',
    width: scaleWidth(154),
  },
  addNotificationIconContainer: {
    width: moderateScale(24),
    height: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00C78B1A',
    borderRadius: moderateScale(4),
  },
  selectorText: {
    fontSize: fontSize.textSize14,
    color: colors.blackText,
    fontWeight: '400',
    marginHorizontal: spacing.sm,
  },
});

export default AddNotificationRow;
