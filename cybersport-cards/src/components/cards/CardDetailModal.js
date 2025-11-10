import React, { useState } from 'react';
import '../../styles/CardDetailModal.css';

const getFullImageUrl = (imagePath) => {
  if (!imagePath) {
    return 'https://via.placeholder.com/280x280/212431/FFF?text=No+Image';
  }
  if (imagePath.startsWith('http') || imagePath.startsWith('blob:')) {
    return imagePath;
  }
  return `${process.env.REACT_APP_API_URL}${imagePath}`;
};

const formatStatName = (camelCaseStr) => {
  if (!camelCaseStr) return '';
  const result = camelCaseStr.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1);
};

const CardDetailModal = ({ 
  card, 
  onClose, 
  onQuickSell, 
  onListOnMarketplace, 
  source 
}) => {
  const [showPriceInput, setShowPriceInput] = useState(false);
  const [price, setPrice] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleQuickSell = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await onQuickSell(card._id);
      onClose();
    } catch (error) {
      alert(`Ошибка: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleListOnMarketplace = async () => {
    if (!price || price < 1) {
      alert('Укажите цену (минимум 1 коин)');
      return;
    }
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await onListOnMarketplace(card._id, parseInt(price));
      onClose();
    } catch (error) {
      alert(`Ошибка: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const statItems = card.stats ? Object.entries(card.stats) : [];

  return (
    <div className="card-detail-modal-overlay" onClick={onClose}>
      <div className="card-detail-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="card-detail-modal-close" onClick={onClose}>×</button>
        
        {source === 'collection' && (
          <div className="card-detail-stats-section">
            <div className="card-detail-image-container">
              <img 
                src={getFullImageUrl(card.image_url)} 
                alt={card.nickname} 
                className="card-detail-image"
              />
              <div className={`card-detail-rarity ${card.rarity || 'common'}`}>
                {card.rarity?.toUpperCase() || 'COMMON'}
              </div>
            </div>
            
            <div className="card-detail-info">
              <div className="card-detail-header">
                <div className="card-detail-ovr">{card.ovr}</div>
                <div className="card-detail-position">{card.position}</div>
              </div>
              
              <h2 className="card-detail-nickname">{card.nickname}</h2>
              <p className="card-detail-fullname">{card.fullName}</p>
              <p className="card-detail-team">{card.team}</p>
              
              <div className="card-detail-stats">
                <h3>Статистика</h3>
                {statItems.map(([key, value]) => (
                  <div className="card-detail-stat-row" key={key}>
                    <span className="card-detail-stat-key">{formatStatName(key)}</span>
                    <span className="card-detail-stat-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {source === 'storage' && (
          <div className="card-detail-storage-view">
            <div className="card-detail-image-container">
              <img 
                src={getFullImageUrl(card.image_url)} 
                alt={card.nickname} 
                className="card-detail-image"
              />
            </div>
            <h2 className="card-detail-nickname">{card.nickname}</h2>
            <p className="card-detail-team">{card.team} • OVR {card.ovr}</p>
          </div>
        )}

        {!showPriceInput ? (
          <div className="card-detail-actions">
            <button 
              onClick={handleQuickSell} 
              className="card-detail-btn quick-sell-btn"
              disabled={isProcessing}
            >
              Быстрая продажа
            </button>
            <button 
              onClick={() => setShowPriceInput(true)} 
              className="card-detail-btn marketplace-btn"
              disabled={isProcessing}
            >
              Выставить на торговую площадку
            </button>
          </div>
        ) : (
          <div className="card-detail-price-input-section">
            <h3>Укажите цену</h3>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Цена в коинах"
              min="1"
              className="card-detail-price-input"
              autoFocus
            />
            <div className="card-detail-actions">
              <button 
                onClick={handleListOnMarketplace} 
                className="card-detail-btn confirm-btn"
                disabled={isProcessing}
              >
                Выставить
              </button>
              <button 
                onClick={() => setShowPriceInput(false)} 
                className="card-detail-btn cancel-btn"
                disabled={isProcessing}
              >
                Назад
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardDetailModal;
