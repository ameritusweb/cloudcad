import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

export const Notification = ({ notifications }) => {
  // Create a Map to store refs for each notification
  const nodeRef = useRef(new Map());

  return (
    <div className="fixed top-5 right-5 z-50 space-y-4">
      <TransitionGroup>
        {notifications.map(({ id, type, message }) => {
          // Create a new ref if it doesn't exist for this notification
          if (!nodeRef.current.has(id)) {
            nodeRef.current.set(id, React.createRef());
          }
          return (
            <CSSTransition
              key={id}
              nodeRef={nodeRef.current.get(id)}
              timeout={500}
              classNames="notification"
            >
              <div
                ref={nodeRef.current.get(id)}
                className={`notification p-4 rounded shadow-md transition-transform transform ${
                  type === 'info'
                    ? 'bg-blue-500 text-white'
                    : type === 'warning'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-red-500 text-white'
                }`}
              >
                {message}
              </div>
            </CSSTransition>
          );
        })}
      </TransitionGroup>
    </div>
  );
};

Notification.propTypes = {
  notifications: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      type: PropTypes.oneOf(['info', 'warning', 'error']).isRequired,
      message: PropTypes.string.isRequired,
    })
  ).isRequired,
};