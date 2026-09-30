import { useState } from 'react';

import { useStore } from '../data/store';
import { usePageTitle } from '../lib/nav';
import { Field, Input, SubmitButton } from './form';
import { Wordmark } from './Wordmark';

export function SignIn() {
  usePageTitle('Sign in');
  const { signIn } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const ready = !busy && username.trim() !== '' && password !== '';

  const submit = async () => {
    if (!ready) return;
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
    <main className="centered">
      <form
        className="signin"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="signin-brand">
          <Wordmark width={250} />
          <p className="t-caption">Because every moment deserves elegance.</p>
        </div>
        <Field label="Username">
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="username"
            placeholder="Your username"
            autoFocus
          />
        </Field>
        <Field label="Password" error={error}>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="••••••••" />
        </Field>
        <SubmitButton label={busy ? 'Signing in…' : 'Sign in'} disabled={!ready} />
      </form>
    </main>
  );
}
