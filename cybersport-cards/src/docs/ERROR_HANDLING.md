# Error Handling and Validation System

This document describes the centralized error handling and validation system implemented for the Pick Predictor feature.

## Overview

The error handling system provides:
- Centralized API error handling with interceptors
- Automatic retry for network errors
- Client-side form validation
- User-friendly error messages with toast notifications
- Graceful degradation when API is unavailable
- Retry functionality for failed requests

## Components

### 1. API Service (`src/services/api.js`)

Enhanced Axios instance with:
- Request interceptor for authentication
- Response interceptor for error enhancement
- Timeout configuration (30 seconds)
- Helper functions for health checks and retries

**Key Features:**
```javascript
// Enhanced error object
{
  isNetworkError: boolean,
  isTimeout: boolean,
  isServerError: boolean,
  isClientError: boolean,
  statusCode: number,
  errorCode: string,
  errorMessage: string
}

// Retry failed requests
retryRequest(requestFn, maxRetries = 3, delay = 1000)

// Check API health
checkApiHealth()
```

### 2. Validation Utilities (`src/utils/validation.js`)

Provides validation functions for:
- Bet amounts (min: 10, max: 10,000)
- Prediction selections
- Match data (admin panel)
- File uploads (team logos)
- Numeric input sanitization
- Error message formatting

**Example Usage:**
```javascript
import { validateBetAmount, validateFileUpload } from '../utils/validation';

// Validate bet amount
const validation = validateBetAmount(amount, userBalance);
if (!validation.isValid) {
  showError(validation.error);
}

// Validate file upload
const fileValidation = validateFileUpload(file);
if (!fileValidation.isValid) {
  showError(fileValidation.error);
}
```

### 3. Error Handler Hook (`src/hooks/useErrorHandler.js`)

Custom React hook for centralized error handling:

```javascript
const { handleError, handleSuccess, handleWarning, handleInfo } = useErrorHandler();

// Handle API errors
try {
  await api.post('/api/endpoint', data);
  handleSuccess('Operation successful');
} catch (error) {
  handleError(error, 'Optional fallback message');
}
```

### 4. Error Display Components (`src/components/shared/ErrorBoundary.js`)

Reusable components for different states:

**ErrorDisplay:**
```javascript
<ErrorDisplay 
  error={error} 
  onRetry={handleRetry} 
  showRetry={true} 
/>
```

**LoadingState:**
```javascript
<LoadingState message="Loading data..." />
```

**EmptyState:**
```javascript
<EmptyState
  icon="📭"
  title="No data found"
  description="Optional description"
  action={<button>Action</button>}
/>
```

**useAsyncOperation Hook:**
```javascript
const { loading, error, data, execute, retry, reset } = useAsyncOperation();

// Execute async operation
await execute(
  () => api.get('/endpoint'),
  (result) => console.log('Success:', result),
  (error) => console.error('Error:', error)
);
```

## Implementation Examples

### Page with Error Handling

```javascript
import { useState, useEffect } from 'react';
import api, { retryRequest } from '../services/api';
import { useErrorHandler } from '../hooks/useErrorHandler';
import ErrorDisplay, { LoadingState, EmptyState } from '../components/shared/ErrorBoundary';

const MyPage = () => {
  const { handleError } = useErrorHandler();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await retryRequest(
        () => api.get('/api/endpoint'),
        2, // Max 2 retries
        1000 // 1 second delay
      );
      
      setData(data);
    } catch (err) {
      setError(err);
      handleError(err, 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <LoadingState message="Loading..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={fetchData} />;
  }

  if (data.length === 0) {
    return <EmptyState title="No data" />;
  }

  return <div>{/* Render data */}</div>;
};
```

### Form with Validation

