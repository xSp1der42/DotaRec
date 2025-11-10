// cybersport-cards/src/components/admin/AdminPickemPanel.js

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import MatchEditor from '../pickem/MatchEditor';
import { v4 as uuidv4 } from 'uuid';
import '../../styles/AdminPanel.css';
import Loader from '../shared/Loader'; // Хорошо бы иметь компонент загрузчика

const AdminPickemPanel = () => {
  // Инициализируем events как ПУСТОЙ МАССИВ. Это предотвратит ошибку .map() на первом рендере.
  const [events, setEvents] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [editingMatch, setEditingMatch] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null); // Сбрасываем ошибку перед новым запросом
      const { data } = await api.get('/pickem/events/all');
      
      // Дополнительная проверка, что с бэкенда пришел именно массив
      if (Array.isArray(data)) {
        setEvents(data);
      } else {
        setEvents([]); // Если пришло что-то другое, ставим пустой массив, чтобы избежать падения
        console.warn("API response is not an array:", data);
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError("Не удалось загрузить события. Проверьте консоль для деталей.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEvent = async (updatedEvent) => {
    try {
        const cleanStages = updatedEvent.stages.map(stage => ({
            ...stage,
            matches: stage.matches.map(({_id, ...match}) => match)
        }));
        const payload = { ...updatedEvent, stages: cleanStages };
        delete payload._id;
        delete payload.createdAt;
        delete payload.updatedAt;
        delete payload.__v;
        await api.put(`/pickem/events/${updatedEvent._id}`, payload);
        fetchEvents();
    } catch (error) {
        console.error("Failed to update event:", error.response?.data || error);
        alert("Ошибка при обновлении события.");
    }
  };

  const handleAddEvent = async () => {
    if (!newEventTitle.trim()) return;
    try {
      await api.post('/pickem/events', { title: newEventTitle });
      setNewEventTitle('');
      fetchEvents();
    } catch (error) {
      console.error("Failed to add event:", error);
      alert("Ошибка при создании события.");
    }
  };
  
  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Вы уверены, что хотите удалить это событие и все связанные с ним пики?')) {
        try {
            await api.delete(`/pickem/events/${eventId}`);
            fetchEvents();
        } catch (error) {
            console.error("Failed to delete event:", error);
            alert("Ошибка при удалении события.");
        }
    }
  };

  const handleAddStage = (eventId) => {
    const newStageName = prompt("Введите название нового этапа:");
    if (!newStageName || !newStageName.trim()) return;

    const eventToUpdate = events.find(e => e._id === eventId);
    if (!eventToUpdate) return;
    
    const updatedEvent = {
        ...eventToUpdate,
        stages: [...eventToUpdate.stages, { id: uuidv4(), title: newStageName.trim(), matches: [] }]
    };
    handleUpdateEvent(updatedEvent);
  };
  
  const handleDeleteStage = (eventId, stageId) => {
     if (window.confirm('Удалить этот этап со всеми матчами?')) {
        const eventToUpdate = events.find(e => e._id === eventId);
        if (!eventToUpdate) return;
        
        const updatedEvent = {
            ...eventToUpdate,
            stages: eventToUpdate.stages.filter(s => s.id !== stageId)
        };
        handleUpdateEvent(updatedEvent);
     }
  };
  
  const openMatchEditor = (event, stage, match = null) => {
      setEditingMatch({ event, stage, match });
      setIsEditorOpen(true);
  };

  const handleSaveMatch = (matchData) => {
    const { event, stage } = editingMatch;
    let updatedMatches;
    
    if (!editingMatch.match) { 
        updatedMatches = [...stage.matches, { ...matchData, id: matchData.id || uuidv4() }];
    } else {
        updatedMatches = stage.matches.map(m => m.id === matchData.id ? matchData : m);
    }

    const updatedStage = { ...stage, matches: updatedMatches };
    const updatedEvent = {
        ...event,
        stages: event.stages.map(s => s.id === stage.id ? updatedStage : s)
    };
    
    handleUpdateEvent(updatedEvent);
    closeEditor();
  };

  const handleDeleteMatch = (eventId, stageId, matchId) => {
    if (window.confirm('Удалить этот матч?')) {
        const eventToUpdate = events.find(e => e._id === eventId);
        if (!eventToUpdate) return;
        
        const stageToUpdate = eventToUpdate.stages.find(s => s.id === stageId);
        if (!stageToUpdate) return;

        const updatedMatches = stageToUpdate.matches.filter(m => m.id !== matchId);
        const updatedStage = { ...stageToUpdate, matches: updatedMatches };
        const updatedEvent = {
            ...eventToUpdate,
            stages: eventToUpdate.stages.map(s => s.id === stageId ? updatedStage : s)
        };
        handleUpdateEvent(updatedEvent);
    }
  };

  const closeEditor = () => {
      setIsEditorOpen(false);
      setEditingMatch(null);
  }

  if (loading) return <Loader />; // Используем Loader
  if (error) return <p className="error-message" style={{color: 'red'}}>{error}</p>; // Показываем ошибку

  return (
    <div className="admin-panel">
      <h2>Управление Pick'em</h2>
      <div className="form-group">
        <input
          type="text"
          value={newEventTitle}
          onChange={(e) => setNewEventTitle(e.target.value)}
          placeholder="Название нового события (например, PGL Major 2024)"
        />
        <button onClick={handleAddEvent} className="btn btn-primary">Создать событие</button>
      </div>

      <div className="admin-list">
        {events.length > 0 ? (
          events.map(event => (
            <div key={event._id} className="admin-item event-item">
              <div className="item-header">
                <h3>{event.title}</h3>
                <div>
                  <button onClick={() => handleAddStage(event._id)} className="btn btn-secondary">Добавить этап</button>
                  <button onClick={() => handleDeleteEvent(event._id)} className="btn btn-danger">Удалить событие</button>
                </div>
              </div>
              <div className="stages-list">
                  {event.stages && event.stages.map(stage => (
                      <div key={stage.id} className="admin-item stage-item">
                          <div className="item-header">
                              <h4>{stage.title}</h4>
                              <div>
                                  <button onClick={() => openMatchEditor(event, stage)} className="btn btn-primary">Добавить матч</button>
                                  <button onClick={() => handleDeleteStage(event._id, stage.id)} className="btn btn-danger">Удалить этап</button>
                              </div>
                          </div>
                          <div className="matches-list">
                              {stage.matches && stage.matches.map(match => (
                                  <div key={match.id} className="match-item">
                                      <span>{match.teamA.name} vs {match.teamB.name} ({match.status})</span>
                                      <div>
                                          <button onClick={() => openMatchEditor(event, stage, match)} className="btn btn-secondary">Редакт.</button>
                                          <button onClick={() => handleDeleteMatch(event._id, stage.id, match.id)} className="btn btn-danger">Удалить</button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  ))}
              </div>
            </div>
          ))
        ) : (
          <p>События для Pick'em еще не созданы.</p>
        )}
      </div>
      {isEditorOpen && <MatchEditor match={editingMatch.match} onSave={handleSaveMatch} onCancel={closeEditor} />}
    </div>
  );
};

export default AdminPickemPanel;