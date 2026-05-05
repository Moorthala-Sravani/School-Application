import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchFees } from '../store/slices/feeSlice';
import { fetchHomework } from '../store/slices/homeworkSlice';
import { colors } from '../theme/colors';
import { hs, vs, ms } from '../theme/scale';
import { belongsToParentChild } from '../utils/parentData';

const ParentServicesScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { id: profileId } = useSelector((state: RootState) => state.profile);
  const profile = useSelector((state: RootState) => state.profile);
  const { mobile } = useSelector((state: RootState) => state.auth);
  const auth = useSelector((state: RootState) => state.auth);
  const { fees } = useSelector((state: RootState) => state.fees);
  const { homeworkList } = useSelector((state: RootState) => state.homework);

  const studentKey = profileId ? String(profileId) : mobile;

  React.useEffect(() => {
    dispatch(fetchHomework());
  }, [dispatch]);

  React.useEffect(() => {
    if (studentKey) {
      dispatch(fetchFees(studentKey));
    }
  }, [dispatch, studentKey]);

  const managementTasks = [
    ...fees
      .filter((fee: any) => String(fee.status || '').toLowerCase() !== 'paid')
      .slice(0, 2)
      .map((fee: any, index: number) => ({
        id: `fee-${fee.id ?? index}`,
        title: fee.title || fee.fee_type || 'Fee Payment',
        time: fee.due_date ? `Due ${fee.due_date}` : 'Pending',
        icon: '💰',
        color: '#E74C3C',
      })),
    ...homeworkList.filter((hw: any) => belongsToParentChild(hw, profile, auth)).slice(0, 2).map((hw: any) => ({
      id: `hw-${hw.id}`,
      title: `Homework: ${hw.title || 'Task'}`,
      time: hw.created_at ? new Date(hw.created_at).toLocaleDateString() : 'Recently added',
      icon: '📚',
      color: '#3498DB',
    })),
  ].slice(0, 4);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#2C3E50" />
      <View style={styles.header}>
        <Text style={styles.title}>Services</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.banner}>
          <Text style={styles.bannerIcon}>🗂️</Text>
          <View style={styles.bannerTextWrap}>
            <Text style={styles.bannerTitle}>Parent Services</Text>
            <Text style={styles.bannerSub}>Quick access to essential school services.</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Services</Text>
        <View style={styles.grid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('PayFees')}>
            <View style={[styles.iconBox, { backgroundColor: '#FDEDEC' }]}>
              <Text style={styles.actionIcon}>💳</Text>
            </View>
            <Text style={styles.actionText}>Fee Payment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Attendance')}>
            <View style={[styles.iconBox, { backgroundColor: '#E8F8F5' }]}>
              <Text style={styles.actionIcon}>📅</Text>
            </View>
            <Text style={styles.actionText}>Attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Uniform')}>
            <View style={[styles.iconBox, { backgroundColor: '#EBF5FB' }]}>
              <Text style={styles.actionIcon}>👕</Text>
            </View>
            <Text style={styles.actionText}>Uniform</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('BusLocation')}>
            <View style={[styles.iconBox, { backgroundColor: '#FEF5E7' }]}>
              <Text style={styles.actionIcon}>🚌</Text>
            </View>
            <Text style={styles.actionText}>Transport</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Messages', { screen: 'Messages', params: { contactRole: 'Management' } })}>
            <View style={[styles.iconBox, { backgroundColor: '#E8F8F5' }]}>
              <Text style={styles.actionIcon}>💬</Text>
            </View>
            <Text style={styles.actionText}>Contact Admin</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Pending Action Items</Text>
        {managementTasks.length === 0 ? (
          <Text style={styles.taskTime}>No pending action items.</Text>
        ) : null}
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
  header: { backgroundColor: '#2C3E50', paddingHorizontal: hs(20), paddingVertical: vs(16), alignItems: 'center' },
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

export default ParentServicesScreen;
