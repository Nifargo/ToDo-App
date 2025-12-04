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
  update: (id: string, data: UpdateData<DocumentData>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  getById: (id: string) => Promise<T | null>;
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
              console.error('Firestore snapshot error:', err);
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

  const update = async (id: string, updateData: UpdateData<DocumentData>): Promise<void> => {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Firestore update error:', err);
      throw err;
    }
  };

  const remove = async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Firestore delete error:', err);
      throw err;
    }
  };

  const getById = async (id: string): Promise<T | null> => {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      return null;
    } catch (err) {
      console.error('Firestore getById error:', err);
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