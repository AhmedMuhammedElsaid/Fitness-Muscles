import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, ProgressBar } from '@/components/ui';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1" contentContainerClassName="px-7 pb-8">
        {/* Header */}
        <View className="flex-row justify-between items-center mt-4 mb-6">
          <View>
            <Text className="text-text-secondary text-xs font-sans">Welcome back</Text>
            <Text className="text-white font-sans text-xl font-semibold">Dashboard</Text>
          </View>
          <View className="w-10 h-10 rounded-full bg-surface items-center justify-center">
            <Text className="text-text-muted text-lg">🔔</Text>
          </View>
        </View>

        {/* Daily Progress */}
        <Card className="mb-4">
          <Text className="text-white font-sans font-medium mb-3">Today's Progress</Text>
          <ProgressBar progress={0} label="Workouts" className="mb-3" />
          <ProgressBar progress={0} label="Meals" className="mb-3" />
          <ProgressBar progress={0} label="Water" />
        </Card>

        {/* Quick Actions */}
        <Text className="text-white font-sans font-medium mb-3">Quick Actions</Text>
        <View className="flex-row gap-3 mb-6">
          <Card className="flex-1 items-center py-5">
            <Text className="text-2xl mb-1">🏋️</Text>
            <Text className="text-text-secondary text-xs font-sans">Start Workout</Text>
          </Card>
          <Card className="flex-1 items-center py-5">
            <Text className="text-2xl mb-1">📊</Text>
            <Text className="text-text-secondary text-xs font-sans">Log Progress</Text>
          </Card>
          <Card className="flex-1 items-center py-5">
            <Text className="text-2xl mb-1">📸</Text>
            <Text className="text-text-secondary text-xs font-sans">Photo</Text>
          </Card>
        </View>

        {/* Streak */}
        <Card>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white font-sans font-medium">Current Streak</Text>
              <Text className="text-text-secondary text-xs font-sans mt-1">Keep it up!</Text>
            </View>
            <Text className="text-primary font-sans text-3xl font-bold">0🔥</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
