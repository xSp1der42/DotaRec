# Error Handling Quick Reference

## Quick Start

### 1. Import What You Need
```javascript
import api, { retryRequest } from '../services/api';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { validateBetAmount, sanitizeNumericInput } from '../utils/validation';
import ErrorDisplay, { LoadingState, EmptyState } from '../components/shared/ErrorBoundary';
```

### 2. Setup in Component
```javascript
const MyComponent = () => {
  const { handleError, handleSuccess } = useErrorHandler();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
```

### 3. Fetch Data with Retry
```javascript
const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const { data } = await retryRequest(
      () => api.get('/api/endpoint'),
      2,  // max retries
      1000 // delay in ms
    );
    
    setData(data);
  } catch (err) {
    setError(err);
    handleError(err, 'Failed to load data');
  } finally {
    setLoading(false);
  }
};
```

### 4. Render States
```javascript
if (loading) return <LoadingState message="Loading..." />;
if (error) return <ErrorDisplay error={error} onRetry={fetchData} />;
if (data.length === 0) return <EmptyState title="No data" />;

return <div>{/* Your content */}</div>;
```

### 5. Validate Form Input
```javascript
const handleInputChange = (e) => {
  const value = sanitizeNumericInput(e.target.value);
  setValue(value);
  
  const validation = validateBetAmount(value, userBalance);
  setError(validation.error || '');
};
```

### 6. Submit with Validation
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validate
  const validation = validateBetAmount(amount, userBalance);
  if (!validation.isValid) {
    handleError({ errorMessage: validation.error });
    return;
  }
  
  // Submit
  try {
    await api.post('/api/endpoint', { amount });
    handleSuccess('Success!');
  } catch (error) {
    handleError(error);
  }
};
```

## Common Patterns

### Pattern 1: Simple GET Request
```javascript
const { data } = await retryRequest(
  () => api.get('/api/matches'),
  2,
  1000
);
```

### Pattern 2: POST with Limited Retry
```javascript
const { data } = await retryRequest(
  () => api.post('/api/bets', betData),
  1,  // Only 1 retry for POST
  1000
);
```

### Pattern 3: Graceful Degradation
```javascript
try {
  const odds = await fetchOdds();
  setOdds(odds);
} catch (error) {
  setOdds(1.5); // Use default
}
```

### Pattern 4: File Upload Validation
```javascript
const handleFileUpload = (file) => {
  const validation = validateFileUpload(file);
  if (!validation.isValid) {
    showToast(validation.error, 'error');
    return;
  }
  // Proceed with upload
};
```

### Pattern 5: Form Validation
```javascript
const validation = validateMatchData({
  game: 'dota2',
  team1: { name: 'Team A' },
  team2: { name: 'Team B' },
  startTime: '2024-12-01T10:00:00Z'
});

if (!validation.isValid) {
  setErrors(validation.errors);
  return;
}
```

## Validation Functions

### validateBetAmount(amount, userBalance, min=10, max=10000)
```javascript
const result = validateBetAmount(500, 1000);
// { isValid: true, error: null }

const result = validateBetAmount(5, 1000);
// { isValid: false, error: 'Минимальная ставка: 10 монет' }
```

### validatePredictionSelection(selection, availableOptions)
```javascript
const result = validatePredictionSelection('Hero1', ['Hero1', 'Hero2']);
// { isValid: true, error: null }
```

### validateFileUpload(file, maxSize=2MB, allowedTypes)
```javascript
const result = validateFileUpload(file);
// { isValid: true, error: null }
// or
// { isValid: false, error: 'Размер файла не должен превышать 2.0 МБ' }
```

### sanitizeNumericInput(value)
```javascript
sanitizeNumericInput('123abc456');
// Returns: '123456'
```

## Error Handler Hook

```javascript
const { 
  handleError,    // Show error toast
  handleSuccess,  // Show success toast
  handleWarning,  // Show warning toast
  handleInfo      // Show info toast
} = useErrorHandler();

// Usage
handleError(error, 'Optional fallback message');
handleSuccess('Operation completed!');
handleWarning('Be careful!');
handleInfo('FYI: Something happened');
```

## Components

### ErrorDisplay
```javascript
<ErrorDisplay 
  error={error}           // Required: error object
  onRetry={handleRetry}   // Optional: retry function
  showRetry={true}        // Optional: show retry button
/>
```

### LoadingState
```javascript
<LoadingState message="Loading data..." />
```

### EmptyState
```javascript
<EmptyState
  icon="📭"                              // Optional: emoji icon
  title="No data found"                  // Required: title
  description="Try adding some data"     // Optional: description
  action={<button>Add Data</button>}     // Optional: action button
/>
```

## Error Types

| Type | Property | Description |
|------|----------|-------------|
| Network | `isNetworkError` | No connection to server |
| Timeout | `isTimeout` | Request took too long |
| Server | `isServerError` | 5xx status code |
| Client | `isClientError` | 4xx status code |

## Error Codes

| Code | Message |
|------|---------|
| `INSUFFICIENT_FUNDS` | Недостаточно средств |
| `BETTING_CLOSED` | Прием ставок закрыт |
| `INVALID_BET_AMOUNT` | Неверная сумма ставки |
| `DUPLICATE_BET` | Уже сделана ставка |
| `MATCH_NOT_FOUND` | Матч не найден |
| `UNAUTHORIZED` | Необходима авторизация |
| `FORBIDDEN` | Недостаточно прав |

## Best Practices

✅ **DO:**
- Use `retryRequest` for GET requests
- Validate on client before sending
- Show loading states
- Provide retry for network errors
- Use graceful degradation
- Show user-friendly messages

❌ **DON'T:**
- Retry POST/PUT/DELETE more than once
- Show technical error messages to users
- Block UI without loading indicator
- Ignore validation errors
- Crash on API failures

## Checklist

- [ ] Import error handler hook
- [ ] Setup loading/error states
- [ ] Use retryRequest for API calls
- [ ] Validate form inputs
- [ ] Show loading state
- [ ] Show error state with retry
- [ ] Show empty state
- [ ] Handle success with toast
- [ ] Handle errors with toast
- [ ] Test with network disconnected
- [ ] Test with invalid inputs
- [ ] Test retry functionality
