# Design Document

## Overview

Создание премиальной системы тем для Cybersport Cards с полным редизайном всех компонентов. Дизайн фокусируется на современной эстетике киберспорта с неоновыми акцентами, плавными анимациями и профессиональным UI/UX. Система будет поддерживать две темы (тёмную и светлую) с мгновенным переключением без перезагрузки.

## Architecture

### Theme System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     App Component                        │
│                  (ThemeProvider wrapper)                 │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ┌────▼─────┐         ┌──────▼──────┐
    │  Theme   │         │   All App   │
    │ Context  │◄────────┤ Components  │
    └────┬─────┘         └─────────────┘
         │
    ┌────▼─────────────────────────────┐
    │  localStorage                     │
    │  key: 'cybersport-theme'         │
    │  values: 'dark' | 'light'        │
    └──────────────────────────────────┘
```

### CSS Variables System

```
:root[data-theme="dark"] {
  /* Primary Colors */
  --bg-primary: #0a0a0f
  --bg-secondary: #13131a
  --bg-tertiary: #1a1a24
  
  /* Accent Colors */
  --accent-primary: #00f2ea (cyan)
  --accent-secondary: #ff4757 (red)
  --accent-tertiary: #a855f7 (purple)
  
  /* Text Colors */
  --text-primary: #ffffff
  --text-secondary: #a0a0b0
  --text-tertiary: #6b6b7b
}

:root[data-theme="light"] {
  /* Primary Colors */
  --bg-primary: #ffffff
  --bg-secondary: #f5f5f7
  --bg-tertiary: #e8e8ed
  
  /* Accent Colors */
  --accent-primary: #0088ff
  --accent-secondary: #ff3b4f
  --accent-tertiary: #9333ea
  
  /* Text Colors */
  --text-primary: #1a1a1f
  --text-secondary: #4a4a5a
  --text-tertiary: #8a8a9a
}
```

## Components and Interfaces

### 1. ThemeContext (React Context)

**Purpose**: Управление глобальным состоянием темы

**Interface**:
```typescript
interface ThemeContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
}
```

**Implementation Details**:
- Создаётся в `src/context/ThemeContext.js`
- Использует `useState` для хранения текущей темы
- Использует `useEffect` для синхронизации с localStorage
- Применяет `data-theme` атрибут к `document.documentElement`
- Инициализируется из localStorage или использует 'dark' по умолчанию

### 2. Design Tokens System

**File**: `src/styles/tokens.css`

**Structure**:
```css
:root {
  /* Spacing Scale */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  
  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.2);
  --shadow-glow: 0 0 20px var(--accent-primary);
  
  /* Typography */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 24px;
  --font-size-2xl: 32px;
  --font-size-3xl: 48px;
  
  /* Transitions */
  --transition-fast: 0.15s ease;
  --transition-base: 0.3s ease;
  --transition-slow: 0.5s ease;
}
```

### 3. Global Styles

**File**: `src/styles/global.css`

**Key Features**:
- CSS Reset для консистентности
- Базовые стили для body, html
- Transition для всех цветовых свойств при смене темы
- Scrollbar styling для обеих тем
- Selection styling
- Focus-visible стили для accessibility

**Example**:
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-family);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color var(--transition-base),
              color var(--transition-base);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 12px;
}

::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--accent-primary);
  border-radius: var(--radius-full);
}

::selection {
  background: var(--accent-primary);
  color: var(--bg-primary);
}
```

### 4. Component-Specific Styles

#### 4.1 Navigation Header

**File**: `src/styles/Header.css`

**Design Features**:
- Sticky header с backdrop-filter blur(20px)
- Glassmorphism эффект
- Animated logo с hover effect
- Navigation buttons с smooth transitions
- User coins display с gradient background
- Mobile responsive hamburger menu

**Visual Hierarchy**:
```
┌─────────────────────────────────────────────────────────┐
│  [Logo]  [Nav Buttons...]     [Coins] [Theme] [Profile] │
└─────────────────────────────────────────────────────────┘
```

**Hover Effects**:
- Transform: translateY(-2px)
- Box-shadow увеличение
- Color transition к accent
- Scale: 1.05 для иконок

#### 4.2 Player Cards

**File**: `src/styles/PlayerCard.css`

