import { CormorantGaramond_400Regular, CormorantGaramond_600SemiBold, CormorantGaramond_700Bold } from '@expo-google-fonts/cormorant-garamond';
import { Quicksand_500Medium, Quicksand_600SemiBold, Quicksand_700Bold } from '@expo-google-fonts/quicksand';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { SignIn } from '../components/SignIn';
import { Wordmark } from '../components/Wordmark';
import { PrimaryButton } from '../components/ui';
import { StoreProvider, useStore } from '../data/store';
import { colors, fonts, spacing, type } from '../theme';

// Keep the native logo splash up until fonts and the saved login are ready.
SplashScreen.preventAutoHideAsync().catch(() => {});

/** Matches the native splash (same logo, same ivory) while data loads. */
function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl, backgroundColor: colors.background }}>
      <Wordmark width={220} />
      <ActivityIndicator color={colors.gold} />
    </View>
  );
}

function AppStack() {
  const { authReady, session, loading, loadError, reload, signOut, dresses, bookings } = useStore();
  useEffect(() => {
    if (authReady) SplashScreen.hideAsync().catch(() => {});
  }, [authReady]);
  if (!authReady) return <Loading />;
  if (!session) return <SignIn />;
  if (loadError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.md, backgroundColor: colors.background }}>
        <Text style={type.title}>Couldn't load your data</Text>
        <Text style={type.caption}>{loadError}</Text>
        <PrimaryButton label="Try again" icon="refresh" onPress={reload} />
        <PrimaryButton label="Sign out" variant="soft" onPress={signOut} />
      </View>
    );
  }
  // First load after sign-in; later reloads keep showing the current data.
  if (loading && !dresses.length && !bookings.length) return <Loading />;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primaryDark,
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 21, color: colors.text },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="funding/new" options={{ title: 'Add funding', presentation: 'modal' }} />
      <Stack.Screen name="expense/new" options={{ title: 'Add expense', presentation: 'modal' }} />
      <Stack.Screen name="dress/new" options={{ title: 'Add dress', presentation: 'modal' }} />
      <Stack.Screen name="booking/new" options={{ title: 'New booking', presentation: 'modal' }} />
      <Stack.Screen name="appointment/new" options={{ title: 'New appointment', presentation: 'modal' }} />
      <Stack.Screen name="dress/[id]" options={{ title: 'Dress' }} />
      <Stack.Screen name="booking/[id]" options={{ title: 'Booking' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
  });

  if (!fontsLoaded) return <Loading />;

  return (
    <StoreProvider>
      <StatusBar style="dark" />
      <AppStack />
    </StoreProvider>
  );
}
