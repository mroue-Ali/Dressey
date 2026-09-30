import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useStore } from '../data/store';
import { colors, spacing, type } from '../theme';
import { Field, Input, SubmitButton } from './form';
import { Wordmark } from './Wordmark';

export function SignIn() {
  const { signIn } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const submit = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await signIn(username, password);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrap}>
        <View style={styles.brand}>
          <Wordmark width={250} />
          <Text style={styles.tagline}>Because every moment deserves elegance.</Text>
        </View>
        <Field label="Username">
          <Input value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} autoComplete="username" placeholder="Your username" />
        </Field>
        <Field label="Password" error={error}>
          <Input value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" placeholder="••••••••" onSubmitEditing={submit} />
        </Field>
        <SubmitButton label={busy ? 'Signing in…' : 'Sign in'} onPress={submit} disabled={busy || !username.trim() || !password} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  wrap: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.lg, maxWidth: 480, width: '100%', alignSelf: 'center' },
  brand: { alignItems: 'center', marginBottom: spacing.xxl },
  tagline: { ...type.caption, marginTop: spacing.md },
});
