import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { scaleWidth } from '../../utils/dimensions';
import {
  colors,
  fontSize,
  spacing,
  borderRadius,
} from '../../utils/LightTheme';

interface AttachmentUploadProps {
  onUploadPress: () => void;
}

const AttachmentUpload: React.FC<AttachmentUploadProps> = ({
  onUploadPress,
}) => {
  return (
    <View style={styles.attachmentSection}>
      <Text style={styles.attachmentLabel}>Add attachment</Text>
      <TouchableOpacity style={styles.uploadButton} onPress={onUploadPress}>
        <Image
          source={require('../../assets/images/CreateEventImages/fileAdd.png')}
          style={styles.uploadIcon}
        />
        <Text style={styles.uploadText}>Click to upload</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  attachmentSection: {
    marginBottom: spacing.xl,
  },
  attachmentLabel: {
    fontSize: fontSize.textSize15,
    color: colors.blackText,
    fontWeight: '400',
    marginBottom: spacing.md,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00C78B1A',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    width: scaleWidth(200),
  },
  uploadIcon: {
    fontSize: fontSize.textSize18,
    marginRight: spacing.sm,
  },
  uploadText: {
    fontSize: fontSize.textSize16,
    color: colors.raisinBlack,
    fontWeight: '500',
  },
});

export default AttachmentUpload;




