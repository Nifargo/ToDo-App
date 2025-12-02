# 📋 План Міграції: Vanilla JS → React + Vite

## 🎯 Мета
Мігрувати ToDo додаток з Vanilla JavaScript (1536 рядків) на React з TypeScript для кращої підтримуваності, тестування та розширюваності.

---

## 📊 Поточний Стан

**Технології зараз:**
- Vanilla JavaScript (1 клас, 173 методи)
- Custom CSS (1924 рядки)
- Firebase (Auth, Firestore, FCM)
- PWA з Service Worker
- GitHub Pages деплой

**Проблеми:**
- ❌ Складна підтримка (1536 рядків в одному файлі)
- ❌ Ручне управління DOM (87 querySelector/addEventListener)
- ❌ Важко тестувати
- ❌ Дублювання логіки
- ❌ Відсутність типізації

---

## 🚀 Цільовий Стек

**Frontend:**
- ⚛️ React 18 (functional components + hooks)
- 📘 TypeScript (типізація)
- ⚡ Vite (швидка збірка)
- 🎨 Tailwind CSS + Custom CSS (гібрид для Liquid Glass ефектів)
- 📱 React Router (якщо потрібно більше сторінок)

**State Management:**
- 🪝 React Context API (глобальний стан)
- 🔄 React Query / TanStack Query (Firebase кешинг)
- 💾 Zustand (альтернатива, якщо Context буде складним)

**Backend (без змін):**
- 🔥 Firebase (Auth, Firestore, FCM)
- ☁️ Cloudflare Workers (push notifications)

**Tooling:**
- 🧪 Vitest (unit tests)
- 🎭 React Testing Library (component tests)
- 📝 ESLint + Prettier
- 🐶 Husky (git hooks)

---

## 📅 План Міграції (7 фаз)

### **Phase 0: Підготовка (1-2 дні)**

#### 0.1 Backup і git branch
- [ ] Створити повний backup поточного проєкту
- [ ] Створити git tag `v8.0-vanilla` (остання Vanilla версія)
- [ ] Створити новий branch `migration/react`
- [ ] Задокументувати всі поточні фічі

#### 0.2 Аналіз залежностей
- [ ] Перевірити всі Firebase SDK версії
- [ ] Перевірити Service Worker сумісність з React
- [ ] Перевірити manifest.json та PWA конфігурацію

#### 0.3 Дослідження
- [ ] Вивчити Firebase React Hooks (`react-firebase-hooks`)
- [ ] Вивчити React PWA patterns
- [ ] Підготувати список всіх компонентів

---

### **Phase 1: Налаштування Нового Проєкту (1 день)**

#### 1.1 Створити React + Vite проєкт
```bash
npm create vite@latest todo-react -- --template react-ts
cd todo-react
npm install
```

