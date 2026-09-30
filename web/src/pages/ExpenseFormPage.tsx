import { expenseCategories } from '@mobile/src/data/labels';
import type { ExpenseCategory } from '@mobile/src/data/types';
import { parseAmount, todayISO } from '@mobile/src/lib/format';
import { useState } from 'react';
import { IoTrashOutline } from 'react-icons/io5';
import { useParams } from 'react-router';

import { AmountInput, ChoiceChips, DateField, Field, FormError, FormPage, SubmitButton, TextArea, useSave } from '../components/form';
import { Button, EmptyState, SubPage } from '../components/ui';
import { useStore } from '../data/store';
import { useGoBack } from '../lib/nav';

/** Adds an expense at /expense/new, or edits one at /expense/:id/edit. */
export function ExpenseFormPage() {
  const { id } = useParams();
  const goBack = useGoBack('/finance');
  const { expenses, addExpense, updateExpense, deleteExpense } = useStore();
  const existing = id ? expenses.find((e) => e.id === id) : undefined;

  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [category, setCategory] = useState<ExpenseCategory>(existing?.category ?? 'transport');
  const [date, setDate] = useState(existing?.date ?? todayISO());
  const [note, setNote] = useState(existing?.note ?? '');
  const { saving, error, run } = useSave();

  if (id && !existing) {
    return (
      <SubPage title="Edit expense" back="/finance" narrow>
        <EmptyState text="This expense no longer exists" />
      </SubPage>
    );
  }

  const value = parseAmount(amount);
  const valid = value > 0 && (category !== 'other' || note.trim() !== '');

  const save = () => {
    if (!valid || saving) return;
    run(async () => {
      const input = { amount: value, category, date, note: note.trim() || undefined };
      if (existing) await updateExpense(existing.id, input);
      else await addExpense(input);
      goBack();
    });
  };

  const remove = () => {
    if (!existing || !window.confirm('Delete this expense? It will be removed from your cash flow.')) return;
    run(async () => {
      await deleteExpense(existing.id);
      goBack();
    });
  };

  return (
    <FormPage
      title={existing ? 'Edit expense' : 'Add expense'}
      back="/finance"
      onSubmit={save}
      footer={<SubmitButton label={saving ? 'Saving…' : existing ? 'Save changes' : 'Save expense'} disabled={!valid || saving} />}
    >
      <Field label="Amount">
        <AmountInput value={amount} onChange={setAmount} />
      </Field>
      <Field label="What for">
        <ChoiceChips options={expenseCategories} value={category} onChange={setCategory} />
      </Field>
      <Field label="Date">
        <DateField value={date} onChange={setDate} />
      </Field>
      <Field label="Note" hint={category === 'other' ? 'Required for "Other"' : 'Optional'}>
        <TextArea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Taxi to the shop" />
      </Field>
      <FormError message={error} />
      {existing ? <Button label="Delete expense" icon={IoTrashOutline} variant="danger" disabled={saving} onClick={remove} /> : null}
    </FormPage>
  );
}
