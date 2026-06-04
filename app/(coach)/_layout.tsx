import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View className="items-center justify-center pt-1">
      <Text className={`text-base ${focused ? 'opacity-100' : 'opacity-50'}`}>{emoji}</Text>
    </View>
  );
}

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
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: t('coach.tabs.clients', 'Clients'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: t('coach.tabs.library', 'Library'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="📚" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: t('coach.tabs.workouts', 'Workouts'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="💪" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: t('coach.tabs.plans', 'Plans'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="tips"
        options={{
          title: t('coach.tabs.tips', 'Tips'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="💡" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('coach.tabs.profile', 'Profile'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
