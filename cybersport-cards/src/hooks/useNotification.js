import { useNotifications } from '../context/NotificationContext';

export const useNotification = () => {
  const { showToast } = useNotifications();
  
  const showNotification = (message, type = 'info', duration = 5000) => {
    return showToast(message, type, duration);
  };

  return { showNotification };
};