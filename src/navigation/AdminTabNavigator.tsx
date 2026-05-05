import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';

import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';
import MessagesScreen from '../screens/MainScreenDashboard/MessagesScreen';
import UserProfileScreen from '../screens/MainScreenDashboard/UserProfileScreen';

const Tab = createBottomTabNavigator();

const TAB_ITEMS = [
  { name: 'Home',       icon: '🏠' },
  { name: 'Messages',   icon: '💬' },
  { name: 'Profile',    icon: '👤' },
];

const CustomTabBar = ({ state, navigation }: BottomTabBarProps) => (
  <View style={styles.tabBar}>
    {state.routes.map((route, index) => {
      const isFocused = state.index === index;
      const tab = TAB_ITEMS.find(t => t.name === route.name);

      return (
        <TouchableOpacity
          key={route.key}
          style={styles.tabItem}
          activeOpacity={0.7}
          onPress={() => navigation.navigate(route.name)}
        >
          {/* Top active line */}
          <View style={[
            styles.activeLine,
            isFocused && styles.activeLineVisible,
          ]} />

          {/* Icon */}
          <View style={[
            styles.iconWrap,
            isFocused && styles.iconWrapActive,
          ]}>
            <Text style={styles.icon}>{tab?.icon}</Text>
          </View>
        </TouchableOpacity>
      );
    })}
  </View>
);

const AdminTabNavigator = () => (
  <Tab.Navigator
    tabBar={props => <CustomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="Home"       component={AdminDashboardScreen} />
    <Tab.Screen name="Messages"   component={MessagesScreen} />
    <Tab.Screen name="Profile"    component={UserProfileScreen} />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  tabBar: {
    flexDirection:   'row',
    backgroundColor: '#8B2500', // Admin distinct color
    height:          Platform.OS === 'ios' ? 80 : 65,
    paddingBottom:   Platform.OS === 'ios' ? 20 : 8,
    paddingTop:      8,
    elevation:       12,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: -3 },
    shadowOpacity:   0.15,
    shadowRadius:    6,
  },
  tabItem: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  activeLine: {
    position:        'absolute',
    top:             0,
    width:           '50%',
    height:          3,
    borderRadius:    2,
    backgroundColor: 'transparent',
  },
  activeLineVisible: {
    backgroundColor: '#E67E22',
  },
  iconWrap: {
    width:           44,
    height:          44,
    borderRadius:    22,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    2,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(230, 126, 34, 0.2)',
  },
  icon: {
    fontSize: 24,
  },
});

export default AdminTabNavigator;
