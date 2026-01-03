import { useState, useEffect } from 'react';
import { X, UserPlus, Users, Trash2 } from 'lucide-react';
import type { Note, NoteCollaborator, ShareNoteResult } from '@/types';

interface ShareNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note;
  onShare: (email: string) => Promise<ShareNoteResult>;
  onUnshare: (userId: string) => Promise<void>;
  getCollaborators: (noteId: string) => Promise<NoteCollaborator[]>;
  isOwner: boolean;
}

export function ShareNoteModal({
  isOpen,
  onClose,
  note,
  onShare,
  onUnshare,
  getCollaborators,
  isOwner,
}: ShareNoteModalProps) {
  const [email, setEmail] = useState('');
  const [collaborators, setCollaborators] = useState<NoteCollaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load collaborators when modal opens
  useEffect(() => {
    if (isOpen && note) {
      loadCollaborators();
    }
  }, [isOpen, note]);

  const loadCollaborators = async () => {
    const collab = await getCollaborators(note.id);
    setCollaborators(collab);
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !email.includes('@')) {
      setError('Введіть коректний email');
      return;
    }

    setLoading(true);
    const result = await onShare(email);
    setLoading(false);

    if (result.success) {
      setSuccess(result.message);
      setEmail('');
      loadCollaborators();
    } else {
      setError(result.message);
    }
  };

  const handleUnshare = async (userId: string) => {
    setError('');
    setSuccess('');
    await onUnshare(userId);
    setSuccess('Доступ видалено');
    loadCollaborators();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Поділитися нотаткою</h2>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Share form (only for owner) */}
          {isOwner && (
            <form onSubmit={handleShare} className="space-y-3">
              <label className="text-sm font-medium text-white/80">
                Email користувача
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  {loading ? 'Зачекайте...' : 'Поділитися'}
                </button>
              </div>
            </form>
          )}

          {/* Error/Success messages */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-green-200 text-sm">
              {success}
            </div>
          )}

          {/* Collaborators list */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/80">
              Доступ до нотатки ({collaborators.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {collaborators.map((collab) => (
                <div
                  key={collab.uid}
                  className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    {collab.photoURL ? (
                      <img
                        src={collab.photoURL}
                        alt={collab.displayName || collab.email}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-bold">
                        {(collab.displayName || collab.email)[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="text-white font-medium flex items-center gap-2">
                        {collab.displayName || collab.email}
                        {collab.isOwner && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full">
                            Власник
                          </span>
                        )}
                      </div>
                      <div className="text-white/60 text-sm">{collab.email}</div>
                    </div>
                  </div>
                  {/* Remove button (only for non-owners, only owner can remove) */}
                  {isOwner && !collab.isOwner && (
                    <button
                      onClick={() => handleUnshare(collab.uid)}
                      className="text-red-400 hover:text-red-300 p-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
