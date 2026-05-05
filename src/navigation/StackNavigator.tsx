import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

// Import Screens
import DashboardScreen from '../screens/DashboardScreen';
import StudentScreen from '../screens/StudentScreen';
import TeacherScreen from '../screens/TeacherScreen';
import ParentScreen from '../screens/ParentScreen';
import ParentServicesScreen from '../screens/ParentServicesScreen';
import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';
import AdminPaymentsScreen from '../screens/Admin/AdminPaymentsScreen';
import AdminBillingScreen from '../screens/Admin/AdminBillingScreen';
import AdminBroadcastScreen from '../screens/Admin/AdminBroadcastScreen';
import AdminUniformScreen from '../screens/Admin/AdminUniformScreen';
import AdminSportsScreen from '../screens/Admin/AdminSportsScreen';
import AdminActivitiesScreen from '../screens/Admin/AdminActivitiesScreen';
import AdminProfileScreen from '../screens/Admin/AdminProfileScreen';
import TeacherSalaryScreen from '../screens/Teacher/TeacherSalaryScreen';
import TeacherTimetableScreen from '../screens/Teacher/TeacherTimetableScreen';
import TeacherMarksUploadScreen from '../screens/Teacher/TeacherMarksUploadScreen';
import MessagesScreen from '../screens/MainScreenDashboard/MessagesScreen';
import PayFeesScreen from '../screens/MainScreenDashboard/PayFeesScreen';
import UniformScreen from '../screens/MainScreenDashboard/UniformScreen';
import BusLocationScreen from '../screens/MainScreenDashboard/BusLocationScreen';
import AttendanceScreen from '../screens/MainScreenDashboard/AttendanceScreen';
import HomeWorkScreen from '../screens/MainScreenDashboard/HomeWorkScreen';
import RemarksScreen from '../screens/MainScreenDashboard/RemarksScreen';
import ExamResultScreen from '../screens/MainScreenDashboard/ExamResultScreen';
import NoticeBoardScreen from '../screens/MainScreenDashboard/NoticeBoardScreen';
import UserProfileScreen from '../screens/MainScreenDashboard/UserProfileScreen';
import TeacherApproveLeaveScreen from '../screens/Teacher/TeacherApproveLeaveScreen';
import TeacherAttendanceScreen from '../screens/Teacher/TeacherAttendanceScreen';
import TeacherLeaveScreen from '../screens/Teacher/TeacherLeaveScreen';
import BooksScreen from '../screens/MainScreenDashboard/BooksScreen';
import TeacherBooksScreen from '../screens/Teacher/TeacherBooksScreen';
import AdminBooksScreen from '../screens/Admin/AdminBooksScreen';
import AdminConfiguratorScreen from '../screens/Admin/AdminConfiguratorScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const MenuPlaceholderScreen = () => <View />;

const PARENT_TABS = [
  { name: 'Home', label: 'Dashboard', icon: '🏠' },
  { name: 'Student', label: 'Student', icon: '🎒' },
  { name: 'Services', label: 'Services', icon: '🗂️' },
  { name: 'ClassComms', label: 'Teacher', icon: '👩‍🏫' },
];

const TEACHER_TABS = [
  { name: 'Home', label: 'Dashboard', icon: '🏠' },
  { name: 'ClassComms', label: 'Parents', icon: '👨‍👩‍👧' },
  { name: 'Profile', label: 'My Profile', icon: '👩‍🏫' },
];

const ADMIN_TABS = [
  { name: 'Menu', label: 'Menu', icon: '☰' },
  { name: 'Home', label: 'Admin', icon: '🏢' },
  { name: 'Sports', label: 'Sports', icon: '🏅' },
  { name: 'Activities', label: 'Activities', icon: '🎭' },
  { name: 'Broadcast', label: 'Announce', icon: '📢' },
  { name: 'Profile', label: 'Profile', icon: '👤' },
];

