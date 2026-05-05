import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { sendMessage } from '../../store/slices/messageSlice';
import api from '../../config/api';
import { colors } from '../../theme/colors';
import { hs, vs, ms } from '../../theme/scale';

const AdminLeaveScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector((state: RootState) => state.auth.token);
  
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('Pending');
  
  const [rejectModalVis, setRejectModalVis] = useState(false);
  const [activeReqId, setActiveReqId] = useState<number | null>(null);
  const [reasonTxt, setReasonTxt] = useState('');

  // ⚡ Simulated React Native Polling exactly as previously utilized 
  useEffect(() => {
    fetchRequests();
    const intervalId = setInterval(fetchRequests, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/attendance/teacher-leaves', { headers: { Authorization: `Bearer ${token}` } });
      let data = res.data || [];
      // Filter natively to ONLY show requests bounded by teacher authorization (or fallback)
      data = data.filter((r: any) => {
        const s = String(r.teacherStatus || r.status || '').toLowerCase();
        return s.includes('approv') || s === 'leave_approved';
      });
      data.sort((a: any, b: any) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime());
      
      setRequests(data);
      if (loading) setLoading(false);
    } catch {
      if (loading) setLoading(false);
    }
  };

  const pendingCount = requests.filter(r => String(r.adminStatus || 'waiting').toLowerCase() === 'waiting').length;
  const approvedCount = requests.filter(r => String(r.adminStatus || '').toLowerCase().includes('approv')).length;
  const rejectedCount = requests.filter(r => String(r.adminStatus || '').toLowerCase().includes('reject')).length;

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const s = String(r.adminStatus || 'waiting').toLowerCase();
      if (filter === 'All') return true;
      if (filter === 'Pending') return s === 'waiting';
      if (filter === 'Approved') return s.includes('approv');
      if (filter === 'Rejected') return s.includes('reject');
      return true;
    });
  }, [requests, filter]);

  const processStatusUpdate = async (id: number, status: string, comment: string = '') => {
    try {
      const req = requests.find(r => r.id === id);
      const conf = { headers: { Authorization: `Bearer ${token}` } };
      
      const payload = { adminStatus: status, adminComment: comment, status: status === 'approved' ? 'leave' : 'absent' };
      try {
        await api.put(`/attendance/teacher-leaves/${id}`, payload, conf);
      } catch (e) {
        await api.put(`/attendance/${id}/admin-status`, payload, conf);
      }

      // Notify dynamically through global message stream over REST
      const pContent = status === 'approved' 
        ? `Admin has approved ${req.student_name || 'your child'}'s leave. Attendance automatically updated.`
        : `Admin has rejected ${req.student_name || 'your child'}'s leave — Reason: ${comment}`;
      dispatch(sendMessage({ content: pContent, targetRole: 'Parent', class_group: 'Management', title: 'Leave Finalized' }));
      
      const tContent = status === 'approved'
        ? `Admin has approved the leave you forwarded for ${req.student_name || 'student'}`
        : `Admin has rejected the leave you forwarded for ${req.student_name || 'student'} — Reason: ${comment}`;
      dispatch(sendMessage({ content: tContent, targetRole: 'Teacher', class_group: 'Management', title: 'Leave Finalized' }));

      fetchRequests();
    } catch(err) {
      // Failed to update request
    }
  };

  const executeReject = async () => {
    if (!activeReqId || !reasonTxt.trim()) {
       Alert.alert('Validation Check', 'Please enter a rejection reason.');
       return;
    }
    await processStatusUpdate(activeReqId, 'rejected', reasonTxt);
    setRejectModalVis(false);
    setActiveReqId(null);
    setReasonTxt('');
  };

  const bulkApprove = async () => {
     const pendings = requests.filter(r => String(r.adminStatus || 'waiting').toLowerCase() === 'waiting');
     if(pendings.length === 0) return;
     try {
        for (let req of pendings) {
          await processStatusUpdate(req.id, 'approved', 'Bulk approved by Admin');
        }
        Alert.alert('Success', 'Bulk approve operation successful.');
     } catch {
        // Execution error on batch
     }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#2C3E50" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Admin Leave Queue</Text>
        <View style={styles.pendingBadgeWrap}><Text style={styles.pendingBadgeTxt}>{pendingCount}</Text></View>
      </View>

      <View style={styles.statsRow}>
         <View style={styles.statBox}><Text style={styles.statLabel}>Waiting</Text><Text style={[styles.statVal, {color: '#E67E22'}]}>{pendingCount}</Text></View>
         <View style={styles.statBox}><Text style={styles.statLabel}>Approved</Text><Text style={[styles.statVal, {color: '#27AE60'}]}>{approvedCount}</Text></View>
         <View style={styles.statBox}><Text style={styles.statLabel}>Rejected</Text><Text style={[styles.statVal, {color: '#C0392B'}]}>{rejectedCount}</Text></View>
      </View>

      <View style={styles.tabsRow}>
        {['All', 'Pending', 'Approved', 'Rejected'].map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setFilter(tab as any)} style={[styles.tabBtn, filter === tab && styles.tabBtnActive]}>
            <Text style={[styles.tabText, filter === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filter === 'Pending' && pendingCount > 0 && (
         <View style={styles.bulkRow}>
           <Text style={styles.bulkStatsText}>Forwarded Requests: {pendingCount}</Text>
           <TouchableOpacity style={styles.bulkBtn} onPress={bulkApprove}>
              <Text style={styles.bulkTx}>Approve All</Text>
           </TouchableOpacity>
         </View>
      )}

      <ScrollView contentContainerStyle={styles.listContainer}>
        {loading && filteredRequests.length === 0 ? (
           <ActivityIndicator style={{marginTop: 20}} color="#2C3E50" />
        ) : filteredRequests.map(req => {
           const s = String(req.adminStatus || 'waiting').toLowerCase();
           const isW = s === 'waiting';
           return (
             <View key={req.id} style={styles.card}>
               <View style={styles.cardHeader}>
                  <View style={{flex: 1}}>
                    <Text style={styles.stuName}>{req.student_name || req.child_name || req.name || 'Student'} <Text style={{fontWeight: '400', fontSize: ms(13)}}>({req.class || req.class_group || req.child_class || 'N/A'})</Text></Text>
                    <Text style={styles.dateRange}>{(req.leaveType || 'Leave').toUpperCase()} | {req.totalDays || 1}d ({req.fromDate || req.date})</Text>
                  </View>
               </View>
               <View style={styles.cardBody}>
                  <Text style={styles.reasonTx}><Text style={{fontWeight: '700'}}>Parent:</Text> "{req.reason}"</Text>
                  <Text style={[styles.reasonTx, {marginTop: 6}]}><Text style={{fontWeight: '700'}}>Teacher:</Text> "{req.teacherComment || 'Forwarded'}"</Text>
                  {req.documentUrl && <Text style={styles.docLink}>📎 View Parent's Document</Text>}
               </View>

               {isW ? (
                 <View style={styles.actRow}>
                   <TouchableOpacity style={[styles.actBtn, {backgroundColor: '#27AE60'}]} onPress={() => {
                      Alert.prompt('Approve Leave', 'Optional admin comment', [
                         { text: 'Cancel', style: 'cancel' },
                         { text: 'Approve', onPress: (cmnt?: string) => processStatusUpdate(req.id, 'approved', cmnt || '') }
                      ]);
                   }}>
                     <Text style={styles.actBtnTx}>✓ Finalize Approve</Text>
                   </TouchableOpacity>
                   <TouchableOpacity style={[styles.actBtn, {backgroundColor: '#E74C3C'}]} onPress={() => { setActiveReqId(req.id); setRejectModalVis(true); }}>
                     <Text style={styles.actBtnTx}>✗ Finalize Reject</Text>
                   </TouchableOpacity>
                 </View>
               ) : (
                 <View style={styles.resolvedBadge}>
                   <Text style={{color: s.includes('approv') ? '#27AE60' : '#C0392B', fontWeight: '700'}}>
                     {s.includes('approv') ? '✓ Marked leave & approved' : '✗ Denied'}
                   </Text>
                   <Text style={{color: '#7F8C8D', fontSize: ms(12)}}>{req.adminComment}</Text>
                 </View>
               )}
             </View>
           )
        })}
      </ScrollView>

      <Modal visible={rejectModalVis} transparent animationType="fade">
         <View style={styles.modalBg}>
            <View style={styles.modalCard}>
               <Text style={styles.modalTitle}>Admin Rejection Reason</Text>
               <TextInput style={styles.modalInput} placeholder="Visible to Parent & Teacher" value={reasonTxt} onChangeText={setReasonTxt} multiline />
               <View style={styles.modalActions}>
                  <TouchableOpacity onPress={() => setRejectModalVis(false)} style={{padding: 10}}><Text style={{color: '#7F8C8D'}}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity onPress={executeReject} style={{backgroundColor: '#E74C3C', padding: 10, borderRadius: 8}}><Text style={{color: '#FFF'}}>Force Reject</Text></TouchableOpacity>
               </View>
            </View>
         </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F6F7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#2C3E50', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 6 }, backIcon: { fontSize: 34, color: '#FFF', lineHeight: 34, marginTop: -4 },
  title: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  pendingBadgeWrap: { backgroundColor: '#F1C40F', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pendingBadgeTxt: { color: '#000', fontWeight: '700', fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 10, padding: 16 },
  statBox: { flex: 1, backgroundColor: '#FFF', padding: 12, borderRadius: 8, alignItems: 'center', elevation: 1 },
  statLabel: { fontSize: 12, color: '#7F8C8D' }, statVal: { fontSize: 20, fontWeight: '800' },
  tabsRow: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#EAEDED' },
  tabBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: '#2C3E50' }, tabText: { color: '#7F8C8D', fontWeight: '600' }, tabTextActive: { color: '#2C3E50', fontWeight: '700' },
  bulkRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#FFF' },
  bulkStatsText: { color: '#34495E', fontWeight: '700', fontSize: 14, alignSelf: 'center' },
  bulkBtn: { backgroundColor: '#27AE60', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 }, bulkTx: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  listContainer: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 16, elevation: 1 },
  cardHeader: { flexDirection: 'row', marginBottom: 12 },
  stuName: { fontSize: 16, fontWeight: '700', color: '#2C3E50' },
  dateRange: { fontSize: 13, color: '#95A5A6', marginTop: 2 },
  cardBody: { backgroundColor: '#F8F9F9', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#EAEDED' },
  reasonTx: { fontSize: 14, color: '#566573' },
  docLink: { fontSize: 13, color: '#3498DB', marginTop: 8, fontWeight: '600' },
  actRow: { flexDirection: 'row', gap: 10 },
  actBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  actBtnTx: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  resolvedBadge: { backgroundColor: '#EBEDEF', padding: 12, borderRadius: 8 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#2C3E50', marginBottom: 16 },
  modalInput: { height: 80, backgroundColor: '#F2F4F4', borderRadius: 8, padding: 12, textAlignVertical: 'top', color: '#2C3E50', marginBottom: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }
});

export default AdminLeaveScreen;
