import { longDate, toISODate, todayISO } from '@mobile/src/lib/format';
import type { CSSProperties } from 'react';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';

import { cx } from './ui';

export type DayLook = {
  background?: string;
  color?: string;
  dots?: number; // small markers under the number
  dotColor?: string;
  crossed?: boolean;
};

type Props = {
  month: Date; // any day inside the shown month
  onMonthChange: (month: Date) => void;
  selected?: string;
  onSelect?: (iso: string) => void;
  dayLook?: (iso: string) => DayLook | undefined;
  disablePast?: boolean;
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function monthGrid(month: Date): (string | null)[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday-first
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(toISODate(new Date(month.getFullYear(), month.getMonth(), d)));
  }
  while (cells.length % 7) cells.push(null);
  return cells;
}

export function MonthCalendar({ month, onMonthChange, selected, onSelect, dayLook, disablePast }: Props) {
  const today = todayISO();
  const cells = monthGrid(month);
  const title = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const shift = (n: number) => onMonthChange(new Date(month.getFullYear(), month.getMonth() + n, 1));

  return (
    <div className="cal">
      <div className="cal-header">
        <button type="button" className="icon-btn" onClick={() => shift(-1)} aria-label="Previous month">
          <IoChevronBack size={20} />
        </button>
        <span className="cal-title" aria-live="polite">{title}</span>
        <button type="button" className="icon-btn" onClick={() => shift(1)} aria-label="Next month">
          <IoChevronForward size={20} />
        </button>
      </div>

      <div className="cal-grid">
        {WEEKDAYS.map((w) => (
          <span key={w} className="cal-weekday">{w}</span>
        ))}
        {cells.map((iso, i) => {
          if (!iso) return <span key={`e${i}`} />;
          const look = dayLook?.(iso) ?? {};
          const isSelected = iso === selected;
          const isPast = iso < today;
          const style = { '--day-bg': look.background, '--day-fg': look.color } as CSSProperties;
          return (
            <button
              key={iso}
              type="button"
              className={cx('cal-day', iso === today && 'cal-day--today', isSelected && 'cal-day--selected', isPast && 'cal-day--past', look.crossed && 'cal-day--crossed')}
              style={style}
              disabled={(disablePast && isPast) || !onSelect}
              aria-pressed={isSelected}
              aria-label={longDate(iso)}
              onClick={() => onSelect?.(iso)}
            >
              <span className="cal-num">{Number(iso.slice(8))}</span>
              <span className="cal-dots">
                {Array.from({ length: Math.min(look.dots ?? 0, 3) }, (_, k) => (
                  <span key={k} className="cal-dot" style={look.dotColor ? { background: look.dotColor } : undefined} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
