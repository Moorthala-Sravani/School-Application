import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar,
  ActivityIndicator, Alert, Modal, TextInput, Switch, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import api from '../../config/api';
import ErrorView from '../../components/common/ErrorView';
import { getErrorMessage } from '../../utils/errorUtils';
import { colors } from '../../theme/colors';
import { hs, vs, ms } from '../../theme/scale';

const authH = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

type Tab = 'uniforms' | 'fees' | 'leaves' | 'summary';

const APPLICABLE = ['student', 'teacher', 'both'];

const AdminConfiguratorScreen = ({ navigation }: any) => {
  const { token } = useSelector((state: RootState) => state.auth);

  const [tab, setTab]               = useState<Tab>('uniforms');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);

  // Data
  const [uniforms, setUniforms]     = useState<any[]>([]);
  const [fees, setFees]             = useState<any[]>([]);
  const [leaves, setLeaves]         = useState<any[]>([]);
  const [workingDays, setWorkingDays]     = useState('220');
  const [minAttendance, setMinAttendance] = useState('75');

  // Modal state
  const [modal, setModal]           = useState<{ type: string; item?: any } | null>(null);
  const [formFields, setFormFields] = useState<Record<string, string>>({});

  const loadAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/config', authH(token));
      const data = res.data;
      setUniforms(data.uniforms || []);
      setFees(data.fees || []);
      setLeaves(data.leaves || []);
      setWorkingDays(data.settings?.working_days || '220');
      setMinAttendance(data.settings?.min_attendance || '75');
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Settings save ────────────────────────────────────────────────────────
  const saveSettings = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await api.put('/admin/settings', { working_days: workingDays, min_attendance: minAttendance }, authH(token));
      Alert.alert('Saved', 'Attendance settings updated.');
    } catch {
      Alert.alert('Error', 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  };

  // ── Generic delete ───────────────────────────────────────────────────────
  const handleDelete = (type: string, id: number, name: string) => {
    Alert.alert('Remove', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/admin/${type}/${id}`, authH(token!));
            loadAll();
          } catch {
            Alert.alert('Error', 'Could not remove item.');
          }
        },
      },
    ]);
  };

  // ── Modal open helpers ───────────────────────────────────────────────────
  const openAddUniform = () => {
    setFormFields({ class_range: '', components: '', annual_cost: '' });
    setModal({ type: 'uniform' });
  };
  const openEditUniform = (item: any) => {
    setFormFields({ class_range: item.class_range, components: item.components || '', annual_cost: String(item.annual_cost || '') });
    setModal({ type: 'uniform', item });
  };
  const openAddFee = () => {
    setFormFields({ name: '', monthly_amount: '' });
    setModal({ type: 'fee' });
  };
  const openEditFee = (item: any) => {
    setFormFields({ name: item.name, monthly_amount: String(item.monthly_amount || '') });
    setModal({ type: 'fee', item });
  };
  const openAddLeave = () => {
    setFormFields({ type_name: '', days_allowed: '', applicable_to: 'student' });
    setModal({ type: 'leave' });
  };
  const openEditLeave = (item: any) => {
    setFormFields({ type_name: item.type_name, days_allowed: String(item.days_allowed || ''), applicable_to: item.applicable_to || 'student' });
    setModal({ type: 'leave', item });
  };

  // ── Save modal ───────────────────────────────────────────────────────────
  const handleSaveModal = async () => {
    if (!token || !modal) return;
    setSaving(true);
    try {
      const { type, item } = modal;
      if (type === 'uniform') {
        if (!formFields.class_range?.trim()) { Alert.alert('Required', 'Class range is required'); setSaving(false); return; }
        if (item) await api.put(`/admin/uniforms/${item.id}`, formFields, authH(token));
        else await api.post('/admin/uniforms', formFields, authH(token));
      } else if (type === 'fee') {
        if (!formFields.name?.trim()) { Alert.alert('Required', 'Fee name is required'); setSaving(false); return; }
        if (item) await api.put(`/admin/fee-types/${item.id}`, formFields, authH(token));
        else await api.post('/admin/fee-types', formFields, authH(token));
      } else if (type === 'leave') {
        if (!formFields.type_name?.trim()) { Alert.alert('Required', 'Leave type name is required'); setSaving(false); return; }
        if (item) await api.put(`/admin/leave-types/${item.id}`, formFields, authH(token));
        else await api.post('/admin/leave-types', formFields, authH(token));
      }
      setModal(null);
      loadAll();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  // ── Computed metrics ─────────────────────────────────────────────────────
  const totalMonthlyFee = fees.reduce((s, f) => s + parseFloat(f.monthly_amount || 0), 0);
  const annualFee       = totalMonthlyFee * 12;
  const avgUniformCost  = uniforms.length > 0
    ? uniforms.reduce((s, u) => s + parseFloat(u.annual_cost || 0), 0) / uniforms.length
    : 0;
  const totalLeaveDays  = leaves.reduce((s, l) => s + parseInt(l.days_allowed || 0), 0);

  const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

  // ── Export ───────────────────────────────────────────────────────────────
  const handleExport = async () => {
    const config = {
      uniforms, fees, leaves,
      settings: { working_days: workingDays, min_attendance: minAttendance },
      exportDate: new Date().toISOString(),
    };
    try {
      await Share.share({ message: JSON.stringify(config, null, 2), title: 'School Config Export' });
    } catch {
      Alert.alert('Export', JSON.stringify(config, null, 2).slice(0, 500) + '\n...');
    }
  };

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'uniforms', label: 'Uniforms',  icon: '👕' },
    { key: 'fees',     label: 'Fees',      icon: '💰' },
    { key: 'leaves',   label: 'Leaves',    icon: '📅' },
    { key: 'summary',  label: 'Summary',   icon: '📊' },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#17202A" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>⚙️ System Configurator</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.tab, tab === t.key && s.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={s.tabIcon}>{t.icon}</Text>
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#17202A" style={{ marginTop: vs(40) }} />
      ) : error ? (
        <ErrorView message={error} onRetry={loadAll} accentColor="#17202A" />
      ) : (
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* ── UNIFORMS TAB ────────────────────────────────────────────── */}
          {tab === 'uniforms' && (
            <>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Uniform Classes & Pricing</Text>
                <TouchableOpacity style={s.addBtn} onPress={openAddUniform}>
                  <Text style={s.addBtnText}>+ Add Class</Text>
                </TouchableOpacity>
              </View>

              {uniforms.length === 0 ? (
                <View style={s.empty}><Text style={s.emptyText}>No uniform classes configured.</Text></View>
              ) : uniforms.map(u => (
                <View key={u.id} style={s.itemCard}>
                  <View style={s.itemCardLeft}>
                    <Text style={{ fontSize: ms(26) }}>👕</Text>
                  </View>
                  <View style={s.itemCardBody}>
                    <Text style={s.itemTitle}>Class {u.class_range}</Text>
                    <Text style={s.itemSub}>{u.components}</Text>
                    <View style={s.costBadge}>
                      <Text style={s.costText}>{fmt(u.annual_cost)} / year</Text>
                    </View>
                  </View>
                  <View style={s.itemActions}>
                    <TouchableOpacity style={s.editIconBtn} onPress={() => openEditUniform(u)}>
                      <Text style={s.editIconText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.delIconBtn} onPress={() => handleDelete('uniforms', u.id, `Class ${u.class_range}`)}>
                      <Text style={s.delIconText}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <View style={s.summaryBox}>
                <Text style={s.summaryBoxTitle}>Summary</Text>
                <View style={s.metricRow}>
                  <View style={s.metricCard}>
                    <Text style={s.metricVal}>{uniforms.length}</Text>
                    <Text style={s.metricLbl}>Classes Configured</Text>
                  </View>
                  <View style={s.metricCard}>
                    <Text style={s.metricVal}>{fmt(avgUniformCost)}</Text>
                    <Text style={s.metricLbl}>Average Annual Cost</Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {/* ── FEES TAB ─────────────────────────────────────────────────── */}
          {tab === 'fees' && (
            <>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Monthly Fee Types</Text>
                <TouchableOpacity style={s.addBtn} onPress={openAddFee}>
                  <Text style={s.addBtnText}>+ Add Fee</Text>
                </TouchableOpacity>
              </View>

              <View style={s.settingsCard}>
                <Text style={s.settingsTitle}>Attendance Configuration</Text>
                <View style={s.settingsRow}>
                  <View style={s.settingsField}>
                    <Text style={s.fieldLabel}>Working Days / Year</Text>
                    <TextInput
                      style={s.fieldInput}
                      value={workingDays}
                      onChangeText={setWorkingDays}
                      keyboardType="numeric"
                      placeholder="220"
                      placeholderTextColor={colors.textGray}
                    />
                  </View>
                  <View style={s.settingsField}>
                    <Text style={s.fieldLabel}>Min Attendance %</Text>
                    <TextInput
                      style={s.fieldInput}
                      value={minAttendance}
                      onChangeText={setMinAttendance}
                      keyboardType="numeric"
                      placeholder="75"
                      placeholderTextColor={colors.textGray}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={[s.saveSettingsBtn, saving && { opacity: 0.6 }]}
                  onPress={saveSettings}
                  disabled={saving}
                >
                  {saving
                    ? <ActivityIndicator color="#FFF" size="small" />
                    : <Text style={s.saveSettingsBtnText}>Save Attendance Settings</Text>
                  }
                </TouchableOpacity>
              </View>

              {fees.length === 0 ? (
                <View style={s.empty}><Text style={s.emptyText}>No fee types configured.</Text></View>
              ) : fees.map(f => (
                <View key={f.id} style={s.itemCard}>
                  <View style={s.itemCardLeft}>
                    <Text style={{ fontSize: ms(26) }}>💰</Text>
                  </View>
                  <View style={s.itemCardBody}>
                    <Text style={s.itemTitle}>{f.name}</Text>
                    <View style={s.costBadge}>
                      <Text style={s.costText}>{fmt(f.monthly_amount)} / month</Text>
                    </View>
                    <Text style={s.annualNote}>{fmt(f.monthly_amount * 12)} / year</Text>
                  </View>
                  <View style={s.itemActions}>
                    <TouchableOpacity style={s.editIconBtn} onPress={() => openEditFee(f)}>
                      <Text style={s.editIconText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.delIconBtn} onPress={() => handleDelete('fee-types', f.id, f.name)}>
                      <Text style={s.delIconText}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <View style={s.summaryBox}>
                <Text style={s.summaryBoxTitle}>Summary</Text>
                <View style={s.metricRow}>
                  <View style={s.metricCard}>
                    <Text style={s.metricVal}>{fmt(totalMonthlyFee)}</Text>
                    <Text style={s.metricLbl}>Total / Month</Text>
                  </View>
                  <View style={s.metricCard}>
                    <Text style={s.metricVal}>{fmt(annualFee)}</Text>
                    <Text style={s.metricLbl}>Total / Year</Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {/* ── LEAVES TAB ───────────────────────────────────────────────── */}
          {tab === 'leaves' && (
            <>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Leave Types & Limits</Text>
                <TouchableOpacity style={s.addBtn} onPress={openAddLeave}>
                  <Text style={s.addBtnText}>+ Add Leave</Text>
                </TouchableOpacity>
              </View>

              {leaves.length === 0 ? (
                <View style={s.empty}><Text style={s.emptyText}>No leave types configured.</Text></View>
              ) : leaves.map(l => (
                <View key={l.id} style={[s.itemCard, { borderLeftColor: '#27AE60' }]}>
                  <View style={s.itemCardLeft}>
                    <Text style={{ fontSize: ms(26) }}>📅</Text>
                  </View>
                  <View style={s.itemCardBody}>
                    <Text style={s.itemTitle}>{l.type_name} Leave</Text>
                    <View style={s.daysRow}>
                      <View style={s.daysBadge}>
                        <Text style={s.daysVal}>{l.days_allowed}</Text>
                        <Text style={s.daysLbl}>days/year</Text>
                      </View>
                      <View style={[s.appBadge, { backgroundColor: l.applicable_to === 'teacher' ? '#EBF5FB' : '#EAFAF1' }]}>
                        <Text style={[s.appText, { color: l.applicable_to === 'teacher' ? '#2980B9' : '#27AE60' }]}>
                          {l.applicable_to === 'both' ? '👤👩‍🏫' : l.applicable_to === 'teacher' ? '👩‍🏫 Teacher' : '👤 Student'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={s.itemActions}>
                    <TouchableOpacity style={s.editIconBtn} onPress={() => openEditLeave(l)}>
                      <Text style={s.editIconText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.delIconBtn} onPress={() => handleDelete('leave-types', l.id, `${l.type_name} Leave`)}>
                      <Text style={s.delIconText}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <View style={s.summaryBox}>
                <Text style={s.summaryBoxTitle}>Summary</Text>
                <View style={s.metricRow}>
                  <View style={s.metricCard}>
                    <Text style={s.metricVal}>{leaves.length}</Text>
                    <Text style={s.metricLbl}>Leave Types</Text>
                  </View>
                  <View style={s.metricCard}>
                    <Text style={s.metricVal}>{totalLeaveDays}</Text>
                    <Text style={s.metricLbl}>Total Days Available</Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {/* ── SUMMARY TAB ──────────────────────────────────────────────── */}
          {tab === 'summary' && (
            <>
              <Text style={s.sectionTitle}>Complete System Summary</Text>

              <View style={s.summaryGrid}>
                {[
                  { icon: '👕', label: 'Uniform Classes',        val: String(uniforms.length) },
                  { icon: '💰', label: 'Annual Fee / Student',   val: fmt(annualFee) },
                  { icon: '💵', label: 'Monthly Fee',            val: fmt(totalMonthlyFee) },
                  { icon: '📅', label: 'Leave Days / Student',   val: String(totalLeaveDays) },
                  { icon: '📆', label: 'Working Days / Year',    val: workingDays },
                  { icon: '✅', label: 'Min Attendance',         val: `${minAttendance}%` },
                  { icon: '📚', label: 'Avg Uniform Cost',       val: fmt(avgUniformCost) },
                  { icon: '📋', label: 'Fee Types Configured',   val: String(fees.length) },
                ].map(item => (
                  <View key={item.label} style={s.summaryCard}>
                    <Text style={s.summaryCardIcon}>{item.icon}</Text>
                    <Text style={s.summaryCardVal}>{item.val}</Text>
                    <Text style={s.summaryCardLbl}>{item.label}</Text>
                  </View>
                ))}
              </View>

              <View style={s.breakdownSection}>
                <Text style={s.breakdownTitle}>Fee Breakdown</Text>
                {fees.map(f => (
                  <View key={f.id} style={s.breakdownRow}>
                    <Text style={s.breakdownName}>{f.name}</Text>
                    <Text style={s.breakdownAmt}>{fmt(f.monthly_amount)}/mo</Text>
                  </View>
                ))}
                <View style={[s.breakdownRow, s.breakdownTotal]}>
                  <Text style={s.breakdownTotalName}>Total</Text>
                  <Text style={s.breakdownTotalAmt}>{fmt(totalMonthlyFee)}/mo • {fmt(annualFee)}/yr</Text>
                </View>
              </View>

              <TouchableOpacity style={s.exportBtn} onPress={handleExport}>
                <Text style={s.exportBtnText}>📤 Export Configuration (JSON)</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: vs(40) }} />
        </ScrollView>
      )}

      {/* ── Add / Edit Modal ──────────────────────────────────────────────── */}
      <Modal visible={!!modal} transparent animationType="slide">
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setModal(null)}>
          <TouchableOpacity activeOpacity={1} style={s.modal}>
            {modal?.type === 'uniform' && (
              <>
                <Text style={s.modalTitle}>{modal.item ? 'Edit Uniform Class' : 'Add Uniform Class'}</Text>
                {[
                  { key: 'class_range', label: 'Class Range *', placeholder: 'e.g. 6-8' },
                  { key: 'components',  label: 'Components',    placeholder: 'e.g. Shirt, Pants, Tie' },
                  { key: 'annual_cost', label: 'Annual Cost (₹)', placeholder: '1500', numeric: true },
                ].map(f => (
                  <View key={f.key} style={s.inputGroup}>
                    <Text style={s.inputLabel}>{f.label}</Text>
                    <TextInput
                      style={s.input}
                      value={formFields[f.key] || ''}
                      onChangeText={v => setFormFields(p => ({ ...p, [f.key]: v }))}
                      placeholder={f.placeholder}
                      placeholderTextColor={colors.textGray}
                      keyboardType={f.numeric ? 'numeric' : 'default'}
                    />
                  </View>
                ))}
              </>
            )}

            {modal?.type === 'fee' && (
              <>
                <Text style={s.modalTitle}>{modal.item ? 'Edit Fee Type' : 'Add Fee Type'}</Text>
                {[
                  { key: 'name',           label: 'Fee Name *',       placeholder: 'e.g. Tuition' },
                  { key: 'monthly_amount', label: 'Monthly Amount (₹)', placeholder: '5000', numeric: true },
                ].map(f => (
                  <View key={f.key} style={s.inputGroup}>
                    <Text style={s.inputLabel}>{f.label}</Text>
                    <TextInput
                      style={s.input}
                      value={formFields[f.key] || ''}
                      onChangeText={v => setFormFields(p => ({ ...p, [f.key]: v }))}
                      placeholder={f.placeholder}
                      placeholderTextColor={colors.textGray}
                      keyboardType={f.numeric ? 'numeric' : 'default'}
                    />
                  </View>
                ))}
              </>
            )}

            {modal?.type === 'leave' && (
              <>
                <Text style={s.modalTitle}>{modal.item ? 'Edit Leave Type' : 'Add Leave Type'}</Text>
                {[
                  { key: 'type_name',    label: 'Leave Type *',  placeholder: 'e.g. Medical' },
                  { key: 'days_allowed', label: 'Days Allowed',  placeholder: '10', numeric: true },
                ].map(f => (
                  <View key={f.key} style={s.inputGroup}>
                    <Text style={s.inputLabel}>{f.label}</Text>
                    <TextInput
                      style={s.input}
                      value={formFields[f.key] || ''}
                      onChangeText={v => setFormFields(p => ({ ...p, [f.key]: v }))}
                      placeholder={f.placeholder}
                      placeholderTextColor={colors.textGray}
                      keyboardType={f.numeric ? 'numeric' : 'default'}
                    />
                  </View>
                ))}
                <View style={s.inputGroup}>
                  <Text style={s.inputLabel}>Applicable To</Text>
                  <View style={s.toggleRow}>
                    {APPLICABLE.map(opt => (
                      <TouchableOpacity
                        key={opt}
                        style={[s.toggleChip, formFields.applicable_to === opt && s.toggleChipActive]}
                        onPress={() => setFormFields(p => ({ ...p, applicable_to: opt }))}
                      >
                        <Text style={[s.toggleChipText, formFields.applicable_to === opt && s.toggleChipTextActive]}>
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            <TouchableOpacity
              style={[s.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSaveModal}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#FFF" />
                : <Text style={s.saveBtnText}>{modal?.item ? 'Update' : 'Add'}</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setModal(null)}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const ACCENT = '#17202A';

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bgMain },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: ACCENT, paddingHorizontal: hs(16), paddingVertical: vs(12) },
  backBtn: { padding: 6 },
  backIcon:{ fontSize: 34, color: '#FFF', lineHeight: 34, marginTop: -4 },
  title:   { fontSize: ms(18), fontWeight: '700', color: '#FFF' },

  tabs:         { flexDirection: 'row', backgroundColor: ACCENT },
  tab:          { flex: 1, alignItems: 'center', paddingVertical: vs(10), borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive:    { borderBottomColor: '#E67E22' },
  tabIcon:      { fontSize: ms(16), marginBottom: vs(2) },
  tabText:      { fontSize: ms(10), color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
  tabTextActive:{ color: '#FFF', fontWeight: '800' },

  scroll: { padding: hs(16), paddingBottom: vs(40) },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: vs(14) },
  sectionTitle:  { fontSize: ms(16), fontWeight: '800', color: colors.textPrimary, marginBottom: vs(14) },
  addBtn:        { backgroundColor: ACCENT, paddingHorizontal: hs(14), paddingVertical: vs(8), borderRadius: hs(8) },
  addBtnText:    { color: '#FFF', fontWeight: '700', fontSize: ms(13) },

  empty:     { alignItems: 'center', paddingVertical: vs(30) },
  emptyText: { color: colors.textSecond, fontSize: ms(14) },

  itemCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: hs(14), padding: hs(14), marginBottom: vs(10), elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 4, borderLeftWidth: 4, borderLeftColor: ACCENT },
  itemCardLeft:{ marginRight: hs(12) },
  itemCardBody:{ flex: 1 },
  itemTitle:   { fontSize: ms(15), fontWeight: '700', color: colors.textPrimary },
  itemSub:     { fontSize: ms(12), color: colors.textSecond, marginTop: vs(2) },
  costBadge:   { alignSelf: 'flex-start', backgroundColor: '#EBF5FB', borderRadius: hs(4), paddingHorizontal: hs(8), paddingVertical: vs(3), marginTop: vs(6) },
  costText:    { fontSize: ms(12), color: '#1A5276', fontWeight: '700' },
  annualNote:  { fontSize: ms(11), color: colors.textGray, marginTop: vs(2) },
  itemActions: { gap: vs(6), alignItems: 'center' },
  editIconBtn: { padding: hs(6) },
  editIconText:{ fontSize: ms(18) },
  delIconBtn:  { padding: hs(6) },
  delIconText: { fontSize: ms(18) },

  daysRow:   { flexDirection: 'row', alignItems: 'center', marginTop: vs(6), gap: hs(8) },
  daysBadge: { backgroundColor: '#EAFAF1', borderRadius: hs(6), paddingHorizontal: hs(10), paddingVertical: vs(4), alignItems: 'center' },
  daysVal:   { fontSize: ms(16), fontWeight: '800', color: '#27AE60' },
  daysLbl:   { fontSize: ms(9), color: '#27AE60' },
  appBadge:  { borderRadius: hs(6), paddingHorizontal: hs(8), paddingVertical: vs(4) },
  appText:   { fontSize: ms(11), fontWeight: '600' },

  summaryBox:     { backgroundColor: '#F4F6F7', borderRadius: hs(14), padding: hs(16), marginTop: vs(16) },
  summaryBoxTitle:{ fontSize: ms(14), fontWeight: '700', color: colors.textPrimary, marginBottom: vs(10) },
  metricRow:      { flexDirection: 'row', gap: hs(10) },
  metricCard:     { flex: 1, backgroundColor: '#FFF', borderRadius: hs(10), padding: hs(14), alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3 },
  metricVal:      { fontSize: ms(18), fontWeight: '800', color: ACCENT },
  metricLbl:      { fontSize: ms(11), color: colors.textSecond, marginTop: vs(4), textAlign: 'center' },

  settingsCard:      { backgroundColor: '#FFF', borderRadius: hs(14), padding: hs(16), marginBottom: vs(14), elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 4, borderWidth: 1, borderColor: colors.border },
  settingsTitle:     { fontSize: ms(14), fontWeight: '700', color: colors.textPrimary, marginBottom: vs(12) },
  settingsRow:       { flexDirection: 'row', gap: hs(12), marginBottom: vs(12) },
  settingsField:     { flex: 1 },
  fieldLabel:        { fontSize: ms(12), fontWeight: '600', color: colors.textSecond, marginBottom: vs(4) },
  fieldInput:        { backgroundColor: colors.bgDark, borderRadius: hs(8), padding: hs(10), fontSize: ms(14), color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, textAlign: 'center' },
  saveSettingsBtn:   { backgroundColor: ACCENT, paddingVertical: vs(10), borderRadius: hs(8), alignItems: 'center' },
  saveSettingsBtnText: { color: '#FFF', fontWeight: '700', fontSize: ms(13) },

  summaryGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: hs(10), marginBottom: vs(20) },
  summaryCard:       { width: '47%', backgroundColor: '#FFF', borderRadius: hs(14), padding: hs(14), alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 4, borderWidth: 1, borderColor: colors.border },
  summaryCardIcon:   { fontSize: ms(24), marginBottom: vs(6) },
  summaryCardVal:    { fontSize: ms(16), fontWeight: '800', color: ACCENT, textAlign: 'center' },
  summaryCardLbl:    { fontSize: ms(11), color: colors.textSecond, marginTop: vs(4), textAlign: 'center' },

  breakdownSection:  { backgroundColor: '#FFF', borderRadius: hs(14), padding: hs(16), marginBottom: vs(14), elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 4, borderWidth: 1, borderColor: colors.border },
  breakdownTitle:    { fontSize: ms(14), fontWeight: '700', color: colors.textPrimary, marginBottom: vs(12) },
  breakdownRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: vs(8), borderBottomWidth: 1, borderBottomColor: colors.border },
  breakdownName:     { fontSize: ms(14), color: colors.textPrimary },
  breakdownAmt:      { fontSize: ms(14), color: colors.textSecond },
  breakdownTotal:    { borderBottomWidth: 0, marginTop: vs(4), paddingTop: vs(8), borderTopWidth: 2, borderTopColor: ACCENT },
  breakdownTotalName:{ fontSize: ms(15), fontWeight: '800', color: ACCENT },
  breakdownTotalAmt: { fontSize: ms(13), fontWeight: '700', color: ACCENT },

  exportBtn:      { backgroundColor: ACCENT, paddingVertical: vs(14), borderRadius: hs(12), alignItems: 'center' },
  exportBtnText:  { color: '#FFF', fontWeight: '700', fontSize: ms(15) },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal:   { backgroundColor: '#FFF', borderTopLeftRadius: hs(20), borderTopRightRadius: hs(20), padding: hs(24), paddingBottom: vs(36) },
  modalTitle:  { fontSize: ms(18), fontWeight: '800', color: colors.textPrimary, marginBottom: vs(16) },
  inputGroup:  { marginBottom: vs(12) },
  inputLabel:  { fontSize: ms(13), fontWeight: '600', color: colors.textSecond, marginBottom: vs(4) },
  input:       { backgroundColor: colors.bgDark, borderRadius: hs(10), padding: hs(12), fontSize: ms(14), color: colors.textPrimary, borderWidth: 1, borderColor: colors.border },
  toggleRow:   { flexDirection: 'row', gap: hs(8) },
  toggleChip:  { flex: 1, paddingVertical: vs(8), borderRadius: hs(8), borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  toggleChipActive:   { backgroundColor: ACCENT, borderColor: ACCENT },
  toggleChipText:     { fontSize: ms(13), color: colors.textSecond, fontWeight: '600' },
  toggleChipTextActive: { color: '#FFF' },
  saveBtn:    { backgroundColor: ACCENT, paddingVertical: vs(14), borderRadius: hs(12), alignItems: 'center', marginTop: vs(8) },
  saveBtnText:{ color: '#FFF', fontSize: ms(15), fontWeight: '700' },
  cancelBtn:  { marginTop: vs(10), paddingVertical: vs(12), backgroundColor: colors.bgDark, borderRadius: hs(10) },
  cancelText: { textAlign: 'center', color: colors.textSecond, fontSize: ms(14), fontWeight: '600' },
});

export default AdminConfiguratorScreen;