**Design Features**:
- Gradient backgrounds по редкости:
  - Common: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
  - Rare: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)
  - Epic: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)
  - Legendary: linear-gradient(135deg, #fa709a 0%, #fee140 100%)
- Animated border glow для legendary
- 3D transform на hover
- Particle effect для редких карт
- Smooth flip animation для reveal

**Card Structure**:
```
┌─────────────────────────┐
│   [Player Image]        │
│                         │
│   Player Name           │
│   Team Badge            │
│   ─────────────         │
│   Stats Grid            │
│   [Rarity Badge]        │
└─────────────────────────┘
```

**Animations**:
```css
@keyframes cardReveal {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes glowPulse {
  0%, 100% {
    box-shadow: 0 0 20px var(--accent-primary);
  }
  50% {
    box-shadow: 0 0 40px var(--accent-primary);
  }
}
```

#### 4.3 Forms & Inputs

**File**: `src/styles/Forms.css`

**Design Features**:
- Floating labels
- Focus state с accent border
- Error state с shake animation
- Success state с checkmark
- Password strength indicator
- Auto-complete styling

**Input States**:
```css
.input {
  /* Default */
  border: 2px solid var(--border-color);
  
  /* Focus */
  &:focus {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 4px rgba(0, 242, 234, 0.1);
  }
  
  /* Error */
  &.error {
    border-color: var(--accent-secondary);
    animation: shake 0.3s;
  }
  
  /* Success */
  &.success {
    border-color: #2ed573;
  }
}
```

#### 4.4 Buttons

**File**: `src/styles/Buttons.css`

**Button Variants**:

1. **Primary Button**:
```css
.btn-primary {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-tertiary));
  color: white;
  padding: 12px 32px;
  border-radius: var(--radius-md);
  font-weight: 600;
  transition: all var(--transition-fast);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 242, 234, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
}
```

2. **Secondary Button**:
```css
.btn-secondary {
  background: transparent;
  border: 2px solid var(--accent-primary);
  color: var(--accent-primary);
  
  &:hover {
    background: var(--accent-primary);
    color: var(--bg-primary);
  }
}
```

3. **Ghost Button**:
```css
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  
  &:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }
}
```

#### 4.5 Modals

**File**: `src/styles/Modal.css`

**Design Features**:
- Backdrop с blur(10px) и rgba overlay
- Modal с glassmorphism
- Slide-up + fade animation
- Close button с hover effect
- Responsive sizing

**Animation**:
```css
@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(50px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-backdrop {
  backdrop-filter: blur(10px);
  background: rgba(0, 0, 0, 0.7);
  animation: fadeIn 0.3s;
}

.modal-content {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  animation: modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
```

#### 4.6 Profile Page

**File**: `src/styles/ProfilePage.css`

**Layout**:
```
┌─────────────────────────────────────────┐
│  ┌─────────┐  Username                  │
│  │ Avatar  │  Level Badge               │
│  │         │  Stats Bar                 │
│  └─────────┘                            │
├─────────────────────────────────────────┤
│  [Storage] [Marketplace] [Settings]     │
├─────────────────────────────────────────┤
│                                         │
│  Tab Content Area                       │
│                                         │
└─────────────────────────────────────────┘
```

**Design Features**:
- Animated avatar с border gradient
- Level progress bar с gradient fill
- Tab navigation с underline indicator
- Grid layout для карточек
- Infinite scroll для списков

#### 4.7 Settings Panel

**File**: `src/styles/ProfileSettings.css`

**Theme Toggle Design**:
```
┌─────────────────────────────────┐
│  Theme                          │
│  ┌───────────────────────────┐  │
│  │  ☀️ Light    🌙 Dark      │  │
│  │  [────●────]              │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

**Toggle Switch**:
```css
.theme-toggle {
  position: relative;
  width: 60px;
  height: 30px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background var(--transition-base);
  
  &::before {
    content: '';
    position: absolute;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--accent-primary);
    top: 2px;
    left: 2px;
    transition: transform var(--transition-base);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  
  &.active::before {
    transform: translateX(30px);
  }
}
```

#### 4.8 Shop & Marketplace

**File**: `src/styles/ShopPage.css`

**Design Features**:
- Pack cards с 3D hover effect
- Price tags с gradient background
- Purchase button с ripple effect
- Filters sidebar с smooth transitions
- Sort dropdown с custom styling

**Pack Card Hover**:
```css
.pack-card {
  transform-style: preserve-3d;
  transition: transform var(--transition-base);
  
  &:hover {
    transform: rotateY(5deg) rotateX(5deg) scale(1.05);
  }
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, 
      rgba(255,255,255,0.1), 
      rgba(255,255,255,0));
    opacity: 0;
    transition: opacity var(--transition-base);
  }
  
  &:hover::before {
    opacity: 1;
  }
}
```

#### 4.9 Fantasy & Pick'em

**File**: `src/styles/FantasyPage.css`

**Design Features**:
- Drag-and-drop zones с visual feedback
- Team formation grid (5 positions)
- Player slots с empty state
- Points counter с animated numbers
- Match cards с live indicators

**Drag & Drop Styling**:
```css
.drop-zone {
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  
  &.drag-over {
    border-color: var(--accent-primary);
    background: rgba(0, 242, 234, 0.05);
    transform: scale(1.02);
  }
  
  &.filled {
    border-style: solid;
    border-color: var(--accent-primary);
  }
}
```

#### 4.10 Admin Panel

**File**: `src/styles/AdminPanel.css`

**Design Features**:
- Dark theme focused (admin mode)
- Data tables с sorting indicators
- Action buttons с confirmation states
- Stats cards с charts
- Logs viewer с syntax highlighting

**Table Styling**:
```css
.admin-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  
  thead {
    background: var(--bg-tertiary);
    position: sticky;
    top: 0;
    z-index: 10;
  }
  
  th {
    padding: 16px;
    text-align: left;
    font-weight: 600;
    cursor: pointer;
    
    &:hover {
      background: var(--bg-secondary);
    }
  }
  
  tbody tr {
    transition: background var(--transition-fast);
    
    &:nth-child(even) {
      background: var(--bg-secondary);
    }
    
    &:hover {
      background: var(--bg-tertiary);
      transform: scale(1.01);
    }
  }
  
  td {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color);
  }
}
```

## Data Models

### Theme Preference Model

```typescript
interface ThemePreference {
  theme: 'dark' | 'light';
  timestamp: number;
}

