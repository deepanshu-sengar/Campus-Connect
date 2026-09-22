import { useState, useEffect } from 'react';
import { FileText, Upload, X, Plus } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { subjects } from '../data/activities';
import {
  subscribeToCollection,
  uploadAcademicNote,
} from '../services/firestore';
import { useAuth } from '../context/AuthContext';

export default function AcademicsPreview() {
  const { ref, visible } = useScrollReveal();
  const { user } = useAuth();

  const [resources, setResources] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToCollection(
      'academicResources',
      setResources,
      {
        orderField: 'createdAt',
        orderDirection: 'desc',
        limit: 100,
      },
      error => {
        console.error(
          'Academic resources subscription failed:',
          error
        );
      }
    );

    return unsubscribe;
  }, []);

  const groupedResources = resources.reduce(
    (groups, resource) => {
      const subjectName =
        resource.subject?.trim() || 'Other';

      if (!groups[subjectName]) {
        groups[subjectName] = [];
      }

      groups[subjectName].push(resource);

      return groups;
    },
    {}
  );

  const openForm = () => {
    if (!user) {
      setError('Please sign in first.');
      return;
    }

    setError('');
    setShowForm(true);
  };

  const handleFileChange = e => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    if (selectedFile.size > 100 * 1024 * 1024) {
      setFile(null);
      setError('File size must be less than 100 MB.');
      e.target.value = '';
      return;
    }

    setError('');
    setFile(selectedFile);
  };

  const submit = async e => {
    e.preventDefault();

    if (!user) {
      setError('Please sign in first.');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a note title.');
      return;
    }

    if (!subject) {
      setError('Please select a subject.');
      return;
    }

    if (subject === 'Other' && !customSubject.trim()) {
      setError('Please enter the subject name.');
      return;
    }

    if (!file) {
      setError('Please select a file.');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError('File size must be less than 100 MB.');
      return;
    }

    const finalSubject =
      subject === 'Other'
        ? customSubject.trim()
        : subject;

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      await uploadAcademicNote(
        file,
        title.trim(),
        finalSubject,
        user,
        progress => setUploadProgress(progress)
      );

      setTitle('');
      setSubject('');
      setCustomSubject('');
      setFile(null);
      setUploadProgress(0);
      setShowForm(false);
    } catch (error) {
      console.error('Note upload failed:', error);

      setError(
        error?.message || 'Unable to upload the note.'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <section
      className="section"
      id="academics"
      ref={ref}
    >
      <div className="container">
        <div
          className={`section-header reveal ${
            visible ? 'visible' : ''
          }`}
        >
          <div className="section-tag">
            Academics
          </div>

          <h2 className="section-title">
            Your Academic Command Center
          </h2>

          <p className="section-subtitle">
            Everything you need for your semester,
            organized by subject.
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
          className={`academics-dashboard reveal ${
            visible ? 'visible' : ''
          }`}
        >
          {Object.keys(groupedResources).length > 0 ? (
            Object.entries(groupedResources).map(
              ([subjectName, notes]) => (
                <div
                  className="academics-card"
                  key={subjectName}
                >
                  <div className="academics-card-title">
                    <FileText
                      size={20}
                      color="#8b5cf6"
                    />

                    {subjectName}

                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: '0.8rem',
                        opacity: 0.7,
                      }}
                    >
                      {notes.length}{' '}
                      {notes.length === 1
                        ? 'note'
                        : 'notes'}
                    </span>
                  </div>

                  <div>
                    {notes.map(resource => (
                      <a
                        key={resource.id}
                        href={resource.fileURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="resource-item"
                        style={{
                          textDecoration: 'none',
                          color: 'inherit',
                          cursor: 'pointer',
                        }}
                      >
                        <div className="resource-icon">
                          <FileText size={18} />
                        </div>

                        <div>
                          <div className="resource-name">
                            {resource.title}
                          </div>

                          <div
                            style={{
                              fontSize: '0.8rem',
                              opacity: 0.7,
                              marginTop: 3,
                            }}
                          >
                            {resource.fileName}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )
            )
          ) : (
            <div
              className="academics-card"
              style={{
                textAlign: 'center',
                padding: 40,
              }}
            >
              <FileText
                size={40}
                color="#8b5cf6"
                style={{
                  marginBottom: 12,
                }}
              />

              <h3>No Notes Yet</h3>

              <p
                style={{
                  opacity: 0.7,
                  marginBottom: 20,
                }}
              >
                Start building your academic library
                by adding your first note.
              </p>
            </div>
          )}
        </div>

        <div
          style={{
            textAlign: 'center',
            marginTop: 24,
          }}
        >
          <button
            type="button"
            className="btn btn-primary"
            onClick={openForm}
          >
            <Plus size={18} />
            Add Subject Notes
          </button>
        </div>

        {showForm && (
          <div
            className="modal-backdrop"
            onMouseDown={() => {
              if (!uploading) {
                setShowForm(false);
              }
            }}
          >
            <form
              className="modal-card"
              onSubmit={submit}
              onMouseDown={e =>
                e.stopPropagation()
              }
            >
              <button
                type="button"
                className="modal-close"
                disabled={uploading}
                onClick={() =>
                  setShowForm(false)
                }
              >
                <X size={18} />
              </button>

              <h3>
                Share Academic Notes
              </h3>

              <input
                required
                disabled={uploading}
                placeholder="Note title"
                value={title}
                onChange={e =>
                  setTitle(e.target.value)
                }
              />

              <select
                required
                disabled={uploading}
                value={subject}
                onChange={e => {
                  setSubject(e.target.value);

                  if (e.target.value !== 'Other') {
                    setCustomSubject('');
                  }
                }}
              >
                <option value="">
                  Select Subject
                </option>

                {subjects.map(s => (
                  <option
                    key={s.name}
                    value={s.name}
                  >
                    {s.name}
                  </option>
                ))}

                <option value="Other">
                  Other / Add New Subject
                </option>
              </select>

              {subject === 'Other' && (
                <input
                  required
                  disabled={uploading}
                  type="text"
                  placeholder="Enter subject name"
                  value={customSubject}
                  onChange={e =>
                    setCustomSubject(e.target.value)
                  }
                />
              )}

              <input
                required
                disabled={uploading}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                onChange={handleFileChange}
              />

              <p
                style={{
                  fontSize: '0.85rem',
                  margin: '8px 0 16px',
                }}
              >
                Maximum file size:{' '}
                <strong>100 MB</strong>
              </p>

              {file && (
                <p
                  style={{
                    fontSize: '0.85rem',
                    marginBottom: 16,
                  }}
                >
                  Selected: {file.name}
                </p>
              )}

              {uploading && (
                <div
                  style={{
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.85rem',
                      marginBottom: 6,
                    }}
                  >
                    <span>
                      Uploading...
                    </span>

                    <strong>
                      {uploadProgress}%
                    </strong>
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
                        transition:
                          'width 0.2s ease',
                      }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={uploading}
              >
                {uploading
                  ? `Uploading... ${uploadProgress}%`
                  : 'Share Note'}
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}