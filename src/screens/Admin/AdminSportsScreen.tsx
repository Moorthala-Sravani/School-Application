import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { hs, ms, vs } from '../../theme/scale';
import { colors } from '../../theme/colors';
import api from '../../config/api';

const AdminSportsScreen = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [teams, setTeams] = useState([
    { sport: 'Football', coach: 'Coach Nair', players: 28, attendance: 92 },
    { sport: 'Cricket', coach: 'Coach Babu', players: 22, attendance: 84 },
    { sport: 'Basketball', coach: 'Coach Das', players: 18, attendance: 76 },
  ]);
  const [events, setEvents] = useState([
    { date: '04 MAY', title: 'Inter-School Football Match', venue: 'vs Green Valley', time: '10:00 AM' },
    { date: '09 MAY', title: 'Cricket League Fixture', venue: 'Main Ground', time: '02:00 PM' },
  ]);
  const [leaders, setLeaders] = useState([
    { name: 'Arjun S', sport: 'Football', stat: '12 goals' },
    { name: 'Sai K', sport: 'Cricket', stat: '278 runs' },
    { name: 'Neha P', sport: 'Basketball', stat: '96 points' },
  ]);

  useEffect(() => {
    const fetchSports = async () => {
      try {
        setLoading(true);
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
        const [overviewRes, teamsRes, eventsRes, performersRes] = await Promise.allSettled([
          api.get('/sports/overview', config),
          api.get('/sports/teams', config),
          api.get('/sports/events/upcoming', config),
          api.get('/sports/top-performers', config),
        ]);

        if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value.data);
        if (teamsRes.status === 'fulfilled' && Array.isArray(teamsRes.value.data) && teamsRes.value.data.length > 0) {
          setTeams(teamsRes.value.data.map((t: any) => ({
            sport: t.sport || t.team || 'Sport',
            coach: t.coach || t.coachName || 'Coach',
            players: Number(t.players || t.playerCount || 0),
            attendance: Number(t.attendance || t.attendancePercent || 0),
          })));
        }
        if (eventsRes.status === 'fulfilled' && Array.isArray(eventsRes.value.data) && eventsRes.value.data.length > 0) {
          setEvents(eventsRes.value.data.slice(0, 6).map((e: any) => ({
            date: new Date(e.date || e.eventDate || Date.now()).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }).toUpperCase(),
            title: e.title || e.event || 'Sports Event',
            venue: e.venue || e.opponent || 'School Ground',
            time: e.time || '10:00 AM',
          })));
        }
        if (performersRes.status === 'fulfilled' && Array.isArray(performersRes.value.data) && performersRes.value.data.length > 0) {
          setLeaders(performersRes.value.data.slice(0, 3).map((p: any) => ({
            name: p.name || p.student || 'Student',
            sport: p.sport || 'Sport',
            stat: p.stat || p.metric || 'Top Performer',
          })));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSports();
  }, [token]);

  const statValues = useMemo(() => ({
    activeSports: Number(overview?.activeSports || teams.length || 8),
    enrolledStudents: Number(overview?.studentsEnrolled || teams.reduce((sum, t) => sum + t.players, 0) || 214),
    upcomingEvents: Number(overview?.upcomingEvents || events.length || 6),
    coaches: Number(overview?.coaches || teams.length || 12),
  }), [events.length, overview, teams]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}><Text style={styles.title}>Sports</Text></View>
      <ScrollView contentContainerStyle={styles.container}>
        {loading ? <ActivityIndicator color="#2C3E50" style={{ marginBottom: vs(12) }} /> : null}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}><Text style={styles.statLabel}>Active Sports</Text><Text style={styles.statValue}>{statValues.activeSports}</Text></View>
          <View style={styles.statCard}><Text style={styles.statLabel}>Enrolled Students</Text><Text style={styles.statValue}>{statValues.enrolledStudents}</Text></View>
          <View style={styles.statCard}><Text style={styles.statLabel}>Upcoming Events</Text><Text style={styles.statValue}>{statValues.upcomingEvents}</Text></View>
          <View style={styles.statCard}><Text style={styles.statLabel}>Coaches</Text><Text style={styles.statValue}>{statValues.coaches}</Text></View>
        </View>

        <Text style={styles.sectionTitle}>Teams</Text>
        <View style={styles.sectionCard}>
          {teams.map((team) => (
            <View key={team.sport} style={styles.teamRow}>
              <Text style={styles.teamTitle}>{team.sport}</Text>
              <Text style={styles.teamMeta}>{team.coach}  |  {team.players} players</Text>
              <View style={styles.bar}><View style={[styles.fill, { width: `${team.attendance}%` }]} /></View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        <View style={styles.sectionCard}>
          {events.map((event) => (
            <View key={event.title} style={styles.eventRow}>
              <View style={styles.dateCard}><Text style={styles.dateText}>{event.date}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventMeta}>{event.venue}  |  {event.time}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Top Performers</Text>
        <View style={styles.sectionCard}>
          {leaders.map((item, i) => (
            <Text key={item.name} style={styles.leader}>{i + 1}. {item.name}  -  {item.sport}  -  {item.stat}</Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgMain },
  header: { backgroundColor: '#2C3E50', paddingHorizontal: hs(20), paddingVertical: vs(16), alignItems: 'center' },
  title: { fontSize: ms(20), color: '#FFF', fontWeight: '700' },
  container: { padding: hs(20), paddingBottom: vs(40) },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: vs(18) },
  statCard: { width: '48%', backgroundColor: '#FFF', borderRadius: hs(12), borderWidth: 1, borderColor: '#E2E8F0', padding: hs(14), marginBottom: vs(12) },
  statLabel: { fontSize: ms(12), color: '#64748B', marginBottom: vs(4) },
  statValue: { fontSize: ms(20), color: '#0F172A', fontWeight: '700' },
  sectionTitle: { fontSize: ms(17), fontWeight: '700', color: '#1E293B', marginBottom: vs(10) },
  sectionCard: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: hs(12), padding: hs(12), marginBottom: vs(16) },
  teamRow: { marginBottom: vs(12) },
  teamTitle: { fontSize: ms(14), color: '#0F172A', fontWeight: '700' },
  teamMeta: { fontSize: ms(12), color: '#64748B', marginBottom: vs(6) },
  bar: { height: vs(8), backgroundColor: '#E5E7EB', borderRadius: hs(8), overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#22C55E' },
  eventRow: { flexDirection: 'row', marginBottom: vs(10) },
  dateCard: { width: hs(62), height: hs(50), backgroundColor: '#EEF2FF', borderRadius: hs(10), alignItems: 'center', justifyContent: 'center', marginRight: hs(10) },
  dateText: { fontSize: ms(12), color: '#3730A3', fontWeight: '700', textAlign: 'center' },
  eventTitle: { fontSize: ms(14), color: '#0F172A', fontWeight: '700' },
  eventMeta: { fontSize: ms(12), color: '#64748B' },
  leader: { fontSize: ms(13), color: '#1E293B', marginBottom: vs(8), fontWeight: '600' },
});

export default AdminSportsScreen;
