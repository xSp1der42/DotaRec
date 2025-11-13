import React, { useState, useEffect, useMemo } from 'react';
import api, { retryRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useErrorHandler } from '../hooks/useErrorHandler';
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

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await retryRequest(
        () => api.get('/api/predictor/matches'),
        2, // Max 2 retries
        1000 // 1 second delay
      );
      
      setMatches(data);

      // Preload team logos for better performance
      if (data && data.length > 0) {
        const teamIds = [];
        data.forEach(match => {
          if (match.team1?._id) teamIds.push(match.team1._id);
          if (match.team2?._id) teamIds.push(match.team2._id);
        });
        
        // Preload logos asynchronously without blocking UI
        logoService.preloadLogos(teamIds, 'large').catch(err => {
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

  const handleRetry = () => {
    fetchMatches();
  };

  // Filter and sort matches
  const filteredAndSortedMatches = useMemo(() => {
    let filtered = [...matches];

    // Filter by game
    if (filterGame !== 'all') {
      filtered = filtered.filter(match => match.game === filterGame);
    }

    // Sort by start time (ascending)
    filtered.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    return filtered;
  }, [matches, filterGame]);

  // Get game display name
  const getGameName = (game) => {
    return game === 'dota2' ? 'Dota 2' : game === 'cs2' ? 'CS2' : game;
  };

  // Handle match click
  const handleMatchClick = (matchId) => {
    window.location.href = `/predictor/match/${matchId}`;
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
          <h1>Пикем-предиктор</h1>
          <p className="predictor-description">
            Предсказывайте результаты драфта и выигрывайте награды
          </p>
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
          <label>Игра:</label>
          <div className="game-filter-buttons">
            <button
              className={`game-filter-btn ${filterGame === 'all' ? 'active' : ''}`}
              onClick={() => setFilterGame('all')}
            >
              Все игры
            </button>
            <button
              className={`game-filter-btn ${filterGame === 'dota2' ? 'active' : ''}`}
              onClick={() => setFilterGame('dota2')}
            >
              Dota 2
            </button>
            <button
              className={`game-filter-btn ${filterGame === 'cs2' ? 'active' : ''}`}
              onClick={() => setFilterGame('cs2')}
            >
              CS2
            </button>
          </div>
        </div>
      </div>

      {filteredAndSortedMatches.length === 0 ? (
        <EmptyState
          icon="🎮"
          title="Нет доступных матчей"
          description={
            filterGame !== 'all'
              ? `Нет доступных матчей для ${getGameName(filterGame)}.`
              : 'Нет доступных матчей для предсказаний.'
          }
        />
      ) : (
        <div className="matches-grid">
          {filteredAndSortedMatches.map((match) => (
            <MatchCard
              key={match._id}
              match={match}
              onClick={handleMatchClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PredictorPage;
