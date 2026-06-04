import { View, Text } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { ActivityIndicator } from 'react-native';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#E8DEB5" />
        <Text className="text-primary font-serif text-2xl mt-4 italic">Fitness &amp; Muscles</Text>
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(client)/home" />;
  }

  return <Redirect href="/auth/login" />;
}
