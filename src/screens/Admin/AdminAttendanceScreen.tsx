import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import api from '../../config/api';
import ErrorView from '../../components/common/ErrorView';
import { getErrorMessage } from '../../utils/errorUtils';
import { colors } from '../../theme/colors';
import { hs, vs, ms } from '../../theme/scale';

const AdminAttendanceScreen = ({ navigation }: any) => {
  const { token } = useSelector((state: RootState) => state.auth);
  
  const [activeTab, setActiveTab] = useState<'Students' | 'Teachers'>('Students');
  const [selectedClass, setSelectedClass] = useState('6-A');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const classes = ['6-A', '7-B', '8-C'];

  const getRecordName = (record: any) => {
    const fullName = [record.firstname ?? record.firstName, record.lastname ?? record.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    return activeTab === 'Students'
      ? record.student_name || record.studentName || record.child_name || record.childName || record.name || fullName || 'Unknown Student'
      : fullName || record.teacher_name || record.teacherName || record.name || 'Unknown Teacher';
  };

  const fetchAttendance = async () => {
    setLoading(true);
    setError(null);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      let endpoint = '';
      if (activeTab === 'Students') {
        endpoint = `/attendance?class_group=${encodeURIComponent(selectedClass)}`;
      } else {
        endpoint = `/attendance?target_role=Teacher`;
      }
      const res = await api.get(endpoint, config);
      setRecords(res.data || []);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [activeTab, selectedClass]);

  // Group records by Date
  const groupedRecords = records.reduce((acc: any, record: any) => {
    const d = new Date(record.date).toLocaleDateString();
    if (!acc[d]) acc[d] = [];
    acc[d].push(record);
    return acc;
  }, {});

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#2C3E50" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Attendance Sheet</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Students' && styles.activeTab]}
          onPress={() => setActiveTab('Students')}
        >
          <Text style={[styles.tabText, activeTab === 'Students' && styles.activeTabText]}>Students</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Teachers' && styles.activeTab]}
          onPress={() => setActiveTab('Teachers')}
        >
          <Text style={[styles.tabText, activeTab === 'Teachers' && styles.activeTabText]}>Teachers</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'Students' && (
        <View style={styles.classSelector}>
          <Text style={styles.classSelectorLabel}>Select Class:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: hs(8) }}>
            {classes.map(cls => (
              <TouchableOpacity
                key={cls}
                style={[styles.classChip, selectedClass === cls && styles.activeClassChip]}
                onPress={() => setSelectedClass(cls)}
              >
                <Text style={[styles.classChipText, selectedClass === cls && styles.activeClassChipText]}>{cls}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color="#2C3E50" style={{ marginTop: vs(40) }} />
        ) : error ? (
          <ErrorView message={error} onRetry={fetchAttendance} accentColor="#2C3E50" />
        ) : Object.keys(groupedRecords).length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>No attendance records found.</Text>
          </View>
        ) : (
          Object.keys(groupedRecords).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map(date => (
            <View key={date} style={styles.dateGroup}>
              <View style={styles.dateHeader}>
                <Text style={styles.dateText}>{date}</Text>
              </View>
              {groupedRecords[date].map((record: any) => {
                const name = getRecordName(record);
                let statusColor = colors.present;
                if (record.status === 'absent') statusColor = colors.absent;
                if (String(record.status || '').includes('leave')) statusColor = colors.orange;

                return (
                  <View key={record.id} style={styles.recordCard}>
                    <View style={styles.avatar}>
                      <Image 
                        source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=random&color=fff` }} 
                        style={{ width: '100%', height: '100%' }} 
                      />
                    </View>
                    <View style={styles.recordInfo}>
                      <Text style={styles.recordName}>{name || 'Unknown User'}</Text>
                      {activeTab === 'Students' && <Text style={styles.recordSub}>Class: {record.class_group}</Text>}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20`, borderColor: statusColor }]}>
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {record.status === 'leave_pending' ? 'L. Pending' : 
                         record.status === 'leave_approved' ? 'Leave' : 
                         String(record.status || 'unknown').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgMain },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#2C3E50', paddingHorizontal: hs(16), paddingVertical: vs(12) },
  backBtn: { padding: 6 },
  backIcon: { fontSize: 34, color: '#FFF', lineHeight: 34, marginTop: -4 },
  title: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  
  tabsContainer: { flexDirection: 'row', backgroundColor: '#FFF', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 },
  tab: { flex: 1, paddingVertical: vs(14), alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#2C3E50' },
  tabText: { fontSize: ms(15), color: colors.textSecond, fontWeight: '600' },
  activeTabText: { color: '#2C3E50', fontWeight: '800' },

  classSelector: { backgroundColor: '#F8F9FA', paddingVertical: vs(12), borderBottomWidth: 1, borderBottomColor: colors.border },
  classSelectorLabel: { fontSize: ms(14), fontWeight: '700', color: colors.textPrimary, paddingHorizontal: hs(16), marginBottom: vs(8) },
  classChip: { paddingHorizontal: hs(16), paddingVertical: vs(8), backgroundColor: '#FFF', borderRadius: hs(20), marginHorizontal: hs(8), borderWidth: 1, borderColor: colors.border },
  activeClassChip: { backgroundColor: '#2C3E50', borderColor: '#2C3E50' },
  classChipText: { fontSize: ms(13), color: colors.textSecond, fontWeight: '600' },
  activeClassChipText: { color: '#FFF' },

  container: { padding: hs(16), paddingBottom: vs(40) },
  emptyState: { alignItems: 'center', marginTop: vs(60) },
  emptyIcon: { fontSize: ms(48), marginBottom: vs(16) },
  emptyText: { fontSize: ms(16), color: colors.textSecond },

  dateGroup: { marginBottom: vs(24) },
  dateHeader: { backgroundColor: '#EAECEE', paddingVertical: vs(6), paddingHorizontal: hs(12), borderRadius: hs(6), alignSelf: 'flex-start', marginBottom: vs(12) },
  dateText: { fontSize: ms(13), fontWeight: '700', color: '#2C3E50' },

  recordCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: hs(12), borderRadius: hs(12), marginBottom: vs(10), elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3 },
  avatar: { width: hs(40), height: hs(40), borderRadius: hs(20), overflow: 'hidden', marginRight: hs(12), backgroundColor: '#EBF5FB' },
  recordInfo: { flex: 1 },
  recordName: { fontSize: ms(15), fontWeight: '700', color: colors.textPrimary, marginBottom: vs(2) },
  recordSub: { fontSize: ms(12), color: colors.textSecond },
  
  statusBadge: { paddingHorizontal: hs(10), paddingVertical: vs(4), borderRadius: hs(6), borderWidth: 1 },
  statusText: { fontSize: ms(11), fontWeight: '700' }
});

export default AdminAttendanceScreen;
