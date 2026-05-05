import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchReport } from '../../store/slices/reportSlice';
import { colors } from '../../theme/colors';
import { hs, vs, ms } from '../../theme/scale';

const ReportCardScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { report, loading } = useSelector((state: RootState) => state.reports);
  const profile = useSelector((state: RootState) => state.profile);
  const auth = useSelector((state: RootState) => state.auth);
  const studentKey = profile.id ? String(profile.id) : auth.mobile;

  useEffect(() => {
    if (studentKey) {
      dispatch(fetchReport(studentKey));
    }
  }, [dispatch, studentKey]);

  const childName = profile.child_name || 'Student';
  const childClass = profile.child_class || 'Grade 6 · Roll 01';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgMain} />
      
      <ScrollView contentContainerStyle={styles.container}>
        
        {loading || !report ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: vs(100) }} />
        ) : (
          <>
            {/* Header Card */}
            <View style={styles.headerCard}>
              <View style={styles.profileRow}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{childName[0]?.toUpperCase()}</Text></View>
                <View style={styles.infoCol}>
                  <Text style={styles.name}>{childName}</Text>
                  <Text style={styles.gradeText}>{childClass} · {report.term}</Text>
                </View>
                <View style={styles.termBadge}><Text style={styles.termBadgeText}>{report.term}</Text></View>
              </View>
              
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>PERCENTAGE</Text>
                  <Text style={styles.statValue}>{report.percentage}%</Text>
                  <Text style={styles.statSub}>Top 15%</Text>
                </View>
                <View style={[styles.statBox, { borderColor: colors.present, backgroundColor: '#162B21' }]}>
                  <Text style={[styles.statLabel, { color: colors.present }]}>GRADE</Text>
                  <Text style={[styles.statValue, { color: colors.present }]}>{report.overall_grade}</Text>
                  <Text style={[styles.statSub, { color: colors.present }]}>{report.remarks}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Subject performance</Text>

            {report.subjects?.map((sub: any) => {
              const percentage = (Number(sub.marks_obtained) / Number(sub.max_marks)) * 100;
              let barColor = colors.primary;
              if (percentage >= 90) barColor = colors.present;
              if (percentage < 75) barColor = colors.orange;

              return (
                <View key={sub.id} style={styles.subjectItem}>
                  <View style={styles.subRow}>
                    <Text style={styles.subName}>{sub.subject_name}</Text>
                    <Text style={styles.subMarks}>{sub.marks_obtained}/{sub.max_marks}</Text>
                  </View>
                  <View style={styles.progressBg}>
                    <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: barColor }]} />
                  </View>
                </View>
              );
            })}

            <Text style={[styles.sectionTitle, { marginTop: vs(16) }]}>Attendance</Text>
            <View style={styles.attendanceItem}>
              <View style={styles.subRow}>
                <Text style={styles.subName}>Present / Working days</Text>
                <Text style={styles.subMarks}>{report.attendance_present}/{report.attendance_total}</Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${(report.attendance_present / report.attendance_total) * 100}%`, backgroundColor: colors.present }]} />
              </View>
            </View>

            <TouchableOpacity style={styles.downloadBtn}>
              <Text style={styles.downloadBtnText}>Download PDF</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgMain },
  container: { padding: hs(24), paddingBottom: vs(40) },
  headerCard: { backgroundColor: colors.bgLight, borderRadius: hs(16), padding: hs(20), marginBottom: vs(32), borderWidth: 1, borderColor: colors.border },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: vs(24) },
  avatar: { width: hs(48), height: hs(48), borderRadius: hs(24), backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.present },
  avatarText: { color: colors.present, fontSize: ms(18), fontWeight: '700' },
  infoCol: { flex: 1, marginLeft: hs(16) },
  name: { color: colors.textPrimary, fontSize: ms(18), fontWeight: '700', marginBottom: vs(4) },
  gradeText: { color: colors.textLight, fontSize: ms(12) },
  termBadge: { backgroundColor: '#162B21', paddingHorizontal: hs(12), paddingVertical: vs(6), borderRadius: hs(12) },
  termBadgeText: { color: colors.present, fontSize: ms(12), fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { width: '48%', borderWidth: 1, borderColor: colors.border, borderRadius: hs(12), padding: hs(16) },
  statLabel: { color: colors.textLight, fontSize: ms(10), fontWeight: '700', letterSpacing: 1, marginBottom: vs(8) },
  statValue: { color: colors.textPrimary, fontSize: ms(28), fontWeight: '700', marginBottom: vs(4) },
  statSub: { color: colors.textSecond, fontSize: ms(12) },
  sectionTitle: { color: colors.textPrimary, fontSize: ms(16), fontWeight: '600', marginBottom: vs(24) },
  subjectItem: { marginBottom: vs(24) },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: vs(8) },
  subName: { color: colors.textPrimary, fontSize: ms(14), fontWeight: '500' },
  subMarks: { color: colors.textPrimary, fontSize: ms(14), fontWeight: '600' },
  progressBg: { height: hs(6), backgroundColor: colors.border, borderRadius: hs(3), overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: hs(3) },
  attendanceItem: { marginBottom: vs(40) },
  downloadBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: hs(24), paddingVertical: vs(16), alignItems: 'center' },
  downloadBtnText: { color: colors.primary, fontSize: ms(16), fontWeight: '600' }
});

export default ReportCardScreen;
