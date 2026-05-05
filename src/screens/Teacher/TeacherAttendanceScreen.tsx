import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Alert, ActivityIndicator, Image, TextInput, Platform, Modal } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { saveBulkAttendance } from '../../store/slices/attendanceSlice';
import { fetchTeacherProfile } from '../../store/slices/teacherProfileSlice';
import api from '../../config/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { hs, vs, ms } from '../../theme/scale';

const ALL_CLASSES = [
  'Pre-KG', 'LKG', 'UKG',
  '1-A', '1-B', '1-C', '1-D', '1-E', '1-F',
  '2-A', '2-B', '2-C', '2-D', '2-E', '2-F',
  '3-A', '3-B', '3-C', '3-D', '3-E', '3-F',
  '4-A', '4-B', '4-C', '4-D', '4-E', '4-F',
  '5-A', '5-B', '5-C', '5-D', '5-E', '5-F',
  '6-A', '6-B', '6-C', '6-D', '6-E', '6-F',
  '7-A', '7-B', '7-C', '7-D', '7-E', '7-F',
  '8-A', '8-B', '8-C', '8-D', '8-E', '8-F',
  '9-A', '9-B', '9-C', '9-D', '9-E', '9-F',
  '10-A', '10-B', '10-C', '10-D', '10-E', '10-F',
  '11-A', '11-B', '11-C', '11-D', '11-E', '11-F',
  '12-A', '12-B', '12-C', '12-D', '12-E', '12-F'
];

// Helper to reliably get YYYY-MM-DD from a Date object in local time
const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDisplayDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const normalizeClassName = (className: string) => className.replace(/^class\s*/i, '').trim();

const getStudentId = (student: any) => {
  return student.student_id ?? student.id ?? student.user_id;
};

const getParentId = (student: any) => {
  return student.parent_id ?? student.parentId ?? student.user_id ?? student.id;
};

const getStudentName = (student: any) => {
  const fullName = [student.firstname ?? student.firstName, student.lastname ?? student.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    student.name ||
    student.student_name ||
    student.studentName ||
    student.child_name ||
    student.childName ||
    fullName ||
    `Student ${getParentId(student) ?? getStudentId(student) ?? ''}`.trim()
  );
};

const getStudentClass = (student: any) => {
  return student.class_group || student.child_class || student.class || student.className;
};

const sameStudent = (attendance: any, student: any) => {
  const studentId = getStudentId(student);
  const parentId = getParentId(student);
  return [
    attendance.user_id,
    attendance.parent_id,
    attendance.student_id,
    attendance.id,
  ].some(id => id != null && (String(id) === String(parentId) || String(id) === String(studentId)));
};

const getNotificationStudentKey = (notification: any) => {
  return notification.parent_id ?? notification.parentId ?? notification.student_id ?? notification.studentId ?? notification.user_id;
};

