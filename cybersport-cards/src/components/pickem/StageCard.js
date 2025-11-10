// cybersport-cards/src/components/pickem/StageCard.js

import React from 'react';
import MatchCard from './MatchCard';
import '../../styles/Pickem.css'; // Используем общие стили

const StageCard = ({ stage, userPicks, onPick }) => {
  // Функция для подсчета очков на этом этапе
  const calculateScore = () => {
    let correct = 0;
    const finishedMatches = stage.matches.filter(m => m.status === 'finished');
    
    finishedMatches.forEach(match => {
      if (userPicks[match.id] && userPicks[match.id] === match.winner) {
        correct++;
      }
    });
    return { correct, total: finishedMatches.length };
  };

  const score = calculateScore();

  return (
    <div className="stage-card">
      <div className="stage-card-header">
        <h3>{stage.title}</h3>
        {score.total > 0 && (
          <div className="score">
            Счет: <span className="correct">{score.correct}</span> / <span className="total">{score.total}</span>
          </div>
        )}
      </div>
      <div className="matches-grid">
        {stage.matches.map(match => (
          <MatchCard 
            key={match.id}
            match={match}
            userPick={userPicks[match.id]}
            onPick={onPick}
          />
        ))}
      </div>
    </div>
  );
};

export default StageCard;