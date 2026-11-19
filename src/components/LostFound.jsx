import { useEffect, useRef, useState } from 'react';
import { MapPin, Clock, Plus, Search, X, ImagePlus } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { lostFoundItems as fallbackItems } from '../data/activities';
import {
  addActivity,
  createDocument,
  subscribeToCollection,
  updateDocument,
  uploadLostFoundImage,
} from '../services/firestore';
import { useAuth } from '../context/AuthContext';

const MAX_IMAGE_SIZE = 1024 * 1024;

export default function LostFound() {
  const { ref, visible } = useScrollReveal();
  const { user } = useAuth();
  const imageInputRef = useRef(null);

  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState('LOST');
  const [search, setSearch] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [form, setForm] = useState({ title: '', location: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    return subscribeToCollection(
      'lostFound',
      setItems,
      { orderField: 'createdAt', orderDirection: 'desc', limit: 100 },
      err => setError(err?.message || 'Unable to load Lost & Found reports.')
    );
  }, []);

  const displayed = (items.length ? items : fallbackItems).filter(item =>
    `${item.title} ${item.location} ${item.description || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const clearImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImage(null);
    setImagePreview('');

    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const closeForm = () => {
    setShowForm(false);
    clearImage();
    setForm({ title: '', location: '', description: '' });
    setUploadProgress(0);
  };

  const openForm = nextType => {
    if (!user) {
      alert('Please sign in first.');
      return;
    }

    setError('');
    setType(nextType);
    setShowForm(true);
  };

  const handleImageChange = e => {
    const selected = e.target.files?.[0];

    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      setError('Please select an image file.');
      e.target.value = '';
      return;
    }

    if (selected.size >= MAX_IMAGE_SIZE) {
      setError('Image size must be less than 1 MB.');
      e.target.value = '';
      return;
    }

    setError('');

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImage(selected);
    setImagePreview(URL.createObjectURL(selected));
  };

  const submit = async e => {
    e.preventDefault();

    if (!user) {
      setError('Please sign in first.');
      return;
    }

    setSaving(true);
    setUploadProgress(0);
    setError('');

    try {
      let imageData = null;

      if (image) {
        imageData = await uploadLostFoundImage(
          image,
          user,
          progress => setUploadProgress(progress)
        );
      }

      await createDocument('lostFound', {
        ...form,
        type,
        icon: type === 'FOUND' ? 'PackageCheck' : 'Search',
        userId: user.uid,
        userName: user.displayName || 'Student',
        status: 'OPEN',
        ...(imageData && {
          imageURL: imageData.secure_url,
          imagePublicId: imageData.public_id,
          imageName: image.name,
          imageSize: image.size,
        }),
      });

      try {
        await addActivity({
          category: 'Lost & Found',
          icon: type === 'FOUND' ? 'PackageCheck' : 'Search',
          color: '#f59e0b',
          text: `${user.displayName || 'A student'} reported a ${type.toLowerCase()} item: ${form.title}.`,
          userId: user.uid,
        });
      } catch (activityError) {
        console.error('Activity logging failed:', activityError);
      }

      closeForm();
    } catch (error) {
      setError(error?.message || 'Unable to save the report.');
      console.error(error);
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  const resolveReport = async item => {
    if (!user) {
      setError('Please sign in first.');
      return;
    }

    if (item.userId !== user.uid) {
      setError('Only the person who created this report can resolve it.');
      return;
    }

    if (item.status === 'RESOLVED') return;

    try {
      await updateDocument('lostFound', item.id, {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      });

      try {
        await addActivity({
          category: 'Lost & Found',
          icon: 'CheckCircle',
          color: '#10b981',
          text: `${user.displayName || 'A student'} marked ${item.title} as resolved.`,
          userId: user.uid,
        });
      } catch (activityError) {
        console.error('Activity logging failed:', activityError);
      }
    } catch (error) {
      console.error('Resolve report failed:', error);
      setError(error?.message || 'Unable to mark this report as resolved.');
    }
  };

  return (
    <section className="section" id="lost-found" ref={ref}>
      <div className="container">
        <div className={`section-header reveal ${visible ? 'visible' : ''}`}>
          <div className="section-tag">Lost & Found</div>

          <h2 className="section-title">
            Lost Something? Found Something?
          </h2>

          <p className="section-subtitle">
            Report campus belongings and help reconnect them with their owners.
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

        <div className="lostfound-toolbar">
          <div className="lostfound-search">
            <Search size={18} />

            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search items..."
            />
          </div>
        </div>

        <div className={`lostfound-grid reveal ${visible ? 'visible' : ''}`}>
          {displayed.map((item, i) => {
            const Icon = Icons[item.icon] || Icons.Search;
            const isOwner = user && item.userId === user.uid;
            const isResolved = item.status === 'RESOLVED';

            return (
              <div key={item.id || i} className="lostfound-card">
                <div
                  className={`lostfound-type ${String(item.type).toLowerCase()}`}
                >
                  {item.type}
                </div>

                {item.imageURL && (
                  <img
                    src={item.imageURL}
                    alt={item.title}
                    style={{
                      width: '100%',
                      height: 180,
                      objectFit: 'cover',
                      borderRadius: 14,
                      marginBottom: 16,
                    }}
                  />
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <div
                    className="feature-icon"
                    style={{
                      background:
                        item.type === 'FOUND'
                          ? 'rgba(16,185,129,0.12)'
                          : 'rgba(239,68,68,0.12)',
                      color:
                        item.type === 'FOUND' ? '#10b981' : '#f87171',
                      width: 44,
                      height: 44,
                      marginBottom: 0,
                    }}
                  >
                    <Icon size={22} />
                  </div>

                  <h3
                    className="lostfound-title"
                    style={{ marginBottom: 0 }}
                  >
                    {item.title}
                  </h3>
                </div>

                <div className="lostfound-meta">
                  <span className="lostfound-meta-item">
                    <MapPin size={14} />
                    {item.location}
                  </span>

                  <span className="lostfound-meta-item">
                    <Clock size={14} />
                    {item.time || 'Recently reported'}
                  </span>
                </div>

                {item.description && <p>{item.description}</p>}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    marginTop: 16,
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: isResolved ? '#10b981' : '#f59e0b',
                    }}
                  >
                    {isResolved ? 'RESOLVED' : 'OPEN'}
                  </span>

                  {isOwner && !isResolved && (
                    <button
                      className="btn btn-primary"
                      onClick={() => resolveReport(item)}
                    >
                      Mark as Resolved
                    </button>
                  )}

                  {isOwner && isResolved && (
                    <button
                      className="btn btn-secondary"
                      disabled
                    >
                      Resolved
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className={`lostfound-actions reveal ${visible ? 'visible' : ''}`}>
          <button
            className="btn btn-primary"
            onClick={() => openForm('LOST')}
          >
            <Plus size={18} />
            Report Lost Item
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => openForm('FOUND')}
          >
            <Search size={18} />
            Report Found Item
          </button>
        </div>

        {showForm && (
          <div
            className="modal-backdrop"
            onMouseDown={closeForm}
            style={{
              overflowY: 'auto',
              alignItems: 'flex-start',
              padding: '24px 16px',
            }}
          >
            <form
              className="modal-card"
              onSubmit={submit}
              onMouseDown={e => e.stopPropagation()}
              style={{
                maxHeight: '90vh',
                overflowY: 'auto',
                overflowX: 'hidden',
              }}
            >
              <button
                type="button"
                className="modal-close"
                disabled={saving}
                onClick={closeForm}
              >
                <X size={18} />
              </button>

              <h3>
                Report {type === 'FOUND' ? 'Found' : 'Lost'} Item
              </h3>

              <input
                required
                placeholder="Item name"
                value={form.title}
                onChange={e =>
                  setForm({
                    ...form,
                    title: e.target.value,
                  })
                }
              />

              <input
                required
                placeholder="Location"
                value={form.location}
                onChange={e =>
                  setForm({
                    ...form,
                    location: e.target.value,
                  })
                }
              />

              <textarea
                placeholder="Description (optional)"
                value={form.description}
                onChange={e =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
              />

              <div
                style={{
                  marginTop: 8,
                  marginBottom: 18,
                  padding: 16,
                  border: '1px solid #d1d5db',
                  borderRadius: 12,
                  background: 'rgba(59,130,246,0.04)',
                }}
              >
                <label
                  htmlFor="lost-found-image"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8,
                    fontWeight: 600,
                  }}
                >
                  <ImagePlus size={18} />
                  Item Image <span style={{ opacity: 0.6 }}>(Optional)</span>
                </label>

                <input
                  id="lost-found-image"
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={saving}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: 10,
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    background: '#fff',
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                />

                <p
                  style={{
                    fontSize: '0.82rem',
                    margin: '8px 0 0',
                    opacity: 0.75,
                  }}
                >
                  Students, faculty and admins can attach an image. Maximum size: less than 1 MB.
                </p>

                {image && (
                  <p
                    style={{
                      fontSize: '0.82rem',
                      margin: '8px 0 0',
                      fontWeight: 600,
                    }}
                  >
                    Selected: {image.name}
                  </p>
                )}

                {imagePreview && (
                  <div
                    style={{
                      position: 'relative',
                      marginTop: 14,
                    }}
                  >
                    <img
                      src={imagePreview}
                      alt="Selected item preview"
                      style={{
                        width: '100%',
                        maxHeight: 220,
                        objectFit: 'cover',
                        borderRadius: 12,
                      }}
                    />

                    <button
                      type="button"
                      className="modal-close"
                      style={{
                        background: 'rgba(0,0,0,0.65)',
                        color: '#fff',
                      }}
                      onClick={clearImage}
                      disabled={saving}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {saving && image && (
                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.85rem',
                      marginBottom: 6,
                    }}
                  >
                    <span>Uploading image...</span>
                    <strong>{uploadProgress}%</strong>
                  </div>

                  <div
                    style={{
                      width: '100%',
                      height: 8,
                      background: '#e5e7eb',
                      borderRadius: 999,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${uploadProgress}%`,
                        height: '100%',
                        background: '#3b82f6',
                        transition: 'width 0.2s ease',
                      }}
                    />
                  </div>
                </div>
              )}

              <button
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}