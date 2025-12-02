# 🚀 Швидкий Старт Міграції

## Перші кроки (зараз можна зробити!)

### 1. Backup & Git Setup (5 хвилин)

```bash
# Створити git tag для поточної версії
git tag v8.0-vanilla
git push origin v8.0-vanilla

# Створити новий branch для міграції
git checkout -b migration/react

# Створити архів backup
cd ..
tar -czf "ToDo-app-vanilla-backup-$(date +%Y%m%d).tar.gz" "ToDo app"
```

### 2. Створити новий React проєкт (10 хвилин)

```bash
# В папці My_projects створити новий проєкт
cd "/Users/nifargo/Documents/My_projects"
npm create vite@latest todo-react -- --template react-ts

cd todo-react
npm install
```

### 3. Встановити залежності (5 хвилин)

```bash
# Firebase
npm install firebase react-firebase-hooks

# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# State Management
npm install @tanstack/react-query zustand

# Routing
npm install react-router-dom

# PWA
npm install vite-plugin-pwa -D

# Icons (optional)
npm install lucide-react

# Date utils
npm install date-fns
```

### 4. Базова конфігурація Tailwind (5 хвилин)

**tailwind.config.js:**
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366f1',
          dark: '#4f46e5',
        },
        secondary: '#10b981',
        danger: '#ef4444',
      },
      backdropBlur: {
        glass: '20px',
      },
    },
  },
  plugins: [],
}
```

**src/index.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-700;
    @apply min-h-screen;
  }
}
```

### 5. Налаштувати Firebase (10 хвилин)

**src/config/firebase.ts:**
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  getFirestore,
  enableIndexedDbPersistence,
  connectFirestoreEmulator
} from 'firebase/firestore';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyAxde31tl4RazVOmcC_c14lG2b3wsPXzC0",
  authDomain: "just-do-it-c3390.firebaseapp.com",
  projectId: "just-do-it-c3390",
  storageBucket: "just-do-it-c3390.firebasestorage.app",
  messagingSenderId: "1057242941805",
  appId: "1:1057242941805:web:8caea8fb087210f8637264"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  console.warn('Firestore persistence error:', err);
});

// Initialize messaging (only if supported)
export const messaging = await isSupported() ? getMessaging(app) : null;

// VAPID key for Web Push
export const vapidKey = "BAx2-XuP9uTBN1yD_kw7s8FyM4yD-vkw1pI93_x0b33hCKWiF6Fmgi0LBaS-IRsuGUIP8PAMtuJiKZnUmfI2UOk";
```

### 6. Створити TypeScript типи (10 хвилин)

**src/types/index.ts:**
```typescript
// Task types
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
  createdAt: string;
  userId: string;
  subtasks?: Subtask[];
  expanded?: boolean;
}

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface CreateTaskInput {
  text: string;
  dueDate?: string;
}

// User types
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// Settings types
export interface NotificationSettings {
  enabled: boolean;
  time: string; // "09:00"
  notifyDueToday: boolean;
  notifyOverdue: boolean;
  notifyDueTomorrow: boolean;
}

// Filter types
export type FilterType = 'all' | 'today' | 'month';

// View types
export type ViewType = 'tasks' | 'calendar' | 'settings';
```

### 7. Структура папок (2 хвилини)

```bash
mkdir -p src/{components/{tasks,auth,settings,ui,layout},hooks,contexts,services,utils,types,__tests__}
```

### 8. Перший компонент - Button (15 хвилин)

**src/components/ui/Button.tsx:**
```typescript
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const baseStyles = 'rounded-lg font-medium transition-all duration-200 disabled:opacity-50';

    const variants = {
      primary: 'bg-primary hover:bg-primary-dark text-white',
      secondary: 'bg-secondary hover:bg-green-600 text-white',
      danger: 'bg-danger hover:bg-red-600 text-white',
      ghost: 'bg-transparent hover:bg-white/10 text-white',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={isLoading}
        {...props}
      >
        {isLoading ? 'Loading...' : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

**src/utils/cn.ts:**
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Встановити залежності:
```bash
npm install clsx tailwind-merge
```

---

## Наступні кроки

Після виконання цих 8 кроків у вас буде:
- ✅ Backup старого проєкту
- ✅ Git branch для міграції
- ✅ Новий React + TypeScript + Vite проєкт
- ✅ Налаштований Tailwind CSS
- ✅ Firebase конфігурація
- ✅ TypeScript типи
- ✅ Структура папок
- ✅ Перший переиспользуємий компонент

**Тепер можна:**
1. Запустити dev server: `npm run dev`
2. Відкрити браузер: http://localhost:5173
3. Почати створювати компоненти з MIGRATION_PLAN.md Phase 3

---

## Корисні команди

```bash
# Dev server
npm run dev

# Build
npm run build

# Preview build
npm run preview

# Type check
npm run type-check

# Lint
npm run lint
```

---

## Troubleshooting

### Помилка з Firebase
```
Error: Firebase messaging is not supported
```
**Рішення:** Нормально для localhost без HTTPS. Працюватиме після деплою.

### Tailwind не працює
```bash
# Перезапустити dev server
npm run dev
```

### TypeScript помилки
```bash
# Перевірити tsconfig.json
cat tsconfig.json
```

---

**Готові почати?** Виконайте кроки 1-8 і повертайтесь до MIGRATION_PLAN.md!