// src/components/common/AppEmpty.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { vs } from '../../theme/scale';
import { colors } from '../../theme/colors';
import AppText from './AppText';

interface Props {
  message: string;  // "No homework data" | "No remarks" | "No notice"
  icon?:   string;  // optional emoji
}

const AppEmpty = ({ message, icon = '📭' }: Props) => (
  <View style={styles.container}>
    <AppText style={styles.icon}>{icon}</AppText>
    <AppText variant="body" color={colors.textSecond} center>
      {message}
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingBottom:  vs(60),
  },
  icon: {
    fontSize:     40,
    marginBottom: vs(12),
  },
});

export default AppEmpty;

// ── USAGE ──────────────────────────────────────────────
// <AppEmpty message="No homework data" />
// <AppEmpty message="No remarks" icon="📝" />
// <AppEmpty message="No notice" icon="📋" />