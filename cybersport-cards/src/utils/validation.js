// Validation utilities for Pick Predictor forms

/**
 * Validate bet amount
 * @param {number|string} amount - The bet amount to validate
 * @param {number} userBalance - User's current balance
 * @param {number} min - Minimum bet amount (default: 10)
 * @param {number} max - Maximum bet amount (default: 10000)
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
export const validateBetAmount = (amount, userBalance, min = 10, max = 10000) => {
  // Convert to number
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Check if empty
  if (amount === '' || amount === null || amount === undefined) {
    return { isValid: false, error: null }; // Empty is not an error, just not valid
  }
  
  // Check if valid number
  if (isNaN(numAmount)) {
    return { isValid: false, error: 'Введите корректное число' };
  }
  
  // Check minimum
  if (numAmount < min) {
    return { isValid: false, error: `Минимальная ставка: ${min} монет` };
  }
  
  // Check maximum
  if (numAmount > max) {
    return { isValid: false, error: `Максимальная ставка: ${max.toLocaleString('ru-RU')} монет` };
  }
  
  // Check user balance
  if (userBalance !== undefined && numAmount > userBalance) {
    return { 
      isValid: false, 
      error: `Недостаточно средств. Ваш баланс: ${userBalance.toLocaleString('ru-RU')} монет` 
    };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validate prediction selection
 * @param {string} selection - The selected option
 * @param {Array} availableOptions - Array of available options
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
export const validatePredictionSelection = (selection, availableOptions = []) => {
  if (!selection || selection.trim() === '') {
    return { isValid: false, error: 'Выберите вариант предсказания' };
  }
  
  if (availableOptions.length > 0 && !availableOptions.includes(selection)) {
    return { isValid: false, error: 'Выбран недопустимый вариант' };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validate match data for admin panel
 * @param {Object} matchData - Match data to validate
 * @returns {Object} - { isValid: boolean, errors: Object }
 */
export const validateMatchData = (matchData) => {
  const errors = {};
  
  if (!matchData.game || !['dota2', 'cs2'].includes(matchData.game)) {
    errors.game = 'Выберите игру (Dota 2 или CS2)';
  }
  
  if (!matchData.team1?.name || matchData.team1.name.trim() === '') {
    errors.team1Name = 'Введите название первой команды';
  }
  
  if (!matchData.team2?.name || matchData.team2.name.trim() === '') {
    errors.team2Name = 'Введите название второй команды';
  }
  
  if (!matchData.startTime) {
    errors.startTime = 'Укажите время начала матча';
  } else {
    const startTime = new Date(matchData.startTime);
    const now = new Date();
    if (startTime <= now) {
      errors.startTime = 'Время начала должно быть в будущем';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate file upload (for team logos)
 * @param {File} file - File to validate
 * @param {number} maxSize - Maximum file size in bytes (default: 2MB)
 * @param {Array} allowedTypes - Allowed MIME types
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
export const validateFileUpload = (
  file, 
  maxSize = 2 * 1024 * 1024, // 2MB
  allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
) => {
  if (!file) {
    return { isValid: false, error: 'Файл не выбран' };
  }
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    const allowedExtensions = allowedTypes
      .map(type => type.split('/')[1].toUpperCase())
      .join(', ');
    return { 
      isValid: false, 
      error: `Допустимые форматы: ${allowedExtensions}` 
    };
  }
  
  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return { 
      isValid: false, 
      error: `Размер файла не должен превышать ${maxSizeMB} МБ` 
    };
  }
  
  return { isValid: true, error: null };
};

/**
 * Sanitize numeric input (allow only digits)
 * @param {string} value - Input value
 * @returns {string} - Sanitized value
 */
export const sanitizeNumericInput = (value) => {
  return value.replace(/[^\d]/g, '');
};

/**
 * Format error message for display
 * @param {Object} error - Error object from API
 * @returns {string} - Formatted error message
 */
export const formatErrorMessage = (error) => {
  // Network errors
  if (error.isNetworkError) {
    return 'Ошибка сети. Проверьте подключение к интернету';
  }
  
  // Timeout errors
  if (error.isTimeout) {
    return 'Превышено время ожидания. Попробуйте еще раз';
  }
  
  // Server errors
  if (error.isServerError) {
    return 'Ошибка сервера. Попробуйте позже';
  }
  
  // Specific error codes
  const errorCode = error.errorCode;
  const errorMessage = error.errorMessage;
  
  switch (errorCode) {
    case 'INSUFFICIENT_FUNDS':
      return errorMessage || 'Недостаточно средств';
    case 'BETTING_CLOSED':
      return 'Прием ставок на этот матч закрыт';
    case 'INVALID_BET_AMOUNT':
      return 'Неверная сумма ставки. Допустимый диапазон: 10-10,000 монет';
    case 'DUPLICATE_BET':
      return 'Вы уже сделали ставку на это предсказание';
    case 'MATCH_NOT_FOUND':
      return 'Матч не найден';
    case 'UNAUTHORIZED':
      return 'Необходима авторизация';
    case 'FORBIDDEN':
      return 'Недостаточно прав доступа';
    default:
      return errorMessage || 'Произошла ошибка. Попробуйте еще раз';
  }
};
