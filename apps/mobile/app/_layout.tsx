import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Sohbetler' }} />
      <Stack.Screen name="login" options={{ title: 'Giriş' }} />
      <Stack.Screen name="chat/[id]" options={{ title: 'Sohbet' }} />
    </Stack>
  );
}