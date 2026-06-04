import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { PrimaryButton } from '@/components/ui';

// This screen is unused post-Phase 3 (single-tenant: role determined server-side).
// Will be removed in Phase 7 cleanup.
export default function RoleSelectScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center px-7">
      <Text className="text-primary font-serif text-3xl italic text-center mb-2">
        How will you use Fitness &amp; Muscles?
      </Text>

      <View className="w-full gap-4">
        <TouchableOpacity
          onPress={() => router.push('/onboarding-form/basic-info')}
          className="bg-surface border border-border rounded-card p-6"
          activeOpacity={0.7}
        >
          <Text className="text-white font-sans text-lg font-semibold mb-1">{"I'm a Client"}</Text>
          <Text className="text-text-secondary text-sm">
            Get personalized workouts, meal plans, and coaching
          </Text>
        </TouchableOpacity>
      </View>

      <PrimaryButton
        title="Skip for now"
        className="mt-8 bg-transparent border border-border"
        onPress={() => router.replace('/(client)/home')}
      />
    </View>
  );
}
