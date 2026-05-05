import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchEvents } from '../../store/slices/eventSlice';
import { colors } from '../../theme/colors';
import { hs, vs, ms } from '../../theme/scale';

const EventCalendarScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { events, loading } = useSelector((state: RootState) => state.events);

  useEffect(() => {
    dispatch(fetchEvents('2026-04')); // Fetch events for April 2026 for demo
  }, [dispatch]);

  const upcomingEvents = events.filter((e: any) => new Date(e.event_date) >= new Date());

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgMain} />
      
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Event calendar</Text>
          <View style={styles.monthBadge}>
            <Text style={styles.monthBadgeText}>April 2026</Text>
          </View>
        </View>

        {/* Calendar Nav */}
        <View style={styles.calNav}>
          <TouchableOpacity style={styles.navBtn}><Text style={styles.navIcon}>‹</Text></TouchableOpacity>
          <Text style={styles.monthYear}>April 2026</Text>
          <TouchableOpacity style={styles.navBtn}><Text style={styles.navIcon}>›</Text></TouchableOpacity>
        </View>

        {/* Calendar Grid (Mock representation, dynamic dates logic omitted for brevity) */}
        <View style={styles.calGrid}>
          <View style={styles.calRow}>
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <Text key={i} style={styles.dayHeader}>{d}</Text>
            ))}
          </View>
          <View style={styles.calRow}>
            <Text style={styles.dayEmpty}></Text>
            <Text style={styles.dayEmpty}></Text>
            <Text style={styles.dayEmpty}></Text>
            <Text style={styles.dayText}>1</Text>
            <Text style={styles.dayText}>2</Text>
            <View style={[styles.dayContainer, { backgroundColor: colors.bgLight }]}><Text style={[styles.dayText, { color: colors.orangeLight }]}>3</Text></View>
            <Text style={styles.dayText}>4</Text>
          </View>
          <View style={styles.calRow}>
            <Text style={styles.dayText}>5</Text>
            <View style={[styles.dayContainer, { backgroundColor: colors.bgLight, borderWidth: 1, borderColor: colors.primary }]}><Text style={[styles.dayText, { color: colors.primary }]}>6</Text></View>
            <Text style={styles.dayText}>7</Text>
            <Text style={styles.dayText}>8</Text>
            <Text style={styles.dayText}>9</Text>
            <Text style={styles.dayText}>10</Text>
            <Text style={styles.dayText}>11</Text>
          </View>
          <View style={styles.calRow}>
            <Text style={styles.dayText}>12</Text>
            <Text style={styles.dayText}>13</Text>
            <Text style={styles.dayText}>14</Text>
            <View style={[styles.dayContainer, { backgroundColor: '#C0392B' }]}><Text style={[styles.dayText, { color: colors.textPrimary }]}>15</Text></View>
            <Text style={styles.dayText}>16</Text>
            <Text style={styles.dayText}>17</Text>
            <Text style={styles.dayText}>18</Text>
          </View>
          <View style={styles.calRow}>
            <Text style={styles.dayText}>19</Text>
            <View style={styles.dayContainer}><Text style={[styles.dayText, { color: colors.textPrimary, fontSize: ms(20), fontWeight: '700' }]}>20</Text></View>
            <View style={styles.dayContainer}><Text style={[styles.dayText, { color: colors.textPrimary, fontSize: ms(20), fontWeight: '700' }]}>21</Text></View>
            <Text style={styles.dayText}>22</Text>
            <Text style={styles.dayText}>23</Text>
            <Text style={styles.dayText}>24</Text>
            <Text style={styles.dayText}>25</Text>
          </View>
          <View style={styles.calRow}>
            <View style={[styles.dayContainer, { backgroundColor: colors.primary }]}><Text style={[styles.dayText, { color: colors.textPrimary }]}>26</Text></View>
            <Text style={styles.dayText}>27</Text>
            <Text style={styles.dayText}>28</Text>
            <Text style={styles.dayText}>29</Text>
            <Text style={styles.dayText}>30</Text>
            <Text style={styles.dayEmpty}></Text>
            <Text style={styles.dayEmpty}></Text>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { borderColor: colors.primary }]} /><Text style={styles.legendText}>Event</Text>
          <View style={[styles.legendDot, { backgroundColor: '#C0392B', borderWidth: 0 }]} /><Text style={styles.legendText}>Holiday</Text>
          <View style={[styles.legendDot, { backgroundColor: colors.primary, borderWidth: 0 }]} /><Text style={styles.legendText}>Today</Text>
        </View>

        <Text style={styles.sectionTitle}>Upcoming</Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          upcomingEvents.map((event: any) => {
            const date = new Date(event.event_date);
            const day = date.getDate();
            const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
            
            let badgeBg = colors.bgLight;
            let badgeText = colors.primary;
            if (event.event_type === 'Exam') {
              badgeBg = colors.bgLight;
              badgeText = colors.orangeLight;
            } else if (event.event_type === 'Holiday') {
              badgeBg = '#3A1E1E';
              badgeText = '#E74C3C';
            }

            return (
              <View key={event.id} style={styles.eventItem}>
                <View style={styles.dateBox}>
                  <Text style={styles.dateDay}>{day}</Text>
                  <Text style={styles.dateMonth}>{month}</Text>
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDesc}>{event.description}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                  <Text style={[styles.badgeText, { color: badgeText }]}>{event.event_type}</Text>
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
  container: { padding: hs(24), paddingBottom: vs(40) },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(32) },
  headerTitle: { color: colors.textPrimary, fontSize: ms(24), fontWeight: '700' },
  monthBadge: { backgroundColor: colors.bgLight, paddingHorizontal: hs(12), paddingVertical: vs(6), borderRadius: hs(16), borderWidth: 1, borderColor: colors.border },
  monthBadgeText: { color: colors.primary, fontWeight: '600' },
  calNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(24) },
  navBtn: { width: hs(32), height: hs(32), borderRadius: hs(16), backgroundColor: colors.bgLight, alignItems: 'center', justifyContent: 'center' },
  navIcon: { color: colors.textPrimary, fontSize: ms(18) },
  monthYear: { color: colors.textPrimary, fontSize: ms(16), fontWeight: '600' },
  calGrid: { marginBottom: vs(24) },
  calRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: vs(16) },
  dayHeader: { width: '14%', textAlign: 'center', color: colors.textSecond, fontSize: ms(12), fontWeight: '600' },
  dayEmpty: { width: '14%' },
  dayContainer: { width: '14%', aspectRatio: 1, borderRadius: hs(8), alignItems: 'center', justifyContent: 'center' },
  dayText: { width: '14%', textAlign: 'center', color: colors.textSecond, fontSize: ms(14), fontWeight: '500' },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: vs(40) },
  legendDot: { width: hs(8), height: hs(8), borderRadius: hs(4), borderWidth: 1, marginRight: hs(8) },
  legendText: { color: colors.textLight, fontSize: ms(12), marginRight: hs(24) },
  sectionTitle: { color: colors.textPrimary, fontSize: ms(18), fontWeight: '600', marginBottom: vs(16) },
  eventItem: { flexDirection: 'row', alignItems: 'center', marginBottom: vs(24) },
  dateBox: { width: hs(48), alignItems: 'center' },
  dateDay: { color: colors.textPrimary, fontSize: ms(20), fontWeight: '700' },
  dateMonth: { color: colors.textLight, fontSize: ms(12), fontWeight: '600' },
  eventInfo: { flex: 1, marginLeft: hs(16) },
  eventTitle: { color: colors.textPrimary, fontSize: ms(16), fontWeight: '600', marginBottom: vs(4) },
  eventDesc: { color: colors.textSecond, fontSize: ms(13) },
  badge: { paddingHorizontal: hs(12), paddingVertical: vs(6), borderRadius: hs(12) },
  badgeText: { fontSize: ms(12), fontWeight: '600' }
});

export default EventCalendarScreen;
