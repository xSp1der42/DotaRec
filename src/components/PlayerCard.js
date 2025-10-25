import React from 'react';
import '../styles/PlayerCard.css';

const statLabels = {
  dota: {
    gameSense: "Game Sense",
    mechanism: "Mechanism",
    heroPool: "Hero Pool",
    teamplay: "Teamplay",
    impact: "Impact",
  },
  cs: {
    aim: "Aim",
    movement: "Movement",
    gameSense: "Game Sense",
    utility: "Utility",
    clutch: "Clutch",
  }
};

const PlayerCard = ({ player, onCardClick, isClickable = true }) => {
  const {
    ovr,
    game,
    image_url, // <-- ИСПРАВЛЕНО (было photoUrl)
    nickname,
    fullName,
    team,
    stats,
    rarity,
    position, 
  } = player;

  const labels = game ? statLabels[game.toLowerCase()] : {}; // Добавлена проверка на существование game

  const handleCardClick = () => {
    if (isClickable && onCardClick) {
      onCardClick(player);
    }
  };

  return (
    <div 
      className={`card ${rarity} ${isClickable ? 'card-clickable' : ''}`}
      onClick={handleCardClick}
    >
      <div className="card-top">
        {/* ИСПРАВЛЕНО использование image_url вместо photoUrl */}
        <img src={image_url || 'https://via.placeholder.com/300x250/1e1e2f/fff?text=No+Photo'} alt={nickname} className="player-photo" />
        <div className="card-header">
          <div className="card-ovr">{ovr}</div>
          <div className="card-game">
            {/* Добавлена проверка на существование game */}
            {game && game.toLowerCase() === 'dota' && position ? position.toUpperCase() : game ? game.toUpperCase() : ''}
          </div>
        </div>
      </div>

      <div className="card-bottom">
        <h2 className="player-nickname">{nickname}</h2>
        <p className="player-info">{fullName} - {team}</p>

        {/* Добавлена проверка на существование stats */}
        {stats && (
          <ul className="player-stats">
            {Object.entries(stats).map(([statName, statValue]) => (
              <li key={statName}>
                {/* Добавлена проверка на существование labels[statName] */}
                <span className="stat-name">{labels[statName] || statName}</span>
                <span className="stat-value">{statValue}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card-rarity">{rarity}</div>
    </div>
  );
};

export default PlayerCard;