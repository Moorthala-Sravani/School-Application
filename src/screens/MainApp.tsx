// src/screens/MainApp.tsx
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import DrawerNavigator from '../navigation/DrawerNavigator';

// Tab Navigator
import StackNavigator from '../navigation/StackNavigator';
import TeacherTabNavigator from '../navigation/TeacherTabNavigator';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

// Drawer Screens
import TermsScreen           from './MainScreenDashboard/TermsScreen';
import PrivacyScreen         from './MainScreenDashboard/PrivacyScreen';
import ChangePasswordScreen  from './MainScreenDashboard/ChangePasswordScreen';

// Dashboard Menu Screens
import UserProfileScreen  from './MainScreenDashboard/UserProfileScreen';
import SchoolWebsiteScreen from './MainScreenDashboard/SchoolWebsiteScreen';
import NoticeBoardScreen  from './MainScreenDashboard/NoticeBoardScreen';
import MessagesScreen     from './MainScreenDashboard/MessagesScreen';
import AttendanceScreen   from './MainScreenDashboard/AttendanceScreen';
import HomeworkScreen     from './MainScreenDashboard/HomeWorkScreen';
import RemarksScreen      from './MainScreenDashboard/RemarksScreen';
import ExamResultScreen   from './MainScreenDashboard/ExamResultScreen';
import PayFeesScreen      from './MainScreenDashboard/PayFeesScreen';
import BusTrackingScreen  from './MainScreenDashboard/BusLocationScreen';
import UniformScreen      from './MainScreenDashboard/UniformScreen';

// Books Screens
import BooksScreen        from './MainScreenDashboard/BooksScreen';
import TeacherBooksScreen from './Teacher/TeacherBooksScreen';
import AdminBooksScreen   from './Admin/AdminBooksScreen';

// Teacher Menu Screens
import TeacherTimetableScreen  from './Teacher/TeacherTimetableScreen';
import TeacherAttendanceScreen from './Teacher/TeacherAttendanceScreen';
import TeacherSalaryScreen     from './Teacher/TeacherSalaryScreen';
import TeacherMarksUploadScreen from './Teacher/TeacherMarksUploadScreen';

const Drawer = createDrawerNavigator();

const MainApp = () => {
  const role = useSelector((state: RootState) => state.auth.role);

  return (
    <Drawer.Navigator
      drawerContent={props => <DrawerNavigator {...props} />}
      screenOptions={{
        headerShown:    false,
        drawerPosition: 'left',
        drawerStyle:    { width: 300 },
      }}
    >
      {/* Main Tabs */}
      <Drawer.Screen name="Tabs"            component={role === 'Teacher' ? TeacherTabNavigator : StackNavigator}      />

      {/* Drawer Menu Screens */}
      <Drawer.Screen name="Terms"           component={TermsScreen}         />
      <Drawer.Screen name="Privacy"         component={PrivacyScreen}       />
    
      <Drawer.Screen name="ChangePassword"  component={ChangePasswordScreen}/>

      {/* Dashboard Menu Screens */}
      <Drawer.Screen name="UserProfile"    component={UserProfileScreen}   />
      <Drawer.Screen name="SchoolWebsite"  component={SchoolWebsiteScreen} />
      <Drawer.Screen name="NoticeBoard"    component={NoticeBoardScreen}   />
      <Drawer.Screen name="Messages"       component={MessagesScreen}      />
      <Drawer.Screen name="ChatScreen"     component={MessagesScreen}      />
      <Drawer.Screen name="Attendance"     component={AttendanceScreen}    />
      <Drawer.Screen name="Homework"       component={HomeworkScreen}      />
      <Drawer.Screen name="Remarks"        component={RemarksScreen}       />
      <Drawer.Screen name="ExamResult"     component={ExamResultScreen}    />
      <Drawer.Screen name="PayFees"        component={PayFeesScreen}       />
      <Drawer.Screen name="BusLocation"    component={BusTrackingScreen}   />
      <Drawer.Screen name="Uniform"        component={UniformScreen}       />

      {/* Books Screens */}
      <Drawer.Screen name="Books"        component={BooksScreen}        />
      <Drawer.Screen name="TeacherBooks" component={TeacherBooksScreen} />
      <Drawer.Screen name="AdminBooks"   component={AdminBooksScreen}   />

      {/* Teacher Menu Screens */}
      <Drawer.Screen name="TeacherTimetable"  component={TeacherTimetableScreen}  />
      <Drawer.Screen name="TeacherAttendance" component={TeacherAttendanceScreen} />
      <Drawer.Screen name="TeacherSalary"     component={TeacherSalaryScreen}     />
      <Drawer.Screen name="TeacherMarksUpload" component={TeacherMarksUploadScreen} />
    </Drawer.Navigator>
  );
};

export default MainApp;
