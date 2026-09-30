import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { AmountInput, ChoiceChips, DateField, Field, FormError, FormScreen, Input, SubmitButton, useSave } from '../../components/form';
import { EmptyState, PrimaryButton } from '../../components/ui';
import { expenseCategories } from '../../data/labels';
import { useStore } from '../../data/store';
import type { ExpenseCategory } from '../../data/types';
import { confirm } from '../../lib/confirm';
import { parseAmount, todayISO } from '../../lib/format';

/** Adds an expense, or edits it when opened with ?id=. */
export default function ExpenseFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { expenses, addExpense, updateExpense, deleteExpense } = useStore();
  const existing = id ? expenses.find((e) => e.id === id) : undefined;

  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [category, setCategory] = useState<ExpenseCategory>(existing?.category ?? 'transport');
  const [date, setDate] = useState(existing?.date ?? todayISO());
  const [note, setNote] = useState(existing?.note ?? '');
  const { saving, error, run } = useSave();

  if (id && !existing) return <EmptyState text="This expense no longer exists" />;

  const value = parseAmount(amount);
  const valid = value > 0 && (category !== 'other' || note.trim() !== '');

  const save = () =>
    run(async () => {
      const input = { amount: value, category, date, note: note.trim() || undefined };
      if (existing) await updateExpense(existing.id, input);
      else await addExpense(input);
      router.back();
    });

  const remove = () =>
    confirm('Delete this expense? It will be removed from your cash flow.', () =>
      run(async () => {
        await deleteExpense(existing!.id);
        router.back();
      }), 'Delete');

  return (
    <FormScreen footer={<SubmitButton label={saving ? 'Saving…' : existing ? 'Save changes' : 'Save expense'} onPress={save} disabled={!valid || saving} />}>
      {existing ? <Stack.Screen options={{ title: 'Edit expense' }} /> : null}
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
      {existing ? <PrimaryButton label="Delete expense" icon="trash-outline" variant="danger" onPress={remove} /> : null}
    </FormScreen>
  );
}
