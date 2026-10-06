import type { Appointment } from '@mobile/src/data/types';
import { formatTime } from '@mobile/src/lib/format';
import { IoCallOutline } from 'react-icons/io5';
import { Link } from 'react-router';

/** One fitting visit; clicking it opens the edit form. */
export function AppointmentRow({ appointment: a }: { appointment: Appointment }) {
  return (
    <div className="row-link appt-row">
      <Link to={`/appointment/${a.id}/edit`} className="appt-link">
        <div className="appt-time">
          <span className="appt-start">{formatTime(a.startTime)}</span>
          {a.endTime ? <span className="t-caption">to {formatTime(a.endTime)}</span> : null}
        </div>
        <div className="appt-main">
          <span className="t-heading truncate">{a.customerName}</span>
          {a.customerPhone ? <span className="t-caption truncate">{a.customerPhone}</span> : null}
          {a.note ? <span className="t-caption appt-note">{a.note}</span> : null}
        </div>
      </Link>
      {a.customerPhone ? (
        <a href={`tel:${a.customerPhone}`} className="icon-btn" aria-label={`Call ${a.customerName}`}>
          <IoCallOutline size={18} />
        </a>
      ) : null}
    </div>
  );
}
