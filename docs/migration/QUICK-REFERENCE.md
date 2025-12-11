# ⚡ Швидкий Довідник Міграції

Швидкий доступ до всієї важливої інформації.

---

## 🏷️ Git Info

```bash
# Поточний branch
migration/react

# Tag з Vanilla JS версією
v8.0-vanilla (commit: 3f134ea)

# Backup на GitHub
https://github.com/Nifargo/ToDo-App/tree/migration/react
```

---

## 📂 Структура Папок

```
/Users/nifargo/Documents/My_projects/ToDo app/
├── ToDo app/              # Git repo (branch: migration/react)
│   ├── docs/migration/   # Вся документація тут
│   └── (Vanilla JS files залишаються поки що)
│
└── todo-react/            # 🆕 React проєкт (створимо в Phase 1)
    └── (React код буде тут)
```

---

## 📋 Швидкі Команди

### Git
```bash
# Статус
git status

# Commit + Push
git add .
git commit -m "Phase X: description"
git push origin migration/react

# Повернутися до Vanilla JS
git checkout main
```

### NPM (в todo-react/)
```bash
cd ../todo-react

npm run dev         # Dev server
npm run build       # Production build
npm run test        # Run tests
npm run lint        # Check code
```

---

## 📚 Документація

| Файл | Що там |
|------|--------|
| `00-START-HERE.md` | Початок (10-60 хв) |
| `03-plan.md` | **Головний план** (7 фаз) |
| `07-checklist.md` | Checklist (~150 пунктів) |
| `GIT-SETUP.md` | Git branches, tags, backup |
| `QUICK-REFERENCE.md` | Цей файл |

---

## 🎯 Поточний Етап

**Phase:** 0 (Підготовка)
**Статус:** 🚧 В процесі
**Наступне:** Створити todo-react папку

---

## 🔗 Корисні Лінки

- **GitHub Repo:** https://github.com/Nifargo/ToDo-App
- **Migration Branch:** https://github.com/Nifargo/ToDo-App/tree/migration/react
- **Tag v8.0-vanilla:** https://github.com/Nifargo/ToDo-App/tree/v8.0-vanilla

---

## 🆘 SOS

**Щось зламалося?** → Перечитай `GIT-SETUP.md` розділ "Сценарії Відновлення"

**Забув команду?** → Дивись вище "Швидкі Команди"

**Де Phase X інструкції?** → `docs/migration/03-plan.md`

---

**Останнє оновлення:** 2 грудня 2025