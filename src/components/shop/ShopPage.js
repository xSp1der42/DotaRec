import React, { useState } from 'react';
// ИЗМЕНЕНО: Путь к PlayerCard теперь ../ так как мы находимся в папке shop
import PlayerCard from '../PlayerCard'; 
// ИЗМЕНЕНО: Путь к CoinPurchasePanel теперь ./ так как они в одной папке
import CoinPurchasePanel from './CoinPurchasePanel'; 
// ИЗМЕНЕНО: Путь к стилям теперь ../styles/ так как мы поднялись на уровень выше
import '../styles/ShopPage.css';

// Модальное окно для отображения открытых карточек
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
            <PlayerCard key={player.id} player={player} isClickable={false} />
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
  const [openedCards, setOpenedCards] = useState(null);

  const handleOpenPackClick = (pack) => {
    const revealedCards = onOpenPack(pack.id);
    if (revealedCards) {
      setOpenedCards(revealedCards);
    } else {
      alert("Недостаточно коинов!");
    }
  };

  const handleCloseModal = () => {
    setOpenedCards(null);
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
                  disabled={userCoins < pack.price}
                  className="buy-pack-btn"
                >
                  Открыть
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>В данный момент паки не доступны. Загляните позже!</p>
      )}
      <PackOpeningModal cards={openedCards} onClose={handleCloseModal} />
    </div>
  );
};

export default ShopPage;