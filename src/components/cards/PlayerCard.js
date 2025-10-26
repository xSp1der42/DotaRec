import React from 'react';
import '../../styles/PlayerCard.css';

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

const getFullImageUrl = (imagePath) => {
  if (!imagePath) {
    return null;
  }
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  const supabaseProjectUrl = 'https://cerfqcoqvjueyalnrule.supabase.co'; 
  
  return `${supabaseProjectUrl}/storage/v1/object/public/player_avatars/${imagePath}`;
};

const PlayerCard = ({ player, onCardClick, isClickable = true }) => {
  const {
    ovr,
    game,
    image_url,
    nickname,
    fullName,
    team,
    stats,
    rarity,
    position,
  } = player;

  const labels = game ? statLabels[game.toLowerCase()] : {};

  const handleCardClick = () => {
    if (isClickable && onCardClick) {
      onCardClick(player);
    }
  };
  
  const finalImageUrl = getFullImageUrl(image_url);

  return (
    <div
      className={`card ${rarity} ${isClickable ? 'card-clickable' : ''}`}
      onClick={handleCardClick}
    >
      <div className="card-top">
        <img src={finalImageUrl || 'https://via.placeholder.com/300x250/1e1e2f/fff?text=No+Photo'} alt={nickname} className="player-photo" />
        <div className="card-header">
          <div className="card-ovr">{ovr}</div>
          <div className="card-game">
            {game && game.toLowerCase() === 'dota' && position ? position.toUpperCase() : game ? game.toUpperCase() : ''}
          </div>
        </div>
      </div>
      <div className="card-bottom">
        <h2 className="player-nickname">{nickname}</h2>
        <p className="player-info">{fullName} - {team}</p>
        {stats && (
          <ul className="player-stats">
            {Object.entries(stats).map(([statName, statValue]) => (
              <li key={statName}>
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