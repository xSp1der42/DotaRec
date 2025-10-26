import React, { useState, useEffect } from 'react';

const emptyMatch = {
  id: null,
  matchTime: new Date().toISOString().slice(0, 16),
  boFormat: 'BO3',
  status: 'upcoming',
  teamA: { name: '', logoUrl: '', score: 0 },
  teamB: { name: '', logoUrl: '', score: 0 },
  maps: [],
  winner: null,
};

const MatchEditor = ({ match, onSave, onCancel }) => {
  const [formData, setFormData] = useState(emptyMatch);

  useEffect(() => {
    setFormData(match ? { ...match } : { ...emptyMatch, id: Date.now() });
  }, [match]);

  const handleChange = (e, team, field) => {
    const { value } = e.target;
    if (team) {
      setFormData(prev => ({ ...prev, [team]: { ...prev[team], [field]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [e.target.name]: value }));
    }
  };

  const handleMapChange = (index, field, value) => {
    const newMaps = [...formData.maps];
    newMaps[index][field] = value;
    setFormData(prev => ({ ...prev, maps: newMaps }));
  };

  const addMap = () => {
    setFormData(prev => ({ ...prev, maps: [...(prev.maps || []), { name: '', teamAScore: 0, teamBScore: 0 }] }));
  };
  
  const removeMap = (index) => {
    setFormData(prev => ({...prev, maps: prev.maps.filter((_, i) => i !== index)}));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <form onSubmit={handleSubmit} className="player-form">
          <h2>{match ? 'Редактировать матч' : 'Новый матч'}</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Команда A: Имя</label>
              <input type="text" value={formData.teamA.name} onChange={(e) => handleChange(e, 'teamA', 'name')} required />
            </div>
            <div className="form-group">
              <label>Команда A: URL логотипа</label>
              <input type="text" value={formData.teamA.logoUrl} onChange={(e) => handleChange(e, 'teamA', 'logoUrl')} />
            </div>
            <div className="form-group">
              <label>Команда B: Имя</label>
              <input type="text" value={formData.teamB.name} onChange={(e) => handleChange(e, 'teamB', 'name')} required />
            </div>
            <div className="form-group">
              <label>Команда B: URL логотипа</label>
              <input type="text" value={formData.teamB.logoUrl} onChange={(e) => handleChange(e, 'teamB', 'logoUrl')} />
            </div>
            <div className="form-group">
              <label>Время матча</label>
              <input type="datetime-local" name="matchTime" value={formData.matchTime} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Формат</label>
              <select name="boFormat" value={formData.boFormat} onChange={handleChange}>
                <option value="BO1">BO1</option>
                <option value="BO3">BO3</option>
                <option value="BO5">BO5</option>
              </select>
            </div>
            <div className="form-group">
              <label>Статус</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="upcoming">Ожидается</option>
                <option value="live">В прямом эфире</option>
                <option value="finished">Завершен</option>
              </select>
            </div>
            {formData.status === 'finished' && (
              <>
                <div className="form-group">
                  <label>Счет команды A</label>
                  <input type="number" value={formData.teamA.score} onChange={(e) => handleChange(e, 'teamA', 'score')} />
                </div>
                <div className="form-group">
                  <label>Счет команды B</label>
                  <input type="number" value={formData.teamB.score} onChange={(e) => handleChange(e, 'teamB', 'score')} />
                </div>
                <div className="form-group">
                  <label>Победитель</label>
                  <select name="winner" value={formData.winner || ''} onChange={handleChange}>
                    <option value="">Не выбран</option>
                    <option value={formData.teamA.name}>{formData.teamA.name}</option>
                    <option value={formData.teamB.name}>{formData.teamB.name}</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {formData.status === 'finished' && (
            <div>
              <h3>Результаты по картам</h3>
              {formData.maps && formData.maps.map((map, index) => (
                <div key={index} className="map-editor-row">
                  <input type="text" placeholder="Название карты" value={map.name} onChange={(e) => handleMapChange(index, 'name', e.target.value)} />
                  <input type="number" placeholder="Счет A" value={map.teamAScore} onChange={(e) => handleMapChange(index, 'teamAScore', e.target.value)} />
                  <input type="number" placeholder="Счет B" value={map.teamBScore} onChange={(e) => handleMapChange(index, 'teamBScore', e.target.value)} />
                  <button type="button" onClick={() => removeMap(index)} className="delete-btn">X</button>
                </div>
              ))}
              <button type="button" onClick={addMap} className="add-player-btn" style={{marginTop: '10px'}}>Добавить карту</button>
            </div>
          )}

          <div className="form-buttons">
            <button type="submit" className="save-btn">Сохранить</button>
            <button type="button" onClick={onCancel} className="cancel-btn">Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MatchEditor;