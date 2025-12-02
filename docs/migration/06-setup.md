# 🎯 Повний React Setup - Готовий до Використання

## 📁 Структура Проєкту

```
todo-react/
├── public/
│   ├── icons/                  # PWA іконки (скопіювати з старого проєкту)
│   ├── manifest.json           # PWA manifest
│   └── firebase-messaging-sw.js # Firebase Service Worker
│
├── src/
│   ├── assets/                 # Статичні файли
│   │   └── images/
│   │
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── GoogleSignInButton.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   │
│   │   ├── tasks/
│   │   │   ├── TaskList.tsx
│   │   │   ├── TaskItem.tsx
│   │   │   ├── TaskModal.tsx
│   │   │   ├── SubtaskList.tsx
│   │   │   ├── SubtaskItem.tsx
│   │   │   └── EmptyState.tsx
│   │   │
│   │   ├── settings/
│   │   │   ├── SettingsView.tsx
│   │   │   ├── NotificationsSettings.tsx
│   │   │   ├── NotificationToggle.tsx
│   │   │   └── UserProfile.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   ├── Container.tsx
│   │   │   └── MainLayout.tsx
│   │   │
│   │   └── ui/                 # Переиспользуємі UI компоненти
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Checkbox.tsx
│   │       ├── Modal.tsx
│   │       ├── Toast.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── FilterTabs.tsx
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useTasks.ts
│   │   ├── useTaskFilter.ts
│   │   ├── useSearch.ts
│   │   ├── useDebounce.ts
│   │   ├── useNotifications.ts
│   │   ├── useFirestore.ts
│   │   └── useLocalStorage.ts
│   │
│   ├── contexts/               # React Context providers
│   │   ├── AuthContext.tsx
│   │   ├── TasksContext.tsx    # (якщо не використовуємо React Query)
│   │   └── ThemeContext.tsx    # (для майбутньої dark mode)
│   │
│   ├── services/               # Firebase та API сервіси
│   │   ├── auth.service.ts
│   │   ├── task.service.ts
│   │   ├── notification.service.ts
│   │   └── storage.service.ts
│   │
│   ├── config/                 # Конфігураційні файли
│   │   ├── firebase.ts
│   │   ├── api.config.ts
│   │   └── constants.ts
│   │
│   ├── types/                  # TypeScript типи
│   │   ├── task.types.ts
│   │   ├── user.types.ts
│   │   ├── settings.types.ts
│   │   └── index.ts            # Re-export всіх типів
│   │
│   ├── utils/                  # Helper функції
│   │   ├── cn.ts               # clsx + tailwind-merge
│   │   ├── date.ts             # Date formatting
│   │   ├── validation.ts       # Валідація
│   │   └── firebase.helpers.ts # Firebase helpers
│   │
│   ├── lib/                    # Third-party інтеграції
│   │   ├── react-query.ts      # React Query setup
│   │   └── firebase-hooks.ts   # Custom Firebase hooks
│   │
│   ├── __tests__/              # Тести
│   │   ├── components/
│   │   ├── hooks/
│   │   └── utils/
│   │
│   ├── App.tsx                 # Головний компонент
│   ├── main.tsx                # Entry point
│   ├── index.css               # Global styles + Tailwind
│   └── vite-env.d.ts           # Vite types
│
├── .env                        # Environment variables (НЕ комітити!)
├── .env.example                # Приклад env файлу
├── .env.local                  # Local overrides (НЕ комітити!)
├── .env.production             # Production variables
│
├── .gitignore
├── .eslintrc.cjs               # ESLint конфігурація
├── .prettierrc                 # Prettier конфігурація
│
├── package.json                # Dependencies та scripts
├── tsconfig.json               # TypeScript конфігурація
├── tsconfig.node.json          # TypeScript для Vite
├── vite.config.ts              # Vite конфігурація
├── tailwind.config.js          # Tailwind конфігурація
├── postcss.config.js           # PostCSS конфігурація
│
├── vitest.config.ts            # Vitest тест конфігурація
└── README.md
```

---

## 📦 package.json

