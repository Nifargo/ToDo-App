import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  onSnapshot,
} from 'firebase/firestore';
import type {
  QueryConstraint,
  DocumentData,
  WithFieldValue,
  UpdateData,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

interface UseFirestoreResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  create: (data: WithFieldValue<DocumentData>) => Promise<string>;
  update: (id: string | number, data: UpdateData<DocumentData>) => Promise<void>;
  remove: (id: string | number) => Promise<void>;
  getById: (id: string | number) => Promise<T | null>;
}

export function useFirestore<T extends { id: string }>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  realtime: boolean = false
): UseFirestoreResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Serialize constraints to avoid unnecessary re-renders
  const constraintsKey = useMemo(
    () => JSON.stringify(constraints.map((c) => c.toString())),
    [constraints]
  );

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const collectionRef = collection(db, collectionName);
        const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef;

        if (realtime) {
          // Real-time listener
          unsubscribe = onSnapshot(
            q,
            (snapshot) => {
              const items = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              })) as T[];

              setData(items);
              setLoading(false);
            },
            (err) => {
              console.error('[useFirestore] Snapshot error:', err);
              setError(err as Error);
              setLoading(false);
            }
          );
        } else {
          // One-time fetch
          const snapshot = await getDocs(q);
          const items = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as T[];

          setData(items);
          setLoading(false);
        }
      } catch (err) {
        console.error('Firestore fetch error:', err);
        setError(err as Error);
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, realtime, constraintsKey]);

  const create = async (newData: WithFieldValue<DocumentData>): Promise<string> => {
    try {
      const collectionRef = collection(db, collectionName);
      const docRef = await addDoc(collectionRef, {
        ...newData,
        createdAt: new Date().toISOString(),
      });
      return docRef.id;
    } catch (err) {
      console.error('Firestore create error:', err);
      throw err;
    }
  };

  const update = async (id: string | number, updateData: UpdateData<DocumentData>): Promise<void> => {
    try {
      // Convert number ID to string for backward compatibility with Vanilla JS version
      const idString = typeof id === 'number' ? id.toString() : id;

      if (!idString || typeof idString !== 'string' || idString.trim() === '') {
        const errorMsg = `Invalid document ID: "${idString}" (original type: ${typeof id})`;
        console.error('[useFirestore] Update validation failed:', errorMsg);
        throw new Error(errorMsg);
      }

      if (!collectionName || typeof collectionName !== 'string') {
        const errorMsg = `Invalid collection name: "${collectionName}"`;
        console.error('[useFirestore] Update validation failed:', errorMsg);
        throw new Error(errorMsg);
      }

      const docRef = doc(db, collectionName, idString);

      // Use Object.assign to avoid issues with spread operator and Firebase UpdateData type
      const updates = Object.assign({}, updateData, {
        updatedAt: new Date().toISOString(),
      });

      await updateDoc(docRef, updates);
    } catch (err) {
      console.error('[useFirestore] Update error:', {
        error: err,
        id,
        collectionName,
        updateData,
      });
      throw err;
    }
  };

  const remove = async (id: string | number): Promise<void> => {
    try {
      // Convert number ID to string for backward compatibility with Vanilla JS version
      const idString = typeof id === 'number' ? id.toString() : id;

      if (!idString || typeof idString !== 'string' || idString.trim() === '') {
        const errorMsg = `Invalid document ID: "${idString}" (original type: ${typeof id})`;
        console.error('[useFirestore] Remove validation failed:', errorMsg);
        throw new Error(errorMsg);
      }

      const docRef = doc(db, collectionName, idString);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('[useFirestore] Delete error:', err);
      throw err;
    }
  };

  const getById = async (id: string | number): Promise<T | null> => {
    try {
      // Convert number ID to string for backward compatibility with Vanilla JS version
      const idString = typeof id === 'number' ? id.toString() : id;

      if (!idString || typeof idString !== 'string' || idString.trim() === '') {
        const errorMsg = `Invalid document ID: "${idString}" (original type: ${typeof id})`;
        console.error('[useFirestore] GetById validation failed:', errorMsg);
        throw new Error(errorMsg);
      }

      const docRef = doc(db, collectionName, idString);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      return null;
    } catch (err) {
      console.error('[useFirestore] GetById error:', err);
      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    create,
    update,
    remove,
    getById,
  };
}