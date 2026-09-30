// Supabase row <-> app type mapping (snake_case DB rows, camelCase app types).
// Plain TypeScript, no React Native: the web app (web/) imports this file too.
import { toISODate } from '../lib/format';
import type { Booking, Dress, Expense, Funding } from './types';

export type FundingInput = Omit<Funding, 'id'>;
export type ExpenseInput = Omit<Expense, 'id'>;
export type DressInput = Omit<Dress, 'id' | 'addedAt' | 'photoPath' | 'photoUri'>;
export type BookingInput = Omit<Booking, 'id' | 'createdAt' | 'status'>;
export type BookingPatch = Partial<BookingInput & Pick<Booking, 'status'>>;

export type Row = Record<string, any>;
const opt = (v: unknown) => (v === null || v === undefined || v === '' ? undefined : (v as string));
const num = (v: unknown) => Number(v ?? 0);

export const toFunding = (r: Row): Funding => ({
  id: r.id, source: r.source, fromName: r.from_name ?? '', amount: num(r.amount), date: r.date, note: opt(r.note),
});
export const toExpense = (r: Row): Expense => ({
  id: r.id, category: r.category, amount: num(r.amount), date: r.date, note: opt(r.note),
});
export const toDress = (r: Row): Dress => ({
  id: r.id, name: r.name, origin: r.origin, shop: opt(r.shop), purchasePrice: num(r.purchase_price),
  rentalPrice: num(r.rental_price), size: opt(r.size), photoPath: opt(r.photo_path), color: r.color,
  addedAt: r.added_at, note: opt(r.note),
});
export const toBooking = (r: Row): Booking => ({
  id: r.id, dressId: r.dress_id, customerName: r.customer_name, customerPhone: opt(r.customer_phone),
  eventDate: r.event_date, price: num(r.price), paid: num(r.paid), status: r.status,
  createdAt: toISODate(new Date(r.created_at)), note: opt(r.note),
});

export const fundingRow = (f: FundingInput) => ({ source: f.source, from_name: f.fromName, amount: f.amount, date: f.date, note: f.note ?? null });
export const expenseRow = (e: ExpenseInput) => ({ category: e.category, amount: e.amount, date: e.date, note: e.note ?? null });
export const dressRow = (d: DressInput) => ({
  name: d.name, origin: d.origin, shop: d.shop ?? null, purchase_price: d.purchasePrice, rental_price: d.rentalPrice,
  size: d.size ?? null, color: d.color, note: d.note ?? null,
});
const BOOKING_COLUMNS: Record<string, string> = {
  dressId: 'dress_id', customerName: 'customer_name', customerPhone: 'customer_phone', eventDate: 'event_date',
  price: 'price', paid: 'paid', note: 'note', status: 'status',
};
export function bookingRow(b: BookingPatch): Row {
  const row: Row = {};
  for (const [k, v] of Object.entries(b)) if (BOOKING_COLUMNS[k]) row[BOOKING_COLUMNS[k]] = v ?? null;
  return row;
}
