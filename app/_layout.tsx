import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '../providers/ThemeProvider';
import { NotificationsProvider } from '../providers/NotificationsProvider';
import { StoreProvider } from '../providers/StoreProvider';

export default function RootLayout() {
  return (
    <StoreProvider>
      <ThemeProvider>
        <NotificationsProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="alarm/ring"
              options={{
                presentation: 'fullScreenModal',
                headerShown: false,
                gestureEnabled: false,
              }}
            />
          </Stack>
          <StatusBar style="auto" />
        </NotificationsProvider>
      </ThemeProvider>
    </StoreProvider>
  );
}