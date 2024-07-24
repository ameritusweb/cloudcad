import React, { createContext, useContext, useState } from 'react';

// Create the context
const UserFeedbackContext = createContext();

// Create a provider component
export const UserFeedbackProvider = ({ children }) => {
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  const showMessage = (message) => {
    setFeedback({ message, type: 'message' });
  };

  const showError = (error) => {
    setFeedback({ message: error, type: 'error' });
  };

  const clearFeedback = () => {
    setFeedback({ message: '', type: '' });
  };

  return (
    <UserFeedbackContext.Provider value={{ feedback, showMessage, showError, clearFeedback }}>
      {children}
    </UserFeedbackContext.Provider>
  );
};

// Custom hook to use the UserFeedbackContext
export const useUserFeedback = () => {
  return useContext(UserFeedbackContext);
};

export { UserFeedbackContext };
