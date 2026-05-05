// src/components/common/AppText.tsx
import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { typography } from '../../theme/typography';
import { colors } from '../../theme/colors';

type Variant = 'h1' | 'h2' | 'h3' | 'body' | 'sm' | 'xs' | 'label' | 'button' | 'price' | 'link';

interface Props {
  variant?:       Variant;
  color?:         string;
  style?:         TextStyle | TextStyle[];  // ✅ accepts both single and array
  children:       React.ReactNode;
  numberOfLines?: number;
  center?:        boolean;
  bold?:          boolean;
}

const AppText = ({
  variant = 'body',
  color,
  style,
  children,
  numberOfLines,
  center = false,
  bold   = false,
}: Props) => {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        typography[variant] as TextStyle,
        { color: color ?? colors.textPrimary } as TextStyle,
        center ? { textAlign: 'center' } as TextStyle : undefined,
        bold   ? { fontWeight: '700' }  as TextStyle : undefined,
        ...(Array.isArray(style) ? style : style ? [style] : []),
      ]}
    >
      {children}
    </Text>
  );
};

export default AppText;