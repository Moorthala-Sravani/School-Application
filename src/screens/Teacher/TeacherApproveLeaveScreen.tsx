import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchAttendance } from '../../store/slices/attendanceSlice';
import { sendMessage } from '../../store/slices/messageSlice';
import api from '../../config/api';
import { ms } from '../../theme/scale';

const TeacherApproveLeaveScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector((state: RootState) => state.auth.token);
  const { records, loading } = useSelector((state: RootState) => state.attendance);
  
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('Pending');
  
  const [rejectModalVis, setRejectModalVis] = useState(false);
  const [activeReqId, setActiveReqId] = useState<number | null>(null);
  const [reasonTxt, setReasonTxt] = useState('');
  
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    dispatch(fetchAttendance());
    const intervalId = setInterval(() => dispatch(fetchAttendance()), 5000);
    return () => clearInterval(intervalId);
  }, [dispatch]);

  const requests = useMemo(() => {
    return (records || []).filter((r: any) => r.status && r.status.includes('leave'))
  }, [records]);

  const pendingCount = requests.filter(r => String(r.teacherStatus || r.status || 'pending').toLowerCase() === 'leave_pending' || String(r.teacherStatus || r.status || '').toLowerCase() === 'pending').length;
  const approvedCount = requests.filter(r => String(r.teacherStatus || r.status || '').toLowerCase().includes('approv')).length;
  const rejectedCount = requests.filter(r => String(r.teacherStatus || r.status || '').toLowerCase().includes('reject')).length;

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const s = String(r.teacherStatus || r.status || 'pending').toLowerCase();
      if (filter === 'All') return true;
      if (filter === 'Pending') return s === 'leave_pending' || s === 'pending';
      if (filter === 'Approved') return s.includes('approv');
      if (filter === 'Rejected') return s.includes('reject');
      return true;
    });
  }, [requests, filter]);

  const toggleSelect = (id: number) => {
    const newS = new Set(selectedIds);
    if (newS.has(id)) newS.delete(id);
    else newS.add(id);
    setSelectedIds(newS);
  };

  const processStatusUpdate = async (id: number, status: string, comment: string = '') => {
    try {
      const req = requests.find(r => r.id === id);
      if (!req) {
        throw new Error('Leave request not found');
      }
      const conf = { headers: { Authorization: `Bearer ${token}` } };
      
      // Attempt REST push backwards compatible with old node.js routing
      const payload = { status, teacherStatus: status, teacherComment: comment, adminStatus: 'waiting' };
      try {
        await api.put(`/attendance/parent-leaves/${id}`, payload, conf);
      } catch (e) {
        await api.put(`/attendance/${id}/status`, payload, conf);
      }

      // FCM notifications mappings over chat logic
      const parentMsg = status === 'leave_approved' || status.includes('approv')
        ? `Teacher has approved ${req.student_name || 'your child'}'s leave request for ${req.date || req.fromDate}`
        : `Teacher has rejected ${req.student_name || 'your child'}'s leave request — Reason: ${comment}`;
      
      dispatch(sendMessage({ content: parentMsg, targetRole: 'Parent', class_group: 'Management', title: 'Leave Update' }));
      
      if (status === 'leave_approved' || status.includes('approv')) {
         dispatch(sendMessage({ content: `Teacher has forwarded a leave request for ${req.student_name}.`, targetRole: 'Admin', class_group: 'Management', title: 'New Forwarded Leave Request' }));
      }

      dispatch(fetchAttendance());
    } catch(err) {
      // Failed to update request
    }
  };

  const executeReject = async () => {
    if (!activeReqId || !reasonTxt.trim()) {
       Alert.alert('Validation Check', 'Please enter a rejection reason.');
       return;
    }
    await processStatusUpdate(activeReqId, 'leave_rejected', reasonTxt);
    setRejectModalVis(false);
    setActiveReqId(null);
    setReasonTxt('');
  };

  const bulkAction = async (actionStatus: string) => {
    if (selectedIds.size === 0) return;
    try {
       for (let id of Array.from(selectedIds)) {
          await processStatusUpdate(id, actionStatus, actionStatus.includes('approv') ? 'Bulk approved' : 'Bulk rejected');
       }
       setSelectedIds(new Set());
       Alert.alert('Success', `Bulk operation successful.`);
    } catch {
       Alert.alert('Execution partial or failed completely.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#C0392B" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Teacher Leave Control</Text>
        <View style={styles.pendingBadgeWrap}><Text style={styles.pendingBadgeTxt}>{pendingCount}</Text></View>
      </View>

      <View style={styles.statsRow}>
         <View style={styles.statBox}><Text style={styles.statLabel}>Pending</Text><Text style={[styles.statVal, {color: '#E67E22'}]}>{pendingCount}</Text></View>
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
           <TouchableOpacity onPress={() => setSelectedIds(selectedIds.size === filteredRequests.length ? new Set() : new Set(filteredRequests.map((r:any) => r.id)))}>
             <Text style={{color: '#3498DB', fontWeight: '700'}}>Select All</Text>
           </TouchableOpacity>
           {selectedIds.size > 0 && (
             <View style={{flexDirection: 'row', gap: 10}}>
                <TouchableOpacity style={[styles.bulkBtn, {backgroundColor: '#27AE60'}]} onPress={() => bulkAction('leave_approved')}>
                  <Text style={styles.bulkTx}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.bulkBtn, {backgroundColor: '#E74C3C'}]} onPress={() => bulkAction('leave_rejected')}>
                  <Text style={styles.bulkTx}>Reject</Text>
                </TouchableOpacity>
             </View>
           )}
         </View>
      )}

      <ScrollView contentContainerStyle={styles.listContainer}>
        {loading && filteredRequests.length === 0 ? (
           <ActivityIndicator style={{marginTop: 20}} color="#C0392B" />
        ) : filteredRequests.map(req => {
           const s = String(req.teacherStatus || req.status || 'pending').toLowerCase();
           const isP = s === 'leave_pending' || s === 'pending';
           return (
             <View key={req.id} style={[styles.card, selectedIds.has(req.id) && styles.cardSelected]}>
               <View style={styles.cardHeader}>
                  {filter === 'Pending' && (
                     <TouchableOpacity style={[styles.cb, selectedIds.has(req.id) && styles.cbAct]} onPress={() => toggleSelect(req.id)} />
                  )}
                  <View style={{flex: 1}}>
                    <Text style={styles.stuName}>{req.student_name || req.child_name || req.name || 'Student'} <Text style={{fontWeight: '400', fontSize: ms(13)}}>({req.class || req.class_group || req.child_class || 'N/A'})</Text></Text>
                    <Text style={styles.dateRange}>{(req.leaveType || 'Leave').toUpperCase()} | {req.fromDate || req.date} to {req.toDate || req.date} ({req.totalDays || 1}d)</Text>
                  </View>
               </View>
               <View style={styles.cardBody}>
                  <Text style={styles.reasonTx}>"{req.reason}"</Text>
                  {req.documentUrl && <Text style={styles.docLink}>📎 Attached Document</Text>}
               </View>

               {isP ? (
                 <View style={styles.actRow}>
                   <TouchableOpacity style={[styles.actBtn, {backgroundColor: '#27AE60'}]} onPress={() => {
                      Alert.prompt('Approve Leave', 'Optional comment for parent & admin', [
                         { text: 'Cancel', style: 'cancel' },
                         { text: 'Approve', onPress: (cmnt?: string) => processStatusUpdate(req.id, 'leave_approved', cmnt || '') }
                      ]);
                   }}>
                     <Text style={styles.actBtnTx}>✓ Approve & Forward</Text>
                   </TouchableOpacity>
                   <TouchableOpacity style={[styles.actBtn, {backgroundColor: '#E74C3C'}]} onPress={() => { setActiveReqId(req.id); setRejectModalVis(true); }}>
                     <Text style={styles.actBtnTx}>✗ Reject</Text>
                   </TouchableOpacity>
                 </View>
               ) : (
                 <View style={styles.resolvedBadge}>
                   <Text style={{color: s.includes('approv') ? '#27AE60' : '#C0392B', fontWeight: '700'}}>
                     {s.includes('approv') ? '✓ Forwarded to Admin' : '✗ Rejected'}
                   </Text>
                   <Text style={{color: '#7F8C8D', fontSize: ms(12)}}>{req.teacherComment}</Text>
                 </View>
               )}
             </View>
           )
        })}
      </ScrollView>

      <Modal visible={rejectModalVis} transparent animationType="fade">
         <View style={styles.modalBg}>
            <View style={styles.modalCard}>
               <Text style={styles.modalTitle}>Reason for Rejection</Text>
               <TextInput style={styles.modalInput} placeholder="Required for rejecting" value={reasonTxt} onChangeText={setReasonTxt} multiline />
               <View style={styles.modalActions}>
                  <TouchableOpacity onPress={() => setRejectModalVis(false)} style={{padding: 10}}><Text style={{color: '#7F8C8D'}}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity onPress={executeReject} style={{backgroundColor: '#E74C3C', padding: 10, borderRadius: 8}}><Text style={{color: '#FFF'}}>Confirm Reject</Text></TouchableOpacity>
               </View>
            </View>
         </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F6F7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#C0392B', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 6 }, backIcon: { fontSize: 34, color: '#FFF', lineHeight: 34, marginTop: -4 },
  title: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  pendingBadgeWrap: { backgroundColor: '#F1C40F', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pendingBadgeTxt: { color: '#000', fontWeight: '700', fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 10, padding: 16 },
  statBox: { flex: 1, backgroundColor: '#FFF', padding: 12, borderRadius: 8, alignItems: 'center', elevation: 1 },
  statLabel: { fontSize: 12, color: '#7F8C8D' }, statVal: { fontSize: 20, fontWeight: '800' },
  tabsRow: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#EAEDED' },
  tabBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: '#C0392B' }, tabText: { color: '#7F8C8D', fontWeight: '600' }, tabTextActive: { color: '#C0392B', fontWeight: '700' },
  bulkRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#FFF', elevation: 1 },
  bulkBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 }, bulkTx: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  listContainer: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 16, elevation: 1 },
  cardSelected: { borderColor: '#3498DB', borderWidth: 2 },
  cardHeader: { flexDirection: 'row', marginBottom: 12 },
  cb: { width: 20, height: 20, borderWidth: 1, borderColor: '#BDC3C7', borderRadius: 4, marginRight: 12, marginTop: 2 },
  cbAct: { backgroundColor: '#3498DB', borderColor: '#3498DB' },
  stuName: { fontSize: 16, fontWeight: '700', color: '#2C3E50' },
  dateRange: { fontSize: 13, color: '#95A5A6', marginTop: 2 },
  cardBody: { backgroundColor: '#F8F9F9', padding: 12, borderRadius: 8, marginBottom: 16 },
  reasonTx: { fontSize: 14, color: '#566573', fontStyle: 'italic' },
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

export default TeacherApproveLeaveScreen;
