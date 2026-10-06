// App data store backed by Supabase. Everything is loaded once after sign-in and
// kept in memory; each action writes to Supabase first, then updates local state.
import type { Session } from '@supabase/supabase-js';
import { decode } from 'base64-arraybuffer';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { friendlyError, PHOTO_BUCKET, usernameToEmail } from '../lib/backend';
import { supabase } from '../lib/supabase';
import {
  appointmentRow, bookingRow, dressRow, expenseRow, fundingRow, toAppointment, toBooking, toDress, toExpense, toFunding,
  type AppointmentInput, type BookingInput, type BookingPatch, type DressInput, type ExpenseInput, type FundingInput,
} from './rows';
import type { AppData } from './totals';
import type { Appointment, Booking, Dress } from './types';

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
  addFunding: (f: FundingInput) => Promise<void>;
  updateFunding: (id: string, f: FundingInput) => Promise<void>;
  deleteFunding: (id: string) => Promise<void>;
  addDress: (d: DressInput, photo?: PhotoInput) => Promise<Dress>;
  updateDress: (id: string, d: DressInput, photo?: PhotoInput) => Promise<void>;
  deleteDress: (id: string) => Promise<void>;
  addExpense: (e: ExpenseInput) => Promise<void>;
  updateExpense: (id: string, e: ExpenseInput) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addBooking: (b: BookingInput) => Promise<Booking>;
  updateBooking: (id: string, patch: BookingPatch) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  addAppointment: (a: AppointmentInput) => Promise<Appointment>;
  updateAppointment: (id: string, a: AppointmentInput) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
};

const empty: AppData = { funding: [], dresses: [], expenses: [], bookings: [], appointments: [] };
const PHOTO_URL_TTL = 60 * 60 * 24 * 7; // signed photo links last a week

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

