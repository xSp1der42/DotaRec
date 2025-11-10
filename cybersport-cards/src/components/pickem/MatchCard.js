// cybersport-cards/src/components/pickem/MatchCard.js

import React from 'react';
import '../../styles/MatchCard.css';

const MatchCard = ({ match, userPick, onPick }) => {
  const isFinished = match.status === 'finished';
  const isLive = match.status === 'live';
  const isUpcoming = match.status === 'upcoming';
  
  const isPickable = isUpcoming && new Date(match.matchTime) > new Date(); // Проверяем, не прошло ли время матча

  const getCardClassName = () => {
    let className = 'match-card';
    if (isLive) className += ' live';
    if (isFinished) className += ' finished';
    if (isFinished && userPick) {
      className += userPick === match.winner ? ' picked-correct' : ' picked-incorrect';
    }
    return className;
  };

  const Team = ({ team, isWinner, isPicked }) => (
    <div 
        className={`team-container ${isPickable ? 'selectable' : ''} ${isPicked ? 'selected' : ''} ${isWinner ? 'winner' : ''}`}
        onClick={() => isPickable && onPick(match.id, team.name)}
    >
        <img src={team.logoUrl || '/path/to/default/logo.png'} alt={team.name} className="team-logo"/>
        <span className="team-name">{team.name}</span>
    </div>
  );

  return (
    <div className={getCardClassName()}>
      {isLive && <div className="status-overlay">LIVE</div>}
      {!isPickable && isUpcoming && <div className="status-overlay locked">LOCKED</div>}
      
      <div className="match-header">
        <span>{new Date(match.matchTime).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
        <span>{match.boFormat}</span>
      </div>

      <div className="match-body">
        <Team 
          team={match.teamA} 
          isWinner={isFinished && match.winner === match.teamA.name} 
          isPicked={userPick === match.teamA.name} 
        />

        <div className="final-score">
          {isFinished ? `${match.teamA.score}:${match.teamB.score}` : 'VS'}
        </div>
        
        <Team 
          team={match.teamB} 
          isWinner={isFinished && match.winner === match.teamB.name} 
          isPicked={userPick === match.teamB.name} 
        />
      </div>

      {isFinished && (
        <div className="match-footer">
          {userPick ? 
            (userPick === match.winner ? 'Прогноз верен!' : 'Прогноз не сбылся') 
            : 'Вы не делали прогноз'}
        </div>
      )}
    </div>
  );
};

export default MatchCard;