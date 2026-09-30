import type { Booking, Dress } from '@mobile/src/data/types';
import { availabilityOn, dayState, nearestFreeDays } from '@mobile/src/lib/availability';
import { longDate, money, parseISODate, shiftISO, shortDate, todayISO } from '@mobile/src/lib/format';
import { useState } from 'react';
import { IoAdd, IoTodayOutline } from 'react-icons/io5';
import { Link, useSearchParams } from 'react-router';

import { describeState, dressDayLook, Legend } from '../components/Availability';
import { BookingRow } from '../components/BookingRow';
import { DressThumb } from '../components/DressThumb';
import { MonthCalendar } from '../components/MonthCalendar';
import { Button, Card, cx, EmptyState, Screen, SectionHeader } from '../components/ui';
import { useStore } from '../data/store';

type Mode = 'date' | 'dress';

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function bookHref(dressId: string, date: string) {
  return `/booking/new?${new URLSearchParams({ dressId, date })}`;
}

function FreeDays({ label, dressId, days }: { label: string; dressId: string; days: string[] }) {
  if (!days.length) return null;
  return (
    <div className="suggest-row">
      <span className="t-caption">{label}</span>
      {days.map((iso) => (
        <Link key={iso} to={bookHref(dressId, iso)} className="suggest">
          {shortDate(iso)}
        </Link>
      ))}
    </div>
  );
}

export function SchedulePage() {
  const { dresses, bookings } = useStore();
  // Kept in the URL so coming back from a booking shows the same day and dress.
  const [params, setParams] = useSearchParams();
  const mode: Mode = params.get('mode') === 'dress' ? 'dress' : 'date';
  const dateParam = params.get('date');
  const selected = dateParam && ISO_DAY.test(dateParam) ? dateParam : todayISO();
  const [month, setMonth] = useState(() => parseISODate(selected));

  const active = bookings.filter((b) => b.status === 'booked');
  const dress = dresses.find((d) => d.id === params.get('dress')) ?? dresses[0];

  const update = (changes: Record<string, string>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(changes)) next.set(k, v);
        return next;
      },
      { replace: true },
    );

  const jumpToToday = () => {
    update({ date: todayISO() });
    setMonth(new Date());
  };

  return (
    <Screen title="Schedule" subtitle="Check a date, answer the customer">
      <div className="split">
        <div className="stack split-aside">
          <div className="segment" role="tablist">
            {(['date', 'dress'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                className={cx('segment-item', mode === m && 'segment-item--active')}
                onClick={() => update({ mode: m })}
              >
                {m === 'date' ? 'By date' : 'By dress'}
              </button>
            ))}
          </div>

          {mode === 'dress' && dresses.length ? (
            <div className="picker" aria-label="Dress">
              {dresses.map((d) => {
                const on = d.id === dress?.id;
                return (
                  <button key={d.id} type="button" className={cx('pick', on && 'pick--active')} aria-pressed={on} onClick={() => update({ dress: d.id })}>
                    <DressThumb dress={d} size={56} />
                    <span className="pick-name">{d.name}</span>
                  </button>
                );
              })}
            </div>
          ) : null}

          <Card>
            <MonthCalendar
              month={month}
              onMonthChange={setMonth}
              selected={selected}
              onSelect={(iso) => update({ date: iso })}
              dayLook={
                mode === 'dress' && dress
                  ? dressDayLook(bookings, dress)
                  : (iso) => {
                      const n = active.filter((b) => b.eventDate === iso).length;
                      return n ? { dots: n } : undefined;
                    }
              }
            />
            {mode === 'dress' ? <Legend /> : null}
          </Card>
        </div>

        <div className="stack">
          {mode === 'date' ? (
            <ByDate selected={selected} dresses={dresses} bookings={bookings} onJumpToToday={jumpToToday} />
          ) : dress ? (
            <ByDress selected={selected} dress={dress} bookings={bookings} />
          ) : (
            <EmptyState text="Add a dress first" />
          )}
        </div>
      </div>
    </Screen>
  );
}

