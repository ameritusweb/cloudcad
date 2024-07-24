import React from 'react';
import { useUserFeedback } from './UserFeedbackContext';

const UserFeedbackUtility = () => {
  const { feedback, clearFeedback } = useUserFeedback();

  if (!feedback.message) {
    return null;
  }

  return (
    <div className={`feedback ${feedback.type}`}>
      <span>{feedback.message}</span>
      <button onClick={clearFeedback}>X</button>
    </div>
  );
};

export default UserFeedbackUtility;