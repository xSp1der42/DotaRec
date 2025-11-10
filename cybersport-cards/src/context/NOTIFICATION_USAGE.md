# Notification System Usage Guide

## Overview

The notification system provides two main features:
1. **Bell Notifications**: Persistent notifications stored in the database that users can view in the notification bell dropdown
2. **Toast Notifications**: Temporary pop-up messages for immediate feedback

## Setup

The notification system is already integrated into the app. The `NotificationProvider` wraps the entire application in `App.js`, and the `NotificationBell` component is displayed in the header for authenticated users.

## Using Toast Notifications

### Import the Hook

```javascript
import { useNotifications } from '../context/NotificationContext';

const MyComponent = () => {
  const { showToast } = useNotifications();
  
  // Your component code
};
```

### Show a Toast

```javascript
// Basic usage
showToast('Operation successful!', 'success');

// With custom duration (default is 5000ms)
showToast('This will stay for 10 seconds', 'info', 10000);
```

### Toast Types

- `'success'` - Green toast for successful operations
- `'error'` - Red toast for errors
- `'warning'` - Orange toast for warnings
- `'info'` - Blue toast for informational messages

### Examples

```javascript
// Success message
showToast('Ставка принята!', 'success');

// Error message
showToast('Недостаточно средств', 'error');

// Warning message
showToast('Прием ставок закроется через 5 минут', 'warning');

// Info message
showToast('Обновление статистики...', 'info', 3000);
```

## Using Bell Notifications

### Access Notification Data

```javascript
import { useNotifications } from '../context/NotificationContext';

const MyComponent = () => {
  const { 
    notifications,      // Array of all notifications
    unreadCount,        // Number of unread notifications
    markAsRead,         // Function to mark a notification as read
    markAllAsRead,      // Function to mark all as read
    fetchNotifications  // Function to manually refresh notifications
  } = useNotifications();
  
  // Your component code
};
```

### Mark Notification as Read

```javascript
const handleNotificationClick = (notificationId) => {
  markAsRead(notificationId);
};
```

### Mark All as Read

```javascript
const handleMarkAllRead = () => {
  markAllAsRead();
};
```

## Backend Integration

Bell notifications are created by the backend through the NotificationService. The frontend automatically:
- Fetches notifications every 30 seconds
- Updates the unread count
- Displays new notifications in the bell dropdown

## Component Integration Examples

### In a Form Component

```javascript
import { useNotifications } from '../../context/NotificationContext';

const MyForm = () => {
  const { showToast } = useNotifications();
  
  const handleSubmit = async (data) => {
    try {
      await api.post('/api/endpoint', data);
      showToast('Form submitted successfully!', 'success');
    } catch (error) {
      showToast(error.message || 'Submission failed', 'error');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
};
```

### In an Admin Panel

```javascript
import { useNotifications } from '../../context/NotificationContext';

const AdminPanel = () => {
  const { showToast } = useNotifications();
  
  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/items/${id}`);
      showToast('Item deleted successfully', 'success');
    } catch (error) {
      showToast('Failed to delete item', 'error');
    }
  };
  
  return (
    <div>
      {/* admin panel content */}
    </div>
  );
};
```

## Styling

Toast notifications are styled in `src/styles/Toast.css` and automatically positioned in the top-right corner of the screen. They:
- Slide in from the right
- Auto-dismiss after the specified duration
- Can be manually dismissed by clicking the X button
- Stack vertically if multiple toasts are shown

## Best Practices

1. **Use appropriate toast types**: Match the toast type to the message severity
2. **Keep messages concise**: Toast messages should be short and clear
3. **Use longer durations for important messages**: Default is 5 seconds, but use 7-10 seconds for critical information
4. **Don't overuse toasts**: Only show toasts for actions that need immediate user feedback
5. **Combine with bell notifications**: Use bell notifications for persistent information that users might want to review later

## Requirements Covered

This implementation satisfies the following requirements from the spec:

- **9.1**: Users receive notifications when matches are starting (via bell notifications)
- **9.2**: Users receive notifications about prediction results (via bell notifications)
- **9.3**: Notifications display reward amounts for winning predictions
- **9.4**: Notifications are displayed in the application interface (bell dropdown + toasts)

The notification system is fully integrated with the existing authentication system and automatically manages notification state across the application.
