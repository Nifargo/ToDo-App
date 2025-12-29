# Notes Feature - Apple Notes Style

## Overview
This feature implements an Apple Notes-style interface in the ListView section of the application. Users can create, edit, and manage notes with a beautiful, intuitive interface.

## Architecture

### File Structure
```
react-app/
├── src/
│   ├── types/
│   │   └── note.types.ts          # Note type definitions
│   ├── services/
│   │   └── note.service.ts        # Firebase & localStorage operations
│   ├── hooks/
│   │   └── useNotes.ts            # Custom hook for notes management
│   └── components/
│       ├── list/
│       │   └── ListView.tsx       # Updated to show notes grid
│       └── notes/
│           ├── NoteEditor.tsx     # Full-screen note editor
│           └── index.ts           # Exports
```

### Data Flow

1. **ListView Component**
   - Displays notes in a responsive grid (1-3 columns based on screen size)
   - Each note card shows: title, preview, and date
   - "New Note" button creates blank notes
   - Clicking a note opens NoteEditor

2. **NoteEditor Component**
   - Full-screen editing interface
   - Auto-save on content change (debounced 800ms)
   - First line automatically becomes the title (bold, larger font)
   - Back button returns to ListView
   - Delete button (only for existing notes)

3. **useNotes Hook**
   - Manages note state and CRUD operations
   - Automatically detects if user is authenticated
   - Uses Firebase for authenticated users
   - Uses localStorage for guests

4. **noteService**
   - Abstraction layer for data persistence
   - Handles both Firebase Firestore and localStorage
   - Automatically extracts title from first line of content

## Key Features

### 1. Dual Storage Strategy
- **Authenticated Users**: Notes stored in Firebase Firestore
- **Guest Users**: Notes stored in browser localStorage
- Seamless switching between storage methods

### 2. Smart Title Extraction
- First line of note content becomes the title
- Automatically updates when content changes
- Fallback to "Untitled Note" if empty

### 3. Auto-Save
- Debounced auto-save (800ms delay)
- Saves on content change
- Saves before navigating back
- Visual "Saving..." indicator

### 4. Responsive Design
- Mobile: 1 column grid
- Tablet: 2 columns grid
- Desktop: 3 columns grid
- Full holographic/gradient styling matching app theme

### 5. Date Formatting
- Smart relative dates:
  - Today: Shows time (e.g., "3:45 PM")
  - Yesterday: Shows "Yesterday"
  - This week: Shows day name (e.g., "Monday")
  - Older: Shows full date (e.g., "Dec 15, 2025")

## Usage

### Creating a Note
1. Navigate to "List" tab in bottom navigation
2. Click "New Note" button (top right)
3. Start typing - first line becomes title
4. Note auto-saves as you type
5. Click "Back" to return to notes list

### Editing a Note
1. Click on any note card
2. Edit content
3. Changes auto-save
4. Click "Back" when done

### Deleting a Note
1. Open the note
2. Click trash icon (top right)
3. Confirm deletion

## Technical Details

### Type Definitions
```typescript
interface Note {
  id: string;
  title: string;        // First line of content
  content: string;      // Full text content
  createdAt: string;    // ISO timestamp
  updatedAt: string;    // ISO timestamp
  userId: string;       // User ID or 'local' for guests
}
```

### Firebase Collection Structure
```
notes (collection)
├── {noteId}
│   ├── title: string
│   ├── content: string
│   ├── userId: string
│   ├── createdAt: Timestamp
│   └── updatedAt: Timestamp
```

### localStorage Structure
```
Key: "notes_local"
Value: Note[] (JSON array)
```

## Styling

### Colors
- Primary gradient: Indigo-500 to Purple-600
- Border: Violet-300/70
- Text: White with drop-shadow
- Preview text: White/80

### Effects
- Holographic borders
- Smooth scale on hover (1.02x)
- Fade-in animation with staggered delays
- Backdrop blur for glassmorphism effect

## Performance Optimizations

1. **Debounced Auto-Save**: Prevents excessive Firebase/localStorage writes
2. **Optimistic Updates**: UI updates immediately while saving in background
3. **Lazy Loading**: NoteEditor component loads only when needed
4. **Efficient Re-renders**: Proper React hooks dependencies

## Future Enhancements

Potential improvements:
- [ ] Rich text formatting (bold, italic, lists)
- [ ] Image attachments
- [ ] Note categories/tags
- [ ] Search functionality
- [ ] Markdown support
- [ ] Note sharing
- [ ] Offline sync queue
- [ ] Version history

## Testing

To test the feature:
1. Run `npm run dev`
2. Navigate to http://localhost:5173/ToDo-App/
3. Click "List" tab
4. Create/edit/delete notes
5. Test both as guest and authenticated user
6. Verify localStorage persistence (guest mode)
7. Verify Firebase sync (authenticated mode)

## Integration with App

The ListView component is already integrated into App.tsx:
- Accessible via bottom navigation "List" tab
- Receives `onShowToast` prop for notifications
- Fully responsive and styled to match app theme
- Shares same authentication context as tasks

## Notes

- Empty new notes are not saved (prevents clutter)
- Title automatically extracted from first line
- Notes sorted by updatedAt (most recent first)
- Smooth transitions between ListView and NoteEditor
- Confirmation dialog before deletion