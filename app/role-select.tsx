import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { PrimaryButton } from '@/components/ui';

export default function RoleSelectScreen() {
  const { updateFormData } = useOnboardingStore();

  const selectRole = (role: 'client' | 'coach') => {
    updateFormData({ role });
    router.push('/onboarding-form/basic-info');
  };

  return (
    <View className="flex-1 bg-background items-center justify-center px-7">
      <Text className="text-primary font-serif text-3xl italic text-center mb-2">
        How will you use Stride?
      </Text>
      <Text className="text-text-secondary text-center text-sm mb-12">
        Choose your role to personalize your experience
      </Text>

      <View className="w-full gap-4">
        <TouchableOpacity
          onPress={() => selectRole('client')}
          className="bg-surface border border-border rounded-card p-6"
          activeOpacity={0.7}
        >
          <Text className="text-white font-sans text-lg font-semibold mb-1">I'm a Client</Text>
          <Text className="text-text-secondary text-sm">
            Get personalized workouts, meal plans, and coaching
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => selectRole('coach')}
          className="bg-surface border border-border rounded-card p-6"
          activeOpacity={0.7}
        >
          <Text className="text-white font-sans text-lg font-semibold mb-1">I'm a Coach</Text>
          <Text className="text-text-secondary text-sm">
            Manage clients, create plans, and grow your business
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
