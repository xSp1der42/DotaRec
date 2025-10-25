import React from 'react';
import PlayerCard from './PlayerCard';
import './PlayerList.css';
import { Link } from 'react-router-dom';

const PlayerList = ({ players, onCardClick }) => {
  return (
    <div className="player-list-container">
      {players.length === 0 ? (
        <p>Карточки игроков не найдены.</p>
      ) : (
        players.map(player => (
          <Link key={player.id} to={`/player/${player.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <PlayerCard player={player} onCardClick={onCardClick} />
          </Link>
        ))
      )}
    </div>
  );
};

export default PlayerList;