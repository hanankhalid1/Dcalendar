import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Animated,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../constants/Colors';

const CustomSwitch = ({
  value = false,
  onValueChange,
  disabled = false,
  gradientColorsOn = [Colors.primaryGreen, Colors.primaryblue],
  trackColorOff = '#E5E7EB',
  thumbColor = '#FFFFFF',
  width = 50,
  height = 28,
  thumbSize = 22,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, animatedValue]);

  const handlePress = () => {
    if (!disabled && onValueChange) {
      onValueChange(!value);
    }
  };

  const thumbPosition = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, width - thumbSize - 2],
  });

  const trackOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const trackStyle = {
    width,
    height,
    borderRadius: height / 2,
  };

  const thumbStyle = {
    width: thumbSize,
    height: thumbSize,
    borderRadius: thumbSize / 2,
    transform: [{ translateX: thumbPosition }],
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <View style={[styles.track, trackStyle, { backgroundColor: trackColorOff }]}>
        <Animated.View 
          style={[
            styles.gradientTrack, 
            trackStyle, 
            { opacity: trackOpacity }
          ]}
        >
          <LinearGradient
            colors={gradientColorsOn}
            start={{ x: 1, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, trackStyle]}
          />
        </Animated.View>
        <Animated.View style={[styles.thumb, thumbStyle, { backgroundColor: thumbColor }]} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  track: {
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gradientTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  gradient: {
    flex: 1,
  },
  thumb: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
    zIndex: 1,
  },
});

export default CustomSwitch;