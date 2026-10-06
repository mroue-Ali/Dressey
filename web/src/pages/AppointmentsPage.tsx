import type { Appointment } from '@mobile/src/data/types';
import { longDate, parseISODate, shiftISO, todayISO } from '@mobile/src/lib/format';
import { useState } from 'react';
import { IoAdd } from 'react-icons/io5';
import { useSearchParams } from 'react-router';

import { AppointmentRow } from '../components/AppointmentRow';
import { MonthCalendar } from '../components/MonthCalendar';
import { Button, Card, cx, EmptyState, Screen, SectionHeader } from '../components/ui';
import { useStore } from '../data/store';

type Mode = 'today' | 'tomorrow' | 'upcoming' | 'day';

const MODES: { value: Mode; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'day', label: 'Pick a day' },
];

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export function AppointmentsPage() {
  const { appointments } = useStore();
  // Kept in the URL so coming back from the form shows the same view.
  const [params, setParams] = useSearchParams();
  const modeParam = params.get('mode');
  const mode: Mode = MODES.some((m) => m.value === modeParam) ? (modeParam as Mode) : 'today';
  const dateParam = params.get('date');
  const today = todayISO();
  const picked = dateParam && ISO_DAY.test(dateParam) ? dateParam : today;
  const [month, setMonth] = useState(() => parseISODate(picked));

  const update = (changes: Record<string, string>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(changes)) next.set(k, v);
        return next;
      },
      { replace: true },
    );

  const on = (iso: string) => appointments.filter((a) => a.date === iso);
  const day = mode === 'today' ? today : mode === 'tomorrow' ? shiftISO(today, 1) : picked;
  const newDate = mode === 'upcoming' ? today : day;

  const groups = new Map<string, Appointment[]>();
  for (const a of appointments.filter((x) => x.date >= today)) groups.set(a.date, [...(groups.get(a.date) ?? []), a]);

  const dayList = on(day);

  return (
    <Screen
      title="Appointments"
      subtitle="Customers coming to try dresses on"
      actions={<Button label="New appointment" icon={IoAdd} to={`/appointment/new?${new URLSearchParams({ date: newDate })}`} />}
    >
      <div className="split">
        <div className="stack split-aside">
          <div className="segment" role="tablist">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                role="tab"
                aria-selected={mode === m.value}
                className={cx('segment-item', mode === m.value && 'segment-item--active')}
                onClick={() => update({ mode: m.value })}
              >
                {m.label}
              </button>
            ))}
          </div>

          {mode === 'day' ? (
            <Card>
              <MonthCalendar
                month={month}
                onMonthChange={setMonth}
                selected={picked}
                onSelect={(iso) => update({ date: iso })}
                dayLook={(iso) => {
                  const n = on(iso).length;
                  return n ? { dots: n } : undefined;
                }}
              />
            </Card>
          ) : null}
        </div>

        <div className="stack">
          {mode === 'upcoming' ? (
            groups.size ? (
              [...groups].map(([iso, list]) => (
                <div key={iso} className="stack-sm">
                  <SectionHeader title={iso === today ? 'Today' : longDate(iso)} note={`${list.length}`} />
                  <Card>{list.map((a) => <AppointmentRow key={a.id} appointment={a} />)}</Card>
                </div>
              ))
            ) : (
              <EmptyState text="No upcoming appointments" />
            )
          ) : (
            <>
              <div className="day-summary">
                <h2 className="t-title">{longDate(day)}</h2>
                <p className="t-caption">
                  {dayList.length ? `${dayList.length} appointment${dayList.length > 1 ? 's' : ''}` : day < today ? 'This day has passed' : 'Nothing scheduled'}
                </p>
              </div>
              {dayList.length ? <Card>{dayList.map((a) => <AppointmentRow key={a.id} appointment={a} />)}</Card> : null}
            </>
          )}
        </div>
      </div>
    </Screen>
  );
}
