import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { AmountInput, ChoiceChips, DateField, Field, FormError, FormScreen, Input, SubmitButton, useSave } from '../../components/form';
import { EmptyState, PrimaryButton } from '../../components/ui';
import { fundingSources } from '../../data/labels';
import { useStore } from '../../data/store';
import type { FundingSource } from '../../data/types';
import { confirm } from '../../lib/confirm';
import { parseAmount, todayISO } from '../../lib/format';
import { type } from '../../theme';

/** Adds funding, or edits it when opened with ?id=. */
export default function FundingFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { funding, addFunding, updateFunding, deleteFunding } = useStore();
  const existing = id ? funding.find((f) => f.id === id) : undefined;

  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [source, setSource] = useState<FundingSource>(existing?.source ?? 'starter');
  const [fromName, setFromName] = useState(existing?.fromName ?? '');
  const [date, setDate] = useState(existing?.date ?? todayISO());
  const [note, setNote] = useState(existing?.note ?? '');
  const { saving, error, run } = useSave();

  if (id && !existing) return <EmptyState text="This funding entry no longer exists" />;

  const value = parseAmount(amount);
  const valid = value > 0;

  const save = () =>
    run(async () => {
      const input = { amount: value, source, fromName: fromName.trim(), date, note: note.trim() || undefined };
      if (existing) await updateFunding(existing.id, input);
      else await addFunding(input);
      router.back();
    });

  const remove = () =>
    confirm('Delete this funding entry? It will be removed from your cash flow.', () =>
      run(async () => {
        await deleteFunding(existing!.id);
        router.back();
      }), 'Delete');

  return (
    <FormScreen footer={<SubmitButton label={saving ? 'Saving…' : existing ? 'Save changes' : 'Save funding'} onPress={save} disabled={!valid || saving} />}>
      {existing ? <Stack.Screen options={{ title: 'Edit funding' }} /> : null}
      <Text style={type.caption}>Money put into the business from outside — not rental earnings.</Text>
      <Field label="Amount">
        <AmountInput value={amount} onChangeText={setAmount} placeholder="1500" />
      </Field>
      <Field label="Type">
        <ChoiceChips options={fundingSources} value={source} onChange={setSource} />
      </Field>
      <Field label="From" hint="Who gave it (optional)">
        <Input value={fromName} onChangeText={setFromName} placeholder="e.g. Own savings, Dad, Investor name" />
      </Field>
      <Field label="Date">
        <DateField value={date} onChange={setDate} />
      </Field>
      <Field label="Note">
        <Input value={note} onChangeText={setNote} placeholder="Optional" multiline />
      </Field>
      <FormError message={error} />
      {existing ? <PrimaryButton label="Delete funding" icon="trash-outline" variant="danger" onPress={remove} /> : null}
    </FormScreen>
  );
}
