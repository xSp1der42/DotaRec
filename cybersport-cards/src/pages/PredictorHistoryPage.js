import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { retryRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useErrorHandler } from '../hooks/useErrorHandler';
import ErrorDisplay, { LoadingState, EmptyState } from '../components/shared/ErrorBoundary';
import '../styles/PredictorHistoryPage.css';

const PredictorHistoryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();

  const [bets, setBets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filterGame, setFilterGame] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBets, setTotalBets] = useState(0);

  const limit = 20;

  // Fetch history with filters
  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit,
      };

      if (filterGame !== 'all') {
        params.game = filterGame;
      }

      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      if (filterStartDate) {
        params.startDate = filterStartDate;
      }

      if (filterEndDate) {
        params.endDate = filterEndDate;
      }

      const { data } = await retryRequest(
        () => api.get('/api/predictor/history', { params }),
        2,
        1000
      );

      setBets(data.bets);
      setStats(data.stats);
      setTotalPages(data.pagination.pages);
      setTotalBets(data.pagination.total);
    } catch (err) {
      console.error('Error fetching prediction history:', err);
      setError(err);
      handleError(err, 'Не удалось загрузить историю предсказаний');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterGame, filterStatus, filterStartDate, filterEndDate, handleError]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchHistory();
  }, [user, navigate, fetchHistory]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterGame, filterStatus, filterStartDate, filterEndDate]);

  // Get game display name
  const getGameName = (game) => {
    return game === 'dota2' ? 'Dota 2' : game === 'cs2' ? 'CS2' : game;
  };

  // Get status display text and class
  const getStatusInfo = (status) => {
    switch (status) {
      case 'won':
        return { text: 'Выигрыш', className: 'status-won' };
      case 'lost':
        return { text: 'Проигрыш', className: 'status-lost' };
      case 'pending':
        return { text: 'Ожидание', className: 'status-pending' };
      default:
        return { text: status, className: '' };
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilterGame('all');
    setFilterStatus('all');
    setFilterStartDate('');
    setFilterEndDate('');
    setCurrentPage(1);
  };

  if (loading && bets.length === 0) {
    return <LoadingState message="Загрузка истории предсказаний..." />;
  }

  if (error && bets.length === 0) {
    return (
      <div className="predictor-history-page">
        <div className="history-header">
          <button onClick={() => navigate('/predictor')} className="back-button">
            ← Назад к предсказаниям
          </button>
          <h1>История предсказаний</h1>
        </div>
        <ErrorDisplay error={error} onRetry={fetchHistory} />
      </div>
    );
  }

  return (
    <div className="predictor-history-page">
      <div className="history-header">
        <button onClick={() => navigate('/predictor')} className="back-button">
          ← Назад к предсказаниям
        </button>
        <h1>История предсказаний</h1>
      </div>

      {/* User Statistics */}
      {stats && (
        <div className="user-stats-section">
          <h2>Общая статистика</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Всего предсказаний</div>
              <div className="stat-value">{stats.totalPredictions}</div>
            </div>
            <div className="stat-card stat-success">
              <div className="stat-label">Выигрышей</div>
              <div className="stat-value">{stats.totalWins}</div>
            </div>
            <div className="stat-card stat-loss">
              <div className="stat-label">Проигрышей</div>
              <div className="stat-value">{stats.totalLosses}</div>
            </div>
            <div className="stat-card stat-pending">
              <div className="stat-label">Ожидают результата</div>
              <div className="stat-value">{stats.totalPending}</div>
            </div>
            <div className="stat-card stat-rate">
              <div className="stat-label">Процент успеха</div>
              <div className="stat-value">{stats.successRate}%</div>
            </div>
            <div className={`stat-card stat-profit ${stats.netProfit >= 0 ? 'positive' : 'negative'}`}>
              <div className="stat-label">Чистая прибыль</div>
              <div className="stat-value">
                {stats.netProfit >= 0 ? '+' : ''}
                {stats.netProfit.toLocaleString('ru-RU')} монет
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="history-filters">
        <h3>Фильтры</h3>
        <div className="filters-row">
          <div className="filter-group">
            <label>Игра:</label>
            <select
              value={filterGame}
              onChange={(e) => setFilterGame(e.target.value)}
              className="filter-select"
            >
              <option value="all">Все игры</option>
              <option value="dota2">Dota 2</option>
              <option value="cs2">CS2</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Статус:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">Все статусы</option>
              <option value="won">Выигрыш</option>
              <option value="lost">Проигрыш</option>
              <option value="pending">Ожидание</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Дата от:</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="filter-date"
            />
          </div>

          <div className="filter-group">
            <label>Дата до:</label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="filter-date"
            />
          </div>

          <button onClick={handleClearFilters} className="clear-filters-button">
            Сбросить фильтры
          </button>
        </div>
      </div>

      {/* Bets List */}
      <div className="bets-section">
        <div className="bets-header">
          <h3>История ставок</h3>
          <div className="bets-count">
            Найдено: {totalBets} {totalBets === 1 ? 'ставка' : totalBets < 5 ? 'ставки' : 'ставок'}
          </div>
        </div>

        {bets.length === 0 ? (
          <EmptyState
            icon="📊"
            title="История предсказаний пуста"
            description="Сделайте свою первую ставку на предсказание драфта"
            action={
              <button onClick={() => navigate('/predictor')} className="go-to-predictor-button">
                Перейти к предсказаниям
              </button>
            }
          />
        ) : (
          <>
            <div className="bets-list">
              {bets.map((bet) => (
                <div key={bet._id} className="bet-history-card">
                  {/* Match Info */}
                  {bet.matchId && (
                    <div className="bet-match-info">
                      <div className="match-game-badge">
                        {getGameName(bet.matchId.game)}
                      </div>
                      <div className="match-teams">
                        <span className="team-name">{bet.matchId.team1.name}</span>
                        <span className="vs-text">vs</span>
                        <span className="team-name">{bet.matchId.team2.name}</span>
                      </div>
                      <div className="match-date">
                        {formatDate(bet.matchId.startTime)}
                      </div>
                    </div>
                  )}

                  {/* Predictions */}
                  <div className="bet-predictions">
                    {bet.predictions.map((pred, index) => {
                      const statusInfo = getStatusInfo(pred.status);
                      return (
                        <div key={index} className="prediction-item">
                          <div className="prediction-header">
                            <span className="prediction-type">
                              {getPredictionTypeName(pred.type)}
                            </span>
                            <span className={`prediction-status ${statusInfo.className}`}>
                              {statusInfo.text}
                            </span>
                          </div>
                          <div className="prediction-details">
                            <div className="prediction-choice">
                              <span className="detail-label">Выбор:</span>
                              <span className="detail-value">{pred.choice}</span>
                            </div>
                            <div className="prediction-bet">
                              <span className="detail-label">Ставка:</span>
                              <span className="detail-value">
                                {pred.betAmount.toLocaleString('ru-RU')} монет
                              </span>
                            </div>
                            {pred.odds && (
                              <div className="prediction-odds">
                                <span className="detail-label">Коэффициент:</span>
                                <span className="detail-value">{pred.odds.toFixed(2)}</span>
                              </div>
                            )}
                            {pred.status === 'won' && pred.reward > 0 && (
                              <div className="prediction-reward">
                                <span className="detail-label">Выигрыш:</span>
                                <span className="detail-value reward-amount">
                                  +{pred.reward.toLocaleString('ru-RU')} монет
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bet Summary */}
                  <div className="bet-summary">
                    <div className="summary-item">
                      <span className="summary-label">Общая ставка:</span>
                      <span className="summary-value">
                        {bet.totalBet.toLocaleString('ru-RU')} монет
                      </span>
                    </div>
                    {bet.totalReward > 0 && (
                      <div className="summary-item">
                        <span className="summary-label">Общий выигрыш:</span>
                        <span className="summary-value reward-total">
                          +{bet.totalReward.toLocaleString('ru-RU')} монет
                        </span>
                      </div>
                    )}
                    <div className="bet-date">
                      Размещена: {formatDate(bet.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  ← Предыдущая
                </button>
                <div className="pagination-info">
                  Страница {currentPage} из {totalPages}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  Следующая →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PredictorHistoryPage;
