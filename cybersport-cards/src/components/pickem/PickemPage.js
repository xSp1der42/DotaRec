import React, { useEffect } from 'react';
import EventCard from './EventCard';
import LogoService from '../../services/logoService';
import '../../styles/Pickem.css';

const PickemPage = ({ events, userPicks, onPick }) => {
  useEffect(() => {
    // Preload logos for all teams in current pick session
    const preloadLogos = async () => {
      const teamIds = new Set();
      
      // Collect all unique team IDs from all events and matches
      events.forEach(event => {
        event.matches?.forEach(match => {
          if (match.teamA?.id) teamIds.add(match.teamA.id);
          if (match.teamB?.id) teamIds.add(match.teamB.id);
        });
      });

      // Preload logos asynchronously without blocking UI
      if (teamIds.size > 0) {
        try {
          await LogoService.preloadLogos(Array.from(teamIds));
        } catch (error) {
          console.warn('Failed to preload some team logos:', error);
        }
      }
    };

    if (events.length > 0) {
      preloadLogos();
    }
  }, [events]);

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