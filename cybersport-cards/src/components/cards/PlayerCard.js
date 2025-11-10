import React from 'react';
import '../../styles/PlayerCard.css'; // Подключаем полностью переписанные стили

/**
 * Генерирует полный URL для изображения игрока.
 * @param {string} imagePath - Путь к файлу, полученный от бэкенда (e.g., /uploads/image.png)
 * @returns {string} - Полный, доступный URL изображения.
 */
const getFullImageUrl = (imagePath) => {
  if (!imagePath) {
    // Возвращаем заглушку, если изображение отсутствует
    return 'https://via.placeholder.com/280x280/212431/FFF?text=No+Image';
  }
  // Если это уже полный URL (например, из другого источника или blob для предпросмотра)
  if (imagePath.startsWith('http') || imagePath.startsWith('blob:')) {
    return imagePath;
  }
  // Добавляем базовый URL нашего API из переменных окружения
  return `${process.env.REACT_APP_API_URL}${imagePath}`;
};

/**
 * Форматирует название статы из camelCase в Title Case (например, 'heroPool' -> 'Hero Pool').
 * @param {string} camelCaseStr - Строка в формате camelCase.
 * @returns {string} - Отформатированная строка.
 */
const formatStatName = (camelCaseStr) => {
    if (!camelCaseStr) return '';
    const result = camelCaseStr.replace(/([A-Z])/g, ' $1');
    return result.charAt(0).toUpperCase() + result.slice(1);
};

const PlayerCard = ({ player, onCardClick, isClickable = true }) => {
  const {
    ovr,
    image_url,
    nickname,
    fullName,
    team,
    stats,
    rarity,
    position,
  } = player;

  const handleCardClick = () => {
    if (isClickable && onCardClick) {
      onCardClick(player);
    }
  };

  // Преобразуем объект статов в массив для удобного рендеринга
  const statItems = stats ? Object.entries(stats) : [];

  return (
    <div
      className={`card-final ${rarity || 'common'} ${isClickable ? 'clickable' : ''}`}
      onClick={handleCardClick}
    >
        {/* Фото игрока на заднем фоне */}
        <img src={getFullImageUrl(image_url)} alt={nickname} className="card-final-photo" />

        {/* Контент поверх фото */}
        <div className="card-final-content">
            <div className="card-final-header">
                <div className="card-final-ovr">{ovr}</div>
                <div className="card-final-pos">{position}</div>
            </div>

            <div className="card-final-info">
                <h2 className="card-final-nickname">{nickname}</h2>
                <p className="card-final-details">{fullName} - {team}</p>
            </div>

            <div className="card-final-stats">
                {statItems.map(([key, value]) => (
                    <div className="final-stat-row" key={key}>
                        <span className="final-stat-key">{formatStatName(key)}</span>
                        <span className="final-stat-val">{value}</span>
                    </div>
                ))}
            </div>
            
            {rarity && (
                <div className="card-final-footer">
                    <div className="card-final-rarity">{rarity.toUpperCase()}</div>
                </div>
            )}
        </div>
    </div>
  );
};

export default PlayerCard;