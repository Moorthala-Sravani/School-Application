import { colors } from '../../theme/colors';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PrivacyScreen = ({ navigation }: any) => (
  <SafeAreaView style={styles.safe} edges={['top']}>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backIcon}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Privacy Policy</Text>
      <View style={{ width: 40 }} />
    </View>
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.heading}>Privacy Policy</Text>
      <Text style={styles.content}>
        ParentLink is committed to protecting your privacy.
        {'\n\n'}
        1. We collect only necessary information to provide our services.
        {'\n\n'}
        2. Student data is never shared with third parties.
        {'\n\n'}
        3. All data is encrypted and stored securely.
        {'\n\n'}
        4. You can request deletion of your data at any time.
        {'\n\n'}
        5. We use cookies only for authentication purposes.
        {'\n\n'}
        6. Location data is never collected or stored.
        {'\n\n'}
        7. We comply with all applicable data protection laws.
        {'\n\n'}
        8. Contact us at privacy@parentlink.com for any concerns.
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

export default PrivacyScreen;
