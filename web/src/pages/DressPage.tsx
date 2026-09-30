import { dressOrigins, labelOf } from '@mobile/src/data/labels';
import { money, shortDate, todayISO } from '@mobile/src/lib/format';
import { useState } from 'react';
import { IoAdd, IoCreateOutline, IoTrashOutline } from 'react-icons/io5';
import { useParams } from 'react-router';

import { dressDayLook, Legend } from '../components/Availability';
import { BookingRow } from '../components/BookingRow';
import { DressThumb } from '../components/DressThumb';
import { FormError, useSave } from '../components/form';
import { MonthCalendar } from '../components/MonthCalendar';
import { Badge, Button, Card, cx, EmptyState, SectionHeader, SubPage } from '../components/ui';
import { useStore } from '../data/store';
import { useGoBack } from '../lib/nav';

export function DressPage() {
  const { id } = useParams();
  const { dresses, bookings, deleteDress } = useStore();
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(todayISO());
  const { saving, error, run } = useSave();
  const goBack = useGoBack('/dresses');
  const dress = dresses.find((d) => d.id === id);

  if (!dress) {
    return (
      <SubPage title="Dress" back="/dresses">
        <EmptyState text="Dress not found" />
      </SubPage>
    );
  }

  const mine = bookings.filter((b) => b.dressId === dress.id).sort((a, b) => b.eventDate.localeCompare(a.eventDate));
  const rentals = mine.filter((b) => b.status === 'booked');
  const earned = mine.reduce((s, b) => s + b.paid, 0);
  const payback = dress.purchasePrice > 0 ? Math.min(earned / dress.purchasePrice, 1) : null;

  const remove = () => {
    if (!window.confirm(`Delete "${dress.name}"? Its photo is deleted too. This cannot be undone.`)) return;
    run(async () => {
      await deleteDress(dress.id);
      goBack();
    });
  };

  return (
    <SubPage
      title={dress.name}
      back="/dresses"
      actions={<Button label="Edit" icon={IoCreateOutline} variant="soft" className="btn--compact" to={`/dress/${dress.id}/edit`} />}
    >
      <div className="columns columns--media">
        <DressThumb dress={dress} className={cx('dress-hero', !dress.photoUri && 'dress-hero--empty')} />

        <div className="stack">
          <div className="tags">
            <Badge label={labelOf(dressOrigins, dress.origin)} />
            {dress.size ? <Badge label={`Size ${dress.size}`} tone="info" /> : null}
          </div>

          <Card className="stack">
            {dress.origin === 'bought' ? <Fact label="Bought" value={`${money(dress.purchasePrice)}${dress.shop ? ` · ${dress.shop}` : ''}`} /> : null}
            <Fact label="Added" value={shortDate(dress.addedAt)} />
            {dress.rentalPrice ? <Fact label="Rental price" value={money(dress.rentalPrice)} /> : null}
            <Fact label="Rentals" value={String(rentals.length)} />
            <Fact label="Earned" value={money(earned)} />
            {dress.note ? <Fact label="Note" value={dress.note} /> : null}
            {payback !== null ? (
              <div className="stack-xs">
                <div className="track" role="progressbar" aria-valuenow={Math.round(payback * 100)} aria-valuemin={0} aria-valuemax={100}>
                  <div className="track-fill" style={{ width: `${payback * 100}%` }} />
                </div>
                <span className="t-caption">{payback >= 1 ? 'Paid for itself' : `${Math.round(payback * 100)}% of its price earned back`}</span>
              </div>
            ) : null}
          </Card>
        </div>
      </div>

      <div className="columns">
        <section className="stack">
          <SectionHeader title="Availability" />
          <Card>
            <MonthCalendar month={month} onMonthChange={setMonth} selected={selected} onSelect={setSelected} dayLook={dressDayLook(bookings, dress)} />
            <Legend />
          </Card>
          <Button label={`Book on ${shortDate(selected)}`} icon={IoAdd} to={`/booking/new?${new URLSearchParams({ dressId: dress.id, date: selected })}`} />
        </section>

        <section className="stack">
          <SectionHeader title="Rental history" />
          <Card>{mine.length ? mine.map((b) => <BookingRow key={b.id} booking={b} />) : <EmptyState text="Not rented yet" />}</Card>
        </section>
      </div>

      <FormError message={error} />
      <div className="button-row">
        <Button label="Delete dress" icon={IoTrashOutline} variant="danger" disabled={saving} onClick={remove} />
      </div>
    </SubPage>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="fact">
      <span className="t-caption">{label}</span>
      <span className="fact-value">{value}</span>
    </div>
  );
}
