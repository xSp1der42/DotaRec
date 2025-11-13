// cybersport-cards/src/pages/PredictorPage.js
import React, { useState, useEffect, useMemo } from 'react';
import api, { retryRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useErrorHandler } from '../hooks/useErrorHandler';
// НОВОЕ: Импортируем нашу новую карточку
import MatchCard from '../components/predictor/MatchCard';
import logoService from '../services/logoService';
import ErrorDisplay, { LoadingState, EmptyState } from '../components/shared/ErrorBoundary';
import '../styles/PredictorPage.css';

const PredictorPage = () => {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterGame, setFilterGame] = useState('all');

  // НОВОЕ: Функция для обогащения матчей данными об игроках
  const enrichMatchesWithPlayers = async (matchesData) => {
    const enrichedMatches = await Promise.all(
      matchesData.map(async (match) => {
        // Проверяем, есть ли в матче MVP-предиктор
        const hasMvpPrediction = match.predictionTypes.some(p => p.type === 'mvp');
        if (hasMvpPrediction && !match.players) {
          try {
            // Запрашиваем полные данные матча, которые теперь включают игроков
            const { data: detailedMatch } = await api.get(`/api/predictor/matches/${match._id}`);
            return detailedMatch;
          } catch (e) {
            console.error(`Failed to enrich match ${match._id} with players`, e);
            return match; // Возвращаем исходный матч в случае ошибки
          }
        }
        return match;
      })
    );
    return enrichedMatches;
  };

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await retryRequest(
        () => api.get('/api/predictor/matches', { params: { game: filterGame === 'all' ? undefined : filterGame } }),
        2, 1000
      );
      
      // Обогащаем матчи данными об игроках
      const enrichedData = await enrichMatchesWithPlayers(data);
      setMatches(enrichedData);

      if (data && data.length > 0) {
        const teamIds = new Set();
        data.forEach(match => {
          if (match.team1?._id) teamIds.add(match.team1._id);
          if (match.team2?._id) teamIds.add(match.team2._id);
        });
        logoService.preloadLogos(Array.from(teamIds), 'large').catch(err => {
          console.warn('Logo preloading failed:', err);
        });
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError(err);
      handleError(err, 'Не удалось загрузить список матчей');
    } finally {
      setLoading(false);
    }
  };

  // Перезагружаем матчи при смене фильтра
  useEffect(() => {
    fetchMatches();
  }, [filterGame]); // Зависимость от filterGame

  const handleRetry = () => {
    fetchMatches();
  };

  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [matches]);

  const getGameName = (game) => {
    return game === 'dota2' ? 'Dota 2' : game === 'cs2' ? 'CS2' : game;
  };

  if (loading) {
    return <LoadingState message="Загрузка матчей..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={handleRetry} />;
  }

  return (
    <div className="predictor-page">
      <div className="predictor-header">
        <div className="predictor-title-section">
          <h1>Предикт лига</h1>
        </div>
        {user && (
          <button 
            className="history-link-button"
            onClick={() => window.location.href = '/predictor/history'}
          >
            📊 История предсказаний
          </button>
        )}
      </div>

      <div className="predictor-filters">
        <div className="filter-group">
          <div className="game-filter-buttons">
            <button className={`game-filter-btn ${filterGame === 'all' ? 'active' : ''}`} onClick={() => setFilterGame('all')}>Все</button>
            <button className={`game-filter-btn ${filterGame === 'dota2' ? 'active' : ''}`} onClick={() => setFilterGame('dota2')}>Dota 2</button>
            <button className={`game-filter-btn ${filterGame === 'cs2' ? 'active' : ''}`} onClick={() => setFilterGame('cs2')}>CS2</button>
          </div>
        </div>
      </div>

      {sortedMatches.length === 0 ? (
        <EmptyState
          icon="🎮"
          title="Нет доступных матчей"
          description={filterGame !== 'all' ? `Нет активных матчей для ${getGameName(filterGame)}.` : 'Сейчас нет активных матчей для предсказаний.'}
        />
      ) : (
        <div className="matches-grid">
          {sortedMatches.map((match) => (
            <MatchCard key={match._id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PredictorPage;