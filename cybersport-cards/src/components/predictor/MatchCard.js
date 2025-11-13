// cybersport-cards/src/components/predictor/MatchCard.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import TeamLogo from '../shared/TeamLogo';
import { formatDistanceToNowStrict } from 'date-fns';
import { ru } from 'date-fns/locale';
import '../../styles/PredictorMatchCard.css'; // Создадим новый файл стилей

const PredictionBlock = ({ type, title, options, stats, onSelect, selectedChoice, players }) => {
  const renderOptions = () => {
    switch (type) {
      case 'winner':
        return options.map(option => (
          <button
            key={option.name}
            className={`winner-option ${selectedChoice === option.name ? 'selected' : ''}`}
            onClick={() => onSelect(type, option.name)}
          >
            <TeamLogo teamId={option.id || option.name} teamName={option.name} size="small" />
            <span>{option.name}</span>
          </button>
        ));
      case 'overtime':
        return options.map(option => (
          <button
            key={option}
            className={`boolean-option ${selectedChoice === option ? 'selected' : ''}`}
            onClick={() => onSelect(type, option)}
          >
            {option}
          </button>
        ));
      case 'mvp':
        return (
          <select
            className="mvp-select"
            value={selectedChoice || ''}
            onChange={(e) => onSelect(type, e.target.value)}
          >
            <option value="" disabled>Выберите игрока</option>
            {players?.map(player => (
              <option key={player._id} value={player._id}>{player.nickname}</option>
            ))}
          </select>
        );
      default:
        return null;
    }
  };

  const getStatPercentage = (optionName) => {
    if (!stats || !stats.options) return 50; // Возвращаем 50/50 если нет данных
    const total = stats.totalAmount;
    if (total === 0) return 50;
    const optionStat = stats.options.find(o => o.choice === optionName);
    return optionStat ? optionStat.percentage : 0;
  };

  const team1Percentage = type === 'winner' ? getStatPercentage(options[0]?.name) : 50;
  const team2Percentage = type === 'winner' ? 100 - team1Percentage : 50;

  return (
    <div className="prediction-block">
      <h4 className="prediction-title">
        {title}
        {stats && <span className="prediction-participants">Участников: {stats.participants}</span>}
      </h4>
      {type === 'winner' && (
        <div className="prediction-stats-bar">
          <div className="bar-team1" style={{ width: `${team1Percentage}%` }}>
            <span>{team1Percentage.toFixed(0)}%</span>
          </div>
          <div className="bar-team2" style={{ width: `${team2Percentage}%` }}>
             <span>{team2Percentage.toFixed(0)}%</span>
          </div>
        </div>
      )}
      <div className={`prediction-options type-${type}`}>
        {renderOptions()}
      </div>
    </div>
  );
};


const MatchCard = ({ match }) => {
  const [stats, setStats] = useState(null);
  const [selections, setSelections] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get(`/api/predictor/stats/${match._id}`);
        // Преобразуем массив статистики в объект для удобного доступа
        const statsMap = data.stats.reduce((acc, current) => {
            acc[current.type] = current;
            return acc;
        }, {});
        setStats(statsMap);
      } catch (error) {
        console.error(`Failed to fetch stats for match ${match._id}`, error);
      }
    };
    fetchStats();
  }, [match._id]);

  const handleSelect = (type, choice) => {
    setSelections(prev => ({ ...prev, [type]: choice }));
  };
  
  const timeToMatch = formatDistanceToNowStrict(new Date(match.startTime), {
    addSuffix: true,
    locale: ru,
  });

  return (
    <div className="predictor-match-card">
      <div className="card-header">
        <div className="header-left">
          <span className="match-time">Через {timeToMatch}</span>
          <span className="match-bo">BO1</span> {/* Это можно будет брать из данных матча */}
        </div>
        <div className="header-right">
          {/* Можно добавить иконки бустов */}
        </div>
      </div>

      <div className="card-body">
        {match.predictionTypes.map(pt => (
          <PredictionBlock
            key={pt.type}
            type={pt.type}
            title={pt.title}
            options={pt.type === 'winner' ? [match.team1, match.team2] : pt.options}
            stats={stats ? stats[pt.type] : null}
            onSelect={handleSelect}
            selectedChoice={selections[pt.type]}
            players={match.players} // Передаем список игроков для MVP
          />
        ))}
      </div>
    </div>
  );
};

export default MatchCard;