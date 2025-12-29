import { type FC, useState } from 'react';
import { Plus, LogIn } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/utils/cn';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import NoteEditor from '@/components/notes/NoteEditor';
import { useNotes } from '@/hooks/useNotes';
import { useAuth } from '@/hooks/useAuth';

interface ListViewProps {
  onShowToast?: (variant: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  onEditingChange?: (isEditing: boolean) => void;
  onShowLoginScreen?: () => void;
}

const ListView: FC<ListViewProps> = ({ onShowToast, onEditingChange, onShowLoginScreen }) => {
  const { user } = useAuth();
  const { notes, loading, createNote, updateNote, deleteNote, getNote, isCreating } = useNotes();
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return format(date, 'h:mm a');
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return format(date, 'EEEE');
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  const getPreview = (content: string, maxLines = 3): string => {
    const lines = content.split('\n').filter((line) => line.trim());
    // Skip first line (title) and take next lines
    const previewLines = lines.slice(1, maxLines + 1);
    return previewLines.join(' ').substring(0, 150) + (content.length > 150 ? '...' : '');
  };

  const handleCreateNote = async () => {
    setIsCreatingNew(true);
    onEditingChange?.(true);
  };

  const handleNoteClick = (noteId: string) => {
    setEditingNoteId(noteId);
    onEditingChange?.(true);
  };

  const handleSaveNote = async (content: string) => {
    try {
      if (isCreatingNew) {
        // Prevent concurrent creation attempts
        if (isCreating) {
          return;
        }
        const newNote = await createNote({ content });
        setIsCreatingNew(false);
        setEditingNoteId(newNote.id);
      } else if (editingNoteId) {
        await updateNote(editingNoteId, { content });
      }
    } catch (error) {
      console.error('Error saving note:', error);
      onShowToast?.('error', 'Failed to save note');
      throw error;
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNote(id);
      onShowToast?.('success', 'Note deleted');
    } catch (error) {
      console.error('Error deleting note:', error);
      onShowToast?.('error', 'Failed to delete note');
      throw error;
    }
  };

  const handleBack = () => {
    setEditingNoteId(null);
    setIsCreatingNew(false);
    onEditingChange?.(false);
  };

  // Show editor if editing or creating
  const currentNote = editingNoteId ? (getNote(editingNoteId) || null) : null;
  if (isCreatingNew || editingNoteId) {
    return (
      <NoteEditor
        note={currentNote}
        onBack={handleBack}
        onSave={handleSaveNote}
        onDelete={editingNoteId ? handleDeleteNote : undefined}
      />
    );
  }

  // Show login prompt for unauthenticated users
  if (!user) {
    return (
      <div className="relative">
        <section className="mb-6 px-2 pt-2">
          <h1 className="font-geometric holographic-text text-3xl font-bold md:text-4xl">
            Notes
          </h1>
        </section>

        <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
          <div className="mb-6 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-8">
            <LogIn className="h-16 w-16 text-indigo-300" />
          </div>
          <h2 className="mb-3 text-2xl font-bold text-white">Login Required</h2>
          <p className="mb-6 max-w-md text-white/70">
            Notes are only available for authenticated users. Sign in to create and manage your notes across all your devices.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={onShowLoginScreen}
            className="gap-2 border border-indigo-500/30 bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50"
          >
            <LogIn className="h-5 w-5" />
            <span>Go to Login</span>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <LoadingSpinner size="lg" text="Loading notes..." />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Header with Create Button */}
      <section className="mb-6 px-2 pt-2">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-geometric holographic-text text-3xl font-bold md:text-4xl">
            Notes
          </h1>
          <Button
            variant="primary"
            size="md"
            onClick={handleCreateNote}
            className="gap-2 border border-indigo-500/30 bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">New Note</span>
          </Button>
        </div>
        <p className="text-sm text-white/70 md:text-base">
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
        </p>
      </section>

      {/* Notes Grid */}
      <section>
        {notes.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
            <div className="mb-4 text-6xl">📝</div>
            <h3 className="mb-2 text-xl font-semibold text-white">No notes yet</h3>
            <p className="text-sm text-white/70">
              Start by creating your first note
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {notes.map((note, index) => {
              const preview = getPreview(note.content);

              return (
                <button
                  key={note.id}
                  onClick={() => handleNoteClick(note.id)}
                  className={cn(
                    'holographic-border group relative overflow-hidden rounded-lg border-2 p-4 text-left backdrop-blur-2xl transition-all duration-200',
                    'hover:scale-[1.02] hover:shadow-2xl fade-in',
                    'border-violet-300/70 bg-gradient-to-br from-indigo-500/95 to-purple-600/95 shadow-xl shadow-indigo-500/60'
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {/* Title */}
                  <h3 className="font-geometric mb-2 line-clamp-2 text-lg font-bold text-white drop-shadow-lg">
                    {note.title}
                  </h3>

                  {/* Preview */}
                  {preview && (
                    <p className="mb-3 line-clamp-3 text-sm text-white/80">
                      {preview}
                    </p>
                  )}

                  {/* Date */}
                  <div className="mt-auto flex items-center justify-between text-xs text-white/60">
                    <span>{formatDate(note.updatedAt)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default ListView;