function ByDate({ selected, dresses, bookings, onJumpToToday }: { selected: string; dresses: Dress[]; bookings: Booking[]; onJumpToToday: () => void }) {
  const today = todayISO();
  const list = availabilityOn(dresses, bookings, selected);
  const free = list.filter((a) => a.state.kind === 'free');
  const taken = list.filter((a) => a.state.kind !== 'free');
  const past = selected < today;

  const active = bookings.filter((b) => b.status === 'booked');
  const pickups = active.filter((b) => shiftISO(b.eventDate, -1) === selected);
  const events = active.filter((b) => b.eventDate === selected);
  const returns = active.filter((b) => shiftISO(b.eventDate, 1) === selected);

  return (
    <>
      <div className="day-summary">
        <h2 className="t-title">{longDate(selected)}</h2>
        {!past ? (
          <p className={cx('day-summary-count', free.length ? 'text-success' : 'text-danger')}>
            {free.length} of {dresses.length} dresses available
          </p>
        ) : (
          <p className="t-caption">This day has passed</p>
        )}
      </div>

      {!past && free.length ? (
        <Card className="list">
          {free.map(({ dress }) => (
            <div key={dress.id} className="dress-row">
              <Link to={`/dress/${dress.id}`} aria-label={dress.name}>
                <DressThumb dress={dress} size={48} />
              </Link>
              <div className="dress-row-main">
                <span className="t-heading truncate">{dress.name}</span>
                <span className="t-caption">
                  {[dress.size && `Size ${dress.size}`, dress.rentalPrice ? money(dress.rentalPrice) : null].filter(Boolean).join(' · ')}
                </span>
              </div>
              <Link to={bookHref(dress.id, selected)} className="pill-btn">
                Book
              </Link>
            </div>
          ))}
        </Card>
      ) : null}

      {!past && taken.length ? (
        <>
          <SectionHeader title="Not available" />
          <Card className="list">
            {taken.map(({ dress, state }) => (
              <div key={dress.id} className="stack-sm">
                <div className="dress-row">
                  <DressThumb dress={dress} size={48} dim />
                  <div className="dress-row-main">
                    <span className="t-heading truncate muted">{dress.name}</span>
                    <span className="reason">{describeState(state)}</span>
                  </div>
                </div>
                <FreeDays label="Free on" dressId={dress.id} days={nearestFreeDays(bookings, dress.id, selected, today)} />
              </div>
            ))}
          </Card>
        </>
      ) : null}

      {pickups.length + events.length + returns.length ? (
        <>
          <SectionHeader title="On this day" />
          <Card>
            {pickups.map((b) => <BookingRow key={`p${b.id}`} booking={b} hint="Pickup" />)}
            {events.map((b) => <BookingRow key={`e${b.id}`} booking={b} hint="Event" />)}
            {returns.map((b) => <BookingRow key={`r${b.id}`} booking={b} hint="Return" />)}
          </Card>
        </>
      ) : null}

      {!dresses.length ? <EmptyState text="Add dresses to see availability" /> : null}
      {past ? <Button label="Jump to today" icon={IoTodayOutline} onClick={onJumpToToday} /> : null}
    </>
  );
}

function ByDress({ selected, dress, bookings }: { selected: string; dress: Dress; bookings: Booking[] }) {
  const today = todayISO();
  const state = dayState(bookings, dress.id, selected);
  const upcoming = bookings
    .filter((b) => b.dressId === dress.id && b.status === 'booked' && b.eventDate >= today)
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  const suggestions = state.kind === 'free' ? [] : nearestFreeDays(bookings, dress.id, selected, today);

  return (
    <>
      <Card className="stack">
        <span className="t-caption">{longDate(selected)}</span>
        <p className={cx('state-text', state.kind === 'free' ? 'text-success' : 'text-danger')}>
          {selected < today ? 'Past date' : describeState(state)}
        </p>
        {state.kind === 'free' && selected >= today ? (
          <Button label={`Book on ${shortDate(selected)}`} icon={IoAdd} to={bookHref(dress.id, selected)} />
        ) : null}
        <FreeDays label="Nearest free days" dressId={dress.id} days={suggestions} />
      </Card>

      <SectionHeader title="Upcoming rentals" action={{ label: 'Dress details', to: `/dress/${dress.id}` }} />
      <Card>
        {upcoming.length ? upcoming.map((b) => <BookingRow key={b.id} booking={b} />) : <EmptyState text="No upcoming rentals" />}
      </Card>
    </>
  );
}
