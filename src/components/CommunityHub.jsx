import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { communities as fallbackCommunities } from '../data/communities';
import {
  addActivity,
  setDocument,
  subscribeToCollection,
  incrementDocumentField,
  removeDocument
} from '../services/firestore';
import { useAuth } from '../context/AuthContext';

const avatarColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

const slug = value =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function CommunityHub() {
  const { ref, visible } = useScrollReveal();
  const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [joined, setJoined] = useState(new Set());
  const [error, setError] = useState('');

  useEffect(
    () =>
      subscribeToCollection(
        'communities',
        setCommunities,
        {
          orderField: 'name',
          orderDirection: 'asc',
          limit: 50
        }
      ),
    []
  );

  useEffect(() => {
    if (!user) {
      setJoined(new Set());
      return;
    }

    return subscribeToCollection(
      'communityMembers',
      rows => {
        setJoined(
          new Set(
            rows
              .filter(row => row.userId === user.uid)
              .map(row => `${user.uid}_${row.communityName}`)
          )
        );
      },
      { limit: 200 },
      err => setError(err?.message || 'Unable to load memberships.')
    );
  }, [user]);

  const seedCommunities = async () => {
    await Promise.all(
      fallbackCommunities.map(c =>
        setDocument('communities', slug(c.name), {
          ...c,
          id: slug(c.name)
        })
      )
    );
  };

  useEffect(() => {
    if (!communities.length && user) {
      seedCommunities().catch(err =>
        console.error('Community seed failed:', err)
      );
    }
  }, [communities.length, user]);

  const list = communities.length ? communities : fallbackCommunities;

  const join = async community => {
    if (!user) {
      setError('Please sign in first.');
      return;
    }

    const key = `${user.uid}_${community.name}`;

    if (joined.has(key)) return;

    setError('');

    try {
      const communityId = community.id || slug(community.name);

      await setDocument(
        'communityMembers',
        `${user.uid}_${slug(community.name)}`,
        {
          userId: user.uid,
          userName: user.displayName || 'Student',
          communityId,
          communityName: community.name
        }
      );

      await incrementDocumentField(
        'communities',
        communityId,
        'members',
        1
      );

      setJoined(prev => {
        const updated = new Set(prev);
        updated.add(key);
        return updated;
      });

      try {
        await addActivity({
          category: 'Community',
          icon: 'Users',
          color: '#8b5cf6',
          text: `${user.displayName || 'A student'} joined ${community.name}.`,
          userId: user.uid
        });
      } catch (activityError) {
        console.error('Activity logging failed:', activityError);
      }
    } catch (error) {
      console.error('Community join failed:', error);
      setError(error?.message || 'Unable to join this community.');
    }
  };

  const unjoin = async community => {
    if (!user) {
      setError('Please sign in first.');
      return;
    }

    const key = `${user.uid}_${community.name}`;

    if (!joined.has(key)) return;

    setError('');

    try {
      const communityId = community.id || slug(community.name);

      await removeDocument(
        'communityMembers',
        `${user.uid}_${slug(community.name)}`
      );

      await incrementDocumentField(
        'communities',
        communityId,
        'members',
        -1
      );

      setJoined(prev => {
        const updated = new Set(prev);
        updated.delete(key);
        return updated;
      });

      try {
        await addActivity({
          category: 'Community',
          icon: 'Users',
          color: '#ef4444',
          text: `${user.displayName || 'A student'} left ${community.name}.`,
          userId: user.uid
        });
      } catch (activityError) {
        console.error('Activity logging failed:', activityError);
      }
    } catch (error) {
      console.error('Community unjoin failed:', error);
      setError(error?.message || 'Unable to leave this community.');
    }
  };

  return (
    <section className="section" id="communities" ref={ref}>
      <div className="container">
        <div className={`section-header reveal ${visible ? 'visible' : ''}`}>
          <div className="section-tag">Communities</div>

          <h2 className="section-title">Find Your People</h2>

          <p className="section-subtitle">
            Join communities, discover student clubs and connect with people who share your interests.
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

        <div className={`communities-grid reveal ${visible ? 'visible' : ''}`}>
          {list.map((c, i) => {
            const Icon = Icons[c.icon] || Icons.Users;
            const key = user ? `${user.uid}_${c.name}` : '';
            const isJoined = joined.has(key);

            return (
              <div
                key={c.id || c.name || i}
                className="community-card"
              >
                <div className="community-card-header">
                  <div
                    className="community-icon"
                    style={{
                      background: `${c.color}15`,
                      color: c.color
                    }}
                  >
                    <Icon size={24} />
                  </div>

                  <div>
                    <div className="community-name">
                      {c.name}
                    </div>

                    <div className="community-members">
                      {c.members || 0} members
                    </div>
                  </div>
                </div>

                <div className="community-footer">
                  <div className="avatar-stack">
                    {avatarColors.slice(0, 3).map((color, ai) => (
                      <div
                        key={ai}
                        className="avatar"
                        style={{ background: color }}
                      >
                        {String.fromCharCode(65 + ai)}
                      </div>
                    ))}

                    <div
                      className="avatar"
                      style={{
                        background: 'var(--navy-600)',
                        fontSize: '0.7rem'
                      }}
                    >
                      +{Math.max((c.members || 3) - 3, 0)}
                    </div>
                  </div>

                  {isJoined ? (
                    <button
                      className="join-btn"
                      onClick={() => unjoin(c)}
                    >
                      Unjoin
                    </button>
                  ) : (
                    <button
                      className="join-btn"
                      onClick={() => join(c)}
                    >
                      Join
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}