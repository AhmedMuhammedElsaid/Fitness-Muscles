import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CoachHomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1 items-center justify-center px-7">
        <Text className="text-primary font-serif text-3xl italic mb-2">Fitness &amp; Muscles</Text>
        <Text className="text-text-secondary font-sans text-sm">Coach dashboard — coming in Phase 4</Text>
      </View>
    </SafeAreaView>
  );
}
