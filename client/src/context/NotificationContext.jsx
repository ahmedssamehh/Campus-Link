import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [confirmation, setConfirmation] = useState(null);

  const showNotification = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type };
    
    setNotifications(prev => [...prev, notification]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
    
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const showSuccess = useCallback((message, duration) => {
    return showNotification(message, 'success', duration);
  }, [showNotification]);

  const showError = useCallback((message, duration) => {
    return showNotification(message, 'error', duration);
  }, [showNotification]);

  const showInfo = useCallback((message, duration) => {
    return showNotification(message, 'info', duration);
  }, [showNotification]);

  const showWarning = useCallback((message, duration) => {
    return showNotification(message, 'warning', duration);
  }, [showNotification]);

  const showConfirm = useCallback((message, onConfirm, onCancel) => {
    return new Promise((resolve) => {
      setConfirmation({
        message,
        onConfirm: () => {
          setConfirmation(null);
          if (onConfirm) onConfirm();
          resolve(true);
        },
        onCancel: () => {
          setConfirmation(null);
          if (onCancel) onCancel();
          resolve(false);
        }
      });
    });
  }, []);

  const value = {
    notifications,
    confirmation,
    showNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showConfirm,
    removeNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
