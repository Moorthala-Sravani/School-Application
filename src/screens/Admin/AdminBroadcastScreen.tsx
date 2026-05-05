import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import api from '../../config/api';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { hs, vs, ms } from '../../theme/scale';

const AdminBroadcastScreen = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [targetRole, setTargetRole] = useState<'Parent' | 'Teacher'>('Parent');
  const [selectedClass, setSelectedClass] = useState('6-A');
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [isClassOpen, setIsClassOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const classes = useMemo(() => {
    const allClasses = ['Pre-KG', 'LKG', 'UKG'];
    for (let i = 1; i <= 12; i += 1) {
      ['A', 'B', 'C', 'D', 'E', 'F'].forEach((sec) => allClasses.push(`${i}-${sec}`));
    }
    return allClasses;
  }, []);

  const handleBroadcast = async () => {
    if (!title.trim() || !content.trim() || !selectedClass) {
      Alert.alert('Error', 'Please enter title, message, and select a class.');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        class_group: selectedClass,
        receiver_id: null,
        receiver_role: targetRole,
        receiver_type: targetRole,
        recipient_role: targetRole,
        target_role: targetRole,
      };
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
      await api.post('/messages', payload, config);
      
      Alert.alert('Success', `Broadcast sent to ${targetRole} of ${selectedClass}.`);
      setTitle('');
      setContent('');
    } catch (err) {
      // Failed to send broadcast
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Announcements</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.helperText}>Send instant updates to selected people by role and class.</Text>

          <Text style={styles.label}>Recipient Group</Text>
          <TouchableOpacity style={styles.dropdownBtn} onPress={() => setIsRoleOpen((prev) => !prev)}>
            <Text style={styles.dropdownText}>{targetRole === 'Parent' ? 'Parents' : 'Teachers'}</Text>
            <Text style={styles.dropdownArrow}>{isRoleOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {isRoleOpen ? (
            <View style={styles.dropdownList}>
              {['Parent', 'Teacher'].map((role) => (
                <TouchableOpacity
                  key={role}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setTargetRole(role as 'Parent' | 'Teacher');
                    setIsRoleOpen(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{role === 'Parent' ? 'Parents' : 'Teachers'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <Text style={styles.label}>Class</Text>
          <TouchableOpacity style={styles.dropdownBtn} onPress={() => setIsClassOpen((prev) => !prev)}>
            <Text style={styles.dropdownText}>{selectedClass}</Text>
            <Text style={styles.dropdownArrow}>{isClassOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {isClassOpen ? (
            <View style={styles.dropdownList}>
              <ScrollView nestedScrollEnabled style={{ maxHeight: vs(180) }}>
                {classes.map((classGroup) => (
                  <TouchableOpacity
                    key={classGroup}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedClass(classGroup);
                      setIsClassOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{classGroup}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <Text style={styles.label}>Quick Audience</Text>
          <View style={styles.chipContainer}>
            {[`All ${targetRole === 'Parent' ? 'Parents' : 'Teachers'} in ${selectedClass}`].map((group) => (
              <TouchableOpacity
                key={group}
                style={[styles.chip, styles.chipActive]}
                onPress={() => {}}
              >
                <Text style={[styles.chipText, styles.chipTextActive]}>{group}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Announcement Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Tomorrow is a Holiday"
            placeholderTextColor="#95A5A6"
          />

          <Text style={styles.label}>Message Content</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={content}
            onChangeText={setContent}
            placeholder="Type your message here..."
            placeholderTextColor="#95A5A6"
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity style={styles.btn} onPress={handleBroadcast} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : (
              <>
                <Text style={styles.btnIcon}>📢</Text>
                <Text style={styles.btnText}>Send Broadcast</Text>
              </>
            )}
          </TouchableOpacity>
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

  card: { backgroundColor: '#FFF', padding: hs(20), borderRadius: hs(16), borderWidth: 1, borderColor: '#E2E8F0', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  helperText: { fontSize: ms(13), color: '#64748B', marginBottom: vs(14) },
  label: { fontSize: ms(13), fontWeight: '600', color: '#34495E', marginBottom: vs(8) },
  
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: vs(16) },
  chip: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: hs(20), paddingHorizontal: hs(16), paddingVertical: vs(8), marginRight: hs(8), marginBottom: vs(8) },
  chipActive: { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
  chipText: { fontSize: ms(13), color: '#475569', fontWeight: '600' },
  chipTextActive: { color: '#FFF', fontWeight: '700' },
  dropdownBtn: { height: vs(46), borderWidth: 1, borderColor: '#CBD5E1', borderRadius: hs(8), paddingHorizontal: hs(14), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', marginBottom: vs(10) },
  dropdownText: { fontSize: ms(14), color: '#1E293B', fontWeight: '600' },
  dropdownArrow: { fontSize: ms(12), color: '#64748B' },
  dropdownList: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: hs(8), backgroundColor: '#FFF', marginBottom: vs(12), overflow: 'hidden' },
  dropdownItem: { paddingHorizontal: hs(14), paddingVertical: vs(11), borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dropdownItemText: { fontSize: ms(13), color: '#1E293B', fontWeight: '500' },

  input: { backgroundColor: '#F8F9F9', borderWidth: 1, borderColor: '#D5D8DC', borderRadius: hs(8), paddingHorizontal: hs(16), height: vs(48), fontSize: ms(15), color: '#2C3E50', marginBottom: vs(16) },
  textArea: { height: vs(120), paddingVertical: vs(12) },
  
  btn: { flexDirection: 'row', backgroundColor: '#E67E22', height: vs(50), borderRadius: hs(8), alignItems: 'center', justifyContent: 'center', marginTop: vs(8) },
  btnIcon: { fontSize: ms(18), marginRight: hs(8) },
  btnText: { color: '#FFF', fontSize: ms(16), fontWeight: '700' }
});

export default AdminBroadcastScreen;
