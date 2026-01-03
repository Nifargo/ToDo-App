// Note service for Firebase/localStorage operations
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type {
  Note,
  CreateNoteInput,
  UpdateNoteInput,
  NoteCollaborator,
  ShareNoteResult,
} from '@/types';

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
      sharedWith: [], // Initialize empty shared list
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
        sharedWith: data.sharedWith || [], // Include shared list
        createdAt: timestampToString(data.createdAt),
        updatedAt: timestampToString(data.updatedAt),
      } as Note;
    });
  },

  // Get notes shared with user (where user is in sharedWith array)
  async getSharedNotes(userId: string): Promise<Note[]> {
    const q = query(
      collection(db, NOTES_COLLECTION),
      where('sharedWith', 'array-contains', userId),
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
        sharedWith: data.sharedWith || [],
        createdAt: timestampToString(data.createdAt),
        updatedAt: timestampToString(data.updatedAt),
      } as Note;
    });
  },

  // Get all notes (owned + shared with user)
  async getAllNotes(userId: string): Promise<Note[]> {
    const [ownedNotes, sharedNotes] = await Promise.all([
      this.getNotesByUser(userId),
      this.getSharedNotes(userId),
    ]);

    const allNotes = [...ownedNotes, ...sharedNotes];
    return allNotes.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  // Share note with user by email
  async shareNoteWithEmail(
    noteId: string,
    email: string
  ): Promise<ShareNoteResult> {
    try {
      // Find user by email
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', email.toLowerCase().trim())
      );

      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        return {
          success: false,
          message: 'Користувача не знайдено. Можливо він ще не зареєстрований.',
        };
      }

      const targetUser = usersSnapshot.docs[0];
      const targetUserId = targetUser.id;

      // Get note to check ownership and existing shares
      const noteRef = doc(db, NOTES_COLLECTION, noteId);
      const noteSnap = await getDoc(noteRef);

      if (!noteSnap.exists()) {
        return { success: false, message: 'Нотатку не знайдено' };
      }

      const noteData = noteSnap.data();
      const currentSharedWith = noteData.sharedWith || [];

      // Check if already shared
      if (currentSharedWith.includes(targetUserId)) {
        return {
          success: false,
          message: 'Нотатка вже доступна цьому користувачу',
        };
      }

      // Check if trying to share with owner
      if (noteData.userId === targetUserId) {
        return {
          success: false,
          message: 'Не можна поділитися з собою',
        };
      }

      // Add user to sharedWith array
      await updateDoc(noteRef, {
        sharedWith: arrayUnion(targetUserId),
        updatedAt: serverTimestamp(),
      });

      return {
        success: true,
        message: 'Нотатку успішно поділено',
        sharedUserId: targetUserId,
      };
    } catch (error) {
      console.error('Error sharing note:', error);
      return {
        success: false,
        message: 'Помилка при діленні нотатки',
      };
    }
  },

  // Remove user from shared list
  async unshareNote(noteId: string, userId: string): Promise<void> {
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    await updateDoc(noteRef, {
      sharedWith: arrayRemove(userId),
      updatedAt: serverTimestamp(),
    });
  },

  // Get list of collaborators for a note
  async getNoteCollaborators(noteId: string): Promise<NoteCollaborator[]> {
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    const noteSnap = await getDoc(noteRef);

    if (!noteSnap.exists()) {
      return [];
    }

    const noteData = noteSnap.data();
    const ownerId = noteData.userId;
    const sharedWith = noteData.sharedWith || [];

    const allUserIds = [ownerId, ...sharedWith];

    const userPromises = allUserIds.map(async (uid) => {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        return {
          uid,
          email: userData.email || '',
          displayName: userData.displayName || null,
          photoURL: userData.photoURL || null,
          isOwner: uid === ownerId,
        };
      }
      return null;
    });

    const users = await Promise.all(userPromises);
    return users.filter((user) => user !== null) as NoteCollaborator[];
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
      sharedWith: [], // Include sharedWith for local notes
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