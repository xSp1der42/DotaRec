import React, { useState, useEffect, useMemo } from 'react';

const emptyDotaStats = { gameSense: 50, mechanism: 50, heroPool: 50, teamplay: 50, impact: 50 };
const emptyCsStats = { aim: 50, movement: 50, gameSense: 50, utility: 50, clutch: 50 };

const getFullImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http') || imagePath.startsWith('blob:')) return imagePath;
  const supabaseProjectUrl = 'https://cerfqcoqvjueyalnrule.supabase.co'; 
  return `${supabaseProjectUrl}/storage/v1/object/public/player_avatars/${imagePath}`;
};

const getInitialFormData = () => ({
  id: null,
  ovr: '',
  game: 'dota',
  image_url: '',
  nickname: '',
  fullName: '',
  team: '',
  rarity: 'common',
  stats: { ...emptyDotaStats },
  detailedInfo: '',
  achievements: [],
  matchHistory: [],
  position: 'POS 1',
});

const PlayerForm = ({ onSave, onCancel, playerToEdit }) => {
  const [formData, setFormData] = useState(getInitialFormData());
  const [imageFile, setImageFile] = useState(null); 
  const [imagePreview, setImagePreview] = useState('');

  const [newAchievement, setNewAchievement] = useState({ year: '', event: '', placing: '' });
  const [newMatch, setNewMatch] = useState({ event: '', opponent: '', result: '' });
  const [editingAchievementIndex, setEditingAchievementIndex] = useState(null);

  useEffect(() => {
    if (playerToEdit) {
      setFormData({
        ...getInitialFormData(),
        ...playerToEdit,
        stats: playerToEdit.stats || (playerToEdit.game === 'dota' ? emptyDotaStats : emptyCsStats),
        achievements: playerToEdit.achievements || [],
        matchHistory: playerToEdit.matchHistory || [],
      });
      setImagePreview(getFullImageUrl(playerToEdit.image_url));
      setImageFile(null);
    } else {
      setFormData(getInitialFormData());
      setImagePreview('');
      setImageFile(null);
    }
  }, [playerToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "game" && formData.game !== value) {
      const newStats = value === 'dota' ? { ...emptyDotaStats } : { ...emptyCsStats };
      setFormData({ ...formData, game: value, stats: newStats });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleStatChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, stats: { ...formData.stats, [name]: parseInt(value, 10) || 0 } });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, imageFile);
  };
  
  const sortedAchievementsForForm = useMemo(() => {
    if (!formData.achievements) return [];
    return [...formData.achievements].sort((a, b) => new Date(b.year) - new Date(a.year));
  }, [formData.achievements]);
  const handleNewAchievementChange = (e) => setNewAchievement({ ...newAchievement, [e.target.name]: e.target.value });
  const handleEditAchievement = (indexInSortedList) => {
    const achievementToEdit = sortedAchievementsForForm[indexInSortedList];
    const originalIndex = formData.achievements.findIndex(ach => ach === achievementToEdit);
    setEditingAchievementIndex(originalIndex);
    setNewAchievement(achievementToEdit);
  };
  const handleCancelEdit = () => {
    setEditingAchievementIndex(null);
    setNewAchievement({ year: '', event: '', placing: '' });
  };
  const handleAddOrUpdateAchievement = () => {
    if (!newAchievement.year || !newAchievement.event || !newAchievement.placing) return;
    let updatedAchievements;
    if (editingAchievementIndex !== null) {
      updatedAchievements = formData.achievements.map((item, index) =>
        index === editingAchievementIndex ? newAchievement : item
      );
    } else {
      updatedAchievements = [...(formData.achievements || []), newAchievement];
    }
    setFormData({ ...formData, achievements: updatedAchievements });
    handleCancelEdit();
  };
  const handleDeleteAchievement = (indexInSortedList) => {
    const achievementToDelete = sortedAchievementsForForm[indexInSortedList];
    const updatedAchievements = formData.achievements.filter(ach => ach !== achievementToDelete);
    setFormData({ ...formData, achievements: updatedAchievements });
  };
  const handleNewMatchChange = (e) => setNewMatch({ ...newMatch, [e.target.name]: e.target.value });
  const handleAddMatch = () => {
    if (!newMatch.event || !newMatch.opponent || !newMatch.result) return;
    setFormData({ ...formData, matchHistory: [...(formData.matchHistory || []), newMatch] });
    setNewMatch({ event: '', opponent: '', result: '' });
  };
  const handleDeleteMatch = (index) => setFormData({ ...formData, matchHistory: formData.matchHistory.filter((_, i) => i !== index) });
  const renderDotaStats = () => (
    <>
      <div className="form-group"> <label>Game Sense</label> <input type="number" name="gameSense" value={formData.stats.gameSense || ''} onChange={handleStatChange} min="1" max="99" /> </div>
      <div className="form-group"> <label>Mechanism</label> <input type="number" name="mechanism" value={formData.stats.mechanism || ''} onChange={handleStatChange} min="1" max="99" /> </div>
      <div className="form-group"> <label>Hero Pool</label> <input type="number" name="heroPool" value={formData.stats.heroPool || ''} onChange={handleStatChange} min="1" max="99" /> </div>
      <div className="form-group"> <label>Teamplay</label> <input type="number" name="teamplay" value={formData.stats.teamplay || ''} onChange={handleStatChange} min="1" max="99" /> </div>
      <div className="form-group"> <label>Impact</label> <input type="number" name="impact" value={formData.stats.impact || ''} onChange={handleStatChange} min="1" max="99" /> </div>
    </>
  );
  const renderCsStats = () => (
    <>
      <div className="form-group"> <label>Aim</label> <input type="number" name="aim" value={formData.stats.aim || ''} onChange={handleStatChange} min="1" max="99" /> </div>
      <div className="form-group"> <label>Movement</label> <input type="number" name="movement" value={formData.stats.movement || ''} onChange={handleStatChange} min="1" max="99" /> </div>
      <div className="form-group"> <label>Game Sense</label> <input type="number" name="gameSense" value={formData.stats.gameSense || ''} onChange={handleStatChange} min="1" max="99" /> </div>
      <div className="form-group"> <label>Utility</label> <input type="number" name="utility" value={formData.stats.utility || ''} onChange={handleStatChange} min="1" max="99" /> </div>
      <div className="form-group"> <label>Clutch</label> <input type="number" name="clutch" value={formData.stats.clutch || ''} onChange={handleStatChange} min="1" max="99" /> </div>
    </>
  );

  return (
    <form onSubmit={handleSubmit} className="player-form">
      <h2>{playerToEdit ? 'Редактировать карточку' : 'Создать новую карточку'}</h2>
      <h3>Основная информация</h3>
      <div className="form-grid">
        <div className="form-group"> <label>Никнейм</label> <input type="text" name="nickname" value={formData.nickname} onChange={handleChange} required /> </div>
        <div className="form-group"> <label>Полное имя</label> <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} /> </div>
        <div className="form-group"> <label>Команда</label> <input type="text" name="team" value={formData.team} onChange={handleChange} /> </div>
        <div className="form-group"> <label>Общий рейтинг (OVR)</label> <input type="number" name="ovr" value={formData.ovr} onChange={handleChange} min="1" max="99" required /> </div>
        <div className="form-group"> <label>Игра</label> <select name="game" value={formData.game} onChange={handleChange}> <option value="dota">Dota 2</option> <option value="cs">CS</option> </select> </div>
        {formData.game === 'dota' && ( <div className="form-group"> <label>Позиция (Dota 2)</label> <select name="position" value={formData.position} onChange={handleChange}> <option value="POS 1">POS 1</option> <option value="POS 2">POS 2</option> <option value="POS 3">POS 3</option> <option value="POS 4">POS 4</option> <option value="POS 5">POS 5</option> </select> </div> )}
        <div className="form-group"> <label>Редкость</label> <select name="rarity" value={formData.rarity} onChange={handleChange}> <option value="common">Common</option> <option value="rare">Rare</option> <option value="epic">Epic</option> <option value="legendary">Legendary</option> <option value="icon">Icon</option> </select> </div>
        <div className="form-group full-width">
          <label>Фотография игрока</label>
          <div className="file-input-wrapper">
            <input 
              type="file" 
              id="player-photo-input"
              name="photo" 
              onChange={handlePhotoChange} 
              accept="image/*"
              style={{ display: 'none' }}
            />
            <label htmlFor="player-photo-input" className="file-input-label">
              <span className="file-input-icon">📷</span>
              <span className="file-input-text">
                {imageFile ? imageFile.name : imagePreview ? 'Изменить фото' : 'Выберите файл'}
              </span>
            </label>
          </div>
          {imagePreview && (
            <div className="photo-preview-container">
              <p>Предпросмотр:</p>
              <img src={imagePreview} alt="Preview" className="photo-preview"/>
            </div>
          )}
        </div>
      </div>
      <h3>Статистика</h3>
      <div className="form-grid">{formData.game === 'dota' ? renderDotaStats() : renderCsStats()}</div>
      <div className="form-group full-width"> <h3>Подробная информация</h3> <textarea name="detailedInfo" value={formData.detailedInfo} onChange={handleChange} rows="5"></textarea> </div>
      <div className="dynamic-list-editor">
        <h3>Достижения</h3>
        <div className="admin-item-list">{sortedAchievementsForForm.map((ach, index) => (<div key={index} className="admin-list-item"><span>{ach.year} - {ach.event} - <strong>{ach.placing}</strong></span><div className="item-actions"><button type="button" onClick={() => handleEditAchievement(index)} className="edit-item-btn">✎</button><button type="button" onClick={() => handleDeleteAchievement(index)} className="delete-item-btn">&times;</button></div></div>))}</div>
        <div className="add-item-form"><input type="date" name="year" value={newAchievement.year} onChange={handleNewAchievementChange} /><input type="text" name="event" value={newAchievement.event} onChange={handleNewAchievementChange} placeholder="Турнир"/><input type="text" name="placing" value={newAchievement.placing} onChange={handleNewAchievementChange} placeholder="Место"/><button type="button" onClick={handleAddOrUpdateAchievement} className="add-item-btn">{editingAchievementIndex !== null ? 'Обновить' : 'Добавить'}</button>{editingAchievementIndex !== null && (<button type="button" onClick={handleCancelEdit} className="cancel-edit-btn">Отмена</button>)}</div>
      </div>
      <div className="dynamic-list-editor">
        <h3>История матчей</h3>
        <div className="admin-item-list">{formData.matchHistory.map((match, index) => (<div key={index} className="admin-list-item"><span>{match.event} vs <strong>{match.opponent}</strong> - {match.result}</span><div className="item-actions"><button type="button" onClick={() => handleDeleteMatch(index)} className="delete-item-btn">&times;</button></div></div>))}</div>
        <div className="add-item-form"><input type="text" name="event" value={newMatch.event} onChange={handleNewMatchChange} placeholder="Событие"/><input type="text" name="opponent" value={newMatch.opponent} onChange={handleNewMatchChange} placeholder="Противник"/><input type="text" name="result" value={newMatch.result} onChange={handleNewMatchChange} placeholder="Результат"/><button type="button" onClick={handleAddMatch} className="add-item-btn">Добавить</button></div>
      </div>
      <div className="form-buttons">
        <button type="submit" className="save-btn">Сохранить</button>
        <button type="button" onClick={onCancel} className="cancel-btn">Отмена</button>
      </div>
    </form>
  );
};

export default PlayerForm;