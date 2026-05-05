import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchMessages, sendMessage } from '../../store/slices/messageSlice';
import api from '../../config/api';
import { colors } from '../../theme/colors';
import { hs, vs, ms } from '../../theme/scale';

const normalizeClassGroup = (input?: string | null) => {
  if (!input) return '6-A';
  return input.replace(/^class\s*/i, '').trim();
};

const firstString = (value?: string | string[] | null) => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value ?? undefined;
};

const MessagesScreen = ({ route, navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { messages } = useSelector((state: RootState) => state.messages);
  const [inputText, setInputText] = useState('');

  const { id: authId, role } = useSelector((state: RootState) => state.auth);
  const profile = useSelector((state: RootState) => state.profile);
  const teacherProfile = useSelector((state: RootState) => state.teacherProfile);

  const contactRole = route.params?.contactRole;
  const receiverId = route.params?.receiverId;
  const teacherId = route.params?.teacherId;
  const parentId = route.params?.parentId;
  const currentUserId = authId ?? (role === 'Parent' ? profile.id : null);
  const normalizedContactRole = contactRole ? String(contactRole).toLowerCase() : undefined;
  const isManagementChat = normalizedContactRole === 'management';

  const targetRole = normalizedContactRole === 'parent'
    ? 'Parent'
    : normalizedContactRole === 'teacher'
      ? 'Teacher'
      : normalizedContactRole === 'admin' || normalizedContactRole === 'management'
        ? 'Admin'
        : role === 'Parent'
          ? 'Teacher'
          : role === 'Teacher'
            ? 'Parent'
            : 'Teacher';

  const teacherClass = firstString(teacherProfile.assigned_classes?.[0]);
  const normalizedParentClass = normalizeClassGroup(profile.child_class);
  const normalizedTeacherClass = normalizeClassGroup(teacherClass);

  // In a class group chat, the header should just say the Class name
  const otherName = isManagementChat
    ? 'School Management'
    : targetRole === 'Parent'
      ? 'Parent'
      : targetRole === 'Teacher'
        ? 'Teacher'
        : targetRole === 'Admin'
          ? 'Admin'
    : role === 'Parent'
      ? normalizeClassGroup(profile.child_class || '6-A')
      : normalizedTeacherClass;
  const chatGroup = isManagementChat
    ? 'Management'
    : role === 'Teacher'
      ? normalizeClassGroup(firstString(teacherProfile.assigned_classes?.[0]) || '6-A')
      : normalizedParentClass;

  const scrollViewRef = React.useRef<ScrollView>(null);
  const [isSending, setIsSending] = useState(false);
  const [resolvedTeacherId, setResolvedTeacherId] = useState<number | undefined>(undefined);
  const effectiveReceiverId = receiverId ?? (role === 'Parent' ? resolvedTeacherId : undefined);
  const messageQuery = effectiveReceiverId || teacherId || parentId
    ? { receiverId: effectiveReceiverId, teacherId: teacherId ?? resolvedTeacherId, parentId, classGroup: chatGroup }
    : chatGroup;

  useEffect(() => {
    if (role !== 'Parent' || receiverId || teacherId || isManagementChat) {
      setResolvedTeacherId(undefined);
      return;
    }

    let mounted = true;
    const resolveTeacherForClass = async () => {
      const endpoints = [
        { url: '/teachers/assigned', config: { params: { class_group: chatGroup } } },
        { url: `/profile/teachers/by-class/${encodeURIComponent(chatGroup)}` },
        { url: '/teachers', config: { params: { class_group: chatGroup } } },
      ];

      for (const endpoint of endpoints) {
        try {
          const res = await api.get(endpoint.url, endpoint.config);
          const row = Array.isArray(res.data) ? res.data[0] : (res.data?.teacher || res.data);
          const id = row?.id ?? row?.teacher_id ?? row?.user_id;
          if (id && mounted) {
            setResolvedTeacherId(id);
            return;
          }
        } catch {
          // Try the next backend shape.
        }
      }
    };

    resolveTeacherForClass();
    return () => {
      mounted = false;
    };
  }, [role, receiverId, teacherId, isManagementChat, chatGroup]);

  useEffect(() => {
    dispatch(fetchMessages(messageQuery));
  }, [dispatch, chatGroup, effectiveReceiverId, teacherId, parentId]);

  const handleSend = async () => {
    if (inputText.trim() === '' || isSending) return;
    
    const messageToSend = inputText.trim();
    setInputText(''); // Clear immediately to prevent double-typing or duplicate UI sends
    setIsSending(true);
    
    try {
      await dispatch(
        sendMessage({
          content: messageToSend,
          receiverId: effectiveReceiverId,
          teacherId: teacherId ?? resolvedTeacherId,
          parentId,
          class_group: chatGroup,
          targetRole: targetRole as 'Parent' | 'Teacher' | 'Admin',
          title: isManagementChat ? 'Support Message' : 'Class Message',
        })
      ).unwrap();
      await dispatch(fetchMessages(messageQuery)).unwrap();
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 200);
    } catch (err: any) {
      Alert.alert('Send failed', String(err || 'Unable to send message'));
      setInputText(messageToSend); // Restore if failed
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgMain} />
      
      <View style={styles.header}>
        <View style={styles.headerProfileRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: hs(16)}}>
             <Text style={{color: colors.textPrimary, fontSize: ms(24)}}>‹</Text>
          </TouchableOpacity>
          <View style={styles.avatar}><Text style={styles.avatarText}>👥</Text></View>
          <View style={styles.headerInfo}>
            <Text style={styles.teacherName}>{isManagementChat ? 'School Management' : `${otherName} Group`}</Text>
            <View style={styles.onlineStatusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.container}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          
          <View style={styles.dateChipContainer}>
            <View style={styles.dateChip}><Text style={styles.dateChipText}>Today</Text></View>
          </View>

          {(() => {
            const orderedMessages = [...messages].sort((a: any, b: any) => {
              return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
            });

            return orderedMessages.map((msg: any, index: number) => {
              const senderType = String(msg.sender_type || '').toLowerCase();
              const isMe = currentUserId != null && msg.sender_id != null
                ? String(msg.sender_id) === String(currentUserId)
                : senderType === String(role || '').toLowerCase();
              return (
                <View key={msg.id ?? `${msg.created_at}-${index}`} style={isMe ? styles.msgRight : styles.msgLeft}>
                  {!isMe && <Text style={styles.msgSenderName}>{msg.sender_name}</Text>}
                  <View style={[
                    isMe ? styles.msgBubbleRight : styles.msgBubbleLeft, 
                    !isMe && msg.title?.includes('Leave') ? { 
                      borderColor: msg.title.includes('Approved') ? '#2ECC71' : '#E74C3C', 
                      borderWidth: 1.5, 
                      backgroundColor: msg.title.includes('Approved') ? '#E8F8F5' : '#FDEDEC' 
                    } : null
                  ]}>
                    {msg.title && msg.title !== 'Class Message' && msg.title !== 'Support Message' && (
                      <Text style={[
                        styles.msgTitleText, 
                        isMe ? {color: '#FFF'} : null, 
                        !isMe && msg.title.includes('Approved') ? {color: '#27AE60'} : 
                        !isMe && (msg.title.includes('Rejected') || msg.title.includes('Absent')) ? {color: '#C0392B'} : null
                      ]}>
                        {msg.title}
                      </Text>
                    )}
                    <Text style={isMe ? styles.msgTextRight : styles.msgTextLeft}>{msg.content}</Text>
                  </View>
                  <Text style={isMe ? styles.msgTimeRight : styles.msgTimeLeft}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              );
            });
          })()}

        </ScrollView>

        <View style={styles.inputArea}>
          <TextInput 
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#6E6E7B"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Text style={styles.sendIcon}>➔</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgMain },
  header: { padding: hs(24), paddingBottom: vs(16), borderBottomWidth: 1, borderBottomColor: colors.border },
  headerProfileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: hs(44), height: hs(44), borderRadius: hs(22), backgroundColor: colors.bgLight, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: hs(16) },
  avatarText: { color: colors.primary, fontSize: ms(16), fontWeight: '700' },
  headerInfo: { flex: 1 },
  teacherName: { color: colors.textPrimary, fontSize: ms(18), fontWeight: '700', marginBottom: vs(2) },
  onlineStatusRow: { flexDirection: 'row', alignItems: 'center' },
  onlineDot: { width: hs(6), height: hs(6), borderRadius: hs(3), backgroundColor: colors.present, marginRight: hs(6) },
  onlineText: { color: colors.present, fontSize: ms(12) },
  container: { padding: hs(16), paddingBottom: vs(24) },
  dateChipContainer: { alignItems: 'center', marginBottom: vs(24) },
  dateChip: { backgroundColor: colors.bgLight, paddingHorizontal: hs(16), paddingVertical: vs(6), borderRadius: hs(16), borderWidth: 1, borderColor: colors.border },
  dateChipText: { color: colors.textLight, fontSize: ms(11), fontWeight: '600' },
  msgLeft: { alignSelf: 'flex-start', maxWidth: '75%', marginBottom: vs(16) },
  msgSenderName: { color: colors.primary, fontSize: ms(11), fontWeight: '700', marginBottom: vs(2), marginLeft: hs(4) },
  msgBubbleLeft: { backgroundColor: colors.bgLight, padding: hs(14), borderRadius: hs(16), borderTopLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  msgTextLeft: { color: colors.textPrimary, fontSize: ms(14), lineHeight: 20 },
  msgTimeLeft: { color: colors.textSecond, fontSize: ms(11), marginTop: vs(4), marginLeft: hs(4) },
  msgRight: { alignSelf: 'flex-end', maxWidth: '75%', marginBottom: vs(16) },
  msgBubbleRight: { backgroundColor: colors.primaryDark, padding: hs(14), borderRadius: hs(16), borderTopRightRadius: 4 },
  msgTextRight: { color: '#FFFFFF', fontSize: ms(14), lineHeight: 20 },
  msgTitleText: { fontSize: ms(14), fontWeight: '700', marginBottom: vs(6), color: colors.textPrimary },
  msgTimeRight: { color: colors.textSecond, fontSize: ms(11), marginTop: vs(4), marginRight: hs(4), textAlign: 'right' },
  inputArea: { flexDirection: 'row', alignItems: 'center', padding: hs(16), paddingBottom: Platform.OS === 'ios' ? vs(32) : vs(16), borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bgMain },
  input: { flex: 1, backgroundColor: colors.bgLight, height: vs(48), borderRadius: hs(24), paddingHorizontal: hs(20), color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, marginRight: hs(12) },
  sendBtn: { width: hs(48), height: hs(48), borderRadius: hs(24), backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { color: colors.textPrimary, fontSize: ms(18), fontWeight: 'bold' }
});

export default MessagesScreen;
