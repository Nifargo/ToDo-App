// Note types for Notes feature

export interface Note {
  id: string;
  title: string; // First line of content
  content: string; // Full text content (Markdown format)
  createdAt: string;
  updatedAt: string;
  userId: string;
  sharedWith: string[]; // Array of UIDs with read/write access
}

export interface CreateNoteInput {
  content: string;
}

export interface UpdateNoteInput {
  content?: string;
  title?: string;
}

// Collaborator info for displaying in UI
export interface NoteCollaborator {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  isOwner: boolean;
}

// Result of share operation
export interface ShareNoteResult {
  success: boolean;
  message: string;
  sharedUserId?: string;
}

export type TextStyle =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'numberedList'
  | 'checklist';

export interface StyleOption {
  id: TextStyle;
  label: string;
  icon: string;
  shortcut?: string;
  markdown: string | ((text: string) => string);
}