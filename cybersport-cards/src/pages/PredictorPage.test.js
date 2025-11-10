import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PredictorPage from './PredictorPage';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useErrorHandler } from '../hooks/useErrorHandler';

// Mock dependencies
jest.mock('../services/api');
jest.mock('../hooks/useErrorHandler');

const mockMatches = [
  {
    _id: '1',
    game: 'dota2',
    team1: { name: 'Team Spirit', logoUrl: '/logo1.png' },
    team2: { name: 'OG', logoUrl: '/logo2.png' },
    startTime: new Date(Date.now() + 3600000).toISOString(),
    status: 'upcoming',
    predictionTypes: []
  },
  {
    _id: '2',
    game: 'cs2',
    team1: { name: 'Navi', logoUrl: '/logo3.png' },
    team2: { name: 'Faze', logoUrl: '/logo4.png' },
    startTime: new Date(Date.now() + 7200000).toISOString(),
    status: 'upcoming',
    predictionTypes: []
  }
];

const mockAuthContext = {
  user: { _id: 'user1', nickname: 'TestUser', coins: 1000 },
  token: 'test-token',
  loading: false
};

describe('PredictorPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useErrorHandler.mockReturnValue({
      handleError: jest.fn()
    });
  });

  const renderWithAuth = (component, authValue = mockAuthContext) => {
    return render(
      <AuthContext.Provider value={authValue}>
        {component}
      </AuthContext.Provider>
    );
  };

  test('renders match list successfully', async () => {
    api.get.mockResolvedValue({ data: mockMatches });

    renderWithAuth(<PredictorPage />);

    await waitFor(() => {
      expect(screen.getByText('Team Spirit')).toBeInTheDocument();
      expect(screen.getByText('OG')).toBeInTheDocument();
    });
  });

  test('filters matches by game', async () => {
    api.get.mockResolvedValue({ data: mockMatches });

    renderWithAuth(<PredictorPage />);

    await waitFor(() => {
      expect(screen.getByText('Team Spirit')).toBeInTheDocument();
    });

    const dota2Button = screen.getByText('Dota 2');
    await userEvent.click(dota2Button);

    expect(screen.getByText('Team Spirit')).toBeInTheDocument();
    expect(screen.queryByText('Navi')).not.toBeInTheDocument();
  });

  test('shows empty state when no matches', async () => {
    api.get.mockResolvedValue({ data: [] });

    renderWithAuth(<PredictorPage />);

    await waitFor(() => {
      expect(screen.getByText('Нет доступных матчей')).toBeInTheDocument();
    });
  });
});
