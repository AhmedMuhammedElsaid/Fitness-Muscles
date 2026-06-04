import { View, Text, ActivityIndicator } from 'react-native';

export default function Index() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <ActivityIndicator size="large" color="#E8DEB5" />
      <Text className="text-primary font-serif text-2xl mt-4 italic">Fitness &amp; Muscles</Text>
    </View>
  );
}
