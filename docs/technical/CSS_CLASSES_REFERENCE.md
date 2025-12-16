# CSS Classes Reference - Liquid Glass Theme

Quick reference for custom CSS classes available in the project.

## Liquid Glass Effects

### Glass Container (Base)
```tsx
<div className="glass-container">
  // Base glass effect with blur and transparency
</div>
```

### Glass Card
```tsx
<div className="glass-card">
  // Rounded glass card with padding and hover effect
  // Lifts on hover (-2px transform)
</div>
```

### Glass Button
```tsx
<button className="glass-button">
  // Glass effect button with hover animation
</button>
```

### Glass Input
```tsx
<input className="glass-input" />
// Glass effect input with focus state
```

### Frosted Glass (Modals/Overlays)
```tsx
<div className="frosted-glass">
  // Stronger blur effect for modals
  // 20px blur + saturation
</div>
```

### Gradient Glass
```tsx
<div className="gradient-glass">
  // Glass with gradient background
</div>
```

### Liquid Morph
```tsx
<div className="liquid-morph">
  // Animated morphing border-radius
  // 8s infinite animation
</div>
```

### Glass Glow
```tsx
<div className="glass-glow">
  // Glow effect on hover
  // Gradient border appears on hover
</div>
```

## Animations

### Fade In
```tsx
<div className="animate-fade-in">
  // Fades in from opacity 0 to 1
</div>
```

### Slide Up
```tsx
<div className="animate-slide-up">
  // Slides up from 20px below
  // 0.3s duration
</div>
```

### Slide Down
```tsx
<div className="animate-slide-down">
  // Slides down from 20px above
  // 0.3s duration
</div>
```

### Scale In
```tsx
<div className="animate-scale-in">
  // Scales from 0.9 to 1
  // 0.2s duration
</div>
```

### Bounce Once
```tsx
<div className="animate-bounce-once">
  // Single bounce animation
  // 0.6s duration
</div>
```

### Pulse Slow
```tsx
<div className="animate-pulse-slow">
  // Slow pulsing opacity
  // 2s infinite
</div>
```

### Shake
```tsx
<div className="animate-shake">
  // Shake animation (for errors)
  // 0.6s duration
</div>
```

### Spin Slow
```tsx
<div className="animate-spin-slow">
  // Slow rotation
  // 3s infinite
</div>
```

### Progress
```tsx
<div className="animate-progress">
  // Horizontal progress animation
  // 0.5s from left to right
</div>
```

### Shimmer (Loading)
```tsx
<div className="animate-shimmer">
  // Shimmer loading effect
  // 2s infinite
</div>
```

### Glow Pulse
```tsx
<div className="animate-glow-pulse">
  // Pulsing glow effect
  // 2s infinite
</div>
```

### Ripple
```tsx
<div className="animate-ripple">
  // Ripple effect (for clicks)
  // 0.6s scale + fade
</div>
```

## Stagger Delays

```tsx
<div className="animate-slide-up stagger-1">...</div>
<div className="animate-slide-up stagger-2">...</div>
<div className="animate-slide-up stagger-3">...</div>
<div className="animate-slide-up stagger-4">...</div>
<div className="animate-slide-up stagger-5">...</div>
// Delays: 0.1s, 0.2s, 0.3s, 0.4s, 0.5s
```

## CSS Variables

### Colors
```css
--color-primary: #6366f1
--color-primary-dark: #4f46e5
--color-secondary: #10b981
--color-danger: #ef4444
--color-warning: #f59e0b
```

### Backgrounds
```css
--bg-primary: #ffffff
--bg-secondary: #f9fafb
--bg-tertiary: #f3f4f6
```

### Text
```css
--text-primary: #1f2937
--text-secondary: #6b7280
--text-tertiary: #9ca3af
```

### Borders
```css
--border-color: #e5e7eb
--border-color-hover: #d1d5db
```

### Glass Effects
```css
--glass-bg: rgba(255, 255, 255, 0.7)
--glass-border: rgba(255, 255, 255, 0.3)
--glass-shadow: 0 8px 32px 0 rgba(99, 102, 241, 0.15)
--glass-blur: 12px
```

### Spacing
```css
--spacing-xs: 0.25rem
--spacing-sm: 0.5rem
--spacing-md: 1rem
--spacing-lg: 1.5rem
--spacing-xl: 2rem
```

### Border Radius
```css
--radius-sm: 0.5rem
--radius-md: 0.75rem
--radius-lg: 1rem
--radius-xl: 1.5rem
```

### Transitions
```css
--transition-fast: 150ms ease-in-out
--transition-base: 200ms ease-in-out
--transition-slow: 300ms ease-in-out
```

## Tailwind Color Classes

### Primary
```tsx
className="bg-primary text-white"        // Indigo-500 (#6366f1)
className="hover:bg-primary-dark"        // Indigo-600 (#4f46e5)
```

### Secondary
```tsx
className="bg-secondary text-white"      // Emerald-500 (#10b981)
```

### Danger
```tsx
className="bg-danger text-white"         // Red-500 (#ef4444)
```

## Usage Examples

### Glass Card with Animation
```tsx
<div className="glass-card animate-slide-up stagger-1">
  <h2 className="text-primary">Task Title</h2>
  <p className="text-secondary">Task description</p>
</div>
```

### Glass Button with Hover Effect
```tsx
<button className="glass-button hover:bg-primary hover:text-white transition-all">
  Add Task
</button>
```

### Modal with Frosted Glass
```tsx
<div className="frosted-glass animate-scale-in p-6 rounded-xl">
  <h2>Modal Title</h2>
  <div className="glass-input">
    <input type="text" />
  </div>
</div>
```

### Loading Skeleton
```tsx
<div className="animate-shimmer h-20 rounded-lg"></div>
```

### Error Shake Animation
```tsx
<input
  className={cn(
    "glass-input",
    error && "animate-shake border-danger"
  )}
/>
```

## Combining with Tailwind

You can freely combine custom classes with Tailwind utilities:

```tsx
<div className="glass-card mt-4 p-6 md:p-8 flex items-center gap-4">
  <div className="glass-glow animate-pulse-slow">
    <CheckCircle className="text-secondary w-6 h-6" />
  </div>
  <h3 className="text-lg font-semibold text-primary">Success!</h3>
</div>
```

## cn() Utility

Use the `cn()` utility to conditionally combine classes:

```tsx
import { cn } from '@/utils/cn';

<div className={cn(
  "glass-card",
  isActive && "glass-glow",
  isLoading && "animate-shimmer",
  "flex items-center justify-between"
)}>
  ...
</div>
```

---

**Note:** All custom CSS is compatible with Tailwind CSS and uses CSS variables for easy theming.