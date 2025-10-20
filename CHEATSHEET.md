# ⚡ Шпаргалка

Швидкі команди та корисні посилання для роботи з додатком.

## 🚀 Швидкий Старт

```bash
# 1. Згенерувати іконки
# Відкрийте generate-icons.html в браузері

# 2. Запустити сервер
./start-server.sh           # macOS/Linux
start-server.bat            # Windows
python3 -m http.server 8000 # Альтернатива

# 3. Відкрити в браузері
http://localhost:8000
```

---

## 📱 Встановлення на Телефон

### iPhone (Safari ТІЛЬКИ!)
```
📤 Поділитися → На екран Home → Додати
```

### Android (Chrome)
```
⋮ Меню → Додати на головний екран
```

---

## 🌐 Деплой

```bash
# Netlify (найпростіше)
# Просто перетягніть папку на netlify.com

# Vercel
npm i -g vercel
vercel

# GitHub Pages
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/user/repo.git
git push -u origin main
# Потім: Settings → Pages → Deploy
```

---

## 🔧 Корисні Команди

```bash
# Перевірити Python
python3 --version

# Альтернативні сервери
npx http-server -p 8000        # Node.js
npx live-server --port=8000    # З авто-перезавантаженням
php -S localhost:8000          # PHP

# Перевірити структуру
ls -la
tree

# Видалити кеш браузера
# Chrome: Ctrl+Shift+Delete
# Safari: Cmd+Option+E
```

---

## 🎨 Швидка Кастомізація

### Змінити колір теми
```css
/* styles.css */
:root {
    --primary-color: #вашколір;
}
```

### Змінити назву
```html
<!-- index.html -->
<title>Ваша Назва</title>
<h1>🎯 Ваша Назва</h1>
```

```json
// manifest.json
"name": "Ваша Назва"
```

### Змінити іконку
Відредагуйте `generate-icons.html` (рядки 60-90) - змініть колір градієнту або форму.

---

## 🐛 Швидке Вирішення Проблем

### Додаток не працює
1. Перевірте консоль (F12)
2. Очистіть кеш браузера
3. Перевірте що всі файли на місці
4. Перезапустіть сервер

### Service Worker не працює
```javascript
// Перевірити в DevTools → Application → Service Workers
// Або розкоментувати в app.js для дебагу:
console.log('Service Worker:', registration);
```

### Іконки не відображаються
```bash
# Переконайтесь що всі файли існують
ls -la icons/
```

### Не можу встановити на iPhone
- Використовуйте Safari (не Chrome!)
- Переконайтесь що сайт на HTTPS або localhost
- Перевірте iOS версію (потрібно 11.3+)

---

## 📊 Тестування PWA

### Lighthouse Audit
```
1. F12 (DevTools)
2. Lighthouse Tab
3. Categories: Progressive Web App
4. Generate Report
5. Ціль: 90+ балів
```

### Перевірка Manifest
```
DevTools → Application → Manifest
```

### Перевірка Service Worker
```
DevTools → Application → Service Workers
```

### Перевірка Кешу
```
DevTools → Application → Cache Storage
```

---

## 🔗 Корисні Посилання

- PWA Builder: https://www.pwabuilder.com/
- Can I Use PWA: https://caniuse.com/serviceworkers
- iOS PWA Guide: https://web.dev/apple-touch-icon/
- Manifest Generator: https://app-manifest.firebaseapp.com/

---

## ⌨️ Гарячі Клавіші (Поточні)

| Клавіша | Дія |
|---------|-----|
| `Enter` | Додати завдання |

*(Більше гарячих клавіш можна додати в майбутньому)*

---

## 📁 Структура Файлів

```
📦 ToDo app/
├── 📄 index.html          - Головна сторінка
├── 🎨 styles.css          - Всі стилі
├── ⚡ app.js              - Вся логіка
├── 🔧 service-worker.js   - PWA кеш
├── 📋 manifest.json       - PWA конфіг
├── 🖼️  generate-icons.html - Генератор іконок
├── 📂 icons/              - Папка з іконками
│   ├── icon-72.png
│   ├── icon-96.png
│   ├── icon-128.png
│   ├── icon-144.png
│   ├── icon-152.png
│   ├── icon-167.png
│   ├── icon-180.png
│   ├── icon-192.png
│   └── icon-512.png
├── 📖 README.md           - Повна документація
├── ⚡ QUICK_START.md      - Швидкий старт
├── 🚀 DEPLOY.md           - Гайд по деплою
├── ✨ FEATURES.md         - Список функцій
└── 📝 CHEATSHEET.md       - Цей файл
```

---

## 💡 Швидкі Поради

1. **Завжди тестуйте на реальному телефоні**, не тільки в емуляторі
2. **HTTPS обов'язковий** для продакшену (локально OK)
3. **Safari для iOS** - єдиний спосіб встановити PWA
4. **Очищайте кеш** після оновлень коду
5. **Оновлюйте версію** в service-worker.js після змін

---

## 🎯 Швидкі Факти

- **Загальний розмір:** ~100 KB
- **Рядків коду:** ~1800
- **Файлів:** 13 (без іконок)
- **Залежностей:** 0 (чистий JS)
- **Підтримка:** iOS 11.3+, Android 5.0+
- **Офлайн:** ✅ Повна підтримка

---

**Зберігайте цей файл під рукою!** 📌