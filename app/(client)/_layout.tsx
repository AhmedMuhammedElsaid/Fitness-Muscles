import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <View className="items-center justify-center pt-2">
      <Text className={`text-xs font-sans ${focused ? 'text-primary' : 'text-text-muted'}`}>
        {name}
      </Text>
    </View>
  );
}

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
          tabBarIcon: ({ focused }) => <TabIcon name="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="training"
        options={{
          title: t('client.tabs.training'),
          tabBarIcon: ({ focused }) => <TabIcon name="💪" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t('client.tabs.tips'),
          tabBarIcon: ({ focused }) => <TabIcon name="💡" focused={focused} />,
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
          tabBarIcon: ({ focused }) => <TabIcon name="👤" focused={focused} />,
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
