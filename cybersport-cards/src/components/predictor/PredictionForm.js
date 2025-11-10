import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { 
  validateBetAmount, 
  validatePredictionSelection,
  sanitizeNumericInput 
} from '../../utils/validation';
import api, { retryRequest } from '../../services/api';
import '../../styles/PredictionForm.css';

const PredictionForm = ({ match, predictionType, onSuccess, onCancel }) => {
  const { user, updateUser } = useAuth();
  const { handleError, handleSuccess } = useErrorHandler();
  
  const [selectedOption, setSelectedOption] = useState('');
  const [betAmount, setBetAmount] = useState('');
  const [odds, setOdds] = useState(1.0);
  const [potentialWin, setPotentialWin] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);

  // Fetch current odds for the selected option
  useEffect(() => {
    const fetchOdds = async () => {
      if (!selectedOption || !match?._id) return;
      
      try {
        const { data } = await retryRequest(
          () => api.get(`/api/predictor/stats/${match._id}`),
          2,
          500
        );
        
        const typeStats = data.stats?.find(s => s.type === predictionType.type);
        
        if (typeStats) {
          const optionStats = typeStats.options?.find(o => o.option === selectedOption);
          setOdds(optionStats?.odds || 1.0);
        }
      } catch (err) {
        console.error('Error fetching odds:', err);
        // Use default odds if fetch fails (graceful degradation)
        setOdds(1.5);
      }
    };

    fetchOdds();
    
    // Update odds every 10 seconds
    const interval = setInterval(fetchOdds, 10000);
    return () => clearInterval(interval);
  }, [selectedOption, match?._id, predictionType.type]);

  // Calculate potential win whenever bet amount or odds change
  useEffect(() => {
    const amount = parseFloat(betAmount);
    if (!isNaN(amount) && amount > 0) {
      const potential = Math.floor(amount * odds);
      setPotentialWin(potential);
    } else {
      setPotentialWin(0);
    }
  }, [betAmount, odds]);

  // Handle bet amount change
  const handleBetAmountChange = (e) => {
    const value = sanitizeNumericInput(e.target.value);
    setBetAmount(value);
    
    // Validate
    const validation = validateBetAmount(value, user?.coins);
    setValidationError(validation.error || '');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate selection
    const selectionValidation = validatePredictionSelection(
      selectedOption, 
      predictionType.options
    );
    if (!selectionValidation.isValid) {
      setError(selectionValidation.error);
      return;
    }
    
    // Validate bet amount
    const amount = parseFloat(betAmount);
    const amountValidation = validateBetAmount(betAmount, user?.coins);
    if (!amountValidation.isValid || isNaN(amount)) {
      setError(amountValidation.error || 'Введите корректную сумму ставки');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const betData = {
        matchId: match._id,
        predictions: [{
          type: predictionType.type,
          choice: selectedOption,
          betAmount: amount
        }]
      };
      
      const { data } = await retryRequest(
        () => api.post('/api/predictor/bets', betData),
        1, // Only 1 retry for POST requests
        1000
      );
      
      // Update user balance
      if (user) {
        await updateUser({ coins: user.coins - amount });
      }
      
      // Show success toast
      handleSuccess(
        `Ставка принята! Потенциальный выигрыш: ${potentialWin.toLocaleString('ru-RU')} монет`
      );
      
      // Call success callback
      if (onSuccess) {
        onSuccess(data);
      }
      
      // Reset form
      setSelectedOption('');
      setBetAmount('');
      setError(null);
      setValidationError('');
      
    } catch (err) {
      console.error('Error placing bet:', err);
      setError(err.errorMessage || 'Не удалось разместить ставку');
      handleError(err);
      setIsRetrying(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle retry
  const handleRetry = () => {
    setIsRetrying(true);
    setError(null);
    handleSubmit({ preventDefault: () => {} });
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

  return (
    <div className="prediction-form-overlay" onClick={onCancel}>
      <div className="prediction-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="prediction-form-header">
          <h3>{getPredictionTypeName(predictionType.type)}</h3>
          <button className="close-button" onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="prediction-form">
          {/* Option Selection */}
          <div className="form-section">
            <label className="form-label">Выберите вариант:</label>
            <div className="options-selection">
              {predictionType.options?.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  className={`option-button ${selectedOption === option ? 'selected' : ''}`}
                  onClick={() => setSelectedOption(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Bet Amount Input */}
          <div className="form-section">
            <label className="form-label">Сумма ставки:</label>
            <div className="bet-amount-input-wrapper">
              <input
                type="text"
                className={`bet-amount-input ${validationError ? 'error' : ''}`}
                value={betAmount}
                onChange={handleBetAmountChange}
                placeholder="10 - 10,000"
                disabled={loading}
              />
              <span className="currency-label">монет</span>
            </div>
            {validationError && (
              <div className="validation-error">{validationError}</div>
            )}
            <div className="bet-limits">
              Минимум: 10 монет | Максимум: 10,000 монет
            </div>
          </div>

          {/* Current Balance */}
          {user && (
            <div className="balance-display">
              <span className="balance-label">Ваш баланс:</span>
              <span className="balance-value">
                {user.coins?.toLocaleString('ru-RU') || 0} монет
              </span>
            </div>
          )}

          {/* Odds and Potential Win */}
          {selectedOption && betAmount && !validationError && (
            <div className="prediction-summary">
              <div className="summary-row">
                <span className="summary-label">Текущий коэффициент:</span>
                <span className="summary-value odds-value">×{odds.toFixed(2)}</span>
              </div>
              <div className="summary-row highlight">
                <span className="summary-label">Потенциальный выигрыш:</span>
                <span className="summary-value win-value">
                  {potentialWin.toLocaleString('ru-RU')} монет
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{error}</span>
              {(error.includes('сети') || error.includes('ожидания')) && (
                <button 
                  type="button"
                  className="retry-small-button" 
                  onClick={handleRetry}
                  disabled={isRetrying}
                >
                  🔄 Повторить
                </button>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onCancel}
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={loading || !selectedOption || !betAmount || !!validationError}
            >
              {loading ? 'Размещение...' : 'Сделать ставку'}
            </button>
          </div>
        </form>

        {/* Info Note */}
        <div className="form-note">
          <span className="note-icon">ℹ️</span>
          Коэффициенты обновляются в реальном времени на основе распределения ставок
        </div>
      </div>
    </div>
  );
};

export default PredictionForm;
