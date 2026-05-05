import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchBusRoute } from '../../store/slices/busSlice';
import { colors } from '../../theme/colors';
import { hs, vs, ms } from '../../theme/scale';

const BusTrackingScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { busData, loading } = useSelector((state: RootState) => state.bus);

  useEffect(() => {
    dispatch(fetchBusRoute('1'));
  }, [dispatch]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgMain} />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Bus tracking</Text>
          <Text style={styles.headerSubtitle}>{busData?.route_name || 'Route Loading...'}</Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      </View>

      {/* Mock Map Area */}
      <View style={styles.mapArea}>
        <View style={styles.mapLine} />
        <View style={styles.mapBus}>
          <Text style={styles.mapBusText}>Bus #{busData?.id || '?'} - {busData?.driver_name ? 'En route' : 'Waiting'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        
        {loading || !busData ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: vs(40) }} />
        ) : (
          <>
            <View style={styles.busInfoCard}>
              <View style={styles.busInfoRow}>
                <Text style={styles.busNumber}>{busData.route_name}</Text>
                <View style={styles.enrouteBadge}><Text style={styles.enrouteText}>En route</Text></View>
              </View>
              <View style={styles.gridRow}>
                <View style={styles.gridCol}><Text style={styles.gridLabel}>Driver</Text><Text style={styles.gridValue}>{busData.driver_name}</Text></View>
                <View style={styles.gridCol}><Text style={styles.gridLabel}>Vehicle</Text><Text style={styles.gridValue}>{busData.vehicle_number}</Text></View>
              </View>
              <View style={styles.gridRow}>
                <View style={styles.gridCol}><Text style={styles.gridLabel}>Contact</Text><Text style={[styles.gridValue, { color: colors.primary }]}>{busData.driver_phone}</Text></View>
                <View style={styles.gridCol}><Text style={styles.gridLabel}>ETA</Text><Text style={styles.gridValue}>Live tracking active</Text></View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Route stops</Text>

            <View style={styles.timeline}>
              <View style={styles.timelineLine} />
              
              {busData.stops?.map((stop: any, idx: number) => {
                const isDone = new Date(`1970-01-01T${stop.arrival_time}`) < new Date(`1970-01-01T08:00:00`); // Dummy logic for passed stops
                
                return (
                  <View key={stop.id} style={styles.stopItem}>
                    <View style={[styles.stopNode, isDone ? { backgroundColor: colors.present, borderColor: colors.present } : {}]}>
                      <Text style={[styles.stopNum, !isDone ? { color: colors.textSecond } : {}]}>{idx + 1}</Text>
                    </View>
                    <View style={styles.stopInfo}>
                      <Text style={[styles.stopName, !isDone ? { color: colors.textSecond } : {}]}>{stop.stop_name}</Text>
                      <Text style={[styles.stopTime, !isDone ? { color: colors.textSecond } : {}]}>{stop.arrival_time}</Text>
                    </View>
                    <Text style={[styles.stopStatus, !isDone ? { color: colors.textSecond } : isDone ? { color: colors.present } : {}]}>
                      {isDone ? 'Passed' : 'Pending'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgMain },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: hs(24), paddingBottom: vs(16) },
  headerTitle: { color: colors.textPrimary, fontSize: ms(24), fontWeight: '700' },
  headerSubtitle: { color: colors.textLight, fontSize: ms(14), marginTop: vs(4) },
  liveBadge: { flexDirection: 'row', alignItems: 'center' },
  liveDot: { width: hs(8), height: hs(8), borderRadius: hs(4), backgroundColor: colors.present, marginRight: hs(6) },
  liveText: { color: colors.present, fontSize: ms(14), fontWeight: '600' },
  mapArea: { height: vs(140), backgroundColor: colors.bgLight, borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  mapLine: { position: 'absolute', width: '100%', height: 2, backgroundColor: colors.border },
  mapBus: { backgroundColor: colors.bgLight, borderWidth: 1, borderColor: colors.primary, borderRadius: hs(20), paddingHorizontal: hs(16), paddingVertical: vs(8) },
  mapBusText: { color: colors.textPrimary, fontSize: ms(13), fontWeight: '600' },
  container: { padding: hs(24), paddingBottom: vs(40) },
  busInfoCard: { backgroundColor: colors.bgLight, borderRadius: hs(16), padding: hs(20), marginBottom: vs(32), borderWidth: 1, borderColor: colors.border },
  busInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(24) },
  busNumber: { color: colors.textPrimary, fontSize: ms(16), fontWeight: '700' },
  enrouteBadge: { backgroundColor: colors.bgLight, paddingHorizontal: hs(8), paddingVertical: vs(4), borderRadius: hs(4) },
  enrouteText: { color: colors.present, fontSize: ms(11), fontWeight: '600' },
  gridRow: { flexDirection: 'row', marginBottom: vs(16) },
  gridCol: { flex: 1 },
  gridLabel: { color: colors.textLight, fontSize: ms(12), marginBottom: vs(4) },
  gridValue: { color: colors.textPrimary, fontSize: ms(14), fontWeight: '500' },
  sectionTitle: { color: colors.textPrimary, fontSize: ms(16), fontWeight: '600', marginBottom: vs(24) },
  timeline: { paddingLeft: hs(12) },
  timelineLine: { position: 'absolute', left: hs(27), top: 0, bottom: 0, width: 2, backgroundColor: colors.border },
  stopItem: { flexDirection: 'row', alignItems: 'center', marginBottom: vs(32) },
  stopNode: { width: hs(32), height: hs(32), borderRadius: hs(16), backgroundColor: colors.bgLight, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', zIndex: 1, marginRight: hs(16) },
  stopNum: { color: colors.textPrimary, fontSize: ms(14), fontWeight: '700' },
  stopInfo: { flex: 1 },
  stopName: { color: colors.textSecond, fontSize: ms(15), fontWeight: '600', marginBottom: vs(4) },
  stopTime: { color: colors.textSecond, fontSize: ms(13) },
  stopStatus: { color: colors.textSecond, fontSize: ms(12), fontWeight: '600' }
});

export default BusTrackingScreen;
