import { emailToUsername } from '@mobile/src/lib/backend';
import { useEffect } from 'react';
import type { IconType } from 'react-icons';
import {
  IoCalendar, IoCalendarOutline, IoHome, IoHomeOutline, IoLogOutOutline,
  IoShirt, IoShirtOutline, IoWallet, IoWalletOutline,
} from 'react-icons/io5';
import { Link, Outlet, useLocation, useNavigationType } from 'react-router';

import { useStore } from '../data/store';
import { cx } from './ui';
import { Wordmark } from './Wordmark';

type Tab = { to: string; label: string; icon: IconType; activeIcon: IconType; sections: string[] };

// `sections` are the path prefixes that count as "inside" a tab, so opening a
// dress keeps Dresses highlighted in the sidebar.
const TABS: Tab[] = [
  { to: '/', label: 'Home', icon: IoHomeOutline, activeIcon: IoHome, sections: [] },
  { to: '/schedule', label: 'Schedule', icon: IoCalendarOutline, activeIcon: IoCalendar, sections: ['/booking/'] },
  { to: '/dresses', label: 'Dresses', icon: IoShirtOutline, activeIcon: IoShirt, sections: ['/dress/'] },
  { to: '/finance', label: 'Cash Flow', icon: IoWalletOutline, activeIcon: IoWallet, sections: ['/funding/', '/expense/'] },
];

function TabLinks({ pathname, className }: { pathname: string; className: string }) {
  return TABS.map((t) => {
    const active = pathname === t.to || t.sections.some((s) => pathname.startsWith(s));
    const Icon = active ? t.activeIcon : t.icon;
    return (
      <Link key={t.to} to={t.to} className={cx(className, active && 'active')} aria-current={pathname === t.to ? 'page' : undefined}>
        <Icon size={22} aria-hidden />
        <span>{t.label}</span>
      </Link>
    );
  });
}

/** App frame: sidebar on wide screens; bottom tabs on phones (only on the tab pages, like the mobile app). */
export function Shell() {
  const { session, signOut } = useStore();
  const { pathname } = useLocation();
  const navType = useNavigationType();
  const onTab = TABS.some((t) => t.to === pathname);

  // New pages open at the top; back/forward keeps the browser's scroll restoration.
  useEffect(() => {
    if (navType !== 'POP') window.scrollTo(0, 0);
  }, [pathname, navType]);

  return (
    <div className={cx('shell', onTab && 'shell--tabs')}>
      <aside className="sidebar">
        <Link to="/" className="sidebar-brand" aria-label="Home">
          <Wordmark width={150} />
        </Link>
        <nav className="sidebar-nav" aria-label="Main">
          <TabLinks pathname={pathname} className="side-link" />
        </nav>
        <div className="sidebar-foot">
          <span className="t-caption">Signed in as {emailToUsername(session?.user.email)}</span>
          <button type="button" className="side-link" onClick={signOut}>
            <IoLogOutOutline size={22} aria-hidden />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="main">
        <Outlet />
      </div>

      {onTab ? (
        <nav className="tabbar" aria-label="Main">
          <TabLinks pathname={pathname} className="tab-link" />
        </nav>
      ) : null}
    </div>
  );
}
