import { render, screen, waitFor } from '@testing-library/react';
import PredictionStats from './PredictionStats';
import api from '../../services/api';

// Mock dependencies
jest.mock('../../services/api');

const mockStats = {
  stats: [
    {
      type: 'first_ban_team1',
      participants: 25,
      totalAmount: 5000,
      totalBets: 30,
      options: [
        { choice: 'Invoker', percentage: 45.5, betsCount: 15, totalAmount: 2275 },
        { choice: 'Pudge', percentage: 34.5, betsCount: 10, totalAmount: 1725 },
        { choice: 'Mirana', percentage: 20.0, betsCount: 5, totalAmount: 1000 }
      ]
    }
  ]
};

describe('PredictionStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('displays statistics correctly', async () => {
    api.get.mockResolvedValue({ data: mockStats });

    render(<PredictionStats matchId="match1" predictionType="first_ban_team1" />);

    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText(/5,000/)).toBeInTheDocument();
      expect(screen.getByText('Invoker')).toBeInTheDocument();
      expect(screen.getByText('45.5%')).toBeInTheDocument();
    });
  });

  test('shows loading state initially', () => {
    api.get.mockImplementation(() => new Promise(() => {}));

    render(<PredictionStats matchId="match1" predictionType="first_ban_team1" />);

    expect(screen.getByText('Загрузка статистики...')).toBeInTheDocument();
  });

  test('auto-updates statistics every 10 seconds', async () => {
    api.get.mockResolvedValue({ data: mockStats });

    render(<PredictionStats matchId="match1" predictionType="first_ban_team1" />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(1);
    });

    jest.advanceTimersByTime(10000);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });

  test('shows empty state when no stats available', async () => {
    api.get.mockResolvedValue({ data: { stats: [] } });

    render(<PredictionStats matchId="match1" predictionType="first_ban_team1" />);

    await waitFor(() => {
      expect(screen.getByText('Статистика недоступна')).toBeInTheDocument();
    });
  });
});
