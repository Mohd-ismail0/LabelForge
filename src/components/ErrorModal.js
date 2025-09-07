import React from 'react';
import { useApp } from '../context/AppContext';

const ErrorModal = () => {
  const { state, actions } = useApp();
  const { error } = state;

  const closeErrorModal = () => {
    actions.setError(null);
  };

  if (!error) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="error-icon">⚠️</div>
        <h3>Error</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={closeErrorModal}>
          OK
        </button>
      </div>
    </div>
  );
};

export default ErrorModal;