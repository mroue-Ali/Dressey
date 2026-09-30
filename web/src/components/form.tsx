import { longDate, parseISODate } from '@mobile/src/lib/format';
import {
  createContext, useContext, useId, useState,
  type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes,
} from 'react';
import { IoAlertCircleOutline, IoCalendarOutline, IoChevronDown, IoChevronUp } from 'react-icons/io5';

import { MonthCalendar } from './MonthCalendar';
import { Card, cx, SubPage } from './ui';

/** A sub-page holding one form; `footer` (the submit button) stays pinned to the bottom. */
export function FormPage({
  title,
  back,
  narrow = true,
  onSubmit,
  footer,
  children,
}: {
  title: string;
  back: string;
  narrow?: boolean;
  onSubmit: () => void;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <SubPage title={title} back={back} narrow={narrow}>
      <form
        className="stack"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {children}
        <div className="form-footer">{footer}</div>
      </form>
    </SubPage>
  );
}

// Lets inputs inside a Field pick up the ids its label points at.
const FieldIds = createContext<{ inputId?: string; labelId?: string }>({});

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  const id = useId();
  const ids = { inputId: `${id}-input`, labelId: `${id}-label` };
  return (
    <div className="field">
      <label className="field-label" id={ids.labelId} htmlFor={ids.inputId}>
        {label}
      </label>
      <FieldIds.Provider value={ids}>{children}</FieldIds.Provider>
      {error ? <p className="field-error">{error}</p> : hint ? <p className="t-caption">{hint}</p> : null}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const { inputId } = useContext(FieldIds);
  return <input id={inputId} {...props} className={cx('input', className)} />;
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { inputId } = useContext(FieldIds);
  return <textarea id={inputId} rows={3} {...props} className={cx('input', className)} />;
}

export function AmountInput({ value, onChange, placeholder = '0' }: { value: string; onChange: (text: string) => void; placeholder?: string }) {
  const { inputId } = useContext(FieldIds);
  return (
    <div className="amount">
      <span className="amount-currency" aria-hidden>$</span>
      <input
        id={inputId}
        className="amount-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode="decimal"
        autoComplete="off"
      />
    </div>
  );
}

export function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { labelId } = useContext(FieldIds);
  return (
    <div className="choice-chips" role="radiogroup" aria-labelledby={labelId}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            className={cx('choice-chip', active && 'choice-chip--active')}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Date row that opens an inline month calendar. */
export function DateField({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const { inputId, labelId } = useContext(FieldIds);
  const valueId = useId();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(parseISODate(value));
  return (
    <div className="stack-sm">
      {/* Named by the field label plus the chosen date, so screen readers announce both. */}
      <button
        id={inputId}
        type="button"
        className="input date-row"
        aria-labelledby={labelId ? `${labelId} ${valueId}` : undefined}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <IoCalendarOutline size={18} className="date-row-icon" />
        <span id={valueId} className="date-row-text">{longDate(value)}</span>
        {open ? <IoChevronUp size={18} /> : <IoChevronDown size={18} />}
      </button>
      {open ? (
        <Card>
          <MonthCalendar
            month={month}
            onMonthChange={setMonth}
            selected={value}
            onSelect={(iso) => {
              onChange(iso);
              setOpen(false);
            }}
          />
        </Card>
      ) : null}
    </div>
  );
}

/** Runs an async save, tracking progress and a user-facing error message. */
export function useSave() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const run = async (action: () => Promise<void>) => {
    setSaving(true);
    setError(undefined);
    try {
      await action();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return { saving, error, run };
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="form-error" role="alert">
      <IoAlertCircleOutline size={18} />
      <span>{message}</span>
    </div>
  );
}

export function SubmitButton({ label, disabled }: { label: string; disabled?: boolean }) {
  return (
    <button type="submit" className="btn btn--submit" disabled={disabled}>
      {label}
    </button>
  );
}
