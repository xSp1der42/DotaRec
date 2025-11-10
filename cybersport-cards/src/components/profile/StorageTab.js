// cybersport-cards/src/components/profile/StorageTab.js

import React, { useState, useMemo } from 'react';
import PlayerCard from '../cards/PlayerCard';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../../styles/StorageTab.css';

const StorageTab = ({ storage, allCards, onUpdate }) => {
  const { updateUser } = useAuth();
  const [sortBy, setSortBy] = useState('ovr_desc');
  const [selectedCards, setSelectedCards] = useState(new Set());
  const [price, setPrice] = useState('');
  const [showSellModal, setShowSellModal] = useState(false);

  // Получаем полные данные карточек из хранилища
  const storageCards = useMemo(() => {
    if (!storage || !allCards) return [];
    
    const cardMap = new Map();
    allCards.forEach(card => {
      const cardId = card._id?.toString() || card.toString();
      cardMap.set(cardId, card);
    });
    
    // Обрабатываем карточки из хранилища (могут быть объектами или ID)
    const cards = [];
    storage.forEach(cardItem => {
      const id = cardItem._id?.toString() || cardItem.toString();
      const card = cardMap.get(id);
      if (card) {
        cards.push(card);
      }
    });
    
    return cards;
  }, [storage, allCards]);

  const displayedCards = useMemo(() => {
    let sorted = [...storageCards];
    
    switch (sortBy) {
      case 'ovr_desc':
        sorted.sort((a, b) => b.ovr - a.ovr);
        break;
      case 'ovr_asc':
        sorted.sort((a, b) => a.ovr - b.ovr);
        break;
      case 'name':
        sorted.sort((a, b) => a.nickname.localeCompare(b.nickname));
        break;
      default:
        break;
    }
    
    return sorted;
  }, [storageCards, sortBy]);

  const toggleCard = (cardId) => {
    setSelectedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const handleMoveToCollection = async () => {
    if (selectedCards.size === 0) {
      alert('Выберите карточки');
      return;
    }

    try {
      const cardIds = Array.from(selectedCards).map(id => ({ _id: id }));
      const { data } = await api.post('/api/profile/process-cards', {
        cards: cardIds,
        action: 'collection'
      });
      
      await updateUser({ coins: data.newBalance });
      alert('Карточки перемещены в коллекцию!');
      setSelectedCards(new Set());
      if (onUpdate) onUpdate();
    } catch (error) {
      alert(`Ошибка: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleSell = async () => {
    if (selectedCards.size === 0) {
      alert('Выберите карточки');
      return;
    }

    if (!price || price < 1) {
      alert('Укажите цену (минимум 1 коин)');
      return;
    }

    try {
      const cardIds = Array.from(selectedCards);
      const pricePerCard = parseInt(price);
      
      // Выставляем все выбранные карточки на продажу
      const promises = cardIds.map(cardId => 
        api.post('/api/marketplace', {
          cardId: cardId,
          price: pricePerCard
        })
      );
      
      await Promise.all(promises);
      
      const count = cardIds.length;
      alert(`${count} ${count === 1 ? 'карточка выставлена' : 'карточки выставлены'} на продажу!`);
      setSelectedCards(new Set());
      setShowSellModal(false);
      setPrice('');
      if (onUpdate) onUpdate();
    } catch (error) {
      alert(`Ошибка: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleQuickSell = async () => {
    if (selectedCards.size === 0) {
      alert('Выберите карточки');
      return;
    }

    try {
      const cardIds = Array.from(selectedCards).map(id => ({ _id: id }));
      const { data } = await api.post('/api/profile/process-cards', {
        cards: cardIds,
        action: 'sell'
      });
      
      await updateUser({ coins: data.newBalance });
      alert(`Карточки проданы! Получено: ${data.coinsEarned} коинов`);
      setSelectedCards(new Set());
      if (onUpdate) onUpdate();
    } catch (error) {
      alert(`Ошибка: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className="storage-tab">
      <div className="storage-header">
        <h2>Хранилище ({storageCards.length}/100)</h2>
        <div className="storage-actions">
          {selectedCards.size > 0 && (
            <>
              <button onClick={handleMoveToCollection} className="action-btn move-btn">
                В коллекцию ({selectedCards.size})
              </button>
              <button onClick={() => setShowSellModal(true)} className="action-btn sell-btn">
                Выставить на продажу ({selectedCards.size})
              </button>
              <button onClick={handleQuickSell} className="action-btn quick-sell-btn">
                Быстрая продажа ({selectedCards.size})
              </button>
            </>
          )}
        </div>
      </div>

      <div className="storage-controls">
        <div className="sort-buttons">
          <span>Сортировать:</span>
          <button onClick={() => setSortBy('ovr_desc')} className={sortBy === 'ovr_desc' ? 'active' : ''}>
            Рейтинг ↓
          </button>
          <button onClick={() => setSortBy('ovr_asc')} className={sortBy === 'ovr_asc' ? 'active' : ''}>
            Рейтинг ↑
          </button>
          <button onClick={() => setSortBy('name')} className={sortBy === 'name' ? 'active' : ''}>
            Имя (А-Я)
          </button>
        </div>
      </div>

      {storageCards.length === 0 ? (
        <p className="empty-storage-message">
          Хранилище пусто. Карточки из паков можно добавить в хранилище.
        </p>
      ) : (
        <div className="storage-grid">
          {displayedCards.map((card) => {
            const cardId = card._id?.toString() || card.toString();
            return (
              <div
                key={cardId}
                className={`storage-item ${selectedCards.has(cardId) ? 'selected' : ''}`}
                onClick={() => toggleCard(cardId)}
              >
                <PlayerCard player={card} isClickable={false} />
                {selectedCards.has(cardId) && (
                  <div className="storage-selection-checkbox">✓</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showSellModal && (
        <div className="modal-overlay" onClick={() => setShowSellModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Выставить на продажу</h3>
            <p>Вы выбрали {selectedCards.size} карточку(и). Укажите цену за каждую:</p>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Цена в коинах"
              min="1"
              className="price-input"
            />
            <div className="modal-actions">
              <button onClick={handleSell} className="confirm-btn">
                Выставить
              </button>
              <button onClick={() => setShowSellModal(false)} className="cancel-btn">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorageTab;