import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { scaleWidth } from '../../utils/dimensions';
import { colors, fontSize, spacing } from '../../utils/LightTheme';

interface OrganizerSelectorProps {
  organizerName?: string;
  onPress?: () => void;
}

const OrganizerSelector: React.FC<OrganizerSelectorProps> = ({
  organizerName = 'Farhanur Rahman',
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.selectorItem} onPress={onPress}>
      <MaterialIcons name="person" size={24} color="#6C6C6C" />
      <Text style={styles.selectorText}>{organizerName}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  selectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    width: scaleWidth(185),
  },
  selectorText: {
    fontSize: fontSize.textSize14,
    color: colors.blackText,
    fontWeight: '400',
    marginHorizontal: spacing.sm,
  },
});

export default OrganizerSelector;
