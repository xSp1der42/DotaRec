# Notifications API Documentation

## Overview
API endpoints for managing user notifications in the Pick Predictor system.

## Endpoints

### GET /api/predictor/notifications
Get user notifications with pagination and filtering.

**Authentication:** Required (JWT token)

**Query Parameters:**
- `unread` (optional): Filter for unread notifications. Set to `'true'` to get only unread notifications
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of notifications per page (default: 50)

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "_id": "notification_id",
      "userId": "user_id",
      "type": "match_starting" | "prediction_result",
      "title": "Notification title",
      "message": "Notification message",
      "data": {
        "matchId": "match_id",
        "betId": "bet_id",
        "reward": 1000
      },
      "read": false,
      "createdAt": "2025-11-11T10:00:00.000Z",
      "expiresAt": "2025-12-11T10:00:00.000Z"
    }
  ],
  "unreadCount": 5,
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 50,
    "pages": 1
  }
}
```

**Example Usage:**
```javascript
// Get all notifications
GET /api/predictor/notifications

// Get only unread notifications
GET /api/predictor/notifications?unread=true

// Get page 2 with 20 notifications per page
GET /api/predictor/notifications?page=2&limit=20
```

---

### PUT /api/predictor/notifications/:id
Mark a notification as read.

**Authentication:** Required (JWT token)

**URL Parameters:**
- `id`: Notification ID

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "notification": {
    "_id": "notification_id",
    "userId": "user_id",
    "type": "prediction_result",
    "title": "Результаты предсказания",
    "message": "Вы выиграли 1500 монет!",
    "data": {
      "matchId": "match_id",
        "betId": "bet_id",
        "reward": 1500
    },
    "read": true,
    "createdAt": "2025-11-11T10:00:00.000Z",
    "expiresAt": "2025-12-11T10:00:00.000Z"
  }
}
```

**Error Responses:**

404 - Notification not found:
```json
{
  "success": false,
  "error": {
    "code": "NOTIFICATION_NOT_FOUND",
    "message": "Notification not found"
  }
}
```

403 - Forbidden (notification belongs to another user):
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to modify this notification"
  }
}
```

---

## Notification Types

### match_starting
Sent 10 minutes before a match starts if the user has active predictions.

**Data fields:**
- `matchId`: ID of the match
- `betId`: ID of the user's bet
- `reward`: 0 (no reward yet)

### prediction_result
Sent when draft phase is completed and prediction results are processed.

**Data fields:**
- `matchId`: ID of the match
- `betId`: ID of the user's bet
- `reward`: Amount won (if prediction was correct)

---

## Automatic Cleanup

Notifications are automatically deleted after 30 days using MongoDB TTL index on the `expiresAt` field.

---

## Testing

Run the test script to verify notification functionality:

```bash
node test-notifications.js
```

This will:
1. Create a test notification
2. Retrieve all notifications
3. Filter unread notifications
4. Test pagination
5. Mark notification as read
6. Clean up test data
