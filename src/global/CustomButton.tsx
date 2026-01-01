import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import React, { FC } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { Fonts } from '../constants/Fonts';
import { scale } from 'react-native-size-matters';
import { Colors } from '../constants/Colors';
interface CustomButtonProps {
  style?: ViewStyle;
  titleStyle?: TextStyle;
  title: string;
  leftIcon?: React.ReactNode;
  RightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  colors: [string,string];
  onPress:()=>void
}
const CustomButton: FC<CustomButtonProps> = ({
  style,
  titleStyle,
  title,
  leftIcon,
  RightIcon,
  containerStyle,
  colors=[Colors.primaryGreen,Colors.primaryblue],
  onPress
}) => {
  return (
    <LinearGradient
      start={{ x: 0, y: 0 }}
      colors={colors}
      end={{ x: 1, y: 0.1 }}
      style={[styles.boxStyle, containerStyle]}
    >
      <TouchableOpacity onPress={onPress} style={[styles.containerStyle, style]}>
        {leftIcon}
        <Text style={[styles.titleStyle, titleStyle]}>{title}</Text>
        {RightIcon}
      </TouchableOpacity>
    </LinearGradient>
  );
};
const styles = StyleSheet.create({
  containerStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 13,
    paddingBottom: 13,
    paddingHorizontal: 20,
    borderRadius: 32,
  },
  boxStyle: {
    borderRadius:32
  },
  titleStyle: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: Colors.white,
    textAlignVertical: 'center',
  },
});
export default CustomButton;