const sortAppointments = (list: Appointment[]) =>
  [...list].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

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
      const [funding, dresses, expenses, bookings, appointments] = await Promise.all([
        supabase.from('funding').select('*').order('date', { ascending: false }),
        supabase.from('dresses').select('*').order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').order('date', { ascending: false }),
        supabase.from('bookings').select('*').order('event_date'),
        supabase.from('appointments').select('*').order('date').order('start_time'),
      ]);
      for (const res of [funding, dresses, expenses, bookings, appointments]) fail(res.error);
      setData({
        funding: (funding.data ?? []).map(toFunding),
        dresses: await signPhotos((dresses.data ?? []).map(toDress)),
        expenses: (expenses.data ?? []).map(toExpense),
        bookings: (bookings.data ?? []).map(toBooking),
        appointments: (appointments.data ?? []).map(toAppointment),
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

  const addFunding = useCallback(async (f: FundingInput) => {
    const { data: row, error } = await supabase.from('funding').insert(fundingRow(f)).select().single();
    fail(error);
    setData((d) => ({ ...d, funding: [toFunding(row), ...d.funding] }));
  }, []);

  const updateFunding = useCallback(async (id: string, f: FundingInput) => {
    const { data: row, error } = await supabase.from('funding').update(fundingRow(f)).eq('id', id).select().single();
    fail(error);
    setData((d) => ({ ...d, funding: d.funding.map((x) => (x.id === id ? toFunding(row) : x)) }));
  }, []);

  const deleteFunding = useCallback(async (id: string) => {
    const { error } = await supabase.from('funding').delete().eq('id', id);
    fail(error);
    setData((d) => ({ ...d, funding: d.funding.filter((x) => x.id !== id) }));
  }, []);

  const addExpense = useCallback(async (e: ExpenseInput) => {
    const { data: row, error } = await supabase.from('expenses').insert(expenseRow(e)).select().single();
    fail(error);
    setData((d) => ({ ...d, expenses: [toExpense(row), ...d.expenses] }));
  }, []);

  const updateExpense = useCallback(async (id: string, e: ExpenseInput) => {
    const { data: row, error } = await supabase.from('expenses').update(expenseRow(e)).eq('id', id).select().single();
    fail(error);
    setData((d) => ({ ...d, expenses: d.expenses.map((x) => (x.id === id ? toExpense(row) : x)) }));
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    fail(error);
    setData((d) => ({ ...d, expenses: d.expenses.filter((x) => x.id !== id) }));
  }, []);

  /** Uploads a dress photo and records its path. The dress row must already exist. */
  const attachPhoto = useCallback(
    async (dress: Dress, photo: PhotoInput): Promise<Dress> => {
      if (!userId) return dress;
      const ext = photo.mimeType === 'image/png' ? 'png' : 'jpg';
      const path = `${userId}/${dress.id}.${ext}`;
      const upload = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, decode(photo.base64), { contentType: photo.mimeType, upsert: true });
      if (upload.error) throw new Error(`Saved, but the photo failed to upload: ${friendlyError(upload.error)}`);
      const { error } = await supabase.from('dresses').update({ photo_path: path }).eq('id', dress.id);
      fail(error);
      // A photo with a different file type would otherwise leave the old file behind.
      if (dress.photoPath && dress.photoPath !== path) await supabase.storage.from(PHOTO_BUCKET).remove([dress.photoPath]);
      const [signed] = await signPhotos([{ ...dress, photoPath: path }]);
      return signed;
    },
    [userId],
  );

  const replaceDress = (dress: Dress) =>
    setData((d) => ({ ...d, dresses: d.dresses.map((x) => (x.id === dress.id ? dress : x)) }));

  const addDress = useCallback(
    async (input: DressInput, photo?: PhotoInput) => {
      const { data: row, error } = await supabase.from('dresses').insert(dressRow(input)).select().single();
      fail(error);
      let dress = toDress(row);
      setData((d) => ({ ...d, dresses: [dress, ...d.dresses] }));
      if (photo) {
        // The dress is already saved; a failed photo upload should not lose it.
        try {
          dress = await attachPhoto(dress, photo);
          replaceDress(dress);
        } catch {}
      }
      return dress;
    },
    [attachPhoto],
  );

  const updateDress = useCallback(
    async (id: string, input: DressInput, photo?: PhotoInput) => {
      const { data: row, error } = await supabase.from('dresses').update(dressRow(input)).eq('id', id).select().single();
      fail(error);
      const [dress] = await signPhotos([toDress(row)]);
      replaceDress(dress);
      if (photo) replaceDress(await attachPhoto(dress, photo));
    },
    [attachPhoto],
  );

  const deleteDress = useCallback(
    async (id: string) => {
      const count = data.bookings.filter((b) => b.dressId === id).length;
      if (count) {
        throw new Error(`This dress has ${count} booking${count > 1 ? 's' : ''} in its history. Delete those bookings first.`);
      }
      const photoPath = data.dresses.find((x) => x.id === id)?.photoPath;
      const { error } = await supabase.from('dresses').delete().eq('id', id);
      fail(error);
      if (photoPath) await supabase.storage.from(PHOTO_BUCKET).remove([photoPath]);
      setData((d) => ({ ...d, dresses: d.dresses.filter((x) => x.id !== id) }));
    },
    [data.bookings, data.dresses],
  );

  const addBooking = useCallback(async (b: BookingInput) => {
    const { data: row, error } = await supabase.from('bookings').insert(bookingRow(b)).select().single();
    fail(error);
    const booking = toBooking(row);
    setData((d) => ({ ...d, bookings: [...d.bookings, booking] }));
    return booking;
  }, []);

  const updateBooking = useCallback(async (id: string, patch: BookingPatch) => {
    const { data: row, error } = await supabase.from('bookings').update(bookingRow(patch)).eq('id', id).select().single();
    fail(error);
    const updated = toBooking(row);
    setData((d) => ({ ...d, bookings: d.bookings.map((b) => (b.id === id ? updated : b)) }));
  }, []);

  const deleteBooking = useCallback(async (id: string) => {
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    fail(error);
    setData((d) => ({ ...d, bookings: d.bookings.filter((b) => b.id !== id) }));
  }, []);

  const addAppointment = useCallback(async (a: AppointmentInput) => {
    const { data: row, error } = await supabase.from('appointments').insert(appointmentRow(a)).select().single();
    fail(error);
    const appointment = toAppointment(row);
    setData((d) => ({ ...d, appointments: sortAppointments([...d.appointments, appointment]) }));
    return appointment;
  }, []);

  const updateAppointment = useCallback(async (id: string, a: AppointmentInput) => {
    const { data: row, error } = await supabase.from('appointments').update(appointmentRow(a)).eq('id', id).select().single();
    fail(error);
    const updated = toAppointment(row);
    setData((d) => ({ ...d, appointments: sortAppointments(d.appointments.map((x) => (x.id === id ? updated : x))) }));
  }, []);

  const deleteAppointment = useCallback(async (id: string) => {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    fail(error);
    setData((d) => ({ ...d, appointments: d.appointments.filter((x) => x.id !== id) }));
  }, []);

  const value = useMemo(
    () => ({
      ...data, session, authReady, loading, loadError, reload, signIn, signOut,
      addFunding, updateFunding, deleteFunding, addExpense, updateExpense, deleteExpense,
      addDress, updateDress, deleteDress, addBooking, updateBooking, deleteBooking,
      addAppointment, updateAppointment, deleteAppointment,
    }),
    [
      data, session, authReady, loading, loadError, reload, signIn, signOut,
      addFunding, updateFunding, deleteFunding, addExpense, updateExpense, deleteExpense,
      addDress, updateDress, deleteDress, addBooking, updateBooking, deleteBooking,
      addAppointment, updateAppointment, deleteAppointment,
    ],
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
