// Note service for Firebase/localStorage operations
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Note, CreateNoteInput, UpdateNoteInput } from '@/types';

const NOTES_COLLECTION = 'notes';
const LOCAL_STORAGE_KEY = 'notes_local';

// Helper function to extract title from content (first line)
const extractTitle = (content: string): string => {
  const firstLine = content.trim().split('\n')[0];
  return firstLine.trim() || 'Untitled Note';
};

// Helper to convert Firestore timestamp to ISO string
const timestampToString = (timestamp: unknown): string => {
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
    return (timestamp as Timestamp).toDate().toISOString();
  }
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  return new Date().toISOString();
};

export const noteService = {
  // Firebase operations
  async createNote(userId: string, data: CreateNoteInput): Promise<string> {
    const title = extractTitle(data.content);
    const noteData = {
      title,
      content: data.content,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const ref = await addDoc(collection(db, NOTES_COLLECTION), noteData);
    return ref.id;
  },

  async updateNote(id: string, data: UpdateNoteInput): Promise<void> {
    const updateData: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (data.content !== undefined) {
      updateData.content = data.content;
      updateData.title = extractTitle(data.content);
    }

    await updateDoc(doc(db, NOTES_COLLECTION, id), updateData);
  },

  async deleteNote(id: string): Promise<void> {
    await deleteDoc(doc(db, NOTES_COLLECTION, id));
  },

  async getNotesByUser(userId: string): Promise<Note[]> {
    const q = query(
      collection(db, NOTES_COLLECTION),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title || 'Untitled Note',
        content: data.content || '',
        userId: data.userId,
        createdAt: timestampToString(data.createdAt),
        updatedAt: timestampToString(data.updatedAt),
      } as Note;
    });
  },

  // localStorage operations (for non-authenticated users)
  getLocalNotes(): Note[] {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!stored) return [];

      const notes = JSON.parse(stored) as Note[];
      return notes.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (error) {
      console.error('Error reading local notes:', error);
      return [];
    }
  },

  saveLocalNotes(notes: Note[]): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
    } catch (error) {
      console.error('Error saving local notes:', error);
    }
  },

  createLocalNote(data: CreateNoteInput): Note {
    const now = new Date().toISOString();
    const newNote: Note = {
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: extractTitle(data.content),
      content: data.content,
      userId: 'local',
      createdAt: now,
      updatedAt: now,
    };

    const notes = this.getLocalNotes();
    notes.unshift(newNote);
    this.saveLocalNotes(notes);

    return newNote;
  },

  updateLocalNote(id: string, data: UpdateNoteInput): void {
    const notes = this.getLocalNotes();
    const index = notes.findIndex((n) => n.id === id);

    if (index === -1) return;

    const updatedNote = { ...notes[index] };
    if (data.content !== undefined) {
      updatedNote.content = data.content;
      updatedNote.title = extractTitle(data.content);
    }
    updatedNote.updatedAt = new Date().toISOString();

    notes[index] = updatedNote;
    this.saveLocalNotes(notes);
  },

  deleteLocalNote(id: string): void {
    const notes = this.getLocalNotes();
    const filtered = notes.filter((n) => n.id !== id);
    this.saveLocalNotes(filtered);
  },
};