import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MealPlanScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1 px-7 pt-4">
        <Text className="text-white font-sans text-xl font-semibold mb-2">Meal Plans</Text>
        <Text className="text-text-secondary text-sm">
          Your meal plans will appear here once your trainer assigns them.
        </Text>
      </View>
    </SafeAreaView>
  );
}
