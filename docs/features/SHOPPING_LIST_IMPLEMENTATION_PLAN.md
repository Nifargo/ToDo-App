# Shopping List - План Імплементації

## 📋 Огляд

Shopping List - простий та зручний список покупок з можливістю поділитися зі кількома користувачами в реальному часі.

---

## ✨ Функціональність

### Phase 1: Базова функціональність
- ✅ Простий список продуктів
- ✅ Круглий checkbox біля кожного продукта
- ✅ При натисканні → закреслюється + переміщується в кінець списку
- ✅ Інпут для додавання продуктів (текстом: "Молоко 2л")
- ✅ Все на одній сторінці (без pop-up)

### Phase 2: Покращення UX
- ✅ Свайп ліворуч → кнопка Delete
- ✅ Кнопка "Очистити куплені" (видалити всі закреслені)
- ✅ Автоматичне видалення куплених через 24 години

### Phase 3: Multi-User Sharing
- ✅ Можливість поділитися списком з іншими користувачами
- ✅ Real-time синхронізація (Firestore)
- ✅ Кілька користувачів можуть одночасно працювати з одним списком
- ✅ Показувати хто додав/купив продукт

---

## 🗂️ Структура даних (Firestore)

### Collection: `shoppingLists`
```typescript
interface ShoppingList {
  id: string;                    // auto-generated
  name: string;                  // "Groceries", "Weekend Shopping"
  ownerId: string;               // userId власника
  sharedWith: string[];          // [userId1, userId2] - користувачі з доступом
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
}
```

### Collection: `shoppingItems`
```typescript
interface ShoppingItem {
  id: string;                    // auto-generated
  listId: string;                // ID списку до якого належить
  text: string;                  // "Молоко 2л"
  purchased: boolean;            // true/false
  purchasedAt: string | null;    // ISO timestamp або null
  purchasedBy: string | null;    // userId хто купив або null
  addedBy: string;               // userId хто додав
  createdAt: string;             // ISO timestamp
  order: number;                 // для сортування
}
```

**Firestore structure:**
```
firestore/
├── shoppingLists/
│   ├── {listId}/
│   │   ├── id: "list-123"
│   │   ├── name: "Groceries"
│   │   ├── ownerId: "user-456"
│   │   ├── sharedWith: ["user-789", "user-012"]
│   │   ├── createdAt: "2025-12-13T10:00:00Z"
│   │   └── updatedAt: "2025-12-13T15:30:00Z"
│
└── shoppingItems/
    ├── {itemId}/
    │   ├── id: "item-abc"
    │   ├── listId: "list-123"
    │   ├── text: "Молоко 2л"
    │   ├── purchased: false
    │   ├── purchasedAt: null
    │   ├── purchasedBy: null
    │   ├── addedBy: "user-456"
    │   ├── createdAt: "2025-12-13T10:15:00Z"
    │   └── order: 1
```

---

## 🏗️ Архітектура (React + TypeScript)

### TypeScript Types
**File:** `src/types/shopping.types.ts`
```typescript
export interface ShoppingList {
  id: string;
  name: string;
  ownerId: string;
  sharedWith: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingItem {
  id: string;
  listId: string;
  text: string;
  purchased: boolean;
  purchasedAt: string | null;
  purchasedBy: string | null;
  addedBy: string;
  createdAt: string;
  order: number;
}

export interface CreateShoppingListInput {
  name: string;
}

export interface CreateShoppingItemInput {
  listId: string;
  text: string;
}

export interface UpdateShoppingItemInput {
  text?: string;
  purchased?: boolean;
  order?: number;
}
```

### Custom Hooks

#### `useShoppingLists.ts`
```typescript
export function useShoppingLists() {
  // Отримати всі списки користувача (власні + поділені)
  // Створити новий список
  // Видалити список
  // Поділитися списком з користувачем
  // Залишити поділений список
}
```

