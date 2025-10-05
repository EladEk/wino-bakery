import React, { useEffect } from 'react';
import { useDirection } from '../../contexts/DirectionContext';
import { useTheme } from '../../contexts/ThemeContext';
import './Toast.css';

const Toast = ({ toast, onRemove }) => {
  const { isRTL } = useDirection();
  const { isDark } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const getIcon = () => {
    switch (toast.type) {
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
    <div 
      className={`toast toast--${toast.type} ${isDark ? 'toast--dark' : ''}`}
      dir={isRTL ? 'rtl' : 'ltr'}
      role="alert"
      aria-live="polite"
    >
      <div className="toast__icon">
        {getIcon()}
      </div>
      <div className="toast__content">
        {toast.message}
      </div>
      <button 
        className="toast__close"
        onClick={() => onRemove(toast.id)}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
