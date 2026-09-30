import { fundingSources } from '@mobile/src/data/labels';
import type { FundingSource } from '@mobile/src/data/types';
import { parseAmount, todayISO } from '@mobile/src/lib/format';
import { useState } from 'react';
import { IoTrashOutline } from 'react-icons/io5';
import { useParams } from 'react-router';

import { AmountInput, ChoiceChips, DateField, Field, FormError, FormPage, Input, SubmitButton, TextArea, useSave } from '../components/form';
import { Button, EmptyState, SubPage } from '../components/ui';
import { useStore } from '../data/store';
import { useGoBack } from '../lib/nav';

/** Adds funding at /funding/new, or edits an entry at /funding/:id/edit. */
export function FundingFormPage() {
  const { id } = useParams();
  const goBack = useGoBack('/finance');
  const { funding, addFunding, updateFunding, deleteFunding } = useStore();
  const existing = id ? funding.find((f) => f.id === id) : undefined;

  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [source, setSource] = useState<FundingSource>(existing?.source ?? 'starter');
  const [fromName, setFromName] = useState(existing?.fromName ?? '');
  const [date, setDate] = useState(existing?.date ?? todayISO());
  const [note, setNote] = useState(existing?.note ?? '');
  const { saving, error, run } = useSave();

  if (id && !existing) {
    return (
      <SubPage title="Edit funding" back="/finance" narrow>
        <EmptyState text="This funding entry no longer exists" />
      </SubPage>
    );
  }

  const value = parseAmount(amount);
  const valid = value > 0;

  const save = () => {
    if (!valid || saving) return;
    run(async () => {
      const input = { amount: value, source, fromName: fromName.trim(), date, note: note.trim() || undefined };
      if (existing) await updateFunding(existing.id, input);
      else await addFunding(input);
      goBack();
    });
  };

  const remove = () => {
    if (!existing || !window.confirm('Delete this funding entry? It will be removed from your cash flow.')) return;
    run(async () => {
      await deleteFunding(existing.id);
      goBack();
    });
  };

  return (
    <FormPage
      title={existing ? 'Edit funding' : 'Add funding'}
      back="/finance"
      onSubmit={save}
      footer={<SubmitButton label={saving ? 'Saving…' : existing ? 'Save changes' : 'Save funding'} disabled={!valid || saving} />}
    >
      <p className="t-caption">Money put into the business from outside — not rental earnings.</p>
      <Field label="Amount">
        <AmountInput value={amount} onChange={setAmount} placeholder="1500" />
      </Field>
      <Field label="Type">
        <ChoiceChips options={fundingSources} value={source} onChange={setSource} />
      </Field>
      <Field label="From" hint="Who gave it (optional)">
        <Input value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="e.g. Own savings, Dad, Investor name" autoComplete="off" />
      </Field>
      <Field label="Date">
        <DateField value={date} onChange={setDate} />
      </Field>
      <Field label="Note">
        <TextArea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
      </Field>
      <FormError message={error} />
      {existing ? <Button label="Delete funding" icon={IoTrashOutline} variant="danger" disabled={saving} onClick={remove} /> : null}
    </FormPage>
  );
}