#### 1.2 Встановити залежності
```bash
# Firebase
npm install firebase react-firebase-hooks

# UI
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# State Management
npm install @tanstack/react-query zustand

# Routing (опціонально)
npm install react-router-dom

# PWA
npm install vite-plugin-pwa -D

# Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

#### 1.3 Налаштувати Tailwind CSS + Custom CSS (Гібрид)
- [ ] Додати Tailwind директиви до index.css
- [ ] Налаштувати tailwind.config.js з кольорами проєкту
- [ ] Створити `src/styles/` папку для custom CSS
- [ ] Створити `src/styles/liquid-glass.css` для iOS 18 ефектів
- [ ] Створити `src/styles/variables.css` з CSS змінними
- [ ] Створити `src/styles/animations.css` для кастомних анімацій
- [ ] Імпортувати всі стилі в main.tsx

**Стратегія:**
- ✅ Tailwind для: layout, spacing, colors, responsive, utilities
- ✅ Custom CSS для: Liquid Glass ефекти, складні анімації, унікальний дизайн

#### 1.4 Налаштувати PWA
- [ ] Налаштувати `vite-plugin-pwa` в vite.config.ts
- [ ] Скопіювати manifest.json
- [ ] Скопіювати Service Worker логіку
- [ ] Скопіювати іконки

#### 1.5 Налаштувати Firebase
- [ ] Створити `src/config/firebase.ts`
- [ ] Скопіювати Firebase конфігурацію
- [ ] Налаштувати Firebase compat → modular SDK
- [ ] Створити типи для Firestore документів

---

### **Phase 2: Архітектура і Структура (1 день)**

#### 2.1 Створити структуру папок
```
src/
├── assets/           # Статичні файли
├── components/       # React компоненти
│   ├── tasks/       # Task-related компоненти
│   ├── auth/        # Authentication компоненти
│   ├── settings/    # Settings компоненти
│   ├── ui/          # Переиспользуемі UI компоненти
│   └── layout/      # Layout компоненти
├── hooks/           # Custom React hooks
├── contexts/        # React Context providers
├── services/        # Firebase services
├── types/           # TypeScript types
├── utils/           # Helper функції
├── config/          # Конфігураційні файли
├── styles/          # 🆕 Custom CSS (Liquid Glass, animations)
│   ├── liquid-glass.css
│   ├── variables.css
│   └── animations.css
└── __tests__/       # Тести
```

#### 2.2 Створити TypeScript типи
```typescript
// src/types/task.ts
interface Task {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
  createdAt: string;
  userId: string;
  subtasks?: Subtask[];
}

interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

