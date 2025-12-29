import { type FC, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, Trash2, CheckSquare } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useDebounce } from '@/hooks/useDebounce';
import type { Note } from '@/types';
import { LexicalNoteEditor } from './lexical/LexicalNoteEditor';

interface NoteEditorProps {
  note: Note | null; // null = new note
  onBack: () => void;
  onSave: (content: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const NoteEditor: FC<NoteEditorProps> = ({ note, onBack, onSave, onDelete }) => {
  const [content, setContent] = useState(note?.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [insertCheckboxFn, setInsertCheckboxFn] = useState<(() => void) | null>(null);
  const [isChecklistMode, setIsChecklistMode] = useState(false);
  const debouncedContent = useDebounce(content, 800);

  // Auto-save when content changes (debounced)
  useEffect(() => {
    const saveNote = async () => {
      if (debouncedContent === note?.content) return; // No changes
      if (!debouncedContent.trim() && !note) return; // Don't save empty new note

      setIsSaving(true);
      try {
        await onSave(debouncedContent);
      } catch (error) {
        console.error('Error auto-saving note:', error);
      } finally {
        setIsSaving(false);
      }
    };

    if (note || debouncedContent.trim()) {
      saveNote();
    }
  }, [debouncedContent, note, onSave]);

  const handleDelete = useCallback(async () => {
    if (!note || !onDelete) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this note?'
    );
    if (!confirmed) return;

    try {
      await onDelete(note.id);
      onBack();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  }, [note, onDelete, onBack]);

  const handleBack = useCallback(async () => {
    // Save before going back if there are unsaved changes
    // Only save if we have an existing note (note is not null)
    if (note && content !== note.content && content.trim()) {
      setIsSaving(true);
      try {
        await onSave(content);
      } catch (error) {
        console.error('Error saving note:', error);
      } finally {
        setIsSaving(false);
      }
    }
    onBack();
  }, [content, note, onSave, onBack]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  const handleEditorReady = useCallback((fn: () => void) => {
    setInsertCheckboxFn(() => fn);
  }, []);

  const handleInsertChecklist = useCallback(() => {
    // Toggle checklist mode
    setIsChecklistMode(prev => !prev);

    // If turning on, insert first checkbox
    if (!isChecklistMode && insertCheckboxFn) {
      insertCheckboxFn();
    }
  }, [isChecklistMode, insertCheckboxFn]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 bg-black/20 px-4 py-3 backdrop-blur-xl">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-white transition-colors hover:bg-white/10"
          aria-label="Go back to notes"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="font-medium">Notes</span>
        </button>

        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="text-xs text-white/60">Saving...</span>
          )}

          {/* Make a checklist button */}
          <button
            onClick={handleInsertChecklist}
            className={cn(
              'group relative overflow-hidden rounded-lg p-2 transition-all duration-300',
              isChecklistMode
                ? 'bg-gradient-to-r from-purple-500/40 to-pink-500/40 ring-2 ring-purple-400/50'
                : 'bg-white/5 hover:bg-white/10',
              'before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-r before:from-purple-500/20 before:to-pink-500/20 before:opacity-0 before:transition-opacity before:duration-300',
              !isChecklistMode && 'hover:before:opacity-100'
            )}
            aria-label={isChecklistMode ? "Exit checklist mode" : "Make a checklist"}
            title={isChecklistMode ? "Exit checklist mode" : "Make a checklist"}
          >
            <CheckSquare className={cn(
              'h-5 w-5 transition-all',
              isChecklistMode ? 'text-purple-200 scale-110' : 'text-white group-hover:scale-110'
            )} />
          </button>

          {/* Delete button */}
          {note && onDelete && (
            <button
              onClick={handleDelete}
              className={cn(
                'group relative overflow-hidden rounded-lg p-2 transition-all duration-300',
                'bg-red-500/10 hover:bg-red-500/20',
                'before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-r before:from-red-500/20 before:to-pink-500/20 before:opacity-0 before:transition-opacity before:duration-300',
                'hover:before:opacity-100'
              )}
              aria-label="Delete note"
              title="Delete note"
            >
              <Trash2 className="h-5 w-5 text-red-400 transition-transform group-hover:scale-110" />
            </button>
          )}
        </div>
      </header>

      {/* Editor Area - Lexical Rich Text Editor */}
      <div className="flex-1 overflow-hidden px-4 py-6">
        <div className="relative mx-auto h-full max-w-4xl rounded-lg border border-white/10 bg-black/20">
          <LexicalNoteEditor
            initialContent={note?.content}
            onChange={handleContentChange}
            placeholder="Start typing... Use markdown formatting!"
            onEditorReady={handleEditorReady}
          />
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;