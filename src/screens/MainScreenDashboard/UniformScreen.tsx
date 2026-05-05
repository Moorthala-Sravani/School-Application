import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { hs, vs, ms } from '../../theme/scale';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { submitUniform, resetUniformState, fetchUniformRequests } from '../../store/slices/uniformSlice';
import { sendMessage } from '../../store/slices/messageSlice';
import { belongsToParentChild } from '../../utils/parentData';

const UNIFORM_TYPES = ['Shirt', 'Trouser/Skirt', 'Tie', 'Belt'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL'];

const UniformScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, success, requests, requestsLoading } = useSelector((state: RootState) => state.uniform);
  const { role } = useSelector((state: RootState) => state.auth);
  const auth = useSelector((state: RootState) => state.auth);
  const profile = useSelector((state: RootState) => state.profile);

  const [selectedType, setSelectedType] = useState<string>('Shirt');
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState<string>('');
  const [lastStatusSeen, setLastStatusSeen] = useState<string | null>(null);

  if (role === 'Teacher') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#2C3E50" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Uniform Request</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: hs(20) }}>
          <Text style={{ fontSize: ms(60), marginBottom: vs(20) }}>🚫</Text>
          <Text style={{ fontSize: ms(18), color: colors.textPrimary, fontWeight: '700', textAlign: 'center', marginBottom: vs(10) }}>Access Restricted</Text>
          <Text style={{ fontSize: ms(14), color: colors.textSecond, textAlign: 'center' }}>Uniform requests are only for students, not for teachers.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleIncrement = () => setQuantity(prev => Math.min(prev + 1, 10));
  const handleDecrement = () => setQuantity(prev => Math.max(prev - 1, 1));

  const handleSubmit = () => {
    const parentName = `${profile.firstname} ${profile.lastname}`;
    const childName = profile.child_name || 'My Child';
    const childClass = profile.child_class || 'N/A';
    
    // Fallback required_items logic to prevent breakage on legacy backends
    const payload = {
      type: selectedType,
      size: selectedSize,
      quantity,
      note,
      child_name: childName,
      child_class: childClass,
      // For compatibility if backend only checks required_items
      required_items: [`${selectedType} (Size: ${selectedSize}, Qty: ${quantity})`] 
    };

    Alert.alert(
      'Confirm Submission',
      'This uniform request will be sent to the administration for review.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Submit Request', 
          onPress: async () => {
            try {
              await dispatch(submitUniform(payload)).unwrap();
              await dispatch(
                sendMessage({
                  content: `New uniform request from ${parentName} - ${childName}, Class ${childClass}. Details: ${quantity}x ${selectedType} (Size ${selectedSize}). Note: ${note}`,
                  class_group: 'Management',
                  targetRole: 'Admin',
                  title: 'Uniform Request Submitted',
                })
              ).unwrap();
            } catch (err) {
              // Failed to submit uniform request
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    dispatch(fetchUniformRequests());
    
    const unsubscribeFocus = navigation?.addListener?.('focus', () => {
      dispatch(fetchUniformRequests());
    });
    
    // Simulate real-time by polling actively while on the screen
    const intervalId = setInterval(() => {
      dispatch(fetchUniformRequests());
    }, 5000); // reduced to 5s to simulate instant syncing

    return () => {
      clearInterval(intervalId);
      if (typeof unsubscribeFocus === 'function') unsubscribeFocus();
    };
  }, [dispatch, navigation]);

  useEffect(() => {
    if (success) {
      setSelectedType('Shirt');
      setSelectedSize('M');
      setQuantity(1);
      setNote('');
      dispatch(resetUniformState());
      dispatch(fetchUniformRequests());
    }
    if (error) {
      dispatch(resetUniformState());
    }
  }, [success, error, dispatch]);

  const myRequests = (requests || []).filter((request: any) => belongsToParentChild(request, profile, auth)).slice().sort((a: any, b: any) => {
    const aTime = new Date(a.created_at || 0).getTime();
    const bTime = new Date(b.created_at || 0).getTime();
    return bTime - aTime;
  });

  const formatStatus = (status?: string) => {
    if (!status) return 'Pending';
    const rawStatus = String(status).trim();
    if (rawStatus.toLowerCase() === 'more_details_required' || rawStatus.toLowerCase() === 'need_more_details') {
      return 'More details req';
    }
    return rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#2C3E50" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Uniform Request</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Child Profile Banner */}
        <View style={styles.profileBanner}>
          <View style={styles.profileAvatar}>
            <Text style={{fontSize: ms(24)}}>🎓</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.childName}>{profile.child_name || 'Student Name'}</Text>
            <Text style={styles.childClass}>Class: {profile.child_class || 'N/A'}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Uniform Type</Text>
        <View style={styles.typesGrid}>
          {UNIFORM_TYPES.map(type => (
            <TouchableOpacity 
              key={type} 
              style={[styles.typeBtn, selectedType === type && styles.typeBtnActive]}
              onPress={() => setSelectedType(type)}
            >
              <Text style={[styles.typeText, selectedType === type && styles.typeTextActive]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Select Size</Text>
        <View style={styles.pillContainer}>
          {SIZES.map(s => (
            <TouchableOpacity 
              key={s} 
              style={[styles.pill, selectedSize === s && styles.pillActive]}
              onPress={() => setSelectedSize(s)}
            >
              <Text style={[styles.pillText, selectedSize === s && styles.pillTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.rowLayout}>
          <View style={{ flex: 1, marginRight: hs(16) }}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.stepperWrap}>
              <TouchableOpacity style={styles.stepperBtn} onPress={handleDecrement}>
                <Text style={styles.stepperSymbol}>−</Text>
              </TouchableOpacity>
              <Text style={styles.quantityVal}>{quantity}</Text>
              <TouchableOpacity style={styles.stepperBtn} onPress={handleIncrement}>
                <Text style={styles.stepperSymbol}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Note (Optional)</Text>
            <TextInput
               style={styles.noteInput}
               placeholder="Additional details..."
               value={note}
               onChangeText={setNote}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Submit Request</Text>}
        </TouchableOpacity>

        <View style={styles.divider} />
        
        <Text style={styles.sectionTitle}>Request History</Text>
        {requestsLoading && myRequests.length === 0 ? (
          <ActivityIndicator color="#2C3E50" style={{ marginVertical: vs(16) }} />
        ) : myRequests.length > 0 ? (
          myRequests.map((item: any) => {
            const statusStr = String(item.status || 'pending').toLowerCase();
            const isApproved = statusStr.includes('approv');
            const isRejected = statusStr.includes('reject');

            return (
              <View key={`uniform-${item.id}`} style={styles.historyCard}>
                <View style={styles.historyTop}>
                   <View style={{flex: 1}}>
                      <Text style={styles.historyType} numberOfLines={1}>
                        {item.type ? `${item.quantity || 1}x ${item.type} (Size ${item.size})` : (Array.isArray(item.required_items) ? item.required_items.join(', ') : item.required_items)}
                      </Text>
                      <Text style={styles.historyDate}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</Text>
                   </View>
                   <View style={[styles.statusBadge, isApproved ? styles.badgeGreen : isRejected ? styles.badgeRed : styles.badgeOrange]}>
                     <Text style={[styles.statusText, isApproved ? styles.textGreen : isRejected ? styles.textRed : styles.textOrange]}>
                       {formatStatus(item.status)}
                     </Text>
                   </View>
                </View>

                {isApproved && (
                   <View style={styles.actionNoteBox}>
                      <Text style={styles.actionNoteText}>✅ Collect from office</Text>
                   </View>
                )}

                {isRejected && (
                   <View style={[styles.actionNoteBox, { backgroundColor: '#FDEDEC', borderColor: '#F5B7B1' }]}>
                      <Text style={[styles.actionNoteText, { color: '#C0392B' }]}>❌ {item.admin_note || item.remarks || 'Rejected by Admin'}</Text>
                   </View>
                )}
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyStatus}>No requests submitted yet.</Text>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgMain },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#2C3E50', paddingHorizontal: hs(16), paddingVertical: vs(12) },
  backBtn: { padding: 6 },
  backIcon: { fontSize: 34, color: '#FFF', lineHeight: 34, marginTop: -4 },
  title: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  
  container: { padding: hs(20), paddingBottom: vs(40) },
  
  profileBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: hs(14), borderRadius: hs(12), marginBottom: vs(24), borderWidth: 1, borderColor: '#E5E8E8' },
  profileAvatar: { width: hs(48), height: hs(48), borderRadius: hs(24), backgroundColor: '#EBF5FB', alignItems: 'center', justifyContent: 'center', marginRight: hs(14) },
  profileInfo: { flex: 1 },
  childName: { fontSize: ms(16), fontWeight: '700', color: '#2C3E50' },
  childClass: { fontSize: ms(13), color: colors.textSecond, marginTop: 2 },

  sectionTitle: { fontSize: ms(15), fontWeight: '700', color: colors.textPrimary, marginBottom: vs(12) },

  typesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: hs(10), marginBottom: vs(20) },
  typeBtn: { flex: 1, minWidth: '45%', backgroundColor: '#FFF', paddingVertical: vs(12), borderRadius: hs(8), borderWidth: 1, borderColor: '#D5D8DC', alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#EBF5FB', borderColor: '#3498DB' },
  typeText: { fontSize: ms(14), color: '#566573', fontWeight: '600' },
  typeTextActive: { color: '#2980B9', fontWeight: '700' },

  pillContainer: { flexDirection: 'row', gap: hs(10), marginBottom: vs(24) },
  pill: { flex: 1, backgroundColor: '#FFF', paddingVertical: vs(10), borderRadius: hs(20), alignItems: 'center', borderWidth: 1, borderColor: '#D5D8DC' },
  pillActive: { backgroundColor: '#34495E', borderColor: '#2C3E50' },
  pillText: { fontSize: ms(14), color: '#566573', fontWeight: '600' },
  pillTextActive: { color: '#FFF', fontWeight: '700' },

  rowLayout: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: vs(24) },
  
  stepperWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: hs(8), borderWidth: 1, borderColor: '#D5D8DC', alignSelf: 'flex-start' },
  stepperBtn: { paddingHorizontal: hs(16), paddingVertical: vs(8) },
  stepperSymbol: { fontSize: ms(18), color: '#2C3E50', fontWeight: '600' },
  quantityVal: { fontSize: ms(16), fontWeight: '700', color: '#2C3E50', minWidth: hs(24), textAlign: 'center' },
  
  noteInput: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D5D8DC', borderRadius: hs(8), paddingHorizontal: hs(10), height: vs(40), fontSize: ms(14), color: '#2C3E50' },

  submitBtn: { backgroundColor: '#2C3E50', paddingVertical: vs(16), borderRadius: hs(12), alignItems: 'center' },
  submitBtnText: { color: '#FFF', fontSize: ms(16), fontWeight: '700' },

  divider: { height: 1, backgroundColor: '#E5E8E8', marginVertical: vs(24) },

  historyCard: { backgroundColor: '#FFF', borderRadius: hs(12), padding: hs(14), marginBottom: vs(12), borderWidth: 1, borderColor: '#E5E8E8', elevation: 1 },
  historyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  historyType: { fontSize: ms(15), fontWeight: '700', color: '#2C3E50', marginBottom: 2 },
  historyDate: { fontSize: ms(12), color: '#7F8C8D' },
  
  statusBadge: { paddingHorizontal: hs(8), paddingVertical: vs(4), borderRadius: hs(12), alignSelf: 'center' },
  statusText: { fontSize: ms(11), fontWeight: '700' },
  badgeGreen: { backgroundColor: 'rgba(46, 204, 113, 0.15)' },
  badgeRed: { backgroundColor: 'rgba(231, 76, 60, 0.15)' },
  badgeOrange: { backgroundColor: 'rgba(243, 156, 18, 0.15)' },
  textGreen: { color: '#27AE60', fontSize: ms(11), fontWeight: '700' },
  textRed: { color: '#C0392B', fontSize: ms(11), fontWeight: '700' },
  textOrange: { color: '#D35400', fontSize: ms(11), fontWeight: '700' },

  actionNoteBox: { marginTop: vs(10), backgroundColor: '#EAFDF4', padding: hs(8), borderRadius: hs(6), borderWidth: 1, borderColor: '#A9DFBF' },
  actionNoteText: { fontSize: ms(13), color: '#1E8449', fontWeight: '500' },

  emptyStatus: { color: colors.textSecond, textAlign: 'center', marginTop: vs(10) }
});

export default UniformScreen;
