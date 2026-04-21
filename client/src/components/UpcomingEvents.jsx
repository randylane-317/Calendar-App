import React from 'react';
import { format, parseISO, startOfDay, addDays, isBefore, isToday, isTomorrow } from 'date-fns';

function dayLabel(dateStr) {
  const d = parseISO(dateStr);
  if (isToday(d))    return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return format(d, 'EEEE, MMM d');
}

export default function UpcomingEvents({ events, users, onEventClick, onAddEvent }) {
  const now   = new Date();
  const start = startOfDay(now);
  const end   = addDays(start, 8);

  const getUserColor = (ownerId) => {
    if (!ownerId) return '#9A8C82';
    return users.find(u => u.id === ownerId)?.color || '#B87042';
  };

  const upcoming = [...events]
    .filter(e => {
      const d = parseISO(e.date);
      return !isBefore(d, start) && isBefore(d, end);
    })
    .sort((a, b) => {
      const dc = a.date.localeCompare(b.date);
      return dc !== 0 ? dc : (a.start_time || '').localeCompare(b.start_time || '');
    });

  const byDate = upcoming.reduce((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date].push(e);
    return acc;
  }, {});

  return (
    <div className="bg-white border border-warm-200 p-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-serif text-base text-espresso">Coming Up</h2>
        <button
          onClick={onAddEvent}
          className="text-xs text-warm-400 hover:text-espresso border border-warm-200 hover:border-espresso px-3 py-1.5 transition-colors tracking-wide"
        >
          + Add
        </button>
      </div>

      {upcoming.length === 0 ? (
        <div className="py-10 text-center">
          <p className="font-serif text-2xl text-warm-200 mb-3">—</p>
          <p className="text-xs text-warm-400 tracking-wide">Nothing in the next 7 days</p>
          <button
            onClick={onAddEvent}
            className="mt-4 text-xs text-copper underline underline-offset-4 hover:text-copper-600 transition-colors tracking-wide"
          >
            Add something
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(byDate).map(([date, evts]) => (
            <div key={date}>
              {/* Date heading */}
              <p className="font-serif text-xs text-warm-400 mb-2 italic">
                {dayLabel(date)}
              </p>

              <div className="space-y-px">
                {evts.map(event => {
                  const color = getUserColor(event.owner_id);
                  const ownerLabel = event.owner_id
                    ? (users.find(u => u.id === event.owner_id)?.name || '')
                    : 'Shared';

                  return (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className="w-full text-left flex items-stretch gap-3 py-2.5 px-2 hover:bg-warm-50 transition-colors group"
                    >
                      {/* Color accent */}
                      <div className="w-0.5 flex-shrink-0 self-stretch rounded-full" style={{ backgroundColor: color }} />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-espresso truncate group-hover:text-copper transition-colors">
                          {event.title}
                        </p>
                        <p className="text-xs text-warm-400 mt-0.5">
                          {event.start_time
                            ? `${event.start_time}${event.end_time ? ` – ${event.end_time}` : ''}`
                            : 'All day'}
                          <span className="mx-1.5 text-warm-200">·</span>
                          <span style={{ color }}>{ownerLabel}</span>
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
