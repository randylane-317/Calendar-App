import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Header({ view, onViewChange }) {
  const { user, users, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-paper border-b border-warm-200 px-5 py-3 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

        {/* Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-serif text-xl text-espresso tracking-tight leading-none">Our Days</span>
          <span className="hidden sm:block text-warm-300 text-xs">·</span>
          {/* Color legend */}
          <div className="hidden sm:flex items-center gap-3">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: u.color }} />
                <span className="text-xs text-warm-400">{u.name}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full flex-shrink-0 bg-warm-300" />
              <span className="text-xs text-warm-400">Shared</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">

          {/* View toggle */}
          <div className="flex border border-warm-200 overflow-hidden text-xs">
            <button
              onClick={() => onViewChange('month')}
              className={`px-4 py-2 font-medium tracking-wide transition-colors ${
                view === 'month'
                  ? 'bg-espresso text-paper'
                  : 'text-warm-500 hover:text-espresso hover:bg-warm-50'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => onViewChange('week')}
              className={`px-4 py-2 font-medium tracking-wide border-l border-warm-200 transition-colors ${
                view === 'week'
                  ? 'bg-espresso text-paper'
                  : 'text-warm-500 hover:text-espresso hover:bg-warm-50'
              }`}
            >
              Week
            </button>
          </div>

          {/* Avatar + menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-warm-100 transition-colors"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-paper text-xs font-semibold flex-shrink-0"
                style={{ backgroundColor: user?.color || '#B87042' }}
              >
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <span className="text-xs text-warm-500 hidden sm:block">{user?.name}</span>
              <svg className="w-2.5 h-2.5 text-warm-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 bg-paper border border-warm-200 shadow-sm py-1 min-w-[130px] z-20">
                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs text-warm-500 hover:text-espresso hover:bg-warm-50 transition-colors tracking-wide"
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
