# Quick Guide: Notes Feature

## What's New?

The ListView tab now features an Apple Notes-style interface for creating and managing notes!

## How to Use

### 1. Access Notes
- Tap the "List" icon in the bottom navigation bar
- You'll see all your notes in a beautiful grid layout

### 2. Create a New Note
- Tap the **"+ New Note"** button (top right)
- Start typing immediately
- **First line = Note title** (appears bold and larger)
- Rest of the text = Note content
- Your note saves automatically as you type

### 3. Edit Existing Notes
- Tap any note card to open it
- Make your changes
- Changes save automatically
- Tap **"< List"** to go back

### 4. Delete a Note
- Open the note you want to delete
- Tap the **trash icon** (top right)
- Confirm deletion

## Features

### Smart Auto-Save
- Notes save automatically while you type
- You'll see "Saving..." indicator when saving
- No need to manually save

### Beautiful Design
- Holographic gradient cards
- Smooth animations
- Responsive grid layout
- Matches the app's theme

### Date Display
- Today: Shows time (e.g., "3:45 PM")
- Yesterday: Shows "Yesterday"
- This week: Shows day (e.g., "Monday")
- Older: Shows date (e.g., "Dec 15, 2025")

### Works Everywhere
- **Logged in**: Notes sync to Firebase
- **Guest mode**: Notes saved locally in your browser

## Tips

1. **Empty notes won't save** - Start typing to create a note
2. **First line is important** - It becomes your note title
3. **Auto-save delay** - Wait ~1 second for changes to save
4. **Mobile friendly** - Works great on phones and tablets

## Preview

### Notes Grid View
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Meeting Notes   │  │ Shopping List   │  │ Ideas           │
│ Discuss project │  │ - Milk         │  │ New feature... │
│ timeline and... │  │ - Bread...     │  │                 │
│ 3:45 PM         │  │ Yesterday      │  │ Monday          │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Note Editor
```
┌─────────────────────────────────────────┐
│ < List                        🗑️         │
├─────────────────────────────────────────┤
│                                         │
│ Meeting Notes                  (title) │
│                                         │
│ Discuss project timeline and next      │
│ steps for the new feature.             │
│                                         │
│ Action items:                          │
│ - Review designs                       │
│ - Setup Firebase                       │
│                                         │
└─────────────────────────────────────────┘
```

## Keyboard Shortcuts (Desktop)

- **Escape**: Not implemented yet (feature idea)
- **Cmd/Ctrl + Enter**: Not implemented yet (feature idea)

## Storage Info

- **Firebase** (logged in users): Unlimited notes, synced across devices
- **localStorage** (guests): Limited by browser storage (~5-10MB)
- **Migration**: Login to sync local notes to Firebase (future feature)

## Troubleshooting

**Notes not saving?**
- Check internet connection (Firebase users)
- Clear browser cache (localStorage users)
- Try refreshing the page

**Can't see my notes?**
- Make sure you're on the "List" tab
- Check if you're logged into the same account
- Guest notes only visible in the same browser

**Note disappeared?**
- Check if you accidentally deleted it
- Guest mode notes clear when browser data is cleared
- Firebase notes persist across devices when logged in

## Need Help?

If you encounter any issues:
1. Check browser console for errors
2. Try logging out and back in
3. Clear browser cache and reload
4. Report issue with steps to reproduce

---

**Enjoy your new notes feature!** 📝