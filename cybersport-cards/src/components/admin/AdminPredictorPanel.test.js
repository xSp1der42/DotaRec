import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminPredictorPanel from './AdminPredictorPanel';
import axios from 'axios';
import { NotificationContext } from '../../context/NotificationContext';
import { useErrorHandler } from '../../hooks/useErrorHandler';

// Mock dependencies
jest.mock('axios');
jest.mock('../../hooks/useErrorHandler');

const mockMatches = [
  {
    _id: 'match1',
    game: 'dota2',
    team1: { name: 'Team Spirit', logoUrl: '/logo1.png' },
    team2: { name: 'OG', logoUrl: '/logo2.png' },
    startTime: new Date(Date.now() + 3600000).toISOString(),
    status: 'upcoming',
    predictionTypes: [
      { type: 'first_ban_team1', options: ['Invoker', 'Pudge'], betsCount: 10, rewardPool: 1000 }
    ]
  }
];

const mockNotificationContext = {
  showToast: jest.fn()
};

describe('AdminPredictorPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'test-token');
    useErrorHandler.mockReturnValue({
      handleError: jest.fn(),
      handleSuccess: jest.fn()
    });
  });

  const renderWithContext = (contextValue = mockNotificationContext) => {
    return render(
      <NotificationContext.Provider value={contextValue}>
        <AdminPredictorPanel />
      </NotificationContext.Provider>
    );
  };

  test('renders match list', async () => {
    axios.get.mockResolvedValue({ data: mockMatches });

    renderWithContext();

    await waitFor(() => {
      expect(screen.getByText('Team Spirit vs OG')).toBeInTheDocument();
    });
  });

  test('creates new match', async () => {
    axios.get.mockResolvedValue({ data: [] });
    axios.post.mockResolvedValue({ data: { _id: 'newmatch' } });

    renderWithContext();

    await waitFor(() => {
      expect(screen.getByText('+ Создать матч')).toBeInTheDocument();
    });

    const createButton = screen.getByText('+ Создать матч');
    await userEvent.click(createButton);

    const team1Input = screen.getByPlaceholderText(/Team Spirit/i);
    const team2Input = screen.getByPlaceholderText(/OG/i);
    
    await userEvent.type(team1Input, 'Navi');
    await userEvent.type(team2Input, 'Faze');

    const startTimeInput = screen.getByLabelText(/Время начала/i);
    await userEvent.type(startTimeInput, '2024-12-31T20:00');

    const submitButton = screen.getByText('Создать матч');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/predictor/matches'),
        expect.objectContaining({
          team1: expect.objectContaining({ name: 'Navi' }),
          team2: expect.objectContaining({ name: 'Faze' })
        }),
        expect.any(Object)
      );
    });
  });

  test('uploads team logo', async () => {
    axios.get.mockResolvedValue({ data: mockMatches });
    axios.post.mockResolvedValue({ data: { logoUrl: '/new-logo.png' } });

    renderWithContext();

    await waitFor(() => {
      expect(screen.getByText('Team Spirit vs OG')).toBeInTheDocument();
    });

    const file = new File(['logo'], 'logo.png', { type: 'image/png' });
    const fileInputs = screen.getAllByLabelText(/Загрузить логотип/i);
    
    await userEvent.upload(fileInputs[0], file);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/logo'),
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data'
          })
        })
      );
    });
  });
});
