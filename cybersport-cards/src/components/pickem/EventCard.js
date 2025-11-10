// cybersport-cards/src/components/pickem/EventCard.js

import React from 'react';
import StageCard from './StageCard';

const EventCard = ({ event, userPicks, onPick }) => {
  return (
    <div className="event-card">
      <div className="event-card-header">
        <h2>{event.title}</h2>
      </div>
      <div className="stages-container">
        {event.stages.length > 0 ? (
          event.stages.map(stage => (
            <StageCard 
              key={stage.id}
              stage={stage}
              userPicks={userPicks}
              onPick={(matchId, team) => onPick(matchId, team)}
            />
          ))
        ) : (
          <p>Этапы для этого события еще не добавлены.</p>
        )}
      </div>
    </div>
  );
};

export default EventCard;