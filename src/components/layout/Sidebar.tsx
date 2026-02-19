import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const BarChart3 = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const PlusCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const TrendingUp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>
);

const Settings2 = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

const Download = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: <BarChart3 /> },
  { to: '/log', label: 'Log Entry', icon: <PlusCircle /> },
  { to: '/insights', label: 'Insights', icon: <TrendingUp /> },
  { to: '/settings', label: 'Settings', icon: <Settings2 /> },
  { to: '/export', label: 'Export', icon: <Download /> },
];

export function Sidebar() {
  const location = useLocation();
  const entries = useAppStore((s) => s.entries);

  // Derive the year label from the earliest entry, fallback to current year
  const yearLabel = (() => {
    if (entries.length === 0) return new Date().getFullYear().toString();
    const earliest = entries.reduce((a, b) => (a.date < b.date ? a : b));
    return earliest.date.slice(0, 4);
  })();

  return (
    <aside className="hidden md:flex flex-col w-52 shrink-0 border-r border-neutral-200 bg-white h-screen sticky top-0 overflow-y-auto scrollbar-thin">
      <div className="px-4 pt-5 pb-4 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-neutral-900 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">RF</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900 leading-tight">Ramadan Fit</p>
            <p className="text-xs text-neutral-400 leading-tight">{yearLabel}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive =
            item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(isActive ? 'nav-link-active' : 'nav-link')}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="shrink-0" aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-neutral-100">
        <div className="px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-100">
          <p className="text-xs font-medium text-neutral-500 mb-0.5">Data stored</p>
          <p className="text-xs text-neutral-400">Locally in your browser. Nothing leaves your device.</p>
        </div>
      </div>
    </aside>
  );
}
