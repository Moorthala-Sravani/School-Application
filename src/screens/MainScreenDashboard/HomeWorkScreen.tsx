import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchHomework } from '../../store/slices/homeworkSlice';
import { colors } from '../../theme/colors';
import { hs, vs, ms } from '../../theme/scale';

const HomeWorkScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { homeworkList, loading } = useSelector((state: RootState) => state.homework);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    dispatch(fetchHomework());
  }, [dispatch]);

  const profile = useSelector((state: RootState) => state.profile);
  const childClass = profile.child_class || 'Grade 6';
  
  // Filter mock logic (assuming backend returns all active homework for class)
  const displayList = homeworkList || [];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgMain} />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Homework</Text>
          <Text style={styles.headerSubtitle}>{childClass} · {new Date().toLocaleDateString()}</Text>
        </View>
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingText}>{displayList.length} pending</Text>
        </View>
      </View>

      <View style={styles.tabsRow}>
        {['All', 'Today', 'Due soon', 'Done'].map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tabBtn, filter === tab && styles.tabBtnActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.tabText, filter === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: vs(40) }} />
        ) : (
          <View style={{ paddingTop: vs(16) }}>
            {displayList.length === 0 && (
              <Text style={{ color: colors.textSecond, textAlign: 'center', marginTop: vs(16) }}>No pending homework.</Text>
            )}

            {displayList.map((hw, idx) => {
              // Extract date
              const dateObj = new Date(hw.created_at);
              const isToday = dateObj.toDateString() === new Date().toDateString();
              const dateString = isToday ? 'Today' : dateObj.toLocaleDateString();
              
              // Show date chip only if it's different from the previous message
              const showDateChip = idx === 0 || new Date(displayList[idx - 1].created_at).toDateString() !== dateObj.toDateString();

              return (
                <View key={hw.id}>
                  {showDateChip && (
                    <View style={styles.dateChipContainer}>
                      <View style={styles.dateChip}><Text style={styles.dateChipText}>{dateString}</Text></View>
                    </View>
                  )}
                  
                  {/* WhatsApp style message bubble (Left aligned like receiving a message) */}
                  <View style={styles.msgLeft}>
                    <View style={styles.msgBubble}>
                      <View style={styles.msgHeader}>
                        <Text style={styles.msgSubject}>{hw.title}</Text>
                        <Text style={styles.msgTime}>{dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                      </View>
                      <Text style={styles.msgDesc}>{hw.description}</Text>
                      <Text style={styles.msgAuthor}>Teacher: {hw.teacher_firstname || hw.teacher_id}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgMain },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: hs(24), paddingBottom: vs(16) },
  headerTitle: { color: colors.textPrimary, fontSize: ms(24), fontWeight: '700' },
  headerSubtitle: { color: colors.textLight, fontSize: ms(13), marginTop: vs(4) },
  pendingBadge: { backgroundColor: colors.bgLight, paddingHorizontal: hs(12), paddingVertical: vs(8), borderRadius: hs(8), borderWidth: 1, borderColor: '#E67E22' },
  pendingText: { color: colors.orangeLight, fontSize: ms(13), fontWeight: '700' },
  tabsRow: { flexDirection: 'row', paddingHorizontal: hs(24), marginBottom: vs(16) },
  tabBtn: { paddingVertical: vs(8), paddingHorizontal: hs(16), borderRadius: hs(20), marginRight: hs(8), backgroundColor: colors.bgLight },
  tabBtnActive: { backgroundColor: colors.primary },
  tabText: { color: colors.textLight, fontSize: ms(13), fontWeight: '500' },
  tabTextActive: { color: colors.textPrimary },
  container: { paddingHorizontal: hs(16), paddingBottom: vs(40) },
  dateChipContainer: { alignItems: 'center', marginBottom: vs(16), marginTop: vs(8) },
  dateChip: { backgroundColor: colors.bgLight, paddingHorizontal: hs(12), paddingVertical: vs(4), borderRadius: hs(12), borderWidth: 1, borderColor: colors.border },
  dateChipText: { color: colors.textLight, fontSize: ms(11), fontWeight: '600' },
  msgLeft: { alignSelf: 'flex-start', maxWidth: '85%', marginBottom: vs(16) },
  msgBubble: { backgroundColor: colors.bgLight, padding: hs(14), borderRadius: hs(16), borderTopLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  msgHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(6) },
  msgSubject: { color: colors.primary, fontSize: ms(15), fontWeight: '700', flex: 1, marginRight: hs(8) },
  msgTime: { color: colors.textSecond, fontSize: ms(11) },
  msgDesc: { color: colors.textPrimary, fontSize: ms(14), lineHeight: 20, marginBottom: vs(8) },
  msgAuthor: { color: colors.textSecond, fontSize: ms(12), fontStyle: 'italic', alignSelf: 'flex-end' }
});

export default HomeWorkScreen;
