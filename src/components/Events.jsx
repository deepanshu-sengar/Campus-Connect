import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { Calendar, Users } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { events as fallbackEvents } from '../data/events';
import {
  addActivity,
  setDocument,
  subscribeToCollection,
  incrementDocumentField
} from '../services/firestore';
import { useAuth } from '../context/AuthContext';

const eventColors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];

const slug = value =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function Events() {
  const { ref, visible } = useScrollReveal();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [registered, setRegistered] = useState(new Set());
  const [error, setError] = useState('');

  useEffect(
    () =>
      subscribeToCollection(
        'events',
        setEvents,
        {
          orderField: 'title',
          orderDirection: 'asc',
          limit: 50
        }
      ),
    []
  );

  useEffect(() => {
    if (!user) {
      setRegistered(new Set());
      return;
    }

    return subscribeToCollection(
      'eventRegistrations',
      rows => {
        setRegistered(
          new Set(
            rows
              .filter(row => row.userId === user.uid)
              .map(row => `${user.uid}_${row.eventId}`)
          )
        );
      },
      { limit: 200 },
      err => setError(err?.message || 'Unable to load registrations.')
    );
  }, [user]);

  const seedEvents = async () => {
    await Promise.all(
      fallbackEvents.map(e =>
        setDocument('events', slug(e.title), {
          ...e,
          id: slug(e.title)
        })
      )
    );
  };

  useEffect(() => {
    if (!events.length && user) {
      seedEvents().catch(err =>
        console.error('Event seed failed:', err)
      );
    }
  }, [events.length, user]);

  const list = events.length ? events : fallbackEvents;

  const register = async event => {
    if (!user) {
      setError('Please sign in first.');
      return;
    }

    const eventId = event.id || slug(event.title);
    const key = `${user.uid}_${eventId}`;

    if (registered.has(key)) return;

    setError('');

    try {
      await setDocument(
        'eventRegistrations',
        `${user.uid}_${eventId}`,
        {
          userId: user.uid,
          userName: user.displayName || 'Student',
          eventId,
          eventTitle: event.title
        }
      );

      await incrementDocumentField(
        'events',
        eventId,
        'attendeeCount',
        1
      );

      setRegistered(prev => {
        const updated = new Set(prev);
        updated.add(key);
        return updated;
      });

      try {
        await addActivity({
          category: 'Event',
          icon: 'Calendar',
          color: '#f97316',
          text: `${user.displayName || 'A student'} registered for ${event.title}.`,
          userId: user.uid
        });
      } catch (activityError) {
        console.error('Activity logging failed:', activityError);
      }
    } catch (error) {
      console.error('Event registration failed:', error);
      setError(
        error?.message || 'Unable to register for this event.'
      );
    }
  };

  return (
    <section className="section" id="events" ref={ref}>
      <div className="container">
        <div className={`section-header reveal ${visible ? 'visible' : ''}`}>
          <div className="section-tag">Events</div>

          <h2 className="section-title">
            What's Happening at ABES?
          </h2>

          <p className="section-subtitle">
            Stay updated on hackathons, workshops, fests and campus activities.
          </p>

          {error && (
            <div
              className="auth-error"
              style={{ maxWidth: 700, margin: '16px auto' }}
            >
              {error}
            </div>
          )}
        </div>

        <div className={`events-grid reveal ${visible ? 'visible' : ''}`}>
          {list.map((e, i) => {
            const Icon = Icons[e.icon] || Icons.Calendar;
            const color = eventColors[i % eventColors.length];
            const eventId = e.id || slug(e.title);
            const key = user ? `${user.uid}_${eventId}` : '';
            const isRegistered = registered.has(key);

            return (
              <div
                key={eventId}
                className="event-card"
              >
                <div className="event-card-header">
                  <div
                    className="event-icon"
                    style={{
                      background: `${color}15`,
                      color
                    }}
                  >
                    <Icon size={24} />
                  </div>

                  <span className="event-badge">
                    {e.status || 'Open'}
                  </span>
                </div>

                <div className="event-date">
                  <Calendar
                    size={14}
                    style={{
                      display: 'inline',
                      marginRight: 6
                    }}
                  />
                  {e.date} • {e.category}
                </div>

                <h3 className="event-title">
                  {e.title}
                </h3>

                <p className="event-desc">
                  {e.description}
                </p>

                <div className="event-attendees">
                  <Users size={14} />
                  {e.attendeeCount || 0} registered
                </div>

                <button
                  className="event-register"
                  onClick={() => register(e)}
                  disabled={isRegistered}
                >
                  {isRegistered ? 'Registered' : 'Register'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}