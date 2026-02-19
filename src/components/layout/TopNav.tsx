import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/log', label: 'Log Entry' },
  { to: '/insights', label: 'Insights' },
  { to: '/settings', label: 'Settings' },
  { to: '/export', label: 'Export' },
];

export function TopNav() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="md:hidden sticky top-0 z-30 bg-white border-b border-neutral-200">
      <div className="flex items-center justify-between px-4 h-12">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-neutral-900 flex items-center justify-center">
            <span className="text-white text-xs font-bold">RF</span>
          </div>
          <span className="text-sm font-semibold text-neutral-900">Ramadan Fit</span>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="btn-ghost p-1.5"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <nav className="border-t border-neutral-100 bg-white px-3 pb-3 pt-2 space-y-0.5 animate-fade-in">
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
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      )}
    </header>
  );
}
