import { colors } from '../../theme/colors';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TermsScreen = ({ navigation }: any) => (
  <SafeAreaView style={styles.safe} edges={['top']}>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backIcon}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Terms of Use</Text>
      <View style={{ width: 40 }} />
    </View>
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.heading}>Terms of Use</Text>
      <Text style={styles.content}>
        By using ParentLink, you agree to these terms and conditions.
        {'\n\n'}
        1. You must provide accurate information when registering.
        {'\n\n'}
        2. You are responsible for maintaining the confidentiality of your account.
        {'\n\n'}
        3. You agree not to misuse the services provided.
        {'\n\n'}
        4. ParentLink reserves the right to modify these terms at any time.
        {'\n\n'}
        5. Continued use of the app after changes constitutes acceptance.
        {'\n\n'}
        6. All student data is kept confidential and secure.
        {'\n\n'}
        7. You may not share your login credentials with others.
        {'\n\n'}
        8. ParentLink is not liable for any indirect damages.
      </Text>
    </ScrollView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#F5F0E8' },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#C0392B', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 6 },
  backIcon:{ fontSize: 30, color: colors.textPrimary, fontWeight: '700' },
  title:   { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  body:    { padding: 20 },
  heading: { fontSize: 20, fontWeight: '700', color: '#C0392B', marginBottom: 16 },
  content: { fontSize: 14, color: '#2C1A0E', lineHeight: 24 },
});

export default TermsScreen;
