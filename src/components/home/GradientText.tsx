// src/components/GradientText.tsx
import React from 'react';
import { Text, TextProps } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../constants/Colors';

interface GradientTextProps extends TextProps {
  colors?: string[];
  start?:{x:number,y:number},
  end?:{x:number,y:number},
  children: React.ReactNode;
}

const GradientText: React.FC<GradientTextProps> = ({
  colors=[Colors.primaryGreen,Colors.primaryblue],
  children,
  style,
  start,
  end,
  ...rest
}) => {
  return (
    <MaskedView
      maskElement={
        <Text style={[style]} {...rest}>
          {children}
        </Text>
      }
    >
      <LinearGradient
        colors={colors}
        start={start?start:{ x: 0, y: 0.5 }}
        end={end?end:{ x: 1, y: 0.3 }}
      >
        <Text style={[style, { opacity: 0 }]} {...rest}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
};

export default GradientText;
