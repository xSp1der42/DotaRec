import React from 'react';
import MatchCard from './MatchCard';

const EventCard = ({ event, userPicks, onPick }) => {
  const calculateScore = () => {
    let correct = 0;
    const finishedMatches = event.matches.filter(m => m.status === 'finished');
    
    finishedMatches.forEach(match => {
      if (userPicks[match.id] && userPicks[match.id] === match.winner) {
        correct++;
      }
    });
    return { correct, total: finishedMatches.length };
  };

  const score = calculateScore();

  return (
    <div className="event-card">
      <div className="event-card-header">
        <h2>{event.title}</h2>
        <div className="score">
          Счет: <span className="correct">{score.correct}</span> / <span className="total">{score.total}</span>
        </div>
      </div>
      <div className="matches-grid">
        {event.matches.map(match => (
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

export default EventCard;