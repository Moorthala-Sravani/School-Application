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
import { registerUser, Role, clearError } from '../store/slices/authSlice';
import { colors } from '../theme/colors';
import { hs, vs, ms } from '../theme/scale';
import AppInput from '../components/common/AppInput';
import AppButton from '../components/common/AppButton';

const SUBJECTS = ['Math', 'Science', 'English', 'History', 'Geography', 'Art', 'PE'];

const RegisterScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error: authError } = useSelector((state: RootState) => state.auth);

  const [role, setRole] = useState<Role>(null);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  
  // Teacher specific details
  const [subject, setSubject] = useState('');
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const [assignedClasses, setAssignedClasses] = useState('');

  // Parent specific details
  const [childName, setChildName] = useState('');
  const [childClass, setChildClass] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [relationship, setRelationship] = useState('');

  // Admin specific details
  const [schoolName, setSchoolName] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [accessLevel, setAccessLevel] = useState('Admin');
  const [showAccessDropdown, setShowAccessDropdown] = useState(false);

  // Inline errors object
  const [errors, setErrors] = useState<any>({});

  // Clear auth error when mounting/unmounting
  useEffect(() => {
    dispatch(clearError());
    return () => { dispatch(clearError()); };
  }, [dispatch]);

  const validate = () => {
    let isValid = true;
    let newErrors: any = {};

    if (!fullName.trim()) { newErrors.fullName = 'Full name is required'; isValid = false; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { newErrors.email = 'Enter a valid email'; isValid = false; }
    if (!/^\d{10}$/.test(mobile)) { newErrors.mobile = 'Enter valid 10-digit mobile number'; isValid = false; }
    if (password.length < 4) { newErrors.password = 'Password must be at least 4 characters'; isValid = false; }
    
    if (role === 'Teacher') {
      if (!subject) { newErrors.subject = 'Please select a subject'; isValid = false; }
      if (!employeeId.trim()) { newErrors.employeeId = 'Employee ID is required'; isValid = false; }
      if (!department.trim()) { newErrors.department = 'Department is required'; isValid = false; }
      if (!assignedClasses.trim()) { newErrors.assignedClasses = 'Assigned Classes are required'; isValid = false; }
    }

    if (role === 'Parent') {
      if (!childName.trim()) { newErrors.childName = "Child's name is required"; isValid = false; }
      if (!childClass.trim()) { newErrors.childClass = "Class is required"; isValid = false; }
      if (!rollNumber.trim()) { newErrors.rollNumber = "Roll number is required"; isValid = false; }
      if (!relationship.trim()) { newErrors.relationship = "Relationship is required"; isValid = false; }
    }

    if (role === 'Admin') {
      if (!schoolName.trim()) { newErrors.schoolName = "School Name is required"; isValid = false; }
      if (!schoolCode.trim()) { newErrors.schoolCode = "School Code is required"; isValid = false; }
      if (!accessLevel) { newErrors.accessLevel = "Access level is required"; isValid = false; }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (loading) return;

    if (!validate()) return;

    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const localTimestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

      // Split full name into first and last name for backend compatibility
      const nameParts = fullName.trim().split(' ');
      const firstname = nameParts[0];
      const lastname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ' ';

      const payload: any = {
        firstname,
        lastname,
        email,
        mobile_number: mobile,
        password,
        role,
        created_at: localTimestamp
      };

      if (role === 'Teacher') {
        payload.subject = subject;
        payload.employee_id = employeeId;
        payload.department = department;
        payload.assigned_classes = assignedClasses;
      } else if (role === 'Parent') {
        payload.child_name = childName;
        payload.child_class = childClass;
        payload.roll_number = rollNumber;
        payload.relationship = relationship;
      } else if (role === 'Admin') {
        payload.school_name = schoolName;
        payload.school_code = schoolCode;
        payload.access_level = accessLevel;
      }

      const resultAction = await dispatch(registerUser(payload));

      if (registerUser.fulfilled.match(resultAction)) {
        Alert.alert('Success', 'Registration successful! Please login.');
        navigation.replace('Login');
      }
    } catch (err: any) {
      // Unhandled error
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
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Create Account</Text>

          {/* Role Selection Gate */}
          <Text style={styles.sectionLabel}>1. Select Your Role</Text>
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

          {/* Display form ONLY if role is selected */}
          {role !== null && (
            <View style={styles.form}>
              
              <Text style={styles.sectionLabel}>2. Your Details</Text>
              
              <Text style={styles.label}>Full Name *</Text>
              <AppInput
                leftIcon="👤"
                placeholder="Enter full name"
                value={fullName}
                onChangeText={text => { setFullName(text); setErrors({...errors, fullName: null}); }}
              />
              {!!errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

              <Text style={styles.label}>Email *</Text>
              <AppInput
                leftIcon="✉️"
                placeholder="Enter email"
                value={email}
                onChangeText={text => { setEmail(text); setErrors({...errors, email: null}); }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {!!errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

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

              {role === 'Parent' && (
                <>
                  <Text style={styles.sectionLabel}>3. Child's Details</Text>
                  
                  <Text style={styles.label}>Child's Name *</Text>
                  <AppInput
                    leftIcon="👦"
                    placeholder="Enter child's full name"
                    value={childName}
                    onChangeText={text => { setChildName(text); setErrors({...errors, childName: null}); }}
                  />
                  {!!errors.childName && <Text style={styles.errorText}>{errors.childName}</Text>}

                  <Text style={styles.label}>Class *</Text>
                  <AppInput
                    leftIcon="🏫"
                    placeholder="e.g. 6-A"
                    value={childClass}
                    onChangeText={text => { setChildClass(text); setErrors({...errors, childClass: null}); }}
                  />
                  {!!errors.childClass && <Text style={styles.errorText}>{errors.childClass}</Text>}

                  <Text style={styles.label}>Roll Number *</Text>
                  <AppInput
                    leftIcon="🔢"
                    placeholder="e.g. 1001"
                    value={rollNumber}
                    onChangeText={text => { setRollNumber(text); setErrors({...errors, rollNumber: null}); }}
                  />
                  {!!errors.rollNumber && <Text style={styles.errorText}>{errors.rollNumber}</Text>}

                  <Text style={styles.label}>Relationship *</Text>
                  <AppInput
                    leftIcon="👨‍👩‍👦"
                    placeholder="Father, Mother, or Guardian"
                    value={relationship}
                    onChangeText={text => { setRelationship(text); setErrors({...errors, relationship: null}); }}
                  />
                  {!!errors.relationship && <Text style={styles.errorText}>{errors.relationship}</Text>}
                </>
              )}

              {/* Teacher Details */}
              {role === 'Teacher' && (
                <View style={styles.subjectContainer}>
                  <Text style={[styles.sectionLabel, {marginTop: 10}]}>3. Teacher Details</Text>
                  
                  <Text style={styles.label}>Employee ID *</Text>
                  <AppInput
                    leftIcon="🪪"
                    placeholder="e.g. EMP12345"
                    value={employeeId}
                    onChangeText={text => { setEmployeeId(text); setErrors({...errors, employeeId: null}); }}
                  />
                  {!!errors.employeeId && <Text style={styles.errorText}>{errors.employeeId}</Text>}

                  <Text style={styles.label}>Department *</Text>
                  <AppInput
                    leftIcon="🏢"
                    placeholder="e.g. Science Dept"
                    value={department}
                    onChangeText={text => { setDepartment(text); setErrors({...errors, department: null}); }}
                  />
                  {!!errors.department && <Text style={styles.errorText}>{errors.department}</Text>}

                  <Text style={styles.label}>Assigned Classes *</Text>
                  <AppInput
                    leftIcon="🏫"
                    placeholder="e.g. 6A, 7B"
                    value={assignedClasses}
                    onChangeText={text => { setAssignedClasses(text); setErrors({...errors, assignedClasses: null}); }}
                  />
                  {!!errors.assignedClasses && <Text style={styles.errorText}>{errors.assignedClasses}</Text>}

                  <Text style={styles.label}>Subject *</Text>
                  
                  <TouchableOpacity 
                    style={styles.dropdownHeader}
                    onPress={() => setShowSubjectDropdown(!showSubjectDropdown)}
                  >
                    <Text style={[styles.dropdownHeaderText, !subject && {color: colors.textGray}]}>
                      {subject ? subject : "Select a subject"}
                    </Text>
                    <Text style={styles.dropdownIcon}>{showSubjectDropdown ? '▲' : '▼'}</Text>
                  </TouchableOpacity>

                  {showSubjectDropdown && (
                    <View style={styles.dropdownList}>
                      {SUBJECTS.map((sub) => (
                        <TouchableOpacity 
                          key={sub} 
                          style={[styles.dropdownItem, subject === sub && styles.dropdownItemActive]}
                          onPress={() => { 
                            setSubject(sub); 
                            setErrors({...errors, subject: null}); 
                            setShowSubjectDropdown(false);
                          }}
                        >
                          <Text style={[styles.dropdownItemText, subject === sub && styles.dropdownItemTextActive]}>{sub}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {!!errors.subject && <Text style={styles.errorText}>{errors.subject}</Text>}
                </View>
              )}

              {/* Admin Details */}
              {role === 'Admin' && (
                <>
                  <Text style={[styles.sectionLabel, {marginTop: 10}]}>3. School Details</Text>
                  
                  <Text style={styles.label}>School Name *</Text>
                  <AppInput
                    leftIcon="🏫"
                    placeholder="Enter school name"
                    value={schoolName}
                    onChangeText={text => { setSchoolName(text); setErrors({...errors, schoolName: null}); }}
                  />
                  {!!errors.schoolName && <Text style={styles.errorText}>{errors.schoolName}</Text>}

                  <Text style={styles.label}>School Code *</Text>
                  <AppInput
                    leftIcon="🔢"
                    placeholder="e.g. SCH001"
                    value={schoolCode}
                    onChangeText={text => { setSchoolCode(text); setErrors({...errors, schoolCode: null}); }}
                  />
                  {!!errors.schoolCode && <Text style={styles.errorText}>{errors.schoolCode}</Text>}

                  <Text style={styles.label}>Access Level *</Text>
                  <TouchableOpacity 
                    style={styles.dropdownHeader}
                    onPress={() => setShowAccessDropdown(!showAccessDropdown)}
                  >
                    <Text style={styles.dropdownHeaderText}>{accessLevel}</Text>
                    <Text style={styles.dropdownIcon}>{showAccessDropdown ? '▲' : '▼'}</Text>
                  </TouchableOpacity>

                  {showAccessDropdown && (
                    <View style={styles.dropdownList}>
                      {['Admin', 'Super Admin'].map((lvl) => (
                        <TouchableOpacity 
                          key={lvl} 
                          style={[styles.dropdownItem, accessLevel === lvl && styles.dropdownItemActive]}
                          onPress={() => { 
                            setAccessLevel(lvl); 
                            setErrors({...errors, accessLevel: null}); 
                            setShowAccessDropdown(false);
                          }}
                        >
                          <Text style={[styles.dropdownItemText, accessLevel === lvl && styles.dropdownItemTextActive]}>{lvl}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {!!errors.accessLevel && <Text style={styles.errorText}>{errors.accessLevel}</Text>}
                </>
              )}

              <Text style={[styles.sectionLabel, {marginTop: role !== 'Admin' ? 20 : 0}]}>{role === 'Admin' ? '3.' : '4.'} Security</Text>

              <Text style={styles.label}>Password *</Text>
              <AppInput
                leftIcon="🔒"
                placeholder="Enter password"
                value={password}
                onChangeText={text => { setPassword(text); setErrors({...errors, password: null}); }}
                secureTextEntry
                showEye
              />
              {!!errors.password && <Text style={styles.errorText}>{errors.password}</Text>}


              <View style={styles.btnContainer}>
                <AppButton
                  title="Register"
                  onPress={handleRegister}
                  size="full"
                  loading={loading}
                  disabled={loading}
                />
              </View>
            </View>
          )}

          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Login</Text>
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
    paddingTop: vs(20),
    paddingBottom: vs(40),
  },
  title: {
    fontSize: ms(24),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: vs(16),
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: ms(16),
    fontWeight: '700',
    color: '#2C1A0E',
    marginBottom: vs(12),
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
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: vs(32),
  },
  loginText: {
    color: colors.textSecond,
    fontSize: ms(14),
  },
  loginLink: {
    color: '#C0392B',
    fontWeight: '700',
    fontSize: ms(14),
  },
  timestampContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: hs(12),
    borderRadius: hs(8),
    borderWidth: 1,
    borderColor: '#E8DDD0',
    marginBottom: vs(16)
  },
  timestampLabel: {
    fontSize: ms(13),
    fontWeight: '600',
    color: colors.textSecond,
  },
  timestampValue: {
    fontSize: ms(13),
    fontWeight: '700',
    color: '#C0392B'
  },
  subjectContainer: {
    marginBottom: vs(12)
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E8DDD0',
    borderRadius: hs(10),
    paddingHorizontal: hs(12),
    minHeight: vs(52),
    marginBottom: vs(4),
  },
  dropdownHeaderText: {
    fontSize: ms(14),
    color: '#2C1A0E',
  },
  dropdownIcon: {
    fontSize: ms(12),
    color: '#A0A0AB',
  },
  dropdownList: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E8DDD0',
    borderRadius: hs(10),
    marginBottom: vs(4),
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: vs(12),
    paddingHorizontal: hs(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemActive: {
    backgroundColor: '#FDF2E9',
  },
  dropdownItemText: {
    fontSize: ms(14),
    color: '#2C1A0E',
  },
  dropdownItemTextActive: {
    color: '#C0392B',
    fontWeight: '700',
  }
});

export default RegisterScreen;
