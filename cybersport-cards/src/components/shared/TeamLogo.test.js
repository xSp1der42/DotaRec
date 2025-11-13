import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TeamLogo from './TeamLogo';
import logoService from '../../services/logoService';

// Mock the logoService
jest.mock('../../services/logoService');

describe('TeamLogo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering states', () => {
    test('renders loading state initially', () => {
      logoService.getTeamLogo.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<TeamLogo teamId="team123" teamName="Test Team" />);
      
      expect(document.querySelector('.team-logo--loading')).toBeInTheDocument();
      expect(document.querySelector('.team-logo__spinner')).toBeInTheDocument();
    });

    test('renders logo image when available', async () => {
      logoService.getTeamLogo.mockResolvedValue('/uploads/logos/team-123-64.png');
      
      render(<TeamLogo teamId="team123" teamName="Test Team" />);
      
      await waitFor(() => {
        const image = screen.getByAltText('Test Team logo');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', '/uploads/logos/team-123-64.png');
      });
    });

    test('renders fallback text when logo not available', async () => {
      logoService.getTeamLogo.mockResolvedValue(null);
      
      render(<TeamLogo teamId="team123" teamName="Test Team" />);
      
      await waitFor(() => {
        expect(screen.getByText('TT')).toBeInTheDocument(); // Initials
        expect(document.querySelector('.team-logo__fallback')).toBeInTheDocument();
      });
    });

    test('renders empty state when no fallback and no logo', async () => {
      logoService.getTeamLogo.mockResolvedValue(null);
      
      render(<TeamLogo teamId="team123" teamName="Test Team" showFallback={false} />);
      
      await waitFor(() => {
        expect(screen.getByText('?')).toBeInTheDocument();
        expect(document.querySelector('.team-logo__empty')).toBeInTheDocument();
      });
    });

    test('renders error state when no teamId provided', async () => {
      render(<TeamLogo teamName="Test Team" />);
      
      await waitFor(() => {
        expect(document.querySelector('.team-logo--error')).toBeInTheDocument();
      });
    });
  });

  describe('size variants', () => {
    test('applies correct size classes', async () => {
      logoService.getTeamLogo.mockResolvedValue(null);
      
      const { rerender } = render(<TeamLogo teamId="team123" teamName="Test Team" size="small" />);
      await waitFor(() => {
        expect(document.querySelector('.team-logo--small')).toBeInTheDocument();
      });

      rerender(<TeamLogo teamId="team123" teamName="Test Team" size="medium" />);
      await waitFor(() => {
        expect(document.querySelector('.team-logo--medium')).toBeInTheDocument();
      });

      rerender(<TeamLogo teamId="team123" teamName="Test Team" size="large" />);
      await waitFor(() => {
        expect(document.querySelector('.team-logo--large')).toBeInTheDocument();
      });
    });

    test('uses medium size as default', async () => {
      logoService.getTeamLogo.mockResolvedValue(null);
      
      render(<TeamLogo teamId="team123" teamName="Test Team" />);
      
      expect(logoService.getTeamLogo).toHaveBeenCalledWith('team123', 'medium');
      
      await waitFor(() => {
        expect(document.querySelector('.team-logo--medium')).toBeInTheDocument();
      });
    });
  });

  describe('fallback behavior', () => {
    test('generates correct initials from team name', async () => {
      logoService.getTeamLogo.mockResolvedValue(null);
      
      const { rerender } = render(<TeamLogo teamId="team123" teamName="Team Liquid" />);
      await waitFor(() => {
        expect(screen.getByText('TL')).toBeInTheDocument();
      });

      rerender(<TeamLogo teamId="team123" teamName="Natus Vincere" />);
      await waitFor(() => {
        expect(screen.getByText('NV')).toBeInTheDocument();
      });

      rerender(<TeamLogo teamId="team123" teamName="Fnatic" />);
      await waitFor(() => {
        expect(screen.getByText('F')).toBeInTheDocument();
      });
    });

    test('limits initials to 3 characters', async () => {
      logoService.getTeamLogo.mockResolvedValue(null);
      
      render(<TeamLogo teamId="team123" teamName="Very Long Team Name Here" />);
      
      await waitFor(() => {
        const initials = screen.getByText('VLT');
        expect(initials).toBeInTheDocument();
      });
    });

    test('respects showFallback prop', async () => {
      logoService.getTeamLogo.mockResolvedValue(null);
      
      render(<TeamLogo teamId="team123" teamName="Test Team" showFallback={false} />);
      
      await waitFor(() => {
        expect(screen.queryByText('TT')).not.toBeInTheDocument();
        expect(screen.getByText('?')).toBeInTheDocument();
      });
    });
  });

  describe('tooltip functionality', () => {
    test('shows tooltip on hover when team name provided', async () => {
      logoService.getTeamLogo.mockResolvedValue('/uploads/logos/team-123-64.png');
      
      render(<TeamLogo teamId="team123" teamName="Test Team" />);
      
      await waitFor(() => {
        const logoContainer = document.querySelector('.team-logo');
        fireEvent.mouseEnter(logoContainer);
        
        expect(screen.getByText('Test Team')).toBeInTheDocument();
        expect(document.querySelector('.team-logo__tooltip')).toBeInTheDocument();
      });
    });

    test('hides tooltip on mouse leave', async () => {
      logoService.getTeamLogo.mockResolvedValue('/uploads/logos/team-123-64.png');
      
      render(<TeamLogo teamId="team123" teamName="Test Team" />);
      
      await waitFor(() => {
        const logoContainer = document.querySelector('.team-logo');
        fireEvent.mouseEnter(logoContainer);
        expect(document.querySelector('.team-logo__tooltip')).toBeInTheDocument();
        
        fireEvent.mouseLeave(logoContainer);
        expect(document.querySelector('.team-logo__tooltip')).not.toBeInTheDocument();
      });
    });
  });

  describe('click handling', () => {
    test('calls onClick handler when provided', async () => {
      const mockOnClick = jest.fn();
      logoService.getTeamLogo.mockResolvedValue('/uploads/logos/team-123-64.png');
      
      render(<TeamLogo teamId="team123" teamName="Test Team" onClick={mockOnClick} />);
      
      await waitFor(() => {
        const logoContainer = document.querySelector('.team-logo');
        expect(logoContainer).toHaveClass('team-logo--clickable');
        
        fireEvent.click(logoContainer);
        expect(mockOnClick).toHaveBeenCalledWith(
          expect.any(Object),
          {
            teamId: 'team123',
            teamName: 'Test Team',
            logoUrl: '/uploads/logos/team-123-64.png'
          }
        );
      });
    });

    test('adds clickable class when onClick provided', async () => {
      const mockOnClick = jest.fn();
      logoService.getTeamLogo.mockResolvedValue(null);
      
      render(<TeamLogo teamId="team123" teamName="Test Team" onClick={mockOnClick} />);
      
      await waitFor(() => {
        expect(document.querySelector('.team-logo--clickable')).toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    test('handles image load errors', async () => {
      logoService.getTeamLogo.mockResolvedValue('/uploads/logos/team-123-64.png');
      
      render(<TeamLogo teamId="team123" teamName="Test Team" />);
      
      await waitFor(() => {
        const image = screen.getByAltText('Test Team logo');
        fireEvent.error(image);
        
        // Should fall back to text after image error
        expect(screen.getByText('TT')).toBeInTheDocument();
      });
    });

    test('handles logoService errors gracefully', async () => {
      logoService.getTeamLogo.mockRejectedValue(new Error('Service error'));
      
      render(<TeamLogo teamId="team123" teamName="Test Team" />);
      
      await waitFor(() => {
        // Should show fallback when service fails
        expect(screen.getByText('TT')).toBeInTheDocument();
      });
    });
  });

  describe('custom props', () => {
    test('applies custom className', async () => {
      logoService.getTeamLogo.mockResolvedValue(null);
      
      render(<TeamLogo teamId="team123" teamName="Test Team" className="custom-class" />);
      
      await waitFor(() => {
        expect(document.querySelector('.custom-class')).toBeInTheDocument();
      });
    });

    test('applies custom style', async () => {
      logoService.getTeamLogo.mockResolvedValue(null);
      
      render(<TeamLogo teamId="team123" teamName="Test Team" style={{ border: '2px solid red' }} />);
      
      await waitFor(() => {
        const logoContainer = document.querySelector('.team-logo');
        expect(logoContainer).toHaveStyle('border: 2px solid red');
      });
    });

    test('uses custom alt text', async () => {
      logoService.getTeamLogo.mockResolvedValue('/uploads/logos/team-123-64.png');
      
      render(<TeamLogo teamId="team123" teamName="Test Team" alt="Custom alt text" />);
      
      await waitFor(() => {
        const image = screen.getByAltText('Custom alt text');
        expect(image).toBeInTheDocument();
      });
    });
  });

  describe('component lifecycle', () => {
    test('cleans up properly on unmount', async () => {
      logoService.getTeamLogo.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve('/uploads/logos/team-123-64.png'), 100);
      }));
      
      const { unmount } = render(<TeamLogo teamId="team123" teamName="Test Team" />);
      
      // Unmount before promise resolves
      unmount();
      
      // Should not cause any errors or state updates
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    test('updates when teamId changes', async () => {
      logoService.getTeamLogo.mockResolvedValue('/uploads/logos/team-64.png');
      
      const { rerender } = render(<TeamLogo teamId="team123" teamName="Test Team" />);
      
      await waitFor(() => {
        expect(logoService.getTeamLogo).toHaveBeenCalledWith('team123', 'medium');
      });
      
      rerender(<TeamLogo teamId="team456" teamName="Test Team" />);
      
      await waitFor(() => {
        expect(logoService.getTeamLogo).toHaveBeenCalledWith('team456', 'medium');
      });
    });
  });
});