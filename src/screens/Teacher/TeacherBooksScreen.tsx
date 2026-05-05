import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fetchPendingRequests, updateBookRequestStatus } from '../../api/books.api';
import { colors } from '../../theme/colors';
import { hs, vs, ms } from '../../theme/scale';

const STATUS_COLOR: Record<string, string> = {
  pending:   '#F39C12',
  approved:  '#27AE60',
  collected: '#2980B9',
  returned:  '#8E44AD',
  rejected:  '#E74C3C',
};

const ALL_CLASSES = [
  'All', '1-A', '1-B', '2-A', '2-B', '3-A', '3-B',
  '4-A', '4-B', '5-A', '5-B', '6-A', '6-B', '7-A', '7-B',
  '8-A', '8-B', '9-A', '9-B', '10-A', '10-B',
];

const TeacherBooksScreen = ({ navigation }: any) => {
  const { token } = useSelector((state: RootState) => state.auth);

  const [requests, setRequests]       = useState<any[]>([]);
  const [loading, setLoading]         = useState(false);
  const [selectedClass, setSelectedClass] = useState('All');
  const [statusFilter, setStatusFilter]   = useState('pending');
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [notes, setNotes]             = useState('');
  const [updating, setUpdating]       = useState(false);

  const loadRequests = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const classGroup = selectedClass === 'All' ? undefined : selectedClass;
      const res = await fetchPendingRequests(token, classGroup, statusFilter || undefined);
      setRequests(res.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [token, selectedClass, statusFilter]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const handleAction = async (requestId: number, status: string) => {
    setUpdating(true);
    try {
      await updateBookRequestStatus(token!, requestId, status, notes || undefined);
      Alert.alert('Done', `Request ${status} successfully.`);
      setActiveRequest(null);
      setNotes('');
      loadRequests();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Action failed.');
    } finally {
      setUpdating(false);
    }
  };

  const groupedByStudent = requests.reduce((acc: any, req: any) => {
    const key = `${req.student_name}__${req.student_class}`;
    if (!acc[key]) acc[key] = { name: req.student_name, class: req.student_class, items: [] };
    acc[key].items.push(req);
    return acc;
  }, {});

  const pendingCount   = requests.filter(r => r.status === 'pending').length;
  const approvedCount  = requests.filter(r => r.status === 'approved').length;
  const collectedCount = requests.filter(r => r.status === 'collected').length;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1E5631" />

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>📚 Book Requests</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <TouchableOpacity style={[s.statChip, statusFilter === 'pending' && s.statActive]} onPress={() => setStatusFilter('pending')}>
          <Text style={[s.statVal, statusFilter === 'pending' && { color: '#FFF' }]}>{pendingCount}</Text>
          <Text style={[s.statLbl, statusFilter === 'pending' && { color: '#FFF' }]}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.statChip, statusFilter === 'approved' && s.statActive]} onPress={() => setStatusFilter('approved')}>
          <Text style={[s.statVal, statusFilter === 'approved' && { color: '#FFF' }]}>{approvedCount}</Text>
          <Text style={[s.statLbl, statusFilter === 'approved' && { color: '#FFF' }]}>Approved</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.statChip, statusFilter === 'collected' && s.statActive]} onPress={() => setStatusFilter('collected')}>
          <Text style={[s.statVal, statusFilter === 'collected' && { color: '#FFF' }]}>{collectedCount}</Text>
          <Text style={[s.statLbl, statusFilter === 'collected' && { color: '#FFF' }]}>Collected</Text>
        </TouchableOpacity>
      </View>

      {/* Class filter */}
      <View style={s.classFilterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: hs(12) }}>
          {ALL_CLASSES.map(cls => (
            <TouchableOpacity
              key={cls}
              style={[s.chip, selectedClass === cls && s.chipActive]}
              onPress={() => setSelectedClass(cls)}
            >
              <Text style={[s.chipText, selectedClass === cls && s.chipTextActive]}>{cls}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1E5631" style={{ marginTop: vs(40) }} />
      ) : (
        <ScrollView contentContainerStyle={s.scroll}>
          {Object.keys(groupedByStudent).length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📋</Text>
              <Text style={s.emptyText}>No requests found for this filter.</Text>
            </View>
          ) : (
            Object.values(groupedByStudent).map((group: any) => (
              <View key={`${group.name}__${group.class}`} style={s.groupCard}>
                <View style={s.groupHeader}>
                  <View style={s.studentAvatar}>
                    <Text style={{ fontSize: ms(18) }}>👤</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.studentName}>{group.name || 'Unknown Student'}</Text>
                    <Text style={s.studentClass}>Class: {group.class || 'N/A'}</Text>
                  </View>
                  <Text style={s.bookCount}>{group.items.length} book(s)</Text>
                </View>

                {group.items.map((req: any) => {
                  const statusColor = STATUS_COLOR[req.status] || '#999';
                  return (
                    <View key={req.id} style={s.reqRow}>
                      <View style={s.reqInfo}>
                        <Text style={s.reqTitle}>{req.title}</Text>
                        <Text style={s.reqMeta}>{req.subject} • Qty: {req.available_quantity} left</Text>
                        {req.special_request ? (
                          <Text style={s.reqNote}>Note: {req.special_request}</Text>
                        ) : null}
                      </View>
                      <View style={s.reqActions}>
                        <View style={[s.statusDot, { backgroundColor: statusColor }]} />
                        <Text style={[s.reqStatus, { color: statusColor }]}>
                          {req.status?.toUpperCase()}
                        </Text>
                        <TouchableOpacity
                          style={s.actionBtn}
                          onPress={() => { setActiveRequest(req); setNotes(''); }}
                        >
                          <Text style={s.actionBtnText}>Manage</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))
          )}
          <View style={{ height: vs(40) }} />
        </ScrollView>
      )}

      {/* Manage modal */}
      <Modal visible={!!activeRequest} transparent animationType="slide">
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setActiveRequest(null)}>
          <TouchableOpacity activeOpacity={1} style={s.modal}>
            <Text style={s.modalTitle}>Manage Request</Text>
            {activeRequest && (
              <>
                <View style={s.modalBookRow}>
                  <Text style={{ fontSize: ms(28), marginRight: hs(12) }}>📗</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.modalBookTitle}>{activeRequest.title}</Text>
                    <Text style={s.modalBookMeta}>{activeRequest.student_name} • {activeRequest.student_class}</Text>
                    <Text style={[s.modalBookMeta, { color: STATUS_COLOR[activeRequest.status] }]}>
                      Status: {activeRequest.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <TextInput
                  style={s.noteInput}
                  placeholder="Add a note (optional)"
                  placeholderTextColor={colors.textGray}
                  value={notes}
                  onChangeText={setNotes}
                />

                <View style={s.actionBtnsRow}>
                  {activeRequest.status === 'pending' && (
                    <>
                      <TouchableOpacity
                        style={[s.modalBtn, { backgroundColor: '#27AE60' }]}
                        onPress={() => handleAction(activeRequest.id, 'approved')}
                        disabled={updating}
                      >
                        <Text style={s.modalBtnText}>✅ Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.modalBtn, { backgroundColor: '#E74C3C' }]}
                        onPress={() => handleAction(activeRequest.id, 'rejected')}
                        disabled={updating}
                      >
                        <Text style={s.modalBtnText}>❌ Reject</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {activeRequest.status === 'approved' && (
                    <TouchableOpacity
                      style={[s.modalBtn, { backgroundColor: '#2980B9', flex: 1 }]}
                      onPress={() => handleAction(activeRequest.id, 'collected')}
                      disabled={updating}
                    >
                      <Text style={s.modalBtnText}>📦 Mark Collected</Text>
                    </TouchableOpacity>
                  )}
                  {activeRequest.status === 'collected' && (
                    <TouchableOpacity
                      style={[s.modalBtn, { backgroundColor: '#8E44AD', flex: 1 }]}
                      onPress={() => handleAction(activeRequest.id, 'returned')}
                      disabled={updating}
                    >
                      <Text style={s.modalBtnText}>↩️ Mark Returned</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {updating && <ActivityIndicator color="#1E5631" style={{ marginTop: vs(12) }} />}
              </>
            )}
            <TouchableOpacity style={s.cancelBtn} onPress={() => setActiveRequest(null)}>
              <Text style={s.cancelText}>Close</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bgMain },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1E5631', paddingHorizontal: hs(16), paddingVertical: vs(12) },
  backBtn: { padding: 6 },
  backIcon:{ fontSize: 34, color: '#FFF', lineHeight: 34, marginTop: -4 },
  title:   { fontSize: ms(20), fontWeight: '700', color: '#FFF' },

  statsRow:  { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#1E5631', paddingBottom: vs(14), paddingHorizontal: hs(12) },
  statChip:  { alignItems: 'center', paddingHorizontal: hs(18), paddingVertical: vs(8), borderRadius: hs(12), borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  statActive:{ backgroundColor: 'rgba(255,255,255,0.25)', borderColor: '#FFF' },
  statVal:   { fontSize: ms(20), fontWeight: '800', color: '#FFF' },
  statLbl:   { fontSize: ms(11), color: 'rgba(255,255,255,0.7)', marginTop: vs(2) },

  classFilterWrap: { backgroundColor: '#F8F9FA', paddingVertical: vs(10), borderBottomWidth: 1, borderBottomColor: colors.border },
  chip:      { paddingHorizontal: hs(14), paddingVertical: vs(6), backgroundColor: '#FFF', borderRadius: hs(16), marginHorizontal: hs(4), borderWidth: 1, borderColor: colors.border },
  chipActive:{ backgroundColor: '#1E5631', borderColor: '#1E5631' },
  chipText:  { fontSize: ms(12), color: colors.textSecond, fontWeight: '600' },
  chipTextActive: { color: '#FFF' },

  scroll: { padding: hs(14), paddingBottom: vs(40) },
  empty:  { alignItems: 'center', marginTop: vs(60) },
  emptyIcon: { fontSize: ms(48), marginBottom: vs(12) },
  emptyText: { fontSize: ms(15), color: colors.textSecond },

  groupCard:   { backgroundColor: '#FFF', borderRadius: hs(14), marginBottom: vs(14), elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 4, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  groupHeader: { flexDirection: 'row', alignItems: 'center', padding: hs(14), backgroundColor: '#F0F3F4' },
  studentAvatar: { width: hs(42), height: hs(42), borderRadius: hs(21), backgroundColor: '#D6EAF8', alignItems: 'center', justifyContent: 'center', marginRight: hs(12) },
  studentName:   { fontSize: ms(15), fontWeight: '700', color: colors.textPrimary },
  studentClass:  { fontSize: ms(12), color: colors.textSecond },
  bookCount:     { fontSize: ms(13), fontWeight: '700', color: '#1E5631', backgroundColor: '#EAFAF1', paddingHorizontal: hs(10), paddingVertical: vs(4), borderRadius: hs(12) },

  reqRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: hs(14), paddingVertical: vs(12), borderTopWidth: 1, borderTopColor: colors.border },
  reqInfo:   { flex: 1 },
  reqTitle:  { fontSize: ms(14), fontWeight: '700', color: colors.textPrimary },
  reqMeta:   { fontSize: ms(12), color: colors.textSecond, marginTop: vs(2) },
  reqNote:   { fontSize: ms(11), color: '#D35400', marginTop: vs(3), fontStyle: 'italic' },
  reqActions:{ alignItems: 'center', gap: vs(4) },
  statusDot: { width: hs(8), height: hs(8), borderRadius: hs(4) },
  reqStatus: { fontSize: ms(10), fontWeight: '800', marginTop: vs(2) },
  actionBtn: { marginTop: vs(6), backgroundColor: '#1E5631', paddingHorizontal: hs(12), paddingVertical: vs(6), borderRadius: hs(8) },
  actionBtnText: { color: '#FFF', fontSize: ms(12), fontWeight: '700' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal:   { backgroundColor: '#FFF', borderTopLeftRadius: hs(20), borderTopRightRadius: hs(20), padding: hs(24), paddingBottom: vs(36) },
  modalTitle: { fontSize: ms(18), fontWeight: '800', color: colors.textPrimary, marginBottom: vs(16) },
  modalBookRow: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.bgDark, borderRadius: hs(12), padding: hs(14), marginBottom: vs(14) },
  modalBookTitle: { fontSize: ms(15), fontWeight: '700', color: colors.textPrimary },
  modalBookMeta:  { fontSize: ms(13), color: colors.textSecond, marginTop: vs(2) },
  noteInput:   { backgroundColor: colors.bgDark, borderRadius: hs(10), padding: hs(12), fontSize: ms(14), color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, marginBottom: vs(14) },
  actionBtnsRow: { flexDirection: 'row', gap: hs(10) },
  modalBtn:    { flex: 1, paddingVertical: vs(14), borderRadius: hs(10), alignItems: 'center' },
  modalBtnText:{ color: '#FFF', fontSize: ms(14), fontWeight: '700' },
  cancelBtn:   { marginTop: vs(14), paddingVertical: vs(14), backgroundColor: colors.bgDark, borderRadius: hs(10) },
  cancelText:  { textAlign: 'center', color: colors.textSecond, fontSize: ms(14), fontWeight: '600' },
});

export default TeacherBooksScreen;
