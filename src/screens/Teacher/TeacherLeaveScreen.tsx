import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { hs, vs, ms } from '../../theme/scale';
import api from '../../config/api';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { applyLeave } from '../../store/slices/attendanceSlice';

const TeacherLeaveScreen = ({ navigation }: any) => {
  const getLocalDateString = () => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  };

  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector((state: RootState) => state.auth.token);
  const [date, setDate] = useState(getLocalDateString());
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState('');

  const validateDate = (inputDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day
    
    const selectedDate = new Date(inputDate);
    selectedDate.setHours(0, 0, 0, 0); // Set to start of day
    
    if (selectedDate < today) {
      setDateError('Leave date cannot be in the past');
      return false;
    }
    
    setDateError('');
    return true;
  };

  const handleDateChange = (inputDate: string) => {
    setDate(inputDate);
    if (inputDate) {
      validateDate(inputDate);
    }
  };

  const handleSubmit = async () => {
    if (!date || !reason.trim()) {
      Alert.alert('Validation Error', 'Please fill in all fields.');
      return;
    }
    
    if (!validateDate(date)) {
      Alert.alert('Invalid Date', 'Leave date cannot be in the past. Please select a future date.');
      return;
    }

    setLoading(true);
    try {
      await dispatch(applyLeave({ date, reason })).unwrap();
      Alert.alert('Success', 'Leave application submitted successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      // Failed to submit leave application
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#C0392B" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Apply for Leave</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.container}>
        <Text style={styles.label}>Leave Date (YYYY-MM-DD)</Text>
        <TextInput
          style={[styles.input, dateError ? styles.inputError : null]}
          value={date}
          onChangeText={handleDateChange}
          placeholder="2026-05-10"
          keyboardType="numeric"
          maxLength={10}
        />
        {dateError ? <Text style={styles.errorText}>{dateError}</Text> : null}

        <Text style={styles.label}>Reason</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={reason}
          onChangeText={setReason}
          placeholder="Explain the reason for your leave..."
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity 
          style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitBtnText}>{loading ? 'Submitting...' : 'Submit Leave Request'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgMain },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#C0392B', paddingHorizontal: hs(16), paddingVertical: vs(12) },
  backBtn: { padding: 6 },
  backIcon: { fontSize: 34, color: '#FFF', lineHeight: 34, marginTop: -4 },
  title: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  container: { padding: hs(20) },
  label: { fontSize: ms(14), fontWeight: '600', color: colors.textPrimary, marginBottom: vs(8) },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: colors.border, borderRadius: hs(8), paddingHorizontal: hs(12), paddingVertical: vs(12), fontSize: ms(16), marginBottom: vs(20) },
  textArea: { height: vs(120), textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#C0392B', paddingVertical: vs(16), borderRadius: hs(12), alignItems: 'center' },
  submitBtnText: {
    color: '#fff',
    fontSize: ms(16),
    fontWeight: '700',
  },
  inputError: {
    borderColor: '#E74C3C',
    borderWidth: 2,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: ms(12),
    marginTop: vs(4),
    marginLeft: hs(4),
  },
});

export default TeacherLeaveScreen;
