import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PickemPage from './PickemPage';
import LogoService from '../../services/logoService';

// Mock the LogoService
jest.mock('../../services/logoService');

// Mock EventCard component
jest.mock('./EventCard', () => {
  return function MockEventCard({ event, userPicks, onPick }) {
    return (
      <div data-testid={`event-${event.id}`}>
        <h3>{event.title}</h3>
        {event.matches?.map(match => (
          <div key={match.id} data-testid={`match-${match.id}`}>
            <span>{match.teamA?.name} vs {match.teamB?.name}</span>
          </div>
        ))}
      </div>
    );
  };
});

describe('PickemPage', () => {
  const mockEvents = [
    {
      id: 'event1',
      title: 'Test Tournament',
      matches: [
        {
          id: 'match1',
          teamA: { id: 'team1', name: 'Team Alpha' },
          teamB: { id: 'team2', name: 'Team Beta' },
          status: 'upcoming'
        },
        {
          id: 'match2',
          teamA: { id: 'team3', name: 'Team Gamma' },
          teamB: { id: 'team1', name: 'Team Alpha' },
          status: 'upcoming'
        }
      ]
    }
  ];

  const mockUserPicks = {
    event1: {
      match1: 'Team Alpha'
    }
  };

  const mockOnPick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    LogoService.preloadLogos = jest.fn().mockResolvedValue();
  });

  test('renders page title', () => {
    render(<PickemPage events={[]} userPicks={{}} onPick={mockOnPick} />);
    expect(screen.getByText("Pick'em Прогнозы")).toBeInTheDocument();
  });

  test('shows message when no events available', () => {
    render(<PickemPage events={[]} userPicks={{}} onPick={mockOnPick} />);
    expect(screen.getByText('Активных событий для прогнозов пока нет.')).toBeInTheDocument();
  });

  test('renders events when available', () => {
    render(<PickemPage events={mockEvents} userPicks={mockUserPicks} onPick={mockOnPick} />);
    
    expect(screen.getByTestId('event-event1')).toBeInTheDocument();
    expect(screen.getByText('Test Tournament')).toBeInTheDocument();
  });

  test('preloads team logos on mount', async () => {
    render(<PickemPage events={mockEvents} userPicks={mockUserPicks} onPick={mockOnPick} />);
    
    await waitFor(() => {
      expect(LogoService.preloadLogos).toHaveBeenCalledWith(['team1', 'team2', 'team3']);
    });
  });

  test('handles logo preloading errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    LogoService.preloadLogos.mockRejectedValue(new Error('Network error'));
    
    render(<PickemPage events={mockEvents} userPicks={mockUserPicks} onPick={mockOnPick} />);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to preload some team logos:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });

  test('does not preload logos when no events', async () => {
    render(<PickemPage events={[]} userPicks={{}} onPick={mockOnPick} />);
    
    // Wait a bit to ensure useEffect has run
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(LogoService.preloadLogos).not.toHaveBeenCalled();
  });

  test('preloads logos when events change', async () => {
    const { rerender } = render(<PickemPage events={[]} userPicks={{}} onPick={mockOnPick} />);
    
    expect(LogoService.preloadLogos).not.toHaveBeenCalled();
    
    rerender(<PickemPage events={mockEvents} userPicks={mockUserPicks} onPick={mockOnPick} />);
    
    await waitFor(() => {
      expect(LogoService.preloadLogos).toHaveBeenCalledWith(['team1', 'team2', 'team3']);
    });
  });
});