import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui';

export default function CoachTabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1A1A1A',
          borderTopColor: '#3A3A3A',
          height: 76,
          paddingBottom: 16,
        },
        tabBarActiveTintColor: '#E8DEB5',
        tabBarInactiveTintColor: '#666666',
        tabBarLabelStyle: { fontSize: 10 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('coach.tabs.home', 'Home'),
          tabBarIcon: ({ focused, color }) => (
            <Icon name={focused ? 'stats-chart' : 'stats-chart-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: t('coach.tabs.clients', 'Clients'),
          tabBarIcon: ({ focused, color }) => (
            <Icon name={focused ? 'people' : 'people-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="programs"
        options={{
          title: t('coach.tabs.programs', 'Programs'),
          tabBarIcon: ({ focused, color }) => (
            <Icon name={focused ? 'albums' : 'albums-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tips"
        options={{
          title: t('coach.tabs.tips', 'Tips'),
          tabBarIcon: ({ focused, color }) => (
            <Icon name={focused ? 'bulb' : 'bulb-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('coach.tabs.profile', 'Profile'),
          tabBarIcon: ({ focused, color }) => (
            <Icon name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
