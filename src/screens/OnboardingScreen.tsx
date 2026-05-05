import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { hs, vs, ms } from '../theme/scale';
import AppInput from '../components/common/AppInput';
import AppButton from '../components/common/AppButton';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const OnboardingScreen = ({ navigation }: any) => {
  const [studentId, setStudentId] = useState('STU-2024-0642');
  const [relation, setRelation] = useState('Father');
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');



  const handleContinue = async () => {
    setLoading(true);
    setError('');
    try {
      // In a real app, we would fetch the student via API and then link
      // We will skip actual backend call for linking in this UI demo unless needed
      // Assuming linking is successful:
      navigation.replace('MainApp');
    } catch (_err) {
      setError('Failed to verify student ID');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgMain} />
      
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container}>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.progressContainer}>
              <View style={[styles.progressDot, styles.progressDotActive]} />
              <View style={styles.progressDot} />
              <View style={styles.progressDot} />
              <View style={styles.progressDot} />
            </View>
            <Text style={styles.stepText}>Step 1/3</Text>
          </View>

          {/* Titles */}
          <Text style={styles.overline}>LINK YOUR CHILD</Text>
          <Text style={styles.title}>Student verification</Text>
          <Text style={styles.subtitle}>
            Enter student ID from admission letter to connect your account
          </Text>

          {/* Student ID Card */}
          <View style={styles.card}>
            <Text style={styles.label}>Student ID</Text>
            <AppInput 
              value={studentId}
              onChangeText={setStudentId}
              placeholder="STU-XXXX-XXXX"
              containerStyle={{ marginBottom: vs(16) }}
              style={{ fontWeight: '600' }}
            />
            
            <View style={styles.studentInfoRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>Aryan Reddy</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Standard</Text>
                <Text style={styles.infoValue}>Grade 6 — A</Text>
              </View>
            </View>
          </View>

          {/* Relationship Selection */}
          <Text style={styles.sectionLabel}>You are the student's</Text>
          <View style={styles.pillContainer}>
            {['Father', 'Mother', 'Guardian'].map(rel => (
              <TouchableOpacity
                key={rel}
                style={[styles.pill, relation === rel && styles.pillActive]}
                onPress={() => setRelation(rel)}
              >
                <Text style={[styles.pillText, relation === rel && styles.pillTextActive]}>{rel}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Language Selection */}
          <Text style={styles.sectionLabel}>Notification language</Text>
          <View style={styles.pillContainer}>
            {['English', 'Tamil', 'Hindi'].map(lang => (
              <TouchableOpacity
                key={lang}
                style={[styles.pill, language === lang && styles.pillActive]}
                onPress={() => setLanguage(lang)}
              >
                <Text style={[styles.pillText, language === lang && styles.pillTextActive]}>{lang}</Text>
              </TouchableOpacity>
            ))}
          </View>


          {/* Continue Button */}
          <View style={styles.btnContainer}>
            <AppButton title="Continue" onPress={handleContinue} loading={loading} />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgMain,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: hs(24),
    paddingTop: vs(24),
    paddingBottom: vs(40),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(40),
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: hs(24),
    height: hs(4),
    backgroundColor: colors.border,
    borderRadius: hs(2),
    marginRight: hs(8),
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  stepText: {
    color: colors.textSecond,
    fontSize: ms(13),
    fontWeight: '500',
  },
  overline: {
    color: colors.primary,
    fontSize: ms(12),
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: vs(8),
    textTransform: 'uppercase',
  },
  title: {
    color: colors.textPrimary,
    fontSize: ms(24),
    fontWeight: '700',
    marginBottom: vs(8),
  },
  subtitle: {
    color: colors.textSecond,
    fontSize: ms(14),
    lineHeight: 20,
    marginBottom: vs(32),
  },
  card: {
    backgroundColor: colors.bgLight,
    borderRadius: hs(16),
    padding: hs(16),
    marginBottom: vs(24),
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    color: colors.textSecond,
    fontSize: ms(12),
    marginBottom: vs(8),
  },
  studentInfoRow: {
    flexDirection: 'row',
    marginTop: vs(8),
  },
  infoLabel: {
    color: colors.textSecond,
    fontSize: ms(12),
    marginBottom: vs(4),
  },
  infoValue: {
    color: colors.textPrimary,
    fontSize: ms(14),
    fontWeight: '600',
  },
  sectionLabel: {
    color: colors.textSecond,
    fontSize: ms(13),
    marginBottom: vs(12),
  },
  pillContainer: {
    flexDirection: 'row',
    marginBottom: vs(24),
  },
  pill: {
    paddingVertical: vs(8),
    paddingHorizontal: hs(16),
    borderRadius: hs(20),
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: hs(12),
  },
  pillActive: {
    backgroundColor: colors.bgLight,
    borderColor: colors.primary,
  },
  pillText: {
    color: colors.textSecond,
    fontSize: ms(13),
    fontWeight: '500',
  },
  pillTextActive: {
    color: colors.textPrimary,
  },
  errorText: {
    color: colors.absent,
    fontSize: ms(13),
    marginBottom: vs(16),
    textAlign: 'center',
  },
  btnContainer: {
    marginTop: 'auto',
  }
});

export default OnboardingScreen;
