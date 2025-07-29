import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FeedScreen from '../screens/FeedScreen';
import BookingsScreen from '../screens/BookingsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

// Custom tab bar icons
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  let iconName: keyof typeof Ionicons.glyphMap;
  
           switch (name) {
           case 'Feed':
             iconName = 'restaurant';
             break;
           case 'Bookings':
             iconName = 'calendar';
             break;
           case 'Profile':
             iconName = 'person';
             break;
           default:
             iconName = 'restaurant';
         }

  return (
    <View style={styles.iconContainer}>
      <Ionicons 
        name={iconName} 
        size={26} 
        color={focused ? '#007AFF' : '#8E8E93'} 
      />
      <Text 
        style={[styles.iconLabel, focused && styles.iconLabelFocused]}
        numberOfLines={1}
      >
        {name}
      </Text>
    </View>
  );
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <View style={styles.tabBarBackground} />
        ),
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarShowLabel: false,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="Feed" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="Bookings" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 75,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    paddingTop: 8,
    paddingHorizontal: 5,
  },
  tabBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  tabBarItem: {
    paddingVertical: 8,
    flex: 1,
    paddingHorizontal: 8,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconLabel: {
    fontSize: 9,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 12,
  },
  iconLabelFocused: {
    color: '#007AFF',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 12,
  },
}); 