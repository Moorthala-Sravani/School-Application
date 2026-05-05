import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fetchInventory, fetchAllRequests, createBook, updateBook } from '../../api/books.api';
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

const AdminBooksScreen = ({ navigation }: any) => {
  const { token } = useSelector((state: RootState) => state.auth);

  const [tab, setTab]               = useState<'inventory' | 'requests'>('inventory');
  const [inventory, setInventory]   = useState<any[]>([]);
  const [requests, setRequests]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editBook, setEditBook]     = useState<any>(null);
  const [saving, setSaving]         = useState(false);
  const [reqStatusFilter, setReqStatusFilter] = useState('');

  const [form, setForm] = useState({
    title: '', author: '', isbn: '', subject: '', edition: '',
    total_quantity: '', required_for_class: '', price: '',
  });

  const loadInventory = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchInventory(token);
      setInventory(res.data || []);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadRequests = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAllRequests(token, reqStatusFilter || undefined);
      setRequests(res.data || []);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token, reqStatusFilter]);

  useEffect(() => {
    if (tab === 'inventory') loadInventory();
    else loadRequests();
  }, [tab, loadInventory, loadRequests]);

  const openAdd = () => {
    setEditBook(null);
    setForm({ title: '', author: '', isbn: '', subject: '', edition: '', total_quantity: '', required_for_class: '', price: '' });
    setShowAddModal(true);
  };

  const openEdit = (book: any) => {
    setEditBook(book);
    setForm({
      title: book.title || '',
      author: book.author || '',
      isbn: book.isbn || '',
      subject: book.subject || '',
      edition: book.edition || '',
      total_quantity: String(book.total_quantity || ''),
      required_for_class: book.required_for_class || '',
      price: String(book.price || ''),
    });
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      Alert.alert('Required', 'Book title is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        total_quantity: parseInt(form.total_quantity) || 0,
        available_quantity: parseInt(form.total_quantity) || 0,
        price: parseFloat(form.price) || null,
      };
      if (editBook) {
        await updateBook(token!, editBook.id, { ...payload, available_quantity: editBook.available_quantity });
        Alert.alert('Updated', 'Book updated successfully.');
      } else {
        await createBook(token!, payload);
        Alert.alert('Added', 'Book added to inventory.');
      }
      setShowAddModal(false);
      loadInventory();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const totalBooks    = inventory.reduce((s, b) => s + (b.total_quantity || 0), 0);
  const totalAvail    = inventory.reduce((s, b) => s + (b.available_quantity || 0), 0);
  const totalIssued   = totalBooks - totalAvail;
  const pendingReqs   = requests.filter(r => r.status === 'pending').length;

  const STATUS_FILTERS = ['', 'pending', 'approved', 'collected', 'returned', 'rejected'];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#512E5F" />

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>📚 Books Management</Text>
        {tab === 'inventory' && (
          <TouchableOpacity onPress={openAdd} style={s.addBtn}>
            <Text style={s.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        )}
        {tab !== 'inventory' && <View style={{ width: 52 }} />}
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statVal}>{inventory.length}</Text>
          <Text style={s.statLbl}>Titles</Text>
        </View>
        <View style={[s.statCard, { borderColor: '#E67E22' }]}>
          <Text style={[s.statVal, { color: '#E67E22' }]}>{totalIssued}</Text>
          <Text style={s.statLbl}>Issued</Text>
        </View>
        <View style={[s.statCard, { borderColor: '#27AE60' }]}>
          <Text style={[s.statVal, { color: '#27AE60' }]}>{totalAvail}</Text>
          <Text style={s.statLbl}>Available</Text>
        </View>
        <View style={[s.statCard, { borderColor: '#F39C12' }]}>
          <Text style={[s.statVal, { color: '#F39C12' }]}>{pendingReqs}</Text>
          <Text style={s.statLbl}>Pending</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === 'inventory' && s.tabActive]} onPress={() => setTab('inventory')}>
          <Text style={[s.tabText, tab === 'inventory' && s.tabTextActive]}>Inventory</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'requests' && s.tabActive]} onPress={() => setTab('requests')}>
          <Text style={[s.tabText, tab === 'requests' && s.tabTextActive]}>All Requests</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#512E5F" style={{ marginTop: vs(40) }} />
      ) : error ? (
        <ErrorView message={error} onRetry={() => tab === 'inventory' ? loadInventory() : loadRequests()} accentColor="#512E5F" />
      ) : tab === 'inventory' ? (
        <ScrollView contentContainerStyle={s.scroll}>
          {inventory.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📦</Text>
              <Text style={s.emptyText}>No books in inventory.</Text>
              <TouchableOpacity style={s.addCta} onPress={openAdd}>
                <Text style={s.addCtaText}>+ Add First Book</Text>
              </TouchableOpacity>
            </View>
          ) : (
            inventory.map(book => {
              const usedPct = book.total_quantity > 0 ? Math.round(((book.total_quantity - book.available_quantity) / book.total_quantity) * 100) : 0;
              return (
                <View key={book.id} style={s.invCard}>
                  <View style={s.invCardTop}>
                    <View style={s.bookIconWrap}>
                      <Text style={{ fontSize: ms(24) }}>📗</Text>
                    </View>
                    <View style={s.invInfo}>
                      <Text style={s.invTitle}>{book.title}</Text>
                      <Text style={s.invMeta}>{book.subject} • {book.author}</Text>
                      {book.required_for_class ? (
                        <Text style={s.invClass}>Class: {book.required_for_class}</Text>
                      ) : null}
                    </View>
                    <TouchableOpacity style={s.editBtn} onPress={() => openEdit(book)}>
                      <Text style={s.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={s.invStats}>
                    <View style={s.invStat}>
                      <Text style={s.invStatVal}>{book.total_quantity}</Text>
                      <Text style={s.invStatLbl}>Total</Text>
                    </View>
                    <View style={s.invStat}>
                      <Text style={[s.invStatVal, { color: '#27AE60' }]}>{book.available_quantity}</Text>
                      <Text style={s.invStatLbl}>Available</Text>
                    </View>
                    <View style={s.invStat}>
                      <Text style={[s.invStatVal, { color: '#E67E22' }]}>{book.pending_requests || 0}</Text>
                      <Text style={s.invStatLbl}>Pending</Text>
                    </View>
                    <View style={s.invStat}>
                      <Text style={[s.invStatVal, { color: '#2980B9' }]}>{book.collected_count || 0}</Text>
                      <Text style={s.invStatLbl}>Issued</Text>
                    </View>
                  </View>

                  {/* Progress bar */}
                  <View style={s.progressBg}>
                    <View style={[s.progressFill, { width: `${usedPct}%` as any }]} />
                  </View>
                  <Text style={s.progressLabel}>{usedPct}% issued</Text>
                </View>
              );
            })
          )}
          <View style={{ height: vs(40) }} />
        </ScrollView>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={{ paddingHorizontal: hs(12), paddingVertical: vs(8) }}>
            {STATUS_FILTERS.map(sf => (
              <TouchableOpacity
                key={sf || 'all'}
                style={[s.filterChip, reqStatusFilter === sf && s.filterChipActive]}
                onPress={() => setReqStatusFilter(sf)}
              >
                <Text style={[s.filterChipText, reqStatusFilter === sf && { color: '#FFF' }]}>
                  {sf || 'All'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView contentContainerStyle={s.scroll}>
            {requests.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyIcon}>📋</Text>
                <Text style={s.emptyText}>No requests found.</Text>
              </View>
            ) : (
              requests.map(req => {
                const color = STATUS_COLOR[req.status] || '#999';
                return (
                  <View key={req.id} style={s.reqCard}>
                    <View style={s.reqLeft}>
                      <Text style={{ fontSize: ms(26) }}>📗</Text>
                    </View>
                    <View style={s.reqBody}>
                      <Text style={s.reqTitle}>{req.title}</Text>
                      <Text style={s.reqStudent}>{req.student_name} • Class {req.student_class}</Text>
                      <Text style={s.reqDate}>
                        {new Date(req.request_date || req.created_at).toLocaleDateString()}
                      </Text>
                      {req.approval_notes ? <Text style={s.reqNote}>{req.approval_notes}</Text> : null}
                    </View>
                    <View style={[s.reqBadge, { backgroundColor: color + '20', borderColor: color }]}>
                      <Text style={[s.reqBadgeText, { color }]}>{req.status?.toUpperCase()}</Text>
                    </View>
                  </View>
                );
              })
            )}
            <View style={{ height: vs(40) }} />
          </ScrollView>
        </>
      )}

      {/* Add / Edit modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowAddModal(false)}>
          <TouchableOpacity activeOpacity={1} style={s.modal}>
            <Text style={s.modalTitle}>{editBook ? 'Edit Book' : 'Add New Book'}</Text>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {[
                { key: 'title',               label: 'Title *',        placeholder: 'Book title' },
                { key: 'author',              label: 'Author',         placeholder: 'Author name' },
                { key: 'subject',             label: 'Subject',        placeholder: 'e.g. Mathematics' },
                { key: 'edition',             label: 'Edition',        placeholder: 'e.g. 2024' },
                { key: 'required_for_class',  label: 'Class',          placeholder: 'e.g. 6 or 6-A' },
                { key: 'total_quantity',      label: 'Total Quantity', placeholder: '0', numeric: true },
                { key: 'price',               label: 'Price (₹)',      placeholder: '0.00',  numeric: true },
                { key: 'isbn',                label: 'ISBN',           placeholder: 'ISBN number' },
              ].map(field => (
                <View key={field.key} style={s.inputGroup}>
                  <Text style={s.inputLabel}>{field.label}</Text>
                  <TextInput
                    style={s.input}
                    placeholder={field.placeholder}
                    placeholderTextColor={colors.textGray}
                    value={(form as any)[field.key]}
                    onChangeText={v => setForm(prev => ({ ...prev, [field.key]: v }))}
                    keyboardType={field.numeric ? 'numeric' : 'default'}
                  />
                </View>
              ))}

              <TouchableOpacity
                style={[s.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#FFF" />
                  : <Text style={s.saveBtnText}>{editBook ? 'Update Book' : 'Add Book'}</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bgMain },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#512E5F', paddingHorizontal: hs(16), paddingVertical: vs(12) },
  backBtn: { padding: 6 },
  backIcon:{ fontSize: 34, color: '#FFF', lineHeight: 34, marginTop: -4 },
  title:   { fontSize: ms(18), fontWeight: '700', color: '#FFF' },
  addBtn:  { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: hs(12), paddingVertical: vs(6), borderRadius: hs(8) },
  addBtnText: { color: '#FFF', fontWeight: '700', fontSize: ms(13) },

  statsRow:  { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#512E5F', paddingBottom: vs(14), paddingHorizontal: hs(8) },
  statCard:  { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', borderRadius: hs(10), paddingHorizontal: hs(14), paddingVertical: vs(8) },
  statVal:   { fontSize: ms(22), fontWeight: '800', color: '#FFF' },
  statLbl:   { fontSize: ms(10), color: 'rgba(255,255,255,0.7)', marginTop: vs(2) },

  tabs:         { flexDirection: 'row', backgroundColor: '#FFF', elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 3 },
  tab:          { flex: 1, paddingVertical: vs(14), alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive:    { borderBottomColor: '#512E5F' },
  tabText:      { fontSize: ms(14), color: colors.textSecond, fontWeight: '600' },
  tabTextActive:{ color: '#512E5F', fontWeight: '800' },

  filterScroll: { backgroundColor: '#F8F9FA', borderBottomWidth: 1, borderBottomColor: colors.border, maxHeight: vs(48) },
  filterChip:   { paddingHorizontal: hs(14), paddingVertical: vs(5), borderRadius: hs(14), borderWidth: 1, borderColor: colors.border, backgroundColor: '#FFF', marginHorizontal: hs(4) },
  filterChipActive: { backgroundColor: '#512E5F', borderColor: '#512E5F' },
  filterChipText:   { fontSize: ms(12), color: colors.textSecond, fontWeight: '600', textTransform: 'capitalize' },

  scroll: { padding: hs(14), paddingBottom: vs(40) },
  empty:  { alignItems: 'center', marginTop: vs(60) },
  emptyIcon: { fontSize: ms(48), marginBottom: vs(12) },
  emptyText: { fontSize: ms(15), color: colors.textSecond, marginBottom: vs(16) },
  addCta:    { backgroundColor: '#512E5F', paddingHorizontal: hs(24), paddingVertical: vs(12), borderRadius: hs(24) },
  addCtaText:{ color: '#FFF', fontWeight: '700', fontSize: ms(14) },

  invCard:     { backgroundColor: '#FFF', borderRadius: hs(14), marginBottom: vs(12), elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 4, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  invCardTop:  { flexDirection: 'row', alignItems: 'center', padding: hs(14) },
  bookIconWrap:{ width: hs(50), height: hs(50), borderRadius: hs(12), backgroundColor: '#F4ECF7', alignItems: 'center', justifyContent: 'center', marginRight: hs(12) },
  invInfo:     { flex: 1 },
  invTitle:    { fontSize: ms(15), fontWeight: '700', color: colors.textPrimary },
  invMeta:     { fontSize: ms(12), color: colors.textSecond, marginTop: vs(2) },
  invClass:    { fontSize: ms(11), color: '#8E44AD', fontWeight: '600', marginTop: vs(2) },
  editBtn:     { backgroundColor: '#F4ECF7', paddingHorizontal: hs(10), paddingVertical: vs(6), borderRadius: hs(8), borderWidth: 1, borderColor: '#D7BDE2' },
  editBtnText: { color: '#512E5F', fontSize: ms(12), fontWeight: '700' },
  invStats:    { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: vs(10), borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: '#F9F9F9' },
  invStat:     { alignItems: 'center' },
  invStatVal:  { fontSize: ms(18), fontWeight: '800', color: colors.textPrimary },
  invStatLbl:  { fontSize: ms(10), color: colors.textSecond, marginTop: vs(2) },
  progressBg:  { height: vs(4), backgroundColor: '#EAECEE', marginHorizontal: hs(14), borderRadius: hs(2) },
  progressFill:{ height: '100%', backgroundColor: '#512E5F', borderRadius: hs(2) },
  progressLabel: { fontSize: ms(10), color: colors.textGray, textAlign: 'right', paddingHorizontal: hs(14), paddingVertical: vs(4) },

  reqCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: hs(12), padding: hs(12), marginBottom: vs(10), elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, borderWidth: 1, borderColor: colors.border },
  reqLeft:   { marginRight: hs(12) },
  reqBody:   { flex: 1 },
  reqTitle:  { fontSize: ms(14), fontWeight: '700', color: colors.textPrimary },
  reqStudent:{ fontSize: ms(12), color: colors.textSecond, marginTop: vs(2) },
  reqDate:   { fontSize: ms(11), color: colors.textGray, marginTop: vs(2) },
  reqNote:   { fontSize: ms(11), color: '#D35400', marginTop: vs(3), fontStyle: 'italic' },
  reqBadge:  { borderWidth: 1, borderRadius: hs(6), paddingHorizontal: hs(8), paddingVertical: vs(4) },
  reqBadgeText: { fontSize: ms(10), fontWeight: '800' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal:   { backgroundColor: '#FFF', borderTopLeftRadius: hs(20), borderTopRightRadius: hs(20), padding: hs(24), paddingBottom: vs(36), maxHeight: '90%' },
  modalTitle: { fontSize: ms(18), fontWeight: '800', color: colors.textPrimary, marginBottom: vs(16) },
  inputGroup: { marginBottom: vs(12) },
  inputLabel: { fontSize: ms(13), fontWeight: '600', color: colors.textSecond, marginBottom: vs(4) },
  input:      { backgroundColor: colors.bgDark, borderRadius: hs(10), padding: hs(12), fontSize: ms(14), color: colors.textPrimary, borderWidth: 1, borderColor: colors.border },
  saveBtn:    { backgroundColor: '#512E5F', paddingVertical: vs(14), borderRadius: hs(12), alignItems: 'center', marginTop: vs(8) },
  saveBtnText:{ color: '#FFF', fontSize: ms(15), fontWeight: '700' },
  cancelBtn:  { marginTop: vs(10), paddingVertical: vs(12), backgroundColor: colors.bgDark, borderRadius: hs(10) },
  cancelText: { textAlign: 'center', color: colors.textSecond, fontSize: ms(14), fontWeight: '600' },
});

export default AdminBooksScreen;
