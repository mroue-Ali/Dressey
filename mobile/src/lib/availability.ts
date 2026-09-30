// Dress availability rules.
//
// A rental on event day D keeps the dress busy from D - BLOCK_BEFORE (pickup)
// through D + BLOCK_AFTER (return, then cleaning). A new rental on day X is
// allowed only if X is outside every existing booking's busy window AND no
// existing event falls inside X's own window. With 1 day before / 2 after,
// event dates for the same dress must be at least 3 days apart.
import type { Booking, Dress } from '../data/types';
import { daysBetween, shiftISO } from './format';

export const BLOCK_BEFORE = 1;
export const BLOCK_AFTER = 2;

export type BusyReason = 'pickup' | 'event' | 'return' | 'cleaning';

export type DayState =
  | { kind: 'free' }
  | { kind: 'busy'; reason: BusyReason; booking: Booking }
  // Not inside any window, but a booking here would collide with a nearby event.
  | { kind: 'tooClose'; booking: Booking };

function activeBookings(bookings: Booking[], dressId: string, ignoreId?: string) {
  return bookings.filter((b) => b.dressId === dressId && b.status === 'booked' && b.id !== ignoreId);
}

function reasonFor(offset: number): BusyReason {
  if (offset < 0) return 'pickup';
  if (offset === 0) return 'event';
  if (offset === 1) return 'return';
  return 'cleaning';
}

/** What is happening with a dress on a given day, from the renting point of view. */
export function dayState(bookings: Booking[], dressId: string, iso: string, ignoreId?: string): DayState {
  const mine = activeBookings(bookings, dressId, ignoreId);

  // Prefer showing the event itself, then its surrounding busy days.
  let busy: DayState | null = null;
  for (const b of mine) {
    const offset = daysBetween(b.eventDate, iso); // iso relative to event
    if (offset === 0) return { kind: 'busy', reason: 'event', booking: b };
    if (offset >= -BLOCK_BEFORE && offset <= BLOCK_AFTER && !busy) {
      busy = { kind: 'busy', reason: reasonFor(offset), booking: b };
    }
  }
  if (busy) return busy;

  for (const b of mine) {
    const eventOffset = daysBetween(iso, b.eventDate); // event relative to iso
    if (eventOffset >= -BLOCK_BEFORE && eventOffset <= BLOCK_AFTER) {
      return { kind: 'tooClose', booking: b };
    }
  }
  return { kind: 'free' };
}

export function canBook(bookings: Booking[], dressId: string, iso: string, ignoreId?: string): boolean {
  return dayState(bookings, dressId, iso, ignoreId).kind === 'free';
}

/** Closest bookable days around `iso` (never in the past), nearest first. */
export function nearestFreeDays(
  bookings: Booking[],
  dressId: string,
  iso: string,
  today: string,
  count = 3,
  range = 30,
): string[] {
  const found: string[] = [];
  for (let step = 1; step <= range && found.length < count; step++) {
    for (const candidate of [shiftISO(iso, -step), shiftISO(iso, step)]) {
      if (candidate < today || found.length >= count) continue;
      if (canBook(bookings, dressId, candidate)) found.push(candidate);
    }
  }
  return found.sort();
}

export type DressAvailability = { dress: Dress; state: DayState };

/** Every dress with its state on a day, bookable dresses first. */
export function availabilityOn(dresses: Dress[], bookings: Booking[], iso: string): DressAvailability[] {
  return dresses
    .map((dress) => ({ dress, state: dayState(bookings, dress.id, iso) }))
    .sort((a, b) => Number(a.state.kind !== 'free') - Number(b.state.kind !== 'free'));
}

export const reasonLabel: Record<BusyReason, string> = {
  pickup: 'Pickup day',
  event: 'Rented',
  return: 'Return day',
  cleaning: 'Cleaning',
};
