import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { hs, vs, ms } from '../../theme/scale';
import { colors } from '../../theme/colors';

interface Props {
  message?: string | null;
  onRetry?: () => void;
  accentColor?: string;
  fullPage?: boolean;
}

const ErrorView = ({ message, onRetry, accentColor = colors.primary, fullPage }: Props) => (
  <View style={[s.wrap, fullPage && s.fullPage]}>
    <View style={[s.iconCircle, { borderColor: accentColor + '30', backgroundColor: accentColor + '12' }]}>
      <Text style={s.icon}>⚠️</Text>
    </View>
    <Text style={s.title}>Something went wrong</Text>
    <Text style={s.message}>{message || 'An unexpected error occurred.'}</Text>
    {onRetry && (
      <TouchableOpacity style={[s.btn, { backgroundColor: accentColor }]} onPress={onRetry} activeOpacity={0.8}>
        <Text style={s.btnText}>Try Again</Text>
      </TouchableOpacity>
    )}
  </View>
);

const s = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: hs(32),
    paddingVertical: vs(40),
    minHeight: vs(260),
  },
  fullPage: {
    flex: 1,
    minHeight: undefined,
  },
  iconCircle: {
    width: hs(72),
    height: hs(72),
    borderRadius: hs(36),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(16),
  },
  icon: { fontSize: ms(30) },
  title: {
    fontSize: ms(17),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: vs(8),
    textAlign: 'center',
  },
  message: {
    fontSize: ms(14),
    color: colors.textSecond,
    textAlign: 'center',
    lineHeight: vs(22),
    marginBottom: vs(24),
  },
  btn: {
    paddingHorizontal: hs(32),
    paddingVertical: vs(12),
    borderRadius: hs(24),
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  btnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: ms(14),
  },
});

export default ErrorView;
