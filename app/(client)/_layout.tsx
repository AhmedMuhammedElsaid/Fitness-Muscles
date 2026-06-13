import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui';

export default function ClientTabLayout() {
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
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('client.tabs.home'),
          tabBarIcon: ({ focused, color }) => (
            <Icon name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="training"
        options={{
          title: t('client.tabs.training'),
          tabBarIcon: ({ focused, color }) => (
            <Icon name={focused ? 'barbell' : 'barbell-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t('client.tabs.tips'),
          tabBarIcon: ({ focused, color }) => (
            <Icon name={focused ? 'bulb' : 'bulb-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="meal-plan"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('client.tabs.profile'),
          tabBarIcon: ({ focused, color }) => (
            <Icon name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="workout/[planDayId]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
