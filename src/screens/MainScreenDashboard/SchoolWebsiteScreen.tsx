import { colors } from '../../theme/colors';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SchoolWebsiteScreen = ({ navigation }: any) => (
  <SafeAreaView style={styles.safe} edges={['top']}>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backIcon}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.title}>School Website</Text>
      <View style={{ width: 40 }} />
    </View>
    <View style={styles.body}>
      <Text style={styles.emoji}>🌐</Text>
      <Text style={styles.text}>School Website</Text>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#F5F0E8' },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#C0392B', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 6 },
  backIcon:{ fontSize: 30, color: colors.textPrimary, fontWeight: '700' },
  title:   { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  body:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emoji:   { fontSize: 60, marginBottom: 16 },
  text:    { fontSize: 22, fontWeight: '700', color: '#2C1A0E' },
});

export default SchoolWebsiteScreen;