const CustomTabBar = ({ state, navigation, tabs }: BottomTabBarProps & { tabs: any[] }) => (
  <View style={styles.tabBar}>
    {state.routes.map((route, index) => {
      const isFocused = state.index === index;
      const tab = tabs.find(t => t.name === route.name);

      return (
        <TouchableOpacity
          key={route.key}
          style={styles.tabItem}
          activeOpacity={0.7}
          onPress={() => {
            if (route.name === 'Menu') {
              (navigation.getParent() as any)?.openDrawer();
              return;
            }
            navigation.navigate(route.name);
          }}
        >
          <View style={[styles.activeLine, isFocused && styles.activeLineVisible]} />
          <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
            <Text style={styles.icon}>{tab?.icon}</Text>
          </View>
          <Text style={[styles.label, isFocused && styles.labelActive]}>{tab?.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const ParentTabs = () => (
  <Tab.Navigator tabBar={props => <CustomTabBar {...props} tabs={PARENT_TABS} />} screenOptions={{ headerShown: false }}>
    <Tab.Screen name="Home" component={DashboardScreen} />
    <Tab.Screen name="Student" component={StudentScreen} />
    <Tab.Screen name="Services" component={ParentServicesScreen} />
    <Tab.Screen name="ClassComms" component={MessagesScreen} />
  </Tab.Navigator>
);

const TeacherTabs = () => (
  <Tab.Navigator tabBar={props => <CustomTabBar {...props} tabs={TEACHER_TABS} />} screenOptions={{ headerShown: false }}>
    <Tab.Screen name="Home" component={DashboardScreen} />
    <Tab.Screen name="ClassComms" component={MessagesScreen} />
    <Tab.Screen name="Profile" component={TeacherScreen} />
  </Tab.Navigator>
);

const AdminTabs = () => (
  <Tab.Navigator tabBar={props => <CustomTabBar {...props} tabs={ADMIN_TABS} />} screenOptions={{ headerShown: false }}>
    <Tab.Screen name="Menu" component={MenuPlaceholderScreen} />
    <Tab.Screen name="Home" component={AdminDashboardScreen} />
    <Tab.Screen name="Sports" component={AdminSportsScreen} />
    <Tab.Screen name="Activities" component={AdminActivitiesScreen} />
    <Tab.Screen name="Broadcast" component={AdminBroadcastScreen} />
    <Tab.Screen name="Profile" component={AdminProfileScreen} />
  </Tab.Navigator>
);

const StackNavigator = () => {
  const { role } = useSelector((state: RootState) => state.auth);

  let MainComponent = ParentTabs;
  if (role === 'Teacher') MainComponent = TeacherTabs;
  else if (role === 'Admin') MainComponent = AdminTabs;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainComponent} />
      <Stack.Screen name="TeacherSalary" component={TeacherSalaryScreen} />
      <Stack.Screen name="TeacherTimetable" component={TeacherTimetableScreen} />
      <Stack.Screen name="TeacherMarksUpload" component={TeacherMarksUploadScreen} />
      <Stack.Screen name="Messages" component={MessagesScreen} />
      <Stack.Screen name="ChatScreen" component={MessagesScreen} />
      <Stack.Screen name="PayFees" component={PayFeesScreen} />
      <Stack.Screen name="Uniform" component={UniformScreen} />
      <Stack.Screen name="BusLocation" component={BusLocationScreen} />
      <Stack.Screen name="Attendance" component={AttendanceScreen} />
      <Stack.Screen name="Homework" component={HomeWorkScreen} />
      <Stack.Screen name="Remarks" component={RemarksScreen} />
      <Stack.Screen name="ExamResult" component={ExamResultScreen} />
      <Stack.Screen name="NoticeBoard" component={NoticeBoardScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="AdminPayments" component={AdminPaymentsScreen} />
      <Stack.Screen name="AdminBilling" component={AdminBillingScreen} />
      <Stack.Screen name="AdminUniform" component={AdminUniformScreen} />
      <Stack.Screen name="TeacherApproveLeave" component={TeacherApproveLeaveScreen} />
      <Stack.Screen name="TeacherAttendance" component={TeacherAttendanceScreen} />
      <Stack.Screen name="TeacherLeave" component={TeacherLeaveScreen} />
      <Stack.Screen name="Books" component={BooksScreen} />
      <Stack.Screen name="TeacherBooks" component={TeacherBooksScreen} />
      <Stack.Screen name="AdminBooks" component={AdminBooksScreen} />
      <Stack.Screen name="AdminConfigurator" component={AdminConfiguratorScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#8B2500',
    height: Platform.OS === 'ios' ? 80 : 65,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  activeLine: { position: 'absolute', top: 0, width: '50%', height: 3, borderRadius: 2, backgroundColor: 'transparent' },
  activeLineVisible: { backgroundColor: '#E67E22' },
  iconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  iconWrapActive: { backgroundColor: 'rgba(230, 126, 34, 0.2)' },
  icon: { fontSize: 20 },
  label: { fontSize: 10, fontWeight: '500', color: '#F4A58A' },
  labelActive: { color: '#FFFFFF', fontWeight: '700' },
});

export default StackNavigator;
