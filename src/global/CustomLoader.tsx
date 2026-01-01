import { View, Text, ActivityIndicator, Modal } from 'react-native';
import React from 'react';
import { Colors } from '../constants/Colors';

const CustomLoader = () => {
  return (
    <Modal visible={true} transparent>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size={'large'} color={Colors.primaryblue} />
      </View>
    </Modal>
  );
};

export default CustomLoader;
