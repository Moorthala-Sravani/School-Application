import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchReport } from '../../store/slices/reportSlice';
import { colors } from '../../theme/colors';
import { hs, vs, ms } from '../../theme/scale';

const ExamResultScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { report, loading, error } = useSelector((state: RootState) => state.reports);
  const { id: profileId } = useSelector((state: RootState) => state.profile);
  const { mobile } = useSelector((state: RootState) => state.auth);

  const studentKey = profileId ? String(profileId) : mobile;

  useEffect(() => {
    if (studentKey) {
      dispatch(fetchReport(studentKey));
    }
  }, [dispatch, studentKey]);


  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#F39C12" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Report Card</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        
        {loading ? (
          <ActivityIndicator size="large" color="#F39C12" style={{ marginTop: vs(20) }} />
        ) : error ? (
          <Text style={{ color: 'red', textAlign: 'center', marginTop: vs(20) }}>{error}</Text>
        ) : !studentKey ? (
          <Text style={{ color: colors.textSecond, textAlign: 'center', marginTop: vs(20) }}>
            Student profile is not available yet.
          </Text>
        ) : report ? (
          <>
            {/* GPA Card */}
            <View style={styles.gpaCard}>
              <View style={styles.gpaTop}>
                <View>
                  <Text style={styles.termText}>{report.term || 'Term 1 Examination'}</Text>
                  <Text style={styles.dateText}>{report.created_at ? new Date(report.created_at).toLocaleDateString() : 'April 2026'}</Text>
                </View>
                <View style={styles.gradeBadge}>
                  <Text style={styles.gradeText}>{report.grade || 'A+'}</Text>
                </View>
              </View>
              <View style={styles.gpaBottom}>
                <View style={styles.gpaBox}>
                  <Text style={styles.gpaLabel}>GPA</Text>
                  <Text style={styles.gpaValue}>{report.gpa || '3.8'}</Text>
                </View>
                <View style={styles.gpaDivider} />
                <View style={styles.gpaBox}>
                  <Text style={styles.gpaLabel}>Percentage</Text>
                  <Text style={styles.gpaValue}>{report.percentage || '90.2'}%</Text>
                </View>
                <View style={styles.gpaDivider} />
                <View style={styles.gpaBox}>
                  <Text style={styles.gpaLabel}>Rank</Text>
                  <Text style={styles.gpaValue}>{report.rank || '4th'}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Subject Performance</Text>
            
            {/* Subjects List */}
            <View style={styles.subjectsCard}>
              {report.subjects?.map((sub: any, idx: number) => {
                const color = ['#3498DB', '#2ECC71', '#9B59B6', '#F1C40F', '#E74C3C'][idx % 5];
                return (
                  <View key={idx} style={styles.subjectRow}>
                    <View style={styles.subHeader}>
                      <Text style={styles.subName}>{sub.subject}</Text>
                      <Text style={styles.subScore}>{sub.marks_obtained}/{sub.max_marks || 100}</Text>
                    </View>
                    <View style={styles.progressBg}>
                      <View style={[styles.progressFill, { width: `${(sub.marks_obtained / (sub.max_marks || 100)) * 100}%`, backgroundColor: color }]} />
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Teacher Remarks */}
            <Text style={styles.sectionTitle}>Class Teacher Remarks</Text>
            <View style={styles.remarksCard}>
              <Text style={styles.quoteIcon}>"</Text>
              <Text style={styles.remarksText}>
                {report.remarks || 'Excellent progress this term.'}
              </Text>
              <View style={styles.signatureRow}>
                <Text style={styles.teacherName}>- {report.teacher_name || 'Class Teacher'}</Text>
              </View>
            </View>

            {/* Attachment */}
            {report.file_url ? (
              <View style={{ marginTop: 24 }}>
                <Text style={styles.sectionTitle}>Attachments</Text>
                <TouchableOpacity style={styles.downloadBtn} onPress={() => {/* Here we would open the file_url */}}>
                  <Text style={styles.downloadIcon}>📄</Text>
                  <Text style={styles.downloadText}>Download Report Document</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        ) : null}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgMain },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F39C12', paddingHorizontal: hs(16), paddingVertical: vs(12) },
  backBtn: { padding: 6 },
  backIcon: { fontSize: 34, color: '#FFF', lineHeight: 34, marginTop: -4 },
  title: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  container: { padding: hs(20), paddingBottom: vs(40) },
  
  gpaCard: { backgroundColor: '#F39C12', borderRadius: hs(20), padding: hs(20), marginBottom: vs(24), elevation: 4, shadowColor: '#F39C12', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  gpaTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: vs(24) },
  termText: { color: '#FFF', fontSize: ms(18), fontWeight: '800', marginBottom: vs(4) },
  dateText: { color: 'rgba(255,255,255,0.8)', fontSize: ms(14), fontWeight: '500' },
  gradeBadge: { backgroundColor: '#FFF', paddingHorizontal: hs(16), paddingVertical: vs(8), borderRadius: hs(12) },
  gradeText: { color: '#F39C12', fontSize: ms(24), fontWeight: '800' },
  
  gpaBottom: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.2)', padding: hs(16), borderRadius: hs(16) },
  gpaBox: { alignItems: 'center', flex: 1 },
  gpaLabel: { color: 'rgba(255,255,255,0.8)', fontSize: ms(12), marginBottom: vs(4), fontWeight: '600' },
  gpaValue: { color: '#FFF', fontSize: ms(18), fontWeight: '800' },
  gpaDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: hs(8) },

  sectionTitle: { fontSize: ms(18), fontWeight: '700', color: colors.textPrimary, marginBottom: vs(16) },
  
  subjectsCard: { backgroundColor: colors.bgLight, borderRadius: hs(16), padding: hs(20), marginBottom: vs(24), elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  subjectRow: { marginBottom: vs(16) },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: vs(8) },
  subName: { fontSize: ms(14), fontWeight: '600', color: colors.textPrimary },
  subScore: { fontSize: ms(14), fontWeight: '700', color: colors.textSecond },
  progressBg: { height: vs(8), backgroundColor: '#F0F0F0', borderRadius: hs(4), overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: hs(4) },

  remarksCard: { backgroundColor: '#FFF9F2', borderRadius: hs(16), padding: hs(20), borderWidth: 1, borderColor: 'rgba(243, 156, 18, 0.2)' },
  quoteIcon: { fontSize: ms(40), color: '#F39C12', opacity: 0.5, marginTop: -vs(10), marginBottom: -vs(10) },
  remarksText: { fontSize: ms(14), color: colors.textPrimary, lineHeight: vs(22), fontStyle: 'italic', marginBottom: vs(16) },
  signatureRow: { alignItems: 'flex-end' },
  teacherName: { fontSize: ms(14), fontWeight: '700', color: '#F39C12' },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F39C12', padding: hs(16), borderRadius: hs(12), justifyContent: 'center' },
  downloadIcon: { fontSize: ms(20), marginRight: hs(8), color: '#FFF' },
  downloadText: { color: '#FFF', fontSize: ms(16), fontWeight: '700' }
});

export default ExamResultScreen;
