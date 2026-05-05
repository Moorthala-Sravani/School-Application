import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { hs, vs, ms } from '../../theme/scale';
import api from '../../config/api';

const AdminPaymentsScreen = ({ navigation }: any) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payments/all');
      setPayments(response.data);
    } catch (err) {
      // Failed to fetch payments
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#2C3E50" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Payment History</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>All Received Fees</Text>

        {loading ? (
          <ActivityIndicator color="#2C3E50" style={{ marginTop: vs(20) }} />
        ) : payments.length === 0 ? (
          <Text style={{ color: colors.textSecond, textAlign: 'center', marginTop: vs(20) }}>No payments found.</Text>
        ) : (
          payments.map((payment, idx) => (
            <View key={idx} style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <Text style={styles.studentId}>Student: {payment.student_id}</Text>
                <Text style={[styles.statusBadge, payment.status === 'success' ? styles.statusSuccess : styles.statusPending]}>
                  {payment.status.toUpperCase()}
                </Text>
              </View>
              <View style={styles.paymentDetails}>
                <View>
                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text style={styles.amount}>₹{payment.amount}</Text>
                </View>
                <View>
                  <Text style={styles.detailLabel}>Method</Text>
                  <Text style={styles.detailValue}>{payment.payment_method}</Text>
                </View>
              </View>
              <View style={styles.txnBox}>
                <Text style={styles.txnLabel}>Transaction ID: </Text>
                <Text style={styles.txnValue}>{payment.transaction_id || 'N/A'}</Text>
              </View>
              <Text style={styles.date}>{new Date(payment.created_at).toLocaleString()}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgMain },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#2C3E50', paddingHorizontal: hs(16), paddingVertical: vs(12) },
  backBtn: { padding: 6 },
  backIcon: { fontSize: 34, color: '#FFF', lineHeight: 34, marginTop: -4 },
  title: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  container: { padding: hs(20), paddingBottom: vs(40) },
  sectionTitle: { fontSize: ms(18), fontWeight: '700', color: colors.textPrimary, marginBottom: vs(16) },
  
  paymentCard: { backgroundColor: '#FFF', borderRadius: hs(12), padding: hs(16), marginBottom: vs(16), borderWidth: 1, borderColor: '#EBF5FB', elevation: 2, shadowColor: '#3498DB', shadowOpacity: 0.1, shadowRadius: 4 },
  paymentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(12) },
  studentId: { fontSize: ms(16), fontWeight: '700', color: '#2C3E50' },
  statusBadge: { paddingHorizontal: hs(8), paddingVertical: vs(4), borderRadius: hs(4), fontSize: ms(10), fontWeight: '700', overflow: 'hidden' },
  statusSuccess: { backgroundColor: '#E8F8F5', color: '#27AE60' },
  statusPending: { backgroundColor: '#FEF9E7', color: '#F1C40F' },
  
  paymentDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: vs(12), paddingBottom: vs(12), borderBottomWidth: 1, borderBottomColor: '#F2F4F4' },
  detailLabel: { fontSize: ms(12), color: '#7F8C8D', marginBottom: vs(4) },
  amount: { fontSize: ms(18), fontWeight: '800', color: '#2C3E50' },
  detailValue: { fontSize: ms(15), fontWeight: '600', color: '#34495E' },

  txnBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9F9', padding: hs(8), borderRadius: hs(6), marginBottom: vs(8) },
  txnLabel: { fontSize: ms(12), color: '#7F8C8D', fontWeight: '500' },
  txnValue: { fontSize: ms(12), color: '#2C3E50', fontWeight: '700', flex: 1 },
  
  date: { fontSize: ms(11), color: '#95A5A6', textAlign: 'right' }
});

export default AdminPaymentsScreen;
