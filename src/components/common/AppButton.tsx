// src/components/common/AppButton.tsx
import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  View,
  Text,
} from 'react-native';
import { colors }     from '../../theme/colors';
import { hs, vs, ms } from '../../theme/scale';

type Variant = 'primary' | 'outline' | 'ghost';
type Size    = 'sm' | 'md' | 'lg' | 'full';

interface Props {
  title:     string;
  onPress:   () => void;
  variant?:  Variant;
  size?:     Size;
  loading?:  boolean;
  disabled?: boolean;
  style?:    ViewStyle;
  icon?:     React.ReactNode;
}

const SIZE_MAP = {
  sm:   { px: hs(16), py: vs(8),  fontSize: ms(13), radius: hs(8)  },
  md:   { px: hs(24), py: vs(12), fontSize: ms(14), radius: hs(10) },
  lg:   { px: hs(32), py: vs(15), fontSize: ms(15), radius: hs(12) },
  full: { px: hs(20), py: vs(15), fontSize: ms(15), radius: hs(12) },
};

const VARIANT_MAP = {
  primary: {
    bg:     colors.btnPrimary,
    text:   colors.btnText,
    border: colors.btnPrimary,
  },
  outline: {
    bg:     'transparent',
    text:   colors.primary,
    border: colors.primary,
  },
  ghost: {
    bg:     'transparent',
    text:   colors.primary,
    border: 'transparent',
  },
};

const AppButton = ({
  title,
  onPress,
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  disabled = false,
  style,
  icon,
}: Props) => {
  const s = SIZE_MAP[size];
  const v = VARIANT_MAP[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.btn,
        {
          backgroundColor:   disabled ? colors.btnDisabled : v.bg,
          borderColor:       disabled ? colors.btnDisabled : v.border,
          paddingHorizontal: s.px,
          paddingVertical:   s.py,
          borderRadius:      s.radius,
          width:             size === 'full' ? '100%' : undefined,
          opacity:           disabled ? 0.7 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={disabled ? colors.textWhite : v.text}
          size="small"
        />
      ) : (
        <View style={styles.inner}>
          {icon ? icon : null}
          <Text
            style={{
              fontSize:   s.fontSize,
              fontWeight: '600',
              color:      disabled ? colors.textWhite : v.text,
              marginLeft: icon ? hs(6) : 0,
            }}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
  },
});

export default AppButton;