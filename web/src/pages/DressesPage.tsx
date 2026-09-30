import { dressOrigins, labelOf } from '@mobile/src/data/labels';
import type { DressOrigin } from '@mobile/src/data/types';
import { dayState, reasonLabel } from '@mobile/src/lib/availability';
import { money, todayISO } from '@mobile/src/lib/format';
import { IoAdd } from 'react-icons/io5';
import { Link, useSearchParams } from 'react-router';

import { DressThumb } from '../components/DressThumb';
import { Badge, Button, Chip, EmptyState, Screen, type Tone } from '../components/ui';
import { useStore } from '../data/store';

type Filter = 'all' | DressOrigin;

const filters: { value: Filter; label: string }[] = [{ value: 'all', label: 'All' }, ...dressOrigins];

export function DressesPage() {
  const { dresses, bookings } = useStore();
  const [params, setParams] = useSearchParams();
  const filter = (filters.find((f) => f.value === params.get('origin'))?.value ?? 'all') as Filter;
  const today = todayISO();
  const shown = filter === 'all' ? dresses : dresses.filter((d) => d.origin === filter);

  return (
    <Screen
      title="Dresses"
      subtitle={`${dresses.length} in your collection`}
      actions={<Button label="Add dress" icon={IoAdd} to="/dress/new" />}
    >
      <div className="chip-row">
        {filters.map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            active={filter === f.value}
            onClick={() => setParams(f.value === 'all' ? {} : { origin: f.value }, { replace: true })}
          />
        ))}
      </div>

      {!shown.length ? <EmptyState text="No dresses here yet" /> : null}

      <div className="dress-grid">
        {shown.map((d) => {
          const state = dayState(bookings, d.id, today);
          const status: { label: string; tone: Tone } =
            state.kind === 'busy'
              ? { label: reasonLabel[state.reason], tone: state.reason === 'event' ? 'danger' : 'warning' }
              : { label: 'In shop', tone: 'success' };
          return (
            <Link key={d.id} to={`/dress/${d.id}`} className="card dress-card">
              <DressThumb dress={d} className="dress-card-photo" />
              <span className="t-heading truncate">{d.name}</span>
              <span className="dress-card-meta">
                <span className="t-caption">
                  {labelOf(dressOrigins, d.origin)}
                  {d.size ? ` · ${d.size}` : ''}
                </span>
                {d.rentalPrice ? <span className="dress-card-price">{money(d.rentalPrice)}</span> : null}
              </span>
              <Badge label={status.label} tone={status.tone} />
            </Link>
          );
        })}
      </div>
    </Screen>
  );
}
