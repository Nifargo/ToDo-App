# 🌿 Git Setup для Міграції

Цей документ описує Git структуру проєкту під час міграції Vanilla JS → React.

---

## 📋 Загальна Інформація

**Дата створення:** 2 грудня 2025
**Репозиторій:** https://github.com/Nifargo/ToDo-App
**Статус:** 🚧 Міграція в процесі

---

## 🏷️ Git Tags

### `v8.0-vanilla`

**Створено:** 2 грудня 2025
**Commit:** `3f134ea`
**Призначення:** Остання стабільна версія Vanilla JavaScript перед міграцією

**Що включає:**
- ✅ Vanilla JavaScript (1536 рядків)
- ✅ Custom CSS (1924 рядки)
- ✅ Firebase (Auth, Firestore, FCM)
- ✅ PWA з Service Worker
- ✅ Push notifications
- ✅ Real-time sync
- ✅ Offline support
- ✅ Task management з subtasks
- ✅ Search та filters
- ✅ Settings та notifications

**Як повернутися до цієї версії:**
```bash
git checkout v8.0-vanilla
```

**Як переглянути код:**
```bash
# Переглянути файли без переключення
git show v8.0-vanilla:app.js
git show v8.0-vanilla:styles.css
```

---

## 🌿 Git Branches

### `main` (Production)

**Статус:** ✅ Стабільна Vanilla JS версія
**Deploy:** GitHub Pages
**URL:** https://nifargo.github.io/ToDo-App/

**Останній commit:**
```
3f134ea - Add migration documentation and Claude agent configuration
```

**Коли оновиться:**
- Після завершення міграції
- Після тестування React версії
- Після merge з `migration/react`

---

### `migration/react` (Development)

**Статус:** 🚧 Активна розробка
**Створено:** 2 грудня 2025
**Tracking:** `origin/migration/react`

**Призначення:**
- Розробка React версії
- Тестування нових фіч
- Commit'и на кожному етапі

**GitHub:**
https://github.com/Nifargo/ToDo-App/tree/migration/react

**Як перемикатися:**
```bash
# На migration/react (розробка)
git checkout migration/react

# На main (стара версія)
git checkout main
```

---

## 📂 Структура Роботи

### Поточний Підхід (Окрема Папка)

```
/Users/nifargo/Documents/My_projects/ToDo app/
├── ToDo app/                    # ← Поточний проєкт (branch: migration/react)
│   ├── .git/                   # Git репозиторій
│   ├── docs/migration/         # Документація міграції
│   ├── .claude/                # Claude агент
│   ├── app.js                  # Vanilla JS (залишається поки що)
│   ├── styles.css              # Custom CSS (залишається)
│   └── ...                     # Інші файли
│
└── todo-react/                  # ← 🆕 Новий React проєкт (буде створено)
    ├── src/
    │   ├── components/
    │   ├── hooks/
    │   └── ...
    ├── package.json
    └── vite.config.ts
```

### Процес Міграції

1. **Зараз (Phase 0-1):**
   - Branch: `migration/react`
   - Створюємо папку `../todo-react/`
   - Розробляємо React версію там

2. **В процесі (Phase 2-7):**
   - Регулярно комітимо в `migration/react`
   - Тестуємо в `todo-react/`
   - Документуємо прогрес

3. **Після завершення (Phase 7):**
   - Видаляємо старі Vanilla JS файли з `ToDo app/`
   - Копіюємо всі файли з `todo-react/` → `ToDo app/`
   - Комітимо в `migration/react`
   - Тестуємо
   - Мердж в `main`
   - Deploy на GitHub Pages

---

## 🔄 Workflow Команди

### Початок роботи (щодня)
```bash
cd "/Users/nifargo/Documents/My_projects/ToDo app/ToDo app"
git checkout migration/react
git pull origin migration/react
```

### Під час розробки
```bash
# Працюємо в todo-react/
cd ../todo-react
npm run dev

# Регулярно комітимо прогрес
cd "../ToDo app"
git add .
git commit -m "Phase 3: Add Button component"
git push origin migration/react
```

