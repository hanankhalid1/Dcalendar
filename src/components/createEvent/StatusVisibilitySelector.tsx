import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { scaleHeight, scaleWidth } from '../../utils/dimensions';
import {
  colors,
  fontSize,
  spacing,
  borderRadius,
} from '../../utils/LightTheme';

interface StatusVisibilitySelectorProps {
  status?: string;
  visibility?: string;
  onStatusPress?: () => void;
  onVisibilityPress?: () => void;
}

const StatusVisibilitySelector: React.FC<StatusVisibilitySelectorProps> = ({
  status = 'Busy',
  visibility = 'Default visibility',
  onStatusPress,
  onVisibilityPress,
}) => {
  return (
    <View style={styles.statusRow}>
      <View style={styles.statusLeft}>
        <FeatherIcon name="eye" size={24} color="#888888" />
        <View style={styles.statusDropdown}>
          <Text style={styles.statusText}>{status}</Text>
          <Image
            source={require('../../assets/images/CreateEventImages/slimDownArrow.png')}
          />
        </View>
      </View>
      <View style={styles.visibilityDropdown}>
        <Text style={styles.visibilityText}>{visibility}</Text>
        <Image
          source={require('../../assets/images/CreateEventImages/slimDownArrow.png')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    paddingRight: scaleWidth(30),
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE0E5',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginLeft: spacing.xs,
    justifyContent: 'center',
    height: scaleHeight(32),
    width: scaleWidth(96),
  },
  statusText: {
    fontSize: fontSize.textSize15,
    color: colors.mediumgray,
    fontWeight: '600',
    marginRight: spacing.xs,
  },
  visibilityDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: '#DCE0E5',
    height: scaleHeight(32),
    width: scaleWidth(169),
  },
  visibilityText: {
    fontSize: fontSize.textSize15,
    color: colors.mediumgray,
    fontWeight: '500',
    marginRight: spacing.sm,
  },
});

export default StatusVisibilitySelector;
