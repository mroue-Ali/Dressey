import type { Booking, Dress } from '@mobile/src/data/types';
import { dayState, reasonLabel, type DayState } from '@mobile/src/lib/availability';
import { shortDate, todayISO } from '@mobile/src/lib/format';

import type { DayLook } from './MonthCalendar';

const looks = {
  free: { background: 'var(--success-soft)', color: 'var(--success)' },
  event: { background: 'var(--danger-soft)', color: 'var(--danger)' },
  buffer: { background: 'var(--warning-soft)', color: 'var(--warning)' },
  tooClose: { background: 'var(--surface-alt)', color: 'var(--text-muted)', crossed: true },
} satisfies Record<string, DayLook>;

export function lookForState(state: DayState): DayLook {
  if (state.kind === 'free') return looks.free;
  if (state.kind === 'tooClose') return looks.tooClose;
  return state.reason === 'event' ? looks.event : looks.buffer;
}

/** Calendar colouring for one dress; past days stay plain. */
export function dressDayLook(bookings: Booking[], dress: Dress, ignoreId?: string) {
  const today = todayISO();
  return (iso: string): DayLook | undefined => {
    const state = dayState(bookings, dress.id, iso, ignoreId);
    if (iso < today && state.kind !== 'busy') return undefined;
    return lookForState(state);
  };
}

export function describeState(state: DayState): string {
  if (state.kind === 'free') return 'Available';
  const who = state.booking.customerName;
  const when = shortDate(state.booking.eventDate);
  if (state.kind === 'tooClose') return `Too close to ${who}'s rental on ${when}`;
  if (state.reason === 'event') return `Rented by ${who}`;
  return `${reasonLabel[state.reason]} · ${who}'s rental on ${when}`;
}

export function Legend() {
  const items = [
    { label: 'Free', ...looks.free },
    { label: 'Rented', ...looks.event },
    { label: 'Pickup / return / cleaning', ...looks.buffer },
    { label: 'Too close', ...looks.tooClose },
  ];
  return (
    <ul className="legend">
      {items.map((i) => (
        <li key={i.label}>
          <span className="legend-swatch" style={{ background: i.background, borderColor: i.color }} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}
