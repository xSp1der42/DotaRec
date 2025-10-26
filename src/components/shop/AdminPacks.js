import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
// ВАЖНО: Убедись, что папка называется 'styles' и файл 'AdminPacks.css'
import '../../styles/AdminPacks.css';

const AdminPacks = ({ packs, players, onAddPack, onUpdatePack, onDeletePack, onAddCoins }) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [packToEdit, setPackToEdit] = useState(null);
  const [formData, setFormData] = useState({
    id: null, name: '', description: '', price: 100, cardsInPack: 3, playerPool: [],
  });
  const [coinsToAdd, setCoinsToAdd] = useState(1000);

  useEffect(() => {
    if (packToEdit) {
      setFormData({
        id: packToEdit.id,
        name: packToEdit.name || '',
        description: packToEdit.description || '',
        price: packToEdit.price || 100,
        cardsInPack: packToEdit.cardsInPack || 3,
        playerPool: packToEdit.playerPool || [],
      });
      setIsFormVisible(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      resetForm();
    }
  }, [packToEdit]);

  const resetForm = () => {
    setFormData({ id: null, name: '', description: '', price: 100, cardsInPack: 3, playerPool: [] });
  };

  const handleAddNew = () => {
    setPackToEdit(null);
    resetForm();
    setIsFormVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = (pack) => setPackToEdit(pack);
  
  const handleCancel = () => {
    setIsFormVisible(false);
    setPackToEdit(null);
    resetForm();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePlayerToggle = (playerId) => {
    setFormData(prev => {
      const newPlayerPool = prev.playerPool.includes(playerId)
        ? prev.playerPool.filter(id => id !== playerId)
        : [...prev.playerPool, playerId];
      return { ...prev, playerPool: newPlayerPool };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.id) onUpdatePack(formData);
    else onAddPack({ ...formData, id: uuidv4() });
    handleCancel();
  };

  const handleIssueCoins = (e) => {
    e.preventDefault();
    onAddCoins(coinsToAdd);
  };

  return (
    <div className="card-management-section">
      <div className="admin-issue-coins">
        <h3>Выдать коины (себе)</h3>
        <form className="issue-coins-form" onSubmit={handleIssueCoins}>
          <input
            type="number"
            value={coinsToAdd}
            onChange={(e) => setCoinsToAdd(Number(e.target.value))}
            min="1"
            placeholder="Количество коинов"
            required
          />
          <button type="submit" className="add-item-btn">
            Выдать
          </button>
        </form>
      </div>

      <h2>Управление Паками</h2>
      {!isFormVisible && (
        <button onClick={handleAddNew} className="add-player-btn">
          Добавить новый пак
        </button>
      )}

      {isFormVisible && (
        <form onSubmit={handleSubmit} className="player-form pack-form">
          <h3>{packToEdit ? 'Редактировать пак' : 'Создать новый пак'}</h3>
          <div className="form-group">
            <label>Название пака</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Описание</label>
            <textarea name="description" value={formData.description} onChange={handleChange}></textarea>
          </div>
           <div className="form-grid">
            <div className="form-group">
                <label>Цена (в коинах)</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange} min="0" required />
            </div>
            <div className="form-group">
                <label>Карточек в паке</label>
                <input type="number" name="cardsInPack" value={formData.cardsInPack} onChange={handleChange} min="1" required />
            </div>
          </div>
          <h3>Игроки в паке ({formData.playerPool.length} выбрано)</h3>
          <p className="pool-notice">Выберите всех игроков, которые могут выпасть из этого пака. Их должно быть больше или равно количеству карточек в паке.</p>
          <div className="player-pool-selector">
            {players.map(player => (
              <div
                key={player.id}
                className={`player-pool-item ${formData.playerPool.includes(player.id) ? 'selected' : ''}`}
                onClick={() => handlePlayerToggle(player.id)}
              >
                {player.nickname}
              </div>
            ))}
          </div>
          <div className="form-buttons">
            <button type="submit" className="save-btn">Сохранить</button>
            <button type="button" onClick={handleCancel} className="cancel-btn">Отмена</button>
          </div>
        </form>
      )}

      <div className="packs-list-admin">
        <h3>Список существующих паков</h3>
        {packs.map(pack => (
          <div key={pack.id} className="player-item-admin pack-item-admin">
            <div className="info">
              <strong>{pack.name}</strong> ({pack.price.toLocaleString('ru-RU')} коинов) - {pack.playerPool.length} игроков в пуле
            </div>
            <div className="actions">
              <button onClick={() => handleEdit(pack)} className="edit-btn">Редактировать</button>
              <button onClick={() => onDeletePack(pack.id)} className="delete-btn">Удалить</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPacks;