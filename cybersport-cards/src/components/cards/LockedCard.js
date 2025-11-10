import React from 'react';
import '../../styles/PlayerCard.css'; // Используем ваш новый файл стилей

const LockedCard = ({ card }) => {
  const statPlaceholders = Array(5).fill(0);

  return (
    // Главный класс .locked, который активирует все нужные стили
    <div className="card-final locked">
      
      {/* ИЗМЕНЕНИЕ: Добавлен большой полупрозрачный рейтинг на фон, как в вашем CSS */}
      <div className="card-final-photo-locked">?</div>

      <div className="card-final-content">
        <div className="card-final-header">
          <div className="card-final-ovr">{card.ovr}</div>
          {/* Пустой div для позиции оставляем для сохранения разметки */}
          <div className="card-final-pos"></div> 
        </div>

        <div className="card-final-info">
          <h2 className="card-final-nickname">{card.nickname}</h2>
          {/* Этот элемент будет скрыт через CSS (visibility: hidden) */}
          <p className="card-final-details">-</p> 
        </div>

        <div className="card-final-stats">
          {statPlaceholders.map((_, index) => (
            // ИЗМЕНЕНИЕ: Вместо строки с текстом теперь пустой div со специальным классом,
            // который CSS превратит в серую полоску-плейсхолдер.
            <div className="final-stat-row-locked" key={index}></div>
          ))}
        </div>

        <div className="card-final-footer">
          {/* Этот элемент будет скрыт через CSS (visibility: hidden) */}
          <div className="card-final-rarity">-</div>
        </div>
      </div>
    </div>
  );
};

export default LockedCard;