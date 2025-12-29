// Note types for Notes feature

export interface Note {
  id: string;
  title: string; // First line of content
  content: string; // Full text content (Markdown format)
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface CreateNoteInput {
  content: string;
}

export interface UpdateNoteInput {
  content?: string;
  title?: string;
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