const TeacherAttendanceScreen = ({ navigation, route }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { token } = useSelector((state: RootState) => state.auth);
  
  // Data caching to avoid repeated API calls
  const [dataCache, setDataCache] = useState<Map<string, any>>(new Map());
  
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isAttendanceLocked, setIsAttendanceLocked] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [activeRemarkIndex, setActiveRemarkIndex] = useState<number | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [activeLeaveIndex, setActiveLeaveIndex] = useState<number | null>(null);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [leaveNotifications, setLeaveNotifications] = useState<any[]>([]);
  const [classTeacherName, setClassTeacherName] = useState('Not Assigned');
  const [classTeachersMap, setClassTeachersMap] = useState<any>({});
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);
  const [timeoutTimer, setTimeoutTimer] = useState<any>(null);

  useEffect(() => {
    dispatch(fetchTeacherProfile());
    fetchClassTeachersMap();
    
    // Always start with class selection screen, ignore any passed parameters
    setSelectedClass(null);
  }, [dispatch]);

  const fetchClassTeachersMap = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await api.get('/profile/teachers/classes', config);
      setClassTeachersMap(res.data);
    } catch (err) {
      // Error fetching class teachers map
    }
  };

  const fetchClassData = async (className: string, targetDate: Date) => {
    setLoading(true);
    setShowTimeoutMessage(false);
    
    // Clear any existing timeout timer
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
      setTimeoutTimer(null);
    }
    
    // Set timeout to show message after 6 seconds
    const timer = setTimeout(() => {
      setShowTimeoutMessage(true);
    }, 6000);
    setTimeoutTimer(timer);
    
    const normalizedClass = normalizeClassName(className);
    setSelectedClass(normalizedClass);
    
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const targetDateStr = formatDate(targetDate);
      const cacheKey = `${normalizedClass}_${targetDateStr}`;
      
      // Check cache first to avoid unnecessary API calls
      if (dataCache.has(cacheKey)) {
        const cachedData = dataCache.get(cacheKey);
        setStudents(cachedData.students);
        setPendingLeaves(cachedData.pendingLeaves);
        setIsAttendanceLocked(cachedData.isLocked);
        setClassTeacherName(cachedData.classTeacherName);
        setLoading(false);
        if (timeoutTimer) {
          clearTimeout(timeoutTimer);
          setTimeoutTimer(null);
        }
        return;
      }
      
      // Optimized: Fetch only necessary data with date filtering
      const [studentsRes, attendanceRes] = await Promise.all([
        api.get(`/profile/students/${encodeURIComponent(normalizedClass)}`, config),
        api.get(`/attendance?class_group=${encodeURIComponent(normalizedClass)}&date=${targetDateStr}`, config)
      ]);
      
      // Process data more efficiently
      const studentsList = Array.isArray(studentsRes.data)
        ? studentsRes.data
        : (studentsRes.data?.students || studentsRes.data?.data || []);
      
      // If no students found, show a message
      if (studentsList.length === 0) {
        Alert.alert('No Students', `No students found for class ${normalizedClass}. Please check the class name or contact admin.`);
        setLoading(false);
        return;
      }

      // Create attendance lookup map for O(1) access instead of O(n) find operations
      const attendanceMap = new Map();
      const targetAttendance = attendanceRes.data || [];
      
      targetAttendance.forEach((att: any) => {
        attendanceMap.set(att.parent_id, att);
      });

      // Check if attendance is already taken for the specific date
      const hasTakenAttendance = targetAttendance.some((a: any) => {
        const attendanceDate = new Date(a.date).toDateString();
        const targetDateObj = new Date(targetDateStr).toDateString();
        return attendanceDate === targetDateObj && (a.status === 'present' || a.status === 'absent');
      });
      setIsAttendanceLocked(hasTakenAttendance);

      const classTeacherStr = studentsRes.data?.classTeacherName || studentsRes.data?.class_teacher || 'Not Assigned';
      setClassTeacherName(classTeacherStr);

      // Optimized student formatting with map lookup
      const formattedStudents = studentsList.map((s: any, index: number) => {
        const studentId = getStudentId(s);
        const parentId = getParentId(s);
        const studentName = getStudentName(s);
        const att = attendanceMap.get(parentId); // O(1) lookup instead of O(n) find
        
        const formattedStudent = {
          id: studentId,
          parentId,
          studentId,
          att_id: att?.id,
          name: studentName || `Student ${index + 1}`,
          className: getStudentClass(s) || normalizedClass,
          rollNo: `10${index < 9 ? '0' : ''}${index + 1}`,
          status: att?.status || '',
          raw_status: att?.status || '',
          remark: att?.remarks || att?.reason || ''
        };
        
        return formattedStudent;
      });
      
      setStudents(formattedStudents);

      // Filter leaves more efficiently
      const leaves = targetAttendance.filter((r: any) => r.status === 'leave_pending' && r.user_role === 'Parent');
      setPendingLeaves(leaves);
      
      // Cache the processed data for future use
      const cacheData = {
        students: formattedStudents,
        pendingLeaves: leaves,
        isLocked: hasTakenAttendance,
        classTeacherName: classTeacherStr,
        timestamp: Date.now()
      };
      
      // Update cache with new data
      const newCache = new Map(dataCache);
      newCache.set(cacheKey, cacheData);
      setDataCache(newCache);
      
    } catch (err: any) {
      console.error('Error fetching class data:', err);
      
      // Clear timeout timer
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        setTimeoutTimer(null);
      }
      
      // Show user-friendly error messages
      let errorMessage = 'Unable to load class data. Please try again.';
      
      if (err.response?.status === 404) {
        errorMessage = 'Class not found. Please check the class name and try again.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server is experiencing issues. Please try again in a few minutes.';
      } else if (err.code === 'ECONNREFUSED' || err.code === 'NETWORK_ERROR') {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else if (err.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      Alert.alert('Connection Error', errorMessage);
    } finally {
      setLoading(false);
      setShowTimeoutMessage(false);
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        setTimeoutTimer(null);
      }
    }
  };

  useEffect(() => {
    if (selectedClass) {
      fetchClassData(selectedClass, currentDate);
    }
  }, [currentDate]);

  const fetchLeaveNotifications = async () => {
    try {
      const res = await api.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
        params: { type: 'leave_request', unread: true, class_group: selectedClass },
      });
      const list = Array.isArray(res.data) ? res.data : (res.data?.notifications || []);
      const notifications = list.filter((item: any) => String(item.type) === 'leave_request');
      setLeaveNotifications(notifications);
      console.log(`Found ${notifications.length} leave notifications for class ${selectedClass}`);
    } catch (err: any) {
      console.error('Failed to fetch leave notifications:', err);
      // Don't show error to user for notifications, just log it
    }
  };

  useEffect(() => {
    if (!selectedClass) return;

    fetchLeaveNotifications();
    const intervalId = setInterval(fetchLeaveNotifications, 10000);
    return () => clearInterval(intervalId);
  }, [selectedClass, token]);

  const handleRetry = () => {
    setShowTimeoutMessage(false);
    if (selectedClass) {
      fetchClassData(selectedClass, currentDate);
    }
  };

  const [showAbsentModal, setShowAbsentModal] = useState(false);

  const handleLeaveAction = async (status: string) => {
    if (activeLeaveIndex === null) return;
    const student = students[activeLeaveIndex];
    if (!student.att_id) return;
    
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await api.put(`/attendance/parent-leaves/${student.att_id}`, { status }, config);
      
      const newStudents = [...students];
      newStudents[activeLeaveIndex].raw_status = status;
      if (status === 'leave_approved') {
         newStudents[activeLeaveIndex].status = 'leave_approved';
      } else if (status === 'leave_rejected') {
         newStudents[activeLeaveIndex].status = 'absent';
      }
      setStudents(newStudents);
      setShowLeaveModal(false);
      setActiveLeaveIndex(null);
      Alert.alert('Success', `Leave request ${status === 'leave_approved' ? 'approved' : 'rejected'}`);
    } catch (err: any) {
      // Failed to update leave status
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = (index: number, newStatus: string) => {
    if (isAttendanceLocked) return;
    
    const newStudents = [...students];
    newStudents[index].status = newStatus;
    if (newStatus === 'present') newStudents[index].remark = '';
    setStudents(newStudents);
    
    if (newStatus === 'absent') {
      setActiveRemarkIndex(index);
      setShowAbsentModal(true);
    }
  };

  const handleSelectRemark = (message: string) => {
    if (activeRemarkIndex !== null) {
      const newStudents = [...students];
      newStudents[activeRemarkIndex].remark = message;
      setStudents(newStudents);
    }
    setShowAbsentModal(false);
    setActiveRemarkIndex(null);
  };

  const getStudentLeaveNotification = (student: any) => {
    return leaveNotifications.find(notification => {
      const key = getNotificationStudentKey(notification);
      return key != null && (
        String(key) === String(student.parentId) ||
        String(key) === String(student.studentId) ||
        String(key) === String(student.id)
      );
    });
  };

  const handleOpenLeaveNotification = async (notification: any, student: any) => {
    try {
      await api.patch(`/notifications/${notification.id}/read`, undefined, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeaveNotifications(prev => prev.filter(item => item.id !== notification.id));
    } catch (err: any) {
      // Failed to mark notification read
    }

    Alert.alert(
      'Leave Request',
      `${student.name}\n${notification.leave_type || notification.leaveType || 'Leave'}\n${notification.from_date || notification.fromDate || notification.date || ''} to ${notification.to_date || notification.toDate || notification.date || ''}`,
    );
  };

  
  const updateRemark = (index: number, text: string) => {
    if (isAttendanceLocked) return;
    const newStudents = [...students];
    newStudents[index].remark = text;
    setStudents(newStudents);
  };

  const handleSave = async () => {
    if (!selectedClass) return;

    // Check if any student is unmarked
    const unmarked = students.filter(s => !s.status || s.status === 'leave_pending' || s.status === 'leave');
    if (unmarked.length > 0) {
      Alert.alert('Incomplete Attendance', 'Please approve/reject pending leaves and mark all students as Present or Absent before saving.');
      return;
    }

    // Enforce mandatory remarks for absent students
    const absentWithoutRemark = students.filter(s => s.status === 'absent' && !s.remark);
    if (absentWithoutRemark.length > 0) {
      Alert.alert('Missing Remarks', 'It is mandatory to select a remark for all absent students.');
      return;
    }

    setSaving(true);
    try {
      const targetDateStr = formatDate(currentDate);
      const records = students.map(s => ({ parent_id: s.id, status: s.status, remarks: s.remark }));
      await dispatch(saveBulkAttendance({ date: targetDateStr, class_group: selectedClass, records })).unwrap();
      Alert.alert('Success', `Attendance saved successfully for ${targetDateStr}`);
      
      // Clear cache for this class/date to force refresh on next load
      const cacheKey = `${selectedClass}_${targetDateStr}`;
      const newCache = new Map(dataCache);
      newCache.delete(cacheKey);
      setDataCache(newCache);
      
      setSelectedClass(null); // Go back to class list
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      Alert.alert('Error', 'Failed to save attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!selectedClass) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#2980B9" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Select Class</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={[styles.dateSelector, { justifyContent: 'center' }]}>
          <Text style={styles.dateCenterText}>{getDisplayDate(currentDate)}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.classListContainer}>
          <Text style={styles.sectionTitle}>All Classes</Text>
          {ALL_CLASSES.map(c => (
            <TouchableOpacity 
              key={c} 
              style={styles.classListItem}
              onPress={() => fetchClassData(c, currentDate)}
            >
              <View>
                <Text style={styles.classListText}>Class {c}</Text>
                <Text style={{fontSize: ms(12), color: '#7F8C8D', marginTop: vs(2), fontWeight: '500'}}>
                  Class Teacher: {classTeachersMap[c] || 'Not Assigned'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }
  const totalCount = students.length;
  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.filter(s => s.status === 'absent').length;

  const presentPercentage = totalCount === 0 ? 0 : Math.round((presentCount / totalCount) * 100);
  const absentPercentage = totalCount === 0 ? 0 : Math.round((absentCount / totalCount) * 100);

  const activeStudent = activeRemarkIndex !== null ? students[activeRemarkIndex] : null;
  const activeStudentName = activeStudent ? activeStudent.name : 'Your child';
  const dynamicMessages = activeStudent?.status === 'present' ? [
    `${activeStudentName} arrived late to class today.`,
    `${activeStudentName} is not paying attention in class.`,
    `Please check ${activeStudentName}'s homework diary.`
  ] : [
    `${activeStudentName} is absent today without prior permission.`,
    `${activeStudentName} is absent. Please submit a leave request.`,
    `${activeStudentName} is on an approved leave today.`,
    `Leave request for ${activeStudentName} was rejected. Marked absent.`
  ];

  
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#2980B9" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSelectedClass(null)} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Class {selectedClass}</Text>
        {!isAttendanceLocked ? (
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.saveBtn}>Save</Text>}
          </TouchableOpacity>
        ) : (
          <View style={{width: 40}} />
        )}
      </View>

      <View style={[styles.dateSelector, { justifyContent: 'center' }]}>
        <Text style={styles.dateCenterText}>{getDisplayDate(currentDate)}</Text>
      </View>

      {isAttendanceLocked && (
        <View style={styles.lockedBadge}>
          <Text style={styles.lockedText}>🔒 Attendance already submitted for today</Text>
        </View>
      )}

      {classTeacherName !== 'Not Assigned' && (
        <View style={styles.classTeacherBadge}>
          <Text style={styles.classTeacherText}>⭐ Class Teacher: {classTeacherName}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2980B9" style={{marginTop: 50}} />
            {showTimeoutMessage && (
              <View style={styles.timeoutMessage}>
                <Text style={styles.timeoutText}>This is taking longer than expected. Please check your connection and try again.</Text>
                <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Students ({totalCount})</Text>
            {students.map((student, index) => {
              const leaveNotification = getStudentLeaveNotification(student);
              return (
              <View key={student.id} style={styles.studentCard}>
                <View style={styles.studentRow}>
                  <View style={styles.studentAvatar}>
                    <Image 
                      source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random&color=fff&size=100` }} 
                      style={{ width: '100%', height: '100%' }} 
                    />
                  </View>
                  <View style={styles.studentInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.studentName}>{student.name}</Text>
                      {leaveNotification && (
                        <TouchableOpacity style={styles.leaveBadge} onPress={() => handleOpenLeaveNotification(leaveNotification, student)}>
                          <Text style={styles.leaveBadgeText}>Bell Leave Req</Text>
                        </TouchableOpacity>
                      )}
                      {student.raw_status === 'leave_pending' && (
                        <TouchableOpacity style={styles.leaveBadge} onPress={() => { setActiveLeaveIndex(index); setShowLeaveModal(true); }}>
                          <Text style={styles.leaveBadgeText}>🔔 Leave Req</Text>
                        </TouchableOpacity>
                      )}
                      {student.raw_status === 'leave_approved' && (
                        <View style={[styles.leaveBadge, {backgroundColor: '#E8F8F5', borderColor: '#2ECC71'}]}>
                          <Text style={[styles.leaveBadgeText, {color: '#27AE60'}]}>✓ Approved</Text>
                        </View>
                      )}
                      {student.raw_status === 'leave_rejected' && (
                        <View style={[styles.leaveBadge, {backgroundColor: '#FDEDEC', borderColor: '#E74C3C'}]}>
                          <Text style={[styles.leaveBadgeText, {color: '#C0392B'}]}>✕ Rejected</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.studentRoll}>Roll No: {student.rollNo}</Text>
                  </View>
                  
                  <View style={styles.actionsRow}>
                    <TouchableOpacity 
                      style={[styles.iconBtn, student.status === 'present' && styles.iconBtnPresent]}
                      onPress={() => updateStatus(index, 'present')}
                    >
                      <Text style={[styles.iconText, student.status === 'present' && {color: '#FFF'}]}>✓</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.iconBtn, student.status === 'absent' && styles.iconBtnAbsent]}
                      onPress={() => updateStatus(index, 'absent')}
                    >
                      <Text style={[styles.iconText, student.status === 'absent' && {color: '#FFF'}]}>✕</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.remarkBtnContainer}>
                    <TouchableOpacity 
                      style={[styles.iconBtn, student.status === 'absent' && styles.iconBtnRemark]}
                      onPress={() => {
                        if (isAttendanceLocked) return;
                        if (!student.status || student.status === 'leave') {
                          Alert.alert('Status Required', 'Please mark the student as Present or Absent before adding a remark.');
                          return;
                        }
                        setActiveRemarkIndex(index);
                        setShowAbsentModal(true);
                      }}
                    >
                      <Text style={[styles.iconText, student.status === 'absent' && {color: '#FFF'}]}>💬</Text>
                    </TouchableOpacity>
                    {getStudentLeaveNotification(student) && (
                      <View style={styles.notificationBadge}>
                        <Text style={styles.badgeText}>!</Text>
                      </View>
                    )}
                    </View>
                                      </View>
                </View>
              </View>
              );
            })}
            <View style={{height: 80}} />
          </>
        )}
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <Text style={styles.bottomText}>Total: <Text style={{fontWeight:'800'}}>{totalCount}</Text></Text>
        <Text style={[styles.bottomText, {color: colors.present}]}>Present: <Text style={{fontWeight:'800'}}>{presentCount} ({presentPercentage}%)</Text></Text>
        <Text style={[styles.bottomText, {color: colors.absent}]}>Absent: <Text style={{fontWeight:'800'}}>{absentCount} ({absentPercentage}%)</Text></Text>
      </View>

      <Modal visible={showLeaveModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => { setShowLeaveModal(false); setActiveLeaveIndex(null); }}>
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            <View style={{alignItems: 'center', marginBottom: vs(16)}}>
               <Text style={{fontSize: ms(40)}}>✉️</Text>
               <Text style={styles.modalTitle}>Leave Request</Text>
            </View>
            {activeLeaveIndex !== null && (
               <View style={{backgroundColor: '#FDF2E9', padding: hs(16), borderRadius: hs(12), borderWidth: 1, borderColor: '#F5CBA7', marginBottom: vs(24)}}>
                 <Text style={{fontSize: ms(14), color: '#D35400', fontWeight: '700', marginBottom: vs(4)}}>Reason provided by Parent:</Text>
                 <Text style={{fontSize: ms(15), color: '#2C3E50', fontStyle: 'italic'}}>"{students[activeLeaveIndex]?.remark}"</Text>
               </View>
            )}
            <View style={{flexDirection: 'row', gap: hs(12)}}>
               <TouchableOpacity style={[styles.actionBtn, {flex: 1, backgroundColor: '#2ECC71'}]} onPress={() => handleLeaveAction('leave_approved')}>
                 <Text style={{color: '#FFF', fontWeight: '700', fontSize: ms(15), textAlign: 'center'}}>Approve</Text>
               </TouchableOpacity>
               <TouchableOpacity style={[styles.actionBtn, {flex: 1, backgroundColor: '#E74C3C'}]} onPress={() => handleLeaveAction('leave_rejected')}>
                 <Text style={{color: '#FFF', fontWeight: '700', fontSize: ms(15), textAlign: 'center'}}>Reject</Text>
               </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowLeaveModal(false); setActiveLeaveIndex(null); }}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showAbsentModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => { setShowAbsentModal(false); setActiveRemarkIndex(null); }}>
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Message for Parent</Text>
            {dynamicMessages.map((msg, idx) => (
              <TouchableOpacity key={idx} style={styles.reasonBtn} onPress={() => handleSelectRemark(msg)}>
                <Text style={styles.reasonBtnText}>{msg}</Text>
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgMain },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#2980B9', paddingHorizontal: hs(16), paddingVertical: vs(12) },
  backBtn: { padding: 6 },
  backIcon: { fontSize: 34, color: '#FFF', lineHeight: 34, marginTop: -4 },
  title: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  saveBtn: { fontSize: ms(16), color: '#FFF', fontWeight: '600' },
  
  dateSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A5276', paddingHorizontal: hs(16), paddingVertical: vs(12) },
  dateCenterText: { color: '#FFF', fontSize: ms(15), fontWeight: '700' },
  
  lockedBadge: { backgroundColor: '#FADBD8', paddingVertical: vs(8), paddingHorizontal: hs(16), alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: '#E74C3C' },
  lockedText: { color: '#C0392B', fontSize: ms(14), fontWeight: '700' },

  classTeacherBadge: { backgroundColor: '#F9E79F', paddingVertical: vs(6), paddingHorizontal: hs(16), alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: '#F1C40F' },
  classTeacherText: { color: '#B7950B', fontSize: ms(14), fontWeight: '700' },

  classListContainer: { padding: hs(16), paddingBottom: vs(40) },
  classListItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', padding: hs(16), borderRadius: hs(12), marginBottom: vs(10), elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, borderWidth: 1, borderColor: colors.border },
  classListText: { fontSize: ms(16), fontWeight: '600', color: colors.textPrimary },
  classListArrow: { fontSize: ms(20), color: colors.textSecond },

  container: { padding: hs(16) },
  sectionTitle: { fontSize: ms(16), fontWeight: '700', color: colors.textPrimary, marginBottom: vs(12) },
  
  studentCard: { backgroundColor: colors.bgLight, padding: hs(12), borderRadius: hs(12), marginBottom: vs(12), elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, borderWidth: 1, borderColor: colors.border },
  studentRow: { flexDirection: 'row', alignItems: 'center' },
  studentAvatar: { width: hs(40), height: hs(40), borderRadius: hs(20), backgroundColor: '#EBF5FB', alignItems: 'center', justifyContent: 'center', marginRight: hs(12), overflow: 'hidden' },
  studentInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  studentName: { fontSize: ms(15), fontWeight: '600', color: colors.textPrimary, marginRight: hs(8) },
  leaveBadge: { backgroundColor: '#FDEDEC', borderWidth: 1, borderColor: '#F5B7B1', paddingHorizontal: hs(8), paddingVertical: vs(2), borderRadius: hs(12), marginTop: 2 },
  leaveBadgeText: { fontSize: ms(10), fontWeight: '700', color: '#C0392B' },
  studentRoll: { fontSize: ms(12), color: colors.textSecond, marginTop: vs(2) },
  
  actionsRow: { flexDirection: 'row', gap: hs(6) },
  iconBtn: { width: hs(36), height: hs(36), borderRadius: hs(18), backgroundColor: '#F0F3F4', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  iconBtnPresent: { backgroundColor: '#2ECC71', borderColor: '#2ECC71' },
  iconBtnAbsent: { backgroundColor: '#E74C3C', borderColor: '#E74C3C' },
  iconBtnRemark: { backgroundColor: '#3498DB', borderColor: '#3498DB' },
  iconText: { fontSize: ms(16), color: '#555' },

  remarkInput: { marginTop: vs(10), backgroundColor: '#FFF', borderWidth: 1, borderColor: colors.border, borderRadius: hs(8), paddingHorizontal: hs(12), paddingVertical: vs(8), fontSize: ms(14), color: colors.textPrimary },

  leaveReasonContainer: { marginTop: vs(8), backgroundColor: '#FDF2E9', padding: hs(10), borderRadius: hs(8), borderWidth: 1, borderColor: '#F5CBA7' },
  leaveReasonLabel: { fontSize: ms(12), fontWeight: '700', color: '#D35400', marginBottom: vs(2) },
  leaveReasonText: { fontSize: ms(13), color: '#E67E22' },

  absentReasonContainer: { marginTop: vs(8), backgroundColor: '#FDEDEC', padding: hs(10), borderRadius: hs(8), borderWidth: 1, borderColor: '#F5B7B1' },
  absentReasonLabel: { fontSize: ms(12), fontWeight: '700', color: '#C0392B', marginBottom: vs(2) },
  absentReasonText: { fontSize: ms(13), color: '#E74C3C' },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: vs(16), paddingBottom: vs(24), borderTopWidth: 1, borderTopColor: colors.border, elevation: 10, shadowColor: '#000', shadowOffset: {width:0, height:-2}, shadowOpacity: 0.1, shadowRadius: 4 },
  bottomText: { fontSize: ms(14), fontWeight: '600', color: colors.textPrimary },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: hs(20) },
  modalCard: { backgroundColor: '#FFF', borderRadius: hs(16), padding: hs(20), width: '100%', elevation: 5 },
  modalTitle: { fontSize: ms(18), fontWeight: '700', color: colors.textPrimary, marginBottom: vs(16), textAlign: 'center' },
  actionBtn: { paddingVertical: vs(14), borderRadius: hs(8), marginTop: vs(10) },
  reasonBtn: { paddingVertical: vs(14), borderBottomWidth: 1, borderBottomColor: colors.border },
  reasonBtnText: { fontSize: ms(15), color: '#2980B9', textAlign: 'center', fontWeight: '500' },
  cancelBtn: { marginTop: vs(16), paddingVertical: vs(14), backgroundColor: '#F2F4F4', borderRadius: hs(8) },
  cancelBtnText: { fontSize: ms(15), color: '#7F8C8D', textAlign: 'center', fontWeight: '600' },
  
  remarkBtnContainer: { position: 'relative' },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF'
  },
  badgeText: {
    color: '#FFF',
    fontSize: ms(12),
    fontWeight: 'bold',
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  timeoutMessage: {
    marginTop: vs(20),
    backgroundColor: '#FFF',
    padding: hs(20),
    borderRadius: hs(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E74C3C',
    marginHorizontal: hs(20),
  },
  timeoutText: {
    fontSize: ms(14),
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: vs(16),
    lineHeight: vs(20),
  },
  retryButton: {
    backgroundColor: '#2980B9',
    paddingHorizontal: hs(24),
    paddingVertical: vs(12),
    borderRadius: hs(8),
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: ms(14),
    fontWeight: '600',
  },

  });

export default TeacherAttendanceScreen;
