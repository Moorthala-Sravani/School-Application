import { colors } from '../../theme/colors';
import React, { useState, useEffect } from 'react';
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
  Dimensions,
  StatusBar
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchParentProfile, updateParentProfile } from '../../store/slices/profileSlice';
import { fetchTeacherProfile, updateTeacherProfile } from '../../store/slices/teacherProfileSlice';
import { fetchAdminProfile, updateAdminProfile } from '../../store/slices/adminProfileSlice';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

const { width } = Dimensions.get('window');
const OCCUPATIONS = ['Father', 'Mother', 'Grandfather', 'Grandmother', 'Guardian'];

const CLASSES: string[] = ['Pre-KG', 'LKG', 'UKG'];
for (let i = 1; i <= 12; i++) {
  ['A', 'B', 'C', 'D', 'E', 'F'].forEach(sec => CLASSES.push(`${i}-${sec}`));
}

const CLASS_TEACHER_OPTIONS = ['Not a class teacher', ...CLASSES];

const Field = ({
  label,
  value,
  isEditing,
  onChange,
  editable = true,
  icon,
  isDropdown = false,
  isMultiDropdown = false,
  options = [],
  maxSelections
}: any) => {
  const [open, setOpen] = useState(false);

  // Helper for multi-select
  const displayValue = isMultiDropdown 
    ? (Array.isArray(value) && value.length > 0 ? value.join(', ') : 'Select Options')
    : (value || 'Select Option');

  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        {icon && <Text style={styles.fieldIcon}>{icon}</Text>}
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      {isEditing && editable ? (
        (isDropdown || isMultiDropdown) ? (
          <View>
            <TouchableOpacity 
              style={[styles.fieldInput, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
              onPress={() => setOpen(!open)}
              activeOpacity={0.7}
            >
              <Text style={{ color: (isMultiDropdown ? (Array.isArray(value) && value.length > 0) : value) ? '#2C3E50' : '#A0A0AB', fontSize: 16, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                {displayValue}
              </Text>
              <Text style={{ color: '#C0392B', fontSize: 16, marginLeft: 8 }}>{open ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {open && (
              <View style={styles.dropdownList}>
                <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                  {options.map((opt: string) => {
                    const isSelected = isMultiDropdown ? (Array.isArray(value) && value.includes(opt)) : value === opt;
                    return (
                      <TouchableOpacity 
                        key={opt} 
                        style={styles.dropdownItem}
                        onPress={() => {
                          if (isMultiDropdown) {
                            const currentArr = Array.isArray(value) ? [...value] : [];
                            if (currentArr.includes(opt)) {
                              onChange(currentArr.filter((v: string) => v !== opt));
                            } else {
                              if (maxSelections && currentArr.length >= maxSelections) {
                                Alert.alert('Limit Reached', `You can only select up to ${maxSelections} options.`);
                              } else {
                                onChange([...currentArr, opt]);
                              }
                            }
                          } else {
                            onChange(opt);
                            setOpen(false);
                          }
                        }}
                      >
                        <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>
                          {opt} {isMultiDropdown && isSelected ? '✓' : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
        ) : (
          <TextInput
            style={styles.fieldInput}
            value={value}
            onChangeText={onChange}
            placeholderTextColor="#A0A0AB"
            blurOnSubmit={false}
            autoCorrect={false}
          />
        )
      ) : (
        <View style={[styles.fieldValueContainer, !editable && isEditing && styles.fieldValueContainerDisabled]}>
          <Text style={[styles.fieldValue, (!editable && isEditing) && styles.fieldDisabled]}>
            {isMultiDropdown ? (Array.isArray(value) && value.length > 0 ? value.join(', ') : 'Not provided') : (value || 'Not provided')}
          </Text>
        </View>
      )}
    </View>
  );
};

const UserProfile = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const { firstName, lastName, role } = useSelector((state: RootState) => state.auth);
  
  const parentProfile = useSelector((state: RootState) => state.profile);
  const teacherProfile = useSelector((state: RootState) => state.teacherProfile);
  const adminProfile = useSelector((state: RootState) => state.adminProfile);
  
  const profileState: any = role === 'Teacher' ? teacherProfile : role === 'Admin' ? adminProfile : parentProfile;
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (role === 'Teacher') dispatch(fetchTeacherProfile());
    else if (role === 'Admin') dispatch(fetchAdminProfile());
    else dispatch(fetchParentProfile());
  }, [dispatch, role]);

  useEffect(() => {
    setFormData({ ...profileState });
  }, [profileState]);

  const avatarInitials = ((firstName?.[0] ?? '') + (lastName?.[0] ?? '')).toUpperCase();

  const handlePickImage = () => {
    Alert.alert('Upload Photo', 'Choose an option', [
      { text: 'Camera', onPress: () => {
        launchCamera({ mediaType: 'photo', includeBase64: true }, (res) => {
          if (res.assets && res.assets[0].base64) {
            setFormData({ ...formData, profile_pic: `data:${res.assets[0].type};base64,${res.assets[0].base64}` });
          }
        });
      }},
      { text: 'Gallery', onPress: () => {
        launchImageLibrary({ mediaType: 'photo', includeBase64: true }, (res) => {
          if (res.assets && res.assets[0].base64) {
            setFormData({ ...formData, profile_pic: `data:${res.assets[0].type};base64,${res.assets[0].base64}` });
          }
        });
      }},
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const handleUpdate = async () => {
    try {
      if (role === 'Teacher') await dispatch(updateTeacherProfile(formData)).unwrap();
      else if (role === 'Admin') await dispatch(updateAdminProfile(formData)).unwrap();
      else await dispatch(updateParentProfile(formData)).unwrap();
      Alert.alert('Success', 'Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      // Failed to update profile
    }
  };

  const handleCancel = () => {
    setFormData({ ...profileState });
    setIsEditing(false);
  };

  if (profileState.loading && !isEditing) {
    return (
      <View style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#C0392B" />
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#C0392B" />
      
      {/* Decorative Top Background */}
      <View style={[styles.headerBackground, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            onPress={() => isEditing ? handleCancel() : setIsEditing(true)}
            style={styles.editBtn}
          >
            <Text style={styles.editBtnText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar overlapped on header */}
          <View style={styles.avatarSection}>
            <TouchableOpacity 
              style={styles.avatarContainer} 
              onPress={isEditing ? handlePickImage : undefined}
              activeOpacity={isEditing ? 0.7 : 1}
            >
              {formData.profile_pic ? (
                <Image source={{ uri: formData.profile_pic }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>{avatarInitials}</Text>
                </View>
              )}
              {isEditing && (
                <View style={styles.cameraBadge}>
                  <Text style={styles.cameraIcon}>📷</Text>
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.avatarName}>
              {firstName} {lastName}
            </Text>
            <Text style={styles.avatarRole}>
              {role}
            </Text>
          </View>


          {role === 'Parent' && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardHeaderIcon}>👶</Text>
                <Text style={styles.cardTitle}>Student Details</Text>
              </View>
              <View style={styles.cardBody}>
                <Field label="Full Name" value={formData.child_name} isEditing={isEditing} onChange={(text: string) => setFormData({...formData, child_name: text})} icon="👤" />
                <Field label="Class & Section" value={formData.child_class} isEditing={isEditing} onChange={(text: string) => setFormData({...formData, child_class: text})} icon="🎓" isDropdown={true} options={CLASSES} />
              </View>
            </View>
          )}

          {role === 'Teacher' && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardHeaderIcon}>👨‍🏫</Text>
                <Text style={styles.cardTitle}>Teacher Details</Text>
              </View>
              <View style={styles.cardBody}>
                <Field label="Subject" value={formData.subject} isEditing={isEditing} onChange={(text: string) => setFormData({...formData, subject: text})} icon="📚" />
                <Field label="Assigned Classes" value={formData.assigned_classes} isEditing={isEditing} onChange={(arr: string[]) => setFormData({...formData, assigned_classes: arr})} icon="🏫" isMultiDropdown={true} options={CLASSES} maxSelections={2} />
                <Field label="Class Teacher" value={formData.class_teacher || 'Not a class teacher'} isEditing={isEditing} onChange={(text: string) => setFormData({...formData, class_teacher: text})} icon="⭐" isDropdown={true} options={CLASS_TEACHER_OPTIONS} />
              </View>
            </View>
          )}

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderIcon}>{role === 'Admin' ? '🛡️' : '👨‍👩‍👧'}</Text>
              <Text style={styles.cardTitle}>{role} Details</Text>
            </View>
            <View style={styles.cardBody}>
              <Field label="First Name" value={formData.firstname} isEditing={isEditing} onChange={(text: string) => setFormData({...formData, firstname: text})} icon="👤" />
              <Field label="Last Name" value={formData.lastname} isEditing={isEditing} onChange={(text: string) => setFormData({...formData, lastname: text})} icon="👤" />
              <Field label="Email Address" value={formData.email} isEditing={false} onChange={() => {}} editable={false} icon="✉️" />
              <Field label="Mobile Number" value={formData.mobile_number} isEditing={false} onChange={() => {}} editable={false} icon="📞" />
              
              {role === 'Parent' && (
                <>
                  <Field label="Relation / Occupation" value={formData.occupation} isEditing={isEditing} onChange={(text: string) => setFormData({...formData, occupation: text})} icon="💼" isDropdown={true} options={OCCUPATIONS} />
                  <Field label="Home Address" value={formData.address} isEditing={isEditing} onChange={(text: string) => setFormData({...formData, address: text})} icon="📍" />
                </>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {isEditing ? (
              <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={handleUpdate}>
                {profileState.loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>✓ Save Changes</Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionBtn, styles.passwordBtn]}
                onPress={() => navigation.navigate('ChangePassword')}
              >
                <Text style={styles.passwordBtnText}>🔑 Change Password</Text>
              </TouchableOpacity>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: '#F8F9FA' 
  },
  headerBackground: {
    backgroundColor: '#C0392B',
    paddingBottom: 4,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: { 
    width: 40, 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'flex-start' 
  },
  backIcon: { 
    fontSize: 34, 
    color: '#FFF', 
    lineHeight: 34,
    fontWeight: '300',
    marginTop: -4 
  },
  headerTitle: { 
    flex: 1, 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#FFF', 
    textAlign: 'center' 
  },
  editBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editBtnText: { 
    color: '#FFF', 
    fontWeight: '600', 
    fontSize: 14 
  },
  scrollContent: { 
    paddingHorizontal: 20, 
    paddingBottom: 40,
    marginTop: 16, 
  },
  avatarSection: { 
    alignItems: 'center', 
    marginBottom: 20,
  },
  avatarContainer: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#FFF',
    padding: 3,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    marginBottom: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: '#E74C3C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { 
    fontSize: 36, 
    fontWeight: '800', 
    color: '#FFF' 
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 4,
    backgroundColor: '#FFF',
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  cameraIcon: {
    fontSize: 18,
  },
  avatarName: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: '#2C3E50',
    marginBottom: 4,
  },
  avatarRole: {
    fontSize: 15,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  cardHeaderIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#C0392B',
  },
  cardBody: {
    padding: 20,
    paddingBottom: 6,
  },
  fieldContainer: { 
    marginBottom: 16 
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldIcon: {
    fontSize: 14,
    marginRight: 6,
    color: '#7F8C8D',
  },
  fieldLabel: { 
    fontSize: 13, 
    color: '#7F8C8D', 
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValueContainer: {
    backgroundColor: '#F7F8FA',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fieldValueContainerDisabled: {
    backgroundColor: '#F0F2F5',
  },
  fieldValue: { 
    fontSize: 16, 
    color: '#2C3E50', 
    fontWeight: '600' 
  },
  fieldDisabled: { 
    color: '#7F8C8D' 
  },
  fieldInput: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '600',
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#C0392B',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownList: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 14,
    marginTop: 6,
    overflow: 'hidden',
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#2C3E50',
    fontWeight: '500',
  },
  dropdownItemTextActive: {
    color: '#C0392B',
    fontWeight: '700',
  },
  actionsContainer: {
    marginTop: 10,
  },
  actionBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  saveBtn: {
    backgroundColor: '#C0392B',
    elevation: 4,
    shadowColor: '#C0392B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveBtnText: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: '700' 
  },
  passwordBtn: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
  },
  passwordBtnText: { 
    color: '#2C3E50', 
    fontSize: 16, 
    fontWeight: '700' 
  },
});

export default UserProfile;