// localStorage structure
{
  "cybersport-theme": "dark"
}
```

### CSS Custom Properties Model

```typescript
interface DesignTokens {
  colors: {
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    accent: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    border: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    glow: string;
  };
  typography: {
    fontFamily: string;
    fontSize: Record<string, string>;
  };
  transitions: {
    fast: string;
    base: string;
    slow: string;
  };
}
```

## Error Handling

### Theme Loading Errors

**Scenario**: localStorage недоступен или повреждён

**Handling**:
```javascript
try {
  const savedTheme = localStorage.getItem('cybersport-theme');
  setTheme(savedTheme || 'dark');
} catch (error) {
  console.warn('Failed to load theme preference:', error);
  setTheme('dark'); // fallback to default
}
```

### CSS Variables Not Supported

**Scenario**: Старый браузер без поддержки CSS Variables

**Handling**:
- Fallback цвета в каждом свойстве
- Graceful degradation к тёмной теме
- Предупреждение пользователю о необходимости обновления браузера

```css
.element {
  background-color: #0a0a0f; /* fallback */
  background-color: var(--bg-primary);
}
```

### Animation Performance

**Scenario**: Низкая производительность на слабых устройствах

**Handling**:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Testing Strategy

### Visual Regression Testing

**Approach**: Screenshot comparison для обеих тем

**Test Cases**:
1. Все основные страницы в dark theme
2. Все основные страницы в light theme
3. Переключение темы (transition)
4. Hover states для интерактивных элементов
5. Modal windows в обеих темах
6. Responsive breakpoints (mobile, tablet, desktop)

### Accessibility Testing

**Tools**: axe-core, WAVE

**Test Cases**:
1. Контрастность текста (WCAG AA минимум)
2. Focus indicators видимы
3. Keyboard navigation работает
4. Screen reader compatibility
5. Color blindness simulation

### Performance Testing

**Metrics**:
- First Contentful Paint (FCP) < 1.5s
- Largest Contentful Paint (LCP) < 2.5s
- Cumulative Layout Shift (CLS) < 0.1
- Time to Interactive (TTI) < 3.5s

**Test Cases**:
1. Theme switch performance (< 100ms)
2. Animation frame rate (60fps)
3. CSS bundle size (< 50kb gzipped)
4. No layout shifts при смене темы

### Browser Compatibility Testing

**Target Browsers**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Test Cases**:
1. CSS Variables support
2. Backdrop-filter support
3. CSS Grid/Flexbox
4. Custom scrollbar styling
5. Smooth scrolling

### User Acceptance Testing

**Test Scenarios**:
1. Пользователь переключает тему в настройках
2. Тема сохраняется после перезагрузки
3. Все компоненты корректно отображаются в обеих темах
4. Анимации плавные и не раздражают
5. Интерфейс интуитивно понятен

## Implementation Notes

### File Structure

```
src/
├── styles/
│   ├── tokens.css          # Design tokens
│   ├── global.css          # Global styles
│   ├── themes.css          # Theme definitions
│   ├── animations.css      # Keyframe animations
│   ├── Header.css
│   ├── PlayerCard.css
│   ├── Forms.css
│   ├── Buttons.css
│   ├── Modal.css
│   ├── ProfilePage.css
│   ├── ProfileSettings.css
│   ├── ShopPage.css
│   ├── FantasyPage.css
│   ├── AdminPanel.css
│   └── ... (other components)
├── context/
│   └── ThemeContext.js     # Theme management
└── components/
    └── ... (all components use CSS modules or styled-components)
