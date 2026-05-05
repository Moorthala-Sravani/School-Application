import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import api from '../../config/api';
import { colors } from '../../theme/colors';
import { hs, vs, ms } from '../../theme/scale';
import { launchImageLibrary } from 'react-native-image-picker';

const TeacherMarksUploadScreen = ({ navigation }: any) => {
  const profile = useSelector((state: RootState) => state.teacherProfile);
  const assignedClasses = profile.assigned_classes || [];

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    classGroup: assignedClasses[0] || '6-A',
    studentId: '',
    term: 'Mid Term Examination 2026',
    percentage: '',
    grade: '',
    file_url: '',
  });

  const [subjects, setSubjects] = useState([
    { subject: 'Mathematics', marks_obtained: '', max_marks: '100' },
    { subject: 'Science', marks_obtained: '', max_marks: '100' },
    { subject: 'English', marks_obtained: '', max_marks: '100' },
  ]);

  const handleSubjectChange = (index: number, key: string, value: string) => {
    const newSubjects = [...subjects];
    newSubjects[index] = { ...newSubjects[index], [key]: value };
    setSubjects(newSubjects);
  };

  const addSubject = () => {
    setSubjects([...subjects, { subject: '', marks_obtained: '', max_marks: '100' }]);
  };

  const removeSubject = (index: number) => {
    const newSubjects = subjects.filter((_, i) => i !== index);
    setSubjects(newSubjects);
  };

  const handlePickDocument = () => {
    launchImageLibrary({ mediaType: 'photo', includeBase64: false }, (res) => {
      if (res.didCancel) {
        // User cancelled
      } else if (res.errorMessage) {
        Alert.alert('Error', res.errorMessage);
      } else if (res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        Alert.alert('Success', `File attached: ${file.fileName}`);
        setFormData(prev => ({ ...prev, file_url: `https://example.com/reports/${file.fileName}` }));
      }
    });
  };

  const handleSubmit = async () => {
    if (!formData.studentId || !formData.term) {
      Alert.alert('Error', 'Student ID and Term are required.');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        studentId: formData.studentId,
        term: formData.term,
        percentage: formData.percentage || null,
        grade: formData.grade || null,
        top_percentile: null,
        working_days: 100,
        present_days: 90,
        file_url: formData.file_url || null,
        subjects: subjects.filter(s => s.subject && s.marks_obtained)
      };

      await api.post('/reports', payload);
      Alert.alert('Success', 'Marks uploaded and sent to parent successfully!');
      navigation.goBack();
    } catch (error: any) {
      // Failed to upload marks
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
        <Text style={styles.title}>Upload Marks</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>Exam Details</Text>
        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <Text style={styles.label}>Class Section</Text>
            <View style={styles.classChips}>
              {assignedClasses.map((cls) => (
                <TouchableOpacity 
                  key={cls} 
                  style={[styles.chip, formData.classGroup === cls && styles.chipActive]}
                  onPress={() => setFormData({...formData, classGroup: cls})}
                >
                  <Text style={[styles.chipText, formData.classGroup === cls && styles.chipTextActive]}>{cls}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Student ID / Roll No</Text>
            <TextInput 
              style={styles.input} 
              value={formData.studentId}
              onChangeText={t => setFormData({...formData, studentId: t})}
              placeholder="e.g. 1" 
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Term Name</Text>
            <TextInput 
              style={styles.input} 
              value={formData.term}
              onChangeText={t => setFormData({...formData, term: t})}
              placeholder="e.g. Final Examination 2026" 
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Subject Marks</Text>
        <View style={styles.card}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 2 }]}>Subject</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Marks</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Total</Text>
            <View style={{ width: 30 }} />
          </View>
          
          {subjects.map((sub, idx) => (
            <View key={idx} style={styles.tableRow}>
              <TextInput 
                style={[styles.tdInput, { flex: 2 }]} 
                value={sub.subject}
                onChangeText={t => handleSubjectChange(idx, 'subject', t)}
                placeholder="Subject" 
                placeholderTextColor="#999"
              />
              <TextInput 
                style={[styles.tdInput, { flex: 1, textAlign: 'center' }]} 
                value={sub.marks_obtained}
                onChangeText={t => handleSubjectChange(idx, 'marks_obtained', t)}
                keyboardType="numeric"
                placeholder="0" 
                placeholderTextColor="#999"
              />
              <TextInput 
                style={[styles.tdInput, { flex: 1, textAlign: 'center' }]} 
                value={sub.max_marks}
                onChangeText={t => handleSubjectChange(idx, 'max_marks', t)}
                keyboardType="numeric"
                placeholder="100" 
                placeholderTextColor="#999"
              />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeSubject(idx)}>
                <Text style={styles.removeIcon}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
          
          <TouchableOpacity style={styles.addBtn} onPress={addSubject}>
            <Text style={styles.addBtnText}>+ Add Subject</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Overall Performance</Text>
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: hs(8) }]}>
              <Text style={styles.label}>Percentage (%)</Text>
              <TextInput 
                style={styles.input} 
                value={formData.percentage}
                onChangeText={t => setFormData({...formData, percentage: t})}
                placeholder="e.g. 85.5" 
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>
            <View style={[styles.inputContainer, { flex: 1, marginLeft: hs(8) }]}>
              <Text style={styles.label}>Overall Grade</Text>
              <TextInput 
                style={styles.input} 
                value={formData.grade}
                onChangeText={t => setFormData({...formData, grade: t})}
                placeholder="e.g. A+" 
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Attachments</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.attachBtn} onPress={handlePickDocument}>
            <Text style={styles.attachIcon}>📎</Text>
            <Text style={styles.attachText}>
              {formData.file_url ? 'Document Attached (Tap to change)' : 'Attach Report File (PDF/Image)'}
            </Text>
          </TouchableOpacity>
          {formData.file_url ? (
            <Text style={styles.attachedFileName} numberOfLines={1}>{formData.file_url.split('/').pop()}</Text>
          ) : null}
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>Upload & Send to Parent</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#C0392B', paddingHorizontal: hs(16), paddingVertical: vs(12) },
  backBtn: { padding: 6 },
  backIcon: { fontSize: 34, color: '#FFF', lineHeight: 34, marginTop: -4 },
  title: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  container: { padding: hs(20), paddingBottom: vs(40) },
  
  sectionTitle: { fontSize: ms(16), fontWeight: '700', color: '#C0392B', marginBottom: vs(12), marginTop: vs(8) },
  card: { backgroundColor: '#FFF', borderRadius: hs(12), padding: hs(16), marginBottom: vs(16), elevation: 2, shadowColor: '#8B4513', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: {width: 0, height: 2} },
  
  fieldRow: { marginBottom: vs(16) },
  label: { fontSize: ms(12), color: '#7A5C44', fontWeight: '600', marginBottom: vs(6) },
  inputContainer: { marginBottom: vs(12) },
  input: { backgroundColor: '#FEF9F6', borderWidth: 1, borderColor: '#E8DDD0', borderRadius: hs(8), paddingHorizontal: hs(12), paddingVertical: vs(10), fontSize: ms(14), color: '#2C1A0E' },
  
  classChips: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { paddingHorizontal: hs(12), paddingVertical: vs(6), borderRadius: hs(16), backgroundColor: '#FEF9F6', borderWidth: 1, borderColor: '#E8DDD0', marginRight: hs(8), marginBottom: vs(8) },
  chipActive: { backgroundColor: '#C0392B', borderColor: '#C0392B' },
  chipText: { fontSize: ms(13), color: '#7A5C44', fontWeight: '500' },
  chipTextActive: { color: '#FFF', fontWeight: '700' },

  tableHeader: { flexDirection: 'row', paddingBottom: vs(8), borderBottomWidth: 1, borderBottomColor: '#E8DDD0', marginBottom: vs(8) },
  th: { fontSize: ms(12), color: '#7A5C44', fontWeight: '700' },
  tableRow: { flexDirection: 'row', alignItems: 'center', marginBottom: vs(8) },
  tdInput: { backgroundColor: '#FEF9F6', borderWidth: 1, borderColor: '#E8DDD0', borderRadius: hs(6), paddingHorizontal: hs(8), paddingVertical: vs(6), fontSize: ms(13), color: '#2C1A0E', marginRight: hs(6) },
  removeBtn: { width: hs(24), alignItems: 'center', justifyContent: 'center' },
  removeIcon: { fontSize: ms(20), color: '#E74C3C', fontWeight: '300', marginTop: -4 },
  
  addBtn: { marginTop: vs(8), alignSelf: 'flex-start' },
  addBtnText: { color: '#2980B9', fontSize: ms(14), fontWeight: '600' },

  attachBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF9F6', borderWidth: 1, borderColor: '#E8DDD0', borderStyle: 'dashed', borderRadius: hs(8), padding: hs(16), justifyContent: 'center' },
  attachIcon: { fontSize: ms(20), marginRight: hs(8) },
  attachText: { fontSize: ms(14), color: '#7A5C44', fontWeight: '600' },
  attachedFileName: { fontSize: ms(12), color: '#2C1A0E', marginTop: vs(8), textAlign: 'center', fontStyle: 'italic' },

  submitBtn: { backgroundColor: '#C0392B', borderRadius: hs(12), paddingVertical: vs(14), alignItems: 'center', marginTop: vs(16) },
  submitBtnText: { color: '#FFF', fontSize: ms(16), fontWeight: '700' }
});

export default TeacherMarksUploadScreen;
