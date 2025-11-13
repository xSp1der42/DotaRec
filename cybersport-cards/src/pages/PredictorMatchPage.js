import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { retryRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useErrorHandler } from '../hooks/useErrorHandler';
import PredictionForm from '../components/predictor/PredictionForm';
import PredictionStats from '../components/predictor/PredictionStats';
import TeamLogo from '../components/shared/TeamLogo';
import logoService from '../services/logoService';
import ErrorDisplay, { LoadingState } from '../components/shared/ErrorBoundary';
import '../styles/PredictorMatchPage.css';

const PredictorMatchPage = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeUntilClose, setTimeUntilClose] = useState(null);
  const [showBetForm, setShowBetForm] = useState(false);
  const [selectedPredictionType, setSelectedPredictionType] = useState(null);

  // Fetch match details
  const fetchMatchDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await retryRequest(
        () => api.get(`/api/predictor/matches/${matchId}`),
        2,
        1000
      );
      
      setMatch(data);

      // Preload team logos for the match
      if (data) {
        const teamIds = [];
        if (data.team1?._id) teamIds.push(data.team1._id);
        if (data.team2?._id) teamIds.push(data.team2._id);
        
        if (teamIds.length > 0) {
          logoService.preloadLogos(teamIds, 'large').catch(err => {
            console.warn('Logo preloading failed:', err);
          });
        }
      }
    } catch (err) {
      console.error('Error fetching match details:', err);
      setError(err);
      handleError(err, 'Не удалось загрузить данные матча');
    } finally {
      setLoading(false);
    }
  }, [matchId, handleError]);

  useEffect(() => {
    fetchMatchDetails();
  }, [fetchMatchDetails]);

  // Calculate time until betting closes (5 minutes before match start)
  useEffect(() => {
    if (!match) return;

    const updateTimer = () => {
      const now = new Date();
      const matchTime = new Date(match.startTime);
      const closeTime = new Date(matchTime.getTime() - 5 * 60 * 1000); // 5 minutes before
      const diffMs = closeTime - now;

      if (diffMs <= 0) {
        setTimeUntilClose('Прием ставок закрыт');
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeUntilClose(`${hours}ч ${minutes}м до закрытия ставок`);
      } else if (minutes > 0) {
        setTimeUntilClose(`${minutes}м ${seconds}с до закрытия ставок`);
      } else {
        setTimeUntilClose(`${seconds}с до закрытия ставок`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [match]);

  // Get game display name
  const getGameName = (game) => {
    return game === 'dota2' ? 'Dota 2' : game === 'cs2' ? 'CS2' : game;
  };

  // Format date and time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const dateOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    return {
      date: date.toLocaleDateString('ru-RU', dateOptions),
      time: date.toLocaleTimeString('ru-RU', timeOptions)
    };
  };

  // Check if betting is closed
  const isBettingClosed = () => {
    if (!match) return true;
    
    const now = new Date();
    const matchTime = new Date(match.startTime);
    const closeTime = new Date(matchTime.getTime() - 5 * 60 * 1000);
    
    return now >= closeTime || match.status !== 'upcoming';
  };

  // Get status display text
  const getStatusText = (status) => {
    switch (status) {
      case 'upcoming':
        return 'Ожидается';
      case 'live':
        return 'Идет матч';
      case 'draft_phase':
        return 'Идет драфт';
      case 'completed':
        return 'Завершен';
      case 'cancelled':
        return 'Отменен';
      default:
        return status;
    }
  };

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

  // Handle opening bet form
  const handlePlaceBet = (predType) => {
    setSelectedPredictionType(predType);
    setShowBetForm(true);
  };

  // Handle bet success
  const handleBetSuccess = () => {
    setShowBetForm(false);
    setSelectedPredictionType(null);
    
    // Refresh match data to update stats
    fetchMatchDetails();
  };

  // Handle bet cancel
  const handleBetCancel = () => {
    setShowBetForm(false);
    setSelectedPredictionType(null);
  };

  if (loading) {
    return <LoadingState message="Загрузка данных матча..." />;
  }

  if (error) {
    return (
      <div className="predictor-match-page">
        <button onClick={() => navigate('/predictor')} className="back-button">
          ← Назад к матчам
        </button>
        <ErrorDisplay error={error} onRetry={fetchMatchDetails} />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="predictor-match-page">
        <button onClick={() => navigate('/predictor')} className="back-button">
          ← Назад к матчам
        </button>
        <ErrorDisplay 
          error={{ errorMessage: 'Матч не найден' }} 
          onRetry={fetchMatchDetails}
        />
      </div>
    );
  }

  const { date, time } = formatDateTime(match.startTime);
  const bettingClosed = isBettingClosed();

  return (
    <div className="predictor-match-page">
      <button onClick={() => navigate('/predictor')} className="back-button">
        ← Назад к матчам
      </button>

      <div className="match-header">
        <div className="match-game-badge-large">
          {getGameName(match.game)}
        </div>
        
        <div className="match-status-badge">
          {getStatusText(match.status)}
        </div>
      </div>

      <div className="match-teams-section">
        <div className="team-info">
          <div className="team-logo-large">
            <TeamLogo
              teamId={match.team1._id}
              teamName={match.team1.name}
              size="large"
              showFallback={true}
              className="predictor-match-team-logo"
            />
          </div>
          <h2 className="team-name-large">{match.team1.name}</h2>
        </div>

        <div className="vs-divider-large">VS</div>

        <div className="team-info">
          <div className="team-logo-large">
            <TeamLogo
              teamId={match.team2._id}
              teamName={match.team2.name}
              size="large"
              showFallback={true}
              className="predictor-match-team-logo"
            />
          </div>
          <h2 className="team-name-large">{match.team2.name}</h2>
        </div>
      </div>

      <div className="match-time-section">
        <div className="match-date-large">{date}</div>
        <div className="match-time-large">{time}</div>
      </div>

      {!bettingClosed && (
        <div className="betting-timer">
          <div className="timer-icon">⏱️</div>
          <div className="timer-text">{timeUntilClose}</div>
        </div>
      )}

      {bettingClosed && match.status === 'upcoming' && (
        <div className="betting-closed-notice">
          Прием ставок закрыт
        </div>
      )}

      <div className="predictions-section">
        <h3>Доступные предсказания</h3>
        
        {!match.predictionTypes || match.predictionTypes.length === 0 ? (
          <p className="no-predictions-message">
            Для этого матча пока нет доступных предсказаний
          </p>
        ) : (
          <div className="prediction-types-list">
            {match.predictionTypes.map((predType, index) => (
              <div key={index} className="prediction-type-card">
                <h4 className="prediction-type-title">
                  {getPredictionTypeName(predType.type)}
                </h4>
                
                <div className="prediction-info">
                  <div className="info-item">
                    <span className="info-label">Пул наград:</span>
                    <span className="info-value">
                      {(predType.rewardPool || 0).toLocaleString('ru-RU')} монет
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Участников:</span>
                    <span className="info-value">{predType.betsCount || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Статус:</span>
                    <span className={`info-value ${predType.closed || bettingClosed ? 'closed' : 'open'}`}>
                      {predType.closed || bettingClosed ? 'Закрыто' : 'Открыто'}
                    </span>
                  </div>
                </div>

                {predType.options && predType.options.length > 0 && (
                  <div className="prediction-options">
                    <p className="options-label">Доступные варианты:</p>
                    <div className="options-grid">
                      {predType.options.map((option, optIndex) => (
                        <div key={optIndex} className="option-chip">
                          {option}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!bettingClosed && !predType.closed && user && (
                  <button 
                    className="place-bet-button"
                    onClick={() => handlePlaceBet(predType)}
                  >
                    Сделать ставку
                  </button>
                )}

                {/* Prediction Statistics */}
                <PredictionStats 
                  matchId={match._id} 
                  predictionType={predType.type}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {!user && (
        <div className="login-notice">
          <p>Войдите в аккаунт, чтобы делать ставки</p>
          <button onClick={() => navigate('/login')} className="login-button-notice">
            Войти
          </button>
        </div>
      )}

      {/* Prediction Form Modal */}
      {showBetForm && selectedPredictionType && (
        <PredictionForm
          match={match}
          predictionType={selectedPredictionType}
          onSuccess={handleBetSuccess}
          onCancel={handleBetCancel}
        />
      )}
    </div>
  );
};

export default PredictorMatchPage;
