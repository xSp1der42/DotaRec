import React, { useState, useEffect } from 'react';
import PlayerCard from '../cards/PlayerCard';
import CoinPurchasePanel from './CoinPurchasePanel';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../../styles/ShopPage.css';

const CardChoiceModal = ({ cards, onClose, onProcessCards, myCollectionCardIds }) => {
  const [selectedCards, setSelectedCards] = useState(new Set());
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Сразу автоматом отправляем в коллекцию все новые, которых нет в коллекции
    if (cards && cards.length > 0 && myCollectionCardIds) {
      const inCollection = cards.filter(card => myCollectionCardIds.includes(card._id));
      const notInCollection = cards.filter(card => !myCollectionCardIds.includes(card._id));
      if (notInCollection.length && inCollection.length !== cards.length) {
        // сразу помещаем уникальные в коллекцию
        onProcessCards(notInCollection, 'collection');
        // показываем только дубли
        setSelectedCards(new Set(inCollection.map(c => c._id)));
      }
    }
    // eslint-disable-next-line
  }, [cards]);

  const isDuplicate = (cardId) => myCollectionCardIds?.includes(cardId);

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

  const handleProcessCards = async (action) => {
    if (selectedCards.size === 0) {
      alert('Выберите хотя бы одну карточку');
      return;
    }
    if (action === 'collection') {
      // Проверим, что не добавляем дубликаты
      const hasDups = Array.from(selectedCards).some(cardId => isDuplicate(cardId));
      if (hasDups) {
        alert('В коллекции может быть только одна копия каждой карточки!');
        return;
      }
    }
    setProcessing(true);
    const cardsToProcess = cards.filter(c => selectedCards.has(c._id));
    await onProcessCards(cardsToProcess, action);
    setProcessing(false);
  };

  if (!cards || cards.length === 0) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card-choice-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Поздравляем! Ваш улов:</h2>
        <p className="choice-instruction">Выберите карточки и решите, что с ними делать:</p>
        <div className="opened-cards-container">
          {cards.map((player) => (
            <div 
              key={player._id} 
              className={`card-choice-item ${selectedCards.has(player._id) ? 'selected' : ''}`}
              onClick={() => toggleCard(player._id)}
            >
              <PlayerCard player={player} isClickable={false} />
              <div className="card-selection-checkbox">
                {selectedCards.has(player._id) ? '✓' : ''}
              </div>
            </div>
          ))}
        </div>
        <div className="card-choice-actions">
          <button 
            onClick={() => handleProcessCards('collection')} 
            className="choice-btn collection-btn"
            disabled={
              processing || selectedCards.size === 0 || Array.from(selectedCards).some(cardId => myCollectionCardIds.includes(cardId))
            }
          >
            В коллекцию ({selectedCards.size})
          </button>
          <button 
            onClick={() => handleProcessCards('storage')} 
            className="choice-btn storage-btn"
            disabled={processing || selectedCards.size === 0}
          >
            В хранилище ({selectedCards.size})
          </button>
          <button 
            onClick={() => handleProcessCards('sell')} 
            className="choice-btn sell-btn"
            disabled={processing || selectedCards.size === 0}
          >
            Продать ({selectedCards.size})
          </button>
        </div>
        <button onClick={onClose} className="modal-close-btn">
          Отмена
        </button>
      </div>
    </div>
  );
};

const PackOpeningModal = ({ cards, onClose }) => {
  if (!cards || cards.length === 0) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Поздравляем! Ваш улов:</h2>
        <div className="opened-cards-container">
          {cards.map((player) => (
            <PlayerCard key={player._id} player={player} isClickable={false} />
          ))}
        </div>
        <button onClick={onClose} className="modal-close-btn">
          Отлично!
        </button>
      </div>
    </div>
  );
};

const ShopPage = ({ packs, userCoins, onOpenPack, onAddCoins }) => {
  const { updateUser } = useAuth();
  const [openedCards, setOpenedCards] = useState(null);
  const [isOpening, setIsOpening] = useState(false);
  const [showChoiceModal, setShowChoiceModal] = useState(false);

  const handleOpenPackClick = async (pack) => {
    if (isOpening) return;
    setIsOpening(true);

    const revealedCards = await onOpenPack(pack.id);
    
    if (revealedCards) {
      setOpenedCards(revealedCards);
      setShowChoiceModal(true);
    }
    
    setIsOpening(false);
  };

  const handleProcessCards = async (cards, action) => {
    try {
      const { data } = await api.post('/api/profile/process-cards', {
        cards: cards.map(c => ({ _id: c._id })),
        action
      });
      
      await updateUser({ coins: data.newBalance });
      
      if (action === 'sell') {
        alert(`Карточки проданы! Получено: ${data.coinsEarned} коинов`);
      } else if (action === 'collection') {
        alert('Карточки добавлены в коллекцию!');
      } else if (action === 'storage') {
        alert('Карточки добавлены в хранилище!');
      }
      
      setShowChoiceModal(false);
      setOpenedCards(null);
    } catch (error) {
      alert(`Ошибка: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleCloseModal = () => {
    if (showChoiceModal) {
      // Если открыто модальное окно выбора, нужно обработать все карточки
      if (openedCards && openedCards.length > 0) {
        // По умолчанию добавляем все в хранилище
        handleProcessCards(openedCards, 'storage');
      }
    } else {
      setOpenedCards(null);
    }
  };

  return (
    <div className="shop-page">
      <CoinPurchasePanel onAddCoins={onAddCoins} />

      <h1>Магазин Паков</h1>
      {packs.length > 0 ? (
        <div className="packs-container">
          {packs.map((pack) => (
            <div key={pack.id} className="pack-card">
              <h3>{pack.name}</h3>
              <p className="pack-description">{pack.description}</p>
              <div className="pack-footer">
                <span className="pack-price">{pack.price.toLocaleString('ru-RU')} коинов</span>
                <button
                  onClick={() => handleOpenPackClick(pack)}
                  // Блокируем кнопку, если не хватает коинов или пак уже открывается
                  disabled={userCoins < pack.price || isOpening}
                  className="buy-pack-btn"
                >
                  {isOpening ? 'Открываем...' : 'Открыть'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>В данный момент паки не доступны. Загляните позже!</p>
      )}
      {showChoiceModal ? (
        <CardChoiceModal 
          cards={openedCards} 
          onClose={handleCloseModal}
          onProcessCards={handleProcessCards}
          myCollectionCardIds={userCoins.collection} // Передаем id карточек в коллекции
        />
      ) : (
        <PackOpeningModal cards={openedCards} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default ShopPage;