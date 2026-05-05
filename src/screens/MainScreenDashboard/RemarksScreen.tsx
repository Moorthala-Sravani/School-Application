import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import ErrorView from '../../components/common/ErrorView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchMessages } from '../../store/slices/messageSlice';
import { colors } from '../../theme/colors';
import { hs, vs, ms } from '../../theme/scale';

const RemarksScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { messages, loading, error } = useSelector((state: RootState) => state.messages);
  const { role } = useSelector((state: RootState) => state.auth);
  const [filter, setFilter] = useState<'All' | 'Positive' | 'Needs Attention'>('All');

  React.useEffect(() => {
    dispatch(fetchMessages(undefined));
  }, [dispatch]);

  const remarks = useMemo(() => {
    return (messages || []).map((message: any) => {
      const text = message.content || '';
      const lower = text.toLowerCase();
      const isNeedsAttention =
        lower.includes('attention') ||
        lower.includes('late') ||
        lower.includes('missing') ||
        lower.includes('absent') ||
        lower.includes('warning') ||
        lower.includes('leave request');

      return {
        id: String(message.id),
        sender: message.sender_name || (role === 'Teacher' ? 'Parent' : 'Teacher'),
        subject: message.title || message.sender_type || 'General',
        date: message.created_at ? new Date(message.created_at).toLocaleDateString() : 'N/A',
        type: isNeedsAttention ? 'Needs Attention' : 'Positive',
        text,
      };
    });
  }, [messages, role]);

  const filteredRemarks = remarks.filter(remark => filter === 'All' || remark.type === filter);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, role === 'Teacher' && { backgroundColor: '#8B2500' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{role === 'Teacher' ? 'Notifications & Remarks' : 'Teacher Remarks'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Filter Chips */}
        <View style={styles.filterContainer}>
          <TouchableOpacity style={[styles.filterChip, filter === 'All' && styles.filterChipActive]} onPress={() => setFilter('All')}>
            <Text style={[styles.filterText, filter === 'All' && styles.filterTextActive]}>All ({remarks.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterChip, filter === 'Positive' && styles.filterChipActive]} onPress={() => setFilter('Positive')}>
            <Text style={[styles.filterText, filter === 'Positive' && styles.filterTextActive]}>Positive</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterChip, filter === 'Needs Attention' && styles.filterChipActive]} onPress={() => setFilter('Needs Attention')}>
            <Text style={[styles.filterText, filter === 'Needs Attention' && styles.filterTextActive]}>Needs Attention</Text>
          </TouchableOpacity>
        </View>

        {loading ? <ActivityIndicator color="#C0392B" style={{ marginVertical: vs(20) }} /> : null}
        {!loading && error ? (
          <ErrorView message={error} onRetry={() => dispatch(fetchMessages(undefined))} accentColor="#C0392B" />
        ) : null}
        {!loading && !error && filteredRemarks.length === 0 ? (
          <Text style={{ color: colors.textSecond, marginBottom: vs(12) }}>No remarks found.</Text>
        ) : null}

        {filteredRemarks.map((remark) => {
          const isPositive = remark.type === 'Positive';
          
          return (
            <View key={remark.id} style={styles.remarkCard}>
              <View style={styles.cardHeader}>
                <View style={styles.teacherInfo}>
                  <View style={styles.avatarWrap}>
                    <Text style={styles.avatarText}>{remark.sender ? remark.sender.charAt(0).toUpperCase() : 'U'}</Text>
                  </View>
                  <View>
                    <Text style={styles.teacherName}>{remark.sender}</Text>
                    <Text style={styles.subjectName}>{remark.subject}</Text>
                  </View>
                </View>
                <Text style={styles.dateText}>{remark.date}</Text>
              </View>
              
              <View style={[styles.typeBadge, { backgroundColor: isPositive ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)' }]}>
                <Text style={[styles.typeIcon, { color: isPositive ? colors.present : colors.absent }]}>
                  {isPositive ? '⭐' : '⚠️'}
                </Text>
                <Text style={[styles.typeText, { color: isPositive ? colors.present : colors.absent }]}>
                  {remark.type}
                </Text>
              </View>

              <View style={styles.bubble}>
                <Text style={styles.remarkText}>"{remark.text}"</Text>
              </View>
              
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionIcon}>👍</Text>
                  <Text style={styles.actionText}>Acknowledge</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Messages')}>
                  <Text style={styles.actionIcon}>💬</Text>
                  <Text style={styles.actionText}>Reply</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgMain },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#C0392B',
    paddingHorizontal: hs(16),
    paddingVertical: vs(12),
  },
  backBtn: { padding: 6 },
  backIcon: { fontSize: 34, color: '#FFF', lineHeight: 34, marginTop: -4 },
  title: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  
  container: { padding: hs(20), paddingBottom: vs(40) },
  
  filterContainer: { flexDirection: 'row', marginBottom: vs(24) },
  filterChip: { paddingHorizontal: hs(16), paddingVertical: vs(8), borderRadius: hs(20), backgroundColor: '#E8DDD0', marginRight: hs(12) },
  filterChipActive: { backgroundColor: '#C0392B' },
  filterText: { fontSize: ms(13), fontWeight: '600', color: '#7A5C44' },
  filterTextActive: { color: '#FFF' },

  remarkCard: { backgroundColor: colors.bgLight, borderRadius: hs(16), padding: hs(16), marginBottom: vs(20), borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: vs(12) },
  teacherInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: { width: hs(40), height: hs(40), borderRadius: hs(20), backgroundColor: '#E8DDD0', alignItems: 'center', justifyContent: 'center', marginRight: hs(12) },
  avatarText: { fontSize: ms(16), fontWeight: '700', color: '#7A5C44' },
  teacherName: { fontSize: ms(16), fontWeight: '700', color: colors.textPrimary },
  subjectName: { fontSize: ms(13), color: colors.textSecond },
  dateText: { fontSize: ms(12), color: colors.textSecond, marginTop: vs(4) },
  
  typeBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: hs(10), paddingVertical: vs(4), borderRadius: hs(12), marginBottom: vs(12) },
  typeIcon: { fontSize: ms(12), marginRight: hs(6) },
  typeText: { fontSize: ms(12), fontWeight: '700' },
  
  bubble: { backgroundColor: '#F9F5F0', borderRadius: hs(12), padding: hs(16), marginBottom: vs(16), borderLeftWidth: 4, borderLeftColor: '#D5C4B3' },
  remarkText: { fontSize: ms(14), color: '#2C1A0E', lineHeight: ms(22), fontStyle: 'italic' },
  
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: vs(12) },
  actionBtn: { flexDirection: 'row', alignItems: 'center', marginRight: hs(24) },
  actionIcon: { fontSize: ms(16), marginRight: hs(6) },
  actionText: { fontSize: ms(13), fontWeight: '600', color: '#7A5C44' },
});

export default RemarksScreen;
