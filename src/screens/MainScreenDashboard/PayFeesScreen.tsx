import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Alert, ActivityIndicator, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { processPayment, clearReceipt } from '../../store/slices/paymentSlice';
import { fetchFees } from '../../store/slices/feeSlice';
import { colors } from '../../theme/colors';
import { hs, vs, ms } from '../../theme/scale';
import { API_BASE_URL } from '../../config/api';

interface FeeItem {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
}

const PayFeesScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, receipt } = useSelector((state: RootState) => state.payments);
  const { child_name, child_class, id: profileId, mobile_number } = useSelector((state: RootState) => state.profile);
  const { mobile, role } = useSelector((state: RootState) => state.auth);
  const { fees, loading: feesLoading, error: feesError } = useSelector((state: RootState) => state.fees);

  const [selectedFees, setSelectedFees] = useState<{ [key: string]: boolean }>({});

  if (role === 'Teacher') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#8E44AD" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Pay Fees</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: hs(20) }}>
          <Text style={{ fontSize: ms(60), marginBottom: vs(20) }}>🚫</Text>
          <Text style={{ fontSize: ms(18), color: colors.textPrimary, fontWeight: '700', textAlign: 'center', marginBottom: vs(10) }}>Access Restricted</Text>
          <Text style={{ fontSize: ms(14), color: colors.textSecond, textAlign: 'center' }}>Fee payments are only for students, not for teachers.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [cardDetails, setCardDetails] = useState('');
  const [transactionId, setTransactionId] = useState('');

  const studentKey = profileId ? String(profileId) : mobile;

  React.useEffect(() => {
    if (studentKey) {
      dispatch(fetchFees(studentKey));
    }
  }, [dispatch, studentKey]);

  const feesList: FeeItem[] = (Array.isArray(fees) ? fees : []).map((fee: any, index: number) => ({
    id: String(fee.id ?? fee.fee_id ?? index),
    title: fee.title ?? fee.fee_type ?? fee.description ?? 'Fee Item',
    amount: Number(fee.amount ?? fee.total_amount ?? fee.pending_amount ?? 0),
    dueDate: fee.dueDate ?? fee.due_date ?? fee.month ?? 'N/A',
  }));

  React.useEffect(() => {
    if (feesList.length === 0) {
      setSelectedFees({});
      return;
    }

    setSelectedFees(prev => {
      const next: { [key: string]: boolean } = {};
      feesList.forEach((fee, idx) => {
        next[fee.id] = prev[fee.id] ?? idx === 0;
      });
      return next;
    });
  }, [feesList]);

  const toggleFee = (id: string) => {
    setSelectedFees(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const totalAmount = feesList.reduce((acc, curr) => {
    return selectedFees[curr.id] ? acc + curr.amount : acc;
  }, 0);

  const handlePay = async () => {
    if (totalAmount === 0) {
      Alert.alert('No Fees Selected', 'Please select at least one fee to pay.');
      return;
    }
    if (paymentMethod === 'Card' && cardDetails.length < 16) {
      Alert.alert('Invalid Card', 'Please enter a valid 16-digit card number.');
      return;
    }

    const selectedFeeIds = Object.keys(selectedFees).filter(id => selectedFees[id]);

    if (paymentMethod === 'UPI' || paymentMethod === 'PhonePe' || paymentMethod === 'GPay') {
      let upiUrl = `upi://pay?pa=schoolmerchant@upi&pn=School%20Fees&am=${totalAmount}&cu=INR`;
      if (paymentMethod === 'PhonePe') {
        upiUrl = `phonepe://pay?pa=schoolmerchant@upi&pn=School%20Fees&am=${totalAmount}&cu=INR`;
      } else if (paymentMethod === 'GPay') {
        upiUrl = `tez://upi/pay?pa=schoolmerchant@upi&pn=School%20Fees&am=${totalAmount}&cu=INR`;
      }
      
      try {
        const supported = await Linking.canOpenURL(upiUrl);
        if (supported) {
          await Linking.openURL(upiUrl);
          // Simulate backend processing after returning from UPI app
          setTimeout(() => {
            dispatch(processPayment({ amount: totalAmount, payment_method: paymentMethod, transaction_id: transactionId || undefined, fee_ids: selectedFeeIds }));
          }, 2000);
          return;
        } else {
          Alert.alert(
            'Emulator Environment', 
            `No UPI app installed. Simulating a successful ${paymentMethod} payment for testing purposes.`,
            [{ text: 'Proceed', onPress: () => {
              dispatch(processPayment({ amount: totalAmount, payment_method: paymentMethod, transaction_id: transactionId || `TEST_UPI_${Math.floor(Math.random() * 10000)}`, fee_ids: selectedFeeIds }));
            }}]
          );
          return;
        }
      } catch (err) {
        // Payment processing error
      }
    }
    
    dispatch(processPayment({
      amount: totalAmount,
      payment_method: paymentMethod,
      card_details: paymentMethod === 'Card' ? cardDetails : undefined,
      transaction_id: transactionId || undefined,
      fee_ids: selectedFeeIds
    }));
  };

  React.useEffect(() => {
    if (receipt) {
      Alert.alert(
        'Payment Successful',
        `Transaction ID: ${receipt.transaction_id}\nAmount: ₹${receipt.receipt.amount.toLocaleString()}\nMethod: ${receipt.receipt.payment_method}`,
        [{ text: 'View Dashboard', onPress: () => {
          dispatch(clearReceipt());
          dispatch(fetchFees(studentKey)); // Refresh fees to update "Paid" status
          navigation.navigate('Tabs');
        }}]
      );
    }
    if (error) {
      Alert.alert('Payment Failed', error);
      dispatch(clearReceipt());
    }
  }, [receipt, error, dispatch, navigation]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#8E44AD" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Pay Fees</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.studentCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>👦</Text></View>
          <View>
            <Text style={styles.studentName}>{child_name || 'Student Name'}</Text>
            <Text style={styles.studentClass}>
              {child_class ? `Class ${child_class}` : 'Class Not Assigned'}{mobile_number ? ` | ID: ${mobile_number}` : ''}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Pending Dues</Text>

        {feesLoading ? (
          <ActivityIndicator color="#8E44AD" style={{ marginVertical: vs(12) }} />
        ) : null}

        {!feesLoading && feesError ? (
          <Text style={{ color: colors.absent, marginBottom: vs(12) }}>{feesError}</Text>
        ) : null}

        {!feesLoading && feesList.length === 0 ? (
          <Text style={{ color: colors.textSecond, marginBottom: vs(16) }}>No pending fees found.</Text>
        ) : null}

        {feesList.map(fee => (
          <TouchableOpacity 
            key={fee.id} 
            style={[styles.feeCard, selectedFees[fee.id] && styles.feeCardSelected]}
            onPress={() => toggleFee(fee.id)}
            activeOpacity={0.8}
          >
            <View style={styles.checkboxContainer}>
              <View style={[styles.checkbox, selectedFees[fee.id] && styles.checkboxChecked]}>
                {selectedFees[fee.id] && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </View>
            <View style={styles.feeInfo}>
              <Text style={styles.feeTitle}>{fee.title}</Text>
              <Text style={styles.feeDue}>Due: {fee.dueDate}</Text>
            </View>
            <View style={styles.feeRightSide}>
              <Text style={styles.feeAmount}>₹{fee.amount.toLocaleString()}</Text>
              <TouchableOpacity 
                style={styles.pdfBtn}
                onPress={() => Linking.openURL(`${API_BASE_URL}/billing/download/${fee.id}`)}
              >
                <Text style={styles.pdfBtnText}>📄 PDF</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.paymentMethods}>
          {['UPI', 'PhonePe', 'GPay', 'Card', 'NetBank'].map((method) => (
            <TouchableOpacity 
              key={method}
              style={[styles.methodBtn, paymentMethod === method && styles.methodBtnActive]}
              onPress={() => setPaymentMethod(method)}
            >
              <Text style={styles.methodIcon}>
                {method === 'UPI' ? '📱' : method === 'PhonePe' ? '🅿️' : method === 'GPay' ? '🇬' : method === 'Card' ? '💳' : '🏦'}
              </Text>
              <Text style={[styles.methodText, paymentMethod === method && {color: '#8E44AD'}]}>{method}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {paymentMethod === 'Card' && (
          <View style={styles.cardInputContainer}>
            <Text style={styles.cardLabel}>Card Number</Text>
            <TextInput
              style={styles.cardInput}
              placeholder="XXXX XXXX XXXX XXXX"
              keyboardType="numeric"
              maxLength={16}
              value={cardDetails}
              onChangeText={setCardDetails}
            />
          </View>
        )}

        {['UPI', 'PhonePe', 'GPay', 'NetBank'].includes(paymentMethod) && (
          <View style={styles.cardInputContainer}>
            <Text style={styles.cardLabel}>Transaction ID / UTR (Optional)</Text>
            <TextInput
              style={styles.cardInput}
              placeholder="Paste reference number here"
              value={transactionId}
              onChangeText={setTransactionId}
            />
          </View>
        )}

      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.totalLabel}>Total Payable</Text>
          <Text style={styles.totalValue}>₹{totalAmount.toLocaleString()}</Text>
        </View>
        <TouchableOpacity style={styles.payBtn} onPress={handlePay} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.payBtnText}>Pay Now ➔</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgMain },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#8E44AD', paddingHorizontal: hs(16), paddingVertical: vs(12) },
  backBtn: { padding: 6 },
  backIcon: { fontSize: 34, color: '#FFF', lineHeight: 34, marginTop: -4 },
  title: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  container: { padding: hs(20), paddingBottom: vs(40) },
  studentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgLight, padding: hs(16), borderRadius: hs(16), marginBottom: vs(24), elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  avatar: { width: hs(48), height: hs(48), borderRadius: hs(24), backgroundColor: '#F9F2FF', alignItems: 'center', justifyContent: 'center', marginRight: hs(16) },
  avatarText: { fontSize: ms(24) },
  studentName: { fontSize: ms(16), fontWeight: '700', color: colors.textPrimary, marginBottom: vs(2) },
  studentClass: { fontSize: ms(13), color: colors.textSecond },
  sectionTitle: { fontSize: ms(18), fontWeight: '700', color: colors.textPrimary, marginBottom: vs(16) },
  
  feeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgLight, padding: hs(16), borderRadius: hs(12), marginBottom: vs(12), borderWidth: 2, borderColor: 'transparent' },
  feeCardSelected: { borderColor: '#8E44AD', backgroundColor: '#FDFBFF' },
  checkboxContainer: { width: hs(32), alignItems: 'flex-start' },
  checkbox: { width: hs(22), height: hs(22), borderRadius: 6, borderWidth: 2, borderColor: '#BDC3C7', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#8E44AD', borderColor: '#8E44AD' },
  checkmark: { color: '#FFF', fontSize: ms(14), fontWeight: 'bold' },
  feeInfo: { flex: 1 },
  feeTitle: { fontSize: ms(15), fontWeight: '600', color: colors.textPrimary, marginBottom: vs(4) },
  feeDue: { fontSize: ms(12), color: '#E74C3C', fontWeight: '500' },
  feeRightSide: { alignItems: 'flex-end' },
  feeAmount: { fontSize: ms(16), fontWeight: '700', color: colors.textPrimary, marginBottom: vs(4) },
  pdfBtn: { backgroundColor: '#F4ECF7', paddingHorizontal: hs(8), paddingVertical: vs(4), borderRadius: hs(4), borderWidth: 1, borderColor: '#D7BDE2' },
  pdfBtnText: { fontSize: ms(10), color: '#8E44AD', fontWeight: '700' },
  
  paymentMethods: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: vs(16) },
  methodBtn: { width: '31%', backgroundColor: colors.bgLight, paddingVertical: vs(16), borderRadius: hs(12), alignItems: 'center', marginBottom: vs(12), borderWidth: 1, borderColor: colors.border },
  methodBtnActive: { borderColor: '#8E44AD', backgroundColor: '#FDFBFF' },
  methodIcon: { fontSize: ms(24), marginBottom: vs(8) },
  methodText: { fontSize: ms(13), fontWeight: '600', color: colors.textSecond },

  cardInputContainer: { backgroundColor: colors.bgLight, padding: hs(16), borderRadius: hs(12), marginBottom: vs(24) },
  cardLabel: { fontSize: ms(13), color: colors.textSecond, marginBottom: vs(8), fontWeight: '600' },
  cardInput: { borderWidth: 1, borderColor: colors.border, borderRadius: hs(8), paddingHorizontal: hs(12), paddingVertical: vs(10), fontSize: ms(15), color: colors.textPrimary },

  footer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgLight, padding: hs(20), paddingBottom: vs(32), borderTopWidth: 1, borderTopColor: colors.border },
  footerTotal: { flex: 1 },
  totalLabel: { fontSize: ms(13), color: colors.textSecond, marginBottom: vs(2) },
  totalValue: { fontSize: ms(24), fontWeight: '800', color: colors.textPrimary },
  payBtn: { backgroundColor: '#8E44AD', paddingHorizontal: hs(32), paddingVertical: vs(16), borderRadius: hs(12) },
  payBtnText: { color: '#FFF', fontSize: ms(16), fontWeight: '700' }
});

export default PayFeesScreen;
