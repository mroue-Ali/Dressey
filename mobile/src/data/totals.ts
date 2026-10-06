// Money summary. Plain TypeScript, no React Native: the web app (web/) imports this file too.
import type { Appointment, Booking, Dress, Expense, Funding } from './types';

export type AppData = {
  funding: Funding[];
  dresses: Dress[];
  expenses: Expense[];
  bookings: Booking[];
  appointments: Appointment[];
};

/** Rental income is what customers actually paid. */
export function totals(data: AppData, inPeriod: (iso: string) => boolean = () => true) {
  const funding = data.funding.filter((f) => inPeriod(f.date)).reduce((s, f) => s + f.amount, 0);
  // Money kept from cancelled bookings still counts.
  const rentals = data.bookings.filter((b) => inPeriod(b.createdAt)).reduce((s, b) => s + b.paid, 0);
  const dressPurchases = data.dresses.filter((d) => inPeriod(d.addedAt)).reduce((s, d) => s + d.purchasePrice, 0);
  const expenses = data.expenses.filter((e) => inPeriod(e.date)).reduce((s, e) => s + e.amount, 0);
  return {
    funding,
    rentals,
    dressPurchases,
    expenses,
    moneyIn: funding + rentals,
    moneyOut: dressPurchases + expenses,
    cash: funding + rentals - dressPurchases - expenses,
    profit: rentals - expenses, // earnings from renting, before paying back dress costs
  };
}