```javascript
import { useState } from 'react';
import { validateBetAmount, sanitizeNumericInput } from '../utils/validation';
import { useErrorHandler } from '../hooks/useErrorHandler';

const MyForm = () => {
  const { handleError, handleSuccess } = useErrorHandler();
  const [amount, setAmount] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleAmountChange = (e) => {
    const value = sanitizeNumericInput(e.target.value);
    setAmount(value);
    
    const validation = validateBetAmount(value, userBalance);
    setValidationError(validation.error || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateBetAmount(amount, userBalance);
    if (!validation.isValid) {
      handleError({ errorMessage: validation.error });
      return;
    }

    try {
      await api.post('/api/endpoint', { amount });
      handleSuccess('Success!');
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={amount}
        onChange={handleAmountChange}
      />
      {validationError && <div className="error">{validationError}</div>}
      <button type="submit" disabled={!!validationError}>
        Submit
      </button>
    </form>
  );
};
```

## Error Types and Messages

### Network Errors
- **isNetworkError**: No response from server
- **Message**: "Ошибка сети. Проверьте подключение к интернету"
- **Action**: Show retry button

### Timeout Errors
- **isTimeout**: Request took too long
- **Message**: "Превышено время ожидания. Попробуйте еще раз"
- **Action**: Show retry button

### Server Errors (5xx)
- **isServerError**: Server-side error
- **Message**: "Ошибка сервера. Попробуйте позже"
- **Action**: Show retry button

### Client Errors (4xx)
- **isClientError**: Invalid request
- **Message**: Specific error from server
- **Action**: No retry (fix input)

### Specific Error Codes
- `INSUFFICIENT_FUNDS`: Not enough balance
- `BETTING_CLOSED`: Betting period ended
- `INVALID_BET_AMOUNT`: Amount out of range
- `DUPLICATE_BET`: Already placed bet
- `MATCH_NOT_FOUND`: Match doesn't exist
- `UNAUTHORIZED`: Login required
- `FORBIDDEN`: Insufficient permissions

## Best Practices

1. **Always use retryRequest for GET requests**
   ```javascript
   const { data } = await retryRequest(() => api.get('/endpoint'), 2, 1000);
   ```

2. **Limit retries for POST/PUT/DELETE requests**
   ```javascript
   const { data } = await retryRequest(() => api.post('/endpoint', data), 1, 1000);
   ```

3. **Validate on client before sending**
   ```javascript
   const validation = validateBetAmount(amount, balance);
   if (!validation.isValid) {
     showError(validation.error);
     return;
   }
   ```

4. **Use error handler hook for consistency**
   ```javascript
   const { handleError, handleSuccess } = useErrorHandler();
   ```

5. **Provide fallback messages**
   ```javascript
   handleError(error, 'Custom fallback message');
   ```

6. **Show appropriate UI states**
   - Loading: `<LoadingState />`
   - Error: `<ErrorDisplay />`
   - Empty: `<EmptyState />`

7. **Graceful degradation**
   ```javascript
   try {
     const odds = await fetchOdds();
     setOdds(odds);
   } catch (error) {
     // Use default value instead of failing
     setOdds(1.5);
   }
   ```

## Testing

### Manual Testing Checklist
- [ ] Network error (disconnect internet)
- [ ] Timeout error (slow network)
- [ ] Server error (500 response)
- [ ] Client error (400 response)
- [ ] Validation errors (invalid input)
- [ ] File upload errors (wrong format/size)
- [ ] Retry functionality
- [ ] Toast notifications
- [ ] Empty states
- [ ] Loading states

### Error Scenarios to Test
1. Submit form with invalid data
2. Upload file with wrong format
3. Upload file exceeding size limit
4. Make request with network disconnected
5. Make request to non-existent endpoint
6. Submit duplicate bet
7. Submit bet with insufficient funds
8. Submit bet after betting closed

## Future Improvements

1. **Offline Support**
   - Queue requests when offline
   - Sync when connection restored

2. **Error Logging**
   - Send errors to logging service
   - Track error patterns

3. **User Feedback**
   - Allow users to report errors
   - Provide error IDs for support

4. **Advanced Retry Logic**
   - Exponential backoff
   - Circuit breaker pattern

5. **Error Recovery**
   - Auto-save form data
   - Resume interrupted operations
