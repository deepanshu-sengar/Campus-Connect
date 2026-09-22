import { useEffect, useRef, useState } from 'react';
import { Send, Smile, Paperclip, ArrowRight, Hash, Users } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { chatMessages as fallbackMessages } from '../data/chatMessages';
import { addActivity, createDocument, subscribeToCollection } from '../services/firestore';
import { useAuth } from '../context/AuthContext';

const rooms = ['DSA', 'Web Dev', 'Placements', 'First Year', 'AI & ML', 'Projects', 'General'];

export default function CommunityChat() {
  const { ref, visible } = useScrollReveal();
  const { user } = useAuth();
  const [activeRoom, setActiveRoom] = useState('DSA');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    setChatError('');

    return subscribeToCollection(
      'messages',
      setMessages,
      {
        orderField: 'createdAt',
        orderDirection: 'asc',
        limit: 200
      },
      error =>
        setChatError(
          error?.message || 'Unable to load chat messages.'
        )
    );
  }, []);

  const roomMessages = messages.filter(
    message => message.room === activeRoom
  );

  const displayed = roomMessages.length
    ? roomMessages
    : fallbackMessages.filter(
        message => !message.room || message.room === activeRoom
      );

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [displayed.length, activeRoom]);

  const formatTime = value => {
    if (!value) return 'Sending...';

    const date = value?.toDate
      ? value.toDate()
      : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Recently';
    }

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const sendMessage = async e => {
    e.preventDefault();

    const clean = text.trim();

    if (!clean || loading) return;

    if (!user) {
      setChatError('Please sign in to send messages.');
      return;
    }

    setLoading(true);
    setChatError('');

    try {
      await createDocument('messages', {
        room: activeRoom,
        text: clean,
        userId: user.uid,
        user: user.displayName || 'Student',
        color: '#3b82f6'
      });

      try {
        await addActivity({
          category: 'Chat',
          icon: 'MessageCircle',
          color: '#10b981',
          text: `${user.displayName || 'A student'} sent a message in ${activeRoom}.`,
          userId: user.uid
        });
      } catch (activityError) {
        console.error(
          'Activity logging failed:',
          activityError
        );
      }

      setText('');
    } catch (error) {
      console.error('Chat send failed:', error);

      setChatError(
        error?.message ||
          'Unable to send message. Check Firestore permissions.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="section chat-section"
      id="chat"
      ref={ref}
    >
      <div className="container">
        <div
          className={`section-header reveal ${
            visible ? 'visible' : ''
          }`}
        >
          <div className="section-tag">
            Community Chat
          </div>

          <h2 className="section-title">
            The Campus Conversation Starts Here.
          </h2>

          <p className="section-subtitle">
            Ask questions, share resources, find teammates,
            discuss projects, or simply talk with other ABES
            students.
          </p>
        </div>

        <div
          className={`chat-app reveal ${
            visible ? 'visible' : ''
          }`}
        >
          <div className="chat-app-header">
            <div className="chat-app-title">
              <Hash
                size={18}
                style={{
                  display: 'inline',
                  marginRight: 6
                }}
              />
              {activeRoom} Community
            </div>

            <div className="chat-app-online">
              <span className="online-dot" />
              Campus Connect
            </div>
          </div>

          <div className="chat-app-body">
            <div className="chat-sidebar">
              <div className="chat-sidebar-header">
                Communities
              </div>

              {rooms.map(room => (
                <button
                  type="button"
                  key={room}
                  className={`chat-room ${
                    room === activeRoom ? 'active' : ''
                  }`}
                  onClick={() => setActiveRoom(room)}
                >
                  <span className="chat-room-dot" />
                  {room}
                </button>
              ))}
            </div>

            <div className="chat-main">
              <div className="chat-main-header">
                <Users
                  size={16}
                  style={{
                    display: 'inline',
                    marginRight: 8,
                    color: '#10b981'
                  }}
                />
                {activeRoom} Community
              </div>

              {chatError && (
                <div
                  className="auth-error"
                  style={{ margin: 12 }}
                >
                  {chatError}
                </div>
              )}

              <div
                className="chat-messages"
                ref={messagesContainerRef}
              >
                {displayed.length ? (
                  displayed.map((msg, i) => (
                    <div
                      key={msg.id || i}
                      className="chat-message"
                    >
                      <div
                        className="chat-message-avatar"
                        style={{
                          background:
                            msg.color || '#3b82f6'
                        }}
                      >
                        {(msg.user || 'S')[0]}
                      </div>

                      <div className="chat-message-bubble">
                        <div
                          className="chat-message-user"
                          style={{
                            color:
                              msg.color || '#3b82f6'
                          }}
                        >
                          {msg.user || 'Student'}
                        </div>

                        <div className="chat-message-text">
                          {msg.text}
                        </div>

                        <div className="chat-message-time">
                          {msg.time ||
                            formatTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="chat-message-text">
                    No messages yet. Start the conversation.
                  </div>
                )}
              </div>

              <form
                className="chat-input-bar"
                onSubmit={sendMessage}
              >
                <div className="chat-input-icons">
                  <span className="chat-input-icon">
                    <Smile size={20} />
                  </span>

                  <span className="chat-input-icon">
                    <Paperclip size={20} />
                  </span>
                </div>

                <input
                  className="chat-input-field"
                  placeholder={
                    user
                      ? 'Type a message...'
                      : 'Sign in to chat'
                  }
                  value={text}
                  onChange={e => setText(e.target.value)}
                  disabled={!user || loading}
                  maxLength={1000}
                />

                <button
                  className="chat-send-btn"
                  disabled={
                    !user ||
                    loading ||
                    !text.trim()
                  }
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>

        <div
          style={{
            textAlign: 'center',
            marginTop: 32
          }}
        >
          <a
            className="btn btn-primary"
            href="/chat"
          >
            Enter Community Chat
            <ArrowRight size={18} />
          </a>
        </div>
      </div>
    </section>
  );
}