### Якщо щось пішло не так
```bash
# Повернутися до Vanilla JS версії
git checkout main

# Або до конкретного commit в migration/react
git checkout migration/react
git log --oneline
git checkout <commit-hash>
```

---

## 🆘 Сценарії Відновлення

### Сценарій 1: Потрібно повернутися до Vanilla JS

```bash
# Перемикаємося на main branch
git checkout main

# Запускаємо старий додаток
# Відкриваємо index.html в браузері
```

### Сценарій 2: Щось зламалося в migration/react

```bash
# Дивимося історію
git checkout migration/react
git log --oneline

# Відкочуємо до попереднього commit
git reset --hard <good-commit-hash>

# АБО створюємо нову гілку від хорошого commit
git checkout -b migration/react-v2 <good-commit-hash>
```

### Сценарій 3: Треба почати міграцію заново

```bash
# Видаляємо migration/react branch
git branch -D migration/react
git push origin --delete migration/react

# Створюємо знову від v8.0-vanilla
git checkout v8.0-vanilla
git checkout -b migration/react
git push -u origin migration/react
```

---

## 📊 Backup Стратегія

### Де зберігається код:

1. **Local (ваш комп'ютер):**
   - `/Users/nifargo/Documents/My_projects/ToDo app/ToDo app/`
   - Branch: `migration/react`

2. **GitHub (хмара):**
   - https://github.com/Nifargo/ToDo-App
   - Branch: `migration/react`
   - Tag: `v8.0-vanilla`

3. **GitHub Pages (production):**
   - https://nifargo.github.io/ToDo-App/
   - Branch: `main` (Vanilla JS поки що)

### Частота backup:

- **Local → GitHub:** Після кожної значної зміни (commit + push)
- **Рекомендація:** Комітити мінімум 1 раз на день
- **Під час Phase:** Комітити після завершення кожної підфази

---

## 📝 Commit Message Conventions

Для легшої навігації по історії:

```bash
# Phase markers
git commit -m "Phase 0: Document current features"
git commit -m "Phase 1: Setup Vite + Tailwind + Firebase"
git commit -m "Phase 2: Create folder structure and types"

# Feature commits
git commit -m "Add Button component with Tailwind + custom styles"
git commit -m "Implement TaskList with real-time Firestore sync"
git commit -m "Add liquid-glass.css for iOS 18 effects"

# Fix commits
git commit -m "Fix: TypeScript errors in TaskItem component"
git commit -m "Fix: Build error in vite.config.ts"

# Documentation
git commit -m "Docs: Update migration progress in checklist"
```

---

## 🔗 Корисні Команди

```bash
# Переглянути всі branches
git branch -a

# Переглянути всі tags
git tag -l

# Порівняти branches
git diff main migration/react

# Переглянути commit в тегу
git show v8.0-vanilla

# Створити Pull Request (в кінці)
# Перейти на https://github.com/Nifargo/ToDo-App/pull/new/migration/react
```

---

## ✅ Checklist для Merge в Main

Коли міграція завершена, перед merge в `main`:

- [ ] Всі тести проходять (`npm run test`)
- [ ] Build працює без помилок (`npm run build`)
- [ ] Lighthouse PWA score > 90
- [ ] Всі фічі з Vanilla версії працюють
- [ ] Real-time sync працює
- [ ] Push notifications працюють
- [ ] Offline режим працює
- [ ] Cross-browser testing пройдено
- [ ] Документація оновлена
- [ ] CHANGELOG.md створено

**Тільки після цього:**
```bash
git checkout main
git merge migration/react
git push origin main
```

---

## 📞 Контакти і Ресурси

**GitHub Repository:**
https://github.com/Nifargo/ToDo-App

**Migration Docs:**
`docs/migration/` folder

**Migration Plan:**
`docs/migration/03-plan.md`

**Checklist:**
`docs/migration/07-checklist.md`

---

**Статус:** ✅ Git setup завершено, готові до Phase 0!
**Останнє оновлення:** 2 грудня 2025