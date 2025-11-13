import { render, screen, waitFor } from '@testing-library/react';
import AdminTeamsPage from './AdminTeamsPage';
import api from '../../services/api';

// Mock the API and AdminLogoUpload component
jest.mock('../../services/api');
jest.mock('./AdminLogoUpload', () => {
  return function MockAdminLogoUpload({ teamName, currentLogo }) {
    return (
      <div data-testid={`logo-upload-${teamName}`}>
        <span>Logo Upload for {teamName}</span>
        {currentLogo && <span>Has Logo</span>}
      </div>
    );
  };
});

jest.mock('../../hooks/useNotification', () => ({
  useNotification: () => ({
    showNotification: jest.fn()
  })
}));

const mockTeams = [
  {
    _id: 'team1',
    name: 'Team Spirit',
    logo: {
      originalUrl: '/uploads/logos/team1-original.png',
      sizes: {
        small: '/uploads/logos/team1-32.png',
        medium: '/uploads/logos/team1-64.png',
        large: '/uploads/logos/team1-128.png'
      }
    }
  },
  {
    _id: 'team2',
    name: 'OG',
    logo: null
  },
  {
    _id: 'team3',
    name: 'Navi',
    logo: {
      originalUrl: '/uploads/logos/team3-original.png',
      sizes: {
        small: '/uploads/logos/team3-32.png',
        medium: '/uploads/logos/team3-64.png',
        large: '/uploads/logos/team3-128.png'
      }
    }
  }
];

describe('AdminTeamsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    api.get.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<AdminTeamsPage />);
    
    expect(screen.getByText('Загрузка команд...')).toBeInTheDocument();
  });

  test('renders teams list after loading', async () => {
    api.get.mockResolvedValue({ data: { teams: mockTeams } });
    
    render(<AdminTeamsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Team Spirit')).toBeInTheDocument();
      expect(screen.getByText('OG')).toBeInTheDocument();
      expect(screen.getByText('Navi')).toBeInTheDocument();
    });

    // Check stats
    expect(screen.getByText('Всего команд:')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('С логотипами:')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Без логотипов:')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  test('renders search input', async () => {
    api.get.mockResolvedValue({ data: { teams: mockTeams } });
    
    render(<AdminTeamsPage />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Поиск команд...')).toBeInTheDocument();
    });
  });

  test('renders bulk controls', async () => {
    api.get.mockResolvedValue({ data: { teams: mockTeams } });
    
    render(<AdminTeamsPage />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Выбрать все/)).toBeInTheDocument();
    });
  });

  test('renders team cards with logo upload components', async () => {
    api.get.mockResolvedValue({ data: { teams: mockTeams } });
    
    render(<AdminTeamsPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('logo-upload-Team Spirit')).toBeInTheDocument();
      expect(screen.getByTestId('logo-upload-OG')).toBeInTheDocument();
      expect(screen.getByTestId('logo-upload-Navi')).toBeInTheDocument();
    });
  });

  test('shows no teams message when list is empty', async () => {
    api.get.mockResolvedValue({ data: { teams: [] } });
    
    render(<AdminTeamsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Нет команд для отображения')).toBeInTheDocument();
    });
  });

  test('displays team IDs in team cards', async () => {
    api.get.mockResolvedValue({ data: { teams: mockTeams } });
    
    render(<AdminTeamsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('ID: team1')).toBeInTheDocument();
      expect(screen.getByText('ID: team2')).toBeInTheDocument();
      expect(screen.getByText('ID: team3')).toBeInTheDocument();
    });
  });

  test('displays pagination info', async () => {
    api.get.mockResolvedValue({ data: { teams: mockTeams } });
    
    render(<AdminTeamsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Показано команд: 3 из 3')).toBeInTheDocument();
    });
  });

  test('renders page header with title', async () => {
    api.get.mockResolvedValue({ data: { teams: mockTeams } });
    
    render(<AdminTeamsPage />);
    
    expect(screen.getByText('Управление логотипами команд')).toBeInTheDocument();
  });

  test('renders team checkboxes', async () => {
    api.get.mockResolvedValue({ data: { teams: mockTeams } });
    
    render(<AdminTeamsPage />);
    
    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      // Should have select all checkbox + 3 team checkboxes
      expect(checkboxes).toHaveLength(4);
    });
  });
});