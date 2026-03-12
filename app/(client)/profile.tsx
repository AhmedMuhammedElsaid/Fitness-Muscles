import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SecondaryButton } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1" contentContainerClassName="px-7 pt-4 pb-8">
        <Text className="text-white font-sans text-xl font-semibold mb-6">Profile</Text>

        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-full bg-surface items-center justify-center mb-3">
            <Text className="text-3xl">👤</Text>
          </View>
          <Text className="text-white font-sans font-medium">
            {user?.email ?? 'Guest'}
          </Text>
        </View>

        <SecondaryButton title="Sign Out" onPress={handleLogout} />
      </ScrollView>
    </SafeAreaView>
  );
}