```

### Import Order

```javascript
// In index.js or App.js
import './styles/tokens.css';      // 1. Design tokens first
import './styles/themes.css';      // 2. Theme definitions
import './styles/global.css';      // 3. Global styles
import './styles/animations.css';  // 4. Animations
// Component-specific styles imported in components
```

### Performance Optimizations

1. **CSS Splitting**: Разделить критические и некритические стили
2. **Lazy Loading**: Загружать admin styles только для админов
3. **CSS Purging**: Удалить неиспользуемые стили в production
4. **Minification**: Минифицировать CSS в production
5. **Caching**: Агрессивное кэширование CSS файлов

### Accessibility Considerations

1. **Focus Management**: Видимые focus indicators
2. **Color Contrast**: Минимум 4.5:1 для текста
3. **Keyboard Navigation**: Все интерактивные элементы доступны с клавиатуры
4. **Screen Readers**: Правильные ARIA labels
5. **Reduced Motion**: Поддержка prefers-reduced-motion

### Browser Support Strategy

1. **Progressive Enhancement**: Базовая функциональность работает везде
2. **Feature Detection**: Проверка поддержки backdrop-filter и т.д.
3. **Polyfills**: Минимальное использование, только для критических фич
4. **Graceful Degradation**: Fallback для старых браузеров

## Design System Documentation

### Color Palette

**Dark Theme**:
- Primary: #0a0a0f (Deep Space Black)
- Secondary: #13131a (Midnight Blue)
- Tertiary: #1a1a24 (Dark Slate)
- Accent Cyan: #00f2ea (Neon Cyan)
- Accent Red: #ff4757 (Vibrant Red)
- Accent Purple: #a855f7 (Electric Purple)

**Light Theme**:
- Primary: #ffffff (Pure White)
- Secondary: #f5f5f7 (Light Gray)
- Tertiary: #e8e8ed (Soft Gray)
- Accent Blue: #0088ff (Bright Blue)
- Accent Red: #ff3b4f (Coral Red)
- Accent Purple: #9333ea (Royal Purple)

### Typography Scale

- 3XL: 48px (Hero headings)
- 2XL: 32px (Page titles)
- XL: 24px (Section headings)
- LG: 18px (Subheadings)
- Base: 16px (Body text)
- SM: 14px (Small text)
- XS: 12px (Captions)

### Spacing Scale

- XS: 4px
- SM: 8px
- MD: 16px
- LG: 24px
- XL: 32px
- 2XL: 48px

### Animation Timing

- Fast: 150ms (Micro-interactions)
- Base: 300ms (Standard transitions)
- Slow: 500ms (Complex animations)

### Easing Functions

- ease: Standard easing
- ease-in-out: Smooth start and end
- cubic-bezier(0.16, 1, 0.3, 1): Smooth spring effect
