# ✅ Чекліст Міграції

Використовуйте цей чекліст щоб переконатися що всі фічі мігровано успішно.

---

## Phase 0: Підготовка

- [ ] Створено backup поточного проєкту
- [ ] Створено git tag `v8.0-vanilla`
- [ ] Створено branch `migration/react`
- [ ] Прочитано MIGRATION_PLAN.md
- [ ] Прочитано MIGRATION_QUICKSTART.md

---

## Phase 1: Налаштування

### Проєкт
- [ ] Створено React + Vite проєкт (`npm create vite`)
- [ ] Встановлено всі залежності
- [ ] Dev server запускається (`npm run dev`)
- [ ] Build працює (`npm run build`)

### Tailwind CSS
- [ ] Встановлено tailwindcss
- [ ] Налаштовано tailwind.config.js
- [ ] Додано директиви в index.css
- [ ] Tailwind класи працюють

### Firebase
- [ ] Створено `src/config/firebase.ts`
- [ ] Firebase ініціалізується без помилок
- [ ] Auth працює
- [ ] Firestore підключається
- [ ] Messaging підключається (або gracefully fails)

### PWA
- [ ] Встановлено `vite-plugin-pwa`
- [ ] Налаштовано vite.config.ts
- [ ] Скопійовано manifest.json
- [ ] Скопійовано іконки
- [ ] Service Worker генерується

---

## Phase 2: Архітектура

### Структура папок
- [ ] `src/components/` створено
- [ ] `src/hooks/` створено
- [ ] `src/contexts/` створено
- [ ] `src/services/` створено
- [ ] `src/types/` створено
- [ ] `src/utils/` створено

### TypeScript типи
- [ ] `types/task.ts` створено
- [ ] `types/user.ts` створено
- [ ] `types/settings.ts` створено
- [ ] Всі типи експортуються

### Utility функції
- [ ] `utils/cn.ts` створено (clsx + tailwind-merge)
- [ ] `utils/date.ts` створено (date formatting)

---

## Phase 3: Базові Компоненти

### UI Components
- [ ] `Button.tsx` створено та працює
- [ ] `Input.tsx` створено та працює
- [ ] `Modal.tsx` створено та працює
- [ ] `Toast.tsx` створено та працює
- [ ] `Checkbox.tsx` створено та працює
- [ ] `LoadingSpinner.tsx` створено

### Layout Components
- [ ] `Header.tsx` створено
- [ ] `BottomNav.tsx` створено
- [ ] `Container.tsx` створено

---

## Phase 4: Task Функціонал

### Task Services
- [ ] `services/taskService.ts` створено
- [ ] `getTasks()` працює
- [ ] `createTask()` працює
- [ ] `updateTask()` працює
- [ ] `deleteTask()` працює
- [ ] `toggleTask()` працює

### Task Components
- [ ] `TaskList.tsx` відображає tasks
- [ ] `TaskItem.tsx` відображає один task
- [ ] `TaskModal.tsx` дозволяє створити/редагувати task
- [ ] `EmptyState.tsx` показується коли немає tasks
- [ ] `SubtaskList.tsx` відображає subtasks

### Task Functionality
- [ ] ✅ Створення task працює
- [ ] ✅ Редагування task працює
- [ ] ✅ Видалення task працює
- [ ] ✅ Toggle complete працює
- [ ] ✅ Due date зберігається
- [ ] ✅ Subtasks працюють

### Filters
- [ ] `FilterTabs.tsx` створено
- [ ] Filter "All" працює
- [ ] Filter "Today" працює
- [ ] Filter "Month" працює
- [ ] `useTaskFilter.ts` hook створено

### Search
- [ ] `SearchContainer.tsx` створено
- [ ] `SearchInput.tsx` працює
- [ ] Debounce працює (300ms)
- [ ] Мінімум 3 символи для пошуку
- [ ] Clear search працює

---

## Phase 5: Firebase & Auth

### Authentication
- [ ] `AuthContext.tsx` створено
- [ ] `useAuth.ts` hook створено
- [ ] `LoginScreen.tsx` створено
- [ ] `GoogleSignInButton.tsx` створено
- [ ] Google Sign-In працює
- [ ] Sign Out працює
- [ ] User state зберігається
- [ ] Protected routes працюють (якщо є Router)

### Firestore
- [ ] Real-time listeners працюють (`onSnapshot`)
- [ ] Tasks синхронізуються в реальному часі
- [ ] Offline persistence працює
- [ ] Error handling налаштовано
- [ ] Optimistic updates працюють

### Cloud Messaging
- [ ] `useNotifications.ts` hook створено
- [ ] Request permission працює
- [ ] FCM token отримується
- [ ] Token зберігається в Firestore
- [ ] Foreground messages обробляються

---

## Phase 6: Settings

### Settings Screen
- [ ] `SettingsView.tsx` створено
- [ ] `NotificationsSettings.tsx` створено
- [ ] Navigation між екранами працює

