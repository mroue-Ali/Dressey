// App data store backed by Supabase. Everything is loaded once after sign-in and
// kept in memory; each action writes to Supabase first, then updates local state.
import type { Session } from '@supabase/supabase-js';
import { decode } from 'base64-arraybuffer';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { toISODate } from '../lib/format';
import { friendlyError, PHOTO_BUCKET, supabase, usernameToEmail } from '../lib/supabase';
import type { Booking, Dress, Expense, Funding } from './types';

export type AppData = {
  funding: Funding[];
  dresses: Dress[];
  expenses: Expense[];
  bookings: Booking[];
};

/** A picked photo, as base64 JPEG/PNG data. */
export type PhotoInput = { base64: string; mimeType: string };

type Store = AppData & {
  session: Session | null;
  authReady: boolean;
  loading: boolean;
  loadError: string | null;
  reload: () => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  addFunding: (f: Omit<Funding, 'id'>) => Promise<void>;
  addDress: (d: Omit<Dress, 'id' | 'addedAt' | 'photoPath' | 'photoUri'>, photo?: PhotoInput) => Promise<Dress>;
  addExpense: (e: Omit<Expense, 'id'>) => Promise<void>;
  addBooking: (b: Omit<Booking, 'id' | 'createdAt' | 'status'>) => Promise<Booking>;
  updateBooking: (id: string, patch: Partial<Pick<Booking, 'paid' | 'status'>>) => Promise<void>;
};

const empty: AppData = { funding: [], dresses: [], expenses: [], bookings: [] };
const PHOTO_URL_TTL = 60 * 60 * 24 * 7; // signed photo links last a week

// --- Row mapping (snake_case DB rows <-> app types) ---

type Row = Record<string, any>;
const opt = (v: unknown) => (v === null || v === undefined || v === '' ? undefined : (v as string));
const num = (v: unknown) => Number(v ?? 0);

const toFunding = (r: Row): Funding => ({
  id: r.id, source: r.source, fromName: r.from_name ?? '', amount: num(r.amount), date: r.date, note: opt(r.note),
});
const toExpense = (r: Row): Expense => ({
  id: r.id, category: r.category, amount: num(r.amount), date: r.date, note: opt(r.note),
});
const toDress = (r: Row): Dress => ({
  id: r.id, name: r.name, origin: r.origin, shop: opt(r.shop), purchasePrice: num(r.purchase_price),
  rentalPrice: num(r.rental_price), size: opt(r.size), photoPath: opt(r.photo_path), color: r.color,
  addedAt: r.added_at, note: opt(r.note),
});
const toBooking = (r: Row): Booking => ({
  id: r.id, dressId: r.dress_id, customerName: r.customer_name, customerPhone: opt(r.customer_phone),
  eventDate: r.event_date, price: num(r.price), paid: num(r.paid), status: r.status,
  createdAt: toISODate(new Date(r.created_at)), note: opt(r.note),
});

function fail(error: { code?: string; message: string } | null): asserts error is null {
  if (error) throw new Error(friendlyError(error));
}

