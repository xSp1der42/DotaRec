// cybersport-cards/src/components/fantasy/FantasyPlayerSlot.js

import React from 'react';
import PlayerCard from '../cards/PlayerCard';

const FantasyPlayerSlot = ({ role, roleName, playerSlot, onSelectClick, onEditClick }) => {
  // Теперь мы получаем не просто player, а весь объект слота: { player, title, banner }
  const player = playerSlot?.player;
  const title = playerSlot?.title;

  return (
    <div className="fantasy-player-slot">
      <h3>{roleName}</h3>
      <div className="slot-content">
        {player ? (
          <div className="filled-slot">
            <div className="player-title">
              {/* Отображаем титул, если он есть */}
              {title?.adjective && title?.noun 
                ? `${title.adjective} ${title.noun}` 
                : <span className="no-title">Без титула</span>
              }
            </div>
            <div onClick={() => onSelectClick(role)}>
              <PlayerCard player={player} isClickable={true} />
            </div>
            <button className="fantasy-button edit-slot-btn" onClick={() => onEditClick(role)}>
              Настроить
            </button>
          </div>
        ) : (
          <div className="empty-slot" onClick={() => onSelectClick(role)}>
            <div className="plus-icon">+</div>
            <p>Выбрать игрока</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FantasyPlayerSlot;