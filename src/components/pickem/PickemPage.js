import React from 'react';
import EventCard from './EventCard';
import '../../styles/Pickem.css';

const PickemPage = ({ events, userPicks, onPick }) => {
  return (
    <div className="pickem-page">
      <h1>Pick'em Прогнозы</h1>
      {events.length === 0 ? (
        <p>Активных событий для прогнозов пока нет.</p>
      ) : (
        events.map(event => (
          <EventCard 
            key={event.id} 
            event={event} 
            userPicks={userPicks[event.id] || {}} 
            onPick={(matchId, team) => onPick(event.id, matchId, team)}
          />
        ))
      )}
    </div>
  );
};

export default PickemPage;