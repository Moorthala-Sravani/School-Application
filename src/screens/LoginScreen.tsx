import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Text,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { hs, vs, ms } from '../theme/scale';
import AppInput from '../components/common/AppInput';
import AppButton from '../components/common/AppButton';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError, Role } from '../store/slices/authSlice';
import { AppDispatch, RootState } from '../store';

const LoginScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('Parent');
  const { loading, error: authError } = useSelector((state: RootState) => state.auth);
  const [localError, setLocalError] = useState('');

  // Clear auth error when mounting/unmounting
  React.useEffect(() => {
    dispatch(clearError());
    return () => { dispatch(clearError()); };
  }, [dispatch]);

  const validate = () => {
    if (!/^\d{10}$/.test(mobile)) {
      return 'Enter valid 10-digit mobile number';
    }
    if (password.length < 4) {
      return 'Password must be at least 4 characters';
    }
    return '';
  };

  const handleLogin = async () => {
    if (loading) return;

    const validationError = validate();
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setLocalError('');

    try {
      const resultAction = await dispatch(loginUser({ mobile, password, role }));
      
      if (!loginUser.fulfilled.match(resultAction)) {
        if (resultAction.payload) {
          // Show user-friendly error message for login failures
          setLocalError('Invalid email or password. Please try again.');
        }
      }
      // Note: On success, isAuthenticated becomes true and Redux handles navigation
    } catch (err) {
      setLocalError('Invalid email or password. Please try again.');
    }
  };


  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.loginBg} />

      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
              <Text style={styles.logoIcon}>+</Text>
            </View>
            <Text style={styles.schoolName}>Greenfield</Text>
            <Text style={styles.academyText}>ACADEMY</Text>
          </View>



          <View style={styles.form}>
            {/* Role Selection */}
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[styles.roleBtn, role === 'Parent' && styles.roleBtnActive]}
                onPress={() => setRole('Parent')}
              >
                <Text style={[styles.roleText, role === 'Parent' && styles.roleTextActive]}>Parent</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleBtn, role === 'Teacher' && styles.roleBtnActive]}
                onPress={() => setRole('Teacher')}
              >
                <Text style={[styles.roleText, role === 'Teacher' && styles.roleTextActive]}>Teacher</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleBtn, role === 'Admin' && styles.roleBtnActive]}
                onPress={() => setRole('Admin' as any)}
              >
                <Text style={[styles.roleText, role === 'Admin' && styles.roleTextActive]}>Admin</Text>
              </TouchableOpacity>
            </View>

            {/* Mobile */}
            <Text style={styles.label}>Mobile number</Text>
            <AppInput
              leftIcon="📞"
              placeholder="98xx xxxx xx"
              value={mobile}
              onChangeText={text => {
                setMobile(text.replace(/[^0-9]/g, ''));
                setLocalError('');
              }}
              keyboardType="number-pad"
              maxLength={10}
              returnKeyType="next"
            />

            {/* Password */}
            <View style={{ marginTop: vs(12) }}>
              <Text style={styles.label}>Password</Text>
              <AppInput
                leftIcon="🔒"
                placeholder="••••••••"
                value={password}
                onChangeText={text => {
                  setPassword(text);
                }}
                secureTextEntry
                showEye={true}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity 
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotPasswordContainer}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            
            {/* Error Display */}
            {(authError || localError) && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  {authError || localError}
                </Text>
              </View>
            )}

            {/* Button */}
            <View style={styles.btnContainer}>
              <AppButton
                title="Sign In"
                onPress={handleLogin}
                size="full"
                loading={loading}
                disabled={loading}
              />
            </View>

            {/* Register Link */}
            <View style={styles.registerLinkContainer}>
              <Text style={styles.registerText}>New user? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: colors.loginBg,
  },
  root: {
    flex: 1,
  },
  scroll: {
    flexGrow:          1,
    alignItems:        'center',
    paddingHorizontal: hs(24),
    paddingTop:        vs(80),
    paddingBottom:     vs(40),
  },
  logoContainer: {
    marginBottom: vs(48),
    alignItems:   'center',
  },
  logoBox: {
    width: hs(64),
    height: hs(64),
    borderRadius: hs(16),
    borderWidth: 1,
    borderColor: colors.primaryDark,
    backgroundColor: colors.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(16),
  },
  logoIcon: {
    color: colors.primary,
    fontSize: ms(24),
    fontWeight: '300',
  },
  schoolName: {
    fontSize: ms(24),
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  academyText: {
    fontSize: ms(12),
    fontWeight: '500',
    color: colors.textSecond,
    letterSpacing: 2,
    marginTop: vs(4),
  },
  titleContainer: {
    width: '100%',
    marginBottom: vs(32),
  },
  title: {
    fontSize:     ms(20),
    fontWeight:   '700',
    color:        colors.textPrimary,
    marginBottom: vs(4),
  },
  subtitle: {
    fontSize: ms(14),
    color: colors.textSecond,
  },
  form: {
    width: '100%',
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: vs(24),
  },
  roleBtn: {
    flex: 1,
    paddingVertical: vs(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: hs(12),
    marginHorizontal: hs(4),
    backgroundColor: 'transparent',
  },
  roleBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  roleText: {
    color: colors.textSecond,
    fontWeight: '600',
    fontSize: ms(14),
  },
  roleTextActive: {
    color: colors.white,
  },
  label: {
    fontSize:     ms(13),
    fontWeight:   '500',
    color:        colors.textSecond,
    marginBottom: vs(8),
  },
  errorContainer: {
    backgroundColor: '#FEE',
    borderWidth: 1,
    borderColor: '#FCC',
    borderRadius: hs(8),
    padding: hs(12),
    marginTop: vs(16),
    marginBottom: vs(16),
  },
  errorText: {
    fontSize:     ms(14),
    color:        '#D32F2F',
    textAlign:    'center',
    fontWeight:   '500',
  },
  btnContainer: {
    marginTop: vs(32),
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: vs(8),
    paddingVertical: vs(4),
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: ms(13),
    fontWeight: '600',
  },
  registerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: vs(32),
  },
  registerText: {
    color: colors.textSecond,
    fontSize: ms(14),
  },
  registerLink: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: ms(14),
  }
});

export default LoginScreen;
