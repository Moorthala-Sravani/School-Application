import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { hs, vs, ms } from '../../theme/scale';

const ManagementScreen = ({ navigation }: any) => {
  const managementTasks = [
    { id: 1, title: 'Staff Meeting', time: '14:00 PM', icon: '🤝', color: '#3498DB' },
    { id: 2, title: 'Review Syllabus', time: 'Pending', icon: '📚', color: '#E74C3C' },
    { id: 3, title: 'Submit Grades', time: 'Tomorrow', icon: '📊', color: '#9B59B6' },
    { id: 4, title: 'Parent-Teacher Meeting', time: 'Friday', icon: '👨‍👩‍👧', color: '#2ECC71' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#8B2500" />
      <View style={styles.header}>
        <Text style={styles.title}>Management</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.banner}>
          <Text style={styles.bannerIcon}>📋</Text>
          <View style={styles.bannerTextWrap}>
            <Text style={styles.bannerTitle}>Admin & Management</Text>
            <Text style={styles.bannerSub}>Manage your daily tasks and reports.</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('TeacherAttendance')}>
            <View style={[styles.iconBox, { backgroundColor: '#EBF5FB' }]}>
              <Text style={styles.actionIcon}>📝</Text>
            </View>
            <Text style={styles.actionText}>Attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('TeacherTimetable')}>
            <View style={[styles.iconBox, { backgroundColor: '#FDF2E9' }]}>
              <Text style={styles.actionIcon}>📅</Text>
            </View>
            <Text style={styles.actionText}>Timetable</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('TeacherSalary')}>
            <View style={[styles.iconBox, { backgroundColor: '#E8F8F5' }]}>
              <Text style={styles.actionIcon}>💰</Text>
            </View>
            <Text style={styles.actionText}>Salary Slip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.iconBox, { backgroundColor: '#F5EEF8' }]}>
              <Text style={styles.actionIcon}>📈</Text>
            </View>
            <Text style={styles.actionText}>Reports</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Pending Tasks</Text>
        {managementTasks.map((task) => (
          <TouchableOpacity key={task.id} style={styles.taskCard} activeOpacity={0.8}>
            <View style={[styles.taskIconBox, { backgroundColor: `${task.color}20` }]}>
              <Text style={styles.taskIcon}>{task.icon}</Text>
            </View>
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskTime}>{task.time}</Text>
            </View>
            <TouchableOpacity style={styles.checkBtn}>
              <Text style={{color: task.color, fontWeight: '800'}}>✓</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgMain },
  header: { backgroundColor: '#8B2500', paddingHorizontal: hs(20), paddingVertical: vs(16), alignItems: 'center' },
  title: { fontSize: ms(20), fontWeight: '700', color: '#FFF' },
  
  container: { padding: hs(20), paddingBottom: vs(40) },
  
  banner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgLight, padding: hs(16), borderRadius: hs(12), marginBottom: vs(24), elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  bannerIcon: { fontSize: ms(36), marginRight: hs(16) },
  bannerTextWrap: { flex: 1 },
  bannerTitle: { fontSize: ms(16), fontWeight: '700', color: colors.textPrimary, marginBottom: vs(2) },
  bannerSub: { fontSize: ms(13), color: colors.textSecond },

  sectionTitle: { fontSize: ms(18), fontWeight: '700', color: colors.textPrimary, marginBottom: vs(16) },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: vs(24) },
  actionCard: { width: '48%', backgroundColor: colors.bgLight, borderRadius: hs(12), padding: hs(16), alignItems: 'center', marginBottom: vs(16), elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3 },
  iconBox: { width: hs(56), height: hs(56), borderRadius: hs(28), alignItems: 'center', justifyContent: 'center', marginBottom: vs(12) },
  actionIcon: { fontSize: ms(24) },
  actionText: { fontSize: ms(14), fontWeight: '600', color: colors.textPrimary },

  taskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgLight, borderRadius: hs(12), padding: hs(16), marginBottom: vs(12), borderWidth: 1, borderColor: colors.border },
  taskIconBox: { width: hs(44), height: hs(44), borderRadius: hs(12), alignItems: 'center', justifyContent: 'center', marginRight: hs(16) },
  taskIcon: { fontSize: ms(20) },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: ms(15), fontWeight: '600', color: colors.textPrimary, marginBottom: vs(2) },
  taskTime: { fontSize: ms(13), color: colors.textSecond },
  checkBtn: { width: hs(32), height: hs(32), borderRadius: hs(16), borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }
});

export default ManagementScreen;
