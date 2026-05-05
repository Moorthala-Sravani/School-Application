import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/slices/authSlice';

const PARENT_ITEMS = [
  { icon: '🏠', label: 'Dashboard', screen: 'Tabs' },
  { icon: '📅', label: 'Attendance', screen: 'Attendance' },
  { icon: '🎓', label: 'Academics', screen: 'Academics' },
  { icon: '📚', label: 'Books', screen: 'Books' },
  { icon: '💰', label: 'Fee', screen: 'PayFees' },
  { icon: '🚌', label: 'Bus Tracking', screen: 'BusLocation' },
  { icon: '👕', label: 'Uniform', screen: 'Uniform' },
  { icon: '💬', label: 'Messages', screen: 'Messages' },
  { icon: '🔔', label: 'Notifications', screen: 'Notifications' },
  { icon: '👤', label: 'Profile', screen: 'UserProfile' },
];

const TEACHER_ITEMS = [
  { icon: '🏠', label: 'Dashboard', screen: 'Tabs' },
  { icon: '✅', label: 'Attendance', screen: 'TeacherAttendance' },
  { icon: '📚', label: 'Books', screen: 'TeacherBooks' },
  { icon: '🎓', label: 'Academics', screen: 'Academics' },
  { icon: '📅', label: 'Timetable', screen: 'TeacherTimetable' },
  { icon: '💬', label: 'Messages', screen: 'Messages' },
  { icon: '🔔', label: 'Notifications', screen: 'Notifications' },
  { icon: '👤', label: 'Profile', screen: 'UserProfile' },
];

const ADMIN_ITEMS = [
  { icon: '🏠', label: 'Dashboard', screen: 'Tabs' },
  { icon: '💰', label: 'Billing', screen: 'AdminBilling' },
  { icon: '👕', label: 'Uniform', screen: 'AdminUniform' },
  { icon: '📚', label: 'Books', screen: 'AdminBooks' },
  { icon: '👥', label: 'User Mgmt', screen: 'AdminUsers' },
  { icon: '🏫', label: 'Class Mgmt', screen: 'AdminClasses' },
  { icon: '🚌', label: 'Bus Mgmt', screen: 'AdminBus' },
  { icon: '📊', label: 'Reports', screen: 'AdminReports' },
  { icon: '⚙️', label: 'Settings', screen: 'Settings' },
  { icon: '🔔', label: 'Notifications', screen: 'Notifications' },
];

const DrawerNavigator = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const { firstName, lastName, role } = useSelector((state: RootState) => state.auth);
  
  const parentProfile = useSelector((state: RootState) => state.profile);
  const teacherProfile = useSelector((state: RootState) => state.teacherProfile);
  const adminProfile = useSelector((state: RootState) => state.adminProfile);

  const profile: any = role === 'Teacher' ? teacherProfile : role === 'Admin' ? adminProfile : parentProfile;

  const DRAWER_ITEMS = role === 'Teacher' ? TEACHER_ITEMS : role === 'Admin' ? ADMIN_ITEMS : PARENT_ITEMS;

  const initials = profile?.child_name
    ? (profile.child_name[0] || '').toUpperCase()
    : ((firstName?.[0] ?? '') + (lastName?.[0] ?? '')).toUpperCase();
    
  const fullName = `${firstName} ${lastName}`.trim();
  const accountLabel = role === 'Teacher' ? 'Teacher Account' : role === 'Parent' ? 'Parent Account' : 'Admin Account';

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            dispatch(logout());
          },
        },
      ]
    );
  };

  const handleNavigate = (screen: string) => {
    navigation.closeDrawer();

    if (role === 'Admin' && screen === 'AdminBilling') {
      navigation.navigate('Tabs', { screen: 'AdminBilling' });
      return;
    }
    if (role === 'Admin' && screen === 'AdminUniform') {
      navigation.navigate('Tabs', { screen: 'AdminUniform' });
      return;
    }
    
    const unbuiltScreens = [
      'Academics', 'Uniform', 'Notifications',
      'AdminUsers', 'AdminClasses', 'AdminBus', 'AdminReports',
      'Settings', 'Help'
    ];

    if (unbuiltScreens.includes(screen)) {
      Alert.alert('Coming Soon', 'This feature is currently a work in progress and will be available soon!');
      return;
    }

    navigation.navigate(screen);
  };

  return (
    <View style={styles.container}>
      <DrawerContentScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={[styles.header, role === 'Admin' && { backgroundColor: '#FADBD8' }, role === 'Teacher' && { backgroundColor: '#EBF5FB' }]}>
          <View style={[styles.logoBox, role === 'Admin' && { backgroundColor: '#E74C3C' }, role === 'Teacher' && { backgroundColor: '#2980B9' }]}>
            {profile?.profile_pic ? (
              <Image source={{ uri: profile.profile_pic }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.logoText}>{initials || 'PL'}</Text>
            )}
          </View>
          <View>
            <Text style={[styles.appName, role === 'Admin' && { color: '#C0392B' }, role === 'Teacher' && { color: '#2471A3' }]}>{fullName || 'User'}</Text>
            <Text style={styles.appSubName}>{accountLabel}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Menu Items ── */}
        {DRAWER_ITEMS.map(item => (
          <TouchableOpacity
            key={item.screen}
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => handleNavigate(item.screen)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.divider} />

        {/* ── Logout ── */}
        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={handleLogout}
        >
          <Text style={styles.menuIcon}>🚪</Text>
          <Text style={[styles.menuLabel, styles.logoutText]}>Logout</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

      </DrawerContentScrollView>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>ParentLink v1.0.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 28,
    backgroundColor: '#FEF0E6',
  },
  logoBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#C0392B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  logoText: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  appName: { fontSize: 16, fontWeight: '700', color: '#C0392B' },
  appSubName: { fontSize: 12, color: '#7A5C44', marginTop: 2 },
  divider: {
    height: 1,
    backgroundColor: '#EDE8DF',
    marginVertical: 8,
    marginHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  menuIcon: { fontSize: 22, marginRight: 16, width: 30 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#2C1A0E' },
  menuArrow: { fontSize: 20, color: '#C0392B' },
  logoutText: { color: '#E74C3C' },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EDE8DF',
    alignItems: 'center',
  },
  footerText: { fontSize: 12, color: '#B08060' },
});

export default DrawerNavigator;