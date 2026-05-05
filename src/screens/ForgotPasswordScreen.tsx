import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  Text,
  StatusBar,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { resetPassword, Role, clearError } from '../store/slices/authSlice';
import { colors } from '../theme/colors';
import { hs, vs, ms } from '../theme/scale';
import AppInput from '../components/common/AppInput';
import AppButton from '../components/common/AppButton';

const ForgotPasswordScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error: authError } = useSelector((state: RootState) => state.auth);

  const [role, setRole] = useState<Role>('Parent');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    dispatch(clearError());
    return () => { dispatch(clearError()); };
  }, [dispatch]);

  const validate = () => {
    let isValid = true;
    let newErrors: any = {};

    if (!/^\d{10}$/.test(mobile)) { newErrors.mobile = 'Enter valid 10-digit mobile number'; isValid = false; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { newErrors.email = 'Enter a valid email'; isValid = false; }
    if (newPassword.length < 4) { newErrors.newPassword = 'Password must be at least 4 characters'; isValid = false; }

    setErrors(newErrors);
    return isValid;
  };

  const handleReset = async () => {
    if (loading) return;

    if (!validate()) return;

    try {
      const resultAction = await dispatch(resetPassword({ mobile, email, role, newPassword }));

      if (resetPassword.fulfilled.match(resultAction)) {
        Alert.alert('Success', 'Your password has been successfully reset!');
        navigation.replace('Login');
      }
    } catch (err) {
      // Handled by Redux extraReducers
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.loginBg} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter your details to create a new password</Text>

          {/* Role Selection */}
          <View style={{ flexDirection: 'row', marginBottom: vs(24) }}>
            <TouchableOpacity
              style={[styles.roleBtn, role === 'Parent' && styles.roleBtnActive]}
              onPress={() => { setRole('Parent'); setErrors({}); }}
            >
              <Text style={[styles.roleText, role === 'Parent' && styles.roleTextActive]}>Parent</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleBtn, role === 'Teacher' && styles.roleBtnActive]}
              onPress={() => { setRole('Teacher'); setErrors({}); }}
            >
              <Text style={[styles.roleText, role === 'Teacher' && styles.roleTextActive]}>Teacher</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleBtn, role === 'Admin' && styles.roleBtnActive]}
              onPress={() => { setRole('Admin' as any); setErrors({}); }}
            >
              <Text style={[styles.roleText, role === 'Admin' && styles.roleTextActive]}>Admin</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Mobile Number *</Text>
            <AppInput
              leftIcon="📞"
              placeholder="Enter 10-digit mobile number"
              value={mobile}
              onChangeText={text => { setMobile(text.replace(/[^0-9]/g, '')); setErrors({...errors, mobile: null}); }}
              keyboardType="number-pad"
              maxLength={10}
            />
            {!!errors.mobile && <Text style={styles.errorText}>{errors.mobile}</Text>}

            <Text style={styles.label}>Email Address *</Text>
            <AppInput
              leftIcon="✉️"
              placeholder="Enter your registered email"
              value={email}
              onChangeText={text => { setEmail(text); setErrors({...errors, email: null}); }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {!!errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            <Text style={styles.label}>New Password *</Text>
            <AppInput
              leftIcon="🔒"
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={text => { setNewPassword(text); setErrors({...errors, newPassword: null}); }}
              secureTextEntry
              showEye
            />
            {!!errors.newPassword && <Text style={styles.errorText}>{errors.newPassword}</Text>}

            
            <View style={styles.btnContainer}>
              <AppButton
                title="Reset Password"
                onPress={handleReset}
                size="full"
                loading={loading}
                disabled={loading}
              />
            </View>

            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backBtnText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.loginBg,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: hs(24),
    paddingTop: vs(40),
    paddingBottom: vs(40),
    justifyContent: 'center',
  },
  title: {
    fontSize: ms(28),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: vs(8),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: ms(14),
    color: colors.textSecond,
    textAlign: 'center',
    marginBottom: vs(32),
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: ms(13),
    fontWeight: '600',
    color: colors.textSecond,
    marginBottom: vs(4),
  },
  errorText: {
    fontSize: ms(12),
    color: colors.absent,
    marginBottom: vs(12),
    marginTop: vs(-8),
    marginLeft: hs(4),
  },
  btnContainer: {
    marginTop: vs(24),
    marginBottom: vs(16)
  },
  roleBtn: {
    flex: 1,
    paddingVertical: vs(12),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8DDD0',
    marginHorizontal: hs(4),
    borderRadius: hs(8),
    backgroundColor: '#FFF'
  },
  roleBtnActive: {
    backgroundColor: '#C0392B',
    borderColor: '#C0392B',
  },
  roleText: {
    color: '#2C1A0E',
    fontWeight: '700',
    fontSize: ms(14)
  },
  roleTextActive: {
    color: '#FFF',
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: vs(12),
  },
  backBtnText: {
    color: '#C0392B',
    fontWeight: '700',
    fontSize: ms(14),
  }
});

export default ForgotPasswordScreen;
