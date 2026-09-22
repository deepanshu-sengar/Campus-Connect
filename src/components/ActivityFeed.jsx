import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { activities as fallbackActivities } from '../data/activities';
import { subscribeToCollection } from '../services/firestore';

export default function ActivityFeed() {
  const { ref, visible } = useScrollReveal();
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToCollection(
      'activities',
      setActivities,
      {
        orderField: 'createdAt',
        orderDirection: 'desc',
        limit: 20,
      },
      err => {
        console.error('Activity feed error:', err);

        setError(
          err?.message || 'Unable to load live activity.'
        );
      }
    );

    return unsubscribe;
  }, []);

  const formatTime = timestamp => {
    if (!timestamp) return 'Recently';

    let date;

    if (timestamp?.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }

    if (Number.isNaN(date.getTime())) {
      return 'Recently';
    }

    const diff = Date.now() - date.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
      return 'Just now';
    }

    if (minutes < 60) {
      return `${minutes} ${
        minutes === 1 ? 'minute' : 'minutes'
      } ago`;
    }

    if (hours < 24) {
      return `${hours} ${
        hours === 1 ? 'hour' : 'hours'
      } ago`;
    }

    if (days < 7) {
      return `${days} ${
        days === 1 ? 'day' : 'days'
      } ago`;
    }

    return date.toLocaleDateString();
  };

  const list =
    activities.length > 0
      ? activities
      : fallbackActivities;

  return (
    <section
      className="section"
      id="activity"
      ref={ref}
    >
      <div className="container">
        <div
          className={`section-header ${
            visible ? 'visible' : ''
          }`}
        >
          <div className="section-tag">
            Live Feed
          </div>

          <h2 className="section-title">
            What's Happening Around Campus?
          </h2>

          <p className="section-subtitle">
            A real-time stream of campus activity across
            academics, placements, communities and more.
          </p>

          {error && (
            <div
              className="auth-error"
              style={{
                maxWidth: 700,
                margin: '16px auto',
              }}
            >
              {error}
            </div>
          )}
        </div>

        <div
          className={`activity-timeline ${
            visible ? 'visible' : ''
          }`}
        >
          {list.map((a, i) => {
            const Icon =
              Icons[a.icon] || Icons.Bell;

            const color =
              a.color || '#3b82f6';

            return (
              <div
                key={a.id || i}
                className="activity-item"
              >
                <div
                  className="activity-icon"
                  style={{
                    background: `${color}15`,
                    color,
                    borderColor: `${color}30`,
                  }}
                >
                  <Icon size={20} />
                </div>

                <div className="activity-content">
                  <div
                    className="activity-category"
                    style={{ color }}
                  >
                    {a.category}
                  </div>

                  <div className="activity-text">
                    {a.text}
                  </div>

                  <div className="activity-time">
                    {a.time ||
                      formatTime(a.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}