import React from 'react';
import '../../styles/Toast.css';

const Toast = ({ toast, onClose }) => {
  const { id, message, type } = toast;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-icon">{getIcon()}</div>
      <div className="toast-message">{message}</div>
      <button 
        className="toast-close" 
        onClick={() => onClose(id)}
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
