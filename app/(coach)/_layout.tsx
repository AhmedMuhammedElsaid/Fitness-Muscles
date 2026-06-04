import { Stack } from 'expo-router';

export default function CoachLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#1A1A1A' },
        animation: 'slide_from_right',
      }}
    />
  );
}
