import { router } from 'expo-router';
import { useState } from 'react';

import { AmountInput, ChoiceChips, DateField, Field, FormError, FormScreen, Input, SubmitButton, useSave } from '../../components/form';
import { expenseCategories } from '../../data/labels';
import { useStore } from '../../data/store';
import type { ExpenseCategory } from '../../data/types';
import { parseAmount, todayISO } from '../../lib/format';

export default function NewExpenseScreen() {
  const { addExpense } = useStore();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('transport');
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');
  const { saving, error, run } = useSave();

  const value = parseAmount(amount);
  const valid = value > 0 && (category !== 'other' || note.trim() !== '');

  const save = () =>
    run(async () => {
      await addExpense({ amount: value, category, date, note: note.trim() || undefined });
      router.back();
    });

  return (
    <FormScreen footer={<SubmitButton label={saving ? 'Saving…' : 'Save expense'} onPress={save} disabled={!valid || saving} />}>
      <Field label="Amount">
        <AmountInput value={amount} onChangeText={setAmount} />
      </Field>
      <Field label="What for">
        <ChoiceChips options={expenseCategories} value={category} onChange={setCategory} />
      </Field>
      <Field label="Date">
        <DateField value={date} onChange={setDate} />
      </Field>
      <Field label="Note" hint={category === 'other' ? 'Required for "Other"' : 'Optional'}>
        <Input value={note} onChangeText={setNote} placeholder="e.g. Taxi to the shop" multiline />
      </Field>
      <FormError message={error} />
    </FormScreen>
  );
}
