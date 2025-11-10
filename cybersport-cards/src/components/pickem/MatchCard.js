import React from 'react';
import '../../styles/MatchCard.css';

const MatchCard = ({ match, userPick, onPick }) => {
  const isFinished = match.status === 'finished';
  const isSelectable = match.status === 'upcoming';

  const getCardBorderClass = () => {
    if (!isFinished || !userPick) return '';
    return userPick === match.winner ? 'picked-correct' : 'picked-incorrect';
  };

  const getFooterText = () => {
    if (!userPick) return 'Сделайте свой прогноз';
    if (!isFinished) return `Вы выбрали: ${userPick}`;
    if (userPick === match.winner) return 'Ваш прогноз верен!';
    return 'Ваш прогноз не сбылся';
  };
  
  const getFooterClass = () => {
    if (!isFinished || !userPick) return '';
    return userPick === match.winner ? 'correct' : 'incorrect';
  };

  return (
    <div className={`match-card ${getCardBorderClass()}`}>
      <div className="match-header">
        <span>{new Date(match.matchTime).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
        <span>{match.boFormat}</span>
      </div>

      {isFinished && match.maps && (
        <div className="map-results">
          {match.maps.map((map, index) => (
            <div key={index} className="map-item">
              <div className="map-name">{map.name}</div>
              <div className="map-score">{map.teamAScore} - {map.teamBScore}</div>
            </div>
          ))}
        </div>
      )}

      <div className="match-body">
        <div 
          className={`team-container ${isSelectable ? 'selectable' : ''} ${userPick === match.teamA.name ? 'selected' : ''}`}
          onClick={() => isSelectable && onPick(match.id, match.teamA.name)}
        >
          <img src={match.teamA.logoUrl} alt={match.teamA.name} className="team-logo"/>
          <span className="team-name">{match.teamA.name}</span>
        </div>

        <div className="final-score">
          {isFinished ? `${match.teamA.score}:${match.teamB.score}` : 'VS'}
        </div>

        <div 
          className={`team-container ${isSelectable ? 'selectable' : ''} ${userPick === match.teamB.name ? 'selected' : ''}`}
          onClick={() => isSelectable && onPick(match.id, match.teamB.name)}
        >
          <img src={match.teamB.logoUrl} alt={match.teamB.name} className="team-logo"/>
          <span className="team-name">{match.teamB.name}</span>
        </div>
      </div>
      <div className={`match-footer ${getFooterClass()}`}>
        {getFooterText()}
      </div>
    </div>
  );
};

export default MatchCard;