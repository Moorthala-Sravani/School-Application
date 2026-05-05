import os

filepath = r'c:\Users\Sravani\Desktop\App\MyApplication\src\screens\MainScreenDashboard\UserProfileScreen.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    "import { fetchParentProfile, updateParentProfile } from '../../store/slices/profileSlice';",
    "import { fetchParentProfile, updateParentProfile } from '../../store/slices/profileSlice';\nimport { fetchTeacherProfile, updateTeacherProfile } from '../../store/slices/teacherProfileSlice';\nimport { fetchAdminProfile, updateAdminProfile } from '../../store/slices/adminProfileSlice';"
)

# 2. Main component logic
old_logic = '''const UserProfile = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const { firstName, lastName } = useSelector((state: RootState) => state.auth);
  const profileState = useSelector((state: RootState) => state.profile);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    occupation: '',
    child_name: '',
    child_class: '',
    address: '',
    profile_pic: '' as string | null
  });

  useEffect(() => {
    dispatch(fetchParentProfile());
  }, [dispatch]);

  useEffect(() => {
    setFormData({
      occupation: profileState.occupation || '',
      child_name: profileState.child_name || '',
      child_class: profileState.child_class || '',
      address: profileState.address || '',
      profile_pic: profileState.profile_pic || null
    });
  }, [profileState.occupation, profileState.child_name, profileState.child_class, profileState.address, profileState.profile_pic]);

  const avatarInitials = profileState.child_name 
    ? (profileState.child_name[0] || '').toUpperCase()
    : ((firstName?.[0] ?? '') + (lastName?.[0] ?? '')).toUpperCase();'''

new_logic = '''const UserProfile = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const { firstName, lastName, role } = useSelector((state: RootState) => state.auth);
  
  const parentProfile = useSelector((state: RootState) => state.profile);
  const teacherProfile = useSelector((state: RootState) => state.teacherProfile);
  const adminProfile = useSelector((state: RootState) => state.adminProfile);
  
  const profileState = role === 'Teacher' ? teacherProfile : role === 'Admin' ? adminProfile : parentProfile;
  
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

  const avatarInitials = ((firstName?.[0] ?? '') + (lastName?.[0] ?? '')).toUpperCase();'''

content = content.replace(old_logic, new_logic)

# 3. Handle Update & Cancel
old_update = '''  const handleUpdate = async () => {
    try {
      await dispatch(updateParentProfile(formData)).unwrap();
      Alert.alert('Success', 'Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  const handleCancel = () => {
    setFormData({
      occupation: profileState.occupation || '',
      child_name: profileState.child_name || '',
      child_class: profileState.child_class || '',
      address: profileState.address || '',
      profile_pic: profileState.profile_pic || null
    });
    setIsEditing(false);
  };'''

new_update = '''  const handleUpdate = async () => {
    try {
      if (role === 'Teacher') await dispatch(updateTeacherProfile(formData)).unwrap();
      else if (role === 'Admin') await dispatch(updateAdminProfile(formData)).unwrap();
      else await dispatch(updateParentProfile(formData)).unwrap();
      Alert.alert('Success', 'Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  const handleCancel = () => {
    setFormData({ ...profileState });
    setIsEditing(false);
  };'''

content = content.replace(old_update, new_update)

# 4. Handle Rendering cards
old_cards = '''          {/* Child Info Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderIcon}>👶</Text>
              <Text style={styles.cardTitle}>Student Details</Text>
            </View>
            <View style={styles.cardBody}>
              <Field 
                label="Full Name" 
                value={formData.child_name} 
                isEditing={isEditing} 
                onChange={(text: string) => setFormData({...formData, child_name: text})} 
                icon="👤"
              />
              <Field 
                label="Class & Section" 
                value={formData.child_class} 
                isEditing={isEditing} 
                onChange={(text: string) => setFormData({...formData, child_class: text})} 
                icon="🎓"
                isDropdown={true}
                options={CLASSES}
              />
            </View>
          </View>

          {/* Personal Info Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderIcon}>👨‍👩‍👧</Text>
              <Text style={styles.cardTitle}>Parent Details</Text>
            </View>
            <View style={styles.cardBody}>
              <Field 
                label="Email Address" 
                value={profileState.email} 
                isEditing={isEditing} 
                onChange={() => {}} 
                editable={false} 
                icon="✉️"
              />
              <Field 
                label="Mobile Number" 
                value={profileState.mobile_number} 
                isEditing={isEditing} 
                onChange={() => {}} 
                editable={false} 
                icon="📞"
              />
              
              <Field 
                label="Relation / Occupation" 
                value={formData.occupation} 
                isEditing={isEditing} 
                onChange={(text: string) => setFormData({...formData, occupation: text})} 
                icon="💼"
                isDropdown={true}
                options={OCCUPATIONS}
              />

              <Field 
                label="Home Address" 
                value={formData.address} 
                isEditing={isEditing} 
                onChange={(text: string) => setFormData({...formData, address: text})} 
                icon="📍"
              />
            </View>
          </View>'''

new_cards = '''
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
                <Field label="Assigned Classes" value={formData.assigned_classes?.join(', ')} isEditing={false} onChange={() => {}} icon="🏫" />
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
              <Field label="Email Address" value={profileState.email} isEditing={false} onChange={() => {}} editable={false} icon="✉️" />
              <Field label="Mobile Number" value={profileState.mobile_number} isEditing={false} onChange={() => {}} editable={false} icon="📞" />
              
              {role === 'Parent' && (
                <>
                  <Field label="Relation / Occupation" value={formData.occupation} isEditing={isEditing} onChange={(text: string) => setFormData({...formData, occupation: text})} icon="💼" isDropdown={true} options={OCCUPATIONS} />
                  <Field label="Home Address" value={formData.address} isEditing={isEditing} onChange={(text: string) => setFormData({...formData, address: text})} icon="📍" />
                </>
              )}
            </View>
          </View>'''

content = content.replace(old_cards, new_cards)

old_avatar_role = '''<Text style={styles.avatarRole}>
              {profileState.occupation || 'Parent'}
            </Text>'''

new_avatar_role = '''<Text style={styles.avatarRole}>
              {role}
            </Text>'''

content = content.replace(old_avatar_role, new_avatar_role)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
