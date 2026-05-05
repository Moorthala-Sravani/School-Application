import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { vs } from '../../theme/scale';

interface Props {
  color?: string;
  fullPage?: boolean;
  style?: any;
}

const AppLoader = ({ color = colors.primary, fullPage, style }: Props) => (
  <View style={[s.wrap, fullPage && s.fullPage, style]}>
    <ActivityIndicator size="large" color={color} />
  </View>
);

const s = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(40),
  },
  fullPage: {
    flex: 1,
    paddingVertical: 0,
  },
});

export default AppLoader;
