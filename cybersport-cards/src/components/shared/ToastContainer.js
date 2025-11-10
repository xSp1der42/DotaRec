import React from 'react';
import Toast from './Toast';
import { useNotifications } from '../../context/NotificationContext';
import '../../styles/Toast.css';

const ToastContainer = () => {
  const { toasts, removeToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;
