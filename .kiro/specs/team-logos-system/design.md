# Design Document - Team Logos System

## Overview

Система логотипов команд интегрируется в существующую архитектуру приложения, добавляя функциональность загрузки, хранения и отображения логотипов команд в пикеме и предикторе. Система состоит из backend API для управления файлами, административного интерфейса для загрузки логотипов и frontend компонентов для отображения.

## Architecture

### Backend Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Admin Panel   │───▶│   Logo Upload    │───▶│  File Storage   │
│                 │    │      API         │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Pick Interface  │◀───│   Logo Serve     │◀───│   Database      │
│                 │    │      API         │    │  (Team-Logo     │
└─────────────────┘    └──────────────────┘    │   Relations)    │
                                ▲              └─────────────────┘
┌─────────────────┐             │
│Predictor Interface│────────────┘
└─────────────────┘
```

### Frontend Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    React Application                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Admin Panel    │  │  Pick Interface │  │Predictor Interface│ │
│  │                 │  │                 │  │                 │ │
│  │ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌─────────────┐ │ │
│  │ │Logo Upload  │ │  │ │Team Logo    │ │  │ │Match Card   │ │ │
│  │ │Component    │ │  │ │Component    │ │  │ │with Logos   │ │ │
│  │ └─────────────┘ │  │ └─────────────┘ │  │ └─────────────┘ │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                    Shared Logo Service                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Logo Cache    │  │  Logo Loader    │  │ Fallback Handler│ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Backend Components

#### 1. Logo Upload API (`/api/admin/teams/logo`)
```javascript
// POST /api/admin/teams/:teamId/logo
{
  method: 'POST',
  headers: { 'Content-Type': 'multipart/form-data' },
  body: FormData // содержит файл логотипа
}

// Response
{
  success: true,
  logoUrl: '/uploads/logos/team-123-logo.png',
  sizes: {
    small: '/uploads/logos/team-123-logo-32.png',
    medium: '/uploads/logos/team-123-logo-64.png', 
    large: '/uploads/logos/team-123-logo-128.png'
  }
}
```

#### 2. Logo Management API
```javascript
// GET /api/admin/teams/logos - получить все логотипы
// DELETE /api/admin/teams/:teamId/logo - удалить логотип
// GET /api/teams/:teamId/logo - получить логотип команды
```

#### 3. File Processing Service
- Валидация файлов (формат, размер)
- Генерация множественных размеров (32x32, 64x64, 128x128)
- Оптимизация изображений
- Сохранение в файловую систему

### Frontend Components

#### 1. AdminLogoUpload Component
```jsx
const AdminLogoUpload = ({ teamId, currentLogo, onLogoUpdate }) => {
  // Drag & drop интерфейс
  // Превью загружаемого файла
  // Прогресс загрузки
  // Кнопки замены/удаления логотипа
}
```

#### 2. TeamLogo Component
```jsx
const TeamLogo = ({ 
  teamId, 
  teamName, 
  size = 'medium', // small, medium, large
  showFallback = true 
}) => {
  // Асинхронная загрузка логотипа
  // Кэширование
  // Fallback на текстовое название
  // Tooltip с названием команды
}
```

#### 3. LogoService (Shared Service)
```javascript
class LogoService {
  static cache = new Map();
  
  static async getTeamLogo(teamId, size = 'medium') {
    // Проверка кэша
    // Загрузка с сервера
    // Обработка ошибок
  }
  
  static preloadLogos(teamIds) {
    // Предзагрузка логотипов для списка команд
  }
}
```

## Data Models

### Database Schema Extension

#### Teams Collection (MongoDB)
```javascript
{
  _id: ObjectId,
  name: String,
  // ... существующие поля
  logo: {
    originalUrl: String,     // '/uploads/logos/team-123-original.png'
    sizes: {
      small: String,         // '/uploads/logos/team-123-32.png'
      medium: String,        // '/uploads/logos/team-123-64.png'
      large: String          // '/uploads/logos/team-123-128.png'
    },
    uploadedAt: Date,
    fileSize: Number,        // размер оригинального файла в байтах
    mimeType: String         // 'image/png', 'image/jpeg', 'image/svg+xml'
  }
}
```

### File System Structure
```
backend/
├── uploads/
│   └── logos/
│       ├── team-123-original.png
│       ├── team-123-32.png
│       ├── team-123-64.png
│       └── team-123-128.png
```

## Error Handling

### Backend Error Handling
1. **File Validation Errors**
   - Неподдерживаемый формат файла
   - Превышение максимального размера
   - Поврежденный файл

2. **Storage Errors**
   - Недостаток места на диске
   - Ошибки записи файла
   - Ошибки обработки изображения

3. **Database Errors**
   - Ошибки обновления записи команды
   - Конфликты при одновременном обновлении

### Frontend Error Handling
1. **Upload Errors**
   - Показ пользователю понятных сообщений об ошибках
   - Возможность повторной попытки загрузки
   - Валидация на клиенте перед отправкой

2. **Display Errors**
   - Graceful fallback на текстовое название
   - Retry механизм для загрузки логотипов
   - Placeholder во время загрузки

## Testing Strategy

### Backend Testing
1. **Unit Tests**
   - Тестирование валидации файлов
   - Тестирование обработки изображений
   - Тестирование API endpoints

2. **Integration Tests**
   - Полный цикл загрузки логотипа
   - Тестирование с различными форматами файлов
   - Тестирование ошибочных сценариев

### Frontend Testing
1. **Component Tests**
   - Тестирование AdminLogoUpload компонента
   - Тестирование TeamLogo компонента
   - Тестирование LogoService

2. **E2E Tests**
   - Загрузка логотипа через админ панель
   - Отображение логотипов в пикеме
   - Отображение логотипов в предикторе

### Performance Testing
1. **Load Testing**
   - Одновременная загрузка множественных логотипов
   - Нагрузочное тестирование отображения логотипов

2. **Image Optimization Testing**
   - Проверка качества сжатых изображений
   - Тестирование времени загрузки различных размеров

## Security Considerations

1. **File Upload Security**
   - Валидация MIME типов
   - Проверка магических байтов файлов
   - Ограничение размера файлов
   - Сканирование на вредоносный код

2. **Access Control**
   - Только администраторы могут загружать логотипы
   - Публичный доступ только для чтения логотипов
   - Rate limiting для API endpoints

3. **File System Security**
   - Изоляция директории uploads
   - Предотвращение directory traversal атак
   - Регулярная очистка неиспользуемых файлов

## Performance Optimizations

1. **Image Processing**
   - Асинхронная обработка изображений
   - Использование оптимизированных библиотек (Sharp.js)
   - Генерация WebP версий для современных браузеров

2. **Caching Strategy**
   - Browser caching с правильными headers
   - CDN интеграция для статических файлов
   - In-memory кэширование на frontend

3. **Lazy Loading**
   - Загрузка логотипов только при необходимости
   - Intersection Observer для видимых элементов
   - Предзагрузка для критических логотипов

## Integration Points

### Existing Systems Integration

1. **Pick System Integration**
   - Модификация существующих компонентов команд
   - Интеграция с текущим API команд
   - Обновление стилей для отображения логотипов

2. **Predictor System Integration**
   - Обновление MatchCard компонентов
   - Интеграция с турнирной сеткой
   - Модификация API матчей для включения логотипов

3. **Admin Panel Integration**
   - Добавление секции управления логотипами
   - Интеграция с существующей системой аутентификации
   - Расширение прав доступа администратора