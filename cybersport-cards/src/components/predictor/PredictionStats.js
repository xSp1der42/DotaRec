import { useState, useEffect } from 'react';
import api from '../../services/api';
import '../../styles/PredictionStats.css';

const PredictionStats = ({ matchId, predictionType }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch statistics from API
  const fetchStats = async () => {
    try {
      setError(null);
      const { data } = await api.get(`/api/predictor/stats/${matchId}`);
      
      // Find stats for the specific prediction type
      const typeStats = data.stats?.find(s => s.type === predictionType);
      
      if (typeStats) {
        setStats(typeStats);
      } else {
        setStats(null);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching prediction stats:', err);
      setError('Не удалось загрузить статистику');
      setLoading(false);
    }
  };

  // Initial fetch and auto-update every 10 seconds
  useEffect(() => {
    fetchStats();
    
    const interval = setInterval(() => {
      fetchStats();
    }, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, [matchId, predictionType]);

  // Get prediction type display name
  const getPredictionTypeName = (type) => {
    const typeNames = {
      'first_ban_team1': 'Первый бан команды 1',
      'first_ban_team2': 'Первый бан команды 2',
      'first_pick_team1': 'Первый пик команды 1',
      'first_pick_team2': 'Первый пик команды 2',
      'most_banned': 'Самый забаненный герой/агент',
    };
    return typeNames[type] || type;
  };

  // Get color for percentage bar
  const getBarColor = (percentage) => {
    if (percentage >= 50) return '#4caf50'; // Green
    if (percentage >= 30) return '#ff9800'; // Orange
    return '#2196f3'; // Blue
  };

  if (loading) {
    return (
      <div className="prediction-stats">
        <div className="stats-loading">Загрузка статистики...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="prediction-stats">
        <div className="stats-error">{error}</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="prediction-stats">
        <div className="stats-empty">Статистика недоступна</div>
      </div>
    );
  }

  return (
    <div className="prediction-stats">
      <div className="stats-header">
        <h4 className="stats-title">{getPredictionTypeName(stats.type)}</h4>
        <div className="stats-update-indicator">
          <span className="update-dot"></span>
          <span className="update-text">Обновляется</span>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="stats-overview">
        <div className="overview-item">
          <div className="overview-label">Участников</div>
          <div className="overview-value">{stats.participants || 0}</div>
        </div>
        <div className="overview-item">
          <div className="overview-label">Пул наград</div>
          <div className="overview-value">
            {(stats.totalAmount || 0).toLocaleString('ru-RU')} 
            <span className="currency-small">монет</span>
          </div>
        </div>
        <div className="overview-item">
          <div className="overview-label">Всего ставок</div>
          <div className="overview-value">{stats.totalBets || 0}</div>
        </div>
      </div>

      {/* Distribution of Bets */}
      <div className="stats-distribution">
        <h5 className="distribution-title">Распределение ставок</h5>
        
        {stats.options && stats.options.length > 0 ? (
          <div className="distribution-list">
            {stats.options
              .sort((a, b) => b.percentage - a.percentage)
              .map((option, index) => (
                <div key={index} className="distribution-item">
                  <div className="option-header">
                    <span className="option-name">{option.choice}</span>
                    <span className="option-percentage">
                      {option.percentage.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="percentage-bar-container">
                    <div 
                      className="percentage-bar"
                      style={{
                        width: `${option.percentage}%`,
                        backgroundColor: getBarColor(option.percentage)
                      }}
                    ></div>
                  </div>
                  
                  <div className="option-details">
                    <span className="detail-item">
                      Ставок: {option.betsCount || 0}
                    </span>
                    <span className="detail-separator">•</span>
                    <span className="detail-item">
                      Сумма: {(option.totalAmount || 0).toLocaleString('ru-RU')} монет
                    </span>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="no-bets-message">
            Пока нет ставок на это предсказание
          </div>
        )}
      </div>

      {/* Info Note */}
      <div className="stats-note">
        <span className="note-icon">ℹ️</span>
        <span className="note-text">
          Статистика обновляется каждые 10 секунд
        </span>
      </div>
    </div>
  );
};

export default PredictionStats;
