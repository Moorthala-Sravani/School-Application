import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { uploadHomework, fetchHomework } from '../../store/slices/homeworkSlice';
import { AppDispatch } from '../../store';

const CLASSES: string[] = ['Pre-KG', 'LKG', 'UKG'];
for (let i = 1; i <= 12; i++) {
  ['A', 'B', 'C'].forEach(sec => CLASSES.push(`${i}-${sec}`));
}

const Field = ({ label, value, onChange, placeholder, isDropdown = false, options = [], multiline = false }: any) => {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isDropdown ? (
        <View>
          <TouchableOpacity 
            style={[styles.fieldInput, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
            onPress={() => setOpen(!open)}
            activeOpacity={0.7}
          >
            <Text style={{ color: value ? '#2C1A0E' : '#B08060', fontSize: 15 }}>
              {value || placeholder || 'Select Option'}
            </Text>
            <Text style={{ color: '#C0392B', fontSize: 14 }}>{open ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {open && (
            <View style={styles.dropdownList}>
              <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                {options.map((opt: string) => (
                  <TouchableOpacity 
                    key={opt} 
                    style={styles.dropdownItem}
                    onPress={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, value === opt && styles.dropdownItemTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      ) : (
        <TextInput
          style={[styles.fieldInput, multiline && styles.textArea]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#B08060"
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      )}
    </View>
  );
};

const UploadHomeworkScreen = ({ navigation }: any) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classGroup, setClassGroup] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!title || !description || !classGroup) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    
    setIsUploading(true);
    try {
      await dispatch(uploadHomework({ title, description, class_group: classGroup })).unwrap();
      Alert.alert('Success', 'Homework uploaded successfully!');
      setTitle('');
      setDescription('');
      setClassGroup('');
      dispatch(fetchHomework()); // Refresh homework list
    } catch (err: any) {
      // Failed to upload homework
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upload Homework</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Homework Details</Text>
            
            <Field 
              label="Class Group" 
              value={classGroup} 
              onChange={setClassGroup} 
              placeholder="Select Class" 
              isDropdown={true} 
              options={CLASSES} 
            />

            <Field 
              label="Homework Title" 
              value={title} 
              onChange={setTitle} 
              placeholder="e.g. Chapter 5 Math Exercises" 
            />

            <Field 
              label="Description" 
              value={description} 
              onChange={setDescription} 
              placeholder="Enter homework details here..." 
              multiline={true} 
            />

            <TouchableOpacity style={styles.updateBtn} onPress={handleUpload} disabled={isUploading}>
              {isUploading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.updateBtnText}>Publish Homework</Text>}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C0392B',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: '#FFF' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    elevation: 3,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#C0392B',
    marginBottom: 16,
  },
  fieldContainer: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, color: '#7A5C44', marginBottom: 4, fontWeight: '500' },
  fieldInput: {
    fontSize: 15,
    color: '#2C1A0E',
    borderWidth: 1,
    borderColor: '#E8DDD0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FEF9F6',
  },
  textArea: {
    height: 100,
  },
  dropdownList: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E8DDD0',
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
    zIndex: 10,
    elevation: 2,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#2C1A0E',
  },
  dropdownItemTextActive: {
    color: '#C0392B',
    fontWeight: '700',
  },
  updateBtn: {
    backgroundColor: '#C0392B',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  updateBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});

export default UploadHomeworkScreen;
