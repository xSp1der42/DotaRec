import React from 'react';
import PlayerCard from './PlayerCard';
import '../../styles/PlayerList.css';

const PlayerList = ({ players, onPlayerSelect }) => {
  return (
    <div className="player-list-container">
      {players.length === 0 ? (
        <p>Карточки игроков не найдены.</p>
      ) : (
        players.map(player => (
          <div key={player.id} className="player-card-link-wrapper" onClick={() => onPlayerSelect(player)}>
            <PlayerCard player={player} />
          </div>
        ))
      )}
    </div>
  );
};

export default PlayerList;