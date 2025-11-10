import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationBell from './NotificationBell';
import { NotificationContext } from '../../context/NotificationContext';

const mockNotifications = [
  {
    _id: 'notif1',
    type: 'match_starting',
    title: 'Матч начинается',
    message: 'Team Spirit vs OG начнется через 10 минут',
    createdAt: new Date().toISOString(),
    read: false
  },
  {
    _id: 'notif2',
    type: 'prediction_result',
    title: 'Результаты предсказания',
    message: 'Вы выиграли 500 монет!',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    read: true
  }
];

const mockNotificationContext = {
  notifications: mockNotifications,
  unreadCount: 1,
  markAsRead: jest.fn()
};

describe('NotificationBell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithContext = (contextValue = mockNotificationContext) => {
    return render(
      <NotificationContext.Provider value={contextValue}>
        <NotificationBell />
      </NotificationContext.Provider>
    );
  };

  test('displays unread count badge', () => {
    renderWithContext();

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  test('opens dropdown on click', async () => {
    renderWithContext();

    const bellButton = screen.getByRole('button', { name: /notifications/i });
    await userEvent.click(bellButton);

    expect(screen.getByText('Уведомления')).toBeInTheDocument();
    expect(screen.getByText('Матч начинается')).toBeInTheDocument();
  });

  test('marks notification as read when clicked', async () => {
    const mockMarkAsRead = jest.fn();
    renderWithContext({
      ...mockNotificationContext,
      markAsRead: mockMarkAsRead
    });

    const bellButton = screen.getByRole('button', { name: /notifications/i });
    await userEvent.click(bellButton);

    const unreadNotification = screen.getByText('Матч начинается');
    await userEvent.click(unreadNotification);

    await waitFor(() => {
      expect(mockMarkAsRead).toHaveBeenCalledWith('notif1');
    });
  });

  test('shows empty state when no notifications', () => {
    renderWithContext({
      notifications: [],
      unreadCount: 0,
      markAsRead: jest.fn()
    });

    const bellButton = screen.getByRole('button', { name: /notifications/i });
    userEvent.click(bellButton);

    waitFor(() => {
      expect(screen.getByText('Нет уведомлений')).toBeInTheDocument();
    });
  });
});
