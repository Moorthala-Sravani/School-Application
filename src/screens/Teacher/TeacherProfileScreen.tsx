import { colors } from '../../theme/colors';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { fetchTeacherProfile, updateTeacherProfile } from '../../store/slices/teacherProfileSlice';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';


const SUBJECTS = [
  'Telugu', 'Hindi', 'English', 'Maths',
  'Science - Physics', 'Science - Biology', 'Science - Chemistry',
  'Social', 'Kannada'
];

const CLASSES = ['1-A', '1-B', '2-A', '2-B', '3-A', '3-B', '4-A', '5-A', '6-A', '7-A', '8-A', '9-A', '10-A'];

const Field = ({
  label,
  fieldKey,
  value,
  isEditing,
  onChange,
  editable = true,
  isDropdown = false,
  options = [],
}: any) => {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isEditing && editable ? (
        isDropdown ? (
          <View>
            <TouchableOpacity 
              style={[styles.fieldInput, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
              onPress={() => setOpen(!open)}
              activeOpacity={0.7}
            >
              <Text style={{ color: value ? '#2C1A0E' : '#B08060', fontSize: 15 }}>
                {value || 'Select Option'}
              </Text>
              <Text style={{ color: '#C0392B', fontSize: 14 }}>{open ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {open && (
              <View style={styles.dropdownList}>
                <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                  {options.map((opt: string) => (
                    <TouchableOpacity 
                      key={opt} 
                      style={styles.dropdownItem}
                      onPress={() => {
                        onChange(fieldKey, opt);
                        setOpen(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, value === opt && styles.dropdownItemTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        ) : (
          <TextInput
            style={styles.fieldInput}
            value={value}
            onChangeText={text => onChange(fieldKey, text)}
            placeholderTextColor="#B08060"
            blurOnSubmit={false}
            autoCorrect={false}
          />
        )
      ) : (
        <Text style={[styles.fieldValue, !editable && isEditing && styles.readOnlyText]}>{value}</Text>
      )}
    </View>
  );
};

const MultiSelectField = ({
  label,
  value = [],
  isEditing,
  onChange,
  options = [],
}: any) => {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isEditing ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
          {options.map((opt: string) => {
            const isSelected = value.includes(opt);
            return (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.checkboxItem,
                  isSelected && styles.checkboxItemActive
                ]}
                onPress={() => {
                  let newValue = [...value];
                  if (isSelected) {
                    newValue = newValue.filter(v => v !== opt);
                  } else {
                    newValue.push(opt);
                  }
                  onChange('assigned_classes', newValue);
                }}
              >
                <Text style={[styles.checkboxText, isSelected && styles.checkboxTextActive]}>
                  {isSelected ? '☑ ' : '☐ '}{opt}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      ) : (
        <Text style={styles.fieldValue}>
          {value.length > 0 ? value.join(', ') : 'No classes assigned'}
        </Text>
      )}
    </View>
  );
};

const TeacherProfileScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { firstName, lastName } = useSelector((state: RootState) => state.auth);
  const profileState = useSelector((state: RootState) => state.teacherProfile);
  
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({ 
    firstname: '',
    lastname: '',
    email: '',
    mobile_number: '',
    subject: '',
    assigned_classes: [] as string[],
    profile_pic: null as string | null
  });

  React.useEffect(() => {
    dispatch(fetchTeacherProfile());
  }, [dispatch]);

  React.useEffect(() => {
    setProfile({
      firstname: profileState.firstname || firstName || '',
      lastname: profileState.lastname || lastName || '',
      email: profileState.email || '',
      mobile_number: profileState.mobile_number || '',
      subject: profileState.subject || '',
      assigned_classes: profileState.assigned_classes || [],
      profile_pic: profileState.profile_pic || null
    });
  }, [profileState, firstName, lastName]);

  const initials = ((profile.firstname?.[0] ?? '') + (profile.lastname?.[0] ?? '')).toUpperCase();

  const handleChange = (key: string, text: string) => {
    setProfile(prev => ({ ...prev, [key]: text }));
  };

  const handlePickImage = () => {
    Alert.alert('Upload Photo', 'Choose an option', [
      { text: 'Camera', onPress: () => {
        launchCamera({ mediaType: 'photo', includeBase64: true }, (res) => {
          const asset = res?.assets?.[0];
          if (asset?.base64) {
            setProfile(prev => ({ ...prev, profile_pic: `data:${asset.type};base64,${asset.base64}` }));
          }
        });
      }},
      { text: 'Gallery', onPress: () => {
        launchImageLibrary({ mediaType: 'photo', includeBase64: true }, (res) => {
          const asset = res?.assets?.[0];
          if (asset?.base64) {
            setProfile(prev => ({ ...prev, profile_pic: `data:${asset.type};base64,${asset.base64}` }));
          }
        });
      }},
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const handleUpdate = async () => {
    try {
      await dispatch(updateTeacherProfile(profile)).unwrap();
      Alert.alert('Success', 'Teacher profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      // Failed to update profile
    }
  };

  const handleCancel = () => {
    setProfile({
      firstname: profileState.firstname || firstName || '',
      lastname: profileState.lastname || lastName || '',
      email: profileState.email || '',
      mobile_number: profileState.mobile_number || '',
      subject: profileState.subject || '',
      assigned_classes: profileState.assigned_classes || [],
      profile_pic: profileState.profile_pic || null
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => {
          dispatch(logout());
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }}
    ]);
  };

  if (profileState.loading && !isEditing) {
    return (
      <View style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#C0392B" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Teacher Profile</Text>
        <TouchableOpacity
          onPress={() => isEditing ? handleCancel() : setIsEditing(true)}
          style={styles.editBtn}
        >
          <Text style={styles.editBtnText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity 
              style={styles.avatar}
              onPress={isEditing ? handlePickImage : undefined}
              activeOpacity={isEditing ? 0.7 : 1}
            >
              {profile.profile_pic ? (
                <Image source={{ uri: profile.profile_pic }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
              {isEditing && (
                <View style={styles.cameraBadge}>
                  <Text style={styles.cameraIcon}>📷</Text>
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.avatarName}>
              {profile.firstname} {profile.lastname}
            </Text>
            <Text style={styles.avatarRole}>Teacher • {profile.subject || 'Not Set'}</Text>
          </View>

          {/* Details Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Personal Details</Text>
            <Field label="First Name" fieldKey="firstname" value={profile.firstname} isEditing={isEditing} onChange={handleChange} />
            <Field label="Last Name"  fieldKey="lastname"  value={profile.lastname}  isEditing={isEditing} onChange={handleChange} />
            <Field label="Email"      fieldKey="email"     value={profile.email}     isEditing={isEditing} onChange={handleChange} />
            <Field label="Phone"      fieldKey="mobile_number" value={profile.mobile_number} isEditing={isEditing} onChange={handleChange} />
          </View>

          {/* Employment Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Employment Info</Text>
            <Field label="Subject" fieldKey="subject" value={profile.subject} isEditing={isEditing} onChange={handleChange} isDropdown={true} options={SUBJECTS} />
            <MultiSelectField label="Assigned Classes" value={profile.assigned_classes} isEditing={isEditing} onChange={handleChange} options={CLASSES} />
          </View>

          {/* Update Button */}
          {isEditing && (
            <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate}>
              <Text style={styles.updateBtnText}>Save Changes</Text>
            </TouchableOpacity>
          )}

          {/* Settings & Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('TeacherTimetable')}>
              <Text style={styles.actionIcon}>📅</Text>
              <Text style={styles.actionText}>View Timetable</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Messages', { screen: 'Messages', params: { contactRole: 'Management' } })}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionText}>Contact Admin</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('TeacherAttendance')}>
              <Text style={styles.actionIcon}>📝</Text>
              <Text style={styles.actionText}>Mark Class Attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('TeacherMarksUpload')}>
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionText}>Upload Exam Marks</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('TeacherSalary')}>
              <Text style={styles.actionIcon}>💰</Text>
              <Text style={styles.actionText}>Salary Slip</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('ChangePassword')}>
              <Text style={styles.actionIcon}>🔑</Text>
              <Text style={styles.actionText}>Change Password</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionIcon}>⚙️</Text>
              <Text style={styles.actionText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, styles.logoutBtn]} onPress={handleLogout}>
              <Text style={styles.actionIcon}>🚪</Text>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C0392B',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.white },
  editBtn: {
    backgroundColor: '#96281B',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editBtnText: { color: colors.white, fontWeight: '600', fontSize: 14 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 20 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#C0392B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: colors.white },
  avatarImage: { width: '100%', height: '100%', borderRadius: 40 },
  cameraBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  cameraIcon: { fontSize: 16 },
  avatarName: { fontSize: 20, fontWeight: '700', color: '#2C1A0E' },
  avatarRole: { fontSize: 14, color: '#7A5C44', marginTop: 4 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#C0392B',
    marginBottom: 12,
  },
  fieldContainer: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, color: '#7A5C44', marginBottom: 4, fontWeight: '500' },
  fieldValue: { fontSize: 15, color: '#2C1A0E', fontWeight: '600' },
  readOnlyText: { color: '#888' },
  fieldInput: {
    fontSize: 15,
    color: '#2C1A0E',
    borderWidth: 1,
    borderColor: '#E8DDD0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEF9F6',
  },
  dropdownList: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E8DDD0',
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
    zIndex: 10,
    elevation: 2,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#2C1A0E',
  },
  dropdownItemTextActive: {
    color: '#C0392B',
    fontWeight: '700',
  },
  updateBtn: {
    backgroundColor: '#C0392B',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  updateBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  actionsContainer: {
    marginTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  actionIcon: { fontSize: 20, marginRight: 12, width: 24, textAlign: 'center' },
  actionText: { fontSize: 16, fontWeight: '600', color: '#2C1A0E' },
  logoutBtn: { backgroundColor: '#FEF0E6', borderWidth: 1, borderColor: '#E8C9A0' },
  logoutText: { fontSize: 16, fontWeight: '700', color: '#E74C3C' },
  checkboxItem: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#E8DDD0', marginRight: 8, marginBottom: 8, backgroundColor: '#FEF9F6' },
  checkboxItemActive: { backgroundColor: '#C0392B', borderColor: '#C0392B' },
  checkboxText: { fontSize: 14, color: '#7A5C44' },
  checkboxTextActive: { color: '#FFF', fontWeight: '700' },
});

export default TeacherProfileScreen;
