import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { scaleHeight } from '../../utils/dimensions';
import { colors, fontSize, spacing } from '../../utils/LightTheme';

interface EventTitleInputProps {
  title: string;
  onTitleChange: (title: string) => void;
}

const EventTitleInput: React.FC<EventTitleInputProps> = ({
  title,
  onTitleChange,
}) => {
  return (
    <View style={styles.inputSection}>
      <TextInput
        style={styles.titleInput}
        placeholder="Add title"
        placeholderTextColor={colors.grey400}
        value={title}
        onChangeText={onTitleChange}
      />
      <View style={styles.inputUnderline} />
    </View>
  );
};

const styles = StyleSheet.create({
  inputSection: {
    marginBottom: spacing.lg,
  },
  titleInput: {
    fontSize: fontSize.textSize25,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
    minHeight: scaleHeight(50),
  },
  inputUnderline: {
    height: 1,
    backgroundColor: colors.grey20,
  },
});

export default EventTitleInput;




