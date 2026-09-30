import type { ComponentType } from 'react';
import { IoRefresh } from 'react-icons/io5';
import { Navigate, Route, Routes, useParams } from 'react-router';

import { Shell } from './components/Shell';
import { SignIn } from './components/SignIn';
import { Button, Spinner } from './components/ui';
import { Wordmark } from './components/Wordmark';
import { useStore } from './data/store';
import { BookingFormPage } from './pages/BookingFormPage';
import { BookingPage } from './pages/BookingPage';
import { DressesPage } from './pages/DressesPage';
import { DressFormPage } from './pages/DressFormPage';
import { DressPage } from './pages/DressPage';
import { ExpenseFormPage } from './pages/ExpenseFormPage';
import { FinancePage } from './pages/FinancePage';
import { FundingFormPage } from './pages/FundingFormPage';
import { HomePage } from './pages/HomePage';
import { SchedulePage } from './pages/SchedulePage';

/** One form serves "new" and ":id/edit"; the key makes it start fresh for each item. */
function Form({ page: Page }: { page: ComponentType }) {
  const { id = 'new' } = useParams();
  return <Page key={id} />;
}

function Loading() {
  return (
    <main className="centered loading">
      <Wordmark width={220} />
      <Spinner />
    </main>
  );
}

export function App() {
  const { authReady, session, loading, loadError, reload, signOut, dresses, bookings } = useStore();
  if (!authReady) return <Loading />;
  if (!session) return <SignIn />;
  if (loadError) {
    return (
      <main className="centered">
        <div className="load-error">
          <h1 className="t-title">Couldn't load your data</h1>
          <p className="t-caption">{loadError}</p>
          <Button label="Try again" icon={IoRefresh} onClick={reload} />
          <Button label="Sign out" variant="soft" onClick={signOut} />
        </div>
      </main>
    );
  }
  // First load after sign-in; later reloads keep showing the current data.
  if (loading && !dresses.length && !bookings.length) return <Loading />;

  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<HomePage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="dresses" element={<DressesPage />} />
        <Route path="finance" element={<FinancePage />} />
        <Route path="dress/new" element={<Form page={DressFormPage} />} />
        <Route path="dress/:id" element={<DressPage />} />
        <Route path="dress/:id/edit" element={<Form page={DressFormPage} />} />
        <Route path="booking/new" element={<Form page={BookingFormPage} />} />
        <Route path="booking/:id" element={<BookingPage />} />
        <Route path="booking/:id/edit" element={<Form page={BookingFormPage} />} />
        <Route path="funding/new" element={<Form page={FundingFormPage} />} />
        <Route path="funding/:id/edit" element={<Form page={FundingFormPage} />} />
        <Route path="expense/new" element={<Form page={ExpenseFormPage} />} />
        <Route path="expense/:id/edit" element={<Form page={ExpenseFormPage} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
