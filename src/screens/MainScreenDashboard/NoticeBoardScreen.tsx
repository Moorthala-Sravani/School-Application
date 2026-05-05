import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import ErrorView from '../../components/common/ErrorView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchEvents } from '../../store/slices/eventSlice';
import { colors } from '../../theme/colors';
import { hs, vs, ms } from '../../theme/scale';

const NoticeBoardScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { events, loading, error } = useSelector((state: RootState) => state.events);

  useEffect(() => {
    dispatch(fetchEvents('04')); // Fetching for April as example
  }, [dispatch]);


  const getIcon = (type: string) => {
    switch (type) {
      case 'event': return '🏆';
      case 'exam': return '📝';
      case 'academic': return '🔬';
      case 'holiday': return '🏖️';
      default: return '📌';
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1ABC9C" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notice Board</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Important Notice Banner */}
        <View style={styles.alertBanner}>
          <Text style={styles.alertIcon}>⚠️</Text>
          <View style={styles.alertTextWrap}>
            <Text style={styles.alertTitle}>Important Update</Text>
            <Text style={styles.alertBody}>School will remain closed tomorrow due to heavy rainfall warning. Online classes will be conducted.</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Upcoming Events</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#1ABC9C" style={{ marginTop: vs(20) }} />
        ) : error ? (
          <ErrorView message={error} onRetry={() => dispatch(fetchEvents('04'))} accentColor="#1ABC9C" />
        ) : events.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: vs(20), color: colors.textSecond }}>No events scheduled for this month.</Text>
        ) : (
          <View style={styles.timeline}>
            {events.map((ev, index) => {
              const dateObj = new Date(ev.date);
              const formattedDate = isNaN(dateObj.getTime()) ? ev.date : dateObj.toLocaleDateString();
              const color = ev.type === 'exam' ? '#E74C3C' : ev.type === 'holiday' ? '#2ECC71' : '#3498DB';
              
              return (
                <View key={ev.id} style={styles.eventItem}>
                  {index !== events.length - 1 && <View style={styles.timelineLine} />}
                  
                  <View style={[styles.eventDot, { backgroundColor: color }]}>
                    <Text style={styles.eventDotIcon}>{getIcon(ev.type)}</Text>
                  </View>

                  <View style={styles.eventCard}>
                    <Text style={[styles.eventTitle, { color: color }]}>{ev.title}</Text>
                    <Text style={styles.eventBody}>{ev.description}</Text>
                    <View style={styles.eventMetaRow}>
                      <Text style={styles.eventMetaText}>📅 {formattedDate}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgMain },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1ABC9C', paddingHorizontal: hs(16), paddingVertical: vs(12) },
  backBtn: { padding: 6 },
  backIcon: { fontSize: 34, color: '#FFF', lineHeight: 34, marginTop: -4 },
  title: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  container: { padding: hs(20), paddingBottom: vs(40) },
  
  alertBanner: { flexDirection: 'row', backgroundColor: '#FFF5F5', padding: hs(16), borderRadius: hs(12), borderWidth: 1, borderColor: '#FFDCDC', marginBottom: vs(24) },
  alertIcon: { fontSize: ms(24), marginRight: hs(12) },
  alertTextWrap: { flex: 1 },
  alertTitle: { fontSize: ms(15), fontWeight: '700', color: '#E74C3C', marginBottom: vs(4) },
  alertBody: { fontSize: ms(13), color: colors.textPrimary, lineHeight: vs(20) },

  sectionTitle: { fontSize: ms(18), fontWeight: '700', color: colors.textPrimary, marginBottom: vs(20) },

  timeline: { paddingLeft: hs(8) },
  eventItem: { flexDirection: 'row', marginBottom: vs(24), position: 'relative' },
  timelineLine: { position: 'absolute', left: hs(23), top: vs(48), bottom: -vs(32), width: 2, backgroundColor: '#E0E0E0', zIndex: -1 },
  
  eventDot: { width: hs(48), height: hs(48), borderRadius: hs(24), alignItems: 'center', justifyContent: 'center', marginRight: hs(16), borderWidth: 4, borderColor: colors.bgMain },
  eventDotIcon: { fontSize: ms(20) },
  
  eventCard: { flex: 1, backgroundColor: colors.bgLight, padding: hs(16), borderRadius: hs(12), elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  eventTitle: { fontSize: ms(16), fontWeight: '700', marginBottom: vs(4) },
  eventBody: { fontSize: ms(13), color: colors.textPrimary, marginBottom: vs(8) },
  eventMetaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  eventMetaText: { fontSize: ms(12), color: colors.textSecond, fontWeight: '500' }
});

export default NoticeBoardScreen;
