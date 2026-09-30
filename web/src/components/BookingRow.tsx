import type { Booking } from '@mobile/src/data/types';
import { money, shortDate } from '@mobile/src/lib/format';
import { Link } from 'react-router';

import { useDress } from '../data/store';
import { DressThumb } from './DressThumb';
import { Badge, cx } from './ui';

export function BookingRow({ booking, hint }: { booking: Booking; hint?: string }) {
  const dress = useDress(booking.dressId);
  const due = booking.price - booking.paid;
  const cancelled = booking.status === 'cancelled';
  return (
    <Link to={`/booking/${booking.id}`} className="row-link booking-row">
      <DressThumb dress={dress ?? { color: 'var(--surface-alt)' }} size={44} />
      <div className="booking-main">
        <span className={cx('t-heading', 'truncate', cancelled && 'struck')}>{booking.customerName}</span>
        <span className="t-caption truncate">{dress?.name ?? 'Deleted dress'}</span>
        <span className="booking-date">
          {shortDate(booking.eventDate)}
          {hint ? `  ·  ${hint}` : ''}
        </span>
      </div>
      <div className="booking-side">
        {cancelled ? <Badge label="Cancelled" tone="danger" /> : null}
        <span className="booking-price">{money(booking.price)}</span>
        {!cancelled && due > 0 ? <span className="booking-due">{money(due)} due</span> : null}
        {!cancelled && due <= 0 ? <span className="booking-paid">Paid</span> : null}
      </div>
    </Link>
  );
}
