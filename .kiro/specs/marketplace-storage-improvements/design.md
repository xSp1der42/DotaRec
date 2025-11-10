# Design Document

## Overview

Данный дизайн описывает улучшения системы хранилища и торговой площадки для игры с карточками киберспортсменов. Основные изменения включают:

1. **Визуальное разделение карточек в хранилище** - карточки отображаются индивидуально, как в коллекции
2. **Улучшенная обработка дубликатов** - специальная логика для карточек, которые уже есть в коллекции
3. **Удаление перемещения из хранилища в коллекцию** - коллекция содержит только уникальные карточки
4. **Полнофункциональная торговая площадка** - выставление, покупка и отмена объявлений
5. **Улучшенные модальные окна** - разные интерфейсы для коллекции и хранилища

## Architecture

### Компоненты системы

```
Frontend:
├── ShopPage.js (CardChoiceModal) - обработка открытия паков
├── StorageTab.js - управление хранилищем
├── CollectionTab (в ProfilePage.js) - управление коллекцией
├── MarketplacePage.js (новый) - отдельная страница торговой площадки
├── CardDetailModal.js (новый) - детальный просмотр карточек
└── App.js - обновление навигации для добавления ссылки на торговую площадку

Backend:
├── profileRoutes.js - обработка карточек из паков
├── marketplaceRoutes.js - API торговой площадки
└── marketplaceModel.js - модель объявлений
```

### Поток данных

1. **Открытие пака**: ShopPage → Backend → CardChoiceModal → profileRoutes
2. **Хранилище**: StorageTab → profileRoutes/marketplaceRoutes
3. **Коллекция**: ProfilePage → CardDetailModal → profileRoutes/marketplaceRoutes
4. **Торговая площадка**: MarketplacePage → marketplaceRoutes

### Навигация

Главная навигация приложения будет обновлена для включения торговой площадки:

**Текущая навигация:**
```
Карточки → Магазин → Pick'em → Фэнтези → [Профиль]
```

**Новая навигация:**
```
Карточки → Магазин → Торговая площадка → Pick'em → Фэнтези → [Профиль]
```

Торговая площадка будет доступна по маршруту `/marketplace` и будет отдельной страницей, а не вкладкой в профиле.

**Изменения в App.js:**
1. Импортировать новый компонент MarketplacePage
2. Добавить NavLink в главную навигацию между "Магазин" и "Pick'em"
3. Добавить Route для `/marketplace`

## Components and Interfaces

### 1. CardChoiceModal (ShopPage.js)

**Изменения:**

- Проверка дубликатов: при открытии пака проверяем, какие карточки уже есть в коллекции
- Условное отображение кнопок:
  - Если карточка НЕ в коллекции: показываем "В коллекцию", "В хранилище", "Продать", "Выставить на ТП"
  - Если карточка УЖЕ в коллекции: показываем только "В хранилище", "Быстрая продажа", "Выставить на ТП"

**Интерфейс:**
```javascript
interface CardChoiceModalProps {
  cards: Player[];
  onClose: () => void;
  onProcessCards: (cards: Player[], action: string) => Promise<void>;
  myCollectionCardIds: string[]; // ID карточек в коллекции
}
```

**Логика:**
```javascript
const isDuplicate = (cardId) => myCollectionCardIds.includes(cardId);

// Кнопки для каждой карточки
if (isDuplicate(card._id)) {
  // Показываем: "В хранилище", "Быстрая продажа", "Выставить на ТП"
} else {
  // Показываем: "В коллекцию", "В хранилище", "Быстрая продажа", "Выставить на ТП"
}
```

### 2. StorageTab.js

**Изменения:**
- Удаление кнопки "В коллекцию"
- Отображение карточек индивидуально (не стопкой)
- Добавление клика по карточке для открытия модального окна
- Модальное окно с опциями: "Быстрая продажа" и "Выставить на ТП"

**Интерфейс:**
```javascript
interface StorageTabProps {
  storage: string[]; // ID карточек
  allCards: Player[]; // Все возможные карточки
  onUpdate: () => void;
  currentSeason: number;
}
```

**Новые состояния:**
```javascript
const [selectedCard, setSelectedCard] = useState(null); // Для модального окна
const [showCardModal, setShowCardModal] = useState(false);
```

**Логика отображения:**
- Каждая карточка в хранилище отображается отдельно
- При клике на карточку открывается модальное окно с опциями
- Множественный выбор для массовых операций

### 3. CollectionTab (ProfilePage.js)

**Изменения:**

- Добавление клика по карточке для открытия детального модального окна
- Модальное окно показывает статистику карточки + кнопки действий

**Новый компонент: CardDetailModal**
```javascript
interface CardDetailModalProps {
  card: Player;
  onClose: () => void;
  onQuickSell: (cardId: string) => Promise<void>;
  onListOnMarketplace: (cardId: string, price: number) => Promise<void>;
  source: 'collection' | 'storage'; // Откуда открыта карточка
}
```

**Логика:**
- Если source === 'collection': показываем полную статистику + кнопки
- Если source === 'storage': показываем только кнопки (без статистики)

