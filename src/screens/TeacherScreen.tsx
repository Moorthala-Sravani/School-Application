import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TeacherScreen = () => (
  <View style={styles.container}>
    <Text style={styles.emoji}>👩‍🏫</Text>
    <Text style={styles.text}>Teacher</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: '#F5F0E8',
  },
  emoji: { fontSize: 48, marginBottom: 12 },
  text:  { fontSize: 24, fontWeight: '700', color: '#2C1A0E' },
});

export default TeacherScreen;