// src/types/user.ts
interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// src/types/settings.ts
interface NotificationSettings {
  enabled: boolean;
  time: string;
  notifyDueToday: boolean;
  notifyOverdue: boolean;
  notifyDueTomorrow: boolean;
}
```

#### 2.3 Спланувати компоненти (Component Tree)
```
App
├── AuthProvider (Context)
│   ├── LoginScreen
│   │   └── GoogleSignInButton
│   └── MainApp
│       ├── Header
│       │   ├── UserGreeting
│       │   ├── SearchButton
│       │   └── AddTaskButton
│       ├── SearchContainer
│       │   └── SearchInput
│       ├── FilterTabs
│       ├── TaskList
│       │   ├── TaskItem
│       │   │   ├── TaskCheckbox
│       │   │   ├── TaskText
│       │   │   ├── TaskDate
│       │   │   ├── TaskActions
│       │   │   └── SubtaskList
│       │   └── EmptyState
│       ├── BottomNav
│       ├── TaskModal
│       ├── SettingsView
│       │   ├── NotificationsSettings
│       │   └── SignOutButton
│       ├── Toast
│       └── InstallPrompt
```

---

### **Phase 3: Базові Компоненти (2-3 дні)**

#### 3.1 UI компоненти (Day 1)
- [ ] `Button.tsx` - переиспользуємий кнопка
- [ ] `Input.tsx` - переиспользуємий input
- [ ] `Modal.tsx` - базовий модал
- [ ] `Toast.tsx` - toast notifications
- [ ] `Checkbox.tsx` - custom checkbox

#### 3.2 Layout компоненти (Day 1)
- [ ] `Header.tsx` - шапка з лого
- [ ] `BottomNav.tsx` - нижня навігація
- [ ] `Container.tsx` - основний контейнер

#### 3.3 Auth компоненти (Day 2)
- [ ] `LoginScreen.tsx` - екран входу
- [ ] `GoogleSignInButton.tsx` - кнопка Google Sign-In
- [ ] `AuthContext.tsx` - Context для auth стану
- [ ] `useAuth.ts` - custom hook для auth

#### 3.4 Custom Hooks (Day 2-3)
- [ ] `useAuth.ts` - Firebase auth state
- [ ] `useTasks.ts` - CRUD операції з tasks
- [ ] `useFirestore.ts` - загальний Firestore hook
- [ ] `useNotifications.ts` - FCM notifications
- [ ] `useLocalStorage.ts` - localStorage sync
- [ ] `useDebounce.ts` - для search input

---

### **Phase 4: Міграція Task Функціоналу (3-4 дні)**

#### 4.1 Task Models & Services (Day 1)
```typescript
// src/services/taskService.ts
export const taskService = {
  getTasks: (userId: string) => {...},
  createTask: (userId: string, task: CreateTaskInput) => {...},
  updateTask: (taskId: string, updates: Partial<Task>) => {...},
  deleteTask: (taskId: string) => {...},
  toggleTask: (taskId: string) => {...},
}
```

#### 4.2 Task Components (Day 2-3)
- [ ] `TaskList.tsx` - список tasks
- [ ] `TaskItem.tsx` - один task
- [ ] `TaskModal.tsx` - модал створення/редагування
- [ ] `SubtaskList.tsx` - список subtasks
- [ ] `EmptyState.tsx` - порожній стан

#### 4.3 Task Filters (Day 3)
- [ ] `FilterTabs.tsx` - таби фільтрів
- [ ] `useTaskFilter.ts` - hook для фільтрації
- [ ] Фільтри: All, Today, Month

#### 4.4 Search Functionality (Day 4)
- [ ] `SearchContainer.tsx` - контейнер пошуку
- [ ] `SearchInput.tsx` - input з debounce
- [ ] `useSearch.ts` - hook для пошуку

---

### **Phase 5: Міграція Firebase & Auth (2-3 дні)**

#### 5.1 Firebase Setup (Day 1)
```typescript
// src/config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app);
```

#### 5.2 Auth Implementation (Day 2)
- [ ] `AuthContext.tsx` - Context з user state
- [ ] `useAuth.ts` - custom hook
- [ ] Google Sign-In функціонал
- [ ] Sign Out функціонал
- [ ] Protected routes (якщо використовуємо Router)

#### 5.3 Firestore Integration (Day 2-3)
- [ ] Real-time listeners з `onSnapshot`
- [ ] Offline persistence
- [ ] Оптимістичні оновлення (optimistic updates)
- [ ] Error handling

#### 5.4 FCM Integration (Day 3)
- [ ] Request notification permission
- [ ] Get FCM token
- [ ] Handle foreground messages
- [ ] Save token to Firestore

---

### **Phase 6: Settings & Advanced Features (2 дні)**

#### 6.1 Settings Screen (Day 1)
- [ ] `SettingsView.tsx` - основний контейнер
- [ ] `NotificationsSettings.tsx` - налаштування сповіщень
- [ ] `NotificationToggle.tsx` - toggle компонент
- [ ] Збереження налаштувань в Firestore

#### 6.2 Notification Settings (Day 2)
- [ ] Time picker для daily reminders
- [ ] Checkboxes для типів сповіщень
- [ ] Test notification button
- [ ] Status indicators

---

### **Phase 7: PWA, Testing & Deploy (2-3 дні)**

#### 7.1 PWA Configuration (Day 1)
- [ ] Налаштувати vite-plugin-pwa
- [ ] Перевірити Service Worker
- [ ] Перевірити manifest.json
- [ ] Перевірити install prompt
- [ ] Тестування офлайн режиму

#### 7.2 Testing (Day 2)
```typescript
// Example test
describe('TaskItem', () => {
  it('should toggle task completion', () => {
    render(<TaskItem task={mockTask} />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(mockToggleTask).toHaveBeenCalled();
  });
});
```
- [ ] Unit tests для hooks
- [ ] Component tests для UI
- [ ] Integration tests для Firebase

#### 7.3 Styling Refinement (Day 2)
- [ ] Перенести всі стилі з styles.css → Tailwind
- [ ] Responsive design перевірка
- [ ] Анімації (Framer Motion або Tailwind)
- [ ] iOS 18 Liquid Glass ефекти

#### 7.4 Build & Deploy (Day 3)
```bash
# Build
npm run build

# Preview
npm run preview
```
- [ ] Оптимізувати bundle size
- [ ] Налаштувати GitHub Actions для CI/CD
- [ ] Деплой на GitHub Pages
- [ ] Налаштувати custom domain (якщо є)

#### 7.5 Post-Deploy
- [ ] Lighthouse audit (PWA score)
- [ ] Тестування на мобільних пристроях
- [ ] Cross-browser testing
- [ ] Performance monitoring

---

## 📈 Часова Оцінка

| Фаза | Опис | Час |
|------|------|-----|
| Phase 0 | Підготовка | 1-2 дні |
| Phase 1 | Налаштування | 1 день |
| Phase 2 | Архітектура | 1 день |
| Phase 3 | Базові компоненти | 2-3 дні |
| Phase 4 | Task функціонал | 3-4 дні |
| Phase 5 | Firebase & Auth | 2-3 дні |
| Phase 6 | Settings | 2 дні |
| Phase 7 | PWA & Deploy | 2-3 дні |
| **Всього** | | **14-19 днів** |

**При роботі 2-3 год/день:** ~6-9 тижнів (1.5-2.5 місяці)

---

## ✅ Критерії Успіху

### Функціональні
- [ ] Всі фічі з Vanilla версії працюють
- [ ] Real-time sync працює
- [ ] Push notifications працюють
- [ ] PWA встановлюється
- [ ] Офлайн режим працює

### Технічні
- [ ] Bundle size < 500 KB (gzipped)
- [ ] First Contentful Paint < 1.5s
- [ ] Lighthouse PWA score > 90
- [ ] 0 TypeScript errors
- [ ] Test coverage > 70%

### Якість Коду
- [ ] Максимум 200 рядків на компонент
- [ ] Використання TypeScript strict mode
- [ ] ESLint без warnings
- [ ] Prettier форматування
- [ ] Документація для складних компонентів

---

## 🚨 Ризики і Мітігації

### Ризик 1: Bundle Size
**Проблема:** React додасть ~45 KB, Tailwind ~50 KB
**Мітігація:**
- Tree-shaking
- Code splitting
- Lazy loading компонентів

### Ризик 2: Firebase SDK Breaking Changes
**Проблема:** Firebase compat → modular SDK
**Мітігація:**
- Використати `react-firebase-hooks`
- Добре протестувати Firestore listeners

### Ризик 3: PWA Compatibility
**Проблема:** Service Worker конфлікти з Vite
**Мітігація:**
- Використати `vite-plugin-pwa`
- Протестувати на iOS Safari

### Ризик 4: Loss of Features
**Проблема:** Забути мігрувати якусь фічу
**Мітігація:**
- Checklist всіх фіч
- E2E тестування

---

## 📚 Навчальні Ресурси

### React + TypeScript
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [React Docs (beta)](https://react.dev/)

### Firebase
- [Firebase React Hooks](https://github.com/CSFrequency/react-firebase-hooks)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)

### Tailwind
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Tailwind UI Components](https://tailwindui.com/)

### Testing
- [React Testing Library](https://testing-library.com/react)
- [Vitest Docs](https://vitest.dev/)

---

## 🎯 Next Steps

1. **Прочитати цей план повністю**
2. **Створити backup проєкту**
3. **Створити git branch `migration/react`**
4. **Почати з Phase 0**
5. **Оновлювати цей документ при прогресі**

---

## 📝 Нотатки

### Зміни відносно Vanilla версії
- ✅ Типізація з TypeScript
- ✅ Компонентна архітектура
- ✅ Автоматичне оновлення UI
- ✅ Кращий Developer Experience
- ✅ Тестування
- ⚠️ Bundle size збільшиться (~100 KB → ~300 KB gzipped)
- ⚠️ Build step потрібен

### Що залишається без змін
- ✅ Firebase backend
- ✅ Cloudflare Worker
- ✅ PWA функціонал
- ✅ GitHub Pages hosting
- ✅ Всі існуючі фічі

---

**Створено:** 2025-12-01
**Автор:** Migration Team
**Статус:** 📝 Draft