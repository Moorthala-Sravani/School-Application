import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchTimetable } from '../../store/slices/timetableSlice';
import { colors } from '../../theme/colors';
import { hs, vs, ms } from '../../theme/scale';

const TeacherTimetableScreen = ({ navigation }: any) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const [activeDay, setActiveDay] = useState('Mon');
  const dispatch = useDispatch<AppDispatch>();
  const { timetable, loading, error } = useSelector((state: RootState) => state.timetable);

  useEffect(() => {
    dispatch(fetchTimetable(activeDay));
  }, [dispatch, activeDay]);



  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#8E44AD" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Timetable</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Day Selector */}
      <View style={styles.daySelector}>
        {days.map(day => (
          <TouchableOpacity 
            key={day} 
            style={[styles.dayBtn, activeDay === day && styles.dayBtnActive]}
            onPress={() => setActiveDay(day)}
          >
            <Text style={[styles.dayText, activeDay === day && styles.dayTextActive]}>{day}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {loading ? (
          <ActivityIndicator size="large" color="#8E44AD" style={{ marginTop: vs(20) }} />
        ) : error ? (
          <Text style={{ color: 'red', textAlign: 'center', marginTop: vs(20) }}>{error}</Text>
        ) : timetable.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: vs(20), color: colors.textSecond }}>No classes scheduled for {activeDay}.</Text>
        ) : (
          timetable.map((item: any, index: number) => {
            const isBreak = item.is_break === 1 || item.is_break === true;
            const color = ['#3498DB', '#9B59B6', '#F1C40F', '#E74C3C', '#2ECC71'][index % 5];
            
            if (isBreak) {
              return (
                <View key={index} style={styles.breakCard}>
                  <Text style={styles.breakText}>☕ {item.start_time} - {item.end_time} • {item.subject || 'Break'}</Text>
                </View>
              );
            }

            return (
              <View key={index} style={styles.periodCard}>
                <View style={[styles.periodSidebar, { backgroundColor: color }]} />
                <View style={styles.periodContent}>
                  <View style={styles.periodHeaderRow}>
                    <View style={[styles.periodBadge, { backgroundColor: `${color}20` }]}>
                      <Text style={[styles.periodBadgeText, { color: color }]}>Period {item.period_number}</Text>
                    </View>
                    <Text style={styles.periodTime}>{item.start_time} - {item.end_time}</Text>
                  </View>
                  
                  <Text style={styles.subjectName}>{item.subject}</Text>
                  
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailText}>🏫 Class {item.class_section}</Text>
                    <Text style={styles.detailText}>📍 {item.room}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgMain },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#8E44AD', paddingHorizontal: hs(16), paddingVertical: vs(12) },
  backBtn: { padding: 6 },
  backIcon: { fontSize: 34, color: '#FFF', lineHeight: 34, marginTop: -4 },
  title: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  
  daySelector: { flexDirection: 'row', backgroundColor: '#8E44AD', paddingHorizontal: hs(16), paddingBottom: vs(16) },
  dayBtn: { flex: 1, alignItems: 'center', paddingVertical: vs(12), borderBottomWidth: 3, borderBottomColor: 'transparent' },
  dayBtnActive: { borderBottomColor: '#FFF' },
  dayText: { color: 'rgba(255,255,255,0.6)', fontSize: ms(14), fontWeight: '600' },
  dayTextActive: { color: '#FFF', fontWeight: '800' },

  container: { padding: hs(20), paddingBottom: vs(40) },
  
  breakCard: { backgroundColor: '#F2F4F4', paddingVertical: vs(16), borderRadius: hs(12), alignItems: 'center', marginBottom: vs(16), borderStyle: 'dashed', borderWidth: 1, borderColor: '#BDC3C7' },
  breakText: { fontSize: ms(14), color: '#7F8C8D', fontWeight: '600' },

  periodCard: { flexDirection: 'row', backgroundColor: colors.bgLight, borderRadius: hs(12), marginBottom: vs(16), overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3 },
  periodSidebar: { width: hs(8), height: '100%' },
  periodContent: { flex: 1, padding: hs(16) },
  
  periodHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(8) },
  periodBadge: { paddingHorizontal: hs(10), paddingVertical: vs(4), borderRadius: hs(8) },
  periodBadgeText: { fontSize: ms(11), fontWeight: '700' },
  periodTime: { fontSize: ms(12), color: colors.textSecond, fontWeight: '600' },
  
  subjectName: { fontSize: ms(18), fontWeight: '800', color: colors.textPrimary, marginBottom: vs(12) },
  
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: vs(12) },
  detailText: { fontSize: ms(13), color: colors.textSecond, fontWeight: '500' }
});

export default TeacherTimetableScreen;
