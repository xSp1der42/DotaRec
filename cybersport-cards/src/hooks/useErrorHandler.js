import { useCallback } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { formatErrorMessage } from '../utils/validation';

/**
 * Custom hook for centralized error handling
 * @returns {Object} - Error handling utilities
 */
export const useErrorHandler = () => {
  const { showToast } = useNotifications();

  /**
   * Handle API errors with toast notifications
   * @param {Object} error - Error object from API
   * @param {string} fallbackMessage - Optional fallback message
   */
  const handleError = useCallback((error, fallbackMessage = null) => {
    const message = formatErrorMessage(error);
    showToast(fallbackMessage || message, 'error');
    
    // Log error for debugging
    console.error('API Error:', {
      message,
      statusCode: error.statusCode,
      errorCode: error.errorCode,
      isNetworkError: error.isNetworkError,
      isTimeout: error.isTimeout,
      originalError: error
    });
  }, [showToast]);

  /**
   * Handle success with toast notification
   * @param {string} message - Success message
   */
  const handleSuccess = useCallback((message) => {
    showToast(message, 'success');
  }, [showToast]);

  /**
   * Handle warning with toast notification
   * @param {string} message - Warning message
   */
  const handleWarning = useCallback((message) => {
    showToast(message, 'warning');
  }, [showToast]);

  /**
   * Handle info with toast notification
   * @param {string} message - Info message
   */
  const handleInfo = useCallback((message) => {
    showToast(message, 'info');
  }, [showToast]);

  return {
    handleError,
    handleSuccess,
    handleWarning,
    handleInfo,
  };
};
