import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';
import { IoChevronBack } from 'react-icons/io5';
import { Link, type To } from 'react-router';

import { useGoBack, usePageTitle } from '../lib/nav';
import { Wordmark } from './Wordmark';

export const cx = (...names: (string | false | null | undefined)[]) => names.filter(Boolean).join(' ');

export type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'info';

/**
 * A top-level page (one of the nav tabs). With `brand`, small screens show the
 * wordmark instead of the title, like the mobile home screen; wide screens
 * already have it in the sidebar.
 */
export function Screen({
  title,
  subtitle,
  brand,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  brand?: boolean;
  actions?: ReactNode;
  children: ReactNode;
}) {
  usePageTitle(title);
  return (
    <main className="page">
      {brand ? (
        <div className="page-brand">
          <Wordmark width={130} />
        </div>
      ) : null}
      <header className={cx('page-header', brand && 'page-header--brand')}>
        <div className="page-heading">
          {subtitle ? <p className="t-caption">{subtitle}</p> : null}
          <h1 className="t-hero">{title}</h1>
        </div>
        {actions ? <div className="page-actions">{actions}</div> : null}
      </header>
      {children}
    </main>
  );
}

/** A page opened from another one (details, forms), with a back button. */
export function SubPage({
  title,
  back,
  narrow,
  actions,
  children,
}: {
  title: string;
  back: string; // where "back" goes when the page was opened directly
  narrow?: boolean;
  actions?: ReactNode; // shown at the right of the title, e.g. an Edit button
  children: ReactNode;
}) {
  usePageTitle(title);
  const goBack = useGoBack(back);
  return (
    <main className={cx('page', narrow && 'page--narrow')}>
      <header className="subpage-header">
        <button type="button" className="icon-btn" onClick={goBack} aria-label="Back">
          <IoChevronBack size={20} />
        </button>
        <h1 className="subpage-title">{title}</h1>
        {actions}
      </header>
      {children}
    </main>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('card', className)}>{children}</div>;
}

export function SectionHeader({ title, note, action }: { title: string; note?: string; action?: { label: string; to: To } }) {
  return (
    <div className="section-header">
      <h2 className="t-title">{title}</h2>
      {note ? <span className="t-caption">{note}</span> : null}
      {action ? (
        <Link to={action.to} className="section-action">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, tone = 'primary' }: { label: string; value: string; icon: IconType; tone?: Tone }) {
  return (
    <Card className="stat">
      <span className={cx('stat-icon', `tone-${tone}`)}>
        <Icon size={18} />
      </span>
      <span className="stat-value">{value}</span>
      <span className="t-caption">{label}</span>
    </Card>
  );
}

export function Badge({ label, tone = 'primary' }: { label: string; tone?: Tone }) {
  return <span className={cx('badge', `tone-${tone}`)}>{label}</span>;
}

export function Chip({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button type="button" className={cx('chip', active && 'chip--active')} aria-pressed={active} onClick={onClick}>
      {label}
    </button>
  );
}

type ButtonProps = {
  label: string;
  icon?: IconType;
  variant?: 'solid' | 'soft' | 'danger';
  className?: string;
  to?: To; // renders a link instead of a button
  onClick?: () => void;
  disabled?: boolean;
};

export function Button({ label, icon: Icon, variant = 'solid', className, to, onClick, disabled }: ButtonProps) {
  const classes = cx('btn', variant !== 'solid' && `btn--${variant}`, className);
  const content = (
    <>
      {Icon ? <Icon size={18} /> : null}
      <span>{label}</span>
    </>
  );
  if (to !== undefined) {
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} onClick={onClick} disabled={disabled}>
      {content}
    </button>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <p className="t-caption empty">{text}</p>;
}

export function Spinner() {
  return <span className="spinner" role="status" aria-label="Loading" />;
}
