import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import ErrorView from '../../components/common/ErrorView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchSalary } from '../../store/slices/salarySlice';
import { colors } from '../../theme/colors';
import { hs, vs, ms } from '../../theme/scale';

const TeacherSalaryScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { salaryData, loading, error } = useSelector((state: RootState) => state.salary);

  useEffect(() => {
    dispatch(fetchSalary());
  }, [dispatch]);
  const basic = salaryData?.basic_pay ? Number(salaryData.basic_pay) : 0;
  const allowances = salaryData?.allowances ? Number(salaryData.allowances) : 0;
  const deductions = salaryData?.deductions ? Number(salaryData.deductions) : 0;

  const grossEarnings = basic + allowances;
  const netPay = salaryData?.net_salary ? Number(salaryData.net_salary) : (grossEarnings - deductions);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#27AE60" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Salary Slip</Text>
        <TouchableOpacity style={styles.downloadBtn}>
          <Text style={styles.downloadIcon}>📥</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        
        {loading ? (
          <ActivityIndicator size="large" color="#27AE60" style={{ marginTop: vs(20) }} />
        ) : error ? (
          <ErrorView message={error} onRetry={() => dispatch(fetchSalary())} accentColor="#27AE60" />
        ) : salaryData ? (
          <>
            {/* Salary Banner */}
            <View style={styles.salaryBanner}>
              <Text style={styles.monthText}>{salaryData.month || 'Current Month'} {salaryData.year}</Text>
              <Text style={styles.netPayLabel}>Net Payable Amount</Text>
              <Text style={styles.netPayValue}>₹{netPay.toLocaleString()}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{salaryData.status || 'Credited'}</Text>
              </View>
            </View>

            {/* Earnings */}
            <Text style={styles.sectionTitle}>Earnings</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Basic Pay</Text>
                <Text style={styles.rowValue}>₹{basic.toLocaleString()}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Allowances</Text>
                <Text style={styles.rowValue}>₹{allowances.toLocaleString()}</Text>
              </View>
              <View style={[styles.divider, {backgroundColor: '#27AE60'}]} />
              <View style={styles.row}>
                <Text style={styles.subTotalLabel}>Gross Earnings</Text>
                <Text style={styles.subTotalValue}>₹{grossEarnings.toLocaleString()}</Text>
              </View>
            </View>

            {/* Deductions */}
            <Text style={styles.sectionTitle}>Deductions</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Total Deductions</Text>
                <Text style={[styles.rowValue, {color: '#E74C3C'}]}>-₹{deductions.toLocaleString()}</Text>
              </View>
              <View style={[styles.divider, {backgroundColor: '#E74C3C'}]} />
              <View style={styles.row}>
                <Text style={styles.subTotalLabel}>Total Deductions</Text>
                <Text style={[styles.subTotalValue, {color: '#E74C3C'}]}>₹{deductions.toLocaleString()}</Text>
              </View>
            </View>

            {/* Summary Footer */}
            <View style={styles.summaryFooter}>
              <Text style={styles.footerText}>This is a computer-generated document. No signature is required.</Text>
            </View>
          </>
        ) : (
          <Text style={{ textAlign: 'center', marginTop: vs(20) }}>No salary slip available.</Text>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgMain },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#27AE60', paddingHorizontal: hs(16), paddingVertical: vs(12) },
  backBtn: { padding: 6 },
  backIcon: { fontSize: 34, color: '#FFF', lineHeight: 34, marginTop: -4 },
  title: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  downloadBtn: { padding: 6 },
  downloadIcon: { fontSize: ms(20) },
  
  container: { padding: hs(20), paddingBottom: vs(40) },
  
  salaryBanner: { backgroundColor: '#27AE60', borderRadius: hs(16), padding: hs(24), alignItems: 'center', marginBottom: vs(24), elevation: 4, shadowColor: '#27AE60', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  monthText: { color: 'rgba(255,255,255,0.8)', fontSize: ms(16), fontWeight: '600', marginBottom: vs(8) },
  netPayLabel: { color: '#FFF', fontSize: ms(14), marginBottom: vs(4) },
  netPayValue: { color: '#FFF', fontSize: ms(36), fontWeight: '800', marginBottom: vs(16) },
  statusBadge: { backgroundColor: '#FFF', paddingHorizontal: hs(16), paddingVertical: vs(6), borderRadius: hs(12) },
  statusText: { color: '#27AE60', fontWeight: '700', fontSize: ms(12) },

  sectionTitle: { fontSize: ms(16), fontWeight: '700', color: colors.textPrimary, marginBottom: vs(12), marginLeft: hs(4) },
  
  card: { backgroundColor: colors.bgLight, borderRadius: hs(12), padding: hs(16), marginBottom: vs(24), elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: vs(8) },
  rowLabel: { fontSize: ms(14), color: colors.textSecond },
  rowValue: { fontSize: ms(14), fontWeight: '600', color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: vs(4) },
  
  subTotalLabel: { fontSize: ms(15), fontWeight: '700', color: colors.textPrimary },
  subTotalValue: { fontSize: ms(16), fontWeight: '800', color: '#27AE60' },

  summaryFooter: { alignItems: 'center', marginTop: vs(16) },
  footerText: { fontSize: ms(11), color: '#95A5A6', textAlign: 'center', fontStyle: 'italic' }
});

export default TeacherSalaryScreen;
