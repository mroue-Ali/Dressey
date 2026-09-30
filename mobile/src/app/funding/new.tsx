import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { AmountInput, ChoiceChips, DateField, Field, FormError, FormScreen, Input, SubmitButton, useSave } from '../../components/form';
import { fundingSources } from '../../data/labels';
import { useStore } from '../../data/store';
import type { FundingSource } from '../../data/types';
import { parseAmount, todayISO } from '../../lib/format';
import { type } from '../../theme';

export default function NewFundingScreen() {
  const { addFunding } = useStore();
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState<FundingSource>('starter');
  const [fromName, setFromName] = useState('');
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');
  const { saving, error, run } = useSave();

  const value = parseAmount(amount);
  const valid = value > 0;

  const save = () =>
    run(async () => {
      await addFunding({ amount: value, source, fromName: fromName.trim(), date, note: note.trim() || undefined });
      router.back();
    });

  return (
    <FormScreen footer={<SubmitButton label={saving ? 'Saving…' : 'Save funding'} onPress={save} disabled={!valid || saving} />}>
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
    </FormScreen>
  );
}
