import { BLOCK_AFTER, BLOCK_BEFORE } from '@mobile/src/lib/availability';
import { longDate, money, shiftISO, shortDate } from '@mobile/src/lib/format';
import { IoCashOutline, IoCloseCircleOutline, IoCreateOutline, IoTrashOutline } from 'react-icons/io5';
import { useParams } from 'react-router';

import { DressThumb } from '../components/DressThumb';
import { FormError, useSave } from '../components/form';
import { Badge, Button, Card, cx, EmptyState, SubPage } from '../components/ui';
import { useDress, useStore } from '../data/store';
import { useGoBack } from '../lib/nav';

export function BookingPage() {
  const { id } = useParams();
  const { bookings, updateBooking, deleteBooking } = useStore();
  const booking = bookings.find((b) => b.id === id);
  const dress = useDress(booking?.dressId);
  const { saving, error, run } = useSave();
  const goBack = useGoBack('/schedule');

  if (!booking) {
    return (
      <SubPage title="Booking" back="/schedule">
        <EmptyState text="Booking not found" />
      </SubPage>
    );
  }

  const due = booking.price - booking.paid;
  const cancelled = booking.status === 'cancelled';

  const cancel = () => {
    if (!window.confirm('Cancel this booking? The dress becomes free again. Money already paid stays recorded.')) return;
    run(async () => {
      await updateBooking(booking.id, { status: 'cancelled' });
      goBack();
    });
  };

  const remove = () => {
    const message =
      'Delete this booking completely? Its payments are removed from your cash flow too. To keep the money record, cancel it instead.';
    if (!window.confirm(message)) return;
    run(async () => {
      await deleteBooking(booking.id);
      goBack();
    });
  };

  return (
    <SubPage
      title="Booking"
      back="/schedule"
      narrow
      actions={<Button label="Edit" icon={IoCreateOutline} variant="soft" className="btn--compact" to={`/booking/${booking.id}/edit`} />}
    >
      <Card className="booking-head">
        <DressThumb dress={dress ?? { color: 'var(--surface-alt)' }} size={72} />
        <div className="stack-xs">
          <h2 className="t-title">{booking.customerName}</h2>
          <span className="t-caption">{dress?.name}</span>
          {cancelled ? <Badge label="Cancelled" tone="danger" /> : null}
        </div>
      </Card>

      <Card className="stack">
        <Row label="Event day" value={longDate(booking.eventDate)} strong />
        <Row label="Pickup" value={shortDate(shiftISO(booking.eventDate, -BLOCK_BEFORE))} />
        <Row label="Return" value={shortDate(shiftISO(booking.eventDate, 1))} />
        <Row label="Cleaning" value={shortDate(shiftISO(booking.eventDate, BLOCK_AFTER))} />
        <Row label="Next rental possible" value={shortDate(shiftISO(booking.eventDate, BLOCK_AFTER + 1))} />
        {booking.customerPhone ? <Row label="Phone" value={booking.customerPhone} href={`tel:${booking.customerPhone}`} /> : null}
        {booking.note ? <Row label="Note" value={booking.note} /> : null}
      </Card>

      <Card className="stack">
        <Row label="Price" value={money(booking.price)} />
        <Row label="Paid" value={money(booking.paid)} />
        <Row label="Remaining" value={money(Math.max(due, 0))} strong tone={due > 0 ? 'danger' : 'success'} />
      </Card>

      <FormError message={error} />
      <div className="stack-sm">
        {!cancelled && due > 0 ? (
          <Button
            label={`Mark fully paid (+${money(due)})`}
            icon={IoCashOutline}
            disabled={saving}
            onClick={() => run(() => updateBooking(booking.id, { paid: booking.price }))}
          />
        ) : null}
        {!cancelled ? <Button label="Cancel booking" icon={IoCloseCircleOutline} variant="soft" disabled={saving} onClick={cancel} /> : null}
        <Button label="Delete booking" icon={IoTrashOutline} variant="danger" disabled={saving} onClick={remove} />
      </div>
    </SubPage>
  );
}

function Row({ label, value, strong, tone, href }: { label: string; value: string; strong?: boolean; tone?: 'danger' | 'success'; href?: string }) {
  const className = cx('fact-value', strong && 'fact-value--strong', tone && `text-${tone}`);
  return (
    <div className="fact">
      <span className="t-caption">{label}</span>
      {href ? (
        <a href={href} className={cx(className, 'text-link')}>
          {value}
        </a>
      ) : (
        <span className={className}>{value}</span>
      )}
    </div>
  );
}
