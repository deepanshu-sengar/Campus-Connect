import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const sortDocuments = (items, field, direction = 'desc') => {
  if (!field) return items;

  return [...items].sort((a, b) => {
    const av = a[field];
    const bv = b[field];

    const at = av?.toMillis
      ? av.toMillis()
      : (av ? new Date(av).getTime() : 0);

    const bt = bv?.toMillis
      ? bv.toMillis()
      : (bv ? new Date(bv).getTime() : 0);

    if (typeof av === 'string' && typeof bv === 'string') {
      return direction === 'asc'
        ? av.localeCompare(bv)
        : bv.localeCompare(av);
    }

    return direction === 'asc' ? at - bt : bt - at;
  });
};

export const subscribeToCollection = (
  collectionName,
  callback,
  options = {},
  onError
) => {
  const source = collection(db, collectionName);
  const constraints = options.limit ? [limit(options.limit)] : [];
  const q = query(source, ...constraints);

  return onSnapshot(
    q,
    snapshot => {
      let items = snapshot.docs.map(item => ({
        id: item.id,
        ...item.data(),
      }));

      items = sortDocuments(
        items,
        options.orderField,
        options.orderDirection || 'desc'
      );

      if (options.limit) {
        items = items.slice(0, options.limit);
      }

      callback(items);
    },
    error => {
      console.error(
        `Firestore subscription failed for ${collectionName}:`,
        error
      );

      callback([]);
      onError?.(error);
    }
  );
};

export const createDocument = (collectionName, data) =>
  addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
  });

export const setDocument = (collectionName, id, data) =>
  setDoc(
    doc(db, collectionName, id),
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

export const updateDocument = (collectionName, id, data) =>
  updateDoc(doc(db, collectionName, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });

export const incrementDocumentField = (
  collectionName,
  id,
  field,
  value
) =>
  updateDoc(doc(db, collectionName, id), {
    [field]: increment(value),
    updatedAt: serverTimestamp(),
  });

export const removeDocument = (collectionName, id) =>
  deleteDoc(doc(db, collectionName, id));

export const getDocument = (collectionName, id) =>
  getDoc(doc(db, collectionName, id));

export const getCollection = async collectionName => {
  const snapshot = await getDocs(collection(db, collectionName));

  return snapshot.docs.map(item => ({
    id: item.id,
    ...item.data(),
  }));
};

export const setUserDocument = (uid, data) =>
  setDoc(doc(db, 'users', uid), data, { merge: true });

export const addActivity = data =>
  createDocument('activities', data);

export const uploadAcademicNote = async (
  file,
  title,
  subject,
  user,
  onProgress
) => {
  if (!file) {
    throw new Error('Please select a file.');
  }

  if (file.size > 100 * 1024 * 1024) {
    throw new Error('File size must be less than 100 MB.');
  }

  const cloudName =
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

  const uploadPreset =
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration is missing.');
  }

  const formData = new FormData();

  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  formData.append(
    'folder',
    `academicNotes/${user.uid}`
  );

  const result = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open(
      'POST',
      `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`
    );

    xhr.upload.addEventListener(
      'progress',
      event => {
        if (event.lengthComputable) {
          const progress =
            (event.loaded / event.total) * 100;

          onProgress?.(Math.round(progress));
        }
      }
    );

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(
            new Error(
              'Invalid response received from Cloudinary.'
            )
          );
        }
      } else {
        let message =
          'Cloudinary upload failed.';

        try {
          const response = JSON.parse(
            xhr.responseText
          );

          if (response?.error?.message) {
            message = response.error.message;
          }
        } catch {
          if (xhr.responseText) {
            message = xhr.responseText;
          }
        }

        reject(new Error(message));
      }
    });

    xhr.addEventListener('error', () => {
      reject(
        new Error(
          'Network error occurred during file upload.'
        )
      );
    });

    xhr.addEventListener('abort', () => {
      reject(
        new Error(
          'File upload was cancelled.'
        )
      );
    });

    xhr.send(formData);
  });

  const resource = await createDocument(
    'academicResources',
    {
      title,
      subject,
      fileName: file.name,
      fileURL: result.secure_url,
      filePath: result.public_id,
      fileSize: file.size,
      userId: user.uid,
      userName: user.displayName || 'Student',
    }
  );

  try {
    await addActivity({
      category: 'Academics',
      text: `${user.displayName || 'Student'} shared "${title}" in ${subject}`,
      icon: 'FileText',
      color: '#8b5cf6',
      userId: user.uid,
      userName: user.displayName || 'Student',
      subject,
      fileName: file.name,
    });

    console.log(
      'Academic activity created successfully.'
    );
  } catch (error) {
    console.error(
      'Failed to create academic activity:',
      error
    );
  }

  return resource;
};