import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { moderateScale } from '../../utils/dimensions';
import { colors, fontSize, spacing } from '../../utils/LightTheme';

type GuestPermissionType = 'modifyEvent' | 'inviteOthers' | 'seeGuestList' | '';

interface GuestPermissionsProps {
  selectedPermission: GuestPermissionType;
  onPermissionChange: (permission: GuestPermissionType) => void;
}

const GuestPermissions: React.FC<GuestPermissionsProps> = ({
  selectedPermission,
  onPermissionChange,
}) => {
  const handlePermissionSelect = (permission: GuestPermissionType) => {
    // If the same permission is selected, deselect it (set to empty)
    if (selectedPermission === permission) {
      onPermissionChange('');
    } else {
      onPermissionChange(permission);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle2}>Guest Permission</Text>
      <View style={styles.permissionOptions}>
        <TouchableOpacity
          style={styles.permissionOption}
          onPress={() => handlePermissionSelect('modifyEvent')}
        >
          <View
            style={
              selectedPermission === 'modifyEvent'
                ? styles.radioButtonSelected
                : styles.radioButton
            }
          >
            {selectedPermission === 'modifyEvent' && (
              <View style={styles.radioButtonInner} />
            )}
          </View>
          <Text style={styles.permissionText}>Modify event</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.permissionOption}
          onPress={() => handlePermissionSelect('inviteOthers')}
        >
          <View
            style={
              selectedPermission === 'inviteOthers'
                ? styles.radioButtonSelected
                : styles.radioButton
            }
          >
            {selectedPermission === 'inviteOthers' && (
              <View style={styles.radioButtonInner} />
            )}
          </View>
          <Text style={styles.permissionText}>invite others</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.permissionOption}
          onPress={() => handlePermissionSelect('seeGuestList')}
        >
          <View
            style={
              selectedPermission === 'seeGuestList'
                ? styles.radioButtonSelected
                : styles.radioButton
            }
          >
            {selectedPermission === 'seeGuestList' && (
              <View style={styles.radioButtonInner} />
            )}
          </View>
          <Text style={styles.permissionText}>see guest list</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle2: {
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  permissionOptions: {
    marginTop: spacing.sm,
  },
  permissionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  radioButton: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: colors.figmaAccent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  radioButtonSelected: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#18F06E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  radioButtonInner: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    backgroundColor: '#18F06E',
  },
  permissionText: {
    fontSize: fontSize.textSize16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
});

export default GuestPermissions;
