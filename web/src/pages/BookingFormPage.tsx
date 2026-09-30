import { dayState, nearestFreeDays } from '@mobile/src/lib/availability';
import { longDate, parseAmount, parseISODate, shortDate, todayISO } from '@mobile/src/lib/format';
import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';

import { describeState, dressDayLook, Legend } from '../components/Availability';
import { DressThumb } from '../components/DressThumb';
import { AmountInput, Field, FormError, FormPage, Input, SubmitButton, TextArea, useSave } from '../components/form';
import { MonthCalendar } from '../components/MonthCalendar';
import { Card, cx, EmptyState, SubPage } from '../components/ui';
import { useStore } from '../data/store';
import { useGoBack } from '../lib/nav';

/** Creates a booking at /booking/new, or edits one at /booking/:id/edit. */
export function BookingFormPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const goBack = useGoBack(id ? `/booking/${id}` : '/schedule');
  const { dresses, bookings, addBooking, updateBooking } = useStore();
  const existing = id ? bookings.find((b) => b.id === id) : undefined;
  const ignoreId = existing?.id; // its own dates don't block it

  const initialDate = existing?.eventDate ?? params.get('date') ?? todayISO();
  const [dressId, setDressId] = useState(existing?.dressId ?? params.get('dressId') ?? dresses[0]?.id);
  const [date, setDate] = useState(initialDate);
  const [month, setMonth] = useState(() => parseISODate(initialDate));
  const dress = dresses.find((d) => d.id === dressId);

  const [customerName, setCustomerName] = useState(existing?.customerName ?? '');
  const [phone, setPhone] = useState(existing?.customerPhone ?? '');
  const [price, setPrice] = useState(existing ? String(existing.price) : dress?.rentalPrice ? String(dress.rentalPrice) : '');
  const [paid, setPaid] = useState(existing?.paid ? String(existing.paid) : '');
  const [note, setNote] = useState(existing?.note ?? '');
  const { saving, error, run } = useSave();

  const title = id ? 'Edit booking' : 'New booking';
  if (id && !existing) {
    return (
      <SubPage title={title} back="/schedule" narrow>
        <EmptyState text="This booking no longer exists" />
      </SubPage>
    );
  }
  if (!dress) {
    return (
      <SubPage title={title} back="/schedule" narrow>
        <EmptyState text="Add a dress first" />
      </SubPage>
    );
  }

  const today = todayISO();
  const state = dayState(bookings, dress.id, date, ignoreId);
  // A past booking can still be edited (e.g. payments) as long as its date is unchanged.
  const available = state.kind === 'free' && (date >= today || date === existing?.eventDate);
  const priceValue = parseAmount(price);
  const paidValue = paid === '' ? 0 : parseAmount(paid);
  const valid = available && customerName.trim() !== '' && priceValue >= 0 && paidValue >= 0 && paidValue <= priceValue;

  const chooseDress = (id: string) => {
    setDressId(id);
    const d = dresses.find((x) => x.id === id);
    if (d?.rentalPrice) setPrice(String(d.rentalPrice));
  };

  const save = () => {
    if (!valid || saving) return;
    run(async () => {
      const input = {
        dressId: dress.id,
        eventDate: date,
        customerName: customerName.trim(),
        customerPhone: phone.trim() || undefined,
        price: priceValue,
        paid: paidValue,
        note: note.trim() || undefined,
      };
      if (existing) {
        await updateBooking(existing.id, input);
        goBack();
      } else {
        const booking = await addBooking(input);
        navigate(`/booking/${booking.id}`, { replace: true });
      }
    });
  };

  return (
    <FormPage
      title={title}
      back={id ? `/booking/${id}` : '/schedule'}
      narrow={false}
      onSubmit={save}
      footer={<SubmitButton label={saving ? 'Saving…' : existing ? 'Save changes' : 'Confirm booking'} disabled={!valid || saving} />}
    >
      <div className="split">
        <div className="stack">
          <Field label="Dress">
            <div className="picker">
              {dresses.map((d) => {
                const on = d.id === dress.id;
                const freeThatDay = dayState(bookings, d.id, date, ignoreId).kind === 'free';
                return (
                  <button key={d.id} type="button" className={cx('pick', on && 'pick--active')} aria-pressed={on} onClick={() => chooseDress(d.id)}>
                    <DressThumb dress={d} size={52} dim={!freeThatDay} />
                    <span className="pick-name">{d.name}</span>
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Event date">
            <Card>
              <MonthCalendar
                month={month}
                onMonthChange={setMonth}
                selected={date}
                onSelect={setDate}
                dayLook={dressDayLook(bookings, dress, ignoreId)}
                disablePast
              />
              <Legend />
            </Card>
            <div className={cx('status', available ? 'tone-success' : 'tone-danger')} aria-live="polite">
              <span className="status-text">
                {available ? `${dress.name} is free on ${longDate(date)}` : date < today ? 'Pick a future date' : describeState(state)}
              </span>
              {!available && date >= today ? (
                <div className="suggest-row">
                  {nearestFreeDays(bookings, dress.id, date, today, ignoreId).map((iso) => (
                    <button key={iso} type="button" className="suggest suggest--on-tone" onClick={() => setDate(iso)}>
                      {shortDate(iso)}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </Field>
        </div>

        <div className="stack">
          <Field label="Customer name">
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full name" autoComplete="off" />
          </Field>
          <Field label="Phone">
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+961 …" autoComplete="off" />
          </Field>
          <div className="pair">
            <Field label="Price">
              <AmountInput value={price} onChange={setPrice} />
            </Field>
            <Field label={existing ? 'Paid' : 'Paid now'} error={paidValue > priceValue ? 'More than the price' : undefined}>
              <AmountInput value={paid} onChange={setPaid} />
            </Field>
          </div>
          <Field label="Note">
            <TextArea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Alterations, pickup time…" />
          </Field>
          <FormError message={error} />
        </div>
      </div>
    </FormPage>
  );
}
