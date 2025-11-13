import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PredictorPage from './PredictorPage';
import api, { retryRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useErrorHandler } from '../hooks/useErrorHandler';

// Mock dependencies
jest.mock('../services/api');
jest.mock('../hooks/useErrorHandler');
jest.mock('../context/AuthContext');
jest.mock('../services/logoService', () => ({
  preloadLogos: jest.fn().mockResolvedValue()
}));

// Mock retryRequest function
jest.mock('../services/api', () => ({
  get: jest.fn(),
  retryRequest: jest.fn()
}));

const mockMatches = [
  {
    _id: '1',
    game: 'dota2',
    team1: { _id: 'team1', name: 'Team Spirit', logoUrl: '/logo1.png' },
    team2: { _id: 'team2', name: 'OG', logoUrl: '/logo2.png' },
    startTime: new Date(Date.now() + 3600000).toISOString(),
    status: 'upcoming',
    predictionTypes: []
  },
  {
    _id: '2',
    game: 'cs2',
    team1: { _id: 'team3', name: 'Navi', logoUrl: '/logo3.png' },
    team2: { _id: 'team4', name: 'Faze', logoUrl: '/logo4.png' },
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
    useAuth.mockReturnValue(mockAuthContext);
  });

  test('renders match list successfully', async () => {
    retryRequest.mockResolvedValue({ data: mockMatches });

    render(<PredictorPage />);

    await waitFor(() => {
      expect(screen.getByText('Team Spirit')).toBeInTheDocument();
      expect(screen.getByText('OG')).toBeInTheDocument();
    });
  });

  test('filters matches by game', async () => {
    retryRequest.mockResolvedValue({ data: mockMatches });

    render(<PredictorPage />);

    await waitFor(() => {
      expect(screen.getByText('Team Spirit')).toBeInTheDocument();
    });

    const dota2Button = screen.getByText('Dota 2');
    await userEvent.click(dota2Button);

    expect(screen.getByText('Team Spirit')).toBeInTheDocument();
    expect(screen.queryByText('Navi')).not.toBeInTheDocument();
  });

  test('shows empty state when no matches', async () => {
    retryRequest.mockResolvedValue({ data: [] });

    render(<PredictorPage />);

    await waitFor(() => {
      expect(screen.getByText('Нет доступных матчей')).toBeInTheDocument();
    });
  });
});
