import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNotifications } from '../../context/NotificationContext';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { validateMatchData, validateFileUpload } from '../../utils/validation';
import '../../styles/AdminPredictorPanel.css';

const AdminPredictorPanel = () => {
  const { showToast } = useNotifications();
  const { handleError, handleSuccess } = useErrorHandler();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [showResultsForm, setShowResultsForm] = useState(null);
  const [matchStats, setMatchStats] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

  // Форма создания/редактирования матча
  const [matchForm, setMatchForm] = useState({
    game: 'dota2',
    team1Name: '',
    team2Name: '',
    startTime: '',
    predictionTypes: []
  });

  // Форма результатов драфта
  const [resultsForm, setResultsForm] = useState({
    firstBan: { team1: '', team2: '' },
    firstPick: { team1: '', team2: '' },
    mostBanned: '',
    picks: { team1: [], team2: [] }
  });

  // Форма для добавления типа предсказания
  const [predictionTypeForm, setPredictionTypeForm] = useState({
    type: '',
    options: []
  });

  // Форма для добавления опции
  const [optionInput, setOptionInput] = useState('');

  // Загрузка логотипов
  const [uploadingLogo, setUploadingLogo] = useState({ matchId: null, team: null });

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/predictor/matches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMatches(response.data);
      setError('');
    } catch (err) {
      setError('Ошибка загрузки матчей');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchStats = async (matchId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/predictor/stats/${matchId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMatchStats(prev => ({ ...prev, [matchId]: response.data.stats }));
    } catch (err) {
      console.error('Ошибка загрузки статистики:', err);
    }
  };

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    
    const matchData = {
      game: matchForm.game,
      team1: { name: matchForm.team1Name },
      team2: { name: matchForm.team2Name },
      startTime: matchForm.startTime,
      predictionTypes: matchForm.predictionTypes
    };

    // Validate match data
    const validation = validateMatchData(matchData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0];
      showToast(firstError, 'error');
      return;
    }

    setValidationErrors({});

    try {
      const token = localStorage.getItem('token');

      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/predictor/matches`,
        matchData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Матч успешно создан');
      handleSuccess('Матч успешно создан');
      setShowCreateForm(false);
      resetMatchForm();
      fetchMatches();
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || 'Ошибка создания матча';
      setError(errorMsg);
      handleError(err, errorMsg);
    }
  };

  const handleUpdateMatch = async (e) => {
    e.preventDefault();
    
    const matchData = {
      game: matchForm.game,
      team1: { name: matchForm.team1Name },
      team2: { name: matchForm.team2Name },
      startTime: matchForm.startTime,
      predictionTypes: matchForm.predictionTypes
    };

    // Validate match data
    const validation = validateMatchData(matchData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0];
      showToast(firstError, 'error');
      return;
    }

    setValidationErrors({});

    try {
      const token = localStorage.getItem('token');

      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/predictor/matches/${editingMatch}`,
        matchData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Матч успешно обновлен');
      handleSuccess('Матч успешно обновлен');
      setEditingMatch(null);
      resetMatchForm();
      fetchMatches();
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || 'Ошибка обновления матча';
      setError(errorMsg);
      handleError(err, errorMsg);
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот матч?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/predictor/matches/${matchId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Матч успешно удален');
      showToast('Матч успешно удален', 'success');
      fetchMatches();
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || 'Ошибка удаления матча';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const handleLogoUpload = async (matchId, team, file) => {
    if (!file) return;

    // Validate file
    const validation = validateFileUpload(file);
    if (!validation.isValid) {
      showToast(validation.error, 'error');
      return;
    }

    try {
      setUploadingLogo({ matchId, team });
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('logo', file);
      formData.append('team', team);

      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/predictor/matches/${matchId}/logo`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      const successMsg = `Логотип ${team === 'team1' ? 'команды 1' : 'команды 2'} успешно загружен`;
      setSuccess(successMsg);
      handleSuccess(successMsg);
      fetchMatches();
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || 'Ошибка загрузки логотипа';
      setError(errorMsg);
      handleError(err, errorMsg);
    } finally {
      setUploadingLogo({ matchId: null, team: null });
    }
  };

  const handleSetResults = async (matchId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/predictor/matches/${matchId}/results`,
        { results: resultsForm },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Результаты драфта успешно установлены');
      showToast('Результаты драфта установлены! Награды распределены между победителями', 'success', 7000);
      setShowResultsForm(null);
      resetResultsForm();
      fetchMatches();
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || 'Ошибка установки результатов';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const startEditMatch = (match) => {
    setEditingMatch(match._id);
    setMatchForm({
      game: match.game,
      team1Name: match.team1.name,
      team2Name: match.team2.name,
      startTime: new Date(match.startTime).toISOString().slice(0, 16),
      predictionTypes: match.predictionTypes || []
    });
    setShowCreateForm(true);
  };

  const resetMatchForm = () => {
    setMatchForm({
      game: 'dota2',
      team1Name: '',
      team2Name: '',
      startTime: '',
      predictionTypes: []
    });
  };

  const resetResultsForm = () => {
    setResultsForm({
      firstBan: { team1: '', team2: '' },
      firstPick: { team1: '', team2: '' },
      mostBanned: '',
      picks: { team1: [], team2: [] }
    });
  };

  const addPredictionType = () => {
    if (!predictionTypeForm.type || predictionTypeForm.options.length === 0) {
      setError('Укажите тип предсказания и добавьте хотя бы один вариант');
      return;
    }

    setMatchForm(prev => ({
      ...prev,
      predictionTypes: [
        ...prev.predictionTypes,
        {
          type: predictionTypeForm.type,
          options: predictionTypeForm.options,
          rewardPool: 0,
          betsCount: 0,
          closed: false
        }
      ]
    }));

    setPredictionTypeForm({ type: '', options: [] });
    setError('');
  };

  const removePredictionType = (index) => {
    setMatchForm(prev => ({
      ...prev,
      predictionTypes: prev.predictionTypes.filter((_, i) => i !== index)
    }));
  };

  const addOption = () => {
    if (!optionInput.trim()) return;

    setPredictionTypeForm(prev => ({
      ...prev,
      options: [...prev.options, optionInput.trim()]
    }));
    setOptionInput('');
  };

  const removeOption = (index) => {
    setPredictionTypeForm(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusLabel = (status) => {
    const labels = {
      upcoming: 'Предстоящий',
      live: 'В эфире',
      draft_phase: 'Фаза драфта',
      completed: 'Завершен',
      cancelled: 'Отменен'
    };
    return labels[status] || status;
  };

  const getGameLabel = (game) => {
    return game === 'dota2' ? 'Dota 2' : 'CS2';
  };

  if (loading) {
    return <div className="admin-predictor-panel">Загрузка...</div>;
  }

  return (
    <div className="admin-predictor-panel">
      <h1>Управление Pick Predictor</h1>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
          <button onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      <div className="panel-actions">
        <button
          className="add-player-btn"
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setEditingMatch(null);
            resetMatchForm();
          }}
        >
          {showCreateForm ? 'Отменить' : '+ Создать матч'}
        </button>
      </div>

      {showCreateForm && (
        <div className="match-form-container">
          <h2>{editingMatch ? 'Редактировать матч' : 'Создать новый матч'}</h2>
          <form onSubmit={editingMatch ? handleUpdateMatch : handleCreateMatch} className="player-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Игра</label>
                <select
                  value={matchForm.game}
                  onChange={(e) => setMatchForm({ ...matchForm, game: e.target.value })}
                  required
                >
                  <option value="dota2">Dota 2</option>
                  <option value="cs2">CS2</option>
                </select>
              </div>

              <div className="form-group">
                <label>Время начала</label>
                <input
                  type="datetime-local"
                  value={matchForm.startTime}
                  onChange={(e) => setMatchForm({ ...matchForm, startTime: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Название команды 1</label>
                <input
                  type="text"
                  value={matchForm.team1Name}
                  onChange={(e) => setMatchForm({ ...matchForm, team1Name: e.target.value })}
                  placeholder="Например: Team Spirit"
                  required
                />
              </div>

              <div className="form-group">
                <label>Название команды 2</label>
                <input
                  type="text"
                  value={matchForm.team2Name}
                  onChange={(e) => setMatchForm({ ...matchForm, team2Name: e.target.value })}
                  placeholder="Например: OG"
                  required
                />
              </div>
            </div>

            <div className="prediction-types-section">
              <h3>Типы предсказаний</h3>

              {matchForm.predictionTypes.length > 0 && (
                <div className="admin-item-list">
                  {matchForm.predictionTypes.map((predType, index) => (
                    <div key={index} className="admin-list-item">
                      <div>
                        <strong>{predType.type}</strong>
                        <span> ({predType.options.length} вариантов)</span>
                      </div>
                      <button
                        type="button"
                        className="delete-item-btn"
                        onClick={() => removePredictionType(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="add-prediction-type-form">
                <div className="form-group">
                  <label>Тип предсказания</label>
                  <input
                    type="text"
                    value={predictionTypeForm.type}
                    onChange={(e) => setPredictionTypeForm({ ...predictionTypeForm, type: e.target.value })}
                    placeholder="Например: first_ban_team1"
                  />
                </div>

                <div className="form-group">
                  <label>Варианты ответов</label>
                  <div className="options-input">
                    <input
                      type="text"
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      placeholder="Введите вариант (герой/агент)"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                    />
                    <button type="button" className="add-item-btn" onClick={addOption}>
                      Добавить
                    </button>
                  </div>

                  {predictionTypeForm.options.length > 0 && (
                    <div className="options-list">
                      {predictionTypeForm.options.map((option, index) => (
                        <span key={index} className="option-tag">
                          {option}
                          <button type="button" onClick={() => removeOption(index)}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button type="button" className="save-btn" onClick={addPredictionType}>
                  Добавить тип предсказания
                </button>
              </div>
            </div>

            <div className="form-buttons">
              <button type="submit" className="save-btn">
                {editingMatch ? 'Сохранить изменения' : 'Создать матч'}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingMatch(null);
                  resetMatchForm();
                }}
              >
                Отменить
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="matches-list">
        <h2>Список матчей</h2>
        {matches.length === 0 ? (
          <p className="no-matches">Нет созданных матчей</p>
        ) : (
          matches.map((match) => (
            <div key={match._id} className="match-item-admin">
              <div className="match-header">
                <div className="match-info">
                  <h3>
                    {match.team1.name} vs {match.team2.name}
                  </h3>
                  <div className="match-meta">
                    <span className="game-badge">{getGameLabel(match.game)}</span>
                    <span className={`status-badge status-${match.status}`}>
                      {getStatusLabel(match.status)}
                    </span>
                    <span className="match-time">{formatDate(match.startTime)}</span>
                  </div>
                </div>

                <div className="match-actions">
                  <button className="edit-btn" onClick={() => startEditMatch(match)}>
                    Редактировать
                  </button>
                  <button className="delete-btn" onClick={() => handleDeleteMatch(match._id)}>
                    Удалить
                  </button>
                </div>
              </div>

              <div className="match-details">
                <div className="team-logos-section">
                  <div className="team-logo-upload">
                    <h4>Логотип команды 1</h4>
                    {match.team1.logoUrl && (
                      <img src={match.team1.logoUrl} alt={match.team1.name} className="team-logo-preview" />
                    )}
                    <label className="file-input-label">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                        onChange={(e) => handleLogoUpload(match._id, 'team1', e.target.files[0])}
                        disabled={uploadingLogo.matchId === match._id && uploadingLogo.team === 'team1'}
                      />
                      {uploadingLogo.matchId === match._id && uploadingLogo.team === 'team1'
                        ? 'Загрузка...'
                        : 'Загрузить логотип'}
                    </label>
                  </div>

                  <div className="team-logo-upload">
                    <h4>Логотип команды 2</h4>
                    {match.team2.logoUrl && (
                      <img src={match.team2.logoUrl} alt={match.team2.name} className="team-logo-preview" />
                    )}
                    <label className="file-input-label">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                        onChange={(e) => handleLogoUpload(match._id, 'team2', e.target.files[0])}
                        disabled={uploadingLogo.matchId === match._id && uploadingLogo.team === 'team2'}
                      />
                      {uploadingLogo.matchId === match._id && uploadingLogo.team === 'team2'
                        ? 'Загрузка...'
                        : 'Загрузить логотип'}
                    </label>
                  </div>
                </div>

                {match.predictionTypes && match.predictionTypes.length > 0 && (
                  <div className="prediction-types-list">
                    <h4>Типы предсказаний ({match.predictionTypes.length})</h4>
                    {match.predictionTypes.map((predType, index) => (
                      <div key={index} className="prediction-type-item">
                        <strong>{predType.type}</strong>
                        <span> - {predType.options.length} вариантов</span>
                        <span> - Ставок: {predType.betsCount || 0}</span>
                        <span> - Пул: {predType.rewardPool || 0} монет</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="match-admin-actions">
                  {match.status !== 'completed' && match.status !== 'cancelled' && (
                    <button
                      className="save-btn"
                      onClick={() => {
                        setShowResultsForm(match._id);
                        resetResultsForm();
                      }}
                    >
                      Установить результаты драфта
                    </button>
                  )}

                  <button
                    className="edit-btn"
                    onClick={() => {
                      if (matchStats[match._id]) {
                        setMatchStats(prev => {
                          const newStats = { ...prev };
                          delete newStats[match._id];
                          return newStats;
                        });
                      } else {
                        fetchMatchStats(match._id);
                      }
                    }}
                  >
                    {matchStats[match._id] ? 'Скрыть статистику' : 'Показать статистику'}
                  </button>
                </div>

                {matchStats[match._id] && (
                  <div className="match-stats">
                    <h4>Статистика ставок</h4>
                    {matchStats[match._id].map((stat, index) => (
                      <div key={index} className="stat-item">
                        <h5>{stat.type}</h5>
                        <p>Всего ставок: {stat.totalBets}</p>
                        <p>Участников: {stat.participants}</p>
                        <p>Общая сумма: {stat.totalAmount} монет</p>
                        <div className="stat-options">
                          {stat.options.map((option, optIndex) => (
                            <div key={optIndex} className="stat-option">
                              <span>{option.choice}</span>
                              <span>{option.percentage}%</span>
                              <span>({option.totalAmount} монет)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {showResultsForm === match._id && (
                  <div className="results-form">
                    <h4>Установить результаты драфта</h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Первый бан команды 1</label>
                        <input
                          type="text"
                          value={resultsForm.firstBan.team1}
                          onChange={(e) =>
                            setResultsForm({
                              ...resultsForm,
                              firstBan: { ...resultsForm.firstBan, team1: e.target.value }
                            })
                          }
                          placeholder="Название героя/агента"
                        />
                      </div>

                      <div className="form-group">
                        <label>Первый бан команды 2</label>
                        <input
                          type="text"
                          value={resultsForm.firstBan.team2}
                          onChange={(e) =>
                            setResultsForm({
                              ...resultsForm,
                              firstBan: { ...resultsForm.firstBan, team2: e.target.value }
                            })
                          }
                          placeholder="Название героя/агента"
                        />
                      </div>

                      <div className="form-group">
                        <label>Первый пик команды 1</label>
                        <input
                          type="text"
                          value={resultsForm.firstPick.team1}
                          onChange={(e) =>
                            setResultsForm({
                              ...resultsForm,
                              firstPick: { ...resultsForm.firstPick, team1: e.target.value }
                            })
                          }
                          placeholder="Название героя/агента"
                        />
                      </div>

                      <div className="form-group">
                        <label>Первый пик команды 2</label>
                        <input
                          type="text"
                          value={resultsForm.firstPick.team2}
                          onChange={(e) =>
                            setResultsForm({
                              ...resultsForm,
                              firstPick: { ...resultsForm.firstPick, team2: e.target.value }
                            })
                          }
                          placeholder="Название героя/агента"
                        />
                      </div>

                      <div className="form-group full-width">
                        <label>Наиболее забаненный герой/агент</label>
                        <input
                          type="text"
                          value={resultsForm.mostBanned}
                          onChange={(e) => setResultsForm({ ...resultsForm, mostBanned: e.target.value })}
                          placeholder="Название героя/агента"
                        />
                      </div>
                    </div>

                    <div className="form-buttons">
                      <button className="save-btn" onClick={() => handleSetResults(match._id)}>
                        Сохранить результаты
                      </button>
                      <button className="cancel-btn" onClick={() => setShowResultsForm(null)}>
                        Отменить
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminPredictorPanel;