```json
{
  "name": "todo-react-app",
  "version": "9.0.0",
  "type": "module",
  "description": "Modern PWA Todo App with React, TypeScript, Firebase & Tailwind",
  "author": "Your Name",
  "license": "MIT",
  "scripts": {
    "dev": "vite --host",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,md}\"",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",

    "firebase": "^10.14.1",
    "react-firebase-hooks": "^5.1.1",

    "@tanstack/react-query": "^5.56.2",
    "@tanstack/react-query-devtools": "^5.56.2",

    "zustand": "^4.5.5",

    "date-fns": "^3.6.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.2",

    "lucide-react": "^0.445.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.8",
    "@types/react-dom": "^18.3.0",

    "@typescript-eslint/eslint-plugin": "^8.6.0",
    "@typescript-eslint/parser": "^8.6.0",

    "@vitejs/plugin-react-swc": "^3.7.0",
    "vite": "^5.4.6",
    "vite-plugin-pwa": "^0.20.5",

    "typescript": "^5.6.2",

    "tailwindcss": "^3.4.12",
    "postcss": "^8.4.47",
    "autoprefixer": "^10.4.20",

    "eslint": "^9.10.0",
    "eslint-plugin-react-hooks": "^4.6.2",
    "eslint-plugin-react-refresh": "^0.4.12",
    "prettier": "^3.3.3",
    "prettier-plugin-tailwindcss": "^0.6.6",

    "vitest": "^2.1.1",
    "@testing-library/react": "^16.0.1",
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/user-event": "^14.5.2",
    "@vitest/ui": "^2.1.1",
    "@vitest/coverage-v8": "^2.1.1",
    "jsdom": "^25.0.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

### 📝 Пояснення Dependencies:

**Core:**
- `react` + `react-dom` - React 18 (18.3.1)
- `typescript` - TypeScript 5.6

**Firebase:**
- `firebase` - Firebase SDK v10
- `react-firebase-hooks` - React hooks для Firebase

**State Management:**
- `@tanstack/react-query` - Server state (Firebase cache)
- `zustand` - Client state (UI state)

**Utilities:**
- `date-fns` - Date manipulation
- `clsx` + `tailwind-merge` - Class names utility
- `lucide-react` - Icons

**Build & Dev:**
- `vite` - Build tool
- `@vitejs/plugin-react-swc` - React plugin з SWC (швидший)
- `vite-plugin-pwa` - PWA plugin

**Styling:**
- `tailwindcss` - CSS framework
- `postcss` + `autoprefixer` - CSS processing

**Testing:**
- `vitest` - Test runner
- `@testing-library/react` - Component testing
- `jsdom` - DOM simulation

---

## 🔧 API Конфігурація

### 1. Environment Variables

**.env.example:**
```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# FCM VAPID Key
VITE_FIREBASE_VAPID_KEY=your-vapid-key

# Cloudflare Worker (для push notifications)
VITE_CLOUDFLARE_WORKER_URL=https://your-worker.workers.dev

# App Configuration
VITE_APP_NAME=My Tasks
VITE_APP_VERSION=9.0.0

# Development
VITE_ENABLE_DEVTOOLS=true
VITE_ENABLE_LOGGING=true
```

**.env:** (створити з реальними значеннями, НЕ комітити!)
```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyAxde31tl4RazVOmcC_c14lG2b3wsPXzC0
VITE_FIREBASE_AUTH_DOMAIN=just-do-it-c3390.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=just-do-it-c3390
VITE_FIREBASE_STORAGE_BUCKET=just-do-it-c3390.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1057242941805
VITE_FIREBASE_APP_ID=1:1057242941805:web:8caea8fb087210f8637264

VITE_FIREBASE_VAPID_KEY=BAx2-XuP9uTBN1yD_kw7s8FyM4yD-vkw1pI93_x0b33hCKWiF6Fmgi0LBaS-IRsuGUIP8PAMtuJiKZnUmfI2UOk

VITE_CLOUDFLARE_WORKER_URL=https://todo-notifications.your-name.workers.dev

