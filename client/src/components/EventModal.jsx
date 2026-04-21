import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';

const REMINDER_OPTIONS = [
  { label: '15 minutes before', minutes: 15 },
  { label: '30 minutes before', minutes: 30 },
  { label: '1 hour before',     minutes: 60 },
  { label: '2 hours before',    minutes: 120 },
  { label: '1 day before',      minutes: 1440 },
  { label: '2 days before',     minutes: 2880 },
];

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function findConflicts(form, events, currentEventId) {
  if (!form.date || !form.start_time) return [];
  const formStart = timeToMinutes(form.start_time);
  const formEnd   = form.end_time ? timeToMinutes(form.end_time) : formStart + 60;

  return events.filter(e => {
    if (e.id === currentEventId) return false;
    if (e.date !== form.date)    return false;
    if (!e.start_time)           return false;
    const eStart = timeToMinutes(e.start_time);
    const eEnd   = e.end_time ? timeToMinutes(e.end_time) : eStart + 60;
    return formStart < eEnd && formEnd > eStart;
  });
}

export default function EventModal({ event, defaultDate, users, currentUser, events = [], onSave, onDelete, onClose }) {
  const [form, setForm] = useState({
    title:      '',
    date:       defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    start_time: '',
    end_time:   '',
    notes:      '',
    owner_id:   currentUser?.id ?? null,
    reminders:  [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    if (event) {
      setForm({
        title:      event.title      || '',
        date:       event.date       || '',
        start_time: event.start_time || '',
        end_time:   event.end_time   || '',
        notes:      event.notes      || '',
        owner_id:   event.owner_id   ?? null,
        reminders:  (event.reminders || []).map(r => ({
          minutes_before: r.minutes_before,
          method: r.method,
        })),
      });
    }
    setTimeout(() => titleRef.current?.focus(), 50);
  }, [event]);

  // Trap focus and close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const ownerColor = form.owner_id
    ? (users.find(u => u.id === form.owner_id)?.color || '#6366F1')
    : '#8B5CF6';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSave(form);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const addReminder = () =>
    setForm(f => ({ ...f, reminders: [...f.reminders, { minutes_before: 60, method: 'email' }] }));

  const removeReminder = (i) =>
    setForm(f => ({ ...f, reminders: f.reminders.filter((_, idx) => idx !== i) }));

  const updateReminder = (i, key, val) =>
    setForm(f => ({ ...f, reminders: f.reminders.map((r, idx) => idx === i ? { ...r, [key]: val } : r) }));

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92dvh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-semibold text-gray-900 text-base">
            {event ? 'Edit Event' : 'New Event'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Title */}
          <input
            ref={titleRef}
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full text-lg font-medium border-0 border-b-2 border-gray-200 focus:border-indigo-500 focus:outline-none py-1 placeholder-gray-300 bg-transparent"
            placeholder="Event title"
            required
          />

          {/* Date & Times */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 sm:col-span-1">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Start</label>
              <input
                type="time"
                value={form.start_time}
                onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">End</label>
              <input
                type="time"
                value={form.end_time}
                onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Owner */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Whose event?</label>
            <div className="flex flex-wrap gap-2">
              {users.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, owner_id: u.id }))}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 text-sm font-medium transition-all"
                  style={
                    form.owner_id === u.id
                      ? { backgroundColor: u.color, borderColor: u.color, color: 'white' }
                      : { borderColor: '#e5e7eb', color: '#374151' }
                  }
                >
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: u.color }} />
                  {u.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, owner_id: null }))}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 text-sm font-medium transition-all"
                style={
                  form.owner_id === null
                    ? { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6', color: 'white' }
                    : { borderColor: '#e5e7eb', color: '#374151' }
                }
              >
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                Shared
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
              placeholder="Add any notes…"
            />
          </div>

          {/* Reminders */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Reminders
              </label>
              <button
                type="button"
                onClick={addReminder}
                className="text-xs text-indigo-600 font-semibold hover:text-indigo-800"
              >
                + Add reminder
              </button>
            </div>

            {form.reminders.length === 0 && (
              <p className="text-sm text-gray-400">No reminders set.</p>
            )}

            <div className="space-y-2">
              {form.reminders.map((r, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2.5">
                  <select
                    value={r.minutes_before}
                    onChange={e => updateReminder(i, 'minutes_before', Number(e.target.value))}
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {REMINDER_OPTIONS.map(o => (
                      <option key={o.minutes} value={o.minutes}>{o.label}</option>
                    ))}
                  </select>
                  <select
                    value={r.method}
                    onChange={e => updateReminder(i, 'method', e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="email">Email</option>
                    <option value="push">Push</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeReminder(i)}
                    className="text-gray-300 hover:text-red-400 text-xl leading-none transition-colors px-1"
                    aria-label="Remove reminder"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {(() => {
            const conflicts = findConflicts(form, events, event?.id);
            if (conflicts.length === 0) return null;
            return (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 text-base leading-none mt-0.5">⚠️</span>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Time conflict</p>
                    <ul className="mt-1 space-y-0.5">
                      {conflicts.map(c => {
                        const owner = users.find(u => u.id === c.owner_id);
                        return (
                          <li key={c.id} className="text-sm text-amber-700 flex items-center gap-1.5">
                            <span
                              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: owner?.color || '#8B5CF6' }}
                            />
                            <span>
                              <strong>{c.title}</strong>
                              {c.start_time && ` · ${c.start_time}${c.end_time ? `–${c.end_time}` : ''}`}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="text-xs text-amber-600 mt-1.5">You can still save — this is just a heads-up.</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          {event && !confirmDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="text-sm text-red-400 hover:text-red-600 transition-colors"
            >
              Delete
            </button>
          )}
          {confirmDelete && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Delete this event?</span>
              <button
                type="button"
                onClick={() => onDelete(event.id)}
                className="text-sm text-red-600 font-semibold"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-sm text-gray-400"
              >
                No
              </button>
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="event-form"
              disabled={loading}
              onClick={handleSubmit}
              className="px-5 py-2 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50 active:brightness-90"
              style={{ backgroundColor: ownerColor }}
            >
              {loading ? 'Saving…' : event ? 'Save changes' : 'Add event'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
