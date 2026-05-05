// src/components/common/AppInput.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { colors }     from '../../theme/colors';
import { hs, vs, ms } from '../../theme/scale';

interface Props extends TextInputProps {
  label?:          string;
  error?:          string;
  leftIcon?:       string | React.ReactNode;  // ✅ accepts emoji string OR component
  rightIcon?:      string | React.ReactNode;
  showEye?:        boolean;
  containerStyle?: ViewStyle;
}

const AppInput = ({
  label,
  error,
  leftIcon,
  rightIcon,
  showEye = false,
  containerStyle,
  secureTextEntry,
  style,
  ...rest
}: Props) => {
  const [focused,  setFocused]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  // ✅ Renders icon whether it's a string emoji or a component
  const renderIcon = (icon: string | React.ReactNode) => {
    if (typeof icon === 'string') {
      return <Text style={styles.iconText}>{icon}</Text>;
    }
    return <>{icon}</>;
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>

      {/* Label */}
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}

      {/* Input Row */}
      <View style={[
        styles.container,
        focused && styles.focused,
        !!error && styles.hasError,
      ]}>

        {/* Left Icon */}
        {leftIcon ? (
          <View style={styles.leftIcon}>
            {renderIcon(leftIcon)}
          </View>
        ) : null}

        {/* Text Input */}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textGray}
          onFocus={() => setFocused(true)}
          onBlur={()  => setFocused(false)}
          secureTextEntry={showEye ? !showPass : secureTextEntry}
          {...rest}
        />

        {/* Eye Toggle */}
        {showEye ? (
          <TouchableOpacity
            onPress={() => setShowPass(p => !p)}
            style={styles.rightIcon}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.iconText}>
              {showPass ? '👁️' : '🙈'}
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* Custom Right Icon */}
        {rightIcon && !showEye ? (
          <View style={styles.rightIcon}>
            {renderIcon(rightIcon)}
          </View>
        ) : null}

      </View>

      {/* Error */}
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: vs(14),
  },
  label: {
    fontSize:     ms(13),
    fontWeight:   '500',
    color:        colors.textSecond,
    marginBottom: vs(6),
  },
  container: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   colors.inputBg,
    borderRadius:      hs(10),
    borderWidth:       1.5,
    borderColor:       colors.border,
    paddingHorizontal: hs(12),
    minHeight:         vs(52),
  },
  focused: {
    borderColor: colors.primary,
  },
  hasError: {
    borderColor: '#E74C3C',
  },
  input: {
    flex:            1,
    fontSize:        ms(14),
    color:           colors.textPrimary,
    paddingVertical: vs(10),
  },
  leftIcon: {
    marginRight: hs(10),
  },
  rightIcon: {
    marginLeft: hs(10),
    padding:    hs(4),
  },
  iconText: {
    fontSize: ms(18),
  },
  errorText: {
    fontSize:   ms(11),
    color:      '#E74C3C',
    marginTop:  vs(4),
    marginLeft: hs(4),
  },
});

export default AppInput;