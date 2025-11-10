import React, { useState } from 'react';
import PlayerForm from '../cards/PlayerForm';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortablePlayerItem } from '../cards/SortablePlayerItem';

import '../../styles/AdminPanel.css';

const AdminPanel = ({ players, onAddPlayer, onUpdatePlayer, onDeletePlayer, onReorderPlayers }) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [playerToEdit, setPlayerToEdit] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // --- НАЧАЛО ИСПРАВЛЕНИЯ ---
  // Добавляем проверку, чтобы убедиться, что `players` - это всегда массив
  const validPlayers = Array.isArray(players) ? players : [];

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = validPlayers.findIndex((p) => p.id === active.id);
      const newIndex = validPlayers.findIndex((p) => p.id === over.id);
      // Используем `validPlayers` для безопасности
      const reorderedPlayers = arrayMove(validPlayers, oldIndex, newIndex);
      onReorderPlayers(reorderedPlayers);
    }
  };
  // --- КОНЕЦ ИСПРАВЛЕНИЯ ---


  const handleAddNew = () => {
    setPlayerToEdit(null);
    setIsFormVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = (player) => {
    setPlayerToEdit(player);
    setIsFormVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = (playerData, imageFile) => {
    if (playerData.id) {
      onUpdatePlayer(playerData, imageFile);
    } else {
      onAddPlayer(playerData, imageFile);
    }
    setIsFormVisible(false);
    setPlayerToEdit(null);
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setPlayerToEdit(null);
  };

  return (
    <div className="card-management-section">
      <h2>Управление карточками игроков</h2>
      {!isFormVisible && (
        <button onClick={handleAddNew} className="add-player-btn">
          Добавить новую карточку
        </button>
      )}

      {isFormVisible && (
        <PlayerForm
          onSave={handleSave}
          onCancel={handleCancel}
          playerToEdit={playerToEdit}
        />
      )}

      <div className="players-list-admin">
        <h3>Список существующих карточек</h3>
        {/* --- ИСПОЛЬЗУЕМ `validPlayers` ВЕЗДЕ ВМЕСТО `players` --- */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={validPlayers.map(p => p.id)} // Теперь это безопасно
            strategy={verticalListSortingStrategy}
          >
            {validPlayers.map(player => (
              <SortablePlayerItem
                key={player.id}
                player={player}
                onEdit={handleEdit}
                onDelete={onDeletePlayer}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

export default AdminPanel;