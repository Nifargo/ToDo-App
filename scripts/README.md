# Daily Push Notifications via GitHub Actions

Цей скрипт відправляє щоденні push-нотифікації користувачам через **Web Push API**, що працює як на Android так і на **iOS PWA**.

## Як це працює

- ✅ **iOS-сумісний**: Використовує стандартний Web Push API замість FCM
- ✅ **Безкоштовний**: GitHub Actions (2000 хв/місяць на безкоштовному плані)
- ✅ **Автоматичний**: Запускається щодня о 09:00 за Києвським часом
- ✅ **Multi-device**: Підтримує декілька пристроїв на користувача

## Налаштування (одноразово)

### 1. Отримати Firebase Service Account

1. Відкрийте https://console.firebase.google.com/project/just-do-it-c3390/settings/serviceaccounts/adminsdk
2. Натисніть **"Generate new private key"**
3. Завантажиться JSON файл (зберігайте його в безпеці!)

### 2. Додати GitHub Secrets

Перейдіть на https://github.com/Nifargo/ToDo-App/settings/secrets/actions

Додайте **3 секрети**:

#### `FIREBASE_SERVICE_ACCOUNT`
Вміст JSON файлу з кроку 1 (повністю, включаючи фігурні дужки)

```json
{
  "type": "service_account",
  "project_id": "just-do-it-c3390",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "...",
  "client_id": "...",
  ...
}
```

#### `VAPID_PUBLIC_KEY`
```
BAx2-XuP9uTBN1yD_kw7s8FyM4yD-vkw1pI93_x0b33hCKWiF6Fmgi0LBaS-IRsuGUIP8PAMtuJiKZnUmfI2UOk
```
(з файлу `.env` → `VITE_FIREBASE_VAPID_KEY`)

#### `VAPID_PRIVATE_KEY`
Це приватний VAPID ключ. Якщо у вас його немає, потрібно згенерувати нову пару:

**Генерація VAPID ключів:**
```bash
npx web-push generate-vapid-keys
```

Це видасть:
```
=======================================

Public Key:
BAx2-XuP9uTBN...

Private Key:
XYZ123abc...

=======================================
```

**ВАЖЛИВО:** Якщо генеруєте нові ключі, потрібно:
1. Оновити `VITE_FIREBASE_VAPID_KEY` в `.env`
2. Перебілдити і задеплоїти додаток
3. Користувачі повинні заново дати дозвіл на нотифікації

### 3. Встановити залежності скрипта

```bash
cd scripts
npm install
```

## Тестування

### Manual запуск через GitHub Actions

1. Перейдіть на https://github.com/Nifargo/ToDo-App/actions/workflows/daily-notifications.yml
2. Натисніть **"Run workflow"** → **"Run workflow"**
3. Перевірте логи

### Локальний запуск (для розробки)

```bash
cd scripts

# Встановіть змінні середовища
export FIREBASE_SERVICE_ACCOUNT='{"type": "service_account", ...}'
export VAPID_PUBLIC_KEY='BAx2-XuP9...'
export VAPID_PRIVATE_KEY='XYZ123abc...'

# Запустіть скрипт
node send-notifications.js
```

## Як працюють нотифікації на iOS

1. Користувач відкриває PWA на iPhone (встановлений на Home Screen)
2. Увімкнує нотифікації в Settings
3. Safari показує попап → користувач натискає "Allow"
4. `fcmService.ts` створює **Web Push subscription** (зберігається в Firestore)
5. GitHub Actions щодня читає subscriptions з Firestore
6. Відправляє нотифікації через `web-push` бібліотеку
7. iOS отримує нотифікацію ✅

## Розклад

- **09:00 Kyiv (зима)** = `0 7 * * *` UTC
- **09:00 Kyiv (літо)** = `0 6 * * *` UTC

Редагуйте cron в `.github/workflows/daily-notifications.yml`

## Troubleshooting

### Нотифікації не приходять на iOS

1. ✅ Чи додаток встановлений як PWA (Home Screen)?
2. ✅ Чи дозволені нотифікації в Safari settings?
3. ✅ Чи є `webPushSubscriptions` в Firestore для користувача?
4. ✅ Перевірте логи GitHub Actions

### GitHub Actions не запускається

- Cron workflows можуть мати затримку до 15 хвилин
- Якщо репозиторій неактивний 60 днів, cron workflows автоматично вимикаються

### Помилка "410 Gone" в логах

Subscription застарілий - потрібно видалити з Firestore або реалізувати автоматичне очищення

## Ліміти

- GitHub Actions Free: **2000 хвилин/місяць**
- Один запуск: ~30 секунд - 1 хвилина
- Щодня = ~30 хвилин/місяць ✅

## Порівняння з Cloudflare Worker

| | GitHub Actions | Cloudflare Worker |
|---|---|---|
| iOS сумісність | ✅ Web Push | ❌ FCM only |
| Вартість | Безкоштовно (2000 хв) | Безкоштовно (100k req/day) |
| Налаштування | GitHub Secrets | Wrangler deploy |
| Scheduled jobs | Cron (min 5 хв) | Cron Triggers |
| Складність | Простіше | Складніше |

## Структура файлів

```
scripts/
├── README.md                 # Цей файл
├── package.json              # Залежності
├── send-notifications.js     # Основний скрипт
└── .gitignore               # Ігнорувати node_modules

.github/workflows/
└── daily-notifications.yml   # GitHub Actions workflow
```

## Безпека

- ⚠️ **НІКОЛИ** не комітьте Firebase Service Account JSON в git
- ✅ Використовуйте GitHub Secrets
- ✅ Private key зберігається тільки в GitHub Secrets
- ✅ Скрипт має read-only доступ до Firestore (тільки читає tasks/users)