### 4. MarketplacePage.js (новый компонент)

**Создание отдельной страницы торговой площадки:**

Торговая площадка будет перенесена из вкладки профиля в отдельную страницу с полным функционалом:

- Просмотр всех активных объявлений
- Покупка карточек
- Отмена своих объявлений
- Фильтрация по сезону, редкости, команде
- Поиск по имени игрока
- Сортировка по цене

**Интерфейс:**
```javascript
interface MarketplacePageProps {
  // Нет props - страница сама загружает данные
}
```

**Основные функции:**
- `fetchListings()` - загрузка всех объявлений
- `buyCard(listingId)` - покупка карточки
- `cancelListing(listingId)` - отмена своего объявления
- `filterListings(filters)` - фильтрация объявлений

**Навигация:**
- Добавить ссылку в главную навигацию (App.js или Header компонент)
- Маршрут: `/marketplace`
- Позиция: после "Магазин", перед "Профиль"

### 5. Backend API Changes

**profileRoutes.js - POST /api/profile/process-cards**

Обновление логики для обработки дубликатов:
```javascript
// Если action === 'collection' и карточка уже в коллекции
if (action === 'collection' && user.cardCollection.includes(cardId)) {
  throw new Error('Card already in collection');
}
```

**marketplaceRoutes.js - POST /api/marketplace**

Обновление для поддержки выставления из коллекции:
```javascript
// Проверяем наличие в коллекции ИЛИ хранилище
const hasInCollection = user.cardCollection.includes(cardId);
const hasInStorage = user.storage.includes(cardId);

if (!hasInCollection && !hasInStorage) {
  throw new Error('Card not found');
}

// Удаляем из соответствующего места
if (hasInCollection) {
  user.cardCollection = user.cardCollection.filter(id => id !== cardId);
} else {
  user.storage = user.storage.filter(id => id !== cardId);
}
```

**marketplaceRoutes.js - POST /api/marketplace/:id/buy**

Обновление логики добавления купленной карточки:
```javascript
// Проверяем, есть ли карточка в коллекции
if (buyer.cardCollection.includes(listing.card._id)) {
  // Дубликат - добавляем в хранилище
  if (buyer.storage.length >= 100) {
    throw new Error('Storage is full');
  }
  buyer.storage.push(listing.card._id);
} else {
  // Новая карточка - добавляем в коллекцию
  buyer.cardCollection.push(listing.card._id);
}
```

## Data Models

### MarketplaceListing (существующая модель)

```javascript
{
  seller: ObjectId,
  buyer: ObjectId,
  card: ObjectId,
  price: Number,
  status: String, // 'active', 'sold', 'cancelled'
  season: Number,
  createdAt: Date,
  soldAt: Date
}
```

### User (обновления)

```javascript
{
  cardCollection: [ObjectId], // Уникальные карточки
  storage: [ObjectId], // Дубликаты (до 100 штук)
  coins: Number,
  // ... остальные поля
}
```

## Error Handling

### Frontend

1. **Недостаточно коинов**: "Недостаточно коинов для покупки"
2. **Хранилище переполнено**: "Хранилище заполнено (100/100)"
3. **Дубликат в коллекции**: "Эта карточка уже есть в коллекции"
4. **Ошибка сети**: "Ошибка соединения. Попробуйте позже"

### Backend

1. **Карточка не найдена**: 404 "Card not found in your collection or storage"
2. **Недостаточно коинов**: 400 "Insufficient coins"
3. **Хранилище переполнено**: 400 "Storage is full"
4. **Попытка купить свое объявление**: 400 "You cannot buy your own listing"

## Testing Strategy

### Unit Tests

1. **CardChoiceModal**
   - Проверка отображения правильных кнопок для дубликатов
   - Проверка отображения правильных кнопок для новых карточек

2. **StorageTab**
   - Проверка отображения карточек индивидуально
   - Проверка отсутствия кнопки "В коллекцию"

3. **MarketplaceTab**
   - Проверка покупки карточки
   - Проверка отмены объявления

### Integration Tests

1. **Открытие пака с дубликатами**
   - Открыть пак
   - Проверить, что дубликаты имеют ограниченные опции

2. **Выставление на торговую площадку**
   - Выставить карточку из хранилища
   - Выставить карточку из коллекции
   - Проверить, что карточка удалена из источника

3. **Покупка карточки**
   - Купить новую карточку → должна попасть в коллекцию
   - Купить дубликат → должен попасть в хранилище

## UI/UX Considerations

### Визуальные изменения

1. **Хранилище**: карточки в сетке, как в коллекции (без стопок)
2. **Модальное окно коллекции**: статистика сверху, кнопки снизу
3. **Модальное окно хранилища**: только кнопки действий
4. **CardChoiceModal**: условное отображение кнопок с иконками дубликатов

### Анимации

1. Плавное открытие модальных окон
2. Подсветка выбранных карточек
3. Анимация при успешной операции

### Адаптивность

- Все компоненты должны корректно отображаться на мобильных устройствах
- Модальные окна должны быть прокручиваемыми на маленьких экранах
