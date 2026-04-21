import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, set, parseISO } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { usePushNotifications } from '../hooks/usePushNotifications';
import Header from '../components/Header';
import EventModal from '../components/EventModal';
import UpcomingEvents from '../components/UpcomingEvents';
import CalendarToolbar from '../components/CalendarToolbar';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 0 }),
  getDay,
  locales: { 'en-US': enUS },
});

function toCalendarDate(dateStr, timeStr) {
  const base = parseISO(dateStr);
  if (!timeStr) return base;
  const [h, m] = timeStr.split(':').map(Number);
  return set(base, { hours: h, minutes: m, seconds: 0 });
}

export default function CalendarPage() {
  const { user, users } = useAuth();
  const [events, setEvents]   = useState([]);
  const [view, setView]       = useState('month');
  const [date, setDate]       = useState(new Date());
  const [modal, setModal]     = useState({ open: false, event: null, defaultDate: null });

  usePushNotifications(user);

  const fetchEvents = useCallback(async () => {
    try {
      const { events } = await api.events.list();
      setEvents(events);
    } catch (err) {
      console.error('Failed to load events:', err.message);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const getUserColor = (ownerId) => {
    if (!ownerId) return '#8B5CF6';
    return users.find(u => u.id === ownerId)?.color || '#6366F1';
  };

  const calendarEvents = events.map(e => ({
    id:    e.id,
    title: e.title,
    start: toCalendarDate(e.date, e.start_time),
    end:   toCalendarDate(e.date, e.end_time || e.start_time),
    allDay: !e.start_time,
    resource: e,
  }));

  const eventStyleGetter = (calEvent) => {
    const color = getUserColor(calEvent.resource.owner_id);
    return {
      style: {
        backgroundColor: `${color}1A`,
        borderLeft: `3px solid ${color}`,
        color: '#1C1612',
        borderRadius: '0',
        boxShadow: 'none',
        padding: '1px 6px',
      },
    };
  };

  const openNew = (defaultDate) =>
    setModal({ open: true, event: null, defaultDate });

  const openEdit = (calEvent) =>
    setModal({ open: true, event: calEvent.resource, defaultDate: null });

  const closeModal = () =>
    setModal({ open: false, event: null, defaultDate: null });

  const handleSave = async (data) => {
    if (modal.event) {
      await api.events.update(modal.event.id, data);
    } else {
      await api.events.create(data);
    }
    await fetchEvents();
    closeModal();
  };

  const handleDelete = async (id) => {
    await api.events.delete(id);
    await fetchEvents();
    closeModal();
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <Header view={view} onViewChange={setView} />

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-7xl mx-auto w-full">

        {/* Calendar */}
        <div className="flex-1 bg-white border border-warm-200 p-5 overflow-hidden shadow-none">
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            onSelectSlot={({ start }) => openNew(start)}
            onSelectEvent={openEdit}
            selectable
            eventPropGetter={eventStyleGetter}
            style={{ height: 'max(500px, calc(100vh - 160px))' }}
            popup
            components={{ toolbar: CalendarToolbar }}
          />
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-72 xl:w-80 flex-shrink-0">
          <UpcomingEvents
            events={events}
            users={users}
            onEventClick={e => setModal({ open: true, event: e, defaultDate: null })}
            onAddEvent={() => openNew(new Date())}
          />
        </div>
      </div>

      {modal.open && (
        <EventModal
          event={modal.event}
          defaultDate={modal.defaultDate}
          users={users}
          currentUser={user}
          events={events}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