VITE_APP_NAME=My Tasks
VITE_ENABLE_DEVTOOLS=true
```

**.env.production:**
```bash
# Production overrides
VITE_ENABLE_DEVTOOLS=false
VITE_ENABLE_LOGGING=false
```

### 2. Typed API Config

**src/config/api.config.ts:**
```typescript
interface ApiConfig {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    vapidKey: string;
  };
  cloudflare: {
    workerUrl: string;
  };
  app: {
    name: string;
    version: string;
  };
  features: {
    enableDevtools: boolean;
    enableLogging: boolean;
  };
}

// Validate that all required env vars are present
function validateEnv(): void {
  const required = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
  ];

  const missing = required.filter((key) => !import.meta.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file.'
    );
  }
}

// Run validation
validateEnv();

// Export typed config
export const apiConfig: ApiConfig = {
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
  },
  cloudflare: {
    workerUrl: import.meta.env.VITE_CLOUDFLARE_WORKER_URL || '',
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || 'My Tasks',
    version: import.meta.env.VITE_APP_VERSION || '9.0.0',
  },
  features: {
    enableDevtools: import.meta.env.VITE_ENABLE_DEVTOOLS === 'true',
    enableLogging: import.meta.env.VITE_ENABLE_LOGGING === 'true',
  },
};

// Helper для логування в dev mode
export const logger = {
  log: (...args: unknown[]) => {
    if (apiConfig.features.enableLogging) {
      console.log('[App]', ...args);
    }
  },
  error: (...args: unknown[]) => {
    if (apiConfig.features.enableLogging) {
      console.error('[App Error]', ...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (apiConfig.features.enableLogging) {
      console.warn('[App Warning]', ...args);
    }
  },
};

// Export for convenience
export const isDev = import.meta.env.DEV;
export const isProd = import.meta.env.PROD;
```

**Використання:**
```typescript
import { apiConfig, logger, isDev } from '@/config/api.config';

// Використання конфігу
const apiKey = apiConfig.firebase.apiKey;

// Логування
logger.log('User signed in');

// Умовний код
if (isDev) {
  logger.log('Running in development mode');
}
```

---

## ⚙️ Конфігураційні Файли

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'manifest.json'],
      manifest: {
        name: 'My Tasks - Todo App',
        short_name: 'My Tasks',
        description: 'Modern PWA Todo App with real-time sync',
        theme_color: '#6366f1',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'firebase-storage-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true, // для тестування на мобільних
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'query-vendor': ['@tanstack/react-query'],
        },
      },
    },
  },
});
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### tailwind.config.js

```javascript
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
          light: '#818cf8',
        },
        secondary: {
          DEFAULT: '#10b981',
          dark: '#059669',
        },
        danger: {
          DEFAULT: '#ef4444',
          dark: '#dc2626',
        },
      },
      backdropBlur: {
        glass: '20px',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-in',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
```

---

## 🚀 Package Manager: npm

**Чому npm?**
- ✅ Вбудований в Node.js
- ✅ Найпопулярніший (швидка допомога в StackOverflow)
- ✅ Підтримка workspaces
- ✅ npm 9+ швидкий як yarn/pnpm

**Альтернативи:**
- `yarn` - якщо хочете Plug'n'Play
- `pnpm` - якщо критично економити диск (symlinks)

---

## 📝 Додаткові Конфіги

### .gitignore

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
dist/
build/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Firebase
.firebase/
firebase-debug.log

# PWA
dev-dist/
```

### .eslintrc.cjs

```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
}
```

### .prettierrc

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

---

## 🎯 Готові Команди для Початку

```bash
# 1. Створити проєкт
npm create vite@latest todo-react -- --template react-ts
cd todo-react

# 2. Встановити залежності (скопіюйте package.json вище)
npm install

# 3. Створити структуру папок
mkdir -p src/{components/{auth,tasks,settings,layout,ui},hooks,contexts,services,config,types,utils,lib,__tests__}

# 4. Створити .env файл
cp .env.example .env
# Відредагувати .env з реальними значеннями

# 5. Запустити dev server
npm run dev
```

---

## ✅ Готово!

Тепер у вас є:
- ✅ Повна структура папок
- ✅ package.json з усіма залежностями
- ✅ Typed API конфігурація
- ✅ Environment variables setup
- ✅ Vite + Tailwind конфігурація
- ✅ TypeScript налаштування
- ✅ ESLint + Prettier

**Наступний крок:** Почати створювати компоненти! 🚀