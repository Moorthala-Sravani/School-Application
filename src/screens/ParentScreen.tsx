import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchParentProfile } from '../store/slices/profileSlice';
import { fetchFees } from '../store/slices/feeSlice';
import { fetchHomework } from '../store/slices/homeworkSlice';
import { fetchMessages } from '../store/slices/messageSlice';
import { fetchAttendance } from '../store/slices/attendanceSlice';
import { colors } from '../theme/colors';
import { hs, vs, ms } from '../theme/scale';
import { belongsToParentChild } from '../utils/parentData';

const ParentScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);
  const profile = useSelector((state: RootState) => state.profile);
  const { fees } = useSelector((state: RootState) => state.fees);
  const { homeworkList } = useSelector((state: RootState) => state.homework);
  const { messages } = useSelector((state: RootState) => state.messages);
  const { records: attendanceRecords } = useSelector((state: RootState) => state.attendance);

  useEffect(() => {
    dispatch(fetchParentProfile());
    dispatch(fetchHomework());
    dispatch(fetchMessages(undefined));
    dispatch(fetchAttendance());
  }, [dispatch]);

  useEffect(() => {
    const studentKey = profile.id ? String(profile.id) : auth.mobile;
    if (studentKey) {
      dispatch(fetchFees(studentKey));
    }
  }, [dispatch, profile.id, auth.mobile]);

  const parentName = auth.firstName ? `${auth.firstName} ${auth.lastName}` : 'Parent';
  const childName = profile.child_name || 'Student';
  const childClass = profile.child_class ? `Grade ${profile.child_class}` : 'Class not assigned';
  const studentId = profile.mobile_number || auth.mobile || 'N/A';
  
  // Calculate notifications
  const childMessages = messages.filter((m: any) => belongsToParentChild(m, profile, auth) || m.receiver_id == null);
  const childHomework = homeworkList.filter((hw: any) => belongsToParentChild(hw, profile, auth));
  const childAttendanceRecords = attendanceRecords.filter((record: any) => belongsToParentChild(record, profile, auth));

  const unreadMessages = childMessages.filter((m: any) => !m.is_read && m.sender_type !== auth.role).length;
  const recentHomework = childHomework.filter(hw => new Date(hw.created_at).toDateString() === new Date().toDateString()).length;
  const totalNotifications = unreadMessages + recentHomework;
  
  const totalFees = fees.reduce((sum, f: any) => sum + Number(f.amount || 0), 0);
  const paidFees = fees
    .filter((f: any) => String(f.status || '').toLowerCase() === 'paid')
    .reduce((sum: number, f: any) => sum + Number(f.amount || 0), 0);
  const dueFees = totalFees - paidFees;
  const nextDueFee = fees.find((f: any) => String(f.status || '').toLowerCase() !== 'paid');

  // Calculate Attendance Percentage
  const totalDays = childAttendanceRecords.filter((r: any) => r.status === 'present' || r.status === 'absent').length;
  const presentDays = childAttendanceRecords.filter((r: any) => r.status === 'present').length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

  const dynamicNotifications = [
    ...childHomework.slice(0, 2).map((hw: any) => ({
      id: `hw-${hw.id}`,
      title: `Homework — ${hw.title || 'Task'}`,
      desc: hw.description ? String(hw.description).slice(0, 40) : 'New homework assigned',
      color: colors.primary,
    })),
    ...childMessages
      .filter((m: any) => !m.is_read && m.sender_type !== auth.role)
      .slice(0, 2)
      .map((msg: any) => ({
        id: `msg-${msg.id}`,
        title: msg.title || `Message from ${msg.sender_name || 'School'}`,
        desc: msg.content ? String(msg.content).slice(0, 40) : 'Tap to view message',
        color: colors.present,
      })),
  ].slice(0, 4);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgMain} />

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.openDrawer()}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <View style={{flex: 1, paddingLeft: 16}}>
            <Text style={styles.schoolName}>Greenfield Academy</Text>
            <Text style={styles.greeting}>{getGreeting()}, {parentName}</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn}>
            <Text style={styles.bellIcon}>🔔</Text>
            {totalNotifications > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{totalNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Student Card */}
        <View style={styles.studentCard}>
          <View>
            <Text style={styles.studentName}>{childName}</Text>
            <Text style={styles.studentGrade}>{childClass}</Text>
            <Text style={styles.studentId}>ID: {studentId}</Text>
          </View>
          <TouchableOpacity style={styles.gpaBox} onPress={() => navigation.navigate('Attendance')}>
            <Text style={[styles.gpaValue, attendancePercentage < 75 && {color: colors.absent}]}>
              {attendancePercentage}%
            </Text>
            <Text style={styles.gpaLabel}>Attendance</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Info */}
        <Text style={styles.sectionTitle}>Quick info</Text>
        <View style={styles.quickInfoGrid}>
          
          <TouchableOpacity style={styles.infoCard} onPress={() => navigation.navigate('PayFees')}>
            <Text style={styles.infoLabel}>School fees</Text>
            <Text style={styles.infoValue}>₹{paidFees.toLocaleString()}</Text>
            <View style={[styles.statusBadge, { backgroundColor: colors.bgLight }]}>
              <Text style={[styles.statusText, { color: colors.present }]}>Paid</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoCard} onPress={() => navigation.navigate('PayFees')}>
            <Text style={styles.infoLabel}>Due fee</Text>
            <Text style={styles.infoValue}>₹{Math.max(dueFees, 0).toLocaleString()}</Text>
            <View style={[styles.statusBadge, { backgroundColor: colors.bgLight }]}>
              <Text style={[styles.statusText, { color: colors.orangeLight }]}>
                {nextDueFee?.due_date ? `Due ${nextDueFee.due_date}` : 'No due date'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoCard}>
            <Text style={styles.infoLabel}>Books</Text>
            <Text style={styles.infoValue}>12 titles</Text>
            <View style={[styles.statusBadge, { backgroundColor: colors.bgLight }]}>
              <Text style={[styles.statusText, { color: colors.orangeLight }]}>2 pending</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoCard}>
            <Text style={styles.infoLabel}>Uniform</Text>
            <Text style={styles.infoValue}>Issued</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#2A203A' }]}>
              <Text style={[styles.statusText, { color: '#9B51E0' }]}>Summer 26</Text>
            </View>
          </TouchableOpacity>

        </View>

        {/* Notifications */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.notificationsContainer}>
          {dynamicNotifications.length === 0 ? (
            <Text style={styles.notifDesc}>No new notifications</Text>
          ) : (
            dynamicNotifications.map(item => (
              <View key={item.id} style={styles.notificationItem}>
                <View style={[styles.dot, { backgroundColor: item.color }]} />
                <View style={styles.notificationContent}>
                  <Text style={styles.notifTitle}>{item.title}</Text>
                  <Text style={styles.notifDesc}>{item.desc}</Text>
                </View>
              </View>
            ))
          )}
        </View>

      </ScrollView>

      {/* Note: I removed the mock bottom bar because this screen is now inside StackNavigator */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgMain },
  scroll: { paddingHorizontal: hs(24), paddingTop: vs(24), paddingBottom: vs(100) },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(32) },
  menuBtn: { paddingRight: 8 },
  menuIcon: { fontSize: ms(24), color: colors.textPrimary },
  schoolName: { color: colors.textPrimary, fontSize: ms(20), fontWeight: '700' },
  greeting: { color: colors.textSecond, fontSize: ms(14), marginTop: vs(4) },
  bellBtn: { width: hs(40), height: hs(40), borderRadius: hs(20), borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  bellIcon: { fontSize: ms(18) },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#F2C94C', width: hs(18), height: hs(18), borderRadius: hs(9), alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#000', fontSize: ms(10), fontWeight: '700' },
  studentCard: { backgroundColor: colors.bgLight, borderRadius: hs(16), padding: hs(20), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(32), borderWidth: 1, borderColor: colors.border },
  studentName: { color: colors.textPrimary, fontSize: ms(18), fontWeight: '700', marginBottom: vs(4) },
  studentGrade: { color: colors.textSecond, fontSize: ms(14), marginBottom: vs(4) },
  studentId: { color: colors.primary, fontSize: ms(12), fontWeight: '600' },
  gpaBox: { alignItems: 'flex-end' },
  gpaValue: { color: colors.present, fontSize: ms(24), fontWeight: '700' },
  gpaLabel: { color: colors.textSecond, fontSize: ms(12) },
  sectionTitle: { color: colors.textPrimary, fontSize: ms(16), fontWeight: '600', marginBottom: vs(16) },
  quickInfoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: vs(32) },
  infoCard: { width: '48%', backgroundColor: colors.bgLight, borderRadius: hs(16), padding: hs(16), marginBottom: vs(16), borderWidth: 1, borderColor: colors.border },
  infoLabel: { color: colors.textSecond, fontSize: ms(13), marginBottom: vs(8) },
  infoValue: { color: colors.textPrimary, fontSize: ms(18), fontWeight: '700', marginBottom: vs(12) },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: hs(8), paddingVertical: vs(4), borderRadius: hs(4) },
  statusText: { fontSize: ms(11), fontWeight: '600' },
  notificationsContainer: { backgroundColor: colors.bgLight, borderRadius: hs(16), padding: hs(16), borderWidth: 1, borderColor: colors.border },
  notificationItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: vs(12) },
  dot: { width: hs(8), height: hs(8), borderRadius: hs(4), marginRight: hs(16) },
  notificationContent: { flex: 1 },
  notifTitle: { color: colors.textPrimary, fontSize: ms(14), fontWeight: '600', marginBottom: vs(4) },
  notifDesc: { color: colors.textSecond, fontSize: ms(13) },
});

export default ParentScreen;
