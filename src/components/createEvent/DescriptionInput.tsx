import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { moderateScale, scaleHeight } from '../../utils/dimensions';
import { colors, fontSize, spacing } from '../../utils/LightTheme';

interface DescriptionInputProps {
  description: string;
  onDescriptionChange: (description: string) => void;
  showAdvanced: boolean;
}

const DescriptionInput: React.FC<DescriptionInputProps> = ({
  description,
  onDescriptionChange,
  showAdvanced,
}) => {
  return (
    <View style={styles.cardContainer}>
      <TextInput
        style={styles.descriptionInput}
        placeholder="Add description"
        placeholderTextColor={colors.grey400}
        multiline
        numberOfLines={4}
        value={description}
        onChangeText={onDescriptionChange}
      />
      {showAdvanced && (
        <View style={styles.formattingToolbar}>
          <View style={styles.toolbarDropdown}>
            <Text style={styles.toolbarText}>Inter</Text>
            <FeatherIcon name="chevron-down" size={14} color="#828282" />
          </View>
          <View style={styles.toolbarDropdown}>
            <Text style={styles.toolbarText}>14 px</Text>
            <FeatherIcon name="chevron-down" size={14} color="#828282" />
          </View>
          <View style={styles.toolbarDropdown}>
            <View style={styles.colorPicker}>
              <LinearGradient
                colors={['#000', '#000']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.colorCircle}
              />
              <Text style={styles.toolbarText}>Colour</Text>
              <FeatherIcon name="chevron-down" size={14} color="#828282" />
            </View>
          </View>
          <TouchableOpacity style={styles.toolbarButton}>
            <FeatherIcon name="align-left" size={16} color="#6C6C6C" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarButton}>
            <FeatherIcon name="more-horizontal" size={16} color="#6C6C6C" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#F6F7F9',
    borderRadius: 10,
    padding: 16,
    marginBottom: spacing.lg,
  },
  descriptionInput: {
    fontSize: fontSize.textSize16,
    color: colors.textPrimary,
    padding: 0,
    minHeight: scaleHeight(100),
    backgroundColor: 'transparent',
    borderRadius: 0,
    textAlignVertical: 'top',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  formattingToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D3D3D3',
    backgroundColor: '#F6F7F9',
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginTop: spacing.sm,
  },
  toolbarDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarText: {
    fontSize: fontSize.textSize10,
    color: colors.neutralmediumgray,
    fontWeight: '400',
  },
  colorPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircle: {
    width: moderateScale(14),
    height: moderateScale(14),
    borderRadius: moderateScale(7),
    marginRight: spacing.sm,
  },
  toolbarButton: {
    paddingHorizontal: spacing.sm,
  },
});

export default DescriptionInput;




