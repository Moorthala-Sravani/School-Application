// src/navigation/BottomTabNavigator.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/DashboardScreen';
import StudentScreen   from '../screens/StudentScreen';
import TeacherScreen   from '../screens/TeacherScreen';
import ParentScreen    from '../screens/ParentScreen';

const Tab = createBottomTabNavigator();

// ── Tab Items Config ────────────────────────────────────
const TAB_ITEMS = [
  { name: 'Dashboard', label: 'Dashboard', icon: '🏠' },
  { name: 'Student',   label: 'Student',   icon: '🎒' },
  { name: 'Teacher',   label: 'Teacher',   icon: '👩‍🏫' },
  { name: 'Parent',    label: 'Parent',    icon: '👨‍👩‍👧' },
];

// ── Custom Tab Bar ──────────────────────────────────────
const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const tab = TAB_ITEMS.find(t => t.name === route.name);

        const onPress = () => {
          const event = navigation.emit({
            type:   'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            {/* Active indicator line on top */}
            <View style={[
              styles.activeBar,
              isFocused && styles.activeBarVisible,
            ]} />

            {/* Icon */}
            <View style={[
              styles.iconContainer,
              isFocused && styles.iconContainerActive,
            ]}>
              <Text style={styles.icon}>{tab?.icon}</Text>
            </View>

            {/* Label */}
            <Text style={[
              styles.label,
              isFocused && styles.labelActive,
            ]}>
              {tab?.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ── Bottom Tab Navigator ────────────────────────────────
const BottomTabNavigator = () => (
  <Tab.Navigator
    tabBar={props => <CustomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Student"   component={StudentScreen}   />
    <Tab.Screen name="Teacher"   component={TeacherScreen}   />
    <Tab.Screen name="Parent"    component={ParentScreen}    />
  </Tab.Navigator>
);

// ── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBar: {
    flexDirection:   'row',
    backgroundColor: '#8B2500',   // dark rust
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
  activeBar: {
    position:        'absolute',
    top:             0,
    width:           '60%',
    height:          3,
    borderRadius:    2,
    backgroundColor: 'transparent',
  },
  activeBarVisible: {
    backgroundColor: '#E67E22',   // orange accent line on top
  },
  iconContainer: {
    width:           40,
    height:          40,
    borderRadius:    20,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    2,
  },
  iconContainerActive: {
    backgroundColor: 'rgba(230, 126, 34, 0.2)',  // subtle orange glow
  },
  icon: {
    fontSize: 22,
  },
  label: {
    fontSize:   10,
    fontWeight: '500',
    color:      '#F4A58A',   // inactive — soft peach
  },
  labelActive: {
    color:      '#FFFFFF',   // active — white
    fontWeight: '700',
  },
});

export default BottomTabNavigator;