#### `useShoppingItems.ts`
```typescript
export function useShoppingItems(listId: string) {
  // Отримати всі продукти списку
  // Додати продукт
  // Оновити продукт (текст, purchased)
  // Видалити продукт
  // Очистити куплені продукти
  // Автоматичне видалення куплених через 24 години
}
```

### Components Structure

```
src/components/shopping/
├── ShoppingListView.tsx           # Головний view з навігацією
├── ShoppingListSelector.tsx       # Вибір списку або створення нового
├── ShoppingList.tsx               # Відображення списку продуктів
├── ShoppingItem.tsx               # Окремий продукт (checkbox + text + swipe)
├── AddShoppingItemInput.tsx       # Інпут для додавання продуктів
├── ShareListModal.tsx             # Модалка для sharing списку
└── ShoppingListSettings.tsx       # Налаштування списку (rename, delete, leave)
```

---

## 📱 UI/UX Design

### Main Screen
```
┌─────────────────────────────────────────┐
│ ← Shopping List          [Share] [···]  │ ← Header
├─────────────────────────────────────────┤
│ [Add new item...               ] [+]    │ ← Add Input
├─────────────────────────────────────────┤
│                                          │
│ ○ Молоко 2л                             │ ← Unpurchased
│ ○ Хліб білий                            │
│ ○ Яйця 10шт                             │
│                                          │
│ ─────────────────────────────────       │ ← Divider
│                                          │
│ ⊙ Цукор 1кг              ───────        │ ← Purchased
│ ⊙ Сіль                   ───────        │
│                                          │
├─────────────────────────────────────────┤
│ [Clear Purchased (2)]                   │ ← Bottom Button
└─────────────────────────────────────────┘
```

### Swipe Action (як в Tasks)
```
┌─────────────────────────────┬──────────┐
│ ○ Молоко 2л                 │ [Delete] │ ← Swiped left
│                              │   RED    │
└──────────────────────────────┴──────────┘
```

### Share List Modal
```
┌─────────────────────────────────────────┐
│ Share "Groceries"               [×]     │
├─────────────────────────────────────────┤
│                                          │
│ Enter user email:                        │
│ [example@gmail.com          ] [Share]   │
│                                          │
│ Shared with:                             │
│ ┌────────────────────────────────────┐  │
│ │ 👤 John Doe                        │  │
│ │    john@example.com        [Remove]│  │
│ └────────────────────────────────────┘  │
│ ┌────────────────────────────────────┐  │
│ │ 👤 Jane Smith                      │  │
│ │    jane@example.com        [Remove]│  │
│ └────────────────────────────────────┘  │
│                                          │
└─────────────────────────────────────────┘
```

---

