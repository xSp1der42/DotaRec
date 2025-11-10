import React, { useState, useEffect } from 'react';
// import { v4 as uuidv4 } from 'uuid'; // <-- БОЛЬШЕ НЕ НУЖЕН
import '../../styles/AdminPacks.css';

const AdminPacks = ({ packs, players, onAddPack, onUpdatePack, onDeletePack, onAddCoins }) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [packToEdit, setPackToEdit] = useState(null);
  const [formData, setFormData] = useState({
    id: null, name: '', description: '', price: 100, cards_in_pack: 3, player_pool: [],
  });
  const [coinsToAdd, setCoinsToAdd] = useState(1000);

  useEffect(() => {
    if (packToEdit) {
      setFormData({
        // Убедимся, что все поля из packToEdit переносятся, включая id (_id)
        id: packToEdit.id,
        name: packToEdit.name || '',
        description: packToEdit.description || '',
        price: packToEdit.price || 100,
        cards_in_pack: packToEdit.cards_in_pack || 3,
        // player_pool должен быть массивом ID, что корректно приходит из App.js
        player_pool: packToEdit.player_pool || [],
      });
      setIsFormVisible(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      resetForm();
    }
  }, [packToEdit]);

  const resetForm = () => {
    setFormData({ id: null, name: '', description: '', price: 100, cards_in_pack: 3, player_pool: [] });
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
    const isNumeric = ['price', 'cards_in_pack'].includes(name);
    setFormData(prev => ({ ...prev, [name]: isNumeric ? Number(value) : value }));
  };
  
  const handlePlayerToggle = (playerId) => {
    setFormData(prev => {
      const newPlayerPool = prev.player_pool.includes(playerId)
        ? prev.player_pool.filter(id => id !== playerId)
        : [...prev.player_pool, playerId];
      return { ...prev, player_pool: newPlayerPool };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.id) { // Если ID есть, значит это обновление
        onUpdatePack(formData);
    } else { // Если ID нет, это создание нового пака
        // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
        // Просто передаем данные формы. ID сгенерирует MongoDB на бэкенде.
        // Удаляем лишний объект и uuid.
        const { id, ...packDataForCreation } = formData; // Убираем `id: null` из объекта
        onAddPack(packDataForCreation);
    }
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
                <input type="number" name="cards_in_pack" value={formData.cards_in_pack} onChange={handleChange} min="1" required />
            </div>
          </div>
          <h3>Игроки в паке ({formData.player_pool.length} выбрано)</h3>
          <p className="pool-notice">Выберите всех игроков, которые могут выпасть из этого пака. Их должно быть больше или равно количеству карточек в паке.</p>
          <div className="player-pool-selector">
            {players.map(player => (
              <div
                key={player.id}
                className={`player-pool-item ${formData.player_pool.includes(player.id) ? 'selected' : ''}`}
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
              <strong>{pack.name}</strong> ({pack.price.toLocaleString('ru-RU')} коинов) - {pack.player_pool.length} игроков в пуле
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