### Notification Settings
- [ ] Enable/Disable toggle працює
- [ ] Time picker працює
- [ ] "Notify Due Today" checkbox працює
- [ ] "Notify Overdue" checkbox працює
- [ ] "Notify Due Tomorrow" checkbox працює
- [ ] Test notification працює
- [ ] Settings зберігаються в Firestore

### User Profile
- [ ] User avatar відображається
- [ ] User name відображається
- [ ] Sign out button працює

---

## Phase 7: PWA & Deploy

### PWA
- [ ] Manifest.json налаштовано
- [ ] Service Worker працює
- [ ] Install prompt показується
- [ ] Додаток встановлюється на home screen
- [ ] Офлайн режим працює
- [ ] Кешування працює правильно

### Testing
- [ ] Unit tests написані для hooks
- [ ] Component tests написані для UI
- [ ] Integration tests для Firebase
- [ ] Всі тести проходять (`npm run test`)

### Build & Optimization
- [ ] `npm run build` працює без помилок
- [ ] Bundle size < 500 KB (gzipped)
- [ ] Tree-shaking працює
- [ ] Code splitting налаштовано
- [ ] Lazy loading використовується

### Deploy
- [ ] GitHub Actions налаштовано
- [ ] Deploy на GitHub Pages працює
- [ ] Custom domain налаштовано (якщо є)
- [ ] HTTPS працює
- [ ] Firebase Hosting налаштовано (альтернатива)

### Post-Deploy Testing
- [ ] Lighthouse audit: Performance > 90
- [ ] Lighthouse audit: Accessibility > 90
- [ ] Lighthouse audit: Best Practices > 90
- [ ] Lighthouse audit: SEO > 90
- [ ] Lighthouse audit: PWA = 100

---

## Функціональне Тестування

### Базовий функціонал
- [ ] Можу створити task
- [ ] Можу редагувати task
- [ ] Можу видалити task
- [ ] Можу позначити task як completed
- [ ] Можу встановити due date
- [ ] Можу додати subtask
- [ ] Можу видалити subtask

### Filters
- [ ] Filter "All" показує всі tasks
- [ ] Filter "Today" показує тільки сьогоднішні
- [ ] Filter "Month" показує tasks цього місяця

### Search
- [ ] Пошук знаходить tasks по тексту
- [ ] Пошук не працює при < 3 символах
- [ ] Clear search очищує результати

### Auth
- [ ] Можу увійти через Google
- [ ] User info відображається
- [ ] Можу вийти з акаунту
- [ ] Tasks синхронізуються після входу

### Real-time Sync
- [ ] Відкриваю на 2 пристроях
- [ ] Зміни на пристрої 1 відображаються на пристрої 2
- [ ] Зміни на пристрої 2 відображаються на пристрої 1
- [ ] Sync працює без перезавантаження сторінки

### Notifications
- [ ] Можу увімкнути notifications
- [ ] Браузер запитує permission
- [ ] FCM token отримується
- [ ] Test notification працює
- [ ] Daily reminder приходить о заданому часі
- [ ] Overdue tasks notification працює

### Offline
- [ ] Можу працювати без інтернету
- [ ] Tasks відображаються офлайн
- [ ] Можу створити task офлайн
- [ ] Task синхронізується після повернення онлайн

### Mobile
- [ ] Responsive design працює на мобільному
- [ ] Touch events працюють
- [ ] Додаток встановлюється на home screen
- [ ] iOS Safari працює коректно
- [ ] Android Chrome працює коректно

---

## Cross-Browser Testing

### Desktop
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile
- [ ] iOS Safari (iOS 15+)
- [ ] Chrome Android (Android 10+)
- [ ] Samsung Internet

---

## Performance Checklist

- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Total Blocking Time < 200ms
- [ ] Cumulative Layout Shift < 0.1
- [ ] Largest Contentful Paint < 2.5s

---

## Security Checklist

- [ ] Firebase security rules налаштовані
- [ ] API keys не експонуються (в .env)
- [ ] XSS захист (React автоматично)
- [ ] CSRF захист
- [ ] HTTPS only

---

## Documentation

- [ ] README.md оновлено
- [ ] CHANGELOG.md створено
- [ ] CODE_STYLE.md створено (якщо потрібно)
- [ ] Компоненти задокументовані (JSDoc)

---

## Фінальна Перевірка

- [ ] Всі фічі з `FEATURES.md` мігровано
- [ ] Всі тести проходять
- [ ] Lighthouse score > 90 в усіх категоріях
- [ ] Bundle size оптимізовано
- [ ] Deployment працює
- [ ] Backup старої версії зроблено
- [ ] Git tag створено (`v9.0-react`)

---

## 🎉 Міграція Завершена!

Коли всі чекбокси відмічені, ви успішно мігрували ToDo додаток з Vanilla JS на React!

**Наступні кроки:**
1. Відсвяткуйте! 🎉
2. Оновіть документацію
3. Додайте нові фічі з roadmap
4. Поділіться проєктом з друзями

---

**Версія:** 1.0
**Останнє оновлення:** 2025-12-01