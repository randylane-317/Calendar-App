import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Header({ view, onViewChange }) {
  const { user, users, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

        {/* Logo */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl">📅</span>
          <span className="font-bold text-gray-900 hidden sm:block text-sm tracking-tight">Our Calendar</span>
        </div>

        {/* Color legend */}
        <div className="flex items-center gap-3 flex-1 justify-center">
          {users.map(u => (
            <div key={u.id} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: u.color }} />
              <span className="text-xs text-gray-500 hidden sm:block">{u.name}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-purple-500" />
            <span className="text-xs text-gray-500 hidden sm:block">Shared</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            <button
              onClick={() => onViewChange('month')}
              className={`px-3 py-1.5 font-medium transition-colors ${
                view === 'month' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => onViewChange('week')}
              className={`px-3 py-1.5 font-medium transition-colors border-l border-gray-200 ${
                view === 'week' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Week
            </button>
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: user?.color || '#6366f1' }}
              >
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <span className="text-sm text-gray-700 hidden sm:block">{user?.name}</span>
              <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg py-1 min-w-[140px] z-20">
                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
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
