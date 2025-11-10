import React, { useState } from 'react';
import MatchEditor from '../pickem/MatchEditor';

const AdminPickemDashboard = ({ events, onAddEvent, onDeleteEvent, onSaveMatch, onDeleteMatch }) => {
  const [newEventTitle, setNewEventTitle] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [currentEventId, setCurrentEventId] = useState(null);

  const handleAddEvent = () => {
    if (newEventTitle.trim()) {
      onAddEvent(newEventTitle.trim());
      setNewEventTitle('');
    }
  };
  
  const openEditorForNew = (eventId) => {
    setCurrentEventId(eventId);
    setEditingMatch(null);
    setIsEditorOpen(true);
  };
  
  const openEditorForEdit = (eventId, match) => {
    setCurrentEventId(eventId);
    setEditingMatch(match);
    setIsEditorOpen(true);
  };

  const handleSave = (matchData) => {
    onSaveMatch(currentEventId, matchData);
    setIsEditorOpen(false);
  };

  return (
    <div className="admin-panel">
      <h1>Админ-панель Pick'em</h1>
      
      <div className="event-form">
        <input type="text" value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} placeholder="Название нового события"/>
        <button onClick={handleAddEvent} className="save-btn">Создать событие</button>
      </div>

      {events.map(event => (
        <div key={event.id} className="admin-event-item">
          <div className="admin-event-header">
            <h3>{event.title}</h3>
            <div>
              <button onClick={() => openEditorForNew(event.id)} className="add-player-btn">Добавить матч</button>
              <button onClick={() => onDeleteEvent(event.id)} className="delete-btn">Удалить событие</button>
            </div>
          </div>
          <div className="admin-match-list">
            {event.matches.map(match => (
              <div key={match.id} className="admin-match-item">
                <span>{match.teamA.name} vs {match.teamB.name} ({match.status})</span>
                <div>
                  <button onClick={() => openEditorForEdit(event.id, match)} className="edit-btn">Редактировать</button>
                  <button onClick={() => onDeleteMatch(event.id, match.id)} className="delete-btn">Удалить</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {isEditorOpen && <MatchEditor match={editingMatch} onSave={handleSave} onCancel={() => setIsEditorOpen(false)} />}
    </div>
  );
};

export default AdminPickemDashboard;