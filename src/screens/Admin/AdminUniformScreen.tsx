import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchUniformRequests } from '../../store/slices/uniformSlice';
import { colors } from '../../theme/colors';
import { hs, vs, ms } from '../../theme/scale';
import api from '../../config/api';

const AdminUniformScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector((state: RootState) => state.auth.token);
  const { requests, requestsLoading } = useSelector((state: RootState) => state.uniform);
  
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedRejectId, setSelectedRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Polling for "real-time" updates securely through standard REST
  useEffect(() => {
    dispatch(fetchUniformRequests());
    const interval = setInterval(() => {
      dispatch(fetchUniformRequests());
    }, 5000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const getConfig = () => ({ headers: { Authorization: `Bearer ${token}` } });

  const processStatusUpdate = async (id: string, status: string, adminNote: string = '') => {
    setActionLoadingId(id);
    try {
      const payload = {
        status,
        admin_note: adminNote || (status === 'approved' ? 'Collect from office' : 'Rejected by admin'),
        remarks: adminNote || (status === 'approved' ? 'Collect from office' : 'Rejected by admin'),
      };
      // For compatibility with potentially differing backend structures
      try {
        await api.put(`/uniform/${id}`, payload, getConfig());
      } catch {
        await api.put(`/uniform/${id}/status`, payload, getConfig());
      }

      // Also send chat message for push notification hook in their portal!
      const reqDetails = requests.find((r:any) => r.id === id);
      const parentId = reqDetails?.user_id || reqDetails?.parent_id;
      if (parentId) {
        await api.post('/messages', {
           receiver_id: parentId,
           receiver_role: 'Parent',
           receiver_type: 'Parent',
           recipient_role: 'Parent',
           target_role: 'Parent',
           class_group: 'Management',
           title: `Uniform Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
           content: `Your uniform request for ${reqDetails?.child_name || 'your child'} has been ${status === 'approved' ? 'Approved' : 'Rejected'}. ${adminNote}`,
        }, getConfig()).catch(() => {});
      }

      dispatch(fetchUniformRequests());
    } catch (err: any) {
      // Failed to update request
    } finally {
      setActionLoadingId(null);
    }
  };

  const bulkUpdate = async (status: string) => {
    if (selectedIds.size === 0) return;
    try {
      // Execute serially so we don't bombard the native HTTP thread
      for (let id of Array.from(selectedIds)) {
        await processStatusUpdate(id, status);
      }
      setSelectedIds(new Set());
      Alert.alert('Success', `Bulk action applied to ${selectedIds.size} requests.`);
    } catch(err) {
      // Error interrupted bulk action
    }
  };

  const executeReject = () => {
    if (!selectedRejectId) return;
    processStatusUpdate(selectedRejectId, 'rejected', rejectReason);
    setRejectModalVisible(false);
    setSelectedRejectId(null);
    setRejectReason('');
  };

  const filteredRequests = useMemo(() => {
    return (requests || []).filter((req: any) => {
      const s = String(req.status || 'pending').toLowerCase();
      if (filter === 'All') return true;
      if (filter === 'Pending') return s === 'pending';
      if (filter === 'Approved') return s.includes('approv');
      if (filter === 'Rejected') return s.includes('reject');
      return true;
    }).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [requests, filter]);

  const pendingCount = (requests || []).filter((r: any) => String(r.status || 'pending').toLowerCase() === 'pending').length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#2C3E50" />
      <View style={styles.header}>
        <Text style={styles.title}>Uniform Requests</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
           <Text style={styles.statLabel}>Pending Actions</Text>
           <Text style={[styles.statValue, { color: '#E67E22' }]}>{pendingCount}</Text>
        </View>
        <View style={styles.statBox}>
           <Text style={styles.statLabel}>Total Logs</Text>
           <Text style={styles.statValue}>{(requests || []).length}</Text>
        </View>
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
           <TouchableOpacity 
             style={styles.bulkSelBtn} 
             onPress={() => setSelectedIds(selectedIds.size === filteredRequests.length ? new Set() : new Set(filteredRequests.map((r:any) => r.id)))}
           >
             <Text style={styles.bulkSelText}>{selectedIds.size === filteredRequests.length ? 'Deselect All' : 'Select All'}</Text>
           </TouchableOpacity>
           {selectedIds.size > 0 && (
             <View style={{flexDirection: 'row', gap: 10}}>
               <TouchableOpacity style={[styles.bulkActBtn, {backgroundColor: '#27AE60'}]} onPress={() => bulkUpdate('approved')}>
                 <Text style={styles.bulkActText}>Approve {selectedIds.size}</Text>
               </TouchableOpacity>
               <TouchableOpacity style={[styles.bulkActBtn, {backgroundColor: '#E74C3C'}]} onPress={() => bulkUpdate('rejected')}>
                 <Text style={styles.bulkActText}>Reject {selectedIds.size}</Text>
               </TouchableOpacity>
             </View>
           )}
         </View>
      )}

      <ScrollView contentContainerStyle={styles.listContainer}>
        {requestsLoading && filteredRequests.length === 0 ? (
          <ActivityIndicator color="#2C3E50" style={{marginTop: 20}} />
        ) : filteredRequests.length > 0 ? (
          filteredRequests.map((req: any) => {
            const isBusy = actionLoadingId === req.id;
            const statusLabel = String(req.status || 'Pending').toLowerCase();
            const isPending = statusLabel === 'pending';
            const reqItems = req.type ? `${req.quantity || 1}x ${req.type} (Size ${req.size})` : (Array.isArray(req.required_items) ? req.required_items.join(', ') : req.required_items);
            
            return (
              <View key={req.id} style={[styles.reqCard, selectedIds.has(req.id) && {borderColor: '#3498DB', borderWidth: 2}]}>
                 <View style={styles.cardHeader}>
                    <TouchableOpacity style={{flex: 1, flexDirection: 'row', alignItems: 'center'}} disabled={filter !== 'Pending'} onPress={() => toggleSelect(req.id)}>
                       {filter === 'Pending' && (
                         <View style={[styles.checkbox, selectedIds.has(req.id) && styles.checkboxActive]} />
                       )}
                       <View>
                         <Text style={styles.studentName}>{req.child_name || 'Student'}</Text>
                         <Text style={styles.metaData}>Class: {req.child_class || req.class_group || 'N/A'}</Text>
                       </View>
                    </TouchableOpacity>
                    <Text style={styles.metaData}>{new Date(req.created_at || Date.now()).toLocaleDateString()}</Text>
                 </View>

                 <View style={styles.cardBody}>
                    <Text style={styles.itemRequested}>🛍️ {reqItems}</Text>
                    {req.note && <Text style={styles.userNote}>📝 "{req.note}"</Text>}
                 </View>

                 {isPending ? (
                   <View style={styles.actionsRow}>
                     <TouchableOpacity style={[styles.actBtn, styles.btnApprove]} onPress={() => processStatusUpdate(req.id, 'approved')} disabled={isBusy}>
                       {isBusy ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.actBtnText}>Approve ✓</Text>}
                     </TouchableOpacity>
                     <TouchableOpacity style={[styles.actBtn, styles.btnReject]} onPress={() => { setSelectedRejectId(req.id); setRejectReason(''); setRejectModalVisible(true); }} disabled={isBusy}>
                       <Text style={styles.actBtnText}>Reject ✗</Text>
                     </TouchableOpacity>
                   </View>
                 ) : (
                   <View style={styles.resolvedBadge}>
                     <Text style={[styles.resolvedText, statusLabel.includes('approv') ? {color: '#27AE60'} : {color: '#C0392B'}]}>
                       {statusLabel.includes('approv') ? '✓ Approved' : '✗ Rejected'} 
                     </Text>
                     <Text style={styles.resolvedNote}>{req.admin_note || req.remarks}</Text>
                   </View>
                 )}
              </View>
            )
          })
        ) : (
          <Text style={styles.emptyText}>No requests found for this filter.</Text>
        )}
      </ScrollView>

      {/* Reject Reason Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="fade">
         <View style={styles.modalBg}>
            <View style={styles.modalCard}>
               <Text style={styles.modalTitle}>Reason for Rejection</Text>
               <TextInput 
                  style={styles.modalInput} 
                  placeholder="Optional note for parent" 
                  value={rejectReason} 
                  onChangeText={setRejectReason} 
                  multiline
               />
               <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalCancel} onPress={() => setRejectModalVisible(false)}>
                     <Text style={styles.modalCancelTxt}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalSubmit} onPress={executeReject}>
                     <Text style={styles.modalSubmitTxt}>Confirm Reject</Text>
                  </TouchableOpacity>
               </View>
            </View>
         </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F4F4' },
  header: { backgroundColor: '#2C3E50', padding: 16, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  statsRow: { flexDirection: 'row', padding: 16, gap: 16 },
  statBox: { flex: 1, backgroundColor: '#FFF', padding: 16, borderRadius: 12, alignItems: 'center', elevation: 2 },
  statLabel: { fontSize: 13, color: '#7F8C8D', marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: '800', color: '#2C3E50' },
  tabsRow: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#EAEDED' },
  tabBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: '#2980B9' },
  tabText: { fontSize: 13, color: '#7F8C8D', fontWeight: '600' },
  tabTextActive: { color: '#2980B9', fontWeight: '700' },
  
  bulkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#D5D8DC' },
  bulkSelBtn: { padding: 8 },
  bulkSelText: { color: '#3498DB', fontWeight: '700', fontSize: 14 },
  bulkActBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  bulkActText: { color: '#FFF', fontWeight: '700', fontSize: 13 },

  listContainer: { padding: 16, paddingBottom: 40 },
  reqCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: '#BDC3C7', marginRight: 10, alignSelf: 'center' },
  checkboxActive: { backgroundColor: '#3498DB', borderColor: '#3498DB' },
  studentName: { fontSize: 16, fontWeight: '700', color: '#2C3E50' },
  metaData: { fontSize: 12, color: '#7F8C8D', marginTop: 2 },
  cardBody: { backgroundColor: '#F8F9F9', padding: 12, borderRadius: 8, marginBottom: 16 },
  itemRequested: { fontSize: 14, fontWeight: '700', color: '#34495E', marginBottom: 6 },
  userNote: { fontSize: 13, color: '#D35400', fontStyle: 'italic' },
  
  actionsRow: { flexDirection: 'row', gap: 12 },
  actBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  btnApprove: { backgroundColor: '#27AE60' },
  btnReject: { backgroundColor: '#E74C3C' },
  actBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  resolvedBadge: { backgroundColor: '#F0F3F4', padding: 12, borderRadius: 8 },
  resolvedText: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  resolvedNote: { fontSize: 13, color: '#7F8C8D' },

  emptyText: { textAlign: 'center', color: '#7F8C8D', marginTop: 20 },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#2C3E50', marginBottom: 16 },
  modalInput: { height: 80, backgroundColor: '#F2F4F4', borderRadius: 8, padding: 12, textAlignVertical: 'top', color: '#2C3E50', marginBottom: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancel: { paddingVertical: 10, paddingHorizontal: 16 },
  modalCancelTxt: { color: '#7F8C8D', fontWeight: '600' },
  modalSubmit: { backgroundColor: '#E74C3C', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  modalSubmitTxt: { color: '#FFF', fontWeight: '700' }
});

export default AdminUniformScreen;
