import React from 'react';
import PlayerCard from './PlayerCard';
// Убедитесь, что этот путь правильный!
import '../styles/PlayerList.css'; 

// Мы убрали Link из этого файла в прошлый раз, теперь навигация идет через onPlayerSelect
const PlayerList = ({ players, onPlayerSelect }) => {
  return (
    <div className="player-list-container">
      {players.length === 0 ? (
        <p>Карточки игроков не найдены.</p>
      ) : (
        players.map(player => (
          // Обертка для клика, передаем вызов в App.js
          <div key={player.id} className="player-card-link-wrapper" onClick={() => onPlayerSelect(player)}>
            <PlayerCard player={player} />
          </div>
        ))
      )}
    </div>
  );
};

export default PlayerList;