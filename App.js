import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getCurrentUser } from './src/services/ApiService';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import IntakeScreen from './src/screens/IntakeScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await getCurrentUser();
      setUser(saved);
      setReady(true);
    })();
  }, []);

  if (!ready) return null;
  if (!user) return <LoginScreen onLoginSuccess={setUser} />;

  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#0F766E' }}>
        <Tab.Screen name="Beranda">
          {() => <HomeScreen user={user} />}
        </Tab.Screen>
        <Tab.Screen name="Catat">
          {() => <IntakeScreen user={user} />}
        </Tab.Screen>
        <Tab.Screen name="Profil">
          {() => <ProfileScreen user={user} onLogout={() => setUser(null)} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}