async function signPhotos(dresses: Dress[]): Promise<Dress[]> {
  const paths = dresses.map((d) => d.photoPath).filter((p): p is string => !!p);
  if (!paths.length) return dresses;
  const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, PHOTO_URL_TTL);
  const byPath = new Map((data ?? []).map((s) => [s.path, s.signedUrl]));
  return dresses.map((d) => (d.photoPath ? { ...d, photoUri: byPath.get(d.photoPath) ?? undefined } : d));
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [data, setData] = useState<AppData>(empty);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [funding, dresses, expenses, bookings] = await Promise.all([
        supabase.from('funding').select('*').order('date', { ascending: false }),
        supabase.from('dresses').select('*').order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').order('date', { ascending: false }),
        supabase.from('bookings').select('*').order('event_date'),
      ]);
      for (const res of [funding, dresses, expenses, bookings]) fail(res.error);
      setData({
        funding: (funding.data ?? []).map(toFunding),
        dresses: await signPhotos((dresses.data ?? []).map(toDress)),
        expenses: (expenses.data ?? []).map(toExpense),
        bookings: (bookings.data ?? []).map(toBooking),
      });
    } catch (e) {
      setLoadError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) reload();
    else setData(empty);
  }, [userId, reload]);

  const signIn = useCallback(async (username: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: usernameToEmail(username), password });
    if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Wrong username or password.' : friendlyError(error));
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const addFunding = useCallback(async (f: Omit<Funding, 'id'>) => {
    const { data: row, error } = await supabase
      .from('funding')
      .insert({ source: f.source, from_name: f.fromName, amount: f.amount, date: f.date, note: f.note ?? null })
      .select()
      .single();
    fail(error);
    setData((d) => ({ ...d, funding: [toFunding(row), ...d.funding] }));
  }, []);

  const addDress = useCallback(
    async (input: Omit<Dress, 'id' | 'addedAt' | 'photoPath' | 'photoUri'>, photo?: PhotoInput) => {
      const { data: row, error } = await supabase
        .from('dresses')
        .insert({
          name: input.name,
          origin: input.origin,
          shop: input.shop ?? null,
          purchase_price: input.purchasePrice,
          rental_price: input.rentalPrice,
          size: input.size ?? null,
          color: input.color,
          note: input.note ?? null,
        })
        .select()
        .single();
      fail(error);
      let dress = toDress(row);

      if (photo && userId) {
        const ext = photo.mimeType === 'image/png' ? 'png' : 'jpg';
        const path = `${userId}/${dress.id}.${ext}`;
        const upload = await supabase.storage
          .from(PHOTO_BUCKET)
          .upload(path, decode(photo.base64), { contentType: photo.mimeType, upsert: true });
        // The dress is already saved; a failed photo upload should not lose it.
        if (!upload.error) {
          const { error: updateError } = await supabase.from('dresses').update({ photo_path: path }).eq('id', dress.id);
          if (!updateError) [dress] = await signPhotos([{ ...dress, photoPath: path }]);
        }
      }

      setData((d) => ({ ...d, dresses: [dress, ...d.dresses] }));
      return dress;
    },
    [userId],
  );

  const addExpense = useCallback(async (e: Omit<Expense, 'id'>) => {
    const { data: row, error } = await supabase
      .from('expenses')
      .insert({ category: e.category, amount: e.amount, date: e.date, note: e.note ?? null })
      .select()
      .single();
    fail(error);
    setData((d) => ({ ...d, expenses: [toExpense(row), ...d.expenses] }));
  }, []);

  const addBooking = useCallback(async (b: Omit<Booking, 'id' | 'createdAt' | 'status'>) => {
    const { data: row, error } = await supabase
      .from('bookings')
      .insert({
        dress_id: b.dressId,
        customer_name: b.customerName,
        customer_phone: b.customerPhone ?? null,
        event_date: b.eventDate,
        price: b.price,
        paid: b.paid,
        note: b.note ?? null,
      })
      .select()
      .single();
    fail(error);
    const booking = toBooking(row);
    setData((d) => ({ ...d, bookings: [...d.bookings, booking] }));
    return booking;
  }, []);

  const updateBooking = useCallback(async (id: string, patch: Partial<Pick<Booking, 'paid' | 'status'>>) => {
    const { data: row, error } = await supabase.from('bookings').update(patch).eq('id', id).select().single();
    fail(error);
    const updated = toBooking(row);
    setData((d) => ({ ...d, bookings: d.bookings.map((b) => (b.id === id ? updated : b)) }));
  }, []);

  const value = useMemo(
    () => ({
      ...data, session, authReady, loading, loadError, reload, signIn, signOut,
      addFunding, addDress, addExpense, addBooking, updateBooking,
    }),
    [data, session, authReady, loading, loadError, reload, signIn, signOut, addFunding, addDress, addExpense, addBooking, updateBooking],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}

export function useDress(id: string | undefined): Dress | undefined {
  const { dresses } = useStore();
  return dresses.find((d) => d.id === id);
}

/** Money summary. Rental income is what customers actually paid. */
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
