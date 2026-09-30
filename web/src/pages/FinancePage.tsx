import { expenseCategories, fundingSources, labelOf } from '@mobile/src/data/labels';
import { totals } from '@mobile/src/data/totals';
import { isSameMonth, money, shortDate } from '@mobile/src/lib/format';
import { IoAddCircleOutline, IoArrowDown, IoArrowUp, IoRemoveCircleOutline } from 'react-icons/io5';
import { Link, useSearchParams } from 'react-router';

import { Button, Card, Chip, cx, EmptyState, Screen, SectionHeader } from '../components/ui';
import { useStore } from '../data/store';

// `to` opens where the movement came from, to edit or delete it.
type Entry = { id: string; kind: 'in' | 'out'; title: string; detail: string; amount: number; date: string; to: string };

export function FinancePage() {
  const data = useStore();
  const [params, setParams] = useSearchParams();
  const period = params.get('period') === 'all' ? 'all' : 'month';
  const now = new Date();
  const inPeriod = period === 'month' ? (iso: string) => isSameMonth(iso, now) : () => true;
  const t = totals(data, inPeriod);
  const all = totals(data);

  const dressName = (id: string) => data.dresses.find((d) => d.id === id)?.name ?? 'Dress';
  const entries: Entry[] = [
    ...data.funding.map((f) => ({
      id: f.id, kind: 'in' as const, title: labelOf(fundingSources, f.source), detail: f.fromName || f.note || '',
      amount: f.amount, date: f.date, to: `/funding/${f.id}/edit`,
    })),
    ...data.bookings
      .filter((b) => b.paid > 0)
      .map((b) => ({
        id: b.id, kind: 'in' as const, title: 'Rental', detail: `${b.customerName} · ${dressName(b.dressId)}`,
        amount: b.paid, date: b.createdAt, to: `/booking/${b.id}`,
      })),
    ...data.dresses
      .filter((d) => d.purchasePrice > 0)
      .map((d) => ({
        id: d.id, kind: 'out' as const, title: 'Dress bought', detail: [d.name, d.shop].filter(Boolean).join(' · '),
        amount: d.purchasePrice, date: d.addedAt, to: `/dress/${d.id}`,
      })),
    ...data.expenses.map((e) => ({
      id: e.id, kind: 'out' as const, title: labelOf(expenseCategories, e.category), detail: e.note ?? '',
      amount: e.amount, date: e.date, to: `/expense/${e.id}/edit`,
    })),
  ]
    .filter((e) => inPeriod(e.date))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Screen
      title="Cash Flow"
      subtitle={period === 'month' ? now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'All time'}
      actions={
        <>
          <Button label="Funding" icon={IoAddCircleOutline} variant="soft" to="/funding/new" />
          <Button label="Expense" icon={IoRemoveCircleOutline} variant="soft" to="/expense/new" />
        </>
      }
    >
      <Card className="hero">
        <span className="hero-label">Cash in the business</span>
        <span className="hero-value">{money(all.cash)}</span>
        <span className="hero-sub">All funding + rentals − dresses − expenses</span>
      </Card>

      <div className="chip-row">
        <Chip label="This month" active={period === 'month'} onClick={() => setParams({}, { replace: true })} />
        <Chip label="All time" active={period === 'all'} onClick={() => setParams({ period: 'all' }, { replace: true })} />
      </div>

      <div className="columns">
        <section className="stack">
          <SectionHeader title="Summary" />
          <Card className="stack breakdown">
            <Line label="Funding" value={t.funding} tone="in" />
            <Line label="Rentals" value={t.rentals} tone="in" />
            <Line label="Dresses bought" value={t.dressPurchases} tone="out" />
            <Line label="Expenses" value={t.expenses} tone="out" />
            <hr className="divider" />
            <div className="line">
              <span className="t-heading">Rental profit</span>
              <span className={cx('profit', t.profit >= 0 ? 'text-success' : 'text-danger')}>{money(t.profit)}</span>
            </div>
            <p className="t-caption">Rentals minus expenses, before paying back dresses.</p>
          </Card>
        </section>

        <section className="stack">
          <SectionHeader title="Movements" />
          <Card>
            {entries.length ? (
              entries.map((e) => {
                const isIn = e.kind === 'in';
                return (
                  <Link key={`${e.kind}${e.id}`} to={e.to} className="tx">
                    <span className={cx('tx-icon', isIn ? 'tone-success' : 'tone-danger')}>
                      {isIn ? <IoArrowDown size={16} aria-label="Money in" /> : <IoArrowUp size={16} aria-label="Money out" />}
                    </span>
                    <div className="tx-main">
                      <span className="t-heading">{e.title}</span>
                      <span className="t-caption truncate">{[shortDate(e.date), e.detail].filter(Boolean).join(' · ')}</span>
                    </div>
                    <span className={cx('tx-amount', isIn ? 'text-success' : 'text-danger')}>
                      {isIn ? '+' : '−'}
                      {money(e.amount)}
                    </span>
                  </Link>
                );
              })
            ) : (
              <EmptyState text="Nothing in this period" />
            )}
          </Card>
        </section>
      </div>
    </Screen>
  );
}

function Line({ label, value, tone }: { label: string; value: number; tone: 'in' | 'out' }) {
  return (
    <div className="line">
      <span className="t-body">{label}</span>
      <span className={cx('line-value', tone === 'in' ? 'text-success' : 'text-danger')}>
        {tone === 'in' ? '+' : '−'}
        {money(value)}
      </span>
    </div>
  );
}
