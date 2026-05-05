import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fetchBooks, fetchMyBookRequests, submitBookRequest } from '../../api/books.api';
import ErrorView from '../../components/common/ErrorView';
import { getErrorMessage } from '../../utils/errorUtils';
import { colors } from '../../theme/colors';
import { hs, vs, ms } from '../../theme/scale';

const STATUS_COLOR: Record<string, string> = {
  pending:   '#F39C12',
  approved:  '#27AE60',
  collected: '#2980B9',
  returned:  '#8E44AD',
  rejected:  '#E74C3C',
};

const STATUS_EMOJI: Record<string, string> = {
  pending:   '⏳',
  approved:  '✅',
  collected: '📚',
  returned:  '↩️',
  rejected:  '❌',
};

const BooksScreen = ({ navigation }: any) => {
  const { token } = useSelector((state: RootState) => state.auth);
  const profile   = useSelector((state: RootState) => state.profile);

  const [tab, setTab]             = useState<'requests' | 'browse'>('requests');
  const [requests, setRequests]   = useState<any[]>([]);
  const [books, setBooks]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [selected, setSelected]   = useState<number[]>([]);
  const [specialNote, setSpecialNote] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const childClass = profile?.child_class || '';

  const loadRequests = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMyBookRequests(token);
      setRequests(res.data || []);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadBooks = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchBooks(token, childClass);
      setBooks(res.data || []);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token, childClass]);

  useEffect(() => {
    if (tab === 'requests') loadRequests();
    else loadBooks();
  }, [tab]);

  const toggleSelect = (id: number) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (selected.length === 0) {
      Alert.alert('Select Books', 'Please select at least one book to request.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitBookRequest(token!, selected, specialNote || undefined);
      Alert.alert('Success', res.data.message || 'Request submitted!');
      setSelected([]);
      setSpecialNote('');
      setShowModal(false);
      setTab('requests');
      loadRequests();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  const alreadyRequestedIds = new Set(
    requests
      .filter(r => !['rejected', 'returned'].includes(r.status))
      .map(r => r.book_id)
  );

  const pendingCount  = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const activeCount   = requests.filter(r => r.status === 'collected').length;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1A5276" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>📚 Books</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Summary strip */}
      <View style={s.summaryRow}>
        <View style={s.summaryChip}>
          <Text style={s.summaryVal}>{pendingCount}</Text>
          <Text style={s.summaryLbl}>Pending</Text>
        </View>
        <View style={[s.summaryChip, { borderColor: '#27AE60' }]}>
          <Text style={[s.summaryVal, { color: '#27AE60' }]}>{approvedCount}</Text>
          <Text style={s.summaryLbl}>Approved</Text>
        </View>
        <View style={[s.summaryChip, { borderColor: '#2980B9' }]}>
          <Text style={[s.summaryVal, { color: '#2980B9' }]}>{activeCount}</Text>
          <Text style={s.summaryLbl}>Collected</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === 'requests' && s.tabActive]} onPress={() => setTab('requests')}>
          <Text style={[s.tabText, tab === 'requests' && s.tabTextActive]}>My Requests</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'browse' && s.tabActive]} onPress={() => setTab('browse')}>
          <Text style={[s.tabText, tab === 'browse' && s.tabTextActive]}>Request Books</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1A5276" style={{ marginTop: vs(40) }} />
      ) : error ? (
        <ErrorView message={error} onRetry={() => tab === 'requests' ? loadRequests() : loadBooks()} accentColor="#1A5276" />
      ) : tab === 'requests' ? (
        <ScrollView contentContainerStyle={s.scroll}>
          {requests.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📖</Text>
              <Text style={s.emptyText}>No book requests yet.</Text>
              <TouchableOpacity style={s.ctaBtn} onPress={() => setTab('browse')}>
                <Text style={s.ctaBtnText}>Browse & Request Books</Text>
              </TouchableOpacity>
            </View>
          ) : (
            requests.map(req => {
              const color = STATUS_COLOR[req.status] || '#999';
              const emoji = STATUS_EMOJI[req.status] || '📘';
              return (
                <View key={req.id} style={s.card}>
                  <View style={s.cardLeft}>
                    <Text style={s.cardEmoji}>{emoji}</Text>
                  </View>
                  <View style={s.cardBody}>
                    <Text style={s.cardTitle}>{req.title}</Text>
                    <Text style={s.cardSub}>{req.subject} • {req.author}</Text>
                    {req.edition ? <Text style={s.cardMeta}>Edition: {req.edition}</Text> : null}
                    {req.approval_notes ? (
                      <View style={s.noteBox}>
                        <Text style={s.noteText}>Note: {req.approval_notes}</Text>
                      </View>
                    ) : null}
                    <View style={s.timeline}>
                      <Text style={s.timelineItem}>
                        🗓 Requested: {new Date(req.request_date || req.created_at).toLocaleDateString()}
                      </Text>
                      {req.approval_date ? (
                        <Text style={s.timelineItem}>
                          ✅ Approved: {new Date(req.approval_date).toLocaleDateString()}
                        </Text>
                      ) : null}
                      {req.collection_date ? (
                        <Text style={s.timelineItem}>
                          📦 Collected: {new Date(req.collection_date).toLocaleDateString()}
                        </Text>
                      ) : null}
                      {req.return_date ? (
                        <Text style={s.timelineItem}>
                          ↩️ Returned: {new Date(req.return_date).toLocaleDateString()}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: color + '20', borderColor: color }]}>
                    <Text style={[s.statusText, { color }]}>
                      {req.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      ) : (
        <>
          <ScrollView contentContainerStyle={s.scroll}>
            {books.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyIcon}>🔍</Text>
                <Text style={s.emptyText}>No books available right now.</Text>
              </View>
            ) : (
              books.map(book => {
                const isSelected   = selected.includes(book.id);
                const isRequested  = alreadyRequestedIds.has(book.id);
                const isUnavailable = book.available_quantity <= 0;
                return (
                  <TouchableOpacity
                    key={book.id}
                    style={[
                      s.bookCard,
                      isSelected && s.bookCardSelected,
                      (isRequested || isUnavailable) && s.bookCardDisabled,
                    ]}
                    onPress={() => {
                      if (isRequested || isUnavailable) return;
                      toggleSelect(book.id);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={s.bookIcon}>
                      <Text style={{ fontSize: ms(28) }}>📗</Text>
                    </View>
                    <View style={s.bookInfo}>
                      <Text style={s.bookTitle}>{book.title}</Text>
                      <Text style={s.bookMeta}>{book.subject} • {book.author}</Text>
                      {book.edition ? <Text style={s.bookEdition}>Ed. {book.edition}</Text> : null}
                      <View style={s.bookFooter}>
                        {book.price ? (
                          <Text style={s.bookPrice}>₹{book.price}</Text>
                        ) : null}
                        <View style={[
                          s.availBadge,
                          isUnavailable && { backgroundColor: '#FADBD8', borderColor: '#E74C3C' },
                        ]}>
                          <Text style={[
                            s.availText,
                            isUnavailable && { color: '#E74C3C' },
                          ]}>
                            {isUnavailable ? 'Out of stock' : `${book.available_quantity} available`}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {isRequested ? (
                      <View style={s.checkBox}>
                        <Text style={{ fontSize: ms(18) }}>✓</Text>
                      </View>
                    ) : (
                      <View style={[s.checkBox, isSelected && s.checkBoxSelected]}>
                        {isSelected && <Text style={s.checkMark}>✓</Text>}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
            <View style={{ height: vs(80) }} />
          </ScrollView>

          {selected.length > 0 && (
            <View style={s.bottomBar}>
              <Text style={s.bottomBarText}>{selected.length} book(s) selected</Text>
              <TouchableOpacity style={s.submitBtn} onPress={() => setShowModal(true)}>
                <Text style={s.submitBtnText}>Request Selected</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* Confirm modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowModal(false)}>
          <TouchableOpacity activeOpacity={1} style={s.modal}>
            <Text style={s.modalTitle}>Confirm Request</Text>
            <Text style={s.modalSub}>
              You are requesting {selected.length} book(s) for {profile?.child_name || 'your child'}.
            </Text>
            <TextInput
              style={s.noteInput}
              placeholder="Special request or notes (optional)"
              placeholderTextColor={colors.textGray}
              value={specialNote}
              onChangeText={setSpecialNote}
              multiline
            />
            <TouchableOpacity
              style={[s.submitBtn, { marginTop: vs(16) }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color="#FFF" />
                : <Text style={s.submitBtnText}>Submit Request</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bgMain },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1A5276', paddingHorizontal: hs(16), paddingVertical: vs(12) },
  backBtn: { padding: 6 },
  backIcon:{ fontSize: 34, color: '#FFF', lineHeight: 34, marginTop: -4 },
  title:   { fontSize: ms(20), fontWeight: '700', color: '#FFF' },

  summaryRow:  { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#1A5276', paddingBottom: vs(14), paddingHorizontal: hs(16) },
  summaryChip: { alignItems: 'center', backgroundColor: '#FFFFFF20', borderWidth: 1, borderColor: '#F39C12', borderRadius: hs(12), paddingHorizontal: hs(20), paddingVertical: vs(8) },
  summaryVal:  { fontSize: ms(20), fontWeight: '800', color: '#F39C12' },
  summaryLbl:  { fontSize: ms(11), color: '#BDC3C7', marginTop: vs(2) },

  tabs:         { flexDirection: 'row', backgroundColor: '#FFF', elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 3 },
  tab:          { flex: 1, paddingVertical: vs(14), alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive:    { borderBottomColor: '#1A5276' },
  tabText:      { fontSize: ms(14), color: colors.textSecond, fontWeight: '600' },
  tabTextActive:{ color: '#1A5276', fontWeight: '800' },

  scroll: { padding: hs(16), paddingBottom: vs(40) },
  empty:  { alignItems: 'center', marginTop: vs(60) },
  emptyIcon: { fontSize: ms(48), marginBottom: vs(12) },
  emptyText: { fontSize: ms(15), color: colors.textSecond, marginBottom: vs(20) },
  ctaBtn:    { backgroundColor: '#1A5276', paddingHorizontal: hs(24), paddingVertical: vs(12), borderRadius: hs(24) },
  ctaBtnText:{ color: '#FFF', fontWeight: '700', fontSize: ms(14) },

  card:     { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: hs(14), padding: hs(14), marginBottom: vs(12), elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, borderWidth: 1, borderColor: colors.border },
  cardLeft: { justifyContent: 'center', marginRight: hs(12) },
  cardEmoji:{ fontSize: ms(28) },
  cardBody: { flex: 1 },
  cardTitle:{ fontSize: ms(15), fontWeight: '700', color: colors.textPrimary, marginBottom: vs(2) },
  cardSub:  { fontSize: ms(13), color: colors.textSecond, marginBottom: vs(2) },
  cardMeta: { fontSize: ms(12), color: colors.textGray },
  noteBox:  { backgroundColor: '#FEF9E7', borderRadius: hs(6), padding: hs(8), marginTop: vs(6), borderLeftWidth: 3, borderLeftColor: '#F39C12' },
  noteText: { fontSize: ms(12), color: '#D35400' },
  timeline: { marginTop: vs(8) },
  timelineItem: { fontSize: ms(11), color: colors.textSecond, marginTop: vs(2) },
  statusBadge:  { alignSelf: 'flex-start', borderWidth: 1, borderRadius: hs(6), paddingHorizontal: hs(8), paddingVertical: vs(3), marginLeft: hs(8) },
  statusText:   { fontSize: ms(10), fontWeight: '800' },

  bookCard:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: hs(14), padding: hs(14), marginBottom: vs(10), elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, borderWidth: 1, borderColor: colors.border },
  bookCardSelected: { borderColor: '#1A5276', backgroundColor: '#EBF5FB' },
  bookCardDisabled: { opacity: 0.55 },
  bookIcon: { width: hs(48), height: hs(48), borderRadius: hs(10), backgroundColor: '#EBF5FB', alignItems: 'center', justifyContent: 'center', marginRight: hs(12) },
  bookInfo: { flex: 1 },
  bookTitle:{ fontSize: ms(15), fontWeight: '700', color: colors.textPrimary, marginBottom: vs(2) },
  bookMeta: { fontSize: ms(12), color: colors.textSecond },
  bookEdition:{ fontSize: ms(11), color: colors.textGray, marginTop: vs(1) },
  bookFooter: { flexDirection: 'row', alignItems: 'center', marginTop: vs(6), gap: hs(8) },
  bookPrice: { fontSize: ms(13), fontWeight: '700', color: '#27AE60' },
  availBadge:{ backgroundColor: '#EAFAF1', borderWidth: 1, borderColor: '#27AE60', borderRadius: hs(4), paddingHorizontal: hs(6), paddingVertical: vs(2) },
  availText: { fontSize: ms(10), color: '#27AE60', fontWeight: '600' },
  checkBox:  { width: hs(24), height: hs(24), borderRadius: hs(6), borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginLeft: hs(8) },
  checkBoxSelected: { backgroundColor: '#1A5276', borderColor: '#1A5276' },
  checkMark: { color: '#FFF', fontSize: ms(14), fontWeight: '800' },

  bottomBar:     { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', paddingHorizontal: hs(20), paddingVertical: vs(14), paddingBottom: vs(24), borderTopWidth: 1, borderTopColor: colors.border, elevation: 10 },
  bottomBarText: { fontSize: ms(14), fontWeight: '600', color: colors.textPrimary },
  submitBtn:     { backgroundColor: '#1A5276', paddingHorizontal: hs(20), paddingVertical: vs(12), borderRadius: hs(24) },
  submitBtnText: { color: '#FFF', fontWeight: '700', fontSize: ms(14) },

  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: hs(20) },
  modal:     { backgroundColor: '#FFF', borderRadius: hs(18), padding: hs(24), width: '100%' },
  modalTitle:{ fontSize: ms(18), fontWeight: '800', color: colors.textPrimary, marginBottom: vs(8) },
  modalSub:  { fontSize: ms(14), color: colors.textSecond, marginBottom: vs(16) },
  noteInput: { backgroundColor: colors.bgDark, borderRadius: hs(10), padding: hs(14), fontSize: ms(14), color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, minHeight: vs(70) },
  cancelBtn: { marginTop: vs(12), paddingVertical: vs(12), backgroundColor: colors.bgDark, borderRadius: hs(10) },
  cancelBtnText: { textAlign: 'center', fontSize: ms(14), color: colors.textSecond, fontWeight: '600' },
});

export default BooksScreen;
