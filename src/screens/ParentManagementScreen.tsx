import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { hs, vs, ms } from '../theme/scale';
import api from '../config/api';

const ParentManagementScreen = ({ navigation }: any) => {
  const [uniformOrders, setUniformOrders] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetchUniformOrders();
  }, []);

  const fetchUniformOrders = async () => {
    try {
      const response = await api.get('/uniform');
      setUniformOrders(response.data);
    } catch (err) {
      // Failed to fetch uniform orders
    }
  };

  const managementTasks = [
    { id: 1, title: 'Term 1 Fee Payment', time: 'Due in 5 Days', icon: '💰', color: '#E74C3C' },
    { id: 2, title: 'Uniform Order Pickup', time: 'Next Monday', icon: '👕', color: '#3498DB' },
    { id: 3, title: 'Parent-Teacher Meeting', time: 'Friday, 10:00 AM', icon: '🤝', color: '#9B59B6' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#2C3E50" />
      <View style={styles.header}>
        <Text style={styles.title}>Management</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.banner}>
          <Text style={styles.bannerIcon}>🗂️</Text>
          <View style={styles.bannerTextWrap}>
            <Text style={styles.bannerTitle}>Parent Management</Text>
            <Text style={styles.bannerSub}>Quick access to essential school services.</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Services</Text>
        <View style={styles.grid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('PayFees')}>
            <View style={[styles.iconBox, { backgroundColor: '#FDEDEC' }]}>
              <Text style={styles.actionIcon}>💳</Text>
            </View>
            <Text style={styles.actionText}>Fee Payment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Uniform')}>
            <View style={[styles.iconBox, { backgroundColor: '#EBF5FB' }]}>
              <Text style={styles.actionIcon}>👕</Text>
            </View>
            <Text style={styles.actionText}>Uniform</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('BusLocation')}>
            <View style={[styles.iconBox, { backgroundColor: '#FEF5E7' }]}>
              <Text style={styles.actionIcon}>🚌</Text>
            </View>
            <Text style={styles.actionText}>Transport</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('UserProfile')}>
            <View style={[styles.iconBox, { backgroundColor: '#E8F8F5' }]}>
              <Text style={styles.actionIcon}>⚙️</Text>
            </View>
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Pending Action Items</Text>
        {managementTasks.map((task) => (
          <TouchableOpacity key={task.id} style={styles.taskCard} activeOpacity={0.8}>
            <View style={[styles.taskIconBox, { backgroundColor: `${task.color}20` }]}>
              <Text style={styles.taskIcon}>{task.icon}</Text>
            </View>
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskTime}>{task.time}</Text>
            </View>
            <TouchableOpacity style={styles.checkBtn}>
              <Text style={{color: task.color, fontWeight: '800'}}>✓</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Submitted Uniform Orders</Text>
        {uniformOrders.length === 0 ? (
          <Text style={{ color: colors.textSecond, textAlign: 'center', marginTop: vs(10) }}>No uniform orders found.</Text>
        ) : (
          uniformOrders.map((order, idx) => (
            <View key={idx} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderStudent}>{order.child_name || order.student_id}</Text>
                <Text style={styles.orderDate}>{new Date(order.created_at).toLocaleDateString()}</Text>
              </View>
              <View style={styles.orderDetails}>
                <Text style={styles.orderInfo}>Height: {order.height} cm</Text>
                <Text style={styles.orderInfo}>Width: {order.width} cm</Text>
              </View>
              {order.required_items && (
                <Text style={styles.orderItems}>
                  Items: {JSON.parse(order.required_items).join(', ')}
                </Text>
              )}
            </View>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgMain },
  header: { backgroundColor: '#2C3E50', paddingHorizontal: hs(20), paddingVertical: vs(16), alignItems: 'center' },
  title: { fontSize: ms(20), fontWeight: '700', color: '#FFF' },
  
  container: { padding: hs(20), paddingBottom: vs(40) },
  
  banner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgLight, padding: hs(16), borderRadius: hs(12), marginBottom: vs(24), elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  bannerIcon: { fontSize: ms(36), marginRight: hs(16) },
  bannerTextWrap: { flex: 1 },
  bannerTitle: { fontSize: ms(16), fontWeight: '700', color: colors.textPrimary, marginBottom: vs(2) },
  bannerSub: { fontSize: ms(13), color: colors.textSecond },

  sectionTitle: { fontSize: ms(18), fontWeight: '700', color: colors.textPrimary, marginBottom: vs(16) },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: vs(24) },
  actionCard: { width: '48%', backgroundColor: colors.bgLight, borderRadius: hs(12), padding: hs(16), alignItems: 'center', marginBottom: vs(16), elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3 },
  iconBox: { width: hs(56), height: hs(56), borderRadius: hs(28), alignItems: 'center', justifyContent: 'center', marginBottom: vs(12) },
  actionIcon: { fontSize: ms(24) },
  actionText: { fontSize: ms(14), fontWeight: '600', color: colors.textPrimary },

  taskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgLight, borderRadius: hs(12), padding: hs(16), marginBottom: vs(12), borderWidth: 1, borderColor: colors.border },
  taskIconBox: { width: hs(44), height: hs(44), borderRadius: hs(12), alignItems: 'center', justifyContent: 'center', marginRight: hs(16) },
  taskIcon: { fontSize: ms(20) },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: ms(15), fontWeight: '600', color: colors.textPrimary, marginBottom: vs(2) },
  taskTime: { fontSize: ms(13), color: colors.textSecond },
  checkBtn: { width: hs(32), height: hs(32), borderRadius: hs(16), borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },

  orderCard: { backgroundColor: '#FFF', borderRadius: hs(12), padding: hs(16), marginBottom: vs(12), borderWidth: 1, borderColor: '#EBF5FB', elevation: 1, shadowColor: '#3498DB', shadowOpacity: 0.1, shadowRadius: 4 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: vs(8) },
  orderStudent: { fontSize: ms(16), fontWeight: '700', color: '#2C3E50' },
  orderDate: { fontSize: ms(12), color: '#7F8C8D', fontWeight: '500' },
  orderDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: vs(6) },
  orderInfo: { fontSize: ms(14), color: '#34495E', fontWeight: '500' },
  orderItems: { fontSize: ms(13), color: '#3498DB', fontStyle: 'italic', marginTop: vs(4) }
});

export default ParentManagementScreen;
