import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { hs, ms, vs } from '../../theme/scale';
import { colors } from '../../theme/colors';
import api from '../../config/api';

const FILTERS = ['Arts', 'Music', 'Science', 'Tech', 'Social'];

const AdminActivitiesScreen = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [activeFilter, setActiveFilter] = useState('Arts');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [clubs, setClubs] = useState([
    { id: '1', icon: '🎨', name: 'Fine Arts Club', mentor: 'Ms. Riya', members: 36, seats: 40 },
    { id: '2', icon: '🎵', name: 'School Band', mentor: 'Mr. Joel', members: 28, seats: 30 },
    { id: '3', icon: '💻', name: 'Coding Club', mentor: 'Ms. Sana', members: 42, seats: 45 },
  ]);
  const [events, setEvents] = useState([
    { date: '06 MAY', title: 'Art Exhibition', category: 'Arts' },
    { date: '11 MAY', title: 'Band Performance', category: 'Music' },
    { date: '16 MAY', title: 'Junior Hackathon', category: 'Tech' },
  ]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
        const [overviewRes, clubsRes, eventsRes] = await Promise.allSettled([
          api.get('/activities/overview', config),
          api.get('/activities/clubs', config),
          api.get('/activities/events/upcoming', config),
        ]);

        if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value.data);
        if (clubsRes.status === 'fulfilled' && Array.isArray(clubsRes.value.data) && clubsRes.value.data.length > 0) {
          setClubs(clubsRes.value.data.map((c: any, idx: number) => ({
            id: String(c.id || idx),
            icon: c.icon || '🎯',
            name: c.name || c.club || 'Club',
            mentor: c.mentor || c.faculty || 'Mentor',
            members: Number(c.members || c.enrolled || 0),
            seats: Number(c.seats || c.capacity || 1),
          })));
        }
        if (eventsRes.status === 'fulfilled' && Array.isArray(eventsRes.value.data) && eventsRes.value.data.length > 0) {
          setEvents(eventsRes.value.data.slice(0, 8).map((e: any) => ({
            date: new Date(e.date || e.eventDate || Date.now()).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }).toUpperCase(),
            title: e.title || e.event || 'Club Event',
            category: e.category || e.type || 'General',
          })));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, [token]);

  const stats = useMemo(() => ({
    clubs: Number(overview?.activeClubs || clubs.length || 14),
    students: Number(overview?.studentsEnrolled || clubs.reduce((sum, c) => sum + c.members, 0) || 322),
    events: Number(overview?.eventsThisMonth || events.length || 9),
    mentors: Number(overview?.facultyMentors || clubs.length || 18),
  }), [clubs, events.length, overview]);

  const badgeFor = (members: number, seats: number) => {
    const pct = (members / seats) * 100;
    if (pct >= 100) return { label: 'Full', bg: '#FEE2E2', text: '#B91C1C' };
    if (pct >= 85) return { label: 'Almost Full', bg: '#FEF3C7', text: '#B45309' };
    return { label: 'Open', bg: '#DCFCE7', text: '#15803D' };
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}><Text style={styles.title}>Activities</Text></View>
      <ScrollView contentContainerStyle={styles.container}>
        {loading ? <ActivityIndicator color="#2C3E50" style={{ marginBottom: vs(10) }} /> : null}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}><Text style={styles.statLabel}>Active Clubs</Text><Text style={styles.statValue}>{stats.clubs}</Text></View>
          <View style={styles.statCard}><Text style={styles.statLabel}>Students Enrolled</Text><Text style={styles.statValue}>{stats.students}</Text></View>
          <View style={styles.statCard}><Text style={styles.statLabel}>Events This Month</Text><Text style={styles.statValue}>{stats.events}</Text></View>
          <View style={styles.statCard}><Text style={styles.statLabel}>Faculty Mentors</Text><Text style={styles.statValue}>{stats.mentors}</Text></View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow} contentContainerStyle={{ paddingRight: hs(8) }}>
          {FILTERS.map((item) => (
            <TouchableOpacity key={item} style={[styles.filterPill, item === activeFilter && styles.filterPillActive]} onPress={() => setActiveFilter(item)}>
              <Text style={[styles.filterText, item === activeFilter && styles.filterTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Clubs</Text>
        <View style={styles.sectionCard}>
          {clubs.map((club) => {
            const badge = badgeFor(club.members, club.seats);
            const pct = Math.round((club.members / club.seats) * 100);
            return (
              <View key={club.id} style={styles.clubCard}>
                <View style={styles.clubTop}>
                  <Text style={styles.clubTitle}>{club.icon} {club.name}</Text>
                  <View style={[styles.capacityBadge, { backgroundColor: badge.bg }]}><Text style={[styles.capacityText, { color: badge.text }]}>{badge.label}</Text></View>
                </View>
                <Text style={styles.clubMeta}>{club.mentor}  |  {club.members}/{club.seats} members</Text>
                <View style={styles.bar}><View style={[styles.fill, { width: `${Math.min(pct, 100)}%` }]} /></View>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        <View style={styles.sectionCard}>
          {events.map((event) => (
            <View key={event.title} style={styles.eventRow}>
              <View style={styles.dateCard}><Text style={styles.dateText}>{event.date}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <View style={styles.categoryBadge}><Text style={styles.categoryText}>{event.category}</Text></View>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.addBtn}>
          <Text style={styles.addBtnText}>Add New Club</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgMain },
  header: { backgroundColor: '#2C3E50', paddingHorizontal: hs(20), paddingVertical: vs(16), alignItems: 'center' },
  title: { fontSize: ms(20), color: '#FFF', fontWeight: '700' },
  container: { padding: hs(20), paddingBottom: vs(40) },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: vs(14) },
  statCard: { width: '48%', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: hs(12), padding: hs(14), marginBottom: vs(10) },
  statLabel: { fontSize: ms(12), color: '#64748B', marginBottom: vs(4) },
  statValue: { fontSize: ms(20), color: '#0F172A', fontWeight: '700' },
  pillRow: { marginBottom: vs(14) },
  filterPill: { paddingHorizontal: hs(14), paddingVertical: vs(8), borderRadius: hs(16), backgroundColor: '#EEF2F7', marginRight: hs(8) },
  filterPillActive: { backgroundColor: '#2563EB' },
  filterText: { fontSize: ms(12), color: '#334155', fontWeight: '700' },
  filterTextActive: { color: '#FFF' },
  sectionTitle: { fontSize: ms(17), fontWeight: '700', color: '#1E293B', marginBottom: vs(10) },
  sectionCard: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: hs(12), padding: hs(12), marginBottom: vs(14) },
  clubCard: { marginBottom: vs(12) },
  clubTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clubTitle: { fontSize: ms(14), fontWeight: '700', color: '#0F172A' },
  capacityBadge: { borderRadius: hs(10), paddingHorizontal: hs(8), paddingVertical: vs(3) },
  capacityText: { fontSize: ms(10), fontWeight: '700' },
  clubMeta: { fontSize: ms(12), color: '#64748B', marginTop: vs(4), marginBottom: vs(6) },
  bar: { height: vs(8), backgroundColor: '#E5E7EB', borderRadius: hs(8), overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#2563EB' },
  eventRow: { flexDirection: 'row', marginBottom: vs(10) },
  dateCard: { width: hs(64), height: hs(50), backgroundColor: '#EEF2FF', borderRadius: hs(10), alignItems: 'center', justifyContent: 'center', marginRight: hs(10) },
  dateText: { fontSize: ms(12), color: '#3730A3', fontWeight: '700', textAlign: 'center' },
  eventTitle: { fontSize: ms(14), fontWeight: '700', color: '#0F172A', marginBottom: vs(4) },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#DBEAFE', borderRadius: hs(8), paddingHorizontal: hs(8), paddingVertical: vs(2) },
  categoryText: { fontSize: ms(10), color: '#1D4ED8', fontWeight: '700' },
  addBtn: { backgroundColor: '#16A34A', borderRadius: hs(10), alignItems: 'center', paddingVertical: vs(12) },
  addBtnText: { color: '#FFF', fontSize: ms(14), fontWeight: '700' },
});

export default AdminActivitiesScreen;
