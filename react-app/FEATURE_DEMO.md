# Task Card Swipe Gesture - Demo Guide

## Quick Start
```bash
npm run dev
```
Navigate to `http://localhost:5173` and create a task to test the new swipe gesture.

## Features Demonstration

### 1. Swipe to Reveal Actions
**How to test:**
1. Create a new task
2. On mobile: Swipe the task card left
3. On desktop: Use trackpad to swipe left (if supported)
4. Observe: Blue Edit and Red Delete buttons appear behind the card

**Expected behavior:**
- Card smoothly slides left (-128px / -translate-x-32)
- Action buttons fade in with opacity transition
- Card maintains all styling (glass morphism, shadows)

### 2. Swipe to Close
**How to test:**
1. Swipe task card left (to open)
2. Swipe task card right
3. Observe: Card returns to original position, buttons disappear

**Alternative:**
- Click/tap anywhere outside the swiped card
- Card automatically closes

### 3. Add Subtask with Plus Button
**How to test:**
1. Look for the Plus (+) button in top-right corner of task card
2. Click/tap the Plus button
3. Observe:
   - Button rotates 45 degrees
   - Input form appears below task
   - Placeholder reads "Add first subtask..."

**Add a subtask:**
1. Type subtask text in the input
2. Press Enter or click Plus button
3. Observe:
   - Subtask appears immediately below task
   - Input form closes
   - Plus button returns to normal state

### 4. Auto-Expanded Subtasks
**How to test:**
1. Create a task with subtasks (use Plus button)
2. Observe: Subtasks are always visible
3. No need to click expand/collapse

**Subtask interactions:**
- Click checkbox to toggle completion
- Hover over subtask to reveal Delete button
- Click Delete to remove subtask

### 5. Subtask Count Badge
**How to test:**
1. Create task with multiple subtasks
2. Observe: Badge shows "X/Y subtasks" (e.g., "2/5 subtasks")
3. Complete some subtasks
4. Observe: Counter updates in real-time

### 6. Visual States

#### Normal Task (Not Due)
- Gradient: Indigo → Purple → Fuchsia
- Border: Violet with glow
- Shadow: Indigo

#### Due Today
- Gradient: Orange → Amber → Orange
- Border: Orange with glow
- Badge: "DUE TODAY"

#### Overdue
- Gradient: Rose → Red → Pink
- Border: Red with glow
- Badge: "OVERDUE"

#### Completed
- Gradient: Gray/Slate tones
- Text: Strike-through, lighter color
- Muted shadows

### 7. Animations to Notice

#### Card Swipe
- Duration: 300ms
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` (smooth ease-in-out)
- Transform: `translateX(-8rem)` when open

#### Plus Button Rotation
- Duration: 200ms
- Rotation: 45deg when active
- Smooth transition

#### Button Hover Effects
- Background opacity changes
- Color transitions
- Scale effects on main card: `hover:scale-[1.02]`

#### Subtask Appearance
- Fade-in animation (using `fade-in` class)
- Slide-up effect on mount

### 8. Accessibility Features

**Keyboard Navigation:**
- Tab through all interactive elements
- Enter/Space to activate buttons
- Focus indicators visible

**Screen Readers:**
- All buttons have `aria-label` attributes
- Checkbox has proper role and state
- Semantic HTML structure

**Touch Targets:**
- Minimum 44x44px for all buttons
- Large swipe action buttons (min-h-[80px])
- Generous padding for tap areas

## Testing Checklist

### Mobile (Touch Devices)
- [ ] Swipe left opens action buttons
- [ ] Swipe right closes action buttons
- [ ] Tap outside closes swipe
- [ ] Plus button opens subtask input
- [ ] Subtask checkbox toggles
- [ ] Subtask delete button works
- [ ] All touch targets are easy to tap
- [ ] No accidental scrolling during swipe

### Desktop
- [ ] Mouse interactions work
- [ ] Hover states visible on subtasks
- [ ] Keyboard navigation functional
- [ ] Focus states clear
- [ ] Click outside closes swipe
- [ ] Plus button accessible via keyboard

### Visual
- [ ] Smooth animations (no jank)
- [ ] Colors match design system
- [ ] Glass morphism effects render correctly
- [ ] Shadows and borders crisp
- [ ] Text readable on all gradient backgrounds
- [ ] Responsive layout at all screen sizes

### Functional
- [ ] Edit button opens task modal
- [ ] Delete button removes task
- [ ] Checkbox toggles task completion
- [ ] Subtasks save to parent task
- [ ] Due date badge displays correctly
- [ ] Overdue/Today states accurate
- [ ] Completed state renders properly

## Performance Notes

### Optimizations
- CSS transforms (GPU-accelerated)
- No layout reflows during animations
- Debounced swipe detection
- Efficient React re-renders
- Conditional rendering of subtasks

### Metrics to Watch
- Animation frame rate: 60fps target
- Time to interactive: < 100ms
- Swipe response time: Immediate feedback
- No memory leaks on component unmount

## Browser Support

### Tested On
- iOS Safari 14+
- Chrome/Edge (Chromium) 90+
- Firefox 88+
- Samsung Internet 14+

### Touch Events
- Touch swipe: Fully supported
- Mouse drag: Disabled (desktop UX different)
- Trackpad swipe: May work on macOS

## Troubleshooting

### Swipe Not Working
1. Check `react-swipeable` is installed: `npm list react-swipeable`
2. Verify touch events enabled in browser
3. Check for CSS conflicts (overflow, touch-action)
4. Test on actual mobile device (not just browser DevTools)

### Buttons Not Appearing
1. Check z-index layering
2. Verify opacity transitions
3. Inspect element positioning (absolute/relative)
4. Check for parent overflow: hidden

### Performance Issues
1. Reduce motion in system settings (respects prefers-reduced-motion)
2. Check for excessive re-renders in React DevTools
3. Profile with Chrome DevTools Performance tab
4. Verify hardware acceleration enabled

## Next Steps

### Enhancements Ideas
1. Add swipe velocity detection
2. Custom swipe threshold (configurable distance)
3. Haptic feedback on iOS
4. Multi-directional swipe actions
5. Undo/redo for swipe actions
6. Swipe gesture tutorial for first-time users

### Integration
- Works with existing Firebase sync
- Compatible with offline mode
- Supports real-time updates
- Integrates with notification system