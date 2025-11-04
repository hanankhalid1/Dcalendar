import React from 'react';
import { View, TextInput, StyleSheet, Image } from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { scaleWidth } from '../../utils/dimensions';
import { colors, fontSize, spacing } from '../../utils/LightTheme';

interface LocationInputProps {
  location: string;
  onLocationChange: (location: string) => void;
}

const LocationInput: React.FC<LocationInputProps> = ({
  location,
  onLocationChange,
}) => {
  return (
    <View style={styles.selectorItem2}>
      <FeatherIcon name="map-pin" size={20} color="#6C6C6C" />
      <TextInput
        style={[styles.selectorText, styles.locationInput]}
        placeholder="Pick location"
        placeholderTextColor={colors.grey400}
        value={location}
        onChangeText={onLocationChange}
      />
      <Image
        source={require('../../assets/images/CreateEventImages/addIcon.png')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  selectorItem2: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    width: scaleWidth(150),
  },
  selectorText: {
    fontSize: fontSize.textSize14,
    color: colors.blackText,
    fontWeight: '400',
    marginHorizontal: spacing.sm,
  },
  locationInput: {
    flex: 1,
  },
});

export default LocationInput;




