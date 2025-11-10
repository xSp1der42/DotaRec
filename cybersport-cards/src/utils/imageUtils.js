// Утилита для работы с изображениями

/**
 * Получает полный URL для изображения
 * @param {string} imageUrl - URL изображения (может быть относительным или абсолютным)
 * @returns {string} - Полный URL изображения
 */
export const getFullImageUrl = (imageUrl) => {
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
  
  if (!imageUrl || imageUrl === '/uploads/default-avatar.png') {
    return `${baseUrl}/uploads/default-avatar.webp`;
  }
  
  // Если URL уже полный (начинается с http:// или https://), возвращаем как есть
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Если URL относительный, добавляем базовый URL API
  return `${baseUrl}${imageUrl}`;
};
