import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DragHandleIcon = () => (
  <svg viewBox="0 0 20 20" width="20" style={{ fill: '#a9a9c9', cursor: 'grab' }}>
    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
  </svg>
);

export const SortablePlayerItem = ({ player, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    boxShadow: isDragging ? '0 10px 20px rgba(0,0,0,0.5)' : 'none',
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className="player-item-admin">
      <div className="drag-handle" {...attributes} {...listeners}>
        <DragHandleIcon />
      </div>
      <div className="info">
        <strong>{player.nickname}</strong> ({player.game.toUpperCase()}) - OVR: {player.ovr}
      </div>
      <div className="actions">
        <button onClick={() => onEdit(player)} className="edit-btn">Редактировать</button>
        <button onClick={() => onDelete(player.id)} className="delete-btn">Удалить</button>
      </div>
    </div>
  );
};