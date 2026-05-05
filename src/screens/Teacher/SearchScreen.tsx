import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image } from 'react-native';

const MOCK_DATA = [
  { id: '1', type: 'Student', name: 'Aarav Sharma', detail: 'Class 6-A | Roll No: 1001' },
  { id: '2', type: 'Student', name: 'Vihaan Patel', detail: 'Class 6-A | Roll No: 1002' },
  { id: '3', type: 'Student', name: 'Aditya Singh', detail: 'Class 7-B | Roll No: 2014' },
  { id: '4', type: 'Assignment', name: 'Math Homework - Fractions', detail: 'Due: 2026-05-15 | Class 6-A' },
  { id: '5', type: 'Assignment', name: 'Science Project - Volcano', detail: 'Due: 2026-05-20 | Class 7-B' },
  { id: '6', type: 'Student', name: 'Diya Reddy', detail: 'Class 8-C | Roll No: 3005' },
];

const SearchScreen = () => {
  const [query, setQuery] = useState('');

  const filteredData = query.trim() === '' 
    ? [] 
    : MOCK_DATA.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) || 
        item.detail.toLowerCase().includes(query.toLowerCase()) ||
        item.type.toLowerCase().includes(query.toLowerCase())
      );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.header}>Search</Text>
        <TextInput 
          style={styles.searchInput}
          placeholder="Search for students, assignments, classes..."
          placeholderTextColor="#888"
          value={query}
          onChangeText={setQuery}
        />
        
        {query.trim() === '' ? (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>🔍</Text>
            <Text style={styles.placeholderText}>Search results will appear here</Text>
          </View>
        ) : (
          <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
            {filteredData.length === 0 ? (
              <Text style={styles.noResultsText}>No results found for "{query}"</Text>
            ) : (
              filteredData.map(item => (
                <TouchableOpacity key={item.id} style={styles.resultCard} activeOpacity={0.7}>
                  <View style={styles.resultIconWrap}>
                    {item.type === 'Student' ? (
                      <Image 
                        source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=random&color=fff&size=100` }}
                        style={{ width: '100%', height: '100%' }}
                      />
                    ) : (
                      <Text style={styles.resultIcon}>📚</Text>
                    )}
                  </View>
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName}>{item.name}</Text>
                    <Text style={styles.resultDetail}>{item.detail}</Text>
                  </View>
                  <Text style={styles.resultBadge}>{item.type}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  container: { flex: 1, padding: 16 },
  header: { fontSize: 24, fontWeight: '700', color: '#2C1A0E', marginBottom: 16 },
  searchInput: {
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8DDD0',
    fontSize: 16,
    color: '#2C1A0E',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: { fontSize: 48, marginBottom: 12 },
  placeholderText: {
    fontSize: 16,
    color: '#8B4513',
  },
  resultsContainer: { flex: 1 },
  noResultsText: { textAlign: 'center', marginTop: 32, fontSize: 16, color: '#8B4513' },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  resultIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FDF7EC', alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' },
  resultIcon: { fontSize: 20 },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 16, fontWeight: '700', color: '#2C1A0E', marginBottom: 4 },
  resultDetail: { fontSize: 13, color: '#8B4513' },
  resultBadge: { fontSize: 11, fontWeight: '600', color: '#FFF', backgroundColor: '#E67E22', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
});

export default SearchScreen;
