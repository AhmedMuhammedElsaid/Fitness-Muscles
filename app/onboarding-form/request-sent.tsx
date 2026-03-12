import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { PrimaryButton } from '@/components/ui';

export default function RequestSentScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center px-7">
      <Text className="text-primary font-serif text-3xl italic mb-4">Request Sent!</Text>
      <Text className="text-text-secondary text-center text-sm mb-8">
        Your trainer will review your profile and get back to you soon. In the meantime, explore the app!
      </Text>
      <PrimaryButton
        title="Go to Dashboard"
        onPress={() => router.replace('/(client)/home')}
        className="w-full"
      />
    </View>
  );
}
