import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchAttendance, applyLeave } from '../../store/slices/attendanceSlice';
import { sendMessage } from '../../store/slices/messageSlice';
import { colors } from '../../theme/colors';
import { hs, vs, ms } from '../../theme/scale';
import { belongsToParentChild } from '../../utils/parentData';

const LEAVE_TYPES = ['Medical', 'Personal', 'Family function', 'Other'];

const AttendanceScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const profile = useSelector((state: RootState) => state.profile);
  const auth = useSelector((state: RootState) => state.auth);
  const { records, loading, error } = useSelector((state: RootState) => state.attendance);

  const [leaveType, setLeaveType] = useState('Medical');
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [documentUri, setDocumentUri] = useState<string | null>(null);
  
  const [submitting, setSubmitting] = useState(false);

  // REST polling
  useEffect(() => {
    dispatch(fetchAttendance());
    
    // Check for changes (comparing visually if necessary) natively over time
    const intervalId = setInterval(() => {
      dispatch(fetchAttendance());
    }, 5000);
    
    const unsubscribeFocus = navigation?.addListener?.('focus', () => {
      dispatch(fetchAttendance());
    });

    return () => {
      clearInterval(intervalId);
      if (typeof unsubscribeFocus === 'function') unsubscribeFocus();
    };
  }, [dispatch, navigation]);

  const handleDocumentPick = async () => {
    try {
      const res = await pick({
        type: [types.allFiles],
      });
      setDocumentUri(res[0].name || res[0].uri);
    } catch (err) {
      if (!(isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED)) {
        Alert.alert('Error', 'Failed to pick document');
      }
    }
  };

  const calculateDays = () => {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleSubmit = async () => {
    if (reason.length < 20) {
      Alert.alert('Validation Error', 'Please enter a valid reason (Minimum 20 characters).');
      return;
    }
    const days = calculateDays();
    if (days < 1) {
      Alert.alert('Validation Error', 'Please enter valid From and To dates.');
      return;
    }

    setSubmitting(true);
    try {
      // For REST compatibility, pass down expanded props over standard endpoints
      await dispatch(applyLeave({
        date: fromDate, 
        toDate,
        totalDays: days,
        leaveType: leaveType.toLowerCase(),
        reason,
        documentUrl: documentUri || null,
        child_name: profile.child_name,
        child_class: profile.child_class,
        notification_type: 'leave_request',
        // Default initial statuses mimicking double tier backend
        teacherStatus: 'pending',
        adminStatus: 'waiting'
      })).unwrap();

      // FCM Simulator (Push Notification)
      await dispatch(sendMessage({
         content: `New leave request from Parent for ${profile.child_name || 'Student'}, Class ${profile.child_class} — ${fromDate} to ${toDate}`,
         class_group: 'Management',
         targetRole: 'Teacher',
         title: 'Leave Request Received'
      }));

      Alert.alert('Success', 'Leave request submitted successfully!');
      setReason('');
      setDocumentUri(null);
      dispatch(fetchAttendance());
    } catch (err: any) {
      // Unable to submit leave request
    } finally {
      setSubmitting(false);
    }
  };

  // Extract leaves submitted by this parent
  const leaveRequests = (records || [])
    .filter((r: any) => belongsToParentChild(r, profile, auth))
    .filter((r: any) => r.status && r.status.includes('leave'))
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

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

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profileBox}>
          <Text style={styles.profileName}>{profile.child_name || 'Student Name'}</Text>
          <Text style={styles.profileClass}>Class: {profile.child_class || 'N/A'}</Text>
        </View>

        <Text style={styles.sectionTitle}>Leave Type</Text>
        <View style={styles.typeGrid}>
          {LEAVE_TYPES.map(type => (
            <TouchableOpacity 
              key={type} 
              style={[styles.typeBtn, leaveType === type && styles.typeBtnActive]}
              onPress={() => setLeaveType(type)}
            >
              <Text style={[styles.typeText, leaveType === type && styles.typeTextActive]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.dateRow}>
          <View style={{ flex: 1, marginRight: hs(10) }}>
            <Text style={styles.sectionTitle}>From Date</Text>
            <TextInput style={styles.input} value={fromDate} onChangeText={setFromDate} placeholder="YYYY-MM-DD" />
          </View>
          <View style={{ flex: 1, marginLeft: hs(10) }}>
            <Text style={styles.sectionTitle}>To Date</Text>
            <TextInput style={styles.input} value={toDate} onChangeText={setToDate} placeholder="YYYY-MM-DD" />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Reason (Required, min 20 chars)</Text>
        <TextInput 
          style={styles.textArea} 
          multiline 
          placeholder="Please explain the full reason for absence..."
          value={reason}
          onChangeText={setReason}
        />

        <View style={styles.attachmentRow}>
          <TouchableOpacity style={styles.attachBtn} onPress={handleDocumentPick}>
            <Text style={styles.attachBtnText}>📎 Attach Document</Text>
          </TouchableOpacity>
          {documentUri && <Text style={styles.attachFileText} numberOfLines={1}>{documentUri}</Text>}
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Submit Leave Request</Text>}
        </TouchableOpacity>

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>My Leave Requests</Text>

        {loading && leaveRequests.length === 0 ? (
          <ActivityIndicator color="#C0392B" style={{ marginVertical: vs(20) }} />
        ) : leaveRequests.length === 0 ? (
          <Text style={styles.emptyTxt}>No leave history found.</Text>
        ) : (
          leaveRequests.map(req => {
            // Emulating the robust backend logic fields over REST compat mappings
            const ts = String(req.teacherStatus || req.status || 'pending').toLowerCase();
            const as = String(req.adminStatus || 'waiting').toLowerCase();

            const isTApp = ts.includes('approv');
            const isTRej = ts.includes('reject');
            const isAApp = as.includes('approv');
            const isARej = as.includes('reject');
            
            return (
              <View key={req.id} style={styles.historyCard}>
                 <View style={styles.historyTop}>
                    <Text style={styles.histType}>{(req.leaveType || 'Leave').toUpperCase()} ({req.totalDays || 1} Days)</Text>
                    <Text style={styles.histDate}>
                      {req.fromDate || req.date} to {req.toDate || req.date}
                    </Text>
                 </View>
                 <Text style={styles.histReason} numberOfLines={2}>"{req.reason}"</Text>
                 
                 <View style={styles.badgeRow}>
                    <View style={[styles.badgeBase, isTApp ? styles.bgGreen : isTRej ? styles.bgRed : styles.bgOrange]}>
                       <Text style={[styles.badgeTxt, isTApp ? styles.txGreen : isTRej ? styles.txRed : styles.txOrange]}>
                         Teacher: {isTApp ? 'APPROVED' : isTRej ? 'REJECTED' : 'PENDING'}
                       </Text>
                    </View>
                    <View style={[styles.badgeBase, isAApp ? styles.bgGreen : isARej ? styles.bgRed : (isTRej ? styles.bgGrey : styles.bgOrange)]}>
                       <Text style={[styles.badgeTxt, isAApp ? styles.txGreen : isARej ? styles.txRed : (isTRej ? styles.txGrey : styles.txOrange)]}>
                         Admin: {isAApp ? 'APPROVED' : isARej ? 'REJECTED' : 'WAITING'}
                       </Text>
                    </View>
                 </View>

                 {isAApp && (
                   <View style={styles.successBanner}>
                     <Text style={styles.successTx}>✅ Leave approved. Attendance marked.</Text>
                   </View>
                 )}
                 {isARej && (
                   <View style={styles.errorBanner}>
                     <Text style={styles.errorTx}>❌ Admin Rejection Reason: {req.adminComment || 'Declined'}</Text>
                   </View>
                 )}
                 {isTRej && !isARej && (
                   <View style={styles.errorBanner}>
                     <Text style={styles.errorTx}>❌ Teacher Rejection Reason: {req.teacherComment || 'Declined'}</Text>
                   </View>
                 )}
              </View>
            )
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F6F7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#C0392B', paddingHorizontal: hs(16), paddingVertical: vs(12) },
  backBtn: { padding: 6 },
  backIcon: { fontSize: 34, color: '#FFF', lineHeight: 34, marginTop: -4 },
  title: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  container: { padding: hs(16), paddingBottom: vs(40) },
  profileBox: { backgroundColor: '#FFF', padding: hs(16), borderRadius: hs(12), marginBottom: vs(24), borderWidth: 1, borderColor: '#D5D8DC' },
  profileName: { fontSize: ms(18), fontWeight: '700', color: '#2C3E50' },
  profileClass: { fontSize: ms(14), color: '#7F8C8D', marginTop: vs(4) },
  sectionTitle: { fontSize: ms(14), fontWeight: '700', color: '#34495E', marginBottom: vs(8) },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: hs(10), marginBottom: vs(24) },
  typeBtn: { flex: 1, minWidth: '45%', paddingVertical: vs(12), borderRadius: hs(8), backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D5D8DC', alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#FDEDEC', borderColor: '#C0392B' },
  typeText: { fontSize: ms(13), fontWeight: '600', color: '#566573' },
  typeTextActive: { color: '#C0392B', fontWeight: '700' },
  dateRow: { flexDirection: 'row', marginBottom: vs(20) },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D5D8DC', borderRadius: hs(8), padding: hs(12), color: '#2C3E50' },
  textArea: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D5D8DC', borderRadius: hs(8), padding: hs(12), height: vs(80), textAlignVertical: 'top', color: '#2C3E50', marginBottom: vs(20) },
  attachmentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: vs(24) },
  attachBtn: { backgroundColor: '#D5D8DC', paddingHorizontal: hs(16), paddingVertical: vs(10), borderRadius: hs(6) },
  attachBtnText: { fontWeight: '700', color: '#2C3E50' },
  attachFileText: { marginLeft: hs(10), fontSize: ms(12), color: '#7F8C8D', flex: 1 },
  submitBtn: { backgroundColor: '#C0392B', padding: vs(16), borderRadius: hs(12), alignItems: 'center' },
  submitBtnText: { color: '#FFF', fontWeight: '700', fontSize: ms(16) },
  divider: { height: 1, backgroundColor: '#D5D8DC', marginVertical: vs(24) },
  emptyTxt: { textAlign: 'center', color: '#7F8C8D', fontStyle: 'italic' },
  historyCard: { backgroundColor: '#FFF', padding: hs(16), borderRadius: hs(12), marginBottom: vs(16), elevation: 1, borderWidth: 1, borderColor: '#EAEDED' },
  historyTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: vs(6) },
  histType: { fontWeight: '700', color: '#2C3E50', fontSize: ms(15) },
  histDate: { color: '#7F8C8D', fontSize: ms(13) },
  histReason: { color: '#566573', fontSize: ms(13), fontStyle: 'italic', marginBottom: vs(12) },
  badgeRow: { flexDirection: 'row', gap: hs(10) },
  badgeBase: { flex: 1, paddingVertical: vs(6), borderRadius: hs(6), alignItems: 'center' },
  badgeTxt: { fontWeight: '700', fontSize: ms(11) },
  bgGreen: { backgroundColor: 'rgba(46, 204, 113, 0.15)' },
  txGreen: { color: '#27AE60' },
  bgRed: { backgroundColor: 'rgba(231, 76, 60, 0.15)' },
  txRed: { color: '#C0392B' },
  bgOrange: { backgroundColor: 'rgba(243, 156, 18, 0.15)' },
  txOrange: { color: '#D35400' },
  bgGrey: { backgroundColor: '#EBEDEF' },
  txGrey: { color: '#7F8C8D' },
  successBanner: { marginTop: vs(12), backgroundColor: '#EAFDF4', padding: hs(10), borderRadius: hs(6), borderWidth: 1, borderColor: '#A9DFBF' },
  successTx: { color: '#1E8449', fontWeight: '700', fontSize: ms(12) },
  errorBanner: { marginTop: vs(12), backgroundColor: '#FDEDEC', padding: hs(10), borderRadius: hs(6), borderWidth: 1, borderColor: '#F5B7B1' },
  errorTx: { color: '#C0392B', fontWeight: '700', fontSize: ms(12) }
});

export default AttendanceScreen;
