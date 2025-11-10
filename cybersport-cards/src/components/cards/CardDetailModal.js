import React, { useState } from 'react';
import '../../styles/CardDetailModal.css';

/**
 * Генерирует полный URL для изображения игрока.
 */
const getFullImageUrl = (imagePath) => {
  if (!imagePath) {
    return 'https://via.placeholder.com/280x280/212431/FFF?text=No+Image';
  }
  if (imagePath.startsWith('http') || imagePath.startsWith('blob:')) {
    return imagePath;
  }
  return `${process.env.REACT_APP_API_URL}${imagePath}`;
};

/**
 * Форматирует название статы из camelCase в Title Case.
 */
const formatStatName = (camelCaseStr) => {
    if (!camelCaseStr) return '';
    const result = camelCaseStr.replace(/([A-Z])/g, ' $1');
    return result.charAt(0).toUpperCase() + result.slice(1);
};

/**
 * CardDetailModal - модальное окно для детального просмотра карточки
 * @param {Object} card - Объект карточки игрока
 * @param {Function} onClose - Функция закрытия модального окна
 * @param {Function} onQuickSell - Функция быстрой продажи карточки
 * @param {Function} onListOnMarketplace - Функция выставления на торговую площадку
 * @param {string} source - Источник открытия ('collection' или 'storage')
 */
const CardDetailModal = ({ 
  card, 
  onClose, 
  onQuickSell, 
  onListOnMarketplace, 
  source = 'collection' 
}) => {
  const [showPriceInput, setShowPriceInput] = useState(false);
  const [price, setPrice] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!card) return null;

  const {
    ovr,
    image_url,
    nickname,
    fullName,
    team,
    stats,
    rarity,
    position,
  } = card;

  const statItems = stats ? Object.entries(stats) : [];

  const handleQuickSell = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await onQuickSell(card._id || card.id);
      onClose();
    } catch (error) {
      console.error('Ошибка быстрой продажи:', error);
      alert(error.response?.data?.message || 'Не удалось продать карточку');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleListOnMarketplace = async () => {
    if (isProcessing) return;
    
    const priceValue = parseInt(price);
    if (!priceValue || priceValue < 1) {
      alert('Введите цену (минимум 1 коин)');
      return;
    }

    setIsProcessing(true);
    try {
      await onListOnMarketplace(card._id || card.id, priceValue);
      onClose();
    } catch (error) {
      console.error('Ошибка выставления на ТП:', error);
      alert(error.response?.data?.message || 'Не удалось выставить карточку');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target.className === 'card-detail-modal-backdrop') {
      onClose();
    }
  };

  return (
    <div className="card-detail-modal-backdrop" onClick={handleBackdropClick}>
      <div className="card-detail-modal">
        <button className="card-detail-modal-close" onClick={onClose}>×</button>
        
        {/* Показываем статистику только для коллекции */}
        {source === 'collection' && (
          <div className="card-detail-content">
            <div className="card-detail-image-section">
              <img 
                src={getFullImageUrl(image_url)} 
                alt={nickname} 
                className="card-detail-image" 
              />
              <div className={`card-detail-rarity ${rarity || 'common'}`}>
                {(rarity || 'common').toUpperCase()}
              </div>
            </div>

            <div className="card-detail-info-section">
              <div className="card-detail-header">
                <div className="card-detail-ovr">{ovr}</div>
                <div className="card-detail-pos">{position}</div>
              </div>

              <div className="card-detail-player-info">
                <h2 className="card-detail-nickname">{nickname}</h2>
                <p className="card-detail-details">{fullName}</p>
                <p className="card-detail-team">{team}</p>
              </div>

              <div className="card-detail-stats">
                <h3 className="card-detail-stats-title">Статистика</h3>
                {statItems.map(([key, value]) => (
                  <div className="card-detail-stat-row" key={key}>
                    <span className="card-detail-stat-key">{formatStatName(key)}</span>
                    <span className="card-detail-stat-val">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Для хранилища показываем только минимальную информацию */}
        {source === 'storage' && (
          <div className="card-detail-content-minimal">
            <div className="card-detail-image-section">
              <img 
                src={getFullImageUrl(image_url)} 
                alt={nickname} 
                className="card-detail-image" 
              />
            </div>
            <div className="card-detail-minimal-info">
              <h2 className="card-detail-nickname">{nickname}</h2>
              <p className="card-detail-team">{team}</p>
              <div className="card-detail-ovr-badge">{ovr} OVR</div>
            </div>
          </div>
        )}

        {/* Кнопки действий */}
        <div className="card-detail-actions">
          {!showPriceInput ? (
            <>
              <button 
                className="card-detail-btn card-detail-btn-sell"
                onClick={handleQuickSell}
                disabled={isProcessing}
              >
                {isProcessing ? 'Продажа...' : 'Быстрая продажа'}
              </button>
              <button 
                className="card-detail-btn card-detail-btn-marketplace"
                onClick={() => setShowPriceInput(true)}
                disabled={isProcessing}
              >
                Выставить на ТП
              </button>
            </>
          ) : (
            <div className="card-detail-price-input-section">
              <input
                type="number"
                className="card-detail-price-input"
                placeholder="Цена в коинах"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="1"
                autoFocus
              />
              <button 
                className="card-detail-btn card-detail-btn-confirm"
                onClick={handleListOnMarketplace}
                disabled={isProcessing}
              >
                {isProcessing ? 'Выставление...' : 'Подтвердить'}
              </button>
              <button 
                className="card-detail-btn card-detail-btn-cancel"
                onClick={() => {
                  setShowPriceInput(false);
                  setPrice('');
                }}
                disabled={isProcessing}
              >
                Отмена
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardDetailModal;
