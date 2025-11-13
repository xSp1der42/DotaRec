import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MatchCard from './MatchCard';

// Mock TeamLogo component
jest.mock('../shared/TeamLogo', () => {
  return function MockTeamLogo({ teamId, teamName, size, className }) {
    return (
      <div 
        data-testid={`team-logo-${teamId}`}
        className={className}
        data-size={size}
        data-team-name={teamName}
      />
    );
  };
});

describe('MatchCard', () => {
  const mockMatch = {
    id: 'match1',
    teamA: { id: 'team1', name: 'Team Alpha' },
    teamB: { id: 'team2', name: 'Team Beta' },
    status: 'upcoming',
    matchTime: '2024-01-15T18:00:00Z',
    boFormat: 'BO3'
  };

  const mockOnPick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders team logos with correct props', () => {
    render(<MatchCard match={mockMatch} userPick={null} onPick={mockOnPick} />);
    
    const teamALogo = screen.getByTestId('team-logo-team1');
    const teamBLogo = screen.getByTestId('team-logo-team2');
    
    expect(teamALogo).toBeInTheDocument();
    expect(teamBLogo).toBeInTheDocument();
    expect(teamALogo).toHaveAttribute('data-size', 'small');
    expect(teamBLogo).toHaveAttribute('data-size', 'small');
    expect(teamALogo).toHaveClass('team-logo');
    expect(teamBLogo).toHaveClass('team-logo');
  });

  test('displays team names correctly', () => {
    render(<MatchCard match={mockMatch} userPick={null} onPick={mockOnPick} />);
    
    const teamNames = screen.getAllByText('Team Alpha');
    expect(teamNames[0]).toBeInTheDocument();
    expect(screen.getByText('Team Beta')).toBeInTheDocument();
  });

  test('shows match time and format', () => {
    render(<MatchCard match={mockMatch} userPick={null} onPick={mockOnPick} />);
    
    expect(screen.getByText('BO3')).toBeInTheDocument();
    // Match time will be formatted based on locale
    expect(screen.getByText(/15 янв/)).toBeInTheDocument();
  });

  test('allows team selection when match is upcoming', () => {
    render(<MatchCard match={mockMatch} userPick={null} onPick={mockOnPick} />);
    
    const teamAContainer = screen.getByTestId('team-logo-team1').closest('.team-container');
    const teamBContainer = screen.getByTestId('team-logo-team2').closest('.team-container');
    
    expect(teamAContainer).toHaveClass('selectable');
    expect(teamBContainer).toHaveClass('selectable');
    
    fireEvent.click(teamAContainer);
    expect(mockOnPick).toHaveBeenCalledWith('match1', 'Team Alpha');
    
    fireEvent.click(teamBContainer);
    expect(mockOnPick).toHaveBeenCalledWith('match1', 'Team Beta');
  });

  test('shows selected team when user has made a pick', () => {
    render(<MatchCard match={mockMatch} userPick="Team Alpha" onPick={mockOnPick} />);
    
    const teamAContainer = screen.getByTestId('team-logo-team1').closest('.team-container');
    const teamBContainer = screen.getByTestId('team-logo-team2').closest('.team-container');
    
    expect(teamAContainer).toHaveClass('selected');
    expect(teamBContainer).not.toHaveClass('selected');
    expect(screen.getByText('Вы выбрали: Team Alpha')).toBeInTheDocument();
  });

  test('disables selection when match is finished', () => {
    const finishedMatch = {
      ...mockMatch,
      status: 'finished',
      teamA: { ...mockMatch.teamA, score: 2 },
      teamB: { ...mockMatch.teamB, score: 1 },
      winner: 'Team Alpha'
    };

    render(<MatchCard match={finishedMatch} userPick="Team Alpha" onPick={mockOnPick} />);
    
    const teamAContainer = screen.getByTestId('team-logo-team1').closest('.team-container');
    const teamBContainer = screen.getByTestId('team-logo-team2').closest('.team-container');
    
    expect(teamAContainer).not.toHaveClass('selectable');
    expect(teamBContainer).not.toHaveClass('selectable');
    
    fireEvent.click(teamAContainer);
    expect(mockOnPick).not.toHaveBeenCalled();
  });

  test('shows correct prediction result for finished match', () => {
    const finishedMatch = {
      ...mockMatch,
      status: 'finished',
      teamA: { ...mockMatch.teamA, score: 2 },
      teamB: { ...mockMatch.teamB, score: 1 },
      winner: 'Team Alpha'
    };

    // Test correct prediction
    const { rerender } = render(
      <MatchCard match={finishedMatch} userPick="Team Alpha" onPick={mockOnPick} />
    );
    
    expect(screen.getByText('Ваш прогноз верен!')).toBeInTheDocument();
    expect(screen.getByText('2:1')).toBeInTheDocument();
    
    // Test incorrect prediction
    rerender(<MatchCard match={finishedMatch} userPick="Team Beta" onPick={mockOnPick} />);
    expect(screen.getByText('Ваш прогноз не сбылся')).toBeInTheDocument();
  });

  test('shows map results for finished matches', () => {
    const finishedMatchWithMaps = {
      ...mockMatch,
      status: 'finished',
      teamA: { ...mockMatch.teamA, score: 2 },
      teamB: { ...mockMatch.teamB, score: 1 },
      winner: 'Team Alpha',
      maps: [
        { name: 'Dust2', teamAScore: 16, teamBScore: 14 },
        { name: 'Mirage', teamAScore: 16, teamBScore: 12 },
        { name: 'Inferno', teamAScore: 14, teamBScore: 16 }
      ]
    };

    render(<MatchCard match={finishedMatchWithMaps} userPick="Team Alpha" onPick={mockOnPick} />);
    
    expect(screen.getByText('Dust2')).toBeInTheDocument();
    expect(screen.getByText('16 - 14')).toBeInTheDocument();
    expect(screen.getByText('Mirage')).toBeInTheDocument();
    expect(screen.getByText('16 - 12')).toBeInTheDocument();
    expect(screen.getByText('Inferno')).toBeInTheDocument();
    expect(screen.getByText('14 - 16')).toBeInTheDocument();
  });

  test('applies correct CSS classes for prediction results', () => {
    const finishedMatch = {
      ...mockMatch,
      status: 'finished',
      teamA: { ...mockMatch.teamA, score: 2 },
      teamB: { ...mockMatch.teamB, score: 1 },
      winner: 'Team Alpha'
    };

    // Test correct prediction styling
    const { rerender } = render(
      <MatchCard match={finishedMatch} userPick="Team Alpha" onPick={mockOnPick} />
    );
    
    const matchCard = screen.getByTestId('team-logo-team1').closest('.match-card');
    const footer = screen.getByText('Ваш прогноз верен!').closest('.match-footer');
    
    expect(matchCard).toHaveClass('picked-correct');
    expect(footer).toHaveClass('correct');
    
    // Test incorrect prediction styling
    rerender(<MatchCard match={finishedMatch} userPick="Team Beta" onPick={mockOnPick} />);
    
    const incorrectFooter = screen.getByText('Ваш прогноз не сбылся').closest('.match-footer');
    expect(matchCard).toHaveClass('picked-incorrect');
    expect(incorrectFooter).toHaveClass('incorrect');
  });
});