import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { DateField, Field, FormError, FormScreen, Input, SubmitButton, TimeField, useSave } from '../../components/form';
import { EmptyState, PrimaryButton } from '../../components/ui';
import { useStore } from '../../data/store';
import { confirm } from '../../lib/confirm';
import { shiftTime, timeToMinutes, todayISO } from '../../lib/format';

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_START = '10:00';

/** Adds an appointment (optionally ?date=), or edits it when opened with ?id=. */
export default function AppointmentFormScreen() {
  const { id, date: dateParam } = useLocalSearchParams<{ id?: string; date?: string }>();
  const { appointments, addAppointment, updateAppointment, deleteAppointment } = useStore();
  const existing = id ? appointments.find((a) => a.id === id) : undefined;

  const [name, setName] = useState(existing?.customerName ?? '');
  const [phone, setPhone] = useState(existing?.customerPhone ?? '');
  const [date, setDate] = useState(existing?.date ?? (dateParam && ISO_DAY.test(dateParam) ? dateParam : todayISO()));
  const [start, setStart] = useState(existing?.startTime ?? DEFAULT_START);
  const [end, setEnd] = useState<string | undefined>(existing?.endTime);
  const [note, setNote] = useState(existing?.note ?? '');
  const { saving, error, run } = useSave();

  if (id && !existing) return <EmptyState text="This appointment no longer exists" />;

  const rangeOk = !end || end > start;
  const valid = name.trim() !== '' && rangeOk;

  const changeStart = (next: string) => {
    // Keep the visit's length when the start moves.
    if (end) setEnd(shiftTime(next, timeToMinutes(end) - timeToMinutes(start)));
    setStart(next);
  };

  const save = () =>
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
      router.back();
    });

  const remove = () =>
    confirm('Delete this appointment?', () =>
      run(async () => {
        await deleteAppointment(existing!.id);
        router.back();
      }), 'Delete');

  return (
    <FormScreen footer={<SubmitButton label={saving ? 'Saving…' : existing ? 'Save changes' : 'Save appointment'} onPress={save} disabled={!valid || saving} />}>
      <Stack.Screen options={{ title: existing ? 'Edit appointment' : 'New appointment' }} />
      <Field label="Customer">
        <Input value={name} onChangeText={setName} placeholder="Name" autoCapitalize="words" />
      </Field>
      <Field label="Phone" hint="Optional">
        <Input value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" />
      </Field>
      <Field label="Day">
        <DateField value={date} onChange={setDate} />
      </Field>
      <Field label="From">
        <TimeField value={start} onChange={changeStart} />
      </Field>
      <Field
        label="Until"
        error={rangeOk ? undefined : 'The end time must be after the start time'}
        hint={end ? undefined : 'Optional: add an end time for a range of hours'}
      >
        {end ? (
          <>
            <TimeField value={end} onChange={setEnd} />
            <PrimaryButton label="Remove end time" variant="soft" onPress={() => setEnd(undefined)} />
          </>
        ) : (
          <PrimaryButton label="Add end time" icon="time-outline" variant="soft" onPress={() => setEnd(shiftTime(start, 60))} />
        )}
      </Field>
      <Field label="Details" hint="Optional">
        <Input value={note} onChangeText={setNote} placeholder="e.g. Looking for a blue evening dress, size 38" multiline />
      </Field>
      <FormError message={error} />
      {existing ? <PrimaryButton label="Delete appointment" icon="trash-outline" variant="danger" onPress={remove} /> : null}
    </FormScreen>
  );
}
