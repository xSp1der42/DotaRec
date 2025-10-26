import React from 'react';
import PlayerCard from './PlayerCard';
import '../styles/PlayerList.css'; // Обновленный CSS будет ниже

// Больше нет Link, т.к. навигация происходит в App.js через onPlayerSelect
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