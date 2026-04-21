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

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const ownerColor = form.owner_id
    ? (users.find(u => u.id === form.owner_id)?.color || '#B87042')
    : '#9A8C82';

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

  const conflicts = findConflicts(form, events, event?.id);

  return (
    <div
      className="fixed inset-0 bg-espresso/30 backdrop-blur-[2px] flex items-end sm:items-center justify-center z-50 p-0 sm:p-6"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-paper w-full sm:max-w-lg rounded-t-none sm:rounded-none shadow-2xl max-h-[92dvh] flex flex-col border-t-4 sm:border-t-0 sm:border-l-4"
        style={{ borderColor: ownerColor }}
      >

        {/* Drag handle on mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-8 h-1 rounded-full bg-warm-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-5 pb-4 border-b border-warm-200 flex-shrink-0">
          <h2 className="font-serif text-lg text-espresso">
            {event ? 'Edit Event' : 'New Event'}
          </h2>
          <button
            onClick={onClose}
            className="text-warm-300 hover:text-espresso transition-colors text-2xl leading-none w-7 h-7 flex items-center justify-center"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-7 py-6 space-y-6">

          {/* Title */}
          <input
            ref={titleRef}
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full text-xl font-serif bg-transparent border-0 border-b border-warm-200 pb-3 text-espresso focus:outline-none focus:border-copper transition-colors placeholder-warm-200"
            placeholder="Event title"
            required
          />

          {/* Date & Times */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-3 sm:col-span-1">
              <label className="field-label">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="field-input"
                required
              />
            </div>
            <div>
              <label className="field-label">Start</label>
              <input
                type="time"
                value={form.start_time}
                onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">End</label>
              <input
                type="time"
                value={form.end_time}
                onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                className="field-input"
              />
            </div>
          </div>

          {/* Owner */}
          <div>
            <label className="field-label">For</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {users.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, owner_id: u.id }))}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium tracking-wide border transition-all"
                  style={
                    form.owner_id === u.id
                      ? { backgroundColor: u.color, borderColor: u.color, color: '#FDFAF5' }
                      : { borderColor: '#E6DDD4', color: '#7A6E65' }
                  }
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: form.owner_id === u.id ? '#FDFAF5' : u.color }} />
                  {u.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, owner_id: null }))}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium tracking-wide border transition-all"
                style={
                  form.owner_id === null
                    ? { backgroundColor: '#9A8C82', borderColor: '#9A8C82', color: '#FDFAF5' }
                    : { borderColor: '#E6DDD4', color: '#7A6E65' }
                }
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: form.owner_id === null ? '#FDFAF5' : '#9A8C82' }} />
                Shared
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="field-label">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="field-input resize-none"
              rows={3}
              placeholder="Add notes…"
            />
          </div>

          {/* Reminders */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="field-label mb-0">Reminders</label>
              <button
                type="button"
                onClick={addReminder}
                className="text-xs text-copper hover:text-copper-600 transition-colors tracking-wide"
              >
                + Add reminder
              </button>
            </div>

            {form.reminders.length === 0 && (
              <p className="text-xs text-warm-300 tracking-wide">No reminders set.</p>
            )}

            <div className="space-y-2">
              {form.reminders.map((r, i) => (
                <div key={i} className="flex items-center gap-2 bg-warm-50 px-3 py-2.5">
                  <select
                    value={r.minutes_before}
                    onChange={e => updateReminder(i, 'minutes_before', Number(e.target.value))}
                    className="flex-1 text-xs border-0 border-b border-warm-200 bg-transparent text-espresso focus:outline-none focus:border-copper py-1"
                  >
                    {REMINDER_OPTIONS.map(o => (
                      <option key={o.minutes} value={o.minutes}>{o.label}</option>
                    ))}
                  </select>
                  <select
                    value={r.method}
                    onChange={e => updateReminder(i, 'method', e.target.value)}
                    className="text-xs border-0 border-b border-warm-200 bg-transparent text-espresso focus:outline-none focus:border-copper py-1"
                  >
                    <option value="email">Email</option>
                    <option value="push">Push</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeReminder(i)}
                    className="text-warm-200 hover:text-red-400 transition-colors text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Conflict warning */}
          {conflicts.length > 0 && (
            <div className="border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-medium text-amber-800 tracking-wide mb-1.5">Time conflict</p>
              <ul className="space-y-1">
                {conflicts.map(c => {
                  const owner = users.find(u => u.id === c.owner_id);
                  return (
                    <li key={c.id} className="flex items-center gap-2 text-xs text-amber-700">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: owner?.color || '#9A8C82' }} />
                      <span>
                        <strong>{c.title}</strong>
                        {c.start_time && ` · ${c.start_time}${c.end_time ? `–${c.end_time}` : ''}`}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="text-xs text-amber-600 mt-2">You can still save — this is just a heads-up.</p>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 px-4 py-3 tracking-wide">{error}</p>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center gap-4 px-7 py-4 border-t border-warm-200 flex-shrink-0">
          {event && !confirmDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-warm-300 hover:text-red-500 transition-colors tracking-wide"
            >
              Delete
            </button>
          )}
          {confirmDelete && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-warm-400">Delete this?</span>
              <button type="button" onClick={() => onDelete(event.id)} className="text-xs text-red-600 font-medium tracking-wide">Yes</button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="text-xs text-warm-400">No</button>
            </div>
          )}

          <div className="ml-auto flex items-center gap-3">
            <button type="button" onClick={onClose} className="btn-outline text-xs">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              onClick={handleSubmit}
              className="px-6 py-2.5 text-xs font-medium tracking-wide text-paper transition-colors disabled:opacity-40"
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
