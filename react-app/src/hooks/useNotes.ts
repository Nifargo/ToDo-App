// Custom hook for managing notes (CRUD operations)
import { useState, useEffect, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/config/firebase';
import { noteService } from '@/services/note.service';
import type { Note, CreateNoteInput, UpdateNoteInput } from '@/types';

export const useNotes = () => {
  const [user] = useAuthState(auth);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Load notes on mount or when user changes
  const loadNotes = useCallback(async () => {
    // Notes are only available for authenticated users
    if (!user) {
      setNotes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Load from Firebase
      const firebaseNotes = await noteService.getNotesByUser(user.uid);
      setNotes(firebaseNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Create new note
  const createNote = useCallback(
    async (data: CreateNoteInput): Promise<Note> => {
      if (!user) {
        throw new Error('User must be authenticated to create notes');
      }

      setIsCreating(true);
      try {
        // Create in Firebase
        const id = await noteService.createNote(user.uid, data);

        // Create note object with known data
        const now = new Date().toISOString();
        const newNote: Note = {
          id,
          title: data.content.trim().split('\n')[0].trim() || 'Untitled Note',
          content: data.content,
          userId: user.uid,
          createdAt: now,
          updatedAt: now,
        };

        // Reload notes in background to sync with server
        loadNotes();

        return newNote;
      } catch (error) {
        console.error('Error creating note:', error);
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [user, loadNotes]
  );

  // Update existing note
  const updateNote = useCallback(
    async (id: string, data: UpdateNoteInput): Promise<void> => {
      if (!user) {
        throw new Error('User must be authenticated to update notes');
      }

      setIsUpdating(true);
      try {
        // Update in Firebase
        await noteService.updateNote(id, data);
        // Optimistic update
        setNotes((prev) =>
          prev.map((note) => {
            if (note.id === id) {
              return {
                ...note,
                ...data,
                title: data.content
                  ? data.content.trim().split('\n')[0].trim() ||
                    'Untitled Note'
                  : note.title,
                updatedAt: new Date().toISOString(),
              };
            }
            return note;
          })
        );
      } catch (error) {
        console.error('Error updating note:', error);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [user]
  );

  // Delete note
  const deleteNote = useCallback(
    async (id: string): Promise<void> => {
      if (!user) {
        throw new Error('User must be authenticated to delete notes');
      }

      try {
        // Delete from Firebase
        await noteService.deleteNote(id);
        setNotes((prev) => prev.filter((note) => note.id !== id));
      } catch (error) {
        console.error('Error deleting note:', error);
        throw error;
      }
    },
    [user]
  );

  // Get single note by ID
  const getNote = useCallback(
    (id: string): Note | undefined => {
      return notes.find((note) => note.id === id);
    },
    [notes]
  );

  return {
    notes,
    loading,
    isCreating,
    isUpdating,
    createNote,
    updateNote,
    deleteNote,
    getNote,
    refreshNotes: loadNotes,
  };
};