import { totals } from '@mobile/src/data/totals';
import { emailToUsername } from '@mobile/src/lib/backend';
import { canBook } from '@mobile/src/lib/availability';
import { isSameMonth, money, shiftISO, todayISO } from '@mobile/src/lib/format';
import { IoCalendarOutline, IoCheckmarkCircleOutline, IoHourglassOutline, IoSearch, IoShirtOutline, IoWalletOutline } from 'react-icons/io5';

import { BookingRow } from '../components/BookingRow';
import { Button, Card, EmptyState, Screen, SectionHeader, StatCard } from '../components/ui';
import { useStore } from '../data/store';

export function HomePage() {
  const data = useStore();
  const { dresses, bookings, funding, signOut, session } = data;
  const now = new Date();
  const today = todayISO();
  const active = bookings.filter((b) => b.status === 'booked');

  const pickups = active.filter((b) => shiftISO(b.eventDate, -1) === today);
  const events = active.filter((b) => b.eventDate === today);
  const returns = active.filter((b) => shiftISO(b.eventDate, 1) === today);
  const upcoming = active
    .filter((b) => b.eventDate > shiftISO(today, 1))
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
    .slice(0, 4);

  const cash = totals(data).cash;
  const month = totals(data, (iso) => isSameMonth(iso, now));
  const freeToday = dresses.filter((d) => canBook(bookings, d.id, today)).length;
  const due = active.reduce((s, b) => s + Math.max(b.price - b.paid, 0), 0);

  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const todayCount = pickups.length + events.length + returns.length;

  return (
    <Screen
      title="Home"
      brand
      actions={dresses.length ? <Button label="Check a date" icon={IoSearch} to="/schedule" /> : null}
    >
      <div className="summary">
        <Card className="hero">
          <span className="hero-label">Cash in the business</span>
          <span className="hero-value">{money(cash)}</span>
          <span className="hero-sub">This month: {money(month.rentals)} from rentals · {money(month.expenses)} expenses</span>
        </Card>
        <div className="stats">
          <StatCard label="Free today" value={`${freeToday}/${dresses.length}`} icon={IoCheckmarkCircleOutline} tone="success" />
          <StatCard label="Bookings" value={String(active.filter((b) => b.eventDate >= today).length)} icon={IoCalendarOutline} tone="info" />
          <StatCard label="Still owed" value={money(due)} icon={IoHourglassOutline} tone="warning" />
        </div>
      </div>

      {!dresses.length ? (
        <Card className="stack start-card">
          <h2 className="t-title">Let's get started</h2>
          <p className="muted">
            {funding.length ? 'Now add the dresses you have — bought, personal or gifts.' : 'First record the money you started with, then add your dresses.'}
          </p>
          {!funding.length ? <Button label="Add starter funding" icon={IoWalletOutline} to="/funding/new" /> : null}
          <Button label="Add a dress" icon={IoShirtOutline} variant={funding.length ? 'solid' : 'soft'} to="/dress/new" />
        </Card>
      ) : null}

      <div className="columns">
        <section className="stack">
          <SectionHeader title="Today" note={dateLabel} />
          <Card>
            {todayCount ? (
              <>
                {pickups.map((b) => <BookingRow key={`p${b.id}`} booking={b} hint="Pickup today" />)}
                {events.map((b) => <BookingRow key={`e${b.id}`} booking={b} hint="Event today" />)}
                {returns.map((b) => <BookingRow key={`r${b.id}`} booking={b} hint="Return today" />)}
              </>
            ) : (
              <EmptyState text="Nothing to hand over or collect today" />
            )}
          </Card>
        </section>
        <section className="stack">
          <SectionHeader title="Coming up" action={{ label: 'Schedule', to: '/schedule' }} />
          <Card>{upcoming.length ? upcoming.map((b) => <BookingRow key={b.id} booking={b} />) : <EmptyState text="Nothing scheduled" />}</Card>
        </section>
      </div>

      {/* Wide screens have this in the sidebar. */}
      <p className="signout-line only-narrow">
        Signed in as {emailToUsername(session?.user.email)} ·{' '}
        <button type="button" className="link-btn" onClick={signOut}>
          Sign out
        </button>
      </p>
    </Screen>
  );
}