## 🔐 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Shopping Lists
    match /shoppingLists/{listId} {
      // Читати може власник або користувач в sharedWith
      allow read: if request.auth != null && (
        resource.data.ownerId == request.auth.uid ||
        request.auth.uid in resource.data.sharedWith
      );

      // Створювати може будь-який авторизований користувач
      allow create: if request.auth != null &&
        request.resource.data.ownerId == request.auth.uid;

      // Оновлювати може тільки власник
      allow update: if request.auth != null &&
        resource.data.ownerId == request.auth.uid;

      // Видаляти може тільки власник
      allow delete: if request.auth != null &&
        resource.data.ownerId == request.auth.uid;
    }

    // Shopping Items
    match /shoppingItems/{itemId} {
      // Читати можуть користувачі з доступом до списку
      allow read: if request.auth != null &&
        exists(/databases/$(database)/documents/shoppingLists/$(resource.data.listId)) &&
        (
          get(/databases/$(database)/documents/shoppingLists/$(resource.data.listId)).data.ownerId == request.auth.uid ||
          request.auth.uid in get(/databases/$(database)/documents/shoppingLists/$(resource.data.listId)).data.sharedWith
        );

      // Створювати можуть користувачі з доступом
      allow create: if request.auth != null &&
        exists(/databases/$(database)/documents/shoppingLists/$(request.resource.data.listId)) &&
        (
          get(/databases/$(database)/documents/shoppingLists/$(request.resource.data.listId)).data.ownerId == request.auth.uid ||
          request.auth.uid in get(/databases/$(database)/documents/shoppingLists/$(request.resource.data.listId)).data.sharedWith
        );

      // Оновлювати можуть користувачі з доступом
      allow update: if request.auth != null &&
        exists(/databases/$(database)/documents/shoppingLists/$(resource.data.listId)) &&
        (
          get(/databases/$(database)/documents/shoppingLists/$(resource.data.listId)).data.ownerId == request.auth.uid ||
          request.auth.uid in get(/databases/$(database)/documents/shoppingLists/$(resource.data.listId)).data.sharedWith
        );

      // Видаляти можуть користувачі з доступом
      allow delete: if request.auth != null &&
        exists(/databases/$(database)/documents/shoppingLists/$(resource.data.listId)) &&
        (
          get(/databases/$(database)/documents/shoppingLists/$(resource.data.listId)).data.ownerId == request.auth.uid ||
          request.auth.uid in get(/databases/$(database)/documents/shoppingLists/$(resource.data.listId)).data.sharedWith
        );
    }
  }
}
```

---

## 🚀 Етапи розробки

### **Phase 1: Базова функціональність** (2-3 години)

1. **Створити TypeScript types** (`shopping.types.ts`)
   - ShoppingList, ShoppingItem, CreateInputs, UpdateInputs

2. **Створити custom hook** (`useShoppingLists.ts`)
   - useFirestore для отримання списків
   - createList, deleteList

3. **Створити custom hook** (`useShoppingItems.ts`)
   - useFirestore для отримання продуктів
   - createItem, updateItem, deleteItem, togglePurchased

4. **Створити UI components**
   - `ShoppingListView.tsx` - головний view
   - `ShoppingList.tsx` - список продуктів
   - `ShoppingItem.tsx` - окремий продукт з checkbox
   - `AddShoppingItemInput.tsx` - інпут для додавання

5. **Базова логіка**
   - Додавання продуктів
   - Checkbox → закреслювання + переміщення в кінець
   - Видалення продуктів

---

### **Phase 2: Покращення UX** (1-2 години)

1. **Swipe для видалення**
   - Використати `react-swipeable` (як в Tasks)
   - Swipe left → показати Delete button

2. **Кнопка "Clear Purchased"**
   - Кнопка внизу списку
   - Видаляє всі purchased продукти одразу
   - Показувати кількість: "Clear Purchased (5)"

3. **Автоматичне видалення куплених**
   - Як в Tasks (через `differenceInHours`)
   - Видаляти через 24 години після `purchasedAt`
   - useEffect + setInterval (кожну годину)

---

### **Phase 3: Multi-User Sharing** (3-4 години)

1. **Розширити Firestore structure**
   - Додати `sharedWith: string[]` в ShoppingList
   - Додати `addedBy`, `purchasedBy` в ShoppingItem

2. **Firestore Security Rules**
   - Правила для читання/запису поділених списків
   - Перевірка доступу через `sharedWith`

3. **Share функціональність в hook**
   - `shareListWithUser(listId, userEmail)`
   - `removeUserFromList(listId, userId)`
   - `leaveSharedList(listId)`

4. **UI для sharing**
   - `ShareListModal.tsx` - модалка
   - Input для email користувача
   - Список користувачів з доступом
   - Кнопка Remove для кожного користувача

5. **Real-time sync**
   - Firestore `.onSnapshot()` для автоматичної синхронізації
   - Оновлення списку коли інші користувачі роблять зміни

6. **User info display**
   - Показувати "Added by John" під продуктом (optional)
   - Показувати "Purchased by Jane" для куплених (optional)

---

### **Phase 4: Фінальні штрихи** (1 година)

1. **Анімації та transitions**
   - Smooth transitions при переміщенні продуктів
   - Fade in/out при додаванні/видаленні

2. **Error handling**
   - Toast повідомлення для помилок
   - Loading states

3. **Empty states**
   - "No items yet" для порожнього списку
   - "No purchased items" для секції куплених

4. **Testing**
   - Тестування з 2+ користувачами одночасно
   - Перевірка real-time sync
   - Перевірка auto-delete після 24 годин

---

## ✅ Checklist розробки

### Phase 1: Базова функціональність
- [ ] TypeScript types створені
- [ ] useShoppingLists hook
- [ ] useShoppingItems hook
- [ ] UI components (View, List, Item, Input)
- [ ] Додавання продуктів працює
- [ ] Checkbox → закреслювання + переміщення
- [ ] Видалення продуктів працює

### Phase 2: Покращення UX
- [ ] Swipe для видалення реалізовано
- [ ] Кнопка "Clear Purchased" працює
- [ ] Автоматичне видалення через 24 години

### Phase 3: Multi-User Sharing
- [ ] Firestore structure розширена
- [ ] Security Rules налаштовані
- [ ] Share функціональність в hook
- [ ] ShareListModal UI
- [ ] Real-time sync працює
- [ ] Тестування з 2+ користувачами

### Phase 4: Фінальні штрихи
- [ ] Анімації додані
- [ ] Error handling
- [ ] Empty states
- [ ] Фінальне тестування

---

## 🎨 Дизайн деталі

### Кольори
- **Unpurchased items:** Default text color
- **Purchased items:** Gray text + strikethrough
- **Checkbox (unchecked):** Border only (круглий)
- **Checkbox (checked):** Filled з галочкою
- **Delete button (swipe):** Red background

### Анімації
- **Checkbox toggle:** 200ms transition
- **Item move to bottom:** 300ms slide down
- **Swipe action:** 300ms transform
- **Add item:** Fade in + slide up

### Typography
- **Item text:** Regular, 16px
- **Purchased text:** Regular, 16px, strikethrough, gray

---

## 📝 Приклад використання

### Створення списку
```typescript
const { createList } = useShoppingLists();
await createList({ name: 'Groceries' });
```

### Додавання продукта
```typescript
const { createItem } = useShoppingItems(listId);
await createItem({ listId, text: 'Молоко 2л' });
```

### Позначити як куплене
```typescript
const { togglePurchased } = useShoppingItems(listId);
await togglePurchased(itemId, true);
```

### Поділитися списком
```typescript
const { shareListWithUser } = useShoppingLists();
await shareListWithUser(listId, 'friend@example.com');
```

---

## 🐛 Потенційні проблеми та рішення

### Проблема 1: Конфлікти при одночасному редагуванні
**Рішення:** Firestore автоматично вирішує конфлікти через timestamps. Використовувати `updatedAt` для визначення найновішої версії.

### Проблема 2: Продукти дублюються при швидкому додаванні
**Рішення:** Додати debounce на створення продукта або disabled стан кнопки під час створення.

### Проблема 3: Користувач не знайдений по email
**Рішення:** Створити Firestore collection `users` з `email -> userId` mapping. Або використовувати Firebase Auth для пошуку по email (потребує Admin SDK на backend).

### Проблема 4: Продукти переміщуються хаотично
**Рішення:** Використовувати поле `order` для явного сортування. При позначенні як purchased - присвоїти найбільший `order`.

---

## 🚀 Deployment

Shopping List автоматично задеплоїться разом з React додатком через GitHub Actions на GitHub Pages.

**URL:** https://nifargo.github.io/ToDo-App/

---

## 📚 Додаткові ресурси

- React Swipeable: https://www.npmjs.com/package/react-swipeable
- Firestore Real-time Updates: https://firebase.google.com/docs/firestore/query-data/listen
- Firestore Security Rules: https://firebase.google.com/docs/firestore/security/get-started

---

**Готово до імплементації!** 🎉