import React from 'react';
import { format, parseISO, startOfDay, addDays, isAfter, isBefore, isToday, isTomorrow } from 'date-fns';

function dayLabel(dateStr) {
  const d = parseISO(dateStr);
  if (isToday(d))    return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return format(d, 'EEE, MMM d');
}

export default function UpcomingEvents({ events, users, onEventClick, onAddEvent }) {
  const now   = new Date();
  const start = startOfDay(now);
  const end   = addDays(start, 8);

  const getUserColor = (ownerId) => {
    if (!ownerId) return '#8B5CF6';
    return users.find(u => u.id === ownerId)?.color || '#6366F1';
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

  // Group by date
  const byDate = upcoming.reduce((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date].push(e);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 text-sm">Next 7 Days</h2>
        <button
          onClick={onAddEvent}
          className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors text-base leading-none"
          aria-label="Add event"
        >
          +
        </button>
      </div>

      {upcoming.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-3xl mb-2">🗓️</p>
          <p className="text-sm text-gray-400">Nothing coming up</p>
          <button
            onClick={onAddEvent}
            className="mt-3 text-sm text-indigo-600 font-semibold hover:underline"
          >
            Add an event
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byDate).map(([date, evts]) => (
            <div key={date}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                {dayLabel(date)}
              </p>
              <div className="space-y-1">
                {evts.map(event => {
                  const color = getUserColor(event.owner_id);
                  const ownerLabel = event.owner_id
                    ? (users.find(u => u.id === event.owner_id)?.name || '')
                    : 'Shared';

                  return (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className="w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <div
                        className="w-1 rounded-full flex-shrink-0 mt-0.5 self-stretch min-h-[1.5rem]"
                        style={{ backgroundColor: color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate group-hover:text-indigo-600 transition-colors">
                          {event.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {event.start_time || 'All day'}
                          {event.end_time && ` – ${event.end_time}`}
                          <span className="ml-1.5 font-medium" style={{ color }}>· {ownerLabel}</span>
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
