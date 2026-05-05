import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { hs, vs, ms } from '../../theme/scale';
import api from '../../config/api';

const AdminBillingScreen = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [classProgress, setClassProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        setLoading(true);
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
        const [overviewRes, progressRes, txRes] = await Promise.allSettled([
          api.get('/billing/overview', config),
          api.get('/billing/class-progress', config),
          api.get('/billing/transactions', config),
        ]);

        if (overviewRes.status === 'fulfilled') {
          setOverview(overviewRes.value.data);
        }
        if (progressRes.status === 'fulfilled' && Array.isArray(progressRes.value.data) && progressRes.value.data.length > 0) {
          const mapped = progressRes.value.data.slice(0, 5).map((item: any, idx: number) => ({
            id: `c-${idx}`,
            name: item.className || item.class || `Class ${idx + 1}`,
            value: Number(item.percentage || item.progress || 0),
          }));
          setClassProgress(mapped);
        }
        if (txRes.status === 'fulfilled' && Array.isArray(txRes.value.data) && txRes.value.data.length > 0) {
          const mappedTx = txRes.value.data.slice(0, 10).map((tx: any, idx: number) => ({
            id: String(tx.id || `tx-${idx}`),
            name: tx.student_name || tx.studentName || tx.name || 'Student',
            className: tx.class || tx.className || 'N/A',
            amount: Number(tx.amount || tx.paidAmount || 0),
            date: new Date(tx.date || tx.created_at || Date.now()).toLocaleDateString(),
            status: tx.status || 'Paid',
          }));
          setTransactions(mappedTx as any);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchBillingData();
  }, [token]);

  const summary = useMemo(() => {
    const collectedFromTx = transactions.reduce((total, tx) => total + Number(tx.amount || 0), 0);
    const expected = Number(overview?.expected ?? overview?.totalExpected ?? 0);
    const collected = Number(overview?.collected ?? overview?.totalCollected ?? collectedFromTx);
    const outstanding = Number(overview?.outstanding ?? Math.max(expected - collected, 0));
    const overdueCount = Number(overview?.overdueNoticesToday ?? transactions.filter((tx) => String(tx.status).toLowerCase() === 'overdue').length);
    return { expected, collected, outstanding, overdueCount };
  }, [overview, transactions]);

  const derivedClassProgress = useMemo(() => {
    if (classProgress.length > 0) return classProgress;
    const byClass = transactions.reduce((acc: Record<string, { total: number; paid: number }>, tx: any) => {
      const cls = tx.className || tx.class || 'N/A';
      if (!acc[cls]) acc[cls] = { total: 0, paid: 0 };
      const amount = Number(tx.amount || 0);
      acc[cls].total += amount;
      if (String(tx.status || '').toLowerCase() !== 'overdue') acc[cls].paid += amount;
      return acc;
    }, {});
    return Object.entries(byClass).slice(0, 6).map(([cls, val], idx) => ({
      id: `derived-${idx}`,
      name: cls,
      value: val.total > 0 ? Math.round((val.paid / val.total) * 100) : 0,
    }));
  }, [classProgress, transactions]);

  const getProgressColor = (value: number) => {
    if (value >= 85) return '#16A34A';
    if (value >= 70) return '#F59E0B';
    return '#DC2626';
  };

  const getBadgeStyle = (status: string) => {
    if (status === 'Paid') return { bg: '#DCFCE7', text: '#16A34A' };
    if (status === 'Partial') return { bg: '#FEF3C7', text: '#D97706' };
    return { bg: '#FEE2E2', text: '#DC2626' };
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Billing Overview</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {loading ? <ActivityIndicator color="#2C3E50" style={{ marginBottom: vs(18) }} /> : null}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Fees Expected</Text>
            <Text style={styles.statValue}>Rs.{summary.expected.toLocaleString()}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Collected</Text>
            <Text style={styles.statValue}>Rs.{summary.collected.toLocaleString()}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Outstanding</Text>
            <Text style={styles.statValue}>Rs.{summary.outstanding.toLocaleString()}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Notices Today</Text>
            <Text style={styles.statValue}>{summary.overdueCount}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Class Collection Progress</Text>
        <View style={styles.sectionCard}>
          {derivedClassProgress.map((item) => (
            <View key={item.id} style={styles.progressRow}>
              <View style={styles.progressHeader}>
                <Text style={styles.className}>{item.name}</Text>
                <Text style={styles.progressPercent}>{item.value}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${item.value}%`, backgroundColor: getProgressColor(item.value) }]} />
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <View style={styles.sectionCard}>
          {transactions.length === 0 ? <Text style={styles.txMeta}>No transactions available.</Text> : null}
          {transactions.map((tx) => {
            const badge = getBadgeStyle(tx.status);
            return (
              <View key={tx.id} style={styles.txRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txName}>{tx.name}</Text>
                  <Text style={styles.txMeta}>{tx.className}  |  {tx.date}</Text>
                </View>
                <View style={styles.txRight}>
                  <Text style={styles.txAmount}>Rs.{tx.amount.toLocaleString()}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusText, { color: badge.text }]}>{tx.status}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgMain },
  header: { backgroundColor: '#2C3E50', paddingHorizontal: hs(20), paddingVertical: vs(16), alignItems: 'center' },
  title: { fontSize: ms(20), fontWeight: '700', color: '#FFF' },
  container: { padding: hs(20) },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: vs(22) },
  statCard: { width: '48%', backgroundColor: '#FFF', borderRadius: hs(12), borderWidth: 1, borderColor: '#E2E8F0', padding: hs(14), marginBottom: vs(12) },
  statLabel: { fontSize: ms(12), color: '#64748B', marginBottom: vs(4) },
  statValue: { fontSize: ms(18), color: '#0F172A', fontWeight: '700' },
  sectionTitle: { fontSize: ms(17), fontWeight: '700', color: '#1E293B', marginBottom: vs(12) },
  sectionCard: { backgroundColor: '#FFF', borderRadius: hs(12), borderWidth: 1, borderColor: '#E2E8F0', padding: hs(14), marginBottom: vs(18) },
  progressRow: { marginBottom: vs(14) },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: vs(6) },
  className: { fontSize: ms(14), fontWeight: '700', color: '#334155' },
  progressPercent: { fontSize: ms(13), color: '#334155', fontWeight: '600' },
  progressTrack: { height: vs(8), borderRadius: hs(6), backgroundColor: '#E5E7EB', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: hs(6) },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: vs(9), borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  txName: { fontSize: ms(14), color: '#0F172A', fontWeight: '700', marginBottom: vs(2) },
  txMeta: { fontSize: ms(12), color: '#64748B' },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: ms(13), fontWeight: '700', color: '#0F172A', marginBottom: vs(3) },
  statusBadge: { borderRadius: hs(12), paddingHorizontal: hs(8), paddingVertical: vs(3) },
  statusText: { fontSize: ms(11), fontWeight: '700' },
});

export default AdminBillingScreen;
