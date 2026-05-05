import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { hs, ms, vs } from '../../theme/scale';
import { colors } from '../../theme/colors';

const AdminProfileScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const { firstName, lastName } = useSelector((state: RootState) => state.auth);
  const adminProfile = useSelector((state: RootState) => state.adminProfile as any);

  const name = `${firstName || ''} ${lastName || ''}`.trim() || 'Admin User';
  const initial = (firstName?.[0] || 'A').toUpperCase();
  const yearsAsAdmin = Number(adminProfile?.years_as_admin || adminProfile?.years || 7);
  const managedStudents = Number(adminProfile?.students_managed || adminProfile?.total_students || 1246);
  const passwordAge = Number(adminProfile?.password_age_days || 42);
  const schoolName = adminProfile?.school_name || 'ParentLink Public School';

  const handleLogout = () => {
    Alert.alert('Sign out', 'Do you want to sign out from this account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => dispatch(logout()) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#2C3E50" />
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.sub}>School Administrator</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{yearsAsAdmin}</Text>
            <Text style={styles.statLabel}>Years as Admin</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{managedStudents.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Students Managed</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.row}><Text style={styles.key}>Email</Text><Text style={styles.value}>{adminProfile.email || 'admin@school.edu'}</Text></View>
          <View style={styles.row}><Text style={styles.key}>Mobile</Text><Text style={styles.value}>{adminProfile.mobile_number || '+91 9XXXXXXXXX'}</Text></View>
          <View style={styles.row}><Text style={styles.key}>Password Age</Text><Text style={styles.value}>{passwordAge} days</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>School</Text>
          <View style={styles.row}>
            <Text style={styles.key}>Name</Text>
            <View style={styles.badgeWrap}>
              <Text style={styles.value}>{schoolName}</Text>
              <View style={styles.activeBadge}><Text style={styles.activeText}>Active</Text></View>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('ChangePassword')}>
          <Text style={styles.actionText}>Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('UserProfile')}>
          <Text style={styles.actionText}>Open Full User Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgMain },
  header: { backgroundColor: '#2C3E50', paddingHorizontal: hs(20), paddingVertical: vs(16), alignItems: 'center' },
  title: { fontSize: ms(20), fontWeight: '700', color: '#FFF' },
  container: { padding: hs(20), alignItems: 'center', paddingBottom: vs(40) },
  avatarCircle: { width: hs(90), height: hs(90), borderRadius: hs(45), backgroundColor: '#1D4ED8', alignItems: 'center', justifyContent: 'center', marginBottom: vs(12) },
  avatarText: { color: '#FFF', fontSize: ms(34), fontWeight: '800' },
  name: { fontSize: ms(22), fontWeight: '700', color: '#0F172A' },
  sub: { fontSize: ms(13), color: '#64748B', marginBottom: vs(18) },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: vs(16) },
  statCard: { width: '48%', backgroundColor: '#FFF', borderRadius: hs(12), borderWidth: 1, borderColor: '#E2E8F0', padding: hs(14), alignItems: 'center' },
  statValue: { fontSize: ms(22), fontWeight: '700', color: '#0F172A', marginBottom: vs(4) },
  statLabel: { fontSize: ms(12), color: '#64748B' },
  section: { width: '100%', backgroundColor: '#FFF', borderRadius: hs(12), borderWidth: 1, borderColor: '#E2E8F0', padding: hs(14), marginBottom: vs(12) },
  sectionTitle: { fontSize: ms(15), fontWeight: '700', color: '#1E293B', marginBottom: vs(8) },
  row: { marginBottom: vs(9) },
  key: { fontSize: ms(12), color: '#64748B', marginBottom: vs(2) },
  value: { fontSize: ms(14), color: '#0F172A', fontWeight: '600' },
  badgeWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  activeBadge: { backgroundColor: '#DCFCE7', borderRadius: hs(10), paddingHorizontal: hs(8), paddingVertical: vs(3) },
  activeText: { fontSize: ms(11), color: '#16A34A', fontWeight: '700' },
  actionBtn: { width: '100%', backgroundColor: '#FFF', borderRadius: hs(10), borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center', paddingVertical: vs(12), marginTop: vs(6) },
  actionText: { color: '#1E293B', fontSize: ms(14), fontWeight: '700' },
  logoutBtn: { width: '100%', backgroundColor: '#FEE2E2', borderRadius: hs(10), alignItems: 'center', paddingVertical: vs(12), marginTop: vs(10) },
  logoutText: { color: '#B91C1C', fontSize: ms(14), fontWeight: '700' },
});

export default AdminProfileScreen;
