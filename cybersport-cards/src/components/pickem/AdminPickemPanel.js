import React, { useState } from 'react';

const AdminPickemPanel = ({ events, onAddEvent, onDeleteEvent, onAddMatch, onDeleteMatch, onSetResult }) => {
  const [newEventTitle, setNewEventTitle] = useState('');
  const [matchForms, setMatchForms] = useState({});

  const handleAddEvent = () => {
    if (newEventTitle.trim()) {
      onAddEvent(newEventTitle.trim());
      setNewEventTitle('');
    }
  };

  const handleMatchFormChange = (eventId, field, value) => {
    setMatchForms(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        [field]: value
      }
    }));
  };
  
  const handleAddMatch = (eventId) => {
    const formData = matchForms[eventId];
    if (formData && formData.teamA && formData.teamB) {
      onAddMatch(eventId, formData.teamA, formData.teamB);
      // Очищаем форму для этого события
      handleMatchFormChange(eventId, 'teamA', '');
      handleMatchFormChange(eventId, 'teamB', '');
    }
  };

  return (
    <div className="admin-pickem-panel">
      <h2>Управление Pick'em</h2>
      <div className="event-form">
        <input
          type="text"
          value={newEventTitle}
          onChange={(e) => setNewEventTitle(e.target.value)}
          placeholder="Название нового события (например, Major 2024)"
        />
        <button onClick={handleAddEvent} className="save-btn">Создать событие</button>
      </div>

      <div className="admin-event-list">
        {events.map(event => (
          <div key={event.id} className="admin-event-item">
            <div className="admin-event-header">
              <h3>{event.title}</h3>
              <button onClick={() => onDeleteEvent(event.id)} className="delete-btn">Удалить событие</button>
            </div>
            
            <div className="match-form">
              <input 
                type="text" 
                placeholder="Команда А"
                value={matchForms[event.id]?.teamA || ''}
                onChange={e => handleMatchFormChange(event.id, 'teamA', e.target.value)}
              />
              <input 
                type="text" 
                placeholder="Команда Б"
                value={matchForms[event.id]?.teamB || ''}
                onChange={e => handleMatchFormChange(event.id, 'teamB', e.target.value)}
              />
              <button onClick={() => handleAddMatch(event.id)} className="save-btn">Добавить матч</button>
            </div>

            <div className="admin-match-list">
              {event.matches.map(match => (
                <div key={match.id} className="admin-match-item">
                  <span>{match.teamA} vs {match.teamB}</span>
                  {match.result ? (
                    <strong>Победитель: {match.result}</strong>
                  ) : (
                    <div>
                      <button onClick={() => onSetResult(event.id, match.id, match.teamA)} className="edit-btn">Победа {match.teamA}</button>
                      <button onClick={() => onSetResult(event.id, match.id, match.teamB)} className="edit-btn">Победа {match.teamB}</button>
                      <button onClick={() => onDeleteMatch(event.id, match.id)} className="delete-btn">Удалить</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPickemPanel;