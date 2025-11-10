import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PredictionForm from './PredictionForm';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { useErrorHandler } from '../../hooks/useErrorHandler';

// Mock dependencies
jest.mock('../../services/api');
jest.mock('../../hooks/useErrorHandler');

const mockMatch = {
  _id: 'match1',
  game: 'dota2',
  team1: { name: 'Team Spirit' },
  team2: { name: 'OG' },
  startTime: new Date(Date.now() + 3600000).toISOString()
};

const mockPredictionType = {
  type: 'first_ban_team1',
  options: ['Invoker', 'Pudge', 'Mirana']
};

const mockAuthContext = {
  user: { _id: 'user1', nickname: 'TestUser', coins: 1000 },
  updateUser: jest.fn()
};

describe('PredictionForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useErrorHandler.mockReturnValue({
      handleError: jest.fn(),
      handleSuccess: jest.fn()
    });
  });

  const renderWithAuth = (component, authValue = mockAuthContext) => {
    return render(
      <AuthContext.Provider value={authValue}>
        {component}
      </AuthContext.Provider>
    );
  };

  test('renders form with prediction options', () => {
    renderWithAuth(
      <PredictionForm
        match={mockMatch}
        predictionType={mockPredictionType}
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText('Invoker')).toBeInTheDocument();
    expect(screen.getByText('Pudge')).toBeInTheDocument();
    expect(screen.getByText('Mirana')).toBeInTheDocument();
  });

  test('validates bet amount correctly', async () => {
    renderWithAuth(
      <PredictionForm
        match={mockMatch}
        predictionType={mockPredictionType}
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const betInput = screen.getByPlaceholderText('10 - 10,000');
    
    await userEvent.type(betInput, '5');
    expect(screen.getByText(/Минимальная сумма ставки/i)).toBeInTheDocument();

    await userEvent.clear(betInput);
    await userEvent.type(betInput, '15000');
    expect(screen.getByText(/Максимальная сумма ставки/i)).toBeInTheDocument();
  });

  test('submits bet successfully', async () => {
    const mockOnSuccess = jest.fn();
    api.get.mockResolvedValue({ 
      data: { stats: [{ type: 'first_ban_team1', options: [{ option: 'Invoker', odds: 2.5 }] }] }
    });
    api.post.mockResolvedValue({ data: { _id: 'bet1' } });

    renderWithAuth(
      <PredictionForm
        match={mockMatch}
        predictionType={mockPredictionType}
        onSuccess={mockOnSuccess}
        onCancel={jest.fn()}
      />
    );

    const invokerButton = screen.getByText('Invoker');
    await userEvent.click(invokerButton);

    const betInput = screen.getByPlaceholderText('10 - 10,000');
    await userEvent.type(betInput, '100');

    const submitButton = screen.getByText('Сделать ставку');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/predictor/bets', expect.objectContaining({
        matchId: 'match1',
        predictions: expect.arrayContaining([
          expect.objectContaining({
            type: 'first_ban_team1',
            choice: 'Invoker',
            betAmount: 100
          })
        ])
      }));
    });
  });
});
