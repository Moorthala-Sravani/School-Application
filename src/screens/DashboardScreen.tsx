import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchAttendance } from '../store/slices/attendanceSlice';
import { fetchMessages } from '../store/slices/messageSlice';
import { colors } from '../theme/colors';
import { hs, vs, ms } from '../theme/scale';

const DASHBOARD_ITEMS = [
  { icon: '📅', label: 'Attendance', screen: 'Attendance', bgColor: '#FFF2F2', iconColor: '#E74C3C' },
  { icon: '📚', label: 'Homework', screen: 'Homework', bgColor: '#F2F6FF', iconColor: '#3498DB' },
  { icon: '📝', label: 'Remarks', screen: 'Remarks', bgColor: '#F2FFF2', iconColor: '#2ECC71' },
  { icon: '🏆', label: 'Exam Result', screen: 'ExamResult', bgColor: '#FFF9F2', iconColor: '#F39C12' },
  { icon: '💰', label: 'Pay Fees', screen: 'PayFees', bgColor: '#F9F2FF', iconColor: '#9B59B6' },
  { icon: '📋', label: 'Notice Board', screen: 'NoticeBoard', bgColor: '#F2FFFF', iconColor: '#1ABC9C' },
  { icon: '💬', label: 'Messages', screen: 'Messages', bgColor: '#FFFFF2', iconColor: '#F1C40F' },
  { icon: '🚌', label: 'Bus Location', screen: 'BusLocation', bgColor: '#FFF2E6', iconColor: '#E67E22' },
  { icon: '👕', label: 'Uniform', screen: 'Uniform', bgColor: '#F4F6F6', iconColor: '#2C3E50' },
  { icon: '👤', label: 'User Profile', screen: 'UserProfile', bgColor: '#F5F5F5', iconColor: '#95A5A6' },
];

const DashboardScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);
  const profile = useSelector((state: RootState) => state.profile);
  const teacherProfile = useSelector((state: RootState) => state.teacherProfile);
  const { records } = useSelector((state: RootState) => state.attendance);
  const { messages } = useSelector((state: RootState) => state.messages);

  React.useEffect(() => {
    if (auth.role === 'Teacher') {
      dispatch(fetchAttendance());
    }
    dispatch(fetchMessages(undefined));
  }, [dispatch, auth.role]);

  const { firstName, lastName, role } = auth;
  const fullName = firstName ? `${firstName} ${lastName}` : 'User';
  const profilePic = role === 'Teacher' ? teacherProfile?.profile_pic : profile?.profile_pic;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Calculate attendance statistics from records
  const getAttendanceStats = () => {
    if (!records || records.length === 0) {
      return { total: 0, present: 0, absent: 0, markedClasses: 0 };
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Filter today's attendance records
    const todayRecords = records.filter((record: any) => {
      const recordDate = new Date(record.date).toISOString().split('T')[0];
      return recordDate === today;
    });

    // Get unique classes for today
    const uniqueClasses = [...new Set(todayRecords.map((record: any) => record.class_group))];
    
    // Calculate totals
    const total = todayRecords.length;
    const present = todayRecords.filter((record: any) => record.status === 'present').length;
    const absent = todayRecords.filter((record: any) => record.status === 'absent').length;
    
    return {
      total,
      present,
      absent,
      markedClasses: uniqueClasses.length
    };
  };

  const attendanceStats = getAttendanceStats();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgLight} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.openDrawer()}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, paddingLeft: 16 }}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.schoolName}>{fullName}</Text>
        </View>
        <TouchableOpacity style={styles.avatarBox} onPress={() => navigation.navigate('UserProfile')}>
          {profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{fullName.charAt(0).toUpperCase()}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Greenfield Academy</Text>
          <Text style={styles.bannerSub}>Empowering the future</Text>
        </View>

        {role === 'Parent' && (
          <View style={styles.cardsContainer}>
            <Text style={styles.sectionTitle}>Child Summary</Text>

            {/* Attendance Card */}
            <TouchableOpacity style={styles.summaryCard} onPress={() => navigation.navigate('Attendance')}>
              <View style={[styles.cardHeader, { borderBottomColor: '#F5B7B1' }]}>
                <Text style={styles.cardTitle}>📊 Attendance</Text>
                <Text style={[styles.cardStatus, { color: '#27AE60', backgroundColor: '#D5F5E3' }]}>Present Today</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>92%</Text>
                  <Text style={styles.statLabel}>This Month</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>45</Text>
                  <Text style={styles.statLabel}>Total Present</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>4</Text>
                  <Text style={styles.statLabel}>Total Absent</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Academics Card */}
            <TouchableOpacity style={styles.summaryCard} onPress={() => navigation.navigate('Academics')}>
              <View style={[styles.cardHeader, { borderBottomColor: '#AED6F1' }]}>
                <Text style={styles.cardTitle}>📝 Academics</Text>
                <Text style={[styles.cardStatus, { color: '#2980B9', backgroundColor: '#D6EAF8' }]}>Term 1 Exam</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>A+</Text>
                  <Text style={styles.statLabel}>Math</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>A</Text>
                  <Text style={styles.statLabel}>Science</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>88%</Text>
                  <Text style={styles.statLabel}>Overall</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Fee Card */}
            <TouchableOpacity style={styles.summaryCard} onPress={() => navigation.navigate('PayFees')}>
              <View style={[styles.cardHeader, { borderBottomColor: '#D2B4DE' }]}>
                <Text style={styles.cardTitle}>💰 Fee Details</Text>
                <Text style={[styles.cardStatus, { color: '#C0392B', backgroundColor: '#FDEDEC' }]}>Due in 5 days</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>₹45,000</Text>
                  <Text style={styles.statLabel}>Total Fee</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>₹15,000</Text>
                  <Text style={styles.statLabel}>Amount Due</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: '#8E44AD' }]}>Pay Now ➔</Text>
                  <Text style={styles.statLabel}>Online</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Bus Tracking Card */}
            <TouchableOpacity style={styles.summaryCard} onPress={() => navigation.navigate('BusLocation')}>
              <View style={[styles.cardHeader, { borderBottomColor: '#F5CBA7' }]}>
                <Text style={styles.cardTitle}>🚌 Bus Status</Text>
                <Text style={[styles.cardStatus, { color: '#D35400', backgroundColor: '#FDEBD0' }]}>Live</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={[styles.statBox, { flex: 2, alignItems: 'flex-start' }]}>
                  <Text style={styles.statValue}>Arriving in 5 mins</Text>
                  <Text style={styles.statLabel}>Distance: 1.2 km</Text>
                </View>
                <View style={[styles.statBox, { flex: 1 }]}>
                  <Text style={[styles.statValue, { color: '#E67E22' }]}>Track ➔</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Books Card */}
            <TouchableOpacity style={styles.summaryCard} onPress={() => navigation.navigate('Books')}>
              <View style={[styles.cardHeader, { borderBottomColor: '#A3E4D7' }]}>
                <Text style={styles.cardTitle}>📚 Library Books</Text>
                <Text style={[styles.cardStatus, { color: '#117A65', backgroundColor: '#D1F2EB' }]}>2 Issued</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={[styles.statBox, { flex: 2, alignItems: 'flex-start' }]}>
                  <Text style={styles.statValue}>Science Textbook</Text>
                  <Text style={styles.statLabel}>Due Date: Tomorrow</Text>
                </View>
                <View style={[styles.statBox, { flex: 1 }]}>
                  <Text style={[styles.statValue, { color: '#16A085' }]}>No Fine</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Uniform Card */}
            <TouchableOpacity style={styles.summaryCard} onPress={() => navigation.navigate('Uniform')}>
              <View style={[styles.cardHeader, { borderBottomColor: '#CCD1D1' }]}>
                <Text style={styles.cardTitle}>👕 Uniform Orders</Text>
                <Text style={[styles.cardStatus, { color: '#5D6D7E', backgroundColor: '#EAECEE' }]}>1 Pending</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={[styles.statBox, { flex: 2, alignItems: 'flex-start' }]}>
                  <Text style={styles.statValue}>Winter Jacket (M)</Text>
                  <Text style={styles.statLabel}>Ordered: 2 days ago</Text>
                </View>
                <View style={[styles.statBox, { flex: 1 }]}>
                  <Text style={[styles.statValue, { color: '#34495E' }]}>Track ➔</Text>
                </View>
              </View>
            </TouchableOpacity>

          </View>
        )}
        {role === 'Teacher' && (
          <View style={styles.cardsContainer}>
            <Text style={styles.sectionTitle}>Today's Overview</Text>

            {/* Schedule Card */}
            <TouchableOpacity style={styles.summaryCard} onPress={() => navigation.navigate('TeacherTimetable')}>
              <View style={[styles.cardHeader, { borderBottomColor: '#F5B7B1' }]}>
                <Text style={styles.cardTitle}>📅 Today's Schedule</Text>
                <Text style={[styles.cardStatus, { color: '#C0392B', backgroundColor: '#FDEDEC' }]}>Next: 6A Math</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>5</Text>
                  <Text style={styles.statLabel}>Total Classes</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>2</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>3</Text>
                  <Text style={styles.statLabel}>Remaining</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Attendance Pending Card */}
            <TouchableOpacity style={styles.summaryCard} onPress={() => navigation.navigate('TeacherAttendance')}>
              <View style={[styles.cardHeader, { borderBottomColor: '#F5CBA7' }]}>
                <Text style={styles.cardTitle}>✅ Attendance</Text>
                <Text style={[styles.cardStatus, { color: '#D35400', backgroundColor: '#FDEBD0' }]}>Action Required</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={[styles.statBox, { flex: 2, alignItems: 'flex-start' }]}>
                  <Text style={styles.statValue}>
                    {attendanceStats.total > 0 
                      ? `${attendanceStats.present}P / ${attendanceStats.absent}A / ${attendanceStats.total}Total`
                      : 'No attendance marked today'
                    }
                  </Text>
                  <Text style={styles.statLabel}>
                    {attendanceStats.markedClasses > 0 
                      ? `${attendanceStats.markedClasses} class${attendanceStats.markedClasses > 1 ? 'es' : ''} marked`
                      : 'Start marking attendance'
                    }
                  </Text>
                </View>
                <View style={[styles.statBox, { flex: 1 }]}>
                  <Text style={[styles.statValue, { color: '#E67E22' }]}>Mark Now ➔</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Messages Card */}
            <TouchableOpacity style={styles.summaryCard} onPress={() => navigation.navigate('Messages')}>
              <View style={[styles.cardHeader, { borderBottomColor: '#AED6F1' }]}>
                <Text style={styles.cardTitle}>💬 Parent Messages</Text>
                <Text style={[styles.cardStatus, { color: '#2980B9', backgroundColor: '#D6EAF8' }]}>
                  {messages.filter(m => !m.is_read && m.sender_type !== 'System').length} Unread
                </Text>
              </View>
              <View style={styles.cardBody}>
                <View style={[styles.statBox, { flex: 2, alignItems: 'flex-start' }]}>
                  <Text style={styles.statValue}>New inquiry from Rahul's Parent</Text>
                  <Text style={styles.statLabel}>Regarding homework submission</Text>
                </View>
                <View style={[styles.statBox, { flex: 1 }]}>
                  <Text style={[styles.statValue, { color: '#3498DB' }]}>Reply ➔</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Books Card */}
            <TouchableOpacity style={styles.summaryCard} onPress={() => navigation.navigate('Books')}>
              <View style={[styles.cardHeader, { borderBottomColor: '#A3E4D7' }]}>
                <Text style={styles.cardTitle}>📚 Book Returns</Text>
                <Text style={[styles.cardStatus, { color: '#117A65', backgroundColor: '#D1F2EB' }]}>4 Overdue</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={[styles.statBox, { flex: 2, alignItems: 'flex-start' }]}>
                  <Text style={styles.statValue}>Class 7B English Textbooks</Text>
                  <Text style={styles.statLabel}>Collect today</Text>
                </View>
                <View style={[styles.statBox, { flex: 1 }]}>
                  <Text style={[styles.statValue, { color: '#16A085' }]}>Manage ➔</Text>
                </View>
              </View>
            </TouchableOpacity>

          </View>
        )}

        {role === 'Admin' && (
          <View style={styles.cardsContainer}>
            <Text style={styles.sectionTitle}>School Control Center</Text>

            {/* Overview Card */}
            <TouchableOpacity style={styles.summaryCard} onPress={() => navigation.navigate('AdminUsers')}>
              <View style={[styles.cardHeader, { borderBottomColor: '#AED6F1' }]}>
                <Text style={styles.cardTitle}>👥 School Overview</Text>
                <Text style={[styles.cardStatus, { color: '#2980B9', backgroundColor: '#D6EAF8' }]}>Active</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>1,240</Text>
                  <Text style={styles.statLabel}>Students</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>85</Text>
                  <Text style={styles.statLabel}>Teachers</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>32</Text>
                  <Text style={styles.statLabel}>Classes</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Attendance Card */}
            <TouchableOpacity style={styles.summaryCard} onPress={() => navigation.navigate('AdminReports')}>
              <View style={[styles.cardHeader, { borderBottomColor: '#A3E4D7' }]}>
                <Text style={styles.cardTitle}>📊 Today's Attendance</Text>
                <Text style={[styles.cardStatus, { color: '#117A65', backgroundColor: '#D1F2EB' }]}>Good</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>94%</Text>
                  <Text style={styles.statLabel}>Overall</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>1,165</Text>
                  <Text style={styles.statLabel}>Present</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: '#C0392B' }]}>75</Text>
                  <Text style={styles.statLabel}>Absent</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Fee Collection Card */}
            <TouchableOpacity style={styles.summaryCard} onPress={() => navigation.navigate('AdminBilling')}>
              <View style={[styles.cardHeader, { borderBottomColor: '#D2B4DE' }]}>
                <Text style={styles.cardTitle}>💰 Fee Collection</Text>
                <Text style={[styles.cardStatus, { color: '#8E44AD', backgroundColor: '#F4ECF7' }]}>Today: ₹45K</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={[styles.statBox, { flex: 2, alignItems: 'flex-start' }]}>
                  <Text style={styles.statValue}>142 Defaulters detected</Text>
                  <Text style={styles.statLabel}>₹1.2M pending dues</Text>
                </View>
                <View style={[styles.statBox, { flex: 1 }]}>
                  <Text style={[styles.statValue, { color: '#8E44AD' }]}>Remind ➔</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Bus Card */}
            <TouchableOpacity style={styles.summaryCard} onPress={() => navigation.navigate('AdminBus')}>
              <View style={[styles.cardHeader, { borderBottomColor: '#F5CBA7' }]}>
                <Text style={styles.cardTitle}>🚌 Bus Fleet</Text>
                <Text style={[styles.cardStatus, { color: '#D35400', backgroundColor: '#FDEBD0' }]}>1 Alert</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={[styles.statBox, { flex: 2, alignItems: 'flex-start' }]}>
                  <Text style={styles.statValue}>Bus #4 maintenance due</Text>
                  <Text style={styles.statLabel}>12 active routes running</Text>
                </View>
                <View style={[styles.statBox, { flex: 1 }]}>
                  <Text style={[styles.statValue, { color: '#E67E22' }]}>Manage ➔</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: hs(24),
    paddingTop: vs(16),
    paddingBottom: vs(16),
    backgroundColor: colors.bgLight,
  },
  menuBtn: {
    paddingRight: 8,
  },
  menuIcon: {
    fontSize: ms(24),
    color: colors.textPrimary,
  },
  greeting: {
    fontSize: ms(14),
    color: colors.textSecond,
    marginBottom: vs(4),
  },
  schoolName: {
    fontSize: ms(20),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  avatarBox: {
    width: hs(44),
    height: hs(44),
    borderRadius: hs(22),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: ms(18),
    fontWeight: '700',
    color: '#FFF',
  },
  scroll: {
    paddingHorizontal: hs(24),
    paddingBottom: vs(40),
  },
  banner: {
    backgroundColor: colors.primary,
    borderRadius: hs(16),
    padding: hs(20),
    marginBottom: vs(32),
    marginTop: vs(8),
    alignItems: 'flex-start',
  },
  bannerTitle: {
    fontSize: ms(18),
    fontWeight: '700',
    color: '#FFF',
    marginBottom: vs(4),
  },
  bannerSub: {
    fontSize: ms(13),
    color: 'rgba(255,255,255,0.8)',
  },
  sectionTitle: {
    fontSize: ms(18),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: vs(16),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '31%',
    alignItems: 'center',
    marginBottom: vs(24),
  },
  iconContainer: {
    width: hs(64),
    height: hs(64),
    borderRadius: hs(20),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(8),
  },
  icon: {
    fontSize: ms(28),
  },
  label: {
    fontSize: ms(12),
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  tileBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E74C3C',
    minWidth: hs(20),
    height: hs(20),
    borderRadius: hs(10),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  tileBadgeText: {
    color: '#FFF',
    fontSize: ms(11),
    fontWeight: '700',
  },
  cardsContainer: {
    paddingBottom: vs(24),
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: hs(16),
    marginBottom: vs(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: hs(16),
    paddingVertical: vs(12),
    borderBottomWidth: 1.5,
    backgroundColor: '#FAFAFA',
  },
  cardTitle: {
    fontSize: ms(15),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardStatus: {
    fontSize: ms(11),
    fontWeight: '700',
    paddingHorizontal: hs(8),
    paddingVertical: vs(4),
    borderRadius: hs(6),
    overflow: 'hidden',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: hs(16),
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: ms(15),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: vs(4),
  },
  statLabel: {
    fontSize: ms(11),
    color: colors.textSecond,
    fontWeight: '500',
  },
});

export default DashboardScreen;
