// src/hooks/useNotification.js

import { useState, useCallback } from 'react';

let idCounter = 0;

export const useNotification = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((type, message) => {
    const id = idCounter++;
    setNotifications((prevNotifications) => [
      ...prevNotifications,
      { id, type, message },
    ]);

    setTimeout(() => {
      setNotifications((prevNotifications) =>
        prevNotifications.filter((notification) => notification.id !== id)
      );
    }, 5000);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prevNotifications) =>
      prevNotifications.filter((notification) => notification.id !== id)
    );
  }, []);

  return { notifications, addNotification, removeNotification };
};
