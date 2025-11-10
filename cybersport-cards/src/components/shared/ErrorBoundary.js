import { useState } from 'react';
import '../../styles/ErrorBoundary.css';

/**
 * Error display component with retry functionality
 */
const ErrorDisplay = ({ error, onRetry, showRetry = true }) => {
  const getErrorIcon = () => {
    if (error.isNetworkError) return '🌐';
    if (error.isTimeout) return '⏱️';
    if (error.isServerError) return '🔧';
    return '⚠️';
  };

  const getErrorTitle = () => {
    if (error.isNetworkError) return 'Ошибка сети';
    if (error.isTimeout) return 'Превышено время ожидания';
    if (error.isServerError) return 'Ошибка сервера';
    return 'Произошла ошибка';
  };

  const getErrorDescription = () => {
    if (error.isNetworkError) {
      return 'Не удалось подключиться к серверу. Проверьте подключение к интернету.';
    }
    if (error.isTimeout) {
      return 'Сервер не ответил вовремя. Попробуйте еще раз.';
    }
    if (error.isServerError) {
      return 'На сервере произошла ошибка. Мы уже работаем над исправлением.';
    }
    return error.errorMessage || 'Что-то пошло не так. Попробуйте еще раз.';
  };

  return (
    <div className="error-display">
      <div className="error-icon">{getErrorIcon()}</div>
      <h3 className="error-title">{getErrorTitle()}</h3>
      <p className="error-description">{getErrorDescription()}</p>
      {showRetry && onRetry && (
        <button className="retry-button" onClick={onRetry}>
          🔄 Попробовать снова
        </button>
      )}
    </div>
  );
};

/**
 * Loading state component
 */
export const LoadingState = ({ message = 'Загрузка...' }) => {
  return (
    <div className="loading-state">
      <div className="loading-spinner"></div>
      <p className="loading-message">{message}</p>
    </div>
  );
};

/**
 * Empty state component
 */
export const EmptyState = ({ 
  icon = '📭', 
  title = 'Ничего не найдено', 
  description = null,
  action = null 
}) => {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3 className="empty-title">{title}</h3>
      {description && <p className="empty-description">{description}</p>}
      {action && action}
    </div>
  );
};

/**
 * Hook for managing async operations with error handling
 */
export const useAsyncOperation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = async (asyncFn, onSuccess = null, onError = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await asyncFn();
      setData(result);
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      setError(err);
      if (onError) onError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const retry = async (asyncFn, onSuccess = null, onError = null) => {
    return execute(asyncFn, onSuccess, onError);
  };

  const reset = () => {
    setLoading(false);
    setError(null);
    setData(null);
  };

  return {
    loading,
    error,
    data,
    execute,
    retry,
    reset,
  };
};

export default ErrorDisplay;
