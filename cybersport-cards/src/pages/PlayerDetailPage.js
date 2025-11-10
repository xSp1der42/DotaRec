import React from 'react';
import { useNavigate } from 'react-router-dom';
import PlayerCard from '../components/cards/PlayerCard';
import '../styles/PlayerDetailPage.css';

const getPlacingClass = (placing) => {
  if (!placing) return '';
  const cleanPlacing = placing.toLowerCase();
  if (cleanPlacing.includes('1') || cleanPlacing.includes('1st')) return 'placing-gold';
  if (cleanPlacing.includes('2') || cleanPlacing.includes('2nd')) return 'placing-silver';
  if (cleanPlacing.includes('3') || cleanPlacing.includes('3rd')) return 'placing-bronze';
  return '';
};

const getResultClass = (result) => {
    if (!result) return '';
    const firstChar = result.trim().charAt(0).toLowerCase();
    if (firstChar === 'w' || firstChar === 'в') return 'result-win';
    if (firstChar === 'l' || firstChar === 'п') return 'result-loss';
    return '';
};

const PlayerDetailPage = ({ player }) => {
  const navigate = useNavigate();
  const sortedAchievements = player.achievements && [...player.achievements].sort((a, b) => new Date(b.year) - new Date(a.year));

  return (
    <div className="player-detail-page">
      <button onClick={() => navigate(-1)} className="back-button">
        &larr; Назад к списку
      </button>

      <div className="detail-content">
        <div className="detail-card-container">
          <PlayerCard player={player} isClickable={false} />
        </div>
        
        <div className="detail-info">
          <h2>Подробная информация</h2>
          <div className="info-block">
            {player.detailedInfo ? (
              <p className="detailed-description">{player.detailedInfo}</p>
            ) : (
              <p>Подробная информация об игроке еще не добавлена.</p>
            )}
          </div>

          <h2>История матчей</h2>
          <div className="info-block">
            {(player.matchHistory && player.matchHistory.length > 0) ? (
              <ul className="data-list">
                 <li className="data-list-header">
                    <span>Событие</span>
                    <span>Противник</span>
                    <span>Результат</span>
                </li>
                {player.matchHistory.map((match, index) => (
                  <li key={index} className="data-list-item match-item">
                    <span className="match-event">{match.event}</span>
                    <span className="match-opponent">{match.opponent}</span>
                    <span className={`match-result ${getResultClass(match.result)}`}>{match.result}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>История последних матчей еще не добавлена.</p>
            )}
          </div>
          
          <h2>Достижения</h2>
          <div className="info-block">
            {sortedAchievements && sortedAchievements.length > 0 ? (
              <ul className="data-list">
                <li className="data-list-header">
                    <span>Дата</span>
                    <span>Событие</span>
                    <span>Место</span>
                </li>
                {sortedAchievements.map((ach, index) => (
                  <li key={index} className="data-list-item achievement-item">
                    <span className="achievement-year">{ach.year}</span>
                    <span className="achievement-event">{ach.event}</span>
                    <span className={`achievement-placing ${getPlacingClass(ach.placing)}`}>{ach.placing}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Список достижений еще не добавлен.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetailPage;