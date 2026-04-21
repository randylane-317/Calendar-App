import React from 'react';

export default function CalendarToolbar({ label, onNavigate, onView, view }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate('PREV')}
          className="w-8 h-8 flex items-center justify-center border border-warm-200 text-warm-500 hover:border-espresso hover:text-espresso transition-colors"
          aria-label="Previous"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 2L4 7l5 5" />
          </svg>
        </button>

        <button
          onClick={() => onNavigate('TODAY')}
          className="px-3 h-8 text-xs font-medium tracking-wide border border-warm-200 text-warm-500 hover:border-espresso hover:text-espresso transition-colors"
        >
          Today
        </button>

        <button
          onClick={() => onNavigate('NEXT')}
          className="w-8 h-8 flex items-center justify-center border border-warm-200 text-warm-500 hover:border-espresso hover:text-espresso transition-colors"
          aria-label="Next"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 2l5 5-5 5" />
          </svg>
        </button>
      </div>

      {/* Month / year label */}
      <span className="font-serif text-xl text-espresso tracking-tight leading-none">
        {label}
      </span>

      {/* View toggle — hidden here, controlled by Header */}
      <div className="w-[88px]" />
    </div>
  );
}
