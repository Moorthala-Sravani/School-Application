import { colors } from '../../theme/colors';
// src/screens/MainScreenDashboard/ChangePassword.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { resetPassword } from '../../store/slices/authSlice';

// ✅ PasswordField OUTSIDE — fixes keyboard closing
const PasswordField = ({
  label,
  value,
  onChangeText,
  show,
  toggleShow,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  show: boolean;
  toggleShow: () => void;
}) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.inputRow}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!show}
        placeholder={`Enter ${label}`}
        placeholderTextColor="#B08060"
        autoCapitalize="none"
        autoCorrect={false}
        blurOnSubmit={false}
      />
      <TouchableOpacity onPress={toggleShow} style={styles.eyeBtn}>
        <Text style={styles.eyeIcon}>{show ? '🙈' : '👁️'}</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const ChangePassword = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { mobile, role, loading } = useSelector((state: RootState) => state.auth);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent]         = useState(false);
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);

  const handleChange = async () => {
    // ✅ Validate all fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (!mobile || !role) {
      Alert.alert('Error', 'User session not found. Please login again.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirm password do not match.');
      return;
    }

    try {
      await dispatch(
        resetPassword({
          mobile,
          role,
          currentPassword,
          newPassword,
        })
      ).unwrap();

      Alert.alert('Success', 'Password changed successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      // Failed to change password
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Icon */}
          <View style={styles.iconSection}>
            <View style={styles.iconCircle}>
              <Text style={styles.lockIcon}>🔑</Text>
            </View>
            <Text style={styles.iconTitle}>Update Your Password</Text>
            <Text style={styles.iconSubtitle}>
              Make sure your new password is strong and secure.
            </Text>
          </View>

          {/* Fields */}
          <View style={styles.card}>
            <PasswordField
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              show={showCurrent}
              toggleShow={() => setShowCurrent(p => !p)}
            />
            <PasswordField
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              show={showNew}
              toggleShow={() => setShowNew(p => !p)}
            />
            <PasswordField
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              show={showConfirm}
              toggleShow={() => setShowConfirm(p => !p)}
            />
          </View>

          {/* Rules */}
          <View style={styles.rulesCard}>
            <Text style={styles.rulesTitle}>Password Requirements:</Text>
            <Text style={styles.ruleItem}>• Minimum 6 characters</Text>
            <Text style={styles.ruleItem}>• Use letters and numbers</Text>
            <Text style={styles.ruleItem}>• Avoid using personal info</Text>
          </View>

          {/* Submit */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleChange} disabled={loading}>
            <Text style={styles.submitBtnText}>Change Password</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   '#C0392B',
    paddingHorizontal: 16,
    paddingVertical:   12,
  },
  backBtn:       { padding: 4, marginRight: 8 },
  backIcon:      { fontSize: 30, color: '#FFFFFF', fontWeight: '300' },
  headerTitle:   { flex: 1, fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  iconSection:   { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  iconCircle: {
    width:           80,
    height:          80,
    borderRadius:    40,
    backgroundColor: '#FEF0E6',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    12,
    borderWidth:     2,
    borderColor:     '#E8C9A0',
  },
  lockIcon:     { fontSize: 36 },
  iconTitle:    { fontSize: 18, fontWeight: '700', color: '#2C1A0E', marginBottom: 6 },
  iconSubtitle: { fontSize: 13, color: '#7A5C44', textAlign: 'center', paddingHorizontal: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius:    14,
    padding:         16,
    marginBottom:    16,
    elevation:       3,
    shadowColor:     '#94A3B8',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.08,
    shadowRadius:    4,
  },
  fieldContainer: { marginBottom: 16 },
  fieldLabel: {
    fontSize:     13,
    fontWeight:   '600',
    color:        '#64748B',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection:   'row',
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     '#E2E8F0',
    borderRadius:    10,
    backgroundColor: '#F8FAFC',
  },
  input: {
    flex:              1,
    paddingHorizontal: 14,
    paddingVertical:   12,
    fontSize:          15,
    color:             '#0F172A',
  },
  eyeBtn:  { padding: 12 },
  eyeIcon: { fontSize: 18 },
  rulesCard: {
    backgroundColor: '#EFF6FF',
    borderRadius:    12,
    padding:         14,
    marginBottom:    20,
    borderWidth:     1,
    borderColor:     '#BFDBFE',
  },
  rulesTitle: { fontSize: 13, fontWeight: '700', color: '#1D4ED8', marginBottom: 8 },
  ruleItem:   { fontSize: 13, color: '#334155', marginBottom: 4 },
  submitBtn: {
    backgroundColor: '#C0392B',
    borderRadius:    12,
    paddingVertical: 15,
    alignItems:      'center',
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

export default ChangePassword;
