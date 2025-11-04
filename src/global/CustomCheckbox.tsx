import { CheckBoxIcon } from '../assets/svgs';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CustomCheckboxWithIcon = ({
  value = false,
  onValueChange,
  size = 20,
  checkedColor = '#00D4AA',
  uncheckedColor = '#D5D7DA',
  checkmarkColor = '#FFFFFF',
  borderRadius = 4,
  borderWidth = 0,
  disabled = false,
  style,
  CheckIcon, // Pass your custom check icon component
  ...props
}) => {
  const handlePress = () => {
    if (!disabled && onValueChange) {
      onValueChange(!value);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: borderRadius,
          borderWidth:value ?0: 1,
          borderColor: value ? checkedColor : uncheckedColor,
          backgroundColor: value ? Colors.gray10 : Colors.white,
        },
        disabled && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      {value && (
        <View style={styles.checkmarkContainer}>
          {CheckIcon ? (
            <CheckIcon
              width={size * 0.6}
              height={size * 0.6}
              color={checkmarkColor}
            />
          ) : (
           <CheckBoxIcon/>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  disabled: {
    opacity: 0.5,
  },
  checkmarkContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  checkmark: {
    fontFamily: Fonts.medium,
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: undefined, // Remove line height for better centering
  },
});

export default CustomCheckboxWithIcon;
