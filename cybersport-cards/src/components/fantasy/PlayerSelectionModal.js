// cybersport-cards/src/components/fantasy/PlayerSelectionModal.js

import React from 'react';
import PlayerCard from '../cards/PlayerCard';
import '../../styles/PlayerSelectionModal.css';

// Логика определения роли по строковому полю 'position'
const ROLE_TO_POSITIONS_MAP = {
  core: ['POS 1', 'POS 3'],
  mid: ['POS 2'],
  support: ['POS 4', 'POS 5'],
};

const PlayerSelectionModal = ({ isOpen, onClose, availablePlayers, role, onPlayerSelect }) => {
  if (!isOpen) {
    return null;
  }

  const positionsForRole = ROLE_TO_POSITIONS_MAP[role] || [];
  // Фильтруем по строковому полю `position`
  const filteredPlayers = availablePlayers.filter(p => p.game === 'dota' && positionsForRole.includes(p.position));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>×</button>
        <h2>Выберите игрока на позицию "{role.toUpperCase()}"</h2>
        
        {filteredPlayers.length > 0 ? (
          <div className="player-selection-grid">
            {filteredPlayers.map(player => (
              <div key={player._id} onClick={() => onPlayerSelect(role, player)}>
                <PlayerCard player={player} isClickable={true} />
              </div>
            ))}
          </div>
        ) : (
          <p className="no-players-message">
            У вас в коллекции нет подходящих игроков Dota 2 для этой роли.
            <br/>
            (Нужны игроки позиций: {positionsForRole.join(', ')})
          </p>
        )}
      </div>
    </div>
  );
};

export default PlayerSelectionModal;