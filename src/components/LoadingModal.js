import React from 'react';
import { useApp } from '../context/AppContext';

const LoadingModal = () => {
  const { state } = useApp();
  const { loading } = state;

  if (!loading) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="loading-spinner"></div>
        <h3>Processing...</h3>
        <p>Please wait while we process your request.</p>
      </div>
    </div>
  );
};

export default LoadingModal;