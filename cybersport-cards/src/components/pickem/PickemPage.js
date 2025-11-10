// cybersport-cards/src/components/pickem/PickemPage.js

import React, { useState, useEffect, useCallback } from 'react';
import EventCard from './EventCard';
import api from '../../services/api';
import '../../styles/Pickem.css';
import Loader from '../shared/Loader'; // Предполагаем наличие лоадера

const PickemPage = () => {
  const [events, setEvents] = useState([]);
  const [userPicks, setUserPicks] = useState({}); // { eventId: { picks: { matchId: team } } }
  const [loading, setLoading] = useState(true);
  const [activeEventId, setActiveEventId] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/pickem/events');
        setEvents(data);
        if (data.length > 0) {
          setActiveEventId(data[0]._id);
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!activeEventId) return;

    const fetchPicks = async () => {
      try {
        const { data } = await api.get(`/pickem/picks/${activeEventId}`);
        setUserPicks(prev => ({ ...prev, [activeEventId]: data.picks || {} }));
      } catch (error) {
        console.error("Failed to fetch user picks:", error);
      }
    };
    fetchPicks();
  }, [activeEventId]);
  
  const handlePick = useCallback(async (matchId, teamName) => {
    if (!activeEventId) return;

    // Оптимистичное обновление UI
    const currentPicks = userPicks[activeEventId] || {};
    const updatedPicks = { ...currentPicks, [matchId]: teamName };
    setUserPicks(prev => ({ ...prev, [activeEventId]: updatedPicks }));

    // Отправка на сервер
    try {
        await api.post('/pickem/picks', {
            eventId: activeEventId,
            picks: updatedPicks
        });
    } catch (error) {
        console.error("Failed to save pick:", error);
        // Откат в случае ошибки
        setUserPicks(prev => ({ ...prev, [activeEventId]: currentPicks }));
        alert("Не удалось сохранить ваш прогноз. Попробуйте снова.");
    }
  }, [activeEventId, userPicks]);
  
  if (loading) {
    return <Loader />;
  }

  const activeEvent = events.find(e => e._id === activeEventId);

  return (
    <div className="pickem-page">
      <h1>Pick'em Прогнозы</h1>
      {/* Тут можно добавить селектор ивентов, если их несколько */}
      
      {!activeEvent ? (
        <p>Активных событий для прогнозов пока нет.</p>
      ) : (
        <EventCard 
            key={activeEvent._id} 
            event={activeEvent} 
            userPicks={userPicks[activeEvent._id] || {}} 
            onPick={handlePick}
        />
      )}
    </div>
  );
};

export default PickemPage;