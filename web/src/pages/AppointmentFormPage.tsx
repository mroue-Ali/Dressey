import { shiftTime, timeToMinutes, todayISO } from '@mobile/src/lib/format';
import { useState } from 'react';
import { IoTimeOutline, IoTrashOutline } from 'react-icons/io5';
import { useParams, useSearchParams } from 'react-router';

import { DateField, Field, FormError, FormPage, Input, SubmitButton, TextArea, useSave } from '../components/form';
import { Button, EmptyState, SubPage } from '../components/ui';
import { useStore } from '../data/store';
import { useGoBack } from '../lib/nav';

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_START = '10:00';

/** Adds an appointment at /appointment/new (optionally ?date=), or edits one at /appointment/:id/edit. */
export function AppointmentFormPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const goBack = useGoBack('/appointments');
  const { appointments, addAppointment, updateAppointment, deleteAppointment } = useStore();
  const existing = id ? appointments.find((a) => a.id === id) : undefined;

  const dateParam = params.get('date');
  const [name, setName] = useState(existing?.customerName ?? '');
  const [phone, setPhone] = useState(existing?.customerPhone ?? '');
  const [date, setDate] = useState(existing?.date ?? (dateParam && ISO_DAY.test(dateParam) ? dateParam : todayISO()));
  const [start, setStart] = useState(existing?.startTime ?? DEFAULT_START);
  const [end, setEnd] = useState<string | undefined>(existing?.endTime);
  const [note, setNote] = useState(existing?.note ?? '');
  const { saving, error, run } = useSave();

  if (id && !existing) {
    return (
      <SubPage title="Edit appointment" back="/appointments" narrow>
        <EmptyState text="This appointment no longer exists" />
      </SubPage>
    );
  }

  const rangeOk = !end || end > start;
  const valid = name.trim() !== '' && start !== '' && rangeOk;

  const changeStart = (next: string) => {
    if (!next) return setStart(next);
    // Keep the visit's length when the start moves.
    if (end && start) setEnd(shiftTime(next, timeToMinutes(end) - timeToMinutes(start)));
    setStart(next);
  };

  const save = () => {
    if (!valid || saving) return;
    run(async () => {
      const input = {
        customerName: name.trim(),
        customerPhone: phone.trim() || undefined,
        date,
        startTime: start,
        endTime: end,
        note: note.trim() || undefined,
      };
      if (existing) await updateAppointment(existing.id, input);
      else await addAppointment(input);
      goBack();
    });
  };

  const remove = () => {
    if (!existing || !window.confirm('Delete this appointment?')) return;
    run(async () => {
      await deleteAppointment(existing.id);
      goBack();
    });
  };

  return (
    <FormPage
      title={existing ? 'Edit appointment' : 'New appointment'}
      back="/appointments"
      onSubmit={save}
      footer={<SubmitButton label={saving ? 'Saving…' : existing ? 'Save changes' : 'Save appointment'} disabled={!valid || saving} />}
    >
      <Field label="Customer">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" autoComplete="off" />
      </Field>
      <Field label="Phone" hint="Optional">
        <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" autoComplete="off" />
      </Field>
      <Field label="Day">
        <DateField value={date} onChange={setDate} />
      </Field>
      <Field label="From">
        <Input type="time" value={start} onChange={(e) => changeStart(e.target.value)} />
      </Field>
      <Field
        label="Until"
        error={rangeOk ? undefined : 'The end time must be after the start time'}
        hint={end !== undefined ? undefined : 'Optional: add an end time for a range of hours'}
      >
        {end !== undefined ? (
          <>
            <Input type="time" value={end} onChange={(e) => setEnd(e.target.value || undefined)} />
            <Button label="Remove end time" variant="soft" onClick={() => setEnd(undefined)} />
          </>
        ) : (
          <Button label="Add end time" icon={IoTimeOutline} variant="soft" disabled={!start} onClick={() => setEnd(shiftTime(start, 60))} />
        )}
      </Field>
      <Field label="Details" hint="Optional">
        <TextArea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Looking for a blue evening dress, size 38" />
      </Field>
      <FormError message={error} />
      {existing ? <Button label="Delete appointment" icon={IoTrashOutline} variant="danger" disabled={saving} onClick={remove} /> : null}
    </FormPage>
  );
}
